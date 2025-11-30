-- ============================================================================
-- Migration: Enable pgvector Extension
-- Required for embedding storage and similarity search
-- ============================================================================

-- Enable the vector extension
create extension if not exists vector with schema extensions;

-- Grant usage to authenticated users
grant usage on schema extensions to authenticated;
grant usage on schema extensions to service_role;
