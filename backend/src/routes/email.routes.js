const express = require('express');
const router = express.Router();
const emailController = require('../controllers/email.controller');

// POST /api/email/send - Send a composed email
router.post('/send', emailController.sendEmail);
console.log("email routes loaded");
module.exports = router;
