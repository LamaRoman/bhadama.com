// backend/services/notification/config.js
// Notification system configuration

/**
 * Default channels for each notification type
 * These are used when user has no preferences set
 */
export const DEFAULT_CHANNELS = {
  // ============================================
  // CRITICAL - All channels
  // ============================================
  BOOKING_CONFIRMED: ['IN_APP', 'EMAIL', 'SMS'],
  BOOKING_CANCELLED: ['IN_APP', 'EMAIL', 'SMS'],
  PAYMENT_FAILED: ['IN_APP', 'EMAIL', 'SMS'],
  SUBSCRIPTION_EXPIRED: ['IN_APP', 'EMAIL', 'SMS'],
  ACCOUNT_SUSPENDED: ['IN_APP', 'EMAIL', 'SMS'],
  PASSWORD_RESET: ['EMAIL'],

  // ============================================
  // IMPORTANT - Email + In-App (+ SMS for hosts)
  // ============================================
  BOOKING_CREATED: ['IN_APP', 'EMAIL'],
  NEW_BOOKING_REQUEST: ['IN_APP', 'EMAIL', 'SMS'], // Host receives
  BOOKING_REMINDER: ['IN_APP', 'EMAIL', 'SMS'],
  BOOKING_COMPLETED: ['IN_APP', 'EMAIL'],
  PAYMENT_RECEIVED: ['IN_APP', 'EMAIL'],
  PAYMENT_REFUNDED: ['IN_APP', 'EMAIL'],
  NEW_REVIEW: ['IN_APP', 'EMAIL'],
  SUBSCRIPTION_EXPIRING: ['IN_APP', 'EMAIL'],
  SUBSCRIPTION_RENEWED: ['IN_APP', 'EMAIL'],
  LISTING_APPROVED: ['IN_APP', 'EMAIL'],
  LISTING_REJECTED: ['IN_APP', 'EMAIL'],

  // ============================================
  // STANDARD - In-App + Email
  // ============================================
  WELCOME: ['IN_APP', 'EMAIL'],
  BOOKING_UPDATED: ['IN_APP', 'EMAIL'],
  BLOG_APPROVED: ['IN_APP', 'EMAIL'],
  BLOG_REJECTED: ['IN_APP', 'EMAIL'],
  PASSWORD_CHANGED: ['IN_APP', 'EMAIL'],

  // ============================================
  // LIGHT - In-App only
  // ============================================
  MESSAGE: ['IN_APP'],
  BLOG_COMMENT: ['IN_APP'],
  BLOG_LIKE: ['IN_APP'],
  REVIEW_RESPONSE: ['IN_APP', 'EMAIL'],
  EMAIL_VERIFIED: ['IN_APP'],
  PHONE_VERIFIED: ['IN_APP'],

  // ============================================
  // SYSTEM
  // ============================================
  SYSTEM: ['IN_APP'],
  MAINTENANCE: ['IN_APP', 'EMAIL'],
  PROMOTION: ['IN_APP', 'EMAIL'],
};

/**
 * Configuration for each notification type
 */
