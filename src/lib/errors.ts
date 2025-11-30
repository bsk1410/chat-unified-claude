// ============================================================================
// Error Handling Utilities
// Centralized error handling for Supabase and application errors
// ============================================================================

import type { AuthError, PostgrestError } from '@supabase/supabase-js';
import { ERROR_MESSAGES } from './constants';

// ----------------------------------------------------------------------------
// Custom Error Classes
// ----------------------------------------------------------------------------

/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    status: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Authentication error
 */
export class AuthenticationError extends AppError {
  constructor(message: string = ERROR_MESSAGES.UNAUTHORIZED, code: string = 'AUTH_ERROR') {
    super(message, code, 401);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization error
 */
export class AuthorizationError extends AppError {
  constructor(message: string = ERROR_MESSAGES.UNAUTHORIZED, code: string = 'FORBIDDEN') {
    super(message, code, 403);
    this.name = 'AuthorizationError';
  }
}

/**
 * Validation error
 */
export class ValidationError extends AppError {
  public readonly fields: Record<string, string>;

  constructor(
    message: string = 'Validation failed',
    fields: Record<string, string> = {}
  ) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
    this.fields = fields;
  }
}

/**
 * Not found error
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Network error
 */
export class NetworkError extends AppError {
  constructor(message: string = ERROR_MESSAGES.NETWORK_ERROR) {
    super(message, 'NETWORK_ERROR', 0);
    this.name = 'NetworkError';
  }
}

// ----------------------------------------------------------------------------
// Error Type Guards
// ----------------------------------------------------------------------------

/**
 * Check if error is an AuthError
 */
export function isAuthError(error: unknown): error is AuthError {
  return (
    typeof error === 'object' &&
    error !== null &&
    '__isAuthError' in error
  );
}

/**
 * Check if error is a PostgrestError
 */
export function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'details' in error
  );
}

/**
 * Check if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof NetworkError) return true;
  if (error instanceof TypeError && error.message === 'Failed to fetch') return true;
  if (typeof error === 'object' && error !== null && 'name' in error) {
    return (error as Error).name === 'NetworkError';
  }
  return false;
}

// ----------------------------------------------------------------------------
// Error Handlers
// ----------------------------------------------------------------------------

/**
 * Handle Supabase Auth errors
 */
export function handleAuthError(error: AuthError): AppError {
  console.error('[Auth Error]', error);

  const errorMap: Record<string, { message: string; status: number }> = {
    invalid_credentials: { message: ERROR_MESSAGES.INVALID_CREDENTIALS, status: 401 },
    email_not_confirmed: { message: ERROR_MESSAGES.EMAIL_NOT_CONFIRMED, status: 401 },
    user_already_exists: { message: ERROR_MESSAGES.USER_EXISTS, status: 409 },
    invalid_grant: { message: ERROR_MESSAGES.SESSION_EXPIRED, status: 401 },
    user_not_found: { message: 'No account found with this email', status: 404 },
    weak_password: { message: 'Password is too weak', status: 400 },
    same_password: { message: 'New password must be different', status: 400 },
    signup_disabled: { message: 'Sign ups are currently disabled', status: 403 },
    email_provider_disabled: { message: 'Email sign in is disabled', status: 403 },
    over_request_rate_limit: { message: 'Too many requests. Please try again later.', status: 429 },
    over_email_send_rate_limit: { message: 'Too many emails sent. Please try again later.', status: 429 },
  };

  // Check for known error codes
  const errorMessage = error.message?.toLowerCase() || '';
  for (const [key, value] of Object.entries(errorMap)) {
    if (errorMessage.includes(key.replace(/_/g, ' '))) {
      return new AuthenticationError(value.message, key);
    }
  }

  // Default error
  return new AuthenticationError(
    error.message || ERROR_MESSAGES.GENERIC_ERROR,
    'AUTH_ERROR'
  );
}

/**
 * Handle Supabase Postgrest errors
 */
