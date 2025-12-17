import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";
import * as controller from "../controllers/availabilityController.js";

const router = express.Router();

// ==================== PUBLIC ROUTES ==================== //

// Get availability for a listing (public - for booking calendar)
router.get("/:listingId", controller.getAvailability);

// Get blocked dates for a listing
router.get("/:listingId/blocked", controller.getBlockedDates);

// ==================== HOST ROUTES ==================== //

// Create new availability dates
router.post(
  "/:listingId",
  authMiddleware,
  roleMiddleware(["HOST"]),
  controller.createAvailability
);

// Toggle availability for a specific date
router.post(
  "/toggle",
  authMiddleware,
  roleMiddleware(["HOST"]),
  controller.toggleAvailability
);

export default router;