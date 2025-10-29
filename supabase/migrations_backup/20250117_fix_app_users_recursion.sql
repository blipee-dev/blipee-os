-- Fix infinite recursion in app_users RLS policies
-- Drop existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can view users in their organization" ON app_users;
DROP POLICY IF EXISTS "Users can update their own profile" ON app_users;
DROP POLICY IF EXISTS "Super admins can manage all users" ON app_users;

-- Create non-recursive policies for app_users

-- 1. Users can view their own record (no recursion - direct auth check)
CREATE POLICY "Users can view own record"
ON app_users FOR SELECT
USING (auth_user_id = auth.uid());

-- 2. Users can view other users in their organization (simplified)
CREATE POLICY "Users can view organization members"
ON app_users FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id
    FROM app_users
    WHERE auth_user_id = auth.uid()
    LIMIT 1
  )
);

-- 3. Users can update their own record
CREATE POLICY "Users can update own record"
ON app_users FOR UPDATE
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

-- 4. Super admins can do everything (check super_admins table directly)
CREATE POLICY "Super admins full access"
ON app_users FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM super_admins
    WHERE user_id = auth.uid()
  )
);

-- 5. Service role bypass (for server-side operations)
CREATE POLICY "Service role bypass"
ON app_users FOR ALL
USING (
  auth.jwt() ->> 'role' = 'service_role'
);