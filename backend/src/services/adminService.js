import { prisma } from "../config/prisma.js";

/* ================= DASHBOARD STATS (for AdminDashboard.jsx) ================= */

export const getStats = async (range = "30days") => {
  // Calculate date range
  const now = new Date();
  let startDate;
  
  switch (range) {
    case "7days":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30days":
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "90days":
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case "1year":
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    case "all":
      startDate = new Date(0);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  // Calculate previous period for comparison
  const periodLength = now.getTime() - startDate.getTime();
  const previousStartDate = new Date(startDate.getTime() - periodLength);

  // Get current period metrics
  const [
    currentRevenue,
    previousRevenue,
    currentBookings,
    previousBookings,
    currentUsers,
    previousUsers,
    currentRating,
    previousRating
  ] = await Promise.all([
    // Current revenue
    prisma.booking.aggregate({
      where: {
        createdAt: { gte: startDate },
        status: { in: ["CONFIRMED", "COMPLETED"] }
      },
      _sum: { totalPrice: true }
    }),
    // Previous revenue
    prisma.booking.aggregate({
      where: {
        createdAt: { gte: previousStartDate, lt: startDate },
        status: { in: ["CONFIRMED", "COMPLETED"] }
      },
      _sum: { totalPrice: true }
    }),
    // Current bookings
    prisma.booking.count({
      where: { createdAt: { gte: startDate } }
    }),
    // Previous bookings
    prisma.booking.count({
      where: { createdAt: { gte: previousStartDate, lt: startDate } }
    }),
    // Current users
    prisma.user.count({
      where: { createdAt: { gte: startDate } }
    }),
    // Previous users
    prisma.user.count({
      where: { createdAt: { gte: previousStartDate, lt: startDate } }
    }),
    // Current rating
    prisma.review.aggregate({
      where: { createdAt: { gte: startDate } },
      _avg: { rating: true }
    }),
    // Previous rating
    prisma.review.aggregate({
      where: { createdAt: { gte: previousStartDate, lt: startDate } },
      _avg: { rating: true }
    })
  ]);

  // Calculate changes
  const calcChange = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100 * 10) / 10;
  };

  const revenueValue = currentRevenue._sum.totalPrice || 0;
  const prevRevenueValue = previousRevenue._sum.totalPrice || 0;
  const revenueChange = calcChange(revenueValue, prevRevenueValue);

  const bookingsChange = calcChange(currentBookings, previousBookings);
  const usersChange = calcChange(currentUsers, previousUsers);

  const ratingValue = currentRating._avg.rating || 0;
  const prevRatingValue = previousRating._avg.rating || ratingValue;
  const ratingChange = calcChange(ratingValue, prevRatingValue);

  return {
    revenue: {
      value: revenueValue,
      change: revenueChange,
      trend: revenueChange >= 0 ? "up" : "down"
    },
    bookings: {
      value: currentBookings,
      change: bookingsChange,
      trend: bookingsChange >= 0 ? "up" : "down"
    },
    users: {
      value: currentUsers,
      change: usersChange,
      trend: usersChange >= 0 ? "up" : "down"
    },
    rating: {
      value: Math.round(ratingValue * 10) / 10,
      change: ratingChange,
      trend: ratingChange >= 0 ? "up" : "down"
    }
  };
};

/* ================= LEGACY DASHBOARD STATS ================= */

export const getDashboardStats = async () => {
  const [users, listings, bookingsData, pendingListings, reportedReviews] =
    await Promise.all([
      prisma.user.count(),
      prisma.listing.count(),
      prisma.booking.aggregate({
        where: { status: "CONFIRMED" },
        _count: true,
        _sum: { totalPrice: true }
      }),
      prisma.listing.count({ where: { status: "PENDING" } }),
      prisma.reviewReport?.count().catch(() => 0) || Promise.resolve(0)
    ]);

  return {
    users,
    listings,
    bookings: bookingsData._count || 0,
    revenue: bookingsData._sum.totalPrice || 0,
    pendingListings,
    reportedReviews
  };
};

/* ================= RECENT BOOKINGS ================= */

export const getRecentBookings = async (limit = 10) => {
  return prisma.booking.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true
        }
      },
      listing: {
        select: {
          id: true,
          title: true,
          price: true
        }
      }
    }
  });
};

/* ================= RECENT USERS ================= */

export const getRecentUsers = async (limit = 10) => {
  return prisma.user.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      createdAt: true,
      isActive: true,
      _count: {
        select: {
          bookings: true,
          listings: true
        }
      }
    }
  });
};

/* ================= SUSPENDED USERS ================= */

export const getSuspendedUsers = async () => {
  return prisma.user.findMany({
    where: {
      OR: [
        { isActive: false },
        { deletedAt: { not: null } }
      ]
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      createdAt: true,
      deletedAt: true,
      isActive: true,
      suspensionReason: true
    }
  });
};

/* ================= RESTORE USER ================= */

