// ==========================================
// AUTHENTICATION MIDDLEWARE - FIXED VERSION
// ==========================================
// File: middleware/auth.middleware.js
//
// FIXES APPLIED:
// 1. ✅ Removed duplicate userId/id alias (now only userId)
// 2. ✅ Fixed memory leak in tokenBlacklist Map (added max size)
// 3. ✅ JWT expiry times now from environment variables
// 4. ✅ Cleaner conditional logging
//
// Features:
// 1. JWT verification (HS512)
// 2. Token blacklisting
// 3. Hybrid role-based authorization (hierarchy + strict)
// 4. IDOR protection with super admin bypass
// 5. 2FA support
// 6. Permission-based access control
// 7. Environment-based god mode
// 8. Enhanced audit logging
// ==========================================

import jwt from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "../config/prisma.config.js";
import {
  AuthenticationError,
  NotFoundError,
} from "./error.middleware.js";
import {
  ADMIN_HIERARCHY,
  ROLE_HIERARCHY,
  isSuperAdmin,
  isAdmin,
  hasAdminRole,
  hasAdminLevel,
  hasPermission,
  hasRoleLevel,
  getRoleLevel,
  canPerformStrictOperation,
  canSuperAdminBypass,
  getEffectiveAdminRoles,
  getRoleName,
} from "../config/roles.config.js";
import { auditService } from "../services/audit.service.js";

// ==========================================
// CONFIGURATION
// ==========================================

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET;
const JWT_ALGORITHM = "HS512";

// ✅ FIX: JWT expiry times from environment with defaults
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || "15m";
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || "7d";

// ✅ FIX: Token blacklist with max size to prevent memory leak
const tokenBlacklist = new Map();
const MAX_BLACKLIST_SIZE = 10000;

// ==========================================
// UTILITY: Conditional logging (dev only)
// ==========================================
const devLog = (message, ...args) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(message, ...args);
  }
};

const devWarn = (message, ...args) => {
  if (process.env.NODE_ENV === 'development') {
    console.warn(message, ...args);
  }
};

// ==========================================
// TOKEN GENERATION
// ==========================================

/**
 * Generate access token
 */
export function generateAccessToken(user) {
  return jwt.sign(
    {
      userId: Number(user.id),
      email: user.email,
      role: user.role,
      adminRole: user.adminRole || null,
      type: "access",
    },
    JWT_SECRET,
    {
      algorithm: JWT_ALGORITHM,
      expiresIn: ACCESS_TOKEN_EXPIRY,
      issuer: "mybigyard.com",
      audience: "mybigyard.com",
    }
  );
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(user) {
  const tokenId = crypto.randomUUID();

  const token = jwt.sign(
    {
      userId: Number(user.id),
      tokenId,
      type: "refresh",
    },
    JWT_REFRESH_SECRET,
    {
      algorithm: JWT_ALGORITHM,
      expiresIn: REFRESH_TOKEN_EXPIRY,
      issuer: "mybigyard.com",
    }
  );

  return { token, tokenId };
}

/**
 * Blacklist a token
 * ✅ FIX: Added max size check to prevent memory leak
 */
export async function blacklistToken(token, expiresIn = 15 * 60 * 1000) {
  const hash = crypto.createHash("sha256").update(token).digest("hex");

  // Store in memory
  tokenBlacklist.set(hash, Date.now() + expiresIn);

  // Also try to store in database for persistence
  try {
    await prisma.rateLimitRecord.create({
      data: {
        key: `blacklist:${hash}`,
        count: 1,
        expiresAt: new Date(Date.now() + expiresIn),
      },
    });
  } catch (e) {
    // Ignore database errors
  }

  // ✅ FIX: Clean up when size exceeds limit or randomly (10% of time)
  if (tokenBlacklist.size > MAX_BLACKLIST_SIZE || Math.random() < 0.1) {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, expiry] of tokenBlacklist.entries()) {
      if (expiry < now) {
        tokenBlacklist.delete(key);
        cleaned++;
      }
    }
    
    // If still too large after cleanup, remove oldest entries
    if (tokenBlacklist.size > MAX_BLACKLIST_SIZE) {
      const entries = Array.from(tokenBlacklist.entries());
      entries.sort((a, b) => a[1] - b[1]); // Sort by expiry
      
      const toRemove = entries.slice(0, tokenBlacklist.size - MAX_BLACKLIST_SIZE + 1000);
      toRemove.forEach(([key]) => tokenBlacklist.delete(key));
      cleaned += toRemove.length;
    }
    
    if (cleaned > 0) {
      devLog(`🧹 Cleaned ${cleaned} expired tokens from blacklist`);
    }
  }
}

