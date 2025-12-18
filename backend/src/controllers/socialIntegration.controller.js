const { SocialMediaAccount, SocialMediaPost, SocialMediaComment, Contact } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const socialAuthService = require('../services/socialAuth.service');
const facebookService = require('../services/facebook.service');
const instagramService = require('../services/instagram.service');
const twitterService = require('../services/twitter.service');
const linkedinService = require('../services/linkedin.service');

/**
 * =====================
 * OAUTH ENDPOINTS
 * =====================
 */

/**
 * Get OAuth authorization URL
 * GET /api/social-media/auth/:platform
 */
const getAuthUrl = async (req, res) => {
  try {
    const { platform } = req.params;
    const state = `${req.tenancy.organization_id}:${req.user.id}:${Date.now()}`;
    
    const authUrl = socialAuthService.getAuthorizationUrl(platform, state);
    
    if (!authUrl) {
      return res.status(400).json({
        success: false,
        message: `Unsupported platform: ${platform}`,
      });
    }

    res.json({
      success: true,
      authUrl,
      platform,
    });
  } catch (error) {
    logger.error('Get auth URL error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate authorization URL',
      error: error.message,
    });
  }
};

/**
 * OAuth callback handler
 * GET /api/social-media/auth/:platform/callback
 */
const handleOAuthCallback = async (req, res) => {
  try {
    const { platform } = req.params;
    const { code, state, error: oauthError } = req.query;

    if (oauthError) {
      return res.redirect(`${process.env.FRONTEND_URL}/marketing?error=${oauthError}`);
    }

    // Parse state to get organization and user
    const [organizationId, userId] = state.split(':');

    // Exchange code for token
    const tokenData = await socialAuthService.exchangeCodeForToken(platform, code);
    
    if (!tokenData.access_token) {
      return res.redirect(`${process.env.FRONTEND_URL}/marketing?error=token_exchange_failed`);
    }

    // Get user info from platform
    const userInfo = await socialAuthService.getUserInfo(platform, tokenData.access_token);

    // For Facebook/Instagram, get pages and IG accounts
    let pages = [];
    let igAccounts = [];
    
    if (platform === 'facebook' || platform === 'instagram') {
      pages = await socialAuthService.getFacebookPages(tokenData.access_token);
      igAccounts = await socialAuthService.getInstagramAccounts(tokenData.access_token);
    }

    // Store the account
    const account = await SocialMediaAccount.create({
      organization_id: organizationId,
      platform,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_expires_at: tokenData.expires_in 
        ? new Date(Date.now() + tokenData.expires_in * 1000) 
        : null,
      platform_user_id: userInfo.id,
      account_name: userInfo.name || userInfo.username,
      profile_picture: userInfo.picture || userInfo.profile_image_url,
      account_data: JSON.stringify({ pages, igAccounts, userInfo }),
      is_active: true,
    });

    logger.info(`OAuth success: ${platform} connected for org ${organizationId}`);

    // Redirect back to marketing page with success
    res.redirect(`${process.env.FRONTEND_URL}/marketing?connected=${platform}&account=${account.id}`);
  } catch (error) {
    logger.error('OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/marketing?error=connection_failed`);
  }
};

/**
 * Get pages/accounts for connected Facebook account
 * GET /api/social-media/accounts/:id/pages
 */
const getAccountPages = async (req, res) => {
  try {
    const { id } = req.params;

    const account = await SocialMediaAccount.findOne({
      where: { id, organization_id: req.tenancy.organization_id },
    });

    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    let pages = [];
    let igAccounts = [];

    if (account.platform === 'facebook' || account.platform === 'instagram') {
      pages = await socialAuthService.getFacebookPages(account.access_token);
      igAccounts = await socialAuthService.getInstagramAccounts(account.access_token);
    }

    if (account.platform === 'linkedin') {
      pages = await socialAuthService.getLinkedInOrganizations(account.access_token);
    }

    res.json({
      success: true,
      pages,
      igAccounts,
    });
  } catch (error) {
    logger.error('Get account pages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pages',
      error: error.message,
    });
  }
};

/**
 * =====================
 * MESSENGER / DM ENDPOINTS
 * =====================
 */

/**
 * Get all conversations across platforms
 * GET /api/social-media/inbox
 */
