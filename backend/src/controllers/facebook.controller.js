const { FacebookPage, FacebookMessage, FacebookLead, SocialMediaAccount, Contact, Deal, Organization } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const facebookService = require('../services/facebook.service');

/**
 * =====================
 * FACEBOOK PAGES MANAGEMENT
 * =====================
 */

/**
 * Get all connected Facebook Pages
 * GET /api/facebook/pages
 */
const getPages = async (req, res) => {
  try {
    const pages = await FacebookPage.findAll({
      where: { organization_id: req.tenancy.organization_id },
      include: [{
        model: SocialMediaAccount,
        attributes: ['id', 'platform', 'account_name']
      }],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      pages
    });
  } catch (error) {
    logger.error('Get Facebook pages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pages',
      error: error.message
    });
  }
};

/**
 * Connect a Facebook Page
 * POST /api/facebook/pages/connect
 */
const connectPage = async (req, res) => {
  try {
    const { socialAccountId, pageId } = req.body;

    // Get the social media account
    const socialAccount = await SocialMediaAccount.findOne({
      where: { 
        id: socialAccountId, 
        organization_id: req.tenancy.organization_id 
      }
    });

    if (!socialAccount) {
      return res.status(404).json({
        success: false,
        message: 'Social media account not found'
      });
    }

    // Parse account data to find the page
    const accountData = JSON.parse(socialAccount.account_data || '{}');
    const pageData = accountData.pages?.find(p => p.id === pageId);

    if (!pageData) {
      return res.status(404).json({
        success: false,
        message: 'Page not found in account data'
      });
    }

    // Check if page already connected
    const existingPage = await FacebookPage.findOne({
      where: { facebook_page_id: pageId }
    });

    if (existingPage) {
      return res.status(400).json({
        success: false,
        message: 'Page already connected'
      });
    }

    // Get full page details from Facebook
    const pageDetails = await facebookService.getPageDetails(pageId, pageData.access_token);

    // Create Facebook Page record
    const fbPage = await FacebookPage.create({
      organization_id: req.tenancy.organization_id,
      social_account_id: socialAccountId,
      facebook_page_id: pageId,
      page_name: pageDetails.name,
      page_access_token: pageData.access_token,
      category: pageDetails.category,
      about: pageDetails.about,
      fan_count: pageDetails.fan_count || 0,
      picture_url: pageDetails.picture?.data?.url,
      cover_url: pageDetails.cover?.source,
      website: pageDetails.website,
      phone: pageDetails.phone,
      email: pageDetails.emails?.[0],
      instagram_business_account_id: pageDetails.instagram_business_account?.id,
      last_synced_at: new Date()
    });

    // Subscribe to webhooks
    try {
      await facebookService.subscribePageWebhooks(pageId, pageData.access_token);
      fbPage.is_webhooks_subscribed = true;
      await fbPage.save();
    } catch (webhookError) {
      logger.warn('Failed to subscribe to webhooks:', webhookError.message);
    }

    logger.info(`Facebook page connected for org ${req.tenancy.organization_id}`);

    res.json({
      success: true,
      message: 'Page connected successfully',
      page: fbPage
    });
  } catch (error) {
    logger.error('Connect Facebook page error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to connect page',
      error: error.message
    });
  }
};

/**
 * Sync page data from Facebook
 * POST /api/facebook/pages/:id/sync
 */
const syncPage = async (req, res) => {
  try {
    const { id } = req.params;

    const page = await FacebookPage.findOne({
      where: { 
        id, 
        organization_id: req.tenancy.organization_id 
      }
    });

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }

    // Get updated page details
    const pageDetails = await facebookService.getPageDetails(
      page.facebook_page_id,
      page.page_access_token
    );

    // Update page record
    await page.update({
      page_name: pageDetails.name,
      category: pageDetails.category,
      about: pageDetails.about,
      fan_count: pageDetails.fan_count || 0,
      picture_url: pageDetails.picture?.data?.url,
      cover_url: pageDetails.cover?.source,
      website: pageDetails.website,
      phone: pageDetails.phone,
      email: pageDetails.emails?.[0],
      instagram_business_account_id: pageDetails.instagram_business_account?.id,
      last_synced_at: new Date()
    });

    res.json({
      success: true,
      message: 'Page synced successfully',
      page
    });
  } catch (error) {
    logger.error('Sync Facebook page error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync page',
      error: error.message
    });
  }
};

/**
 * Disconnect a Facebook Page
 * DELETE /api/facebook/pages/:id
 */
