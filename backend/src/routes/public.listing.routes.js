import express from "express";
import * as controller from "../controllers/public.listing.controller.js";
import { checkCanReview } from '../controllers/review.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  getPublicListingReviews,
  getPublicReviewStats
} from "../controllers/host.review.controller.js";

const router = express.Router();

// --- Public listings routes --- //

// Get featured listings (must be before /:id)
router.get("/featured", controller.getFeaturedListings);

// Get all amenities for filters
router.get("/amenities", controller.getAmenities);

// Search listings
router.get("/search", controller.searchListings);

// Get listings by location
router.get("/location/:location", controller.getListingsByLocation);

// Get all public listings with optional filters
router.get("/", controller.getListings);

// Reviews routes (must be before generic /:id)
router.get("/:id/reviews", getPublicListingReviews);
router.get("/:id/reviews/stats", getPublicReviewStats);

// Get a single public listing by ID (must come AFTER more specific routes)
router.get("/:id", controller.getListingById);

// Protected routes related to a specific listing
router.get('/:id/can-review', authenticate, checkCanReview);
router.get('/:id/availability', controller.getAvailability);

export default router;