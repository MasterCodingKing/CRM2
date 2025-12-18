const express = require('express');
const router = express.Router();
const socialMediaController = require('../controllers/socialMedia.controller');

// Accounts
router.get('/accounts', socialMediaController.getAccounts);
router.post('/accounts/connect', socialMediaController.connectAccount);
router.delete('/accounts/:id', socialMediaController.disconnectAccount);

// Posts
router.get('/posts', socialMediaController.getPosts);
router.post('/posts', socialMediaController.createPost);
router.post('/posts/schedule', socialMediaController.schedulePost);

// Comments
router.get('/posts/:id/comments', socialMediaController.getComments);
router.post('/comments/:id/reply', socialMediaController.replyToComment);

// Analytics
router.get('/analytics', socialMediaController.getAnalytics);

module.exports = router;
