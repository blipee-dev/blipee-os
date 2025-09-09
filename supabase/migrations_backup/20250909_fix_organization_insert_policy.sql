-- Fix organization insert policy to allow authenticated users to create organizations
-- and automatically add them as members

-- Drop the existing simple insert policy
DROP POLICY IF EXISTS "simple_org_insert" ON organizations;
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;

-- Create a more permissive insert policy for authenticated users
CREATE POLICY "Users can create organizations" ON organizations
    FOR INSERT 
    WITH CHECK (auth.uid() IS NOT NULL);

-- Ensure users can insert into user_organizations for their own records
DROP POLICY IF EXISTS "simple_insert_own" ON user_organizations;
DROP POLICY IF EXISTS "Users can manage their organization memberships" ON user_organizations;

CREATE POLICY "Users can add themselves to organizations" ON user_organizations
    FOR INSERT 
    WITH CHECK (user_id = auth.uid());

-- Also allow users to see all their organization memberships
DROP POLICY IF EXISTS "simple_user_org_select" ON user_organizations;
DROP POLICY IF EXISTS "Users can view their own organization memberships" ON user_organizations;

CREATE POLICY "Users can view their memberships" ON user_organizations
    FOR SELECT 
    USING (user_id = auth.uid());

-- Allow users to update their own organization memberships
CREATE POLICY "Users can update their memberships" ON user_organizations
    FOR UPDATE 
    USING (user_id = auth.uid());

-- Allow users to delete their own organization memberships
CREATE POLICY "Users can leave organizations" ON user_organizations
    FOR DELETE 
    USING (user_id = auth.uid() AND role != 'account_owner');

-- Ensure RLS is enabled
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;