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


export const createBooking = async (req, res) => {
  try {
    const { listingId, userId, bookingDate, startTime, endTime, guests } = req.body;

    // Get the listing to check ownership and pricing
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { 
        id: true,
        hostId: true, 
        hourlyRate: true,
        extraGuestCharge: true,
        includedGuests: true,
      }
    });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    // Prevent host from booking their own listing
    if (listing.hostId === userId) {
      return res.status(403).json({ 
        error: "You cannot book your own listing",
        code: "SELF_BOOKING_NOT_ALLOWED"
      });
    }

    // Calculate duration in hours
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    const duration = ((endH * 60 + endM) - (startH * 60 + startM)) / 60;

    // Calculate prices
    const basePrice = duration * Number(listing.hourlyRate || 0);
    const extraGuests = Math.max(0, guests - (listing.includedGuests || 10));
    const extraGuestPrice = extraGuests * Number(listing.extraGuestCharge || 0);
    const subtotal = basePrice + extraGuestPrice;
    const serviceFee = subtotal * 0.1; // 10% service fee
    const tax = subtotal * 0.05; // 5% tax
    const totalPrice = subtotal + serviceFee + tax;

    // Create the booking
    const booking = await prisma.booking.create({
      data: {
        listingId,
        userId,
        bookingDate: new Date(bookingDate),
        startTime,
        endTime,
        guests,
        duration,
        basePrice,
        extraGuestPrice,
        serviceFee,
        tax,
        totalPrice,
        status: "CONFIRMED",
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
          }
        }
      }
    });

    return res.status(201).json({
      success: true,
      message: "Booking created successfully",
      booking: {
        ...booking,
        basePrice: Number(booking.basePrice),
        extraGuestPrice: Number(booking.extraGuestPrice),
        serviceFee: Number(booking.serviceFee),
        tax: Number(booking.tax),
        totalPrice: Number(booking.totalPrice),
        duration: Number(booking.duration),
      }
    });

  } catch (error) {
    console.error("Create booking error:", error);
    return res.status(500).json({ error: "Failed to create booking" });
  }
};
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
