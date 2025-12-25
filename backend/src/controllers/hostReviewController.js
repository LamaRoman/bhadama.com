import asyncHandler from "express-async-handler";
import {
  getListingReviews,
  calculateReviewStats
} from "../services/reviewService.js";
import { prisma } from "../config/prisma.js";

// @desc    Get all reviews for host
// @route   GET /api/host/reviews
// @access  Private/Host
export const getHostReviews = asyncHandler(async (req, res) => {
  const hostId = req.user.id;

  const reviews = await prisma.review.findMany({
    where: {
      listing: { hostId }
    },
    include: {
      user: {
        select: { id: true, name: true, profilePhoto: true }
      },
      listing: {
        select: { id: true, title: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  res.json({
    success: true,
    reviews,
    total: reviews.length,
    pending: reviews.filter(r => !r.hostResponse).length
  });
});


// @desc    Get review statistics
// @route   GET /api/host/reviews/stats
// @access  Private/Host
export const getReviewStats = asyncHandler(async (req, res) => {
  const hostId = req.user.id;

  const reviews = await prisma.review.findMany({
    where: {
      listing: { hostId }
    }
  });

  const total = reviews.length;
  const average =
    total === 0
      ? 0
      : reviews.reduce((sum, r) => sum + r.rating, 0) / total;

  res.json({
    success: true,
    stats: {
      totalReviews: total,
      averageRating: average,
      respondedCount: reviews.filter(r => r.hostResponse).length
    }
  });
});


// @desc    Submit reply to a review
// @route   POST /api/host/reviews/:id/reply
// @access  Private/Host
export const submitReviewReply = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { response } = req.body;
  const hostId = req.user.id;

  if (!response?.trim()) {
    res.status(400);
    throw new Error("Response text is required");
  }

  const review = await prisma.review.findUnique({
    where: { id },
    include: { listing: true }
  });

  if (!review || review.listing.hostId !== hostId) {
    res.status(404);
    throw new Error("Review not found");
  }

  const updated = await prisma.review.update({
    where: { id },
    data: {
      hostResponse: response,
      respondedAt: new Date()
    }
  });

  res.json({
    success: true,
    review: updated
  });
});


// @desc    Flag review for removal
// @route   POST /api/host/reviews/:id/flag
// @access  Private/Host
export const flagReviewForRemoval = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // In real app, you would create a flag request in database
    // and notify admins for review

    res.json({
      success: true,
      message: 'Review has been flagged for removal',
      reviewId: id
    });
  } catch (error) {
    console.error('Error flagging review:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to flag review'
    });
  }
});

// @desc    Mark review as helpful/not helpful
// @route   POST /api/host/reviews/:id/feedback
// @access  Private/Host
export const markReviewFeedback = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { helpful } = req.body;

    const review = mockHostReviews.find(r => r.id === id);
    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }

    review.markedHelpful = helpful;

    res.json({
      success: true,
      message: `Review marked as ${helpful ? 'helpful' : 'not helpful'}`,
      review: review
    });
  } catch (error) {
    console.error('Error marking feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark feedback'
    });
  }
});