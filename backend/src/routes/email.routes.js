const express = require('express');
const router = express.Router();
const emailController = require('../controllers/email.controller');

// GET /api/email - Get all emails
router.get('/', emailController.getEmails);

// GET /api/email/by-contact - Get emails grouped by contact
router.get('/by-contact', emailController.getEmailsByContact);

// GET /api/email/:id - Get single email with replies
router.get('/:id', emailController.getEmailById);

// POST /api/email/send - Send a new email
router.post('/send', emailController.sendEmail);

// POST /api/email/:id/reply - Reply to an email
router.post('/:id/reply', emailController.replyToEmail);

// POST /api/email/:id/reply-all - Reply to all recipients
router.post('/:id/reply-all', emailController.replyToAll);

// DELETE /api/email/:id - Delete an email
router.delete('/:id', emailController.deleteEmail);

module.exports = router;
