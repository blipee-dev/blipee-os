-- ============================================================================
-- ENTERPRISE AUTHENTICATION SYSTEM MIGRATION (SAFE VERSION)
-- Version: 3.0.0
-- Date: 2025-01-15
-- Description: Safe migration that checks column existence
-- ============================================================================

-- Start transaction
BEGIN;

-- ============================================================================
-- STEP 1: DIAGNOSTIC - Check what columns exist
-- ============================================================================

DO $$
DECLARE
    has_role_column BOOLEAN;
    has_role_new_column BOOLEAN;
    role_data_type TEXT;
BEGIN
    -- Check if role column exists
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'organization_members'
        AND column_name = 'role'
    ) INTO has_role_column;

    -- Check if role_new already exists
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'organization_members'
        AND column_name = 'role_new'
    ) INTO has_role_new_column;

    -- Get data type of role column if it exists
    IF has_role_column THEN
        SELECT data_type INTO role_data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'organization_members'
        AND column_name = 'role';

        RAISE NOTICE 'Role column exists with type: %', role_data_type;
    ELSE
        RAISE NOTICE 'Role column does NOT exist';
    END IF;

    IF has_role_new_column THEN
        RAISE NOTICE 'role_new column already exists';
    END IF;
END $$;

-- ============================================================================
-- STEP 2: CREATE ROLE ENUM
-- ============================================================================

-- Drop and recreate enum
DROP TYPE IF EXISTS user_role CASCADE;

CREATE TYPE user_role AS ENUM (
    'super_admin',
    'account_owner',
    'sustainability_manager',
    'facility_manager',
    'analyst',
    'viewer'
);

-- ============================================================================
-- STEP 3: BACKUP TABLE
-- ============================================================================

-- Create backup with timestamp
DO $$
BEGIN
    EXECUTE format('CREATE TABLE IF NOT EXISTS organization_members_backup_%s AS SELECT * FROM organization_members',
                   to_char(now(), 'YYYYMMDD_HH24MISS'));
END $$;

-- ============================================================================
-- STEP 4: HANDLE ROLE COLUMN - CONDITIONAL APPROACH
-- ============================================================================

DO $$
DECLARE
    has_text_role BOOLEAN;
    has_enum_role BOOLEAN;
    col_type TEXT;
BEGIN
    -- Check if role column exists and its type
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'organization_members'
        AND column_name = 'role'
    ) INTO has_text_role;

    IF has_text_role THEN
        -- Get the data type
        SELECT data_type INTO col_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'organization_members'
        AND column_name = 'role';

        RAISE NOTICE 'Found role column with type: %', col_type;

        -- If it's already user-defined (enum), skip this section
        IF col_type = 'USER-DEFINED' THEN
            RAISE NOTICE 'Role column is already an enum, skipping conversion';
        ELSE
            -- Add temporary column
            EXECUTE 'ALTER TABLE organization_members ADD COLUMN IF NOT EXISTS role_temp user_role';

            -- Migrate data using dynamic SQL to avoid compile-time errors
            EXECUTE 'UPDATE organization_members SET role_temp = ''viewer''::user_role WHERE role_temp IS NULL';

            -- Update based on text values
            EXECUTE 'UPDATE organization_members SET role_temp = ''account_owner''::user_role WHERE role = ''account_owner''';
            EXECUTE 'UPDATE organization_members SET role_temp = ''account_owner''::user_role WHERE role = ''admin''';
            EXECUTE 'UPDATE organization_members SET role_temp = ''account_owner''::user_role WHERE role = ''owner''';
            EXECUTE 'UPDATE organization_members SET role_temp = ''sustainability_manager''::user_role WHERE role = ''sustainability_manager''';
            EXECUTE 'UPDATE organization_members SET role_temp = ''sustainability_manager''::user_role WHERE role = ''manager''';
            EXECUTE 'UPDATE organization_members SET role_temp = ''facility_manager''::user_role WHERE role = ''facility_manager''';
            EXECUTE 'UPDATE organization_members SET role_temp = ''analyst''::user_role WHERE role = ''analyst''';
            EXECUTE 'UPDATE organization_members SET role_temp = ''analyst''::user_role WHERE role = ''member''';
            EXECUTE 'UPDATE organization_members SET role_temp = ''viewer''::user_role WHERE role = ''viewer''';

            -- Drop old and rename new
            EXECUTE 'ALTER TABLE organization_members DROP COLUMN role';
            EXECUTE 'ALTER TABLE organization_members RENAME COLUMN role_temp TO role';
        END IF;
    ELSE
        -- No role column exists, create it
        RAISE NOTICE 'No role column found, creating new one';
        EXECUTE 'ALTER TABLE organization_members ADD COLUMN role user_role DEFAULT ''viewer''::user_role NOT NULL';
    END IF;

    -- Ensure role has correct properties
    EXECUTE 'ALTER TABLE organization_members ALTER COLUMN role SET NOT NULL';
    EXECUTE 'ALTER TABLE organization_members ALTER COLUMN role SET DEFAULT ''viewer''::user_role';
