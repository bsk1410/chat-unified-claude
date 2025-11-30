// ============================================================================
// Rate Limiting Middleware
// Prevents abuse by limiting requests per user/IP
// ============================================================================

import { Context, Next } from 'hono';
import { RATE_LIMIT, ERROR_MESSAGES } from '../lib/constants';
import { logger, LOG_CATEGORIES } from '../services/logger';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// ----------------------------------------------------------------------------
// In-Memory Rate Limit Store
// For production, consider Redis or similar distributed cache
// ----------------------------------------------------------------------------

class RateLimitStore {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetAt < now) {
        this.store.delete(key);
      }
    }
  }

  get(key: string): RateLimitEntry | undefined {
    const entry = this.store.get(key);
    if (entry && entry.resetAt < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry;
  }

  increment(key: string, windowMs: number): RateLimitEntry {
    const now = Date.now();
    let entry = this.get(key);

    if (!entry) {
      entry = {
        count: 1,
        resetAt: now + windowMs,
      };
    } else {
      entry.count++;
    }

    this.store.set(key, entry);
    return entry;
  }

  reset(key: string): void {
    this.store.delete(key);
  }

  shutdown(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// ----------------------------------------------------------------------------
// Singleton Store
// ----------------------------------------------------------------------------

const rateLimitStore = new RateLimitStore();

// ----------------------------------------------------------------------------
// Rate Limiting Middleware
// ----------------------------------------------------------------------------

export interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
  keyGenerator?: (c: Context) => string;
  handler?: (c: Context, resetAt: number) => Response;
  skipSuccessfulRequests?: boolean;
}

export function rateLimiter(options: RateLimitOptions = {}) {
  const {
    windowMs = RATE_LIMIT.WINDOW_MS,
    maxRequests = RATE_LIMIT.REQUESTS_PER_WINDOW,
    keyGenerator = defaultKeyGenerator,
    handler = defaultHandler,
    skipSuccessfulRequests = RATE_LIMIT.SKIP_SUCCESSFUL_REQUESTS,
  } = options;

  return async (c: Context, next: Next) => {
    const key = keyGenerator(c);
    const entry = rateLimitStore.increment(key, windowMs);

    // Add rate limit headers
    c.header('X-RateLimit-Limit', maxRequests.toString());
    c.header('X-RateLimit-Remaining', Math.max(0, maxRequests - entry.count).toString());
    c.header('X-RateLimit-Reset', new Date(entry.resetAt).toISOString());

    if (entry.count > maxRequests) {
      logger.warn(LOG_CATEGORIES.MIDDLEWARE, 'Rate limit exceeded', {
        key,
        count: entry.count,
        limit: maxRequests,
      });
      return handler(c, entry.resetAt);
    }

    await next();

    // If configured, decrement on successful requests
    if (skipSuccessfulRequests && c.res.status < 400) {
      const currentEntry = rateLimitStore.get(key);
      if (currentEntry && currentEntry.count > 0) {
        currentEntry.count--;
      }
    }
  };
}

// ----------------------------------------------------------------------------
// Default Key Generator (use user ID if authenticated, otherwise IP)
// ----------------------------------------------------------------------------

function defaultKeyGenerator(c: Context): string {
  const userId = c.get('userId');
  if (userId) {
    return `user:${userId}`;
  }

  // Fallback to IP address
  const ip = c.req.header('x-forwarded-for')?.split(',')[0] ||
             c.req.header('x-real-ip') ||
             'unknown';
  return `ip:${ip}`;
}

// ----------------------------------------------------------------------------
// Default Handler (returns 429 Too Many Requests)
// ----------------------------------------------------------------------------

function defaultHandler(c: Context, resetAt: number): Response {
  return c.json(
    {
      error: {
        message: ERROR_MESSAGES.RATE_LIMITED,
        code: 'RATE_LIMITED',
        resetAt: new Date(resetAt).toISOString(),
      },
    },
    429
  );
}

// ----------------------------------------------------------------------------
// Stricter Rate Limiter for Sensitive Operations
// ----------------------------------------------------------------------------

export function strictRateLimiter() {
  return rateLimiter({
    windowMs: 60000, // 1 minute
    maxRequests: 5, // Only 5 requests per minute
  });
}

// ----------------------------------------------------------------------------
// API Rate Limiter (more lenient for general API use)
// ----------------------------------------------------------------------------

export function apiRateLimiter() {
  return rateLimiter({
    windowMs: 60000, // 1 minute
    maxRequests: 60, // 60 requests per minute
  });
}

// ----------------------------------------------------------------------------
// Export Store (for testing and manual management)
// ----------------------------------------------------------------------------

export { rateLimitStore };
