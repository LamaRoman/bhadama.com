import express from 'express';
import {
  getAdminStats,
  getRecentBookings,
  getRecentUsers,
  getAllListings,
  getPendingReviews,
  updateReviewStatus,
  updateListingStatus,
  getUserAnalytics,
  getBookingAnalytics
} from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication and admin authorization to all routes
router.use(authenticate);
router.use(authorize('ADMIN'));

// Dashboard routes
router.get('/stats', getAdminStats);
router.get('/bookings/recent', getRecentBookings);
router.get('/users/recent', getRecentUsers);
router.get('/listings', getAllListings);

// Analytics routes
router.get('/analytics/users', getUserAnalytics);
router.get('/analytics/bookings', getBookingAnalytics);

// Moderation routes
router.get('/reviews/pending', getPendingReviews);
router.put('/reviews/:id/status', updateReviewStatus);
router.put('/listings/:id/status', updateListingStatus);

export default router;