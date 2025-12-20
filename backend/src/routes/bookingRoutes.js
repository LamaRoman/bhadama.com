import express from "express";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import * as controller from "../controllers/bookingController.js";

const router = express.Router();

// Create booking
router.post("/", authenticate, controller.createBooking);

// Get available time slots for a listing (public or auth - your choice)
router.get("/availability/:listingId", controller.getAvailability);

// Get user's bookings
router.get("/user", authenticate, controller.getUserBookings);

// Get host's bookings
router.get("/host", authenticate, authorize(["HOST", "ADMIN"]), controller.getHostBookings);

// Cancel booking
router.put("/:id/cancel", authenticate, controller.cancelBooking);

// Get booking by ID
router.get("/:id", authenticate, controller.getBookingById);

export default router;