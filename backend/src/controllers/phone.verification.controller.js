// backend/controllers/phoneVerificationController.js

import { prisma } from '../config/prisma.config.js';
import smsService from '../services/sms/sms.service.js';
import otpUtils from '../../utils/otpUtils.js';
import { isPhoneVerificationRequired } from '../config/verification.config.js';

/**
 * Send phone verification OTP
 * POST /api/verification/phone/send
 */
export const sendPhoneVerification = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }
    
    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Validate phone number format
    const phoneValidation = smsService.validatePhoneNumber(phoneNumber);
    if (!phoneValidation.valid) {
      return res.status(400).json({ 
        error: phoneValidation.error || 'Invalid phone number format' 
      });
    }
    
    // Normalize phone number
    const normalizedPhone = smsService.normalizePhoneNumber(phoneNumber);
    
    // Check if phone already verified for this user
    if (user.phoneVerified && user.phone === normalizedPhone) {
      return res.status(400).json({ 
        error: 'Phone number already verified',
        verified: true 
      });
    }
    
    // Check if phone is already used by another user
    const existingPhone = await prisma.user.findFirst({
      where: {
        phone: normalizedPhone,
        id: { not: userId },
        phoneVerified: true
      }
    });
    
    if (existingPhone) {
      return res.status(400).json({ 
        error: 'This phone number is already registered to another account' 
      });
    }
    
    // Check if locked out
    if (otpUtils.isLockedOut(user.phoneVerificationLockedUntil)) {
      const remainingTime = new Date(user.phoneVerificationLockedUntil) - new Date();
      const remainingMinutes = Math.ceil(remainingTime / 60000);
      
      return res.status(429).json({ 
        error: `Too many failed attempts. Please try again in ${remainingMinutes} minutes`,
        lockedUntil: user.phoneVerificationLockedUntil
      });
    }
    
    // Check rate limiting
    const rateLimitCheck = otpUtils.canSendOTP(
      user.lastPhoneOtpSent,
      user.phoneOtpSendCount,
      user.phoneOtpResetTime
    );
    
    if (!rateLimitCheck.allowed) {
      if (rateLimitCheck.reason === 'cooldown') {
        return res.status(429).json({ 
          error: `Please wait ${rateLimitCheck.remainingSeconds} seconds before requesting a new code`,
          remainingSeconds: rateLimitCheck.remainingSeconds
        });
      } else if (rateLimitCheck.reason === 'rate_limit') {
        return res.status(429).json({ 
          error: `Maximum SMS requests reached. Please try again in ${rateLimitCheck.remainingMinutes} minutes`,
          remainingMinutes: rateLimitCheck.remainingMinutes
        });
      }
    }
    
    // Generate OTP
    const otp = otpUtils.generateOTP();
    const hashedOTP = await otpUtils.hashOTP(otp);
    const expiryTime = otpUtils.getExpiryTime();
    
    // Send SMS
    let smsResult;
    try {
      smsResult = await smsService.sendOTP(normalizedPhone, otp, user.name);
    } catch (smsError) {
      console.error('❌ SMS send failed:', smsError);
      return res.status(500).json({ 
        error: 'Failed to send SMS. Please check your phone number and try again.' 
      });
    }
    
    // Update user with new OTP and phone number
    const updateData = {
      phone: normalizedPhone,
      phoneCountryCode: phoneValidation.countryCode || '+977',
      phoneVerificationToken: hashedOTP,
      phoneVerificationExpiry: expiryTime,
      lastPhoneOtpSent: new Date(),
    };
    
    // Handle rate limit reset or increment
    if (rateLimitCheck.shouldReset) {
      updateData.phoneOtpSendCount = 1;
      updateData.phoneOtpResetTime = otpUtils.getResetTime();
    } else {
      updateData.phoneOtpSendCount = user.phoneOtpSendCount + 1;
      if (!user.phoneOtpResetTime) {
        updateData.phoneOtpResetTime = otpUtils.getResetTime();
      }
    }
    
    await prisma.user.update({
      where: { id: userId },
      data: updateData
    });
    
    console.log(`✅ Phone OTP sent to ${normalizedPhone} via ${smsResult.provider}`);
    
    // Log verification attempt
    await prisma.verificationLog.create({
      data: {
        userId: userId,
        type: 'PHONE',
        action: 'SENT',
        provider: smsResult.provider,
        success: true,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    }).catch(err => console.log('Log error:', err));
    
    res.json({
      success: true,
      message: 'Verification code sent to your phone',
      maskedPhone: otpUtils.maskPhoneNumber(normalizedPhone),
      provider: smsResult.provider,
      expiresIn: otpUtils.otpExpiryMinutes,
      remainingSends: otpUtils.maxSendsPerWindow - updateData.phoneOtpSendCount
    });
    
  } catch (error) {
    console.error('❌ Send phone verification error:', error);
    res.status(500).json({ 
      error: 'Failed to send verification code. Please try again.' 
    });
  }
};

