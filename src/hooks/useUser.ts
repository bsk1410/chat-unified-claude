// ============================================================================
// useUser Hook
// User profile management with caching and optimistic updates
// ============================================================================

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { handleError, getUserFriendlyMessage } from '@/lib/errors';
import type { UserProfile, UserProfileUpdate } from '@/types/database';
import { API } from '@/lib/constants';

// ----------------------------------------------------------------------------
// Query Keys
// ----------------------------------------------------------------------------
export const userKeys = {
  all: ['user'] as const,
  profile: () => [...userKeys.all, 'profile'] as const,
  preferences: () => [...userKeys.all, 'preferences'] as const,
};

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------
interface UseUserReturn {
  profile: UserProfile | null | undefined;
  loading: boolean;
  error: string | null;
  updateProfile: (data: Partial<UserProfileUpdate>) => Promise<void>;
  updateAvatar: (file: File) => Promise<string>;
  isUpdating: boolean;
  refetch: () => Promise<void>;
}

// ----------------------------------------------------------------------------
// Hook Implementation
// ----------------------------------------------------------------------------
export function useUser(): UseUserReturn {
  const queryClient = useQueryClient();

  // Fetch user profile
  const {
    data: profile,
    isLoading: loading,
    error: queryError,
    refetch: refetchQuery,
  } = useQuery({
    queryKey: userKeys.profile(),
    queryFn: async (): Promise<UserProfile | null> => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return null;
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    staleTime: API.CACHE_STALE_TIME,
    gcTime: API.CACHE_GC_TIME,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<UserProfileUpdate>) => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Not authenticated');
      }

      const { error } = await supabase
        .from('user_profiles')
        .update(data)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: userKeys.profile() });

      // Snapshot previous value
      const previousProfile = queryClient.getQueryData<UserProfile>(userKeys.profile());

      // Optimistically update
      if (previousProfile) {
        queryClient.setQueryData<UserProfile>(userKeys.profile(), {
          ...previousProfile,
          ...newData,
        });
      }

      return { previousProfile };
    },
    onError: (err, _, context) => {
      // Rollback on error
      if (context?.previousProfile) {
        queryClient.setQueryData(userKeys.profile(), context.previousProfile);
      }
      console.error('Error updating profile:', err);
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: userKeys.profile() });
    },
  });

  // Update avatar mutation
  const updateAvatarMutation = useMutation({
    mutationFn: async (file: File): Promise<string> => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Not authenticated');
      }

      // Generate unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload file
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      return publicUrl;
    },
    onSuccess: (avatarUrl) => {
      // Update cache with new avatar
      queryClient.setQueryData<UserProfile | null>(
        userKeys.profile(),
        (old) => old ? { ...old, avatar_url: avatarUrl } : null
      );
    },
  });

  // Wrapped update function
  const updateProfile = useCallback(async (data: Partial<UserProfileUpdate>) => {
    try {
      await updateProfileMutation.mutateAsync(data);
    } catch (err) {
      throw handleError(err);
    }
  }, [updateProfileMutation]);

  // Wrapped avatar update function
  const updateAvatar = useCallback(async (file: File): Promise<string> => {
    try {
      return await updateAvatarMutation.mutateAsync(file);
    } catch (err) {
      throw handleError(err);
    }
  }, [updateAvatarMutation]);

  // Refetch function
  const refetch = useCallback(async () => {
    await refetchQuery();
  }, [refetchQuery]);

  return {
    profile,
    loading,
    error: queryError ? getUserFriendlyMessage(queryError) : null,
    updateProfile,
    updateAvatar,
    isUpdating: updateProfileMutation.isPending || updateAvatarMutation.isPending,
    refetch,
  };
}

export default useUser;
