import { prisma } from "../config/prisma.js";

/* --------------------------- HELPER FUNCTION --------------------------- */
// Update listing's average rating and review count
// NOTE: This function is currently disabled because the Listing model
// doesn't have averageRating and reviewCount fields in the schema.
// If you want to cache these values, add these fields to your Listing model:
//   averageRating  Decimal? @db.Decimal(2,1)
//   reviewCount    Int      @default(0)
const updateListingRating = async (listingId) => {
  // Disabled - remove this function call from createReview and updateReview
  // if you don't plan to add these fields to the schema
  return;
  
  /* Original implementation (uncomment if you add the fields):
  const reviews = await prisma.review.findMany({ where: { listingId } });
  if (reviews.length === 0) return;

  const averageRating =
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  await prisma.listing.update({
    where: { id: listingId },
    data: {
      averageRating: parseFloat(averageRating.toFixed(1)),
      reviewCount: reviews.length,
    },
  });
  */
};

/* --------------------------- GET REVIEWS --------------------------- */
export const getReviews = async (req, res) => {
  try {
    const listingId = parseInt(req.params.listingId);
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const sort = req.query.sort || "newest";

    if (isNaN(listingId))
      return res.status(400).json({ success: false, message: "Invalid listing ID" });

    const orderBy =
      sort === "highest"
        ? { rating: "desc" }
        : sort === "lowest"
        ? { rating: "asc" }
        : { createdAt: "desc" };

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { listingId },
        include: {
          user: { select: { id: true, name: true, profilePhoto: true } },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.review.count({ where: { listingId } }),
    ]);

    const avg =
      total === 0
        ? 0
        : (
            (
              await prisma.review.aggregate({
                where: { listingId },
                _avg: { rating: true },
              })
            )._avg.rating || 0
          );

    res.json({
      success: true,
      reviews,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
      averageRating: Number(avg.toFixed(1)),
    });
  } catch (error) {
    console.error("Get reviews error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch reviews" });
  }
};


/* --------------------------- CHECK CAN REVIEW --------------------------- */
export const checkCanReview = async (req, res) => {
  try {
    const listingId = parseInt(req.params.listingId);
    const userId = req.user.id;

    if (isNaN(listingId))
      return res
        .status(400)
        .json({
          success: false,
          canReview: false,
          reason: "Invalid listing ID",
          code: "INVALID_LISTING_ID",
        });

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, hostId: true, status: true },
    });
    if (!listing)
      return res
        .status(404)
        .json({
          success: false,
          canReview: false,
          reason: "Listing not found",
          code: "LISTING_NOT_FOUND",
        });
    if (listing.status !== "ACTIVE")
      return res.json({
        success: false,
        canReview: false,
        reason: "Listing is not active",
        code: "LISTING_INACTIVE",
      });
    if (listing.hostId === userId)
      return res.json({
        success: false,
        canReview: false,
        reason: "Hosts cannot review their own listings",
        code: "IS_HOST",
      });

    const existingReview = await prisma.review.findFirst({
      where: { listingId, userId },
    });
    if (existingReview)
      return res.json({
        success: false,
        canReview: false,
        reason: "Already reviewed this listing",
        code: "ALREADY_REVIEWED",
        reviewId: existingReview.id,
        reviewedAt: existingReview.createdAt,
      });

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const completedBookings = await prisma.booking.findMany({
      where: {
        listingId,
        userId,
        status: "COMPLETED",
        bookingDate: { lt: new Date(), gte: ninetyDaysAgo },
      },
      orderBy: { bookingDate: "desc" },
    });

    if (completedBookings.length === 0) {
      const anyBooking = await prisma.booking.findFirst({
        where: { listingId, userId },
      });
      if (!anyBooking)
        return res.json({
          success: false,
          canReview: false,
          reason: "No bookings found for this listing",
          code: "NO_BOOKINGS",
          suggestion: "Book this space to leave a review",
        });
      return res.json({
        success: false,
        canReview: false,
        reason: `Booking is ${anyBooking.status}`,
        code: "BOOKING_NOT_COMPLETED",
        bookingStatus: anyBooking.status,
      });
    }

    const lastBooking = completedBookings[0];
    const bookingDate = new Date(lastBooking.bookingDate);
    const today = new Date();
    const daysSinceBooking = Math.floor(
      (today - bookingDate) / (1000 * 60 * 60 * 24)
    );
    const MAX_REVIEW_DAYS = 30;

    if (daysSinceBooking > MAX_REVIEW_DAYS)
      return res.json({
        success: false,
        canReview: false,
        reason: `Review period has ended (must review within ${MAX_REVIEW_DAYS} days)`,
        code: "REVIEW_PERIOD_ENDED",
        daysSinceBooking,
      });

    res.json({
      success: true,
      canReview: true,
      bookingId: lastBooking.id,
      allowed: true,
      reason: "Eligible to review",
      code: "ELIGIBLE",
      bookingDetails: {
        totalBookings: completedBookings.length,
        lastBooking: {
          id: lastBooking.id,
          date: lastBooking.bookingDate,
          guests: lastBooking.guests,
        },
        daysSinceLastBooking: daysSinceBooking,
        reviewDeadline: new Date(
          bookingDate.getTime() + MAX_REVIEW_DAYS * 24 * 60 * 60 * 1000
        ),
      },
    });
  } catch (error) {
    console.error("Check review eligibility error:", error);
    res
      .status(500)
      .json({
        success: false,
        canReview: false,
        reason: "Server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
  }
};

/* --------------------------- CREATE REVIEW --------------------------- */
export const createReview = async (req, res) => {
  try {
    const listingId = parseInt(req.params.listingId);
    const userId = req.user?.id;

    const {
      bookingId,
      rating,
      title,
      comment,
      cleanliness = 5,
      accuracy = 5,
      communication = 5,
      location = 5,
      checkin = 5,
      value = 5,
    } = req.body;

    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    if (!listingId || isNaN(listingId))
      return res.status(400).json({ success: false, message: "Invalid listing ID" });

    if (!bookingId || !rating || !comment)
      return res.status(400).json({
        success: false,
        message: "Booking ID, rating, and comment are required",
      });

    const normalizedRating = Math.min(Math.max(Number(rating), 1), 5);

    // 🔒 Validate booking ownership + status
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId,
        listingId,
        status: "COMPLETED",
      },
    });

    if (!booking)
      return res.status(403).json({
        success: false,
        message: "Invalid or incomplete booking",
      });

    if (booking.hasReviewed)
      return res.status(400).json({
        success: false,
        message: "This booking has already been reviewed",
      });

    const review = await prisma.review.create({
      data: {
        rating: normalizedRating,
        title,
        comment,
        cleanliness,
        accuracy,
        communication,
        location,
        checkin,
        value,
        booking: { connect: { id: bookingId } },
        listing: { connect: { id: listingId } },
        user: { connect: { id: userId } },
      },
      include: {
        user: { select: { id: true, name: true, profilePhoto: true } },
      },
    });

    await prisma.booking.update({
      where: { id: bookingId },
      data: { hasReviewed: true },
    });

    res.status(201).json({
      success: true,
      message: "Review created successfully",
      review,
    });
  } catch (error) {
    console.error("Create review error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create review",
    });
  }
};


