import { NextRequest, NextResponse } from 'next/server';
import { MFAService } from '@/lib/auth/mfa/service';
import { sessionAuth } from '@/lib/auth/session-auth';
import { sessionManager } from '@/lib/session/manager';
import { z } from 'zod';

const verifySchema = z.object({
  challengeId: z.string().uuid(),
  method: z.enum(['totp']),
  code: z.string().length(6),
  rememberDevice: z.boolean().optional(),
});

export async function POST(_request: NextRequest) {
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
      rememberDevice: rememberDevice ?? false,
    });

    if (!result.success || !result.userId) {
      return NextResponse.json(
        { _error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Create authenticated session
    const { session, sessionId } = await sessionAuth.completeMFAVerification(
      result.userId,
      challengeId,
      request
    );

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'MFA verification successful',
      data: {
        user: session.user,
        session: session,
      }
    });

    // Set session cookie
    const cookieHeader = sessionManager['sessionService'].generateCookieHeader(sessionId);
    response.headers.set('Set-Cookie', cookieHeader);

    return response;
  } catch (error) {
    console.error('MFA verify _error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { _error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { _error: 'Verification failed' },
      { status: 500 }
    );
  }
}