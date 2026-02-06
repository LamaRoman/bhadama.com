// ==========================================
// ROLE HIERARCHY & PERMISSIONS
// ==========================================
// File: config/roles.config.js
//
// Centralized role and permission management
// ==========================================

export const ROLE_HIERARCHY = {
  USER: 1,
  HOST: 2,
  ADMIN: 3,
};

export const ADMIN_HIERARCHY = {
  SUPPORT: 1,
  MODERATOR: 2,
  FINANCE: 3,
  ANALYST: 4,
  SUPER_ADMIN: 5,
};

// ==========================================
// ROLE UTILITIES
// ==========================================

/**
 * Get hierarchy level for a primary role
 */
export function getRoleLevel(role) {
  return ROLE_HIERARCHY[role?.toUpperCase()] || 0;
}

/**
 * Get hierarchy level for an admin role
 */
export function getAdminLevel(adminRole) {
  return ADMIN_HIERARCHY[adminRole?.toUpperCase()] || 0;
}

/**
 * Check if user has minimum role level
 */
export function hasRoleLevel(user, requiredLevel) {
  const userLevel = getRoleLevel(user.role);
  return userLevel >= requiredLevel;
}

/**
 * Check if user has minimum admin level
 */
export function hasAdminLevel(user, requiredLevel) {
  const userLevel = getAdminLevel(user.adminRole);
  return userLevel >= requiredLevel;
}

/**
 * Check if user is super admin
 */
export function isSuperAdmin(user) {
  return user?.adminRole?.toUpperCase() === 'SUPER_ADMIN';
}

/**
 * Check if user is any type of admin
 */
export function isAdmin(user) {
  return user?.role?.toUpperCase() === 'ADMIN';
}

/**
 * Check if user has specific admin role(s)
 */
export function hasAdminRole(user, ...roles) {
  if (!user?.adminRole) return false;
  if (isSuperAdmin(user)) return true; // Super admin has all roles
  
  const userAdminRole = user.adminRole.toUpperCase();
  const normalizedRoles = roles.map(r => r.toUpperCase());
  
  return normalizedRoles.includes(userAdminRole);
}

/**
 * Get all roles a user effectively has (including inherited via hierarchy)
 */
export function getEffectiveAdminRoles(user) {
  if (!user?.adminRole) return [];
  
  const userLevel = getAdminLevel(user.adminRole);
  const effectiveRoles = [];
  
  for (const [role, level] of Object.entries(ADMIN_HIERARCHY)) {
    if (userLevel >= level) {
      effectiveRoles.push(role);
    }
  }
  
  return effectiveRoles;
}

// ==========================================
// PERMISSION DEFINITIONS
// ==========================================

/**
 * Permission-to-role mapping
 * Maps specific permissions to minimum required admin levels
 */
export const PERMISSIONS = {
  // User Management
  'users.view': ADMIN_HIERARCHY.SUPPORT,
  'users.edit': ADMIN_HIERARCHY.MODERATOR,
  'users.delete': ADMIN_HIERARCHY.SUPER_ADMIN,
  'users.suspend': ADMIN_HIERARCHY.MODERATOR,
  'users.verify': ADMIN_HIERARCHY.SUPPORT,
  
  // Content Moderation
  'content.view': ADMIN_HIERARCHY.SUPPORT,
  'content.moderate': ADMIN_HIERARCHY.MODERATOR,
  'content.delete': ADMIN_HIERARCHY.MODERATOR,
  
  // Story Moderation
  'stories.view': ADMIN_HIERARCHY.MODERATOR,
  'stories.moderate': ADMIN_HIERARCHY.MODERATOR,
  'stories.delete': ADMIN_HIERARCHY.SUPER_ADMIN,
  'stories.settings': ADMIN_HIERARCHY.SUPER_ADMIN,
  
  // Financial Operations
  'payments.view': ADMIN_HIERARCHY.SUPPORT,
  'payments.process': ADMIN_HIERARCHY.FINANCE,
  'refunds.view': ADMIN_HIERARCHY.FINANCE,
  'refunds.process': ADMIN_HIERARCHY.FINANCE,
  'payouts.manage': ADMIN_HIERARCHY.FINANCE,
  
  // Analytics
  'analytics.view': ADMIN_HIERARCHY.ANALYST,
  'analytics.export': ADMIN_HIERARCHY.ANALYST,
  'reports.generate': ADMIN_HIERARCHY.ANALYST,
  
  // System Administration
  'system.config': ADMIN_HIERARCHY.SUPER_ADMIN,
  'system.logs': ADMIN_HIERARCHY.ANALYST,
  'roles.manage': ADMIN_HIERARCHY.SUPER_ADMIN,
  'admins.manage': ADMIN_HIERARCHY.SUPER_ADMIN,
};

/**
 * Check if user has a specific permission
 */