/**
 * Check if token is blacklisted
 */
async function isTokenBlacklisted(token) {
  const hash = crypto.createHash("sha256").update(token).digest("hex");

  // Check memory first
  const memoryExpiry = tokenBlacklist.get(hash);
  if (memoryExpiry && memoryExpiry > Date.now()) {
    return true;
  }

  // Check database
  try {
    const record = await prisma.rateLimitRecord.findFirst({
      where: {
        key: `blacklist:${hash}`,
        expiresAt: { gt: new Date() },
      },
    });
    return !!record;
  } catch (e) {
    return false;
  }
}

// ==========================================
// AUTHENTICATION MIDDLEWARE
// ==========================================

/**
 * Require authentication
 * ✅ FIX: Removed duplicate 'id' alias, only 'userId' is used now
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get token from header or cookie
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.accessToken;

    let token;
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else if (cookieToken) {
      token = cookieToken;
    }

    if (!token) {
      throw new AuthenticationError("Authentication required", "NO_TOKEN");
    }

    // Check if blacklisted
    if (await isTokenBlacklisted(token)) {
      throw new AuthenticationError("Token has been revoked", "TOKEN_REVOKED");
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET, {
        algorithms: [JWT_ALGORITHM],
        issuer: "mybigyard.com",
        audience: "mybigyard.com",
      });
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        throw new AuthenticationError("Token expired", "TOKEN_EXPIRED");
      }
      throw new AuthenticationError("Invalid token", "INVALID_TOKEN");
    }

    // Ensure it's an access token
    if (decoded.type !== "access") {
      throw new AuthenticationError("Invalid token type", "INVALID_TOKEN_TYPE");
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        adminRole: true,
        suspended: true,
        lockedUntil: true,
        emailVerified: true,
        phoneVerified: true,
        twoFactorEnabled: true,
      },
    });

    if (!user) {
      throw new AuthenticationError("User not found", "USER_NOT_FOUND");
    }

    const userIsSuperAdmin = isSuperAdmin(user);

    // Check if suspended (SUPER_ADMIN can bypass in god mode)
    if (user.suspended && !(userIsSuperAdmin && canSuperAdminBypass('suspension'))) {
      throw new AuthenticationError("Account suspended", "ACCOUNT_SUSPENDED");
    }

    // Check if locked (SUPER_ADMIN can bypass in god mode)
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date() && 
        !(userIsSuperAdmin && canSuperAdminBypass('accountLock'))) {
      throw new AuthenticationError("Account locked", "ACCOUNT_LOCKED");
    }

    // ✅ FIX: Attach user object with ONLY userId (removed duplicate 'id' alias)
    req.user = {
      userId: user.id,  // Only userId, no 'id' alias
      email: user.email,
      name: user.name,
      role: user.role,
      adminRole: user.adminRole,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      
      // Helper flags
      isAdmin: isAdmin(user),
      isSuperAdmin: userIsSuperAdmin,
      
      // Helper methods
      hasAdminRole: (...roles) => hasAdminRole(user, ...roles),
      hasAdminLevel: (level) => hasAdminLevel(user, level),
      hasPermission: (permission) => hasPermission(user, permission),
      canPerformStrictOperation: (operation) => canPerformStrictOperation(user, operation),
      getEffectiveRoles: () => getEffectiveAdminRoles(user),
      getRoleName: () => getRoleName(user.role, user.adminRole),
    };

    // Update last active (non-blocking)
    prisma.user
      .update({
        where: { id: user.id },
        data: { lastActiveAt: new Date() },
      })
      .catch(() => {});

    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return res.status(error.statusCode).json({
        error: error.message,
        code: error.code,
      });
    }
    next(error);
  }
};

/**
 * Optional authentication (doesn't fail if not authenticated)
 * ✅ FIX: Removed duplicate 'id' alias
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.accessToken;

    let token;
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else if (cookieToken) {
      token = cookieToken;
    }

    if (!token) {
      req.user = null;
      return next();
    }

    // Verify token (don't throw if invalid)
    try {
      const decoded = jwt.verify(token, JWT_SECRET, {
        algorithms: [JWT_ALGORITHM],
      });

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          adminRole: true,
        },
      });

      if (user && !user.suspended) {
        // ✅ FIX: Only userId, no 'id' alias
        req.user = {
          userId: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          adminRole: user.adminRole,
          isAdmin: isAdmin(user),
          isSuperAdmin: isSuperAdmin(user),
          getRoleName: () => getRoleName(user.role, user.adminRole),
        };
      } else {
        req.user = null;
      }
    } catch {
      req.user = null;
    }

    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

// ==========================================
// AUTHORIZATION MIDDLEWARE - BASIC
// ==========================================

/**
 * Require minimum role level (hierarchy-based)
 * 
 * Uses ROLE_HIERARCHY: USER (1) < HOST (2) < ADMIN (3)
 * User must have the specified role OR HIGHER to access.
 * SUPER_ADMIN always bypasses all role checks.
 * 
 * @param {Object} options - Authorization options
 * @param {string} options.minRole - Minimum required role (USER, HOST, or ADMIN)
 */
