import asyncHandler from "express-async-handler";
import {
  getListingReviews,
  calculateReviewStats
} from "../services/reviewService.js";
import { prisma } from "../config/prisma.js";

// @desc    Get all reviews for host
// @route   GET /api/host/reviews
// @access  Private/Host

// @desc    Get review statistics for a listing
// @route   GET /api/publicListings/:id/reviews/stats
// @access  Public
// @desc    Get approved reviews for a listing (public)
// @route   GET /api/publicListings/:id/reviews
// @access  Public
export const getPublicListingReviews = asyncHandler(async (req, res) => {
  const listingId = parseInt(req.params.id);

  if (isNaN(listingId)) {
    res.status(400);
    throw new Error("Invalid listing ID");
  }

  const reviews = await getListingReviews(listingId);
  const stats = await calculateReviewStats(listingId);

  res.json({
    success: true,
    reviews,
    stats
  });
});


export const getPublicReviewStats = asyncHandler(async (req, res) => {
  const listingId = parseInt(req.params.id);

  if (isNaN(listingId)) {
    res.status(400);
    throw new Error("Invalid listing ID");
  }

  const stats = await calculateReviewStats(listingId);

  res.json({
    success: true,
    stats
  });
});

export const getHostReviews = asyncHandler(async (req, res) => {
  const hostId = req.user.userId;

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
// In hostReviewController.js, update submitReviewReply:

// In hostReviewController.js, update submitReviewReply:
// Add this complete function to your hostReviewController.js

export const submitReviewReply = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { response } = req.body;
  
  console.log('🔍 [submitReviewReply] Starting...');
  console.log('🔍 Review ID:', id);
  console.log('🔍 Response text:', response);
  console.log('🔍 Full req.user:', req.user);
  
  // Get host ID from authenticated user
  const hostId = req.user?.userId;
  
  if (!hostId) {
    console.error('❌ No userId found in req.user:', req.user);
    return res.status(401).json({
      success: false,
      error: 'User not authenticated'
    });
  }

  if (!response || !response.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Response text is required'
    });
  }

  const reviewId = parseInt(id);
  if (isNaN(reviewId)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid review ID'
    });
  }

  try {
    // Find the review and verify it belongs to host's listing
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        listing: {
          select: { hostId: true }
        }
      }
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }

    // Verify the review belongs to a listing owned by this host
    if (review.listing.hostId !== hostId) {
      return res.status(403).json({
        success: false,
        error: 'You can only reply to reviews on your own listings'
      });
    }

    // Update the review with host response
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        hostResponse: response.trim(),
        respondedAt: new Date()
      },
      include: {
        user: {
          select: { id: true, name: true, profilePhoto: true }
        },
        listing: {
          select: { id: true, title: true }
        }
      }
    });

    console.log('✅ Review reply saved successfully');

    res.json({
      success: true,
      message: 'Reply submitted successfully',
      review: updatedReview
    });

  } catch (error) {
    console.error('❌ Error submitting review reply:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit reply'
    });
  }
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