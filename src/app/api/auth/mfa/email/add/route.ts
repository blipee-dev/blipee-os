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
      `email_add:${clientIp}`,
      'user_modification'
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Get current user
    const user = await getCurrentUser(_request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { email } = body;

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

    const cleanEmail = email.toLowerCase();

    // Add email (sends verification)
    const result = await mfaService.addEmail(user.id, cleanEmail);

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
          action: 'email_add_failed',
          error: result.message,
          email: cleanEmail.split('@')[0].slice(0, 2) + '***@' + cleanEmail.split('@')[1],
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
        type: AuditEventType.USER_UPDATED,
        severity: AuditEventSeverity.INFO,
        actor: {
          type: 'user',
          id: user.id,
          ip: clientIp,
        },
        context: {},
        metadata: {
          action: 'email_add_requested',
          email: cleanEmail.split('@')[0].slice(0, 2) + '***@' + cleanEmail.split('@')[1],
        verificationId: result.verificationId,
        clientIp,
        },
        result: 'success',
      });

    return NextResponse.json({
      success: true,
      message: result.message,
      verificationId: result.verificationId,
    });

  } catch (error) {
    console.error('Email add error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get current user
    const user = await getCurrentUser(_request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user emails
    const emails = await mfaService.getUserEmails(user.id);

    return NextResponse.json({
      success: true,
      emails: emails.map(email => {
        const parts = email.split('@');
        const localPart = parts[0] || '';
        const domainPart = parts[1] || '';
        return {
          email: localPart.slice(0, 2) + '***@' + domainPart,
          masked: true,
        };
      }),
    });

  } catch (error) {
    console.error('Email list error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}