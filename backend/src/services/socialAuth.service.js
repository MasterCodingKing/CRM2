/**
 * Social Media OAuth Service
 * Handles OAuth flows for Facebook, Google, Twitter, LinkedIn
 */

const axios = require('axios');
const logger = require('../utils/logger');

// OAuth Configuration
const OAUTH_CONFIG = {
  facebook: {
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    userInfoUrl: 'https://graph.facebook.com/v18.0/me',
    scopes: [
      'email',
      'public_profile',
      'pages_show_list',
      'pages_read_engagement',
      'pages_manage_metadata',
      'pages_messaging',
      'leads_retrieval',
      'ads_read',
      'business_management'
    ]
  },
  instagram: {
    authUrl: 'https://api.instagram.com/oauth/authorize',
    tokenUrl: 'https://api.instagram.com/oauth/access_token',
    userInfoUrl: 'https://graph.instagram.com/me',
    scopes: [
      'user_profile',
      'user_media',
      'instagram_basic',
      'instagram_manage_comments',
      'instagram_manage_messages'
    ]
  },
  twitter: {
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    userInfoUrl: 'https://api.twitter.com/2/users/me',
    scopes: [
      'tweet.read',
      'tweet.write',
      'users.read',
      'dm.read',
      'dm.write',
      'offline.access'
    ]
  },
  linkedin: {
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    userInfoUrl: 'https://api.linkedin.com/v2/me',
    scopes: [
      'r_liteprofile',
      'r_emailaddress',
      'w_member_social',
      'r_organization_social',
      'w_organization_social',
      'rw_organization_admin'
    ]
  },
  google: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    scopes: [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/yt-analytics.readonly'
    ]
  }
};

/**
 * Generate OAuth authorization URL
 */
const getAuthorizationUrl = (platform, redirectUri, state = null) => {
  const config = OAUTH_CONFIG[platform];
  if (!config) {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  const clientId = process.env[`${platform.toUpperCase()}_CLIENT_ID`];
  if (!clientId) {
    throw new Error(`Missing client ID for ${platform}`);
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: config.scopes.join(' '),
    response_type: 'code',
    state: state || generateState()
  });

  // Platform-specific parameters
  if (platform === 'facebook') {
    params.append('auth_type', 'rerequest');
  }
  if (platform === 'twitter') {
    params.append('code_challenge', generateCodeChallenge());
    params.append('code_challenge_method', 'S256');
  }

  return `${config.authUrl}?${params.toString()}`;
};

/**
 * Exchange authorization code for access token
 */
