// ==========================================
// PAYMENT CONTROLLER
// ==========================================
// Handles payments via eSewa, Khalti (Nepal) and Dodo (International)
// ==========================================

import { PrismaClient } from "@prisma/client";
import { PAYMENT_GATEWAYS, PAYMENT_STATUS, calculateEndDate } from "../config/tierConfig.js";

const prisma = new PrismaClient();

// ==========================================
// INITIATE PAYMENT
// ==========================================

export const initiatePayment = async (req, res) => {
  try {
    const hostId = req.user.id;
    const { paymentId, gateway } = req.body;

    // Validate gateway
    if (!PAYMENT_GATEWAYS[gateway]) {
      return res.status(400).json({ error: "Invalid payment gateway" });
    }

    // Get payment
    const payment = await prisma.payment.findUnique({
      where: { id: parseInt(paymentId) },
      include: {
        subscription: {
          include: { tier: true },
        },
      },
    });

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    if (payment.hostId !== hostId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (payment.status !== "PENDING") {
      return res.status(400).json({ error: `Payment is already ${payment.status.toLowerCase()}` });
    }

    // Update payment with selected gateway
    await prisma.payment.update({
      where: { id: payment.id },
      data: { gateway },
    });

    // Generate payment URL based on gateway
    let paymentUrl = null;
    let paymentData = null;

    switch (gateway) {
      case "ESEWA":
        paymentData = await initiateEsewaPayment(payment);
        break;
      case "KHALTI":
        paymentData = await initiateKhaltiPayment(payment);
        break;
      case "DODO":
        paymentData = await initiateDodoPayment(payment);
        break;
      default:
        return res.status(400).json({ error: "Gateway not supported" });
    }

    res.json({
      message: "Payment initiated",
      gateway,
      ...paymentData,
    });
  } catch (error) {
    console.error("Initiate payment error:", error);
    res.status(500).json({ error: "Failed to initiate payment" });
  }
};

// ==========================================
// ESEWA PAYMENT (Nepal)
// ==========================================

async function initiateEsewaPayment(payment) {
  // Get eSewa config
  const config = await prisma.paymentGatewayConfig.findUnique({
    where: { gateway: "ESEWA" },
  });

  if (!config || !config.isActive) {
    throw new Error("eSewa is not configured");
  }

  // eSewa payment parameters
  const params = {
    amt: payment.amount,
    psc: 0, // Service charge
    pdc: 0, // Delivery charge
    txAmt: 0, // Tax amount
    tAmt: payment.amount, // Total amount
    pid: `PAY-${payment.id}-${Date.now()}`, // Unique product ID
    scd: config.merchantId, // Merchant code
    su: `${process.env.FRONTEND_URL}/payment/success?gateway=esewa`, // Success URL
    fu: `${process.env.FRONTEND_URL}/payment/failed?gateway=esewa`, // Failure URL
  };

  // Store transaction reference
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      gatewayTransactionId: params.pid,
      gatewayResponse: { initiated: true, params },
    },
  });

  // eSewa form URL (test or production)
  const baseUrl = config.isTestMode
    ? "https://uat.esewa.com.np/epay/main"
    : "https://esewa.com.np/epay/main";

  return {
    type: "form_redirect",
    url: baseUrl,
    method: "POST",
    params,
    instructions: "You will be redirected to eSewa to complete payment",
  };
}

// ==========================================
// KHALTI PAYMENT (Nepal)
// ==========================================

