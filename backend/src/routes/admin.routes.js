import express from "express";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import * as adminController from "../controllers/admin.controller.js";

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
// Change user role (USER <-> HOST)
router.put(
  "/users/:userId/role",
  authorize({ minRole: "ADMIN" }),
  adminController.changeUserRole
);

// ============================================
// ADMIN USER MANAGEMENT
// ============================================
router.get(
  "/users/admins",
  authorize({ minRole: "ADMIN" }),
  adminController.getAdminUsers
);

router.post(
  "/users/admins",
  authorize({ minRole: "ADMIN" }),
  adminController.createAdminUser
);

router.post(
  "/users/:userId/make-admin",
  authorize({ minRole: "ADMIN" }),
  adminController.upgradeToAdmin
);

router.post(
  "/users/:userId/remove-admin",
  authorize({ minRole: "ADMIN" }),
  adminController.removeAdminRole
);

router.delete(
  "/users/:userId",
  authorize({ minRole: "ADMIN" }),
  adminController.deleteAdminUser
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
  "/reviews",
  authorize({ minRole: "ADMIN", adminRoles: ["MODERATOR"] }),
  adminController.getReviews
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

// routes/adminRoutes.js
router.get(
  "/security/logs",
  authenticate,
  authorize({minRole:"ADMIN"}),
  async (req, res) => {
    const { action, category, days = 7, page = 1, limit = 50 } = req.query;
    
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - parseInt(days));
    
    const logs = await prisma.securityAuditLog.findMany({
      where: {
        createdAt: { gte: cutoff },
        ...(action && { action }),
        ...(category && { category }),
      },
      orderBy: { createdAt: "desc" },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });
    
    res.json({ logs });
  }
);
export default router;