export const authorize = ({ minRole }) => {
  if (!minRole) {
    throw new Error("authorize() requires { minRole: 'ROLE' }");
  }

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required",
        code: "AUTH_REQUIRED",
      });
    }

    // Super admin bypasses all role checks
    if (req.user.isSuperAdmin && canSuperAdminBypass('authorization')) {
      return next();
    }

    const userRole = req.user.role.toUpperCase();
    const normalizedMinRole = minRole.toUpperCase();
    const requiredLevel = getRoleLevel(normalizedMinRole);
    const userLevel = getRoleLevel(userRole);

    if (userLevel < requiredLevel) {
      return res.status(403).json({
        error: "You do not have permission to access this resource",
        code: "FORBIDDEN",
        requiredMinRole: normalizedMinRole,
        currentRole: req.user.role,
      });
    }

    next();
  };
};

// ==========================================
// ADMIN AUTHORIZATION - HIERARCHY BASED
// ==========================================

/**
 * Require ANY admin access (role must be ADMIN)
 */
export const requireAdmin = () => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required",
        code: "AUTH_REQUIRED",
      });
    }

    if (!req.user.isAdmin) {
      return res.status(403).json({
        error: "Admin access required",
        code: "ADMIN_REQUIRED",
      });
    }

    next();
  };
};

/**
 * Require minimum admin hierarchy level
 * Higher levels inherit access (e.g., ANALYST can access MODERATOR endpoints)
 * SUPER_ADMIN always bypasses
 * 
 * @param {number} minLevel - Minimum admin level from ADMIN_HIERARCHY
 */
export const requireAdminLevel = (minLevel) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required",
        code: "AUTH_REQUIRED",
      });
    }

    if (!req.user.isAdmin) {
      return res.status(403).json({
        error: "Admin access required",
        code: "ADMIN_REQUIRED",
      });
    }

    // Super admin bypasses level checks
    if (req.user.isSuperAdmin && canSuperAdminBypass('adminRoleRestrictions')) {
      return next();
    }

    // Check hierarchy level
    if (!req.user.hasAdminLevel(minLevel)) {
      const requiredRoleName = Object.keys(ADMIN_HIERARCHY).find(
        key => ADMIN_HIERARCHY[key] === minLevel
      );
      
      return res.status(403).json({
        error: "Insufficient admin privileges",
        code: "INSUFFICIENT_ADMIN_LEVEL",
        required: requiredRoleName,
        requiredLevel: minLevel,
        current: req.user.adminRole,
      });
    }

    next();
  };
};

// ==========================================
// ADMIN AUTHORIZATION - STRICT ROLE
// ==========================================

/**
 * Require EXACT admin role match (no hierarchy)
 * Only specified roles can access (+ SUPER_ADMIN override)
 * 
 * @param {...string} allowedAdminRoles - Specific admin roles required
 */
export const requireAdminRole = (...allowedAdminRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required",
        code: "AUTH_REQUIRED",
      });
    }

    if (!req.user.isAdmin) {
      return res.status(403).json({
        error: "Admin access required",
        code: "ADMIN_REQUIRED",
      });
    }

    // Super admin bypasses role restrictions
    if (req.user.isSuperAdmin && canSuperAdminBypass('adminRoleRestrictions')) {
      return next();
    }

    // Check specific role match
    if (!req.user.hasAdminRole(...allowedAdminRoles)) {
      return res.status(403).json({
        error: "Insufficient admin privileges",
        code: "INSUFFICIENT_PRIVILEGES",
        required: allowedAdminRoles,
        current: req.user.adminRole,
      });
    }

    next();
  };
};

