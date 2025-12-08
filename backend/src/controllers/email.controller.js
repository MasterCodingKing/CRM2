const { sendComposedEmail } = require('../utils/emailService');
const logger = require('../utils/logger');

/**
 * Send a composed email
 * POST /api/email/send
 */
const sendEmail = async (req, res) => {
  try {
    const { to, subject, message } = req.body;

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

    const userId = req.user?.id || 'unknown';
    logger.info(`Email sent by user ${userId} to ${to}`);

    res.json({
      success: true,
      message: 'Email sent successfully',
      data: {
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

module.exports = {
  sendEmail,
};
