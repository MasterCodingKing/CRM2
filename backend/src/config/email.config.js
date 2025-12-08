const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

/**
 * Email Configuration
 * Update your .env file with your email provider settings:
 * 
 * For Gmail:
 * SMTP_HOST=smtp.gmail.com
 * SMTP_PORT=587
 * SMTP_USER=your-email@gmail.com
 * SMTP_PASS=your-app-password (Get from: https://myaccount.google.com/apppasswords)
 * SMTP_FROM=your-email@gmail.com
 * 
 * For Outlook/Hotmail:
 * SMTP_HOST=smtp-mail.outlook.com
 * SMTP_PORT=587
 * SMTP_USER=your-email@outlook.com
 * SMTP_PASS=your-password
 * SMTP_FROM=your-email@outlook.com
 * 
 * For Other Providers:
 * Update the SMTP settings according to your provider's documentation
 */

// Create transporter with your SMTP settings
const createTransporter = () => {
  const config = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  };

  return nodemailer.createTransport(config);
};

const transporter = createTransporter();

// Verify connection on startup
transporter.verify((error, success) => {
  if (error) {
    logger.error('SMTP connection error:', error.message);
    console.error('❌ Email service not configured properly. Check your .env file.');
  } else {
    logger.info('SMTP server is ready to send emails');
    console.log('✅ Email service is ready');
  }
});

module.exports = transporter;
