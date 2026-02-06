// ==========================================
// EMAIL SERVICE - FIXED VERSION
// ==========================================
// File: backend/services/email/emailService.js
//
// FIXES APPLIED:
// 1. ✅ Fixed import statement (dotenv/config)
// 2. ✅ Wrapped all console.log/error with devLog/devError
// 3. ✅ Replaced hardcoded support email with variable
// 4. ✅ Added error context to thrown errors
// ==========================================

import 'dotenv/config';
import { Resend } from 'resend';

// ==========================================
// UTILITY: Conditional logging (dev only)
// ==========================================
const devLog = (...args) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
};

const devError = (...args) => {
  if (process.env.NODE_ENV === 'development') {
    console.error(...args);
  }
};

class EmailService {
  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
    this.fromEmail = process.env.EMAIL_FROM || 'verify@mybigyard.com';
    this.fromName = process.env.EMAIL_FROM_NAME || 'mybigyard.com';
    this.supportEmail = process.env.SUPPORT_EMAIL || 'support@mybigyard.com';
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
        devError('❌ Resend error:', error);
        const err = new Error(`Email send failed: ${error.message}`);
        err.code = error.code || 'EMAIL_SEND_FAILED';
        err.provider = 'resend';
        throw err;
      }

      devLog(`✅ Email sent successfully: ${data.id}`);
      
      return {
        success: true,
        messageId: data.id,
        provider: 'resend'
      };
    } catch (error) {
      devError('❌ Email service error:', error);
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
        devError('❌ Welcome email error:', error);
        return { success: false, error: error.message };
      }

      devLog(`✅ Welcome email sent: ${data.id}`);
      return { success: true, messageId: data.id };
    } catch (error) {
      devError('❌ Welcome email service error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email, userName, resetUrl) {
    try {
      const { data, error } = await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: [email],
        subject: `Password Reset Request - ${this.fromName}`,
        html: this.getPasswordResetTemplate(userName, resetUrl)
      });

      if (error) {
        devError('❌ Password reset email error:', error);
        const err = new Error(`Email send failed: ${error.message}`);
        err.code = error.code || 'EMAIL_SEND_FAILED';
        err.provider = 'resend';
        throw err;
      }

      devLog(`✅ Password reset email sent: ${data.id}`);
      return {
        success: true,
        messageId: data.id,
        provider: 'resend'
      };
    } catch (error) {
      devError('❌ Password reset email service error:', error);
      throw error;
    }
  }

  /**
   * Send password change confirmation email
   */
  async sendPasswordChangeConfirmation(email, userName) {
    try {
      const { data, error } = await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: [email],
        subject: `Password Changed Successfully - ${this.fromName}`,
        html: this.getPasswordChangeConfirmationTemplate(userName)
      });

      if (error) {
        devError('❌ Password change confirmation email error:', error);
        return { success: false, error: error.message };
      }

      devLog(`✅ Password change confirmation email sent: ${data.id}`);
      return { success: true, messageId: data.id };
    } catch (error) {
      devError('❌ Password change confirmation email service error:', error);
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // BOOKING EMAILS
  // ============================================

  /**
   * Send booking confirmation email to guest
   */
  async sendBookingConfirmationToGuest(booking) {
    try {
      const { data, error } = await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: [booking.user.email],
        subject: `Booking Confirmed! 🎉 - ${booking.listing.title}`,
        html: this.getBookingConfirmationGuestTemplate(booking)
      });

      if (error) {
        devError('❌ Booking confirmation (guest) email error:', error);
        return { success: false, error: error.message };
      }

      devLog(`✅ Booking confirmation sent to guest: ${data.id}`);
      return { success: true, messageId: data.id };
    } catch (error) {
      devError('❌ Booking confirmation (guest) service error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send new booking notification email to host
   */
  async sendBookingNotificationToHost(booking) {
    try {
      const { data, error } = await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: [booking.listing.host.email],
        subject: `New Booking! 📅 - ${booking.listing.title}`,
        html: this.getBookingNotificationHostTemplate(booking)
      });

      if (error) {
        devError('❌ Booking notification (host) email error:', error);
        return { success: false, error: error.message };
      }

      devLog(`✅ Booking notification sent to host: ${data.id}`);
      return { success: true, messageId: data.id };
    } catch (error) {
      devError('❌ Booking notification (host) service error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send both booking emails (guest confirmation + host notification)
   */
  async sendBookingEmails(booking) {
    const results = await Promise.allSettled([
      this.sendBookingConfirmationToGuest(booking),
      this.sendBookingNotificationToHost(booking),
    ]);

    const guestResult = results[0];
    const hostResult = results[1];

    devLog('📧 Booking emails sent:', {
      guest: guestResult.status === 'fulfilled' ? guestResult.value : guestResult.reason,
      host: hostResult.status === 'fulfilled' ? hostResult.value : hostResult.reason,
    });

    return {
      guest: guestResult.status === 'fulfilled' ? guestResult.value : { success: false, error: guestResult.reason },
      host: hostResult.status === 'fulfilled' ? hostResult.value : { success: false, error: hostResult.reason },
    };
  }

  /**
   * Send booking cancellation email
   */
  async sendBookingCancellation(booking, cancelledBy = 'guest') {
    try {
      // Send to guest
      await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: [booking.user.email],
        subject: `Booking Cancelled - ${booking.listing.title}`,
        html: this.getBookingCancellationTemplate(booking, cancelledBy, 'guest')
      });

      // Send to host
      await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: [booking.listing.host.email],
        subject: `Booking Cancelled - ${booking.listing.title}`,
        html: this.getBookingCancellationTemplate(booking, cancelledBy, 'host')
      });

      devLog(`✅ Booking cancellation emails sent for booking ${booking.id}`);
      return { success: true };
    } catch (error) {
      devError('❌ Booking cancellation email error:', error);
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // BOOKING EMAIL TEMPLATES
  // ============================================

  /**
   * Booking Confirmation Template (for Guest)
   */
  getBookingConfirmationGuestTemplate(booking) {
    const bookingDate = new Date(booking.bookingDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const formatTime = (time) => {
      const [h, m] = time.split(':');
      const hour = parseInt(h);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${m} ${ampm}`;
    };

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmed</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                Booking Confirmed!
              </h1>
              <p style="color: #d1fae5; margin: 8px 0 0 0; font-size: 16px;">
                Your reservation is all set
              </p>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #1f2937; margin: 0 0 24px 0; font-size: 20px; font-weight: 600;">
                Hi ${booking.user.name}! 👋
              </h2>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Great news! Your booking has been confirmed. Here are your reservation details:
              </p>
              
              <!-- Booking Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 12px; overflow: hidden; margin: 24px 0;">
                <tr>
                  <td style="padding: 24px;">
                    <!-- Venue Name -->
                    <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 18px; font-weight: 700;">
                      📍 ${booking.listing.title}
                    </h3>
                    
                    <!-- Details Grid -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                          <span style="color: #6b7280; font-size: 14px;">📅 Date</span>
                        </td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                          <span style="color: #1f2937; font-size: 14px; font-weight: 600;">${bookingDate}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                          <span style="color: #6b7280; font-size: 14px;">⏰ Time</span>
                        </td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                          <span style="color: #1f2937; font-size: 14px; font-weight: 600;">${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                          <span style="color: #6b7280; font-size: 14px;">👥 Guests</span>
                        </td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                          <span style="color: #1f2937; font-size: 14px; font-weight: 600;">${booking.guests} ${booking.guests === 1 ? 'guest' : 'guests'}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">🎫 Booking ID</span>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          <span style="color: #1f2937; font-size: 14px; font-weight: 600; font-family: monospace;">#${booking.id}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Payment Summary -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ecfdf5; border-radius: 12px; overflow: hidden; margin: 24px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <h4 style="color: #065f46; margin: 0 0 12px 0; font-size: 14px; font-weight: 600;">💳 PAYMENT SUMMARY</h4>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 4px 0; color: #047857; font-size: 14px;">Base Price</td>
                        <td style="padding: 4px 0; color: #047857; font-size: 14px; text-align: right;">Rs. ${Number(booking.basePrice).toLocaleString()}</td>
                      </tr>
                      ${Number(booking.extraGuestPrice) > 0 ? `
                      <tr>
                        <td style="padding: 4px 0; color: #047857; font-size: 14px;">Extra Guest Fee</td>
                        <td style="padding: 4px 0; color: #047857; font-size: 14px; text-align: right;">Rs. ${Number(booking.extraGuestPrice).toLocaleString()}</td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="padding: 4px 0; color: #047857; font-size: 14px;">Service Fee</td>
                        <td style="padding: 4px 0; color: #047857; font-size: 14px; text-align: right;">Rs. ${Number(booking.serviceFee).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #047857; font-size: 14px;">Tax</td>
                        <td style="padding: 4px 0; color: #047857; font-size: 14px; text-align: right;">Rs. ${Number(booking.tax).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0 0 0; color: #065f46; font-size: 18px; font-weight: 700; border-top: 1px solid #a7f3d0;">Total Paid</td>
                        <td style="padding: 12px 0 0 0; color: #065f46; font-size: 18px; font-weight: 700; text-align: right; border-top: 1px solid #a7f3d0;">Rs. ${Number(booking.totalPrice).toLocaleString()}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Host Info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 12px; overflow: hidden; margin: 24px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <h4 style="color: #1f2937; margin: 0 0 12px 0; font-size: 14px; font-weight: 600;">🏠 YOUR HOST</h4>
                    <p style="color: #4b5563; margin: 0; font-size: 14px;">
                      <strong>${booking.listing.host.name}</strong><br>
                      ${booking.listing.host.email}
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${process.env.FRONTEND_URL}/bookings/${booking.id}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      View Booking Details
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
                Need to make changes? You can manage your booking from your dashboard or contact the host directly.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 0; text-align: center;">
                Thank you for using ${this.fromName}!
              </p>
              <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 16px 0 0 0; text-align: center;">
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

  /**
   * Booking Notification Template (for Host)
   */
  getBookingNotificationHostTemplate(booking) {
    const bookingDate = new Date(booking.bookingDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const formatTime = (time) => {
      const [h, m] = time.split(':');
      const hour = parseInt(h);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${m} ${ampm}`;
    };

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Booking</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 40px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">📅</div>
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                New Booking!
              </h1>
              <p style="color: #bfdbfe; margin: 8px 0 0 0; font-size: 16px;">
                You have a new reservation
              </p>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #1f2937; margin: 0 0 24px 0; font-size: 20px; font-weight: 600;">
                Hi ${booking.listing.host.name}! 👋
              </h2>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Great news! You have a new confirmed booking for <strong>${booking.listing.title}</strong>.
              </p>
              
              <!-- Guest Info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #eff6ff; border-radius: 12px; overflow: hidden; margin: 24px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <h4 style="color: #1e40af; margin: 0 0 12px 0; font-size: 14px; font-weight: 600;">👤 GUEST INFORMATION</h4>
                    <p style="color: #1e3a8a; margin: 0; font-size: 14px;">
                      <strong>${booking.user.name}</strong><br>
                      ${booking.user.email}<br>
                      ${booking.user.phone || 'No phone provided'}
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Booking Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 12px; overflow: hidden; margin: 24px 0;">
                <tr>
                  <td style="padding: 24px;">
                    <h4 style="color: #1f2937; margin: 0 0 16px 0; font-size: 14px; font-weight: 600;">📋 BOOKING DETAILS</h4>
                    
                    <!-- Details Grid -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                          <span style="color: #6b7280; font-size: 14px;">📅 Date</span>
                        </td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                          <span style="color: #1f2937; font-size: 14px; font-weight: 600;">${bookingDate}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                          <span style="color: #6b7280; font-size: 14px;">⏰ Time</span>
                        </td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                          <span style="color: #1f2937; font-size: 14px; font-weight: 600;">${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                          <span style="color: #6b7280; font-size: 14px;">⏱️ Duration</span>
                        </td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                          <span style="color: #1f2937; font-size: 14px; font-weight: 600;">${Number(booking.duration)} hours</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                          <span style="color: #6b7280; font-size: 14px;">👥 Guests</span>
                        </td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                          <span style="color: #1f2937; font-size: 14px; font-weight: 600;">${booking.guests} ${booking.guests === 1 ? 'guest' : 'guests'}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">🎫 Booking ID</span>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          <span style="color: #1f2937; font-size: 14px; font-weight: 600; font-family: monospace;">#${booking.id}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Earnings Summary -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ecfdf5; border-radius: 12px; overflow: hidden; margin: 24px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <h4 style="color: #065f46; margin: 0 0 12px 0; font-size: 14px; font-weight: 600;">💰 YOUR EARNINGS</h4>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 4px 0; color: #047857; font-size: 14px;">Booking Amount</td>
                        <td style="padding: 4px 0; color: #047857; font-size: 14px; text-align: right;">Rs. ${Number(booking.basePrice + (booking.extraGuestPrice || 0)).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #047857; font-size: 14px;">Platform Fee (10%)</td>
                        <td style="padding: 4px 0; color: #dc2626; font-size: 14px; text-align: right;">- Rs. ${Number(booking.serviceFee).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0 0 0; color: #065f46; font-size: 18px; font-weight: 700; border-top: 1px solid #a7f3d0;">You'll Receive</td>
                        <td style="padding: 12px 0 0 0; color: #065f46; font-size: 18px; font-weight: 700; text-align: right; border-top: 1px solid #a7f3d0;">Rs. ${Number(booking.basePrice + (booking.extraGuestPrice || 0) - booking.serviceFee).toLocaleString()}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${process.env.FRONTEND_URL}/host/bookings" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      View All Bookings
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
                Please ensure your space is ready for the guest. You can contact them directly if you need to discuss any details.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 0; text-align: center;">
                Thank you for hosting with ${this.fromName}!
              </p>
              <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 16px 0 0 0; text-align: center;">
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

  /**
   * Booking Cancellation Template
   */
  getBookingCancellationTemplate(booking, cancelledBy, recipientType) {
    const bookingDate = new Date(booking.bookingDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const recipientName = recipientType === 'guest' ? booking.user.name : booking.listing.host.name;
    const cancelMessage = cancelledBy === 'guest' 
      ? 'The guest has cancelled this booking.'
      : cancelledBy === 'host'
      ? 'The host has cancelled this booking.'
      : 'This booking has been cancelled.';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Cancelled</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                Booking Cancelled
              </h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #1f2937; margin: 0 0 24px 0; font-size: 20px; font-weight: 600;">
                Hi ${recipientName},
              </h2>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                ${cancelMessage}
              </p>
              
              <!-- Cancelled Booking Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef2f2; border-radius: 12px; overflow: hidden; margin: 24px 0;">
                <tr>
                  <td style="padding: 24px;">
                    <h3 style="color: #991b1b; margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">
                      ${booking.listing.title}
                    </h3>
                    <p style="color: #b91c1c; margin: 0; font-size: 14px;">
                      📅 ${bookingDate}<br>
                      ⏰ ${booking.startTime} - ${booking.endTime}<br>
                      🎫 Booking #${booking.id}
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
                If you have any questions, please contact our support team.
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

  // ============================================
  // EXISTING TEMPLATES
  // ============================================

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
                Need help? Contact us at <a href="mailto:${this.supportEmail}" style="color: #667eea; text-decoration: none;">${this.supportEmail}</a>
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

  /**
   * Password Reset Email Template
   */
  getPasswordResetTemplate(userName, resetUrl) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                🔒 Password Reset Request
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
                We received a request to reset your password. Click the button below to create a new password:
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      Reset My Password
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
                Or copy and paste this link into your browser:
              </p>
              
              <!-- Link Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 16px 0;">
                <tr>
                  <td style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;">
                    <p style="color: #667eea; font-size: 14px; margin: 0; word-break: break-all;">
                      ${resetUrl}
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Warning Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
                <tr>
                  <td style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px;">
                    <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.6;">
                      ⚠️ <strong>This link will expire in 1 hour</strong> for security reasons.
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
                If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 0; text-align: center;">
                This is an automated email. Please do not reply to this message.
              </p>
              <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 16px 0 0 0; text-align: center;">
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

  /**
   * Password Change Confirmation Email Template
   */
  getPasswordChangeConfirmationTemplate(userName) {
    const changeDate = new Date().toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Changed</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                ✅ Password Changed Successfully
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
                Your password was successfully changed on:
              </p>
              
              <!-- Date Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
                <tr>
                  <td style="background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 16px; text-align: center;">
                    <p style="color: #166534; font-size: 16px; font-weight: 600; margin: 0;">
                      📅 ${changeDate}
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Warning Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
                <tr>
                  <td style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px;">
                    <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.6;">
                      ⚠️ <strong>Didn't make this change?</strong><br>
                      If you didn't authorize this password change, please contact our support team immediately at <a href="mailto:${this.supportEmail}" style="color: #f59e0b; text-decoration: none;">${this.supportEmail}</a>
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
                For your security, we recommend:
              </p>
              
              <ul style="color: #6b7280; font-size: 14px; line-height: 1.8; margin: 8px 0 0 0; padding-left: 20px;">
                <li>Using a unique password for each account</li>
                <li>Enabling two-factor authentication if available</li>
                <li>Never sharing your password with anyone</li>
              </ul>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 0; text-align: center;">
                This is an automated security notification.
              </p>
              <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 16px 0 0 0; text-align: center;">
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

  // ============================================
  // SUPPORT TICKET EMAIL METHODS
  // ============================================

  /**
   * Send ticket confirmation email to user
   */
  async sendTicketConfirmation(ticket) {
    try {
      const { data, error } = await this.resend.emails.send({
        from: `${this.fromName} Support <${this.fromEmail}>`,
        to: [ticket.user.email],
        subject: `[${ticket.ticketNumber}] We received your support request`,
        html: this.getTicketConfirmationTemplate(ticket)
      });

      if (error) {
        devError('❌ Ticket confirmation email error:', error);
        return { success: false, error: error.message };
      }

      devLog(`✅ Ticket confirmation email sent: ${data.id}`);
      return { success: true, messageId: data.id };
    } catch (error) {
      devError('❌ Ticket confirmation email service error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send ticket reply notification to user
   */
  async sendTicketReply(ticket, reply) {
    try {
      const { data, error } = await this.resend.emails.send({
        from: `${this.fromName} Support <${this.fromEmail}>`,
        to: [ticket.user.email],
        subject: `[${ticket.ticketNumber}] New reply to your support request`,
        html: this.getTicketReplyTemplate(ticket, reply)
      });

      if (error) {
        devError('❌ Ticket reply email error:', error);
        return { success: false, error: error.message };
      }

      devLog(`✅ Ticket reply email sent: ${data.id}`);
      return { success: true, messageId: data.id };
    } catch (error) {
      devError('❌ Ticket reply email service error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send ticket closed notification
   */
  async sendTicketClosed(ticket) {
    try {
      const { data, error } = await this.resend.emails.send({
        from: `${this.fromName} Support <${this.fromEmail}>`,
        to: [ticket.user.email],
        subject: `[${ticket.ticketNumber}] Your support ticket has been closed`,
        html: this.getTicketClosedTemplate(ticket)
      });

      if (error) {
        devError('❌ Ticket closed email error:', error);
        return { success: false, error: error.message };
      }

      devLog(`✅ Ticket closed email sent: ${data.id}`);
      return { success: true, messageId: data.id };
    } catch (error) {
      devError('❌ Ticket closed email service error:', error);
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // SUPPORT TICKET EMAIL TEMPLATES
  // ============================================

  /**
   * Ticket Confirmation Template
   */
  getTicketConfirmationTemplate(ticket) {
    const categoryLabels = {
      BOOKING: '📅 Booking Issue',
      PAYMENT: '💳 Payment Issue',
      LISTING: '🏠 Listing Issue',
      ACCOUNT: '👤 Account Issue',
      TECHNICAL: '🔧 Technical Issue',
      HOST_ISSUE: '🏠 Host Issue',
      GUEST_ISSUE: '👥 Guest Issue',
      FEEDBACK: '💬 Feedback',
      OTHER: '📋 Other'
    };

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Support Ticket Created</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 40px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">🎫</div>
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">
                We Received Your Request
              </h1>
              <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 16px;">
                Ticket ${ticket.ticketNumber}
              </p>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">
                Hi ${ticket.user.name}! 👋
              </h2>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Thank you for contacting us. We've received your support request and our team will get back to you as soon as possible.
              </p>
              
              <!-- Ticket Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 12px; overflow: hidden; margin: 24px 0;">
                <tr>
                  <td style="padding: 24px;">
                    <h4 style="color: #6366f1; margin: 0 0 16px 0; font-size: 14px; font-weight: 600; text-transform: uppercase;">
                      Ticket Details
                    </h4>
                    
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                          <span style="color: #6b7280; font-size: 14px;">Ticket Number</span>
                        </td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                          <span style="color: #1f2937; font-size: 14px; font-weight: 600; font-family: monospace;">${ticket.ticketNumber}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                          <span style="color: #6b7280; font-size: 14px;">Category</span>
                        </td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                          <span style="color: #1f2937; font-size: 14px;">${categoryLabels[ticket.category] || ticket.category}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">Subject</span>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          <span style="color: #1f2937; font-size: 14px; font-weight: 600;">${ticket.subject}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Response Time Notice -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; margin: 24px 0;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.6;">
                      ⏰ <strong>Expected Response Time:</strong> We typically respond within 24-48 hours during business days.
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${process.env.FRONTEND_URL}/support/${ticket.id}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      View Ticket
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
                You can reply to this email or visit your support page to add more details to your request.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 0; text-align: center;">
                Need immediate help? Contact us at <a href="mailto:${this.supportEmail}" style="color: #6366f1; text-decoration: none;">${this.supportEmail}</a>
              </p>
              <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 16px 0 0 0; text-align: center;">
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

  /**
   * Ticket Reply Template
   */
  getTicketReplyTemplate(ticket, reply) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Reply</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">💬</div>
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">
                New Reply to Your Ticket
              </h1>
              <p style="color: #d1fae5; margin: 8px 0 0 0; font-size: 16px;">
                ${ticket.ticketNumber}
              </p>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">
                Hi ${ticket.user.name}! 👋
              </h2>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Our support team has replied to your ticket <strong>"${ticket.subject}"</strong>:
              </p>
              
              <!-- Reply Content -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px; margin: 24px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: #065f46; font-size: 14px; margin: 0 0 8px 0; font-weight: 600;">
                      ${reply.sender?.name || 'Support Team'}
                    </p>
                    <p style="color: #047857; font-size: 15px; margin: 0; line-height: 1.6; white-space: pre-wrap;">
${reply.message}
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${process.env.FRONTEND_URL}/support/${ticket.id}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      View Full Conversation
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
                You can reply directly from your support page or respond to this email.
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

  /**
   * Ticket Closed Template
   */
  getTicketClosedTemplate(ticket) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ticket Closed</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); padding: 40px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">
                Ticket Closed
              </h1>
              <p style="color: #d1d5db; margin: 8px 0 0 0; font-size: 16px;">
                ${ticket.ticketNumber}
              </p>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">
                Hi ${ticket.user.name}! 👋
              </h2>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Your support ticket <strong>"${ticket.subject}"</strong> has been marked as closed.
              </p>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                If you feel your issue wasn't resolved or you have follow-up questions, you can always create a new ticket or contact us directly.
              </p>
              
              <!-- Feedback Request -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #eff6ff; border-radius: 12px; margin: 24px 0;">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <p style="color: #1e40af; font-size: 16px; margin: 0 0 16px 0; font-weight: 600;">
                      How was your support experience?
                    </p>
                    <p style="color: #3b82f6; font-size: 14px; margin: 0;">
                      Your feedback helps us improve! 🙏
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${process.env.FRONTEND_URL}/support" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      Create New Ticket
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 0; text-align: center;">
                Thank you for using ${this.fromName}!
              </p>
              <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 16px 0 0 0; text-align: center;">
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