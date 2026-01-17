// backend/services/sms/smsService.js
// UPDATED: Better international phone number support

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
    
    // Sparrow configuration (Nepal only)
    this.sparrowToken = process.env.SPARROW_API_TOKEN;
    this.sparrowFrom = process.env.SPARROW_FROM || 'YourBrand';
    
    // Provider selection
    this.nepalProvider = process.env.SMS_NEPAL_PROVIDER || 'twilio';
    this.internationalProvider = process.env.SMS_INTERNATIONAL_PROVIDER || 'twilio';
    this.enableFallback = process.env.SMS_ENABLE_FALLBACK === 'true';

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
      'TH': { code: '66', minLength: 9, maxLength: 9, pattern: /^\d{9}$/ },
      'PH': { code: '63', minLength: 10, maxLength: 10, pattern: /^\d{10}$/ },
      'ID': { code: '62', minLength: 9, maxLength: 12, pattern: /^\d{9,12}$/ },
      'VN': { code: '84', minLength: 9, maxLength: 10, pattern: /^\d{9,10}$/ },
      'JP': { code: '81', minLength: 10, maxLength: 11, pattern: /^\d{10,11}$/ },
      'KR': { code: '82', minLength: 9, maxLength: 10, pattern: /^\d{9,10}$/ },
      'CN': { code: '86', minLength: 11, maxLength: 11, pattern: /^\d{11}$/ },
      'DE': { code: '49', minLength: 10, maxLength: 11, pattern: /^\d{10,11}$/ },
      'FR': { code: '33', minLength: 9, maxLength: 9, pattern: /^\d{9}$/ },
      'IT': { code: '39', minLength: 9, maxLength: 10, pattern: /^\d{9,10}$/ },
      'ES': { code: '34', minLength: 9, maxLength: 9, pattern: /^\d{9}$/ },
      'NL': { code: '31', minLength: 9, maxLength: 9, pattern: /^\d{9}$/ },
      'BE': { code: '32', minLength: 9, maxLength: 9, pattern: /^\d{9}$/ },
      'CH': { code: '41', minLength: 9, maxLength: 9, pattern: /^\d{9}$/ },
      'AT': { code: '43', minLength: 10, maxLength: 11, pattern: /^\d{10,11}$/ },
      'SE': { code: '46', minLength: 9, maxLength: 9, pattern: /^\d{9}$/ },
      'NO': { code: '47', minLength: 8, maxLength: 8, pattern: /^\d{8}$/ },
      'DK': { code: '45', minLength: 8, maxLength: 8, pattern: /^\d{8}$/ },
      'FI': { code: '358', minLength: 9, maxLength: 10, pattern: /^\d{9,10}$/ },
      'IE': { code: '353', minLength: 9, maxLength: 9, pattern: /^\d{9}$/ },
      'PT': { code: '351', minLength: 9, maxLength: 9, pattern: /^\d{9}$/ },
      'PL': { code: '48', minLength: 9, maxLength: 9, pattern: /^\d{9}$/ },
      'RU': { code: '7', minLength: 10, maxLength: 10, pattern: /^\d{10}$/ },
      'BR': { code: '55', minLength: 10, maxLength: 11, pattern: /^\d{10,11}$/ },
      'MX': { code: '52', minLength: 10, maxLength: 10, pattern: /^\d{10}$/ },
      'ZA': { code: '27', minLength: 9, maxLength: 9, pattern: /^\d{9}$/ },
      'NZ': { code: '64', minLength: 9, maxLength: 10, pattern: /^\d{9,10}$/ },
      'SA': { code: '966', minLength: 9, maxLength: 9, pattern: /^\d{9}$/ },
      'QA': { code: '974', minLength: 8, maxLength: 8, pattern: /^\d{8}$/ },
      'KW': { code: '965', minLength: 8, maxLength: 8, pattern: /^\d{8}$/ },
      'BH': { code: '973', minLength: 8, maxLength: 8, pattern: /^\d{8}$/ },
      'OM': { code: '968', minLength: 8, maxLength: 8, pattern: /^\d{8}$/ },
      'HK': { code: '852', minLength: 8, maxLength: 8, pattern: /^\d{8}$/ },
      'TW': { code: '886', minLength: 9, maxLength: 9, pattern: /^\d{9}$/ },
    };
  }

  /**
   * Main method to send OTP SMS
   * Automatically selects provider based on phone number
   */
  async sendOTP(phoneNumber, otp, userName = 'User') {
    const provider = this.selectProvider(phoneNumber);
    const message = this.formatOTPMessage(otp, userName);
    
    console.log(`📱 Sending OTP to ${this.maskPhone(phoneNumber)} via ${provider}`);
    
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
    const normalized = phoneNumber.replace(/\D/g, '');
    
    // Check if Nepal number (+977)
    if (normalized.startsWith('977') || 
        (normalized.length === 10 && (normalized.startsWith('98') || normalized.startsWith('97') || normalized.startsWith('96')))) {
      return this.nepalProvider;
    }
    
    // International number - always use Twilio
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

- ${process.env.APP_NAME || 'MyBigYard'}`;
  }

  /**
   * Send SMS via Twilio (supports international)
   */
  async sendViaTwilio(phoneNumber, message) {
    try {
      const normalizedNumber = this.normalizePhoneNumber(phoneNumber);
      
      console.log(`📤 Twilio sending to: ${this.maskPhone(normalizedNumber)}`);
      
      const result = await this.twilioClient.messages.create({
        body: message,
        from: this.twilioPhoneNumber,
        to: normalizedNumber
      });
      
      console.log(`✅ Twilio sent: ${result.sid} (status: ${result.status})`);
      
      return {
        success: true,
        provider: 'twilio',
        messageId: result.sid,
        status: result.status
      };
    } catch (error) {
      console.error('❌ Twilio error:', error.message, error.code);
      
      // Provide more helpful error messages
      if (error.code === 21211) {
        throw new Error('Invalid phone number format. Please check and try again.');
      } else if (error.code === 21614) {
        throw new Error('This phone number cannot receive SMS. Please use a mobile number.');
      } else if (error.code === 21408) {
        throw new Error('SMS to this region is not supported. Please contact support.');
      }
      
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }

  /**
   * Send SMS via Sparrow SMS (Nepal only)
   */
  async sendViaSparrow(phoneNumber, message) {
    try {
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
      throw new Error(`Sparrow failed: ${error.response?.data?.response || error.message}`);
    }
  }

  /**
   * Fallback mechanism
   */
  async sendWithFallback(phoneNumber, message, failedProvider) {
    // For international numbers, only Twilio works
    if (!this.isNepalNumber(phoneNumber) && failedProvider === 'twilio') {
      throw new Error('SMS service temporarily unavailable. Please try again later.');
    }
    
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
      throw new Error(`SMS service unavailable. Please try again later.`);
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
   * 
   * If the phone already starts with +, return as-is
   * Otherwise, add the country code based on user's country
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
    
    // If starts with known country code, just add +
    if (cleaned.startsWith('977') || cleaned.startsWith('1') || cleaned.startsWith('44') || 
        cleaned.startsWith('91') || cleaned.startsWith('61') || cleaned.startsWith('86')) {
      return '+' + cleaned;
    }
    
    // Default: just add + and hope for the best
    return '+' + cleaned;
  }

  /**
   * Validate phone number format
   * UPDATED: Better international support
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
    // NEPAL NUMBER CHECK
    // =====================
    
    // Nepal with country code: 977XXXXXXXXXX (12-13 digits)
    if (cleaned.startsWith('977')) {
      const localNumber = cleaned.substring(3);
      if (localNumber.length === 10 && /^9[678]\d{8}$/.test(localNumber)) {
        return { 
          valid: true, 
          country: 'Nepal', 
          countryCode: '+977',
          normalized: '+977' + localNumber
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
        normalized: '+977' + cleaned
      };
    }

    // =====================
    // INTERNATIONAL NUMBER CHECK
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
          normalized: '+' + countryCodeDigits + localNumber
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
            normalized: '+' + cleaned
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
        normalized: '+' + cleaned
      };
    }
    
    return { 
      valid: false, 
      error: 'Invalid phone number format. Please include your country code (e.g., +1 for US, +44 for UK).' 
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
}

// Singleton instance
const smsService = new SMSService();

export default smsService;