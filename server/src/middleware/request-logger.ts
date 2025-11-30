// ============================================================================
// Request Logger Middleware
// Logs all incoming requests and responses
// ============================================================================

import { Context, Next } from 'hono';
import { nanoid } from 'nanoid';
import { logger, LOG_CATEGORIES } from '../services/logger';

// ----------------------------------------------------------------------------
// Request Logger Middleware
// ----------------------------------------------------------------------------

export async function requestLoggerMiddleware(c: Context, next: Next): Promise<void> {
  const requestId = nanoid(12);
  const startTime = performance.now();

  // Set request ID in context
  c.set('requestId', requestId);

  // Add request ID to response headers
  c.header('X-Request-ID', requestId);

  // Log incoming request
  logger.setRequestId(requestId);
  logger.info(LOG_CATEGORIES.REQUEST, `${c.req.method} ${c.req.path}`, {
    method: c.req.method,
    path: c.req.path,
    query: Object.fromEntries(new URL(c.req.url).searchParams),
    userAgent: c.req.header('User-Agent'),
  });

  // Process request
  await next();

  // Log response
  const duration = Math.round(performance.now() - startTime);
  const status = c.res.status;

  const logLevel = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
  const logMethod = logLevel === 'error' ? logger.error.bind(logger) :
                    logLevel === 'warn' ? logger.warn.bind(logger) :
                    logger.info.bind(logger);

  logMethod(LOG_CATEGORIES.RESPONSE, `${c.req.method} ${c.req.path} ${status}`, {
    status,
    duration: `${duration}ms`,
  });

  logger.clearRequestId();
}
