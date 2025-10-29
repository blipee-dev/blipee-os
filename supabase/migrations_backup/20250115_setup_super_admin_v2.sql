-- ============================================================================
-- SUPER ADMIN SETUP MIGRATION V2
-- Version: 2.0.0
-- Date: 2025-01-15
-- Description: Set up super_admin privileges using super_admins table
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: ENSURE SUPER_ADMINS TABLE EXISTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS super_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    notes TEXT
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_super_admins_user_id ON super_admins(user_id);

-- ============================================================================
-- STEP 2: ADD PEDRO AS SUPER ADMIN
-- ============================================================================

-- Insert pedro@blipee.com as super_admin (ignore if already exists)
INSERT INTO super_admins (user_id, notes)
VALUES ('d5708d9c-34fb-4c85-90ec-34faad9e2896', 'Initial super admin - pedro@blipee.com')
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- STEP 3: CREATE SUPER ADMIN CHECK FUNCTION
-- ============================================================================

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS is_super_admin() CASCADE;
DROP FUNCTION IF EXISTS is_super_admin(UUID) CASCADE;

-- Create is_super_admin function that checks the super_admins table
CREATE OR REPLACE FUNCTION is_super_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if the user exists in super_admins table
    RETURN EXISTS (
        SELECT 1
        FROM super_admins
        WHERE user_id = check_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_super_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_super_admin() TO authenticated;

-- ============================================================================
-- STEP 4: CREATE RLS POLICIES FOR SUPER_ADMINS TABLE
-- ============================================================================

-- Enable RLS on super_admins table
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;

-- Only super admins can view the super_admins table
CREATE POLICY "Only super admins can view super_admins"
    ON super_admins FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM super_admins sa
            WHERE sa.user_id = auth.uid()
        )
    );

-- Only super admins can manage super_admins
CREATE POLICY "Only super admins can manage super_admins"
    ON super_admins FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM super_admins sa
            WHERE sa.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM super_admins sa
            WHERE sa.user_id = auth.uid()
        )
    );

-- ============================================================================
-- STEP 5: DROP AND RECREATE RLS POLICIES FOR OTHER TABLES
-- ============================================================================

-- Drop existing super admin policies safely
DO $$
BEGIN
    -- Drop policies only if tables exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
        DROP POLICY IF EXISTS "Super admins have full access to organizations" ON organizations;
        DROP POLICY IF EXISTS "Super admins can view all organizations" ON organizations;
        DROP POLICY IF EXISTS "Super admins can manage all organizations" ON organizations;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organization_members') THEN
        DROP POLICY IF EXISTS "Super admins have full access to organization_members" ON organization_members;
        DROP POLICY IF EXISTS "Super admins can view all memberships" ON organization_members;
        DROP POLICY IF EXISTS "Super admins can manage all memberships" ON organization_members;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        DROP POLICY IF EXISTS "Super admins have full access to user_profiles" ON user_profiles;
        DROP POLICY IF EXISTS "Super admins can view all profiles" ON user_profiles;
        DROP POLICY IF EXISTS "Super admins can manage all profiles" ON user_profiles;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'buildings') THEN
        DROP POLICY IF EXISTS "Super admins have full access to buildings" ON buildings;
        DROP POLICY IF EXISTS "Super admins can manage all buildings" ON buildings;
    END IF;
END $$;

-- ============================================================================
-- STEP 6: CREATE NEW RLS POLICIES USING SUPER_ADMINS TABLE
-- ============================================================================

-- Create policies for organizations
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
        -- Super admins can do everything with organizations
        EXECUTE 'CREATE POLICY "Super admins bypass - organizations"
            ON organizations FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM super_admins
                    WHERE user_id = auth.uid()
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM super_admins
                    WHERE user_id = auth.uid()
                )
            )';
    END IF;
END $$;

-- Create policies for organization_members
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organization_members') THEN
        -- Super admins can do everything with organization members
        EXECUTE 'CREATE POLICY "Super admins bypass - organization_members"
            ON organization_members FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM super_admins
                    WHERE user_id = auth.uid()
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM super_admins
                    WHERE user_id = auth.uid()
                )
            )';
    END IF;
END $$;

-- Create policies for user_profiles
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        -- Super admins can do everything with user profiles
        EXECUTE 'CREATE POLICY "Super admins bypass - user_profiles"
            ON user_profiles FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM super_admins
                    WHERE user_id = auth.uid()
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM super_admins
                    WHERE user_id = auth.uid()
                )
            )';
    END IF;
END $$;

