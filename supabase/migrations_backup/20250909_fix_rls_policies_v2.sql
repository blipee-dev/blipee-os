-- Fix RLS policies to prevent infinite recursion (v2)

-- First, drop ALL existing policies on organization_members if table exists
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'organization_members') THEN
        -- Drop ALL policies on organization_members
        FOR policy_record IN (
            SELECT policyname 
            FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'organization_members'
        )
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON organization_members', policy_record.policyname);
        END LOOP;
        
        -- Create new simple, non-recursive policies
        EXECUTE 'CREATE POLICY "simple_select_own" ON organization_members FOR SELECT USING (user_id = auth.uid())';
        EXECUTE 'CREATE POLICY "simple_insert_own" ON organization_members FOR INSERT WITH CHECK (user_id = auth.uid())';
    END IF;
END $$;

-- Drop ALL existing policies on user_organizations
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_organizations'
    )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON user_organizations', policy_record.policyname);
    END LOOP;
END $$;

-- Create simple policy for user_organizations
CREATE POLICY "simple_user_org_select" ON user_organizations
    FOR SELECT USING (user_id = auth.uid());

-- Drop ALL existing policies on organizations
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'organizations'
    )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON organizations', policy_record.policyname);
    END LOOP;
END $$;

-- Create simple non-recursive policies for organizations
CREATE POLICY "simple_org_select" ON organizations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_organizations uo
            WHERE uo.organization_id = organizations.id
            AND uo.user_id = auth.uid()
        )
    );

CREATE POLICY "simple_org_update" ON organizations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_organizations uo
            WHERE uo.organization_id = organizations.id
            AND uo.user_id = auth.uid()
            AND uo.role IN ('account_owner', 'admin')
        )
    );

CREATE POLICY "simple_org_insert" ON organizations
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "simple_org_delete" ON organizations
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_organizations uo
            WHERE uo.organization_id = organizations.id
            AND uo.user_id = auth.uid()
            AND uo.role = 'account_owner'
        )
    );

-- Ensure RLS is enabled
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;

-- Enable RLS on organization_members if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'organization_members') THEN
        EXECUTE 'ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY';
    END IF;
END $$;

-- Also handle sites, devices, and app_users tables if they exist
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Sites policies
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sites') THEN
        -- Drop all existing policies
        FOR policy_record IN (
            SELECT policyname 
            FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'sites'
        )
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON sites', policy_record.policyname);
        END LOOP;
        
        -- Create simple policies
        EXECUTE 'ALTER TABLE sites ENABLE ROW LEVEL SECURITY';
        EXECUTE 'CREATE POLICY "simple_sites_select" ON sites FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM user_organizations uo
                WHERE uo.organization_id = sites.organization_id
                AND uo.user_id = auth.uid()
            )
        )';
    END IF;

    -- Devices policies
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'devices') THEN
        -- Drop all existing policies
        FOR policy_record IN (
            SELECT policyname 
            FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'devices'
        )
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON devices', policy_record.policyname);
        END LOOP;
        
        -- Create simple policies
        EXECUTE 'ALTER TABLE devices ENABLE ROW LEVEL SECURITY';
        EXECUTE 'CREATE POLICY "simple_devices_select" ON devices FOR SELECT USING (
            EXISTS (
                SELECT 1 
                FROM sites s
                JOIN user_organizations uo ON uo.organization_id = s.organization_id
                WHERE s.id = devices.site_id
                AND uo.user_id = auth.uid()
            )
        )';
    END IF;

    -- App users policies
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'app_users') THEN
        -- Drop all existing policies
        FOR policy_record IN (
            SELECT policyname 
            FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'app_users'
        )
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON app_users', policy_record.policyname);
        END LOOP;
        
        -- Create simple policies
        EXECUTE 'ALTER TABLE app_users ENABLE ROW LEVEL SECURITY';
        EXECUTE 'CREATE POLICY "simple_app_users_select" ON app_users FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM user_organizations uo
                WHERE uo.organization_id = app_users.organization_id
                AND uo.user_id = auth.uid()
            )
        )';
    END IF;
END $$;