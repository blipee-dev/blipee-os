-- Essential Role and Invitation System - Safe to run multiple times
-- This migration focuses only on the core components needed for the invitation system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================
-- SUPER ADMIN SYSTEM
-- ==============================================

-- Create super_admins table (critical for role system)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'super_admins' AND schemaname = 'public') THEN
        CREATE TABLE public.super_admins (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_by UUID REFERENCES auth.users(id),
            UNIQUE(user_id)
        );
    END IF;
END $$;

-- Enable RLS on super_admins table
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "super_admins_view_self" ON public.super_admins;
DROP POLICY IF EXISTS "super_admins_manage" ON public.super_admins;

-- Create policies for super admins
CREATE POLICY "super_admins_view_self" ON public.super_admins
    FOR SELECT
    USING (auth.uid() IN (SELECT user_id FROM public.super_admins));

CREATE POLICY "super_admins_manage" ON public.super_admins
    FOR ALL
    USING (auth.uid() IN (SELECT user_id FROM public.super_admins));

-- Function to check if a user is a super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.super_admins WHERE user_id = user_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is a super admin
CREATE OR REPLACE FUNCTION public.is_current_user_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.super_admins WHERE user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make pedro@blipee.com the super admin
DO $$
DECLARE
    pedro_user_id UUID;
BEGIN
    -- Get Pedro's user ID
    SELECT id INTO pedro_user_id
    FROM auth.users
    WHERE email = 'pedro@blipee.com';
    
    -- Insert Pedro as super admin if he exists and isn't already one
    IF pedro_user_id IS NOT NULL THEN
        INSERT INTO public.super_admins (user_id, created_by)
        VALUES (pedro_user_id, pedro_user_id)
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
END $$;

-- ==============================================
-- USER PROFILES TABLE (for invitation system)
-- ==============================================

-- Create user_profiles table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'user_profiles' AND schemaname = 'public') THEN
        CREATE TABLE public.user_profiles (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            first_name TEXT,
            last_name TEXT,
            phone TEXT,
            job_title TEXT,
            avatar_url TEXT,
            timezone TEXT DEFAULT 'UTC',
            language TEXT DEFAULT 'en',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "users_can_view_own_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "super_admins_can_view_all_profiles" ON public.user_profiles;

-- RLS policies for user_profiles
CREATE POLICY "users_can_view_own_profile" ON public.user_profiles
    FOR SELECT
    USING (auth.uid() = id OR public.is_current_user_super_admin());

CREATE POLICY "users_can_update_own_profile" ON public.user_profiles
    FOR ALL
    USING (auth.uid() = id OR public.is_current_user_super_admin());

CREATE POLICY "super_admins_can_view_all_profiles" ON public.user_profiles
    FOR SELECT
    USING (public.is_current_user_super_admin());

-- ==============================================
-- ORGANIZATION CREATION INVITATIONS TABLE
-- ==============================================

-- Create organization_creation_invitations table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'organization_creation_invitations' AND schemaname = 'public') THEN
        CREATE TABLE public.organization_creation_invitations (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            email TEXT NOT NULL,
            token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'base64url'),
            organization_name TEXT,
            sender_name TEXT,
            sender_email TEXT,
            custom_message TEXT,
            suggested_org_data JSONB DEFAULT '{}',
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            used_at TIMESTAMP WITH TIME ZONE,
            used_by UUID REFERENCES auth.users(id),
            current_uses INTEGER DEFAULT 0,
            max_uses INTEGER DEFAULT 1,
            invited_by UUID NOT NULL REFERENCES auth.users(id),
            invitation_type TEXT DEFAULT 'organization_creation',
            terms_version TEXT DEFAULT 'v1.0',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- Enable RLS on organization_creation_invitations
ALTER TABLE public.organization_creation_invitations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "super_admins_manage_invitations" ON public.organization_creation_invitations;

-- RLS policies for organization_creation_invitations
CREATE POLICY "super_admins_manage_invitations" ON public.organization_creation_invitations
    FOR ALL
    USING (public.is_current_user_super_admin());

