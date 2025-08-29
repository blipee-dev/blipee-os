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
      return NextResponse.json({ _error: 'Insufficient privileges' }, { status: 403 });
    }

    // Get WebAuthn statistics
    const stats = await webAuthnService.getStats();

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('WebAuthn stats fetch _error:', error);
    return NextResponse.json(
      { 
        _error: 'Failed to fetch WebAuthn statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}