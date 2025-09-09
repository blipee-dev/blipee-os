-- Comprehensive Role-Based Access Control System for blipee OS
-- This migration implements a multi-level role system with full Supabase integration

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================
-- CLEANUP: Remove old role system if exists
-- ==============================================
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
DROP POLICY IF EXISTS "Account owners can update their organizations" ON organizations;
DROP POLICY IF EXISTS "Account owners can insert organizations" ON organizations;
DROP POLICY IF EXISTS "organizations_insert" ON organizations;
DROP POLICY IF EXISTS "organizations_select" ON organizations;
DROP POLICY IF EXISTS "organizations_update" ON organizations;
DROP POLICY IF EXISTS "organizations_delete" ON organizations;

-- ==============================================
-- CORE TABLES
-- ==============================================

-- Create regions table for grouping sites
CREATE TABLE IF NOT EXISTS regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, name)
);

-- Add region support to sites table
ALTER TABLE sites ADD COLUMN IF NOT EXISTS region_id UUID REFERENCES regions(id) ON DELETE SET NULL;

-- Organization-level roles table
CREATE TABLE IF NOT EXISTS user_organization_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('account_owner', 'organization_manager', 'regional_manager')),
    region_ids UUID[] DEFAULT '{}', -- For regional managers only
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ, -- Optional: temporary roles
    metadata JSONB DEFAULT '{}', -- Additional permissions/restrictions
    UNIQUE(user_id, organization_id, role)
);

-- Site-level roles table
CREATE TABLE IF NOT EXISTS user_site_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('facility_manager', 'operator', 'viewer')),
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ, -- Optional: temporary access
    metadata JSONB DEFAULT '{}',
    UNIQUE(user_id, site_id)
);

-- Comprehensive audit log for all role changes
CREATE TABLE IF NOT EXISTS role_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL CHECK (action IN ('GRANT', 'REVOKE', 'MODIFY', 'EXPIRE')),
    target_user_id UUID REFERENCES auth.users(id),
    performed_by UUID REFERENCES auth.users(id),
    role_type TEXT NOT NULL,
    role_value TEXT NOT NULL,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('organization', 'region', 'site', 'system')),
    entity_id UUID,
    reason TEXT, -- Why the action was taken
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add account_owner_id to organizations for quick lookup
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS account_owner_id UUID REFERENCES auth.users(id);

-- Update existing organizations to set account_owner from user_organizations
UPDATE organizations o
SET account_owner_id = (
    SELECT user_id 
    FROM user_organizations uo 
    WHERE uo.organization_id = o.id 
    AND uo.role = 'account_owner'
    LIMIT 1
)
WHERE account_owner_id IS NULL;

