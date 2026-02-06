// ==========================================
// AUTH CONTROLLER - FIXED VERSION
// ==========================================
// File: controllers/auth.controller.js
// 
// FIXES APPLIED:
// 1. ✅ Fixed console.log before import (was causing ReferenceError)
// 2. ✅ Removed debug console.logs
// 3. ✅ Cleaner error handling
// 
// SECURITY FEATURES:
// 1. Strong password hashing (bcrypt 12 rounds)
// 2. JWT with HS512 algorithm
// 3. Account lockout after failed attempts
// 4. Audit logging for all auth events
// 5. No information leakage in error messages
// 6. Short-lived access tokens + refresh tokens
// 7. Secure password reset flow
// ==========================================

import { prisma } from "../config/prisma.config.js";
import { SECURITY_CONFIG } from "../config/security.config.js";
import { auditService, AuditEvents } from "../services/audit.service.js";
import {
  hashPassword,
  verifyPassword,
  generateToken,
  generateUrlSafeToken,
  sha256,
} from "../utils/crypto.utils.js";
import {
  generateAccessToken,
  generateRefreshToken,
  blacklistToken,
} from "../middleware/auth.middleware.js";
import {
  AppError,
  ValidationError,
  AuthenticationError,
  ConflictError,
} from "../middleware/error.middleware.js";
import emailService from "../services/email/email.service.js";

// ==========================================
// REGISTER
// ==========================================

export const register = async (req, res) => {
  const { name, email, password, role = "USER", country, acceptTerms } = req.body;

  // Check terms acceptance
  if (!acceptTerms) {
    throw new ValidationError("You must accept the terms and conditions");
  }

  // Normalize email
  const normalizedEmail = email.toLowerCase().trim();

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    // Don't reveal if it's a Google account - generic message
    throw new ConflictError("An account with this email already exists");
  }

  // Hash password with strong settings (12 rounds)
  const hashedPassword = await hashPassword(password);

  // Create user
  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: role === "HOST" ? "HOST" : "USER",
      emailVerified: false,
      country: country?.toUpperCase() || null,
      lastPasswordChange: new Date(),
    },
  });

  // Audit log
  await auditService.log(AuditEvents.REGISTER_SUCCESS, {
    userId: user.id,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    metadata: { role: user.role, country: user.country },
  });

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const { token: refreshToken } = generateRefreshToken(user);

  // Store refresh token session
  try {
    await prisma.userSession.create({
      data: {
        userId: user.id,
        sessionToken: sha256(refreshToken),
        userAgent: req.get("User-Agent")?.substring(0, 500),
        ipAddress: req.ip,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  } catch (e) {
    // Session table might not exist yet - continue
    if (process.env.NODE_ENV === 'development') {
      console.warn("Could not store session:", e.message);
    }
  }

  // Set secure cookies
  setAuthCookies(res, accessToken, refreshToken);

  // Send verification email (non-blocking)
  sendVerificationEmail(user).catch((err) => {
    if (process.env.NODE_ENV === 'development') {
      console.error("Failed to send verification email:", err.message);
    }
  });

  res.status(201).json({
    message: "Registration successful! Please verify your email.",
    accessToken,
    refreshToken,
    user: sanitizeUser(user),
  });
};

// ==========================================
// LOGIN
// ==========================================

export const login = async (req, res) => {
  const { email, password, rememberMe = false } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  // Find user
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  // Check if account is locked
  if (user?.lockedUntil && new Date(user.lockedUntil) > new Date()) {
    const remainingMinutes = Math.ceil(
      (new Date(user.lockedUntil) - new Date()) / 60000
    );

    await auditService.logLoginFailed(
      normalizedEmail,
      req.ip,
      req.get("User-Agent"),
      "ACCOUNT_LOCKED"
    );

    throw new AuthenticationError(
      `Account temporarily locked. Try again in ${remainingMinutes} minutes.`,
      "ACCOUNT_LOCKED"
    );
  }

  // Check if account is suspended
  if (user?.suspended) {
    await auditService.logLoginFailed(
      normalizedEmail,
      req.ip,
      req.get("User-Agent"),
      "ACCOUNT_SUSPENDED"
    );

    throw new AuthenticationError(
      "Account suspended. Contact support for assistance.",
      "ACCOUNT_SUSPENDED"
    );
  }

  // SECURITY: Same error message whether user exists or password wrong
  if (!user || !user.password) {
    await auditService.logLoginFailed(
      normalizedEmail,
      req.ip,
      req.get("User-Agent"),
      "USER_NOT_FOUND"
    );
    throw new AuthenticationError("Invalid email or password");
  }

  // Google-only account check
  if (user.googleId && !user.password) {
    throw new AuthenticationError(
      "This account uses Google Sign-In. Please use the 'Sign in with Google' button.",
      "GOOGLE_ONLY_ACCOUNT"
    );
  }

  const isValidPassword = await verifyPassword(password, user.password);

  if (!isValidPassword) {
    // Increment failed attempts
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: { increment: 1 },
      },
    });

    // Check if should lock
    const maxAttempts = SECURITY_CONFIG.lockout.maxFailedAttempts;
    if (updatedUser.failedLoginAttempts >= maxAttempts) {
      const lockDuration = SECURITY_CONFIG.lockout.lockoutDuration;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          lockedUntil: new Date(Date.now() + lockDuration),
        },
      });
    }

    await auditService.logLoginFailed(
      normalizedEmail,
      req.ip,
      req.get("User-Agent"),
      "INVALID_PASSWORD"
    );

    throw new AuthenticationError("Invalid email or password");
  }

  // Successful login - reset failed attempts and unlock
  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      lastActiveAt: new Date(),
    },
  });

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const { token: refreshToken } = generateRefreshToken(user);

  // Calculate session expiry
  const sessionExpiry = rememberMe
    ? 30 * 24 * 60 * 60 * 1000
    : 7 * 24 * 60 * 60 * 1000;

  // Store session
  try {
    await prisma.userSession.create({
      data: {
        userId: user.id,
        sessionToken: sha256(refreshToken),
        userAgent: req.get("User-Agent")?.substring(0, 500),
        ipAddress: req.ip,
        expiresAt: new Date(Date.now() + sessionExpiry),
        isCurrent: true,
      },
    });
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.warn("Could not store session:", e.message);
    }
  }

  // Audit log
  await auditService.log(AuditEvents.LOGIN_SUCCESS, {
    userId: user.id,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    metadata: { rememberMe },
  });

  // Set cookies
  setAuthCookies(res, accessToken, refreshToken, rememberMe);

  res.json({
    message: "Login successful",
    accessToken,
    refreshToken,
    user: sanitizeUser(user),
  });
};

