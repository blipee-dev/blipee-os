-- Controlled Organization Creation System
-- Restricts organization creation to super admins and invitation holders

-- ==============================================
-- ORGANIZATION CREATION INVITATIONS TABLE
-- ==============================================

CREATE TABLE IF NOT EXISTS organization_creation_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    token UUID UNIQUE DEFAULT gen_random_uuid(),
    invited_by UUID NOT NULL REFERENCES auth.users(id),
    organization_name TEXT, -- Pre-filled suggestion
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    used_at TIMESTAMPTZ,
    used_by UUID REFERENCES auth.users(id),
    max_uses INTEGER DEFAULT 1,
    current_uses INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}', -- Custom message, etc.
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_org_invitations_token ON organization_creation_invitations(token);
CREATE INDEX IF NOT EXISTS idx_org_invitations_email ON organization_creation_invitations(email);
CREATE INDEX IF NOT EXISTS idx_org_invitations_expires ON organization_creation_invitations(expires_at);

-- ==============================================
-- UPDATE ORGANIZATIONS TABLE
-- ==============================================

-- Track how organization was created
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS creation_method TEXT DEFAULT 'superadmin' 
CHECK (creation_method IN ('superadmin', 'invitation'));

-- Link to invitation if created via invitation
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS invitation_token UUID REFERENCES organization_creation_invitations(id);

-- Update existing organizations to reflect they were created by superadmin
UPDATE organizations 
SET creation_method = 'superadmin'
WHERE creation_method IS NULL;

-- ==============================================
-- HELPER FUNCTIONS
-- ==============================================

-- Validate organization invitation
CREATE OR REPLACE FUNCTION validate_organization_invitation(p_token UUID)
RETURNS TABLE(
    valid BOOLEAN,
    email TEXT,
    organization_name TEXT,
    expires_at TIMESTAMPTZ,
    error_message TEXT
) AS $$
DECLARE
    v_invitation organization_creation_invitations%ROWTYPE;
BEGIN
    -- Get invitation
    SELECT * INTO v_invitation
    FROM organization_creation_invitations
    WHERE token = p_token;
    
    -- Check if exists
    IF v_invitation.id IS NULL THEN
        RETURN QUERY SELECT false, null::text, null::text, null::timestamptz, 'Invalid invitation token';
        RETURN;
    END IF;
    
    -- Check if expired
    IF v_invitation.expires_at < NOW() THEN
        RETURN QUERY SELECT false, v_invitation.email, v_invitation.organization_name, v_invitation.expires_at, 'Invitation has expired';
        RETURN;
    END IF;
    
    -- Check if already used (considering max_uses)
    IF v_invitation.current_uses >= v_invitation.max_uses THEN
        RETURN QUERY SELECT false, v_invitation.email, v_invitation.organization_name, v_invitation.expires_at, 'Invitation already used';
        RETURN;
    END IF;
    
    -- Valid invitation
    RETURN QUERY SELECT true, v_invitation.email, v_invitation.organization_name, v_invitation.expires_at, null::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can create organization
CREATE OR REPLACE FUNCTION user_can_create_organization()
RETURNS BOOLEAN AS $$
BEGIN
    -- Super admins can always create organizations
    IF is_current_user_super_admin() THEN
        RETURN TRUE;
    END IF;
    
    -- Regular users cannot create organizations without invitation
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Consume organization invitation
CREATE OR REPLACE FUNCTION consume_organization_invitation(
    p_token UUID,
    p_user_id UUID,
    p_organization_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_invitation organization_creation_invitations%ROWTYPE;
BEGIN
    -- Get and lock invitation
    SELECT * INTO v_invitation
    FROM organization_creation_invitations
    WHERE token = p_token
    FOR UPDATE;
    
    -- Validate invitation
    IF v_invitation.id IS NULL OR 
       v_invitation.expires_at < NOW() OR
       v_invitation.current_uses >= v_invitation.max_uses THEN
        RETURN FALSE;
    END IF;
    
    -- Verify user email matches invitation
    IF NOT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = p_user_id AND email = v_invitation.email
    ) THEN
        RETURN FALSE;
    END IF;
    
    -- Mark invitation as used
    UPDATE organization_creation_invitations
    SET 
        used_at = CASE WHEN used_at IS NULL THEN NOW() ELSE used_at END,
        used_by = CASE WHEN used_by IS NULL THEN p_user_id ELSE used_by END,
        current_uses = current_uses + 1
    WHERE id = v_invitation.id;
    
    -- Link organization to invitation
    UPDATE organizations
    SET invitation_token = v_invitation.id
    WHERE id = p_organization_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- UPDATED RLS POLICIES
-- ==============================================

-- Drop the old open creation policy
DROP POLICY IF EXISTS "organizations_insert" ON organizations;
DROP POLICY IF EXISTS "controlled_org_creation" ON organizations;

-- New restrictive organization creation policy
CREATE POLICY "restricted_org_creation" ON organizations
FOR INSERT WITH CHECK (
    -- Only super admins can create directly
    is_current_user_super_admin() 
    OR 
    -- Or if it's being created via invitation (validated in application)
    creation_method = 'invitation'
);

-- RLS policies for invitation table
ALTER TABLE organization_creation_invitations ENABLE ROW LEVEL SECURITY;

-- Super admins can manage all invitations
CREATE POLICY "superadmin_manage_invitations" ON organization_creation_invitations
FOR ALL USING (
    is_current_user_super_admin()
);

