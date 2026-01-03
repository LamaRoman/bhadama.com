// routes/hostBlogRoutes.js
// Host-specific blog routes with listing linking

import express from "express";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/multer.js";
import { uploadToS3 } from "../config/s3.js";
import * as blogController from "../controllers/blogController.js";
import * as commentController from "../controllers/blogCommentController.js";

const router = express.Router();

// All routes require HOST authentication
router.use(authenticate);
router.use(authorize({ minRole: "HOST" }));

// ==================== HOST BLOG MANAGEMENT ====================

// Get host's blogs with listing options
router.get("/", blogController.getHostBlogs);

// Create blog (hosts can link to listings)
router.post("/", blogController.createBlog);

// Update blog
router.put("/:id", blogController.updateBlog);

// Publish blog (auto-publish for hosts)
router.post("/:id/publish", blogController.publishBlog);

// Unpublish blog
router.post("/:id/unpublish", blogController.unpublishBlog);

// Delete blog
router.delete("/:id", blogController.deleteBlog);


// ==================== COMMENT MODERATION (on own blogs) ====================

// Hide comment on own blog
router.post("/:blogId/comments/:commentId/hide", commentController.hideComment);

// Unhide comment on own blog
router.post("/:blogId/comments/:commentId/unhide", commentController.unhideComment);


// ==================== IMAGE UPLOAD ====================

// Upload inline image (for editor and cover)
router.post("/upload-image", upload.single("image"), async (req, res) => {
  try {
    console.log("Upload request received");
    
    if (!req.file) {
      return res.status(400).json({ error: "No image provided" });
    }
    
    // Generate unique S3 key for blog images
    const timestamp = Date.now();
    const uniqueId = Math.random().toString(36).substring(7);
    const extension = req.file.originalname.split(".").pop();
    const s3Key = `blogs/${timestamp}-${uniqueId}.${extension}`;
    
    // Upload to S3
    const { secure_url } = await uploadToS3(req.file, s3Key);
    
    console.log("Image uploaded to S3:", secure_url);
    res.json({ url: secure_url });
    
  } catch (error) {
    console.error("Image upload error:", error);
    res.status(500).json({ error: "Failed to upload image" });
  }
});

// Upload cover image for specific blog
router.post("/:id/cover-image", upload.single("image"), async (req, res) => {
  try {
    const hostId = req.user.id;
    const blogId = parseInt(req.params.id);
    
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    
    // Verify ownership
    const blog = await prisma.blogPost.findFirst({
      where: { id: blogId, authorId: hostId }
    });
    
    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: "No image provided" });
    }
    
    // Generate unique S3 key for cover image
    const timestamp = Date.now();
    const extension = req.file.originalname.split(".").pop();
    const s3Key = `blogs/covers/${blogId}-${timestamp}.${extension}`;
    
    // Upload to S3
    const { secure_url } = await uploadToS3(req.file, s3Key);
    
    // Update blog with cover image URL
    await prisma.blogPost.update({
      where: { id: blogId },
      data: { coverImage: secure_url }
    });
    
    console.log("Cover image uploaded to S3:", secure_url);
    res.json({ coverImage: secure_url, url: secure_url });
    
  } catch (error) {
    console.error("Cover image upload error:", error);
    res.status(500).json({ error: "Failed to upload image" });
  }
});


export default router;