export const NOTIFICATION_CONFIG = {
  // Booking
  BOOKING_CREATED: {
    category: 'TRANSACTIONAL',
    defaultTitle: 'Booking Created',
    icon: 'calendar-plus',
    color: 'blue',
  },
  BOOKING_CONFIRMED: {
    category: 'TRANSACTIONAL',
    defaultTitle: 'Booking Confirmed',
    icon: 'calendar-check',
    color: 'green',
  },
  BOOKING_UPDATED: {
    category: 'TRANSACTIONAL',
    defaultTitle: 'Booking Updated',
    icon: 'calendar',
    color: 'yellow',
  },
  BOOKING_CANCELLED: {
    category: 'ALERT',
    defaultTitle: 'Booking Cancelled',
    icon: 'calendar-x',
    color: 'red',
  },
  BOOKING_REMINDER: {
    category: 'ALERT',
    defaultTitle: 'Booking Reminder',
    icon: 'bell',
    color: 'orange',
  },
  BOOKING_COMPLETED: {
    category: 'TRANSACTIONAL',
    defaultTitle: 'Booking Completed',
    icon: 'check-circle',
    color: 'green',
  },

  // Payment
  PAYMENT_RECEIVED: {
    category: 'TRANSACTIONAL',
    defaultTitle: 'Payment Received',
    icon: 'banknote',
    color: 'green',
  },
  PAYMENT_FAILED: {
    category: 'ALERT',
    defaultTitle: 'Payment Failed',
    icon: 'alert-circle',
    color: 'red',
  },
  PAYMENT_REFUNDED: {
    category: 'TRANSACTIONAL',
    defaultTitle: 'Payment Refunded',
    icon: 'refresh-cw',
    color: 'blue',
  },

  // Subscription
  SUBSCRIPTION_RENEWED: {
    category: 'TRANSACTIONAL',
    defaultTitle: 'Subscription Renewed',
    icon: 'credit-card',
    color: 'green',
  },
  SUBSCRIPTION_EXPIRING: {
    category: 'ALERT',
    defaultTitle: 'Subscription Expiring Soon',
    icon: 'clock',
    color: 'orange',
  },
  SUBSCRIPTION_EXPIRED: {
    category: 'ALERT',
    defaultTitle: 'Subscription Expired',
    icon: 'alert-triangle',
    color: 'red',
  },

  // Review
  NEW_REVIEW: {
    category: 'TRANSACTIONAL',
    defaultTitle: 'New Review',
    icon: 'star',
    color: 'yellow',
  },
  REVIEW_RESPONSE: {
    category: 'TRANSACTIONAL',
    defaultTitle: 'Review Response',
    icon: 'message-circle',
    color: 'blue',
  },

  // Message
  MESSAGE: {
    category: 'TRANSACTIONAL',
    defaultTitle: 'New Message',
    icon: 'mail',
    color: 'blue',
  },

  // Host
  NEW_BOOKING_REQUEST: {
    category: 'TRANSACTIONAL',
    defaultTitle: 'New Booking Request',
    icon: 'calendar-plus',
    color: 'green',
  },
  LISTING_APPROVED: {
    category: 'TRANSACTIONAL',
    defaultTitle: 'Listing Approved',
    icon: 'check-circle',
    color: 'green',
  },
  LISTING_REJECTED: {
    category: 'ALERT',
    defaultTitle: 'Listing Rejected',
    icon: 'x-circle',
    color: 'red',
  },

  // Blog
  BLOG_APPROVED: {
    category: 'TRANSACTIONAL',
    defaultTitle: 'Blog Post Approved',
    icon: 'file-text',
    color: 'green',
  },
  BLOG_REJECTED: {
    category: 'ALERT',
    defaultTitle: 'Blog Post Rejected',
    icon: 'file-x',
    color: 'red',
  },
  BLOG_COMMENT: {
    category: 'TRANSACTIONAL',
    defaultTitle: 'New Comment',
    icon: 'message-square',
    color: 'blue',
  },
  BLOG_LIKE: {
    category: 'TRANSACTIONAL',
    defaultTitle: 'New Like',
    icon: 'heart',
    color: 'pink',
  },

  // Account
  WELCOME: {
    category: 'TRANSACTIONAL',
    defaultTitle: 'Welcome!',
    icon: 'smile',
    color: 'green',
  },
  EMAIL_VERIFIED: {
    category: 'TRANSACTIONAL',
    defaultTitle: 'Email Verified',
    icon: 'mail-check',
    color: 'green',
  },
  PHONE_VERIFIED: {
    category: 'TRANSACTIONAL',
    defaultTitle: 'Phone Verified',
    icon: 'phone',
    color: 'green',
  },
  PASSWORD_CHANGED: {
    category: 'ALERT',
    defaultTitle: 'Password Changed',
    icon: 'lock',
    color: 'yellow',
  },
  PASSWORD_RESET: {
    category: 'TRANSACTIONAL',
    defaultTitle: 'Password Reset',
    icon: 'key',
    color: 'blue',
  },
  ACCOUNT_SUSPENDED: {
    category: 'ALERT',
    defaultTitle: 'Account Suspended',
    icon: 'alert-octagon',
    color: 'red',
  },

  // System
  SYSTEM: {
    category: 'SYSTEM',
    defaultTitle: 'System Notification',
    icon: 'info',
    color: 'gray',
  },
  MAINTENANCE: {
    category: 'SYSTEM',
    defaultTitle: 'Scheduled Maintenance',
    icon: 'tool',
    color: 'orange',
  },
  PROMOTION: {
    category: 'MARKETING',
    defaultTitle: 'Special Offer',
    icon: 'gift',
    color: 'purple',
  },
};

/**
 * Rate limiting configuration
 */
export const RATE_LIMITS = {
  // Max notifications per user per hour
  USER_HOURLY: 50,
  
  // Max SMS per user per day
  SMS_DAILY: 10,
  
  // Max emails per user per hour
  EMAIL_HOURLY: 20,
  
  // Cooldown between same notification type (minutes)
  SAME_TYPE_COOLDOWN: {
    MESSAGE: 0,        // No cooldown for messages
    BLOG_LIKE: 5,      // 5 min cooldown for likes
    BLOG_COMMENT: 1,   // 1 min cooldown for comments
    DEFAULT: 0,
  },
};

/**
 * Notification preferences defaults for new users
 * Users can customize these in their settings
 */
export const DEFAULT_PREFERENCES = {
  // Essential - always enabled, user can choose channels
  BOOKING_CONFIRMED: { enabled: true, channels: ['IN_APP', 'EMAIL', 'SMS'] },
  BOOKING_CANCELLED: { enabled: true, channels: ['IN_APP', 'EMAIL', 'SMS'] },
  PAYMENT_FAILED: { enabled: true, channels: ['IN_APP', 'EMAIL', 'SMS'] },
  
  // Important - enabled by default
  BOOKING_REMINDER: { enabled: true, channels: ['IN_APP', 'EMAIL', 'SMS'] },
  NEW_BOOKING_REQUEST: { enabled: true, channels: ['IN_APP', 'EMAIL', 'SMS'] },
  NEW_REVIEW: { enabled: true, channels: ['IN_APP', 'EMAIL'] },
  
  // Optional - can be disabled
  MESSAGE: { enabled: true, channels: ['IN_APP'] },
  BLOG_COMMENT: { enabled: true, channels: ['IN_APP'] },
  BLOG_LIKE: { enabled: true, channels: ['IN_APP'] },
  PROMOTION: { enabled: false, channels: ['EMAIL'] }, // Marketing off by default
};

/**
 * Quiet hours configuration
 */
export const QUIET_HOURS = {
  DEFAULT_START: '22:00',
  DEFAULT_END: '08:00',
  DEFAULT_TIMEZONE: 'Asia/Kathmandu',
  
  // These notifications ignore quiet hours
  BYPASS_QUIET_HOURS: [
    'BOOKING_CONFIRMED',
    'BOOKING_CANCELLED',
    'PAYMENT_FAILED',
    'PASSWORD_RESET',
    'ACCOUNT_SUSPENDED',
  ],
};