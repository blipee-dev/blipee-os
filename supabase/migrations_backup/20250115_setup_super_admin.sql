-- ============================================================================
-- SUPER ADMIN SETUP MIGRATION
-- Version: 1.0.0
-- Date: 2025-01-15
-- Description: Set up super_admin privileges for pedro@blipee.com
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: ADD SUPER ADMIN COLUMN
-- ============================================================================

-- Add is_super_admin column to user_profiles if it doesn't exist
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

-- ============================================================================
-- STEP 2: SET PEDRO AS SUPER ADMIN
-- ============================================================================

-- Update pedro@blipee.com to be super_admin
UPDATE user_profiles
SET is_super_admin = true
WHERE id = 'd5708d9c-34fb-4c85-90ec-34faad9e2896';

-- ============================================================================
-- STEP 3: CREATE SUPER ADMIN FUNCTION
-- ============================================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS is_super_admin() CASCADE;
DROP FUNCTION IF EXISTS is_super_admin(UUID) CASCADE;

-- Create is_super_admin function
CREATE OR REPLACE FUNCTION is_super_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if the user is a super admin
    RETURN EXISTS (
        SELECT 1
        FROM user_profiles
        WHERE id = user_id
        AND is_super_admin = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_super_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_super_admin() TO authenticated;

-- ============================================================================
-- STEP 4: CREATE SUPER ADMIN RLS POLICIES
-- ============================================================================

-- Drop existing super admin policies if they exist (safely handle if tables don't exist)
DO $$
BEGIN
    -- Drop policies only if the tables exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
        DROP POLICY IF EXISTS "Super admins have full access to organizations" ON organizations;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organization_members') THEN
        DROP POLICY IF EXISTS "Super admins have full access to organization_members" ON organization_members;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        DROP POLICY IF EXISTS "Super admins have full access to user_profiles" ON user_profiles;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'buildings') THEN
        DROP POLICY IF EXISTS "Super admins have full access to buildings" ON buildings;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sustainability_goals') THEN
        DROP POLICY IF EXISTS "Super admins have full access to sustainability_goals" ON sustainability_goals;
    END IF;
END $$;

-- Only create policies for tables that exist
-- Use direct column check to avoid function dependency issues
DO $$
BEGIN
    -- Organizations policy
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
        EXECUTE 'CREATE POLICY "Super admins have full access to organizations"
            ON organizations FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM user_profiles
                    WHERE id = auth.uid()
                    AND is_super_admin = true
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM user_profiles
                    WHERE id = auth.uid()
                    AND is_super_admin = true
                )
            )';
    END IF;

    -- Organization Members policy
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organization_members') THEN
        EXECUTE 'CREATE POLICY "Super admins have full access to organization_members"
            ON organization_members FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM user_profiles
                    WHERE id = auth.uid()
                    AND is_super_admin = true
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM user_profiles
                    WHERE id = auth.uid()
                    AND is_super_admin = true
                )
            )';
    END IF;

    -- User Profiles policy
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        EXECUTE 'CREATE POLICY "Super admins have full access to user_profiles"
            ON user_profiles FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM user_profiles up
                    WHERE up.id = auth.uid()
                    AND up.is_super_admin = true
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM user_profiles up
                    WHERE up.id = auth.uid()
                    AND up.is_super_admin = true
                )
            )';
    END IF;

    -- Buildings policy
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'buildings') THEN
        EXECUTE 'CREATE POLICY "Super admins have full access to buildings"
            ON buildings FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM user_profiles
                    WHERE id = auth.uid()
                    AND is_super_admin = true
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM user_profiles
                    WHERE id = auth.uid()
                    AND is_super_admin = true
                )
            )';
    END IF;

    -- Sustainability Goals policy
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sustainability_goals') THEN
        EXECUTE 'CREATE POLICY "Super admins have full access to sustainability_goals"
            ON sustainability_goals FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM user_profiles
                    WHERE id = auth.uid()
                    AND is_super_admin = true
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM user_profiles
                    WHERE id = auth.uid()
                    AND is_super_admin = true
                )
            )';
    END IF;
END $$;

-- ============================================================================
-- STEP 5: CREATE HELPER FUNCTIONS FOR SUPER ADMIN
-- ============================================================================

