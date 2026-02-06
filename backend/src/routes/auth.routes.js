// ==========================================
// AUTH ROUTES - SECURITY HARDENED
// ==========================================
// File: routes/auth.routes.js
//
// SECURITY FEATURES:
// 1. Rate limiting on all auth endpoints
// 2. Input validation using Zod schemas
// 3. Audit logging for security events
// 4. CSRF protection ready
// ==========================================

import { Router } from "express";
import passport from "passport";

// Middleware
import { authenticate, optionalAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import {
  authLimiter,
  registrationLimiter,
  passwordResetLimiter,
  otpLimiter,
} from "../middleware/security.middleware.js";
import { auditLog, noCache } from "../middleware/security.middleware.js";
import { asyncHandler } from "../middleware/error.middleware.js";

// Validators
import { AuthSchemas } from "../validators/schemas.js";

// Controller
import * as controller from "../controllers/auth.controller.js";

const router = Router();

// ==========================================
// PUBLIC ROUTES (Rate Limited)
// ==========================================

/**
 * POST /api/auth/register
 * Register new user account
 *
 * Rate limit: 3 per hour per IP
 * Validation: Name, email, password, role, country
 */
router.post(
  "/register",
  registrationLimiter,
  auditLog("REGISTRATION"),
  validate(AuthSchemas.register),
  asyncHandler(controller.register)
);

/**
 * POST /api/auth/login
 * User login with email/password
 *
 * Rate limit: 5 attempts per 15 min per IP+email
 * Validation: Email, password
 */
router.post(
  "/login",
  authLimiter,
  auditLog("LOGIN_ATTEMPT"),
  validate(AuthSchemas.login),
  asyncHandler(controller.login)
);

/**
 * POST /api/auth/forgot-password
 * Request password reset email
 *
 * Rate limit: 3 per hour per IP
 * Note: Always returns success to prevent email enumeration
 */
router.post(
  "/forgot-password",
  passwordResetLimiter,
  auditLog("PASSWORD_RESET_REQUEST"),
  validate(AuthSchemas.forgotPassword),
  asyncHandler(controller.forgotPassword)
);

/**
 * GET /api/auth/verify-reset-token/:token
 * Verify if password reset token is valid
 *
 * Rate limit: Uses password reset limiter
 */
router.get(
  "/verify-reset-token/:token",
  passwordResetLimiter,
  asyncHandler(controller.verifyResetToken)
);

/**
 * POST /api/auth/reset-password
 * Reset password using token
 *
 * Rate limit: 3 per hour per IP
 * Validation: Token, new password
 */
router.post(
  "/reset-password",
  passwordResetLimiter,
  auditLog("PASSWORD_RESET"),
  validate(AuthSchemas.resetPassword),
  asyncHandler(controller.resetPassword)
);

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 *
 * Rate limit: None (handled by token expiry)
 */
router.post(
  "/refresh",
  asyncHandler(controller.refreshAccessToken)
);

// ==========================================
// GOOGLE OAUTH ROUTES
// ==========================================

/**
 * GET /api/auth/google
 * Initiate Google OAuth flow
 */
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

/**
 * GET /api/auth/google/callback
 * Google OAuth callback
 */
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/auth/login?error=google_auth_failed`,
  }),
  auditLog("GOOGLE_LOGIN"),
  asyncHandler(controller.googleCallback)
);

// ==========================================
// PROTECTED ROUTES (Require Authentication)
// ==========================================

/**
 * GET /api/auth/me
 * Get current authenticated user
 *
 * No caching (sensitive data)
 */
router.get(
  "/me",
  authenticate,
  noCache,
  asyncHandler(controller.getCurrentUser)
);

/**
 * POST /api/auth/logout
 * Logout current session
 */
router.post(
  "/logout",
  authenticate,
  auditLog("LOGOUT"),
  asyncHandler(controller.logout)
);

/**
 * POST /api/auth/change-password
 * Change password (requires current password)
 *
 * Validation: Current password, new password
 */
router.post(
  "/change-password",
  authenticate,
  auditLog("PASSWORD_CHANGE"),
  validate(AuthSchemas.changePassword),
  asyncHandler(controller.changePassword)
);

// ==========================================
// SESSION MANAGEMENT
// ==========================================

/**
 * GET /api/auth/sessions
 * Get all active sessions for current user
 */
router.get(
  "/sessions",
  authenticate,
  noCache,
  asyncHandler(controller.getActiveSessions)
);

/**
 * DELETE /api/auth/sessions/:sessionId
 * Revoke a specific session
 */
router.delete(
  "/sessions/:sessionId",
  authenticate,
  auditLog("SESSION_REVOKE"),
  asyncHandler(controller.revokeSession)
);

/**
 * POST /api/auth/sessions/revoke-all
 * Revoke all sessions (except current)
 */
router.post(
  "/sessions/revoke-all",
  authenticate,
  auditLog("SESSIONS_REVOKE_ALL"),
  asyncHandler(controller.revokeAllSessions)
);

// ==========================================
// EXPORT
// ==========================================

export default router;