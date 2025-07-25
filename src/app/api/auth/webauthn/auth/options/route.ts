import { NextRequest, NextResponse } from 'next/server';
import { webAuthnService } from '@/lib/auth/webauthn/service';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    const body = await request.json();
    const { userEmail, allowCredentials = [], userVerification = 'preferred' } = body;

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

    // Generate authentication options
    const options = await webAuthnService.generateAuthenticationOptions(
      request,
      userId,
      {
        allowCredentials,
        userVerification,
      }
    );

    return NextResponse.json({
      success: true,
      options,
    });
  } catch (error) {
    console.error('WebAuthn authentication options error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate authentication options',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}