const disconnectPage = async (req, res) => {
  try {
    const { id } = req.params;

    const page = await FacebookPage.findOne({
      where: { 
        id, 
        organization_id: req.tenancy.organization_id 
      }
    });

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }

    await page.destroy();

    logger.info(`Facebook page disconnected for org ${req.tenancy.organization_id}`);

    res.json({
      success: true,
      message: 'Page disconnected successfully'
    });
  } catch (error) {
    logger.error('Disconnect Facebook page error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disconnect page',
      error: error.message
    });
  }
};

/**
 * =====================
 * MESSENGER MANAGEMENT
 * =====================
 */

/**
 * Get all messages/conversations
 * GET /api/facebook/messages
 */
const getMessages = async (req, res) => {
  try {
    const { pageId, conversationId, unreadOnly, limit = 50, offset = 0 } = req.query;

    const where = { organization_id: req.tenancy.organization_id };
    
    if (pageId) where.facebook_page_id = pageId;
    if (conversationId) where.conversation_id = conversationId;
    if (unreadOnly === 'true') where.is_read = false;

    const messages = await FacebookMessage.findAll({
      where,
      include: [
        {
          model: FacebookPage,
          attributes: ['id', 'page_name', 'facebook_page_id']
        },
        {
          model: Contact,
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['timestamp', 'DESC']]
    });

    const total = await FacebookMessage.count({ where });

    res.json({
      success: true,
      messages,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    logger.error('Get Facebook messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      error: error.message
    });
  }
};

/**
 * Send a message via Messenger
 * POST /api/facebook/messages/send
 */
const sendFacebookMessage = async (req, res) => {
  try {
    const { pageId, recipientId, message, messageType = 'RESPONSE' } = req.body;

    const page = await FacebookPage.findOne({
      where: { 
        id: pageId, 
        organization_id: req.tenancy.organization_id 
      }
    });

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }

    // Send message via Facebook API
    const result = await facebookService.sendMessage(
      page.page_access_token,
      recipientId,
      message,
      messageType
    );

    // Store the message in database
    const fbMessage = await FacebookMessage.create({
      organization_id: req.tenancy.organization_id,
      facebook_page_id: pageId,
      conversation_id: `${page.facebook_page_id}_${recipientId}`,
      message_id: result.message_id,
      direction: 'outgoing',
      sender_id: page.facebook_page_id,
      recipient_id: recipientId,
      sender_name: page.page_name,
      message_text: typeof message === 'string' ? message : JSON.stringify(message),
      is_echo: true,
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Message sent successfully',
      result,
      savedMessage: fbMessage
    });
  } catch (error) {
    logger.error('Send Facebook message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
};

/**
 * Mark messages as read
 * PUT /api/facebook/messages/:id/read
 */
const markMessageAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const message = await FacebookMessage.findOne({
      where: { 
        id, 
        organization_id: req.tenancy.organization_id 
      },
      include: [{ model: FacebookPage }]
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Mark as read in Facebook
    if (message.direction === 'incoming') {
      await facebookService.markAsRead(
        message.FacebookPage.page_access_token,
        message.sender_id
      );
    }

    // Update in database
    await message.update({ is_read: true });

    res.json({
      success: true,
      message: 'Message marked as read'
    });
  } catch (error) {
    logger.error('Mark message as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark message as read',
      error: error.message
    });
  }
};

/**
 * Assign conversation to user
 * PUT /api/facebook/messages/conversation/:conversationId/assign
 */
const assignConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.body;

    await FacebookMessage.update(
      { assigned_to: userId },
      {
        where: {
          organization_id: req.tenancy.organization_id,
          conversation_id: conversationId
        }
      }
    );

    res.json({
      success: true,
      message: 'Conversation assigned successfully'
    });
  } catch (error) {
    logger.error('Assign conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign conversation',
      error: error.message
    });
  }
};

/**
 * =====================
 * LEADS MANAGEMENT
 * =====================
 */

/**
 * Get all Facebook leads
 * GET /api/facebook/leads
 */
