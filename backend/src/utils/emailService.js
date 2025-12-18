const transporter = require('../config/email.config');
const logger = require('./logger');

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string|string[]} options.to - Recipient email address(es)
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text body
 * @param {string} options.html - HTML body
 * @param {Object} options.original - Original email metadata for replies (optional)
 * @param {string} options.original.messageId - Original message ID
 * @param {string} options.original.references - Original references header
 * @returns {Promise<Object>} - Info about sent message
 */
const sendEmail = async ({ to, subject, text, html, original }) => {
  try {
    const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
    
    const mailOptions = {
      from: `"CRM System" <${fromEmail}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      text,
      html  
    };

    // Add reply headers if this is a reply to an original email
    if (original && original.messageId) {
      mailOptions.inReplyTo = original.messageId;
      mailOptions.references = original.references || original.messageId;
    }

    const info = await transporter.sendMail(mailOptions);

    logger.info(`Email sent to ${to}: ${info.messageId}`);
    
    return {
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
    };
  } catch (error) {
    logger.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Send a composed email (for the compose form)
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address(es)
 * @param {string} options.subject - Email subject
 * @param {string} options.message - Email message/body
 * @param {Object} options.original - Original email metadata for replies (optional)
 */
const sendComposedEmail = async ({ to, subject, message, original }) => {
  // Convert plain text message to HTML
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      ${message.replace(/\n/g, '<br>')}
    </div>
  `;
  
  return sendEmail({
    to,
    subject,
    text: message,
    html,
    original,
  });
};

module.exports = {
  sendEmail,
  sendComposedEmail,
};
