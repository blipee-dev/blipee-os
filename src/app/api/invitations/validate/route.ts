import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Validate invitation using database function
    const { data, error } = await supabase
      .rpc('validate_organization_invitation_token', { invitation_token: token });

    if (error) {
      console.error('Error validating invitation:', error);
      return NextResponse.json(
        { error: 'Failed to validate invitation' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Invalid invitation token' },
        { status: 404 }
      );
    }

    const invitation = data[0];

    if (!invitation.valid) {
      return NextResponse.json({
        valid: false,
        error: {
          code: invitation.error_code,
          message: invitation.error_message
        }
      }, { status: 400 });
    }

    // Return invitation details for valid token
    return NextResponse.json({
      valid: true,
      invitation: {
        id: invitation.invitation_id,
        email: invitation.email,
        organization_name: invitation.organization_name,
        sender_name: invitation.sender_name,
        custom_message: invitation.custom_message,
        suggested_org_data: invitation.suggested_org_data,
        expires_at: invitation.expires_at,
        terms_version: invitation.terms_version
      }
    });

  } catch (error: any) {
    console.error('Error in invitation validation API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}