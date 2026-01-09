// ============================================
// BOOKING CONTROLLER - Multi-Gateway Support
// ============================================
// Supports: eSewa, Khalti, Card (Dodo)
// ============================================

import * as bookingService from "../services/bookingService.js";
import { prisma } from "../config/prisma.js";
import crypto from "crypto";

// Add BigInt serialization support
BigInt.prototype.toJSON = function() {
  return this.toString();
};

// ============================================
// PAYMENT GATEWAY HELPERS
// ============================================

/**
 * Initialize eSewa V2 Payment
 */
async function initializeEsewaPayment(booking, totalAmount, esewaConfig) {
  const transactionUuid = `BKG-${booking.id}-${Date.now()}`;
  const productCode = esewaConfig.merchantId || "EPAYTEST";
  const secretKey = esewaConfig.secretKey || "8gBm/:&EnhH.1/q";

  // Create signature
  const signatureString = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(signatureString)
    .digest("base64");

  const params = {
    amount: totalAmount.toString(),
    tax_amount: "0",
    total_amount: totalAmount.toString(),
    transaction_uuid: transactionUuid,
    product_code: productCode,
    product_service_charge: "0",
    product_delivery_charge: "0",
    success_url: `${process.env.BACKEND_URL}/api/bookings/payment/esewa/success`,
    failure_url: `${process.env.BACKEND_URL}/api/bookings/payment/esewa/failure`,
    signed_field_names: "total_amount,transaction_uuid,product_code",
    signature: signature,
  };

  const url = esewaConfig.isTestMode
    ? "https://rc-epay.esewa.com.np/api/epay/main/v2/form"
    : "https://epay.esewa.com.np/api/epay/main/v2/form";

  return {
    gateway: "ESEWA",
    transactionId: transactionUuid,
    url,
    method: "POST",
    params,
  };
}

/**
 * Initialize Khalti Payment
 */
async function initializeKhaltiPayment(booking, totalAmount, khaltiConfig, user) {
  const transactionId = `BKG-${booking.id}-${Date.now()}`;
  
  // Khalti V2 API
  const payload = {
    return_url: `${process.env.BACKEND_URL}/api/bookings/payment/khalti/callback`,
    website_url: process.env.FRONTEND_URL,
    amount: totalAmount * 100, // Khalti uses paisa
    purchase_order_id: transactionId,
    purchase_order_name: `Booking #${booking.id}`,
    customer_info: {
      name: user?.name || "Guest",
      email: user?.email || "",
      phone: user?.phone || "",
    },
  };

  const apiUrl = khaltiConfig.isTestMode
    ? "https://a.khalti.com/api/v2/epayment/initiate/"
    : "https://khalti.com/api/v2/epayment/initiate/";

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Key ${khaltiConfig.secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || !data.payment_url) {
      console.error("Khalti initiation failed:", data);
      throw new Error(data.detail || "Failed to initiate Khalti payment");
    }

    console.log("✅ Khalti payment initiated:", data);

    return {
      gateway: "KHALTI",
      transactionId: data.pidx || transactionId,
      url: data.payment_url,
      method: "REDIRECT",
      params: { pidx: data.pidx },
    };
  } catch (error) {
    console.error("Khalti API error:", error);
    throw new Error("Failed to initialize Khalti payment");
  }
}

/**
 * Initialize Card Payment (Dodo)
 * Dodo Payments API: https://docs.dodopayments.com
 */
