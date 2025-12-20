import { prisma } from '../config/prisma.js';

// Get reviews for a listing
export const getReviews = async (req, res) => {
  try {
    const { listingId } = req.params;

    // Convert to integer if your ID is numeric
    const listingIdInt = parseInt(listingId);
    
    if (isNaN(listingIdInt)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid listing ID'
      });
    }

    // Get reviews with user details
    const reviews = await prisma.review.findMany({
      where: { 
        listingId: listingIdInt // Use the converted value, not the variable name
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profilePhoto: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate average rating
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
      : 0;

    // Get rating distribution
    const ratingDistribution = {};
    for (let i = 1; i <= 5; i++) {
      ratingDistribution[i] = reviews.filter(r => Math.round(r.rating) === i).length;
    }

    res.json({
      success: true,
      reviews,
      averageRating: parseFloat(averageRating.toFixed(1)),
      totalReviews,
      ratingDistribution
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch reviews',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Check if user can review
export const checkCanReview = async (req, res) => {
  console.log("listingId param =", req.params.listingId, typeof req.params.listingId);

  try {
    const listingIdInt  = Number(req.params.listingId);
    const userId = req.user.id;
    
    if (!Number.isInteger(listingIdInt)) {
      return res.status(400).json({
        success: false,
        canReview: false,
        reason: 'Invalid listing ID',
        code: 'INVALID_LISTING_ID'
      });
    }

    // 1. Check if listing exists and is active
    const listing = await prisma.listing.findUnique({
      where: { id: listingIdInt }, // Use the converted integer
      select: { id: true, hostId: true, status: true }
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        canReview: false,
        reason: 'Listing not found',
        code: 'LISTING_NOT_FOUND'
      });
    }

    if (listing.status !== 'ACTIVE') {
      return res.json({
        success: false,
        canReview: false,
        reason: 'Listing is not active',
        code: 'LISTING_INACTIVE'
      });
    }

    // 2. Check if user is the host
    if (listing.hostId === userId) {
      return res.json({
        success: false,
        canReview: false,
        reason: 'Hosts cannot review their own listings',
        code: 'IS_HOST'
      });
    }

    // 3. Check if user already reviewed this listing
    const existingReview = await prisma.review.findFirst({
      where: {
        listingId: listingIdInt, // Use the converted integer
        userId
      }
    });

    if (existingReview) {
      return res.json({
        success: false,
        canReview: false,
        reason: 'Already reviewed this listing',
        code: 'ALREADY_REVIEWED',
        reviewId: existingReview.id,
        reviewedAt: existingReview.createdAt
      });
    }

    // 4. Check for COMPLETED bookings within last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const completedBookings = await prisma.booking.findMany({
      where: {
        listingId: listingIdInt, // Use the converted integer
        userId,
        status: 'COMPLETED',
        bookingDate: {
          lt: new Date(), // Past bookings only
          gte: ninetyDaysAgo // Within last 90 days
        }
      },
      orderBy: {
        bookingDate: 'desc'
      }
    });

    // 5. If no completed bookings, check for any bookings
    if (completedBookings.length === 0) {
      const anyBooking = await prisma.booking.findFirst({
        where: {
          listingId: listingIdInt, // Use the converted integer
          userId
        }
      });

      if (!anyBooking) {
        return res.json({
          success: false,
          canReview: false,
          reason: 'No bookings found for this listing',
          code: 'NO_BOOKINGS',
          suggestion: 'Book this space to leave a review'
        });
      }

      return res.json({
        success: false,
        canReview: false,
        reason: `Booking is ${anyBooking.status}`,
        code: 'BOOKING_NOT_COMPLETED',
        bookingStatus: anyBooking.status
      });
    }

    // 6. Check timing restrictions (must review within 30 days of booking)
    const lastBooking = completedBookings[0];
    const bookingDate = new Date(lastBooking.bookingDate);
    const today = new Date();
    const daysSinceBooking = Math.floor((today - bookingDate) / (1000 * 60 * 60 * 24));
    
    const MAX_REVIEW_DAYS = 30;

    if (daysSinceBooking > MAX_REVIEW_DAYS) {
      return res.json({
        success: false,
        canReview: false,
        reason: `Review period has ended (must review within ${MAX_REVIEW_DAYS} days)`,
        code: 'REVIEW_PERIOD_ENDED',
        daysSinceBooking
      });
    }

    // 7. User is eligible to review!
    return res.json({
      success: true,
      canReview: true,
      allowed: true,
      reason: 'Eligible to review',
      code: 'ELIGIBLE',
      bookingDetails: {
        totalBookings: completedBookings.length,
        lastBooking: {
          id: lastBooking.id,
          date: lastBooking.bookingDate,
          guests: lastBooking.guests
        },
        daysSinceLastBooking: daysSinceBooking,
        reviewDeadline: new Date(bookingDate.getTime() + (MAX_REVIEW_DAYS * 24 * 60 * 60 * 1000))
      }
    });

  } catch (error) {
    console.error('Check review eligibility error:', error);
    res.status(500).json({
      success: false,
      canReview: false,
      reason: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create a review
export const createReview = async (req, res) => {
  try {
    const listingId = parseInt(req.params.listingId);
    const userId = req.user.id; // authenticate middleware must set this
    const {
      rating,
      title,
      comment,
      cleanliness = 5,
      accuracy = 5,
      communication = 5,
      location = 5,
      checkin = 5,
      value = 5
    } = req.body;

    if (!listingId || isNaN(listingId)) {
      return res.status(400).json({ success: false, message: "Invalid listing ID" });
    }

    if (!rating || !comment) {
      return res.status(400).json({ success: false, message: "Rating and comment are required" });
    }

    // Check if user already reviewed
    const existingReview = await prisma.review.findFirst({
      where: { listingId, userId }
    });

    if (existingReview) {
      return res.status(400).json({ success: false, message: "You have already reviewed this listing" });
    }

    // Find last completed booking for this user & listing
    const lastBooking = await prisma.booking.findFirst({
      where: { listingId, userId, status: "COMPLETED" },
      orderBy: { bookingDate: "desc" }
    });

    if (!lastBooking) {
      return res.status(400).json({ success: false, message: "You need a completed booking to leave a review" });
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        listingId,
        userId,
        booking: { connect: { id: lastBooking.id } },
        rating: parseInt(rating),
        title: title || "",
        comment,
        cleanliness: parseInt(cleanliness),
        accuracy: parseInt(accuracy),
        communication: parseInt(communication),
        location: parseInt(location),
        checkin: parseInt(checkin),
        value: parseInt(value)
      },
      include: {
        user: { select: { id: true, name: true, profilePhoto: true } }
      }
    });

    // Update listing rating
    await updateListingRating(listingId);

    res.status(201).json({
      success: true,
      message: "Review created successfully",
      review
    });

  } catch (error) {
    console.error("Create review error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create review",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// Helper to update listing's average rating
const updateListingRating = async (listingId) => {
  const reviews = await prisma.review.findMany({ where: { listingId } });
  if (reviews.length === 0) return;

  const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  await prisma.listing.update({
    where: { id: listingId },
    data: {
      averageRating: parseFloat(averageRating.toFixed(1)),
      reviewCount: reviews.length
    }
  });
};


// The rest of your functions (updateReview, markHelpful, reportReview) remain the same...
// Update a review
export const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { rating, title, comment } = req.body;

    // Check if review exists and belongs to user
    const review = await prisma.review.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or you are not authorized to edit it'
      });
    }

    // Update review
    const updatedReview = await prisma.review.update({
      where: { id },
      data: {
        rating: rating ? parseInt(rating) : review.rating,
        title: title !== undefined ? title : review.title,
        comment: comment || review.comment,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profilePhoto: true
          }
        }
      }
    });

    // Update listing rating
    await updateListingRating(review.listingId);

    res.json({
      success: true,
      message: 'Review updated successfully',
      review: updatedReview
    });

  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update review'
    });
  }
};

