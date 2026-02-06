// ==========================================
// ERROR HANDLING MIDDLEWARE
// ==========================================
// File: middleware/error.middleware.js
//
// Features:
// 1. Custom error classes
// 2. Secure error handling (no info leakage)
// 3. Zod and Prisma error handling
// 4. Async handler wrapper
// ==========================================

import { ZodError } from "zod";

// Try to import Prisma (may not be available in all setups)
let Prisma;
try {
  const prismaClient = await import("@prisma/client");
  Prisma = prismaClient.Prisma;
} catch (e) {
  // Prisma not available
  Prisma = null;
}

// ==========================================
// CUSTOM ERROR CLASSES
// ==========================================

/**
 * Base application error
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, code = "INTERNAL_ERROR", details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error (400)
 */
export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, "VALIDATION_ERROR", details);
  }
}

/**
 * Authentication error (401)
 */
export class AuthenticationError extends AppError {
  constructor(message = "Authentication required", code = "AUTH_REQUIRED") {
    super(message, 401, code);
  }
}

/**
 * Authorization error (403)
 */
export class AuthorizationError extends AppError {
  constructor(message = "Access denied", code = "FORBIDDEN") {
    super(message, 403, code);
  }
}

/**
 * Not found error (404)
 */
export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND");
  }
}

/**
 * Conflict error (409)
 */
export class ConflictError extends AppError {
  constructor(message = "Resource already exists") {
    super(message, 409, "CONFLICT");
  }
}

/**
 * Rate limit error (429)
 */
export class RateLimitError extends AppError {
  constructor(retryAfter = 60) {
    super("Too many requests. Please try again later.", 429, "RATE_LIMIT_EXCEEDED", { retryAfter });
  }
}

/**
 * Payment error (402)
 */
export class PaymentError extends AppError {
  constructor(message = "Payment failed", code = "PAYMENT_FAILED") {
    super(message, 402, code);
  }
}

// ==========================================
// ERROR SANITIZATION
// ==========================================

/**
 * Remove sensitive information from error messages
 */
function sanitizeErrorMessage(message) {
  if (typeof message !== "string") return "An error occurred";

  // Patterns that might reveal sensitive info
  const sensitivePatterns = [
    // Database URLs
    /postgresql:\/\/[^@]+@[^\s]+/gi,
    /mysql:\/\/[^@]+@[^\s]+/gi,
    /mongodb:\/\/[^@]+@[^\s]+/gi,
    // File paths
    /\/home\/[^\s]+/gi,
    /\/var\/[^\s]+/gi,
    /\/etc\/[^\s]+/gi,
    /C:\\[^\s]+/gi,
    // Internal IPs
    /\b(?:10|127|172\.(?:1[6-9]|2[0-9]|3[01])|192\.168)\.\d{1,3}\.\d{1,3}\b/g,
    // Stack traces
    /at\s+[\w.]+\s+\([^)]+\)/gi,
    // SQL
    /SELECT\s+.+\s+FROM\s+/gi,
    /INSERT\s+INTO\s+/gi,
    /UPDATE\s+.+\s+SET\s+/gi,
    // Environment variables
    /process\.env\.\w+/gi,
    // JWTs
    /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g,
    // Long random strings (API keys, secrets)
    /[a-zA-Z0-9_-]{40,}/g,
  ];

  let sanitized = message;
  for (const pattern of sensitivePatterns) {
    sanitized = sanitized.replace(pattern, "[REDACTED]");
  }

  // Truncate if too long
  if (sanitized.length > 500) {
    sanitized = sanitized.substring(0, 500) + "...";
  }

  return sanitized;
}

// ==========================================
// PRISMA ERROR HANDLER
// ==========================================

function handlePrismaError(error) {
  if (!Prisma) return null;

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        // Unique constraint violation
        const field = error.meta?.target?.[0] || "field";
        return new ConflictError(`A record with this ${field} already exists`);

      case "P2025":
        // Record not found
        return new NotFoundError("Record");

      case "P2003":
        // Foreign key constraint
        return new ValidationError("Invalid reference to related record");

      case "P2014":
        // Required relation violation
        return new ValidationError("Required related record is missing");

      case "P2016":
        // Query interpretation error
        return new ValidationError("Invalid query parameters");

      default:
        console.error("Unhandled Prisma error:", error.code);
        return new AppError("Database error occurred", 500, "DATABASE_ERROR");
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return new ValidationError("Invalid data provided");
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    console.error("Database connection error:", error);
    return new AppError("Service temporarily unavailable", 503, "SERVICE_UNAVAILABLE");
  }

  return null;
}

