import express from "express";
import * as controller from "../controllers/publicListingController.js";
import { checkCanReview } from '../controllers/reviewController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import {
  getPublicListingReviews,
  getPublicReviewStats
} from "../controllers/hostReviewController.js";
const router = express.Router();

// --- Public listings routes --- //

// Get featured listings (must be before /:id)
router.get("/featured", controller.getFeaturedListings);

// Search listings
router.get("/search", controller.searchListings);

router.get("/:id/reviews", getPublicListingReviews);
router.get("/:id/reviews/stats", getPublicReviewStats);
// Get listings by location
router.get("/location/:location", controller.getListingsByLocation);

// Get all public listings with optional filters
router.get("/", controller.getListings);

// Get a single public listing by ID (must come AFTER more specific routes)
router.get("/:id", controller.getListingById);

// Protected routes related to a specific listing
router.get('/:id/can-review', authenticate, checkCanReview);
router.get('/:id/availability', controller.getAvailability);

export default router;
