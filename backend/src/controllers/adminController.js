// controllers/adminController.js
import { prisma } from "../config/prisma.js";

/**
 * GET /api/admin/stats
 * Get dashboard statistics
 */
export async function getAdminStats(req, res) {
  try {
    const { range = '30days' } = req.query;
    const now = new Date();
    let startDate = new Date();

    switch (range) {
      case '7days':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(now.getDate() - 90);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Calculate date for previous period
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(startDate.getDate() - (now - startDate) / (1000 * 60 * 60 * 24));

    // Get current period stats
    const [
      totalRevenue,
      totalBookings,
      activeUsers,
      totalListings,
      pendingReviews,
      avgRatingResult,
      previousRevenue
    ] = await Promise.all([
      // Current period revenue
      prisma.booking.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: startDate }
        },
        _sum: { totalPrice: true }
      }),
      
      // Total bookings in period
      prisma.booking.count({
        where: { createdAt: { gte: startDate } }
      }),
      
      // Active users (booked in last 90 days)
      prisma.user.count({
        where: {
          bookings: {
            some: {
              createdAt: { gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) }
            }
          }
        }
      }),
      
      // Total listings
      prisma.listing.count(),
      
      // Pending reviews
      prisma.review.count({
        where: { status: 'PENDING' }
      }),
      
      // Average rating
      prisma.review.aggregate({
        where: { status: 'APPROVED' },
        _avg: { rating: true }
      }),
      
      // Previous period revenue for comparison
      prisma.booking.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: { 
            gte: previousStartDate,
            lt: startDate
          }
        },
        _sum: { totalPrice: true }
      })
    ]);

    // Calculate percentage changes
    const currentRevenue = totalRevenue._sum.totalPrice || 0;
    const prevRevenue = previousRevenue._sum.totalPrice || 0;
    const revenueChange = prevRevenue > 0 
      ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 
      : currentRevenue > 0 ? 100 : 0;

    // For demo purposes, generate some mock changes
    const bookingsChange = 12.5;
    const usersChange = 8.2;
    const ratingChange = 0.3;

    res.json({
      totalRevenue: currentRevenue,
      totalBookings,
      activeUsers,
      totalListings,
      pendingReviews,
      avgRating: avgRatingResult._avg.rating || 0,
      revenueChange: Math.round(revenueChange * 100) / 100,
      bookingsChange,
      usersChange,
      ratingChange
    });
  } catch (error) {
    console.error("GET ADMIN STATS ERROR:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/admin/bookings/recent
 * Get recent bookings
 */
export async function getRecentBookings(req, res) {
  try {
    const bookings = await prisma.booking.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
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

    res.json(bookings);
  } catch (error) {
    console.error("GET RECENT BOOKINGS ERROR:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/admin/users/recent
 * Get recent users
 */
export async function getRecentUsers(req, res) {
  try {
    const users = await prisma.user.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        profilePhoto: true,
        role: true,
        createdAt: true,
        _count: {
          select: { bookings: true }
        }
      }
    });

    res.json(users);
  } catch (error) {
    console.error("GET RECENT USERS ERROR:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/admin/listings
 * Get all listings with pagination
 */
export async function getAllListings(req, res) {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { host: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          host: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          images: {
            take: 1
          },
          _count: {
            select: {
              bookings: true,
              reviews: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.listing.count({ where })
    ]);

    res.json({
      listings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("GET ALL LISTINGS ERROR:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/admin/reviews/pending
 * Get pending reviews for moderation
 */
export async function getPendingReviews(req, res) {
  try {
    const reviews = await prisma.review.findMany({
      where: { status: 'PENDING' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profilePhoto: true
          }
        },
        listing: {
          select: {
            id: true,
            title: true
          }
        },
        booking: {
          select: {
            bookingDate: true,
            guests: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(reviews);
  } catch (error) {
    console.error("GET PENDING REVIEWS ERROR:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * PUT /api/admin/reviews/:id/status
 * Approve or reject a review
 */
export async function updateReviewStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const review = await prisma.review.update({
      where: { id: parseInt(id) },
      data: { status },
      include: {
        user: true,
        listing: true
      }
    });

    // Create notification for reviewer
    await prisma.notification.create({
      data: {
        userId: review.userId,
        type: 'SYSTEM',
        title: `Review ${status.toLowerCase()}`,
        message: `Your review for "${review.listing.title}" has been ${status.toLowerCase()}. ${reason || ''}`,
        data: { reviewId: review.id, status }
      }
    });

    res.json({ message: `Review ${status.toLowerCase()} successfully`, review });
  } catch (error) {
    console.error("UPDATE REVIEW STATUS ERROR:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * PUT /api/admin/listings/:id/status
 * Update listing status
 */
export async function updateListingStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!['ACTIVE', 'INACTIVE', 'PENDING', 'SOLD_OUT'].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const listing = await prisma.listing.update({
      where: { id: parseInt(id) },
      data: { status }
    });

    // Create notification for host
    await prisma.notification.create({
      data: {
        userId: listing.hostId,
        type: 'SYSTEM',
        title: `Listing ${status.toLowerCase()}`,
        message: `Your listing "${listing.title}" has been ${status.toLowerCase()}. ${reason || ''}`,
        data: { listingId: listing.id, status }
      }
    });

    res.json({ message: `Listing ${status.toLowerCase()} successfully`, listing });
  } catch (error) {
    console.error("UPDATE LISTING STATUS ERROR:", error);
    res.status(500).json({ error: error.message });
  }
}