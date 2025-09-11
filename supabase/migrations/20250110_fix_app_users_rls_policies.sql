-- Fix app_users RLS policies to allow users to access their own profile data
-- Date: 2025-01-10

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view users in their organizations" ON app_users;
DROP POLICY IF EXISTS "Admins can manage users" ON app_users;

-- Create new policies that allow users to access their own profile
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON app_users
  FOR SELECT USING (auth_user_id = auth.uid());

-- Users can insert their own profile (when creating account)
CREATE POLICY "Users can create own profile" ON app_users
  FOR INSERT WITH CHECK (auth_user_id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON app_users
  FOR UPDATE USING (auth_user_id = auth.uid());

-- Users can view other users in their organizations
CREATE POLICY "Users can view users in their organizations" ON app_users
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- Organization admins can manage all users in their organizations
CREATE POLICY "Admins can manage users in their organizations" ON app_users
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid() AND role IN ('account_owner', 'admin')
    )
  );

-- Comment on the changes
COMMENT ON TABLE app_users IS 'Application users table with RLS policies allowing self-access and organization-based access';