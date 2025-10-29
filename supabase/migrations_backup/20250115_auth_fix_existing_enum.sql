-- ============================================================================
-- ENTERPRISE AUTH MIGRATION - FOR EXISTING ENUM COLUMN
-- Version: 4.0.0
-- Date: 2025-01-15
-- Description: Handles case where role column is already user_role enum
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: CHECK CURRENT STATE
-- ============================================================================

DO $$
DECLARE
    col_type TEXT;
    type_name TEXT;
BEGIN
    -- Get the column type
    SELECT
        data_type,
        udt_name
    INTO col_type, type_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'organization_members'
    AND column_name = 'role';

    RAISE NOTICE 'Current role column - Type: %, UDT: %', col_type, type_name;

    -- Check if user_role enum exists
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        RAISE NOTICE 'user_role enum already exists';

        -- Get enum values
        FOR col_type IN
            SELECT enumlabel::text
            FROM pg_enum
            WHERE enumtypid = 'user_role'::regtype
            ORDER BY enumsortorder
        LOOP
            RAISE NOTICE '  - %', col_type;
        END LOOP;
    END IF;
END $$;

-- ============================================================================
-- STEP 2: ENSURE ENUM HAS ALL REQUIRED VALUES
-- ============================================================================

-- Since the enum already exists, we need to check if it has all our values
-- If not, we need to add them

DO $$
BEGIN
    -- Check if super_admin exists in enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumtypid = 'user_role'::regtype
        AND enumlabel = 'super_admin'
    ) THEN
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';
        RAISE NOTICE 'Added super_admin to user_role enum';
    END IF;

    -- Check other values
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumtypid = 'user_role'::regtype
        AND enumlabel = 'account_owner'
    ) THEN
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'account_owner';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumtypid = 'user_role'::regtype
        AND enumlabel = 'sustainability_manager'
    ) THEN
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'sustainability_manager';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumtypid = 'user_role'::regtype
        AND enumlabel = 'facility_manager'
    ) THEN
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'facility_manager';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumtypid = 'user_role'::regtype
        AND enumlabel = 'analyst'
    ) THEN
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'analyst';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumtypid = 'user_role'::regtype
        AND enumlabel = 'viewer'
    ) THEN
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'viewer';
    END IF;
END $$;

-- ============================================================================
-- STEP 3: ADD MISSING COLUMNS
-- ============================================================================

-- Add is_owner if it doesn't exist
ALTER TABLE organization_members
    ADD COLUMN IF NOT EXISTS is_owner BOOLEAN DEFAULT false;

-- Update is_owner based on current role values
UPDATE organization_members
SET is_owner = true
WHERE role::text IN ('account_owner', 'admin', 'owner')
AND is_owner = false;

-- ============================================================================
-- STEP 4: CREATE AUDIT LOG TABLE
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

CREATE INDEX IF NOT EXISTS idx_audit_user ON auth_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_org ON auth_audit_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON auth_audit_log(created_at DESC);

-- ============================================================================
-- STEP 5: UPDATE SUPER ADMINS TABLE
-- ============================================================================

ALTER TABLE super_admins
    ADD COLUMN IF NOT EXISTS granted_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS granted_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS reason TEXT;

-- ============================================================================
-- STEP 6: CREATE/REPLACE HELPER FUNCTIONS
-- ============================================================================

-- is_super_admin
CREATE OR REPLACE FUNCTION is_super_admin(check_user_id UUID DEFAULT NULL)
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

-- get_user_org_role
CREATE OR REPLACE FUNCTION get_user_org_role(org_id UUID, check_user_id UUID DEFAULT NULL)
RETURNS user_role
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_role user_role;
BEGIN
    -- Check super admin first
    IF is_super_admin(COALESCE(check_user_id, auth.uid())) THEN
        RETURN 'super_admin'::user_role;
    END IF;

    -- Get organization role
    SELECT role INTO v_role
    FROM organization_members
    WHERE organization_id = org_id
    AND user_id = COALESCE(check_user_id, auth.uid())
    AND invitation_status = 'accepted';

    RETURN v_role;
