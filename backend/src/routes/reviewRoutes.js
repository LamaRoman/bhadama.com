import express from 'express';
import {
  getReviews,
  checkCanReview,
  createReview,
  updateReview,
  markHelpful,
  reportReview
} from '../controllers/reviewController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route: get all reviews for a listing
router.get('/listings/:listingId/reviews', getReviews);

// Protected routes (require authentication)
router.get('/listings/:listingId/can-review', authenticate, checkCanReview);
router.post('/listings/:listingId/reviews', authenticate, createReview);
router.put('/:id', authenticate, updateReview);
router.post('/:id/helpful', authenticate, markHelpful);
router.post('/:id/report', authenticate, reportReview);

export default router;
