// ==========================================
// SECURITY MIDDLEWARE - MERGED & COMPREHENSIVE
// ==========================================
// File: middleware/security.middleware.js
//
// This is the SINGLE security middleware file you need.
// It combines and enhances both previous versions.
//
// Features:
// 1. Rate limiting (all types)
// 2. Security headers (Helmet)
// 3. CORS configuration
// 4. Input sanitization
// 5. Injection detection
// 6. Audit logging
// 7. Ownership verification (IDOR protection)
// 8. Suspicious activity detection
// 9. Request ID tracking
// 10. Secure cookies
// ==========================================

import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cors from "cors";
import crypto from "crypto";
import { prisma } from "../config/prisma.config.js";

// ==========================================
// HELPER: Safe IP extraction (handles IPv6)
// ==========================================

const getClientIp = (req) => {
  let ip = req.ip || req.socket?.remoteAddress || "unknown";
  
  // Handle IPv6 localhost (::1 or ::ffff:127.0.0.1)
  if (ip === "::1" || ip === "::ffff:127.0.0.1") {
    ip = "127.0.0.1";
  }
  
  // Strip IPv6 prefix if present (::ffff:)
  if (ip.startsWith("::ffff:")) {
    ip = ip.substring(7);
  }
  
  return ip;
};

// ==========================================
// RATE LIMITERS
// ==========================================

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: "Too many requests, please try again later",
    code: "RATE_LIMIT_EXCEEDED",
    retryAfter: 900,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip health checks
    if (req.path === "/health" || req.path === "/api/health") return true;
    // Skip for admin users (they make many dashboard requests)
    if (req.user?.role === "ADMIN") return true;
    return false;
  },
});

/**
 * Auth route rate limiter (stricter)
 * 5 failed attempts per 15 minutes per IP+email
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: "Too many login attempts. Please try again in 15 minutes.",
    code: "LOGIN_RATE_LIMIT",
    retryAfter: 900,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const ip = getClientIp(req);
    const email = (req.body?.email || "").toLowerCase().trim();
    const emailHash = email ? crypto.createHash("sha256").update(email).digest("hex").slice(0, 8) : "";
    return `${ip}-${emailHash}`;
  },
  handler: (req, res) => {
    console.warn(`🔒 Login rate limit hit: ${getClientIp(req)}`);
    res.status(429).json({
      error: "Too many login attempts. Please try again in 15 minutes.",
      code: "LOGIN_RATE_LIMIT",
      retryAfter: 900,
    });
  },
});

/**
 * Registration rate limiter
 * 3 registrations per hour per IP
 */
export const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    error: "Too many registration attempts. Please try again later.",
    code: "REGISTRATION_RATE_LIMIT",
    retryAfter: 3600,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Password reset rate limiter
 * 3 attempts per hour per IP
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    error: "Too many password reset attempts. Please try again later.",
    code: "PASSWORD_RESET_RATE_LIMIT",
    retryAfter: 3600,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * OTP verification rate limiter
 * 5 attempts per 15 minutes
 */
export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: "Too many verification attempts. Please try again later.",
    code: "OTP_RATE_LIMIT",
    retryAfter: 900,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = getClientIp(req);
    const userId = req.user?.userId || "anon";
    return `${ip}-${userId}`;
  },
});

/**
 * Payment route rate limiter
 * 5 payment attempts per minute per user
 */
export const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: {
    error: "Too many payment attempts. Please wait a moment.",
    code: "PAYMENT_RATE_LIMIT",
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const userId = req.user?.userId || req.user?.id;
    return userId ? userId.toString() : getClientIp(req);
  },
});

/**
 * Booking creation rate limiter
 * 20 booking attempts per hour per user
 */
export const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: {
    error: "Too many booking attempts. Please try again later.",
    code: "BOOKING_RATE_LIMIT",
    retryAfter: 3600,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const userId = req.user?.userId;
    return userId ? userId.toString() : getClientIp(req);
  },
});

