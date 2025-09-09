-- Enable RLS on user_organizations if not already enabled
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own organization memberships" ON user_organizations;
DROP POLICY IF EXISTS "Users can insert their own organization memberships" ON user_organizations;
DROP POLICY IF EXISTS "Account owners can manage organization memberships" ON user_organizations;

-- Allow users to view their own organization memberships
CREATE POLICY "Users can view their own organization memberships" ON user_organizations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow authenticated users to create organization memberships for themselves
-- This is needed when creating a new organization
CREATE POLICY "Users can insert their own organization memberships" ON user_organizations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow account owners to manage all memberships in their organizations
CREATE POLICY "Account owners can manage organization memberships" ON user_organizations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_organizations uo
      WHERE uo.organization_id = user_organizations.organization_id
        AND uo.user_id = auth.uid()
        AND uo.role = 'account_owner'
    )
  );

-- Also ensure the organizations table allows inserts from authenticated users
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;
CREATE POLICY "Authenticated users can create organizations" ON organizations
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);