/* --------------------------- UPDATE REVIEW --------------------------- */
export const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { rating, title, comment } = req.body;

    const review = await prisma.review.findFirst({
      where: { id, userId },
    });

    if (!review)
      return res.status(404).json({
        success: false,
        message: "Review not found or unauthorized",
      });

    const daysSince = Math.floor(
      (Date.now() - new Date(review.createdAt)) / (1000 * 60 * 60 * 24)
    );

    if (daysSince > 7)
      return res.status(403).json({
        success: false,
        message: "Review can only be edited within 7 days",
      });

    const updated = await prisma.review.update({
      where: { id },
      data: {
        rating: rating ? Math.min(Math.max(Number(rating), 1), 5) : review.rating,
        title: title ?? review.title,
        comment: comment ?? review.comment,
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: "Review updated",
      review: updated,
    });
  } catch (error) {
    console.error("Update review error:", error);
    res.status(500).json({ success: false, message: "Failed to update review" });
  }
};


/* --------------------------- MARK HELPFUL --------------------------- */
export const markHelpful = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existingHelpful = await prisma.reviewHelpful.findUnique({
      where: { reviewId_userId: { reviewId: id, userId } },
    });

    if (existingHelpful) {
      await prisma.reviewHelpful.delete({
        where: { reviewId_userId: { reviewId: id, userId } },
      });
      await prisma.review.update({
        where: { id },
        data: { helpfulCount: { decrement: 1 } },
      });
      return res.json({
        success: true,
        message: "Removed helpful mark",
        isHelpful: false,
      });
    }

    await prisma.reviewHelpful.create({ data: { reviewId: id, userId } });
    await prisma.review.update({
      where: { id },
      data: { helpfulCount: { increment: 1 } },
    });

    res.json({ success: true, message: "Marked as helpful", isHelpful: true });
  } catch (error) {
    console.error("Mark helpful error:", error);
    res.status(500).json({ success: false, message: "Failed to mark review" });
  }
};

/* --------------------------- REPORT REVIEW --------------------------- */
export const reportReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { reason } = req.body;

    const existingReport = await prisma.reviewReport.findUnique({
      where: { reviewId_userId: { reviewId: id, userId } },
    });
    if (existingReport)
      return res
        .status(400)
        .json({ success: false, message: "Already reported this review" });

    await prisma.reviewReport.create({
      data: { reviewId: id, userId, reason: reason || "Inappropriate content" },
    });

    const reportCount = await prisma.reviewReport.count({
      where: { reviewId: id },
    });
    if (reportCount >= 3)
      await prisma.review.update({ where: { id }, data: { reported: true } });

    res.json({ success: true, message: "Review reported successfully" });
  } catch (error) {
    console.error("Report review error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to report review" });
  }
};

/* --------------------------- GET ELIGIBLE BOOKINGS --------------------------- */
export const getEligibleBookings = async (req, res) => {
  try {
    const listingId = parseInt(req.params.listingId);
    const userId = req.user.id;
    if (isNaN(listingId))
      return res
        .status(400)
        .json({ success: false, message: "Invalid listing ID" });

    const completedBookings = await prisma.booking.findMany({
      where: { listingId, userId, status: "COMPLETED", review: { is: null } },
      orderBy: { bookingDate: "desc" },
      select: {
        id: true,
        bookingDate: true,
        startTime: true,
        endTime: true,
        guests: true,
        totalPrice: true,
      },
    });

    res.json({ success: true, bookings: completedBookings });
  } catch (error) {
    console.error("Get eligible bookings error:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch eligible bookings",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
  }
};

