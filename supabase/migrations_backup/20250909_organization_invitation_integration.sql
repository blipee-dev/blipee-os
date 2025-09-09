-- Integration of Organization Creation Invitations with Database Tables
-- This migration adds the necessary fields and relationships to support the full invitation flow

-- ==============================================
-- EXTEND AUTH.USERS TABLE WITH PROFILE DATA
-- ==============================================

-- Add user profile fields (stored in user_metadata via Supabase Auth)
-- This is handled by Supabase Auth, but we'll create a profiles table for additional data
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    job_title TEXT,
    avatar_url TEXT,
    timezone TEXT DEFAULT 'UTC',
    language TEXT DEFAULT 'en',
    notification_preferences JSONB DEFAULT '{"email": true, "push": false, "sms": false}',
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on user profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can manage their own profile
CREATE POLICY "users_manage_own_profile" ON user_profiles
FOR ALL USING (id = auth.uid());

-- Create trigger for updated_at
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- EXTEND ORGANIZATIONS TABLE
-- ==============================================

-- Add missing fields for complete organization setup
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS primary_contact_phone TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS net_zero_target_year INTEGER;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS baseline_year INTEGER DEFAULT 2020;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS annual_revenue_range TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stock_symbol TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS parent_company TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS setup_step TEXT DEFAULT 'basic_info';

-- Add check constraints
ALTER TABLE organizations ADD CONSTRAINT check_net_zero_year 
    CHECK (net_zero_target_year IS NULL OR (net_zero_target_year >= 2025 AND net_zero_target_year <= 2100));

ALTER TABLE organizations ADD CONSTRAINT check_baseline_year 
    CHECK (baseline_year >= 2000 AND baseline_year <= EXTRACT(YEAR FROM CURRENT_DATE));

ALTER TABLE organizations ADD CONSTRAINT check_setup_step
    CHECK (setup_step IN ('basic_info', 'sites', 'team', 'devices', 'completed'));

-- ==============================================
-- INVITATION TOKEN TRACKING
-- ==============================================

-- Add more detailed tracking to organization_creation_invitations
ALTER TABLE organization_creation_invitations ADD COLUMN IF NOT EXISTS invitation_type TEXT DEFAULT 'organization_creation';
ALTER TABLE organization_creation_invitations ADD COLUMN IF NOT EXISTS sender_name TEXT;
ALTER TABLE organization_creation_invitations ADD COLUMN IF NOT EXISTS sender_email TEXT;
ALTER TABLE organization_creation_invitations ADD COLUMN IF NOT EXISTS custom_message TEXT;
ALTER TABLE organization_creation_invitations ADD COLUMN IF NOT EXISTS suggested_org_data JSONB DEFAULT '{}';
ALTER TABLE organization_creation_invitations ADD COLUMN IF NOT EXISTS terms_version TEXT DEFAULT 'v1.0';

-- Index for better performance
CREATE INDEX IF NOT EXISTS idx_org_invitations_type ON organization_creation_invitations(invitation_type);
CREATE INDEX IF NOT EXISTS idx_org_invitations_sender ON organization_creation_invitations(invited_by);

-- ==============================================
-- INVITATION VALIDATION & PROCESSING FUNCTIONS
-- ==============================================

-- Enhanced invitation validation with detailed response
CREATE OR REPLACE FUNCTION validate_org_invitation_detailed(p_token UUID)
RETURNS TABLE(
    valid BOOLEAN,
    invitation_id UUID,
    email TEXT,
    organization_name TEXT,
    sender_name TEXT,
    custom_message TEXT,
    suggested_org_data JSONB,
    expires_at TIMESTAMPTZ,
    terms_version TEXT,
    error_code TEXT,
    error_message TEXT
) AS $$
DECLARE
    v_invitation organization_creation_invitations%ROWTYPE;
    v_sender_profile user_profiles%ROWTYPE;
