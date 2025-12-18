const { SocialMediaAccount, SocialMediaPost, SocialMediaComment } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

/**
 * Get all connected social media accounts
 * GET /api/social-media/accounts
 */
const getAccounts = async (req, res) => {
  try {
    const accounts = await SocialMediaAccount.findAll({
      where: { organization_id: req.tenancy.organization_id },
      order: [['created_at', 'DESC']],
    });

    res.json({
      success: true,
      accounts,
    });
  } catch (error) {
    logger.error('Get social accounts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch social media accounts',
      error: error.message,
    });
  }
};

/**
 * Connect a new social media account
 * POST /api/social-media/accounts/connect
 */
const connectAccount = async (req, res) => {
  try {
    const { platform, access_token, page_id, account_name } = req.body;

    if (!platform || !access_token) {
      return res.status(400).json({
        success: false,
        message: 'Platform and access token are required',
      });
    }

    // Check if account already exists
    const existing = await SocialMediaAccount.findOne({
      where: {
        organization_id: req.tenancy.organization_id,
        platform,
        page_id: page_id || null,
      },
    });

    if (existing) {
      // Update existing account
      await existing.update({
        access_token,
        account_name,
        is_active: true,
      });

      return res.json({
        success: true,
        message: 'Account reconnected successfully',
        account: existing,
      });
    }

    // Create new account
    const account = await SocialMediaAccount.create({
      organization_id: req.tenancy.organization_id,
      platform,
      access_token,
      page_id,
      account_name,
      is_active: true,
    });

    logger.info(`Social media account connected: ${platform} for org ${req.tenancy.organization_id}`);

    res.status(201).json({
      success: true,
      message: 'Account connected successfully',
      account,
    });
  } catch (error) {
    logger.error('Connect social account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to connect social media account',
      error: error.message,
    });
  }
};

/**
 * Disconnect a social media account
 * DELETE /api/social-media/accounts/:id
 */
const disconnectAccount = async (req, res) => {
  try {
    const { id } = req.params;

    const account = await SocialMediaAccount.findOne({
      where: {
        id,
        organization_id: req.tenancy.organization_id,
      },
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found',
      });
    }

    await account.destroy();

    logger.info(`Social media account disconnected: ${account.platform} for org ${req.tenancy.organization_id}`);

    res.json({
      success: true,
      message: 'Account disconnected successfully',
    });
  } catch (error) {
    logger.error('Disconnect social account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disconnect account',
      error: error.message,
    });
  }
};

/**
 * Get all social media posts
 * GET /api/social-media/posts
 */
const getPosts = async (req, res) => {
  try {
    const { page = 1, limit = 50, platform, status } = req.query;
    const offset = (page - 1) * limit;

    const where = { organization_id: req.tenancy.organization_id };

    if (platform) where.platform = platform;
    if (status) where.status = status;

    const { rows: posts, count } = await SocialMediaPost.findAndCountAll({
      where,
      include: [
        {
          model: SocialMediaAccount,
          attributes: ['id', 'platform', 'account_name'],
        },
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      posts,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    logger.error('Get social posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch posts',
      error: error.message,
    });
  }
};

/**
 * Create and publish a social media post
 * POST /api/social-media/posts
 */
const createPost = async (req, res) => {
  try {
    const { content, platforms, media_url, media_type = 'none' } = req.body;

    if (!content || !platforms || platforms.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Content and at least one platform are required',
      });
    }

    const createdPosts = [];

    // Create post for each platform
    for (const platform of platforms) {
      const account = await SocialMediaAccount.findOne({
        where: {
          organization_id: req.tenancy.organization_id,
          platform,
          is_active: true,
        },
      });

      if (!account) {
        logger.warn(`No active account for platform: ${platform}`);
        continue;
      }

      const post = await SocialMediaPost.create({
        organization_id: req.tenancy.organization_id,
        account_id: account.id,
        platform,
        content,
        media_url,
        media_type,
        status: 'published',
        published_at: new Date(),
      });

      // In production, integrate with actual social media APIs here
      // For now, we'll simulate posting

      createdPosts.push(post);
    }

    logger.info(`Created ${createdPosts.length} social media posts for org ${req.tenancy.organization_id}`);

    res.status(201).json({
      success: true,
      message: `Post published to ${createdPosts.length} platform(s)`,
      posts: createdPosts,
    });
  } catch (error) {
    logger.error('Create social post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create post',
      error: error.message,
    });
  }
};

