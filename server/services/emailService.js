const nodemailer = require('nodemailer');
const config = require('../config');

/**
 * Email notification service wrapper.
 * Handles SMTP configuration, sending transactional emails and health checks.
 */
class EmailService {
  constructor(options = null) {
    this.config = options || config.getEmailConfig();
    this.transporter = null;

    if (this.config.enabled) {
      this.transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: this.config.authUser
          ? {
              user: this.config.authUser,
              pass: this.config.authPass
            }
          : undefined,
        tls: this.config.tlsOptions
      });
    }
  }

  isConfigured() {
    return Boolean(this.transporter);
  }

  getDefaultFrom() {
    return this.config.from;
  }

  /**
   * Send an email using configured transporter.
   * @param {Object} mail - Mail payload
   * @param {string} mail.to - Recipient email address
   * @param {string} mail.subject - Subject line
   * @param {string} mail.html - HTML content
   * @param {string} [mail.text] - Plain text fallback
   * @returns {Promise<{ success: boolean, messageId?: string, error?: string }>}
   */
  async sendMail({ to, subject, html, text }) {
    if (!this.isConfigured()) {
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.getDefaultFrom(),
        to,
        subject,
        html,
        text
      });

      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Email notification failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send a canned test message to verify configuration.
   * @param {string} to - Recipient email address
   */
  async sendTestMail(to) {
    const now = new Date().toLocaleString(this.config.locale || 'en');
    const subject = 'Subscription Manager Test Email';
    const html = `
      <h2>Subscription Manager Test Email</h2>
      <p>This is a test email from the Subscription Management system. If you receive this, your email notification channel is configured correctly.</p>
      <hr/>
      <p><strong>Send time:</strong> ${now}</p>
      <p>Thank you for using the system!</p>
    `;
    const text = `Subscription Manager Test Email\n\nThis is a test email from the Subscription Management system. If you receive this, your email notification channel is configured correctly.\n\nSend time: ${now}`;

    return this.sendMail({ to, subject, html, text });
  }
}

module.exports = EmailService;
