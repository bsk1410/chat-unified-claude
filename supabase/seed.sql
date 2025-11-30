-- ============================================================================
-- Seed File: seed.sql
-- Description: Initial data for development and testing
-- ============================================================================

-- Note: This file is for development purposes only
-- Do NOT run in production unless you know what you're doing

-- ----------------------------------------------------------------------------
-- Insert test data for development
-- ----------------------------------------------------------------------------

-- The actual user profiles will be auto-created by the trigger when users sign up
-- This seed file is intentionally minimal to avoid security issues

-- You can add additional seed data here for your specific needs
-- Example: Default categories, settings, etc.

-- ----------------------------------------------------------------------------
-- Example: Insert default app settings (if you have a settings table)
-- ----------------------------------------------------------------------------
-- INSERT INTO app_settings (key, value, description)
-- VALUES
--   ('maintenance_mode', 'false', 'Enable/disable maintenance mode'),
--   ('signup_enabled', 'true', 'Allow new user registrations'),
--   ('max_file_size_mb', '50', 'Maximum file upload size in MB')
-- ON CONFLICT (key) DO NOTHING;

-- ----------------------------------------------------------------------------
-- Verification queries (for development)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  RAISE NOTICE 'Seed completed successfully';
  RAISE NOTICE 'Tables created: audit_log, user_profiles';
  RAISE NOTICE 'Extensions enabled: uuid-ossp, pgcrypto, pg_trgm';
END $$;
