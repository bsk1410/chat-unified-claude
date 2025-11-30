// ============================================================================
// Supabase Client Configuration
// Singleton client instance with proper typing and configuration
// ============================================================================

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { ENV } from './constants';

// ----------------------------------------------------------------------------
// Environment Validation
// ----------------------------------------------------------------------------
const validateEnvironment = () => {
  if (!ENV.SUPABASE_URL) {
    throw new Error(
      'Missing VITE_SUPABASE_URL environment variable. ' +
      'Please add it to your .env.local file.'
    );
  }

  if (!ENV.SUPABASE_ANON_KEY) {
    throw new Error(
      'Missing VITE_SUPABASE_ANON_KEY environment variable. ' +
      'Please add it to your .env.local file.'
    );
  }

  // Validate URL format
  try {
    new URL(ENV.SUPABASE_URL);
  } catch {
    throw new Error(
      'Invalid VITE_SUPABASE_URL format. ' +
      'Please ensure it is a valid URL (e.g., https://your-project.supabase.co)'
    );
  }
};

// Run validation
validateEnvironment();

// ----------------------------------------------------------------------------
// Create Supabase Client
// ----------------------------------------------------------------------------
export const supabase: SupabaseClient<Database> = createClient<Database>(
  ENV.SUPABASE_URL,
  ENV.SUPABASE_ANON_KEY,
  {
    auth: {
      // Automatically refresh the token before it expires
      autoRefreshToken: true,

      // Persist session to localStorage
      persistSession: true,

      // Detect session from URL (for OAuth callbacks)
      detectSessionInUrl: true,

      // Storage key for the session
      storageKey: 'sb-auth-token',

      // Use localStorage for session storage
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,

      // Flow type for OAuth
      flowType: 'pkce',
    },

    // Global configuration
    global: {
      // Add custom headers if needed
      headers: {
        'x-client-info': 'secure-saas-starter',
      },
    },

    // Real-time configuration
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },

    // Database configuration
    db: {
      schema: 'public',
    },
  }
);

// ----------------------------------------------------------------------------
// Helper Types
// ----------------------------------------------------------------------------
export type TypedSupabaseClient = typeof supabase;

// ----------------------------------------------------------------------------
// Auth Helpers
// ----------------------------------------------------------------------------

/**
 * Get the current session
 */
export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
};

/**
 * Get the current user
 */
export const getUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const session = await getSession();
  return !!session;
};

// ----------------------------------------------------------------------------
// Storage Helpers
// ----------------------------------------------------------------------------

/**
 * Get public URL for a file in a bucket
 */
export const getPublicUrl = (bucket: string, path: string): string => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

/**
 * Get signed URL for private file access
 */
export const getSignedUrl = async (
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<string> => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) throw error;
  return data.signedUrl;
};

// ----------------------------------------------------------------------------
// Export default client
// ----------------------------------------------------------------------------
export default supabase;
