-- =====================================================
-- ENTERPRISE RBAC SYSTEM IMPLEMENTATION
-- =====================================================
-- This migration implements the complete Enterprise RBAC system
-- as defined in docs/RBAC_SYSTEM_ARCHITECTURE.md

-- =====================================================
-- 1. CLEANUP OLD SIMPLE RBAC TABLES (if they exist)
-- =====================================================
DROP TABLE IF EXISTS user_access CASCADE;
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS user_access_backup CASCADE;

-- =====================================================
-- 2. CREATE ROLES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    level TEXT NOT NULL CHECK (level IN ('platform', 'organization', 'regional', 'site', 'external')),
    permissions JSONB NOT NULL DEFAULT '{}',
    description TEXT,
    is_system BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert predefined system roles
INSERT INTO roles (name, level, permissions, description, is_system) VALUES
-- Platform Level
('SUPER_ADMIN', 'platform', '{
    "all": true
}', 'Full system access, all organizations', true),

-- Organization Level
('ORGANIZATION_OWNER', 'organization', '{
    "organization": ["*"],
    "sites": ["*"],
    "users": ["create", "read", "update", "delete"],
    "billing": ["*"],
    "settings": ["*"],
    "reports": ["*"]
}', 'Full control of organization', true),

('ORGANIZATION_ADMIN', 'organization', '{
    "organization": ["read", "update"],
    "sites": ["*"],
    "users": ["create", "read", "update"],
    "settings": ["read", "update"],
    "reports": ["*"]
}', 'Manage organization settings', true),

('SUSTAINABILITY_DIRECTOR', 'organization', '{
    "organization": ["read"],
    "sites": ["read", "analyze"],
    "users": ["read"],
    "reports": ["*"],
    "targets": ["*"],
    "compliance": ["*"]
}', 'ESG strategy and compliance', true),

-- Regional Level
('REGIONAL_MANAGER', 'regional', '{
    "sites": ["read", "update", "analyze"],
    "users": ["read"],
    "reports": ["create", "read"],
    "targets": ["read", "update"]
}', 'Manage multiple sites in a region', true),

-- Site Level
('SITE_MANAGER', 'site', '{
    "sites": ["read", "update"],
    "devices": ["*"],
    "emissions": ["*"],
    "reports": ["create", "read"],
    "targets": ["read", "update"]
}', 'Full control of assigned site(s)', true),

('SITE_ANALYST', 'site', '{
    "sites": ["read"],
    "devices": ["read"],
    "emissions": ["create", "read", "update"],
    "reports": ["create", "read"],
    "data": ["export"]
}', 'Data entry and analysis', true),

('SITE_OPERATOR', 'site', '{
    "sites": ["read"],
    "devices": ["read", "update"],
    "emissions": ["create", "read"],
    "data": ["input"]
}', 'Daily operations and data collection', true),

-- External Level
('AUDITOR', 'external', '{
    "sites": ["read"],
    "reports": ["read"],
    "compliance": ["read"],
    "data": ["export"],
    "audit_trail": ["read"]
}', 'Read-only access with audit trail', true),

('STAKEHOLDER', 'external', '{
    "reports": ["read:published"],
    "targets": ["read:public"]
}', 'View published reports only', true);

-- =====================================================
-- 3. CREATE USER_ROLES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
    region TEXT,
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for performance
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_organization_id ON user_roles(organization_id);
CREATE INDEX idx_user_roles_site_id ON user_roles(site_id);
CREATE INDEX idx_user_roles_is_active ON user_roles(is_active);
CREATE INDEX idx_user_roles_expires_at ON user_roles(expires_at);

-- Create unique constraint to prevent duplicate role assignments
-- For organization-level roles (site_id is NULL)
CREATE UNIQUE INDEX idx_user_roles_unique_org ON user_roles(user_id, role_id, organization_id)
WHERE site_id IS NULL;

-- For site-specific roles
CREATE UNIQUE INDEX idx_user_roles_unique_site ON user_roles(user_id, role_id, organization_id, site_id)
WHERE site_id IS NOT NULL;

-- =====================================================
-- 4. CREATE PERMISSION_OVERRIDES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS permission_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    site_id UUID REFERENCES sites(id),
    resource_type TEXT NOT NULL,
    resource_id UUID,
    permission TEXT NOT NULL,
    granted_by UUID REFERENCES auth.users(id),
    reason TEXT NOT NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_permission_overrides_user_id ON permission_overrides(user_id);
CREATE INDEX idx_permission_overrides_expires_at ON permission_overrides(expires_at);

