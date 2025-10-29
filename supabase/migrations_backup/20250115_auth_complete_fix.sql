-- ============================================================================
-- ENTERPRISE AUTH MIGRATION - COMPLETE FIX
-- Version: 5.0.0
-- Date: 2025-01-15
-- Description: Properly handles existing functions and enum
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: DROP EXISTING FUNCTIONS (to avoid conflicts)
-- ============================================================================

-- Drop all functions that might exist with any signature
DROP FUNCTION IF EXISTS is_super_admin() CASCADE;
DROP FUNCTION IF EXISTS is_super_admin(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_user_org_role(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_user_org_role(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS has_permission(UUID, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS has_permission(UUID, TEXT, TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS create_organization_with_owner(TEXT, TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS get_user_organizations(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_user_sites(UUID, UUID) CASCADE;

-- ============================================================================
-- STEP 2: ADD MISSING COLUMNS TO organization_members
-- ============================================================================

-- Add is_owner if it doesn't exist
ALTER TABLE organization_members
    ADD COLUMN IF NOT EXISTS is_owner BOOLEAN DEFAULT false;

-- Update is_owner based on current role
UPDATE organization_members
SET is_owner = true
WHERE role::text = 'account_owner'
AND (is_owner IS NULL OR is_owner = false);

-- ============================================================================
-- STEP 3: CREATE AUTH AUDIT LOG TABLE
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
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON auth_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_org_id ON auth_audit_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_event_type ON auth_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON auth_audit_log(created_at DESC);

-- ============================================================================
-- STEP 4: UPDATE SUPER ADMINS TABLE
-- ============================================================================

-- Add missing columns to super_admins
ALTER TABLE super_admins
    ADD COLUMN IF NOT EXISTS granted_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS granted_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS reason TEXT;

-- ============================================================================
-- STEP 5: CREATE NEW FUNCTIONS (with correct signatures)
-- ============================================================================

-- Function: is_super_admin
CREATE OR REPLACE FUNCTION is_super_admin(check_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM super_admins
        WHERE user_id = COALESCE(check_user_id, auth.uid())
    );
END;
$$;

-- Function: get_user_org_role
CREATE OR REPLACE FUNCTION get_user_org_role(org_id UUID, check_user_id UUID DEFAULT NULL)
RETURNS TEXT  -- Return TEXT instead of user_role to avoid type issues
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_role TEXT;
BEGIN
    -- Check if super admin
    IF is_super_admin(COALESCE(check_user_id, auth.uid())) THEN
        RETURN 'super_admin';
    END IF;

    -- Get actual role from organization_members
    SELECT role::text INTO v_role
    FROM organization_members
    WHERE organization_id = org_id
    AND user_id = COALESCE(check_user_id, auth.uid())
    AND invitation_status = 'accepted';

    RETURN v_role;
END;
$$;

-- Function: has_permission
CREATE OR REPLACE FUNCTION has_permission(
    org_id UUID,
    resource TEXT,
    action TEXT,
    check_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_role TEXT;
BEGIN
    -- Get user's role
    v_role := get_user_org_role(org_id, check_user_id);

    -- No role means no permission
    IF v_role IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Check permissions based on role
    RETURN CASE v_role
        WHEN 'super_admin' THEN TRUE
        WHEN 'account_owner' THEN TRUE
        WHEN 'sustainability_manager' THEN
            resource IN ('buildings', 'reports', 'sustainability', 'analytics')
            OR (resource = 'users' AND action IN ('view', 'invite'))
        WHEN 'facility_manager' THEN
            (resource IN ('systems', 'maintenance') AND action != 'delete')
            OR (resource IN ('buildings', 'reports', 'sustainability') AND action = 'view')
        WHEN 'analyst' THEN
            (resource = 'analytics' AND action IN ('view', 'create', 'export'))
            OR (resource IN ('reports', 'sustainability') AND action = 'view')
        WHEN 'viewer' THEN
            action = 'view'
        ELSE FALSE
    END;
END;
$$;

-- Function: create_organization_with_owner
CREATE OR REPLACE FUNCTION create_organization_with_owner(
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
    v_role_text TEXT := 'account_owner';
BEGIN
    -- Create organization
    INSERT INTO organizations (
        name,
        slug,
        created_by,
        subscription_tier,
        subscription_status
    )
    VALUES (
        org_name,
        org_slug,
        owner_id,
        'starter',
        'trialing'
    )
    RETURNING id INTO v_org_id;

    -- Add owner as member (using dynamic SQL to handle enum)
    EXECUTE format(
        'INSERT INTO organization_members (
            organization_id, user_id, role, is_owner, invitation_status, joined_at
        ) VALUES ($1, $2, $3::user_role, $4, $5, $6)'
    ) USING v_org_id, owner_id, v_role_text, TRUE, 'accepted', NOW();

    -- Log the action
    INSERT INTO auth_audit_log (
        event_type,
        user_id,
        organization_id,
        status,
        metadata
    )
    VALUES (
        'organization_created',
        owner_id,
        v_org_id,
        'success',
        jsonb_build_object('org_name', org_name, 'org_slug', org_slug)
    );

    RETURN v_org_id;
END;
$$;

-- ============================================================================
-- STEP 6: CREATE OR REPLACE RLS POLICIES
-- ============================================================================

-- Enable RLS on tables
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to recreate them
DO $$
BEGIN
    -- Organization members
    DROP POLICY IF EXISTS "view_own_memberships" ON organization_members;
    DROP POLICY IF EXISTS "view_team_members" ON organization_members;
    DROP POLICY IF EXISTS "manage_members" ON organization_members;
    DROP POLICY IF EXISTS "Users can view own memberships" ON organization_members;
    DROP POLICY IF EXISTS "Organization members can view team" ON organization_members;
    DROP POLICY IF EXISTS "Account owners can manage members" ON organization_members;

    -- Audit log
    DROP POLICY IF EXISTS "view_own_audit" ON auth_audit_log;
    DROP POLICY IF EXISTS "view_org_audit" ON auth_audit_log;
    DROP POLICY IF EXISTS "Users can view own audit logs" ON auth_audit_log;
    DROP POLICY IF EXISTS "Organization admins can view org audit logs" ON auth_audit_log;

    -- Super admins
    DROP POLICY IF EXISTS "view_super_admins" ON super_admins;
    DROP POLICY IF EXISTS "Only super admins can view super admin list" ON super_admins;

    -- User profiles
    DROP POLICY IF EXISTS "view_own_profile" ON user_profiles;
    DROP POLICY IF EXISTS "update_own_profile" ON user_profiles;
    DROP POLICY IF EXISTS "view_team_profiles" ON user_profiles;
    DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
    DROP POLICY IF EXISTS "Organization members can view team profiles" ON user_profiles;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Create new policies with unique names

-- Organization members policies
CREATE POLICY "om_view_own"
    ON organization_members FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "om_view_team"
    ON organization_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = organization_members.organization_id
            AND om.user_id = auth.uid()
            AND om.invitation_status = 'accepted'
        )
    );

CREATE POLICY "om_manage"
    ON organization_members FOR ALL
    USING (
        is_super_admin(auth.uid())
        OR EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = organization_members.organization_id
            AND om.user_id = auth.uid()
            AND om.role::text = 'account_owner'
            AND om.invitation_status = 'accepted'
        )
    );

-- Audit log policies
CREATE POLICY "al_view_own"
    ON auth_audit_log FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "al_view_org"
    ON auth_audit_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = auth_audit_log.organization_id
            AND om.user_id = auth.uid()
            AND om.role::text IN ('account_owner', 'super_admin')
            AND om.invitation_status = 'accepted'
        )
    );

-- Super admins policy
CREATE POLICY "sa_view"
    ON super_admins FOR SELECT
    USING (is_super_admin(auth.uid()));

-- User profiles policies
CREATE POLICY "up_view_own"
    ON user_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "up_update_own"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "up_view_team"
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

-- ============================================================================
-- STEP 7: SETUP PEDRO AS SUPER ADMIN
-- ============================================================================

DO $$
DECLARE
    pedro_id UUID := 'd5708d9c-34fb-4c85-90ec-34faad9e2896';
    v_org_id UUID;
BEGIN
    -- Ensure pedro is super admin
    INSERT INTO super_admins (user_id, reason)
    VALUES (pedro_id, 'Platform founder')
    ON CONFLICT (user_id) DO UPDATE
    SET reason = 'Platform founder',
        granted_at = NOW();

    -- Find PLMJ organization
    SELECT id INTO v_org_id
    FROM organizations
    WHERE name ILIKE '%PLMJ%'
    ORDER BY created_at DESC
    LIMIT 1;

    -- Update pedro's role in PLMJ organization
    IF v_org_id IS NOT NULL THEN
        -- Use dynamic SQL to handle enum casting
        EXECUTE format(
            'UPDATE organization_members
             SET role = $1::user_role, is_owner = true
             WHERE user_id = $2 AND organization_id = $3'
        ) USING 'account_owner', pedro_id, v_org_id;

        RAISE NOTICE 'Updated pedro as account_owner in PLMJ organization';
    END IF;

    RAISE NOTICE 'Pedro configured as super admin';
END $$;

-- ============================================================================
-- STEP 8: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON organization_members(role);
CREATE INDEX IF NOT EXISTS idx_org_members_status ON organization_members(invitation_status);

-- ============================================================================
-- STEP 9: UPDATE STATISTICS
-- ============================================================================

ANALYZE organization_members;
ANALYZE auth_audit_log;
ANALYZE super_admins;
ANALYZE user_profiles;

-- Commit the transaction
COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (Run after migration)
-- ============================================================================

-- 1. Check roles distribution
SELECT 'Role Distribution:' as info;
SELECT
    role::text as role_name,
    COUNT(*) as user_count,
    SUM(CASE WHEN is_owner THEN 1 ELSE 0 END) as owners
FROM organization_members
GROUP BY role
ORDER BY user_count DESC;

-- 2. Check Pedro's status
SELECT 'Pedro Status:' as info;
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
WHERE up.id = 'd5708d9c-34fb-4c85-90ec-34faad9e2896';

-- 3. Check functions exist
SELECT 'Functions Created:' as info;
SELECT
    proname as function_name,
    pronargs as arg_count
FROM pg_proc
WHERE proname IN ('is_super_admin', 'get_user_org_role', 'has_permission', 'create_organization_with_owner')
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY proname;