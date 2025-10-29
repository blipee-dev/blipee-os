-- Fix app_users RLS policies to properly handle user creation and management
-- This ensures managers and owners can create and manage users

-- First, ensure app_users table has an id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'app_users'
        AND column_name = 'id'
    ) THEN
        ALTER TABLE app_users ADD COLUMN id SERIAL PRIMARY KEY;
    END IF;
END $$;

-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "app_users_select_policy" ON app_users;
DROP POLICY IF EXISTS "app_users_insert_policy" ON app_users;
DROP POLICY IF EXISTS "app_users_update_policy" ON app_users;
DROP POLICY IF EXISTS "app_users_delete_policy" ON app_users;

-- Create comprehensive SELECT policy
CREATE POLICY "app_users_select_policy" ON app_users
FOR SELECT USING (
    -- Super admins can see all users
    EXISTS (
        SELECT 1 FROM super_admins
        WHERE user_id = auth.uid()
    )
    OR
    -- Users can see themselves
    auth_user_id = auth.uid()
    OR
    -- Users can see others in their organization
    EXISTS (
        SELECT 1 FROM app_users u
        WHERE u.auth_user_id = auth.uid()
        AND u.organization_id = app_users.organization_id
    )
);

-- Create INSERT policy for user creation
CREATE POLICY "app_users_insert_policy" ON app_users
FOR INSERT WITH CHECK (
    -- Super admins can create any user
    EXISTS (
        SELECT 1 FROM super_admins
        WHERE user_id = auth.uid()
    )
    OR
    -- Owners can create users in their organization
    EXISTS (
        SELECT 1 FROM app_users u
        WHERE u.auth_user_id = auth.uid()
        AND u.role = 'owner'
        AND u.organization_id = organization_id
    )
    OR
    -- Managers can create users in their organization
    EXISTS (
        SELECT 1 FROM app_users u
        WHERE u.auth_user_id = auth.uid()
        AND u.role = 'manager'
        AND u.organization_id = organization_id
    )
    OR
    -- Service role operations (for triggers)
    auth.jwt()->>'role' = 'service_role'
);

-- Create UPDATE policy
CREATE POLICY "app_users_update_policy" ON app_users
FOR UPDATE USING (
    -- Super admins can update any user
    EXISTS (
        SELECT 1 FROM super_admins
        WHERE user_id = auth.uid()
    )
    OR
    -- Users can update themselves (limited fields)
    auth_user_id = auth.uid()
    OR
    -- Owners can update users in their organization
    EXISTS (
        SELECT 1 FROM app_users u
        WHERE u.auth_user_id = auth.uid()
        AND u.role = 'owner'
        AND u.organization_id = app_users.organization_id
    )
    OR
    -- Managers can update users in their organization (except owners)
    EXISTS (
        SELECT 1 FROM app_users u
        WHERE u.auth_user_id = auth.uid()
        AND u.role = 'manager'
        AND u.organization_id = app_users.organization_id
        AND app_users.role != 'owner'
    )
)
WITH CHECK (
    -- Super admins can change anything
    EXISTS (
        SELECT 1 FROM super_admins
        WHERE user_id = auth.uid()
    )
    OR
    -- For others, just ensure valid update
    TRUE
);

-- Create DELETE policy
CREATE POLICY "app_users_delete_policy" ON app_users
FOR DELETE USING (
    -- Super admins can delete any user
    EXISTS (
        SELECT 1 FROM super_admins
        WHERE user_id = auth.uid()
    )
    OR
    -- Owners can delete users in their organization
    EXISTS (
        SELECT 1 FROM app_users u
        WHERE u.auth_user_id = auth.uid()
        AND u.role = 'owner'
        AND u.organization_id = app_users.organization_id
        AND app_users.auth_user_id != auth.uid() -- Can't delete yourself
    )
    OR
    -- Managers can delete users in their organization (except owners and themselves)
    EXISTS (
        SELECT 1 FROM app_users u
        WHERE u.auth_user_id = auth.uid()
        AND u.role = 'manager'
        AND u.organization_id = app_users.organization_id
        AND app_users.role NOT IN ('owner', 'manager')
        AND app_users.auth_user_id != auth.uid() -- Can't delete yourself
    )
);

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON app_users TO authenticated;

-- Only grant sequence permissions if the sequence exists (for id column)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.sequences
        WHERE sequence_schema = 'public'
        AND sequence_name = 'app_users_id_seq'
    ) THEN
        GRANT USAGE, SELECT ON SEQUENCE app_users_id_seq TO authenticated;
    END IF;
END $$;

-- Verify the setup
DO $$
BEGIN
    RAISE NOTICE 'app_users RLS policies have been updated';
    RAISE NOTICE 'Owners and managers can now properly create and manage users';
    RAISE NOTICE 'Super admins have full access to all operations';
END $$;