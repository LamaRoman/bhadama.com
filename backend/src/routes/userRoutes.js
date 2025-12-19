import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/multer.js"; // Import your existing multer middleware
import * as controller from "../controllers/userController.js";

const router = express.Router();



// Get user profile
router.get("/profile", authenticate, controller.getProfile);

// Update user profile (name, email)
router.put("/", authenticate, controller.updateUser);

// Upload profile photo
router.post(
  "/upload-photo",
  authenticate,
  upload.single("photo"), // Use your existing multer middleware
  controller.uploadProfilePhoto
);

router.delete("/remove-photo", authenticate, controller.removeProfilePhoto);
// Change password
router.put("/change-password", authenticate, controller.changePassword);

// Delete account
router.delete("/", authenticate, controller.deleteUser);

export default router;