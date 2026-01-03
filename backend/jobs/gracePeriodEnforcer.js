// ==========================================
// GRACE PERIOD ENFORCER - CRON JOB
// ==========================================
// Runs daily to enforce tier limits after grace period
// ==========================================

import { PrismaClient } from "@prisma/client";
import { archiveExcessListings } from "../services/listingArchiveService.js";
import { DOWNGRADE_RULES, GRACE_PERIOD } from "../config/tierConfig.js";

const prisma = new PrismaClient();

// ==========================================
// MAIN ENFORCEMENT JOB
// ==========================================

/**
 * Enforce grace period - archive excess listings
 * Should run daily (e.g., at midnight)
 */
export const enforceGracePeriods = async () => {
  const now = new Date();
  console.log(`[GracePeriodEnforcer] Running at ${now.toISOString()}`);

  try {
    // Find subscriptions with expired grace periods
    const expiredGracePeriods = await prisma.hostSubscription.findMany({
      where: {
        gracePeriodEnd: {
          lt: now, // Grace period has passed
        },
        excessListingsCount: {
          gt: 0, // Has excess listings to handle
        },
      },
      include: {
        tier: true,
        host: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    console.log(
      `[GracePeriodEnforcer] Found ${expiredGracePeriods.length} subscriptions with expired grace periods`
    );

    const results = [];

    for (const subscription of expiredGracePeriods) {
      try {
        console.log(
          `[GracePeriodEnforcer] Processing host ${subscription.hostId} (${subscription.host.email})`
        );

        const limit = subscription.tier.maxListings;

        // Archive excess listings
        const archiveResult = await archiveExcessListings(
          subscription.hostId,
          limit === -1 ? Infinity : limit
        );

        // Clear grace period flags
        await prisma.hostSubscription.update({
          where: { id: subscription.id },
          data: {
            gracePeriodEnd: null,
            listingSelectionDeadline: null,
            excessListingsCount: 0,
          },
        });

        // Log the action
        await prisma.subscriptionHistory.create({
          data: {
            subscriptionId: subscription.id,
            action: "grace_period_expired",
            details: {
              archivedCount: archiveResult.archived,
              keptCount: archiveResult.kept,
              archivedListings: archiveResult.archivedListings,
            },
            changedByType: "system",
          },
        });

        // TODO: Send email notification
        // await sendGracePeriodExpiredEmail(subscription.host, archiveResult);

        results.push({
          hostId: subscription.hostId,
          email: subscription.host.email,
          success: true,
          archived: archiveResult.archived,
          kept: archiveResult.kept,
        });

        console.log(
          `[GracePeriodEnforcer] Archived ${archiveResult.archived} listings for host ${subscription.hostId}`
        );
      } catch (error) {
        console.error(
          `[GracePeriodEnforcer] Error processing host ${subscription.hostId}:`,
          error
        );
        results.push({
          hostId: subscription.hostId,
          success: false,
          error: error.message,
        });
      }
    }

    // Log summary
    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;
    console.log(
      `[GracePeriodEnforcer] Completed: ${successCount} success, ${failCount} failed`
    );

    return {
      processed: expiredGracePeriods.length,
      success: successCount,
      failed: failCount,
      results,
    };
  } catch (error) {
    console.error("[GracePeriodEnforcer] Fatal error:", error);
    throw error;
  }
};

// ==========================================
// SEND REMINDER EMAILS
// ==========================================

/**
 * Send reminder emails to hosts with upcoming grace period expiry
 * Should run daily
 */
export const sendGracePeriodReminders = async () => {
  const now = new Date();
  console.log(`[GracePeriodReminder] Running at ${now.toISOString()}`);

  try {
    // Find subscriptions with grace periods ending soon
    const upcomingExpirations = await prisma.hostSubscription.findMany({
      where: {
        gracePeriodEnd: {
          gt: now, // Still in grace period
        },
        excessListingsCount: {
          gt: 0,
        },
      },
      include: {
        tier: true,
        host: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    const reminders = [];

    for (const subscription of upcomingExpirations) {
      const gracePeriodEnd = new Date(subscription.gracePeriodEnd);
      const daysRemaining = Math.ceil(
        (gracePeriodEnd - now) / (1000 * 60 * 60 * 24)
      );

      // Determine if we should send a reminder based on days remaining
      let shouldSendReminder = false;
      let reminderType = null;

      if (daysRemaining === 7) {
        shouldSendReminder = true;
        reminderType = "7_days";
      } else if (daysRemaining === 3) {
        shouldSendReminder = true;
        reminderType = "3_days";
      } else if (daysRemaining === 1) {
        shouldSendReminder = true;
        reminderType = "1_day";
      }

      if (shouldSendReminder) {
        // TODO: Send actual email
        // await sendGracePeriodReminderEmail(subscription.host, {
        //   daysRemaining,
        //   excessListings: subscription.excessListingsCount,
        //   tier: subscription.tier,
        // });

        reminders.push({
          hostId: subscription.hostId,
          email: subscription.host.email,
          daysRemaining,
          reminderType,
          excessListings: subscription.excessListingsCount,
        });

        console.log(
          `[GracePeriodReminder] Sent ${reminderType} reminder to ${subscription.host.email}`
        );
      }
    }

    console.log(
      `[GracePeriodReminder] Sent ${reminders.length} reminders`
    );

    return {
      remindersent: reminders.length,
      reminders,
    };
  } catch (error) {
    console.error("[GracePeriodReminder] Error:", error);
    throw error;
  }
};

// ==========================================
// CHECK EXPIRED SUBSCRIPTIONS
// ==========================================

/**
 * Check for expired subscriptions and start grace period
 * Should run daily
 */
export const checkExpiredSubscriptions = async () => {
  const now = new Date();
  console.log(`[SubscriptionExpiry] Running at ${now.toISOString()}`);

  try {
    // Find expired subscriptions that haven't started grace period
    const expiredSubscriptions = await prisma.hostSubscription.findMany({
      where: {
        status: "ACTIVE",
        endDate: {
          lt: now,
        },
        autoRenew: false, // Not set to auto-renew
        gracePeriodEnd: null, // Grace period not started
      },
      include: {
        tier: true,
        host: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    console.log(
      `[SubscriptionExpiry] Found ${expiredSubscriptions.length} expired subscriptions`
    );

    const results = [];

    for (const subscription of expiredSubscriptions) {
      try {
        // Get FREE tier
        const freeTier = await prisma.hostTier.findUnique({
          where: { name: "FREE" },
        });

        // Count current listings
        const listingCount = await prisma.listing.count({
          where: {
            hostId: subscription.hostId,
            status: { in: ["ACTIVE", "INACTIVE", "PENDING"] },
          },
        });

        const excessCount = Math.max(0, listingCount - freeTier.maxListings);
        const gracePeriodEnd = new Date();
        gracePeriodEnd.setDate(gracePeriodEnd.getDate() + GRACE_PERIOD.DAYS);

        // Update subscription
        await prisma.hostSubscription.update({
          where: { id: subscription.id },
          data: {
            status: "EXPIRED",
            previousTierId: subscription.tierId,
            tierId: freeTier.id,
            gracePeriodEnd: excessCount > 0 ? gracePeriodEnd : null,
            listingSelectionDeadline: excessCount > 0 ? gracePeriodEnd : null,
            excessListingsCount: excessCount,
          },
        });

        // Update user
        await prisma.user.update({
          where: { id: subscription.hostId },
          data: {
            currentTier: "FREE",
            tierExpiresAt: null,
          },
        });

        // Mark excess listings
        if (excessCount > 0) {
          const listings = await prisma.listing.findMany({
            where: {
              hostId: subscription.hostId,
              status: { in: ["ACTIVE", "INACTIVE", "PENDING"] },
            },
            orderBy: { createdAt: "asc" },
            take: excessCount,
            select: { id: true },
          });

          await prisma.listing.updateMany({
            where: {
              id: { in: listings.map((l) => l.id) },
            },
            data: {
              status: "OVER_LIMIT",
            },
          });
        }

        // Log history
        await prisma.subscriptionHistory.create({
          data: {
            subscriptionId: subscription.id,
            action: "expired",
            fromTier: subscription.tier.name,
            toTier: "FREE",
            details: {
              reason: "subscription_expired",
              excessListings: excessCount,
              gracePeriodEnd: excessCount > 0 ? gracePeriodEnd : null,
            },
            changedByType: "system",
          },
        });

        // TODO: Send expiry email
        // await sendSubscriptionExpiredEmail(subscription.host, excessCount);

        results.push({
          hostId: subscription.hostId,
          email: subscription.host.email,
          success: true,
          previousTier: subscription.tier.name,
          excessListings: excessCount,
        });

        console.log(
          `[SubscriptionExpiry] Expired subscription for host ${subscription.hostId}, excess: ${excessCount}`
        );
      } catch (error) {
        console.error(
          `[SubscriptionExpiry] Error processing host ${subscription.hostId}:`,
          error
        );
        results.push({
          hostId: subscription.hostId,
          success: false,
          error: error.message,
        });
      }
    }

    return {
      processed: expiredSubscriptions.length,
      results,
    };
  } catch (error) {
    console.error("[SubscriptionExpiry] Fatal error:", error);
    throw error;
  }
};

// ==========================================
// RUN ALL JOBS
// ==========================================

/**
 * Run all grace period related jobs
 * Call this from your cron scheduler
 */
export const runAllGracePeriodJobs = async () => {
  console.log("========================================");
  console.log("Starting Grace Period Jobs");
  console.log("========================================");

  const results = {
    expiredSubscriptions: null,
    gracePeriodEnforcement: null,
    reminders: null,
  };

  try {
    // 1. Check for newly expired subscriptions
    results.expiredSubscriptions = await checkExpiredSubscriptions();
  } catch (error) {
    results.expiredSubscriptions = { error: error.message };
  }

  try {
    // 2. Enforce grace periods that have ended
    results.gracePeriodEnforcement = await enforceGracePeriods();
  } catch (error) {
    results.gracePeriodEnforcement = { error: error.message };
  }

  try {
    // 3. Send reminder emails
    results.reminders = await sendGracePeriodReminders();
  } catch (error) {
    results.reminders = { error: error.message };
  }

  console.log("========================================");
  console.log("Grace Period Jobs Completed");
  console.log(JSON.stringify(results, null, 2));
  console.log("========================================");

  return results;
};

export default {
  enforceGracePeriods,
  sendGracePeriodReminders,
  checkExpiredSubscriptions,
  runAllGracePeriodJobs,
};