-- Create super admin system for app owners
-- This allows specific users to have full access to all organizations and data

-- Create a table to track super admins (app owners)
CREATE TABLE IF NOT EXISTS super_admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(user_id)
);

-- Enable RLS on super_admins table
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;

-- Only super admins can view the super admins table
CREATE POLICY "super_admins_view_self" ON super_admins
    FOR SELECT
    USING (auth.uid() IN (SELECT user_id FROM super_admins));

-- Only super admins can manage super admins
CREATE POLICY "super_admins_manage" ON super_admins
    FOR ALL
    USING (auth.uid() IN (SELECT user_id FROM super_admins));

-- Function to check if a user is a super admin
CREATE OR REPLACE FUNCTION is_super_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM super_admins WHERE user_id = user_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is a super admin
CREATE OR REPLACE FUNCTION is_current_user_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM super_admins WHERE user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update organizations policies to allow super admins full access
DROP POLICY IF EXISTS "auth_users_create_orgs" ON organizations;
DROP POLICY IF EXISTS "users_view_their_orgs" ON organizations;
DROP POLICY IF EXISTS "owners_update_orgs" ON organizations;
DROP POLICY IF EXISTS "owners_delete_orgs" ON organizations;

-- Recreate organization policies with super admin access
CREATE POLICY "organizations_insert" ON organizations
    FOR INSERT 
    WITH CHECK (
        auth.uid() IS NOT NULL
    );

