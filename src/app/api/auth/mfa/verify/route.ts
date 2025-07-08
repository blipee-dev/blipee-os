import { NextRequest, NextResponse } from 'next/server';
import { MFAService } from '@/lib/auth/mfa/service';
import { z } from 'zod';
import { cookies } from 'next/headers';
import crypto from 'crypto';

const verifySchema = z.object({
  challengeId: z.string().uuid(),
  method: z.enum(['totp']),
  code: z.string().length(6),
  rememberDevice: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Validate request
    const body = await request.json();
    const { challengeId, method, code, rememberDevice } = verifySchema.parse(body);

    // Initialize MFA service
    const mfaService = new MFAService();
    
    // Verify the challenge
    const result = await mfaService.verifyChallenge(challengeId, {
      method,
      code,
      rememberDevice,
    });

    if (!result.success || !result.userId) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Create session token (simplified - use proper session management)
    const sessionToken = crypto.randomUUID();
    
    // Set secure cookie
    const cookieStore = await cookies();
    cookieStore.set('mfa-session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: rememberDevice ? 30 * 24 * 60 * 60 : 60 * 60, // 30 days or 1 hour
      path: '/',
    });

    return NextResponse.json({
      success: true,
      message: 'MFA verification successful'
    });
  } catch (error) {
    console.error('MFA verify error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}