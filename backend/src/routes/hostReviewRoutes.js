import express from 'express';
import {
  getHostReviews,
  submitReviewReply,
  flagReviewForRemoval,
  markReviewFeedback,
  getReviewStats
} from '../controllers/hostReviewController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected - FIX: authorize needs config object
router.use(authenticate, authorize({ minRole: "HOST" }));

// Get all reviews for host (with filters)
router.get('/', getHostReviews);

// Get review statistics
router.get('/stats', getReviewStats);

// Submit reply to a review
router.post('/:id/reply', submitReviewReply);

// Flag review for removal
router.post('/:id/flag', flagReviewForRemoval);

// Mark review as helpful/not helpful
router.post('/:id/feedback', markReviewFeedback);

export default router;