const getInbox = async (req, res) => {
  try {
    const { platform, limit = 25 } = req.query;

    const where = { 
      organization_id: req.tenancy.organization_id,
      is_active: true,
    };
    if (platform) where.platform = platform;

    const accounts = await SocialMediaAccount.findAll({ where });
    
    const allConversations = [];

    for (const account of accounts) {
      try {
        let conversations = [];
        
        switch (account.platform) {
          case 'facebook':
            if (account.page_id) {
              conversations = await facebookService.getConversations(
                account.page_id, 
                account.access_token, 
                parseInt(limit)
              );
              conversations = conversations.map(c => ({
                ...c,
                platform: 'facebook',
                accountId: account.id,
                accountName: account.account_name,
              }));
            }
            break;

          case 'instagram':
            if (account.platform_user_id) {
              conversations = await instagramService.getConversations(
                account.platform_user_id,
                account.access_token,
                'instagram',
                parseInt(limit)
              );
              conversations = conversations.map(c => ({
                ...c,
                platform: 'instagram',
                accountId: account.id,
                accountName: account.account_name,
              }));
            }
            break;

          case 'twitter':
            const dmResult = await twitterService.getDMConversations(account.access_token);
            conversations = (dmResult.conversations || []).map(c => ({
              ...c,
              platform: 'twitter',
              accountId: account.id,
              accountName: account.account_name,
              includes: dmResult.includes,
            }));
            break;

          case 'linkedin':
            conversations = await linkedinService.getConversations(account.access_token);
            conversations = (conversations || []).map(c => ({
              ...c,
              platform: 'linkedin',
              accountId: account.id,
              accountName: account.account_name,
            }));
            break;
        }

        allConversations.push(...conversations);
      } catch (err) {
        logger.warn(`Failed to get conversations for ${account.platform}:`, err.message);
      }
    }

    // Sort by update time
    allConversations.sort((a, b) => {
      const timeA = new Date(a.updated_time || a.created_at || 0);
      const timeB = new Date(b.updated_time || b.created_at || 0);
      return timeB - timeA;
    });

    res.json({
      success: true,
      conversations: allConversations.slice(0, parseInt(limit)),
    });
  } catch (error) {
    logger.error('Get inbox error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inbox',
      error: error.message,
    });
  }
};

/**
 * Get messages for a conversation
 * GET /api/social-media/conversations/:id/messages
 */
const getConversationMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const { platform, accountId, limit = 50 } = req.query;

    const account = await SocialMediaAccount.findOne({
      where: { id: accountId, organization_id: req.tenancy.organization_id },
    });

    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    let messages = [];

    switch (platform) {
      case 'facebook':
        messages = await facebookService.getConversationMessages(
          id, 
          account.access_token, 
          parseInt(limit)
        );
        break;

      case 'instagram':
        messages = await instagramService.getMessages(id, account.access_token, parseInt(limit));
        break;

      case 'twitter':
        const dmResult = await twitterService.getDMEvents(account.access_token, id);
        messages = dmResult.events || [];
        break;

      case 'linkedin':
        messages = await linkedinService.getConversationMessages(account.access_token, id);
        break;
    }

    res.json({
      success: true,
      messages,
      platform,
    });
  } catch (error) {
    logger.error('Get conversation messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      error: error.message,
    });
  }
};

/**
 * Send message in a conversation
 * POST /api/social-media/conversations/:id/messages
 */
const sendMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { platform, accountId, recipientId, message } = req.body;

    const account = await SocialMediaAccount.findOne({
      where: { id: accountId, organization_id: req.tenancy.organization_id },
    });

    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    let result;

    switch (platform) {
      case 'facebook':
        result = await facebookService.sendMessage(account.access_token, recipientId, message);
        break;

      case 'instagram':
        result = await instagramService.sendMessage(
          account.platform_user_id,
          account.access_token,
          recipientId,
          message
        );
        break;

      case 'twitter':
        result = await twitterService.sendDM(account.access_token, id, message);
        break;

      case 'linkedin':
        result = await linkedinService.sendMessage(account.access_token, id, message);
        break;
    }

    logger.info(`Message sent via ${platform} for org ${req.tenancy.organization_id}`);

    res.json({
      success: true,
      message: 'Message sent',
      result,
    });
  } catch (error) {
    logger.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message,
    });
  }
};

/**
 * =====================
 * LEADS ENDPOINTS
 * =====================
 */

/**
 * Get lead forms (Facebook Lead Ads)
 * GET /api/social-media/leads/forms
 */
const getLeadForms = async (req, res) => {
  try {
    const accounts = await SocialMediaAccount.findAll({
      where: {
        organization_id: req.tenancy.organization_id,
        platform: 'facebook',
        is_active: true,
      },
    });

    const allForms = [];

    for (const account of accounts) {
      if (!account.page_id) continue;

      try {
        const forms = await facebookService.getLeadForms(account.page_id, account.access_token);
        allForms.push(...forms.map(f => ({
          ...f,
          accountId: account.id,
          pageName: account.account_name,
        })));
      } catch (err) {
        logger.warn(`Failed to get lead forms for page ${account.page_id}:`, err.message);
      }
    }

    res.json({
      success: true,
      forms: allForms,
    });
  } catch (error) {
    logger.error('Get lead forms error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lead forms',
      error: error.message,
    });
  }
};

