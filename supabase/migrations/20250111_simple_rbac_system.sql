-- =============================================
-- Simple RBAC System with Super Admin Support
-- =============================================
-- This migration implements a simple, flexible permission system
-- while maintaining the existing super_admin functionality

-- 1. Keep existing super_admins table (already exists)
-- super_admins table stays as is for platform-level access

-- 2. Transform user_organizations into flexible user_access table
-- First, rename the existing table
ALTER TABLE user_organizations RENAME TO user_access_backup;

-- 3. Create the new flexible user_access table
CREATE TABLE user_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    resource_type TEXT NOT NULL CHECK (resource_type IN ('organization', 'site', 'group')),
    resource_id UUID NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'member', 'viewer')),
    granted_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ,
    
    -- Prevent duplicate access entries
    UNIQUE(user_id, resource_type, resource_id)
);

-- Create indexes separately
CREATE INDEX idx_user_lookup ON user_access (user_id, resource_type);
CREATE INDEX idx_resource_lookup ON user_access (resource_id, resource_type);
CREATE INDEX idx_expiration ON user_access (expires_at) WHERE expires_at IS NOT NULL;

-- 4. Create groups table for multi-site access
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    site_ids UUID[] NOT NULL DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Unique group names per organization
    UNIQUE(organization_id, name)
);

-- Create index separately
CREATE INDEX idx_group_org ON groups (organization_id);

-- 5. Migrate existing data from user_organizations to user_access
INSERT INTO user_access (user_id, resource_type, resource_id, role, created_at)
SELECT 
    user_id,
    'organization' as resource_type,
    organization_id as resource_id,
    CASE 
        WHEN role = 'account_owner' THEN 'owner'
        WHEN role = 'admin' THEN 'manager'
        WHEN role = 'sustainability_manager' THEN 'manager'
        WHEN role = 'facility_manager' THEN 'member'
        WHEN role = 'analyst' THEN 'member'
        WHEN role = 'viewer' THEN 'viewer'
        ELSE 'viewer' -- Default fallback
    END as role,
    created_at
FROM user_access_backup;

-- 6. Create helper functions for permission checks
-- Drop existing view that depends on the function
DROP VIEW IF EXISTS user_access_profile CASCADE;

-- Drop existing function if it exists with different parameters
DROP FUNCTION IF EXISTS is_super_admin(UUID) CASCADE;

CREATE OR REPLACE FUNCTION is_super_admin(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM super_admins 
        WHERE user_id = check_user_id
    );
END;
$$;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_user_organizations(UUID);