const exchangeCodeForToken = async (platform, code, redirectUri) => {
  const config = OAUTH_CONFIG[platform];
  if (!config) {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  const clientId = process.env[`${platform.toUpperCase()}_CLIENT_ID`];
  const clientSecret = process.env[`${platform.toUpperCase()}_CLIENT_SECRET`];

  if (!clientId || !clientSecret) {
    throw new Error(`Missing credentials for ${platform}`);
  }

  try {
    const params = {
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    };

    let response;
    
    if (platform === 'linkedin') {
      // LinkedIn uses form-urlencoded
      response = await axios.post(config.tokenUrl, new URLSearchParams(params), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
    } else {
      response = await axios.get(config.tokenUrl, { params });
    }

    const tokenData = response.data;

    return {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || null,
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type || 'Bearer',
      scope: tokenData.scope
    };
  } catch (error) {
    logger.error(`OAuth token exchange error for ${platform}:`, error.response?.data || error.message);
    throw new Error(`Failed to exchange code for token: ${error.message}`);
  }
};

/**
 * Get user info from platform
 */
const getUserInfo = async (platform, accessToken) => {
  const config = OAUTH_CONFIG[platform];
  if (!config) {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  try {
    let response;
    
    if (platform === 'facebook') {
      response = await axios.get(config.userInfoUrl, {
        params: {
          fields: 'id,name,email,picture',
          access_token: accessToken
        }
      });
    } else {
      response = await axios.get(config.userInfoUrl, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
    }

    return normalizeUserInfo(platform, response.data);
  } catch (error) {
    logger.error(`Get user info error for ${platform}:`, error.response?.data || error.message);
    throw new Error(`Failed to get user info: ${error.message}`);
  }
};

/**
 * Refresh access token
 */
const refreshAccessToken = async (platform, refreshToken) => {
  const config = OAUTH_CONFIG[platform];
  const clientId = process.env[`${platform.toUpperCase()}_CLIENT_ID`];
  const clientSecret = process.env[`${platform.toUpperCase()}_CLIENT_SECRET`];

  try {
    const response = await axios.post(config.tokenUrl, {
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    });

    return {
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token || refreshToken,
      expires_in: response.data.expires_in
    };
  } catch (error) {
    logger.error(`Token refresh error for ${platform}:`, error.response?.data || error.message);
    throw new Error(`Failed to refresh token: ${error.message}`);
  }
};

/**
 * Normalize user info across platforms
 */
const normalizeUserInfo = (platform, data) => {
  switch (platform) {
    case 'facebook':
      return {
        id: data.id,
        name: data.name,
        email: data.email,
        picture: data.picture?.data?.url,
        platform
      };
    case 'instagram':
      return {
        id: data.id,
        name: data.username,
        email: null,
        picture: null,
        platform
      };
    case 'twitter':
      return {
        id: data.data?.id,
        name: data.data?.name,
        email: null,
        picture: data.data?.profile_image_url,
        platform
      };
    case 'linkedin':
      return {
        id: data.id,
        name: `${data.localizedFirstName} ${data.localizedLastName}`,
        email: null,
        picture: data.profilePicture?.['displayImage~']?.elements?.[0]?.identifiers?.[0]?.identifier,
        platform
      };
    case 'google':
      return {
        id: data.id,
        name: data.name,
        email: data.email,
        picture: data.picture,
        platform
      };
    default:
      return data;
  }
};

/**
 * Get Facebook Pages for connected account
 */
const getFacebookPages = async (accessToken) => {
  try {
    const response = await axios.get('https://graph.facebook.com/v18.0/me/accounts', {
      params: {
        access_token: accessToken,
        fields: 'id,name,access_token,category,picture,fan_count'
      }
    });

    return response.data.data.map(page => ({
      id: page.id,
      name: page.name,
      access_token: page.access_token,
      category: page.category,
      picture: page.picture?.data?.url,
      followers: page.fan_count
    }));
  } catch (error) {
    logger.error('Get Facebook pages error:', error.response?.data || error.message);
    throw new Error('Failed to get Facebook pages');
  }
};

/**
 * Get Instagram Business Accounts
 */
const getInstagramAccounts = async (accessToken) => {
  try {
    // First get Facebook pages
    const pages = await getFacebookPages(accessToken);
    const igAccounts = [];

    // For each page, check for connected Instagram account
    for (const page of pages) {
      try {
        const response = await axios.get(`https://graph.facebook.com/v18.0/${page.id}`, {
          params: {
            access_token: page.access_token,
            fields: 'instagram_business_account{id,username,profile_picture_url,followers_count}'
          }
        });

        if (response.data.instagram_business_account) {
          igAccounts.push({
            ...response.data.instagram_business_account,
            facebook_page_id: page.id,
            facebook_page_name: page.name
          });
        }
      } catch (e) {
        // Page may not have Instagram account
      }
    }

    return igAccounts;
  } catch (error) {
    logger.error('Get Instagram accounts error:', error.response?.data || error.message);
    throw new Error('Failed to get Instagram accounts');
  }
};

/**
 * Get LinkedIn Organization Pages
 */
const getLinkedInOrganizations = async (accessToken) => {
  try {
    // Get organizations where user is an admin
    const response = await axios.get('https://api.linkedin.com/v2/organizationAcls', {
      params: {
        q: 'roleAssignee',
        role: 'ADMINISTRATOR',
        projection: '(elements*(organization~(id,localizedName,vanityName,logoV2(original~:playableStreams))))'
      },
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    return response.data.elements?.map(item => ({
      id: item.organization,
      name: item['organization~']?.localizedName,
      vanityName: item['organization~']?.vanityName,
      logo: item['organization~']?.logoV2?.['original~']?.elements?.[0]?.identifiers?.[0]?.identifier
    })) || [];
  } catch (error) {
    logger.error('Get LinkedIn organizations error:', error.response?.data || error.message);
    throw new Error('Failed to get LinkedIn organizations');
  }
};

// Helper functions
const generateState = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

const generateCodeChallenge = () => {
  // Simplified - in production use proper PKCE
  return Math.random().toString(36).substring(2, 50);
};

module.exports = {
  OAUTH_CONFIG,
  getAuthorizationUrl,
  exchangeCodeForToken,
  getUserInfo,
  refreshAccessToken,
  getFacebookPages,
  getInstagramAccounts,
  getLinkedInOrganizations
};
