const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth.middleware');
const { ensureTenancy } = require('../middlewares/tenancy.middleware');
const { requirePermission } = require('../middlewares/rbac.middleware');
const facebookController = require('../controllers/facebook.controller');

/**
 * Apply authentication middleware
 */
router.use(authenticateToken);
router.use(ensureTenancy);

/**
 * =====================
 * FACEBOOK PAGES
 * =====================
 */

// Get all connected pages
router.get('/pages',
  requirePermission('social_media.read'),
  facebookController.getPages
);

// Connect a Facebook page
router.post('/pages/connect',
  requirePermission('social_media.connect'),
  facebookController.connectPage
);

// Sync page data from Facebook
router.post('/pages/:id/sync',
  requirePermission('social_media.update'),
  facebookController.syncPage
);

// Disconnect a page
router.delete('/pages/:id',
  requirePermission('social_media.delete'),
  facebookController.disconnectPage
);

/**
 * =====================
 * MESSENGER / MESSAGES
 * =====================
 */

// Get all messages/conversations
router.get('/messages',
  requirePermission('social_media.read'),
  facebookController.getMessages
);

// Send a message
router.post('/messages/send',
  requirePermission('social_media.create'),
  facebookController.sendFacebookMessage
);

// Mark message as read
router.put('/messages/:id/read',
  requirePermission('social_media.update'),
  facebookController.markMessageAsRead
);

// Assign conversation to user
router.put('/messages/conversation/:conversationId/assign',
  requirePermission('social_media.update'),
  facebookController.assignConversation
);

/**
 * =====================
 * LEADS
 * =====================
 */

// Get all Facebook leads
router.get('/leads',
  requirePermission('social_media.read'),
  facebookController.getLeads
);

// Sync leads from Facebook
router.post('/leads/sync',
  requirePermission('social_media.create'),
  facebookController.syncLeads
);

// Convert lead to contact
router.post('/leads/:id/convert',
  requirePermission('contacts.create'),
  facebookController.convertLeadToContact
);

// Update lead status
router.put('/leads/:id/status',
  requirePermission('social_media.update'),
  facebookController.updateLeadStatus
);

module.exports = router;
