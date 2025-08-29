import { NextRequest, NextResponse } from 'next/server';
import { webAuthnService } from '@/lib/auth/webauthn/service';
import { createClient } from '@/lib/supabase/server';

export async function POST(_request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get authenticated user
    const { data: { user }, _error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ _error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      credentialName,
      authenticatorSelection = {},
      excludeCredentials = true 
    } = body;

    if (!credentialName || typeof credentialName !== 'string') {
      return NextResponse.json({ _error: 'Credential name is required' }, { status: 400 });
    }

    // Get user profile for display name
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const displayName = profile?.full_name || user.email || 'User';

    // Generate registration options
    const options = await webAuthnService.generateRegistrationOptions(
      request,
      user.id,
      user.email || '',
      displayName,
      {
        authenticatorSelection,
        excludeCredentials,
      }
    );

    return NextResponse.json({
      success: true,
      options,
    });
  } catch (error) {
    console.error('WebAuthn registration options _error:', error);
    return NextResponse.json(
      { 
        _error: 'Failed to generate registration options',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}