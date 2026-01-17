// backend/src/services/notification/NotificationService.js
// Core notification orchestrator

import {prisma} from '../../config/prisma.config.js';  
import InAppChannel from './channels/inApp.channel.js';
import EmailChannel from './channels/email.channel.js';
import SMSChannel from './channels/sms.channel.js';
import TemplateEngine from './templates/TemplateEngine.js';
import { DEFAULT_CHANNELS, NOTIFICATION_CONFIG } from './config.js';

class NotificationService {
  constructor() {
    this.channels = {
      IN_APP: InAppChannel,
      EMAIL: EmailChannel,
      SMS: SMSChannel,
      // PUSH: PushChannel, // Future
    };
  }

  /**
   * Send a notification to a user
   * 
   * @param {Object} options
   * @param {string} options.type - NotificationType enum value
   * @param {number} options.userId - Target user ID
   * @param {Object} options.data - Data for template variables
   * @param {string[]} options.channels - Override default channels (optional)
   * @param {string} options.actionUrl - Link for the notification (optional)
   * @param {Date} options.scheduledFor - Schedule for later (optional)
   */
  async send({ type, userId, data = {}, channels = null, actionUrl = null, scheduledFor = null }) {
    try {
      // 1. Get user with preferences
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          country: true,
          notificationPreferences: {
            where: { type }
          }
        }
      });

      if (!user) {
        console.error(`[Notification] User ${userId} not found`);
        return { success: false, error: 'User not found' };
      }

      // 2. Determine channels to use
      const channelsToUse = this.determineChannels(type, channels, user.notificationPreferences[0]);

      if (channelsToUse.length === 0) {
        console.log(`[Notification] No channels enabled for ${type} to user ${userId}`);
        return { success: true, skipped: true, reason: 'No channels enabled' };
      }

      // 3. Get templates for each channel
      const templates = await this.getTemplates(type, channelsToUse);

      // 4. Prepare template variables
      const variables = this.prepareVariables(user, data);

      // 5. Render content for each channel
      const renderedContent = {};
      for (const channel of channelsToUse) {
        const template = templates[channel];
        if (template) {
          renderedContent[channel] = {
            title: TemplateEngine.render(template.title, variables),
            body: TemplateEngine.render(template.body, variables),
            subject: template.subject ? TemplateEngine.render(template.subject, variables) : null,
          };
        } else {
          // Fallback to data-based content if no template
          renderedContent[channel] = {
            title: data.title || NOTIFICATION_CONFIG[type]?.defaultTitle || type,
            body: data.message || data.body || '',
            subject: data.subject || data.title || type,
          };
        }
      }

      // 6. Create notification record
      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          category: NOTIFICATION_CONFIG[type]?.category || 'TRANSACTIONAL',
          title: renderedContent.IN_APP?.title || renderedContent[channelsToUse[0]]?.title,
          message: renderedContent.IN_APP?.body || renderedContent[channelsToUse[0]]?.body,
          data,
          channels: channelsToUse,
          actionUrl,
          scheduledFor,
        }
      });

      // 7. If scheduled for later, don't send now
      if (scheduledFor && new Date(scheduledFor) > new Date()) {
        console.log(`[Notification] Scheduled ${type} for user ${userId} at ${scheduledFor}`);
        return { success: true, notificationId: notification.id, scheduled: true };
      }

      // 8. Send through each channel
      const deliveryResults = await this.deliverToChannels(
        notification,
        channelsToUse,
        renderedContent,
        user
      );

      console.log(`[Notification] Sent ${type} to user ${userId} via ${channelsToUse.join(', ')}`);

      return {
        success: true,
        notificationId: notification.id,
        deliveries: deliveryResults,
      };

    } catch (error) {
      console.error(`[Notification] Error sending ${type} to user ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send notification to multiple users
   */
  async sendToMany({ type, userIds, data = {}, channels = null }) {
    const results = await Promise.allSettled(
      userIds.map(userId => this.send({ type, userId, data, channels }))
    );

    return {
      total: userIds.length,
      succeeded: results.filter(r => r.status === 'fulfilled' && r.value.success).length,
      failed: results.filter(r => r.status === 'rejected' || !r.value?.success).length,
      results,
    };
  }

  /**
   * Schedule a notification for later
   */
  async schedule({ type, userId, data, sendAt, channels = null, actionUrl = null }) {
    return this.send({
      type,
      userId,
      data,
      channels,
      actionUrl,
      scheduledFor: sendAt,
    });
  }

  /**
   * Process scheduled notifications (call from cron job)
   */
  async processScheduled() {
    const pendingNotifications = await prisma.notification.findMany({
      where: {
        scheduledFor: {
          lte: new Date(),
        },
        deliveries: {
          none: {}, // No deliveries yet
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            country: true,
          }
        }
      },
      take: 100, // Process in batches
    });

    console.log(`[Notification] Processing ${pendingNotifications.length} scheduled notifications`);

    for (const notification of pendingNotifications) {
      try {
        const renderedContent = {
          [notification.channels[0]]: {
            title: notification.title,
            body: notification.message,
          }
        };

        await this.deliverToChannels(
          notification,
          notification.channels,
          renderedContent,
          notification.user
        );
      } catch (error) {
        console.error(`[Notification] Failed to process scheduled notification ${notification.id}:`, error);
      }
    }

    return { processed: pendingNotifications.length };
  }

  /**
   * Determine which channels to use based on type and user preferences
   */
  determineChannels(type, overrideChannels, userPreference) {
    // If explicitly disabled by user
    if (userPreference && !userPreference.enabled) {
      return [];
    }

    // Use override if provided
    if (overrideChannels && overrideChannels.length > 0) {
      return overrideChannels;
    }

    // Use user preference if set
    if (userPreference && userPreference.channels?.length > 0) {
      return userPreference.channels;
    }

    // Use default channels for this notification type
    return DEFAULT_CHANNELS[type] || ['IN_APP'];
  }

  /**
   * Get templates for notification type and channels
   */
  async getTemplates(type, channels) {
    const templates = await prisma.notificationTemplate.findMany({
      where: {
        type,
        channel: { in: channels },
        isActive: true,
        language: 'en', // TODO: Support user language preference
      }
    });

    // Index by channel
    return templates.reduce((acc, template) => {
      acc[template.channel] = template;
      return acc;
    }, {});
  }

  /**
   * Prepare template variables from user and data
   */
  prepareVariables(user, data) {
    return {
      // User variables
      userName: user.name,
      userEmail: user.email,
      userPhone: user.phone,
      
      // App variables
      appName: process.env.APP_NAME || 'MyBigYard',
      supportEmail: process.env.SUPPORT_EMAIL || 'support@mybigyard.com',
      currentYear: new Date().getFullYear(),
      
      // Format common data types
      ...(data.totalPrice && { 
        totalPrice: TemplateEngine.formatPrice(data.totalPrice, data.currency || 'NPR') 
      }),
      ...(data.bookingDate && { 
        bookingDate: TemplateEngine.formatDate(data.bookingDate) 
      }),
      ...(data.startTime && { 
        startTime: TemplateEngine.formatTime(data.startTime) 
      }),
      ...(data.endTime && { 
        endTime: TemplateEngine.formatTime(data.endTime) 
      }),
      
      // Pass through all other data
      ...data,
    };
  }

  /**
   * Deliver notification through specified channels
   */
  async deliverToChannels(notification, channels, renderedContent, user) {
    const results = {};

    for (const channel of channels) {
      const channelHandler = this.channels[channel];
      
      if (!channelHandler) {
        console.warn(`[Notification] No handler for channel: ${channel}`);
        continue;
      }

      try {
        const content = renderedContent[channel] || renderedContent.IN_APP;
        
        const result = await channelHandler.send({
          notification,
          user,
          content,
        });

        // Record delivery
        await prisma.notificationDelivery.create({
          data: {
            notificationId: notification.id,
            channel,
            status: result.success ? 'SENT' : 'FAILED',
            provider: result.provider,
            providerMessageId: result.messageId,
            recipient: result.recipient,
            sentAt: result.success ? new Date() : null,
            failedAt: !result.success ? new Date() : null,
            errorMessage: result.error,
            cost: result.cost,
          }
        });

        results[channel] = result;

      } catch (error) {
        console.error(`[Notification] ${channel} delivery failed:`, error);
        
        await prisma.notificationDelivery.create({
          data: {
            notificationId: notification.id,
            channel,
            status: 'FAILED',
            failedAt: new Date(),
            errorMessage: error.message,
          }
        });

        results[channel] = { success: false, error: error.message };
      }
    }

    return results;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, userId) {
    return prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        read: true,
        readAt: new Date(),
      }
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId) {
    return prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      }
    });
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId) {
    return prisma.notification.count({
      where: {
        userId,
        read: false,
        archived: false,
      }
    });
  }

  /**
   * Get notifications for a user
   */
  async getNotifications(userId, options = {}) {
    const {
      limit = 20,
      offset = 0,
      unreadOnly = false,
      types = null,
    } = options;

    const where = {
      userId,
      archived: false,
      ...(unreadOnly && { read: false }),
      ...(types && { type: { in: types } }),
    };

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          deliveries: {
            select: {
              channel: true,
              status: true,
              sentAt: true,
            }
          }
        }
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      notifications,
      total,
      hasMore: offset + notifications.length < total,
    };
  }

  /**
   * Archive a notification
   */
  async archive(notificationId, userId) {
    return prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        archived: true,
      }
    });
  }

  /**
   * Delete old notifications (cleanup job)
   */
  async cleanup(daysOld = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.notification.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        read: true,
      }
    });

    console.log(`[Notification] Cleaned up ${result.count} old notifications`);
    return result;
  }
}

// Export singleton instance
export default new NotificationService();