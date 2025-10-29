-- Align roles in app_users table to Simple RBAC system
-- Map legacy role names to the 4 Simple RBAC roles: owner, manager, member, viewer

-- Update existing roles in app_users to use Simple RBAC role names
UPDATE app_users
SET role = CASE
    WHEN role = 'account_owner' THEN 'owner'
    WHEN role = 'sustainability_manager' THEN 'manager'
    WHEN role = 'facility_manager' THEN 'member'
    WHEN role = 'analyst' THEN 'member'
    WHEN role = 'viewer' THEN 'viewer'
    WHEN role = 'stakeholder' THEN 'viewer'
    -- Super admin is NOT a role - it's tracked in super_admins table
    -- Users who had super_admin role get owner role for their org
    WHEN role = 'super_admin' THEN 'owner'
    -- Map any user role to member
    WHEN role = 'user' THEN 'member'
    -- Default any unknown roles to viewer
    ELSE 'viewer'
END
WHERE role NOT IN ('owner', 'manager', 'member', 'viewer');

-- Add check constraint to ensure only valid roles
ALTER TABLE app_users DROP CONSTRAINT IF EXISTS app_users_role_check;
ALTER TABLE app_users ADD CONSTRAINT app_users_role_check
    CHECK (role IN ('owner', 'manager', 'member', 'viewer'));

-- Note: Super admin access is handled via the super_admins table
-- Users who need platform-level access should be added to super_admins table separately
-- The app_users.role field only determines organization-level permissions

-- Update any user_access records to use Simple RBAC roles
UPDATE user_access
SET role = CASE
    WHEN role = 'account_owner' THEN 'owner'
    WHEN role = 'sustainability_manager' THEN 'manager'
    WHEN role = 'facility_manager' THEN 'member'
    WHEN role = 'analyst' THEN 'member'
    WHEN role = 'viewer' THEN 'viewer'
    WHEN role = 'stakeholder' THEN 'viewer'
    ELSE 'viewer'
END
WHERE role NOT IN ('owner', 'manager', 'member', 'viewer');

-- Log the changes
DO $$
DECLARE
    role_count RECORD;
BEGIN
    RAISE NOTICE 'Role distribution after migration:';
    FOR role_count IN
        SELECT role, COUNT(*) as count
        FROM app_users
        GROUP BY role
        ORDER BY role
    LOOP
        RAISE NOTICE '  %: % users', role_count.role, role_count.count;
    END LOOP;
END $$;