// ==========================================
// LOGOUT
// ==========================================

export const logout = async (req, res) => {
  const accessToken = req.headers.authorization?.split(" ")[1];
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  // Blacklist access token
  if (accessToken) {
    await blacklistToken(accessToken);
  }

  // Revoke session if refresh token provided
  if (refreshToken) {
    try {
      await prisma.userSession.updateMany({
        where: {
          sessionToken: sha256(refreshToken),
          userId: req.user?.userId,
        },
        data: { revokedAt: new Date() },
      });
    } catch (e) {
      // Ignore session errors
    }
  }

  // Audit log
  if (req.user?.userId) {
    await auditService.log(AuditEvents.LOGOUT, {
      userId: req.user.userId,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });
  }

  // Clear cookies
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  res.json({ message: "Logged out successfully" });
};

// ==========================================
// REFRESH TOKEN
// ==========================================

export const refreshAccessToken = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!refreshToken) {
    throw new AuthenticationError("Refresh token required", "NO_REFRESH_TOKEN");
  }

  // Find valid session
  let session;
  try {
    session = await prisma.userSession.findFirst({
      where: {
        sessionToken: sha256(refreshToken),
        expiresAt: { gt: new Date() },
        revokedAt: null,
      },
      include: { user: true },
    });
  } catch (e) {
    // Session table might not exist - try basic token validation
    if (process.env.NODE_ENV === 'development') {
      console.warn("Session lookup failed:", e.message);
    }
  }

  if (!session) {
    throw new AuthenticationError("Invalid or expired refresh token", "INVALID_REFRESH_TOKEN");
  }

  // Check if user is still valid
  if (session.user.suspended) {
    throw new AuthenticationError("Account not accessible", "ACCOUNT_RESTRICTED");
  }

  if (session.user.lockedUntil && new Date(session.user.lockedUntil) > new Date()) {
    throw new AuthenticationError("Account locked", "ACCOUNT_LOCKED");
  }

  // Generate new access token
  const accessToken = generateAccessToken(session.user);

  // Update session activity
  await prisma.userSession.update({
    where: { id: session.id },
    data: { lastActiveAt: new Date() },
  });

  // Set cookie
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60 * 1000,
  });

  res.json({ accessToken });
};