BEGIN
    -- Get invitation with sender details
    SELECT i.*, up.first_name || ' ' || up.last_name as sender_full_name
    INTO v_invitation
    FROM organization_creation_invitations i
    LEFT JOIN user_profiles up ON i.invited_by = up.id
    WHERE i.token = p_token;
    
    -- Check if invitation exists
    IF v_invitation.id IS NULL THEN
        RETURN QUERY SELECT 
            false, null::UUID, null::TEXT, null::TEXT, null::TEXT, null::TEXT, 
            null::JSONB, null::TIMESTAMPTZ, null::TEXT, 'INVALID_TOKEN', 'Invalid invitation token';
        RETURN;
    END IF;
    
    -- Check if expired
    IF v_invitation.expires_at < NOW() THEN
        RETURN QUERY SELECT 
            false, v_invitation.id, v_invitation.email, v_invitation.organization_name,
            v_invitation.sender_name, v_invitation.custom_message, v_invitation.suggested_org_data,
            v_invitation.expires_at, v_invitation.terms_version, 'EXPIRED', 'Invitation has expired';
        RETURN;
    END IF;
    
    -- Check if already used
    IF v_invitation.current_uses >= v_invitation.max_uses THEN
        RETURN QUERY SELECT 
            false, v_invitation.id, v_invitation.email, v_invitation.organization_name,
            v_invitation.sender_name, v_invitation.custom_message, v_invitation.suggested_org_data,
            v_invitation.expires_at, v_invitation.terms_version, 'ALREADY_USED', 'Invitation has already been used';
        RETURN;
    END IF;
    
    -- Valid invitation - return all details
    RETURN QUERY SELECT 
        true, v_invitation.id, v_invitation.email, v_invitation.organization_name,
        v_invitation.sender_name, v_invitation.custom_message, v_invitation.suggested_org_data,
        v_invitation.expires_at, v_invitation.terms_version, null::TEXT, null::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Process organization creation from invitation
CREATE OR REPLACE FUNCTION create_org_from_invitation(
    p_token UUID,
    p_user_id UUID,
    p_org_data JSONB,
    p_user_profile JSONB
)
RETURNS TABLE(
    success BOOLEAN,
    organization_id UUID,
    error_message TEXT
) AS $$
DECLARE
    v_invitation organization_creation_invitations%ROWTYPE;
    v_org_id UUID;
    v_user_email TEXT;
