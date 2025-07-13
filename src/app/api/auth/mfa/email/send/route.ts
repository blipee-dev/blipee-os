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
      `email_send:${clientIp}`,
      'mfa_email_send'
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many email requests. Please try again later.' },
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
    const { email, purpose = 'mfa' } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Send email verification code
    const result = await mfaService.sendEmailCode(
      user.id,
      email.toLowerCase(),
      purpose
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
          action: 'email_send_failed',
          error: result.message,
          email: email.split('@')[0].slice(0, 2) + '***@' + email.split('@')[1],
          purpose,
          clientIp,
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
          action: 'email_send_requested',
          email: email.split('@')[0].slice(0, 2) + '***@' + email.split('@')[1],
        purpose,
        codeId: result.codeId,
        clientIp,
        },
        result: 'success',
      });

    return NextResponse.json({
      success: true,
      message: result.message,
      codeId: result.codeId,
    });

  } catch (error) {
    console.error('Email send error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}