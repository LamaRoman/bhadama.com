// backend/services/notification/index.js
// Main export for notification service

import NotificationService from './notification.service.js';
import { DEFAULT_CHANNELS, NOTIFICATION_CONFIG, RATE_LIMITS } from './config.js';
import TemplateEngine from './templates/TemplateEngine.js';
import { DEFAULT_TEMPLATES, seedTemplates } from './templates/defaultTemplates.js';

// Export the main service as default
export default NotificationService;

// Named exports for configuration and utilities
export {
  NotificationService,
  DEFAULT_CHANNELS,
  NOTIFICATION_CONFIG,
  RATE_LIMITS,
  TemplateEngine,
  DEFAULT_TEMPLATES,
  seedTemplates,
};

// Convenience methods
export const notify = NotificationService.send.bind(NotificationService);
export const notifyMany = NotificationService.sendToMany.bind(NotificationService);
export const scheduleNotification = NotificationService.schedule.bind(NotificationService);