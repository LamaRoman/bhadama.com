// backend/services/notification/channels/EmailChannel.js
// Handles email notifications via Resend

import { Resend } from 'resend';
import BaseChannel from './base.channel.js';

class EmailChannel extends BaseChannel {
  constructor() {
    super('EMAIL');
    this.resend = new Resend(process.env.RESEND_API_KEY);
    this.fromEmail = process.env.EMAIL_FROM || 'MyBigYard <notifications@mybigyard.com>';
  }

  /**
   * Validate that user has a valid email
   */
  validateRecipient(user) {
    if (!user.email) {
      return { valid: false, reason: 'No email address' };
    }
    if (!user.emailVerified) {
      return { valid: false, reason: 'Email not verified' };
    }
    return { valid: true };
  }

  /**
   * Send email notification via Resend
   */
  async send({ notification, user, content }) {
    try {
      // Validate recipient
      const validation = this.validateRecipient(user);
      if (!validation.valid) {
        console.log(`[EmailChannel] Skipping - ${validation.reason} for user ${user.id}`);
        return {
          success: false,
          error: validation.reason,
          skipped: true,
        };
      }

      // Build email HTML
      const htmlContent = this.buildHtmlEmail(content, notification);

      // Send via Resend
      const response = await this.resend.emails.send({
        from: this.fromEmail,
        to: user.email,
        subject: content.subject || content.title,
        html: htmlContent,
        text: content.body, // Plain text fallback
        tags: [
          { name: 'notification_type', value: notification.type },
          { name: 'notification_id', value: notification.id.toString() },
        ],
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      console.log(`[EmailChannel] Sent to ${user.email}: ${response.data.id}`);

      return {
        success: true,
        provider: 'resend',
        messageId: response.data.id,
        recipient: user.email,
        cost: 0.001, // Approximate cost per email
      };

    } catch (error) {
      console.error('[EmailChannel] Error:', error);
      return {
        success: false,
        provider: 'resend',
        recipient: user.email,
        error: error.message,
      };
    }
  }

  /**
   * Build HTML email from content
   */
  buildHtmlEmail(content, notification) {
    const actionUrl = notification.actionUrl || process.env.APP_URL || 'https://mybigyard.com';
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${content.subject || content.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .card {
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%);
      padding: 24px;
      text-align: center;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #ffffff;
      text-decoration: none;
    }
    .content {
      padding: 32px 24px;
    }
    .title {
      font-size: 20px;
      font-weight: 600;
      color: #1a1a1a;
      margin: 0 0 16px 0;
    }
    .body {
      color: #4a4a4a;
      margin: 0 0 24px 0;
      white-space: pre-wrap;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      margin-top: 16px;
    }
    .footer {
      padding: 24px;
      text-align: center;
      color: #888888;
      font-size: 12px;
      border-top: 1px solid #eee;
    }
    .footer a {
      color: #10b981;
      text-decoration: none;
    }
    @media (max-width: 600px) {
      .container {
        padding: 12px;
      }
      .content {
        padding: 24px 16px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <a href="${process.env.APP_URL || 'https://mybigyard.com'}" class="logo">
          🏡 MyBigYard
        </a>
      </div>
      <div class="content">
        <h1 class="title">${content.title}</h1>
        <div class="body">${this.formatBodyHtml(content.body)}</div>
        ${notification.actionUrl ? `
        <a href="${notification.actionUrl}" class="button">
          View Details →
        </a>
        ` : ''}
      </div>
      <div class="footer">
        <p>
          You're receiving this email because you have an account at 
          <a href="${process.env.APP_URL || 'https://mybigyard.com'}">MyBigYard</a>.
        </p>
        <p>
          <a href="${process.env.APP_URL}/settings/notifications">Manage notification preferences</a>
        </p>
        <p>© ${new Date().getFullYear()} MyBigYard. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Format body text to HTML
   * Converts markdown-like syntax to HTML
   */
  formatBodyHtml(body) {
    return body
      // Bold: **text** or __text__
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')
      // Italic: *text* or _text_
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/_([^_]+)_/g, '<em>$1</em>')
      // Links: [text](url)
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #10b981;">$1</a>')
      // Line breaks
      .replace(/\n/g, '<br>');
  }

  /**
   * Get delivery status from Resend (if needed)
   */
  async getDeliveryStatus(messageId) {
    try {
      const email = await this.resend.emails.get(messageId);
      return {
        status: email.data?.last_event || 'unknown',
        deliveredAt: email.data?.delivered_at,
      };
    } catch (error) {
      return { status: 'unknown', error: error.message };
    }
  }
}

export default new EmailChannel();