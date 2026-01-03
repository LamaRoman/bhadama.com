// ==========================================
// ADMIN HIERARCHY MIDDLEWARE
// ==========================================
// Checks admin level permissions
// ==========================================

import { ADMIN_HIERARCHY } from "../config/roles.js";

/**
 * Check if admin has required hierarchy level
 * @param {string} requiredLevel - Minimum required admin level
 * @returns {function} Express middleware
 */
export const checkAdminHierarchy = (requiredLevel) => {
  return (req, res, next) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (user.role !== "ADMIN") {
      return res.status(403).json({ error: "Admin access required" });
    }

    // Get user's admin level
    const userLevel = ADMIN_HIERARCHY[user.adminType] || 0;
    const requiredLevelValue = ADMIN_HIERARCHY[requiredLevel] || 0;

    if (userLevel < requiredLevelValue) {
      return res.status(403).json({
        error: `Insufficient permissions. Requires ${requiredLevel} access.`,
        yourLevel: user.adminType || "NONE",
        requiredLevel,
      });
    }

    next();
  };
};

/**
 * Check if user is SUPER_ADMIN
 */
export const isSuperAdmin = (req, res, next) => {
  return checkAdminHierarchy("SUPER_ADMIN")(req, res, next);
};

/**
 * Check if user is at least FINANCE level
 */
export const isFinanceOrAbove = (req, res, next) => {
  return checkAdminHierarchy("FINANCE")(req, res, next);
};

/**
 * Check if user is at least MODERATOR level
 */
export const isModeratorOrAbove = (req, res, next) => {
  return checkAdminHierarchy("MODERATOR")(req, res, next);
};

export default {
  checkAdminHierarchy,
  isSuperAdmin,
  isFinanceOrAbove,
  isModeratorOrAbove,
};