async function initializeCardPayment(booking, totalAmount, currency, dodoConfig, user) {
  const transactionId = `BKG-${booking.id}-${Date.now()}`;
  
  // Convert NPR to USD if needed
  let amount = totalAmount;
  let paymentCurrency = currency;
  
  if (currency === "NPR") {
    // Convert to USD (use real exchange rate in production)
    const exchangeRate = 135; // 1 USD = ~135 NPR
    amount = Math.ceil(totalAmount / exchangeRate);
    paymentCurrency = "USD";
  }

  // Dodo checkout session payload
  const payload = {
    billing: {
      city: "Kathmandu",
      country: user?.country || "NP",
      state: "Bagmati",
      street: "N/A",
      zipcode: "44600",
    },
    customer: {
      email: user?.email || "customer@example.com",
      name: user?.name || "Guest",
    },
    payment_link: false,
    product_cart: [
      {
        product_id: `booking-${booking.id}`,
        quantity: 1,
      },
    ],
    return_url: `${process.env.BACKEND_URL}/api/bookings/payment/card/callback`,
    metadata: {
      booking_id: booking.id.toString(),
      transaction_id: transactionId,
    },
  };

  const apiUrl = dodoConfig.isTestMode
    ? "https://test.dodopayments.com/checkout/sessions"
    : "https://api.dodopayments.com/checkout/sessions";

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${dodoConfig.secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Dodo initiation failed:", data);
      throw new Error(data.message || "Failed to initiate card payment");
    }

    console.log("✅ Dodo payment initiated:", data);

    return {
      gateway: "CARD",
      transactionId: data.payment_id || transactionId,
      url: data.url,
      method: "REDIRECT",
      params: { 
        session_id: data.payment_id,
        payment_link: data.payment_link,
      },
    };
  } catch (error) {
    console.error("Dodo API error:", error);
    
    // For testing without real Dodo account
    if (dodoConfig.isTestMode && process.env.DODO_MOCK_ENABLED === "true") {
      console.log("⚠️ Using mock Dodo response");
      return {
        gateway: "CARD",
        transactionId: transactionId,
        url: `${process.env.FRONTEND_URL}/booking/mock-payment?bookingId=${booking.id}&amount=${amount}&transactionId=${transactionId}`,
        method: "REDIRECT",
        params: { mock: true },
      };
    }
    
    throw new Error("Failed to initialize card payment. Please try another payment method.");
  }
}

// ============================================
// CREATE BOOKING
// ============================================

export const createBooking = async (req, res) => {
  try {
    const userId = Number(req.user.userId);
    const { listingId, bookingDate, startTime, endTime, guests, paymentMethod } = req.body;

    console.log("📝 Creating booking:", {
      userId,
      listingId,
      bookingDate,
      startTime,
      endTime,
      guests,
      paymentMethod,
    });

    // Validate payment method
    const validMethods = ["ESEWA", "KHALTI", "CARD"];
    if (!paymentMethod || !validMethods.includes(paymentMethod)) {
      return res.status(400).json({ error: "Invalid payment method. Choose ESEWA, KHALTI, or CARD." });
    }

    // Get user with country
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, phone: true, country: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Validate payment method for user's country
    if (user.country !== "NP" && (paymentMethod === "ESEWA" || paymentMethod === "KHALTI")) {
      return res.status(400).json({ 
        error: "eSewa and Khalti are only available for users in Nepal. Please use Card payment." 
      });
    }

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
    const totalAmount = Math.round(totalPrice);

    console.log("💰 Price calculation:", { basePrice, extraGuestPrice, serviceFee, tax, totalPrice: totalAmount });

    // Create booking
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
        paymentGateway: paymentMethod,
      },
      include: {
        listing: { select: { id: true, title: true } },
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    console.log("✅ Booking created:", booking.id);

    // Get payment gateway config
    const gatewayName = paymentMethod === "CARD" ? "DODO" : paymentMethod;
    const gatewayConfig = await prisma.paymentGatewayConfig.findUnique({
      where: { gateway: gatewayName },
    });

    if (!gatewayConfig || !gatewayConfig.isActive) {
      await prisma.booking.delete({ where: { id: booking.id } });
      return res.status(500).json({ error: `${paymentMethod} payment is currently unavailable` });
    }

    // Initialize payment based on method
    let paymentData;
    const currency = user.country === "NP" ? "NPR" : "USD";

    try {
      switch (paymentMethod) {
        case "ESEWA":
          paymentData = await initializeEsewaPayment(booking, totalAmount, gatewayConfig);
          break;
        case "KHALTI":
          paymentData = await initializeKhaltiPayment(booking, totalAmount, gatewayConfig, user);
          break;
        case "CARD":
          paymentData = await initializeCardPayment(booking, totalAmount, currency, gatewayConfig, user);
          break;
      }
    } catch (paymentError) {
      console.error("Payment initialization error:", paymentError);
      await prisma.booking.delete({ where: { id: booking.id } });
      return res.status(500).json({ error: paymentError.message });
    }

    // Update booking with payment details
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        paymentTransactionId: paymentData.transactionId,
        paymentDetails: paymentData.params || {},
      },
    });

    console.log(`🚀 ${paymentMethod} payment initialized:`, paymentData.url);

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
        gateway: paymentData.gateway,
        url: paymentData.url,
        method: paymentData.method,
        params: paymentData.params,
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

