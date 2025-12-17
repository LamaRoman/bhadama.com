import * as bookingService from "../services/bookingService.js";

/**
 * Create new bookings
 * POST /api/bookings
 */
export async function createBooking(req, res) {
  try {
    const { listingId: rawListingId, dates } = req.body;
    const userId = req.user.userId;

    // Validate listingId
    const listingId = Number(rawListingId);
    if (isNaN(listingId)) {
      return res.status(400).json({ error: "Invalid listingId" });
    }

    // Validate dates
    if (!Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({ error: "Dates array is required" });
    }

    const result = await bookingService.createBookings(listingId, userId, dates);
    res.json(result);
  } catch (err) {
    console.error("CREATE BOOKING ERROR:", err.message);
    res.status(400).json({ error: err.message });
  }
}

/**
 * Get user's bookings
 * GET /api/bookings
 */
export async function getUserBookings(req, res) {
  try {
    const userId = req.user.userId;
    const bookings = await bookingService.getBookingsByUserId(userId);
    res.json(bookings);
  } catch (err) {
    console.error("GET USER BOOKINGS ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
}

/**
 * Get a specific booking
 * GET /api/bookings/:id
 */
export async function getBookingById(req, res) {
  try {
    const bookingId = Number(req.params.id);
    const userId = req.user.userId;

    if (isNaN(bookingId)) {
      return res.status(400).json({ error: "Invalid booking ID" });
    }

    const booking = await bookingService.getBookingById(bookingId);

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Check authorization (user can only view their own bookings)
    if (booking.userId !== userId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    res.json(booking);
  } catch (err) {
    console.error("GET BOOKING ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
}

/**
 * Cancel a booking
 * DELETE /api/bookings/:id
 */
export async function cancelBooking(req, res) {
  try {
    const bookingId = Number(req.params.id);
    const userId = req.user.userId;

    if (isNaN(bookingId)) {
      return res.status(400).json({ error: "Invalid booking ID" });
    }

    const result = await bookingService.cancelBooking(bookingId, userId);
    res.json(result);
  } catch (err) {
    console.error("CANCEL BOOKING ERROR:", err.message);
    res.status(400).json({ error: err.message });
  }
}

/**
 * Get upcoming bookings for user
 * GET /api/bookings/upcoming
 */
export async function getUpcomingBookings(req, res) {
  try {
    const userId = req.user.userId;
    const bookings = await bookingService.getUpcomingBookings(userId);
    res.json(bookings);
  } catch (err) {
    console.error("GET UPCOMING BOOKINGS ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
}

/**
 * Get bookings for a listing (for hosts)
 * GET /api/bookings/listing/:listingId
 */
export async function getListingBookings(req, res) {
  try {
    const listingId = Number(req.params.listingId);

    if (isNaN(listingId)) {
      return res.status(400).json({ error: "Invalid listing ID" });
    }

    const bookings = await bookingService.getBookingsByListingId(listingId);
    res.json(bookings);
  } catch (err) {
    console.error("GET LISTING BOOKINGS ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
}

/**
 * Update booking dates
 * PUT /api/bookings/:id
 */
export async function updateBooking(req, res) {
  try {
    const bookingId = Number(req.params.id);
    const userId = req.user.userId;
    const { dates } = req.body;

    if (isNaN(bookingId)) {
      return res.status(400).json({ error: "Invalid booking ID" });
    }

    if (!Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({ error: "Dates array is required" });
    }

    const result = await bookingService.updateBookingDates(bookingId, userId, dates);
    res.json(result);
  } catch (err) {
    console.error("UPDATE BOOKING ERROR:", err.message);
    res.status(400).json({ error: err.message });
  }
}

/**
 * Get past bookings for user
 * GET /api/bookings/past
 */
export async function getPastBookings(req, res) {
  try {
    const userId = req.user.userId;
    const bookings = await bookingService.getPastBookings(userId);
    res.json(bookings);
  } catch (err) {
    console.error("GET PAST BOOKINGS ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
}