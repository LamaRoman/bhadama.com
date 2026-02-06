// ==========================================
// VALIDATION MIDDLEWARE
// ==========================================
// File: middleware/validation.middleware.js
//
// Features:
// 1. Zod schema validation
// 2. Input sanitization
// 3. Injection detection (SQL, XSS, etc.)
// 4. File upload validation
// ==========================================

import { ZodError } from "zod";

// ==========================================
// ZOD VALIDATION MIDDLEWARE
// ==========================================

/**
 * Validate request data against a Zod schema
 * @param {ZodSchema} schema - Zod schema to validate against
 * @param {string} source - Where to get data: 'body', 'query', 'params', or 'all'
 */
export const validate = (schema, source = "body") => {
  return (req, res, next) => {
    try {
      let dataToValidate;

      switch (source) {
        case "body":
          dataToValidate = req.body;
          break;
        case "query":
          dataToValidate = req.query;
          break;
        case "params":
          dataToValidate = req.params;
          break;
        case "all":
          dataToValidate = {
            ...req.body,
            ...req.query,
            ...req.params,
          };
          break;
        default:
          dataToValidate = req.body;
      }

      // Parse and validate (Zod will coerce types automatically)
      const result = schema.parse(dataToValidate);

      // ✅ INDUSTRY STANDARD: Store validated data separately
      // This is what libraries like express-validator, joi, etc. do
      if (source === "body") {
        req.body = result; // Body is writable
      } else if (source === "query") {
        // Query is read-only, so store validated version separately
        req.validatedQuery = result;
        // Also ensure original query has the coerced values for backward compatibility
        Object.keys(result).forEach(key => {
          if (req.query[key] !== result[key]) {
            // Only log type coercion, don't try to modify
            console.debug(`Query param '${key}' coerced from '${req.query[key]}' to '${result[key]}'`);
          }
        });
      } else if (source === "params") {
        req.params = result; // Params is writable
      } else if (source === "all") {
        req.validatedData = result;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.issues || [];
        const errors = issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
          code: err.code,
        }));

        return res.status(400).json({
          error: "Validation failed",
          code: "VALIDATION_ERROR",
          details: errors,
        });
      }

      // Unexpected error
      console.error("Validation error:", error);
      return res.status(400).json({
        error: "Invalid input",
        code: "VALIDATION_ERROR",
      });
    }
  };
};

// ==========================================
// INPUT SANITIZATION
// ==========================================

/**
 * Sanitize all string inputs in request
 */
export const sanitize = (req, res, next) => {
  const sanitizeValue = (value) => {
    if (typeof value === "string") {
      return value
        // Remove null bytes
        .replace(/\0/g, "")
        // Trim whitespace
        .trim()
        // Escape HTML entities
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;");
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
        // Also sanitize keys
        const safeKey = key.replace(/[<>"'&]/g, "");
        sanitized[safeKey] = sanitizeValue(obj[key]);
      }
    }
    return sanitized;
  };

  // Sanitize body, query, params
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === "object") {
    req.query = sanitizeObject(req.query);
  }
  if (req.params && typeof req.params === "object") {
    req.params = sanitizeObject(req.params);
  }

  next();
};

// ==========================================
// INJECTION DETECTION
// ==========================================