// Mark review as helpful
export const markHelpful = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if user already marked this review as helpful
    const existingHelpful = await prisma.reviewHelpful.findUnique({
      where: {
        reviewId_userId: {
          reviewId: id,
          userId
        }
      }
    });

    if (existingHelpful) {
      // Remove helpful mark
      await prisma.reviewHelpful.delete({
        where: {
          reviewId_userId: {
            reviewId: id,
            userId
          }
        }
      });

      // Decrement helpful count
      await prisma.review.update({
        where: { id },
        data: {
          helpfulCount: { decrement: 1 }
        }
      });

      return res.json({
        success: true,
        message: 'Removed helpful mark',
        isHelpful: false
      });
    }

    // Add helpful mark
    await prisma.reviewHelpful.create({
      data: {
        reviewId: id,
        userId
      }
    });

    // Increment helpful count
    await prisma.review.update({
      where: { id },
      data: {
        helpfulCount: { increment: 1 }
      }
    });

    res.json({
      success: true,
      message: 'Marked as helpful',
      isHelpful: true
    });

  } catch (error) {
    console.error('Mark helpful error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark review'
    });
  }
};

// Report a review
export const reportReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { reason } = req.body;

    // Check if already reported
    const existingReport = await prisma.reviewReport.findUnique({
      where: {
        reviewId_userId: {
          reviewId: id,
          userId
        }
      }
    });

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: 'You have already reported this review'
      });
    }

    // Create report
    await prisma.reviewReport.create({
      data: {
        reviewId: id,
        userId,
        reason: reason || 'Inappropriate content'
      }
    });

    // Update review reported status if multiple reports
    const reportCount = await prisma.reviewReport.count({
      where: { reviewId: id }
    });

    if (reportCount >= 3) { // Threshold for auto-hiding
      await prisma.review.update({
        where: { id },
        data: { reported: true }
      });
    }

    res.json({
      success: true,
      message: 'Review reported successfully'
    });

  } catch (error) {
    console.error('Report review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to report review'
    });
  }
};