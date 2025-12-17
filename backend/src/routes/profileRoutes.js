import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import * as controller from "../controllers/profileController.js";

const router = express.Router();

// Get current user's profile
router.get("/", authMiddleware, controller.getProfile);

// Update current user's profile
router.put("/", authMiddleware, controller.updateProfile);

// Get current user's statistics
router.get("/stats", authMiddleware, controller.getProfileStats);

export default router;