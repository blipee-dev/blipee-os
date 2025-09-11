-- =============================================
-- Fix RLS Recursion Issues
-- =============================================

-- Drop existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can view their own access" ON user_access;
DROP POLICY IF EXISTS "Users can view own access records" ON user_access;
DROP POLICY IF EXISTS "user_access_select" ON user_access;

-- Create a simple, non-recursive policy for user_access
CREATE POLICY "Users can view their own access records"
ON user_access
FOR SELECT
USING (
  auth.uid() = user_id
);

-- Enable RLS on super_admins if not already enabled
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;

-- Drop existing super_admin policies
DROP POLICY IF EXISTS "Super admins are public" ON super_admins;
DROP POLICY IF EXISTS "Anyone can check super admin status" ON super_admins;

-- Create a simple policy for super_admins
-- Anyone can check if someone is a super admin
CREATE POLICY "Anyone can check super admin status"
ON super_admins
FOR SELECT
USING (true);

-- Ensure organizations table has proper policies
DROP POLICY IF EXISTS "Users can view organizations they have access to" ON organizations;

-- Create a non-recursive policy for organizations
CREATE POLICY "Users can view organizations they belong to"
ON organizations
FOR SELECT
USING (
  -- User has access to this organization
  EXISTS (
    SELECT 1 FROM user_access
    WHERE user_access.resource_id = organizations.id
    AND user_access.resource_type = 'organization'
    AND user_access.user_id = auth.uid()
  )
  OR
  -- User is a super admin
  EXISTS (
    SELECT 1 FROM super_admins
    WHERE super_admins.user_id = auth.uid()
  )
);

-- Grant necessary permissions
GRANT SELECT ON user_access TO authenticated;
GRANT SELECT ON super_admins TO authenticated;
GRANT SELECT ON organizations TO authenticated;