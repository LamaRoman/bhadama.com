import * as bookingService from "../services/bookingService.js";

/**
 * Create a new booking
 * POST /api/bookings
 */
export async function createBooking(req, res) {
  try {
    const userId = req.user.userId;
    const { listingId, bookingDate, startTime, endTime, guests, pricingType, specialRequests } = req.body;

    // Validation
    if (!listingId || !bookingDate || !startTime || !endTime) {
      return res.status(400).json({ 
        error: "Missing required fields: listingId, bookingDate, startTime, endTime" 
      });
    }

    const bookingData = {
      userId,
      listingId: parseInt(listingId),
      bookingDate,
      startTime,
      endTime,
      guests: guests || 1,
      pricingType: pricingType || "HOURLY",
      specialRequests,
    };

    const booking = await bookingService.createBooking(bookingData);

    res.status(201).json({
      message: "Booking created successfully",
      booking,
    });
  } catch (err) {
    console.error("CREATE BOOKING ERROR:", err);
    res.status(400).json({ error: err.message || "Failed to create booking" });
  }
}

/**
 * Get available time slots for a listing
 * GET /api/bookings/availability/:listingId
 */
export async function getAvailability(req, res) {
  try {
    const { listingId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: "Date parameter required" });
    }

    const slots = await bookingService.getAvailableTimeSlots(
      parseInt(listingId),
      date
    );

    res.json({ date, slots });
  } catch (err) {
    console.error("GET AVAILABILITY ERROR:", err);
    res.status(500).json({ error: err.message || "Failed to get availability" });
  }
}

/**
 * Get user's bookings
 * GET /api/bookings/user
 */
export async function getUserBookings(req, res) {
  try {
    const userId = req.user.userId;
    const bookings = await bookingService.getUserBookings(userId);

    res.json(bookings);
  } catch (err) {
    console.error("GET USER BOOKINGS ERROR:", err);
    res.status(500).json({ error: "Failed to get bookings" });
  }
}

/**
 * Get host's bookings
 * GET /api/bookings/host
 */
export async function getHostBookings(req, res) {
  try {
    const hostId = req.user.userId;
    const bookings = await bookingService.getHostBookings(hostId);

    res.json(bookings);
  } catch (err) {
    console.error("GET HOST BOOKINGS ERROR:", err);
    res.status(500).json({ error: "Failed to get bookings" });
  }
}

/**
 * Cancel a booking
 * PUT /api/bookings/:id/cancel
 */
export async function cancelBooking(req, res) {
  try {
    const userId = req.user.userId;
    const bookingId = parseInt(req.params.id);

    const booking = await bookingService.cancelBooking(bookingId, userId);

    res.json({
      message: "Booking cancelled successfully",
      booking,
    });
  } catch (err) {
    console.error("CANCEL BOOKING ERROR:", err);
    res.status(400).json({ error: err.message || "Failed to cancel booking" });
  }
}

/**
 * Get booking by ID
 * GET /api/bookings/:id
 */
export async function getBookingById(req, res) {
  try {
    const bookingId = parseInt(req.params.id);
    const booking = await bookingService.getBookingById(bookingId);

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json(booking);
  } catch (err) {
    console.error("GET BOOKING ERROR:", err);
    res.status(500).json({ error: "Failed to get booking" });
  }
}