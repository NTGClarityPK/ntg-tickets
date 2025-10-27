// Notification Types
export const NOTIFICATION_TYPE = {
  TICKET_CREATED: 'TICKET_CREATED',
  TICKET_ASSIGNED: 'TICKET_ASSIGNED',
  TICKET_STATUS_CHANGED: 'TICKET_STATUS_CHANGED',
  COMMENT_ADDED: 'COMMENT_ADDED',
  SLA_WARNING: 'SLA_WARNING',
  SLA_BREACH: 'SLA_BREACH',
  TICKET_DUE: 'TICKET_DUE',
  TICKET_ESCALATED: 'TICKET_ESCALATED',
  SYSTEM_ANNOUNCEMENT: 'SYSTEM_ANNOUNCEMENT',
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'ntg-ticket-auth-token',
  REFRESH_TOKEN: 'ntg-ticket-refresh-token',
  USER_PREFERENCES: 'ntg-ticket-user-preferences',
  THEME: 'ntg-ticket-theme',
  LANGUAGE: 'ntg-ticket-language',
  NOTIFICATIONS: 'ntg-ticket-notifications',
  TICKET_FILTERS: 'ntg-ticket-filters',
  DASHBOARD_LAYOUT: 'ntg-ticket-dashboard-layout',
  LOGIN_ATTEMPTS: 'login-attempts',
  LOGIN_LOCKOUT_TIME: 'login-lockout-time',
  SAVED_SEARCHES: 'saved-searches',
  RECENT_SEARCHES: 'recent-searches',
  DATA_PROTECTION_CONSENT: 'data-protection-consent',
} as const;

// Form Options - Centralized constants for dropdowns and form fields
export const STATUS_OPTIONS = [
  { value: 'NEW', label: 'New' },
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'REOPENED', label: 'Reopened' },
] as const;

export const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
] as const;

export const CATEGORY_OPTIONS = [
  { value: 'HARDWARE', label: 'Hardware' },
  { value: 'SOFTWARE', label: 'Software' },
  { value: 'NETWORK', label: 'Network' },
  { value: 'ACCESS', label: 'Access' },
  { value: 'OTHER', label: 'Other' },
] as const;

export const IMPACT_OPTIONS = [
  { value: 'MINOR', label: 'Minor' },
  { value: 'MODERATE', label: 'Moderate' },
  { value: 'MAJOR', label: 'Major' },
  { value: 'CRITICAL', label: 'Critical' },
] as const;

export const URGENCY_OPTIONS = [
  { value: 'LOW', label: 'Low' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'HIGH', label: 'High' },
  { value: 'IMMEDIATE', label: 'Immediate' },
] as const;

export const SLA_LEVEL_OPTIONS = [
  { value: 'STANDARD', label: 'Standard' },
  { value: 'PREMIUM', label: 'Premium' },
  { value: 'CRITICAL_SUPPORT', label: 'Critical Support' },
] as const;

// Subcategories for each ticket category
export const SUBCATEGORY_OPTIONS = {
  HARDWARE: [
    { value: 'desktop', label: 'Desktop Computer' },
    { value: 'laptop', label: 'Laptop' },
    { value: 'printer', label: 'Printer' },
    { value: 'monitor', label: 'Monitor' },
    { value: 'keyboard', label: 'Keyboard/Mouse' },
    { value: 'other', label: 'Other Hardware' },
  ],
  SOFTWARE: [
    { value: 'operating_system', label: 'Operating System' },
    { value: 'email_client', label: 'Email Client' },
    { value: 'browser', label: 'Web Browser' },
    { value: 'office_suite', label: 'Office Suite' },
    { value: 'antivirus', label: 'Antivirus' },
    { value: 'other', label: 'Other Software' },
  ],
  NETWORK: [
    { value: 'internet', label: 'Internet Connection' },
    { value: 'wifi', label: 'WiFi' },
    { value: 'vpn', label: 'VPN' },
    { value: 'email_server', label: 'Email Server' },
    { value: 'file_server', label: 'File Server' },
    { value: 'other', label: 'Other Network' },
  ],
  ACCESS: [
    { value: 'user_account', label: 'User Account' },
    { value: 'password_reset', label: 'Password Reset' },
    { value: 'permissions', label: 'Permissions' },
    { value: 'application_access', label: 'Application Access' },
    { value: 'other', label: 'Other Access' },
  ],
  OTHER: [
    { value: 'general', label: 'General Inquiry' },
    { value: 'training', label: 'Training Request' },
    { value: 'other', label: 'Other' },
  ],
} as const;

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000',
  BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000',
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

