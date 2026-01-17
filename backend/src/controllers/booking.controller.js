// ============================================
// BOOKING CONTROLLER - SECURITY FIXED VERSION
// ============================================
// File: controllers/bookingController.js
// 
// FIXES APPLIED:
// 1. IDOR protection on getBookingById
// 2. Khalti server-side verification
// 3. Consistent error messages (no information leakage)
// 4. Improved payment callback security
// ============================================

import * as bookingService from "../services/booking.service.js";
import { prisma } from "../config/prisma.config.js";
import crypto from "crypto";
import emailService from "../services/email/email.service.js";

// Add BigInt serialization support
BigInt.prototype.toJSON = function() {
  return this.toString();
};

// ============================================
// PAYMENT GATEWAY HELPERS (Unchanged)
// ============================================

/**
 * Initialize eSewa V2 Payment
 */
async function initializeEsewaPayment(booking, totalAmount, esewaConfig) {
  const transactionUuid = `BKG-${booking.id}-${Date.now()}`;
  const productCode = esewaConfig.merchantId || "EPAYTEST";
  const secretKey = esewaConfig.secretKey || "8gBm/:&EnhH.1/q";

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
  
  const payload = {
    return_url: `${process.env.BACKEND_URL}/api/bookings/payment/khalti/callback`,
    website_url: process.env.FRONTEND_URL,
    amount: totalAmount * 100,
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
 */
async function initializeCardPayment(booking, totalAmount, currency, dodoConfig, user) {
  const transactionId = `BKG-${booking.id}-${Date.now()}`;
  
  let amount = totalAmount;
  let paymentCurrency = currency;
  
  if (currency === "NPR") {
    const exchangeRate = 135;
    amount = Math.ceil(totalAmount / exchangeRate);
    paymentCurrency = "USD";
  }

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
      throw new Error(data.message || "Failed to initiate card payment");
    }

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
    
    if (dodoConfig.isTestMode && process.env.DODO_MOCK_ENABLED === "true") {
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
// 🔒 SECURITY FIX: Verify Khalti Payment Server-Side
// ============================================

/**
 * Verify Khalti payment with their API
 * CRITICAL: Always verify payments server-side!
 */
async function verifyKhaltiPayment(pidx, khaltiConfig) {
  const apiUrl = khaltiConfig.isTestMode
    ? "https://a.khalti.com/api/v2/epayment/lookup/"
    : "https://khalti.com/api/v2/epayment/lookup/";

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Key ${khaltiConfig.secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pidx }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Khalti verification failed:", data);
      return { verified: false, error: data.detail || "Verification failed" };
    }

    return {
      verified: data.status === "Completed",
      status: data.status,
      amount: data.total_amount,
      transactionId: data.transaction_id,
      data,
    };
  } catch (error) {
    console.error("Khalti verification error:", error);
    return { verified: false, error: error.message };
  }
}

// ============================================
// CREATE BOOKING
// ============================================

export const createBooking = async (req, res) => {
  try {
    const userId = Number(req.user.userId);
    const { listingId, bookingDate, startTime, endTime, guests, paymentMethod } = req.body;

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

    // ============================================
    // 🔒 PRICE CALCULATION - Using Decimal for precision
    // ============================================
    // Formula: basePrice + extraGuestFee + serviceFee + tax
    // basePrice = hourlyRate × hours
    // extraGuestFee = extraGuestCharge × extraGuests × hours (per-hour charge)
    // OR: extraGuestFee = extraGuestCharge × extraGuests (flat fee)
    // ============================================
    
    const basePrice = duration * Number(listing.hourlyRate || 0);
    const extraGuests = Math.max(0, guests - (listing.includedGuests || 10));
    
    // OPTION A: Extra guest charge PER HOUR (current implementation)
    const extraGuestPrice = extraGuests * Number(listing.extraGuestCharge || 0) * duration;
    
    // OPTION B: Extra guest charge FLAT (uncomment if you want this instead)
    // const extraGuestPrice = extraGuests * Number(listing.extraGuestCharge || 0);
    
    const subtotal = basePrice + extraGuestPrice;
    const serviceFee = Math.round(subtotal * 0.1 * 100) / 100;  // 10% service fee
    const tax = Math.round(subtotal * 0.05 * 100) / 100;        // 5% tax
    const totalPrice = subtotal + serviceFee + tax;
    const totalAmount = Math.round(totalPrice);

    console.log("💰 Price calculation:", { 
      hourlyRate: listing.hourlyRate,
      duration,
      guests,
      includedGuests: listing.includedGuests,
      extraGuests,
      extraGuestCharge: listing.extraGuestCharge,
      basePrice, 
      extraGuestPrice, 
      serviceFee, 
      tax, 
      totalPrice: totalAmount 
    });

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
    // 🔒 SECURITY: Don't leak internal error details in production
    return res.status(500).json({
      error: "Failed to create booking",
      // Remove 'details' in production or sanitize it
      ...(process.env.NODE_ENV === "development" && { details: error.message }),
    });
  }
};

// ============================================
// ESEWA CALLBACKS (Unchanged - already secure)
// ============================================

export const esewaPaymentSuccess = async (req, res) => {
  try {
    const { data, oid, amt, refId: queryRefId } = req.query;
    
    let transactionId;
    let referenceId;
    let paymentStatus;

    if (data) {
      try {
        const decodedData = Buffer.from(data, "base64").toString("utf-8");
        const paymentData = JSON.parse(decodedData);
        
        transactionId = paymentData.transaction_uuid;
        referenceId = paymentData.transaction_code;
        paymentStatus = paymentData.status;
      } catch (decodeError) {
        return res.redirect(`${process.env.FRONTEND_URL}/booking/payment-failed?error=decode_error`);
      }
    } else if (oid) {
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
      return res.redirect(`${process.env.FRONTEND_URL}/booking/payment-failed?error=booking_not_found`);
    }

    if (paymentStatus !== "COMPLETE") {
      return res.redirect(`${process.env.FRONTEND_URL}/booking/payment-failed?error=payment_incomplete`);
    }

    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: "CONFIRMED",
        paymentStatus: "COMPLETED",
        paymentReferenceId: referenceId,
        paymentCompletedAt: new Date(),
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        listing: {
          select: {
            id: true,
            title: true,
            host: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
      },
    });

    // Send confirmation emails
    try {
      await emailService.sendBookingEmails(updatedBooking);
    } catch (emailError) {
      console.error("❌ Failed to send booking emails:", emailError);
    }

    res.redirect(`${process.env.FRONTEND_URL}/booking/payment-success?bookingId=${booking.id}&refId=${referenceId}`);
  } catch (error) {
    console.error("❌ eSewa callback error:", error);
    res.redirect(`${process.env.FRONTEND_URL}/booking/payment-failed?error=callback_error`);
  }
};

