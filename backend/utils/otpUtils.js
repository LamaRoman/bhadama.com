// backend/utils/otpUtils.js

import bcrypt from 'bcrypt';
import crypto from 'crypto';

class OTPUtils {
  constructor() {
    this.otpLength = parseInt(process.env.OTP_LENGTH) || 6;
    this.otpExpiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;
    this.maxAttempts = parseInt(process.env.OTP_MAX_ATTEMPTS) || 5;
    this.lockDurationMinutes = parseInt(process.env.OTP_LOCK_DURATION_MINUTES) || 60;
    this.maxSendsPerWindow = parseInt(process.env.OTP_MAX_SENDS_PER_WINDOW) || 3;
    this.sendWindowMinutes = parseInt(process.env.OTP_SEND_WINDOW_MINUTES) || 15;
    this.resendCooldownSeconds = parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS) || 60;
  }

  /**
   * Generate a random numeric OTP
   */
  generateOTP() {
    const digits = '0123456789';
    let otp = '';
    
    // Use crypto for secure random generation
    const randomBytes = crypto.randomBytes(this.otpLength);
    
    for (let i = 0; i < this.otpLength; i++) {
      otp += digits[randomBytes[i] % digits.length];
    }
    
    return otp;
  }

  /**
   * Hash OTP for secure storage
   */
  async hashOTP(otp) {
    const saltRounds = 10;
    return await bcrypt.hash(otp, saltRounds);
  }

  /**
   * Verify OTP against hashed value
   */
  async verifyOTP(plainOTP, hashedOTP) {
    return await bcrypt.compare(plainOTP, hashedOTP);
  }

  /**
   * Get OTP expiry time
   */
  getExpiryTime() {
    return new Date(Date.now() + this.otpExpiryMinutes * 60 * 1000);
  }

  /**
   * Check if OTP is expired
   */
  isExpired(expiryTime) {
    return new Date() > new Date(expiryTime);
  }

  /**
   * Check if user is locked out
   */
  isLockedOut(lockedUntil) {
    if (!lockedUntil) return false;
    return new Date() < new Date(lockedUntil);
  }

  /**
   * Get lock expiry time
   */
  getLockExpiryTime() {
    return new Date(Date.now() + this.lockDurationMinutes * 60 * 1000);
  }

  /**
   * Check rate limiting for OTP sends
   */
  canSendOTP(lastSent, sendCount, resetTime) {
    const now = new Date();
    
    // Check cooldown period (60 seconds between sends)
    if (lastSent) {
      const timeSinceLastSend = (now - new Date(lastSent)) / 1000;
      if (timeSinceLastSend < this.resendCooldownSeconds) {
        const remainingSeconds = Math.ceil(this.resendCooldownSeconds - timeSinceLastSend);
        return {
          allowed: false,
          reason: 'cooldown',
          remainingSeconds
        };
      }
    }
    
    // Check if we need to reset the send window
    if (resetTime && now > new Date(resetTime)) {
      return {
        allowed: true,
        shouldReset: true
      };
    }
    
    // Check if exceeded max sends in window
    if (sendCount >= this.maxSendsPerWindow) {
      const remainingTime = resetTime ? new Date(resetTime) - now : 0;
      const remainingMinutes = Math.ceil(remainingTime / 60000);
      
      return {
        allowed: false,
        reason: 'rate_limit',
        remainingMinutes
      };
    }
    
    return {
      allowed: true,
      shouldReset: false
    };
  }

  /**
   * Get reset time for rate limiting window
   */
  getResetTime() {
    return new Date(Date.now() + this.sendWindowMinutes * 60 * 1000);
  }

  /**
   * Increment failed attempts and check if should lock
   */
  shouldLockAccount(currentAttempts) {
    return currentAttempts >= this.maxAttempts;
  }

  /**
   * Format time remaining for user display
   */
  formatTimeRemaining(seconds) {
    if (seconds < 60) {
      return `${seconds} seconds`;
    }
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }

  /**
   * Sanitize phone number for display
   */
  maskPhoneNumber(phoneNumber) {
    // Show only last 4 digits: +977 98XX XXX 1234
    if (!phoneNumber) return '';
    
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length < 4) return phoneNumber;
    
    const lastFour = cleaned.slice(-4);
    const masked = cleaned.slice(0, -4).replace(/\d/g, 'X');
    
    return `+${masked}${lastFour}`;
  }

  /**
   * Sanitize email for display
   */
  maskEmail(email) {
    // Show only first 2 chars and domain: ab***@example.com
    if (!email) return '';
    
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 2) {
      return `${localPart[0]}***@${domain}`;
    }
    
    return `${localPart.substring(0, 2)}***@${domain}`;
  }

  /**
   * Validate OTP format
   */
  isValidOTPFormat(otp) {
    // Must be exactly otpLength digits
    const otpRegex = new RegExp(`^\\d{${this.otpLength}}$`);
    return otpRegex.test(otp);
  }
}

// Singleton instance
const otpUtils = new OTPUtils();

export default otpUtils;