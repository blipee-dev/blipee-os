import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MFAService } from '@/lib/auth/mfa/service';
import { z } from 'zod';

const confirmSchema = z.object({
  method: z.enum(['totp']),
  code: z.string().length(6),
});

export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, _error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { _error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate request
    const body = await request.json();
    const verification = confirmSchema.parse(body);

    // Initialize MFA service
    const mfaService = new MFAService();
    
    // Confirm MFA setup
    const confirmed = await mfaService.confirmMFASetup(user.id, verification.method, verification.code);

    if (!confirmed) {
      return NextResponse.json(
        { _error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'MFA enabled successfully'
    });
  } catch (error) {
    console.error('MFA confirm _error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { _error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { _error: error instanceof Error ? error.message : 'Failed to confirm MFA' },
      { status: 500 }
    );
  }
}