// ============================================
// ESEWA CALLBACKS
// ============================================

export const esewaPaymentSuccess = async (req, res) => {
  try {
    const { data, oid, amt, refId: queryRefId } = req.query;
    
    console.log("📥 eSewa callback received:", { data: !!data, oid, amt, queryRefId });
    
    let transactionId;
    let referenceId;
    let paymentStatus;

    if (data) {
      try {
        const decodedData = Buffer.from(data, "base64").toString("utf-8");
        const paymentData = JSON.parse(decodedData);
        console.log("✅ eSewa V2 decoded:", paymentData);
        
        transactionId = paymentData.transaction_uuid;
        referenceId = paymentData.transaction_code;
        paymentStatus = paymentData.status;
      } catch (decodeError) {
        console.error("❌ Decode error:", decodeError);
        return res.redirect(`${process.env.FRONTEND_URL}/booking/payment-failed?error=decode_error`);
      }
    } else if (oid) {
      console.log("✅ eSewa V1 params:", { oid, amt, queryRefId });
      transactionId = oid;
      referenceId = queryRefId;
      paymentStatus = "COMPLETE";
    } else {
      return res.redirect(`${process.env.FRONTEND_URL}/booking/payment-failed?error=missing_params`);
    }

    if (!transactionId) {
      return res.redirect(`${process.env.FRONTEND_URL}/booking/payment-failed?error=missing_params`);
    }

    const booking = await prisma.booking.findFirst({
      where: { paymentTransactionId: transactionId, status: "PENDING" },
    });

    if (!booking) {
      console.log("❌ Booking not found:", transactionId);
      return res.redirect(`${process.env.FRONTEND_URL}/booking/payment-failed?error=booking_not_found`);
    }

    if (paymentStatus !== "COMPLETE") {
      return res.redirect(`${process.env.FRONTEND_URL}/booking/payment-failed?error=payment_incomplete`);
    }

    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: "CONFIRMED",
        paymentStatus: "COMPLETED",
        paymentReferenceId: referenceId,
        paymentCompletedAt: new Date(),
      },
    });

    console.log("✅ Booking confirmed:", booking.id);
    res.redirect(`${process.env.FRONTEND_URL}/booking/payment-success?bookingId=${booking.id}&refId=${referenceId}`);
  } catch (error) {
    console.error("❌ eSewa callback error:", error);
    res.redirect(`${process.env.FRONTEND_URL}/booking/payment-failed?error=callback_error`);
  }
};

export const esewaPaymentFailure = async (req, res) => {
  try {
    const { pid, data } = req.query;
    console.log("❌ eSewa failure:", { pid, data: !!data });

    let transactionId = pid;
    if (data && !pid) {
      try {
        const decoded = JSON.parse(Buffer.from(data, "base64").toString("utf-8"));
        transactionId = decoded.transaction_uuid;
      } catch (e) {}
    }

    if (transactionId) {
      const booking = await prisma.booking.findFirst({
        where: { paymentTransactionId: transactionId, status: "PENDING" },
      });
      if (booking) {
        await prisma.booking.update({
          where: { id: booking.id },
          data: { status: "FAILED", paymentStatus: "FAILED" },
        });
        console.log("💔 Booking marked as failed:", booking.id);
      }
    }

    res.redirect(`${process.env.FRONTEND_URL}/booking/payment-failed?error=payment_failed`);
  } catch (error) {
    console.error("❌ eSewa failure callback error:", error);
    res.redirect(`${process.env.FRONTEND_URL}/booking/payment-failed?error=callback_error`);
  }
};

