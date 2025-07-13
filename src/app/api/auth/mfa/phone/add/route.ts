import { NextRequest, NextResponse } from 'next/server';
import { mfaService } from '@/lib/auth/mfa/service';
import { rateLimitService } from '@/lib/security/rate-limit/service';
import { auditService } from '@/lib/audit/service';
import { AuditEventType, AuditEventSeverity } from '@/lib/audit/types';
import { getCurrentUser } from '@/lib/auth/session';

export async function POST(_request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = _request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = await rateLimitService.check(
      `phone_add:${clientIp}`,
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
    const body = await _request.json();
    const { phoneNumber } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    const cleanPhone = phoneNumber.replace(/\s+/g, '');
    
    if (!phoneRegex.test(cleanPhone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Use international format (e.g., +1234567890)' },
        { status: 400 }
      );
    }

    // Add phone number (sends verification)
    const result = await mfaService.addPhoneNumber(user.id, cleanPhone);

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
          action: 'phone_add_failed',
          error: result.message,
          phoneNumber: cleanPhone.slice(-4).padStart(cleanPhone.length, '*'),
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
          action: 'phone_add_requested',
          phoneNumber: cleanPhone.slice(-4).padStart(cleanPhone.length, '*'),
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
    console.error('Phone add error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest) {
  try {
    // Get current user
    const user = await getCurrentUser(_request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user phone numbers
    const phoneNumbers = await mfaService.getUserPhoneNumbers(user.id);

    return NextResponse.json({
      success: true,
      phoneNumbers: phoneNumbers.map(phone => ({
        number: phone.slice(-4).padStart(phone.length, '*'),
        masked: true,
      })),
    });

  } catch (error) {
    console.error('Phone list error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}