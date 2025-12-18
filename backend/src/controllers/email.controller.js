const { sendComposedEmail } = require('../utils/emailService');
const { Email } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

/**
 * Send a composed email
 * POST /api/email/send
 */
const sendEmail = async (req, res) => {
  try {
    const { to, subject, message, parentId } = req.body;

    // Validation
    if (!to || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'To, subject, and message are required',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const toEmails = to.split(',').map(e => e.trim());
    
    for (const email of toEmails) {
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: `Invalid email address: ${email}`,
        });
      }
    }

    const result = await sendComposedEmail({
      to: toEmails.join(', '),
      subject,
      message,
    });

    // Save email to database
    const savedEmail = await Email.create({
      organization_id: req.user.organization_id,
      user_id: req.user.id,
      to_email: toEmails.join(', '),
      subject,
      message,
      type: parentId ? 'reply' : 'sent',
      is_bulk: toEmails.length > 1,
      parent_id: parentId || null,
      message_id: result.messageId,
      status: 'sent',
    });

    const userId = req.user?.id || 'unknown';
    logger.info(`Email sent by user ${userId} to ${to}`);

    res.json({
      success: true,
      message: 'Email sent successfully',
      data: {
        id: savedEmail.id,
        messageId: result.messageId,
        accepted: result.accepted,
      },
    });
  } catch (error) {
    logger.error('Send email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message,
    });
  }
};

/**
 * Get all sent emails with enhanced threading support
 * GET /api/email
 */
const getEmails = async (req, res) => {
  try {
    const { page = 1, limit = 100, type = 'all', contact_email } = req.query;
    const offset = (page - 1) * limit;

    const where = {
      [Op.or]: [
        { organization_id: req.user.organization_id }, // Sent by this org
        { organization_id: null } // Received emails not yet assigned
      ],
      parent_id: null, // Only get top-level emails, not replies
    };

    // Filter by type
    if (type && type !== 'all') {
      where.type = type;
    }

    // Filter by contact email
    if (contact_email) {
      where[Op.or] = [
        { to_email: { [Op.like]: `%${contact_email}%` } },
        { from_email: { [Op.like]: `%${contact_email}%` } }
      ];
    }

    const { rows: emails, count } = await Email.findAndCountAll({
      where,
      include: [
        {
          model: Email,
          as: 'replies',
          separate: true,
          order: [['created_at', 'ASC']],
        },
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      emails,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    logger.error('Get emails error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch emails',
      error: error.message,
    });
  }
};

/**
 * Get single email with replies
 * GET /api/email/:id
 */
const getEmailById = async (req, res) => {
  try {
    const { id } = req.params;

    const email = await Email.findOne({
      where: {
        id,
        [Op.or]: [
          { organization_id: req.user.organization_id }, // Sent by this org
          { organization_id: null }, // Received emails
        ],
      },
      include: [
        {
          model: Email,
          as: 'replies',
          separate: true,
          order: [['created_at', 'ASC']],
        },
      ],
    });

    if (!email) {
      return res.status(404).json({
        success: false,
        message: 'Email not found',
      });
    }

    // Mark as read
    if (!email.read_at) {
      await email.update({ read_at: new Date(), status: 'read' });
    }

    res.json({
      success: true,
      email,
    });
  } catch (error) {
    logger.error('Get email by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch email',
      error: error.message,
    });
  }
};

/**
 * Delete an email
 * DELETE /api/email/:id
 */
const deleteEmail = async (req, res) => {
  try {
    const { id } = req.params;

    const email = await Email.findOne({
      where: {
        id,
        [Op.or]: [
          { organization_id: req.user.organization_id }, // Sent by this org
          { organization_id: null }, // Received emails
        ],
      },
    });

    if (!email) {
      return res.status(404).json({
        success: false,
        message: 'Email not found',
      });
    }

    // Delete all replies first
    await Email.destroy({
      where: { parent_id: id },
    });

    await email.destroy();

    res.json({
      success: true,
      message: 'Email deleted successfully',
    });
  } catch (error) {
    logger.error('Delete email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete email',
      error: error.message,
    });
  }
};

/**
 * Reply to an email
 * POST /api/email/:id/reply
 */
const replyToEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    // Find original email
    const originalEmail = await Email.findOne({
      where: {
        id,
        [Op.or]: [
          { organization_id: req.user.organization_id }, // Sent by this org
          { organization_id: null }, // Received emails
        ],
      },
    });

    if (!originalEmail) {
      return res.status(404).json({
        success: false,
        message: 'Email not found',
      });
    }

    // Determine reply recipient - if it's a received email, reply to from_email, otherwise to_email
    const replyTo = originalEmail.type === 'received' ? originalEmail.from_email : originalEmail.to_email;
    
    if (!replyTo) {
      return res.status(400).json({
        success: false,
        message: 'Cannot determine reply recipient',
      });
    }

    // Send reply with proper threading
    const result = await sendComposedEmail({
      to: replyTo,
      subject: `Re: ${originalEmail.subject}`,
      message,
      original: {
        messageId: originalEmail.message_id,
        references: originalEmail.references,
      },
    });

    // Save reply to database
    const reply = await Email.create({
      organization_id: req.user.organization_id,
      user_id: req.user.id,
      to_email: replyTo,
      subject: `Re: ${originalEmail.subject}`,
      message,
      type: 'reply',
      is_bulk: false,
      parent_id: originalEmail.parent_id || originalEmail.id,
      message_id: result.messageId,
      status: 'sent',
    });

    logger.info(`Reply sent by user ${req.user.id} to ${originalEmail.to_email}`);

    res.json({
      success: true,
      message: 'Reply sent successfully',
      data: {
        id: reply.id,
        messageId: result.messageId,
      },
    });
  } catch (error) {
    logger.error('Reply email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reply',
      error: error.message,
    });
  }
};

/**
 * Reply to all recipients of a bulk email
 * POST /api/email/:id/reply-all
 */
const replyToAll = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    // Find original email
    const originalEmail = await Email.findOne({
      where: {
        id,
        [Op.or]: [
          { organization_id: req.user.organization_id }, // Sent by this org
          { organization_id: null }, // Received emails
        ],
      },
    });

    if (!originalEmail) {
      return res.status(404).json({
        success: false,
        message: 'Email not found',
      });
    }

    // Send reply to all with proper threading
    const result = await sendComposedEmail({
      to: originalEmail.to_email,
      subject: `Re: ${originalEmail.subject}`,
      message,
      original: {
        messageId: originalEmail.message_id,
        references: originalEmail.references,
      },
    });

    // Save reply to database
    const reply = await Email.create({
      organization_id: req.user.organization_id,
      user_id: req.user.id,
      to_email: originalEmail.to_email,
      subject: `Re: ${originalEmail.subject}`,
      message,
      type: 'reply',
      is_bulk: true,
      parent_id: originalEmail.parent_id || originalEmail.id,
      message_id: result.messageId,
      status: 'sent',
    });

    logger.info(`Reply all sent by user ${req.user.id} to ${originalEmail.to_email}`);

    res.json({
      success: true,
      message: 'Reply sent to all recipients successfully',
      data: {
        id: reply.id,
        messageId: result.messageId,
      },
    });
  } catch (error) {
    logger.error('Reply all email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reply to all',
      error: error.message,
    });
  }
};

/**
 * Get emails grouped by contact for conversation view
 * GET /api/email/by-contact
 */
const getEmailsByContact = async (req, res) => {
  try {
    const emails = await Email.findAll({
      where: {
        [Op.or]: [
          { organization_id: req.user.organization_id },
          { organization_id: null }
        ],
        parent_id: null,
      },
      include: [
        {
          model: Email,
          as: 'replies',
          separate: true,
          order: [['created_at', 'ASC']],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    // Group emails by contact email
    const grouped = {};
    emails.forEach(email => {
      const contactEmail = email.type === 'received' ? email.from_email : email.to_email;
      if (!contactEmail) return;

      const key = contactEmail.toLowerCase().trim();
      if (!grouped[key]) {
        grouped[key] = {
          contact_email: contactEmail,
          emails: [],
          unread_count: 0,
          last_email_date: null,
        };
      }

      grouped[key].emails.push(email);
      if (!email.read_at) grouped[key].unread_count++;
      
      const emailDate = new Date(email.created_at);
      if (!grouped[key].last_email_date || emailDate > grouped[key].last_email_date) {
        grouped[key].last_email_date = emailDate;
      }
    });

    const conversations = Object.values(grouped).map(conv => ({
      ...conv,
      email_count: conv.emails.length,
      last_email: conv.emails[0], // Already sorted by date DESC
    }));

    // Sort by last email date
    conversations.sort((a, b) => b.last_email_date - a.last_email_date);

    res.json({
      success: true,
      conversations,
      total: conversations.length,
    });
  } catch (error) {
    logger.error('Get emails by contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch emails by contact',
      error: error.message,
    });
  }
};

module.exports = {
  sendEmail,
  getEmails,
  getEmailsByContact,
  getEmailById,
  deleteEmail,
  replyToEmail,
  replyToAll,
};