-- ==============================================
-- INDEXES FOR PERFORMANCE
-- ==============================================
CREATE INDEX IF NOT EXISTS idx_regions_org ON regions(organization_id);
CREATE INDEX IF NOT EXISTS idx_sites_region ON sites(region_id);
CREATE INDEX IF NOT EXISTS idx_user_org_roles_user ON user_organization_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_org_roles_org ON user_organization_roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_org_roles_composite ON user_organization_roles(user_id, organization_id, role);
CREATE INDEX IF NOT EXISTS idx_user_site_roles_user ON user_site_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_site_roles_site ON user_site_roles(site_id);
CREATE INDEX IF NOT EXISTS idx_user_site_roles_composite ON user_site_roles(user_id, site_id, role);
CREATE INDEX IF NOT EXISTS idx_role_audit_log_target ON role_audit_log(target_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_role_audit_log_performer ON role_audit_log(performed_by, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_role_audit_log_entity ON role_audit_log(entity_type, entity_id, created_at DESC);

-- ==============================================
-- HELPER FUNCTIONS
-- ==============================================

-- Check if user has organization access
CREATE OR REPLACE FUNCTION user_has_org_access(
    p_user_id UUID,
    p_org_id UUID,
    p_min_role TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check super admin first
    IF EXISTS (SELECT 1 FROM super_admins WHERE user_id = p_user_id) THEN
        RETURN TRUE;
    END IF;
    
    -- Check organization roles
    RETURN EXISTS (
        SELECT 1 FROM user_organization_roles
        WHERE user_id = p_user_id
        AND organization_id = p_org_id
        AND (expires_at IS NULL OR expires_at > NOW())
        AND (
            p_min_role IS NULL OR
            CASE 
                WHEN p_min_role = 'account_owner' THEN role = 'account_owner'
                WHEN p_min_role = 'organization_manager' THEN role IN ('account_owner', 'organization_manager')
                WHEN p_min_role = 'regional_manager' THEN role IN ('account_owner', 'organization_manager', 'regional_manager')
                ELSE TRUE
            END
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user has site access
CREATE OR REPLACE FUNCTION user_has_site_access(
    p_user_id UUID,
    p_site_id UUID,
    p_min_role TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_org_id UUID;
    v_region_id UUID;
BEGIN
    -- Check super admin first
    IF EXISTS (SELECT 1 FROM super_admins WHERE user_id = p_user_id) THEN
        RETURN TRUE;
    END IF;
    
    -- Get site's organization and region
    SELECT organization_id, region_id INTO v_org_id, v_region_id
    FROM sites WHERE id = p_site_id;
    
    -- Check organization-level access (account_owner and org_manager can access all sites)
    IF EXISTS (
        SELECT 1 FROM user_organization_roles
        WHERE user_id = p_user_id
        AND organization_id = v_org_id
        AND role IN ('account_owner', 'organization_manager')
        AND (expires_at IS NULL OR expires_at > NOW())
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Check regional manager access
    IF v_region_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM user_organization_roles
        WHERE user_id = p_user_id
        AND organization_id = v_org_id
        AND role = 'regional_manager'
        AND v_region_id = ANY(region_ids)
        AND (expires_at IS NULL OR expires_at > NOW())
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Check site-level access
    RETURN EXISTS (
        SELECT 1 FROM user_site_roles
        WHERE user_id = p_user_id
        AND site_id = p_site_id
        AND (expires_at IS NULL OR expires_at > NOW())
        AND (
            p_min_role IS NULL OR
            CASE 
                WHEN p_min_role = 'facility_manager' THEN role = 'facility_manager'
                WHEN p_min_role = 'operator' THEN role IN ('facility_manager', 'operator')
                ELSE TRUE
            END
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get user's highest role in an organization
CREATE OR REPLACE FUNCTION get_user_org_role(p_user_id UUID, p_org_id UUID)
RETURNS TEXT AS $$
BEGIN
    -- Super admin check
    IF EXISTS (SELECT 1 FROM super_admins WHERE user_id = p_user_id) THEN
        RETURN 'super_admin';
    END IF;
    
    -- Return highest org role
    RETURN (
        SELECT role FROM user_organization_roles
        WHERE user_id = p_user_id
        AND organization_id = p_org_id
        AND (expires_at IS NULL OR expires_at > NOW())
        ORDER BY 
            CASE role
                WHEN 'account_owner' THEN 1
                WHEN 'organization_manager' THEN 2
                WHEN 'regional_manager' THEN 3
            END
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get user's role in a site
CREATE OR REPLACE FUNCTION get_user_site_role(p_user_id UUID, p_site_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_org_id UUID;
    v_org_role TEXT;
BEGIN
    -- Get site's organization
    SELECT organization_id INTO v_org_id FROM sites WHERE id = p_site_id;
    
    -- Check org-level role first
    v_org_role := get_user_org_role(p_user_id, v_org_id);
    IF v_org_role IN ('super_admin', 'account_owner', 'organization_manager') THEN
        RETURN v_org_role;
    END IF;
    
    -- Check if regional manager
    IF v_org_role = 'regional_manager' THEN
        -- Check if site is in user's regions
        IF EXISTS (
            SELECT 1 FROM sites s
            JOIN user_organization_roles uor ON uor.organization_id = s.organization_id
            WHERE s.id = p_site_id
            AND uor.user_id = p_user_id
            AND uor.role = 'regional_manager'
            AND s.region_id = ANY(uor.region_ids)
        ) THEN
            RETURN 'regional_manager';
        END IF;
    END IF;
    
    -- Return site-specific role
    RETURN (
        SELECT role FROM user_site_roles
        WHERE user_id = p_user_id
        AND site_id = p_site_id
        AND (expires_at IS NULL OR expires_at > NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ==============================================
-- AUDIT TRIGGERS
-- ==============================================

-- Comprehensive audit logging function
CREATE OR REPLACE FUNCTION log_role_change()
RETURNS TRIGGER AS $$
DECLARE
    v_action TEXT;
    v_entity_type TEXT;
    v_entity_id UUID;
    v_role TEXT;
    v_target_user UUID;
BEGIN
    -- Determine action
    IF TG_OP = 'INSERT' THEN
        v_action := 'GRANT';
        v_target_user := NEW.user_id;
        v_role := NEW.role;
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'REVOKE';
        v_target_user := OLD.user_id;
        v_role := OLD.role;
    ELSIF TG_OP = 'UPDATE' THEN
        v_action := 'MODIFY';
        v_target_user := NEW.user_id;
        v_role := NEW.role;
    END IF;
    
    -- Determine entity type and ID
    IF TG_TABLE_NAME = 'user_organization_roles' THEN
        v_entity_type := 'organization';
        v_entity_id := COALESCE(NEW.organization_id, OLD.organization_id);
    ELSIF TG_TABLE_NAME = 'user_site_roles' THEN
        v_entity_type := 'site';
        v_entity_id := COALESCE(NEW.site_id, OLD.site_id);
    END IF;
    
    -- Log the change
    INSERT INTO role_audit_log (
        action, target_user_id, performed_by,
        role_type, role_value, entity_type, entity_id,
        metadata
    ) VALUES (
        v_action, v_target_user, auth.uid(),
        TG_TABLE_NAME, v_role, v_entity_type, v_entity_id,
        jsonb_build_object(
            'old_data', to_jsonb(OLD),
            'new_data', to_jsonb(NEW),
            'operation', TG_OP
        )
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers
DROP TRIGGER IF EXISTS audit_org_role_changes ON user_organization_roles;
CREATE TRIGGER audit_org_role_changes
    AFTER INSERT OR UPDATE OR DELETE ON user_organization_roles
    FOR EACH ROW EXECUTE FUNCTION log_role_change();

DROP TRIGGER IF EXISTS audit_site_role_changes ON user_site_roles;
CREATE TRIGGER audit_site_role_changes
    AFTER INSERT OR UPDATE OR DELETE ON user_site_roles
    FOR EACH ROW EXECUTE FUNCTION log_role_change();

-- ==============================================
-- ROW LEVEL SECURITY POLICIES
-- ==============================================

-- Enable RLS on all tables
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organization_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_site_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_audit_log ENABLE ROW LEVEL SECURITY;

-- REGIONS POLICIES
CREATE POLICY "regions_select" ON regions FOR SELECT
    USING (user_has_org_access(auth.uid(), organization_id));

CREATE POLICY "regions_insert" ON regions FOR INSERT
    WITH CHECK (user_has_org_access(auth.uid(), organization_id, 'organization_manager'));

CREATE POLICY "regions_update" ON regions FOR UPDATE
    USING (user_has_org_access(auth.uid(), organization_id, 'organization_manager'));

CREATE POLICY "regions_delete" ON regions FOR DELETE
    USING (user_has_org_access(auth.uid(), organization_id, 'organization_manager'));

-- USER ORGANIZATION ROLES POLICIES
CREATE POLICY "user_org_roles_select" ON user_organization_roles FOR SELECT
    USING (
        user_id = auth.uid() OR
        user_has_org_access(auth.uid(), organization_id, 'organization_manager')
    );

CREATE POLICY "user_org_roles_insert" ON user_organization_roles FOR INSERT
    WITH CHECK (
        -- Only org managers and above can grant org roles
        user_has_org_access(auth.uid(), organization_id, 'organization_manager') AND
        -- Cannot grant account_owner unless you are account_owner
        (role != 'account_owner' OR get_user_org_role(auth.uid(), organization_id) = 'account_owner')
    );

CREATE POLICY "user_org_roles_update" ON user_organization_roles FOR UPDATE
    USING (
        user_has_org_access(auth.uid(), organization_id, 'organization_manager') AND
        (role != 'account_owner' OR get_user_org_role(auth.uid(), organization_id) = 'account_owner')
    );

CREATE POLICY "user_org_roles_delete" ON user_organization_roles FOR DELETE
    USING (
        user_has_org_access(auth.uid(), organization_id, 'organization_manager') AND
        (role != 'account_owner' OR get_user_org_role(auth.uid(), organization_id) = 'account_owner')
    );

-- USER SITE ROLES POLICIES
CREATE POLICY "user_site_roles_select" ON user_site_roles FOR SELECT
    USING (
        user_id = auth.uid() OR
        user_has_site_access(auth.uid(), site_id, 'facility_manager')
    );

CREATE POLICY "user_site_roles_insert" ON user_site_roles FOR INSERT
    WITH CHECK (
        -- Must have at least facility_manager access to grant site roles
        user_has_site_access(auth.uid(), site_id, 'facility_manager') OR
        -- Or be org manager
        EXISTS (
            SELECT 1 FROM sites s
            WHERE s.id = site_id
            AND user_has_org_access(auth.uid(), s.organization_id, 'organization_manager')
        )
    );

CREATE POLICY "user_site_roles_update" ON user_site_roles FOR UPDATE
    USING (
        user_has_site_access(auth.uid(), site_id, 'facility_manager') OR
        EXISTS (
            SELECT 1 FROM sites s
            WHERE s.id = site_id
            AND user_has_org_access(auth.uid(), s.organization_id, 'organization_manager')
        )
    );

CREATE POLICY "user_site_roles_delete" ON user_site_roles FOR DELETE
    USING (
        user_has_site_access(auth.uid(), site_id, 'facility_manager') OR
        EXISTS (
            SELECT 1 FROM sites s
            WHERE s.id = site_id
            AND user_has_org_access(auth.uid(), s.organization_id, 'organization_manager')
        )
    );

-- ROLE AUDIT LOG POLICIES
CREATE POLICY "role_audit_select" ON role_audit_log FOR SELECT
    USING (
        -- Users can see their own audit logs
        target_user_id = auth.uid() OR
        performed_by = auth.uid() OR
        -- Org managers can see all logs for their org
        (entity_type = 'organization' AND user_has_org_access(auth.uid(), entity_id, 'organization_manager')) OR
        (entity_type = 'site' AND EXISTS (
            SELECT 1 FROM sites s
            WHERE s.id = entity_id
            AND user_has_org_access(auth.uid(), s.organization_id, 'organization_manager')
        ))
    );

-- Audit log is insert-only (no update/delete)
CREATE POLICY "role_audit_insert" ON role_audit_log FOR INSERT
    WITH CHECK (performed_by = auth.uid());

-- ORGANIZATIONS POLICIES (Updated)
CREATE POLICY "organizations_select" ON organizations FOR SELECT
    USING (
        user_has_org_access(auth.uid(), id)
    );

CREATE POLICY "organizations_insert" ON organizations FOR INSERT
    WITH CHECK (
        -- Anyone can create an organization (they become the owner)
        auth.uid() IS NOT NULL
    );

CREATE POLICY "organizations_update" ON organizations FOR UPDATE
    USING (
        user_has_org_access(auth.uid(), id, 'organization_manager')
    );

CREATE POLICY "organizations_delete" ON organizations FOR DELETE
    USING (
        user_has_org_access(auth.uid(), id, 'account_owner')
    );

-- SITES POLICIES (Updated)
CREATE POLICY "sites_select" ON sites FOR SELECT
    USING (
        user_has_org_access(auth.uid(), organization_id) OR
        user_has_site_access(auth.uid(), id)
    );

CREATE POLICY "sites_insert" ON sites FOR INSERT
    WITH CHECK (
        user_has_org_access(auth.uid(), organization_id, 'organization_manager')
    );

CREATE POLICY "sites_update" ON sites FOR UPDATE
    USING (
        user_has_site_access(auth.uid(), id, 'facility_manager')
    );

CREATE POLICY "sites_delete" ON sites FOR DELETE
    USING (
        user_has_org_access(auth.uid(), organization_id, 'organization_manager')
    );

-- ==============================================
-- MIGRATION OF EXISTING DATA
-- ==============================================

-- Migrate existing user_organizations to new role system
INSERT INTO user_organization_roles (user_id, organization_id, role, assigned_at)
SELECT 
    user_id,
    organization_id,
    CASE 
        WHEN role = 'account_owner' THEN 'account_owner'
        WHEN role IN ('admin', 'administrator') THEN 'organization_manager'
        WHEN role IN ('manager') THEN 'regional_manager'
        ELSE 'regional_manager' -- Default other roles to regional manager
    END as role,
    COALESCE(created_at, NOW())
FROM user_organizations
WHERE role IN ('account_owner', 'admin', 'administrator', 'manager')
ON CONFLICT (user_id, organization_id, role) DO NOTHING;

-- Create site roles for existing users (default to operator)
INSERT INTO user_site_roles (user_id, site_id, role, assigned_at)
SELECT DISTINCT
    uo.user_id,
    s.id as site_id,
    CASE 
        WHEN uo.role IN ('manager', 'facility_manager') THEN 'facility_manager'
        WHEN uo.role IN ('user', 'operator') THEN 'operator'
        ELSE 'viewer'
    END as role,
    NOW()
FROM user_organizations uo
JOIN sites s ON s.organization_id = uo.organization_id
WHERE uo.role IN ('manager', 'facility_manager', 'user', 'operator', 'viewer')
ON CONFLICT (user_id, site_id) DO NOTHING;

-- ==============================================
-- HELPER VIEWS FOR EASIER QUERYING
-- ==============================================

-- View for user's complete access profile
CREATE OR REPLACE VIEW user_access_profile AS
SELECT 
    u.id as user_id,
    u.email,
    -- Organization roles
    COALESCE(
        jsonb_agg(
            DISTINCT jsonb_build_object(
                'org_id', uor.organization_id,
                'org_name', o.name,
                'role', uor.role,
                'regions', uor.region_ids,
                'expires_at', uor.expires_at
            )
        ) FILTER (WHERE uor.id IS NOT NULL),
        '[]'::jsonb
    ) as organization_roles,
    -- Site roles
    COALESCE(
        jsonb_agg(
            DISTINCT jsonb_build_object(
                'site_id', usr.site_id,
                'site_name', s.name,
                'role', usr.role,
                'expires_at', usr.expires_at
            )
        ) FILTER (WHERE usr.id IS NOT NULL),
        '[]'::jsonb
    ) as site_roles,
    -- Flags
    EXISTS(SELECT 1 FROM super_admins WHERE user_id = u.id) as is_super_admin,
    EXISTS(SELECT 1 FROM user_organization_roles WHERE user_id = u.id AND role = 'account_owner') as is_account_owner
FROM auth.users u
LEFT JOIN user_organization_roles uor ON u.id = uor.user_id
LEFT JOIN organizations o ON uor.organization_id = o.id
LEFT JOIN user_site_roles usr ON u.id = usr.user_id
LEFT JOIN sites s ON usr.site_id = s.id
GROUP BY u.id, u.email;

-- Grant access to the view
GRANT SELECT ON user_access_profile TO authenticated;

-- ==============================================
-- PERFORMANCE OPTIMIZATIONS
-- ==============================================

-- Create materialized view for permission checks (refresh periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS user_permissions_cache AS
SELECT 
    u.id as user_id,
    array_agg(DISTINCT uor.organization_id) FILTER (WHERE uor.organization_id IS NOT NULL) as org_ids,
    array_agg(DISTINCT usr.site_id) FILTER (WHERE usr.site_id IS NOT NULL) as site_ids,
    bool_or(uor.role = 'account_owner') as has_account_owner,
    bool_or(uor.role = 'organization_manager') as has_org_manager,
    bool_or(uor.role = 'regional_manager') as has_regional_manager,
    bool_or(usr.role = 'facility_manager') as has_facility_manager
FROM auth.users u
LEFT JOIN user_organization_roles uor ON u.id = uor.user_id AND (uor.expires_at IS NULL OR uor.expires_at > NOW())
LEFT JOIN user_site_roles usr ON u.id = usr.user_id AND (usr.expires_at IS NULL OR usr.expires_at > NOW())
GROUP BY u.id;

-- Create index on materialized view
CREATE UNIQUE INDEX idx_user_permissions_cache_user ON user_permissions_cache(user_id);

-- Function to refresh the cache
CREATE OR REPLACE FUNCTION refresh_permissions_cache()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_permissions_cache;
END;
$$ LANGUAGE plpgsql;

-- Schedule periodic refresh (requires pg_cron extension)
-- SELECT cron.schedule('refresh-permissions', '*/5 * * * *', 'SELECT refresh_permissions_cache();');

-- ==============================================
-- FINAL NOTES
-- ==============================================
-- 1. Run this migration in Supabase SQL Editor
-- 2. After migration, make yourself account_owner:
--    INSERT INTO user_organization_roles (user_id, organization_id, role) 
--    VALUES (auth.uid(), 'YOUR_ORG_ID', 'account_owner');
-- 3. Test all permission levels before production deployment
-- 4. Set up monitoring for the audit log
-- 5. Consider implementing rate limiting for role changes