// ============================================================================
// Auth Store
// Zustand store for authentication state
// ============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, Session } from '@supabase/supabase-js';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------
interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
}

interface AuthActions {
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  reset: () => void;
}

type AuthStore = AuthState & AuthActions;

// ----------------------------------------------------------------------------
// Initial State
// ----------------------------------------------------------------------------
const initialState: AuthState = {
  user: null,
  session: null,
  loading: true,
  initialized: false,
};

// ----------------------------------------------------------------------------
// Store Implementation
// ----------------------------------------------------------------------------
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...initialState,

      setUser: (user) => set({ user }),

      setSession: (session) =>
        set({
          session,
          user: session?.user ?? null,
        }),

      setLoading: (loading) => set({ loading }),

      setInitialized: (initialized) => set({ initialized }),

      reset: () => set(initialState),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        // Only persist non-sensitive data
        initialized: state.initialized,
      }),
    }
  )
);

// ----------------------------------------------------------------------------
// Selectors
// ----------------------------------------------------------------------------
export const selectUser = (state: AuthStore) => state.user;
export const selectSession = (state: AuthStore) => state.session;
export const selectIsAuthenticated = (state: AuthStore) => !!state.user;
export const selectIsLoading = (state: AuthStore) => state.loading;
export const selectIsInitialized = (state: AuthStore) => state.initialized;

export default useAuthStore;
