import express from "express";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import * as adminController from "../controllers/adminController.js";

const router = express.Router();

router.use(authenticate);

// ============================================
// DASHBOARD STATS
// GET /api/admin/stats?range=30days
// ============================================
router.get(
  "/stats",
  authorize({ minRole: "ADMIN" }),
  adminController.getStats
);

// ============================================
// LEGACY DASHBOARD (keep for backward compatibility)
// ============================================
router.get(
  "/dashboard",
  authorize({ minRole: "ADMIN" }),
  adminController.getDashboard
);

// ============================================
// BOOKINGS
// ============================================
router.get(
  "/bookings/recent",
  authorize({ minRole: "ADMIN" }),
  adminController.getRecentBookings
);

// ============================================
// USERS
// ============================================
router.get(
  "/users/recent",
  authorize({ minRole: "ADMIN" }),
  adminController.getRecentUsers
);

router.get(
  "/users/suspended",
  authorize({ minRole: "ADMIN" }),
  adminController.getSuspendedUsers
);

router.put(
  "/users/:id/restore",
  authorize({ minRole: "ADMIN" }),
  adminController.restoreUser
);

// ============================================
// LISTINGS
// ============================================
router.get(
  "/listings",
  authorize({ minRole: "ADMIN" }),
  adminController.getListings
);

router.put(
  "/listings/:id/status",
  authorize({ minRole: "ADMIN", adminRoles: ["MODERATOR"] }),
  adminController.updateListingStatus
);

// Legacy approve endpoint
router.post(
  "/listings/:id/approve",
  authorize({ minRole: "ADMIN", adminRoles: ["MODERATOR"] }),
  adminController.moderateListing
);

// ============================================
// REVIEWS
// ============================================
router.get(
  "/reviews/pending",
  authorize({ minRole: "ADMIN", adminRoles: ["MODERATOR"] }),
  adminController.getPendingReviews
);

router.put(
  "/reviews/:id/status",
  authorize({ minRole: "ADMIN", adminRoles: ["MODERATOR"] }),
  adminController.updateReviewStatus
);

// Legacy reported reviews endpoint
router.get(
  "/reviews/reported",
  authorize({ minRole: "ADMIN", adminRoles: ["MODERATOR"] }),
  adminController.getReportedReviews
);

// ============================================
// AUDIT LOGS
// ============================================
router.get(
  "/audit-logs",
  authorize({ minRole: "ADMIN" }),
  adminController.getAuditLogs
);

// ============================================
// FEATURE FLAGS
// ============================================
router.get(
  "/feature-flags",
  authorize({ minRole: "ADMIN" }),
  adminController.getFeatureFlags
);

router.put(
  "/feature-flags/:id",
  authorize({ minRole: "ADMIN" }),
  adminController.updateFeatureFlag
);

// ============================================
// PLATFORM HEALTH
// ============================================
router.get(
  "/health",
  authorize({ minRole: "ADMIN" }),
  adminController.getPlatformHealth
);

// ============================================
// DATA EXPORT
// ============================================
router.get(
  "/export/:type",
  authorize({ minRole: "ADMIN" }),
  adminController.exportData
);

// ============================================
// REFUNDS (existing)
// ============================================
router.post(
  "/refunds/:bookingId",
  authorize({ minRole: "ADMIN", adminRoles: ["FINANCE"] }),
  adminController.issueRefund
);

export default router;