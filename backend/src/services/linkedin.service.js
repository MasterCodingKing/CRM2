/**
 * LinkedIn API Service
 * Handles LinkedIn integration for CRM
 */

const axios = require('axios');
const logger = require('../utils/logger');

const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2';
const LINKEDIN_MEDIA_BASE = 'https://api.linkedin.com/rest';

/**
 * Create LinkedIn API client
 */
const createClient = (accessToken, version = 'v2') => {
  const baseURL = version === 'rest' ? LINKEDIN_MEDIA_BASE : LINKEDIN_API_BASE;
  return axios.create({
    baseURL,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
      'LinkedIn-Version': '202401'
    }
  });
};

/**
 * =====================
 * PROFILE & IDENTITY
 * =====================
 */

/**
 * Get authenticated user profile
 */
const getProfile = async (accessToken) => {
  try {
    const client = createClient(accessToken);
    const response = await client.get('/me', {
      params: {
        projection: '(id,firstName,lastName,profilePicture(displayImage~:playableStreams))'
      }
    });
    
    // Get email separately
    let email = null;
    try {
      const emailResponse = await client.get('/emailAddress', {
        params: { q: 'members', projection: '(elements*(handle~))' }
      });
      email = emailResponse.data?.elements?.[0]?.['handle~']?.emailAddress;
    } catch (e) {
      logger.warn('Could not fetch LinkedIn email');
    }

    return {
      id: response.data.id,
      firstName: response.data.firstName?.localized?.en_US,
      lastName: response.data.lastName?.localized?.en_US,
      profilePicture: response.data.profilePicture?.['displayImage~']?.elements?.[0]?.identifiers?.[0]?.identifier,
      email
    };
  } catch (error) {
    logger.error('Get LinkedIn profile error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get user's organizations (companies)
 */
const getOrganizations = async (accessToken) => {
  try {
    const client = createClient(accessToken);
    
    // Get organization access control
    const response = await client.get('/organizationalEntityAcls', {
      params: {
        q: 'roleAssignee',
        projection: '(elements*(organizationalTarget,role))'
      }
    });

    const orgIds = response.data.elements
      ?.filter(e => e.role === 'ADMINISTRATOR')
      ?.map(e => e.organizationalTarget?.split(':').pop()) || [];

    // Get organization details
    const organizations = [];
    for (const orgId of orgIds) {
      try {
        const orgResponse = await client.get(`/organizations/${orgId}`, {
          params: { projection: '(id,name,vanityName,logoV2,description)' }
        });
        organizations.push(orgResponse.data);
      } catch (e) {
        logger.warn(`Could not fetch org ${orgId}`);
      }
    }

    return organizations;
  } catch (error) {
    logger.error('Get organizations error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * =====================
 * POSTS & SHARES
 * =====================
 */

/**
 * Create a share (post)
 */
const createPost = async (accessToken, authorUrn, content, options = {}) => {
  try {
    const client = createClient(accessToken);

    const postData = {
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: content
          },
          shareMediaCategory: 'NONE'
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': options.visibility || 'PUBLIC'
      }
    };

    // Add article if URL provided
    if (options.articleUrl) {
      postData.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory = 'ARTICLE';
      postData.specificContent['com.linkedin.ugc.ShareContent'].media = [{
        status: 'READY',
        originalUrl: options.articleUrl,
        title: { text: options.articleTitle || '' },
        description: { text: options.articleDescription || '' }
      }];
    }

    // Add image if provided
    if (options.imageUrn) {
      postData.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory = 'IMAGE';
      postData.specificContent['com.linkedin.ugc.ShareContent'].media = [{
        status: 'READY',
        media: options.imageUrn
      }];
    }

    const response = await client.post('/ugcPosts', postData);
    return response.data;
  } catch (error) {
    logger.error('Create LinkedIn post error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Delete a post
 */
const deletePost = async (accessToken, postUrn) => {
  try {
    const client = createClient(accessToken);
    await client.delete(`/ugcPosts/${encodeURIComponent(postUrn)}`);
    return { success: true };
  } catch (error) {
    logger.error('Delete LinkedIn post error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get organization posts
 */
const getOrganizationPosts = async (accessToken, organizationId, count = 25) => {
  try {
    const client = createClient(accessToken);
    const response = await client.get('/ugcPosts', {
      params: {
        q: 'authors',
        authors: `List(urn:li:organization:${organizationId})`,
        count
      }
    });
    return response.data.elements;
  } catch (error) {
    logger.error('Get organization posts error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get user's posts
 */
const getUserPosts = async (accessToken, personId, count = 25) => {
  try {
    const client = createClient(accessToken);
    const response = await client.get('/ugcPosts', {
      params: {
        q: 'authors',
        authors: `List(urn:li:person:${personId})`,
        count
      }
    });
    return response.data.elements;
  } catch (error) {
    logger.error('Get user posts error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * =====================
 * MEDIA UPLOAD
 * =====================
 */

/**
 * Register image upload
 */
const registerImageUpload = async (accessToken, authorUrn) => {
  try {
    const client = createClient(accessToken);
    const response = await client.post('/assets?action=registerUpload', {
      registerUploadRequest: {
        recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
        owner: authorUrn,
        serviceRelationships: [{
          relationshipType: 'OWNER',
          identifier: 'urn:li:userGeneratedContent'
        }]
      }
    });

    return {
      uploadUrl: response.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl,
      asset: response.data.value.asset
    };
  } catch (error) {
    logger.error('Register image upload error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Upload image to LinkedIn
 */
const uploadImage = async (uploadUrl, imageBuffer, accessToken) => {
  try {
    await axios.put(uploadUrl, imageBuffer, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/octet-stream'
      }
    });
    return { success: true };
  } catch (error) {
    logger.error('Upload image error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * =====================
 * SOCIAL ACTIONS
 * =====================
 */

/**
 * Like a post
 */
const likePost = async (accessToken, actorUrn, postUrn) => {
  try {
    const client = createClient(accessToken);
    const response = await client.post('/socialActions/' + encodeURIComponent(postUrn) + '/likes', {
      actor: actorUrn
    });
    return response.data;
  } catch (error) {
    logger.error('Like post error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Unlike a post
 */
const unlikePost = async (accessToken, actorUrn, postUrn) => {
  try {
    const client = createClient(accessToken);
    await client.delete('/socialActions/' + encodeURIComponent(postUrn) + '/likes/' + encodeURIComponent(actorUrn));
    return { success: true };
  } catch (error) {
    logger.error('Unlike post error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get post comments
 */
const getPostComments = async (accessToken, postUrn, count = 50) => {
  try {
    const client = createClient(accessToken);
    const response = await client.get('/socialActions/' + encodeURIComponent(postUrn) + '/comments', {
      params: { count }
    });
    return response.data.elements;
  } catch (error) {
    logger.error('Get post comments error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Comment on a post
 */
const commentOnPost = async (accessToken, actorUrn, postUrn, message) => {
  try {
    const client = createClient(accessToken);
    const response = await client.post('/socialActions/' + encodeURIComponent(postUrn) + '/comments', {
      actor: actorUrn,
      message: { text: message }
    });
    return response.data;
  } catch (error) {
    logger.error('Comment on post error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Delete a comment
 */
const deleteComment = async (accessToken, postUrn, commentUrn) => {
  try {
    const client = createClient(accessToken);
    await client.delete('/socialActions/' + encodeURIComponent(postUrn) + '/comments/' + encodeURIComponent(commentUrn));
    return { success: true };
  } catch (error) {
    logger.error('Delete comment error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * =====================
 * ANALYTICS
 * =====================
 */

/**
 * Get organization follower statistics
 */
const getFollowerStatistics = async (accessToken, organizationId) => {
  try {
    const client = createClient(accessToken);
    const response = await client.get('/organizationalEntityFollowerStatistics', {
      params: {
        q: 'organizationalEntity',
        organizationalEntity: `urn:li:organization:${organizationId}`
      }
    });
    return response.data.elements?.[0];
  } catch (error) {
    logger.error('Get follower statistics error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get share statistics
 */
const getShareStatistics = async (accessToken, shareUrn) => {
  try {
    const client = createClient(accessToken);
    const response = await client.get('/socialActions/' + encodeURIComponent(shareUrn), {
      params: {
        projection: '(likesSummary,commentsSummary)'
      }
    });
    return response.data;
  } catch (error) {
    logger.error('Get share statistics error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get organization page statistics
 */
const getPageStatistics = async (accessToken, organizationId, startDate, endDate) => {
  try {
    const client = createClient(accessToken);
    const response = await client.get('/organizationPageStatistics', {
      params: {
        q: 'organization',
        organization: `urn:li:organization:${organizationId}`,
        'timeIntervals.timeGranularityType': 'DAY',
        'timeIntervals.timeRange.start': startDate,
        'timeIntervals.timeRange.end': endDate
      }
    });
    return response.data.elements;
  } catch (error) {
    logger.error('Get page statistics error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * =====================
 * MESSAGING
 * =====================
 */

/**
 * Get conversations
 */
const getConversations = async (accessToken) => {
  try {
    const client = createClient(accessToken);
    const response = await client.get('/messaging/conversations');
    return response.data.elements;
  } catch (error) {
    logger.error('Get conversations error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get conversation messages
 */
const getConversationMessages = async (accessToken, conversationId) => {
  try {
    const client = createClient(accessToken);
    const response = await client.get(`/messaging/conversations/${conversationId}/events`);
    return response.data.elements;
  } catch (error) {
    logger.error('Get conversation messages error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Send message
 */
const sendMessage = async (accessToken, conversationId, message) => {
  try {
    const client = createClient(accessToken);
    const response = await client.post(`/messaging/conversations/${conversationId}/events`, {
      eventCreate: {
        value: {
          'com.linkedin.voyager.messaging.create.MessageCreate': {
            body: message,
            attachments: []
          }
        }
      }
    });
    return response.data;
  } catch (error) {
    logger.error('Send message error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * =====================
 * CONNECTIONS
 * =====================
 */

/**
 * Get connections
 */
const getConnections = async (accessToken, start = 0, count = 50) => {
  try {
    const client = createClient(accessToken);
    const response = await client.get('/connections', {
      params: {
        q: 'viewer',
        start,
        count,
        projection: '(elements*(to~(id,firstName,lastName,profilePicture)))'
      }
    });
    return response.data.elements;
  } catch (error) {
    logger.error('Get connections error:', error.response?.data || error.message);
    throw error;
  }
};

module.exports = {
  // Profile
  getProfile,
  getOrganizations,

  // Posts
  createPost,
  deletePost,
  getOrganizationPosts,
  getUserPosts,

  // Media
  registerImageUpload,
  uploadImage,

  // Social Actions
  likePost,
  unlikePost,
  getPostComments,
  commentOnPost,
  deleteComment,

  // Analytics
  getFollowerStatistics,
  getShareStatistics,
  getPageStatistics,

  // Messaging
  getConversations,
  getConversationMessages,
  sendMessage,

  // Connections
  getConnections
};
