-- ============================================================================
-- ENTERPRISE AUTHENTICATION SYSTEM MIGRATION (WORKING VERSION)
-- Version: 2.2.0
-- Date: 2025-01-15
-- Description: Auth system overhaul - uses simpler UPDATE approach
-- ============================================================================

-- Start transaction for atomic migration
BEGIN;

-- ============================================================================
-- STEP 1: CREATE UNIFIED ROLE ENUM
-- ============================================================================

-- Drop old enum if exists
DROP TYPE IF EXISTS user_role CASCADE;

-- Create new standardized role enum
CREATE TYPE user_role AS ENUM (
    'super_admin',
    'account_owner',
    'sustainability_manager',
    'facility_manager',
    'analyst',
    'viewer'
);

-- ============================================================================
-- STEP 2: BACKUP EXISTING DATA
-- ============================================================================

-- Backup organization_members table
CREATE TABLE IF NOT EXISTS org_members_backup_2025 AS
SELECT * FROM organization_members;

-- ============================================================================
-- STEP 3: ALTER ORGANIZATION MEMBERS TABLE - SIMPLIFIED APPROACH
-- ============================================================================

-- Add new columns
ALTER TABLE organization_members
    ADD COLUMN IF NOT EXISTS role_new user_role,
    ADD COLUMN IF NOT EXISTS is_owner BOOLEAN DEFAULT false;

-- Update role_new using multiple simple UPDATE statements instead of CASE
-- This avoids the column reference issue

-- First set a default
UPDATE organization_members SET role_new = 'viewer'::user_role WHERE role_new IS NULL;

-- Then update specific roles
UPDATE organization_members SET role_new = 'account_owner'::user_role WHERE role = 'account_owner';
UPDATE organization_members SET role_new = 'account_owner'::user_role WHERE role = 'admin';
UPDATE organization_members SET role_new = 'account_owner'::user_role WHERE role = 'owner';
UPDATE organization_members SET role_new = 'sustainability_manager'::user_role WHERE role = 'sustainability_manager';
UPDATE organization_members SET role_new = 'sustainability_manager'::user_role WHERE role = 'manager';
UPDATE organization_members SET role_new = 'facility_manager'::user_role WHERE role = 'facility_manager';
UPDATE organization_members SET role_new = 'analyst'::user_role WHERE role = 'analyst';
UPDATE organization_members SET role_new = 'analyst'::user_role WHERE role = 'member';
UPDATE organization_members SET role_new = 'viewer'::user_role WHERE role = 'viewer';

-- Update is_owner flag
UPDATE organization_members SET is_owner = true WHERE role IN ('account_owner', 'owner', 'admin');

-- Drop old column and rename new one
ALTER TABLE organization_members DROP COLUMN role;
ALTER TABLE organization_members RENAME COLUMN role_new TO role;

-- Make role NOT NULL
ALTER TABLE organization_members
    ALTER COLUMN role SET NOT NULL,
    ALTER COLUMN role SET DEFAULT 'viewer'::user_role;

-- ============================================================================
-- STEP 4: MIGRATE FROM OTHER TABLES
-- ============================================================================

-- Migrate from user_access if exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_access') THEN
        INSERT INTO organization_members (
            organization_id,
            user_id,
            role,
            is_owner,
            invitation_status,
            created_at
        )
        SELECT
            resource_id,
            user_id,
            CASE
                WHEN role = 'owner' THEN 'account_owner'::user_role
                WHEN role = 'manager' THEN 'sustainability_manager'::user_role
                WHEN role = 'member' THEN 'analyst'::user_role
                ELSE 'viewer'::user_role
            END,
            role = 'owner',
            'accepted',
            created_at
        FROM user_access
        WHERE resource_type = 'organization'
        ON CONFLICT (organization_id, user_id) DO UPDATE SET
            role = EXCLUDED.role,
            is_owner = EXCLUDED.is_owner
        WHERE organization_members.role = 'viewer';
    END IF;
END $$;

-- Migrate from user_access_backup if exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_access_backup') THEN
        INSERT INTO organization_members (
            organization_id,
            user_id,
            role,
            is_owner,
            invitation_status,
            created_at
        )
        SELECT
            organization_id,
            user_id,
            CASE
                WHEN role = 'account_owner' THEN 'account_owner'::user_role
                WHEN role = 'admin' THEN 'account_owner'::user_role
                ELSE 'viewer'::user_role
            END,
            role IN ('account_owner', 'admin'),
            'accepted',
            created_at
        FROM user_access_backup
        ON CONFLICT (organization_id, user_id) DO UPDATE SET
            role = EXCLUDED.role,
            is_owner = EXCLUDED.is_owner
        WHERE organization_members.role = 'viewer';
    END IF;
END $$;

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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_audit_user ON auth_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_org ON auth_audit_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_event ON auth_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_time ON auth_audit_log(created_at DESC);

-- ============================================================================
-- STEP 6: UPDATE SUPER ADMINS TABLE
-- ============================================================================

ALTER TABLE super_admins
    ADD COLUMN IF NOT EXISTS granted_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS granted_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS reason TEXT;

-- ============================================================================
-- STEP 7: HELPER FUNCTIONS
-- ============================================================================

-- Drop and recreate functions
DROP FUNCTION IF EXISTS is_super_admin(UUID);
DROP FUNCTION IF EXISTS get_user_org_role(UUID, UUID);
DROP FUNCTION IF EXISTS has_permission(UUID, TEXT, TEXT, UUID);
DROP FUNCTION IF EXISTS create_organization_with_owner(TEXT, TEXT, UUID);