CREATE OR REPLACE FUNCTION get_user_organizations(check_user_id UUID)
RETURNS TABLE(
    organization_id UUID,
    organization_name TEXT,
    role TEXT,
    access_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Super admins see all organizations
    IF is_super_admin(check_user_id) THEN
        RETURN QUERY
        SELECT 
            o.id as organization_id,
            o.name as organization_name,
            'owner'::TEXT as role,
            'super_admin'::TEXT as access_type
        FROM organizations o;
    ELSE
        -- Regular users see their assigned organizations
        RETURN QUERY
        SELECT 
            o.id as organization_id,
            o.name as organization_name,
            ua.role,
            'assigned'::TEXT as access_type
        FROM organizations o
        JOIN user_access ua ON ua.resource_id = o.id
        WHERE ua.user_id = check_user_id
            AND ua.resource_type = 'organization'
            AND (ua.expires_at IS NULL OR ua.expires_at > NOW());
    END IF;
END;
$$;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_user_sites(UUID, UUID);

CREATE OR REPLACE FUNCTION get_user_sites(check_user_id UUID, org_id UUID)
RETURNS TABLE(
    site_id UUID,
    site_name TEXT,
    role TEXT,
    access_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    -- Super admin access (all sites)
    SELECT 
        s.id as site_id,
        s.name as site_name,
        'owner'::TEXT as role,
        'super_admin'::TEXT as access_type
    FROM sites s
    WHERE s.organization_id = org_id
        AND is_super_admin(check_user_id)
    
    UNION
    
    -- Organization-level access (sees all sites in org)
    SELECT 
        s.id as site_id,
        s.name as site_name,
        ua.role,
        'organization'::TEXT as access_type
    FROM sites s
    JOIN user_access ua ON ua.resource_id = s.organization_id
    WHERE s.organization_id = org_id
        AND ua.user_id = check_user_id
        AND ua.resource_type = 'organization'
        AND ua.role IN ('owner', 'manager')
        AND (ua.expires_at IS NULL OR ua.expires_at > NOW())
    
    UNION
    
    -- Direct site access
    SELECT 
        s.id as site_id,
        s.name as site_name,
        ua.role,
        'direct'::TEXT as access_type
    FROM sites s
    JOIN user_access ua ON ua.resource_id = s.id
    WHERE s.organization_id = org_id
        AND ua.user_id = check_user_id
        AND ua.resource_type = 'site'
        AND (ua.expires_at IS NULL OR ua.expires_at > NOW())
    
    UNION
    
    -- Group-based site access
    SELECT 
        s.id as site_id,
        s.name as site_name,
        ua.role,
        'group'::TEXT as access_type
    FROM sites s
    JOIN groups g ON s.id = ANY(g.site_ids)
    JOIN user_access ua ON ua.resource_id = g.id
    WHERE s.organization_id = org_id
        AND ua.user_id = check_user_id
        AND ua.resource_type = 'group'
        AND g.organization_id = org_id
        AND (ua.expires_at IS NULL OR ua.expires_at > NOW());
END;
$$;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS can_user_access_resource(UUID, TEXT, UUID, TEXT);

CREATE OR REPLACE FUNCTION can_user_access_resource(
    check_user_id UUID,
    check_resource_type TEXT,
    check_resource_id UUID,
    required_role TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role TEXT;
    role_hierarchy JSONB := '{"owner": 4, "manager": 3, "member": 2, "viewer": 1}'::JSONB;
BEGIN
    -- Super admins can access everything
    IF is_super_admin(check_user_id) THEN
        RETURN TRUE;
    END IF;
    
    -- Get user's role for this resource
    SELECT role INTO user_role
    FROM user_access
    WHERE user_id = check_user_id
        AND resource_type = check_resource_type
        AND resource_id = check_resource_id
        AND (expires_at IS NULL OR expires_at > NOW())
    LIMIT 1;
    
    -- No access found
    IF user_role IS NULL THEN
        -- Check if it's a site and user has org-level access
        IF check_resource_type = 'site' THEN
            SELECT ua.role INTO user_role
            FROM sites s
            JOIN user_access ua ON ua.resource_id = s.organization_id
            WHERE s.id = check_resource_id
                AND ua.user_id = check_user_id
                AND ua.resource_type = 'organization'
                AND ua.role IN ('owner', 'manager')
                AND (ua.expires_at IS NULL OR ua.expires_at > NOW())
            LIMIT 1;
        END IF;
    END IF;
    
    -- Still no access
    IF user_role IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- If no specific role required, any access is sufficient
    IF required_role IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Check if user's role is sufficient
    RETURN (role_hierarchy->user_role)::INT >= (role_hierarchy->required_role)::INT;
END;
$$;

-- 7. Update RLS policies for the new system
ALTER TABLE user_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- User access policies
CREATE POLICY "Users can view their own access" ON user_access
    FOR SELECT USING (
        auth.uid() = user_id OR
        is_super_admin(auth.uid())
    );

CREATE POLICY "Organization owners can manage access" ON user_access
    FOR ALL USING (
        is_super_admin(auth.uid()) OR
        EXISTS (
            SELECT 1 FROM user_access ua
            WHERE ua.user_id = auth.uid()
                AND ua.resource_type = 'organization'
                AND ua.role = 'owner'
                AND (
                    -- Can manage org-level access
                    (user_access.resource_type = 'organization' AND user_access.resource_id = ua.resource_id)
                    OR
                    -- Can manage site access for sites in their org
                    (user_access.resource_type = 'site' AND EXISTS (
                        SELECT 1 FROM sites s 
                        WHERE s.id = user_access.resource_id 
                        AND s.organization_id = ua.resource_id
                    ))
                    OR
                    -- Can manage group access for groups in their org
                    (user_access.resource_type = 'group' AND EXISTS (
                        SELECT 1 FROM groups g 
                        WHERE g.id = user_access.resource_id 
                        AND g.organization_id = ua.resource_id
                    ))
                )
        )
    );

-- Groups policies
CREATE POLICY "Users can view groups in their organizations" ON groups
    FOR SELECT USING (
        is_super_admin(auth.uid()) OR
        can_user_access_resource(auth.uid(), 'organization', organization_id, 'viewer')
    );

CREATE POLICY "Organization managers can manage groups" ON groups
    FOR ALL USING (
        is_super_admin(auth.uid()) OR
        can_user_access_resource(auth.uid(), 'organization', organization_id, 'manager')
    );

-- 8. Create audit trigger for access changes
CREATE TABLE IF NOT EXISTS access_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS audit_access_changes();

CREATE OR REPLACE FUNCTION audit_access_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO access_audit_log (user_id, action, resource_type, resource_id, old_data, new_data)
    VALUES (
        auth.uid(),
        TG_OP,
        COALESCE(NEW.resource_type, OLD.resource_type),
        COALESCE(NEW.resource_id, OLD.resource_id),
        CASE WHEN TG_OP != 'INSERT' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) ELSE NULL END
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER audit_user_access
    AFTER INSERT OR UPDATE OR DELETE ON user_access
    FOR EACH ROW
    EXECUTE FUNCTION audit_access_changes();

-- 9. Helper view for easy permission checking
-- Drop existing view if it exists
DROP VIEW IF EXISTS user_permissions CASCADE;

CREATE VIEW user_permissions AS
SELECT 
    ua.user_id,
    u.email as user_email,
    ua.resource_type,
    ua.resource_id,
    CASE 
        WHEN ua.resource_type = 'organization' THEN o.name
        WHEN ua.resource_type = 'site' THEN s.name
        WHEN ua.resource_type = 'group' THEN g.name
    END as resource_name,
    ua.role,
    ua.expires_at,
    ua.created_at,
    CASE WHEN sa.id IS NOT NULL THEN TRUE ELSE FALSE END as is_super_admin
FROM user_access ua
LEFT JOIN auth.users u ON u.id = ua.user_id
LEFT JOIN super_admins sa ON sa.user_id = ua.user_id
LEFT JOIN organizations o ON o.id = ua.resource_id AND ua.resource_type = 'organization'
LEFT JOIN sites s ON s.id = ua.resource_id AND ua.resource_type = 'site'
LEFT JOIN groups g ON g.id = ua.resource_id AND ua.resource_type = 'group';

-- 10. Create indexes for performance
-- Create indexes only if they don't exist
CREATE INDEX IF NOT EXISTS idx_sites_org ON sites(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON access_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON access_audit_log(resource_type, resource_id);

-- 11. Add comments for documentation
COMMENT ON TABLE user_access IS 'Core permission table - maps users to resources with roles';
COMMENT ON TABLE groups IS 'Groups for multi-site access management';
COMMENT ON TABLE super_admins IS 'Platform-level super administrators with full system access';
COMMENT ON FUNCTION is_super_admin IS 'Check if a user is a super admin';
COMMENT ON FUNCTION get_user_organizations IS 'Get all organizations a user can access';
COMMENT ON FUNCTION get_user_sites IS 'Get all sites a user can access within an organization';
COMMENT ON FUNCTION can_user_access_resource IS 'Universal permission check function';

-- 12. Sample data for testing (commented out for production)
/*
-- Create a test group
INSERT INTO groups (organization_id, name, description, site_ids)
VALUES (
    (SELECT id FROM organizations LIMIT 1),
    'European Sites',
    'All European facilities',
    ARRAY(SELECT id FROM sites WHERE country IN ('UK', 'Germany', 'France'))
);

-- Grant a user access to the group
INSERT INTO user_access (user_id, resource_type, resource_id, role)
VALUES (
    (SELECT id FROM auth.users WHERE email = 'test@example.com'),
    'group',
    (SELECT id FROM groups WHERE name = 'European Sites'),
    'manager'
);
*/

-- Migration complete!
-- The system now supports:
-- ✅ Super admins with full access
-- ✅ Flexible role-based access (owner, manager, member, viewer)
-- ✅ Multi-site access through groups
-- ✅ Temporary access with expiration
-- ✅ Full audit logging
-- ✅ Backwards compatibility with existing data