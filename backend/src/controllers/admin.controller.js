import * as adminService from "../services/admin.service.js";

/* ===== DASHBOARD STATS (for AdminDashboard.jsx) ===== */

export const getStats = async (req, res) => {
  try {
    const { range = "30days" } = req.query;
    const data = await adminService.getStats(range);
    res.json(data);
  } catch (err) {
    console.error("Error in getStats:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ===== LEGACY DASHBOARD ===== */

export const getDashboard = async (req, res) => {
  try {
    const data = await adminService.getDashboardStats();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ===== RECENT BOOKINGS ===== */

export const getRecentBookings = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const bookings = await adminService.getRecentBookings(parseInt(limit));
    res.json(bookings);
  } catch (err) {
    console.error("Error in getRecentBookings:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ===== RECENT USERS ===== */

export const getRecentUsers = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const users = await adminService.getRecentUsers(parseInt(limit));
    res.json(users);
  } catch (err) {
    console.error("Error in getRecentUsers:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ===== SUSPENDED USERS ===== */

export const getSuspendedUsers = async (req, res) => {
  try {
    const users = await adminService.getSuspendedUsers();
    res.json(users);
  } catch (err) {
    console.error("Error in getSuspendedUsers:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ===== RESTORE USER ===== */

export const restoreUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await adminService.restoreUser(id, req.user.userId);
    res.json({ success: true, user });
  } catch (err) {
    console.error("Error in restoreUser:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ===== LISTINGS ===== */

export const getListings = async (req, res) => {
  try {
    const { limit = 10, status, page = 1 } = req.query;
    const data = await adminService.getListings({
      limit: parseInt(limit),
      status,
      page: parseInt(page)
    });
    res.json(data);
  } catch (err) {
    console.error("Error in getListings:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ===== UPDATE LISTING STATUS ===== */

export const updateListingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    const listing = await adminService.updateListingStatus({
      listingId: id,
      adminId: req.user.userId,
      status,
      reason
    });
    res.json({ success: true, listing });
  } catch (err) {
    console.error("Error in updateListingStatus:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ===== LISTING MODERATION (legacy) ===== */

export const moderateListing = async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;

  try {
    await adminService.moderateListing({
      adminId: req.user.userId,
      listingId: id,
      status,
      reason
    });
    res.json({ message: "Listing moderated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getReviews = async (req, res) => {
  try {
    const { status = "all", limit = 100 } = req.query;
    const reviews = await adminService.getReviews(status, parseInt(limit));
    res.json(reviews);
  } catch (err) {
    console.error("Error in getReviews:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ===== UPDATE REVIEW STATUS ===== */

export const updateReviewStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    const review = await adminService.updateReviewStatus({
      reviewId: id,
      adminId: req.user.userId,
      status,
      reason
    });
    res.json({ success: true, review });
  } catch (err) {
    console.error("Error in updateReviewStatus:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ===== REVIEW REPORTS (legacy) ===== */

export const getReportedReviews = async (req, res) => {
  try {
    const reports = await adminService.getReportedReviews();
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ===== AUDIT LOGS ===== */

export const getAuditLogs = async (req, res) => {
  try {
    const { limit = 50, page = 1, action, entityType } = req.query;
    const logs = await adminService.getAuditLogs({
      limit: parseInt(limit),
      page: parseInt(page),
      action,
      entityType
    });
    res.json(logs);
  } catch (err) {
    console.error("Error in getAuditLogs:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ===== FEATURE FLAGS ===== */

export const getFeatureFlags = async (req, res) => {
  try {
    const flags = await adminService.getFeatureFlags();
    res.json(flags);
  } catch (err) {
    console.error("Error in getFeatureFlags:", err);
    res.status(500).json({ message: err.message });
  }
};

export const updateFeatureFlag = async (req, res) => {
  try {
    const { id } = req.params;
    const { enabled } = req.body;
    const flag = await adminService.updateFeatureFlag({
      flagId: id,
      enabled,
      adminId: req.user.userId
    });
    res.json({ success: true, flag });
  } catch (err) {
    console.error("Error in updateFeatureFlag:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ===== PLATFORM HEALTH ===== */

export const getPlatformHealth = async (req, res) => {
  try {
    const health = await adminService.getPlatformHealth();
    res.json(health);
  } catch (err) {
    console.error("Error in getPlatformHealth:", err);
    res.status(500).json({ 
      status: "error",
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
};

/* ===== DATA EXPORT ===== */

export const exportData = async (req, res) => {
  try {
    const { type } = req.params;
    const { format = "json", range = "30days" } = req.query;
    
    const data = await adminService.exportData({
      type,
      range,
      adminId: req.user.userId
    });

    if (format === "csv") {
      const csv = adminService.convertToCSV(data);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${type}-export-${new Date().toISOString().split("T")[0]}.csv`
      );
      return res.send(csv);
    }

    res.json(data);
  } catch (err) {
    console.error("Error in exportData:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ===== REFUND (existing) ===== */

export const issueRefund = async (req, res) => {
  const { bookingId, amount, reason } = req.body;

  try {
    await adminService.issueRefund({
      bookingId,
      adminId: req.user.userId,
      amount,
      reason
    });
    res.json({ message: "Refund issued" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ===== ADMIN USER MANAGEMENT ===== */

/**
 * Get all admin users
 * GET /api/admin/users/admins
 */
export const getAdminUsers = async (req, res) => {
  try {
    const admins = await adminService.getAdminUsers();
    res.json({
      success: true,
      admins,
      count: admins.length
    });
  } catch (err) {
    console.error("Error in getAdminUsers:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Create a new admin user
 * POST /api/admin/users/admins
 */
export const createAdminUser = async (req, res) => {
  try {
    const { email, name, password, phone, sendInvite = true } = req.body;

    if (!email || !name) {
      return res.status(400).json({ message: "Email and name are required" });
    }

    const result = await adminService.createAdminUser({
      email,
      name,
      password,
      phone,
      sendInvite,
      createdBy: req.user.userId
    });

    res.status(201).json({
      success: true,
      message: "Admin user created successfully",
      admin: result.admin,
      ...(result.temporaryPassword && {
        temporaryPassword: result.temporaryPassword,
        note: "Share this password securely. User should change it on first login."
      })
    });
  } catch (err) {
    console.error("Error in createAdminUser:", err);
    
    if (err.message.includes("already exists") || err.message.includes("already an admin")) {
      return res.status(400).json({ message: err.message });
    }
    
    res.status(500).json({ message: err.message });
  }
};

/**
 * Upgrade existing user to admin
 * POST /api/admin/users/:userId/make-admin
 */
export const upgradeToAdmin = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await adminService.upgradeToAdmin({
      userId: parseInt(userId),
      upgradedBy: req.user.userId
    });

    res.json({
      success: true,
      message: "User upgraded to admin successfully",
      user
    });
  } catch (err) {
    console.error("Error in upgradeToAdmin:", err);
    
    if (err.message.includes("not found") || err.message.includes("already")) {
      return res.status(400).json({ message: err.message });
    }
    
    res.status(500).json({ message: err.message });
  }
};

/**
 * Remove admin role (demote to USER)
 * POST /api/admin/users/:userId/remove-admin
 */
export const removeAdminRole = async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent self-demotion
    if (parseInt(userId) === req.user.userId) {
      return res.status(400).json({ message: "You cannot remove your own admin role" });
    }

    const user = await adminService.removeAdminRole({
      userId: parseInt(userId),
      removedBy: req.user.userId
    });

    res.json({
      success: true,
      message: "Admin role removed successfully",
      user
    });
  } catch (err) {
    console.error("Error in removeAdminRole:", err);
    
    if (err.message.includes("not found") || err.message.includes("Cannot") || err.message.includes("not an admin")) {
      return res.status(400).json({ message: err.message });
    }
    
    res.status(500).json({ message: err.message });
  }
};

/**
 * Delete user
 * DELETE /api/admin/users/:userId
 */
export const deleteAdminUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent self-deletion
    if (parseInt(userId) === req.user.userId) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    await adminService.deleteAdminUser({
      userId: parseInt(userId),
      deletedBy: req.user.userId
    });

    res.json({
      success: true,
      message: "User deleted successfully"
    });
  } catch (err) {
    console.error("Error in deleteAdminUser:", err);
    
    if (err.message.includes("not found") || err.message.includes("Cannot")) {
      return res.status(400).json({ message: err.message });
    }
    
    res.status(500).json({ message: err.message });
  }
};

export const changeUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['USER', 'HOST'].includes(role)) {
      return res.status(400).json({ message: "Invalid role. Must be USER or HOST." });
    }

    const user = await adminService.changeUserRole({
      userId: parseInt(userId),
      newRole: role,
      changedBy: req.user.userId
    });

    res.json({ success: true, message: `Role changed to ${role}`, user });
  } catch (err) {
    console.error("Error in changeUserRole:", err);
    res.status(500).json({ message: err.message });
  }
};