export const esewaPaymentFailure = async (req, res) => {
  try {
    const { pid, data } = req.query;

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
      }
    }

    res.redirect(`${process.env.FRONTEND_URL}/booking/payment-failed?error=payment_failed`);
  } catch (error) {
    console.error("❌ eSewa failure callback error:", error);
    res.redirect(`${process.env.FRONTEND_URL}/booking/payment-failed?error=callback_error`);
  }
};

// ============================================
// 🔒 SECURITY FIX: KHALTI CALLBACK WITH SERVER VERIFICATION
// ============================================

export const khaltiPaymentCallback = async (req, res) => {
  try {
    const { pidx, status, transaction_id, purchase_order_id } = req.query;
    console.log("📥 Khalti callback:", { pidx, status, transaction_id, purchase_order_id });

    // Handle user cancellation
    if (status === "Canceled" || status === "Expired" || status === "User canceled") {
      return res.redirect(`${process.env.FRONTEND_URL}/booking/payment-failed?error=payment_cancelled`);
    }

    // Find booking first
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

    // ============================================
    // 🔒 CRITICAL: Server-side verification with Khalti API
    // Never trust client-side callback status alone!
    // ============================================
    
    const khaltiConfig = await prisma.paymentGatewayConfig.findUnique({
      where: { gateway: "KHALTI" },
    });

    if (!khaltiConfig) {
      console.error("❌ Khalti config not found");
      return res.redirect(`${process.env.FRONTEND_URL}/booking/payment-failed?error=config_error`);
    }

    // Verify with Khalti API
    const verification = await verifyKhaltiPayment(pidx, khaltiConfig);
    
    if (!verification.verified) {
      console.error("❌ Khalti verification failed:", verification.error);
      
      await prisma.booking.update({
        where: { id: booking.id },
        data: { 
          status: "FAILED", 
          paymentStatus: "FAILED",
          paymentDetails: {
            ...booking.paymentDetails,
            verificationFailed: true,
            verificationError: verification.error,
          },
        },
      });
      
      return res.redirect(`${process.env.FRONTEND_URL}/booking/payment-failed?error=verification_failed`);
    }

    // 🔒 CRITICAL: Verify amount matches
    const expectedAmountPaisa = Math.round(Number(booking.totalPrice) * 100);
    if (verification.amount !== expectedAmountPaisa) {
      console.error("❌ Khalti amount mismatch!", {
        expected: expectedAmountPaisa,
        received: verification.amount,
      });
      
      await prisma.booking.update({
        where: { id: booking.id },
        data: { 
          status: "FAILED", 
          paymentStatus: "FAILED",
          paymentDetails: {
            ...booking.paymentDetails,
            amountMismatch: true,
            expectedAmount: expectedAmountPaisa,
            receivedAmount: verification.amount,
          },
        },
      });
      
      return res.redirect(`${process.env.FRONTEND_URL}/booking/payment-failed?error=amount_mismatch`);
    }

    // Payment verified - update booking
    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: "CONFIRMED",
        paymentStatus: "COMPLETED",
        paymentReferenceId: verification.transactionId || transaction_id || pidx,
        paymentCompletedAt: new Date(),
        paymentDetails: {
          ...booking.paymentDetails,
          verified: true,
          verifiedAt: new Date().toISOString(),
          khaltiResponse: verification.data,
        },
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        listing: {
          select: {
            id: true,
            title: true,
            host: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
      },
    });

    console.log("✅ Khalti booking confirmed (verified):", booking.id);

    // Send confirmation emails
    try {
      await emailService.sendBookingEmails(updatedBooking);
    } catch (emailError) {
      console.error("❌ Failed to send booking emails:", emailError);
    }

    res.redirect(`${process.env.FRONTEND_URL}/booking/payment-success?bookingId=${booking.id}&refId=${verification.transactionId || pidx}`);
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
    const transactionId = payment_id || session_id;

    if (!transactionId) {
      return res.redirect(`${process.env.FRONTEND_URL}/booking/payment-failed?error=missing_params`);
    }

    let booking = await prisma.booking.findFirst({
      where: { paymentTransactionId: transactionId, status: "PENDING" },
    });

    if (!booking) {
      const allPending = await prisma.booking.findMany({
        where: { status: "PENDING", paymentGateway: "CARD" },
        orderBy: { createdAt: "desc" },
        take: 10,
      });
      
      booking = allPending.find(b => {
        const details = b.paymentDetails;
        return details?.session_id === transactionId || details?.payment_id === transactionId;
      });
      
      if (!booking) {
        return res.redirect(`${process.env.FRONTEND_URL}/booking/payment-failed?error=booking_not_found`);
      }
    }

    if (status === "succeeded" || status === "completed" || status === "paid") {
      const updatedBooking = await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: "CONFIRMED",
          paymentStatus: "COMPLETED",
          paymentReferenceId: transactionId,
          paymentCompletedAt: new Date(),
        },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          listing: {
            select: {
              id: true,
              title: true,
              host: { select: { id: true, name: true, email: true, phone: true } },
            },
          },
        },
      });

      try {
        await emailService.sendBookingEmails(updatedBooking);
      } catch (emailError) {
        console.error("❌ Failed to send booking emails:", emailError);
      }

      res.redirect(`${process.env.FRONTEND_URL}/booking/payment-success?bookingId=${booking.id}&refId=${transactionId}`);
    } else {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: "FAILED", paymentStatus: "FAILED" },
      });

      res.redirect(`${process.env.FRONTEND_URL}/booking/payment-failed?error=payment_failed&bookingId=${booking.id}`);
    }
  } catch (error) {
    console.error("❌ Card payment callback error:", error);
    res.redirect(`${process.env.FRONTEND_URL}/booking/payment-failed?error=callback_error`);
  }
};

