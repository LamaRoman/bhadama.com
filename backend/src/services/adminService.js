import { prisma } from "../config/prisma.js";
/* ================= DASHBOARD METRICS ================= */

export const getDashboardStats = async () => {
  const [
    users,
    listings,
    bookings,
    revenue,
    pendingListings,
    reportedReviews
  ] = await Promise.all([
    prisma.user.count(),
    prisma.listing.count(),
    prisma.booking.count({
      where: { status: "CONFIRMED" },
      _sum: { totalPrice: true }
    }),
    prisma.listing.count({ where: { status: "PENDING" } }),
    prisma.reviewReport.count()
  ]);

  return {
    users,
    listings,
    bookings,
    revenue: revenue._sum.totalPrice || 0,
    pendingListings,
    reportedReviews
  };
};

/* ================= LISTING MODERATION ================= */

export const moderateListing = async ({ adminId, listingId, status, reason }) => {
  return prisma.$transaction([
    prisma.listing.update({
      where: { id: listingId },
      data: { status }
    }),
    prisma.listingModeration.create({
      data: {
        adminId,
        listingId,
        status,
        reason
      }
    }),
    prisma.auditLog.create({
      data: {
        adminId,
        action: "LISTING_MODERATION",
        entity: "Listing",
        entityId: listingId,
        after: { status }
      }
    })
  ]);
};

/* ================= REVIEW REPORT HANDLING ================= */

export const getReportedReviews = async () => {
  return prisma.reviewReport.findMany({
    include: {
      review: {
        include: {
          user: true,
          listing: true
        }
      },
      user: true
    },
    orderBy: { createdAt: "desc" }
  });
};

/* ================= REFUND ================= */

export const issueRefund = async ({ bookingId, adminId, amount, reason }) => {
  return prisma.$transaction([
    prisma.refund.create({
      data: { bookingId, adminId, amount, reason }
    }),
    prisma.booking.update({
      where: { id: bookingId },
      data: { status: "REFUNDED", paymentStatus: "refunded" }
    }),
    prisma.auditLog.create({
      data: {
        adminId,
        action: "REFUND_ISSUED",
        entity: "Booking",
        entityId: bookingId,
        after: { amount }
      }
    })
  ]);
};
