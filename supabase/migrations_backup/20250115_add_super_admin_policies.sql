-- ============================================================================
-- ADD SUPER ADMIN BYPASS POLICIES
-- Version: 1.0.0
-- Date: 2025-01-15
-- Description: Add RLS policies to allow super admins to bypass all restrictions
-- Note: Pedro is already in super_admins table and is_super_admin() function exists
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: VERIFY SUPER ADMIN SETUP
-- ============================================================================

-- Verify is_super_admin function works
DO $$
BEGIN
    IF NOT is_super_admin('d5708d9c-34fb-4c85-90ec-34faad9e2896'::uuid) THEN
        RAISE WARNING 'Pedro is not showing as super admin - check super_admins table';
    ELSE
        RAISE NOTICE 'Super admin function confirmed working for Pedro';
    END IF;
END $$;

-- ============================================================================
-- STEP 2: DROP EXISTING SUPER ADMIN POLICIES (CLEAN SLATE)
-- ============================================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop any existing super admin policies
    FOR r IN (
        SELECT tablename, policyname
        FROM pg_policies
        WHERE policyname LIKE '%super%admin%'
    )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
        RAISE NOTICE 'Dropped policy % on table %', r.policyname, r.tablename;
    END LOOP;
END $$;

-- ============================================================================
-- STEP 3: ADD SUPER ADMIN BYPASS POLICIES TO ALL TABLES
-- ============================================================================

-- Organizations
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
        CREATE POLICY "super_admin_bypass_all"
            ON organizations
            FOR ALL
            USING (is_super_admin())
            WITH CHECK (is_super_admin());
        RAISE NOTICE 'Added super admin policy to organizations';
    END IF;
END $$;

-- Organization Members
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organization_members') THEN
        CREATE POLICY "super_admin_bypass_all"
            ON organization_members
            FOR ALL
            USING (is_super_admin())
            WITH CHECK (is_super_admin());
        RAISE NOTICE 'Added super admin policy to organization_members';
    END IF;
END $$;

-- User Profiles
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        CREATE POLICY "super_admin_bypass_all"
            ON user_profiles
            FOR ALL
            USING (is_super_admin())
            WITH CHECK (is_super_admin());
        RAISE NOTICE 'Added super admin policy to user_profiles';
    END IF;
END $$;

-- Buildings
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'buildings') THEN
        CREATE POLICY "super_admin_bypass_all"
            ON buildings
            FOR ALL
            USING (is_super_admin())
            WITH CHECK (is_super_admin());
        RAISE NOTICE 'Added super admin policy to buildings';
    END IF;
END $$;

-- Emissions Data
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'emissions_data') THEN
        CREATE POLICY "super_admin_bypass_all"
            ON emissions_data
            FOR ALL
            USING (is_super_admin())
            WITH CHECK (is_super_admin());
        RAISE NOTICE 'Added super admin policy to emissions_data';
    END IF;
END $$;

-- Conversations
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversations') THEN
        CREATE POLICY "super_admin_bypass_all"
            ON conversations
            FOR ALL
            USING (is_super_admin())
            WITH CHECK (is_super_admin());
        RAISE NOTICE 'Added super admin policy to conversations';
    END IF;
END $$;

-- Messages
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
        CREATE POLICY "super_admin_bypass_all"
            ON messages
            FOR ALL
            USING (is_super_admin())
            WITH CHECK (is_super_admin());
        RAISE NOTICE 'Added super admin policy to messages';
    END IF;
END $$;

-- Building Metrics
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'building_metrics') THEN
        CREATE POLICY "super_admin_bypass_all"
            ON building_metrics
            FOR ALL
            USING (is_super_admin())
            WITH CHECK (is_super_admin());
        RAISE NOTICE 'Added super admin policy to building_metrics';
    END IF;
END $$;

-- Sustainability Goals
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sustainability_goals') THEN
        CREATE POLICY "super_admin_bypass_all"
            ON sustainability_goals
            FOR ALL
            USING (is_super_admin())
            WITH CHECK (is_super_admin());
        RAISE NOTICE 'Added super admin policy to sustainability_goals';
    END IF;
END $$;

-- AI Contexts
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_contexts') THEN
        CREATE POLICY "super_admin_bypass_all"
            ON ai_contexts
            FOR ALL
            USING (is_super_admin())
            WITH CHECK (is_super_admin());
        RAISE NOTICE 'Added super admin policy to ai_contexts';
    END IF;
END $$;

-- ============================================================================
-- STEP 4: ADD SUPER ADMIN POLICIES TO SUPER_ADMINS TABLE ITSELF
-- ============================================================================

