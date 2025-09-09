-- Fix RLS policies to prevent infinite recursion

-- First, let's check if organization_members table exists and handle it
DO $$ 
BEGIN
    -- If organization_members exists, we need to fix its policies
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'organization_members') THEN
        -- Drop all existing policies on organization_members to prevent recursion
        DROP POLICY IF EXISTS "Enable read access for organization members" ON organization_members;
        DROP POLICY IF EXISTS "Enable insert for organization members" ON organization_members;
        DROP POLICY IF EXISTS "Enable update for organization members" ON organization_members;
        DROP POLICY IF EXISTS "Enable delete for organization members" ON organization_members;
        DROP POLICY IF EXISTS "Users can view their organization memberships" ON organization_members;
        DROP POLICY IF EXISTS "Users can manage their organization memberships" ON organization_members;
        
        -- Create simple, non-recursive policies for organization_members
        CREATE POLICY "Users can view their own memberships" ON organization_members
            FOR SELECT USING (user_id = auth.uid());
            
        CREATE POLICY "Authenticated users can insert memberships" ON organization_members
            FOR INSERT WITH CHECK (user_id = auth.uid());
    END IF;
END $$;

-- Fix user_organizations policies to prevent recursion
DROP POLICY IF EXISTS "Users can view their organization memberships" ON user_organizations;
DROP POLICY IF EXISTS "Enable read access for users" ON user_organizations;
DROP POLICY IF EXISTS "Enable insert for users" ON user_organizations;
DROP POLICY IF EXISTS "Enable update for users" ON user_organizations;
DROP POLICY IF EXISTS "Enable delete for users" ON user_organizations;

-- Create simple, non-recursive policy for user_organizations
CREATE POLICY "Users can view their own organization memberships" ON user_organizations
    FOR SELECT USING (user_id = auth.uid());

-- Fix organizations policies to use direct auth.uid() checks
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
DROP POLICY IF EXISTS "Account owners can update their organizations" ON organizations;
DROP POLICY IF EXISTS "Account owners can insert organizations" ON organizations;

-- Create simpler organization policies that don't cause recursion
CREATE POLICY "Users can view organizations they belong to" ON organizations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_organizations
            WHERE user_organizations.organization_id = organizations.id
            AND user_organizations.user_id = auth.uid()
        )
    );

CREATE POLICY "Account owners can update their organizations" ON organizations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_organizations
            WHERE user_organizations.organization_id = organizations.id
            AND user_organizations.user_id = auth.uid()
            AND user_organizations.role = 'account_owner'
        )
    );

CREATE POLICY "Authenticated users can create organizations" ON organizations
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Ensure RLS is enabled on all relevant tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;

-- If organization_members exists, enable RLS on it too
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'organization_members') THEN
        EXECUTE 'ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY';
    END IF;
END $$;