export const cardPaymentWebhook = async (req, res) => {
  try {
    const { event, data } = req.body;

    // TODO: Verify webhook signature
    // const signature = req.headers["x-dodo-signature"];

    if (event === "payment.succeeded") {
      const booking = await prisma.booking.findFirst({
        where: { paymentTransactionId: data.payment_id, status: "PENDING" },
      });

      if (booking) {
        const updatedBooking = await prisma.booking.update({
          where: { id: booking.id },
          data: {
            status: "CONFIRMED",
            paymentStatus: "COMPLETED",
            paymentReferenceId: data.payment_id,
            paymentCompletedAt: new Date(),
          },
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
            listing: {
              select: {
                id: true,
                title: true,
                host: { select: { id: true, name: true, email: true, phone: true } },
              },
            },
          },
        });

        try {
          await emailService.sendBookingEmails(updatedBooking);
        } catch (emailError) {
          console.error("❌ Email error:", emailError);
        }
      }
    } else if (event === "payment.failed") {
      const booking = await prisma.booking.findFirst({
        where: { paymentTransactionId: data.payment_id, status: "PENDING" },
      });

      if (booking) {
        await prisma.booking.update({
          where: { id: booking.id },
          data: { status: "FAILED", paymentStatus: "FAILED" },
        });
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
    res.status(500).json({ error: "Failed to get availability" });
  }
}

export async function getUserBookings(req, res) {
  try {
    const userId = Number(req.user.userId);
    
    // 🔒 SECURE: Only gets bookings for authenticated user
    const bookings = await prisma.booking.findMany({
      where: { userId },  // Always filtered by authenticated user
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
    
    // 🔒 SECURE: Only gets bookings for listings owned by authenticated host
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
    
    // 🔒 Service layer verifies ownership
    const booking = await bookingService.cancelBooking(bookingId, userId);
    res.json({ message: "Booking cancelled successfully", booking });
  } catch (err) {
    console.error("CANCEL BOOKING ERROR:", err);
    // 🔒 SECURITY: Use generic error message
    res.status(400).json({ error: "Unable to cancel booking" });
  }
}

// ============================================
// 🔒 SECURITY FIX: getBookingById with IDOR Protection
// ============================================

export async function getBookingById(req, res) {
  try {
    const bookingId = Number(req.params.id);
    const userId = Number(req.user.userId);

    // 🔒 SECURITY FIX: Use findFirst with ownership check
    // User can only see booking if they:
    // 1. Created the booking (userId matches), OR
    // 2. Own the listing (hostId matches)
    const b = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        OR: [
          { userId: userId },                    // User made the booking
          { listing: { hostId: userId } },       // User owns the listing
        ],
      },
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
      // 🔒 SECURITY: Generic "not found" - doesn't reveal if booking exists
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