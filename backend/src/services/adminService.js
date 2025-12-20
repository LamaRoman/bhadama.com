import { prisma } from '../config/prisma.js';

export class AdminService {
  /**
   * Get dashboard statistics with comparisons
   */
  async getDashboardStats(range = '30days') {
    const now = new Date();
    let startDate = new Date();
    let previousStartDate = new Date();

    // Calculate date ranges
    switch (range) {
      case '7days':
        startDate.setDate(now.getDate() - 7);
        previousStartDate.setDate(now.getDate() - 14);
        break;
      case '30days':
        startDate.setDate(now.getDate() - 30);
        previousStartDate.setDate(now.getDate() - 60);
        break;
      case '90days':
        startDate.setDate(now.getDate() - 90);
        previousStartDate.setDate(now.getDate() - 180);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        previousStartDate.setFullYear(now.getFullYear() - 2);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
        previousStartDate.setDate(now.getDate() - 60);
    }

    // Execute all queries in parallel for better performance
    const [
      // Current period
      currentRevenue,
      currentBookings,
      activeUsers,
      totalListings,
      pendingReviews,
      avgRatingResult,
      // Previous period for comparison
      previousRevenue,
      previousBookings,
      previousActiveUsers,
      // Additional metrics
      totalRevenueAllTime,
      newUsers,
      cancelledBookings,
      topLocations,
      revenueByMonth
    ] = await Promise.all([
      // Current period revenue (completed bookings)
      prisma.booking.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: startDate }
        },
        _sum: { totalPrice: true },
        _count: true
      }),

      // Total bookings in current period
      prisma.booking.count({
        where: { createdAt: { gte: startDate } }
      }),

      // Active users (users with bookings in last 90 days)
      prisma.user.count({
        where: {
          bookings: {
            some: {
              createdAt: { 
                gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) 
              }
            }
          }
        }
      }),

      // Total active listings
      prisma.listing.count({
        where: { status: 'ACTIVE' }
      }),

      // Pending reviews
      prisma.review.count({
        where: { status: 'PENDING' }
      }),

      // Average rating
      prisma.review.aggregate({
        where: { status: 'APPROVED' },
        _avg: { rating: true }
      }),

      // Previous period revenue
      prisma.booking.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: { 
            gte: previousStartDate,
            lt: startDate
          }
        },
        _sum: { totalPrice: true },
        _count: true
      }),

      // Previous period bookings
      prisma.booking.count({
        where: { 
          createdAt: { 
            gte: previousStartDate,
            lt: startDate
          } 
        }
      }),

      // Previous period active users
      prisma.user.count({
        where: {
          bookings: {
            some: {
              createdAt: { 
                gte: new Date(previousStartDate.getTime() - 90 * 24 * 60 * 60 * 1000),
                lt: startDate
              }
            }
          }
        }
      }),

      // Total revenue all time
      prisma.booking.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { totalPrice: true }
      }),

      // New users in current period
      prisma.user.count({
        where: { createdAt: { gte: startDate } }
      }),

      // Cancelled bookings in current period
      prisma.booking.count({
        where: { 
          status: 'CANCELLED',
          createdAt: { gte: startDate }
        }
      }),

      // Top locations by bookings
      prisma.listing.groupBy({
        by: ['location'],
        where: {
          bookings: {
            some: { createdAt: { gte: startDate } }
          }
        },
        _count: {
          bookings: true
        },
        orderBy: {
          _count: {
            bookings: 'desc'
          }
        },
        take: 5
      }),

      // Revenue by month for the last 6 months
      this.getRevenueByMonth(6)
    ]);

    // Calculate percentage changes
    const calculateChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const currentRevenueValue = currentRevenue._sum.totalPrice || 0;
    const previousRevenueValue = previousRevenue._sum.totalPrice || 0;
    const revenueChange = calculateChange(currentRevenueValue, previousRevenueValue);
    
    const bookingsChange = calculateChange(currentBookings, previousBookings._count);
    const usersChange = calculateChange(activeUsers, previousActiveUsers);

    return {
      // Core stats
      totalRevenue: currentRevenueValue,
      totalBookings: currentBookings,
      activeUsers,
      totalListings,
      pendingReviews,
      avgRating: avgRatingResult._avg.rating || 0,
      
      // Changes
      revenueChange: Math.round(revenueChange * 10) / 10,
      bookingsChange: Math.round(bookingsChange * 10) / 10,
      usersChange: Math.round(usersChange * 10) / 10,
      
      // Additional metrics
      totalRevenueAllTime: totalRevenueAllTime._sum.totalPrice || 0,
      newUsers,
      cancelledBookings,
      bookingSuccessRate: currentBookings > 0 
        ? ((currentBookings - cancelledBookings) / currentBookings) * 100 
        : 100,
      
      // Detailed data
      topLocations,
      revenueByMonth,
      
      // Time period info
      periodStart: startDate,
      periodEnd: now,
      period: range
    };
  }

  /**
   * Get revenue by month for chart
   */
  async getRevenueByMonth(months = 6) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - months + 1);
    startDate.setDate(1);
    
    const results = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', b."createdAt") as month,
        COALESCE(SUM(b."totalPrice"), 0) as revenue,
        COUNT(b.id) as bookings
      FROM "Booking" b
      WHERE b.status = 'COMPLETED'
        AND b."createdAt" >= ${startDate}
        AND b."createdAt" <= ${endDate}
      GROUP BY DATE_TRUNC('month', b."createdAt")
      ORDER BY month DESC
      LIMIT ${months}
    `;
    
    return results;
  }

  /**
   * Get recent bookings with pagination
   */
  async getRecentBookings(limit = 10, page = 1) {
    const skip = (page - 1) * limit;
    
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        take: limit,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profilePhoto: true
            }
          },
          listing: {
            select: {
              id: true,
              title: true,
              location: true,
              images: {
                take: 1
              }
            }
          }
        }
      }),
      prisma.booking.count()
    ]);

    return {
      bookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get recent users with details
   */
  async getRecentUsers(limit = 8) {
    const users = await prisma.user.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        profilePhoto: true,
        role: true,
        status: true,
        createdAt: true,
        lastLogin: true,
        _count: {
          select: {
            bookings: true,
            listings: true,
            reviews: true
          }
        }
      }
    });

    return users;
  }

  /**
   * Get all listings with filters and pagination
   */
  async getAllListings(filters = {}) {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      location,
      hostId,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filters;

    const skip = (page - 1) * limit;

    const where = {};
    
    if (status) where.status = status;
    if (hostId) where.hostId = parseInt(hostId);
    if (location) where.location = { contains: location, mode: 'insensitive' };
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { amenities: { has: search } }
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
              email: true,
              profilePhoto: true
            }
          },
          images: {
            take: 3
          },
          _count: {
            select: {
              bookings: true,
              reviews: true
            }
          },
          reviews: {
            select: {
              rating: true
            }
          }
        },
        orderBy: { [sortBy]: sortOrder }
      }),
      prisma.listing.count({ where })
    ]);

    // Calculate average rating for each listing
    const listingsWithStats = listings.map(listing => {
      const avgRating = listing.reviews.length > 0
        ? listing.reviews.reduce((sum, r) => sum + r.rating, 0) / listing.reviews.length
        : 0;
      
      return {
        ...listing,
        avgRating: Math.round(avgRating * 10) / 10
      };
    });

    return {
      listings: listingsWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    };
  }

  /**
   * Get pending reviews for moderation
   */
  async getPendingReviews() {
    const reviews = await prisma.review.findMany({
      where: { status: 'PENDING' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profilePhoto: true,
            email: true
          }
        },
        listing: {
          select: {
            id: true,
            title: true,
            location: true
          }
        },
        booking: {
          select: {
            id: true,
            bookingDate: true,
            guests: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return reviews;
  }

  /**
   * Update review status with notification
   */
  async updateReviewStatus(id, status, reason = '') {
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      throw new Error('Invalid status');
    }

    const review = await prisma.review.update({
      where: { id: parseInt(id) },
      data: { 
        status,
        moderatedAt: new Date(),
        moderationReason: reason
      },
      include: {
        user: true,
        listing: true
      }
    });

    // Create notification for reviewer
    await prisma.notification.create({
      data: {
        userId: review.userId,
        type: 'REVIEW_STATUS',
        title: `Review ${status.toLowerCase()}`,
        message: `Your review for "${review.listing.title}" has been ${status.toLowerCase()}. ${reason}`,
        data: { 
          reviewId: review.id, 
          status,
          listingId: review.listingId,
          listingTitle: review.listing.title
        }
      }
    });

    // If approved, update listing rating
    if (status === 'APPROVED') {
      await this.updateListingRating(review.listingId);
    }

    return review;
  }

  /**
   * Update listing average rating
   */
  async updateListingRating(listingId) {
    const reviews = await prisma.review.findMany({
      where: {
        listingId: parseInt(listingId),
        status: 'APPROVED'
      },
      select: { rating: true }
    });

    if (reviews.length > 0) {
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      
      await prisma.listing.update({
        where: { id: parseInt(listingId) },
        data: { 
          avgRating: Math.round(avgRating * 10) / 10,
          reviewCount: reviews.length
        }
      });
    }
  }

  /**
   * Update listing status
   */
  async updateListingStatus(id, status, reason = '') {
    if (!['ACTIVE', 'INACTIVE', 'PENDING', 'SOLD_OUT', 'REJECTED'].includes(status)) {
      throw new Error('Invalid status');
    }

    const listing = await prisma.listing.update({
      where: { id: parseInt(id) },
      data: { 
        status,
        statusUpdatedAt: new Date(),
        statusReason: reason
      },
      include: {
        host: true
      }
    });

    // Create notification for host
    await prisma.notification.create({
      data: {
        userId: listing.hostId,
        type: 'LISTING_STATUS',
        title: `Listing ${status.toLowerCase()}`,
        message: `Your listing "${listing.title}" has been ${status.toLowerCase()}. ${reason}`,
        data: { 
          listingId: listing.id, 
          status,
          listingTitle: listing.title
        }
      }
    });

    return listing;
  }

  /**
   * Get user analytics
   */
  async getUserAnalytics(range = '30days') {
    const startDate = this.getStartDate(range);
    
    const [
      totalUsers,
      newUsers,
      activeUsers,
      userGrowth,
      usersByRole,
      topUsers
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { createdAt: { gte: startDate } }
      }),
      prisma.user.count({
        where: {
          bookings: {
            some: {
              createdAt: { gte: startDate }
            }
          }
        }
      }),
      this.getUserGrowthData(range),
      prisma.user.groupBy({
        by: ['role'],
        _count: true
      }),
      prisma.user.findMany({
        take: 10,
        where: {
          bookings: {
            some: {}
          }
        },
        include: {
          _count: {
            select: {
              bookings: true,
              listings: true,
              reviews: true
            }
          },
          bookings: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            include: {
              listing: {
                select: {
                  title: true
                }
              }
            }
          }
        },
        orderBy: {
          bookings: {
            _count: 'desc'
          }
        }
      })
    ]);

    return {
      totalUsers,
      newUsers,
      activeUsers,
      userGrowth,
      usersByRole,
      topUsers
    };
  }

  /**
   * Get booking analytics
   */
  async getBookingAnalytics(range = '30days') {
    const startDate = this.getStartDate(range);
    
    const [
      totalBookings,
      completedBookings,
      cancelledBookings,
      revenue,
      bookingsByStatus,
      bookingsByMonth,
      popularTimes
    ] = await Promise.all([
      prisma.booking.count({
        where: { createdAt: { gte: startDate } }
      }),
      prisma.booking.count({
        where: { 
          status: 'COMPLETED',
          createdAt: { gte: startDate } 
        }
      }),
      prisma.booking.count({
        where: { 
          status: 'CANCELLED',
          createdAt: { gte: startDate } 
        }
      }),
      prisma.booking.aggregate({
        where: { 
          status: 'COMPLETED',
          createdAt: { gte: startDate } 
        },
        _sum: { totalPrice: true }
      }),
      prisma.booking.groupBy({
        by: ['status'],
        where: { createdAt: { gte: startDate } },
        _count: true
      }),
      this.getBookingsByMonth(range),
      this.getPopularBookingTimes(range)
    ]);

    const successRate = totalBookings > 0 
      ? ((completedBookings) / totalBookings) * 100 
      : 0;

    return {
      totalBookings,
      completedBookings,
      cancelledBookings,
      revenue: revenue._sum.totalPrice || 0,
      successRate: Math.round(successRate * 10) / 10,
      bookingsByStatus,
      bookingsByMonth,
      popularTimes
    };
  }

  /**
   * Helper: Get start date based on range
   */
  getStartDate(range) {
    const now = new Date();
    const startDate = new Date(now);
    
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
    
    return startDate;
  }

  /**
   * Helper: Get user growth data
   */
  async getUserGrowthData(months = 6) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - months + 1);
    startDate.setDate(1);
    
    const results = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', "createdAt") as month,
        COUNT(id) as new_users
      FROM "User"
      WHERE "createdAt" >= ${startDate}
        AND "createdAt" <= ${endDate}
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month ASC
    `;
    
    return results;
  }

  /**
   * Helper: Get bookings by month
   */
  async getBookingsByMonth(months = 6) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - months + 1);
    startDate.setDate(1);
    
    const results = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', "createdAt") as month,
        COUNT(id) as bookings,
        SUM(CASE WHEN status = 'COMPLETED' THEN "totalPrice" ELSE 0 END) as revenue
      FROM "Booking"
      WHERE "createdAt" >= ${startDate}
        AND "createdAt" <= ${endDate}
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month ASC
    `;
    
    return results;
  }

  /**
   * Helper: Get popular booking times
   */
  async getPopularBookingTimes(range = '30days') {
    const startDate = this.getStartDate(range);
    
    const results = await prisma.$queryRaw`
      SELECT 
        EXTRACT(HOUR FROM "createdAt") as hour,
        COUNT(id) as bookings
      FROM "Booking"
      WHERE "createdAt" >= ${startDate}
      GROUP BY EXTRACT(HOUR FROM "createdAt")
      ORDER BY bookings DESC
      LIMIT 5
    `;
    
    return results;
  }
}

export const adminService = new AdminService();