-- ==============================================
-- INVITATION VALIDATION FUNCTION
-- ==============================================

-- Function to validate invitation tokens
CREATE OR REPLACE FUNCTION public.validate_organization_invitation_token(invitation_token TEXT)
RETURNS TABLE (
    valid BOOLEAN,
    invitation_id UUID,
    email TEXT,
    organization_name TEXT,
    sender_name TEXT,
    custom_message TEXT,
    suggested_org_data JSONB,
    expires_at TIMESTAMP WITH TIME ZONE,
    error_code TEXT,
    error_message TEXT
) AS $$
DECLARE
    invitation_record RECORD;
BEGIN
    -- Get invitation record
    SELECT * INTO invitation_record
    FROM public.organization_creation_invitations
    WHERE token = invitation_token;
    
    -- Check if invitation exists
    IF invitation_record IS NULL THEN
        RETURN QUERY SELECT 
            FALSE as valid,
            NULL::UUID as invitation_id,
            NULL::TEXT as email,
            NULL::TEXT as organization_name,
            NULL::TEXT as sender_name,
            NULL::TEXT as custom_message,
            NULL::JSONB as suggested_org_data,
            NULL::TIMESTAMP WITH TIME ZONE as expires_at,
            'INVALID_TOKEN'::TEXT as error_code,
            'Invitation token does not exist'::TEXT as error_message;
        RETURN;
    END IF;
    
    -- Check if invitation is expired
    IF invitation_record.expires_at < NOW() THEN
        RETURN QUERY SELECT 
            FALSE as valid,
            invitation_record.id,
            invitation_record.email,
            invitation_record.organization_name,
            invitation_record.sender_name,
            invitation_record.custom_message,
            invitation_record.suggested_org_data,
            invitation_record.expires_at,
            'EXPIRED'::TEXT as error_code,
            'Invitation has expired'::TEXT as error_message;
        RETURN;
    END IF;
    
    -- Check if invitation is already used
    IF invitation_record.used_at IS NOT NULL THEN
        RETURN QUERY SELECT 
            FALSE as valid,
            invitation_record.id,
            invitation_record.email,
            invitation_record.organization_name,
            invitation_record.sender_name,
            invitation_record.custom_message,
            invitation_record.suggested_org_data,
            invitation_record.expires_at,
            'ALREADY_USED'::TEXT as error_code,
            'Invitation has already been used'::TEXT as error_message;
        RETURN;
    END IF;
    
    -- Check usage limits
    IF invitation_record.current_uses >= invitation_record.max_uses THEN
        RETURN QUERY SELECT 
            FALSE as valid,
            invitation_record.id,
            invitation_record.email,
            invitation_record.organization_name,
            invitation_record.sender_name,
            invitation_record.custom_message,
            invitation_record.suggested_org_data,
            invitation_record.expires_at,
            'USAGE_LIMIT_EXCEEDED'::TEXT as error_code,
            'Invitation usage limit has been exceeded'::TEXT as error_message;
        RETURN;
    END IF;
    
    -- Invitation is valid
    RETURN QUERY SELECT 
        TRUE as valid,
        invitation_record.id,
        invitation_record.email,
        invitation_record.organization_name,
        invitation_record.sender_name,
        invitation_record.custom_message,
        invitation_record.suggested_org_data,
        invitation_record.expires_at,
        NULL::TEXT as error_code,
        NULL::TEXT as error_message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- ORGANIZATION CREATION FROM INVITATION
-- ==============================================

-- Function to create organization from invitation
CREATE OR REPLACE FUNCTION public.create_org_from_invitation(
    p_token TEXT,
    p_user_id UUID,
    p_org_data JSONB,
    p_user_profile JSONB
)
RETURNS TABLE (
    success BOOLEAN,
    organization_id UUID,
    error_message TEXT
) AS $$
DECLARE
    invitation_record RECORD;
    new_org_id UUID;
    validation_result RECORD;
