// ============================================================================
// Supabase Client - Server-side with service role key
// ============================================================================

import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { ENV } from '../lib/constants';
import { logger, LOG_CATEGORIES } from '../services/logger';

// ----------------------------------------------------------------------------
// Client Creation
// ----------------------------------------------------------------------------

let supabaseAdmin: SupabaseClient | null = null;

/**
 * Get the admin Supabase client (uses service role key)
 * Use this for server-side operations that bypass RLS
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdmin) {
    if (!ENV.SUPABASE_URL || !ENV.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase configuration. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    }

    supabaseAdmin = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    logger.debug(LOG_CATEGORIES.DB, 'Supabase admin client initialized');
  }

  return supabaseAdmin;
}

/**
 * Create a Supabase client for a specific user's JWT
 * Use this to respect RLS policies
 */
export function getSupabaseForUser(jwt: string): SupabaseClient {
  if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase configuration. Set SUPABASE_URL and SUPABASE_ANON_KEY.');
  }

  return createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// ----------------------------------------------------------------------------
// Auth Helpers
// ----------------------------------------------------------------------------

/**
 * Verify a JWT and get the user
 */
export async function verifyToken(jwt: string): Promise<User | null> {
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin.auth.getUser(jwt);

    if (error) {
      logger.debug(LOG_CATEGORIES.AUTH, 'Token verification failed', { error: error.message });
      return null;
    }

    return data.user;
  } catch (error) {
    logger.error(LOG_CATEGORIES.AUTH, 'Token verification error', error as Error);
    return null;
  }
}

/**
 * Get user ID from JWT
 */
export async function getUserIdFromToken(jwt: string): Promise<string | null> {
  const user = await verifyToken(jwt);
  return user?.id || null;
}

// ----------------------------------------------------------------------------
// Database Operation Helpers
// ----------------------------------------------------------------------------

export interface DbResult<T> {
  data: T | null;
  error: string | null;
}

export interface DbListResult<T> {
  data: T[];
  error: string | null;
  count: number | null;
}

/**
 * Execute a database query with error handling
 */
export async function dbQuery<T>(
  operation: () => Promise<{ data: T | null; error: { message: string } | null }>
): Promise<DbResult<T>> {
  try {
    const { data, error } = await operation();

    if (error) {
      logger.warn(LOG_CATEGORIES.DB, 'Database query error', { error: error.message });
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    logger.error(LOG_CATEGORIES.DB, 'Database query exception', error as Error);
    return { data: null, error: message };
  }
}

/**
 * Execute a database list query with error handling
 */
export async function dbList<T>(
  operation: () => Promise<{
    data: T[] | null;
    error: { message: string } | null;
    count: number | null;
  }>
): Promise<DbListResult<T>> {
  try {
    const { data, error, count } = await operation();

    if (error) {
      logger.warn(LOG_CATEGORIES.DB, 'Database list query error', { error: error.message });
      return { data: [], error: error.message, count: null };
    }

    return { data: data || [], error: null, count };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    logger.error(LOG_CATEGORIES.DB, 'Database list query exception', error as Error);
    return { data: [], error: message, count: null };
  }
}

// ----------------------------------------------------------------------------
// RPC Helper for Vector Operations
// ----------------------------------------------------------------------------

export async function callRpc<T>(
  client: SupabaseClient,
  functionName: string,
  args: Record<string, unknown>
): Promise<DbResult<T>> {
  try {
    const { data, error } = await client.rpc(functionName, args);

    if (error) {
      logger.warn(LOG_CATEGORIES.DB, `RPC ${functionName} error`, { error: error.message });
      return { data: null, error: error.message };
    }

    return { data: data as T, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown RPC error';
    logger.error(LOG_CATEGORIES.DB, `RPC ${functionName} exception`, error as Error);
    return { data: null, error: message };
  }
}
