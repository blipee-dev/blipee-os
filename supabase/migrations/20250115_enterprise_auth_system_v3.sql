-- ============================================================================
-- ENTERPRISE AUTHENTICATION SYSTEM MIGRATION (V3 - CORRECTED)
-- Version: 2.0.2
-- Date: 2025-01-15
-- Description: Complete auth system overhaul - handles existing role column
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

-- Backup organization_members table
CREATE TABLE IF NOT EXISTS organization_members_backup_v3 AS
SELECT * FROM organization_members;

-- ============================================================================
-- STEP 3: ALTER ORGANIZATION MEMBERS TABLE
-- ============================================================================

-- Add new columns if they don't exist
ALTER TABLE organization_members
    ADD COLUMN IF NOT EXISTS role_enum user_role,
    ADD COLUMN IF NOT EXISTS is_owner BOOLEAN DEFAULT false;

-- Update the new role_enum column based on existing role text column
UPDATE organization_members
SET role_enum = CASE
    WHEN role = 'account_owner' THEN 'account_owner'::user_role
    WHEN role = 'admin' THEN 'account_owner'::user_role
    WHEN role = 'sustainability_manager' THEN 'sustainability_manager'::user_role
    WHEN role = 'facility_manager' THEN 'facility_manager'::user_role
    WHEN role = 'analyst' THEN 'analyst'::user_role
    WHEN role = 'viewer' THEN 'viewer'::user_role
    WHEN role = 'owner' THEN 'account_owner'::user_role
    WHEN role = 'manager' THEN 'sustainability_manager'::user_role
    WHEN role = 'member' THEN 'analyst'::user_role
    ELSE 'viewer'::user_role
END;

-- Update is_owner flag
UPDATE organization_members
SET is_owner = (role IN ('account_owner', 'owner', 'admin'));

-- Now we need to handle the fact that the role column exists but is TEXT
-- Drop the old role column and rename the new one
ALTER TABLE organization_members DROP COLUMN IF EXISTS role;
ALTER TABLE organization_members RENAME COLUMN role_enum TO role;

-- Make role NOT NULL
ALTER TABLE organization_members ALTER COLUMN role SET NOT NULL;
ALTER TABLE organization_members ALTER COLUMN role SET DEFAULT 'viewer'::user_role;

-- Also migrate from user_access table if it has organization data
INSERT INTO organization_members (
    organization_id,
    user_id,
    role,
    is_owner,
    invitation_status,
    created_at
)
SELECT
    resource_id as organization_id,
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
    is_owner = EXCLUDED.is_owner;

-- Also migrate from user_access_backup if it exists
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
        WHEN role = 'sustainability_manager' THEN 'sustainability_manager'::user_role
        WHEN role = 'facility_manager' THEN 'facility_manager'::user_role
        WHEN role = 'analyst' THEN 'analyst'::user_role
        ELSE 'viewer'::user_role
    END,
    role IN ('account_owner', 'admin'),
    'accepted',
    created_at
FROM user_access_backup
ON CONFLICT (organization_id, user_id) DO UPDATE SET
    role = EXCLUDED.role,
    is_owner = EXCLUDED.is_owner;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_status ON organization_members(invitation_status);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON organization_members(role);

-- ============================================================================
-- STEP 4: CREATE AUTH AUDIT LOG TABLE
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
-- STEP 5: ENSURE SUPER ADMINS TABLE HAS CORRECT STRUCTURE
-- ============================================================================

-- Add missing columns to super_admins if needed
ALTER TABLE super_admins
    ADD COLUMN IF NOT EXISTS granted_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS granted_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS reason TEXT;

-- ============================================================================
-- STEP 6: UPDATE USER PROFILES TABLE
-- ============================================================================

-- The user_profiles table already exists with the right structure
-- Just ensure we have the required columns
ALTER TABLE user_profiles
    ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS onboarding_data JSONB DEFAULT '{}';

-- ============================================================================
-- STEP 7: CREATE PROFILE CREATION TRIGGER
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
-- STEP 8: ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Organization members can view other members" ON user_profiles;
DROP POLICY IF EXISTS "Organization members can view team profiles" ON user_profiles;

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
DROP POLICY IF EXISTS "Users can view own memberships" ON organization_members;
DROP POLICY IF EXISTS "Organization members can view team" ON organization_members;
DROP POLICY IF EXISTS "Account owners can manage members" ON organization_members;

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
-- STEP 9: CREATE HELPER FUNCTIONS
-- ============================================================================

-- Drop existing functions if they exist
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
-- STEP 10: CREATE RPC FUNCTIONS FOR AUTH OPERATIONS
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
-- STEP 11: ADD PEDRO AS SUPER ADMIN
-- ============================================================================

DO $$
DECLARE
    v_user_id UUID := 'd5708d9c-34fb-4c85-90ec-34faad9e2896';
    v_plmj_id UUID;
BEGIN
    -- Add as super admin
    INSERT INTO super_admins (user_id, reason)
    VALUES (v_user_id, 'Platform founder')
    ON CONFLICT (user_id) DO UPDATE SET
        reason = 'Platform founder';

    -- Find PLMJ organization
    SELECT id INTO v_plmj_id
    FROM organizations
    WHERE name LIKE '%PLMJ%'
    LIMIT 1;

    -- Ensure pedro has account_owner role in PLMJ organization
    IF v_plmj_id IS NOT NULL THEN
        INSERT INTO organization_members (
            organization_id,
            user_id,
            role,
            is_owner,
            invitation_status,
            joined_at
        )
        VALUES (
            v_plmj_id,
            v_user_id,
            'account_owner',
            TRUE,
            'accepted',
            NOW()
        )
        ON CONFLICT (organization_id, user_id) DO UPDATE SET
            role = 'account_owner'::user_role,
            is_owner = TRUE,
            invitation_status = 'accepted';
    END IF;

    RAISE NOTICE 'Added pedro@blipee.com as super admin and PLMJ owner';
END $$;

-- ============================================================================
-- STEP 12: CLEANUP OLD TABLES
-- ============================================================================

-- These can be dropped after verifying the migration worked
-- DROP TABLE IF EXISTS user_access CASCADE;
-- DROP TABLE IF EXISTS user_access_backup CASCADE;
-- DROP TABLE IF EXISTS groups CASCADE;

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

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
DROP TRIGGER IF EXISTS update_organization_members_updated_at ON organization_members;

-- Create triggers
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_organization_members_updated_at
    BEFORE UPDATE ON organization_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Commit transaction
COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (Run these separately to verify migration success)
-- ============================================================================

-- Check the new role enum column
SELECT
    role,
    is_owner,
    COUNT(*) as count
FROM organization_members
GROUP BY role, is_owner
ORDER BY role;

-- Check pedro's status
SELECT
    up.email,
    om.role,
    om.is_owner,
    o.name as organization,
    sa.user_id IS NOT NULL as is_super_admin
FROM user_profiles up
LEFT JOIN organization_members om ON om.user_id = up.id
LEFT JOIN organizations o ON o.id = om.organization_id
LEFT JOIN super_admins sa ON sa.user_id = up.id
WHERE up.email = 'pedro@blipee.com';

-- Check audit log creation
SELECT COUNT(*) as audit_entries FROM auth_audit_log;