export const restoreUser = async (userId, adminId) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      isActive: true,
      deletedAt: null,
      suspensionReason: null
    }
  });

  // Log audit action
  await prisma.auditLog.create({
    data: {
      adminId,
      action: "USER_RESTORED",
      entity: "User",
      entityId: userId,
      after: { restored: true }
    }
  });

  return user;
};

/* ================= LISTINGS ================= */

export const getListings = async ({ limit = 10, status, page = 1 }) => {
  const skip = (page - 1) * limit;
  const where = status ? { status } : {};

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      take: limit,
      skip,
      orderBy: { createdAt: "desc" },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        _count: {
          select: {
            bookings: true,
            reviews: true
          }
        }
      }
    }),
    prisma.listing.count({ where })
  ]);

  return {
    listings,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

/* ================= UPDATE LISTING STATUS ================= */

export const updateListingStatus = async ({ listingId, adminId, status, reason }) => {
  const validStatuses = ["PENDING", "ACTIVE", "REJECTED", "SUSPENDED", "ARCHIVED"];
  if (!validStatuses.includes(status)) {
    throw new Error("Invalid status");
  }

  const listing = await prisma.listing.update({
    where: { id: listingId },
    data: {
      status,
      rejectionReason: status === "REJECTED" ? reason : null
    }
  });

  // Log audit action
  await prisma.auditLog.create({
    data: {
      adminId,
      action: `LISTING_${status}`,
      entity: "Listing",
      entityId: listingId,
      after: { status, reason }
    }
  });

  return listing;
};

/* ================= LISTING MODERATION (legacy) ================= */

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

/* ================= PENDING REVIEWS ================= */

export const getPendingReviews = async (limit = 10) => {
  return prisma.review.findMany({
    where: {
      OR: [
        { status: "PENDING" },
        { flagged: true }
      ]
    },
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true
        }
      },
      listing: {
        select: {
          id: true,
          title: true
        }
      }
    }
  });
};

/* ================= UPDATE REVIEW STATUS ================= */

export const updateReviewStatus = async ({ reviewId, adminId, status, reason }) => {
  const validStatuses = ["PENDING", "APPROVED", "REJECTED"];
  if (!validStatuses.includes(status)) {
    throw new Error("Invalid status");
  }

  const review = await prisma.review.update({
    where: { id: reviewId },
    data: {
      status,
      flagged: false,
      moderationReason: status === "REJECTED" ? reason : null
    }
  });

  // Log audit action
  await prisma.auditLog.create({
    data: {
      adminId,
      action: `REVIEW_${status}`,
      entity: "Review",
      entityId: reviewId,
      after: { status, reason }
    }
  });

  return review;
};

/* ================= REVIEW REPORTS (legacy) ================= */

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

/* ================= AUDIT LOGS ================= */

export const getAuditLogs = async ({ limit = 50, page = 1, action, entityType }) => {
  const skip = (page - 1) * limit;
  const where = {};
  
  if (action) where.action = action;
  if (entityType) where.entity = entityType;

  return prisma.auditLog.findMany({
    where,
    take: limit,
    skip,
    orderBy: { createdAt: "desc" },
    include: {
      admin: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true
        }
      }
    }
  });
};

/* ================= FEATURE FLAGS ================= */

// Default feature flags if FeatureFlag model doesn't exist
const DEFAULT_FEATURE_FLAGS = [
  { id: "1", name: "newUserOnboarding", label: "New User Onboarding", enabled: true, description: "Show onboarding flow for new users" },
  { id: "2", name: "instantBooking", label: "Instant Booking", enabled: true, description: "Allow instant booking without host approval" },
  { id: "3", name: "advancedSearch", label: "Advanced Search", enabled: true, description: "Enable advanced search filters" },
  { id: "4", name: "guestMessaging", label: "Guest Messaging", enabled: true, description: "Enable messaging between guests and hosts" },
  { id: "5", name: "promotions", label: "Promotions", enabled: false, description: "Show promotional banners and offers" },
  { id: "6", name: "reviewsModeration", label: "Reviews Moderation", enabled: true, description: "Require admin approval for reviews" },
  { id: "7", name: "hostAnalytics", label: "Host Analytics", enabled: true, description: "Show analytics dashboard to hosts" },
  { id: "8", name: "betaFeatures", label: "Beta Features", enabled: false, description: "Enable experimental beta features" }
];

export const getFeatureFlags = async () => {
  try {
    const flags = await prisma.featureFlag.findMany({
      orderBy: { name: "asc" }
    });
    return flags.length > 0 ? flags : DEFAULT_FEATURE_FLAGS;
  } catch {
    // If model doesn't exist, return defaults
    return DEFAULT_FEATURE_FLAGS;
  }
};

