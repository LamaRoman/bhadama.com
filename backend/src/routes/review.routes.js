import express from 'express';
import {
  getReviews,
  checkCanReview,
  createReview,
  updateReview,
  markHelpful,
  reportReview,
  getEligibleBookings
} from '../controllers/review.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public route: get all reviews for a listing
router.get('/listings/:listingId/reviews', getReviews);

// Protected routes (require authentication)
router.get('/listings/:listingId/can-review', authenticate, checkCanReview);
router.get('/listings/:listingId/eligible-bookings', authenticate, getEligibleBookings);

// This is the important one
router.post("/:listingId", authenticate, createReview);
// others
router.put('/:id', authenticate, updateReview);
router.post('/:id/helpful', authenticate, markHelpful);
router.post('/:id/report', authenticate, reportReview);

export default router;