/**
 * Require super admin only (strictest check)
 */
export const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: "Authentication required",
      code: "AUTH_REQUIRED",
    });
  }

  if (!req.user.isSuperAdmin) {
    return res.status(403).json({
      error: "Super admin access required",
      code: "SUPER_ADMIN_REQUIRED",
      current: req.user.adminRole,
    });
  }

  next();
};

// ==========================================
// PERMISSION-BASED AUTHORIZATION
// ==========================================

/**
 * Require specific permission
 * Checks against PERMISSIONS config
 * 
 * @param {string} permission - Permission key from PERMISSIONS
 */
export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required",
        code: "AUTH_REQUIRED",
      });
    }

    if (!req.user.hasPermission(permission)) {
      return res.status(403).json({
        error: "Permission denied",
        code: "PERMISSION_DENIED",
        permission: permission,
      });
    }

    next();
  };
};

/**
 * Require strict operation permission
 * For operations that need exact role match
 * 
 * @param {string} operation - Operation key from STRICT_ROLE_OPERATIONS
 */
export const requireStrictOperation = (operation) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required",
        code: "AUTH_REQUIRED",
      });
    }

    if (!req.user.canPerformStrictOperation(operation)) {
      return res.status(403).json({
        error: "Operation not permitted",
        code: "OPERATION_DENIED",
        operation: operation,
      });
    }

    next();
  };
};

// ==========================================
// VERIFICATION MIDDLEWARE
// ==========================================

/**
 * Require email verification (SUPER_ADMIN can bypass in god mode)
 */
export const requireEmailVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: "Authentication required",
      code: "AUTH_REQUIRED",
    });
  }

  // Super admin bypasses in god mode
  if (req.user.isSuperAdmin && canSuperAdminBypass('emailVerification')) {
    return next();
  }

  if (!req.user.emailVerified) {
    return res.status(403).json({
      error: "Please verify your email to continue",
      code: "EMAIL_NOT_VERIFIED",
    });
  }

  next();
};

/**
 * Require phone verification (SUPER_ADMIN can bypass in god mode)
 */
export const requirePhoneVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: "Authentication required",
      code: "AUTH_REQUIRED",
    });
  }

  // Super admin bypasses in god mode
  if (req.user.isSuperAdmin && canSuperAdminBypass('phoneVerification')) {
    return next();
  }

  if (!req.user.phoneVerified) {
    return res.status(403).json({
      error: "Please verify your phone number to continue",
      code: "PHONE_NOT_VERIFIED",
    });
  }

  next();
};

// ==========================================
// IDOR PROTECTION (Ownership Verification)
// ==========================================

/**
 * Verify user owns the resource (SUPER_ADMIN bypasses)
 * @param {string} resourceType - Type of resource to verify
 */
