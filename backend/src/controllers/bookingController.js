import * as bookingService from "../services/bookingService.js";
import { prisma } from "../config/prisma.js";
/**
 * Create a new booking
 * POST /api/bookings
 */

export const completeExpiredBookings = async () => {
  const now = new Date();

  const bookings = await prisma.booking.findMany({
    where: { status: "CONFIRMED" }
  });

  for (const booking of bookings) {
    const endDateTime = new Date(booking.bookingDate);
    const [h, m] = booking.endTime.split(":");
    endDateTime.setHours(h, m, 0, 0);

    if (endDateTime <= now) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: "COMPLETED",
          completedAt: now
        }
      });
    }
  }
};


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
    console.log("Fetching bookings for user ID:", userId); // Debug log

    const bookings = await prisma.booking.findMany({
      where: { 
        userId:userId // filter by the logged in user
      },
      include: {
        listing: {
          include: {
            images: { where: { isCover: true }, take: 1 },
            host: {
              select: {
                id: true,
                name: true,
                email: true,
                profilePhoto: true,
              },
            },
          },
        },
      },
      orderBy: { bookingDate: "desc" },
    });
console.log("Found bookings:", bookings.length); // Debug log
    const normalizedBookings = bookings.map(b => ({
      ...b,
      basePrice: Number(b.basePrice),
      extraGuestPrice: Number(b.extraGuestPrice),
      serviceFee: Number(b.serviceFee),
      tax: Number(b.tax),
      totalPrice: Number(b.totalPrice),
      duration: Number(b.duration),
    }));

    res.json(normalizedBookings);
  } catch (error) {
    console.error("getUserBookings error:", error);
    res.status(500).json({ error: "Failed to fetch bookings" });
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
    const bookingId = Number(req.params.id);

    const b = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        listing: {
          include: {
            images: true,
            host: {
              select: {
                id: true,
                name: true,
                email: true,
                profilePhoto: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePhoto: true,
          },
        },
      },
    });

    if (!b) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json({
      ...b,
      basePrice: Number(b.basePrice),
      extraGuestPrice: Number(b.extraGuestPrice),
      serviceFee: Number(b.serviceFee),
      tax: Number(b.tax),
      totalPrice: Number(b.totalPrice),
      duration: Number(b.duration),
    });
  } catch (error) {
    console.error("getBookingById error:", error);
    res.status(500).json({ error: "Failed to fetch booking" });
  }
}
