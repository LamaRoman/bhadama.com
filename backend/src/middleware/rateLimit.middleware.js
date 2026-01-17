// ==========================================
// RATE LIMITING MIDDLEWARE
// ==========================================
// File: middleware/rateLimit.middleware.js
//
// Features:
// 1. Multiple rate limiters for different endpoints
// 2. Persistent storage using Prisma
// 3. IP-based and user-based limiting
// 4. Dynamic limits based on user risk
// ==========================================

import rateLimit from "express-rate-limit";
import { prisma } from "../config/prisma.config.js";
import crypto from "crypto";

// ==========================================
// CONFIGURATION
// ==========================================

const RATE_LIMITS = {
  global: { windowMs: 15 * 60 * 1000, max: 100 },
  login: { windowMs: 15 * 60 * 1000, max: 5 },
  registration: { windowMs: 60 * 60 * 1000, max: 3 },
  passwordReset: { windowMs: 60 * 60 * 1000, max: 3 },
  otp: { windowMs: 15 * 60 * 1000, max: 5 },
  payment: { windowMs: 60 * 1000, max: 5 },
  booking: { windowMs: 60 * 60 * 1000, max: 20 },
  upload: { windowMs: 60 * 60 * 1000, max: 50 },
  apiKey: { windowMs: 60 * 1000, max: 60 },
};

// ==========================================
// CUSTOM STORE (Prisma-based)
// ==========================================

class PrismaRateLimitStore {
  constructor(prefix = "ratelimit") {
    this.prefix = prefix;
  }

  async increment(key) {
    const fullKey = `${this.prefix}:${key}`;
    const now = new Date();

    try {
      // Try to update existing record
      const updated = await prisma.rateLimitRecord.updateMany({
        where: {
          key: fullKey,
          expiresAt: { gt: now },
        },
        data: {
          count: { increment: 1 },
        },
      });

      if (updated.count === 0) {
        // Create new record
        const record = await prisma.rateLimitRecord.create({
          data: {
            key: fullKey,
            count: 1,
            windowStart: now,
            expiresAt: new Date(now.getTime() + 15 * 60 * 1000),
          },
        });
        return {
          totalHits: 1,
          resetTime: record.expiresAt,
        };
      }

      // Get updated record
      const record = await prisma.rateLimitRecord.findFirst({
        where: { key: fullKey },
      });

      return {
        totalHits: record?.count || 1,
        resetTime: record?.expiresAt || new Date(now.getTime() + 15 * 60 * 1000),
      };
    } catch (error) {
      // Fallback - don't block on store errors
      console.error("Rate limit store error:", error.message);
      return { totalHits: 1, resetTime: new Date(Date.now() + 15 * 60 * 1000) };
    }
  }

  async decrement(key) {
    const fullKey = `${this.prefix}:${key}`;
    try {
      await prisma.rateLimitRecord.updateMany({
        where: {
          key: fullKey,
          count: { gt: 0 },
        },
        data: {
          count: { decrement: 1 },
        },
      });
    } catch (error) {
      console.error("Rate limit decrement error:", error.message);
    }
  }

  async resetKey(key) {
    const fullKey = `${this.prefix}:${key}`;
    try {
      await prisma.rateLimitRecord.deleteMany({
        where: { key: fullKey },
      });
    } catch (error) {
      console.error("Rate limit reset error:", error.message);
    }
  }
}

// ==========================================
// KEY GENERATORS
// ==========================================

/**
 * Generate key by IP only
 */
const keyByIp = (req) => req.ip;

/**
 * Generate key by IP + user ID
 */
const keyByIpAndUser = (req) => {
  const userId = req.user?.userId || req.user?.id || "anonymous";
  return `${req.ip}:${userId}`;
};

/**
 * Generate key by IP + email (for login)
 */
const keyByIpAndEmail = (req) => {
  const email = (req.body?.email || "unknown").toLowerCase().trim();
  const emailHash = crypto.createHash("sha256").update(email).digest("hex").slice(0, 16);
  return `${req.ip}:${emailHash}`;
};

/**
 * Generate key by IP + endpoint
 */
const keyByIpAndEndpoint = (req) => {
  return `${req.ip}:${req.path}`;
};

// ==========================================
// STANDARD RESPONSE HANDLER
// ==========================================

const standardHandler = (req, res, next, options) => {
  res.status(429).json({
    error: "Too many requests. Please try again later.",
    code: "RATE_LIMIT_EXCEEDED",
    retryAfter: Math.ceil(options.windowMs / 1000),
  });
};

// ==========================================
// RATE LIMITERS
// ==========================================

/**
 * Global API rate limiter
 */
export const globalLimiter = rateLimit({
  windowMs: RATE_LIMITS.global.windowMs,
  max: RATE_LIMITS.global.max,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyByIp,
  handler: standardHandler,
  skip: (req) => {
    // Skip health checks
    return req.path === "/health" || req.path === "/api/health";
  },
});

/**
 * Login rate limiter (stricter)
 */
export const loginLimiter = rateLimit({
  windowMs: RATE_LIMITS.login.windowMs,
  max: RATE_LIMITS.login.max,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyByIpAndEmail,
  handler: (req, res, next, options) => {
    // Log failed login attempt
    const email = req.body?.email || "unknown";
    console.warn(`🔒 Login rate limit exceeded for ${req.ip}, email: ${email.slice(0, 3)}***`);

    res.status(429).json({
      error: "Too many login attempts. Please try again in 15 minutes.",
      code: "LOGIN_RATE_LIMIT",
      retryAfter: Math.ceil(options.windowMs / 1000),
    });
  },
  skipSuccessfulRequests: false, // Count all requests
});

