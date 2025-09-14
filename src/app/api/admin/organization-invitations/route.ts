import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { isSuperAdmin } from '@/lib/auth/super-admin';
import { adminInvitationCreateSchema, validateAndSanitize } from '@/lib/validation/schemas';

interface CreateInvitationRequest {
  email: string;
  organization_name?: string;
  custom_message?: string;
  expires_in_days?: number;
  suggested_org_data?: Record<string, any>;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Check if user is super admin
    const isSuper = await isSuperAdmin(user.id);
    if (!isSuper) {
      return NextResponse.json(
        { error: 'Unauthorized: Super admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validation = validateAndSanitize(adminInvitationCreateSchema, body);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return NextResponse.json(
        { error: 'Invalid invitation data', details: errors },
        { status: 400 }
      );
    }

    const {
      email,
      organization_name,
      custom_message,
      expires_in_days = 7,
      suggested_org_data = {}
    } = validation.data;


    // Check if there's already a pending invitation for this email
    const { data: existingInvitation } = await supabase
      .from('organization_creation_invitations')
      .select('id, expires_at, used_at')
      .eq('email', email)
      .gt('expires_at', new Date().toISOString())
      .is('used_at', null)
      .single();

    if (existingInvitation) {
      return NextResponse.json(
        { 
          error: 'An active invitation already exists for this email address',
          existing_invitation: {
            id: existingInvitation.id,
            expires_at: existingInvitation.expires_at
          }
        },
        { status: 409 }
      );
    }

    // Get sender information
    const { data: senderProfile } = await supabase
      .from('user_profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single();

    const senderName = senderProfile 
      ? `${senderProfile.first_name} ${senderProfile.last_name}`
      : user.email || 'blipee OS Administrator';

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expires_in_days);

    // Create invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('organization_creation_invitations')
      .insert({
        email,
        organization_name,
        custom_message,
        expires_at: expiresAt.toISOString(),
        invited_by: user.id,
        sender_name: senderName,
        sender_email: user.email,
        suggested_org_data,
        invitation_type: 'organization_creation',
        terms_version: 'v1.0'
      })
      .select(`
        id,
        token,
        email,
        organization_name,
        custom_message,
        expires_at,
        sender_name,
        created_at
      `)
      .single();

    if (inviteError) {
      console.error('Error creating invitation:', inviteError);
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      );
    }

    // Send invitation using Supabase Auth with custom data
    const { data: authInvite, error: emailError } = await supabase.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          // Custom data available in email template via {{.Data.field_name}}
          organization_name: organization_name || 'Your Organization',
          sender_name: senderName,
          custom_message: custom_message || '',
          invitation_type: 'organization_creation',
          invitation_token: invitation.token,
          expires_in_days: expires_in_days.toString(),
          app_name: 'blipee OS'
        },
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/organization?token=${invitation.token}`
      }
    );

    if (emailError) {
      console.error('Error sending Supabase auth invitation:', emailError);
      
      // Cleanup invitation record if auth invite fails
      await supabase
        .from('organization_creation_invitations')
        .delete()
        .eq('id', invitation.id);
      
      return NextResponse.json(
        { error: 'Failed to send invitation email: ' + emailError.message },
        { status: 500 }
      );
    }

    // Log the successful invitation
    console.log('Organization creation invitation sent successfully:', {
      invitationId: invitation.id,
      email: invitation.email,
      organizationName: invitation.organization_name,
      expiresAt: invitation.expires_at,
      authUserId: authInvite.user?.id
    });

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        organization_name: invitation.organization_name,
        sender_name: invitation.sender_name,
        expires_at: invitation.expires_at,
        invitation_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/organization?token=${invitation.token}`,
        created_at: invitation.created_at
      },
      message: 'Organization creation invitation sent successfully'
    });

  } catch (error: any) {
    console.error('Error in create organization invitation API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Check if user is super admin
    const isSuper = await isSuperAdmin(user.id);
    if (!isSuper) {
      return NextResponse.json(
        { error: 'Unauthorized: Super admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('organization_creation_invitations')
      .select(`
        id,
        email,
        organization_name,
        sender_name,
        custom_message,
        expires_at,
        used_at,
        used_by,
        current_uses,
        max_uses,
        created_at
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by status
    if (status === 'pending') {
      query = query
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString());
    } else if (status === 'used') {
      query = query.not('used_at', 'is', null);
    } else if (status === 'expired') {
      query = query
        .is('used_at', null)
        .lt('expires_at', new Date().toISOString());
    }

    const { data: invitations, error } = await query;

    if (error) {
      console.error('Error fetching invitations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch invitations' },
        { status: 500 }
      );
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('organization_creation_invitations')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      invitations: invitations || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        has_more: (count || 0) > offset + limit
      }
    });

  } catch (error: any) {
    console.error('Error in get organization invitations API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}