// ============================================================================
// Authentication Helpers
// Complete auth flow handlers for Supabase Auth
// ============================================================================

import { supabase } from './supabase';
import { AUTH } from './constants';
import type { Provider, AuthError, User, Session } from '@supabase/supabase-js';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------
export interface AuthResult {
  user: User | null;
  session: Session | null;
}

export interface SignUpOptions {
  email: string;
  password: string;
  metadata?: {
    display_name?: string;
    full_name?: string;
  };
}

export interface SignInOptions {
  email: string;
  password: string;
}

// ----------------------------------------------------------------------------
// Email/Password Authentication
// ----------------------------------------------------------------------------

/**
 * Sign up a new user with email and password
 */
export async function signUp({
  email,
  password,
  metadata,
}: SignUpOptions): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
      emailRedirectTo: `${window.location.origin}${AUTH.REDIRECT_AFTER_SIGNUP}`,
    },
  });

  if (error) throw error;

  return {
    user: data.user,
    session: data.session,
  };
}

/**
 * Sign in with email and password
 */
export async function signIn({
  email,
  password,
}: SignInOptions): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  return {
    user: data.user,
    session: data.session,
  };
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  // Clear any application-specific cache before signing out
  clearAppCache();

  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// ----------------------------------------------------------------------------
// OAuth Authentication
// ----------------------------------------------------------------------------

/**
 * Sign in with OAuth provider
 */
export async function signInWithOAuth(
  provider: Provider,
  options?: {
    redirectTo?: string;
    scopes?: string;
  }
): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: options?.redirectTo ?? `${window.location.origin}/auth/callback`,
      scopes: options?.scopes,
    },
  });

  if (error) throw error;
}

/**
 * Sign in with Google
 */
export async function signInWithGoogle(): Promise<void> {
  return signInWithOAuth('google', {
    scopes: 'email profile',
  });
}

/**
 * Sign in with GitHub
 */
export async function signInWithGitHub(): Promise<void> {
  return signInWithOAuth('github', {
    scopes: 'user:email',
  });
}

/**
 * Sign in with Apple
 */
export async function signInWithApple(): Promise<void> {
  return signInWithOAuth('apple');
}

// ----------------------------------------------------------------------------
// Password Management
// ----------------------------------------------------------------------------

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) throw error;
}

/**
 * Update user's password
 */
export async function updatePassword(newPassword: string): Promise<User> {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
  return data.user;
}

// ----------------------------------------------------------------------------
// Email Management
// ----------------------------------------------------------------------------

/**
 * Update user's email
 */
export async function updateEmail(newEmail: string): Promise<User> {
  const { data, error } = await supabase.auth.updateUser({
    email: newEmail,
  });

  if (error) throw error;
  return data.user;
}

/**
 * Resend confirmation email
 */
export async function resendConfirmationEmail(email: string): Promise<void> {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${window.location.origin}${AUTH.REDIRECT_AFTER_SIGNUP}`,
    },
  });

  if (error) throw error;
}

// ----------------------------------------------------------------------------
// Session Management
// ----------------------------------------------------------------------------

/**
 * Get current session
 */
export async function getSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

/**
 * Get current user
 */
export async function getUser(): Promise<User | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

/**
 * Refresh the current session
 */
export async function refreshSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.refreshSession();
  if (error) throw error;
  return data.session;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const session = await getSession();
    return !!session;
  } catch {
    return false;
  }
}

// ----------------------------------------------------------------------------
// User Metadata
// ----------------------------------------------------------------------------

/**
 * Update user metadata
 */
export async function updateUserMetadata(
  metadata: Record<string, unknown>
): Promise<User> {
  const { data, error } = await supabase.auth.updateUser({
    data: metadata,
  });

  if (error) throw error;
  return data.user;
}

// ----------------------------------------------------------------------------
// Account Deletion
// ----------------------------------------------------------------------------

/**
 * Delete the current user's account
 * Note: This requires additional backend setup for full deletion
 */
export async function deleteAccount(): Promise<void> {
  // Sign out the user - actual deletion should be handled by a server-side function
  // that calls supabase.auth.admin.deleteUser() with the service role key
  await signOut();
}

// ----------------------------------------------------------------------------
// Error Handling
// ----------------------------------------------------------------------------

/**
 * Check if error is an auth error
 */
export function isAuthError(error: unknown): error is AuthError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    '__isAuthError' in error
  );
}

/**
 * Get user-friendly error message
 */
export function getAuthErrorMessage(error: AuthError): string {
  const errorMessages: Record<string, string> = {
    invalid_credentials: 'Invalid email or password',
    email_not_confirmed: 'Please verify your email address',
    user_already_exists: 'An account with this email already exists',
    weak_password: 'Password is too weak',
    invalid_email: 'Invalid email address',
    user_not_found: 'No account found with this email',
    expired_token: 'Link has expired. Please request a new one.',
    invalid_token: 'Invalid link. Please request a new one.',
  };

  // Check for specific error codes
  if (error.message) {
    const lowerMessage = error.message.toLowerCase();
    for (const [key, message] of Object.entries(errorMessages)) {
      if (lowerMessage.includes(key.replace(/_/g, ' '))) {
        return message;
      }
    }
  }

  return error.message || 'An authentication error occurred';
}

// ----------------------------------------------------------------------------
// Utility Functions
// ----------------------------------------------------------------------------

/**
 * Clear application cache
 */
function clearAppCache(): void {
  // Clear localStorage items (except essential ones)
  const keysToKeep = ['theme'];

  if (typeof window !== 'undefined') {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (!keysToKeep.includes(key) && !key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    });

    // Clear sessionStorage
    sessionStorage.clear();
  }
}

/**
 * Exchange auth code for session (used in OAuth callback)
 */
export async function exchangeCodeForSession(code: string): Promise<Session> {
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) throw error;
  return data.session;
}
