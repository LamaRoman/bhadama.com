// ==========================================
// VALIDATION SCHEMAS - ZOD BASED (FIXED)
// ==========================================
// File: validators/schemas.js
//
// FIXES APPLIED:
// 1. ✅ Fixed syntax error in register schema .refine() block
// 2. ✅ Moved comment block outside of code
//
// This replaces auth.validator.js with more robust
// type-safe validation using Zod
// ==========================================

import { z } from "zod";

// ==========================================
// COMMON PATTERNS
// ==========================================

// Blocked patterns for injection detection
const INJECTION_PATTERNS = [
  /(\b(union|select|insert|update|delete|drop|create|alter|truncate)\b.*\b(from|into|table|database)\b)/i,
  /<script[^>]*>[\s\S]*?<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /\.\.\//g,
  /%2e%2e/gi,
];

// Common weak passwords to block
const COMMON_PASSWORDS = [
  "password", "123456", "12345678", "qwerty", "abc123",
  "monkey", "1234567", "letmein", "trustno1", "dragon",
  "baseball", "iloveyou", "master", "sunshine", "ashley",
  "football", "shadow", "123123", "654321", "superman",
  "qazwsx", "michael", "password1", "password123",
];

// Disposable email domains to block
const DISPOSABLE_DOMAINS = [
  "tempmail.com", "throwaway.email", "guerrillamail.com",
  "mailinator.com", "10minutemail.com", "temp-mail.org",
  "fakeinbox.com", "trashmail.com", "getnada.com",
];

// ==========================================
// CUSTOM VALIDATORS
// ==========================================

/**
 * Safe string that blocks injection patterns
 */
const safeString = (minLength = 1, maxLength = 1000) =>
  z
    .string()
    .min(minLength)
    .max(maxLength)
    .refine(
      (val) => !INJECTION_PATTERNS.some((pattern) => pattern.test(val)),
      { message: "Input contains potentially unsafe content" }
    );

/**
 * Email with additional security checks
 */
const secureEmail = z
  .string()
  .email("Please provide a valid email address")
  .max(255)
  .transform((email) => email.toLowerCase().trim())
  .refine(
    (email) => !email.includes("+"),
    { message: "Email aliases with + are not allowed" }
  )
  .refine(
    (email) => {
      const domain = email.split("@")[1];
      return !DISPOSABLE_DOMAINS.includes(domain);
    },
    { message: "Disposable email addresses are not allowed" }
  );

/**
 * Basic email (less strict, for login)
 */
const basicEmail = z
  .string()
  .email("Please provide a valid email address")
  .max(255)
  .transform((email) => email.toLowerCase().trim());

/**
 * Secure password with strength requirements
 */
const securePassword = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(128, "Password must not exceed 128 characters")
  .refine(
    (password) => /[a-z]/.test(password),
    { message: "Password must contain at least one lowercase letter" }
  )
  .refine(
    (password) => /[A-Z]/.test(password),
    { message: "Password must contain at least one uppercase letter" }
  )
  .refine(
    (password) => /[0-9]/.test(password),
    { message: "Password must contain at least one number" }
  )
  .refine(
    (password) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
    { message: "Password must contain at least one special character" }
  )
  .refine(
    (password) => !/(.)\1{2,}/.test(password),
    { message: "Password cannot contain 3 or more consecutive identical characters" }
  )
  .refine(
    (password) => !COMMON_PASSWORDS.includes(password.toLowerCase()),
    { message: "This password is too common. Please choose a stronger password" }
  );

/**
 * Nepal phone number
 */
const nepalPhone = z
  .string()
  .regex(
    /^(\+977)?[9][6-9]\d{8}$/,
    "Please provide a valid Nepal phone number"
  )
  .transform((phone) => {
    // Normalize to +977 format
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("977")) {
      return `+${cleaned}`;
    }
    return `+977${cleaned}`;
  });

/**
 * UUID v4 validation
 */
const uuid = z.string().uuid("Invalid ID format");

/**
 * Positive integer
 */
const positiveInt = z.coerce
  .number()
  .int()
  .positive("Must be a positive number");

/**
 * Positive decimal
 */
const positiveDecimal = z.coerce
  .number()
  .positive("Must be a positive number");

/**
 * Future date (✅ FIXED: allows today and future dates)
 */
const futureDate = z.coerce
  .date()
  .refine(
    (date) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today
      const bookingDate = new Date(date);
      bookingDate.setHours(0, 0, 0, 0); // Start of booking date
      return bookingDate >= today; // Allow today or future
    },
    { message: "Date cannot be in the past" }
  );

