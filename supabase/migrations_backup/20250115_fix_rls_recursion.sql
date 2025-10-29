-- ============================================================================
-- FIX RLS POLICY RECURSION
-- Version: 1.0.0
-- Date: 2025-01-15
-- Description: Fix infinite recursion in RLS policies
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: DROP PROBLEMATIC POLICIES
-- ============================================================================

-- Drop all existing policies on these tables to start fresh
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on organization_members
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'organization_members')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON organization_members', r.policyname);
    END LOOP;

    -- Drop all policies on user_profiles
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_profiles')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON user_profiles', r.policyname);
    END LOOP;

    -- Drop all policies on organizations
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'organizations')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON organizations', r.policyname);
    END LOOP;
END
$$;

-- ============================================================================
-- STEP 2: CREATE SIMPLE, NON-RECURSIVE POLICIES
-- ============================================================================

-- User Profiles: Users can only see their own profile
CREATE POLICY "Users can view own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id);

-- Organization Members: Simple direct access
CREATE POLICY "Users can view own memberships"
    ON organization_members FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Organization owners can view all members"
    ON organization_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM organization_members om2
            WHERE om2.organization_id = organization_members.organization_id
            AND om2.user_id = auth.uid()
            AND om2.role = 'account_owner'
            AND om2.invitation_status = 'accepted'
        )
    );

CREATE POLICY "Organization owners can manage members"
    ON organization_members FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM organization_members om2
            WHERE om2.organization_id = organization_members.organization_id
            AND om2.user_id = auth.uid()
            AND om2.role = 'account_owner'
            AND om2.invitation_status = 'accepted'
        )
    );

-- Organizations: Users can see organizations they belong to
CREATE POLICY "Users can view their organizations"
    ON organizations FOR SELECT
    USING (
        id IN (
            SELECT organization_id
            FROM organization_members
            WHERE user_id = auth.uid()
            AND invitation_status = 'accepted'
        )
    );

CREATE POLICY "Organization owners can update their organizations"
    ON organizations FOR UPDATE
    USING (
        id IN (
            SELECT organization_id
            FROM organization_members
            WHERE user_id = auth.uid()
            AND role = 'account_owner'
            AND invitation_status = 'accepted'
        )
    );

-- ============================================================================
-- STEP 3: ENSURE RLS IS ENABLED
-- ============================================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 4: GRANT NECESSARY PERMISSIONS
-- ============================================================================

GRANT SELECT ON user_profiles TO authenticated;
GRANT UPDATE ON user_profiles TO authenticated;

GRANT SELECT ON organization_members TO authenticated;
GRANT INSERT ON organization_members TO authenticated;
GRANT UPDATE ON organization_members TO authenticated;
GRANT DELETE ON organization_members TO authenticated;

GRANT SELECT ON organizations TO authenticated;
GRANT UPDATE ON organizations TO authenticated;

COMMIT;