async function initiateKhaltiPayment(payment) {
  // Get Khalti config
  const config = await prisma.paymentGatewayConfig.findUnique({
    where: { gateway: "KHALTI" },
  });

  if (!config || !config.isActive) {
    throw new Error("Khalti is not configured");
  }

  // Khalti payment parameters
  const params = {
    return_url: `${process.env.FRONTEND_URL}/payment/success?gateway=khalti`,
    website_url: process.env.FRONTEND_URL,
    amount: payment.amount * 100, // Khalti uses paisa
    purchase_order_id: `PAY-${payment.id}`,
    purchase_order_name: payment.description,
    customer_info: {
      name: payment.host?.name || "Host",
      email: payment.host?.email || "",
    },
  };

  // TODO: Make actual API call to Khalti
  // const response = await fetch(`${config.baseUrl}/epayment/initiate/`, {
  //   method: "POST",
  //   headers: {
  //     "Authorization": `Key ${config.secretKey}`,
  //     "Content-Type": "application/json",
  //   },
  //   body: JSON.stringify(params),
  // });

  // PLACEHOLDER: Return mock data
  const mockPidx = `KHALTI-${payment.id}-${Date.now()}`;

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      gatewayTransactionId: mockPidx,
      gatewayResponse: { initiated: true, pidx: mockPidx },
    },
  });

  return {
    type: "redirect",
    url: config.isTestMode
      ? `https://test-pay.khalti.com/?pidx=${mockPidx}`
      : `https://pay.khalti.com/?pidx=${mockPidx}`,
    pidx: mockPidx,
    instructions: "You will be redirected to Khalti to complete payment",
  };
}

// ==========================================
// DODO PAYMENT (International)
// ==========================================

async function initiateDodoPayment(payment) {
  // Get Dodo config
  const config = await prisma.paymentGatewayConfig.findUnique({
    where: { gateway: "DODO" },
  });

  if (!config || !config.isActive) {
    throw new Error("Dodo Payments is not configured");
  }

  // Dodo payment parameters
  const params = {
    amount: payment.amount,
    currency: payment.currency,
    description: payment.description,
    order_id: `PAY-${payment.id}`,
    success_url: `${process.env.FRONTEND_URL}/payment/success?gateway=dodo`,
    cancel_url: `${process.env.FRONTEND_URL}/payment/cancelled?gateway=dodo`,
    webhook_url: `${process.env.API_URL}/api/payments/webhook/dodo`,
  };

  // TODO: Make actual API call to Dodo Payments
  // Placeholder for now
  const mockSessionId = `DODO-${payment.id}-${Date.now()}`;

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      gatewayTransactionId: mockSessionId,
      gatewayResponse: { initiated: true, sessionId: mockSessionId },
    },
  });

  return {
    type: "redirect",
    url: `https://checkout.dodopayments.com/${mockSessionId}`, // Placeholder URL
    sessionId: mockSessionId,
    instructions: "You will be redirected to complete payment",
  };
}

// ==========================================
// PAYMENT CALLBACKS / WEBHOOKS
// ==========================================

// eSewa Success Callback
export const esewaCallback = async (req, res) => {
  try {
    const { oid, amt, refId } = req.query;

    // Find payment by oid (our transaction ID)
    const payment = await prisma.payment.findFirst({
      where: { gatewayTransactionId: oid },
      include: { subscription: { include: { tier: true } } },
    });

    if (!payment) {
      return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?error=payment_not_found`);
    }

    // TODO: Verify with eSewa API
    // const verified = await verifyEsewaPayment(oid, amt, refId);

    // For now, assume success
    await completePayment(payment.id, refId, { oid, amt, refId });

    res.redirect(`${process.env.FRONTEND_URL}/payment/success?payment=${payment.id}`);
  } catch (error) {
    console.error("eSewa callback error:", error);
    res.redirect(`${process.env.FRONTEND_URL}/payment/failed?error=callback_error`);
  }
};

// Khalti Callback
export const khaltiCallback = async (req, res) => {
  try {
    const { pidx, status, transaction_id } = req.query;

    const payment = await prisma.payment.findFirst({
      where: { gatewayTransactionId: pidx },
      include: { subscription: { include: { tier: true } } },
    });

    if (!payment) {
      return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?error=payment_not_found`);
    }

    if (status === "Completed") {
      // TODO: Verify with Khalti API
      await completePayment(payment.id, transaction_id, { pidx, status, transaction_id });
      res.redirect(`${process.env.FRONTEND_URL}/payment/success?payment=${payment.id}`);
    } else {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          gatewayResponse: { ...payment.gatewayResponse, callback: { pidx, status } },
        },
      });
      res.redirect(`${process.env.FRONTEND_URL}/payment/failed?error=payment_${status.toLowerCase()}`);
    }
  } catch (error) {
    console.error("Khalti callback error:", error);
    res.redirect(`${process.env.FRONTEND_URL}/payment/failed?error=callback_error`);
  }
};