/**
 * Registration rate limiter
 */
export const registrationLimiter = rateLimit({
  windowMs: RATE_LIMITS.registration.windowMs,
  max: RATE_LIMITS.registration.max,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyByIp,
  handler: (req, res, next, options) => {
    res.status(429).json({
      error: "Too many registration attempts. Please try again later.",
      code: "REGISTRATION_RATE_LIMIT",
      retryAfter: Math.ceil(options.windowMs / 1000),
    });
  },
});

/**
 * Password reset rate limiter
 */
export const passwordResetLimiter = rateLimit({
  windowMs: RATE_LIMITS.passwordReset.windowMs,
  max: RATE_LIMITS.passwordReset.max,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyByIp,
  handler: (req, res, next, options) => {
    res.status(429).json({
      error: "Too many password reset attempts. Please try again later.",
      code: "PASSWORD_RESET_RATE_LIMIT",
      retryAfter: Math.ceil(options.windowMs / 1000),
    });
  },
});

/**
 * OTP verification rate limiter
 */
export const otpLimiter = rateLimit({
  windowMs: RATE_LIMITS.otp.windowMs,
  max: RATE_LIMITS.otp.max,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyByIpAndUser,
  handler: (req, res, next, options) => {
    res.status(429).json({
      error: "Too many verification attempts. Please try again later.",
      code: "OTP_RATE_LIMIT",
      retryAfter: Math.ceil(options.windowMs / 1000),
    });
  },
});

/**
 * Payment rate limiter
 */
export const paymentLimiter = rateLimit({
  windowMs: RATE_LIMITS.payment.windowMs,
  max: RATE_LIMITS.payment.max,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyByIpAndUser,
  handler: (req, res, next, options) => {
    res.status(429).json({
      error: "Too many payment attempts. Please wait a moment.",
      code: "PAYMENT_RATE_LIMIT",
      retryAfter: Math.ceil(options.windowMs / 1000),
    });
  },
});

/**
 * Booking rate limiter
 */
export const bookingLimiter = rateLimit({
  windowMs: RATE_LIMITS.booking.windowMs,
  max: RATE_LIMITS.booking.max,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyByIpAndUser,
  handler: (req, res, next, options) => {
    res.status(429).json({
      error: "Too many booking requests. Please try again later.",
      code: "BOOKING_RATE_LIMIT",
      retryAfter: Math.ceil(options.windowMs / 1000),
    });
  },
});

/**
 * File upload rate limiter
 */
export const uploadLimiter = rateLimit({
  windowMs: RATE_LIMITS.upload.windowMs,
  max: RATE_LIMITS.upload.max,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyByIpAndUser,
  handler: (req, res, next, options) => {
    res.status(429).json({
      error: "Too many uploads. Please try again later.",
      code: "UPLOAD_RATE_LIMIT",
      retryAfter: Math.ceil(options.windowMs / 1000),
    });
  },
});

/**
 * API key rate limiter
 */
export const apiKeyLimiter = rateLimit({
  windowMs: RATE_LIMITS.apiKey.windowMs,
  max: RATE_LIMITS.apiKey.max,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const apiKey = req.headers["x-api-key"] || req.query.api_key || "no-key";
    return crypto.createHash("sha256").update(apiKey).digest("hex").slice(0, 16);
  },
  handler: standardHandler,
});

// ==========================================
// DYNAMIC RATE LIMITER
// ==========================================

/**
 * Create a dynamic rate limiter based on user risk
 */
export const createDynamicLimiter = (baseOptions) => {
  return (req, res, next) => {
    // Calculate effective limit based on user
    let effectiveMax = baseOptions.max;

    if (req.user) {
      const riskScore = req.user.riskScore || 0;

      if (riskScore > 50) {
        // High risk - reduce limit by 50%
        effectiveMax = Math.ceil(baseOptions.max * 0.5);
      } else if (riskScore > 25) {
        // Medium risk - reduce limit by 25%
        effectiveMax = Math.ceil(baseOptions.max * 0.75);
      } else if (req.user.createdAt) {
        // Established users get higher limits
        const accountAge = Date.now() - new Date(req.user.createdAt).getTime();
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        if (accountAge > thirtyDays) {
          effectiveMax = Math.ceil(baseOptions.max * 1.5);
        }
      }
    }

    // Create limiter with effective limit
    const limiter = rateLimit({
      ...baseOptions,
      max: effectiveMax,
    });

    limiter(req, res, next);
  };
};

// ==========================================
// CLEANUP FUNCTION
// ==========================================

/**
 * Clean up expired rate limit records
 */
export async function cleanupExpiredRecords() {
  try {
    const result = await prisma.rateLimitRecord.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
    console.log(`Cleaned up ${result.count} expired rate limit records`);
    return result.count;
  } catch (error) {
    console.error("Rate limit cleanup error:", error.message);
    return 0;
  }
}

// ==========================================
// LEGACY COMPATIBILITY
// ==========================================

// Aliases for backward compatibility with your existing code
export const authLimiter = loginLimiter;

// ==========================================
// EXPORT ALL
// ==========================================

export default {
  globalLimiter,
  loginLimiter,
  authLimiter,
  registrationLimiter,
  passwordResetLimiter,
  otpLimiter,
  paymentLimiter,
  bookingLimiter,
  uploadLimiter,
  apiKeyLimiter,
  createDynamicLimiter,
  cleanupExpiredRecords,
  PrismaRateLimitStore,
};