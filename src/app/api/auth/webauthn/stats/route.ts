import { NextRequest, NextResponse } from 'next/server';
import { getAPIUser } from '@/lib/auth/server-auth';
import { webAuthnService } from '@/lib/auth/webauthn/service';

export async function GET(_request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get authenticated user
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin privileges in any organization
    const { data: memberships } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('invitation_status', 'accepted');

    const hasAdminRole = memberships?.some(m => 
      ['account_owner', 'admin', 'sustainability_lead'].includes(m.role)
    );

    if (!hasAdminRole) {
      return NextResponse.json({ error: 'Insufficient privileges' }, { status: 403 });
    }

    // Get WebAuthn statistics
    const stats = await webAuthnService.getStats();

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { 
        _error: 'Failed to fetch WebAuthn statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}