import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MFAService } from '@/lib/auth/mfa/service';
import { z } from 'zod';

const setupSchema = z.object({
  method: z.enum(['totp']),
});

export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate request
    const body = await _request.json();
    const { method } = setupSchema.parse(body);

    // Initialize MFA service
    const mfaService = new MFAService();
    
    // Generate MFA setup
    const setup = await mfaService.enableMFA(user.id, method);

    return NextResponse.json({
      success: true,
      setup: {
        method: setup.method,
        qrCode: setup.qrCode,
        backupCodes: setup.backupCodes,
      }
    });
  } catch (error) {
    console.error('MFA setup error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to setup MFA' },
      { status: 500 }
    );
  }
}