END $$;

-- ============================================================================
-- STEP 5: ADD is_owner COLUMN
-- ============================================================================

ALTER TABLE organization_members
    ADD COLUMN IF NOT EXISTS is_owner BOOLEAN DEFAULT false;

-- Update is_owner based on role
DO $$
BEGIN
    -- Check if we can access the role column
    BEGIN
        EXECUTE 'UPDATE organization_members SET is_owner = true WHERE role IN (''account_owner'', ''super_admin'')';
        RAISE NOTICE 'Successfully updated is_owner column';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not update is_owner: %', SQLERRM;
    END;
END $$;

-- ============================================================================
-- STEP 6: MIGRATE FROM OTHER TABLES
-- ============================================================================

-- Migrate from user_access if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_access') THEN
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
        ON CONFLICT (organization_id, user_id) DO NOTHING;

        RAISE NOTICE 'Migrated data from user_access table';
    END IF;
END $$;

-- ============================================================================
-- STEP 7: CREATE AUDIT LOG TABLE
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

CREATE INDEX IF NOT EXISTS idx_audit_log_user ON auth_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_org ON auth_audit_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON auth_audit_log(created_at DESC);

-- ============================================================================
-- STEP 8: UPDATE SUPER ADMINS TABLE
-- ============================================================================

ALTER TABLE super_admins
    ADD COLUMN IF NOT EXISTS granted_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS granted_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS reason TEXT;

-- ============================================================================
-- STEP 9: CREATE FUNCTIONS
-- ============================================================================

-- Drop existing functions
DROP FUNCTION IF EXISTS is_super_admin(UUID);
DROP FUNCTION IF EXISTS get_user_org_role(UUID, UUID);
DROP FUNCTION IF EXISTS has_permission(UUID, TEXT, TEXT, UUID);

-- is_super_admin function
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

-- get_user_org_role function
CREATE OR REPLACE FUNCTION get_user_org_role(org_id UUID, check_user_id UUID DEFAULT NULL)
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

-- has_permission function
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

    IF v_role = 'super_admin' THEN
        RETURN TRUE;
    END IF;

    RETURN CASE v_role
        WHEN 'account_owner' THEN TRUE
        WHEN 'sustainability_manager' THEN
            resource IN ('buildings', 'reports', 'sustainability', 'analytics')
            OR (resource = 'users' AND action IN ('view', 'invite'))
        WHEN 'facility_manager' THEN
            resource IN ('systems', 'maintenance', 'buildings', 'reports')
            AND action IN ('view', 'edit')
        WHEN 'analyst' THEN
            resource IN ('analytics', 'reports', 'sustainability')
            AND action = 'view'
        WHEN 'viewer' THEN
            action = 'view'
        ELSE FALSE
    END;
END;
$$;

-- ============================================================================
-- STEP 10: RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (wrapped in DO block to avoid errors)
DO $$
BEGIN
    DROP POLICY IF EXISTS "view_own_memberships" ON organization_members;
    DROP POLICY IF EXISTS "view_team_members" ON organization_members;
    DROP POLICY IF EXISTS "manage_members" ON organization_members;
    DROP POLICY IF EXISTS "view_own_audit" ON auth_audit_log;
    DROP POLICY IF EXISTS "view_org_audit" ON auth_audit_log;
    DROP POLICY IF EXISTS "view_super_admins" ON super_admins;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Create policies
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

CREATE POLICY "view_own_audit"
    ON auth_audit_log FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "view_super_admins"
    ON super_admins FOR SELECT
    USING (is_super_admin(auth.uid()));

-- ============================================================================
-- STEP 11: SETUP PEDRO
-- ============================================================================

DO $$
DECLARE
    pedro_id UUID := 'd5708d9c-34fb-4c85-90ec-34faad9e2896';
BEGIN
    -- Add as super admin
    INSERT INTO super_admins (user_id, reason)
    VALUES (pedro_id, 'Platform founder')
    ON CONFLICT (user_id) DO UPDATE SET reason = 'Platform founder';

    -- Update any existing membership to account_owner
    UPDATE organization_members
    SET role = 'account_owner'::user_role,
        is_owner = TRUE
    WHERE user_id = pedro_id;

    RAISE NOTICE 'Pedro configured as super admin and account owner';
END $$;

-- Commit
COMMIT;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check the migration results
SELECT 'Migration complete. Checking results...' as status;

-- Show role distribution
SELECT
    role::text as role_name,
    COUNT(*) as count,
    COUNT(CASE WHEN is_owner THEN 1 END) as owners
FROM organization_members
GROUP BY role
ORDER BY role;

-- Check pedro's status
SELECT
    'Pedro Status' as check,
    up.email,
    om.role::text as org_role,
    om.is_owner,
    sa.user_id IS NOT NULL as is_super_admin
FROM user_profiles up
LEFT JOIN organization_members om ON om.user_id = up.id
LEFT JOIN super_admins sa ON sa.user_id = up.id
WHERE up.id = 'd5708d9c-34fb-4c85-90ec-34faad9e2896';