export const updateFeatureFlag = async ({ flagId, enabled, adminId }) => {
  let flag;
  
  try {
    flag = await prisma.featureFlag.update({
      where: { id: flagId },
      data: { enabled }
    });
  } catch {
    // If model doesn't exist, just return success
    flag = { id: flagId, enabled };
  }

  // Log audit action
  try {
    await prisma.auditLog.create({
      data: {
        adminId,
        action: enabled ? "FEATURE_ENABLED" : "FEATURE_DISABLED",
        entity: "FeatureFlag",
        entityId: flagId,
        after: { enabled }
      }
    });
  } catch (e) {
    console.warn("Could not create audit log:", e.message);
  }

  return flag;
};

/* ================= PLATFORM HEALTH ================= */

export const getPlatformHealth = async () => {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    activeUsersToday,
    totalListings,
    activeListings,
    bookingsToday,
    pendingBookings,
    pendingReviews,
    pendingListings
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { lastLoginAt: { gte: oneDayAgo } } }).catch(() => 0),
    prisma.listing.count(),
    prisma.listing.count({ where: { status: "ACTIVE" } }),
    prisma.booking.count({ where: { createdAt: { gte: oneDayAgo } } }),
    prisma.booking.count({ where: { status: "PENDING" } }),
    prisma.review.count({ where: { status: "PENDING" } }).catch(() => 0),
    prisma.listing.count({ where: { status: "PENDING" } })
  ]);

  // Simulated metrics - replace with actual monitoring
  const systemLoad = Math.random() * 30 + 20;
  const responseTime = Math.random() * 100 + 50;
  const errorRate = Math.random() * 2;

  // Database connection check
  let dbStatus = "healthy";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = "unhealthy";
  }

  return {
    status: dbStatus === "healthy" ? "operational" : "degraded",
    metrics: {
      database: {
        status: dbStatus,
        label: "Database",
        value: dbStatus === "healthy" ? "Connected" : "Disconnected"
      },
      api: {
        status: "healthy",
        label: "API Server",
        value: `${Math.round(responseTime)}ms avg`
      },
      systemLoad: {
        status: systemLoad < 70 ? "healthy" : systemLoad < 90 ? "warning" : "critical",
        label: "System Load",
        value: `${Math.round(systemLoad)}%`
      },
      errorRate: {
        status: errorRate < 1 ? "healthy" : errorRate < 5 ? "warning" : "critical",
        label: "Error Rate",
        value: `${errorRate.toFixed(2)}%`
      }
    },
    counts: {
      totalUsers,
      activeUsersToday,
      totalListings,
      activeListings,
      bookingsToday,
      pendingBookings,
      pendingReviews,
      pendingListings
    },
    uptime: process.uptime(),
    timestamp: now.toISOString()
  };
};

/* ================= DATA EXPORT ================= */

export const exportData = async ({ type, range, adminId }) => {
  const now = new Date();
  let startDate;

  switch (range) {
    case "7days":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30days":
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "90days":
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(0);
  }

  let data;
  switch (type) {
    case "users":
      data = await prisma.user.findMany({
        where: { createdAt: { gte: startDate } },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          isActive: true
        }
      });
      break;
    case "bookings":
      data = await prisma.booking.findMany({
        where: { createdAt: { gte: startDate } },
        include: {
          user: { select: { name: true, email: true } },
          listing: { select: { title: true } }
        }
      });
      break;
    case "listings":
      data = await prisma.listing.findMany({
        where: { createdAt: { gte: startDate } },
        include: {
          host: { select: { name: true, email: true } }
        }
      });
      break;
    case "reviews":
      data = await prisma.review.findMany({
        where: { createdAt: { gte: startDate } },
        include: {
          user: { select: { name: true } },
          listing: { select: { title: true } }
        }
      });
      break;
    default:
      throw new Error("Invalid export type");
  }

  // Log audit action
  await prisma.auditLog.create({
    data: {
      adminId,
      action: "DATA_EXPORT",
      entity: type.toUpperCase(),
      entityId: "BULK",
      after: { type, range, recordCount: data.length }
    }
  });

  return data;
};

/* ================= CSV CONVERSION ================= */

export const convertToCSV = (data) => {
  if (!data || data.length === 0) return "";

  const flattenObject = (obj, prefix = "") => {
    const result = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const newKey = prefix ? `${prefix}_${key}` : key;
        if (
          typeof obj[key] === "object" &&
          obj[key] !== null &&
          !Array.isArray(obj[key]) &&
          !(obj[key] instanceof Date)
        ) {
          Object.assign(result, flattenObject(obj[key], newKey));
        } else if (obj[key] instanceof Date) {
          result[newKey] = obj[key].toISOString();
        } else {
          result[newKey] = obj[key];
        }
      }
    }
    return result;
  };

  const headers = Object.keys(flattenObject(data[0]));
  const rows = data.map((item) => {
    const flat = flattenObject(item);
    return headers
      .map((header) => {
        const value = flat[header];
        if (value === null || value === undefined) return "";
        if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      })
      .join(",");
  });

  return [headers.join(","), ...rows].join("\n");
};

/* ================= REFUND (existing) ================= */

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