export const verifyOwnership = (resourceType) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthenticationError("Authentication required");
      }

      const resourceId = parseInt(
        req.params.id ||
          req.params.bookingId ||
          req.params.paymentId ||
          req.params.listingId ||
          req.params.reviewId ||
          req.params.storyId
      );

      if (isNaN(resourceId)) {
        throw new NotFoundError(resourceType);
      }

      // Super admin bypasses ownership checks
      if (req.user.isSuperAdmin && canSuperAdminBypass('ownership')) {
        // Still fetch the resource for the controller
        let resource;
        const model = resourceType.toLowerCase();
        
        try {
          switch (model) {
            case "booking":
              resource = await prisma.booking.findUnique({ where: { id: resourceId } });
              break;
            case "payment":
              resource = await prisma.payment.findUnique({ where: { id: resourceId } });
              break;
            case "listing":
              resource = await prisma.listing.findUnique({ where: { id: resourceId } });
              break;
            case "review":
              resource = await prisma.review.findUnique({ where: { id: resourceId } });
              break;
            case "story":
            case "listingstory":
              resource = await prisma.listingStory.findUnique({ 
                where: { id: resourceId },
                include: {
                  listing: {
                    select: {
                      id: true,
                      hostId: true,
                      title: true,
                    },
                  },
                },
              });
              break;
            case "notification":
              resource = await prisma.notification.findUnique({ where: { id: resourceId } });
              break;
            case "ticket":
            case "supportticket":
              resource = await prisma.supportTicket.findUnique({ where: { id: resourceId } });
              break;
            case "user":
              resource = await prisma.user.findUnique({ where: { id: resourceId } });
              break;
          }
          
          if (resource) {
            req.resource = resource;
            
            // Audit super admin access to other users' resources
            if (req.user.userId !== resource.userId && req.user.userId !== resource.hostId) {
              await auditService.log({
                action: 'SUPER_ADMIN_RESOURCE_ACCESS',
                category: 'ADMIN',
                userId: req.user.userId,
                ipAddress: req.ip,
                metadata: {
                  resourceType: resourceType,
                  resourceId: resourceId,
                  resourceOwnerId: resource.userId || resource.hostId,
                },
              });
            }
          }
        } catch (e) {
          // Resource not found, will be handled in controller
        }
        
        return next();
      }

      const userId = req.user.userId;
      let resource;

      switch (resourceType.toLowerCase()) {
        case "booking":
          // User must be guest OR host of the listing
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

        case "story":
        case "listingstory":
          // Host owns the listing that has this story
          resource = await prisma.listingStory.findFirst({
            where: {
              id: resourceId,
              listing: { hostId: userId },
            },
            include: {
              listing: {
                select: {
                  id: true,
                  hostId: true,
                  title: true,
                },
              },
            },
          });
          break;

        case "notification":
          resource = await prisma.notification.findFirst({
            where: {
              id: resourceId,
              userId: userId,
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

        case "user":
          // User can only access their own profile (unless admin)
          if (resourceId !== userId && !req.user.isAdmin) {
            resource = null;
          } else {
            resource = await prisma.user.findUnique({
              where: { id: resourceId },
            });
          }
          break;

        default:
          devWarn(`Unknown resource type: ${resourceType}`);
          throw new NotFoundError(resourceType);
      }

      if (!resource) {
        // Return generic 404 - don't reveal if resource exists
        throw new NotFoundError(resourceType);
      }

      // Attach resource to request for use in controller
      req.resource = resource;
      next();
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof AuthenticationError) {
        return res.status(error.statusCode).json({
          error: error.message,
          code: error.code,
        });
      }
      next(error);
    }
  };
};

// ==========================================
// 2FA MIDDLEWARE
// ==========================================

/**
 * Require 2FA verification (SUPER_ADMIN can bypass in god mode)
 */
export const require2FA = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: "Authentication required",
      code: "AUTH_REQUIRED",
    });
  }

  // Check if user has 2FA enabled
  if (!req.user.twoFactorEnabled) {
    return next();
  }

  // Super admin bypasses in god mode
  if (req.user.isSuperAdmin && canSuperAdminBypass('twoFactor')) {
    return next();
  }

  // Check for 2FA session token
  const twoFactorToken = req.headers["x-2fa-token"];
  if (!twoFactorToken) {
    return res.status(403).json({
      error: "2FA verification required",
      code: "2FA_REQUIRED",
    });
  }

  // Verify 2FA session
  try {
    const session = await prisma.rateLimitRecord.findFirst({
      where: {
        key: `2fa:${req.user.userId}:${twoFactorToken}`,
        expiresAt: { gt: new Date() },
      },
    });

    if (!session) {
      return res.status(403).json({
        error: "Invalid or expired 2FA session",
        code: "2FA_INVALID",
      });
    }

    next();
  } catch (error) {
    return res.status(403).json({
      error: "2FA verification failed",
      code: "2FA_ERROR",
    });
  }
};

/**
 * Create 2FA session after verification
 */
export async function create2FASession(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  try {
    await prisma.rateLimitRecord.create({
      data: {
        key: `2fa:${userId}:${token}`,
        count: 1,
        expiresAt,
      },
    });
  } catch (e) {
    // Ignore
  }

  return token;
}

// ==========================================
// EXPORT ALL
// ==========================================

export default {
  // Authentication
  authenticate,
  optionalAuth,
  
  // Authorization (hierarchy-based)
  authorize,
  
  // Admin authorization - hierarchy
  requireAdmin,
  requireAdminLevel,
  
  // Admin authorization - strict
  requireAdminRole,
  requireSuperAdmin,
  
  // Permission-based
  requirePermission,
  requireStrictOperation,
  
  // Verification
  requireEmailVerification,
  requirePhoneVerification,
  
  // IDOR protection
  verifyOwnership,
  
  // 2FA
  require2FA,
  create2FASession,
  
  // Token management
  generateAccessToken,
  generateRefreshToken,
  blacklistToken,
};