-- =====================================================
-- 5. CREATE DELEGATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS delegations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delegator_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    delegate_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    delegator_role_id UUID REFERENCES user_roles(id) ON DELETE CASCADE,
    scope TEXT NOT NULL CHECK (scope IN ('full', 'partial')),
    permissions JSONB,
    reason TEXT NOT NULL,
    starts_at TIMESTAMPTZ DEFAULT NOW(),
    ends_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ
);

CREATE INDEX idx_delegations_delegator ON delegations(delegator_user_id);
CREATE INDEX idx_delegations_delegate ON delegations(delegate_user_id);
CREATE INDEX idx_delegations_active ON delegations(is_active, starts_at, ends_at);

-- =====================================================
-- 6. MIGRATE EXISTING DATA FROM organization_members
-- =====================================================

-- First, get role IDs for migration
DO $$
DECLARE
    owner_role_id UUID;
    admin_role_id UUID;
    director_role_id UUID;
    analyst_role_id UUID;
    viewer_role_id UUID;
BEGIN
    -- Get role IDs
    SELECT id INTO owner_role_id FROM roles WHERE name = 'ORGANIZATION_OWNER';
    SELECT id INTO admin_role_id FROM roles WHERE name = 'ORGANIZATION_ADMIN';
    SELECT id INTO director_role_id FROM roles WHERE name = 'SUSTAINABILITY_DIRECTOR';
    SELECT id INTO analyst_role_id FROM roles WHERE name = 'SITE_ANALYST';
    SELECT id INTO viewer_role_id FROM roles WHERE name = 'STAKEHOLDER';

    -- Migrate existing organization_members to user_roles
    INSERT INTO user_roles (user_id, role_id, organization_id, granted_at, is_active)
    SELECT
        om.user_id,
        CASE om.role
            WHEN 'account_owner' THEN owner_role_id
            WHEN 'sustainability_manager' THEN director_role_id
            WHEN 'facility_manager' THEN admin_role_id
            WHEN 'analyst' THEN analyst_role_id
            WHEN 'viewer' THEN viewer_role_id
            ELSE viewer_role_id
        END,
        om.organization_id,
        COALESCE(om.created_at, NOW()),
        om.invitation_status = 'accepted'
    FROM organization_members om
    WHERE om.invitation_status = 'accepted'
    ON CONFLICT DO NOTHING;
END $$;

-- =====================================================
-- 7. HELPER FUNCTIONS
-- =====================================================