-- Check if user is super admin
CREATE FUNCTION is_super_admin(check_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM super_admins
        WHERE user_id = COALESCE(check_user_id, auth.uid())
    );
END;
$$;

-- Get user role in organization
CREATE FUNCTION get_user_org_role(org_id UUID, check_user_id UUID DEFAULT NULL)
RETURNS user_role
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_role user_role;
BEGIN
    IF is_super_admin(COALESCE(check_user_id, auth.uid())) THEN
        RETURN 'super_admin'::user_role;
    END IF;

    SELECT role INTO v_role
    FROM organization_members
    WHERE organization_id = org_id
    AND user_id = COALESCE(check_user_id, auth.uid())
    AND invitation_status = 'accepted';

    RETURN v_role;
END;
$$;

-- Check permission
CREATE FUNCTION has_permission(
    org_id UUID,
    resource TEXT,
    action TEXT,
    check_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_role user_role;
BEGIN
    v_role := get_user_org_role(org_id, check_user_id);

    IF v_role = 'super_admin' THEN
        RETURN TRUE;
    END IF;

    CASE v_role
        WHEN 'account_owner' THEN
            RETURN TRUE;
        WHEN 'sustainability_manager' THEN
            RETURN resource IN ('buildings', 'reports', 'sustainability', 'analytics')
                OR (resource = 'users' AND action IN ('view', 'invite'));
        WHEN 'facility_manager' THEN
            RETURN (resource IN ('systems', 'maintenance'))
                OR (resource IN ('buildings', 'reports', 'sustainability') AND action = 'view');
        WHEN 'analyst' THEN
            RETURN (resource = 'analytics')
                OR (resource IN ('buildings', 'reports', 'sustainability') AND action = 'view');
        WHEN 'viewer' THEN
            RETURN action = 'view';
        ELSE
            RETURN FALSE;
    END CASE;
END;
$$;

-- Create organization with owner
CREATE FUNCTION create_organization_with_owner(
    org_name TEXT,
    org_slug TEXT,
    owner_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_org_id UUID;
BEGIN
    INSERT INTO organizations (name, slug, created_by, subscription_tier, subscription_status)
    VALUES (org_name, org_slug, owner_id, 'starter', 'trialing')
    RETURNING id INTO v_org_id;

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

    INSERT INTO auth_audit_log (event_type, user_id, organization_id, status, metadata)
    VALUES ('organization_created', owner_id, v_org_id, 'success',
            jsonb_build_object('org_name', org_name, 'org_slug', org_slug));

    RETURN v_org_id;
END;
$$;

-- ============================================================================
-- STEP 8: ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DO $$
BEGIN
    -- Drop all policies if they exist
    DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
    DROP POLICY IF EXISTS "Organization members can view team profiles" ON user_profiles;
    DROP POLICY IF EXISTS "Users can view own memberships" ON organization_members;
    DROP POLICY IF EXISTS "Organization members can view team" ON organization_members;
    DROP POLICY IF EXISTS "Account owners can manage members" ON organization_members;
    DROP POLICY IF EXISTS "Users can view own audit logs" ON auth_audit_log;
    DROP POLICY IF EXISTS "Organization admins can view org audit logs" ON auth_audit_log;
    DROP POLICY IF EXISTS "Only super admins can view super admin list" ON super_admins;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Create policies

-- User profiles
CREATE POLICY "view_own_profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "update_own_profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "view_team_profiles"
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

-- Organization members
CREATE POLICY "view_own_memberships"
    ON organization_members FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "view_team_members"
    ON organization_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = organization_members.organization_id
            AND om.user_id = auth.uid()
            AND om.invitation_status = 'accepted'
        )
    );

CREATE POLICY "manage_members"
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

-- Audit logs
CREATE POLICY "view_own_audit"
    ON auth_audit_log FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "view_org_audit"
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

-- Super admins
CREATE POLICY "view_super_admins"
    ON super_admins FOR SELECT
    USING (is_super_admin(auth.uid()));

-- ============================================================================
-- STEP 9: SETUP PEDRO AS SUPER ADMIN
-- ============================================================================

DO $$
DECLARE
    pedro_id UUID := 'd5708d9c-34fb-4c85-90ec-34faad9e2896';
    plmj_org_id UUID;
BEGIN
    -- Add as super admin
    INSERT INTO super_admins (user_id, reason)
    VALUES (pedro_id, 'Platform founder')
    ON CONFLICT (user_id) DO UPDATE SET reason = 'Platform founder';

    -- Find PLMJ org
    SELECT id INTO plmj_org_id
    FROM organizations
    WHERE name ILIKE '%PLMJ%'
    LIMIT 1;

    -- Update membership if org exists
    IF plmj_org_id IS NOT NULL THEN
        UPDATE organization_members
        SET role = 'account_owner'::user_role,
            is_owner = TRUE
        WHERE user_id = pedro_id
        AND organization_id = plmj_org_id;
    END IF;

    RAISE NOTICE 'Pedro configured as super admin';
END $$;

-- ============================================================================
-- STEP 10: TRIGGERS
-- ============================================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Apply triggers
DROP TRIGGER IF EXISTS update_org_members_timestamp ON organization_members;
CREATE TRIGGER update_org_members_timestamp
    BEFORE UPDATE ON organization_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Commit
COMMIT;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check results
SELECT 'Roles in system:' as info, role::text, COUNT(*)
FROM organization_members
GROUP BY role;

SELECT 'Pedro status:' as info, email, om.role::text, is_owner, sa.user_id IS NOT NULL as is_super
FROM user_profiles up
LEFT JOIN organization_members om ON om.user_id = up.id
LEFT JOIN super_admins sa ON sa.user_id = up.id
WHERE email = 'pedro@blipee.com';