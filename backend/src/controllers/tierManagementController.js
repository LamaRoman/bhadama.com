// ==========================================
// TIER MANAGEMENT CONTROLLER (Admin)
// ==========================================
// Only SUPER_ADMIN can modify tiers and pricing
// FINANCE can view only
// ==========================================

import { PrismaClient } from "@prisma/client";
import {
  DEFAULT_TIERS,
  DEFAULT_PRICING_NPR,
  DEFAULT_PRICING_USD,
  TIER_TYPES,
  BILLING_CYCLES,
  CURRENCIES,
} from "../config/tierConfig.js";

const prisma = new PrismaClient();

// ==========================================
// TIER CRUD
// ==========================================

// Get all tiers with pricing
export const getAllTiers = async (req, res) => {
  try {
    const tiers = await prisma.hostTier.findMany({
      where: { isActive: true },
      include: {
        pricing: {
          where: { isActive: true },
          orderBy: { billingCycle: "asc" },
        },
        _count: {
          select: { subscriptions: true },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    res.json({ tiers });
  } catch (error) {
    console.error("Get tiers error:", error);
    res.status(500).json({ error: "Failed to fetch tiers" });
  }
};

// Get single tier
export const getTier = async (req, res) => {
  try {
    const { tierId } = req.params;

    const tier = await prisma.hostTier.findUnique({
      where: { id: parseInt(tierId) },
      include: {
        pricing: true,
        _count: {
          select: { subscriptions: true },
        },
      },
    });

    if (!tier) {
      return res.status(404).json({ error: "Tier not found" });
    }

    res.json({ tier });
  } catch (error) {
    console.error("Get tier error:", error);
    res.status(500).json({ error: "Failed to fetch tier" });
  }
};

// Update tier settings (SUPER_ADMIN only)
export const updateTier = async (req, res) => {
  try {
    const { tierId } = req.params;
    const {
      displayName,
      description,
      maxListings,
      maxPhotosPerListing,
      maxBlogPostsPerMonth,
      featuredListingSlots,
      commissionPercent,
      trialDays,
      features,
      isActive,
      sortOrder,
    } = req.body;

    // Validate commission
    if (commissionPercent !== undefined && (commissionPercent < 0 || commissionPercent > 50)) {
      return res.status(400).json({ error: "Commission must be between 0% and 50%" });
    }

    const tier = await prisma.hostTier.update({
      where: { id: parseInt(tierId) },
      data: {
        displayName,
        description,
        maxListings,
        maxPhotosPerListing,
        maxBlogPostsPerMonth,
        featuredListingSlots,
        commissionPercent,
        trialDays,
        features,
        isActive,
        sortOrder,
      },
      include: {
        pricing: true,
      },
    });

    // Log the action
    await prisma.platformSettings.upsert({
      where: { key: "last_tier_update" },
      update: {
        value: {
          tierId: tier.id,
          tierName: tier.name,
          updatedBy: req.user.id,
          updatedAt: new Date().toISOString(),
        },
      },
      create: {
        key: "last_tier_update",
        value: {
          tierId: tier.id,
          tierName: tier.name,
          updatedBy: req.user.id,
          updatedAt: new Date().toISOString(),
        },
        editableBy: "SUPER_ADMIN",
      },
    });

    res.json({
      message: "Tier updated successfully",
      tier,
    });
  } catch (error) {
    console.error("Update tier error:", error);
    res.status(500).json({ error: "Failed to update tier" });
  }
};

// ==========================================
// PRICING MANAGEMENT
// ==========================================

// Update tier pricing (SUPER_ADMIN only)
export const updateTierPricing = async (req, res) => {
  try {
    const { tierId } = req.params;
    const { pricing } = req.body;

    if (!Array.isArray(pricing)) {
      return res.status(400).json({ error: "Pricing must be an array" });
    }

    const results = [];

    for (const p of pricing) {
      const { billingCycle, currency, price, discountPercent = 0 } = p;

      // Validate
      if (!BILLING_CYCLES[billingCycle]) {
        return res.status(400).json({ error: `Invalid billing cycle: ${billingCycle}` });
      }
      if (!CURRENCIES[currency]) {
        return res.status(400).json({ error: `Invalid currency: ${currency}` });
      }
      if (price < 0) {
        return res.status(400).json({ error: "Price cannot be negative" });
      }

      // Calculate final price
      const finalPrice = price - (price * discountPercent / 100);

      const updated = await prisma.tierPricing.upsert({
        where: {
          tierId_billingCycle_currency: {
            tierId: parseInt(tierId),
            billingCycle,
            currency,
          },
        },
        update: {
          price,
          discountPercent,
          finalPrice,
        },
        create: {
          tierId: parseInt(tierId),
          billingCycle,
          currency,
          price,
          discountPercent,
          finalPrice,
        },
      });

      results.push(updated);
    }

    res.json({
      message: "Pricing updated successfully",
      pricing: results,
    });
  } catch (error) {
    console.error("Update pricing error:", error);
    res.status(500).json({ error: "Failed to update pricing" });
  }
};

// Get all pricing
export const getAllPricing = async (req, res) => {
  try {
    const { currency } = req.query;

    const where = { isActive: true };
    if (currency) {
      where.currency = currency;
    }

    const pricing = await prisma.tierPricing.findMany({
      where,
      include: {
        tier: {
          select: {
            name: true,
            displayName: true,
          },
        },
      },
      orderBy: [{ tierId: "asc" }, { billingCycle: "asc" }],
    });

    res.json({ pricing });
  } catch (error) {
    console.error("Get pricing error:", error);
    res.status(500).json({ error: "Failed to fetch pricing" });
  }
};

// ==========================================
// SUBSCRIPTION MANAGEMENT (Admin)
// ==========================================

// Get all subscriptions
export const getAllSubscriptions = async (req, res) => {
  try {
    const { status, tier, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status;
    if (tier) {
      where.tier = { name: tier };
    }

    const [subscriptions, total] = await Promise.all([
      prisma.hostSubscription.findMany({
        where,
        include: {
          host: {
            select: {
              id: true,
              name: true,
              email: true,
              profilePhoto: true,
            },
          },
          tier: {
            select: {
              name: true,
              displayName: true,
              commissionPercent: true,
            },
          },
          _count: {
            select: { payments: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.hostSubscription.count({ where }),
    ]);

    res.json({
      subscriptions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get subscriptions error:", error);
    res.status(500).json({ error: "Failed to fetch subscriptions" });
  }
};

// Get subscription details
export const getSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    const subscription = await prisma.hostSubscription.findUnique({
      where: { id: parseInt(subscriptionId) },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePhoto: true,
            createdAt: true,
          },
        },
        tier: true,
        payments: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        history: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    res.json({ subscription });
  } catch (error) {
    console.error("Get subscription error:", error);
    res.status(500).json({ error: "Failed to fetch subscription" });
  }
};

// Manually change host tier (SUPER_ADMIN only)
export const changeHostTier = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { newTierId, reason, extendDays } = req.body;

    const subscription = await prisma.hostSubscription.findUnique({
      where: { id: parseInt(subscriptionId) },
      include: { tier: true, host: true },
    });

    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    const newTier = await prisma.hostTier.findUnique({
      where: { id: parseInt(newTierId) },
    });

    if (!newTier) {
      return res.status(404).json({ error: "New tier not found" });
    }

    // Calculate new end date if extending
    let newEndDate = subscription.endDate;
    if (extendDays && extendDays > 0) {
      newEndDate = new Date(subscription.endDate || new Date());
      newEndDate.setDate(newEndDate.getDate() + parseInt(extendDays));
    }

    // Update subscription
    const updated = await prisma.hostSubscription.update({
      where: { id: parseInt(subscriptionId) },
      data: {
        tierId: parseInt(newTierId),
        endDate: newEndDate,
        status: "ACTIVE",
      },
      include: { tier: true },
    });

    // Update user's currentTier
    await prisma.user.update({
      where: { id: subscription.hostId },
      data: {
        currentTier: newTier.name,
        tierExpiresAt: newEndDate,
      },
    });

    // Log history
    await prisma.subscriptionHistory.create({
      data: {
        subscriptionId: subscription.id,
        action: subscription.tier.sortOrder < newTier.sortOrder ? "upgraded" : "downgraded",
        fromTier: subscription.tier.name,
        toTier: newTier.name,
        details: { reason, extendDays, adminId: req.user.id },
        changedBy: req.user.id,
        changedByType: "admin",
      },
    });

    res.json({
      message: `Host tier changed to ${newTier.displayName}`,
      subscription: updated,
    });
  } catch (error) {
    console.error("Change tier error:", error);
    res.status(500).json({ error: "Failed to change tier" });
  }
};

// Cancel subscription (Admin)
export const cancelSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { reason, immediate = false } = req.body;

    const subscription = await prisma.hostSubscription.findUnique({
      where: { id: parseInt(subscriptionId) },
      include: { tier: true },
    });

    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    // Update subscription
    const updated = await prisma.hostSubscription.update({
      where: { id: parseInt(subscriptionId) },
      data: {
        status: immediate ? "CANCELLED" : subscription.status,
        autoRenew: false,
        cancelledAt: new Date(),
        cancelReason: reason,
      },
    });

    // If immediate, downgrade to FREE
    if (immediate) {
      const freeTier = await prisma.hostTier.findUnique({
        where: { name: "FREE" },
      });

      if (freeTier) {
        await prisma.user.update({
          where: { id: subscription.hostId },
          data: {
            currentTier: "FREE",
            tierExpiresAt: null,
          },
        });
      }
    }

    // Log history
    await prisma.subscriptionHistory.create({
      data: {
        subscriptionId: subscription.id,
        action: "cancelled",
        fromTier: subscription.tier.name,
        toTier: immediate ? "FREE" : subscription.tier.name,
        details: { reason, immediate, adminId: req.user.id },
        changedBy: req.user.id,
        changedByType: "admin",
      },
    });

    res.json({
      message: immediate 
        ? "Subscription cancelled immediately" 
        : "Subscription will not renew",
      subscription: updated,
    });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    res.status(500).json({ error: "Failed to cancel subscription" });
  }
};

// Extend subscription (SUPER_ADMIN only)
export const extendSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { days, reason } = req.body;

    if (!days || days < 1) {
      return res.status(400).json({ error: "Days must be at least 1" });
    }

    const subscription = await prisma.hostSubscription.findUnique({
      where: { id: parseInt(subscriptionId) },
      include: { tier: true },
    });

    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    // Calculate new end date
    const baseDate = subscription.endDate || new Date();
    const newEndDate = new Date(baseDate);
    newEndDate.setDate(newEndDate.getDate() + parseInt(days));

    // Update subscription
    const updated = await prisma.hostSubscription.update({
      where: { id: parseInt(subscriptionId) },
      data: {
        endDate: newEndDate,
        status: "ACTIVE",
      },
    });

    // Update user
    await prisma.user.update({
      where: { id: subscription.hostId },
      data: { tierExpiresAt: newEndDate },
    });

    // Log history
    await prisma.subscriptionHistory.create({
      data: {
        subscriptionId: subscription.id,
        action: "extended",
        details: { days, reason, adminId: req.user.id, newEndDate },
        changedBy: req.user.id,
        changedByType: "admin",
      },
    });

    res.json({
      message: `Subscription extended by ${days} days`,
      subscription: updated,
    });
  } catch (error) {
    console.error("Extend subscription error:", error);
    res.status(500).json({ error: "Failed to extend subscription" });
  }
};

// ==========================================
// STATISTICS & REPORTS
// ==========================================

// Get tier statistics (FINANCE, ANALYST, SUPER_ADMIN)
export const getTierStats = async (req, res) => {
  try {
    // Subscriptions by tier
    const subscriptionsByTier = await prisma.hostSubscription.groupBy({
      by: ["tierId"],
      _count: { id: true },
      where: { status: { in: ["ACTIVE", "TRIAL"] } },
    });

    // Get tier names
    const tiers = await prisma.hostTier.findMany({
      select: { id: true, name: true, displayName: true },
    });

    const tierMap = {};
    tiers.forEach((t) => {
      tierMap[t.id] = t;
    });

    const subscriptionStats = subscriptionsByTier.map((s) => ({
      tier: tierMap[s.tierId]?.displayName || "Unknown",
      tierName: tierMap[s.tierId]?.name || "Unknown",
      count: s._count.id,
    }));

    // Subscriptions by status
    const subscriptionsByStatus = await prisma.hostSubscription.groupBy({
      by: ["status"],
      _count: { id: true },
    });

    // Revenue this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyRevenue = await prisma.payment.aggregate({
      where: {
        status: "COMPLETED",
        paidAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
    });

    // Total revenue
    const totalRevenue = await prisma.payment.aggregate({
      where: { status: "COMPLETED" },
      _sum: { amount: true },
    });

    // Expiring soon (next 7 days)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const expiringSoon = await prisma.hostSubscription.count({
      where: {
        status: "ACTIVE",
        endDate: {
          gte: new Date(),
          lte: sevenDaysFromNow,
        },
      },
    });

    res.json({
      subscriptionsByTier: subscriptionStats,
      subscriptionsByStatus: subscriptionsByStatus.map((s) => ({
        status: s.status,
        count: s._count.id,
      })),
      revenue: {
        thisMonth: monthlyRevenue._sum.amount || 0,
        total: totalRevenue._sum.amount || 0,
      },
      expiringSoon,
    });
  } catch (error) {
    console.error("Get tier stats error:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
};

// Get revenue report
export const getRevenueReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = { status: "COMPLETED" };

    if (startDate) {
      where.paidAt = { ...where.paidAt, gte: new Date(startDate) };
    }
    if (endDate) {
      where.paidAt = { ...where.paidAt, lte: new Date(endDate) };
    }

    // Revenue by gateway
    const byGateway = await prisma.payment.groupBy({
      by: ["gateway"],
      where,
      _sum: { amount: true },
      _count: { id: true },
    });

    // Revenue by tier
    const payments = await prisma.payment.findMany({
      where,
      include: {
        subscription: {
          include: {
            tier: { select: { name: true, displayName: true } },
          },
        },
      },
    });

    const byTier = {};
    payments.forEach((p) => {
      const tierName = p.subscription?.tier?.displayName || "Unknown";
      if (!byTier[tierName]) {
        byTier[tierName] = { amount: 0, count: 0 };
      }
      byTier[tierName].amount += p.amount;
      byTier[tierName].count += 1;
    });

    res.json({
      byGateway: byGateway.map((g) => ({
        gateway: g.gateway,
        amount: g._sum.amount || 0,
        count: g._count.id,
      })),
      byTier: Object.entries(byTier).map(([tier, data]) => ({
        tier,
        ...data,
      })),
      totalPayments: payments.length,
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
    });
  } catch (error) {
    console.error("Get revenue report error:", error);
    res.status(500).json({ error: "Failed to fetch revenue report" });
  }
};

// ==========================================
// SEED DEFAULT TIERS
// ==========================================

export const seedDefaultTiers = async (req, res) => {
  try {
    // Check if tiers already exist
    const existingTiers = await prisma.hostTier.count();
    if (existingTiers > 0) {
      return res.status(400).json({ error: "Tiers already exist. Use update instead." });
    }

    // Create tiers
    for (const [key, tierData] of Object.entries(DEFAULT_TIERS)) {
      const tier = await prisma.hostTier.create({
        data: {
          name: tierData.name,
          displayName: tierData.displayName,
          description: tierData.description,
          maxListings: tierData.maxListings,
          maxPhotosPerListing: tierData.maxPhotosPerListing,
          maxBlogPostsPerMonth: tierData.maxBlogPostsPerMonth,
          featuredListingSlots: tierData.featuredListingSlots,
          commissionPercent: tierData.commissionPercent,
          trialDays: tierData.trialDays,
          features: tierData.features,
          sortOrder: tierData.sortOrder,
        },
      });

      // Create NPR pricing
      const nprPricing = DEFAULT_PRICING_NPR[key];
      for (const [cycle, prices] of Object.entries(nprPricing)) {
        await prisma.tierPricing.create({
          data: {
            tierId: tier.id,
            billingCycle: cycle,
            currency: "NPR",
            price: prices.price,
            discountPercent: prices.discount,
            finalPrice: prices.finalPrice,
          },
        });
      }

      // Create USD pricing
      const usdPricing = DEFAULT_PRICING_USD[key];
      for (const [cycle, prices] of Object.entries(usdPricing)) {
        await prisma.tierPricing.create({
          data: {
            tierId: tier.id,
            billingCycle: cycle,
            currency: "USD",
            price: prices.price,
            discountPercent: prices.discount,
            finalPrice: prices.finalPrice,
          },
        });
      }
    }

    res.json({ message: "Default tiers and pricing created successfully" });
  } catch (error) {
    console.error("Seed tiers error:", error);
    res.status(500).json({ error: "Failed to seed tiers" });
  }
};

export default {
  getAllTiers,
  getTier,
  updateTier,
  updateTierPricing,
  getAllPricing,
  getAllSubscriptions,
  getSubscription,
  changeHostTier,
  cancelSubscription,
  extendSubscription,
  getTierStats,
  getRevenueReport,
  seedDefaultTiers,
};