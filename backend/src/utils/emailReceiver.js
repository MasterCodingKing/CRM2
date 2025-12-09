const Imap = require('imap');
const { simpleParser } = require('mailparser');
const { Email } = require('../models');
const logger = require('./logger');

class EmailReceiver {
  constructor() {
    this.imap = null;
    this.isConnected = false;
    this.checkInterval = null;
  }

  /**
   * Initialize IMAP connection
   */
  initialize() {
    if (!process.env.IMAP_USER || !process.env.IMAP_PASS) {
      logger.warn('IMAP credentials not configured. Email receiving disabled.');
      return;
    }

    this.imap = new Imap({
      user: process.env.IMAP_USER,
      password: process.env.IMAP_PASS,
      host: process.env.IMAP_HOST || 'imap.gmail.com',
      port: parseInt(process.env.IMAP_PORT || '993'),
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    });

    this.imap.once('ready', () => {
      this.isConnected = true;
      logger.info('IMAP connection ready - Email receiver is active');
      this.startChecking();
    });

    this.imap.once('error', (err) => {
      logger.error('IMAP connection error:', err);
      this.isConnected = false;
    });

    this.imap.once('end', () => {
      logger.info('IMAP connection ended');
      this.isConnected = false;
    });

    this.imap.connect();
  }

  /**
   * Start checking for new emails periodically
   */
  startChecking() {
    // Check for new emails every 30 seconds
    this.checkInterval = setInterval(() => {
      this.checkNewEmails();
    }, 30000);

    // Check immediately on start
    this.checkNewEmails();
  }

  /**
   * Check for new unread emails
   */
  checkNewEmails() {
    if (!this.isConnected) {
      return;
    }

    this.imap.openBox('INBOX', false, (err, box) => {
      if (err) {
        logger.error('Error opening inbox:', err);
        return;
      }

      // Search for unseen emails
      this.imap.search(['UNSEEN'], (err, results) => {
        if (err) {
          logger.error('Error searching emails:', err);
          return;
        }

        if (!results || results.length === 0) {
          return;
        }

        logger.info(`Found ${results.length} new email(s)`);

        const fetch = this.imap.fetch(results, { bodies: '' });

        fetch.on('message', (msg, seqno) => {
          msg.on('body', (stream, info) => {
            simpleParser(stream, async (err, parsed) => {
              if (err) {
                logger.error('Error parsing email:', err);
                return;
              }

              try {
                await this.processReceivedEmail(parsed);
              } catch (error) {
                logger.error('Error processing received email:', error);
              }
            });
          });

          msg.once('attributes', (attrs) => {
            // Mark as seen after processing
            this.imap.addFlags(attrs.uid, ['\\Seen'], (err) => {
              if (err) {
                logger.error('Error marking email as seen:', err);
              }
            });
          });
        });

        fetch.once('error', (err) => {
          logger.error('Fetch error:', err);
        });
      });
    });
  }

  /**
   * Process a received email and save to database
   */
  async processReceivedEmail(parsed) {
    try {
      const fromEmail = parsed.from?.value[0]?.address;
      const subject = parsed.subject || '(No Subject)';
      const messageText = parsed.text || parsed.html || '';
      const inReplyTo = parsed.inReplyTo;
      const messageId = parsed.messageId;

      logger.info(`Processing email from: ${fromEmail}, subject: ${subject}`);

      // Check if this is a reply to an existing email
      let parentEmail = null;
      if (inReplyTo) {
        parentEmail = await Email.findOne({
          where: { message_id: inReplyTo },
        });
      }

      // If no parent found by message ID, try to match by subject
      if (!parentEmail && subject.startsWith('Re:')) {
        const originalSubject = subject.replace(/^Re:\s*/i, '').trim();
        parentEmail = await Email.findOne({
          where: { subject: originalSubject },
          order: [['created_at', 'DESC']],
        });
      }

      // Determine organization_id from parent or set to null
      const organizationId = parentEmail ? parentEmail.organization_id : null;

      // Save the received email
      const savedEmail = await Email.create({
        organization_id: organizationId,
        user_id: null, // Received emails don't have a user_id
        to_email: process.env.SMTP_USER || process.env.IMAP_USER, // Our email
        from_email: fromEmail, // Add this field to track sender
        subject: subject,
        message: messageText,
        type: parentEmail ? 'reply' : 'received',
        is_bulk: false,
        parent_id: parentEmail ? (parentEmail.parent_id || parentEmail.id) : null,
        message_id: messageId,
        status: 'delivered',
        read_at: null, // Mark as unread initially
      });

      logger.info(`Saved received email with ID: ${savedEmail.id}`);

      return savedEmail;
    } catch (error) {
      logger.error('Error saving received email:', error);
      throw error;
    }
  }

  /**
   * Stop checking for emails
   */
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    if (this.imap) {
      this.imap.end();
    }
  }
}

// Create singleton instance
const emailReceiver = new EmailReceiver();

module.exports = emailReceiver;
