// ==========================================
// HOST STORY CONTROLLER - FIXED VERSION
// ==========================================
// File: controllers/host.story.controller.js
//
// FIXES APPLIED:
// 1. ✅ Wrapped console.log with dev check
// 2. ✅ Uses req.user.userId (consistent with auth.middleware.js)
//
// Handles host story operations:
// - Create, read, update story (about the host)
// - Submit for review
// - Public story viewing
// ==========================================

import { prisma } from "../config/prisma.config.js";
import { AppError } from "../middleware/error.middleware.js";

// ==========================================
// UTILITY: Conditional logging (dev only)
// ==========================================
const devLog = (...args) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
};

// ==========================================
// HELPER: Get Auto-Publish Setting
// ==========================================

async function shouldAutoPublish() {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: "host_story_auto_publish" },
    });
    return setting?.value === "true";
  } catch {
    return false; // Default to review required
  }
}

// ==========================================
// HELPER: Check if content changed
// ==========================================

function hasContentChanged(existing, updates) {
  const contentFields = [
    "storyTitle",
    "storyContent",
    "tagline",
    "hostMessage",
    "highlights",
    "specialties",
    "funFacts",
  ];

  return contentFields.some((field) => {
    if (updates[field] === undefined) return false;
    return JSON.stringify(existing[field]) !== JSON.stringify(updates[field]);
  });
}

// ==========================================
// CREATE STORY
// ==========================================