/**
 * Get leads from a form
 * GET /api/social-media/leads/forms/:formId
 */
const getFormLeads = async (req, res) => {
  try {
    const { formId } = req.params;
    const { accountId, limit = 50 } = req.query;

    const account = await SocialMediaAccount.findOne({
      where: { id: accountId, organization_id: req.tenancy.organization_id },
    });

    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    const leads = await facebookService.getFormLeads(formId, account.access_token, parseInt(limit));

    // Parse lead data
    const parsedLeads = leads.map(lead => ({
      id: lead.id,
      created_time: lead.created_time,
      ad_id: lead.ad_id,
      ad_name: lead.ad_name,
      campaign_id: lead.campaign_id,
      campaign_name: lead.campaign_name,
      ...facebookService.parseLeadData(lead.field_data),
    }));

    res.json({
      success: true,
      leads: parsedLeads,
    });
  } catch (error) {
    logger.error('Get form leads error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leads',
      error: error.message,
    });
  }
};

/**
 * Import lead to CRM contacts
 * POST /api/social-media/leads/:leadId/import
 */
const importLead = async (req, res) => {
  try {
    const { leadId } = req.params;
    const { accountId } = req.body;

    const account = await SocialMediaAccount.findOne({
      where: { id: accountId, organization_id: req.tenancy.organization_id },
    });

    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    // Get lead details from Facebook
    const leadData = await facebookService.getLeadDetails(leadId, account.access_token);
    const parsed = facebookService.parseLeadData(leadData.field_data);

    // Check if contact already exists
    const existingContact = await Contact.findOne({
      where: {
        organization_id: req.tenancy.organization_id,
        email: parsed.email,
      },
    });

    if (existingContact) {
      return res.json({
        success: true,
        message: 'Contact already exists',
        contact: existingContact,
        imported: false,
      });
    }

    // Create new contact
    const contact = await Contact.create({
      organization_id: req.tenancy.organization_id,
      first_name: parsed.first_name || 'Unknown',
      last_name: parsed.last_name || '',
      email: parsed.email,
      phone: parsed.phone,
      company: parsed.company,
      title: parsed.job_title,
      source: 'Facebook Lead Ad',
      notes: `Imported from Facebook Lead Ads\nCampaign: ${leadData.campaign_name || 'N/A'}\nAd: ${leadData.ad_name || 'N/A'}`,
    });

    logger.info(`Lead imported as contact for org ${req.tenancy.organization_id}`);

    res.json({
      success: true,
      message: 'Lead imported successfully',
      contact,
      imported: true,
    });
  } catch (error) {
    logger.error('Import lead error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import lead',
      error: error.message,
    });
  }
};

/**
 * =====================
 * ADS & ANALYTICS ENDPOINTS
 * =====================
 */

/**
 * Get ad accounts
 * GET /api/social-media/ads/accounts
 */
const getAdAccounts = async (req, res) => {
  try {
    const accounts = await SocialMediaAccount.findAll({
      where: {
        organization_id: req.tenancy.organization_id,
        platform: 'facebook',
        is_active: true,
      },
    });

    const allAdAccounts = [];

    for (const account of accounts) {
      try {
        const adAccounts = await facebookService.getAdAccounts(account.access_token);
        allAdAccounts.push(...adAccounts.map(a => ({
          ...a,
          socialAccountId: account.id,
          socialAccountName: account.account_name,
        })));
      } catch (err) {
        logger.warn(`Failed to get ad accounts:`, err.message);
      }
    }

    res.json({
      success: true,
      adAccounts: allAdAccounts,
    });
  } catch (error) {
    logger.error('Get ad accounts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ad accounts',
      error: error.message,
    });
  }
};

/**
 * Get campaigns for an ad account
 * GET /api/social-media/ads/accounts/:adAccountId/campaigns
 */
const getAdCampaigns = async (req, res) => {
  try {
    const { adAccountId } = req.params;
    const { socialAccountId } = req.query;

    const account = await SocialMediaAccount.findOne({
      where: { id: socialAccountId, organization_id: req.tenancy.organization_id },
    });

    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    const campaigns = await facebookService.getCampaigns(adAccountId, account.access_token);

    res.json({
      success: true,
      campaigns,
    });
  } catch (error) {
    logger.error('Get ad campaigns error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch campaigns',
      error: error.message,
    });
  }
};

/**
 * Get campaign insights
 * GET /api/social-media/ads/campaigns/:campaignId/insights
 */
const getCampaignInsights = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { socialAccountId, datePreset = 'last_30d' } = req.query;

    const account = await SocialMediaAccount.findOne({
      where: { id: socialAccountId, organization_id: req.tenancy.organization_id },
    });

    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    const insights = await facebookService.getCampaignInsights(
      campaignId, 
      account.access_token, 
      datePreset
    );

    res.json({
      success: true,
      insights,
    });
  } catch (error) {
    logger.error('Get campaign insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch insights',
      error: error.message,
    });
  }
};

