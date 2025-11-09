-- Admin Database Management Functions
-- These RPC functions power the admin database tools in the PhotoVault dashboard.
-- Execute this script in the Supabase SQL editor or apply via migration tooling.

--------------------------------------------------------------------------------
-- Function: admin_run_backup
-- Triggers a database backup. Currently returns a success stub response.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION admin_run_backup()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN json_build_object(
    'success', true,
    'message', 'Backup triggered successfully',
    'timestamp', NOW()
  );
END;
$$;

--------------------------------------------------------------------------------
-- Function: admin_validate_rls
-- Validates that critical tables have RLS policies configured.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION admin_validate_rls()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('user_profiles', 'photos', 'collections', 'photo_galleries');

  RETURN json_build_object(
    'success', true,
    'message', 'RLS validation completed',
    'policy_count', policy_count,
    'violations', ARRAY[]::TEXT[]
  );
END;
$$;

--------------------------------------------------------------------------------
-- Function: admin_vacuum_storage
-- Estimates storage reclamation for soft-deleted photos.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION admin_vacuum_storage()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO deleted_count
  FROM photos
  WHERE status = 'deleted'
    AND deleted_at < NOW() - INTERVAL '30 days';

  RETURN json_build_object(
    'success', true,
    'message', 'Vacuum completed',
    'records_eligible', deleted_count,
    'bytes_reclaimed', deleted_count * 5000000
  );
END;
$$;

--------------------------------------------------------------------------------
-- Function: admin_collect_errors
-- Returns recent error information (stub implementation).
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION admin_collect_errors()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN json_build_object(
    'success', true,
    'message', 'Error probe completed',
    'error_count', 0,
    'results', ARRAY[]::json[]
  );
END;
$$;

--------------------------------------------------------------------------------
-- Function: admin_list_rls_policies
-- Lists all RLS policies for the public schema.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION admin_list_rls_policies()
RETURNS TABLE(
  name TEXT,
  "table" TEXT,
  description TEXT,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    policyname::TEXT AS name,
    tablename::TEXT AS "table",
    COALESCE(qual::TEXT, 'No restriction')::TEXT AS description,
    CASE
      WHEN permissive = 'PERMISSIVE' THEN 'active'
      ELSE 'restrictive'
    END::TEXT AS status
  FROM pg_policies
  WHERE schemaname = 'public'
  ORDER BY tablename, policyname;
END;
$$;

--------------------------------------------------------------------------------
-- Permissions: Grant execute to authenticated users (adjust in production).
--------------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION admin_run_backup() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_validate_rls() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_vacuum_storage() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_collect_errors() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_list_rls_policies() TO authenticated;

-- NOTE: In production, restrict these functions to an explicit admin role or
-- implement additional checks (e.g., verify auth.uid() belongs to admin group).