// ==========================================
// GET CURRENT USER
// ==========================================

export const getCurrentUser = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      adminRole: true,
      profilePhoto: true,
      phone: true,
      createdAt: true,
      googleId: true,
      emailVerified: true,
      phoneVerified: true,
      country: true,
      bio: true,
    },
  });

  if (!user) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }

  res.json({
    ...user,
    id: user.id.toString(),
    hasGoogleLinked: !!user.googleId,
  });
};

// ==========================================
// FORGOT PASSWORD
// ==========================================

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  // Always return same response to prevent email enumeration
  const successResponse = {
    message: "If the email exists, a password reset link has been sent",
  };

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    await auditService.log(AuditEvents.PASSWORD_RESET_REQUEST, {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      metadata: { userExists: false },
    });
    return res.json(successResponse);
  }

  // Generate secure reset token
  const resetToken = generateUrlSafeToken(32);
  const hashedToken = sha256(resetToken);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  // Save hashed token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: expiresAt,
    },
  });

  // Audit log
  await auditService.log(AuditEvents.PASSWORD_RESET_REQUEST, {
    userId: user.id,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  // Send email
  const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;
  try {
    await emailService.sendPasswordResetEmail(user.email, user.name, resetUrl);
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Failed to send reset email:", err.message);
    }
  }

  res.json(successResponse);
};

// ==========================================
// VERIFY RESET TOKEN
// ==========================================

export const verifyResetToken = async (req, res) => {
  const { token } = req.params;

  if (!token || token.length < 32) {
    return res.json({ valid: false, error: "Invalid token" });
  }

  const hashedToken = sha256(token);

  const user = await prisma.user.findFirst({
    where: {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { gt: new Date() },
    },
    select: { email: true },
  });

  if (!user) {
    return res.json({ valid: false, error: "Invalid or expired token" });
  }

  res.json({ valid: true, email: maskEmail(user.email) });
};

// ==========================================
// RESET PASSWORD
// ==========================================

export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || token.length < 32) {
    throw new ValidationError("Invalid reset token");
  }

  const hashedToken = sha256(token);

  // Find user with valid token
  const user = await prisma.user.findFirst({
    where: {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { gt: new Date() },
    },
  });

  if (!user) {
    throw new ValidationError("Invalid or expired reset token");
  }

  // Hash new password
  const hashedPassword = await hashPassword(newPassword);

  // Update user
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
      lastPasswordChange: new Date(),
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });

  // Revoke all sessions
  try {
    await prisma.userSession.updateMany({
      where: { userId: user.id },
      data: { revokedAt: new Date() },
    });
  } catch (e) {
    // Ignore
  }

  // Audit log
  await auditService.log(AuditEvents.PASSWORD_CHANGE, {
    userId: user.id,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  res.json({ message: "Password reset successfully. Please log in." });
};

// ==========================================
// CHANGE PASSWORD (Authenticated)
// ==========================================

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.userId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, password: true, email: true, name: true },
  });

  if (!user || !user.password) {
    throw new ValidationError("Cannot change password for this account");
  }

  // Verify current password
  const isValid = await verifyPassword(currentPassword, user.password);
  if (!isValid) {
    await auditService.log(AuditEvents.PASSWORD_CHANGED, {
      userId,
      ip: req.ip,
      metadata: { success: false, reason: "INVALID_CURRENT_PASSWORD" },
      severity: "WARN",
    });
    throw new AuthenticationError("Current password is incorrect");
  }

  // Hash new password
  const hashedPassword = await hashPassword(newPassword);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
      lastPasswordChange: new Date(),
    },
  });

  // Audit log
  await auditService.log(AuditEvents.PASSWORD_CHANGED, {
    userId,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    metadata: { success: true },
  });

  res.json({ message: "Password changed successfully" });
};

// ==========================================
// GOOGLE OAUTH CALLBACK
// ==========================================

