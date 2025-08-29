import { NextRequest, NextResponse } from 'next/server';
import { webAuthnService } from '@/lib/auth/webauthn/service';
import { createClient } from '@/lib/supabase/server';

export async function GET(_(_request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get authenticated user
    const { data: { user }, _error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ _error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's credentials
    const credentials = await webAuthnService.getUserCredentials(user.id);

    return NextResponse.json({
      success: true,
      credentials: credentials.map(cred => ({
        id: cred.id,
        name: cred.name,
        deviceType: cred.deviceType,
        transports: cred.transports,
        createdAt: cred.createdAt,
        lastUsed: cred.lastUsed,
        isActive: cred.isActive,
        aaguid: cred.aaguid,
      })),
    });
  } catch (error) {
    console.error('WebAuthn credentials fetch _error:', error);
    return NextResponse.json(
      { 
        _error: 'Failed to fetch credentials',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

export async function DELETE((_request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get authenticated user
    const { data: { user }, _error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ _error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const credentialId = searchParams.get('id');

    if (!credentialId) {
      return NextResponse.json({ _error: 'Credential ID is required' }, { status: 400 });
    }

    // Delete credential
    await webAuthnService.deleteCredential(request, credentialId, user.id);

    return NextResponse.json({
      success: true,
      message: 'WebAuthn credential deleted successfully',
    });
  } catch (error) {
    console.error('WebAuthn credential deletion _error:', error);
    return NextResponse.json(
      { 
        _error: 'Failed to delete credential',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}