END;
$$;

-- has_permission
CREATE OR REPLACE FUNCTION has_permission(
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

    IF v_role IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN CASE v_role::text
        WHEN 'super_admin' THEN TRUE
        WHEN 'account_owner' THEN TRUE
        WHEN 'sustainability_manager' THEN
            resource IN ('buildings', 'reports', 'sustainability', 'analytics')
            OR (resource = 'users' AND action IN ('view', 'invite'))
        WHEN 'facility_manager' THEN
            (resource IN ('systems', 'maintenance') AND action != 'delete')
            OR (resource IN ('buildings', 'reports') AND action = 'view')
        WHEN 'analyst' THEN
            resource IN ('analytics', 'reports', 'sustainability')
            AND action IN ('view', 'export')
        WHEN 'viewer' THEN
            action = 'view'
        ELSE FALSE
    END;
END;
$$;

-- create_organization_with_owner
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
        'account_owner'::user_role,
        TRUE,
        'accepted',
        NOW()
    );

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
-- STEP 7: RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DO $$
BEGIN
    -- Organization members policies
    DROP POLICY IF EXISTS "view_own_memberships" ON organization_members;
    DROP POLICY IF EXISTS "view_team_members" ON organization_members;
    DROP POLICY IF EXISTS "manage_members" ON organization_members;

    -- Audit log policies
    DROP POLICY IF EXISTS "view_own_audit" ON auth_audit_log;
    DROP POLICY IF EXISTS "view_org_audit" ON auth_audit_log;

    -- Super admin policies
    DROP POLICY IF EXISTS "view_super_admins" ON super_admins;

    -- User profile policies
    DROP POLICY IF EXISTS "view_own_profile" ON user_profiles;
    DROP POLICY IF EXISTS "update_own_profile" ON user_profiles;
    DROP POLICY IF EXISTS "view_team_profiles" ON user_profiles;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Create new policies

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
        is_super_admin(auth.uid())
        OR EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = organization_members.organization_id
            AND om.user_id = auth.uid()
            AND om.role = 'account_owner'
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

-- ============================================================================
-- STEP 8: SETUP PEDRO AS SUPER ADMIN
-- ============================================================================

DO $$
DECLARE
    pedro_id UUID := 'd5708d9c-34fb-4c85-90ec-34faad9e2896';
    org_id UUID;
BEGIN
    -- Ensure pedro is super admin
    INSERT INTO super_admins (user_id, reason)
    VALUES (pedro_id, 'Platform founder')
    ON CONFLICT (user_id) DO UPDATE
    SET reason = 'Platform founder',
        granted_at = NOW();

    -- Update all pedro's memberships to account_owner
    UPDATE organization_members
    SET role = 'account_owner'::user_role,
        is_owner = TRUE
    WHERE user_id = pedro_id;

    RAISE NOTICE 'Pedro configured as super admin with account_owner role in all organizations';
END $$;

-- ============================================================================
-- STEP 9: CLEANUP & OPTIMIZATION
-- ============================================================================

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON organization_members(role);
CREATE INDEX IF NOT EXISTS idx_org_members_status ON organization_members(invitation_status);

-- Update statistics
ANALYZE organization_members;
ANALYZE auth_audit_log;
ANALYZE super_admins;

COMMIT;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check enum values
SELECT 'Enum values in user_role:' as info;
SELECT enumlabel::text as role_value
FROM pg_enum
WHERE enumtypid = 'user_role'::regtype
ORDER BY enumsortorder;

-- Check role distribution
SELECT 'Role distribution:' as info;
SELECT
    role::text as role_name,
    COUNT(*) as count,
    SUM(CASE WHEN is_owner THEN 1 ELSE 0 END) as owners
FROM organization_members
GROUP BY role
ORDER BY count DESC;

-- Check Pedro's status
SELECT 'Pedro status:' as info;
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