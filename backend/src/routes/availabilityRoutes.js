import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";
import * as controller from "../controllers/availabilityController.js";

const router = express.Router();

// IMPORTANT: More specific routes must come BEFORE parameterized routes
// Otherwise /:listingId will catch everything

// Public routes - anyone can check availability
router.post("/check", controller.checkSlotAvailability);

// These specific routes must come before /:listingId
router.get("/:listingId/dates", controller.getBookedDates);
router.get("/:listingId/summary", controller.getAvailabilitySummary);

// Protected routes - HOST only (specific routes)
router.post(
  "/:listingId/block",
  authMiddleware,
  roleMiddleware(["HOST", "ADMIN"]),
  controller.blockDate
);

router.delete(
  "/blocked/:blockedDateId",
  authMiddleware,
  roleMiddleware(["HOST", "ADMIN"]),
  controller.unblockDate
);

// General availability (should be last as it's most generic)
router.get("/:listingId", controller.getAvailability);

export default router;