// ============================================
// KHALTI CALLBACKS
// ============================================

export const khaltiPaymentCallback = async (req, res) => {
  try {
    const { pidx, status, transaction_id, purchase_order_id } = req.query;
    console.log("📥 Khalti callback:", { pidx, status, transaction_id, purchase_order_id });

    // Handle different status values
    if (status === "Canceled" || status === "Expired" || status === "User canceled") {
      return res.redirect(`${process.env.FRONTEND_URL}/booking/payment-failed?error=payment_cancelled`);
    }

    if (status !== "Completed") {
      return res.redirect(`${process.env.FRONTEND_URL}/booking/payment-failed?error=payment_${status?.toLowerCase() || 'failed'}`);
    }

    // Find booking by pidx or purchase_order_id
    const booking = await prisma.booking.findFirst({
      where: {
        OR: [
          { paymentTransactionId: pidx },
          { paymentTransactionId: purchase_order_id },
        ],
        status: "PENDING",
      },
    });

    if (!booking) {
      console.log("❌ Booking not found for Khalti:", { pidx, purchase_order_id });
      return res.redirect(`${process.env.FRONTEND_URL}/booking/payment-failed?error=booking_not_found`);
    }

    // TODO: Verify payment with Khalti lookup API for production
    // const verified = await verifyKhaltiPayment(pidx, khaltiConfig);

    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: "CONFIRMED",
        paymentStatus: "COMPLETED",
        paymentReferenceId: transaction_id || pidx,
        paymentCompletedAt: new Date(),
      },
    });

    console.log("✅ Khalti booking confirmed:", booking.id);
    res.redirect(`${process.env.FRONTEND_URL}/booking/payment-success?bookingId=${booking.id}&refId=${transaction_id || pidx}`);
  } catch (error) {
    console.error("❌ Khalti callback error:", error);
    res.redirect(`${process.env.FRONTEND_URL}/booking/payment-failed?error=callback_error`);
  }
};

// ============================================
// CARD (DODO) CALLBACKS
// ============================================

export const cardPaymentCallback = async (req, res) => {
  try {
    const { payment_id, status, session_id } = req.query;
    console.log("📥 Card payment callback:", { payment_id, status, session_id });

    // Dodo sends payment_id in callback
    const transactionId = payment_id || session_id;

    if (!transactionId) {
      return res.redirect(`${process.env.FRONTEND_URL}/booking/payment-failed?error=missing_params`);
    }

    // Find booking
    const booking = await prisma.booking.findFirst({
      where: { 
        paymentTransactionId: transactionId,
        status: "PENDING",
      },
    });

    if (!booking) {
      // Try to find by metadata (Dodo might use different ID)
      const allPending = await prisma.booking.findMany({
        where: { status: "PENDING", paymentGateway: "CARD" },
        orderBy: { createdAt: "desc" },
        take: 10,
      });
      
      // Find booking where paymentDetails contains this transaction
      const foundBooking = allPending.find(b => {
        const details = b.paymentDetails;
        return details?.session_id === transactionId || 
               details?.payment_id === transactionId;
      });
      
      if (!foundBooking) {
        console.log("❌ Booking not found for card payment:", transactionId);
        return res.redirect(`${process.env.FRONTEND_URL}/booking/payment-failed?error=booking_not_found`);
      }
    }

    const bookingToUpdate = booking || foundBooking;

    // Check status
    if (status === "succeeded" || status === "completed" || status === "paid") {
      await prisma.booking.update({
        where: { id: bookingToUpdate.id },
        data: {
          status: "CONFIRMED",
          paymentStatus: "COMPLETED",
          paymentReferenceId: transactionId,
          paymentCompletedAt: new Date(),
        },
      });

      console.log("✅ Card payment booking confirmed:", bookingToUpdate.id);
      res.redirect(`${process.env.FRONTEND_URL}/booking/payment-success?bookingId=${bookingToUpdate.id}&refId=${transactionId}`);
    } else {
      await prisma.booking.update({
        where: { id: bookingToUpdate.id },
        data: {
          status: "FAILED",
          paymentStatus: "FAILED",
        },
      });

      console.log("💔 Card payment failed:", bookingToUpdate.id);
      res.redirect(`${process.env.FRONTEND_URL}/booking/payment-failed?error=payment_failed&bookingId=${bookingToUpdate.id}`);
    }
  } catch (error) {
    console.error("❌ Card payment callback error:", error);
    res.redirect(`${process.env.FRONTEND_URL}/booking/payment-failed?error=callback_error`);
  }
};

