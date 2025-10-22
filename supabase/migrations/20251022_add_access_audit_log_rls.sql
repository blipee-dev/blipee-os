-- ============================================================================
-- Add RLS to access_audit_log table
-- ============================================================================
--
-- The access_audit_log table was missing RLS, allowing users to potentially
-- see audit logs from other organizations. This migration adds proper RLS.
--
-- Created: 2025-10-22
-- ============================================================================

-- Enable RLS on access_audit_log
ALTER TABLE access_audit_log ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies (in case of re-run)
DROP POLICY IF EXISTS "Users can view their org audit logs" ON access_audit_log;
DROP POLICY IF EXISTS "Users can view their own audit logs" ON access_audit_log;
DROP POLICY IF EXISTS "Super admins can view all audit logs" ON access_audit_log;
DROP POLICY IF EXISTS "Service role can insert audit logs" ON access_audit_log;
DROP POLICY IF EXISTS "System can insert audit logs" ON access_audit_log;

-- Policy 1: Users can view their own audit logs
CREATE POLICY "Users can view their own audit logs" ON access_audit_log
  FOR SELECT
  USING (
    -- User can see their own audit entries
    user_id = auth.uid()
    OR
    -- User can see audit logs for resources they have access to
    (
      resource_type = 'organization' AND
      resource_id::uuid IN (
        SELECT om.organization_id
        FROM organization_members om
        WHERE om.user_id = (
          SELECT id FROM app_users WHERE auth_user_id = auth.uid()
        )
      )
    )
    OR
    -- User has access via user_access table
    (
      resource_type IN ('organization', 'org') AND
      resource_id::uuid IN (
        SELECT ua.resource_id
        FROM user_access ua
        WHERE ua.user_id = auth.uid()
          AND ua.resource_type IN ('organization', 'org')
      )
    )
  );

-- Policy 2: Super admins can view all audit logs
CREATE POLICY "Super admins can view all audit logs" ON access_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM super_admins WHERE user_id = auth.uid()
    )
  );

-- Policy 3: Service role can insert audit logs (for system operations)
CREATE POLICY "Service role can insert audit logs" ON access_audit_log
  FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'role' = 'service_role'
    OR auth.role() = 'service_role'
  );

-- Policy 4: System can insert audit logs (no user context)
-- This allows triggers and functions to create audit logs
CREATE POLICY "System can insert audit logs" ON access_audit_log
  FOR INSERT
  WITH CHECK (true);

-- Note: No UPDATE or DELETE policies - audit logs should be immutable
-- Only INSERT and SELECT are allowed

-- Verify the policies
SELECT
  tablename,
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE tablename = 'access_audit_log'
  AND schemaname = 'public'
ORDER BY policyname;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
--
-- ✅ RLS enabled on access_audit_log
-- ✅ Users can only see their own audit logs and org-related logs
-- ✅ Super admins can see all audit logs
-- ✅ System can insert audit logs
-- ✅ Audit logs are immutable (no update/delete)
--
-- Note: Table schema has columns: id, user_id, action, resource_type,
--       resource_id, old_data, new_data, created_at
--
-- ============================================================================
