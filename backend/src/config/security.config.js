// ==========================================
// FILE: config/security.config.js
// Security Configuration for MyBigYard
// ==========================================

export const SECURITY_CONFIG = {
  // ==========================================
  // JWT / TOKEN SETTINGS
  // ==========================================
  jwt: {
    accessTokenExpiry: "15m",          // 15 minutes
    refreshTokenExpiry: "7d",          // 7 days
    rememberMeExpiry: "30d",           // 30 days (when "remember me" checked)
    issuer: "mybigyard.com",
    audience: "mybigyard-users",
  },

  // ==========================================
  // PASSWORD REQUIREMENTS
  // ==========================================
  password: {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    specialChars: "!@#$%^&*()_+-=[]{}|;:,.<>?",
    
    // Bcrypt rounds (higher = slower but more secure)
    bcryptRounds: 12,
    
    // Password history (prevent reuse)
    historyCount: 5,                   // Remember last 5 passwords
    
    // Password expiry (0 = never expires)
    expiryDays: 0,
  },

  // ==========================================
  // ACCOUNT LOCKOUT
  // ==========================================
  lockout: {
    maxFailedAttempts: 5,              // Lock after 5 failed attempts
    lockoutDuration: 15 * 60 * 1000,   // 15 minutes in ms
    
    // Progressive lockout (optional)
    progressiveLockout: true,
    progressiveMultiplier: 2,          // Double lockout time each time
    maxLockoutDuration: 24 * 60 * 60 * 1000, // Max 24 hours
  },

  // ==========================================
  // RATE LIMITING
  // ==========================================
  rateLimit: {
    // Login attempts
    login: {
      windowMs: 15 * 60 * 1000,        // 15 minutes
      maxAttempts: 5,                  // 5 attempts per window
    },
    
    // Registration
    register: {
      windowMs: 60 * 60 * 1000,        // 1 hour
      maxAttempts: 3,                  // 3 registrations per hour
    },
    
    // Password reset requests
    passwordReset: {
      windowMs: 60 * 60 * 1000,        // 1 hour
      maxAttempts: 3,                  // 3 requests per hour
    },
    
    // API general
    api: {
      windowMs: 60 * 1000,             // 1 minute
      maxRequests: 100,                // 100 requests per minute
    },
    
    // Sensitive operations
    sensitive: {
      windowMs: 60 * 60 * 1000,        // 1 hour
      maxAttempts: 10,                 // 10 attempts per hour
    },
  },

  // ==========================================
  // SESSION SETTINGS
  // ==========================================
  session: {
    maxActiveSessions: 5,              // Max concurrent sessions per user
    inactivityTimeout: 30 * 60 * 1000, // 30 minutes of inactivity
    absoluteTimeout: 24 * 60 * 60 * 1000, // 24 hours max session
    
    // Refresh token rotation
    rotateRefreshTokens: true,
  },

  // ==========================================
  // CORS SETTINGS
  // ==========================================
  cors: {
    allowedOrigins: [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://mybigyard.com",
      "https://www.mybigyard.com",
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    
    allowedMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID", "X-CSRF-Token"],
    exposedHeaders: ["X-Request-ID", "X-RateLimit-Remaining", "Retry-After"],
    credentials: true,
    maxAge: 86400,                     // 24 hours preflight cache
  },

  // ==========================================
  // SECURITY HEADERS
  // ==========================================
  headers: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: ["'self'", "https://api.stripe.com", process.env.API_URL].filter(Boolean),
        frameSrc: ["'self'", "https://js.stripe.com"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV === "production" ? [] : null,
      },
    },
    
    // Other security headers
    hsts: {
      maxAge: 31536000,                // 1 year
      includeSubDomains: true,
      preload: true,
    },
  },

  // ==========================================
  // TOKEN/OTP SETTINGS
  // ==========================================
  tokens: {
    // Email verification
    emailVerification: {
      expiryMinutes: 60,               // 1 hour
      maxAttempts: 5,
      lockoutMinutes: 30,
    },
    
    // Phone verification
    phoneVerification: {
      expiryMinutes: 10,               // 10 minutes
      maxAttempts: 5,
      lockoutMinutes: 30,
    },
    
    // Password reset
    passwordReset: {
      expiryMinutes: 60,               // 1 hour
    },
  },

  // ==========================================
  // AUDIT LOGGING
  // ==========================================
  audit: {
    enabled: true,
    logSuccessfulLogins: true,
    logFailedLogins: true,
    logPasswordChanges: true,
    logAdminActions: true,
    logSensitiveDataAccess: true,
    
    // Retention
    retentionDays: 90,                 // Keep logs for 90 days
    
    // Events to always log
    criticalEvents: [
      "LOGIN_FAILED",
      "ACCOUNT_LOCKED",
      "PASSWORD_CHANGE",
      "ROLE_CHANGED",
      "ADMIN_ACTION",
      "SUSPICIOUS_ACTIVITY",
    ],
  },

  // ==========================================
  // IP & GEO SETTINGS
  // ==========================================
  ip: {
    trustProxy: true,
    proxyHeaders: ["x-forwarded-for", "x-real-ip"],
    
    // IP blacklist/whitelist (optional)
    blacklist: [],
    whitelist: [],
    
    // Geo-blocking (optional)
    blockedCountries: [],
  },

  // ==========================================
  // SUSPICIOUS ACTIVITY DETECTION
  // ==========================================
  suspiciousActivity: {
    enabled: true,
    
    triggers: {
      // Multiple failed logins from different IPs for same email
      distributedBruteForce: {
        threshold: 10,                 // 10 different IPs
        windowMinutes: 60,
      },
      
      // Rapid requests from single IP
      rapidRequests: {
        threshold: 50,                 // 50 requests
        windowSeconds: 10,
      },
      
      // Login from new location/device
      newDeviceLogin: {
        notify: true,
        requireVerification: false,
      },
    },
  },
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Get rate limit config for a specific endpoint type
 */
export const getRateLimitConfig = (type) => {
  return SECURITY_CONFIG.rateLimit[type] || SECURITY_CONFIG.rateLimit.api;
};

/**
 * Check if password meets requirements
 */
export const validatePasswordStrength = (password) => {
  const config = SECURITY_CONFIG.password;
  const errors = [];

  if (password.length < config.minLength) {
    errors.push(`Password must be at least ${config.minLength} characters`);
  }
  
  if (password.length > config.maxLength) {
    errors.push(`Password must be less than ${config.maxLength} characters`);
  }
  
  if (config.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  
  if (config.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  
  if (config.requireNumbers && !/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  
  if (config.requireSpecialChars) {
    const specialRegex = new RegExp(`[${config.specialChars.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`);
    if (!specialRegex.test(password)) {
      errors.push("Password must contain at least one special character");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Check if account should be locked
 */
export const shouldLockAccount = (failedAttempts) => {
  return failedAttempts >= SECURITY_CONFIG.lockout.maxFailedAttempts;
};

/**
 * Calculate lockout duration (with progressive lockout)
 */
export const getLockoutDuration = (lockoutCount = 1) => {
  const config = SECURITY_CONFIG.lockout;
  
  if (!config.progressiveLockout) {
    return config.lockoutDuration;
  }
  
  const duration = config.lockoutDuration * Math.pow(config.progressiveMultiplier, lockoutCount - 1);
  return Math.min(duration, config.maxLockoutDuration);
};

// Default export
export default SECURITY_CONFIG;