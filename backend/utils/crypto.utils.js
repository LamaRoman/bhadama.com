// ==========================================
// CRYPTO UTILITIES
// ==========================================
// File: utils/crypto.utils.js
//
// Secure cryptographic operations for:
// - Password hashing
// - Token generation
// - Encryption/decryption
// - Secure comparison
// ==========================================

import crypto from "crypto";
import bcrypt from "bcrypt";

// ==========================================
// CONFIGURATION
// ==========================================

const BCRYPT_ROUNDS = 12; // Strong but not too slow
const TOKEN_BYTES = 32;
const ENCRYPTION_ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

// ==========================================
// PASSWORD HASHING (bcrypt)
// ==========================================

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Verify a password against a hash
 * @param {string} password - Plain text password
 * @param {string} hash - Stored hash
 * @returns {Promise<boolean>} - True if match
 */
export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// ==========================================
// TOKEN GENERATION
// ==========================================

/**
 * Generate a secure random token (hex)
 * @param {number} bytes - Number of bytes (default 32)
 * @returns {string} - Hex-encoded token
 */
export function generateToken(bytes = TOKEN_BYTES) {
  return crypto.randomBytes(bytes).toString("hex");
}

/**
 * Generate a URL-safe token (base64url)
 * @param {number} bytes - Number of bytes (default 32)
 * @returns {string} - URL-safe base64 token
 */
