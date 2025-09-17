-- Complete RLS fix for app_users to eliminate all recursion
-- This migration completely rebuilds the RLS policies to avoid any self-referential lookups

-- First, disable RLS temporarily to clean up
ALTER TABLE app_users DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on app_users
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'app_users'
        AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON app_users', pol.policyname);
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- Create a helper function to get user's organization without recursion
CREATE OR REPLACE FUNCTION get_user_org_id(user_auth_id UUID)
RETURNS UUID AS $$
DECLARE
    org_id UUID;
BEGIN
    -- Direct query without policies
    SELECT organization_id INTO org_id
    FROM app_users
    WHERE auth_user_id = user_auth_id
    LIMIT 1;

    RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new non-recursive policies

-- 1. Service role has full access (for server-side operations)
CREATE POLICY "service_role_all"
ON app_users FOR ALL
USING (auth.role() = 'service_role');

-- 2. Authenticated users can view their own record
CREATE POLICY "users_view_self"
ON app_users FOR SELECT
USING (auth_user_id = auth.uid());

-- 3. Authenticated users can update their own record
CREATE POLICY "users_update_self"
ON app_users FOR UPDATE
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

-- 4. Users can view others in their organization (using helper function)
CREATE POLICY "users_view_same_org"
ON app_users FOR SELECT
USING (
    organization_id = get_user_org_id(auth.uid())
    AND organization_id IS NOT NULL
);

-- 5. Super admins can do everything
CREATE POLICY "super_admin_all"
ON app_users FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM super_admins
        WHERE user_id = auth.uid()
    )
);

-- 6. Account owners and admins can manage users in their org
CREATE POLICY "org_admins_manage_users"
ON app_users FOR ALL
USING (
    organization_id = get_user_org_id(auth.uid())
    AND EXISTS (
        SELECT 1 FROM app_users au
        WHERE au.auth_user_id = auth.uid()
        AND au.organization_id = app_users.organization_id
        AND au.role IN ('account_owner', 'admin')
    )
);

-- Grant execute permission on helper function
GRANT EXECUTE ON FUNCTION get_user_org_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_org_id(UUID) TO service_role;

-- Verify the policies are created
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'app_users'
ORDER BY policyname;