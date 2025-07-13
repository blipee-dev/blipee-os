import { NextRequest, NextResponse } from 'next/server';
import { getRecoveryService } from '@/lib/auth/recovery/service';
import { sessionManager } from '@/lib/session/manager';
import { auditLogger } from '@/lib/audit/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const securityQuestionsSchema = z.object({
  questions: z.array(z.object({
    question: z.string().min(1),
    answer: z.string().min(1),
  })).min(3).max(5),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const sessionCookie = request.cookies.get('blipee-session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const validation = await sessionManager.validateSession(request);
    if (!validation.valid || !validation.session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate input
    const validated = securityQuestionsSchema.parse(body);
    
    // Get recovery service
    const recoveryService = getRecoveryService();
    
    // Setup security questions
    const result = await recoveryService.setupSecurityQuestions(
      validation.session.userId,
      validated.questions
    );
    
    // Log security questions setup
    await auditLogger.logUserAction(
      request,
      'updated',
      validation.session.userId,
      [{ field: 'security_questions', oldValue: null, newValue: 'configured' }]
    );
    
    return NextResponse.json({
      success: result.success,
      message: result.message,
    });
  } catch (error: any) {
    console.error('Security questions setup error:', error);
    
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
        error: error.message || 'Failed to setup security questions',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const sessionCookie = request.cookies.get('blipee-session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const validation = await sessionManager.validateSession(request);
    if (!validation.valid || !validation.session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Get user's recovery options
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    
    const { data, error } = await supabase.rpc(
      'get_user_recovery_options',
      { p_user_id: validation.session.userId }
    );

    if (error) {
      throw error;
    }

    const recoveryOptions = (Array.isArray(data) && data[0]) || {
      email_enabled: true,
      sms_enabled: false,
      security_questions_enabled: false,
      backup_codes_enabled: false,
      phone_number: null,
      security_questions_count: 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        emailEnabled: recoveryOptions.email_enabled,
        smsEnabled: recoveryOptions.sms_enabled,
        securityQuestionsEnabled: recoveryOptions.security_questions_enabled,
        backupCodesEnabled: recoveryOptions.backup_codes_enabled,
        hasPhoneNumber: !!recoveryOptions.phone_number,
        securityQuestionsCount: recoveryOptions.security_questions_count,
      },
    });
  } catch (error: any) {
    console.error('Get recovery options error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get recovery options',
      },
      { status: 500 }
    );
  }
}