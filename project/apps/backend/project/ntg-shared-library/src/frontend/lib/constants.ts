/**
 * Shared constants for frontend applications
 * Generic constants that can be used across different applications
 */

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth-token',
  REFRESH_TOKEN: 'refresh-token',
  USER_PREFERENCES: 'user-preferences',
  THEME: 'theme',
  LANGUAGE: 'language',
  NOTIFICATIONS: 'notifications',
} as const;

// API Configuration
export const API_CONFIG = {
  TIMEOUT: 10000,
  RETRY_DELAY: 1000,
  MAX_RETRY_DELAY: 30000,
} as const;

// UI Configuration
export const UI_CONFIG = {
  TOAST_DURATION: {
    SUCCESS: 3000,
    ERROR: 5000,
    INFO: 5000,
  },
  SAVE_FEEDBACK_DURATION: 3000,
  NOTIFICATION_REFRESH_INTERVAL: 30000,
  WEBSOCKET_RECONNECT_DELAY: 5000,
} as const;

// Timing Constants
export const TIMING_CONFIG = {
  DEBOUNCE_DELAY: 300,
  WEBSOCKET_RECONNECT_DELAY: 5000,
  STORE_SYNC_INTERVAL: 30000,
  PROGRESS_SIMULATION_DELAY: 100,
  PROGRESS_SIMULATION_INCREMENT: 10,
} as const;

// WebSocket Configuration
export const WEBSOCKET_CONFIG = {
  RECONNECT_DELAY: 5000,
  TRANSPORTS: ['websocket'],
  NOTIFICATIONS: {
    CONNECTION_LOST: {
      TITLE: 'Connection Lost',
      MESSAGE: 'Lost connection to server. Attempting to reconnect...',
      COLOR: 'yellow',
    },
    CONNECTION_ERROR: {
      TITLE: 'Connection Error',
      MESSAGE: 'Failed to connect to server. Please check your connection.',
      COLOR: 'red',
    },
    CONNECTED: {
      TITLE: 'Connected',
      MESSAGE: 'Successfully connected to server',
      COLOR: 'green',
    },
  },
} as const;

// Pagination Configuration
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  ADMIN_PAGE_SIZE: 20,
  LARGE_PAGE_SIZE: 100,
  MAX_PAGE_SIZE: 1000,
  DEFAULT_PAGE: 1,
} as const;

// File & Storage Constants
export const FILE_CONSTANTS = {
  BYTES_PER_KB: 1024,
  MAX_FILE_SIZE_MB: 10,
  MAX_FILES_PER_TICKET: 10,
} as const;

// Cache Configuration
export const CACHE_CONFIG = {
  DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
  MAX_SIZE: 50,
  EVICTION_RATIO: 0.25,
} as const;

