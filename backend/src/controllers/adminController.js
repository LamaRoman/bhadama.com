import { adminService } from '../services/adminService.js';

/**
 * GET /api/admin/stats
 * Get dashboard statistics
 */
export async function getAdminStats(req, res) {
  try {
    const { range = '30days' } = req.query;
    const stats = await adminService.getDashboardStats(range);
    res.json(stats);
  } catch (error) {
    console.error("GET ADMIN STATS ERROR:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/admin/bookings/recent
 * Get recent bookings
 */
export async function getRecentBookings(req, res) {
  try {
    const { page = 1, limit = 10 } = req.query;
    const data = await adminService.getRecentBookings(parseInt(limit), parseInt(page));
    res.json(data);
  } catch (error) {
    console.error("GET RECENT BOOKINGS ERROR:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/admin/users/recent
 * Get recent users
 */
export async function getRecentUsers(req, res) {
  try {
    const { limit = 8 } = req.query;
    const users = await adminService.getRecentUsers(parseInt(limit));
    res.json(users);
  } catch (error) {
    console.error("GET RECENT USERS ERROR:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/admin/listings
 * Get all listings with pagination
 */
export async function getAllListings(req, res) {
  try {
    const data = await adminService.getAllListings(req.query);
    res.json(data);
  } catch (error) {
    console.error("GET ALL LISTINGS ERROR:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/admin/reviews/pending
 * Get pending reviews for moderation
 */
export async function getPendingReviews(req, res) {
  try {
    const reviews = await adminService.getPendingReviews();
    res.json(reviews);
  } catch (error) {
    console.error("GET PENDING REVIEWS ERROR:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * PUT /api/admin/reviews/:id/status
 * Approve or reject a review
 */
export async function updateReviewStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    
    const review = await adminService.updateReviewStatus(id, status, reason);
    res.json({ message: `Review ${status.toLowerCase()} successfully`, review });
  } catch (error) {
    console.error("UPDATE REVIEW STATUS ERROR:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * PUT /api/admin/listings/:id/status
 * Update listing status
 */
export async function updateListingStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    
    const listing = await adminService.updateListingStatus(id, status, reason);
    res.json({ message: `Listing ${status.toLowerCase()} successfully`, listing });
  } catch (error) {
    console.error("UPDATE LISTING STATUS ERROR:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/admin/analytics/users
 * Get user analytics
 */
export async function getUserAnalytics(req, res) {
  try {
    const { range = '30days' } = req.query;
    const analytics = await adminService.getUserAnalytics(range);
    res.json(analytics);
  } catch (error) {
    console.error("GET USER ANALYTICS ERROR:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/admin/analytics/bookings
 * Get booking analytics
 */
export async function getBookingAnalytics(req, res) {
  try {
    const { range = '30days' } = req.query;
    const analytics = await adminService.getBookingAnalytics(range);
    res.json(analytics);
  } catch (error) {
    console.error("GET BOOKING ANALYTICS ERROR:", error);
    res.status(500).json({ error: error.message });
  }
}