const transporter = require('../config/email.config');
const logger = require('./logger');

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string|string[]} options.to - Recipient email address(es)
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text body
 * @param {string} options.html - HTML body
 * @returns {Promise<Object>} - Info about sent message
 */
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
    
    const mailOptions = {
      from: `"CRM System" <${fromEmail}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      text,
      html,
    };

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
 */
const sendComposedEmail = async ({ to, subject, message }) => {
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
  });
};

module.exports = {
  sendEmail,
  sendComposedEmail,
};
