import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/multer.js"; // Import your existing multer middleware
import * as controller from "../controllers/userController.js";

const router = express.Router();

// Get user profile
router.get("/profile", authMiddleware, controller.getProfile);

// Update user profile (name, email)
router.put("/", authMiddleware, controller.updateUser);

// Upload profile photo
router.post(
  "/upload-photo",
  authMiddleware,
  upload.single("photo"), // Use your existing multer middleware
  controller.uploadProfilePhoto
);

// Change password
router.put("/change-password", authMiddleware, controller.changePassword);

// Delete account
router.delete("/", authMiddleware, controller.deleteUser);

export default router;