-- ============================================================================
-- ENTERPRISE AUTHENTICATION SYSTEM MIGRATION (FINAL)
-- Version: 2.1.0
-- Date: 2025-01-15
-- Description: Complete auth system overhaul - properly handles existing structure
-- ============================================================================

-- Start transaction for atomic migration
BEGIN;

-- ============================================================================
-- STEP 1: CREATE UNIFIED ROLE ENUM
-- ============================================================================

-- Drop old enum if exists (CASCADE to remove dependencies)
DROP TYPE IF EXISTS user_role CASCADE;

-- Create new standardized role enum
CREATE TYPE user_role AS ENUM (
    'super_admin',           -- Platform admin (Blipee team)
    'account_owner',         -- Organization owner
    'sustainability_manager', -- ESG manager
    'facility_manager',      -- Building operations
    'analyst',               -- Data analysis
    'viewer'                 -- Read-only
);

-- ============================================================================
-- STEP 2: BACKUP EXISTING DATA
-- ============================================================================

-- Backup organization_members table (with timestamp for safety)
CREATE TABLE IF NOT EXISTS organization_members_backup_final AS
SELECT * FROM organization_members;

-- ============================================================================
-- STEP 3: ALTER ORGANIZATION MEMBERS TABLE
-- ============================================================================

-- First, add the new columns we need
ALTER TABLE organization_members
    ADD COLUMN IF NOT EXISTS role_new user_role,
    ADD COLUMN IF NOT EXISTS is_owner BOOLEAN DEFAULT false;

-- Update the new role_new column based on existing role text column
-- Using proper table reference to avoid the context error
UPDATE organization_members AS om
SET role_new = CASE
    WHEN om.role = 'account_owner' THEN 'account_owner'::user_role
    WHEN om.role = 'admin' THEN 'account_owner'::user_role
    WHEN om.role = 'sustainability_manager' THEN 'sustainability_manager'::user_role
    WHEN om.role = 'facility_manager' THEN 'facility_manager'::user_role
    WHEN om.role = 'analyst' THEN 'analyst'::user_role
    WHEN om.role = 'viewer' THEN 'viewer'::user_role
    WHEN om.role = 'owner' THEN 'account_owner'::user_role
    WHEN om.role = 'manager' THEN 'sustainability_manager'::user_role
    WHEN om.role = 'member' THEN 'analyst'::user_role
    ELSE 'viewer'::user_role
END;

-- Update is_owner flag based on role
UPDATE organization_members AS om
SET is_owner = (om.role IN ('account_owner', 'owner', 'admin'));

-- Drop the old role column and rename the new one
ALTER TABLE organization_members DROP COLUMN role;
ALTER TABLE organization_members RENAME COLUMN role_new TO role;

-- Make role NOT NULL with default
ALTER TABLE organization_members
    ALTER COLUMN role SET NOT NULL,
    ALTER COLUMN role SET DEFAULT 'viewer'::user_role;

-- ============================================================================
-- STEP 4: MIGRATE DATA FROM OTHER TABLES
-- ============================================================================

-- Migrate from user_access table if it has organization data
INSERT INTO organization_members (
    organization_id,
    user_id,
    role,
    is_owner,
    invitation_status,
    created_at
)
SELECT
    ua.resource_id as organization_id,
    ua.user_id,
    CASE
        WHEN ua.role = 'owner' THEN 'account_owner'::user_role
        WHEN ua.role = 'manager' THEN 'sustainability_manager'::user_role
        WHEN ua.role = 'member' THEN 'analyst'::user_role
        ELSE 'viewer'::user_role
    END,
    ua.role = 'owner',
    'accepted',
    ua.created_at
FROM user_access ua
WHERE ua.resource_type = 'organization'
ON CONFLICT (organization_id, user_id) DO UPDATE SET
    role = EXCLUDED.role,
    is_owner = EXCLUDED.is_owner