export function generateUrlSafeToken(bytes = TOKEN_BYTES) {
  return crypto
    .randomBytes(bytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/**
 * Generate a numeric OTP
 * @param {number} digits - Number of digits (default 6)
 * @returns {string} - Numeric OTP
 */
export function generateOtp(digits = 6) {
  const max = Math.pow(10, digits);
  const min = Math.pow(10, digits - 1);
  const otp = crypto.randomInt(min, max);
  return otp.toString();
}

/**
 * Generate a UUID v4
 * @returns {string} - UUID
 */
export function generateUuid() {
  return crypto.randomUUID();
}

// ==========================================
// HASHING
// ==========================================

/**
 * SHA-256 hash
 * @param {string} value - Value to hash
 * @returns {string} - Hex-encoded hash
 */
export function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

/**
 * SHA-512 hash
 * @param {string} value - Value to hash
 * @returns {string} - Hex-encoded hash
 */
export function sha512(value) {
  return crypto.createHash("sha512").update(value).digest("hex");
}

/**
 * HMAC signature
 * @param {string} data - Data to sign
 * @param {string} secret - Secret key
 * @param {string} algorithm - Hash algorithm (default sha256)
 * @returns {string} - Hex-encoded HMAC
 */
export function hmac(data, secret, algorithm = "sha256") {
  return crypto.createHmac(algorithm, secret).update(data).digest("hex");
}

/**
 * HMAC signature (base64)
 * @param {string} data - Data to sign
 * @param {string} secret - Secret key
 * @returns {string} - Base64-encoded HMAC
 */
export function hmacBase64(data, secret) {
  return crypto.createHmac("sha256", secret).update(data).digest("base64");
}

// ==========================================
// ENCRYPTION / DECRYPTION
// ==========================================

/**
 * Encrypt data using AES-256-GCM
 * @param {string} plaintext - Data to encrypt
 * @param {string} key - Encryption key (will be derived if < 32 chars)
 * @returns {string} - Encrypted data as "iv:authTag:ciphertext"
 */
export function encrypt(plaintext, key = process.env.ENCRYPTION_KEY) {
  if (!key) {
    throw new Error("Encryption key is required");
  }

  // Derive a 32-byte key
  const derivedKey = crypto.scryptSync(key, "salt", 32);

  // Generate random IV
  const iv = crypto.randomBytes(IV_LENGTH);

  // Create cipher
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, derivedKey, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  // Encrypt
  let encrypted = cipher.update(plaintext, "utf8", "base64");
  encrypted += cipher.final("base64");

  // Get auth tag
  const authTag = cipher.getAuthTag();

  // Return as iv:authTag:ciphertext
  return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted}`;
}

/**
 * Decrypt data encrypted with encrypt()
 * @param {string} encryptedData - Data in "iv:authTag:ciphertext" format
 * @param {string} key - Encryption key
 * @returns {string} - Decrypted plaintext
 */
export function decrypt(encryptedData, key = process.env.ENCRYPTION_KEY) {
  if (!key) {
    throw new Error("Encryption key is required");
  }

  const derivedKey = crypto.scryptSync(key, "salt", 32);

  const parts = encryptedData.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted data format");
  }

  const [ivBase64, authTagBase64, ciphertext] = parts;
  const iv = Buffer.from(ivBase64, "base64");
  const authTag = Buffer.from(authTagBase64, "base64");

  // Create decipher
  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, derivedKey, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  // Decrypt
  let decrypted = decipher.update(ciphertext, "base64", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

// ==========================================
// SECURE COMPARISON
// ==========================================

/**
 * Constant-time string comparison (prevents timing attacks)
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {boolean} - True if equal
 */
export function secureCompare(a, b) {
  if (!a || !b) return false;

  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  // If lengths differ, still do comparison to prevent timing attack
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}

// ==========================================
// MASKING / REDACTION
// ==========================================

/**
 * Mask an email address
 * @param {string} email - Email to mask
 * @returns {string} - Masked email (jo***@example.com)
 */
export function maskEmail(email) {
  if (!email || !email.includes("@")) return email;
  const [local, domain] = email.split("@");
  const masked = local.length > 2 ? local.slice(0, 2) + "***" : "***";
  return `${masked}@${domain}`;
}

/**
 * Mask a phone number
 * @param {string} phone - Phone to mask
 * @returns {string} - Masked phone (+977****1234)
 */
export function maskPhone(phone) {
  if (!phone || phone.length < 6) return "***";
  return phone.slice(0, 4) + "****" + phone.slice(-4);
}

/**
 * Mask a credit card number
 * @param {string} card - Card number
 * @returns {string} - Masked card (****1234)
 */
export function maskCard(card) {
  if (!card || card.length < 4) return "****";
  const cleaned = card.replace(/\D/g, "");
  return "****" + cleaned.slice(-4);
}

/**
 * Redact sensitive fields from an object
 * @param {Object} obj - Object to redact
 * @param {string[]} fields - Field names to redact
 * @returns {Object} - Redacted object (copy)
 */
export function redactFields(obj, fields = ["password", "token", "secret", "key", "otp", "apiKey"]) {
  if (!obj || typeof obj !== "object") return obj;

  const redacted = JSON.parse(JSON.stringify(obj));

  const redactRecursive = (o) => {
    for (const key in o) {
      const lowerKey = key.toLowerCase();
      if (fields.some((f) => lowerKey.includes(f.toLowerCase()))) {
        o[key] = "[REDACTED]";
      } else if (typeof o[key] === "object" && o[key] !== null) {
        redactRecursive(o[key]);
      }
    }
  };

  redactRecursive(redacted);
  return redacted;
}

// ==========================================
// DEVICE FINGERPRINTING
// ==========================================

/**
 * Generate a device fingerprint from request
 * @param {Object} req - Express request
 * @returns {string} - Device fingerprint hash
 */
export function generateDeviceFingerprint(req) {
  const components = [
    req.get("User-Agent") || "",
    req.get("Accept-Language") || "",
    req.get("Accept-Encoding") || "",
    req.ip || "",
  ];

  return sha256(components.join("|"));
}

// ==========================================
// VALIDATION
// ==========================================

/**
 * Validate a UUID
 * @param {string} uuid - UUID to validate
 * @returns {boolean} - True if valid UUID v4
 */
export function isValidUuid(uuid) {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return regex.test(uuid);
}

/**
 * Validate a hex string
 * @param {string} hex - Hex string to validate
 * @param {number} length - Expected length (optional)
 * @returns {boolean} - True if valid hex
 */
export function isValidHex(hex, length = null) {
  if (length && hex.length !== length) return false;
  return /^[0-9a-f]+$/i.test(hex);
}

// ==========================================
// EXPORT ALL
// ==========================================

export default {
  // Password
  hashPassword,
  verifyPassword,

  // Tokens
  generateToken,
  generateUrlSafeToken,
  generateOtp,
  generateUuid,

  // Hashing
  sha256,
  sha512,
  hmac,
  hmacBase64,

  // Encryption
  encrypt,
  decrypt,

  // Comparison
  secureCompare,

  // Masking
  maskEmail,
  maskPhone,
  maskCard,
  redactFields,

  // Device
  generateDeviceFingerprint,

  // Validation
  isValidUuid,
  isValidHex,
};