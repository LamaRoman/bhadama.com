import * as bookingService from "../services/bookingService.js";
import { prisma } from "../config/prisma.js";

/**
 * Create a new booking
 * POST /api/bookings
 */
export const createBooking = async (req, res) => {
  try {
    const userId = BigInt(req.user.userId);
    const { listingId, bookingDate, startTime, endTime, guests } = req.body;

    console.log("📝 Creating booking:", {
      userId: userId.toString(),
      listingId,
      bookingDate,
    });

    // Get the listing
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        title: true,
        hostId: true,
        hourlyRate: true,
        extraGuestCharge: true,
        includedGuests: true,
      },
    });
    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    // Prevent self-booking
    if (listing.hostId === userId) {
      return res.status(403).json({
        error: "You cannot book your own listing",
        code: "SELF_BOOKING_NOT_ALLOWED",
      });
    }

    // Calculate duration
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    const duration = (endH * 60 + endM - (startH * 60 + startM)) / 60;

    // Calculate prices
    const basePrice = duration * Number(listing.hourlyRate || 0);
    const extraGuests = Math.max(0, guests - (listing.includedGuests || 10));
    const extraGuestPrice = extraGuests * Number(listing.extraGuestCharge || 0);
    const subtotal = basePrice + extraGuestPrice;
    const serviceFee = subtotal * 0.1;
    const tax = subtotal * 0.05;
    const totalPrice = subtotal + serviceFee + tax;

    console.log("💰 Price calculation:", {
      basePrice,
      extraGuestPrice,
      serviceFee,
      tax,
      totalPrice,
    });
    // Create booking with PENDING status
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
        status: "PENDING",
        paymentStatus: "PENDING",
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
    console.log("✅ Booking created:", booking.id);

    // Get eSewa config
    const esewaConfig = await prisma.paymentGatewayConfig.findUnique({
      where: { gateway: "ESEWA" },
    });

    if (!esewaConfig || !esewaConfig.isActive) {
      console.log("❌ eSewa not configured");
      return res.status(500).json({ error: "Payment gateway not available" });
    }
    console.log("🔧 eSewa config:", {
      merchantId: esewaConfig.merchantId,
      isTestMode: esewaConfig.isTestMode,
    });

    // Create unique transaction ID
    const transactionUuid = `BKG-${booking.id}-${Date.now()}`;
    const esewaParams = {
      amt: Math.round(Number(totalPrice)),
      psc: 0,
      pdc: 0,
      txAmt: 0,
      tAmt: Math.round(Number(totalPrice)),
      pid: transactionUuid,
      scd: esewaConfig.merchantId || "EPAYTEST",
      su: `${process.env.BACKEND_URL}/api/bookings/payment/esewa/success`,
      fu: `${process.env.BACKEND_URL}/api/bookings/payment/esewa/failure`,
    };

    console.log("💳 eSewa params:", esewaParams);
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        paymentGateway: "ESEWA",
        paymentTransactionId: transactionUuid,
        paymentDetails: esewaParams,
      },
    });

    const esewaUrl = esewaConfig.isTestMode
      ? "https://uat.esewa.com.np/epay/main"
      : "https://esewa.com.np/epay/main";

    console.log("🚀 Payment URL:", esewaUrl);
    return res.status(201).json({
      success: true,
      message: "Booking created. Redirecting to payment...",
      booking: {
        id: booking.id,
        listingId: booking.listingId,
        bookingDate: booking.bookingDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        guests: booking.guests,
        basePrice: Number(booking.basePrice),
        extraGuestPrice: Number(booking.extraGuestPrice),
        serviceFee: Number(booking.serviceFee),
        tax: Number(booking.tax),
        totalPrice: Number(booking.totalPrice),
        duration: Number(booking.duration),
        status: booking.status,
        paymentStatus: booking.paymentStatus,
      },
      payment: {
        gateway: "ESEWA",
        url: esewaUrl,
        method: "POST",
        params: esewaParams,
      },
    });
  } catch (error) {
    console.error("❌ Create booking error:", error);
    return res.status(500).json({
      error: "Failed to create booking",
      details: error.message,
    });
  }
};
/**
 * Handle eSewa payment success callback
 * GET /api/bookings/payment/esewa/success
 */
export const esewaPaymentSuccess = async (req, res) => {
  try {
    const { oid, amt, refId } = req.query;

    console.log("✅ eSewa success callback:", { oid, amt, refId });

    // Find booking by transaction ID
    const booking = await prisma.booking.findFirst({
      where: { 
        paymentTransactionId: oid,
        status: "PENDING"
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
if (!booking) {
      console.log("❌ Booking not found for transaction:", oid);
      return res.redirect(`${process.env.FRONTEND_URL}/booking/payment-failed?error=booking_not_found`);
    }

    console.log("📦 Found booking:", booking.id);

    // TODO: Verify payment with eSewa API (recommended for production)
    // For now, we trust the callback

    // Update booking to CONFIRMED
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: "CONFIRMED",
        paymentStatus: "COMPLETED",
        paymentReferenceId: refId,
        paymentCompletedAt: new Date(),
      }
    });
    console.log("✅ Booking confirmed:", booking.id);

    // Redirect to success page
    res.redirect(`${process.env.FRONTEND_URL}/booking/payment-success?bookingId=${booking.id}&refId=${refId}`);

  } catch (error) {
    console.error("❌ eSewa success callback error:", error);
    res.redirect(`${process.env.FRONTEND_URL}/booking/payment-failed?error=callback_error`);
  }
};

/**
 * Handle eSewa payment failure callback
 * GET /api/bookings/payment/esewa/failure
 */
export const esewaPaymentFailure = async (req, res) => {
  try {
    const { pid } = req.query;

    console.log("❌ eSewa failure callback:", { pid });

    // Find and update booking
    const booking = await prisma.booking.findFirst({
      where: { 
        paymentTransactionId: pid,
        status: "PENDING"
      }
    });
if (booking) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: "FAILED",
          paymentStatus: "FAILED",
        }
      });
      console.log("💔 Booking marked as failed:", booking.id);
    }

    res.redirect(`${process.env.FRONTEND_URL}/booking/payment-failed?bookingId=${booking?.id || 'unknown'}`);

  } catch (error) {
    console.error("❌ eSewa failure callback error:", error);
    res.redirect(`${process.env.FRONTEND_URL}/booking/payment-failed?error=callback_error`);
  }
};

export const completeExpiredBookings = async () => {
  const now = new Date();

  const bookings = await prisma.booking.findMany({
    where: { status: "CONFIRMED" },
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
          completedAt: now,
        },
      });
    }
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
    res
      .status(500)
      .json({ error: err.message || "Failed to get availability" });
  }
}

/**
 * Get user's bookings
 * GET /api/bookings/user
 */
export async function getUserBookings(req, res) {
  try {
    const userId = Number(req.user.userId); // Add Number() conversion
    console.log("Fetching bookings for user ID:", userId); // Debug log

    const bookings = await prisma.booking.findMany({
      where: {
        userId: userId, // filter by the logged in user
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

    const normalizedBookings = bookings.map((b) => ({
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
    const hostId = Number(req.user.userId); // Add Number() conversion
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
    const userId = Number(req.user.userId); // Add Number() conversion
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
