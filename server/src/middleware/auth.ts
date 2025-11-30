// ============================================================================
// Auth Middleware
// Validates Supabase JWT and attaches user to context
// ============================================================================

import { Context, Next } from 'hono';
import { verifyToken, getSupabaseForUser } from '../db/client';
import { logger, LOG_CATEGORIES, createRequestLogger } from '../services/logger';
import { ERROR_MESSAGES } from '../lib/constants';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export interface AuthUser {
  id: string;
  email?: string;
  role?: string;
}

declare module 'hono' {
  interface ContextVariableMap {
    user: AuthUser;
    userId: string;
    jwt: string;
    requestId: string;
  }
}

// ----------------------------------------------------------------------------
// Auth Middleware
// ----------------------------------------------------------------------------

export async function authMiddleware(c: Context, next: Next): Promise<Response | void> {
  const requestId = c.get('requestId') || 'unknown';
  const log = createRequestLogger(requestId);

  // Get Authorization header
  const authHeader = c.req.header('Authorization');

  if (!authHeader) {
    log.debug(LOG_CATEGORIES.AUTH, 'No authorization header');
    return c.json({ error: ERROR_MESSAGES.UNAUTHORIZED }, 401);
  }

  // Extract token
  const [type, token] = authHeader.split(' ');

  if (type !== 'Bearer' || !token) {
    log.debug(LOG_CATEGORIES.AUTH, 'Invalid authorization format');
    return c.json({ error: ERROR_MESSAGES.INVALID_TOKEN }, 401);
  }

  // Verify token
  const user = await verifyToken(token);

  if (!user) {
    log.debug(LOG_CATEGORIES.AUTH, 'Token verification failed');
    return c.json({ error: ERROR_MESSAGES.INVALID_TOKEN }, 401);
  }

  // Attach user info to context
  c.set('user', {
    id: user.id,
    email: user.email,
    role: user.role,
  });
  c.set('userId', user.id);
  c.set('jwt', token);

  log.debug(LOG_CATEGORIES.AUTH, 'User authenticated', { userId: user.id });

  await next();
}

// ----------------------------------------------------------------------------
// Optional Auth Middleware
// Attaches user if token is valid, but doesn't require it
// ----------------------------------------------------------------------------

export async function optionalAuthMiddleware(c: Context, next: Next): Promise<Response | void> {
  const authHeader = c.req.header('Authorization');

  if (authHeader) {
    const [type, token] = authHeader.split(' ');

    if (type === 'Bearer' && token) {
      const user = await verifyToken(token);

      if (user) {
        c.set('user', {
          id: user.id,
          email: user.email,
          role: user.role,
        });
        c.set('userId', user.id);
        c.set('jwt', token);
      }
    }
  }

  await next();
}

// ----------------------------------------------------------------------------
// Admin Auth Middleware
// Requires admin role (extend as needed)
// ----------------------------------------------------------------------------

export async function adminAuthMiddleware(c: Context, next: Next): Promise<Response | void> {
  // First run normal auth
  const authResult = await authMiddleware(c, () => Promise.resolve());

  if (authResult) {
    return authResult;
  }

  const user = c.get('user');

  // Check for admin role (implement your own logic)
  // For now, we allow all authenticated users
  // You might check user.role === 'admin' or check a database field

  await next();
}

// ----------------------------------------------------------------------------
// Get Supabase Client for User
// Helper to get a client with user's permissions
// ----------------------------------------------------------------------------

export function getUserSupabase(c: Context) {
  const jwt = c.get('jwt');

  if (!jwt) {
    throw new Error('No JWT in context - user not authenticated');
  }

  return getSupabaseForUser(jwt);
}