/**
 * Time in 24h format (HH:MM)
 */
const time24h = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be in HH:MM format");

/**
 * ISO country code (2 letters)
 */
const countryCode = z
  .string()
  .length(2, "Country must be a 2-letter code")
  .toUpperCase();

// ==========================================
// AUTH SCHEMAS
// ==========================================

export const AuthSchemas = {
  /**
   * User registration
   * 
   * Password validation includes:
   * - Cannot contain email username
   * - Cannot contain full name (without spaces)
   * - Cannot contain individual name parts (min 3 chars)
   * 
   * Examples with name "Roman Lama":
   * ❌ Roman123@     - BLOCKED (contains "roman")
   * ❌ Lama123@      - BLOCKED (contains "lama") 
   * ❌ RomanLama123@ - BLOCKED (contains "romanlama")
   * ✅ SecurePass123@ - ALLOWED (no name/email parts)
   */
  register: z
    .object({
      name: safeString(2, 100).describe("Full name"),
      email: secureEmail,
      password: securePassword,
      role: z.enum(["USER", "HOST"]).default("USER"),
      country: countryCode.optional(),
      acceptTerms: z.literal(true, {
        errorMap: () => ({ message: "You must accept the terms and conditions" }),
      }),
    })
    .refine(
      (data) => {
        // Skip check if any required field is missing
        if (!data.email || !data.password || !data.name) {
          return true;
        }
        
        const passwordLower = data.password.toLowerCase();
        const emailLocal = data.email.split("@")[0].toLowerCase();
        const nameLower = data.name.toLowerCase();
        
        // Check 1: Password shouldn't contain email username
        if (passwordLower.includes(emailLocal)) {
          return false;
        }
        
        // Check 2: Password shouldn't contain full name (no spaces)
        const nameNoSpaces = nameLower.replace(/\s/g, "");
        if (passwordLower.includes(nameNoSpaces)) {
          return false;
        }
        
        // Check 3: Password shouldn't contain individual name parts (min 3 chars)
        const nameParts = nameLower.split(/\s+/).filter(part => part.length >= 3);
        for (const part of nameParts) {
          if (passwordLower.includes(part)) {
            return false;
          }
        }
        
        return true;
      },
      { 
        message: "Password cannot contain your name or email", 
        path: ["password"] 
      }
    ),

  /**
   * User login
   */
  login: z.object({
    email: basicEmail,
    password: z.string().min(1, "Password is required").max(128),
    rememberMe: z.boolean().optional().default(false),
    captchaToken: z.string().optional(), // For after failed attempts
  }),

  /**
   * Forgot password request
   */
  forgotPassword: z.object({
    email: basicEmail,
  }),

  /**
   * Reset password with token
   */
  resetPassword: z
    .object({
      token: z.string().min(32, "Invalid reset token"),
      newPassword: securePassword,
      confirmPassword: z.string(),
    })
    .refine(
      (data) => data.newPassword === data.confirmPassword,
      { message: "Passwords do not match", path: ["confirmPassword"] }
    ),

  /**
   * Change password (authenticated)
   */
  changePassword: z
    .object({
      currentPassword: z.string().min(1, "Current password is required"),
      newPassword: securePassword,
      confirmPassword: z.string(),
    })
    .refine(
      (data) => data.newPassword === data.confirmPassword,
      { message: "Passwords do not match", path: ["confirmPassword"] }
    )
    .refine(
      (data) => data.currentPassword !== data.newPassword,
      { message: "New password must be different from current password", path: ["newPassword"] }
    ),

  /**
   * Verify OTP
   */
  verifyOtp: z.object({
    email: basicEmail.optional(),
    phone: nepalPhone.optional(),
    otp: z
      .string()
      .length(6, "OTP must be 6 digits")
      .regex(/^\d{6}$/, "OTP must contain only numbers"),
  }).refine(
    (data) => data.email || data.phone,
    { message: "Either email or phone is required" }
  ),

  /**
   * Verify 2FA token
   */
  verify2FA: z.object({
    token: z
      .string()
      .length(6, "2FA code must be 6 digits")
      .regex(/^\d{6}$/, "2FA code must contain only numbers"),
  }),
};

// ==========================================
// BOOKING SCHEMAS
// ==========================================

