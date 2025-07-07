-- Multi-Tenant Schema Migration
-- This migration adds multi-tenant support to Blipee OS

-- Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    subscription_tier VARCHAR(50) NOT NULL DEFAULT 'starter',
    subscription_status VARCHAR(50) NOT NULL DEFAULT 'trialing',
    settings JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create buildings table
CREATE TABLE IF NOT EXISTS public.buildings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state_province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(2) DEFAULT 'US',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    metadata JSONB DEFAULT '{}',
    systems_config JSONB DEFAULT '{}',
    baseline_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, slug)
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(50),
    avatar_url VARCHAR(500),
    preferences JSONB DEFAULT '{}',
    ai_personality_settings JSONB DEFAULT '{}',
    onboarding_completed BOOLEAN DEFAULT FALSE,
    onboarding_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create organization_members table
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    permissions JSONB DEFAULT '{}',
    is_owner BOOLEAN DEFAULT FALSE,
    invitation_status VARCHAR(50) DEFAULT 'pending',
    invited_by UUID REFERENCES public.user_profiles(id),
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    joined_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- Create building_assignments table
CREATE TABLE IF NOT EXISTS public.building_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    permissions JSONB DEFAULT '{}',
    areas JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.user_profiles(id),
    UNIQUE(building_id, user_id)
);

-- Create onboarding_progress table
CREATE TABLE IF NOT EXISTS public.onboarding_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    step_id VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'not_started',
    data JSONB DEFAULT '{}',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    time_spent_seconds INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, organization_id, step_id)
);

-- Create ai_context table
CREATE TABLE IF NOT EXISTS public.ai_context (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    building_id UUID REFERENCES public.buildings(id),
    user_id UUID REFERENCES public.user_profiles(id),
    context_type VARCHAR(50) NOT NULL,
    context_data JSONB NOT NULL,
    confidence_score DECIMAL(3, 2),
    learned_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update conversations table to support multi-tenant
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_buildings_org ON public.buildings(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_building_assignments_building ON public.building_assignments(building_id);
CREATE INDEX IF NOT EXISTS idx_building_assignments_user ON public.building_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_context_org ON public.ai_context(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_context_building ON public.ai_context(building_id);
CREATE INDEX IF NOT EXISTS idx_conversations_org ON public.conversations(organization_id);
CREATE INDEX IF NOT EXISTS idx_conversations_building ON public.conversations(building_id);

-- Enable Row Level Security
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.building_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_context ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Organizations: Users can only see organizations they belong to
DROP POLICY IF EXISTS "Users can view their organizations" ON public.organizations;
CREATE POLICY "Users can view their organizations" ON public.organizations
    FOR SELECT USING (
        id IN (
            SELECT organization_id 
            FROM public.organization_members 
            WHERE user_id = auth.uid() 
            AND invitation_status = 'accepted'
        )
    );

-- Buildings: Users can only see buildings in their organizations
DROP POLICY IF EXISTS "Users can view organization buildings" ON public.buildings;
CREATE POLICY "Users can view organization buildings" ON public.buildings
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.organization_members 
            WHERE user_id = auth.uid() 
            AND invitation_status = 'accepted'
        )
    );

-- Organization members: Users can see members in their organizations
DROP POLICY IF EXISTS "Users can view organization members" ON public.organization_members;
CREATE POLICY "Users can view organization members" ON public.organization_members
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.organization_members 
            WHERE user_id = auth.uid() 
            AND invitation_status = 'accepted'
        )
    );

-- Building assignments: Users can see assignments for buildings they have access to
DROP POLICY IF EXISTS "Users can view building assignments" ON public.building_assignments;
CREATE POLICY "Users can view building assignments" ON public.building_assignments
    FOR SELECT USING (
        building_id IN (
            SELECT b.id 
            FROM public.buildings b
            JOIN public.organization_members om ON b.organization_id = om.organization_id
            WHERE om.user_id = auth.uid() 
            AND om.invitation_status = 'accepted'
        )
    );

-- AI Context: Users can only see context for their organizations
DROP POLICY IF EXISTS "Users can view AI context" ON public.ai_context;
CREATE POLICY "Users can view AI context" ON public.ai_context
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.organization_members 
            WHERE user_id = auth.uid() 
            AND invitation_status = 'accepted'
        )
    );

-- Create functions for common operations

-- Function to create organization with owner
CREATE OR REPLACE FUNCTION create_organization_with_owner(
    org_name TEXT,
    org_slug TEXT,
    owner_id UUID
) RETURNS UUID AS $$
DECLARE
    new_org_id UUID;
BEGIN
    -- Create organization
    INSERT INTO public.organizations (name, slug, created_by)
    VALUES (org_name, org_slug, owner_id)
    RETURNING id INTO new_org_id;
    
    -- Add owner as organization member
    INSERT INTO public.organization_members (
        organization_id, user_id, role, is_owner, invitation_status, joined_at
    )
    VALUES (new_org_id, owner_id, 'subscription_owner', TRUE, 'accepted', NOW());
    
    RETURN new_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to invite user to organization
CREATE OR REPLACE FUNCTION invite_user_to_organization(
    org_id UUID,
    user_email TEXT,
    user_role TEXT,
    invited_by_id UUID
) RETURNS UUID AS $$
DECLARE
    invited_user_id UUID;
    invitation_id UUID;
BEGIN
    -- Get or create user profile
    SELECT id INTO invited_user_id
    FROM public.user_profiles
    WHERE email = user_email;
    
    -- Create invitation
    INSERT INTO public.organization_members (
        organization_id, user_id, role, invitation_status, invited_by, invited_at
    )
    VALUES (org_id, invited_user_id, user_role, 'pending', invited_by_id, NOW())
    RETURNING id INTO invitation_id;
    
    RETURN invitation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;