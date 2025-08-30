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
      `sms_send:${clientIp}`,
      'mfa_sms_send'
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many SMS requests. Please try again later.' },
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
    const { phoneNumber, purpose = 'mfa' } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s+/g, ''))) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Send SMS verification code
    const result = await mfaService.sendSMSCode(
      user.id,
      phoneNumber.replace(/\s+/g, ''),
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
          _error: result.message,
          phoneNumber: phoneNumber.slice(-4).padStart(phoneNumber.length, '*'),
          purpose,
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
        phoneNumber: phoneNumber.slice(-4).padStart(phoneNumber.length, '*'),
        purpose,
        codeId: result.codeId,
      },
      result: 'success',
    });

    return NextResponse.json({
      success: true,
      message: result.message,
      codeId: result.codeId,
    });

  } catch (error) {
    console.error('Error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}