// ============================================
// UPDATED BOOKING CONTROLLER
// ============================================
// Replace your existing bookingController.js with this version
// Key changes:
// 1. Fixed callback URLs to point to frontend pages
// 2. Better error handling
// 3. Proper eSewa verification (TODO for production)
// ============================================

import * as bookingService from "../services/bookingService.js";
import { prisma } from "../config/prisma.js";
import crypto from "crypto"
// Add BigInt serialization support
BigInt.prototype.toJSON = function() {
  return this.toString();
};

/**
 * Create a new booking
 * POST /api/bookings
 */
export const createBooking = async (req, res) => {
  try {
    const userId = Number(req.user.userId);
    const { listingId, bookingDate, startTime, endTime, guests } = req.body;

    console.log("📝 Creating booking:", {
      userId: userId.toString(),
      listingId,
      bookingDate,
      startTime,
      endTime,
      guests,
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
    if (Number(listing.hostId) === userId) {
      return res.status(403).json({
        error: "You cannot book your own listing",
        code: "SELF_BOOKING_NOT_ALLOWED",
      });
    }

    // Calculate duration
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    const duration = (endH * 60 + endM - (startH * 60 + startM)) / 60;

    if (duration <= 0) {
      return res.status(400).json({ error: "End time must be after start time" });
    }

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
    
    
    const totalAmount = Math.round(Number(totalPrice));
    
    //esewa v2 api parameters
    const esewaParams = {
      amount: totalAmount,
  tax_amount: 0,
  total_amount: totalAmount,
  transaction_uuid: transactionUuid,
  product_code: esewaConfig.merchantId || "EPAYTEST",
  product_service_charge: 0,
  product_delivery_charge: 0,
  success_url: `${process.env.BACKEND_URL}/api/bookings/payment/esewa/success`,
  failure_url: `${process.env.BACKEND_URL}/api/bookings/payment/esewa/failure`,
  signed_field_names: "total_amount,transaction_uuid,product_code",
};

    console.log("💳 eSewa params:", esewaParams);
//Generate signature (required for v2)
    const signatureString = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${esewaParams.product_code}`;
const secret = esewaConfig.secretKey || "8gBm/:&EnhH.1/q"; // eSewa test secret key
    
const signature = crypto
  .createHmac("sha256",secret)
  .update(signatureString)
  .digest("base64")

  esewaParams.signature = signature;

// Update booking with payment details
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        paymentGateway: "ESEWA",
        paymentTransactionId: transactionUuid,
        paymentDetails: esewaParams,
      },
    });

    //esewaUrl V2 url
    const esewaUrl = esewaConfig.isTestMode
      ? "https://rc-epay.esewa.com.np/api/epay/main/v2/form"
  : "https://epay.esewa.com.np/api/epay/main/v2/form";

    console.log("🚀 Payment URL:", esewaUrl);

    // Return booking and payment info to frontend
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
      // ✅ Payment data for frontend to create form and redirect
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
 * 
 * eSewa redirects here after successful payment
 */
export const esewaPaymentSuccess = async (req, res) => {
  try {
    // Get query params (rename refId to queryRefId to avoid conflict)
    const { data, oid, amt, refId: queryRefId } = req.query;
    
    console.log("📥 eSewa callback received:", { data: !!data, oid, amt, queryRefId });
    
    let transactionId;
    let referenceId;
    let paymentStatus;

    if (data) {
      // V2 API - decode base64 response
      try {
        const decodedData = Buffer.from(data, "base64").toString("utf-8");
        const paymentData = JSON.parse(decodedData);
        
        console.log("✅ eSewa V2 success callback:", paymentData);
        
        transactionId = paymentData.transaction_uuid;
        referenceId = paymentData.transaction_code;
        paymentStatus = paymentData.status;
      } catch (decodeError) {
        console.error("❌ Failed to decode eSewa response:", decodeError);
        return res.redirect(`${process.env.FRONTEND_URL}/booking/payment-failed?error=decode_error`);
      }
    } else if (oid) {
      // V1 API fallback
      console.log("✅ eSewa V1 success callback:", { oid, amt, queryRefId });
      transactionId = oid;
      referenceId = queryRefId;
      paymentStatus = "COMPLETE";
    } else {
      console.log("❌ No valid payment data received");
      return res.redirect(`${process.env.FRONTEND_URL}/booking/payment-failed?error=missing_params`);
    }

    if (!transactionId) {
      console.log("❌ Missing transaction ID");
      return res.redirect(`${process.env.FRONTEND_URL}/booking/payment-failed?error=missing_params`);
    }

    // Find booking by transaction ID
    const booking = await prisma.booking.findFirst({
      where: { 
        paymentTransactionId: transactionId,  // ✅ Use transactionId, not oid
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
      console.log("❌ Booking not found for transaction:", transactionId);
      return res.redirect(`${process.env.FRONTEND_URL}/booking/payment-failed?error=booking_not_found`);
    }

    console.log("📦 Found booking:", booking.id);

    // Verify payment status
    if (paymentStatus !== "COMPLETE") {
      console.log("❌ Payment not complete:", paymentStatus);
      return res.redirect(`${process.env.FRONTEND_URL}/booking/payment-failed?error=payment_incomplete`);
    }

    // Update booking to CONFIRMED
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: "CONFIRMED",
        paymentStatus: "COMPLETED",
        paymentReferenceId: referenceId,
        paymentCompletedAt: new Date(),
      }
    });

    console.log("✅ Booking confirmed:", booking.id);

    // Redirect to frontend success page
    res.redirect(`${process.env.FRONTEND_URL}/booking/payment-success?bookingId=${booking.id}&refId=${referenceId}`);

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

    let bookingId = "unknown";

    if (pid) {
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
        bookingId = booking.id;
        console.log("💔 Booking marked as failed:", booking.id);
      }
    }

    res.redirect(`${process.env.FRONTEND_URL}/booking/payment-failed?bookingId=${bookingId}&error=payment_failed`);

  } catch (error) {
    console.error("❌ eSewa failure callback error:", error);
    res.redirect(`${process.env.FRONTEND_URL}/booking/payment-failed?error=callback_error`);
  }
};

/**
 * Verify eSewa payment (for production use)
 * This should be called to verify the payment is legitimate
 */
async function verifyEsewaPayment(oid, amt, refId, config) {
  try {
    const verifyUrl = config.isTestMode
      ? "https://uat.esewa.com.np/epay/transrec"
      : "https://esewa.com.np/epay/transrec";

    const response = await fetch(verifyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        amt: amt,
        scd: config.merchantId,
        rid: refId,
        pid: oid,
      }),
    });

    const text = await response.text();
    
    // eSewa returns XML with <response_code>Success</response_code> for valid payments
    return text.includes("Success");
  } catch (error) {
    console.error("eSewa verification error:", error);
    return false;
  }
}

/**
 * Mark expired bookings as completed
 * (Call this from a cron job)
 */
export const completeExpiredBookings = async () => {
  const now = new Date();

  const bookings = await prisma.booking.findMany({
    where: { status: "CONFIRMED" },
  });

  for (const booking of bookings) {
    const endDateTime = new Date(booking.bookingDate);
    const [h, m] = booking.endTime.split(":");
    endDateTime.setHours(parseInt(h), parseInt(m), 0, 0);

    if (endDateTime <= now) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: "COMPLETED",
          completedAt: now,
          canReview: true, // Enable review after completion
        },
      });
      console.log(`✅ Booking ${booking.id} marked as COMPLETED`);
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
    res.status(500).json({ error: err.message || "Failed to get availability" });
  }
}

/**
 * Get user's bookings
 * GET /api/bookings/user
 */
export async function getUserBookings(req, res) {
  try {
    const userId = Number(req.user.userId);
    console.log("Fetching bookings for user ID:", userId);

    const bookings = await prisma.booking.findMany({
      where: {
        userId: userId,
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

    console.log("Found bookings:", bookings.length);

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
    const hostId = Number(req.user.userId);
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
    const userId = Number(req.user.userId);
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