-- ============================================================================
-- SUPER ADMIN RLS POLICIES
-- Run this AFTER running 20250115_super_admin_simple.sql
-- ============================================================================

-- Drop any existing super admin policies first
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop policies on organizations
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'organizations' AND policyname LIKE '%super admin%')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON organizations', r.policyname);
    END LOOP;

    -- Drop policies on organization_members
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'organization_members' AND policyname LIKE '%super admin%')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON organization_members', r.policyname);
    END LOOP;

    -- Drop policies on user_profiles
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_profiles' AND policyname LIKE '%super admin%')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON user_profiles', r.policyname);
    END LOOP;
END $$;

-- Create new super admin policies
-- These allow super admins to bypass all RLS

-- Organizations
CREATE POLICY "Super admins can view all organizations"
    ON organizations FOR SELECT
    USING (
        is_super_admin() OR
        id IN (
            SELECT organization_id
            FROM organization_members
            WHERE user_id = auth.uid()
            AND invitation_status = 'accepted'
        )
    );

CREATE POLICY "Super admins can manage all organizations"
    ON organizations FOR ALL
    USING (is_super_admin())
    WITH CHECK (is_super_admin());

-- Organization Members
CREATE POLICY "Super admins can view all memberships"
    ON organization_members FOR SELECT
    USING (
        is_super_admin() OR
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM organization_members om2
            WHERE om2.organization_id = organization_members.organization_id
            AND om2.user_id = auth.uid()
            AND om2.role = 'account_owner'
            AND om2.invitation_status = 'accepted'
        )
    );

CREATE POLICY "Super admins can manage all memberships"
    ON organization_members FOR ALL
    USING (is_super_admin())
    WITH CHECK (is_super_admin());

-- User Profiles
CREATE POLICY "Super admins can view all profiles"
    ON user_profiles FOR SELECT
    USING (
        is_super_admin() OR
        auth.uid() = id
    );

CREATE POLICY "Super admins can manage all profiles"
    ON user_profiles FOR ALL
    USING (is_super_admin())
    WITH CHECK (is_super_admin());

-- Buildings (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'buildings') THEN
        EXECUTE 'CREATE POLICY "Super admins can manage all buildings"
            ON buildings FOR ALL
            USING (is_super_admin())
            WITH CHECK (is_super_admin())';
    END IF;
END $$;

-- Test the policies
SELECT 'Super admin check for pedro@blipee.com:' as message,
       is_super_admin('d5708d9c-34fb-4c85-90ec-34faad9e2896'::uuid) as is_super_admin;