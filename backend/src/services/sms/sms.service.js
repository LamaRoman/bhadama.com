// backend/services/sms/sms.service.js
// UPDATED: Sparrow SMS only (Twilio removed)

import axios from 'axios';

class SMSService {
  constructor() {
    // Sparrow configuration
    this.sparrowToken = process.env.SPARROW_API_TOKEN;
    this.sparrowFrom = process.env.SPARROW_FROM || 'MyBigYard';
    
    // Country calling codes for validation
    this.countryCodes = {
      'NP': { code: '977', minLength: 10, maxLength: 10, pattern: /^9[78]\d{8}$/ },
      'IN': { code: '91', minLength: 10, maxLength: 10, pattern: /^[6-9]\d{9}$/ },
      'US': { code: '1', minLength: 10, maxLength: 10, pattern: /^\d{10}$/ },
      'GB': { code: '44', minLength: 10, maxLength: 11, pattern: /^\d{10,11}$/ },
      'AU': { code: '61', minLength: 9, maxLength: 9, pattern: /^\d{9}$/ },
      'CA': { code: '1', minLength: 10, maxLength: 10, pattern: /^\d{10}$/ },
      'AE': { code: '971', minLength: 9, maxLength: 9, pattern: /^\d{9}$/ },
      'SG': { code: '65', minLength: 8, maxLength: 8, pattern: /^\d{8}$/ },
      'MY': { code: '60', minLength: 9, maxLength: 10, pattern: /^\d{9,10}$/ },
      'BD': { code: '880', minLength: 10, maxLength: 10, pattern: /^\d{10}$/ },
      'PK': { code: '92', minLength: 10, maxLength: 10, pattern: /^\d{10}$/ },
      'LK': { code: '94', minLength: 9, maxLength: 9, pattern: /^\d{9}$/ },
    };
  }

  /**
   * Main method to send OTP SMS
   */
  async sendOTP(phoneNumber, otp, userName = 'User') {
    const message = this.formatOTPMessage(otp, userName);
    
    console.log(`📱 Sending OTP to ${this.maskPhone(phoneNumber)} via Sparrow`);
    
    // Check if this is a Nepal number
    if (!this.isNepalNumber(phoneNumber)) {
      console.warn(`⚠️ Non-Nepal number detected. Sparrow only supports Nepal numbers.`);
      throw new Error('SMS service only supports Nepal phone numbers (+977). For international numbers, please use email verification.');
    }
    
    return await this.sendViaSparrow(phoneNumber, message);
  }

  /**
   * Format OTP message
   */
  formatOTPMessage(otp, userName) {
    return `Hi ${userName},

Your verification code is: ${otp}

This code expires in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.

Do not share this code with anyone.

- ${process.env.APP_NAME || 'MyBigYard'}`;
  }

  /**
   * Send SMS via Sparrow SMS (Nepal only)
   */
  async sendViaSparrow(phoneNumber, message) {
    try {
      if (!this.sparrowToken) {
        throw new Error('Sparrow SMS not configured. Please set SPARROW_API_TOKEN in environment.');
      }

      const url = 'http://api.sparrowsms.com/v2/sms/';
      
      // Clean phone number for Sparrow (expects 98XXXXXXXX format for Nepal)
      const cleaned = phoneNumber.replace(/\D/g, '');
      let sparrowNumber = cleaned;
      
      // If starts with 977, remove country code
      if (cleaned.startsWith('977')) {
        sparrowNumber = cleaned.substring(3);
      }
      
      console.log(`📤 Sparrow sending to: ${this.maskPhone(sparrowNumber)}`);
      
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
      
      if (error.response?.status === 401) {
        throw new Error('SMS service authentication failed. Please contact support.');
      }
      
      throw new Error(`SMS failed: ${error.response?.data?.response || error.message}`);
    }
  }

  /**
   * Check if Nepal number
   */
  isNepalNumber(phone) {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.startsWith('977') || 
           (cleaned.length === 10 && (cleaned.startsWith('98') || cleaned.startsWith('97') || cleaned.startsWith('96')));
  }

  /**
   * Normalize phone number to E.164 format
   */
  normalizePhoneNumber(phone, countryCode = null) {
    if (!phone) return '';
    
    // Remove all non-digit characters except leading +
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    // If already in E.164 format (starts with +), return as-is
    if (cleaned.startsWith('+')) {
      return cleaned;
    }
    
    // Remove leading zeros
    cleaned = cleaned.replace(/^0+/, '');
    
    // If country code provided, add it
    if (countryCode && this.countryCodes[countryCode]) {
      const countryDialCode = this.countryCodes[countryCode].code;
      
      // Check if number already starts with country dial code
      if (cleaned.startsWith(countryDialCode)) {
        return '+' + cleaned;
      }
      
      // Add country code
      return '+' + countryDialCode + cleaned;
    }
    
    // Fallback: Try to detect Nepal number
    if (cleaned.length === 10 && /^9[678]/.test(cleaned)) {
      return '+977' + cleaned;
    }
    
    // If starts with 977, add +
    if (cleaned.startsWith('977')) {
      return '+' + cleaned;
    }
    
    // Default: just add + and hope for the best
    return '+' + cleaned;
  }

