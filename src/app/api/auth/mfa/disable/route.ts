import { NextRequest, NextResponse } from 'next/server';
import { MFAService } from '@/lib/auth/mfa/service';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(_request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { _error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Initialize MFA service
    const mfaService = new MFAService();
    
    // Disable MFA
    await mfaService.disableMFA(user.id);

    return NextResponse.json({
      success: true,
      message: 'MFA disabled successfully'
    });
  } catch (error) {
    console.error('MFA disable _error:', error);
    
    return NextResponse.json(
      { _error: 'Failed to disable MFA' },
      { status: 500 }
    );
  }
}