export const BookingSchemas = {
  /**
   * Create booking (✅ FIXED: now allows today's date)
   */
  create: z
    .object({
      listingId: positiveInt,
      bookingDate: futureDate,
      startTime: time24h,
      endTime: time24h,
      guests: z.coerce.number().int().min(1).max(10000),
      specialRequests: safeString(0, 2000).optional(),
      paymentMethod: z.enum(["ESEWA", "KHALTI", "CARD", "DODO"]).optional(),
    })
    .refine(
      (data) => {
        const [startH, startM] = data.startTime.split(":").map(Number);
        const [endH, endM] = data.endTime.split(":").map(Number);
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;
        return endMinutes > startMinutes;
      },
      { message: "End time must be after start time", path: ["endTime"] }
    )
    .refine(
      (data) => {
        const [startH, startM] = data.startTime.split(":").map(Number);
        const [endH, endM] = data.endTime.split(":").map(Number);
        const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
        return durationMinutes >= 60 && durationMinutes <= 24 * 60;
      },
      { message: "Booking duration must be between 1 and 24 hours", path: ["endTime"] }
    ),

  /**
   * Cancel booking
   */
  cancel: z.object({
    reason: safeString(0, 500).optional(),
  }),

  /**
   * Get booking by ID (params)
   */
  getById: z.object({
    id: positiveInt,
  }),
};

// ==========================================
// PAYMENT SCHEMAS
// ==========================================

export const PaymentSchemas = {
  /**
   * Initiate payment
   */
  initiate: z.object({
    bookingId: positiveInt.optional(),
    paymentId: positiveInt.optional(),
    gateway: z.enum(["ESEWA", "KHALTI", "CARD", "DODO"]),
  }).refine(
    (data) => data.bookingId || data.paymentId,
    { message: "Either bookingId or paymentId is required" }
  ),

  /**
   * eSewa callback data
   */
  esewaCallback: z.object({
    data: z.string().min(1),
    oid: z.string().optional(),
    amt: z.string().optional(),
    refId: z.string().optional(),
  }),

  /**
   * Khalti callback data
   */
  khaltiCallback: z.object({
    pidx: z.string().min(1),
    status: z.string(),
    transaction_id: z.string().optional(),
    purchase_order_id: z.string().optional(),
  }),

  /**
   * Generic webhook
   */
  webhook: z.object({
    event: z.string(),
    data: z.record(z.unknown()),
  }),
};

// ==========================================
// LISTING SCHEMAS
// ==========================================

export const ListingSchemas = {
  /**
   * Create listing
   */
  create: z.object({
    title: safeString(10, 200),
    description: safeString(50, 5000),
    location: safeString(2, 200),
    address: safeString(10, 500),
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
    capacity: z.coerce.number().int().min(1).max(100000),
    pricePerHour: positiveDecimal,
    pricePerDay: positiveDecimal.optional(),
    minBookingHours: z.coerce.number().int().min(1).max(24).default(1),
    maxBookingHours: z.coerce.number().int().min(1).max(24).default(24),
    amenities: z.array(safeString(1, 100)).max(50).optional(),
    rules: z.array(safeString(1, 500)).max(20).optional(),
    operatingHours: z.object({
      monday: z.object({ open: time24h, close: time24h }).optional(),
      tuesday: z.object({ open: time24h, close: time24h }).optional(),
      wednesday: z.object({ open: time24h, close: time24h }).optional(),
      thursday: z.object({ open: time24h, close: time24h }).optional(),
      friday: z.object({ open: time24h, close: time24h }).optional(),
      saturday: z.object({ open: time24h, close: time24h }).optional(),
      sunday: z.object({ open: time24h, close: time24h }).optional(),
    }).optional(),
  }).refine(
    (data) => !data.maxBookingHours || data.minBookingHours <= data.maxBookingHours,
    { message: "Minimum booking hours cannot exceed maximum", path: ["minBookingHours"] }
  ),

  /**
   * Update listing (partial)
   */
  update: z.object({
    title: safeString(10, 200).optional(),
    description: safeString(50, 5000).optional(),
    location: safeString(2, 200).optional(),
    address: safeString(10, 500).optional(),
    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
    capacity: z.coerce.number().int().min(1).max(100000).optional(),
    pricePerHour: positiveDecimal.optional(),
    pricePerDay: positiveDecimal.optional(),
    amenities: z.array(safeString(1, 100)).max(50).optional(),
    rules: z.array(safeString(1, 500)).max(20).optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "PENDING"]).optional(),
  }),
};

// ==========================================
// USER SCHEMAS
// ==========================================

export const UserSchemas = {
  /**
   * Update profile
   */
  updateProfile: z.object({
    name: safeString(2, 100).optional(),
    phone: nepalPhone.optional(),
    bio: safeString(0, 1000).optional(),
    country: countryCode.optional(),
  }),
};

// ==========================================
// REVIEW SCHEMAS
// ==========================================