/**
 * Schedule a social media post
 * POST /api/social-media/posts/schedule
 */
const schedulePost = async (req, res) => {
  try {
    const { content, platforms, media_url, media_type = 'none', scheduled_at } = req.body;

    if (!content || !platforms || platforms.length === 0 || !scheduled_at) {
      return res.status(400).json({
        success: false,
        message: 'Content, platforms, and schedule time are required',
      });
    }

    const scheduledPosts = [];

    for (const platform of platforms) {
      const account = await SocialMediaAccount.findOne({
        where: {
          organization_id: req.tenancy.organization_id,
          platform,
          is_active: true,
        },
      });

      if (!account) continue;

      const post = await SocialMediaPost.create({
        organization_id: req.tenancy.organization_id,
        account_id: account.id,
        platform,
        content,
        media_url,
        media_type,
        status: 'scheduled',
        scheduled_at: new Date(scheduled_at),
      });

      scheduledPosts.push(post);
    }

    logger.info(`Scheduled ${scheduledPosts.length} social media posts for org ${req.tenancy.organization_id}`);

    res.status(201).json({
      success: true,
      message: `Post scheduled for ${scheduledPosts.length} platform(s)`,
      posts: scheduledPosts,
    });
  } catch (error) {
    logger.error('Schedule social post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule post',
      error: error.message,
    });
  }
};

/**
 * Get comments for a specific post
 * GET /api/social-media/posts/:id/comments
 */
const getComments = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await SocialMediaPost.findOne({
      where: {
        id,
        organization_id: req.tenancy.organization_id,
      },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const comments = await SocialMediaComment.findAll({
      where: {
        post_id: id,
        parent_id: null, // Only top-level comments
      },
      include: [
        {
          model: SocialMediaComment,
          as: 'Replies',
          separate: true,
          order: [['created_at', 'ASC']],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    res.json({
      success: true,
      comments,
    });
  } catch (error) {
    logger.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comments',
      error: error.message,
    });
  }
};

/**
 * Reply to a comment
 * POST /api/social-media/comments/:id/reply
 */
const replyToComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    const comment = await SocialMediaComment.findOne({
      where: {
        id,
        organization_id: req.tenancy.organization_id,
      },
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    // Create reply
    const reply = await SocialMediaComment.create({
      organization_id: req.tenancy.organization_id,
      post_id: comment.post_id,
      author_name: 'Your Business', // Should be from user profile
      message,
      parent_id: comment.id,
      is_reply: true,
    });

    // In production, post reply via social media API

    logger.info(`Reply posted to comment ${id} for org ${req.tenancy.organization_id}`);

    res.status(201).json({
      success: true,
      message: 'Reply posted successfully',
      reply,
    });
  } catch (error) {
    logger.error('Reply to comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to post reply',
      error: error.message,
    });
  }
};

/**
 * Get social media analytics
 * GET /api/social-media/analytics
 */
const getAnalytics = async (req, res) => {
  try {
    const { period = '30days' } = req.query;

    // Calculate date range
    const daysMap = {
      '7days': 7,
      '30days': 30,
      '90days': 90,
    };
    const days = daysMap[period] || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get posts analytics
    const posts = await SocialMediaPost.findAll({
      where: {
        organization_id: req.tenancy.organization_id,
        created_at: { [Op.gte]: startDate },
        status: 'published',
      },
    });

    const analytics = {
      total_posts: posts.length,
      total_reach: posts.reduce((sum, p) => sum + (p.views_count || 0), 0),
      total_engagement: posts.reduce((sum, p) => sum + (p.likes_count || 0) + (p.comments_count || 0) + (p.shares_count || 0), 0),
      new_followers: 0, // Would come from API
      avg_engagement_rate: posts.length > 0 
        ? (posts.reduce((sum, p) => sum + (p.engagement_rate || 0), 0) / posts.length).toFixed(2)
        : 0,
    };

    res.json({
      success: true,
      analytics,
      period,
    });
  } catch (error) {
    logger.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error.message,
    });
  }
};

module.exports = {
  getAccounts,
  connectAccount,
  disconnectAccount,
  getPosts,
  createPost,
  schedulePost,
  getComments,
  replyToComment,
  getAnalytics,
};
