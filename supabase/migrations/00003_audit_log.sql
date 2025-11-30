-- ============================================================================
-- Migration: 00003_audit_log.sql
-- Description: Immutable audit logging system for tracking all data changes
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: audit_log
-- Description: Stores immutable audit records for all tracked operations
-- ----------------------------------------------------------------------------
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN (
    'INSERT',
    'UPDATE',
    'DELETE',
    'LOGIN',
    'LOGOUT',
    'PASSWORD_RESET',
    'EMAIL_CHANGE',
    'PROFILE_UPDATE',
    'SETTINGS_CHANGE'
  )),
  table_name TEXT,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for efficient querying
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX idx_audit_log_table_name ON audit_log(table_name);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_record_id ON audit_log(record_id);

-- Composite index for common query patterns
CREATE INDEX idx_audit_log_user_action_time ON audit_log(user_id, action, created_at DESC);

-- ----------------------------------------------------------------------------
-- RLS Policies for audit_log
-- Users can only read their own audit logs
-- No INSERT/UPDATE/DELETE policies for regular users
-- ----------------------------------------------------------------------------
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log FORCE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit logs"
  ON audit_log FOR SELECT
  USING (user_id = auth.uid());

-- Note: Inserts happen via service role or triggers only (no user insert policy)

-- ----------------------------------------------------------------------------
-- Function: audit_trigger_function()
-- Description: Generic trigger function to log INSERT/UPDATE/DELETE operations
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
  old_data_json JSONB;
  new_data_json JSONB;
  record_uuid UUID;
BEGIN
  -- Handle different operations
  IF TG_OP = 'INSERT' THEN
    new_data_json := to_jsonb(NEW);
    record_uuid := NEW.id;

    INSERT INTO audit_log (user_id, action, table_name, record_id, new_data)
    VALUES (auth.uid(), 'INSERT', TG_TABLE_NAME, record_uuid, new_data_json);

    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    old_data_json := to_jsonb(OLD);
    new_data_json := to_jsonb(NEW);
    record_uuid := NEW.id;

    -- Only log if data actually changed
    IF old_data_json IS DISTINCT FROM new_data_json THEN
      INSERT INTO audit_log (user_id, action, table_name, record_id, old_data, new_data)
      VALUES (auth.uid(), 'UPDATE', TG_TABLE_NAME, record_uuid, old_data_json, new_data_json);
    END IF;

    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    old_data_json := to_jsonb(OLD);
    record_uuid := OLD.id;

    INSERT INTO audit_log (user_id, action, table_name, record_id, old_data)
    VALUES (auth.uid(), 'DELETE', TG_TABLE_NAME, record_uuid, old_data_json);

    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- Function: apply_audit_trigger(table_name)
-- Description: Apply the audit trigger to any table
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION apply_audit_trigger(table_name text)
RETURNS void AS $$
BEGIN
  EXECUTE format(
    'CREATE TRIGGER audit_trigger AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION audit_trigger_function()',
    table_name
  );
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- Function: log_auth_event(action, metadata)
-- Description: Manually log authentication events
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION log_auth_event(
  p_action TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO audit_log (user_id, action, metadata)
  VALUES (auth.uid(), p_action, p_metadata)
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
