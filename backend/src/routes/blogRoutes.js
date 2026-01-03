// routes/blogRoutes.js
// Public and authenticated user blog routes

import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/multer.js";
import * as blogController from "../controllers/blogController.js";
import * as commentController from "../controllers/blogCommentController.js";

const router = express.Router();

// ==================== PUBLIC ROUTES (No auth required) ====================

// Get all published blogs
router.get("/", blogController.getPublishedBlogs);

// Get featured blogs
router.get("/featured", blogController.getFeaturedBlogs);

// Get blog categories with counts
router.get("/categories", blogController.getBlogCategories);

// Get popular tags
router.get("/tags", blogController.getPopularTags);

// Get single blog by slug
router.get("/:slug", blogController.getBlogBySlug);

// Get comments for a blog
router.get("/:blogId/comments", commentController.getBlogComments);


// ==================== AUTHENTICATED USER ROUTES ====================

// Like/Unlike blog
router.post("/:id/like", authenticate, blogController.toggleBlogLike);

// Get like status
router.get("/:id/like-status", authenticate, blogController.getBlogLikeStatus);

// Add comment
router.post("/:blogId/comments", authenticate, commentController.addComment);


// ==================== COMMENT ROUTES (authenticated) ====================

// Edit comment
router.put("/comments/:id", authenticate, commentController.editComment);

// Delete comment
router.delete("/comments/:id", authenticate, commentController.deleteComment);

// Like/Unlike comment
router.post("/comments/:id/like", authenticate, commentController.toggleCommentLike);

// Flag/Report comment
router.post("/comments/:id/flag", authenticate, commentController.flagComment);


export default router;