BEGIN
    -- Start transaction
    BEGIN
        -- Validate invitation
        SELECT * INTO v_invitation
        FROM organization_creation_invitations
        WHERE token = p_token
        AND expires_at > NOW()
        AND current_uses < max_uses
        FOR UPDATE;
        
        IF v_invitation.id IS NULL THEN
            RETURN QUERY SELECT false, null::UUID, 'Invalid or expired invitation';
            RETURN;
        END IF;
        
        -- Verify user email matches invitation
        SELECT email INTO v_user_email
        FROM auth.users
        WHERE id = p_user_id;
        
        IF v_user_email != v_invitation.email THEN
            RETURN QUERY SELECT false, null::UUID, 'Email address does not match invitation';
            RETURN;
        END IF;
        
        -- Create user profile
        INSERT INTO user_profiles (
            id, first_name, last_name, phone, job_title,
            onboarding_completed, created_at
        ) VALUES (
            p_user_id,
            (p_user_profile->>'first_name'),
            (p_user_profile->>'last_name'),
            (p_user_profile->>'phone'),
            (p_user_profile->>'job_title'),
            false,
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            phone = EXCLUDED.phone,
            job_title = EXCLUDED.job_title,
            updated_at = NOW();
        
        -- Create organization
        INSERT INTO organizations (
            name, slug, legal_name, industry_primary, company_size, website,
            headquarters_address, primary_contact_email, primary_contact_phone,
            compliance_frameworks, net_zero_target_year, baseline_year,
            account_owner_id, creation_method, invitation_token, created_by,
            onboarding_completed, setup_step
        ) VALUES (
            (p_org_data->>'name'),
            (p_org_data->>'slug'),
            (p_org_data->>'legal_name'),
            (p_org_data->>'industry_primary'),
            (p_org_data->>'company_size'),
            (p_org_data->>'website'),
            (p_org_data->'headquarters_address'),
            (p_org_data->>'primary_contact_email'),
            (p_org_data->>'primary_contact_phone'),
            CASE 
                WHEN p_org_data->'compliance_frameworks' IS NOT NULL 
                THEN array(SELECT jsonb_array_elements_text(p_org_data->'compliance_frameworks'))
                ELSE ARRAY[]::TEXT[]
            END,
            (p_org_data->>'net_zero_target_year')::INTEGER,
            COALESCE((p_org_data->>'baseline_year')::INTEGER, 2020),
            p_user_id,
            'invitation',
            v_invitation.id,
            p_user_id,
            false,
            'sites'
        ) RETURNING id INTO v_org_id;
        
        -- Assign account_owner role
        INSERT INTO user_organization_roles (
            user_id, organization_id, role, assigned_by, assigned_at
        ) VALUES (
            p_user_id, v_org_id, 'account_owner', p_user_id, NOW()
        );
        
        -- Mark invitation as used
        UPDATE organization_creation_invitations
        SET 
            used_at = NOW(),
            used_by = p_user_id,
            current_uses = current_uses + 1
        WHERE id = v_invitation.id;
        
        -- Log the creation
        INSERT INTO role_audit_log (
            action, target_user_id, performed_by,
            role_type, role_value, entity_type, entity_id,
            metadata
        ) VALUES (
            'GRANT', p_user_id, v_invitation.invited_by,
            'organization_creation', 'account_owner', 'organization', v_org_id,
            jsonb_build_object(
                'invitation_id', v_invitation.id,
                'organization_name', (p_org_data->>'name'),
                'creation_method', 'invitation'
            )
        );
        
        RETURN QUERY SELECT true, v_org_id, null::TEXT;
        
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT false, null::UUID, SQLERRM;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- ONBOARDING PROGRESS TRACKING
-- ==============================================

CREATE TABLE IF NOT EXISTS onboarding_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    step_name TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, organization_id, step_name)
);

-- Enable RLS
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;

-- Users can manage their own onboarding progress
CREATE POLICY "users_manage_own_onboarding" ON onboarding_progress
FOR ALL USING (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM user_organization_roles
        WHERE user_id = auth.uid()
        AND organization_id = onboarding_progress.organization_id
        AND role IN ('account_owner', 'organization_manager')
    )
);

