/**
 * Facebook Graph API Service
 * Handles Pages, Messenger, Leads, and Ads integrations
 */

const axios = require('axios');
const logger = require('../utils/logger');

const GRAPH_API_VERSION = 'v18.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/**
 * =====================
 * PAGES MANAGEMENT
 * =====================
 */

/**
 * Get page details
 */
const getPageDetails = async (pageId, pageAccessToken) => {
  try {
    const response = await axios.get(`${GRAPH_API_BASE}/${pageId}`, {
      params: {
        access_token: pageAccessToken,
        fields: 'id,name,about,category,fan_count,picture,cover,website,phone,emails,hours,location'
      }
    });
    return response.data;
  } catch (error) {
    logger.error('Get page details error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get page posts
 */
const getPagePosts = async (pageId, pageAccessToken, limit = 25) => {
  try {
    const response = await axios.get(`${GRAPH_API_BASE}/${pageId}/posts`, {
      params: {
        access_token: pageAccessToken,
        fields: 'id,message,created_time,full_picture,permalink_url,shares,comments.summary(true),reactions.summary(true)',
        limit
      }
    });
    return response.data.data;
  } catch (error) {
    logger.error('Get page posts error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Create page post
 */
const createPagePost = async (pageId, pageAccessToken, { message, link, photoUrl }) => {
  try {
    const params = {
      access_token: pageAccessToken,
      message
    };

    if (link) params.link = link;

    let endpoint = `${GRAPH_API_BASE}/${pageId}/feed`;
    
    if (photoUrl) {
      endpoint = `${GRAPH_API_BASE}/${pageId}/photos`;
      params.url = photoUrl;
    }

    const response = await axios.post(endpoint, params);
    return response.data;
  } catch (error) {
    logger.error('Create page post error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get post comments
 */
const getPostComments = async (postId, pageAccessToken, limit = 50) => {
  try {
    const response = await axios.get(`${GRAPH_API_BASE}/${postId}/comments`, {
      params: {
        access_token: pageAccessToken,
        fields: 'id,message,from,created_time,like_count,comment_count,attachment',
        limit
      }
    });
    return response.data.data;
  } catch (error) {
    logger.error('Get post comments error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Reply to comment
 */
const replyToComment = async (commentId, pageAccessToken, message) => {
  try {
    const response = await axios.post(`${GRAPH_API_BASE}/${commentId}/comments`, {
      access_token: pageAccessToken,
      message
    });
    return response.data;
  } catch (error) {
    logger.error('Reply to comment error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * =====================
 * MESSENGER INTEGRATION
 * =====================
 */

/**
 * Get conversations
 */
const getConversations = async (pageId, pageAccessToken, limit = 25) => {
  try {
    const response = await axios.get(`${GRAPH_API_BASE}/${pageId}/conversations`, {
      params: {
        access_token: pageAccessToken,
        fields: 'id,participants,updated_time,unread_count,snippet,can_reply',
        limit
      }
    });
    return response.data.data;
  } catch (error) {
    logger.error('Get conversations error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get conversation messages
 */
const getConversationMessages = async (conversationId, pageAccessToken, limit = 50) => {
  try {
    const response = await axios.get(`${GRAPH_API_BASE}/${conversationId}/messages`, {
      params: {
        access_token: pageAccessToken,
        fields: 'id,message,from,to,created_time,attachments,sticker',
        limit
      }
    });
    return response.data.data;
  } catch (error) {
    logger.error('Get conversation messages error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Send message via Messenger
 */
const sendMessage = async (pageAccessToken, recipientId, message, messageType = 'RESPONSE') => {
  try {
    const response = await axios.post(`${GRAPH_API_BASE}/me/messages`, {
      access_token: pageAccessToken,
      recipient: { id: recipientId },
      messaging_type: messageType,
      message: typeof message === 'string' ? { text: message } : message
    });
    return response.data;
  } catch (error) {
    logger.error('Send message error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Send message with quick replies
 */
const sendQuickReply = async (pageAccessToken, recipientId, text, quickReplies) => {
  return sendMessage(pageAccessToken, recipientId, {
    text,
    quick_replies: quickReplies.map(reply => ({
      content_type: 'text',
      title: reply.title,
      payload: reply.payload
    }))
  });
};

/**
 * Send message with buttons
 */
const sendButtonTemplate = async (pageAccessToken, recipientId, text, buttons) => {
  return sendMessage(pageAccessToken, recipientId, {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'button',
        text,
        buttons: buttons.map(btn => ({
          type: btn.type || 'postback',
          title: btn.title,
          payload: btn.payload,
          url: btn.url
        }))
      }
    }
  });
};

/**
 * Mark message as read
 */
const markAsRead = async (pageAccessToken, recipientId) => {
  try {
    await axios.post(`${GRAPH_API_BASE}/me/messages`, {
      access_token: pageAccessToken,
      recipient: { id: recipientId },
      sender_action: 'mark_seen'
    });
  } catch (error) {
    logger.error('Mark as read error:', error.response?.data || error.message);
  }
};

/**
 * Show typing indicator
 */
const showTypingIndicator = async (pageAccessToken, recipientId, isTyping = true) => {
  try {
    await axios.post(`${GRAPH_API_BASE}/me/messages`, {
      access_token: pageAccessToken,
      recipient: { id: recipientId },
      sender_action: isTyping ? 'typing_on' : 'typing_off'
    });
  } catch (error) {
    logger.error('Typing indicator error:', error.response?.data || error.message);
  }
};

/**
 * =====================
 * LEAD ADS INTEGRATION
 * =====================
 */

/**
 * Get lead forms for a page
 */
const getLeadForms = async (pageId, pageAccessToken) => {
  try {
    const response = await axios.get(`${GRAPH_API_BASE}/${pageId}/leadgen_forms`, {
      params: {
        access_token: pageAccessToken,
        fields: 'id,name,status,leads_count,created_time,questions'
      }
    });
    return response.data.data;
  } catch (error) {
    logger.error('Get lead forms error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get leads from a form
 */
const getFormLeads = async (formId, pageAccessToken, limit = 50) => {
  try {
    const response = await axios.get(`${GRAPH_API_BASE}/${formId}/leads`, {
      params: {
        access_token: pageAccessToken,
        fields: 'id,created_time,field_data,ad_id,ad_name,campaign_id,campaign_name',
        limit
      }
    });
    return response.data.data;
  } catch (error) {
    logger.error('Get form leads error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get single lead details
 */
const getLeadDetails = async (leadId, pageAccessToken) => {
  try {
    const response = await axios.get(`${GRAPH_API_BASE}/${leadId}`, {
      params: {
        access_token: pageAccessToken,
        fields: 'id,created_time,field_data,ad_id,ad_name,campaign_id,campaign_name,form_id,is_organic'
      }
    });
    return response.data;
  } catch (error) {
    logger.error('Get lead details error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Parse lead field data
 */
const parseLeadData = (fieldData) => {
  const parsed = {};
  
  for (const field of fieldData) {
    const key = field.name.toLowerCase().replace(/\s+/g, '_');
    parsed[key] = field.values?.[0] || null;
  }

  // Normalize common fields
  return {
    email: parsed.email || parsed.e_mail || parsed.email_address,
    first_name: parsed.first_name || parsed.firstname || parsed.full_name?.split(' ')[0],
    last_name: parsed.last_name || parsed.lastname || parsed.full_name?.split(' ').slice(1).join(' '),
    phone: parsed.phone || parsed.phone_number || parsed.mobile,
    company: parsed.company || parsed.company_name || parsed.business_name,
    job_title: parsed.job_title || parsed.position || parsed.title,
    city: parsed.city,
    state: parsed.state,
    country: parsed.country,
    ...parsed
  };
};

/**
 * =====================
 * ADS & INSIGHTS
 * =====================
 */

/**
 * Get ad accounts
 */
const getAdAccounts = async (accessToken) => {
  try {
    const response = await axios.get(`${GRAPH_API_BASE}/me/adaccounts`, {
      params: {
        access_token: accessToken,
        fields: 'id,name,account_id,account_status,currency,business_name,amount_spent'
      }
    });
    return response.data.data;
  } catch (error) {
    logger.error('Get ad accounts error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get campaigns
 */
const getCampaigns = async (adAccountId, accessToken, limit = 25) => {
  try {
    const response = await axios.get(`${GRAPH_API_BASE}/${adAccountId}/campaigns`, {
      params: {
        access_token: accessToken,
        fields: 'id,name,status,objective,created_time,start_time,stop_time,daily_budget,lifetime_budget',
        limit
      }
    });
    return response.data.data;
  } catch (error) {
    logger.error('Get campaigns error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get campaign insights
 */
const getCampaignInsights = async (campaignId, accessToken, datePreset = 'last_30d') => {
  try {
    const response = await axios.get(`${GRAPH_API_BASE}/${campaignId}/insights`, {
      params: {
        access_token: accessToken,
        fields: 'impressions,reach,clicks,spend,cpc,cpm,ctr,conversions,cost_per_conversion,actions',
        date_preset: datePreset
      }
    });
    return response.data.data?.[0] || {};
  } catch (error) {
    logger.error('Get campaign insights error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get ad account insights
 */
const getAdAccountInsights = async (adAccountId, accessToken, datePreset = 'last_30d') => {
  try {
    const response = await axios.get(`${GRAPH_API_BASE}/${adAccountId}/insights`, {
      params: {
        access_token: accessToken,
        fields: 'impressions,reach,clicks,spend,cpc,cpm,ctr,actions,cost_per_action_type',
        date_preset: datePreset,
        level: 'account'
      }
    });
    return response.data.data?.[0] || {};
  } catch (error) {
    logger.error('Get ad account insights error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * =====================
 * WEBHOOKS
 * =====================
 */

/**
 * Verify webhook subscription
 */
const verifyWebhook = (mode, token, challenge) => {
  const verifyToken = process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN;
  
  if (mode === 'subscribe' && token === verifyToken) {
    return challenge;
  }
  return null;
};

/**
 * Subscribe to page webhooks
 */
const subscribePageWebhooks = async (pageId, pageAccessToken) => {
  try {
    const response = await axios.post(`${GRAPH_API_BASE}/${pageId}/subscribed_apps`, {
      access_token: pageAccessToken,
      subscribed_fields: [
        'messages',
        'messaging_postbacks',
        'messaging_optins',
        'messaging_referrals',
        'feed',
        'leadgen'
      ].join(',')
    });
    return response.data;
  } catch (error) {
    logger.error('Subscribe page webhooks error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Process webhook event
 */
const processWebhookEvent = (event) => {
  const { object, entry } = event;
  const results = [];

  for (const pageEntry of entry) {
    const pageId = pageEntry.id;
    const time = pageEntry.time;

    // Messaging events
    if (pageEntry.messaging) {
      for (const messagingEvent of pageEntry.messaging) {
        results.push({
          type: 'messaging',
          pageId,
          time,
          data: processMessagingEvent(messagingEvent)
        });
      }
    }

    // Feed events (posts, comments)
    if (pageEntry.changes) {
      for (const change of pageEntry.changes) {
        results.push({
          type: 'feed',
          pageId,
          time,
          field: change.field,
          data: change.value
        });
      }
    }

    // Lead events
    if (pageEntry.changes?.some(c => c.field === 'leadgen')) {
      for (const change of pageEntry.changes.filter(c => c.field === 'leadgen')) {
        results.push({
          type: 'lead',
          pageId,
          time,
          data: change.value
        });
      }
    }
  }

  return results;
};

/**
 * Process messaging event
 */
const processMessagingEvent = (event) => {
  const senderId = event.sender?.id;
  const recipientId = event.recipient?.id;
  const timestamp = event.timestamp;

  if (event.message) {
    return {
      eventType: 'message',
      senderId,
      recipientId,
      timestamp,
      messageId: event.message.mid,
      text: event.message.text,
      attachments: event.message.attachments,
      quickReply: event.message.quick_reply,
      isEcho: event.message.is_echo
    };
  }

  if (event.postback) {
    return {
      eventType: 'postback',
      senderId,
      recipientId,
      timestamp,
      payload: event.postback.payload,
      title: event.postback.title
    };
  }

  if (event.referral) {
    return {
      eventType: 'referral',
      senderId,
      recipientId,
      timestamp,
      source: event.referral.source,
      type: event.referral.type,
      ref: event.referral.ref
    };
  }

  return {
    eventType: 'unknown',
    senderId,
    recipientId,
    timestamp,
    raw: event
  };
};

module.exports = {
  // Pages
  getPageDetails,
  getPagePosts,
  createPagePost,
  getPostComments,
  replyToComment,
  
  // Messenger
  getConversations,
  getConversationMessages,
  sendMessage,
  sendQuickReply,
  sendButtonTemplate,
  markAsRead,
  showTypingIndicator,
  
  // Leads
  getLeadForms,
  getFormLeads,
  getLeadDetails,
  parseLeadData,
  
  // Ads
  getAdAccounts,
  getCampaigns,
  getCampaignInsights,
  getAdAccountInsights,
  
  // Webhooks
  verifyWebhook,
  subscribePageWebhooks,
  processWebhookEvent
};
