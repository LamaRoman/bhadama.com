import { prisma } from "../config/prisma.config.js";

export async function getListingReviews(listingId) {
  return await prisma.review.findMany({
    where: { 
      listingId,
      status: "APPROVED"
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          profilePhoto: true
        }
      },
      booking: {
        select: {
          bookingDate: true,
          guests: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function getUserReviews(userId) {
  return await prisma.review.findMany({
    where: { userId },
    include: {
      listing: {
        include: {
          images: {
            where: { isCover: true },
            take: 1
          }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function calculateReviewStats(listingId) {
  const reviews = await prisma.review.findMany({
    where: { listingId, status: "APPROVED" }
  });

  if (reviews.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    };
  }

  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(review => {
    distribution[review.rating]++;
  });

  return {
    averageRating,
    totalReviews: reviews.length,
    distribution
  };
}

export async function checkReviewEligibility(listingId, userId) {
  const completedBookings = await prisma.booking.findMany({
    where: {
      listingId,
      userId,
      status: "COMPLETED",
      bookingDate: { lt: new Date() }
    }
  });

  if (!completedBookings.length) {
    return { canReview: false, reason: "No completed bookings found" };
  }

  const existingReview = await prisma.review.findFirst({
    where: {
      bookingId: completedBookings[0].id
    }
  });

  if (existingReview) {
    return { canReview: false, reason: "Already reviewed" };
  }

  return {
    canReview: true,
    bookingOptions: completedBookings
  };
}