// Validation Rules
export const VALIDATION_RULES = {
  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL: true,
    SPECIAL_CHARS: /[!@#$%^&*(),.?":{}|<>]/,
  },
  FILE: {
    MAX_SIZE: 10, // MB
  },
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

// Email Template Constants
export const EMAIL_TEMPLATE_TYPES = [
  { value: 'ticket_created', label: 'Ticket Created' },
  { value: 'ticket_updated', label: 'Ticket Updated' },
  { value: 'ticket_assigned', label: 'Ticket Assigned' },
  { value: 'ticket_resolved', label: 'Ticket Resolved' },
  { value: 'ticket_closed', label: 'Ticket Closed' },
  { value: 'comment_added', label: 'Comment Added' },
  { value: 'sla_warning', label: 'SLA Warning' },
  { value: 'sla_breach', label: 'SLA Breach' },
  { value: 'welcome', label: 'Welcome Email' },
  { value: 'password_reset', label: 'Password Reset' },
] as const;

export const EMAIL_TEMPLATE_VARIABLES = [
  { value: '{{user.name}}', label: 'User Name' },
  { value: '{{user.email}}', label: 'User Email' },
  { value: '{{ticket.title}}', label: 'Ticket Title' },
  { value: '{{ticket.number}}', label: 'Ticket Number' },
  { value: '{{ticket.status}}', label: 'Ticket Status' },
  { value: '{{ticket.priority}}', label: 'Ticket Priority' },
  { value: '{{ticket.category}}', label: 'Ticket Category' },
  { value: '{{ticket.description}}', label: 'Ticket Description' },
  { value: '{{ticket.url}}', label: 'Ticket URL' },
  { value: '{{assignedTo.name}}', label: 'Assigned To Name' },
] as const;

// Audit Log Constants
export const AUDIT_LOG_ACTIONS = [
  { value: 'CREATE', label: 'Create' },
  { value: 'UPDATE', label: 'Update' },
  { value: 'DELETE', label: 'Delete' },
  { value: 'LOGIN', label: 'Login' },
  { value: 'LOGOUT', label: 'Logout' },
  { value: 'ASSIGN', label: 'Assign' },
  { value: 'STATUS_CHANGE', label: 'Status Change' },
  { value: 'COMMENT', label: 'Comment' },
  { value: 'ATTACHMENT', label: 'Attachment' },
] as const;

export const AUDIT_LOG_FIELDS = [
  { value: 'title', label: 'Title' },
  { value: 'description', label: 'Description' },
  { value: 'status', label: 'Status' },
  { value: 'priority', label: 'Priority' },
  { value: 'category', label: 'Category' },
  { value: 'assignedTo', label: 'Assigned To' },
] as const;

// Query Configuration - Centralized cache settings for React Query
export const QUERY_CONFIG = {
  STALE_TIME: {
    SHORT: 30 * 1000, // 30 seconds
    MEDIUM: 1 * 60 * 1000, // 1 minute
    LONG: 2 * 60 * 1000, // 2 minutes
    EXTRA_LONG: 5 * 60 * 1000, // 5 minutes
    VERY_LONG: 10 * 60 * 1000, // 10 minutes
  },
  REFETCH_INTERVALS: {
    FREQUENT: 10 * 1000, // 10 seconds
    NORMAL: 30 * 1000, // 30 seconds
    SLOW: 60 * 1000, // 1 minute
  },
  GC_TIME: {
    SHORT: 5 * 60 * 1000, // 5 minutes
    LONG: 10 * 60 * 1000, // 10 minutes
  },
} as const;

// Pagination Configuration
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  ADMIN_PAGE_SIZE: 20,
  LARGE_PAGE_SIZE: 100,
  MAX_PAGE_SIZE: 1000,
  DEFAULT_PAGE: 1,
  COMPLIANCE_PAGE_SIZE: 10,
  NOTIFICATION_PAGE_SIZE: 10,
  STORE_SYNC_LIMIT: 1000,
  BULK_ACTIONS_LIMIT: 100,
} as const;