BEGIN
    -- Validate the invitation token
    SELECT * INTO validation_result
    FROM public.validate_organization_invitation_token(p_token)
    LIMIT 1;
    
    -- Check if validation passed
    IF NOT validation_result.valid THEN
        RETURN QUERY SELECT 
            FALSE as success,
            NULL::UUID as organization_id,
            validation_result.error_message;
        RETURN;
    END IF;
    
    -- Get the full invitation record
    SELECT * INTO invitation_record
    FROM public.organization_creation_invitations
    WHERE token = p_token;
    
    -- Verify the email matches (security check)
    IF invitation_record.email != (SELECT email FROM auth.users WHERE id = p_user_id) THEN
        RETURN QUERY SELECT 
            FALSE as success,
            NULL::UUID as organization_id,
            'Invitation email does not match authenticated user email'::TEXT;
        RETURN;
    END IF;
    
    -- Start transaction for atomic operation
    BEGIN
        -- Create user profile
        INSERT INTO public.user_profiles (
            id, first_name, last_name, phone, job_title, updated_at
        )
        VALUES (
            p_user_id,
            (p_user_profile->>'first_name'),
            (p_user_profile->>'last_name'),
            (p_user_profile->>'phone'),
            (p_user_profile->>'job_title'),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            phone = EXCLUDED.phone,
            job_title = EXCLUDED.job_title,
            updated_at = NOW();
        
        -- Create organization
        INSERT INTO public.organizations (
            name,
            slug,
            legal_name,
            industry_primary,
            company_size,
            website,
            headquarters_address,
            primary_contact_email,
            primary_contact_phone,
            compliance_frameworks,
            net_zero_target_year,
            baseline_year,
            setup_step,
            onboarding_completed
        )
        VALUES (
            (p_org_data->>'name'),
            (p_org_data->>'slug'),
            (p_org_data->>'legal_name'),
            (p_org_data->>'industry_primary'),
            (p_org_data->>'company_size'),
            (p_org_data->>'website'),
            (p_org_data->'headquarters_address'),
            (p_org_data->>'primary_contact_email'),
            (p_org_data->>'primary_contact_phone'),
            COALESCE((p_org_data->'compliance_frameworks')::TEXT[], ARRAY[]::TEXT[]),
            COALESCE((p_org_data->>'net_zero_target_year')::INTEGER, NULL),
            COALESCE((p_org_data->>'baseline_year')::INTEGER, NULL),
            'sites',
            FALSE
        )
        RETURNING id INTO new_org_id;
        
        -- Add user as account_owner
        INSERT INTO public.user_organization_roles (
            user_id, organization_id, role, assigned_by, assigned_at
        )
        VALUES (
            p_user_id, new_org_id, 'account_owner', p_user_id, NOW()
        );
        
        -- Mark invitation as used
        UPDATE public.organization_creation_invitations
        SET 
            used_at = NOW(),
            used_by = p_user_id,
            current_uses = current_uses + 1
        WHERE id = invitation_record.id;
        
        -- Return success
        RETURN QUERY SELECT 
            TRUE as success,
            new_org_id,
            NULL::TEXT as error_message;
            
    EXCEPTION WHEN OTHERS THEN
        -- Return error
        RETURN QUERY SELECT 
            FALSE as success,
            NULL::UUID as organization_id,
            SQLERRM::TEXT as error_message;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- GRANTS AND PERMISSIONS
-- ==============================================

-- Grant permissions to authenticated users
GRANT SELECT ON public.super_admins TO authenticated;
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.organization_creation_invitations TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.is_super_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_current_user_super_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_organization_invitation_token TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_org_from_invitation TO authenticated;

-- Comments for documentation
COMMENT ON TABLE public.super_admins IS 'System administrators with full platform access';
COMMENT ON TABLE public.user_profiles IS 'Extended user profile information';
COMMENT ON TABLE public.organization_creation_invitations IS 'Invitations for organization creation sent by super admins';
COMMENT ON FUNCTION public.validate_organization_invitation_token IS 'Validate and get details of an organization invitation token';
COMMENT ON FUNCTION public.create_org_from_invitation IS 'Create organization and assign roles from valid invitation token';