WHERE organization_members.role IS NULL OR organization_members.role = 'viewer';

-- Migrate from user_access_backup if it exists and has different data
INSERT INTO organization_members (
    organization_id,
    user_id,
    role,
    is_owner,
    invitation_status,
    created_at
)
SELECT
    uab.organization_id,
    uab.user_id,
    CASE
        WHEN uab.role = 'account_owner' THEN 'account_owner'::user_role
        WHEN uab.role = 'admin' THEN 'account_owner'::user_role
        WHEN uab.role = 'sustainability_manager' THEN 'sustainability_manager'::user_role
        WHEN uab.role = 'facility_manager' THEN 'facility_manager'::user_role
        WHEN uab.role = 'analyst' THEN 'analyst'::user_role
        ELSE 'viewer'::user_role
    END,
    uab.role IN ('account_owner', 'admin'),
    'accepted',
    uab.created_at
FROM user_access_backup uab
ON CONFLICT (organization_id, user_id) DO UPDATE SET
    role = EXCLUDED.role,
    is_owner = EXCLUDED.is_owner
WHERE organization_members.role = 'viewer'; -- Only update if current role is viewer

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_status ON organization_members(invitation_status);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON organization_members(role);

-- ============================================================================
-- STEP 5: CREATE AUTH AUDIT LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS auth_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    organization_id UUID REFERENCES organizations(id),
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    status TEXT NOT NULL CHECK (status IN ('success', 'failure', 'pending')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user_id ON auth_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_org_id ON auth_audit_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_event_type ON auth_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON auth_audit_log(created_at DESC);

-- ============================================================================
-- STEP 6: ENSURE SUPER ADMINS TABLE HAS CORRECT STRUCTURE
-- ============================================================================

-- Add missing columns to super_admins if needed
ALTER TABLE super_admins
    ADD COLUMN IF NOT EXISTS granted_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS granted_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS reason TEXT;

-- ============================================================================
-- STEP 7: ENSURE USER PROFILES TABLE HAS REQUIRED COLUMNS
-- ============================================================================

ALTER TABLE user_profiles
    ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS onboarding_data JSONB DEFAULT '{}';

-- ============================================================================
-- STEP 8: CREATE OR REPLACE PROFILE TRIGGER
-- ============================================================================

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;
DROP FUNCTION IF EXISTS create_user_profile();

-- Create function to auto-create user profile
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (
        id,
        email,
        full_name,
        display_name,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            split_part(NEW.email, '@', 1)
        ),
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            split_part(NEW.email, '@', 1)
        ),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER create_user_profile_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_profile();

-- ============================================================================
-- STEP 9: ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to avoid conflicts
DO $$
BEGIN
    -- Drop user_profiles policies
    DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
    DROP POLICY IF EXISTS "Organization members can view other members" ON user_profiles;
    DROP POLICY IF EXISTS "Organization members can view team profiles" ON user_profiles;

    -- Drop organization_members policies
    DROP POLICY IF EXISTS "Users can view own memberships" ON organization_members;
    DROP POLICY IF EXISTS "Organization members can view team" ON organization_members;
    DROP POLICY IF EXISTS "Account owners can manage members" ON organization_members;

    -- Drop auth_audit_log policies
    DROP POLICY IF EXISTS "Users can view own audit logs" ON auth_audit_log;
    DROP POLICY IF EXISTS "Organization admins can view org audit logs" ON auth_audit_log;

    -- Drop super_admins policies
    DROP POLICY IF EXISTS "Only super admins can view super admin list" ON super_admins;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Create new policies

-- User Profiles Policies
CREATE POLICY "Users can view own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Organization members can view team profiles"
    ON user_profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM organization_members om1
            JOIN organization_members om2 ON om1.organization_id = om2.organization_id
            WHERE om1.user_id = auth.uid()
            AND om2.user_id = user_profiles.id
            AND om1.invitation_status = 'accepted'
            AND om2.invitation_status = 'accepted'
        )
    );