// Authentication & Session Configuration
export const AUTH_CONFIG = {
  SESSION: {
    MAX_AGE: 7 * 24 * 60 * 60, // 7 days
    UPDATE_AGE: 30 * 60, // 30 minutes
  },
  TOKEN: {
    ACCESS_TOKEN_EXPIRY: 30 * 60 * 1000, // 30 minutes
  },
  COOKIES: {
    SESSION_TOKEN_NAME: 'next-auth.session-token',
  },
} as const;

// User Role Constants
export const USER_ROLES = [
  { value: 'END_USER', label: 'End User' },
  { value: 'SUPPORT_STAFF', label: 'Support Staff' },
  { value: 'SUPPORT_MANAGER', label: 'Support Manager' },
  { value: 'ADMIN', label: 'Administrator' },
] as const;

// System Settings Defaults
export const SYSTEM_DEFAULTS = {
  SITE: {
    NAME: 'NTG Ticket System',
    DESCRIPTION: 'IT Support - Ticket Management System',
    TIMEZONE: 'UTC',
    LANGUAGE: 'en',
  },
  TICKET: {
    AUTO_ASSIGN: true,
    AUTO_CLOSE: true,
    AUTO_CLOSE_DAYS: 5,
    MAX_FILE_SIZE: 10, // MB
    MAX_FILES_PER_TICKET: 10,
  },
  SLA: {
    STANDARD_RESPONSE: 8, // hours
    STANDARD_RESOLUTION: 40, // hours
    PREMIUM_RESPONSE: 4, // hours
    PREMIUM_RESOLUTION: 16, // hours
    CRITICAL_RESPONSE: 0, // hours
    CRITICAL_RESOLUTION: 4, // hours
  },
  SECURITY: {
    PASSWORD_MIN_LENGTH: 8,
    SESSION_TIMEOUT: 24, // hours
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION: 30, // minutes
    LOCKOUT_DURATION_MINUTES: 15, // minutes for failed login attempts
  },
  EMAIL: {
    SMTP_HOST: 'smtp.gmail.com',
    SMTP_PORT: 587,
    SMTP_SECURE: false,
    FROM_EMAIL: 'noreply@ntg-ticket.com',
    FROM_NAME: 'NTG Ticket',
  },
  NOTIFICATIONS: {
    EMAIL_ENABLED: true,
    IN_APP_ENABLED: true,
    PUSH_ENABLED: false,
    SLA_WARNINGS: true,
    AUTO_CLOSE_WARNINGS: true,
  },
} as const;

// WebSocket Configuration
export const WEBSOCKET_CONFIG = {
  RECONNECT_DELAY: 5000, // 5 seconds
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
    TICKET_CREATED: {
      TITLE: 'New Ticket Created',
      COLOR: 'red',
    },
    TICKET_UPDATED: {
      TITLE: 'Ticket Updated',
      COLOR: 'green',
    },
    TICKET_ASSIGNED: {
      TITLE: 'Ticket Assigned',
      COLOR: 'orange',
    },
    COMMENT_ADDED: {
      TITLE: 'New Comment',
      COLOR: 'purple',
    },
    SLA_WARNING: {
      TITLE: 'SLA Warning',
      COLOR: 'yellow',
    },
    SLA_BREACH: {
      TITLE: 'SLA Breach',
      COLOR: 'red',
    },
  },
} as const;