export const googleCallback = async (req, res) => {
  const user = req.user;

  if (!user) {
    if (process.env.NODE_ENV === 'development') {
      console.error("No user from Google OAuth");
    }
    return res.redirect(
      `${process.env.FRONTEND_URL}/auth/login?error=auth_failed`
    );
  }

  // Audit log
  await auditService.log(AuditEvents.LOGIN_SUCCESS, {
    userId: user.id,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    metadata: { provider: "google" },
  });

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const { token: refreshToken } = generateRefreshToken(user);

  // Store session
  try {
    await prisma.userSession.create({
      data: {
        userId: user.id,
        sessionToken: sha256(refreshToken),
        userAgent: req.get("User-Agent")?.substring(0, 500),
        ipAddress: req.ip,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.warn("Could not store session:", e.message);
    }
  }

  // Build redirect URL
  const params = new URLSearchParams({
    token: accessToken,
    refreshToken,
    userId: user.id.toString(),
    name: encodeURIComponent(user.name || ""),
    email: encodeURIComponent(user.email),
    role: user.role,
    emailVerified: "true",
    phoneVerified: user.phoneVerified ? "true" : "false",
  });

  res.redirect(`${process.env.FRONTEND_URL}/auth/callback?${params.toString()}`);
};

// ==========================================
// GET ACTIVE SESSIONS
// ==========================================

export const getActiveSessions = async (req, res) => {
  const userId = req.user.userId;

  try {
    const sessions = await prisma.userSession.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
        revokedAt: null,
      },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        lastActiveAt: true,
        isCurrent: true,
      },
      orderBy: { lastActiveAt: "desc" },
    });

    res.json({ sessions });
  } catch (e) {
    res.json({ sessions: [], message: "Session tracking not enabled" });
  }
};

// ==========================================
// REVOKE SESSION
// ==========================================

export const revokeSession = async (req, res) => {
  const userId = req.user.userId;
  const { sessionId } = req.params;

  const session = await prisma.userSession.findFirst({
    where: {
      id: parseInt(sessionId),
      userId,
      revokedAt: null,
    },
  });

  if (!session) {
    throw new AppError("Session not found", 404, "SESSION_NOT_FOUND");
  }

  await prisma.userSession.update({
    where: { id: session.id },
    data: { revokedAt: new Date() },
  });

  res.json({ message: "Session revoked" });
};

// ==========================================
// REVOKE ALL SESSIONS
// ==========================================

export const revokeAllSessions = async (req, res) => {
  const userId = req.user.userId;
  const { exceptCurrent = true } = req.body;
  const currentToken = req.cookies?.refreshToken || req.body.currentRefreshToken;

  const where = {
    userId,
    revokedAt: null,
  };

  if (exceptCurrent && currentToken) {
    where.sessionToken = { not: sha256(currentToken) };
  }

  const result = await prisma.userSession.updateMany({
    where,
    data: { revokedAt: new Date() },
  });

  await auditService.log(AuditEvents.LOGOUT, {
    userId,
    ip: req.ip,
    metadata: { action: "REVOKE_ALL_SESSIONS", count: result.count },
  });

  res.json({ message: `${result.count} sessions revoked` });
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function setAuthCookies(res, accessToken, refreshToken, rememberMe = false) {
  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    maxAge: 15 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    path: "/api/auth",
    maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000,
  });
}

function sanitizeUser(user) {
  return {
    id: user.id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    adminRole: user.adminRole || null,
    profilePhoto: user.profilePhoto || null,
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified || false,
    phone: user.phone || null,
    country: user.country,
  };
}

function maskEmail(email) {
  if (!email || !email.includes("@")) return email;
  const [local, domain] = email.split("@");
  const masked = local.slice(0, 2) + "***";
  return `${masked}@${domain}`;
}

async function sendVerificationEmail(user) {
  const verificationToken = generateUrlSafeToken(32);
  const hashedToken = sha256(verificationToken);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerificationToken: hashedToken,
      emailVerificationExpiry: expiresAt,
    },
  });

  const verifyUrl = `${process.env.FRONTEND_URL}/auth/verify-email?token=${verificationToken}`;
  
  if (emailService.sendVerificationEmail) {
    await emailService.sendVerificationEmail(user.email, user.name, verifyUrl);
  }
}

// ==========================================
// EXPORT
// ==========================================

export default {
  register,
  login,
  logout,
  refreshAccessToken,
  getCurrentUser,
  forgotPassword,
  verifyResetToken,
  resetPassword,
  changePassword,
  googleCallback,
  getActiveSessions,
  revokeSession,
  revokeAllSessions,
};