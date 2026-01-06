// backend/services/email/emailService.js

import { Resend } from 'resend';

class EmailService {
  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@yourdomain.com';
    this.fromName = process.env.EMAIL_FROM_NAME || 'YourBrand';
  }

  /**
   * Send OTP verification email
   */
  async sendVerificationOTP(email, otp, userName = 'User') {
    try {
      const { data, error } = await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: [email],
        subject: `Verify your email - ${this.fromName}`,
        html: this.getOTPEmailTemplate(otp, userName)
      });

      if (error) {
        console.error('❌ Resend error:', error);
        throw new Error(`Email send failed: ${error.message}`);
      }

      console.log(`✅ Email sent successfully: ${data.id}`);
      
      return {
        success: true,
        messageId: data.id,
        provider: 'resend'
      };
    } catch (error) {
      console.error('❌ Email service error:', error);
      throw error;
    }
  }

  /**
   * Send welcome email after verification
   */
  async sendWelcomeEmail(email, userName, userRole) {
    try {
      const { data, error } = await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: [email],
        subject: `Welcome to ${this.fromName}! 🎉`,
        html: this.getWelcomeEmailTemplate(userName, userRole)
      });

      if (error) {
        console.error('❌ Welcome email error:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ Welcome email sent: ${data.id}`);
      return { success: true, messageId: data.id };
    } catch (error) {
      console.error('❌ Welcome email service error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * OTP Email Template
   */
  getOTPEmailTemplate(otp, userName) {
    const expiryMinutes = process.env.OTP_EXPIRY_MINUTES || 10;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                ${this.fromName}
              </h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 24px; font-weight: 600;">
                Hi ${userName}! 👋
              </h2>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Thank you for signing up! Please use the verification code below to confirm your email address:
              </p>
              
              <!-- OTP Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                <tr>
                  <td align="center" style="background-color: #f9fafb; border: 2px dashed #d1d5db; border-radius: 8px; padding: 24px;">
                    <div style="font-size: 36px; font-weight: 700; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                      ${otp}
                    </div>
                  </td>
                </tr>
              </table>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
                ⏰ This code will expire in <strong>${expiryMinutes} minutes</strong>.
              </p>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 16px 0 0 0;">
                🔒 For security, never share this code with anyone.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 0; text-align: center;">
                Didn't request this email? You can safely ignore it.
              </p>
              <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 16px 0 0 0; text-align: center;">
                Need help? Contact us at <a href="mailto:support@yourdomain.com" style="color: #667eea; text-decoration: none;">support@yourdomain.com</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  /**
   * Welcome Email Template
   */
  getWelcomeEmailTemplate(userName, userRole) {
    const roleMessage = userRole === 'HOST' 
      ? 'You can now start listing your spaces and welcoming guests!'
      : 'You can now start exploring and booking amazing spaces!';
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700;">
                🎉 Welcome to ${this.fromName}!
              </h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 24px; font-weight: 600;">
                Hi ${userName}!
              </h2>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Your email has been successfully verified! ✅
              </p>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                ${roleMessage}
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${process.env.FRONTEND_URL}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      Go to Dashboard
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
                If you have any questions, feel free to reach out to our support team anytime.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 0; text-align: center;">
                © ${new Date().getFullYear()} ${this.fromName}. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }
}

// Singleton instance
const emailService = new EmailService();

export default emailService;