import { NextRequest, NextResponse } from 'next/server';
import { getRecoveryService } from '@/lib/auth/recovery/service';
import { RecoveryMethod } from '@/lib/auth/recovery/types';
import { auditLogger } from '@/lib/audit/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const verifyRecoverySchema = z.object({
  token: z.string().min(1),
  method: z.enum([
    RecoveryMethod.EMAIL,
    RecoveryMethod.SMS,
    RecoveryMethod.SECURITY_QUESTIONS,
    RecoveryMethod.BACKUP_CODES,
    RecoveryMethod.ADMIN_OVERRIDE,
  ]),
  newPassword: z.string().min(8).optional(),
  verificationData: z.object({
    securityAnswers: z.array(z.string()).optional(),
    backupCode: z.string().optional(),
    smsCode: z.string().optional(),
  }).optional(),
});

export async function POST(_request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validated = verifyRecoverySchema.parse(body);
    
    // Get recovery service
    const recoveryService = getRecoveryService();
    
    // Verify recovery
    const verifyRequest: any = {
      token: validated.token,
      method: validated.method,
      newPassword: validated.newPassword,
    };
    
    if (validated.verificationData) {
      verifyRequest.verificationData = validated.verificationData;
    }
    
    const result = await recoveryService.verifyRecovery(request, verifyRequest);
    
    // Log recovery attempt
    if (result.success && result.userId) {
      await auditLogger.logAuthSuccess(
        request,
        result.userId,
        '', // Email would need to be fetched
        'password'
      );
    } else {
      await auditLogger.logAuthFailure(
        request,
        '',
        result.message,
        'RECOVERY_VERIFICATION_FAILED'
      );
    }
    
    return NextResponse.json({
      success: result.success,
      message: result.message,
      _userId: result.userId,
    });
  } catch (_error: any) {
    console.error('Recovery verification _error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          _error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        _error: error.message || 'Failed to verify recovery',
      },
      { status: 500 }
    );
  }
}