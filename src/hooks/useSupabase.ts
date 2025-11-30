// ============================================================================
// useSupabase Hook
// Generic Supabase client access and utilities
// ============================================================================

import { useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import type { TypedSupabaseClient } from '@/lib/supabase';
import type { Database } from '@/types/database';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------
type TableName = keyof Database['public']['Tables'];

interface UseSupabaseReturn {
  client: TypedSupabaseClient;
  from: <T extends TableName>(table: T) => ReturnType<TypedSupabaseClient['from']>;
  storage: TypedSupabaseClient['storage'];
  auth: TypedSupabaseClient['auth'];
  rpc: TypedSupabaseClient['rpc'];
}

// ----------------------------------------------------------------------------
// Hook Implementation
// ----------------------------------------------------------------------------

/**
 * Access the typed Supabase client
 */
export function useSupabase(): UseSupabaseReturn {
  return useMemo(() => ({
    client: supabase,
    from: <T extends TableName>(table: T) => supabase.from(table),
    storage: supabase.storage,
    auth: supabase.auth,
    rpc: supabase.rpc,
  }), []);
}

// ----------------------------------------------------------------------------
// Specialized Hooks
// ----------------------------------------------------------------------------

/**
 * Hook for real-time subscriptions
 */
export function useRealtimeSubscription<T extends TableName>(
  table: T,
  callback: (payload: {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
    new: Database['public']['Tables'][T]['Row'];
    old: Database['public']['Tables'][T]['Row'];
  }) => void,
  filter?: {
    event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
    schema?: string;
    filter?: string;
  }
) {
  const { client } = useSupabase();

  useMemo(() => {
    const channel = client
      .channel(`${table}-changes`)
      .on(
        'postgres_changes' as const,
        {
          event: filter?.event ?? '*',
          schema: filter?.schema ?? 'public',
          table: table,
          filter: filter?.filter,
        },
        (payload) => {
          callback(payload as {
            eventType: 'INSERT' | 'UPDATE' | 'DELETE';
            new: Database['public']['Tables'][T]['Row'];
            old: Database['public']['Tables'][T]['Row'];
          });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [client, table, callback, filter]);
}

/**
 * Hook for file storage operations
 */
export function useStorage(bucketName: string) {
  const { storage } = useSupabase();

  return useMemo(() => {
    const bucket = storage.from(bucketName);

    return {
      /**
       * Upload a file
       */
      upload: async (
        path: string,
        file: File,
        options?: { cacheControl?: string; upsert?: boolean }
      ) => {
        const { data, error } = await bucket.upload(path, file, {
          cacheControl: options?.cacheControl ?? '3600',
          upsert: options?.upsert ?? false,
        });

        if (error) throw error;
        return data;
      },

      /**
       * Download a file
       */
      download: async (path: string) => {
        const { data, error } = await bucket.download(path);

        if (error) throw error;
        return data;
      },

      /**
       * Get public URL
       */
      getPublicUrl: (path: string) => {
        const { data } = bucket.getPublicUrl(path);
        return data.publicUrl;
      },

      /**
       * Get signed URL for private files
       */
      getSignedUrl: async (path: string, expiresIn: number = 3600) => {
        const { data, error } = await bucket.createSignedUrl(path, expiresIn);

        if (error) throw error;
        return data.signedUrl;
      },

      /**
       * Delete a file
       */
      remove: async (paths: string[]) => {
        const { error } = await bucket.remove(paths);

        if (error) throw error;
      },

      /**
       * List files in a directory
       */
      list: async (path?: string, options?: { limit?: number; offset?: number }) => {
        const { data, error } = await bucket.list(path, options);

        if (error) throw error;
        return data;
      },
    };
  }, [storage, bucketName]);
}

export default useSupabase;
