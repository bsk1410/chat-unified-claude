// ============================================================================
// Centralized Constants
// All application constants should be defined here for maintainability
// ============================================================================

// ----------------------------------------------------------------------------
// Environment
// ----------------------------------------------------------------------------
export const ENV = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL as string,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  IS_DEVELOPMENT: import.meta.env.DEV,
  IS_PRODUCTION: import.meta.env.PROD,
  BASE_URL: import.meta.env.BASE_URL,
} as const;

// ----------------------------------------------------------------------------
// Application Info
// ----------------------------------------------------------------------------
export const APP = {
  NAME: 'SecureSaaS',
  DESCRIPTION: 'Secure SaaS Starter Kit',
  VERSION: '1.0.0',
  SUPPORT_EMAIL: 'support@example.com',
  WEBSITE: 'https://example.com',
} as const;

// ----------------------------------------------------------------------------
// Routes
// ----------------------------------------------------------------------------
export const ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  AUTH_CALLBACK: '/auth/callback',

  // Protected routes
  DASHBOARD: '/dashboard',
  SETTINGS: '/settings',
  PROFILE: '/profile',

  // Error routes
  NOT_FOUND: '/404',
} as const;

// ----------------------------------------------------------------------------
// Auth Configuration
// ----------------------------------------------------------------------------
export const AUTH = {
  // Password requirements
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,

  // Session
  SESSION_STORAGE_KEY: 'sb-auth-token',
  REFRESH_THRESHOLD_SECONDS: 60,

  // OAuth providers
  PROVIDERS: ['google', 'github', 'apple'] as const,

  // Redirect URLs
  REDIRECT_AFTER_LOGIN: ROUTES.DASHBOARD,
  REDIRECT_AFTER_LOGOUT: ROUTES.HOME,
  REDIRECT_AFTER_SIGNUP: ROUTES.DASHBOARD,
} as const;

// ----------------------------------------------------------------------------
// Validation
// ----------------------------------------------------------------------------
export const VALIDATION = {
  // Email
  EMAIL_MAX_LENGTH: 254,

  // Display name
  DISPLAY_NAME_MIN_LENGTH: 2,
  DISPLAY_NAME_MAX_LENGTH: 50,

  // Bio
  BIO_MAX_LENGTH: 500,

  // General text
  TEXT_MAX_LENGTH: 10000,
} as const;

// ----------------------------------------------------------------------------
// Storage
// ----------------------------------------------------------------------------
export const STORAGE = {
  // Bucket names
  BUCKETS: {
    USER_FILES: 'user-files',
    AVATARS: 'avatars',
  },

  // File size limits (in bytes)
  MAX_FILE_SIZE: {
    AVATAR: 5 * 1024 * 1024, // 5MB
    USER_FILE: 50 * 1024 * 1024, // 50MB
  },

  // Allowed file types
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'text/plain', 'application/json'],
} as const;

// ----------------------------------------------------------------------------
// UI Configuration
// ----------------------------------------------------------------------------
export const UI = {
  // Theme
  THEME_STORAGE_KEY: 'theme',
  DEFAULT_THEME: 'system' as const,
  THEMES: ['light', 'dark', 'system'] as const,

  // Toast
  TOAST_DURATION: 5000,
  TOAST_POSITION: 'bottom-right' as const,

  // Animation
  ANIMATION_DURATION: 200,

  // Pagination
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],

  // Debounce
  DEBOUNCE_DELAY: 300,
} as const;

// ----------------------------------------------------------------------------
// API Configuration
// ----------------------------------------------------------------------------
export const API = {
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,

  // Timeouts (in milliseconds)
  DEFAULT_TIMEOUT: 30000,
  UPLOAD_TIMEOUT: 120000,

  // Cache
  CACHE_STALE_TIME: 5 * 60 * 1000, // 5 minutes
  CACHE_GC_TIME: 30 * 60 * 1000, // 30 minutes
} as const;

// ----------------------------------------------------------------------------
// Error Messages
// ----------------------------------------------------------------------------
export const ERROR_MESSAGES = {
  // Auth errors
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_NOT_CONFIRMED: 'Please verify your email address',
  USER_EXISTS: 'An account with this email already exists',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  UNAUTHORIZED: 'You are not authorized to perform this action',

  // Validation errors
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  PASSWORD_TOO_SHORT: `Password must be at least ${AUTH.PASSWORD_MIN_LENGTH} characters`,
  PASSWORDS_DONT_MATCH: "Passwords don't match",

  // Generic errors
  GENERIC_ERROR: 'Something went wrong. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  NOT_FOUND: 'The requested resource was not found',
  SERVER_ERROR: 'Server error. Please try again later.',
} as const;

// ----------------------------------------------------------------------------
// Success Messages
// ----------------------------------------------------------------------------
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Welcome back!',
  SIGNUP_SUCCESS: 'Account created successfully!',
  LOGOUT_SUCCESS: 'You have been logged out',
  PASSWORD_RESET_SENT: 'Password reset email sent',
  PASSWORD_UPDATED: 'Password updated successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  SETTINGS_SAVED: 'Settings saved successfully',
} as const;

// ----------------------------------------------------------------------------
// Feature Flags
// ----------------------------------------------------------------------------
export const FEATURES = {
  OAUTH_ENABLED: true,
  EMAIL_VERIFICATION_REQUIRED: true,
  DARK_MODE_ENABLED: true,
  ANALYTICS_ENABLED: false,
} as const;

// ----------------------------------------------------------------------------
// Timezones (common ones)
// ----------------------------------------------------------------------------
export const TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (US)' },
  { value: 'America/Chicago', label: 'Central Time (US)' },
  { value: 'America/Denver', label: 'Mountain Time (US)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US)' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Europe/Berlin', label: 'Berlin' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Asia/Shanghai', label: 'Shanghai' },
  { value: 'Asia/Singapore', label: 'Singapore' },
  { value: 'Australia/Sydney', label: 'Sydney' },
] as const;
