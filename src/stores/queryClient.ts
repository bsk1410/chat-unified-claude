// ============================================================================
// TanStack Query Client Configuration
// ============================================================================

import { QueryClient } from '@tanstack/react-query';
import { API } from '@/lib/constants';

// ----------------------------------------------------------------------------
// Query Client
// ----------------------------------------------------------------------------
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time - how long data is considered fresh
      staleTime: API.CACHE_STALE_TIME,

      // Garbage collection time - how long inactive data stays in cache
      gcTime: API.CACHE_GC_TIME,

      // Retry configuration
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error instanceof Error && 'status' in error) {
          const status = (error as { status: number }).status;
          if (status >= 400 && status < 500) {
            return false;
          }
        }
        return failureCount < API.MAX_RETRIES;
      },
      retryDelay: (attemptIndex) =>
        Math.min(API.RETRY_DELAY * 2 ** attemptIndex, 30000),

      // Refetch configuration
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,

      // Network mode
      networkMode: 'online',
    },
    mutations: {
      // Retry configuration for mutations
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error instanceof Error && 'status' in error) {
          const status = (error as { status: number }).status;
          if (status >= 400 && status < 500) {
            return false;
          }
        }
        return failureCount < 1; // Only retry once for mutations
      },

      // Network mode
      networkMode: 'online',
    },
  },
});

// ----------------------------------------------------------------------------
// Query Key Factory
// ----------------------------------------------------------------------------
export const queryKeys = {
  // User related
  user: {
    all: ['user'] as const,
    profile: () => [...queryKeys.user.all, 'profile'] as const,
    preferences: () => [...queryKeys.user.all, 'preferences'] as const,
  },

  // Audit logs
  audit: {
    all: ['audit'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.audit.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.audit.all, 'detail', id] as const,
  },

  // Generic factory
  create: (scope: string) => ({
    all: [scope] as const,
    lists: () => [...[scope], 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...[scope], 'list', filters] as const,
    details: () => [...[scope], 'detail'] as const,
    detail: (id: string) => [...[scope], 'detail', id] as const,
  }),
};

// ----------------------------------------------------------------------------
// Invalidation Helpers
// ----------------------------------------------------------------------------

/**
 * Invalidate all user-related queries
 */
export function invalidateUserQueries() {
  return queryClient.invalidateQueries({ queryKey: queryKeys.user.all });
}

/**
 * Invalidate all queries
 */
export function invalidateAllQueries() {
  return queryClient.invalidateQueries();
}

/**
 * Clear all cached data
 */
export function clearQueryCache() {
  return queryClient.clear();
}

/**
 * Prefetch user profile
 */
export async function prefetchUserProfile(
  fetcher: () => Promise<unknown>
) {
  return queryClient.prefetchQuery({
    queryKey: queryKeys.user.profile(),
    queryFn: fetcher,
    staleTime: API.CACHE_STALE_TIME,
  });
}

export default queryClient;