export function handlePostgrestError(error: PostgrestError): AppError {
  console.error('[Database Error]', error);

  const errorMap: Record<string, { message: string; status: number; code: string }> = {
    '23505': { message: 'This record already exists', status: 409, code: 'DUPLICATE_ERROR' },
    '23503': { message: 'Referenced record not found', status: 404, code: 'FOREIGN_KEY_ERROR' },
    '23502': { message: 'Required field is missing', status: 400, code: 'NOT_NULL_VIOLATION' },
    '23514': { message: 'Value violates check constraint', status: 400, code: 'CHECK_VIOLATION' },
    '42501': { message: ERROR_MESSAGES.UNAUTHORIZED, status: 403, code: 'PERMISSION_DENIED' },
    'PGRST301': { message: ERROR_MESSAGES.UNAUTHORIZED, status: 403, code: 'RLS_VIOLATION' },
    '42P01': { message: 'Resource not found', status: 404, code: 'TABLE_NOT_FOUND' },
  };

  // Check for known error codes
  if (error.code && errorMap[error.code]) {
    const mapped = errorMap[error.code];
    return new AppError(mapped.message, mapped.code, mapped.status);
  }

  // Default error
  return new AppError(
    ERROR_MESSAGES.GENERIC_ERROR,
    error.code || 'DATABASE_ERROR',
    500
  );
}

/**
 * Handle any error and convert to AppError
 */
export function handleError(error: unknown): AppError {
  // Already an AppError
  if (isAppError(error)) {
    return error;
  }

  // Supabase Auth error
  if (isAuthError(error)) {
    return handleAuthError(error);
  }

  // Supabase Postgrest error
  if (isPostgrestError(error)) {
    return handlePostgrestError(error);
  }

  // Network error
  if (isNetworkError(error)) {
    return new NetworkError();
  }

  // Standard Error
  if (error instanceof Error) {
    console.error('[Unhandled Error]', error);
    return new AppError(
      ERROR_MESSAGES.GENERIC_ERROR,
      'UNKNOWN_ERROR',
      500
    );
  }

  // Unknown error type
  console.error('[Unknown Error Type]', error);
  return new AppError(ERROR_MESSAGES.GENERIC_ERROR);
}

// ----------------------------------------------------------------------------
// User-Friendly Error Messages
// ----------------------------------------------------------------------------

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: unknown): string {
  const appError = handleError(error);
  return appError.message;
}

/**
 * Get error code
 */
export function getErrorCode(error: unknown): string {
  const appError = handleError(error);
  return appError.code;
}

// ----------------------------------------------------------------------------
// Error Logging
// ----------------------------------------------------------------------------

/**
 * Log error with context
 */
export function logError(
  error: unknown,
  context?: {
    component?: string;
    action?: string;
    userId?: string;
    metadata?: Record<string, unknown>;
  }
): void {
  const appError = handleError(error);

  console.error('[Error]', {
    name: appError.name,
    message: appError.message,
    code: appError.code,
    status: appError.status,
    stack: appError.stack,
    context,
    timestamp: new Date().toISOString(),
  });

  // In production, you might want to send this to an error tracking service
  // like Sentry, LogRocket, etc.
}

// ----------------------------------------------------------------------------
// Error Boundary Helper
// ----------------------------------------------------------------------------

/**
 * Create error info for error boundaries
 */
export function createErrorInfo(error: unknown): {
  title: string;
  message: string;
  code: string;
  canRetry: boolean;
} {
  const appError = handleError(error);

  return {
    title: getErrorTitle(appError.status),
    message: appError.message,
    code: appError.code,
    canRetry: appError.status >= 500 || appError.status === 0,
  };
}

/**
 * Get error title based on status code
 */
function getErrorTitle(status: number): string {
  const titles: Record<number, string> = {
    400: 'Bad Request',
    401: 'Authentication Required',
    403: 'Access Denied',
    404: 'Not Found',
    409: 'Conflict',
    429: 'Too Many Requests',
    500: 'Server Error',
    0: 'Network Error',
  };

  return titles[status] || 'Error';
}
