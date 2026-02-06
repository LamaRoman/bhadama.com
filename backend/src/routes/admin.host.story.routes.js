// ==========================================
// ADMIN STORY ROUTES
// ==========================================
// File: routes/admin.story.routes.js
//
// Admin routes for story moderation
// Requires MODERATOR+ for moderation
// Requires SUPER_ADMIN for deletion and settings
// ==========================================

import express from "express";
import {
  authenticate,
  requireAdmin,
  requireAdminLevel,
  requireSuperAdmin,
} from "../middleware/auth.middleware.js";
import { ADMIN_HIERARCHY } from "../config/roles.config.js";
import { auditLog } from "../middleware/security.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import {
  rejectionSchema,
  storyListQuerySchema,
} from "../validators/host.story.validators.js";
import * as adminHostStoryController from "../controllers/admin.story.host.controller.js";

const router = express.Router();

// ==========================================
// MODERATION ROUTES (MODERATOR+)
// ==========================================

/**
 * @route   GET /api/admin/stories
 * @desc    List all stories (moderation queue)
 * @access  Admin (MODERATOR+)
 */
router.get(
  "/stories",
  authenticate,
  requireAdmin(),
  requireAdminLevel(ADMIN_HIERARCHY.MODERATOR),
  validate(storyListQuerySchema, "query"),
  adminHostStoryController.listStories
);

/**
 * @route   GET /api/admin/stories/stats
 * @desc    Get story moderation statistics
 * @access  Admin (MODERATOR+)
 */
router.get(
  "/stories/stats",
  authenticate,
  requireAdmin(),
  requireAdminLevel(ADMIN_HIERARCHY.MODERATOR),
  adminHostStoryController.getStoryStats
);

/**
 * @route   GET /api/admin/stories/:id
 * @desc    Get single story for review
 * @access  Admin (MODERATOR+)
 */
router.get(
  "/stories/:id",
  authenticate,
  requireAdmin(),
  requireAdminLevel(ADMIN_HIERARCHY.MODERATOR),
  adminHostStoryController.getStoryForReview
);

/**
 * @route   PATCH /api/admin/stories/:id/approve
 * @desc    Approve and publish a story
 * @access  Admin (MODERATOR+)
 */
router.patch(
  "/stories/:id/approve",
  authenticate,
  requireAdmin(),
  requireAdminLevel(ADMIN_HIERARCHY.MODERATOR),
  auditLog("STORY_APPROVED"),
  adminHostStoryController.approveStory
);

/**
 * @route   PATCH /api/admin/stories/:id/reject
 * @desc    Reject a story with reason
 * @access  Admin (MODERATOR+)
 */
router.patch(
  "/stories/:id/reject",
  authenticate,
  requireAdmin(),
  requireAdminLevel(ADMIN_HIERARCHY.MODERATOR),
  validate(rejectionSchema),
  auditLog("STORY_REJECTED"),
  adminHostStoryController.rejectStory
);

/**
 * @route   PATCH /api/admin/stories/:id/unpublish
 * @desc    Unpublish a published story (move back to PENDING)
 * @access  Admin (MODERATOR+)
 */
router.patch(
  "/stories/:id/unpublish",
  authenticate,
  requireAdmin(),
  requireAdminLevel(ADMIN_HIERARCHY.MODERATOR),
  auditLog("STORY_UNPUBLISHED"),
  adminHostStoryController.unpublishStory
);

// ==========================================
// SUPER ADMIN ONLY
// ==========================================

/**
 * @route   DELETE /api/admin/stories/:id
 * @desc    Permanently delete a story
 * @access  Super Admin only
 */
router.delete(
  "/stories/:id",
  authenticate,
  requireSuperAdmin,
  auditLog("STORY_DELETED"),
  adminHostStoryController.deleteStory
);

/**
 * @route   GET /api/admin/stories/settings
 * @desc    Get story moderation settings
 * @access  Super Admin only
 */
router.get(
  "/stories/settings",
  authenticate,
  requireSuperAdmin,
  adminHostStoryController.getModerationSettings
);

/**
 * @route   PATCH /api/admin/stories/settings
 * @desc    Update story moderation settings (auto-publish toggle)
 * @access  Super Admin only
 */
router.patch(
  "/stories/settings",
  authenticate,
  requireSuperAdmin,
  auditLog("STORY_SETTINGS_CHANGED"),
  adminHostStoryController.updateModerationSettings
);

export default router;