const getLeads = async (req, res) => {
  try {
    const { pageId, status, limit = 50, offset = 0 } = req.query;

    const where = { organization_id: req.tenancy.organization_id };
    
    if (pageId) where.facebook_page_id = pageId;
    if (status) where.status = status;

    const leads = await FacebookLead.findAll({
      where,
      include: [
        {
          model: FacebookPage,
          attributes: ['id', 'page_name']
        },
        {
          model: Contact,
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        {
          model: Deal,
          attributes: ['id', 'title', 'value', 'stage']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['fb_created_time', 'DESC']]
    });

    const total = await FacebookLead.count({ where });

    res.json({
      success: true,
      leads,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    logger.error('Get Facebook leads error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leads',
      error: error.message
    });
  }
};

/**
 * Sync leads from Facebook
 * POST /api/facebook/leads/sync
 */
const syncLeads = async (req, res) => {
  try {
    const { pageId, formId } = req.body;

    const page = await FacebookPage.findOne({
      where: { 
        id: pageId, 
        organization_id: req.tenancy.organization_id 
      }
    });

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }

    // Get leads from Facebook
    const fbLeads = await facebookService.getFormLeads(
      formId,
      page.page_access_token,
      100
    );

    let imported = 0;
    let skipped = 0;

    for (const leadData of fbLeads) {
      // Check if lead already exists
      const existing = await FacebookLead.findOne({
        where: { facebook_lead_id: leadData.id }
      });

      if (existing) {
        skipped++;
        continue;
      }

      // Parse lead data
      const parsed = facebookService.parseLeadData(leadData.field_data);

      // Create lead record
      await FacebookLead.create({
        organization_id: req.tenancy.organization_id,
        facebook_page_id: pageId,
        facebook_lead_id: leadData.id,
        form_id: formId,
        ad_id: leadData.ad_id,
        ad_name: leadData.ad_name,
        campaign_id: leadData.campaign_id,
        campaign_name: leadData.campaign_name,
        first_name: parsed.first_name,
        last_name: parsed.last_name,
        full_name: parsed.full_name,
        email: parsed.email,
        phone: parsed.phone,
        company: parsed.company,
        job_title: parsed.job_title,
        city: parsed.city,
        state: parsed.state,
        country: parsed.country,
        field_data: JSON.stringify(leadData.field_data),
        fb_created_time: leadData.created_time,
        is_organic: leadData.is_organic || false
      });

      imported++;
    }

    res.json({
      success: true,
      message: `Synced ${imported} new leads, ${skipped} skipped`,
      imported,
      skipped
    });
  } catch (error) {
    logger.error('Sync Facebook leads error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync leads',
      error: error.message
    });
  }
};

/**
 * Convert lead to contact
 * POST /api/facebook/leads/:id/convert
 */
const convertLeadToContact = async (req, res) => {
  try {
    const { id } = req.params;
    const { createDeal, dealValue, dealTitle } = req.body;

    const lead = await FacebookLead.findOne({
      where: { 
        id, 
        organization_id: req.tenancy.organization_id 
      }
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    if (lead.contact_id) {
      return res.status(400).json({
        success: false,
        message: 'Lead already converted'
      });
    }

    // Create contact
    const contact = await Contact.create({
      organization_id: req.tenancy.organization_id,
      first_name: lead.first_name || 'Unknown',
      last_name: lead.last_name || '',
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      title: lead.job_title,
      source: 'Facebook Lead Ad',
      owner_id: lead.assigned_to || req.user.id,
      notes: `Converted from Facebook Lead\nCampaign: ${lead.campaign_name || 'N/A'}\nAd: ${lead.ad_name || 'N/A'}`
    });

    // Update lead
    await lead.update({
      contact_id: contact.id,
      status: 'converted',
      processed_at: new Date()
    });

    let deal = null;

    // Create deal if requested
    if (createDeal) {
      deal = await Deal.create({
        organization_id: req.tenancy.organization_id,
        contact_id: contact.id,
        title: dealTitle || `${contact.first_name} ${contact.last_name} - Facebook Lead`,
        value: dealValue || 0,
        stage: 'qualification',
        owner_id: lead.assigned_to || req.user.id,
        source: 'Facebook Lead Ad'
      });

      await lead.update({ deal_id: deal.id });
    }

    logger.info(`Lead converted to contact for org ${req.tenancy.organization_id}`);

    res.json({
      success: true,
      message: 'Lead converted successfully',
      contact,
      deal
    });
  } catch (error) {
    logger.error('Convert lead to contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to convert lead',
      error: error.message
    });
  }
};

/**
 * Update lead status
 * PUT /api/facebook/leads/:id/status
 */
const updateLeadStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, qualityScore, assignedTo } = req.body;

    const lead = await FacebookLead.findOne({
      where: { 
        id, 
        organization_id: req.tenancy.organization_id 
      }
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    await lead.update({
      status: status || lead.status,
      notes: notes || lead.notes,
      quality_score: qualityScore || lead.quality_score,
      assigned_to: assignedTo || lead.assigned_to
    });

    res.json({
      success: true,
      message: 'Lead updated successfully',
      lead
    });
  } catch (error) {
    logger.error('Update lead status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update lead',
      error: error.message
    });
  }
};

module.exports = {
  // Pages
  getPages,
  connectPage,
  syncPage,
  disconnectPage,

  // Messages
  getMessages,
  sendFacebookMessage,
  markMessageAsRead,
  assignConversation,

  // Leads
  getLeads,
  syncLeads,
  convertLeadToContact,
  updateLeadStatus
};
