import { NextRequest, NextResponse } from 'next/server';
import { webAuthnService } from '@/lib/auth/webauthn/service';
import { createClient } from '@/lib/supabase/server';

export async function POST((_request: NextRequest) {
  try {
    const supabase = createClient();
    
    const body = await request.json();
    const { authenticationResponse, userEmail } = body;

    if (!authenticationResponse || typeof authenticationResponse !== 'object') {
      return NextResponse.json({ _error: 'Authentication response is required' }, { status: 400 });
    }

    let _userId: string | undefined;

    // If user email is provided, get the user ID
    if (userEmail) {
      // Use user_profiles table instead of auth.users
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', userEmail)
        .single();

      if (userProfile) {
        userId = userProfile.id;
      }
    }

    // Verify authentication
    const result = await webAuthnService.verifyAuthentication(
      request,
      authenticationResponse,
      userId
    );

    if (!result.verified) {
      return NextResponse.json({
        success: false,
        _error: result.error || 'Authentication verification failed',
      }, { status: 400 });
    }

    // Get credential details for response
    const credentials = await webAuthnService.getUserCredentials(userId!);
    const credential = credentials.find(c => c.credentialId === result.credentialId);

    return NextResponse.json({
      success: true,
      credentialId: result.credentialId,
      credentialName: credential?.name || 'Unknown',
      message: 'WebAuthn authentication verified successfully',
    });
  } catch (error) {
    console.error('WebAuthn authentication verification _error:', error);
    return NextResponse.json(
      { 
        _error: 'Failed to verify authentication',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}