-- Function to track onboarding step completion
CREATE OR REPLACE FUNCTION complete_onboarding_step(
    p_user_id UUID,
    p_organization_id UUID,
    p_step_name TEXT,
    p_data JSONB DEFAULT '{}'::JSONB
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO onboarding_progress (
        user_id, organization_id, step_name, completed, completed_at, data
    ) VALUES (
        p_user_id, p_organization_id, p_step_name, true, NOW(), p_data
    ) ON CONFLICT (user_id, organization_id, step_name) DO UPDATE SET
        completed = true,
        completed_at = NOW(),
        data = p_data;
    
    -- Update organization setup step if needed
    IF p_step_name = 'organization_setup' THEN
        UPDATE organizations 
        SET setup_step = 'sites'
        WHERE id = p_organization_id;
    ELSIF p_step_name = 'first_site' THEN
        UPDATE organizations 
        SET setup_step = 'team'
        WHERE id = p_organization_id;
    ELSIF p_step_name = 'first_team_member' THEN
        UPDATE organizations 
        SET setup_step = 'devices'
        WHERE id = p_organization_id;
    ELSIF p_step_name = 'first_device' THEN
        UPDATE organizations 
        SET setup_step = 'completed',
            onboarding_completed = true
        WHERE id = p_organization_id;
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- INVITATION EMAIL TEMPLATES
-- ==============================================

CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    subject TEXT NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT NOT NULL,
    variables JSONB DEFAULT '[]', -- Array of required variables
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default organization invitation template
INSERT INTO email_templates (name, subject, html_content, text_content, variables) VALUES (
    'organization_creation_invitation',
    'You''re invited to create {{organization_name}} on blipee OS',
    '
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Create Your Organization</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1A73E8; margin-bottom: 20px;">You''re invited to create your organization</h1>
        
        <p>Hello,</p>
        
        <p>You''ve been invited by <strong>{{sender_name}}</strong> to create a new organization on blipee OS. You''ll become the account owner with full control over your organization''s sustainability data.</p>
        
        {{#if organization_name}}
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Suggested Organization Name:</strong> {{organization_name}}</p>
        </div>
        {{/if}}
        
        {{#if custom_message}}
        <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Message from {{sender_name}}:</strong></p>
            <p style="margin: 10px 0 0 0;">{{custom_message}}</p>
        </div>
        {{/if}}
        
        <p>To get started, you''ll need to:</p>
        <ol>
            <li>Create your user account with personal information</li>
            <li>Set up your organization details and preferences</li>
        </ol>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{app_url}}/signup?org_creation_token={{token}}" 
               style="background: #1A73E8; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                Create Your Account & Organization
            </a>
        </div>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>⏰ This invitation expires on:</strong> {{expires_at}}</p>
        </div>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        
        <p style="font-size: 14px; color: #666;">
            Already have a blipee OS account? 
            <a href="{{app_url}}/auth/signin?org_creation_token={{token}}">Sign in here</a> to create your organization.
        </p>
        
        <p style="font-size: 12px; color: #999; margin-top: 30px;">
            If you didn''t expect this invitation, you can safely ignore this email.
        </p>
    </div>
</body>
</html>
    ',
    'You''re invited to create your organization on blipee OS

Hello,

You''ve been invited by {{sender_name}} to create a new organization on blipee OS. You''ll become the account owner with full control.

{{#if organization_name}}Suggested Organization Name: {{organization_name}}{{/if}}

{{#if custom_message}}Message: {{custom_message}}{{/if}}

Create your account and organization: {{app_url}}/signup?org_creation_token={{token}}

This invitation expires on: {{expires_at}}

Already have an account? Sign in: {{app_url}}/auth/signin?org_creation_token={{token}}
    ',
    '["organization_name", "sender_name", "custom_message", "token", "expires_at", "app_url"]'
) ON CONFLICT (name) DO UPDATE SET
    subject = EXCLUDED.subject,
    html_content = EXCLUDED.html_content,
    text_content = EXCLUDED.text_content,
    variables = EXCLUDED.variables,
    updated_at = NOW();

-- ==============================================
-- INDEXES AND PERFORMANCE
-- ==============================================

-- Indexes for user profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_name ON user_profiles(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding ON user_profiles(onboarding_completed);

-- Indexes for organizations
CREATE INDEX IF NOT EXISTS idx_organizations_owner ON organizations(account_owner_id);
CREATE INDEX IF NOT EXISTS idx_organizations_setup_step ON organizations(setup_step);
CREATE INDEX IF NOT EXISTS idx_organizations_onboarding ON organizations(onboarding_completed);

-- Indexes for onboarding progress
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_user ON onboarding_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_org ON onboarding_progress(organization_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_step ON onboarding_progress(step_name);

-- ==============================================
-- FINAL NOTIFICATIONS
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Organization Invitation Integration Complete!';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Database enhancements:';
    RAISE NOTICE '  ✅ User profiles table for personal info';
    RAISE NOTICE '  ✅ Extended organizations table';
    RAISE NOTICE '  ✅ Onboarding progress tracking';
    RAISE NOTICE '  ✅ Email templates system';
    RAISE NOTICE '  ✅ Enhanced invitation validation';
    RAISE NOTICE '  ✅ Complete org creation function';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Create API endpoints';
    RAISE NOTICE '  2. Build frontend forms';
    RAISE NOTICE '  3. Test invitation flow';
    RAISE NOTICE '  4. Setup email service';
    RAISE NOTICE '=====================================================';
END $$;