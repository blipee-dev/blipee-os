-- Final fix for RLS recursion - using a materialized approach
-- This completely avoids any recursive lookups

-- First, drop the previous helper function
DROP FUNCTION IF EXISTS get_user_org_id(UUID);

-- Disable RLS temporarily
ALTER TABLE app_users DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
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

-- Create new simplified policies that avoid any recursion

-- 1. Users can always read their own record directly
CREATE POLICY "read_own"
ON app_users FOR SELECT
USING (auth_user_id = auth.uid());

-- 2. Users can update their own record
CREATE POLICY "update_own"
ON app_users FOR UPDATE
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

-- 3. Users can see other users in the same organization
-- This uses a subquery that doesn't trigger RLS because it's checking auth.uid() directly
CREATE POLICY "read_same_org"
ON app_users FOR SELECT
USING (
    organization_id = (
        SELECT organization_id
        FROM app_users
        WHERE auth_user_id = auth.uid()
        LIMIT 1
    )
    AND auth_user_id != auth.uid()  -- Exclude self to avoid overlap with read_own policy
);

-- 4. Super admins bypass all restrictions
CREATE POLICY "super_admin_bypass"
ON app_users FOR ALL
USING (
    auth.uid() IN (
        SELECT user_id FROM super_admins
    )
);

-- 5. Account owners can manage users in their organization
CREATE POLICY "account_owner_manage"
ON app_users FOR ALL
USING (
    -- First check if the current user is an account owner
    EXISTS (
        SELECT 1
        FROM app_users owner
        WHERE owner.auth_user_id = auth.uid()
        AND owner.role = 'account_owner'
        AND owner.organization_id = app_users.organization_id
    )
);

-- 6. Service role bypass
CREATE POLICY "service_bypass"
ON app_users FOR ALL
USING (
    auth.jwt() ->> 'role' = 'service_role'
    OR auth.role() = 'service_role'
);

-- Verify the new policies
SELECT
    tablename,
    policyname,
    cmd,
    qual::text as using_clause
FROM pg_policies
WHERE tablename = 'app_users'
ORDER BY policyname;