-- Function to get all organizations (for super admin dashboard)
CREATE OR REPLACE FUNCTION get_all_organizations_for_super_admin()
RETURNS TABLE(
    id UUID,
    name TEXT,
    slug TEXT,
    created_at TIMESTAMPTZ,
    member_count BIGINT,
    building_count BIGINT
) AS $$
DECLARE
    is_admin BOOLEAN;
BEGIN
    -- Check if the current user is a super admin
    SELECT COALESCE(
        (SELECT is_super_admin
         FROM user_profiles
         WHERE user_profiles.id = auth.uid()),
        false
    ) INTO is_admin;

    -- Only super admins can use this function
    IF NOT is_admin THEN
        RAISE EXCEPTION 'Access denied: Super admin privileges required';
    END IF;

    -- Check if required tables exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
        RAISE EXCEPTION 'Table organizations does not exist';
    END IF;

    RETURN QUERY
    SELECT
        o.id,
        o.name,
        o.slug,
        o.created_at,
        COUNT(DISTINCT om.user_id) as member_count,
        COUNT(DISTINCT b.id) as building_count
    FROM organizations o
    LEFT JOIN organization_members om ON o.id = om.organization_id
    LEFT JOIN buildings b ON o.id = b.organization_id
    GROUP BY o.id, o.name, o.slug, o.created_at
    ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_all_organizations_for_super_admin() TO authenticated;

-- ============================================================================
-- STEP 6: ADD SUPER ADMIN AUDIT LOGGING
-- ============================================================================

-- Create super admin actions audit table
CREATE TABLE IF NOT EXISTS super_admin_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES auth.users(id) NOT NULL,
    action_type TEXT NOT NULL,
    target_type TEXT,
    target_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_super_admin_actions_admin_id ON super_admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_super_admin_actions_created_at ON super_admin_actions(created_at DESC);

-- RLS for super admin actions (only super admins can view)
ALTER TABLE super_admin_actions ENABLE ROW LEVEL SECURITY;

-- Create policy using direct check instead of function (function might not exist yet in this transaction)
CREATE POLICY "Only super admins can view super admin actions"
    ON super_admin_actions FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM user_profiles
            WHERE id = auth.uid()
            AND is_super_admin = true
        )
    );

-- Function to log super admin actions
CREATE OR REPLACE FUNCTION log_super_admin_action(
    action_type TEXT,
    target_type TEXT DEFAULT NULL,
    target_id UUID DEFAULT NULL,
    details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    action_id UUID;
    is_admin BOOLEAN;
BEGIN
    -- Check if the current user is a super admin
    SELECT COALESCE(
        (SELECT is_super_admin
         FROM user_profiles
         WHERE user_profiles.id = auth.uid()),
        false
    ) INTO is_admin;

    -- Only super admins can log actions
    IF NOT is_admin THEN
        RAISE EXCEPTION 'Access denied: Super admin privileges required';
    END IF;

    INSERT INTO super_admin_actions (
        admin_id,
        action_type,
        target_type,
        target_id,
        details
    ) VALUES (
        auth.uid(),
        action_type,
        target_type,
        target_id,
        details
    ) RETURNING id INTO action_id;

    RETURN action_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION log_super_admin_action(TEXT, TEXT, UUID, JSONB) TO authenticated;

-- ============================================================================
-- STEP 7: VERIFICATION
-- ============================================================================

-- Verify pedro@blipee.com is set as super_admin
DO $$
DECLARE
    v_is_super_admin BOOLEAN;
BEGIN
    SELECT is_super_admin INTO v_is_super_admin
    FROM user_profiles
    WHERE id = 'd5708d9c-34fb-4c85-90ec-34faad9e2896';

    IF v_is_super_admin IS TRUE THEN
        RAISE NOTICE '✅ Super admin setup successful for pedro@blipee.com';
    ELSE
        RAISE WARNING '⚠️ Super admin setup may have failed for pedro@blipee.com';
    END IF;
END $$;

COMMIT;

-- ============================================================================
-- POST-MIGRATION NOTES
-- ============================================================================
-- After running this migration:
-- 1. pedro@blipee.com will have super_admin privileges
-- 2. Super admin can bypass all RLS policies
-- 3. Super admin actions are logged for audit purposes
-- 4. Special functions are available for super admin operations
-- ============================================================================