import * as adminService from "../services/adminService.js"

/* ===== DASHBOARD ===== */

export const getDashboard = async (req, res) => {
  try {
    const data = await adminService.getDashboardStats();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ===== LISTING MODERATION ===== */

export const moderateListing = async (req, res) => {
  const { listingId } = req.params;
  const { status, reason } = req.body;

  try {
    await adminService.moderateListing({
      adminId: req.user.id,
      listingId: Number(listingId),
      status,
      reason
    });

    res.json({ message: "Listing moderated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ===== REVIEW REPORTS ===== */

export const getReportedReviews = async (req, res) => {
  try {
    const reports = await adminService.getReportedReviews();
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ===== REFUND ===== */

export const issueRefund = async (req, res) => {
  const { bookingId, amount, reason } = req.body;

  try {
    await adminService.issueRefund({
      bookingId,
      adminId: req.user.id,
      amount,
      reason
    });

    res.json({ message: "Refund issued" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
