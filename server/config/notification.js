/* * 
* Notification system configuration 
* Centrally manage notification-related constants and configurations */

module.exports = {
  // notification type
  SUPPORTED_NOTIFICATION_TYPES: [
    'renewal_reminder',
    'expiration_warning', 
    'renewal_success',
    'renewal_failure',
    'subscription_change'
  ],

  // Supported notification channels
  SUPPORTED_CHANNELS: ['telegram', 'email'],

  // Default notification channel
  DEFAULT_NOTIFICATION_CHANNELS: JSON.parse(
    process.env.NOTIFICATION_DEFAULT_CHANNELS ||
    '["telegram"]'
  ),

  // Language settings
  SUPPORTED_LANGUAGES: ['zh-CN', 'en'],
  DEFAULT_LANGUAGE: process.env.NOTIFICATION_DEFAULT_LANGUAGE || 'zh-CN',

  // Time zone settings
  SUPPORTED_TIMEZONES: [
    'Asia/Shanghai',
    'Asia/Tokyo', 
    'Asia/Seoul',
    'Asia/Hong_Kong',
    'America/New_York',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'UTC'
  ],
  DEFAULT_TIMEZONE: process.env.SCHEDULER_TIMEZONE || 'Asia/Shanghai',

  // Scheduler settings
  DEFAULT_CHECK_TIME: process.env.SCHEDULER_CHECK_TIME || '09:00',

  // Notification settings defaults
  DEFAULT_ADVANCE_DAYS: parseInt(process.env.NOTIFICATION_DEFAULT_ADVANCE_DAYS) || 7,
  DEFAULT_REPEAT_NOTIFICATION: (process.env.NOTIFICATION_DEFAULT_REPEAT_NOTIFICATION) === 'true',

  // Pagination settings
  DEFAULT_PAGE_SIZE: parseInt(process.env.DEFAULT_PAGE_SIZE) || 20,
  MAX_PAGE_SIZE: parseInt(process.env.MAX_PAGE_SIZE) || 100,

  // Cache settings
  CACHE_TTL: {
    SETTINGS: parseInt(process.env.CACHE_TTL_SETTINGS) || 300, // 5 minutes
    CHANNELS: parseInt(process.env.CACHE_TTL_CHANNELS) || 600, // 10 minutes
    TEMPLATES: parseInt(process.env.CACHE_TTL_TEMPLATES) || 3600 // 1 hour
  },

  // Retry setup
  RETRY_ATTEMPTS: parseInt(process.env.RETRY_ATTEMPTS) || 3,
  RETRY_DELAY: parseInt(process.env.RETRY_DELAY) || 1000, // 1 second

  // Validation rules
  VALIDATION: {
    CHAT_ID_MIN_LENGTH: 1,
    CHAT_ID_MAX_LENGTH: 50,
    ADVANCE_DAYS_MIN: 0,
    ADVANCE_DAYS_MAX: 30,
    MESSAGE_MAX_LENGTH: 4096 // Telegram restrictions
  }
};