export const createStory = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // Check if user is a host
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, name: true },
    });

    if (!user || user.role !== "HOST") {
      throw new AppError("Only hosts can create stories", 403, "NOT_A_HOST");
    }

    // Check if story already exists
    const existingStory = await prisma.hostStory.findUnique({
      where: { hostId: userId },
    });

    if (existingStory) {
      throw new AppError(
        "Story already exists. Use PUT to update.",
        409,
        "STORY_EXISTS"
      );
    }

    // Determine initial status
    const autoPublish = await shouldAutoPublish();
    const requestedStatus = req.body.status || "PENDING";

    let status;
    if (requestedStatus === "DRAFT") {
      status = "DRAFT";
    } else if (autoPublish) {
      status = "PUBLISHED";
    } else {
      status = "PENDING";
    }

    // Create story
    const story = await prisma.hostStory.create({
      data: {
        hostId: userId,
        hostingSince: req.body.hostingSince,
        tagline: req.body.tagline,
        storyTitle: req.body.storyTitle,
        storyContent: req.body.storyContent,
        highlights: req.body.highlights || [],
        specialties: req.body.specialties || [],
        funFacts: req.body.funFacts || [],
        hostMessage: req.body.hostMessage,
        videoUrl: req.body.videoUrl,
        coverImage: req.body.coverImage,
        websiteUrl: req.body.websiteUrl,
        facebookUrl: req.body.facebookUrl,
        instagramUrl: req.body.instagramUrl,
        tiktokUrl: req.body.tiktokUrl,
        status,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
      },
      include: {
        host: {
          select: { id: true, name: true, profilePhoto: true },
        },
      },
    });

    devLog(`[HOST_STORY] Created for host ${userId}, status: ${status}`);

    let message;
    if (status === "DRAFT") {
      message = "Story saved as draft";
    } else if (status === "PUBLISHED") {
      message = "Story published successfully";
    } else {
      message = "Story submitted for review";
    }

    res.status(201).json({
      success: true,
      message,
      data: story,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET OWN STORY (Host View)
// ==========================================

export const getOwnStory = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const story = await prisma.hostStory.findUnique({
      where: { hostId: userId },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            profilePhoto: true,
            bio: true,
            createdAt: true,
          },
        },
      },
    });

    // Return null instead of error when no story exists
    // This allows frontend to show the create form
    res.json({
      success: true,
      data: story,  // Will be null if no story exists
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// UPDATE STORY
// ==========================================

export const updateStory = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const existingStory = await prisma.hostStory.findUnique({
      where: { hostId: userId },
    });

    if (!existingStory) {
      throw new AppError("Story not found", 404, "STORY_NOT_FOUND");
    }

    // Determine if update requires re-review
    const autoPublish = await shouldAutoPublish();
    const contentChanged = hasContentChanged(existingStory, req.body);

    let newStatus = existingStory.status;

    // If content changed and was published, may need re-review
    if (contentChanged && existingStory.status === "PUBLISHED" && !autoPublish) {
      newStatus = "PENDING"; // Re-submit for review
    }

    // If explicitly requesting draft status
    if (req.body.status === "DRAFT" && existingStory.status !== "PUBLISHED") {
      newStatus = "DRAFT";
    }

    const story = await prisma.hostStory.update({
      where: { hostId: userId },
      data: {
        hostingSince: req.body.hostingSince ?? existingStory.hostingSince,
        tagline: req.body.tagline ?? existingStory.tagline,
        storyTitle: req.body.storyTitle ?? existingStory.storyTitle,
        storyContent: req.body.storyContent ?? existingStory.storyContent,
        highlights: req.body.highlights ?? existingStory.highlights,
        specialties: req.body.specialties ?? existingStory.specialties,
        funFacts: req.body.funFacts ?? existingStory.funFacts,
        hostMessage: req.body.hostMessage ?? existingStory.hostMessage,
        videoUrl: req.body.videoUrl ?? existingStory.videoUrl,
        coverImage: req.body.coverImage ?? existingStory.coverImage,
        websiteUrl: req.body.websiteUrl ?? existingStory.websiteUrl,
        facebookUrl: req.body.facebookUrl ?? existingStory.facebookUrl,
        instagramUrl: req.body.instagramUrl ?? existingStory.instagramUrl,
        tiktokUrl: req.body.tiktokUrl ?? existingStory.tiktokUrl,
        status: newStatus,
        rejectionReason: newStatus === "PENDING" ? null : existingStory.rejectionReason,
        updatedAt: new Date(),
      },
      include: {
        host: {
          select: { id: true, name: true, profilePhoto: true },
        },
      },
    });

    devLog(`[HOST_STORY] Updated for host ${userId}`);

    let message;
    if (newStatus === "PENDING" && existingStory.status === "PUBLISHED") {
      message = "Story updated and resubmitted for review";
    } else if (newStatus === "DRAFT") {
      message = "Story saved as draft";
    } else {
      message = "Story updated successfully";
    }

    res.json({
      success: true,
      message,
      data: story,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// SUBMIT FOR REVIEW
// ==========================================

export const submitForReview = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const existingStory = await prisma.hostStory.findUnique({
      where: { hostId: userId },
    });

    if (!existingStory) {
      throw new AppError("Story not found", 404, "STORY_NOT_FOUND");
    }

    if (existingStory.status === "PUBLISHED") {
      throw new AppError("Story is already published", 400, "ALREADY_PUBLISHED");
    }

    if (existingStory.status === "PENDING") {
      throw new AppError("Story is already pending review", 400, "ALREADY_PENDING");
    }

    // Check if auto-publish is enabled
    const autoPublish = await shouldAutoPublish();
    const newStatus = autoPublish ? "PUBLISHED" : "PENDING";

    const story = await prisma.hostStory.update({
      where: { hostId: userId },
      data: {
        status: newStatus,
        rejectionReason: null,
        publishedAt: newStatus === "PUBLISHED" ? new Date() : null,
        updatedAt: new Date(),
      },
    });

    devLog(`[HOST_STORY] Submitted for host ${userId}, status: ${newStatus}`);

    res.json({
      success: true,
      message: autoPublish
        ? "Story published successfully"
        : "Story submitted for review",
      data: story,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// PUBLIC STORY VIEW (by hostId)
// ==========================================

export const getPublicStory = async (req, res, next) => {
  try {
    const hostId = parseInt(req.params.hostId);

    const story = await prisma.hostStory.findFirst({
      where: {
        hostId,
        status: "PUBLISHED", // Only published stories
      },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            profilePhoto: true,
            bio: true,
            createdAt: true,
            // Include host's listings for context
            listings: {
              where: { status: "ACTIVE" },
              select: {
                id: true,
                title: true,
                slug: true,
                location: true,
                images: { take: 1, orderBy: { order: "asc" } },
              },
              take: 6,
            },
            // Include review stats
            _count: {
              select: {
                listings: { where: { status: "ACTIVE" } },
              },
            },
          },
        },
      },
    });

    if (!story) {
      throw new AppError("Story not found", 404, "STORY_NOT_FOUND");
    }

    // Increment view count (non-blocking)
    prisma.hostStory
      .update({
        where: { id: story.id },
        data: { viewCount: { increment: 1 } },
      })
      .catch(() => {});

    res.json({
      success: true,
      data: story,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// FEATURED HOST STORIES
// ==========================================

export const getFeaturedStories = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 6;

    const stories = await prisma.hostStory.findMany({
      where: {
        status: "PUBLISHED",
        host: {
          role: "HOST",
          suspended: false,
          // Only hosts with active listings
          listings: {
            some: { status: "ACTIVE" },
          },
        },
      },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            profilePhoto: true,
            listings: {
              where: { status: "ACTIVE" },
              select: {
                id: true,
                title: true,
                slug: true,
                location: true,
                images: { take: 1, orderBy: { order: "asc" } },
              },
              take: 3,
            },
            _count: {
              select: {
                listings: { where: { status: "ACTIVE" } },
              },
            },
          },
        },
      },
      orderBy: [{ publishedAt: "desc" }],
      take: limit,
    });

    res.json({
      success: true,
      data: stories,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// CHECK IF HOST HAS STORY
// ==========================================

export const checkStoryExists = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const story = await prisma.hostStory.findUnique({
      where: { hostId: userId },
      select: { id: true, status: true },
    });

    res.json({
      success: true,
      data: {
        exists: !!story,
        status: story?.status || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// EXPORTS
// ==========================================

export default {
  createStory,
  getOwnStory,
  updateStory,
  submitForReview,
  getPublicStory,
  getFeaturedStories,
  checkStoryExists,
};