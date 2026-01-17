// backend/services/notification/channels/InAppChannel.js
// Handles in-app (database) notifications

import BaseChannel from './base.channel.js';

class InAppChannel extends BaseChannel {
  constructor() {
    super('IN_APP');
  }

  /**
   * Send in-app notification
   * For in-app, the notification is already created in the database
   * This method is mainly for consistency and any additional processing
   */
  async send({ notification, user, content }) {
    try {
      // The notification is already created in NotificationService
      // In-app notifications don't need external delivery
      // But we can do additional things here like:
      // - Real-time push via WebSocket/SSE
      // - Update unread badge count cache
      
      // If you have real-time capabilities (Socket.io, Pusher, etc.)
      // this.emitToUser(user.id, notification);

      return {
        success: true,
        provider: 'database',
        recipient: `user:${user.id}`,
        messageId: notification.id.toString(),
      };
    } catch (error) {
      console.error('[InAppChannel] Error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Emit notification to user via WebSocket (if available)
   * Override this method in your implementation
   */
  emitToUser(userId, notification) {
    // Example with Socket.io:
    // const io = getSocketIO();
    // io.to(`user:${userId}`).emit('notification', notification);
    
    // Example with Pusher:
    // pusher.trigger(`user-${userId}`, 'notification', notification);
    
    console.log(`[InAppChannel] Would emit to user ${userId}:`, notification.id);
  }
}

export default new InAppChannel();