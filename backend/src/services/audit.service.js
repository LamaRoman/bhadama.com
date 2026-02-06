// ==========================================
// FILE: services/audit.service.js
// Security Audit Logging Service
// Uses existing SecurityAuditLog model
// ==========================================

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ==========================================
// AUDIT EVENT TYPES (actions)
// ==========================================

export const AuditEvents = {
  // Authentication Events
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGIN_FAILED: "LOGIN_FAILED",
  LOGIN_BLOCKED: "LOGIN_BLOCKED",
  LOGOUT: "LOGOUT",
  
  // Registration Events
  REGISTER_SUCCESS: "REGISTER_SUCCESS",
  REGISTER_FAILED: "REGISTER_FAILED",
  
  // Password Events
  PASSWORD_CHANGE: "PASSWORD_CHANGE",
  PASSWORD_RESET_REQUEST: "PASSWORD_RESET_REQUEST",
  PASSWORD_RESET_SUCCESS: "PASSWORD_RESET_SUCCESS",
  PASSWORD_RESET_FAILED: "PASSWORD_RESET_FAILED",
  
  // Session Events
  SESSION_CREATED: "SESSION_CREATED",
  SESSION_REVOKED: "SESSION_REVOKED",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  TOKEN_REFRESH: "TOKEN_REFRESH",
  TOKEN_REFRESH_FAILED: "TOKEN_REFRESH_FAILED",
  
  // Account Events
  ACCOUNT_LOCKED: "ACCOUNT_LOCKED",
  ACCOUNT_UNLOCKED: "ACCOUNT_UNLOCKED",
  ACCOUNT_SUSPENDED: "ACCOUNT_SUSPENDED",
  ACCOUNT_REACTIVATED: "ACCOUNT_REACTIVATED",
  ACCOUNT_DELETED: "ACCOUNT_DELETED",
  
  // Profile Events
  PROFILE_UPDATED: "PROFILE_UPDATED",
  EMAIL_CHANGED: "EMAIL_CHANGED",
  EMAIL_VERIFIED: "EMAIL_VERIFIED",
  
  // Security Events
  SUSPICIOUS_ACTIVITY: "SUSPICIOUS_ACTIVITY",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  INVALID_TOKEN: "INVALID_TOKEN",
  UNAUTHORIZED_ACCESS: "UNAUTHORIZED_ACCESS",
  
  // Admin Events
  ADMIN_ACTION: "ADMIN_ACTION",
  ROLE_CHANGED: "ROLE_CHANGED",
  USER_IMPERSONATION: "USER_IMPERSONATION",
  
  // Data Events
  DATA_EXPORT: "DATA_EXPORT",
  DATA_DELETION: "DATA_DELETION",
};

// ==========================================
// AUDIT CATEGORIES
// ==========================================

export const AuditCategories = {
  AUTH: "AUTH",
  PAYMENT: "PAYMENT",
  BOOKING: "BOOKING",
  ADMIN: "ADMIN",
  SECURITY: "SECURITY",
  ACCOUNT: "ACCOUNT",
};

// ==========================================
// AUDIT SERVICE
// ==========================================

class AuditService {
  /**
   * Log an audit event to SecurityAuditLog
   * @param {Object} params
   * @param {string} params.action - Event type from AuditEvents
   * @param {string} [params.category] - Category from AuditCategories
   * @param {number} [params.userId] - User ID (if available)
   * @param {string} [params.email] - Email (stored in metadata)
   * @param {string} [params.ipAddress] - IP address
   * @param {string} [params.userAgent] - Browser/client user agent
   * @param {string} [params.path] - Request path
   * @param {string} [params.method] - HTTP method
   * @param {number} [params.statusCode] - Response status code
   * @param {Object} [params.metadata] - Additional event data
   * @param {number} [params.duration] - Request duration in ms
   */
async log(actionOrOptions, optionsArg = {}) {
  // Handle both call signatures:
  // 1. auditService.log("ACTION", { userId, ip, ... })
  // 2. auditService.log({ action, userId, ip, ... })
  
  let action, category, userId, email, ipAddress, userAgent, path, method, statusCode, metadata, duration, status, message, severity;
  
  if (typeof actionOrOptions === "string") {
    // Format: log("ACTION", { ...options })
    action = actionOrOptions;
    
    // Extract all possible parameters
    const {
      category: cat = AuditCategories.AUTH,
      userId: uid = null,
      email: em = null,
      ip = null,
      ipAddress: ipAddr = null,
      userAgent: ua = null,
      path: p = null,
      method: m = null,
      statusCode: sc = null,
      metadata: meta = {},
      duration: dur = null,
      status: st = null,
      message: msg = null,
      severity: sev = null,
    } = optionsArg;
    
    // Assign to main variables
    category = cat;
    userId = uid;
    email = em;
    ipAddress = ipAddr || ip;  // Use ipAddress first, fallback to ip
    userAgent = ua;
    path = p;
    method = m;
    statusCode = sc;
    metadata = meta;
    duration = dur;
    status = st;
    message = msg;
    severity = sev;
    
  } else {
    // Format: log({ action, ...options })
    ({
      action,
      category = AuditCategories.AUTH,
      userId = null,
      email = null,
      ipAddress = null,
      userAgent = null,
      path = null,
      method = null,
      statusCode = null,
      metadata = {},
      duration = null,
      status = null,
      message = null,
      severity = null,
    } = actionOrOptions || {});
  }

  // Validate required action parameter
  if (!action || typeof action !== "string") {
    console.error("❌ Audit logging error: 'action' parameter is required and must be a string");
    this.logToConsole({ 
      action: action || "UNKNOWN", 
      category, 
      userId, 
      email, 
      ipAddress, 
      status: "ERROR", 
      message: "Invalid audit log call - missing action", 
      metadata 
    });
    return;
  }

  try {
    const fullMetadata = {
      ...metadata,
      ...(email && { email }),
      ...(status && { status }),
      ...(message && { message }),
      ...(severity && { severity }),
    };

    await prisma.securityAuditLog.create({
      data: {
        action,
        category,
        userId: userId ? parseInt(userId) : null,
        ipAddress,
        userAgent,
        path,
        method,
        statusCode,
        metadata: Object.keys(fullMetadata).length > 0 ? fullMetadata : undefined,
        duration,
      },
    });
  } catch (error) {
    console.error("Audit logging error:", error.message);
    this.logToConsole({ action, category, userId, email, ipAddress, status, message, metadata });
  }
}

