// backend/src/routes/notifications.js
// API routes for notifications

import express from 'express';
import {prisma} from '../config/prisma.config.js';  // Adjust to your prisma location
import NotificationService from '../services/notification/index.js';
import { authenticate } from '../middleware/auth.middleware.js';  // Adjust to your auth middleware

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/notifications
 * Get user's notifications with pagination
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      limit = 20,
      offset = 0,
      unreadOnly = false,
      type = null,
    } = req.query;

    const result = await NotificationService.getNotifications(userId, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      unreadOnly: unreadOnly === 'true',
      types: type ? [type] : null,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

/**
 * GET /api/notifications/unread-count
 * Get unread notification count
 */
router.get('/unread-count', async (req, res) => {
  try {
    const userId = req.user.userId;
    const count = await NotificationService.getUnreadCount(userId);

    res.json({
      success: true,
      count,
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark a notification as read
 */
router.patch('/:id/read', async (req, res) => {
  try {
    const userId = req.user.userId;
    const notificationId = parseInt(req.params.id);

    await NotificationService.markAsRead(notificationId, userId);

    res.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read
 */
router.patch('/read-all', async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await NotificationService.markAllAsRead(userId);

    res.json({
      success: true,
      message: 'All notifications marked as read',
      count: result.count,
    });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

/**
 * DELETE /api/notifications/:id
 * Archive/delete a notification
 */
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.userId;
    const notificationId = parseInt(req.params.id);

    await NotificationService.archive(notificationId, userId);

    res.json({
      success: true,
      message: 'Notification archived',
    });
  } catch (error) {
    console.error('Error archiving notification:', error);
    res.status(500).json({ error: 'Failed to archive notification' });
  }
});

/**
 * GET /api/notifications/preferences
 * Get user's notification preferences
 */
router.get('/preferences', async (req, res) => {
  try {
    const userId = req.user.userId;

    const preferences = await prisma.notificationPreference.findMany({
      where: { userId },
      orderBy: { type: 'asc' },
    });

    res.json({
      success: true,
      preferences,
    });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

/**
 * PUT /api/notifications/preferences/:type
 * Update preference for a specific notification type
 */
router.put('/preferences/:type', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { type } = req.params;
    const { channels, enabled, quietStart, quietEnd, timezone } = req.body;

    const preference = await prisma.notificationPreference.upsert({
      where: {
        userId_type: {
          userId,
          type,
        },
      },
      update: {
        ...(channels !== undefined && { channels }),
        ...(enabled !== undefined && { enabled }),
        ...(quietStart !== undefined && { quietStart }),
        ...(quietEnd !== undefined && { quietEnd }),
        ...(timezone !== undefined && { timezone }),
      },
      create: {
        userId,
        type,
        channels: channels || ['IN_APP'],
        enabled: enabled ?? true,
        quietStart,
        quietEnd,
        timezone,
      },
    });

    res.json({
      success: true,
      preference,
    });
  } catch (error) {
    console.error('Error updating preference:', error);
    res.status(500).json({ error: 'Failed to update preference' });
  }
});

/**
 * PATCH /api/notifications/preferences
 * Bulk update notification preferences
 */
router.patch('/preferences', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { preferences } = req.body;

    if (!Array.isArray(preferences)) {
      return res.status(400).json({ error: 'preferences must be an array' });
    }

    const results = await Promise.all(
      preferences.map(async (pref) => {
        return prisma.notificationPreference.upsert({
          where: {
            userId_type: {
              userId,
              type: pref.type,
            },
          },
          update: {
            channels: pref.channels,
            enabled: pref.enabled,
          },
          create: {
            userId,
            type: pref.type,
            channels: pref.channels || ['IN_APP'],
            enabled: pref.enabled ?? true,
          },
        });
      })
    );

    res.json({
      success: true,
      preferences: results,
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

export default router;