CREATE POLICY "organizations_select" ON organizations
    FOR SELECT 
    USING (
        -- Super admins can see all organizations
        is_current_user_super_admin()
        OR
        -- Regular users can see their organizations
        id IN (
            SELECT organization_id 
            FROM user_organizations 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "organizations_update" ON organizations
    FOR UPDATE 
    USING (
        -- Super admins can update all organizations
        is_current_user_super_admin()
        OR
        -- Account owners and admins can update their organizations
        id IN (
            SELECT organization_id 
            FROM user_organizations 
            WHERE user_id = auth.uid() 
            AND role IN ('account_owner', 'admin')
        )
    );

CREATE POLICY "organizations_delete" ON organizations
    FOR DELETE 
    USING (
        -- Super admins can delete all organizations
        is_current_user_super_admin()
        OR
        -- Account owners can delete their organizations
        id IN (
            SELECT organization_id 
            FROM user_organizations 
            WHERE user_id = auth.uid() 
            AND role = 'account_owner'
        )
    );

-- Update user_organizations policies to allow super admins full access
DROP POLICY IF EXISTS "users_join_orgs" ON user_organizations;
DROP POLICY IF EXISTS "users_view_memberships" ON user_organizations;
DROP POLICY IF EXISTS "owners_manage_memberships" ON user_organizations;
DROP POLICY IF EXISTS "users_leave_orgs" ON user_organizations;

CREATE POLICY "user_organizations_insert" ON user_organizations
    FOR INSERT 
    WITH CHECK (
        -- Super admins can add anyone to any organization
        is_current_user_super_admin()
        OR
        -- Users can add themselves
        user_id = auth.uid()
    );

CREATE POLICY "user_organizations_select" ON user_organizations
    FOR SELECT 
    USING (
        -- Super admins can see all memberships
        is_current_user_super_admin()
        OR
        -- Users can see their own memberships
        user_id = auth.uid()
        OR
        -- Organization admins can see all members
        organization_id IN (
            SELECT organization_id 
            FROM user_organizations 
            WHERE user_id = auth.uid() 
            AND role IN ('account_owner', 'admin')
        )
    );

CREATE POLICY "user_organizations_update" ON user_organizations
    FOR UPDATE 
    USING (
        -- Super admins can update all memberships
        is_current_user_super_admin()
        OR
        -- Account owners can manage memberships in their organizations
        organization_id IN (
            SELECT organization_id 
            FROM user_organizations 
            WHERE user_id = auth.uid() 
            AND role = 'account_owner'
        )
    );

CREATE POLICY "user_organizations_delete" ON user_organizations
    FOR DELETE 
    USING (
        -- Super admins can remove anyone
        is_current_user_super_admin()
        OR
        -- Users can leave organizations (except account owners)
        (user_id = auth.uid() AND role != 'account_owner')
        OR
        -- Account owners can remove members from their organizations
        organization_id IN (
            SELECT organization_id 
            FROM user_organizations 
            WHERE user_id = auth.uid() 
            AND role = 'account_owner'
        )
    );

-- Apply super admin policies to sites table
CREATE POLICY "sites_insert" ON sites
    FOR INSERT
    WITH CHECK (
        is_current_user_super_admin()
        OR
        organization_id IN (
            SELECT organization_id 
            FROM user_organizations 
            WHERE user_id = auth.uid() 
            AND role IN ('account_owner', 'admin')
        )
    );

CREATE POLICY "sites_select" ON sites
    FOR SELECT
    USING (
        is_current_user_super_admin()
        OR
        organization_id IN (
            SELECT organization_id 
            FROM user_organizations 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "sites_update" ON sites
    FOR UPDATE
    USING (
        is_current_user_super_admin()
        OR
        organization_id IN (
            SELECT organization_id 
            FROM user_organizations 
            WHERE user_id = auth.uid() 
            AND role IN ('account_owner', 'admin')
        )
    );

CREATE POLICY "sites_delete" ON sites
    FOR DELETE
    USING (
        is_current_user_super_admin()
        OR
        organization_id IN (
            SELECT organization_id 
            FROM user_organizations 
            WHERE user_id = auth.uid() 
            AND role = 'account_owner'
        )
    );

-- Apply super admin policies to devices table
CREATE POLICY "devices_insert" ON devices
    FOR INSERT
    WITH CHECK (
        is_current_user_super_admin()
        OR
        site_id IN (
            SELECT id FROM sites WHERE organization_id IN (
                SELECT organization_id 
                FROM user_organizations 
                WHERE user_id = auth.uid() 
                AND role IN ('account_owner', 'admin')
            )
        )
    );

CREATE POLICY "devices_select" ON devices
    FOR SELECT
    USING (
        is_current_user_super_admin()
        OR
        site_id IN (
            SELECT id FROM sites WHERE organization_id IN (
                SELECT organization_id 
                FROM user_organizations 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "devices_update" ON devices
    FOR UPDATE
    USING (
        is_current_user_super_admin()
        OR
        site_id IN (
            SELECT id FROM sites WHERE organization_id IN (
                SELECT organization_id 
                FROM user_organizations 
                WHERE user_id = auth.uid() 
                AND role IN ('account_owner', 'admin')
            )
        )
    );

CREATE POLICY "devices_delete" ON devices
    FOR DELETE
    USING (
        is_current_user_super_admin()
        OR
        site_id IN (
            SELECT id FROM sites WHERE organization_id IN (
                SELECT organization_id 
                FROM user_organizations 
                WHERE user_id = auth.uid() 
                AND role = 'account_owner'
            )
        )
    );

-- Apply super admin policies to app_users table  
CREATE POLICY "app_users_insert" ON app_users
    FOR INSERT
    WITH CHECK (
        is_current_user_super_admin()
        OR
        organization_id IN (
            SELECT organization_id 
            FROM user_organizations 
            WHERE user_id = auth.uid() 
            AND role IN ('account_owner', 'admin')
        )
    );

CREATE POLICY "app_users_select" ON app_users
    FOR SELECT
    USING (
        is_current_user_super_admin()
        OR
        organization_id IN (
            SELECT organization_id 
            FROM user_organizations 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "app_users_update" ON app_users
    FOR UPDATE
    USING (
        is_current_user_super_admin()
        OR
        organization_id IN (
            SELECT organization_id 
            FROM user_organizations 
            WHERE user_id = auth.uid() 
            AND role IN ('account_owner', 'admin')
        )
    );

CREATE POLICY "app_users_delete" ON app_users
    FOR DELETE
    USING (
        is_current_user_super_admin()
        OR
        organization_id IN (
            SELECT organization_id 
            FROM user_organizations 
            WHERE user_id = auth.uid() 
            AND role = 'account_owner'
        )
    );

-- Insert the first super admin (you'll need to replace this with your actual user ID)
-- You can find your user ID by checking the auth.users table in Supabase
-- Or by logging auth.uid() in your application

-- IMPORTANT: Uncomment and update this line with your user ID after running the migration
-- INSERT INTO super_admins (user_id) VALUES ('YOUR-USER-ID-HERE');

-- To make yourself a super admin, run this query in Supabase SQL editor after logging in:
-- INSERT INTO super_admins (user_id) VALUES (auth.uid());