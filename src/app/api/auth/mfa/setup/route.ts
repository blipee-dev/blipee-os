import { NextRequest, NextResponse } from 'next/server';
import { getAPIUser } from '@/lib/auth/server-auth';
import { MFAService } from '@/lib/auth/mfa/service';
import { z } from 'zod';

const setupSchema = z.object({
  method: z.enum(['totp']),
});

export async function POST(request: NextRequest) {
  try {
    
    // Check authentication
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate request
    const body = await request.json();
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
    console.error('Error:', error);
    
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