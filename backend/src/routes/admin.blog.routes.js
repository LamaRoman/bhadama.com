// routes/adminBlogRoutes.js
// Admin routes for blog and comment moderation

import express from "express";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import * as adminBlogController from "../controllers/admin.blog.controller.js";

const router = express.Router();

// All routes require ADMIN authentication
router.use(authenticate);
router.use(authorize({ minRole: "ADMIN" }));

// ==================== BLOG STATISTICS ====================

// Get blog statistics
router.post("/", adminBlogController.createBlog);
router.put("/:id", adminBlogController.updateBlog);
router.get("/stats", adminBlogController.getBlogStats);


// ==================== BLOG MODERATION ====================

// Get all blogs (with filters)
router.get("/", adminBlogController.getAllBlogs);

// Get pending blogs for approval
router.get("/pending", adminBlogController.getPendingBlogs);

// Get single blog for review
router.get("/:id", adminBlogController.getBlogForReview);

// Approve blog
router.post("/:id/approve", adminBlogController.approveBlog);

// Reject blog
router.post("/:id/reject", adminBlogController.rejectBlog);

// Feature/Unfeature blog
router.post("/:id/feature", adminBlogController.toggleFeature);

// Delete blog
router.delete("/:id", adminBlogController.deleteBlog);


// ==================== COMMENT MODERATION ====================

// Get flagged comments
router.get("/comments/flagged", adminBlogController.getFlaggedComments);

// Approve flagged comment
router.post("/comments/:id/approve", adminBlogController.approveComment);

// Delete comment
router.delete("/comments/:id", adminBlogController.deleteComment);


// ==================== CONTRIBUTOR MANAGEMENT ====================

// Get all contributors
router.get("/contributors", adminBlogController.getContributors);

// Update contributor tier
router.put("/contributors/:userId/tier", adminBlogController.updateContributorTier);

// Ban/Unban contributor
router.post("/contributors/:userId/ban", adminBlogController.toggleContributorBan);


export default router;