// Patterns that indicate potential attacks
const INJECTION_PATTERNS = {
  sql: [
    /(\b(union|select|insert|update|delete|drop|create|alter|truncate)\b\s*(all\s+)?)/i,
    /(\b(from|into|table|database|where|having|group\s+by|order\s+by)\b)/i,
    /(--|\#|\/\*|\*\/)/,
    /(\bor\b\s*\d+\s*=\s*\d+|\band\b\s*\d+\s*=\s*\d+)/i,
    /('\s*(or|and)\s*')/i,
    /(;\s*(drop|delete|update|insert))/i,
    /(\bexec\b|\bexecute\b|\bxp_)/i,
    /(\bwaitfor\b\s+\bdelay\b)/i,
    /(\bbenchmark\b\s*\()/i,
  ],
  xss: [
    /<script[^>]*>[\s\S]*?<\/script>/gi,
    /<script[^>]*>/gi,
    /javascript\s*:/gi,
    /on\w+\s*=\s*["']?[^"']*["']?/gi,
    /\beval\s*\(/gi,
    /\bsetTimeout\s*\(/gi,
    /\bsetInterval\s*\(/gi,
    /\bFunction\s*\(/gi,
    /document\.(cookie|location|write)/gi,
    /window\.(location|open)/gi,
    /innerHTML\s*=/gi,
    /outerHTML\s*=/gi,
    /<iframe[^>]*>/gi,
    /<embed[^>]*>/gi,
    /<object[^>]*>/gi,
    /data\s*:\s*text\/html/gi,
    /expression\s*\(/gi,
  ],
  pathTraversal: [
    /\.\.\//g,
    /\.\.\\/, 
    /%2e%2e/gi,
    /%252e/gi,
    /\/etc\/passwd/gi,
    /\/etc\/shadow/gi,
    /boot\.ini/gi,
    /win\.ini/gi,
    /\/proc\/self/gi,
  ],
  commandInjection: [
    /;\s*\w+/,
    /\|\s*\w+/,
    /`[^`]+`/,
    /\$\([^)]+\)/,
    /\$\{[^}]+\}/,
    /\b(cat|ls|rm|mv|cp|wget|curl|bash|sh|nc|netcat)\b/i,
  ],
  ldap: [
    /[()\\*\x00]/,
    /\x00/,
  ],
};

/**
 * Detect injection attempts in request
 */
export const detectInjection = (req, res, next) => {
  const checkValue = (value, path = "") => {
    if (typeof value === "string") {
      // Check SQL injection
      for (const pattern of INJECTION_PATTERNS.sql) {
        if (pattern.test(value)) {
          return { detected: true, type: "SQL_INJECTION", path, pattern: pattern.toString() };
        }
      }

      // Check XSS
      for (const pattern of INJECTION_PATTERNS.xss) {
        if (pattern.test(value)) {
          return { detected: true, type: "XSS", path, pattern: pattern.toString() };
        }
      }

      // Check path traversal
      for (const pattern of INJECTION_PATTERNS.pathTraversal) {
        if (pattern.test(value)) {
          return { detected: true, type: "PATH_TRAVERSAL", path, pattern: pattern.toString() };
        }
      }

      // Check command injection
      for (const pattern of INJECTION_PATTERNS.commandInjection) {
        if (pattern.test(value)) {
          return { detected: true, type: "COMMAND_INJECTION", path, pattern: pattern.toString() };
        }
      }
    }

    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        const result = checkValue(value[i], `${path}[${i}]`);
        if (result.detected) return result;
      }
    }

    if (value && typeof value === "object") {
      for (const key in value) {
        const result = checkValue(value[key], path ? `${path}.${key}` : key);
        if (result.detected) return result;
      }
    }

    return { detected: false };
  };

  // Check all inputs
  const sources = [
    { data: req.body, name: "body" },
    { data: req.query, name: "query" },
    { data: req.params, name: "params" },
  ];

  for (const source of sources) {
    if (source.data) {
      const result = checkValue(source.data, source.name);
      if (result.detected) {
        // Log the attempt
        console.error("🚨 INJECTION ATTEMPT DETECTED:", {
          type: result.type,
          path: result.path,
          ip: req.ip,
          userAgent: req.get("User-Agent"),
          userId: req.user?.userId || null,
          url: req.originalUrl,
          method: req.method,
          timestamp: new Date().toISOString(),
        });

        // Return generic error (don't reveal detection details)
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
// FILE UPLOAD VALIDATION
// ==========================================

// Magic bytes for file type verification
const FILE_SIGNATURES = {
  "image/jpeg": [
    [0xff, 0xd8, 0xff, 0xe0],
    [0xff, 0xd8, 0xff, 0xe1],
    [0xff, 0xd8, 0xff, 0xe8],
  ],
  "image/png": [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  "image/gif": [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
  ],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]], // followed by WEBP
  "application/pdf": [[0x25, 0x50, 0x44, 0x46]],
};

// MIME to extension mapping
const MIME_EXTENSIONS = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/gif": [".gif"],
  "image/webp": [".webp"],
  "application/pdf": [".pdf"],
};

/**
 * Validate uploaded file
 * @param {Object} options - Validation options
 */
export const validateFile = (options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB
    allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"],
    required = false,
  } = options;

  return (req, res, next) => {
    const file = req.file;

    // Check if file is required
    if (!file) {
      if (required) {
        return res.status(400).json({
          error: "File is required",
          code: "FILE_REQUIRED",
        });
      }
      return next();
    }

    // Check file size
    if (file.size > maxSize) {
      return res.status(400).json({
        error: `File too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`,
        code: "FILE_TOO_LARGE",
      });
    }

    // Check MIME type
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({
        error: "File type not allowed",
        code: "INVALID_FILE_TYPE",
        allowed: allowedTypes,
      });
    }

    // Check file extension matches MIME type
    const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf("."));
    const allowedExtensions = MIME_EXTENSIONS[file.mimetype] || [];
    if (!allowedExtensions.includes(ext)) {
      return res.status(400).json({
        error: "File extension does not match file type",
        code: "EXTENSION_MISMATCH",
      });
    }

    // Check for double extensions (e.g., file.jpg.php)
    const nameParts = file.originalname.split(".");
    if (nameParts.length > 2) {
      const dangerousExtensions = [".php", ".exe", ".sh", ".bat", ".cmd", ".js", ".html"];
      for (let i = 0; i < nameParts.length - 1; i++) {
        const partExt = `.${nameParts[i].toLowerCase()}`;
        if (dangerousExtensions.includes(partExt)) {
          return res.status(400).json({
            error: "Invalid file name",
            code: "INVALID_FILENAME",
          });
        }
      }
    }

    // Verify magic bytes (file signature)
    if (file.buffer) {
      const signatures = FILE_SIGNATURES[file.mimetype];
      if (signatures) {
        const fileHeader = Array.from(new Uint8Array(file.buffer.slice(0, 12)));
        const isValid = signatures.some((sig) =>
          sig.every((byte, index) => fileHeader[index] === byte)
        );

        if (!isValid) {
          return res.status(400).json({
            error: "File content does not match declared type",
            code: "FILE_SIGNATURE_MISMATCH",
          });
        }
      }
    }

    next();
  };
};

// ==========================================
// REQUEST SIZE LIMITER
// ==========================================

/**
 * Limit request body size
 * @param {number} maxSize - Maximum size in bytes
 */
export const limitRequestSize = (maxSize = 10 * 1024) => {
  return (req, res, next) => {
    const contentLength = parseInt(req.get("Content-Length") || "0", 10);

    if (contentLength > maxSize) {
      return res.status(413).json({
        error: "Request entity too large",
        code: "PAYLOAD_TOO_LARGE",
        maxSize,
      });
    }

    next();
  };
};

// ==========================================
// EXPORT ALL
// ==========================================

export default {
  validate,
  sanitize,
  detectInjection,
  validateFile,
  limitRequestSize,
};