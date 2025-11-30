-- ============================================================================
-- Migration: 00002_helper_functions.sql
-- Description: Reusable helper functions for security and automation
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Function: update_updated_at()
-- Description: Automatically update the updated_at timestamp on row changes
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- Function: apply_standard_rls(table_name)
-- Description: Apply standard Row Level Security policies to user-owned tables
-- Assumes table has user_id column referencing auth.users(id)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION apply_standard_rls(table_name text)
RETURNS void AS $$
BEGIN
  -- Enable RLS
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);

  -- Force RLS for table owner too (prevents accidental bypass)
  EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', table_name);

  -- Select own records
  EXECUTE format(
    'CREATE POLICY "Users can view own %I" ON %I FOR SELECT USING (user_id = auth.uid())',
    table_name, table_name
  );

  -- Insert own records
  EXECUTE format(
    'CREATE POLICY "Users can insert own %I" ON %I FOR INSERT WITH CHECK (user_id = auth.uid())',
    table_name, table_name
  );

  -- Update own records
  EXECUTE format(
    'CREATE POLICY "Users can update own %I" ON %I FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())',
    table_name, table_name
  );

  -- Delete own records
  EXECUTE format(
    'CREATE POLICY "Users can delete own %I" ON %I FOR DELETE USING (user_id = auth.uid())',
    table_name, table_name
  );
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- Function: apply_updated_at_trigger(table_name)
-- Description: Apply the updated_at trigger to a table
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION apply_updated_at_trigger(table_name text)
RETURNS void AS $$
BEGIN
  EXECUTE format(
    'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
    table_name
  );
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- Function: create_active_view(table_name)
-- Description: Create a view that excludes soft-deleted records
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_active_view(table_name text)
RETURNS void AS $$
BEGIN
  EXECUTE format(
    'CREATE OR REPLACE VIEW %I_active AS SELECT * FROM %I WHERE deleted_at IS NULL',
    table_name, table_name
  );
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- Function: is_owner(user_id)
-- Description: Check if the current authenticated user owns a record
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_owner(record_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN record_user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