// Dodo Webhook
export const dodoWebhook = async (req, res) => {
  try {
    const { event, data } = req.body;

    // TODO: Verify webhook signature
    // const signature = req.headers["x-dodo-signature"];

    if (event === "payment.completed") {
      const payment = await prisma.payment.findFirst({
        where: { gatewayTransactionId: data.session_id },
      });

      if (payment) {
        await completePayment(payment.id, data.transaction_id, data);
      }
    } else if (event === "payment.failed") {
      const payment = await prisma.payment.findFirst({
        where: { gatewayTransactionId: data.session_id },
      });

      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "FAILED",
            gatewayResponse: data,
          },
        });
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Dodo webhook error:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
};

// ==========================================
// COMPLETE PAYMENT (Internal)
// ==========================================

async function completePayment(paymentId, transactionId, gatewayData) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      subscription: { include: { tier: true } },
      host: true,
    },
  });

  if (!payment || payment.status === "COMPLETED") {
    return;
  }

  // Update payment
  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: "COMPLETED",
      paidAt: new Date(),
      gatewayTransactionId: transactionId,
      gatewayResponse: gatewayData,
    },
  });

  // Update subscription
  if (payment.subscription) {
    const endDate = calculateEndDate(new Date(), payment.subscription.billingCycle);

    await prisma.hostSubscription.update({
      where: { id: payment.subscription.id },
      data: {
        status: "ACTIVE",
        startDate: new Date(),
        endDate,
        trialEndDate: null, // Clear trial
      },
    });

    // Update user
    await prisma.user.update({
      where: { id: payment.hostId },
      data: {
        currentTier: payment.subscription.tier.name,
        tierExpiresAt: endDate,
      },
    });

    // Log history
    await prisma.subscriptionHistory.create({
      data: {
        subscriptionId: payment.subscription.id,
        action: "payment_completed",
        toTier: payment.subscription.tier.name,
        details: { paymentId, amount: payment.amount, gateway: payment.gateway },
        changedByType: "system",
      },
    });
  }

  // TODO: Send confirmation email
}

// ==========================================
// GET PAYMENT HISTORY
// ==========================================

export const getPaymentHistory = async (req, res) => {
  try {
    const hostId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: { hostId },
        include: {
          subscription: {
            include: {
              tier: { select: { name: true, displayName: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.payment.count({ where: { hostId } }),
    ]);

    res.json({
      payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get payment history error:", error);
    res.status(500).json({ error: "Failed to fetch payment history" });
  }
};

// ==========================================
// GET PAYMENT DETAILS
// ==========================================

export const getPaymentDetails = async (req, res) => {
  try {
    const hostId = req.user.id;
    const { paymentId } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { id: parseInt(paymentId) },
      include: {
        subscription: {
          include: { tier: true },
        },
      },
    });

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    if (payment.hostId !== hostId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    res.json({ payment });
  } catch (error) {
    console.error("Get payment details error:", error);
    res.status(500).json({ error: "Failed to fetch payment" });
  }
};

// ==========================================
// GET AVAILABLE GATEWAYS
// ==========================================

export const getAvailableGateways = async (req, res) => {
  try {
    const { country = "NP" } = req.query;

    const gateways = await prisma.paymentGatewayConfig.findMany({
      where: {
        isActive: true,
        countries: { has: country },
      },
      select: {
        gateway: true,
        displayName: true,
        currencies: true,
      },
    });

    res.json({ gateways, country });
  } catch (error) {
    console.error("Get gateways error:", error);
    res.status(500).json({ error: "Failed to fetch gateways" });
  }
};

export default {
  initiatePayment,
  esewaCallback,
  khaltiCallback,
  dodoWebhook,
  getPaymentHistory,
  getPaymentDetails,
  getAvailableGateways,
};