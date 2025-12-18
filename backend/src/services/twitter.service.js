/**
 * Twitter/X API v2 Service
 * Handles Twitter integration for CRM
 */

const axios = require('axios');
const crypto = require('crypto');
const logger = require('../utils/logger');

const TWITTER_API_BASE = 'https://api.twitter.com/2';

/**
 * Create Twitter API client
 */
const createClient = (accessToken) => {
  return axios.create({
    baseURL: TWITTER_API_BASE,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
};

/**
 * =====================
 * USER MANAGEMENT
 * =====================
 */

/**
 * Get authenticated user
 */
const getMe = async (accessToken) => {
  try {
    const client = createClient(accessToken);
    const response = await client.get('/users/me', {
      params: {
        'user.fields': 'id,name,username,profile_image_url,description,public_metrics,verified,created_at'
      }
    });
    return response.data.data;
  } catch (error) {
    logger.error('Get Twitter user error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get user by username
 */
const getUserByUsername = async (accessToken, username) => {
  try {
    const client = createClient(accessToken);
    const response = await client.get(`/users/by/username/${username}`, {
      params: {
        'user.fields': 'id,name,username,profile_image_url,description,public_metrics,verified'
      }
    });
    return response.data.data;
  } catch (error) {
    logger.error('Get user by username error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get user followers
 */
const getFollowers = async (accessToken, userId, paginationToken, maxResults = 100) => {
  try {
    const client = createClient(accessToken);
    const params = {
      'user.fields': 'id,name,username,profile_image_url,public_metrics',
      max_results: maxResults
    };
    if (paginationToken) params.pagination_token = paginationToken;

    const response = await client.get(`/users/${userId}/followers`, { params });
    return {
      users: response.data.data,
      nextToken: response.data.meta?.next_token
    };
  } catch (error) {
    logger.error('Get followers error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get user following
 */
const getFollowing = async (accessToken, userId, paginationToken, maxResults = 100) => {
  try {
    const client = createClient(accessToken);
    const params = {
      'user.fields': 'id,name,username,profile_image_url,public_metrics',
      max_results: maxResults
    };
    if (paginationToken) params.pagination_token = paginationToken;

    const response = await client.get(`/users/${userId}/following`, { params });
    return {
      users: response.data.data,
      nextToken: response.data.meta?.next_token
    };
  } catch (error) {
    logger.error('Get following error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * =====================
 * TWEETS
 * =====================
 */

/**
 * Create tweet
 */
const createTweet = async (accessToken, text, options = {}) => {
  try {
    const client = createClient(accessToken);
    const body = { text };

    if (options.replyTo) {
      body.reply = { in_reply_to_tweet_id: options.replyTo };
    }
    if (options.quoteTweetId) {
      body.quote_tweet_id = options.quoteTweetId;
    }
    if (options.mediaIds) {
      body.media = { media_ids: options.mediaIds };
    }
    if (options.poll) {
      body.poll = {
        options: options.poll.options,
        duration_minutes: options.poll.durationMinutes
      };
    }

    const response = await client.post('/tweets', body);
    return response.data.data;
  } catch (error) {
    logger.error('Create tweet error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Delete tweet
 */
const deleteTweet = async (accessToken, tweetId) => {
  try {
    const client = createClient(accessToken);
    const response = await client.delete(`/tweets/${tweetId}`);
    return response.data.data;
  } catch (error) {
    logger.error('Delete tweet error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get tweet by ID
 */
const getTweet = async (accessToken, tweetId) => {
  try {
    const client = createClient(accessToken);
    const response = await client.get(`/tweets/${tweetId}`, {
      params: {
        'tweet.fields': 'id,text,created_at,public_metrics,entities,attachments,conversation_id',
        'expansions': 'author_id,attachments.media_keys',
        'user.fields': 'id,name,username,profile_image_url',
        'media.fields': 'url,preview_image_url,type'
      }
    });
    return {
      tweet: response.data.data,
      includes: response.data.includes
    };
  } catch (error) {
    logger.error('Get tweet error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get user tweets
 */
const getUserTweets = async (accessToken, userId, paginationToken, maxResults = 10) => {
  try {
    const client = createClient(accessToken);
    const params = {
      'tweet.fields': 'id,text,created_at,public_metrics,entities',
      max_results: maxResults
    };
    if (paginationToken) params.pagination_token = paginationToken;

    const response = await client.get(`/users/${userId}/tweets`, { params });
    return {
      tweets: response.data.data,
      nextToken: response.data.meta?.next_token
    };
  } catch (error) {
    logger.error('Get user tweets error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get tweet replies/conversation
 */
const getTweetReplies = async (accessToken, conversationId, paginationToken, maxResults = 100) => {
  try {
    const client = createClient(accessToken);
    const params = {
      query: `conversation_id:${conversationId}`,
      'tweet.fields': 'id,text,created_at,public_metrics,in_reply_to_user_id',
      'expansions': 'author_id',
      'user.fields': 'id,name,username,profile_image_url',
      max_results: maxResults
    };
    if (paginationToken) params.next_token = paginationToken;

    const response = await client.get('/tweets/search/recent', { params });
    return {
      tweets: response.data.data,
      includes: response.data.includes,
      nextToken: response.data.meta?.next_token
    };
  } catch (error) {
    logger.error('Get tweet replies error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * =====================
 * ENGAGEMENT
 * =====================
 */

/**
 * Like tweet
 */
const likeTweet = async (accessToken, userId, tweetId) => {
  try {
    const client = createClient(accessToken);
    const response = await client.post(`/users/${userId}/likes`, {
      tweet_id: tweetId
    });
    return response.data.data;
  } catch (error) {
    logger.error('Like tweet error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Unlike tweet
 */
const unlikeTweet = async (accessToken, userId, tweetId) => {
  try {
    const client = createClient(accessToken);
    const response = await client.delete(`/users/${userId}/likes/${tweetId}`);
    return response.data.data;
  } catch (error) {
    logger.error('Unlike tweet error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Retweet
 */
const retweet = async (accessToken, userId, tweetId) => {
  try {
    const client = createClient(accessToken);
    const response = await client.post(`/users/${userId}/retweets`, {
      tweet_id: tweetId
    });
    return response.data.data;
  } catch (error) {
    logger.error('Retweet error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Undo retweet
 */
const undoRetweet = async (accessToken, userId, tweetId) => {
  try {
    const client = createClient(accessToken);
    const response = await client.delete(`/users/${userId}/retweets/${tweetId}`);
    return response.data.data;
  } catch (error) {
    logger.error('Undo retweet error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * =====================
 * DIRECT MESSAGES
 * =====================
 */

/**
 * Get DM conversations
 */
const getDMConversations = async (accessToken, paginationToken) => {
  try {
    const client = createClient(accessToken);
    const params = {
      'dm_event.fields': 'id,text,created_at,sender_id,dm_conversation_id,attachments',
      'expansions': 'sender_id,participant_ids',
      'user.fields': 'id,name,username,profile_image_url'
    };
    if (paginationToken) params.pagination_token = paginationToken;

    const response = await client.get('/dm_conversations', { params });
    return {
      conversations: response.data.data,
      includes: response.data.includes,
      nextToken: response.data.meta?.next_token
    };
  } catch (error) {
    logger.error('Get DM conversations error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get DM events (messages)
 */
const getDMEvents = async (accessToken, conversationId, paginationToken) => {
  try {
    const client = createClient(accessToken);
    const params = {
      'dm_event.fields': 'id,text,created_at,sender_id,attachments,referenced_tweets',
      'expansions': 'sender_id',
      'user.fields': 'id,name,username,profile_image_url'
    };
    if (paginationToken) params.pagination_token = paginationToken;

    const response = await client.get(`/dm_conversations/${conversationId}/dm_events`, { params });
    return {
      events: response.data.data,
      includes: response.data.includes,
      nextToken: response.data.meta?.next_token
    };
  } catch (error) {
    logger.error('Get DM events error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Send DM
 */
const sendDM = async (accessToken, conversationId, text, attachments) => {
  try {
    const client = createClient(accessToken);
    const body = { text };
    if (attachments) body.attachments = attachments;

    const response = await client.post(`/dm_conversations/${conversationId}/messages`, body);
    return response.data.data;
  } catch (error) {
    logger.error('Send DM error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Create new DM conversation
 */
const createDMConversation = async (accessToken, participantId, text) => {
  try {
    const client = createClient(accessToken);
    const response = await client.post('/dm_conversations', {
      conversation_type: 'one_to_one',
      participant_id: participantId,
      message: { text }
    });
    return response.data.data;
  } catch (error) {
    logger.error('Create DM conversation error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * =====================
 * SEARCH
 * =====================
 */

/**
 * Search recent tweets
 */
const searchRecentTweets = async (accessToken, query, paginationToken, maxResults = 10) => {
  try {
    const client = createClient(accessToken);
    const params = {
      query,
      'tweet.fields': 'id,text,created_at,public_metrics,entities',
      'expansions': 'author_id',
      'user.fields': 'id,name,username,profile_image_url',
      max_results: maxResults
    };
    if (paginationToken) params.next_token = paginationToken;

    const response = await client.get('/tweets/search/recent', { params });
    return {
      tweets: response.data.data,
      includes: response.data.includes,
      nextToken: response.data.meta?.next_token
    };
  } catch (error) {
    logger.error('Search tweets error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * =====================
 * MENTIONS & NOTIFICATIONS
 * =====================
 */

/**
 * Get user mentions
 */
const getMentions = async (accessToken, userId, sinceId, paginationToken, maxResults = 10) => {
  try {
    const client = createClient(accessToken);
    const params = {
      'tweet.fields': 'id,text,created_at,public_metrics,conversation_id',
      'expansions': 'author_id',
      'user.fields': 'id,name,username,profile_image_url',
      max_results: maxResults
    };
    if (sinceId) params.since_id = sinceId;
    if (paginationToken) params.pagination_token = paginationToken;

    const response = await client.get(`/users/${userId}/mentions`, { params });
    return {
      tweets: response.data.data,
      includes: response.data.includes,
      nextToken: response.data.meta?.next_token,
      newestId: response.data.meta?.newest_id
    };
  } catch (error) {
    logger.error('Get mentions error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * =====================
 * MEDIA UPLOAD
 * =====================
 */

/**
 * Upload media (uses v1.1 endpoint)
 * Note: Twitter API v2 doesn't have media upload yet, requires v1.1
 */
const uploadMedia = async (accessToken, mediaBuffer, mediaType) => {
  try {
    const response = await axios.post('https://upload.twitter.com/1.1/media/upload.json', {
      media_data: mediaBuffer.toString('base64')
    }, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    return response.data.media_id_string;
  } catch (error) {
    logger.error('Upload media error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * =====================
 * LISTS
 * =====================
 */

/**
 * Get user lists
 */
const getUserLists = async (accessToken, userId) => {
  try {
    const client = createClient(accessToken);
    const response = await client.get(`/users/${userId}/owned_lists`, {
      params: {
        'list.fields': 'id,name,description,member_count,follower_count,created_at,private'
      }
    });
    return response.data.data;
  } catch (error) {
    logger.error('Get user lists error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get list members
 */
const getListMembers = async (accessToken, listId, paginationToken) => {
  try {
    const client = createClient(accessToken);
    const params = {
      'user.fields': 'id,name,username,profile_image_url,description,public_metrics'
    };
    if (paginationToken) params.pagination_token = paginationToken;

    const response = await client.get(`/lists/${listId}/members`, { params });
    return {
      members: response.data.data,
      nextToken: response.data.meta?.next_token
    };
  } catch (error) {
    logger.error('Get list members error:', error.response?.data || error.message);
    throw error;
  }
};

module.exports = {
  // Users
  getMe,
  getUserByUsername,
  getFollowers,
  getFollowing,

  // Tweets
  createTweet,
  deleteTweet,
  getTweet,
  getUserTweets,
  getTweetReplies,

  // Engagement
  likeTweet,
  unlikeTweet,
  retweet,
  undoRetweet,

  // Direct Messages
  getDMConversations,
  getDMEvents,
  sendDM,
  createDMConversation,

  // Search
  searchRecentTweets,

  // Mentions
  getMentions,

  // Media
  uploadMedia,

  // Lists
  getUserLists,
  getListMembers
};
