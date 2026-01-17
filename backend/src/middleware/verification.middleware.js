
import { prisma } from '../config/prisma.config.js';
import { 
  isEmailVerificationRequired, 
  isPhoneVerificationRequired,
  getVerificationMessage 
} from '../config/verification.config.js';

/**
 * Middleware to check if email is verified
 * Blocks actions that require email verification
 */
export const requireEmailVerification = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    
    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        emailVerified: true,
        role: true,
        email: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if email verification is required for this role
    if (!isEmailVerificationRequired(user.role)) {
      return next(); // Not required, continue
    }
    
    // Check if verified
    if (!user.emailVerified) {
      const message = getVerificationMessage(user.role, 'email');
      return res.status(403).json({ 
        error: message,
        verificationRequired: true,
        verificationType: 'email',
        email: user.email
      });
    }
    
    // Verified, continue
    next();
    
  } catch (error) {
    console.error('❌ Email verification middleware error:', error);
    res.status(500).json({ error: 'Failed to check verification status' });
  }
};

/**
 * Middleware to check if phone is verified
 * Blocks actions that require phone verification (HOSTS only)
 */
export const requirePhoneVerification = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    
    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        phoneVerified: true,
        phone: true,
        role: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if phone verification is required for this role
    if (!isPhoneVerificationRequired(user.role)) {
      return next(); // Not required (USER role), continue
    }
    
    // Check if verified
    if (!user.phoneVerified) {
      const message = getVerificationMessage(user.role, 'phone');
      return res.status(403).json({ 
        error: message,
        verificationRequired: true,
        verificationType: 'phone',
        phone: user.phone
      });
    }
    
    // Verified, continue
    next();
    
  } catch (error) {
    console.error('❌ Phone verification middleware error:', error);
    res.status(500).json({ error: 'Failed to check verification status' });
  }
};

/**
 * Middleware to check if ALL required verifications are complete
 * Use this for critical actions (booking, listing, etc.)
 */
export const requireAllVerifications = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    
    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        emailVerified: true,
        phoneVerified: true,
        phone: true,
        email: true,
        role: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const missingVerifications = [];
    
    // Check email verification
    if (isEmailVerificationRequired(user.role) && !user.emailVerified) {
      missingVerifications.push({
        type: 'email',
        message: getVerificationMessage(user.role, 'email')
      });
    }
    
    // Check phone verification
    if (isPhoneVerificationRequired(user.role) && !user.phoneVerified) {
      missingVerifications.push({
        type: 'phone',
        message: getVerificationMessage(user.role, 'phone')
      });
    }
    
    // If any verifications are missing
    if (missingVerifications.length > 0) {
      return res.status(403).json({ 
        error: 'Please complete all required verifications',
        verificationRequired: true,
        missingVerifications,
        email: user.email,
        phone: user.phone
      });
    }
    
    // All verifications complete, continue
    next();
    
  } catch (error) {
    console.error('❌ All verifications middleware error:', error);
    res.status(500).json({ error: 'Failed to check verification status' });
  }
};