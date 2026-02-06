// backend/services/notification/channels/BaseChannel.js
// Abstract base class for notification channels

class BaseChannel {
  constructor(name) {
    this.name = name;
  }

  /**
   * Send notification through this channel
   * Must be implemented by subclasses
   * 
   * @param {Object} options
   * @param {Object} options.notification - Notification record from database
   * @param {Object} options.user - User object with contact info
   * @param {Object} options.content - Rendered content { title, body, subject }
   * @returns {Promise<Object>} Result { success, provider, messageId, recipient, error, cost }
   */
  async send({ notification, user, content }) {
    throw new Error(`send() must be implemented by ${this.name} channel`);
  }

  /**
   * Check delivery status (if supported by provider)
   * 
   * @param {string} messageId - Provider message ID
   * @returns {Promise<Object>} Status { status, deliveredAt, error }
   */
  async getDeliveryStatus(messageId) {
    return { status: 'unknown', error: 'Not implemented' };
  }

  /**
   * Validate that user can receive notifications on this channel
   * 
   * @param {Object} user - User object
   * @returns {Object} { valid, reason }
   */
  validateRecipient(user) {
    return { valid: true };
  }
}

export default BaseChannel;