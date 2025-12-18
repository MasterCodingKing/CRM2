/**
 * Instagram Graph API Service
 * Handles Instagram Business account integration
 */

const axios = require('axios');
const logger = require('../utils/logger');

const GRAPH_API_VERSION = 'v18.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/**
 * =====================
 * ACCOUNT MANAGEMENT
 * =====================
 */

/**
 * Get Instagram Business Account details
 */
const getAccountDetails = async (igAccountId, accessToken) => {
  try {
    const response = await axios.get(`${GRAPH_API_BASE}/${igAccountId}`, {
      params: {
        access_token: accessToken,
        fields: 'id,ig_id,username,name,biography,followers_count,follows_count,media_count,profile_picture_url,website'
      }
    });
    return response.data;
  } catch (error) {
    logger.error('Get Instagram account details error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get Instagram Business Accounts linked to Facebook Pages
 */
const getBusinessAccounts = async (accessToken) => {
  try {
    // First get Facebook pages
    const pagesResponse = await axios.get(`${GRAPH_API_BASE}/me/accounts`, {
      params: {
        access_token: accessToken,
        fields: 'id,name,instagram_business_account{id,ig_id,username,name,profile_picture_url}'
      }
    });

    // Extract Instagram accounts from pages
    const igAccounts = [];
    for (const page of pagesResponse.data.data) {
      if (page.instagram_business_account) {
        igAccounts.push({
          ...page.instagram_business_account,
          page_id: page.id,
          page_name: page.name
        });
      }
    }

    return igAccounts;
  } catch (error) {
    logger.error('Get Instagram business accounts error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * =====================
 * MEDIA MANAGEMENT
 * =====================
 */

/**
 * Get media posts
 */
const getMedia = async (igAccountId, accessToken, limit = 25) => {
  try {
    const response = await axios.get(`${GRAPH_API_BASE}/${igAccountId}/media`, {
      params: {
        access_token: accessToken,
        fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count',
        limit
      }
    });
    return response.data.data;
  } catch (error) {
    logger.error('Get Instagram media error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get single media details
 */
const getMediaDetails = async (mediaId, accessToken) => {
  try {
    const response = await axios.get(`${GRAPH_API_BASE}/${mediaId}`, {
      params: {
        access_token: accessToken,
        fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count,children{id,media_type,media_url}'
      }
    });
    return response.data;
  } catch (error) {
    logger.error('Get media details error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Create container for media upload (Step 1)
 */
const createMediaContainer = async (igAccountId, accessToken, { imageUrl, videoUrl, caption, mediaType = 'IMAGE' }) => {
  try {
    const params = {
      access_token: accessToken,
      caption
    };

    if (mediaType === 'VIDEO' || mediaType === 'REELS') {
      params.video_url = videoUrl;
      params.media_type = mediaType;
    } else {
      params.image_url = imageUrl;
    }

    const response = await axios.post(`${GRAPH_API_BASE}/${igAccountId}/media`, params);
    return response.data;
  } catch (error) {
    logger.error('Create media container error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Check media container status
 */
const getContainerStatus = async (containerId, accessToken) => {
  try {
    const response = await axios.get(`${GRAPH_API_BASE}/${containerId}`, {
      params: {
        access_token: accessToken,
        fields: 'status_code,status'
      }
    });
    return response.data;
  } catch (error) {
    logger.error('Get container status error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Publish media (Step 2)
 */
const publishMedia = async (igAccountId, accessToken, containerId) => {
  try {
    const response = await axios.post(`${GRAPH_API_BASE}/${igAccountId}/media_publish`, {
      access_token: accessToken,
      creation_id: containerId
    });
    return response.data;
  } catch (error) {
    logger.error('Publish media error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Create carousel container
 */
const createCarouselContainer = async (igAccountId, accessToken, { childrenIds, caption }) => {
  try {
    const response = await axios.post(`${GRAPH_API_BASE}/${igAccountId}/media`, {
      access_token: accessToken,
      media_type: 'CAROUSEL',
      caption,
      children: childrenIds.join(',')
    });
    return response.data;
  } catch (error) {
    logger.error('Create carousel container error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * =====================
 * COMMENTS
 * =====================
 */

/**
 * Get media comments
 */
const getComments = async (mediaId, accessToken, limit = 50) => {
  try {
    const response = await axios.get(`${GRAPH_API_BASE}/${mediaId}/comments`, {
      params: {
        access_token: accessToken,
        fields: 'id,text,username,timestamp,like_count,replies{id,text,username,timestamp}',
        limit
      }
    });
    return response.data.data;
  } catch (error) {
    logger.error('Get comments error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Reply to comment
 */
const replyToComment = async (commentId, accessToken, message) => {
  try {
    const response = await axios.post(`${GRAPH_API_BASE}/${commentId}/replies`, {
      access_token: accessToken,
      message
    });
    return response.data;
  } catch (error) {
    logger.error('Reply to comment error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Hide/Unhide comment
 */
const setCommentVisibility = async (commentId, accessToken, hide = true) => {
  try {
    const response = await axios.post(`${GRAPH_API_BASE}/${commentId}`, {
      access_token: accessToken,
      hide
    });
    return response.data;
  } catch (error) {
    logger.error('Set comment visibility error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Delete comment
 */
const deleteComment = async (commentId, accessToken) => {
  try {
    const response = await axios.delete(`${GRAPH_API_BASE}/${commentId}`, {
      params: { access_token: accessToken }
    });
    return response.data;
  } catch (error) {
    logger.error('Delete comment error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * =====================
 * MESSAGING (DMs)
 * =====================
 */

/**
 * Get Instagram conversations
 */
const getConversations = async (igAccountId, accessToken, platform = 'instagram', limit = 25) => {
  try {
    const response = await axios.get(`${GRAPH_API_BASE}/${igAccountId}/conversations`, {
      params: {
        access_token: accessToken,
        platform,
        fields: 'id,participants,updated_time,messages{id,message,from,to,created_time}',
        limit
      }
    });
    return response.data.data;
  } catch (error) {
    logger.error('Get Instagram conversations error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get conversation messages
 */
const getMessages = async (conversationId, accessToken, limit = 50) => {
  try {
    const response = await axios.get(`${GRAPH_API_BASE}/${conversationId}/messages`, {
      params: {
        access_token: accessToken,
        fields: 'id,message,from,to,created_time,attachments',
        limit
      }
    });
    return response.data.data;
  } catch (error) {
    logger.error('Get Instagram messages error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Send Instagram message
 */
const sendMessage = async (igAccountId, accessToken, recipientId, message) => {
  try {
    const response = await axios.post(`${GRAPH_API_BASE}/${igAccountId}/messages`, {
      access_token: accessToken,
      recipient: { id: recipientId },
      message: typeof message === 'string' ? { text: message } : message
    });
    return response.data;
  } catch (error) {
    logger.error('Send Instagram message error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * =====================
 * INSIGHTS & ANALYTICS
 * =====================
 */

/**
 * Get account insights
 */
const getAccountInsights = async (igAccountId, accessToken, metrics, period = 'day', since, until) => {
  try {
    const params = {
      access_token: accessToken,
      metric: metrics.join(','),
      period
    };

    if (since) params.since = since;
    if (until) params.until = until;

    const response = await axios.get(`${GRAPH_API_BASE}/${igAccountId}/insights`, { params });
    return response.data.data;
  } catch (error) {
    logger.error('Get account insights error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get common account insights
 */
const getOverviewInsights = async (igAccountId, accessToken) => {
  const metrics = [
    'impressions',
    'reach',
    'profile_views',
    'website_clicks',
    'follower_count'
  ];

  return getAccountInsights(igAccountId, accessToken, metrics, 'day');
};

/**
 * Get media insights
 */
const getMediaInsights = async (mediaId, accessToken) => {
  try {
    const response = await axios.get(`${GRAPH_API_BASE}/${mediaId}/insights`, {
      params: {
        access_token: accessToken,
        metric: 'impressions,reach,engagement,saved,video_views'
      }
    });
    return response.data.data;
  } catch (error) {
    logger.error('Get media insights error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get audience demographics
 */
const getAudienceInsights = async (igAccountId, accessToken) => {
  try {
    const metrics = ['audience_city', 'audience_country', 'audience_gender_age'];
    const response = await axios.get(`${GRAPH_API_BASE}/${igAccountId}/insights`, {
      params: {
        access_token: accessToken,
        metric: metrics.join(','),
        period: 'lifetime'
      }
    });
    return response.data.data;
  } catch (error) {
    logger.error('Get audience insights error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * =====================
 * HASHTAG SEARCH
 * =====================
 */

/**
 * Search hashtag
 */
const searchHashtag = async (igAccountId, accessToken, hashtag) => {
  try {
    const response = await axios.get(`${GRAPH_API_BASE}/ig_hashtag_search`, {
      params: {
        access_token: accessToken,
        user_id: igAccountId,
        q: hashtag
      }
    });
    return response.data.data?.[0];
  } catch (error) {
    logger.error('Search hashtag error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get hashtag recent media
 */
const getHashtagMedia = async (hashtagId, igAccountId, accessToken, limit = 25) => {
  try {
    const response = await axios.get(`${GRAPH_API_BASE}/${hashtagId}/recent_media`, {
      params: {
        access_token: accessToken,
        user_id: igAccountId,
        fields: 'id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count',
        limit
      }
    });
    return response.data.data;
  } catch (error) {
    logger.error('Get hashtag media error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * =====================
 * STORIES
 * =====================
 */

/**
 * Get stories
 */
const getStories = async (igAccountId, accessToken) => {
  try {
    const response = await axios.get(`${GRAPH_API_BASE}/${igAccountId}/stories`, {
      params: {
        access_token: accessToken,
        fields: 'id,media_type,media_url,permalink,timestamp'
      }
    });
    return response.data.data;
  } catch (error) {
    logger.error('Get stories error:', error.response?.data || error.message);
    throw error;
  }
};

module.exports = {
  // Account
  getAccountDetails,
  getBusinessAccounts,

  // Media
  getMedia,
  getMediaDetails,
  createMediaContainer,
  getContainerStatus,
  publishMedia,
  createCarouselContainer,

  // Comments
  getComments,
  replyToComment,
  setCommentVisibility,
  deleteComment,

  // Messaging
  getConversations,
  getMessages,
  sendMessage,

  // Insights
  getAccountInsights,
  getOverviewInsights,
  getMediaInsights,
  getAudienceInsights,

  // Hashtags
  searchHashtag,
  getHashtagMedia,

  // Stories
  getStories
};
