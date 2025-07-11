import { NextRequest, NextResponse } from 'next/server';
import { webAuthnService } from '@/lib/auth/webauthn/service';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    const body = await request.json();
    const { authenticationResponse, userEmail } = body;

    if (!authenticationResponse || typeof authenticationResponse !== 'object') {
      return NextResponse.json({ error: 'Authentication response is required' }, { status: 400 });
    }

    let userId: string | undefined;

    // If user email is provided, get the user ID
    if (userEmail) {
      const { data: user } = await supabase
        .from('auth.users')
        .select('id')
        .eq('email', userEmail)
        .single();

      if (user) {
        userId = user.id;
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
        error: result.error || 'Authentication verification failed',
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
    console.error('WebAuthn authentication verification error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to verify authentication',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}