-- Ensure super admins can manage the super_admins table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'super_admins') THEN
        -- Drop existing policies on super_admins
        DROP POLICY IF EXISTS "super_admin_view" ON super_admins;
        DROP POLICY IF EXISTS "super_admin_manage" ON super_admins;

        -- Create new policies
        CREATE POLICY "super_admin_view"
            ON super_admins
            FOR SELECT
            USING (is_super_admin());

        CREATE POLICY "super_admin_manage"
            ON super_admins
            FOR ALL
            USING (is_super_admin())
            WITH CHECK (is_super_admin());

        RAISE NOTICE 'Added super admin policies to super_admins table';
    END IF;
END $$;

-- ============================================================================
-- STEP 5: CREATE HELPER FUNCTIONS FOR SUPER ADMIN MANAGEMENT
-- ============================================================================

-- Function to list all super admins with user details
CREATE OR REPLACE FUNCTION list_super_admins()
RETURNS TABLE(
    admin_id UUID,
    user_id UUID,
    email TEXT,
    full_name TEXT,
    created_at TIMESTAMPTZ,
    granted_at TIMESTAMPTZ,
    reason TEXT
) AS $$
BEGIN
    -- Only super admins can list super admins
    IF NOT is_super_admin() THEN
        RAISE EXCEPTION 'Access denied: Super admin privileges required';
    END IF;

    RETURN QUERY
    SELECT
        sa.id as admin_id,
        sa.user_id,
        up.email,
        up.full_name,
        sa.created_at,
        sa.granted_at,
        sa.reason
    FROM super_admins sa
    LEFT JOIN user_profiles up ON sa.user_id = up.id
    ORDER BY sa.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to grant super admin to a user
CREATE OR REPLACE FUNCTION grant_super_admin(
    target_user_id UUID,
    grant_reason TEXT DEFAULT 'Granted super admin access'
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Only super admins can grant super admin
    IF NOT is_super_admin() THEN
        RAISE EXCEPTION 'Access denied: Super admin privileges required';
    END IF;

    -- Check if already super admin
    IF EXISTS (SELECT 1 FROM super_admins WHERE user_id = target_user_id) THEN
        RAISE NOTICE 'User is already a super admin';
        RETURN false;
    END IF;

    -- Add to super_admins table
    INSERT INTO super_admins (user_id, granted_by, granted_at, reason)
    VALUES (target_user_id, auth.uid(), NOW(), grant_reason);

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to revoke super admin from a user
CREATE OR REPLACE FUNCTION revoke_super_admin(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    admin_count INTEGER;
BEGIN
    -- Only super admins can revoke super admin
    IF NOT is_super_admin() THEN
        RAISE EXCEPTION 'Access denied: Super admin privileges required';
    END IF;

    -- Prevent removing the last super admin
    SELECT COUNT(*) INTO admin_count FROM super_admins;
    IF admin_count <= 1 THEN
        RAISE EXCEPTION 'Cannot remove the last super admin';
    END IF;

    -- Prevent self-revocation if last admin
    IF target_user_id = auth.uid() AND admin_count <= 1 THEN
        RAISE EXCEPTION 'Cannot revoke your own super admin status when you are the last admin';
    END IF;

    -- Remove from super_admins table
    DELETE FROM super_admins WHERE user_id = target_user_id;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION list_super_admins() TO authenticated;
GRANT EXECUTE ON FUNCTION grant_super_admin(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION revoke_super_admin(UUID) TO authenticated;

-- ============================================================================
-- STEP 6: FINAL VERIFICATION
-- ============================================================================

-- Test that Pedro has super admin access
DO $$
DECLARE
    v_is_admin BOOLEAN;
BEGIN
    SELECT is_super_admin('d5708d9c-34fb-4c85-90ec-34faad9e2896'::uuid) INTO v_is_admin;

    IF v_is_admin THEN
        RAISE NOTICE '✅ SUCCESS: Pedro (pedro@blipee.com) has full super admin access';
        RAISE NOTICE '✅ Super admin can now bypass all RLS policies';
        RAISE NOTICE '✅ Management functions created: list_super_admins(), grant_super_admin(), revoke_super_admin()';
    ELSE
        RAISE WARNING '⚠️ WARNING: Pedro does not have super admin access - check super_admins table';
    END IF;
END $$;

COMMIT;

-- ============================================================================
-- POST-MIGRATION SUMMARY
-- ============================================================================
-- After this migration:
-- 1. Super admins can bypass all RLS policies on all tables
-- 2. Pedro (pedro@blipee.com) has full system access
-- 3. Helper functions available for super admin management
-- 4. All existing super admin policies have been replaced with consistent ones
-- ============================================================================