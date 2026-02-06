// ==========================================
// ADMIN HOST STORY CONTROLLER
// ==========================================
// File: controllers/admin.host.story.controller.js
//
// Admin operations for host story moderation
// ==========================================

import { prisma } from "../config/prisma.config.js";
import { AppError } from "../middleware/error.middleware.js";

// ==========================================
// LIST STORIES (Moderation Queue)
// ==========================================

export const listStories = async (req, res, next) => {
  try {
    const {
      status,
      search,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { storyTitle: { contains: search, mode: "insensitive" } },
        { host: { name: { contains: search, mode: "insensitive" } } },
        { host: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Execute queries
    const [stories, total] = await Promise.all([
      prisma.hostStory.findMany({
        where,
        include: {
          host: {
            select: {
              id: true,
              name: true,
              email: true,
              profilePhoto: true,
              createdAt: true,
              _count: {
                select: {
                  listings: { where: { status: "ACTIVE" } },
                },
              },
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: parseInt(limit),
      }),
      prisma.hostStory.count({ where }),
    ]);

    res.json({
      success: true,
      data: stories,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET STORY STATS
// ==========================================

export const getStoryStats = async (req, res, next) => {
  try {
    const [total, draft, pending, published, rejected] = await Promise.all([
      prisma.hostStory.count(),
      prisma.hostStory.count({ where: { status: "DRAFT" } }),
      prisma.hostStory.count({ where: { status: "PENDING" } }),
      prisma.hostStory.count({ where: { status: "PUBLISHED" } }),
      prisma.hostStory.count({ where: { status: "REJECTED" } }),
    ]);

    res.json({
      success: true,
      data: {
        total,
        draft,
        pending,
        published,
        rejected,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET STORY FOR REVIEW
// ==========================================

export const getStoryForReview = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    const story = await prisma.hostStory.findUnique({
      where: { id },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            profilePhoto: true,
            bio: true,
            createdAt: true,
            emailVerified: true,
            phoneVerified: true,
            listings: {
              where: { status: "ACTIVE" },
              select: {
                id: true,
                title: true,
                slug: true,
                location: true,
                status: true,
                images: { take: 1, orderBy: { order: "asc" } },
              },
            },
            _count: {
              select: {
                listings: true,
                bookings: true,
              },
            },
          },
        },
      },
    });

    if (!story) {
      throw new AppError("Story not found", 404, "STORY_NOT_FOUND");
    }

    res.json({
      success: true,
      data: story,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// APPROVE STORY
// ==========================================

export const approveStory = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const adminId = req.user.userId;

    const story = await prisma.hostStory.findUnique({
      where: { id },
      include: { host: { select: { id: true, name: true } } },
    });

    if (!story) {
      throw new AppError("Story not found", 404, "STORY_NOT_FOUND");
    }

    if (story.status === "PUBLISHED") {
      throw new AppError("Story is already published", 400, "ALREADY_PUBLISHED");
    }

    const updatedStory = await prisma.hostStory.update({
      where: { id },
      data: {
        status: "PUBLISHED",
        rejectionReason: null,
        moderatedBy: adminId,
        moderatedAt: new Date(),
        publishedAt: new Date(),
      },
    });

    // Create notification for host
    await prisma.notification.create({
      data: {
        userId: story.hostId,
        type: "HOST_STORY_APPROVED",
        category: "TRANSACTIONAL",
        title: "Your Story is Published!",
        message: "Your host story has been approved and is now live.",
        actionUrl: `/hosts/${story.hostId}/story`,
      },
    });

    console.log(
      `[ADMIN] Story ${id} approved by admin ${adminId} for host ${story.host.name}`
    );

    res.json({
      success: true,
      message: "Story approved and published",
      data: updatedStory,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// REJECT STORY
// ==========================================

export const rejectStory = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const adminId = req.user.userId;
    const { reason } = req.body;

    if (!reason || reason.trim().length < 10) {
      throw new AppError(
        "Rejection reason must be at least 10 characters",
        400,
        "INVALID_REASON"
      );
    }

    const story = await prisma.hostStory.findUnique({
      where: { id },
      include: { host: { select: { id: true, name: true } } },
    });

    if (!story) {
      throw new AppError("Story not found", 404, "STORY_NOT_FOUND");
    }

    const updatedStory = await prisma.hostStory.update({
      where: { id },
      data: {
        status: "REJECTED",
        rejectionReason: reason.trim(),
        moderatedBy: adminId,
        moderatedAt: new Date(),
      },
    });

    // Create notification for host
    await prisma.notification.create({
      data: {
        userId: story.hostId,
        type: "HOST_STORY_REJECTED",
        category: "TRANSACTIONAL",
        title: "Story Needs Revision",
        message: `Your story needs some changes: ${reason.trim().substring(0, 100)}...`,
        actionUrl: "/host/dashboard/story",
        data: { rejectionReason: reason.trim() },
      },
    });

    console.log(
      `[ADMIN] Story ${id} rejected by admin ${adminId} for host ${story.host.name}`
    );

    res.json({
      success: true,
      message: "Story rejected",
      data: updatedStory,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// UNPUBLISH STORY
// ==========================================

export const unpublishStory = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const adminId = req.user.userId;
    const { reason } = req.body;

    const story = await prisma.hostStory.findUnique({
      where: { id },
    });

    if (!story) {
      throw new AppError("Story not found", 404, "STORY_NOT_FOUND");
    }

    if (story.status !== "PUBLISHED") {
      throw new AppError("Story is not published", 400, "NOT_PUBLISHED");
    }

    const updatedStory = await prisma.hostStory.update({
      where: { id },
      data: {
        status: "PENDING",
        moderatedBy: adminId,
        moderatedAt: new Date(),
        rejectionReason: reason || null,
      },
    });

    console.log(`[ADMIN] Story ${id} unpublished by admin ${adminId}`);

    res.json({
      success: true,
      message: "Story unpublished",
      data: updatedStory,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// DELETE STORY (Super Admin Only)
// ==========================================

export const deleteStory = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const adminId = req.user.userId;

    const story = await prisma.hostStory.findUnique({
      where: { id },
    });

    if (!story) {
      throw new AppError("Story not found", 404, "STORY_NOT_FOUND");
    }

    await prisma.hostStory.delete({
      where: { id },
    });

    console.log(`[ADMIN] Story ${id} deleted by super admin ${adminId}`);

    res.json({
      success: true,
      message: "Story permanently deleted",
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET MODERATION SETTINGS
// ==========================================

export const getModerationSettings = async (req, res, next) => {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: "host_story_auto_publish" },
    });

    res.json({
      success: true,
      data: {
        autoPublish: setting?.value === "true",
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// UPDATE MODERATION SETTINGS
// ==========================================

export const updateModerationSettings = async (req, res, next) => {
  try {
    const { autoPublish } = req.body;

    await prisma.systemSetting.upsert({
      where: { key: "host_story_auto_publish" },
      update: {
        value: autoPublish ? "true" : "false",
        updatedAt: new Date(),
      },
      create: {
        key: "host_story_auto_publish",
        value: autoPublish ? "true" : "false",
        description: "Auto-publish host stories without admin review",
        category: "STORY",
        dataType: "BOOLEAN",
      },
    });

    console.log(
      `[ADMIN] Host story auto-publish set to ${autoPublish} by admin ${req.user.userId}`
    );

    res.json({
      success: true,
      message: `Auto-publish ${autoPublish ? "enabled" : "disabled"}`,
      data: { autoPublish },
    });
  } catch (error) {
    next(error);
  }
};

export default {
  listStories,
  getStoryStats,
  getStoryForReview,
  approveStory,
  rejectStory,
  unpublishStory,
  deleteStory,
  getModerationSettings,
  updateModerationSettings,
};