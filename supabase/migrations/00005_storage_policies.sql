-- ============================================================================
-- Migration: 00005_storage_policies.sql
-- Description: Storage bucket configuration and security policies
-- ============================================================================

-- Note: Bucket creation should be done via Supabase Dashboard or CLI
-- This migration sets up the RLS policies for the storage buckets

-- ----------------------------------------------------------------------------
-- Storage Policies for 'user-files' bucket
-- Users can only access their own files organized by user_id folder structure
-- File path format: {user_id}/{filename}
-- ----------------------------------------------------------------------------

-- Policy: Users can upload to their own folder
CREATE POLICY "Users can upload own files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'user-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can view their own files
CREATE POLICY "Users can view own files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'user-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can update their own files
CREATE POLICY "Users can update own files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'user-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'user-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'user-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ----------------------------------------------------------------------------
-- Storage Policies for 'avatars' bucket (public read, owner write)
-- File path format: {user_id}/{filename}
-- ----------------------------------------------------------------------------

-- Policy: Anyone can view avatars (public bucket)
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Policy: Users can upload to their own avatar folder
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can update their own avatar
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can delete their own avatar
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ----------------------------------------------------------------------------
-- Helper function to validate file types
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_valid_image_type(filename text)
RETURNS boolean AS $$
BEGIN
  RETURN filename ~* '\.(jpg|jpeg|png|gif|webp|svg)$';
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- Helper function to validate file size (call from application layer)
-- This is informational - actual size limits are set in Supabase dashboard
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_max_file_size(bucket_name text)
RETURNS bigint AS $$
BEGIN
  CASE bucket_name
    WHEN 'avatars' THEN RETURN 5242880;      -- 5MB
    WHEN 'user-files' THEN RETURN 52428800;  -- 50MB
    ELSE RETURN 10485760;                     -- 10MB default
  END CASE;
END;
$$ LANGUAGE plpgsql;
