import { NextRequest, NextResponse } from 'next/server';
import { getAPIUser } from '@/lib/auth/server-auth';

interface OrganizationData {
  name: string;
  slug: string;
  legal_name?: string;
  industry_primary: string;
  company_size: string;
  website?: string;
  headquarters_address: {
    street: string;
    city: string;
    postal_code?: string;
    country: string;
  };
  primary_contact_email: string;
  primary_contact_phone?: string;
  compliance_frameworks?: string[];
  net_zero_target_year?: number;
  baseline_year?: number;
}

interface UserProfile {
  first_name: string;
  last_name: string;
  phone?: string;
  job_title: string;
}

export async function POST(request: NextRequest) {
  try {
    
    // Get current user
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      token, 
      organization_data, 
      user_profile 
    }: { 
      token: string;
      organization_data: OrganizationData;
      user_profile: UserProfile;
    } = body;

    if (!token || !organization_data || !user_profile) {
      return NextResponse.json(
        { error: 'Token, organization data, and user profile are required' },
        { status: 400 }
      );
    }

    // Validate required organization fields
    if (!organization_data.name || !organization_data.slug || !organization_data.industry_primary) {
      return NextResponse.json(
        { error: 'Name, slug, and primary industry are required' },
        { status: 400 }
      );
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(organization_data.slug)) {
      return NextResponse.json(
        { error: 'Slug must contain only lowercase letters, numbers, and hyphens' },
        { status: 400 }
      );
    }

    // Check if slug is already taken
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', organization_data.slug)
      .single();

    if (existingOrg) {
      return NextResponse.json(
        { error: 'Organization slug already exists. Please choose a different one.' },
        { status: 409 }
      );
    }

    // Validate required user profile fields
    if (!user_profile.first_name || !user_profile.last_name || !user_profile.job_title) {
      return NextResponse.json(
        { error: 'First name, last name, and job title are required' },
        { status: 400 }
      );
    }

    // Create organization from invitation using database function
    const { data, error } = await supabase
      .rpc('create_org_from_invitation', {
        p_token: token,
        p_user_id: user.id,
        p_org_data: organization_data,
        p_user_profile: user_profile
      });

    if (error) {
      console.error('Error creating organization from invitation:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create organization' },
        { status: 400 }
      );
    }

    if (!data || data.length === 0 || !data[0].success) {
      return NextResponse.json(
        { error: data[0]?.error_message || 'Failed to create organization' },
        { status: 400 }
      );
    }

    const organizationId = data[0].organization_id;

    // Get the created organization details
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select(`
        id,
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
        onboarding_completed,
        created_at
      `)
      .eq('id', organizationId)
      .single();

    if (orgError) {
      console.error('Error fetching created organization:', orgError);
    }

    // Track onboarding progress
    await supabase
      .rpc('complete_onboarding_step', {
        p_user_id: user.id,
        p_organization_id: organizationId,
        p_step_name: 'organization_setup',
        p_data: {
          invitation_token: token,
          completed_at: new Date().toISOString()
        }
      });

    return NextResponse.json({
      success: true,
      organization: organization || { id: organizationId },
      message: 'Organization created successfully! You are now the account owner.',
      next_steps: {
        current_step: 'sites',
        progress: 25,
        next_action: 'Add your first site or facility'
      }
    });

  } catch (error: any) {
    console.error('Error in create organization from invitation API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}