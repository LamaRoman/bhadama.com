// backend/controllers/emailVerificationController.js

import { prisma } from '../config/prisma.js';
import emailService from '../services/email/emailService.js';
import otpUtils from '../../utils/otpUtils.js';

/**
 * Send email verification OTP
 * POST /api/verification/email/send
 */
export const sendEmailVerification = async (req, res) => {
  try {
    const userId = req.user.userId; // From auth middleware
    
    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if already verified
    if (user.emailVerified) {
      return res.status(400).json({ 
        error: 'Email already verified',
        verified: true 
      });
    }
    
    // Check if locked out
    if (otpUtils.isLockedOut(user.emailVerificationLockedUntil)) {
      const remainingTime = new Date(user.emailVerificationLockedUntil) - new Date();
      const remainingMinutes = Math.ceil(remainingTime / 60000);
      
      return res.status(429).json({ 
        error: `Too many failed attempts. Please try again in ${remainingMinutes} minutes`,
        lockedUntil: user.emailVerificationLockedUntil
      });
    }
    
    // Check rate limiting
    const rateLimitCheck = otpUtils.canSendOTP(
      user.lastEmailOtpSent,
      user.emailOtpSendCount,
      user.emailOtpResetTime
    );
    
    if (!rateLimitCheck.allowed) {
      if (rateLimitCheck.reason === 'cooldown') {
        return res.status(429).json({ 
          error: `Please wait ${rateLimitCheck.remainingSeconds} seconds before requesting a new code`,
          remainingSeconds: rateLimitCheck.remainingSeconds
        });
      } else if (rateLimitCheck.reason === 'rate_limit') {
        return res.status(429).json({ 
          error: `Maximum verification attempts reached. Please try again in ${rateLimitCheck.remainingMinutes} minutes`,
          remainingMinutes: rateLimitCheck.remainingMinutes
        });
      }
    }
    
    // Generate OTP
    const otp = otpUtils.generateOTP();
    const hashedOTP = await otpUtils.hashOTP(otp);
    const expiryTime = otpUtils.getExpiryTime();
    
    // Update user with new OTP
    const updateData = {
      emailVerificationToken: hashedOTP,
      emailVerificationExpiry: expiryTime,
      lastEmailOtpSent: new Date(),
    };
    
    // Handle rate limit reset or increment
    if (rateLimitCheck.shouldReset) {
      updateData.emailOtpSendCount = 1;
      updateData.emailOtpResetTime = otpUtils.getResetTime();
    } else {
      updateData.emailOtpSendCount = user.emailOtpSendCount + 1;
      if (!user.emailOtpResetTime) {
        updateData.emailOtpResetTime = otpUtils.getResetTime();
      }
    }
    
    await prisma.user.update({
      where: { id: userId },
      data: updateData
    });
    
    // Send email
    await emailService.sendVerificationOTP(user.email, otp, user.name);
    
    console.log(`✅ Email OTP sent to ${user.email}`);
    
    // Log verification attempt (optional)
    await prisma.verificationLog.create({
      data: {
        userId: userId,
        type: 'EMAIL',
        action: 'SENT',
        provider: 'resend',
        success: true,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    }).catch(err => console.log('Log error:', err));
    
    res.json({
      success: true,
      message: 'Verification code sent to your email',
      maskedEmail: otpUtils.maskEmail(user.email),
      expiresIn: otpUtils.otpExpiryMinutes,
      remainingSends: otpUtils.maxSendsPerWindow - updateData.emailOtpSendCount
    });
    
  } catch (error) {
    console.error('❌ Send email verification error:', error);
    res.status(500).json({ 
      error: 'Failed to send verification code. Please try again.' 
    });
  }
};

/**
 * Verify email OTP
 * POST /api/verification/email/verify
 */
export const verifyEmail = async (req, res) => {
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
    
    // Check if already verified
    if (user.emailVerified) {
      return res.status(400).json({ 
        error: 'Email already verified',
        verified: true 
      });
    }
    
    // Check if locked out
    if (otpUtils.isLockedOut(user.emailVerificationLockedUntil)) {
      const remainingTime = new Date(user.emailVerificationLockedUntil) - new Date();
      const remainingMinutes = Math.ceil(remainingTime / 60000);
      
      return res.status(429).json({ 
        error: `Account locked due to too many failed attempts. Try again in ${remainingMinutes} minutes`,
        lockedUntil: user.emailVerificationLockedUntil
      });
    }
    
    // Check if OTP exists
    if (!user.emailVerificationToken) {
      return res.status(400).json({ 
        error: 'No verification code found. Please request a new one' 
      });
    }
    
    // Check if expired
    if (otpUtils.isExpired(user.emailVerificationExpiry)) {
      return res.status(400).json({ 
        error: 'Verification code expired. Please request a new one',
        expired: true 
      });
    }
    
    // Verify OTP
    const isValid = await otpUtils.verifyOTP(otp, user.emailVerificationToken);
    
    if (!isValid) {
      // Increment failed attempts
      const newAttempts = user.emailVerificationAttempts + 1;
      const shouldLock = otpUtils.shouldLockAccount(newAttempts);
      
      const updateData = {
        emailVerificationAttempts: newAttempts
      };
      
      if (shouldLock) {
        updateData.emailVerificationLockedUntil = otpUtils.getLockExpiryTime();
      }
      
      await prisma.user.update({
        where: { id: userId },
        data: updateData
      });
      
      // Log failed attempt
      await prisma.verificationLog.create({
        data: {
          userId: userId,
          type: 'EMAIL',
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
          lockedUntil: updateData.emailVerificationLockedUntil
        });
      }
      
      const attemptsRemaining = otpUtils.maxAttempts - newAttempts;
      return res.status(400).json({ 
        error: 'Invalid verification code',
        attemptsRemaining
      });
    }
    
    // Success! Verify email
    await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiry: null,
        emailVerificationAttempts: 0,
        emailVerificationLockedUntil: null,
        emailOtpSendCount: 0,
        emailOtpResetTime: null
      }
    });
    
    // Log successful verification
    await prisma.verificationLog.create({
      data: {
        userId: userId,
        type: 'EMAIL',
        action: 'VERIFIED',
        success: true,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    }).catch(err => console.log('Log error:', err));
    
    // Send welcome email
    emailService.sendWelcomeEmail(user.email, user.name, user.role)
      .catch(err => console.log('Welcome email error:', err));
    
    console.log(`✅ Email verified for user ${userId}`);
    
    res.json({
      success: true,
      message: 'Email verified successfully!',
      verified: true
    });
    
  } catch (error) {
    console.error('❌ Verify email error:', error);
    res.status(500).json({ 
      error: 'Failed to verify code. Please try again.' 
    });
  }
};

/**
 * Check email verification status
 * GET /api/verification/email/status
 */
export const getEmailVerificationStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        emailVerified: true,
        email: true,
        emailVerificationLockedUntil: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      verified: user.emailVerified,
      email: user.email,
      maskedEmail: otpUtils.maskEmail(user.email),
      locked: otpUtils.isLockedOut(user.emailVerificationLockedUntil),
      lockedUntil: user.emailVerificationLockedUntil
    });
    
  } catch (error) {
    console.error('❌ Get email status error:', error);
    res.status(500).json({ error: 'Failed to get verification status' });
  }
};