/**
 * File upload rate limiter
 * 50 uploads per hour per user
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: {
    error: "Too many uploads. Please try again later.",
    code: "UPLOAD_RATE_LIMIT",
    retryAfter: 3600,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const userId = req.user?.userId;
    return userId ? userId.toString() : getClientIp(req);
  },
});

// ==========================================
// SECURITY HEADERS (Helmet)
// ==========================================

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://esewa.com.np",
        "https://rc-epay.esewa.com.np",
        "https://khalti.com",
        "https://a.khalti.com",
      ],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      fontSrc: ["'self'", "https:", "data:"],
      connectSrc: [
        "'self'",
        "https://api.khalti.com",
        "https://a.khalti.com",
        "https://esewa.com.np",
      ],
      frameSrc: [
        "https://esewa.com.np",
        "https://rc-epay.esewa.com.np",
        "https://khalti.com",
        "https://pay.khalti.com",
        "https://test-pay.khalti.com",
      ],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: [
        "'self'",
        "https://esewa.com.np",
        "https://rc-epay.esewa.com.np",
        "https://khalti.com",
      ],
      frameAncestors: ["'self'"],
      upgradeInsecureRequests: process.env.NODE_ENV === "production" ? [] : null,
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: "deny" },
  noSniff: true,
  xssFilter: true,
  hidePoweredBy: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  dnsPrefetchControl: { allow: false },
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "same-site" },
});

// ==========================================
// CORS CONFIGURATION
// ==========================================

const getAllowedOrigins = () => {
  const origins = [
    process.env.FRONTEND_URL,
    "https://mybigyard.com",
    "https://www.mybigyard.com",
  ].filter(Boolean);

  if (process.env.NODE_ENV !== "production") {
    origins.push(
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:5173",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:5173"
    );
  }

  return origins;
};

export const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return process.env.NODE_ENV === "production"
        ? callback(null, false)
        : callback(null, true);
    }

    const allowedOrigins = getAllowedOrigins();
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "X-CSRF-Token",
    "X-Request-ID",
    "X-2FA-Token",
  ],
  exposedHeaders: [
    "X-RateLimit-Limit",
    "X-RateLimit-Remaining",
    "X-RateLimit-Reset",
    "X-Request-ID",
  ],
  maxAge: 86400,
};

export const corsMiddleware = cors(corsOptions);

// ==========================================
// REQUEST ID MIDDLEWARE
// ==========================================

export const requestId = (req, res, next) => {
  const id = req.headers["x-request-id"] || crypto.randomUUID();
  req.id = id;
  res.set("X-Request-ID", id);
  next();
};

// ==========================================
// SECURE COOKIES
// ==========================================

export const secureCookies = (req, res, next) => {
  const originalCookie = res.cookie.bind(res);

  res.cookie = (name, value, options = {}) => {
    const secureOptions = {
      ...options,
      httpOnly: options.httpOnly !== false,
      secure: process.env.NODE_ENV === "production",
      sameSite: options.sameSite || "strict",
      path: options.path || "/",
    };

    const sensitiveCookies = ["accessToken", "refreshToken", "sessionId", "csrf"];
    if (sensitiveCookies.includes(name)) {
      secureOptions.httpOnly = true;
      secureOptions.secure = process.env.NODE_ENV === "production";
      secureOptions.sameSite = "strict";
    }

    return originalCookie(name, value, secureOptions);
  };

  next();
};

// ==========================================
// NO CACHE MIDDLEWARE
// ==========================================

export const noCache = (req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
};

// ==========================================
// INPUT SANITIZATION
// ==========================================

export const sanitizeInput = (req, res, next) => {
  const sanitizeValue = (value) => {
    if (typeof value === "string") {
      return value
        .replace(/\0/g, "") // Remove null bytes
        .trim()
        // Remove script tags
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        // Remove javascript: protocol
        .replace(/javascript:/gi, "")
        // Remove event handlers
        .replace(/on\w+\s*=/gi, "");
    }
    if (Array.isArray(value)) {
      return value.map(sanitizeValue);
    }
    if (value && typeof value === "object") {
      return sanitizeObject(value);
    }
    return value;
  };

  const sanitizeObject = (obj) => {
    const sanitized = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitized[key] = sanitizeValue(obj[key]);
      }
    }
    return sanitized;
  };

  // Sanitize body (can be reassigned)
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query (mutate in place - read-only property)
  if (req.query && typeof req.query === "object") {
    const sanitizedQuery = sanitizeObject(req.query);
    for (const key in req.query) {
      delete req.query[key];
    }
    Object.assign(req.query, sanitizedQuery);
  }

  // Sanitize params (mutate in place - read-only property)
  if (req.params && typeof req.params === "object") {
    const sanitizedParams = sanitizeObject(req.params);
    for (const key in req.params) {
      delete req.params[key];
    }
    Object.assign(req.params, sanitizedParams);
  }

  next();
};

// ==========================================
// INJECTION DETECTION
// ==========================================

const INJECTION_PATTERNS = {
  sql: [
    /(\bunion\b.*\bselect\b)|(\bselect\b.*\bfrom\b)/i,
    /(\binsert\b.*\binto\b)|(\bupdate\b.*\bset\b)|(\bdelete\b.*\bfrom\b)/i,
    /(\bdrop\b.*\b(table|database)\b)/i,
    /(--|\#|\/\*)/,
    /('\s*(or|and)\s*'?\s*\d+\s*=\s*\d+)/i,
  ],
  xss: [
    /<script[^>]*>/gi,
    /javascript\s*:/gi,
    /on(load|error|click|mouse|focus|blur)\s*=/gi,
    /\beval\s*\(/gi,
  ],
  pathTraversal: [
    /\.\.\//g,
    /\.\.\\/, 
    /%2e%2e/gi,
    /\/etc\/passwd/gi,
  ],
};

export const detectInjection = (req, res, next) => {
  const checkValue = (value, path = "") => {
    if (typeof value !== "string") {
      if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          const result = checkValue(value[i], `${path}[${i}]`);
          if (result) return result;
        }
      } else if (value && typeof value === "object") {
        for (const key in value) {
          const result = checkValue(value[key], path ? `${path}.${key}` : key);
          if (result) return result;
        }
      }
      return null;
    }

    for (const [type, patterns] of Object.entries(INJECTION_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(value)) {
          return { type: type.toUpperCase(), path };
        }
      }
    }
    return null;
  };

  const sources = [
    { data: req.body, name: "body" },
    { data: req.query, name: "query" },
    { data: req.params, name: "params" },
  ];

  for (const source of sources) {
    if (source.data) {
      const result = checkValue(source.data, source.name);
      if (result) {
        console.error("🚨 INJECTION ATTEMPT:", {
          type: result.type,
          path: result.path,
          ip: getClientIp(req),
          url: req.originalUrl,
          userId: req.user?.userId || null,
          timestamp: new Date().toISOString(),
        });

        return res.status(400).json({
          error: "Invalid input detected",
          code: "INVALID_INPUT",
        });
      }
    }
  }

  next();
};

// ==========================================
// SUSPICIOUS ACTIVITY DETECTION
// ==========================================

const SUSPICIOUS_PATTERNS = {
  urls: ["/wp-admin", "/wp-login", "/phpmyadmin", "/.env", "/.git", "/etc/passwd", "/actuator"],
  userAgents: ["sqlmap", "nikto", "nmap", "dirbuster", "burpsuite", "acunetix"],
};

export const suspiciousActivityDetector = (req, res, next) => {
  const url = req.originalUrl.toLowerCase();
  const userAgent = (req.get("User-Agent") || "").toLowerCase();
  const suspicious = [];

  for (const pattern of SUSPICIOUS_PATTERNS.urls) {
    if (url.includes(pattern)) {
      suspicious.push(`Suspicious URL: ${pattern}`);
    }
  }

  for (const agent of SUSPICIOUS_PATTERNS.userAgents) {
    if (userAgent.includes(agent)) {
      suspicious.push(`Suspicious User-Agent: ${agent}`);
    }
  }

  if (suspicious.length > 0) {
    console.warn("🚨 SUSPICIOUS REQUEST:", {
      ip: getClientIp(req),
      url: req.originalUrl,
      patterns: suspicious,
      timestamp: new Date().toISOString(),
    });
    req.suspicious = true;
    req.suspiciousPatterns = suspicious;
  }

  next();
};

// ==========================================
// AUDIT LOGGING
// ==========================================

export const auditLog = (action) => {
  return async (req, res, next) => {
    const startTime = Date.now();

    res.on("finish", async () => {
      const duration = Date.now() - startTime;

      const logData = {
        action,
        requestId: req.id,
        userId: req.user?.userId || req.user?.id || null,
        ip: getClientIp(req),
        userAgent: req.get("User-Agent")?.substring(0, 200),
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        suspicious: req.suspicious || false,
        timestamp: new Date().toISOString(),
      };

      // Mask sensitive data
      if (action.includes("LOGIN") || action.includes("REGISTER")) {
        logData.email = req.body?.email ? maskEmail(req.body.email) : null;
      }

      // Log to console
      if (res.statusCode >= 400 || req.suspicious) {
        console.warn(`[AUDIT] ${action}:`, logData);
      } else if (shouldLog(action)) {
        console.log(`[AUDIT] ${action}:`, logData);
      }

      // Store important events in database
      if (shouldStore(action)) {
        storeAuditLog(logData).catch((err) =>
          console.error("Audit log storage failed:", err.message)
        );
      }
    });

    next();
  };
};

function shouldLog(action) {
  const loggedActions = [
    "LOGIN", "LOGOUT", "REGISTER", "PASSWORD",
    "PAYMENT", "BOOKING", "GOOGLE",
  ];
  return loggedActions.some((a) => action.includes(a));
}

function shouldStore(action) {
  const storedActions = [
    "LOGIN_SUCCESS", "LOGIN_FAILED", "REGISTRATION",
    "PASSWORD_RESET", "PAYMENT", "BOOKING_CREATED",
  ];
  return storedActions.some((a) => action.includes(a));
}

async function storeAuditLog(logData) {
  try {
    await prisma.securityAuditLog.create({
      data: {
        action: logData.action,
        category: getCategoryFromAction(logData.action),
        userId: logData.userId ? parseInt(logData.userId) : null,
        ipAddress: logData.ip,
        userAgent: logData.userAgent,
        path: logData.path,
        method: logData.method,
        statusCode: logData.statusCode,
        metadata: logData,
      },
    });
  } catch (error) {
    // Table might not exist yet
    console.log("[AUDIT]", logData.action, logData.statusCode);
  }
}

function getCategoryFromAction(action) {
  if (action.includes("LOGIN") || action.includes("REGISTER") || action.includes("PASSWORD") || action.includes("GOOGLE")) {
    return "AUTH";
  }
  if (action.includes("PAYMENT") || action.includes("ESEWA") || action.includes("KHALTI")) {
    return "PAYMENT";
  }
  if (action.includes("BOOKING")) {
    return "BOOKING";
  }
  return "GENERAL";
}

function maskEmail(email) {
  if (!email || !email.includes("@")) return email;
  const [local, domain] = email.split("@");
  const masked = local.length > 2 ? local.slice(0, 2) + "***" : "***";
  return `${masked}@${domain}`;
}

// ==========================================
// OWNERSHIP VERIFICATION (IDOR Protection)
// ==========================================

export const verifyOwnership = (resourceType) => {
  return async (req, res, next) => {
    try {
      const resourceId = parseInt(
        req.params.id || req.params.bookingId || req.params.paymentId || req.params.listingId
      );
      const userId = Number(req.user?.userId || req.user?.id);

      if (!resourceId || !userId) {
        return res.status(400).json({ error: "Invalid request" });
      }

      let resource = null;

      switch (resourceType.toLowerCase()) {
        case "booking":
          resource = await prisma.booking.findFirst({
            where: {
              id: resourceId,
              OR: [
                { userId: userId },
                { listing: { hostId: userId } },
              ],
            },
          });
          break;

        case "payment":
          resource = await prisma.payment.findFirst({
            where: {
              id: resourceId,
              hostId: userId,
            },
          });
          break;

        case "listing":
          resource = await prisma.listing.findFirst({
            where: {
              id: resourceId,
              hostId: userId,
            },
          });
          break;

        case "review":
          resource = await prisma.review.findFirst({
            where: {
              id: resourceId,
              OR: [
                { userId: userId },
                { listing: { hostId: userId } },
              ],
            },
          });
          break;

        case "notification":
          resource = await prisma.notification.findFirst({
            where: {
              id: resourceId,
              userId: BigInt(userId),
            },
          });
          break;

        case "ticket":
        case "supportticket":
          resource = await prisma.supportTicket.findFirst({
            where: {
              id: resourceId,
              userId: userId,
            },
          });
          break;

        default:
          console.warn(`Unknown resource type: ${resourceType}`);
          return res.status(500).json({ error: "Invalid resource type" });
      }

      if (!resource) {
        // Generic 404 - doesn't reveal if resource exists
        return res.status(404).json({
          error: `${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} not found`,
        });
      }

      // Attach resource for use in controller
      req.resource = resource;
      next();
    } catch (error) {
      console.error("Ownership verification error:", error);
      return res.status(500).json({ error: "Verification failed" });
    }
  };
};

// ==========================================
// APPLY ALL SECURITY MIDDLEWARE
// ==========================================

export const applySecurityMiddleware = (app) => {
  // Trust proxy for accurate IP
  app.set("trust proxy", 1);

  // Request ID tracking
  app.use(requestId);

  // Security headers
  app.use(securityHeaders);

  // CORS
  app.use(corsMiddleware);

  // Secure cookies
  app.use(secureCookies);

  // General rate limiter
  app.use(generalLimiter);

  // Input sanitization
  app.use(sanitizeInput);

  // Injection detection
  app.use(detectInjection);

  // Suspicious activity detection
  app.use(suspiciousActivityDetector);

  console.log("✅ All security middleware applied");
};

// ==========================================
// EXPORT ALL
// ==========================================

export default {
  // Rate limiters
  generalLimiter,
  authLimiter,
  registrationLimiter,
  passwordResetLimiter,
  otpLimiter,
  paymentLimiter,
  bookingLimiter,
  uploadLimiter,

  // Security
  securityHeaders,
  corsOptions,
  corsMiddleware,
  requestId,
  secureCookies,
  noCache,

  // Validation
  sanitizeInput,
  detectInjection,
  suspiciousActivityDetector,

  // Audit & IDOR
  auditLog,
  verifyOwnership,

  // Main function
  applySecurityMiddleware,
};