export const ReviewSchemas = {
  /**
   * Create review
   */
  create: z.object({
    bookingId: positiveInt,
    rating: z.coerce.number().int().min(1).max(5),
    title: safeString(3, 100).optional(),
    comment: safeString(10, 2000),
    cleanliness: z.coerce.number().int().min(1).max(5).optional(),
    accuracy: z.coerce.number().int().min(1).max(5).optional(),
    communication: z.coerce.number().int().min(1).max(5).optional(),
    location: z.coerce.number().int().min(1).max(5).optional(),
    value: z.coerce.number().int().min(1).max(5).optional(),
  }),

  /**
   * Host response
   */
  respond: z.object({
    response: safeString(10, 1000),
  }),
};

// ==========================================
// SUPPORT SCHEMAS
// ==========================================

export const SupportSchemas = {
  /**
   * Create support ticket
   */
  create: z.object({
    category: z.enum([
      "BOOKING",
      "PAYMENT",
      "ACCOUNT",
      "LISTING",
      "TECHNICAL",
      "OTHER",
    ]),
    subject: safeString(5, 200),
    message: safeString(20, 5000),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
    relatedType: z.enum(["BOOKING", "LISTING", "PAYMENT", "USER"]).optional(),
    relatedId: positiveInt.optional(),
  }),

  /**
   * Reply to ticket
   */
  reply: z.object({
    message: safeString(1, 5000),
    isInternal: z.boolean().default(false),
  }),
};

// ==========================================
// QUERY SCHEMAS (for GET requests)
// ==========================================

export const QuerySchemas = {
  /**
   * Pagination
   */
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),

  /**
   * Date range filter
   */
  dateRange: z
    .object({
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
    })
    .refine(
      (data) => {
        if (data.startDate && data.endDate) {
          return data.endDate >= data.startDate;
        }
        return true;
      },
      { message: "End date must be after start date" }
    ),

  /**
   * Listing filters
   */
  listingFilters: z.object({
    location: safeString(0, 200).optional(),
    minPrice: positiveDecimal.optional(),
    maxPrice: positiveDecimal.optional(),
    minCapacity: positiveInt.optional(),
    maxCapacity: positiveInt.optional(),
    amenities: z.string().transform((s) => s.split(",")).optional(),
    date: z.coerce.date().optional(),
    sortBy: z.enum(["price", "rating", "capacity", "createdAt"]).optional(),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
};

// ==========================================
// PARAMETER SCHEMAS
// ==========================================

/**
 * ID parameter (for :id in routes)
 */
export const IdParam = z.object({
  id: positiveInt,
});

/**
 * Slug parameter
 */
export const SlugParam = z.object({
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Invalid slug format"),
});

// ==========================================
// LEGACY COMPATIBILITY
// ==========================================
// These functions match your existing auth.validator.js interface

export const validateRegistration = (data) => {
  const result = AuthSchemas.register.safeParse(data);
  if (result.success) {
    return { isValid: true, errors: [], data: result.data };
  }
  return {
    isValid: false,
    errors: result.error.errors.map((e) => e.message),
  };
};

export const validateLogin = (data) => {
  const result = AuthSchemas.login.safeParse(data);
  if (result.success) {
    return { isValid: true, errors: [], data: result.data };
  }
  return {
    isValid: false,
    errors: result.error.errors.map((e) => e.message),
  };
};

export const validatePasswordReset = (data) => {
  const result = AuthSchemas.forgotPassword.safeParse(data);
  if (result.success) {
    return { isValid: true, errors: [], data: result.data };
  }
  return {
    isValid: false,
    errors: result.error.errors.map((e) => e.message),
  };
};

export const validateNewPassword = (data) => {
  const result = AuthSchemas.resetPassword.safeParse(data);
  if (result.success) {
    return { isValid: true, errors: [], data: result.data };
  }
  return {
    isValid: false,
    errors: result.error.errors.map((e) => e.message),
  };
};

export const validateChangePassword = (data) => {
  const result = AuthSchemas.changePassword.safeParse(data);
  if (result.success) {
    return { isValid: true, errors: [], data: result.data };
  }
  return {
    isValid: false,
    errors: result.error.errors.map((e) => e.message),
  };
};

// ==========================================
// EXPORT ALL
// ==========================================

export default {
  AuthSchemas,
  BookingSchemas,
  PaymentSchemas,
  ListingSchemas,
  UserSchemas,
  ReviewSchemas,
  SupportSchemas,
  QuerySchemas,
  IdParam,
  SlugParam,
  // Legacy compatibility
  validateRegistration,
  validateLogin,
  validatePasswordReset,
  validateNewPassword,
  validateChangePassword,
};