/**
 * Get ad account overview insights
 * GET /api/social-media/ads/accounts/:adAccountId/insights
 */
const getAdAccountInsights = async (req, res) => {
  try {
    const { adAccountId } = req.params;
    const { socialAccountId, datePreset = 'last_30d' } = req.query;

    const account = await SocialMediaAccount.findOne({
      where: { id: socialAccountId, organization_id: req.tenancy.organization_id },
    });

    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    const insights = await facebookService.getAdAccountInsights(
      adAccountId, 
      account.access_token, 
      datePreset
    );

    res.json({
      success: true,
      insights,
    });
  } catch (error) {
    logger.error('Get ad account insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch insights',
      error: error.message,
    });
  }
};

/**
 * =====================
 * WEBHOOKS
 * =====================
 */

/**
 * Facebook/Instagram webhook verification
 * GET /api/social-media/webhooks/facebook
 */
const verifyFacebookWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const result = facebookService.verifyWebhook(mode, token, challenge);

  if (result) {
    res.status(200).send(result);
  } else {
    res.sendStatus(403);
  }
};

/**
 * Facebook/Instagram webhook handler
 * POST /api/social-media/webhooks/facebook
 */
const handleFacebookWebhook = async (req, res) => {
  try {
    const events = facebookService.processWebhookEvent(req.body);

    for (const event of events) {
      switch (event.type) {
        case 'messaging':
          await handleMessengerEvent(event);
          break;
        case 'lead':
          await handleLeadEvent(event);
          break;
        case 'feed':
          await handleFeedEvent(event);
          break;
      }
    }

    res.status(200).send('EVENT_RECEIVED');
  } catch (error) {
    logger.error('Webhook error:', error);
    res.status(200).send('EVENT_RECEIVED'); // Always return 200 for webhooks
  }
};

/**
 * Handle messenger webhook event
 */
const handleMessengerEvent = async (event) => {
  const { pageId, data } = event;

  // Find account by page ID
  const account = await SocialMediaAccount.findOne({
    where: { page_id: pageId, is_active: true },
  });

  if (!account) {
    logger.warn(`No account found for page ${pageId}`);
    return;
  }

  if (data.eventType === 'message' && !data.isEcho) {
    // New message received - could trigger notification, auto-response, etc.
    logger.info(`New message from ${data.senderId} on page ${pageId}`);

    // Optionally create/link to contact based on sender info
    // Optionally trigger auto-response or chatbot
  }
};

/**
 * Handle lead webhook event
 */
const handleLeadEvent = async (event) => {
  const { pageId, data } = event;

  const account = await SocialMediaAccount.findOne({
    where: { page_id: pageId, is_active: true },
  });

  if (!account) {
    logger.warn(`No account found for page ${pageId}`);
    return;
  }

  // Auto-import lead if configured
  try {
    const leadData = await facebookService.getLeadDetails(data.leadgen_id, account.access_token);
    const parsed = facebookService.parseLeadData(leadData.field_data);

    // Create contact if doesn't exist
    const [contact, created] = await Contact.findOrCreate({
      where: {
        organization_id: account.organization_id,
        email: parsed.email,
      },
      defaults: {
        first_name: parsed.first_name || 'Unknown',
        last_name: parsed.last_name || '',
        phone: parsed.phone,
        company: parsed.company,
        title: parsed.job_title,
        source: 'Facebook Lead Ad (Auto)',
      },
    });

    if (created) {
      logger.info(`Auto-imported lead as contact for org ${account.organization_id}`);
    }
  } catch (error) {
    logger.error('Auto-import lead error:', error);
  }
};

/**
 * Handle feed webhook event (comments, posts)
 */
const handleFeedEvent = async (event) => {
  const { pageId, field, data } = event;

  if (field === 'feed' && data.item === 'comment') {
    // New comment on page post
    logger.info(`New comment on page ${pageId}: ${data.message?.substring(0, 50)}`);
    
    // Could store in SocialMediaComment for tracking
    // Could trigger notification or auto-reply
  }
};

module.exports = {
  // OAuth
  getAuthUrl,
  handleOAuthCallback,
  getAccountPages,

  // Inbox / Messaging
  getInbox,
  getConversationMessages,
  sendMessage,

  // Leads
  getLeadForms,
  getFormLeads,
  importLead,

  // Ads
  getAdAccounts,
  getAdCampaigns,
  getCampaignInsights,
  getAdAccountInsights,

  // Webhooks
  verifyFacebookWebhook,
  handleFacebookWebhook,
};