  /**
   * Console logging fallback
   */
  logToConsole({ action, category, userId, email, ipAddress, status, message, metadata }) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action,
      category,
      userId,
      email,
      ipAddress,
      status,
      message,
      metadata,
    };

    if (status === "FAILURE" || status === "WARNING" || status === "ERROR") {
      console.warn("🔒 AUDIT:", JSON.stringify(logEntry));
    } else {
      console.log("🔒 AUDIT:", JSON.stringify(logEntry));
    }
  }

  // ==========================================
  // CONVENIENCE METHODS
  // ==========================================

  /**
   * Log successful login
   */
  async logLogin(userId, email, ipAddress, userAgent) {
    await this.log({
      action: AuditEvents.LOGIN_SUCCESS,
      category: AuditCategories.AUTH,
      userId,
      email,
      ipAddress,
      userAgent,
      statusCode: 200,
      status: "SUCCESS",
      message: "User logged in successfully",
    });
  }

  /**
   * Log failed login attempt
   */
  async logLoginFailed(email, ipAddress, userAgent, reason = "Invalid credentials") {
    await this.log({
      action: AuditEvents.LOGIN_FAILED,
      category: AuditCategories.AUTH,
      email,
      ipAddress,
      userAgent,
      statusCode: 401,
      status: "FAILURE",
      message: reason,
      metadata: { reason },
    });

    // Also log to FailedLoginAttempt table for rate limiting
    try {
      await prisma.failedLoginAttempt.create({
        data: {
          email: email?.toLowerCase(),
          ipAddress: ipAddress || "unknown",
          userAgent,
          reason,
        },
      });
    } catch (error) {
      console.error("Failed to log to FailedLoginAttempt:", error.message);
    }
  }

  /**
   * Log blocked login (account locked)
   */
  async logLoginBlocked(email, ipAddress, userAgent, reason = "Account locked") {
    await this.log({
      action: AuditEvents.LOGIN_BLOCKED,
      category: AuditCategories.SECURITY,
      email,
      ipAddress,
      userAgent,
      statusCode: 403,
      status: "FAILURE",
      message: reason,
      metadata: { reason },
    });
  }

  /**
   * Log logout
   */
  async logLogout(userId, ipAddress) {
    await this.log({
      action: AuditEvents.LOGOUT,
      category: AuditCategories.AUTH,
      userId,
      ipAddress,
      statusCode: 200,
      status: "SUCCESS",
      message: "User logged out",
    });
  }

  /**
   * Log password change
   */
  async logPasswordChange(userId, ipAddress, success = true) {
    await this.log({
      action: AuditEvents.PASSWORD_CHANGE,
      category: AuditCategories.ACCOUNT,
      userId,
      ipAddress,
      statusCode: success ? 200 : 400,
      status: success ? "SUCCESS" : "FAILURE",
      message: success ? "Password changed successfully" : "Password change failed",
    });
  }

  /**
   * Log password reset request
   */
  async logPasswordResetRequest(email, ipAddress) {
    await this.log({
      action: AuditEvents.PASSWORD_RESET_REQUEST,
      category: AuditCategories.AUTH,
      email,
      ipAddress,
      statusCode: 200,
      status: "SUCCESS",
      message: "Password reset requested",
    });
  }

  /**
   * Log password reset completion
   */
  async logPasswordReset(userId, email, ipAddress, success = true) {
    await this.log({
      action: success ? AuditEvents.PASSWORD_RESET_SUCCESS : AuditEvents.PASSWORD_RESET_FAILED,
      category: AuditCategories.AUTH,
      userId,
      email,
      ipAddress,
      statusCode: success ? 200 : 400,
      status: success ? "SUCCESS" : "FAILURE",
      message: success ? "Password reset successful" : "Password reset failed",
    });
  }

  /**
   * Log account lockout
   */
  async logAccountLocked(userId, email, ipAddress, reason = "Too many failed attempts") {
    await this.log({
      action: AuditEvents.ACCOUNT_LOCKED,
      category: AuditCategories.SECURITY,
      userId,
      email,
      ipAddress,
      status: "WARNING",
      message: `Account locked: ${reason}`,
      metadata: { reason },
    });
  }

  /**
   * Log registration
   */
  async logRegistration(userId, email, ipAddress, userAgent) {
    await this.log({
      action: AuditEvents.REGISTER_SUCCESS,
      category: AuditCategories.AUTH,
      userId,
      email,
      ipAddress,
      userAgent,
      statusCode: 201,
      status: "SUCCESS",
      message: "New user registered",
    });
  }

  /**
   * Log suspicious activity
   */
  async logSuspiciousActivity(userId, email, ipAddress, details) {
    await this.log({
      action: AuditEvents.SUSPICIOUS_ACTIVITY,
      category: AuditCategories.SECURITY,
      userId,
      email,
      ipAddress,
      status: "WARNING",
      message: `Suspicious activity detected: ${details}`,
      metadata: { details },
    });
  }

  /**
   * Log rate limit exceeded
   */
  async logRateLimitExceeded(ipAddress, endpoint, email = null) {
    await this.log({
      action: AuditEvents.RATE_LIMIT_EXCEEDED,
      category: AuditCategories.SECURITY,
      email,
      ipAddress,
      path: endpoint,
      statusCode: 429,
      status: "WARNING",
      message: `Rate limit exceeded for ${endpoint}`,
      metadata: { endpoint },
    });
  }

  /**
   * Log admin action
   */
  async logAdminAction(adminId, action, targetUserId, ipAddress, details = {}) {
    await this.log({
      action: AuditEvents.ADMIN_ACTION,
      category: AuditCategories.ADMIN,
      userId: adminId,
      ipAddress,
      status: "SUCCESS",
      message: `Admin action: ${action}`,
      metadata: { action, targetUserId, ...details },
    });
  }

  /**
   * Log role change
   */
  async logRoleChange(adminId, targetUserId, oldRole, newRole, ipAddress) {
    await this.log({
      action: AuditEvents.ROLE_CHANGED,
      category: AuditCategories.ADMIN,
      userId: adminId,
      ipAddress,
      status: "SUCCESS",
      message: `Role changed from ${oldRole} to ${newRole}`,
      metadata: { targetUserId, oldRole, newRole },
    });
  }

  // ==========================================
  // QUERY METHODS
  // ==========================================

  /**
   * Get security logs for a user
   */
  async getLogsForUser(userId, limit = 50) {
    try {
      return await prisma.securityAuditLog.findMany({
        where: { userId: parseInt(userId) },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
    } catch (error) {
      console.error("Failed to fetch security logs:", error.message);
      return [];
    }
  }

  /**
   * Get recent security events (failures and warnings)
   */
  async getSecurityEvents(limit = 100) {
    try {
      return await prisma.securityAuditLog.findMany({
        where: {
          action: {
            in: [
              AuditEvents.LOGIN_FAILED,
              AuditEvents.LOGIN_BLOCKED,
              AuditEvents.ACCOUNT_LOCKED,
              AuditEvents.SUSPICIOUS_ACTIVITY,
              AuditEvents.RATE_LIMIT_EXCEEDED,
              AuditEvents.UNAUTHORIZED_ACCESS,
            ],
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
    } catch (error) {
      console.error("Failed to fetch security events:", error.message);
      return [];
    }
  }

  /**
   * Get failed login attempts for an email (from FailedLoginAttempt table)
   */
  async getFailedLoginAttempts(email, since = null) {
    try {
      const where = {
        email: email?.toLowerCase(),
      };

      if (since) {
        where.createdAt = { gte: since };
      }

      return await prisma.failedLoginAttempt.count({ where });
    } catch (error) {
      console.error("Failed to count login attempts:", error.message);
      return 0;
    }
  }

  /**
   * Get failed login attempts by IP
   */
  async getFailedLoginAttemptsByIP(ipAddress, since = null) {
    try {
      const where = {
        ipAddress,
      };

      if (since) {
        where.createdAt = { gte: since };
      }

      return await prisma.failedLoginAttempt.count({ where });
    } catch (error) {
      console.error("Failed to count login attempts by IP:", error.message);
      return 0;
    }
  }

  /**
   * Clean up old failed login attempts (call periodically)
   */
  async cleanupOldAttempts(olderThanHours = 24) {
    try {
      const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
      
      const deleted = await prisma.failedLoginAttempt.deleteMany({
        where: {
          createdAt: { lt: cutoff },
        },
      });

      console.log(`🧹 Cleaned up ${deleted.count} old failed login attempts`);
      return deleted.count;
    } catch (error) {
      console.error("Failed to cleanup old attempts:", error.message);
      return 0;
    }
  }
}

// Export singleton instance
export const auditService = new AuditService();

// Default export
export default auditService;