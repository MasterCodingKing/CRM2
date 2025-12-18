const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth.middleware');
const { ensureTenancy } = require('../middlewares/tenancy.middleware');
const { requirePermission } = require('../middlewares/rbac.middleware');

// Import both controllers
const socialMediaController = require('../controllers/socialMedia.controller');
const socialIntegrationController = require('../controllers/socialIntegration.controller');

/**
 * =====================
 * PUBLIC WEBHOOK ROUTES (No auth required)
 * =====================
 */

// Facebook webhook verification & handler
router.get('/webhooks/facebook', socialIntegrationController.verifyFacebookWebhook);
router.post('/webhooks/facebook', socialIntegrationController.handleFacebookWebhook);

/**
 * =====================
 * OAUTH ROUTES (Auth required for generating URL, callback is public)
 * =====================
 */

// OAuth callback (no auth - receives callback from OAuth provider)
router.get('/auth/:platform/callback', socialIntegrationController.handleOAuthCallback);

/**
 * =====================
 * AUTHENTICATED ROUTES
 * =====================
 */

// Apply authentication middleware
router.use(authenticateToken);
router.use(ensureTenancy);

/**
 * OAuth
 */
router.get('/auth/:platform', 
  requirePermission('social_media.connect'), 
  socialIntegrationController.getAuthUrl
);

/**
 * =====================
 * ACCOUNTS
 * =====================
 */

// Get all connected accounts
router.get('/accounts', 
  requirePermission('social_media.read'), 
  socialMediaController.getAccounts
);

// Connect account (manual token)
router.post('/accounts/connect', 
  requirePermission('social_media.connect'), 
  socialMediaController.connectAccount
);

// Disconnect account
router.delete('/accounts/:id', 
  requirePermission('social_media.delete'), 
  socialMediaController.disconnectAccount
);

// Get pages/sub-accounts for a connected account
router.get('/accounts/:id/pages', 
  requirePermission('social_media.read'), 
  socialIntegrationController.getAccountPages
);

/**
 * =====================
 * POSTS
 * =====================
 */

// Get all posts
router.get('/posts', 
  requirePermission('social_media.read'), 
  socialMediaController.getPosts
);

// Create and publish post
router.post('/posts', 
  requirePermission('social_media.create'), 
  socialMediaController.createPost
);

// Schedule post
router.post('/posts/schedule', 
  requirePermission('social_media.create'), 
  socialMediaController.schedulePost
);

/**
 * =====================
 * COMMENTS
 * =====================
 */

// Get comments for a post
router.get('/posts/:id/comments', 
  requirePermission('social_media.read'), 
  socialMediaController.getComments
);

// Reply to a comment
router.post('/comments/:id/reply', 
  requirePermission('social_media.create'), 
  socialMediaController.replyToComment
);

/**
 * =====================
 * INBOX / MESSAGING
 * =====================
 */

// Get unified inbox (all conversations)
router.get('/inbox', 
  requirePermission('social_media.read'), 
  socialIntegrationController.getInbox
);

// Get messages for a conversation
router.get('/conversations/:id/messages', 
  requirePermission('social_media.read'), 
  socialIntegrationController.getConversationMessages
);

// Send message in a conversation
router.post('/conversations/:id/messages', 
  requirePermission('social_media.create'), 
  socialIntegrationController.sendMessage
);

/**
 * =====================
 * LEADS (Facebook Lead Ads)
 * =====================
 */

// Get lead forms
router.get('/leads/forms', 
  requirePermission('social_media.read'), 
  socialIntegrationController.getLeadForms
);

// Get leads from a form
router.get('/leads/forms/:formId', 
  requirePermission('social_media.read'), 
  socialIntegrationController.getFormLeads
);

// Import lead to CRM contacts
router.post('/leads/:leadId/import', 
  requirePermission('contacts.create'), 
  socialIntegrationController.importLead
);

/**
 * =====================
 * ADS & ANALYTICS
 * =====================
 */

// Get ad accounts
router.get('/ads/accounts', 
  requirePermission('social_media.read'), 
  socialIntegrationController.getAdAccounts
);

// Get campaigns for an ad account
router.get('/ads/accounts/:adAccountId/campaigns', 
  requirePermission('social_media.read'), 
  socialIntegrationController.getAdCampaigns
);

// Get ad account insights
router.get('/ads/accounts/:adAccountId/insights', 
  requirePermission('social_media.read'), 
  socialIntegrationController.getAdAccountInsights
);

// Get campaign insights
router.get('/ads/campaigns/:campaignId/insights', 
  requirePermission('social_media.read'), 
  socialIntegrationController.getCampaignInsights
);

/**
 * =====================
 * ANALYTICS
 * =====================
 */

// Get overall social media analytics
router.get('/analytics', 
  requirePermission('social_media.read'), 
  socialMediaController.getAnalytics
);

module.exports = router;