-- Users can view their own invitations (by email)
CREATE POLICY "users_view_own_invitations" ON organization_creation_invitations
FOR SELECT USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- ==============================================
-- AUDIT TRIGGERS
-- ==============================================

-- Audit organization creation invitations
CREATE OR REPLACE FUNCTION log_invitation_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO role_audit_log (
            action, target_user_id, performed_by,
            role_type, role_value, entity_type, entity_id,
            metadata
        ) VALUES (
            'GRANT', 
            (SELECT id FROM auth.users WHERE email = NEW.email LIMIT 1),
            NEW.invited_by,
            'organization_invitation', 
            'create_organization', 
            'system', 
            NEW.id,
            jsonb_build_object(
                'email', NEW.email,
                'organization_name', NEW.organization_name,
                'expires_at', NEW.expires_at
            )
        );
    ELSIF TG_OP = 'UPDATE' AND OLD.used_at IS NULL AND NEW.used_at IS NOT NULL THEN
        INSERT INTO role_audit_log (
            action, target_user_id, performed_by,
            role_type, role_value, entity_type, entity_id,
            metadata
        ) VALUES (
            'CONSUME', 
            NEW.used_by,
            NEW.used_by,
            'organization_invitation', 
            'create_organization', 
            'system', 
            NEW.id,
            jsonb_build_object(
                'email', NEW.email,
                'used_at', NEW.used_at
            )
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS audit_invitation_changes ON organization_creation_invitations;
CREATE TRIGGER audit_invitation_changes
    AFTER INSERT OR UPDATE ON organization_creation_invitations
    FOR EACH ROW EXECUTE FUNCTION log_invitation_change();

-- ==============================================
-- BLOCK FREE ORGANIZATION CREATION
-- ==============================================

-- Function to prevent unauthorized organization creation
CREATE OR REPLACE FUNCTION prevent_unauthorized_org_creation()
RETURNS TRIGGER AS $$
BEGIN
    -- Allow super admins to create organizations
    IF is_current_user_super_admin() THEN
        RETURN NEW;
    END IF;
    
    -- For invitation-based creation, additional validation should be done in application
    -- This trigger serves as a safety net
    IF NEW.creation_method = 'invitation' THEN
        -- The application should set invitation_token when creating via invitation
        IF NEW.invitation_token IS NULL THEN
            RAISE EXCEPTION 'Organization creation via invitation requires valid invitation token';
        END IF;
        
        -- Verify the invitation is valid and unused
        IF NOT EXISTS (
            SELECT 1 FROM organization_creation_invitations
            WHERE id = NEW.invitation_token
            AND expires_at > NOW()
            AND current_uses < max_uses
        ) THEN
            RAISE EXCEPTION 'Invalid or expired invitation token';
        END IF;
        
        RETURN NEW;
    END IF;
    
    -- Block all other attempts
    RAISE EXCEPTION 'Organization creation requires super admin privileges or valid invitation';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply the trigger
DROP TRIGGER IF EXISTS check_org_creation_auth ON organizations;
CREATE TRIGGER check_org_creation_auth
    BEFORE INSERT ON organizations
    FOR EACH ROW EXECUTE FUNCTION prevent_unauthorized_org_creation();

-- ==============================================
-- UPDATE EXISTING ORGANIZATION CREATION API ROUTE
-- ==============================================

-- This would need to be implemented in the API layer, but here's the logic:

-- For super admin direct creation:
-- 1. Verify is_current_user_super_admin()
-- 2. Create organization with creation_method = 'superadmin'
-- 3. Create or link account_owner user
-- 4. Assign account_owner role

-- For invitation-based creation:
-- 1. Validate invitation token using validate_organization_invitation()
-- 2. Verify current user email matches invitation email
-- 3. Create organization with creation_method = 'invitation'
-- 4. Use consume_organization_invitation() to mark as used
-- 5. Assign current user as account_owner

-- ==============================================
-- CLEANUP EXPIRED INVITATIONS
-- ==============================================

-- Function to clean up expired invitations
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete invitations expired more than 30 days ago
    DELETE FROM organization_creation_invitations
    WHERE expires_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- You can schedule this to run periodically:
-- SELECT cron.schedule('cleanup-expired-invitations', '0 2 * * *', 'SELECT cleanup_expired_invitations();');

-- ==============================================
-- INITIAL DATA & NOTIFICATIONS
-- ==============================================

-- Set creation_method for all existing organizations to 'superadmin'
UPDATE organizations 
SET creation_method = 'superadmin'
WHERE creation_method IS NULL OR creation_method = '';

-- Log the security change
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '===============================================';
    RAISE NOTICE 'SECURITY UPDATE: Organization Creation Restricted';
    RAISE NOTICE '===============================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Organization creation is now RESTRICTED to:';
    RAISE NOTICE '  1. Super admins (direct creation)';
    RAISE NOTICE '  2. Users with valid invitations';
    RAISE NOTICE '';
    RAISE NOTICE 'Free signup → create org is BLOCKED';
    RAISE NOTICE '';
    RAISE NOTICE 'Super admin actions available:';
    RAISE NOTICE '  - Create organizations directly';
    RAISE NOTICE '  - Send organization creation invitations';
    RAISE NOTICE '  - Manage all invitations';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '  1. Update API routes to use new validation';
    RAISE NOTICE '  2. Update frontend to show invitation flow';
    RAISE NOTICE '  3. Test organization creation process';
    RAISE NOTICE '===============================================';
END $$;