// ==========================================
// ZOD ERROR HANDLER
// ==========================================

function handleZodError(error) {
  const details = error.errors.map((err) => ({
    field: err.path.join("."),
    message: err.message,
    code: err.code,
  }));

  return new ValidationError("Validation failed", details);
}

// ==========================================
// MAIN ERROR HANDLER
// ==========================================

/**
 * Global error handling middleware
 */
export const errorHandler = (err, req, res, next) => {
  // If headers already sent, delegate to Express
  if (res.headersSent) {
    return next(err);
  }

  // Default values
  let statusCode = err.statusCode || 500;
  let message = err.message || "An unexpected error occurred";
  let code = err.code || "INTERNAL_ERROR";
  let details = null;

  // Log error
  const errorLog = {
    timestamp: new Date().toISOString(),
    requestId: req.id,
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    userId: req.user?.userId || req.user?.id,
    error: {
      name: err.name,
      message: err.message,
      code: err.code,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    },
  };

  // Log server errors
  if (statusCode >= 500) {
    console.error("🔴 SERVER ERROR:", JSON.stringify(errorLog, null, 2));
  } else if (process.env.NODE_ENV === "development") {
    console.warn("🟡 CLIENT ERROR:", JSON.stringify(errorLog, null, 2));
  }

  // Handle specific error types
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code;
    details = err.details;
  } else if (err instanceof ZodError) {
    const zodError = handleZodError(err);
    statusCode = zodError.statusCode;
    message = zodError.message;
    code = zodError.code;
    details = zodError.details;
  } else if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
    code = "INVALID_TOKEN";
  } else if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
    code = "TOKEN_EXPIRED";
  } else if (err.name === "MulterError") {
    statusCode = 400;
    if (err.code === "LIMIT_FILE_SIZE") {
      message = "File too large";
    } else if (err.code === "LIMIT_FILE_COUNT") {
      message = "Too many files";
    } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
      message = "Unexpected file field";
    } else {
      message = "File upload error";
    }
    code = "FILE_UPLOAD_ERROR";
  } else if (err.code === "EBADCSRFTOKEN") {
    statusCode = 403;
    message = "Invalid or missing CSRF token";
    code = "CSRF_ERROR";
  } else {
    // Check for Prisma errors
    const prismaError = handlePrismaError(err);
    if (prismaError) {
      statusCode = prismaError.statusCode;
      message = prismaError.message;
      code = prismaError.code;
    } else {
      // Unknown error - sanitize in production
      if (process.env.NODE_ENV === "production") {
        message = "An unexpected error occurred";
        code = "INTERNAL_ERROR";
      } else {
        message = sanitizeErrorMessage(err.message);
      }
    }
  }

  // Build response
  const response = {
    error: message,
    code,
    requestId: req.id,
  };

  // Add details if present
  if (details) {
    response.details = details;
  }

  // Add stack in development
  if (process.env.NODE_ENV === "development" && err.stack) {
    response.stack = err.stack;
  }

  // Set headers
  if (statusCode === 429 && details?.retryAfter) {
    res.set("Retry-After", String(details.retryAfter));
  }

  res.status(statusCode).json(response);
};

// ==========================================
// 404 HANDLER
// ==========================================

/**
 * Handle 404 Not Found
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    code: "NOT_FOUND",
    path: req.originalUrl,
    method: req.method,
    requestId: req.id,
  });
};

// ==========================================
// ASYNC HANDLER
// ==========================================

/**
 * Wrap async route handlers to catch errors
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// ==========================================
// UNCAUGHT EXCEPTION HANDLERS
// ==========================================

/**
 * Setup handlers for uncaught exceptions
 */
export const setupUncaughtHandlers = () => {
  process.on("uncaughtException", (error) => {
    console.error("🔴 UNCAUGHT EXCEPTION:", error);
    // Give time to log
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  process.on("unhandledRejection", (reason, promise) => {
    console.error("🔴 UNHANDLED REJECTION:", reason);
    // Don't exit, just log
  });

  process.on("SIGTERM", () => {
    console.log("👋 SIGTERM received, shutting down gracefully");
    process.exit(0);
  });

  process.on("SIGINT", () => {
    console.log("👋 SIGINT received, shutting down gracefully");
    process.exit(0);
  });
};

// ==========================================
// EXPORT ALL
// ==========================================

export default {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  PaymentError,
  errorHandler,
  notFoundHandler,
  asyncHandler,
  setupUncaughtHandlers,
};