-- Function to check if user has a specific permission
CREATE OR REPLACE FUNCTION check_user_permission(
    p_user_id UUID,
    p_resource TEXT,
    p_action TEXT,
    p_organization_id UUID DEFAULT NULL,
    p_site_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_has_permission BOOLEAN := FALSE;
    v_role_permissions JSONB;
BEGIN
    -- Check if super admin
    IF EXISTS (SELECT 1 FROM super_admins WHERE user_id = p_user_id) THEN
        RETURN TRUE;
    END IF;

    -- Check role-based permissions
    SELECT
        BOOL_OR(
            r.permissions ? p_resource AND (
                r.permissions->p_resource ? '*' OR
                r.permissions->p_resource ? p_action
            )
        ) INTO v_has_permission
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE
        ur.user_id = p_user_id
        AND ur.is_active = TRUE
        AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
        AND (p_organization_id IS NULL OR ur.organization_id = p_organization_id)
        AND (p_site_id IS NULL OR ur.site_id = p_site_id OR ur.site_id IS NULL);

    IF v_has_permission THEN
        RETURN TRUE;
    END IF;

    -- Check permission overrides
    SELECT COUNT(*) > 0 INTO v_has_permission
    FROM permission_overrides
    WHERE
        user_id = p_user_id
        AND resource_type = p_resource
        AND permission = p_action
        AND (expires_at IS NULL OR expires_at > NOW())
        AND (p_organization_id IS NULL OR organization_id = p_organization_id)
        AND (p_site_id IS NULL OR site_id = p_site_id);

    IF v_has_permission THEN
        RETURN TRUE;
    END IF;

    -- Check active delegations
    SELECT COUNT(*) > 0 INTO v_has_permission
    FROM delegations d
    JOIN user_roles ur ON d.delegator_role_id = ur.id
    JOIN roles r ON ur.role_id = r.id
    WHERE
        d.delegate_user_id = p_user_id
        AND d.is_active = TRUE
        AND NOW() BETWEEN d.starts_at AND COALESCE(d.ends_at, NOW() + INTERVAL '100 years')
        AND (
            d.scope = 'full' OR
            (d.permissions ? p_resource AND d.permissions->p_resource ? p_action)
        );

    RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's roles
CREATE OR REPLACE FUNCTION get_user_roles(p_user_id UUID)
RETURNS TABLE (
    role_name TEXT,
    role_level TEXT,
    organization_id UUID,
    organization_name TEXT,
    site_id UUID,
    site_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.name,
        r.level,
        ur.organization_id,
        o.name,
        ur.site_id,
        s.name
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    LEFT JOIN organizations o ON ur.organization_id = o.id
    LEFT JOIN sites s ON ur.site_id = s.id
    WHERE
        ur.user_id = p_user_id
        AND ur.is_active = TRUE
        AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    ORDER BY
        r.level,
        o.name,
        s.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all RBAC tables
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE delegations ENABLE ROW LEVEL SECURITY;

-- Roles table policies (read-only for all authenticated users)
CREATE POLICY "Roles are viewable by authenticated users"
    ON roles FOR SELECT
    TO authenticated
    USING (true);

-- User roles policies
CREATE POLICY "Users can view their own roles"
    ON user_roles FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Organization owners can manage user roles"
    ON user_roles FOR ALL
    TO authenticated
    USING (
        check_user_permission(auth.uid(), 'users', 'update', organization_id, site_id)
    );

-- Permission overrides policies
CREATE POLICY "Users can view their own permission overrides"
    ON permission_overrides FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Organization owners can manage permission overrides"
    ON permission_overrides FOR ALL
    TO authenticated
    USING (
        check_user_permission(auth.uid(), 'permissions', 'update', organization_id, site_id)
    );

-- Delegations policies
CREATE POLICY "Users can view delegations they're involved in"
    ON delegations FOR SELECT
    TO authenticated
    USING (delegator_user_id = auth.uid() OR delegate_user_id = auth.uid());

CREATE POLICY "Users can create delegations for their roles"
    ON delegations FOR INSERT
    TO authenticated
    WITH CHECK (delegator_user_id = auth.uid());

CREATE POLICY "Users can update their own delegations"
    ON delegations FOR UPDATE
    TO authenticated
    USING (delegator_user_id = auth.uid());

-- =====================================================
-- 9. AUDIT TRIGGERS
-- =====================================================

-- Audit function for role changes
CREATE OR REPLACE FUNCTION audit_role_changes() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO access_audit_log (
        user_id,
        action,
        resource_type,
        resource_id,
        organization_id,
        site_id,
        success,
        created_at
    ) VALUES (
        COALESCE(NEW.user_id, OLD.user_id),
        TG_OP,
        'user_role',
        COALESCE(NEW.id, OLD.id),
        COALESCE(NEW.organization_id, OLD.organization_id),
        COALESCE(NEW.site_id, OLD.site_id),
        TRUE,
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_user_roles_changes
    AFTER INSERT OR UPDATE OR DELETE ON user_roles
    FOR EACH ROW EXECUTE FUNCTION audit_role_changes();

-- =====================================================
-- 10. CLEANUP AND OPTIMIZATION
-- =====================================================

-- Create a view for easy role checking
CREATE OR REPLACE VIEW user_permissions AS
SELECT
    ur.user_id,
    ur.organization_id,
    ur.site_id,
    r.name as role_name,
    r.level as role_level,
    r.permissions,
    ur.is_active,
    ur.expires_at
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE ur.is_active = TRUE
AND (ur.expires_at IS NULL OR ur.expires_at > NOW());

-- Function to clean up expired permissions
CREATE OR REPLACE FUNCTION cleanup_expired_permissions() RETURNS void AS $$
BEGIN
    -- Deactivate expired user roles
    UPDATE user_roles
    SET is_active = FALSE
    WHERE expires_at < NOW() AND is_active = TRUE;

    -- Delete old permission overrides
    DELETE FROM permission_overrides
    WHERE expires_at < NOW() - INTERVAL '30 days';

    -- Deactivate expired delegations
    UPDATE delegations
    SET is_active = FALSE
    WHERE ends_at < NOW() AND is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (would need pg_cron extension or external scheduler)
-- This is just documentation for manual execution
-- SELECT cleanup_expired_permissions();

-- =====================================================
-- 11. GRANT PERMISSIONS
-- =====================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT ON roles TO authenticated;
GRANT ALL ON user_roles TO authenticated;
GRANT ALL ON permission_overrides TO authenticated;
GRANT ALL ON delegations TO authenticated;
GRANT SELECT ON user_permissions TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION check_user_permission TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_roles TO authenticated;

-- =====================================================
-- 12. FINAL NOTES
-- =====================================================
-- Migration complete! The Enterprise RBAC system is now fully implemented.
--
-- Key features:
-- 1. Hierarchical role structure with 10 predefined roles
-- 2. Support for organization, site, and regional access
-- 3. Permission overrides for flexibility
-- 4. Delegation system for temporary access
-- 5. Full audit trail
-- 6. RLS policies for security
--
-- Next steps:
-- 1. Update application code to use new permission checks
-- 2. Test role assignments and permissions
-- 3. Configure automatic cleanup of expired permissions