// Dodo Webhook Handler (for async notifications)
export const cardPaymentWebhook = async (req, res) => {
  try {
    const { event, data } = req.body;
    console.log("📥 Dodo webhook:", { event, paymentId: data?.payment_id });

    // Verify webhook signature (important for production)
    // const signature = req.headers["x-dodo-signature"];
    // const isValid = verifyDodoSignature(req.body, signature, webhookSecret);

    if (event === "payment.succeeded") {
      const booking = await prisma.booking.findFirst({
        where: { paymentTransactionId: data.payment_id, status: "PENDING" },
      });

      if (booking) {
        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            status: "CONFIRMED",
            paymentStatus: "COMPLETED",
            paymentReferenceId: data.payment_id,
            paymentCompletedAt: new Date(),
          },
        });
        console.log("✅ Webhook: Booking confirmed:", booking.id);
      }
    } else if (event === "payment.failed") {
      const booking = await prisma.booking.findFirst({
        where: { paymentTransactionId: data.payment_id, status: "PENDING" },
      });

      if (booking) {
        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            status: "FAILED",
            paymentStatus: "FAILED",
          },
        });
        console.log("💔 Webhook: Booking failed:", booking.id);
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error("❌ Dodo webhook error:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
};

// ============================================
// OTHER BOOKING ENDPOINTS
// ============================================

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
          canReview: true,
        },
      });
      console.log(`✅ Booking ${booking.id} marked as COMPLETED`);
    }
  }
};

export async function getAvailability(req, res) {
  try {
    const { listingId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: "Date parameter required" });
    }

    const slots = await bookingService.getAvailableTimeSlots(parseInt(listingId), date);
    res.json({ date, slots });
  } catch (err) {
    console.error("GET AVAILABILITY ERROR:", err);
    res.status(500).json({ error: err.message || "Failed to get availability" });
  }
}

export async function getUserBookings(req, res) {
  try {
    const userId = Number(req.user.userId);
    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: {
        listing: {
          include: {
            images: { where: { isCover: true }, take: 1 },
            host: {
              select: { id: true, name: true, email: true, profilePhoto: true },
            },
          },
        },
      },
      orderBy: { bookingDate: "desc" },
    });

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

export async function cancelBooking(req, res) {
  try {
    const userId = Number(req.user.userId);
    const bookingId = parseInt(req.params.id);
    const booking = await bookingService.cancelBooking(bookingId, userId);
    res.json({ message: "Booking cancelled successfully", booking });
  } catch (err) {
    console.error("CANCEL BOOKING ERROR:", err);
    res.status(400).json({ error: err.message || "Failed to cancel booking" });
  }
}

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
              select: { id: true, name: true, email: true, profilePhoto: true },
            },
          },
        },
        user: {
          select: { id: true, name: true, email: true, profilePhoto: true },
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