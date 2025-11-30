-- ============================================================================
-- Migration: 00004_user_profiles.sql
-- Description: Extended user profile management with automatic creation
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: user_profiles
-- Description: Extended user profile data beyond auth.users
-- ----------------------------------------------------------------------------
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email TEXT,
  display_name TEXT,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  website TEXT,
  timezone TEXT DEFAULT 'UTC',
  locale TEXT DEFAULT 'en',
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  preferences JSONB DEFAULT '{
    "email_notifications": true,
    "push_notifications": false,
    "marketing_emails": false,
    "weekly_digest": true
  }',
  onboarding_completed BOOLEAN DEFAULT false,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  deleted_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT display_name_length CHECK (char_length(display_name) <= 50),
  CONSTRAINT bio_length CHECK (char_length(bio) <= 500),
  CONSTRAINT valid_timezone CHECK (timezone ~ '^[A-Za-z_]+/[A-Za-z_]+$' OR timezone = 'UTC')
);

-- Indexes
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_display_name ON user_profiles(display_name);
CREATE INDEX idx_user_profiles_deleted_at ON user_profiles(deleted_at) WHERE deleted_at IS NULL;

-- Apply security
SELECT apply_standard_rls('user_profiles');
SELECT apply_updated_at_trigger('user_profiles');

-- ----------------------------------------------------------------------------
-- Function: handle_new_user()
-- Description: Auto-create user profile when a new user signs up
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, user_id, email, display_name, full_name)
  VALUES (
    NEW.id,
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name'
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ----------------------------------------------------------------------------
-- Function: handle_user_delete()
-- Description: Clean up user data when user is deleted (soft delete profile)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_user_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_profiles
  SET deleted_at = now()
  WHERE user_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for user deletion
CREATE TRIGGER on_auth_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_delete();

-- ----------------------------------------------------------------------------
-- Function: update_last_seen()
-- Description: Update the last_seen_at timestamp
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_last_seen()
RETURNS void AS $$
BEGIN
  UPDATE user_profiles
  SET last_seen_at = now()
  WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- View: user_profiles_active
-- Description: View of only active (non-deleted) profiles
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW user_profiles_active AS
SELECT * FROM user_profiles WHERE deleted_at IS NULL;