  /**
   * Validate phone number format
   */
  validatePhoneNumber(phone, userCountry = null) {
    if (!phone) {
      return { valid: false, error: 'Phone number is required' };
    }

    // Clean the input
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    // Remove leading + for processing
    const hasPlus = cleaned.startsWith('+');
    if (hasPlus) {
      cleaned = cleaned.substring(1);
    }
    
    // Remove leading zeros
    cleaned = cleaned.replace(/^0+/, '');

    // =====================
    // NEPAL NUMBER CHECK (Primary - Sparrow supported)
    // =====================
    
    // Nepal with country code: 977XXXXXXXXXX (12-13 digits)
    if (cleaned.startsWith('977')) {
      const localNumber = cleaned.substring(3);
      if (localNumber.length === 10 && /^9[678]\d{8}$/.test(localNumber)) {
        return { 
          valid: true, 
          country: 'Nepal', 
          countryCode: '+977',
          normalized: '+977' + localNumber,
          smsSupported: true
        };
      }
      return { valid: false, error: 'Invalid Nepal phone number. Must be 10 digits starting with 98, 97, or 96.' };
    }
    
    // Nepal without country code: 98XXXXXXXX, 97XXXXXXXX, 96XXXXXXXX
    if (cleaned.length === 10 && /^9[678]\d{8}$/.test(cleaned)) {
      return { 
        valid: true, 
        country: 'Nepal', 
        countryCode: '+977',
        normalized: '+977' + cleaned,
        smsSupported: true
      };
    }

    // =====================
    // INTERNATIONAL NUMBER CHECK (SMS not supported)
    // =====================
    
    // If user's country is provided, validate against that country's format
    if (userCountry && this.countryCodes[userCountry]) {
      const countryInfo = this.countryCodes[userCountry];
      const countryCodeDigits = countryInfo.code;
      
      let localNumber = cleaned;
      
      // Remove country code if present
      if (cleaned.startsWith(countryCodeDigits)) {
        localNumber = cleaned.substring(countryCodeDigits.length);
      }
      
      // Check length
      if (localNumber.length >= countryInfo.minLength && localNumber.length <= countryInfo.maxLength) {
        return {
          valid: true,
          country: userCountry,
          countryCode: '+' + countryCodeDigits,
          normalized: '+' + countryCodeDigits + localNumber,
          smsSupported: false,
          warning: 'SMS verification is only available for Nepal numbers. Please use email verification.'
        };
      }
      
      return { 
        valid: false, 
        error: `Invalid phone number for ${userCountry}. Expected ${countryInfo.minLength}-${countryInfo.maxLength} digits.` 
      };
    }

    // =====================
    // GENERIC INTERNATIONAL CHECK
    // =====================
    
    // Try to detect country from number
    for (const [country, info] of Object.entries(this.countryCodes)) {
      if (cleaned.startsWith(info.code)) {
        const localNumber = cleaned.substring(info.code.length);
        if (localNumber.length >= info.minLength && localNumber.length <= info.maxLength) {
          return {
            valid: true,
            country: country,
            countryCode: '+' + info.code,
            normalized: '+' + cleaned,
            smsSupported: country === 'NP',
            warning: country !== 'NP' ? 'SMS verification is only available for Nepal numbers. Please use email verification.' : undefined
          };
        }
      }
    }
    
    // Fallback: Accept if it looks like a valid E.164 number (10-15 digits)
    if (cleaned.length >= 10 && cleaned.length <= 15) {
      return {
        valid: true,
        country: 'International',
        countryCode: null,
        normalized: '+' + cleaned,
        smsSupported: false,
        warning: 'SMS verification is only available for Nepal numbers. Please use email verification.'
      };
    }
    
    return { 
      valid: false, 
      error: 'Invalid phone number format. Please include your country code (e.g., +977 for Nepal).' 
    };
  }

  /**
   * Mask phone number for display
   */
  maskPhone(phone) {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 6) return '***';
    return cleaned.substring(0, 3) + '****' + cleaned.substring(cleaned.length - 3);
  }

  /**
   * Check if SMS is supported for this number
   */
  isSMSSupported(phone) {
    return this.isNepalNumber(phone);
  }
}

// Singleton instance
const smsService = new SMSService();

export default smsService;