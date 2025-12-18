import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";
import * as controller from "../controllers/bookingController.js";

const router = express.Router();

// Create booking
router.post("/", authMiddleware, controller.createBooking);

// Get available time slots for a listing (public or auth - your choice)
router.get("/availability/:listingId", controller.getAvailability);

// Get user's bookings
router.get("/user", authMiddleware, controller.getUserBookings);

// Get host's bookings
router.get("/host", authMiddleware, roleMiddleware(["HOST", "ADMIN"]), controller.getHostBookings);

// Cancel booking
router.put("/:id/cancel", authMiddleware, controller.cancelBooking);

// Get booking by ID
router.get("/:id", authMiddleware, controller.getBookingById);

export default router;