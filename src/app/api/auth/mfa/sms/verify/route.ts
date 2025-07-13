import { NextRequest, NextResponse } from 'next/server';
import { mfaService } from '@/lib/auth/mfa/service';
import { rateLimitService } from '@/lib/security/rate-limit/service';
import { auditService } from '@/lib/audit/service';
import { AuditEventType, AuditEventSeverity } from '@/lib/audit/types';
import { getCurrentUser } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = await rateLimitService.check(
      `sms_verify:${clientIp}`,
      'mfa_verify'
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many verification attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Get current user
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { codeId, code } = body;

    if (!codeId || !code) {
      return NextResponse.json(
        { error: 'Code ID and verification code are required' },
        { status: 400 }
      );
    }

    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: 'Invalid verification code format' },
        { status: 400 }
      );
    }

    // Verify SMS code
    const result = await mfaService.verifySMSCode(codeId, code, user.id);

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
          action: 'sms_verify_failed',
          error: result.message,
          codeId,
        },
        result: 'failure',
      });

      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    // Success audit log
    await auditService.log({
      type: AuditEventType.AUTH_MFA_VERIFIED,
      severity: AuditEventSeverity.INFO,
      actor: {
        type: 'user',
        id: user.id,
        ip: clientIp,
      },
      context: {},
      metadata: {
        action: 'sms_verified',
        codeId,
        phoneNumber: result.phoneNumber?.slice(-4).padStart(result.phoneNumber?.length || 0, '*'),
      },
      result: 'success',
    });

    return NextResponse.json({
      success: true,
      message: result.message,
      phoneNumber: result.phoneNumber,
    });

  } catch (error) {
    console.error('SMS verify error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}