export function hasPermission(user, permission) {
  if (isSuperAdmin(user)) return true; // Super admin has all permissions
  
  const requiredLevel = PERMISSIONS[permission];
  if (requiredLevel === undefined) {
    console.warn(`Unknown permission: ${permission}`);
    return false;
  }
  
  return hasAdminLevel(user, requiredLevel);
}

// ==========================================
// SPECIALIZED ROLE RESTRICTIONS
// ==========================================

/**
 * Operations that require EXACT role match (not hierarchy)
 * SUPER_ADMIN can still override
 */
export const STRICT_ROLE_OPERATIONS = {
  // Only FINANCE can process financial operations
  'refund.process': ['FINANCE'],
  'payout.approve': ['FINANCE'],
  'payment.void': ['FINANCE'],
  
  // Only specific roles can access certain data
  'financial.reports': ['FINANCE', 'ANALYST'],
  'user.pii': ['SUPPORT', 'ANALYST'], // Personal Identifiable Information
};

/**
 * Check if user can perform strict role operation
 */
export function canPerformStrictOperation(user, operation) {
  if (isSuperAdmin(user)) return true;
  
  const allowedRoles = STRICT_ROLE_OPERATIONS[operation];
  if (!allowedRoles) return false;
  
  return hasAdminRole(user, ...allowedRoles);
}

// ==========================================
// SUPER ADMIN BYPASS CONFIGURATION
// ==========================================

/**
 * Check if god mode is enabled (for development)
 */
export function isGodModeEnabled() {
  return process.env.SUPER_ADMIN_GOD_MODE === 'true';
}

/**
 * Features that SUPER_ADMIN can bypass
 */
export const SUPER_ADMIN_BYPASSES = {
  // Always bypass in all environments
  authorization: true,           // All role checks
  ownership: true,               // IDOR protection
  adminRoleRestrictions: true,   // Specific admin role requirements
  
  // Bypass in god mode only (development)
  emailVerification: isGodModeEnabled(),
  phoneVerification: isGodModeEnabled(),
  twoFactor: isGodModeEnabled(),
  suspension: isGodModeEnabled(),
  accountLock: isGodModeEnabled(),
  rateLimit: isGodModeEnabled(),
};

/**
 * Check if super admin can bypass a specific check
 */
export function canSuperAdminBypass(checkType) {
  if (!SUPER_ADMIN_BYPASSES.hasOwnProperty(checkType)) {
    console.warn(`Unknown bypass check: ${checkType}`);
    return false;
  }
  
  return SUPER_ADMIN_BYPASSES[checkType];
}

// ==========================================
// AUDIT REQUIREMENTS
// ==========================================

/**
 * Actions that require audit logging
 */
export const AUDIT_REQUIRED_ACTIONS = [
  'users.delete',
  'users.suspend',
  'refunds.process',
  'payouts.approve',
  'roles.manage',
  'system.config',
  
  // Story actions
  'stories.delete',
  'stories.approve',
  'stories.reject',
  'stories.settings',
];

/**
 * Check if action requires audit logging
 */
export function requiresAudit(action) {
  return AUDIT_REQUIRED_ACTIONS.includes(action);
}

// ==========================================
// ROLE DISPLAY NAMES
// ==========================================

export const ROLE_NAMES = {
  USER: 'User',
  HOST: 'Property Host',
  ADMIN: 'Administrator',
};

export const ADMIN_ROLE_NAMES = {
  SUPPORT: 'Support Agent',
  MODERATOR: 'Content Moderator',
  FINANCE: 'Finance Manager',
  ANALYST: 'Data Analyst',
  SUPER_ADMIN: 'Super Administrator',
};

/**
 * Get display name for role
 */
export function getRoleName(role, adminRole = null) {
  const roleName = ROLE_NAMES[role] || role;
  if (adminRole && ADMIN_ROLE_NAMES[adminRole]) {
    return `${roleName} (${ADMIN_ROLE_NAMES[adminRole]})`;
  }
  return roleName;
}

// ==========================================
// EXPORTS
// ==========================================

export default {
  ROLE_HIERARCHY,
  ADMIN_HIERARCHY,
  PERMISSIONS,
  STRICT_ROLE_OPERATIONS,
  SUPER_ADMIN_BYPASSES,
  AUDIT_REQUIRED_ACTIONS,
  ROLE_NAMES,
  ADMIN_ROLE_NAMES,
  
  // Utility functions
  getRoleLevel,
  getAdminLevel,
  hasRoleLevel,
  hasAdminLevel,
  isSuperAdmin,
  isAdmin,
  hasAdminRole,
  getEffectiveAdminRoles,
  hasPermission,
  canPerformStrictOperation,
  canSuperAdminBypass,
  requiresAudit,
  getRoleName,
  isGodModeEnabled,
};