// Timing Constants
export const TIMING_CONFIG = {
  DEBOUNCE_DELAY: 300,
  WEBSOCKET_RECONNECT_DELAY: 5000,
  STORE_SYNC_INTERVAL: 30000,
  PROGRESS_SIMULATION_DELAY: 100,
  PROGRESS_SIMULATION_INCREMENT: 10,
} as const;

// File size units
export const FILE_SIZE_UNITS = ['Bytes', 'KB', 'MB', 'GB', 'TB'] as const;

// Status filter groups
export const STATUS_FILTERS = {
  ACTIVE: ['OPEN', 'IN_PROGRESS', 'ON_HOLD'] as const,
  RESOLVED: ['RESOLVED', 'CLOSED'] as const,
  ALL: [
    'NEW',
    'OPEN',
    'IN_PROGRESS',
    'ON_HOLD',
    'RESOLVED',
    'CLOSED',
    'REOPENED',
  ] as const,
} as const;

// Role groups for permissions
export const ROLE_GROUPS = {
  SUPPORT_TEAM: ['SUPPORT_STAFF', 'SUPPORT_MANAGER', 'ADMIN'] as const,
  MANAGEMENT: ['SUPPORT_MANAGER', 'ADMIN'] as const,
  ADMIN_ONLY: ['ADMIN'] as const,
} as const;

// Notification type mappings
export const NOTIFICATION_ICONS = {
  TICKET_CREATED: 'IconTicket',
  TICKET_ASSIGNED: 'IconUser',
  TICKET_STATUS_CHANGED: 'IconAlertCircle',
  COMMENT_ADDED: 'IconMessage',
  SLA_WARNING: 'IconClock',
  SLA_BREACH: 'IconAlertCircle',
  TICKET_DUE: 'IconCalendar',
  TICKET_ESCALATED: 'IconAlertCircle',
  SYSTEM_ANNOUNCEMENT: 'IconBell',
} as const;

export const NOTIFICATION_COLORS = {
  TICKET_CREATED: 'red',
  TICKET_ASSIGNED: 'green',
  TICKET_STATUS_CHANGED: 'orange',
  COMMENT_ADDED: 'purple',
  SLA_WARNING: 'yellow',
  SLA_BREACH: 'red',
  TICKET_DUE: 'orange',
  TICKET_ESCALATED: 'red',
  SYSTEM_ANNOUNCEMENT: 'red',
} as const;

// Backup status options
export const BACKUP_STATUS_OPTIONS = [
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'PENDING', label: 'Pending' },
] as const;

// Extended audit log actions
export const EXTENDED_AUDIT_LOG_ACTIONS = [
  { value: 'CREATE', label: 'Create' },
  { value: 'UPDATE', label: 'Update' },
  { value: 'DELETE', label: 'Delete' },
  { value: 'LOGIN', label: 'Login' },
  { value: 'LOGOUT', label: 'Logout' },
  { value: 'ASSIGN', label: 'Assign' },
  { value: 'ESCALATE', label: 'Escalate' },
  { value: 'COMMENT', label: 'Comment' },
  { value: 'ATTACH', label: 'Attach' },
  { value: 'STATUS_CHANGE', label: 'Status Change' },
  { value: 'PRIORITY_CHANGE', label: 'Priority Change' },
  { value: 'CATEGORY_CHANGE', label: 'Category Change' },
] as const;

// UI Constants
export const UI_CONSTANTS = {
  ICON_SIZES: {
    SMALL: 16,
    MEDIUM: 20,
    LARGE: 24,
  },
  COLORS: {
    SUCCESS: 'green',
    ERROR: 'red',
    WARNING: 'yellow',
    INFO: 'red',
    PRIMARY: 'red',
    SECONDARY: 'orange',
  },
} as const;
