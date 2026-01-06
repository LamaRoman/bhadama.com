// backend/services/sms/smsService.js

import twilio from 'twilio';
import axios from 'axios';

class SMSService {
  constructor() {
    // Twilio configuration
    this.twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    this.twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
    
    // Sparrow configuration
    this.sparrowToken = process.env.SPARROW_API_TOKEN;
    this.sparrowFrom = process.env.SPARROW_FROM || 'YourBrand';
    
    // Provider selection
    this.nepalProvider = process.env.SMS_NEPAL_PROVIDER || 'twilio';
    this.internationalProvider = process.env.SMS_INTERNATIONAL_PROVIDER || 'twilio';
    this.enableFallback = process.env.SMS_ENABLE_FALLBACK === 'true';
  }

  /**
   * Main method to send OTP SMS
   * Automatically selects provider based on phone number
   */
  async sendOTP(phoneNumber, otp, userName = 'User') {
    const provider = this.selectProvider(phoneNumber);
    const message = this.formatOTPMessage(otp, userName);
    
    console.log(`📱 Sending OTP to ${phoneNumber} via ${provider}`);
    
    try {
      if (provider === 'sparrow') {
        return await this.sendViaSparrow(phoneNumber, message);
      } else {
        return await this.sendViaTwilio(phoneNumber, message);
      }
    } catch (error) {
      console.error(`❌ ${provider} failed:`, error.message);
      
      // Try fallback provider if enabled
      if (this.enableFallback) {
        console.log(`🔄 Attempting fallback...`);
        return await this.sendWithFallback(phoneNumber, message, provider);
      }
      
      throw error;
    }
  }

  /**
   * Select SMS provider based on phone number
   */
  selectProvider(phoneNumber) {
    // Normalize phone number
    const normalized = phoneNumber.replace(/\D/g, '');
    
    // Check if Nepal number (+977)
    if (normalized.startsWith('977') || 
        (!normalized.startsWith('977') && normalized.length === 10)) {
      return this.nepalProvider;
    }
    
    // International number
    return this.internationalProvider;
  }

  /**
   * Format OTP message
   */
  formatOTPMessage(otp, userName) {
    return `Hi ${userName},

Your verification code is: ${otp}

This code expires in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.

Do not share this code with anyone.

- ${process.env.SPARROW_FROM || 'YourBrand'}`;
  }

  /**
   * Send SMS via Twilio
   */
  async sendViaTwilio(phoneNumber, message) {
    try {
      const result = await this.twilioClient.messages.create({
        body: message,
        from: this.twilioPhoneNumber,
        to: this.normalizePhoneNumber(phoneNumber)
      });
      
      console.log(`✅ Twilio sent: ${result.sid}`);
      
      return {
        success: true,
        provider: 'twilio',
        messageId: result.sid,
        status: result.status
      };
    } catch (error) {
      console.error('❌ Twilio error:', error.message);
      throw new Error(`Twilio failed: ${error.message}`);
    }
  }

  /**
   * Send SMS via Sparrow SMS
   */
  async sendViaSparrow(phoneNumber, message) {
    try {
      // Sparrow SMS API endpoint
      const url = 'http://api.sparrowsms.com/v2/sms/';
      
      // Clean phone number for Sparrow (expects 98XXXXXXXX format for Nepal)
      const cleanedNumber = phoneNumber.replace(/\D/g, '');
      let sparrowNumber = cleanedNumber;
      
      // If starts with 977, remove country code
      if (cleanedNumber.startsWith('977')) {
        sparrowNumber = cleanedNumber.substring(3);
      }
      
      const response = await axios.post(url, {
        token: this.sparrowToken,
        from: this.sparrowFrom,
        to: sparrowNumber,
        text: message
      });
      
      if (response.data.response_code === 200) {
        console.log(`✅ Sparrow sent successfully`);
        
        return {
          success: true,
          provider: 'sparrow',
          messageId: response.data.response?.id,
          status: 'sent'
        };
      } else {
        throw new Error(response.data.response || 'Sparrow SMS failed');
      }
    } catch (error) {
      console.error('❌ Sparrow error:', error.message);
      throw new Error(`Sparrow failed: ${error.response?.data?.response || error.message}`);
    }
  }

  /**
   * Fallback mechanism
   */
  async sendWithFallback(phoneNumber, message, failedProvider) {
    const fallbackProvider = failedProvider === 'sparrow' ? 'twilio' : 'sparrow';
    
    console.log(`🔄 Using fallback provider: ${fallbackProvider}`);
    
    try {
      if (fallbackProvider === 'twilio') {
        return await this.sendViaTwilio(phoneNumber, message);
      } else {
        return await this.sendViaSparrow(phoneNumber, message);
      }
    } catch (error) {
      console.error(`❌ Fallback ${fallbackProvider} also failed:`, error.message);
      throw new Error(`Both providers failed. Last error: ${error.message}`);
    }
  }

  /**
   * Normalize phone number to E.164 format
   */
  normalizePhoneNumber(phone) {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // If starts with country code, add +
    if (cleaned.startsWith('977')) {
      return '+' + cleaned;
    }
    
    // If Nepal local number (10 digits starting with 98, 97, 96)
    if (cleaned.length === 10 && (cleaned.startsWith('98') || cleaned.startsWith('97') || cleaned.startsWith('96'))) {
      return '+977' + cleaned;
    }
    
    // If already has +, return as is
    if (phone.startsWith('+')) {
      return phone;
    }
    
    // Default: assume it's formatted correctly
    return '+' + cleaned;
  }

  /**
   * Validate phone number format
   */
  validatePhoneNumber(phone) {
    const cleaned = phone.replace(/\D/g, '');
    
    // Nepal: 10 digits starting with 98/97/96, or with country code 977
    if (cleaned.startsWith('977') && cleaned.length === 12) {
      return { valid: true, country: 'Nepal', countryCode: '+977' };
    }
    
    if (cleaned.length === 10 && (cleaned.startsWith('98') || cleaned.startsWith('97') || cleaned.startsWith('96'))) {
      return { valid: true, country: 'Nepal', countryCode: '+977' };
    }
    
    // International: E.164 format (1-15 digits with country code)
    if (cleaned.length >= 10 && cleaned.length <= 15) {
      return { valid: true, country: 'International', countryCode: null };
    }
    
    return { valid: false, error: 'Invalid phone number format' };
  }
}

// Singleton instance
const smsService = new SMSService();

export default smsService;