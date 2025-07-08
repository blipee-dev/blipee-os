import { NextRequest, NextResponse } from 'next/server';
import { getRecoveryService } from '@/lib/auth/recovery/service';
import { RecoveryMethod } from '@/lib/auth/recovery/types';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const initiateRecoverySchema = z.object({
  email: z.string().email(),
  method: z.enum([
    RecoveryMethod.EMAIL,
    RecoveryMethod.SMS,
    RecoveryMethod.SECURITY_QUESTIONS,
    RecoveryMethod.BACKUP_CODES,
    RecoveryMethod.ADMIN_OVERRIDE,
  ]),
  securityAnswers: z.array(z.string()).optional(),
  backupCode: z.string().optional(),
  adminUserId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validated = initiateRecoverySchema.parse(body);
    
    // Get recovery service
    const recoveryService = getRecoveryService();
    
    // Initiate recovery
    const result = await recoveryService.initiateRecovery(request, {
      email: validated.email,
      method: validated.method,
      securityAnswers: validated.securityAnswers,
      backupCode: validated.backupCode,
      adminUserId: validated.adminUserId,
    });
    
    return NextResponse.json({
      success: result.success,
      message: result.message,
      requiresVerification: result.requiresVerification,
    });
  } catch (error: any) {
    console.error('Recovery initiation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to initiate recovery',
      },
      { status: 500 }
    );
  }
}