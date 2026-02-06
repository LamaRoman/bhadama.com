// backend/services/notification/channels/SMSChannel.js
// Handles SMS notifications - uses existing smsService

import BaseChannel from './base.channel.js';
// Import your existing SMS service
import smsService from '../../sms/sms.service.js';
// NOTE: Adjust path if your smsService is named differently

class SMSChannel extends BaseChannel {
  constructor() {
    super('SMS');
  }

  /**
   * Validate that user has a valid phone number
   */
  validateRecipient(user) {
    if (!user.phone) {
      return { valid: false, reason: 'No phone number' };
    }
    if (!user.phoneVerified) {
      return { valid: false, reason: 'Phone not verified' };
    }
    return { valid: true };
  }

  /**
   * Send SMS notification using existing smsService
   */
  async send({ notification, user, content }) {
    try {
      // Validate recipient
      const validation = this.validateRecipient(user);
      if (!validation.valid) {
        console.log(`[SMSChannel] Skipping - ${validation.reason} for user ${user.id}`);
        return {
          success: false,
          error: validation.reason,
          skipped: true,
        };
      }

      // Format message (SMS should be concise)
      const message = this.formatSmsMessage(content);

      // Normalize phone number using existing service
      const normalizedPhone = smsService.normalizePhoneNumber(user.phone, user.country);

      console.log(`[SMSChannel] Sending to ${smsService.maskPhone(normalizedPhone)}`);

      // Use existing smsService to send
      // Note: smsService.sendOTP is for OTP, we need a general send method
      // If your smsService doesn't have a general send, you can add one
      // For now, we'll use a simplified approach
      const result = await this.sendViaSmsService(normalizedPhone, message, user);

      if (result.success) {
        console.log(`[SMSChannel] Sent successfully via ${result.provider}`);
        return {
          success: true,
          provider: result.provider,
          messageId: result.messageId,
          recipient: normalizedPhone,
        };
      }

      return {
        success: false,
        provider: result.provider,
        recipient: normalizedPhone,
        error: result.error,
      };

    } catch (error) {
      console.error('[SMSChannel] Error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send SMS using existing smsService
   * Adapts the existing service for notification use
   */
  async sendViaSmsService(phoneNumber, message, user) {
    try {
      // Determine provider based on phone number
      const provider = smsService.selectProvider(phoneNumber);
      
      if (provider === 'sparrow') {
        return await smsService.sendViaSparrow(phoneNumber, message);
      } else {
        return await smsService.sendViaTwilio(phoneNumber, message);
      }
    } catch (error) {
      // Try fallback if enabled
      if (smsService.enableFallback) {
        try {
          return await smsService.sendWithFallback(phoneNumber, message, 
            smsService.selectProvider(phoneNumber));
        } catch (fallbackError) {
          throw fallbackError;
        }
      }
      throw error;
    }
  }

  /**
   * Format message for SMS (keep it short!)
   */
  formatSmsMessage(content) {
    let message = content.body;
    
    // Truncate if too long (SMS is 160 chars for GSM, less for Unicode)
    const maxLength = 160;
    if (message.length > maxLength) {
      message = message.substring(0, maxLength - 3) + '...';
    }
    
    return message;
  }
}

export default new SMSChannel();