-- Create policies for buildings
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'buildings') THEN
        -- Super admins can do everything with buildings
        EXECUTE 'CREATE POLICY "Super admins bypass - buildings"
            ON buildings FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM super_admins
                    WHERE user_id = auth.uid()
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM super_admins
                    WHERE user_id = auth.uid()
                )
            )';
    END IF;
END $$;

-- ============================================================================
-- STEP 7: CREATE HELPER FUNCTIONS FOR SUPER ADMIN
-- ============================================================================

-- Function to list all super admins
CREATE OR REPLACE FUNCTION get_all_super_admins()
RETURNS TABLE(
    user_id UUID,
    email TEXT,
    full_name TEXT,
    created_at TIMESTAMPTZ,
    notes TEXT
) AS $$
BEGIN
    -- Only super admins can list super admins
    IF NOT EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()) THEN
        RAISE EXCEPTION 'Access denied: Super admin privileges required';
    END IF;

    RETURN QUERY
    SELECT
        sa.user_id,
        up.email,
        up.full_name,
        sa.created_at,
        sa.notes
    FROM super_admins sa
    LEFT JOIN user_profiles up ON sa.user_id = up.id
    ORDER BY sa.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add a new super admin
CREATE OR REPLACE FUNCTION add_super_admin(
    new_user_id UUID,
    admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Only super admins can add super admins
    IF NOT EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()) THEN
        RAISE EXCEPTION 'Access denied: Super admin privileges required';
    END IF;

    INSERT INTO super_admins (user_id, created_by, notes)
    VALUES (new_user_id, auth.uid(), admin_notes)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove a super admin
CREATE OR REPLACE FUNCTION remove_super_admin(
    remove_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    super_admin_count INTEGER;
BEGIN
    -- Only super admins can remove super admins
    IF NOT EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()) THEN
        RAISE EXCEPTION 'Access denied: Super admin privileges required';
    END IF;

    -- Prevent removing the last super admin
    SELECT COUNT(*) INTO super_admin_count FROM super_admins;
    IF super_admin_count <= 1 THEN
        RAISE EXCEPTION 'Cannot remove the last super admin';
    END IF;

    DELETE FROM super_admins WHERE user_id = remove_user_id;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions on functions
GRANT EXECUTE ON FUNCTION get_all_super_admins() TO authenticated;
GRANT EXECUTE ON FUNCTION add_super_admin(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_super_admin(UUID) TO authenticated;

-- ============================================================================
-- STEP 8: CREATE SUPER ADMIN AUDIT LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS super_admin_audit_log (
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_super_admin_audit_admin_id ON super_admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_super_admin_audit_created_at ON super_admin_audit_log(created_at DESC);

-- Enable RLS
ALTER TABLE super_admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only super admins can view audit log
CREATE POLICY "Only super admins can view audit log"
    ON super_admin_audit_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM super_admins
            WHERE user_id = auth.uid()
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
BEGIN
    -- Only super admins can log actions
    IF NOT EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()) THEN
        RAISE EXCEPTION 'Access denied: Super admin privileges required';
    END IF;

    INSERT INTO super_admin_audit_log (
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
-- STEP 9: VERIFICATION
-- ============================================================================

-- Verify pedro@blipee.com is set as super_admin
DO $$
DECLARE
    v_is_super_admin BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM super_admins
        WHERE user_id = 'd5708d9c-34fb-4c85-90ec-34faad9e2896'
    ) INTO v_is_super_admin;

    IF v_is_super_admin IS TRUE THEN
        RAISE NOTICE '✅ Super admin setup successful for pedro@blipee.com';
    ELSE
        RAISE WARNING '⚠️ Super admin setup may have failed for pedro@blipee.com';
    END IF;
END $$;

-- Test the function
SELECT
    'pedro@blipee.com is super admin:' as message,
    is_super_admin('d5708d9c-34fb-4c85-90ec-34faad9e2896'::uuid) as result;

COMMIT;

-- ============================================================================
-- POST-MIGRATION NOTES
-- ============================================================================
-- After running this migration:
-- 1. pedro@blipee.com will be in the super_admins table
-- 2. Super admins can bypass all RLS policies
-- 3. Super admin actions are logged for audit purposes
-- 4. Functions available:
--    - is_super_admin() - Check if current user is super admin
--    - get_all_super_admins() - List all super admins
--    - add_super_admin() - Add a new super admin
--    - remove_super_admin() - Remove a super admin
--    - log_super_admin_action() - Log admin actions
-- ============================================================================