-- Organization Members Policies
CREATE POLICY "Users can view own memberships"
    ON organization_members FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Organization members can view team"
    ON organization_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = organization_members.organization_id
            AND om.user_id = auth.uid()
            AND om.invitation_status = 'accepted'
        )
    );

CREATE POLICY "Account owners can manage members"
    ON organization_members FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = organization_members.organization_id
            AND om.user_id = auth.uid()
            AND om.role IN ('account_owner', 'super_admin')
            AND om.invitation_status = 'accepted'
        )
    );

-- Audit Log Policies
CREATE POLICY "Users can view own audit logs"
    ON auth_audit_log FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Organization admins can view org audit logs"
    ON auth_audit_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = auth_audit_log.organization_id
            AND om.user_id = auth.uid()
            AND om.role IN ('account_owner', 'super_admin')
            AND om.invitation_status = 'accepted'
        )
    );

-- Super Admins Policies
CREATE POLICY "Only super admins can view super admin list"
    ON super_admins FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM super_admins WHERE user_id = auth.uid()
        )
    );

-- ============================================================================
-- STEP 10: CREATE HELPER FUNCTIONS
-- ============================================================================

-- Drop existing functions to recreate with proper signatures
DROP FUNCTION IF EXISTS is_super_admin(UUID);
DROP FUNCTION IF EXISTS get_user_org_role(UUID, UUID);
DROP FUNCTION IF EXISTS has_permission(UUID, TEXT, TEXT, UUID);

