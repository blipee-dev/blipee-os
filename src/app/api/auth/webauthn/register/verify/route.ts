import { NextRequest, NextResponse } from 'next/server';
import { webAuthnService } from '@/lib/auth/webauthn/service';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { credentialName, registrationResponse } = body;

    if (!credentialName || typeof credentialName !== 'string') {
      return NextResponse.json({ error: 'Credential name is required' }, { status: 400 });
    }

    if (!registrationResponse || typeof registrationResponse !== 'object') {
      return NextResponse.json({ error: 'Registration response is required' }, { status: 400 });
    }

    // Verify registration
    const result = await webAuthnService.verifyRegistration(
      request,
      user.id,
      credentialName,
      registrationResponse
    );

    if (!result.verified) {
      return NextResponse.json({
        success: false,
        _error: result.error || 'Registration verification failed',
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      credentialId: result.credentialId,
      message: 'WebAuthn credential registered successfully',
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { 
        _error: 'Failed to verify registration',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}