// ============================================================================
// Error Handler Middleware
// Catches errors and returns consistent error responses
// ============================================================================

import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { logger, LOG_CATEGORIES } from '../services/logger';
import { ERROR_MESSAGES, ENV } from '../lib/constants';

// ----------------------------------------------------------------------------
// Error Types
// ----------------------------------------------------------------------------

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = ERROR_MESSAGES.NOT_FOUND) {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = ERROR_MESSAGES.UNAUTHORIZED) {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = ERROR_MESSAGES.FORBIDDEN) {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

// ----------------------------------------------------------------------------
// Error Response Format
// ----------------------------------------------------------------------------

interface ErrorResponse {
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
  requestId?: string;
}

// ----------------------------------------------------------------------------
// Error Handler
// ----------------------------------------------------------------------------

export function errorHandler(err: Error, c: Context): Response {
  const requestId = c.get('requestId');

  // Log the error
  logger.setRequestId(requestId);
  logger.error(LOG_CATEGORIES.ERROR, err.message, err, {
    path: c.req.path,
    method: c.req.method,
  });
  logger.clearRequestId();

  // Build response
  const response: ErrorResponse = {
    error: {
      message: err.message || ERROR_MESSAGES.INTERNAL_ERROR,
    },
    requestId,
  };

  let statusCode = 500;

  // Handle different error types
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    response.error.code = err.code;
  } else if (err instanceof HTTPException) {
    statusCode = err.status;
    response.error.message = err.message;
  }

  // Don't expose internal error details in production
  if (ENV.IS_PRODUCTION && statusCode === 500) {
    response.error.message = ERROR_MESSAGES.INTERNAL_ERROR;
  }

  return c.json(response, statusCode as 400 | 401 | 403 | 404 | 500);
}

// ----------------------------------------------------------------------------
// Not Found Handler
// ----------------------------------------------------------------------------

export function notFoundHandler(c: Context): Response {
  return c.json({
    error: {
      message: 'Endpoint not found',
      code: 'NOT_FOUND',
    },
    requestId: c.get('requestId'),
  }, 404);
}
