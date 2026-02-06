// ==========================================
// HOST STORY ROUTES
// ==========================================
// File: routes/host.story.routes.js
//
// Host routes for managing their personal story
// Public routes for viewing published host stories
// ==========================================

import express from "express";
import {
  authenticate,
  optionalAuth,
  authorize,
} from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import { auditLog, uploadLimiter } from "../middleware/security.middleware.js";
import {
  createHostStorySchema,
  updateHostStorySchema,
} from "../validators/host.story.validators.js";
import * as hostStoryController from "../controllers/host.story.controller.js";

const router = express.Router();

// ==========================================
// PUBLIC ROUTES
// ==========================================

/**
 * @route   GET /api/hosts/stories/featured
 * @desc    Get featured host stories for homepage
 * @access  Public
 */
router.get("/hosts/stories/featured", hostStoryController.getFeaturedStories);

/**
 * @route   GET /api/hosts/:hostId/story
 * @desc    Get published story for a host (public view)
 * @access  Public
 */
router.get(
  "/hosts/:hostId/story",
  optionalAuth, // Track logged-in viewers
  hostStoryController.getPublicStory
);

// ==========================================
// HOST ROUTES (Authenticated)
// ==========================================

/**
 * @route   GET /api/host/story/check
 * @desc    Check if current host has a story
 * @access  Private (HOST only)
 */
router.get(
  "/host/story/check",
  authenticate,
  authorize({ minRole: "HOST" }),
  hostStoryController.checkStoryExists
);

/**
 * @route   POST /api/host/story
 * @desc    Create host's personal story
 * @access  Private (HOST only)
 */
router.post(
  "/host/story",
  authenticate,
  authorize({ minRole: "HOST" }),
  uploadLimiter,
  validate(createHostStorySchema),
  auditLog("HOST_STORY_CREATE"),
  hostStoryController.createStory
);

/**
 * @route   GET /api/host/story
 * @desc    Get own story (host view - all statuses)
 * @access  Private (HOST only)
 */
router.get(
  "/host/story",
  authenticate,
  authorize({ minRole: "HOST" }),
  hostStoryController.getOwnStory
);

/**
 * @route   PUT /api/host/story
 * @desc    Update host's personal story
 * @access  Private (HOST only)
 */
router.put(
  "/host/story",
  authenticate,
  authorize({ minRole: "HOST" }),
  uploadLimiter,
  validate(updateHostStorySchema),
  auditLog("HOST_STORY_UPDATE"),
  hostStoryController.updateStory
);

/**
 * @route   PATCH /api/host/story/submit
 * @desc    Submit draft story for review
 * @access  Private (HOST only)
 */
router.patch(
  "/host/story/submit",
  authenticate,
  authorize({ minRole: "HOST" }),
  auditLog("HOST_STORY_SUBMIT"),
  hostStoryController.submitForReview
);

export default router;