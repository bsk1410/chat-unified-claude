// ============================================================================
// useAuth Hook
// Authentication state management with Supabase
// ============================================================================

import { useEffect, useState, useCallback } from 'react';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import * as authHelpers from '@/lib/auth';
import { handleError, getUserFriendlyMessage } from '@/lib/errors';
import { AUTH } from '@/lib/constants';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------
interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
}

interface UseAuthReturn extends AuthState {
  // Auth actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, metadata?: { display_name?: string }) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;

  // Utility
  isAuthenticated: boolean;
  error: string | null;
  clearError: () => void;
}

// ----------------------------------------------------------------------------
// Hook Implementation
// ----------------------------------------------------------------------------
export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    initialized: false,
  });
  const [error, setError] = useState<string | null>(null);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (mounted) {
          setState({
            user: session?.user ?? null,
            session,
            loading: false,
            initialized: true,
          });
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('Error initializing auth:', err);
        }
        if (mounted) {
          setState((prev) => ({
            ...prev,
            loading: false,
            initialized: true,
          }));
        }
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (!mounted) return;

        setState((prev) => ({
          ...prev,
          user: session?.user ?? null,
          session,
          loading: false,
        }));

        // Handle specific auth events
        if (event === 'SIGNED_OUT') {
          // Clear any cached data
          localStorage.removeItem('user-profile');
        }

        if (event === 'TOKEN_REFRESHED') {
          if (import.meta.env.DEV) {
            console.log('Token refreshed');
          }
        }

        if (event === 'PASSWORD_RECOVERY') {
          // User clicked password recovery link
          if (import.meta.env.DEV) {
            console.log('Password recovery initiated');
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Sign in with email/password
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setError(null);
      setState((prev) => ({ ...prev, loading: true }));

      await authHelpers.signIn({ email, password });

      // Redirect is handled by auth state change listener
    } catch (err) {
      const message = getUserFriendlyMessage(err);
      setError(message);
      throw handleError(err);
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  // Sign up with email/password
  const signUp = useCallback(async (
    email: string,
    password: string,
    metadata?: { display_name?: string }
  ) => {
    try {
      setError(null);
      setState((prev) => ({ ...prev, loading: true }));

      await authHelpers.signUp({ email, password, metadata });

      // Note: User may need to verify email depending on settings
    } catch (err) {
      const message = getUserFriendlyMessage(err);
      setError(message);
      throw handleError(err);
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      setError(null);
      setState((prev) => ({ ...prev, loading: true }));

      await authHelpers.signOut();

      // Redirect to home
      window.location.href = AUTH.REDIRECT_AFTER_LOGOUT;
    } catch (err) {
      const message = getUserFriendlyMessage(err);
      setError(message);
      throw handleError(err);
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  // OAuth sign in methods
  const signInWithGoogle = useCallback(async () => {
    try {
      setError(null);
      await authHelpers.signInWithGoogle();
    } catch (err) {
      const message = getUserFriendlyMessage(err);
      setError(message);
      throw handleError(err);
    }
  }, []);

  const signInWithGitHub = useCallback(async () => {
    try {
      setError(null);
      await authHelpers.signInWithGitHub();
    } catch (err) {
      const message = getUserFriendlyMessage(err);
      setError(message);
      throw handleError(err);
    }
  }, []);

  // Password management
  const resetPassword = useCallback(async (email: string) => {
    try {
      setError(null);
      await authHelpers.resetPassword(email);
    } catch (err) {
      const message = getUserFriendlyMessage(err);
      setError(message);
      throw handleError(err);
    }
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    try {
      setError(null);
      await authHelpers.updatePassword(newPassword);
    } catch (err) {
      const message = getUserFriendlyMessage(err);
      setError(message);
      throw handleError(err);
    }
  }, []);

  return {
    ...state,
    isAuthenticated: !!state.user,
    error,
    clearError,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    signInWithGitHub,
    resetPassword,
    updatePassword,
  };
}

export default useAuth;
