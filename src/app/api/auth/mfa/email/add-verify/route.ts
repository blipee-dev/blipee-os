import { NextRequest, NextResponse } from 'next/server';
import { mfaService } from '@/lib/auth/mfa/service';
import { rateLimitService } from '@/lib/security/rate-limit/service';
import { auditService } from '@/lib/audit/service';
import { AuditEventType, AuditEventSeverity } from '@/lib/audit/types';
import { getCurrentUser } from '@/lib/auth/session';

export async function POST((_request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = await rateLimitService.check(
      `email_add_verify:${clientIp}`,
      'mfa_verify'
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { _error: 'Too many verification attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Get current user
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { _error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { verificationId, code } = body;

    if (!verificationId || !code) {
      return NextResponse.json(
        { _error: 'Verification ID and code are required' },
        { status: 400 }
      );
    }

    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { _error: 'Invalid verification code format' },
        { status: 400 }
      );
    }

    // Verify and save email
    const result = await mfaService.verifyAndSaveEmail(
      user.id,
      verificationId,
      code
    );

    if (!result.success) {
      await auditService.log({
        type: AuditEventType.AUTH_MFA_FAILED,
        severity: AuditEventSeverity.WARNING,
        actor: {
          type: 'user',
          id: user.id,
          ip: clientIp,
        },
        context: {},
        metadata: {
          action: 'email_add_verify_failed',
          _error: result.message,
          verificationId,
          clientIp,
        },
        result: 'failure',
      });

      return NextResponse.json(
        { _error: result.message },
        { status: 400 }
      );
    }

    // Success audit log
    await auditService.log({
        type: AuditEventType.USER_UPDATED,
        severity: AuditEventSeverity.INFO,
        actor: {
          type: 'user',
          id: user.id,
          ip: clientIp,
        },
        context: {},
        metadata: {
          action: 'email_add_verified',
          verificationId,
        clientIp,
        },
        result: 'success',
      });

    return NextResponse.json({
      success: true,
      message: result.message,
    });

  } catch (error) {
    console.error('Email add verify _error:', error);
    
    return NextResponse.json(
      { _error: 'Internal server error' },
      { status: 500 }
    );
  }
}