-- Function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin(check_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM super_admins
        WHERE user_id = COALESCE(check_user_id, auth.uid())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's role in organization
CREATE OR REPLACE FUNCTION get_user_org_role(org_id UUID, check_user_id UUID DEFAULT NULL)
RETURNS user_role AS $$
DECLARE
    v_role user_role;
BEGIN
    -- Check if super admin
    IF is_super_admin(COALESCE(check_user_id, auth.uid())) THEN
        RETURN 'super_admin'::user_role;
    END IF;

    -- Get actual role
    SELECT role INTO v_role
    FROM organization_members
    WHERE organization_id = org_id
    AND user_id = COALESCE(check_user_id, auth.uid())
    AND invitation_status = 'accepted';

    RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check permission
CREATE OR REPLACE FUNCTION has_permission(
    org_id UUID,
    resource TEXT,
    action TEXT,
    check_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_role user_role;
BEGIN
    v_role := get_user_org_role(org_id, check_user_id);

    -- Super admin has all permissions
    IF v_role = 'super_admin' THEN
        RETURN TRUE;
    END IF;

    -- Check role-based permissions
    CASE v_role
        WHEN 'account_owner' THEN
            RETURN TRUE; -- Account owner has all org permissions
        WHEN 'sustainability_manager' THEN
            RETURN resource IN ('buildings', 'reports', 'sustainability', 'analytics')
                OR (resource = 'users' AND action IN ('view', 'invite'));
        WHEN 'facility_manager' THEN
            RETURN (resource IN ('systems', 'maintenance') AND action = ANY(ARRAY['view', 'edit', 'create', 'delete']))
                OR (resource IN ('buildings', 'reports', 'sustainability') AND action = 'view');
        WHEN 'analyst' THEN
            RETURN (resource = 'analytics' AND action = ANY(ARRAY['view', 'create', 'export']))
                OR (resource IN ('buildings', 'reports', 'sustainability') AND action = 'view');
        WHEN 'viewer' THEN
            RETURN action = 'view' AND resource IN ('organization', 'buildings', 'reports', 'sustainability', 'analytics');
        ELSE
            RETURN FALSE;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 11: CREATE RPC FUNCTION FOR ORGANIZATION CREATION
-- ============================================================================

-- Drop existing function if exists
DROP FUNCTION IF EXISTS create_organization_with_owner(TEXT, TEXT, UUID);

-- Function to create organization with owner
CREATE OR REPLACE FUNCTION create_organization_with_owner(
    org_name TEXT,
    org_slug TEXT,
    owner_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_org_id UUID;
BEGIN
    -- Create organization
    INSERT INTO organizations (name, slug, created_by, subscription_tier, subscription_status)
    VALUES (org_name, org_slug, owner_id, 'starter', 'trialing')
    RETURNING id INTO v_org_id;

    -- Add owner as member
    INSERT INTO organization_members (
        organization_id,
        user_id,
        role,
        is_owner,
        invitation_status,
        joined_at
    )
    VALUES (
        v_org_id,
        owner_id,
        'account_owner',
        TRUE,
        'accepted',
        NOW()
    );

    -- Log the action
    INSERT INTO auth_audit_log (event_type, user_id, organization_id, status, metadata)
    VALUES ('organization_created', owner_id, v_org_id, 'success',
            jsonb_build_object('org_name', org_name, 'org_slug', org_slug));

    RETURN v_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 12: ENSURE PEDRO HAS SUPER ADMIN ACCESS
-- ============================================================================

DO $$
DECLARE
    v_user_id UUID := 'd5708d9c-34fb-4c85-90ec-34faad9e2896';
    v_org_id UUID;
BEGIN
    -- Add pedro as super admin
    INSERT INTO super_admins (user_id, reason)
    VALUES (v_user_id, 'Platform founder')
    ON CONFLICT (user_id) DO UPDATE SET
        reason = 'Platform founder',
        granted_at = NOW();

    -- Find PLMJ organization
    SELECT id INTO v_org_id
    FROM organizations
    WHERE name ILIKE '%PLMJ%'
    LIMIT 1;

    -- Ensure pedro has account_owner role in PLMJ
    IF v_org_id IS NOT NULL THEN
        UPDATE organization_members
        SET role = 'account_owner'::user_role,
            is_owner = TRUE,
            invitation_status = 'accepted'
        WHERE user_id = v_user_id
        AND organization_id = v_org_id;

        RAISE NOTICE 'Updated pedro as account_owner for PLMJ organization';
    END IF;

    RAISE NOTICE 'Pedro (d5708d9c-34fb-4c85-90ec-34faad9e2896) set as super admin';
END $$;

-- ============================================================================
-- STEP 13: UPDATE TIMESTAMP TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate triggers
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
DROP TRIGGER IF EXISTS update_organization_members_updated_at ON organization_members;

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_organization_members_updated_at
    BEFORE UPDATE ON organization_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- STEP 14: CLEANUP (Optional - uncomment after verifying migration)
-- ============================================================================

-- These can be dropped after verifying the migration worked
-- DROP TABLE IF EXISTS user_access CASCADE;
-- DROP TABLE IF EXISTS user_access_backup CASCADE;
-- DROP TABLE IF EXISTS groups CASCADE;
-- DROP TABLE IF EXISTS organization_members_backup_v3 CASCADE;
-- DROP TABLE IF EXISTS organization_members_backup_final CASCADE;

-- Commit transaction
COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (Run these separately after migration)
-- ============================================================================

-- 1. Check role distribution
SELECT
    role::text,
    is_owner,
    COUNT(*) as count
FROM organization_members
GROUP BY role, is_owner
ORDER BY role;

-- 2. Check pedro's access
SELECT
    up.email,
    om.role::text as org_role,
    om.is_owner,
    o.name as organization,
    sa.user_id IS NOT NULL as is_super_admin
FROM user_profiles up
LEFT JOIN organization_members om ON om.user_id = up.id
LEFT JOIN organizations o ON o.id = om.organization_id
LEFT JOIN super_admins sa ON sa.user_id = up.id
WHERE up.email = 'pedro@blipee.com';

-- 3. Verify audit log table
SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'auth_audit_log'
) as audit_log_exists;

-- 4. Check if enum was created
SELECT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'user_role'
) as user_role_enum_exists;