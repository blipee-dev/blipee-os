-- Simplify organization policies to allow authenticated users to create organizations

-- Drop all existing policies for organizations
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
DROP POLICY IF EXISTS "simple_org_insert" ON organizations;
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Organizations are viewable by members" ON organizations;
DROP POLICY IF EXISTS "Organizations can be updated by account owners and admins" ON organizations;
DROP POLICY IF EXISTS "simple_org_select" ON organizations;
DROP POLICY IF EXISTS "simple_org_update" ON organizations;
DROP POLICY IF EXISTS "simple_org_delete" ON organizations;
DROP POLICY IF EXISTS "Users can view organizations they belong to" ON organizations;
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;

-- Create simplified policies for organizations
-- Allow any authenticated user to create an organization
CREATE POLICY "auth_users_create_orgs" ON organizations
    FOR INSERT 
    WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to view organizations they belong to
CREATE POLICY "users_view_their_orgs" ON organizations
    FOR SELECT 
    USING (
        id IN (
            SELECT organization_id 
            FROM user_organizations 
            WHERE user_id = auth.uid()
        )
    );

-- Allow account owners and admins to update their organizations
CREATE POLICY "owners_update_orgs" ON organizations
    FOR UPDATE 
    USING (
        id IN (
            SELECT organization_id 
            FROM user_organizations 
            WHERE user_id = auth.uid() 
            AND role IN ('account_owner', 'admin')
        )
    );

-- Allow account owners to delete their organizations
CREATE POLICY "owners_delete_orgs" ON organizations
    FOR DELETE 
    USING (
        id IN (
            SELECT organization_id 
            FROM user_organizations 
            WHERE user_id = auth.uid() 
            AND role = 'account_owner'
        )
    );

-- Drop all existing policies for user_organizations
DROP POLICY IF EXISTS "Users can add themselves to organizations" ON user_organizations;
DROP POLICY IF EXISTS "simple_insert_own" ON user_organizations;
DROP POLICY IF EXISTS "Users can manage their organization memberships" ON user_organizations;
DROP POLICY IF EXISTS "Users can view their memberships" ON user_organizations;
DROP POLICY IF EXISTS "Users can update their memberships" ON user_organizations;
DROP POLICY IF EXISTS "Users can leave organizations" ON user_organizations;
DROP POLICY IF EXISTS "simple_user_org_select" ON user_organizations;
DROP POLICY IF EXISTS "Users can view their own organization memberships" ON user_organizations;

-- Create simplified policies for user_organizations
-- Allow users to add themselves to organizations (for initial creation)
CREATE POLICY "users_join_orgs" ON user_organizations
    FOR INSERT 
    WITH CHECK (user_id = auth.uid());

-- Allow users to view their own memberships
CREATE POLICY "users_view_memberships" ON user_organizations
    FOR SELECT 
    USING (user_id = auth.uid());

-- Allow account owners to manage memberships in their organizations
CREATE POLICY "owners_manage_memberships" ON user_organizations
    FOR UPDATE 
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM user_organizations 
            WHERE user_id = auth.uid() 
            AND role = 'account_owner'
        )
    );

-- Allow users to leave organizations (except account owners)
CREATE POLICY "users_leave_orgs" ON user_organizations
    FOR DELETE 
    USING (
        user_id = auth.uid() 
        AND role != 'account_owner'
    );

-- Ensure RLS is enabled
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;