/**
 * Verify phone OTP
 * POST /api/verification/phone/verify
 */
export const verifyPhone = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { otp } = req.body;
    
    if (!otp) {
      return res.status(400).json({ error: 'OTP is required' });
    }
    
    // Validate OTP format
    if (!otpUtils.isValidOTPFormat(otp)) {
      return res.status(400).json({ 
        error: `Please enter a valid ${otpUtils.otpLength}-digit code` 
      });
    }
    
    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if phone exists
    if (!user.phone) {
      return res.status(400).json({ 
        error: 'No phone number found. Please request verification code first' 
      });
    }
    
    // Check if already verified
    if (user.phoneVerified) {
      return res.status(400).json({ 
        error: 'Phone already verified',
        verified: true 
      });
    }
    
    // Check if locked out
    if (otpUtils.isLockedOut(user.phoneVerificationLockedUntil)) {
      const remainingTime = new Date(user.phoneVerificationLockedUntil) - new Date();
      const remainingMinutes = Math.ceil(remainingTime / 60000);
      
      return res.status(429).json({ 
        error: `Account locked due to too many failed attempts. Try again in ${remainingMinutes} minutes`,
        lockedUntil: user.phoneVerificationLockedUntil
      });
    }
    
    // Check if OTP exists
    if (!user.phoneVerificationToken) {
      return res.status(400).json({ 
        error: 'No verification code found. Please request a new one' 
      });
    }
    
    // Check if expired
    if (otpUtils.isExpired(user.phoneVerificationExpiry)) {
      return res.status(400).json({ 
        error: 'Verification code expired. Please request a new one',
        expired: true 
      });
    }
    
    // Verify OTP
    const isValid = await otpUtils.verifyOTP(otp, user.phoneVerificationToken);
    
    if (!isValid) {
      // Increment failed attempts
      const newAttempts = user.phoneVerificationAttempts + 1;
      const shouldLock = otpUtils.shouldLockAccount(newAttempts);
      
      const updateData = {
        phoneVerificationAttempts: newAttempts
      };
      
      if (shouldLock) {
        updateData.phoneVerificationLockedUntil = otpUtils.getLockExpiryTime();
      }
      
      await prisma.user.update({
        where: { id: userId },
        data: updateData
      });
      
      // Log failed attempt
      await prisma.verificationLog.create({
        data: {
          userId: userId,
          type: 'PHONE',
          action: 'FAILED',
          success: false,
          errorMessage: 'Invalid OTP',
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        }
      }).catch(err => console.log('Log error:', err));
      
      if (shouldLock) {
        return res.status(429).json({ 
          error: 'Too many failed attempts. Account locked for 1 hour',
          locked: true,
          lockedUntil: updateData.phoneVerificationLockedUntil
        });
      }
      
      const attemptsRemaining = otpUtils.maxAttempts - newAttempts;
      return res.status(400).json({ 
        error: 'Invalid verification code',
        attemptsRemaining
      });
    }
    
    // Success! Verify phone
    await prisma.user.update({
      where: { id: userId },
      data: {
        phoneVerified: true,
        phoneVerificationToken: null,
        phoneVerificationExpiry: null,
        phoneVerificationAttempts: 0,
        phoneVerificationLockedUntil: null,
        phoneOtpSendCount: 0,
        phoneOtpResetTime: null
      }
    });
    
    // Log successful verification
    await prisma.verificationLog.create({
      data: {
        userId: userId,
        type: 'PHONE',
        action: 'VERIFIED',
        success: true,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    }).catch(err => console.log('Log error:', err));
    
    console.log(`✅ Phone verified for user ${userId}`);
    
    res.json({
      success: true,
      message: 'Phone verified successfully!',
      verified: true
    });
    
  } catch (error) {
    console.error('❌ Verify phone error:', error);
    res.status(500).json({ 
      error: 'Failed to verify code. Please try again.' 
    });
  }
};

/**
 * Check phone verification status
 * GET /api/verification/phone/status
 */
export const getPhoneVerificationStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        phoneVerified: true,
        phone: true,
        phoneVerificationLockedUntil: true,
        role: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      verified: user.phoneVerified,
      phone: user.phone,
      maskedPhone: user.phone ? otpUtils.maskPhoneNumber(user.phone) : null,
      locked: otpUtils.isLockedOut(user.phoneVerificationLockedUntil),
      lockedUntil: user.phoneVerificationLockedUntil,
      required: isPhoneVerificationRequired(user.role)
    });
    
  } catch (error) {
    console.error('❌ Get phone status error:', error);
    res.status(500).json({ error: 'Failed to get verification status' });
  }
};