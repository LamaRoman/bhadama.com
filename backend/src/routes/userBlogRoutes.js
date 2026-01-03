// routes/userBlogRoutes.js
// Authenticated user routes for managing their own blogs

import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/multer.js";
import * as blogController from "../controllers/blogController.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// ==================== USER BLOG MANAGEMENT ====================

// Get user's own blogs
router.get("/", blogController.getUserBlogs);

// Get contributor profile
router.get("/contributor-profile", blogController.getContributorProfileEndpoint);

// Create new blog
router.post("/", blogController.createBlog);

// Update blog
router.put("/:id", blogController.updateBlog);

// Submit for publishing
router.post("/:id/publish", blogController.publishBlog);

// Unpublish (revert to draft)
router.post("/:id/unpublish", blogController.unpublishBlog);

// Delete blog
router.delete("/:id", blogController.deleteBlog);


// ==================== BLOG IMAGE UPLOAD ====================

// Upload cover image
router.post("/:id/cover-image", upload.single("image"), async (req, res) => {
  try {
    const userId = req.user.id;
    const blogId = parseInt(req.params.id);
    
    // Import prisma inline to avoid circular deps
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    
    // Verify ownership
    const blog = await prisma.blogPost.findFirst({
      where: { id: blogId, authorId: userId }
    });
    
    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: "No image provided" });
    }
    
    // Get the uploaded file URL
    // Adjust based on your S3/storage setup
    const imageUrl = req.file.location || `/uploads/blogs/${req.file.filename}`;
    
    // Update blog with cover image
    const updatedBlog = await prisma.blogPost.update({
      where: { id: blogId },
      data: { coverImage: imageUrl }
    });
    
    res.json({ coverImage: imageUrl });
  } catch (error) {
    console.error("Cover image upload error:", error);
    res.status(500).json({ error: "Failed to upload image" });
  }
});

// Upload inline image for content
router.post("/upload-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image provided" });
    }
    
    // Get the uploaded file URL
    const imageUrl = req.file.location || `/uploads/blogs/${req.file.filename}`;
    
    res.json({ url: imageUrl });
  } catch (error) {
    console.error("Image upload error:", error);
    res.status(500).json({ error: "Failed to upload image" });
  }
});


export default router;