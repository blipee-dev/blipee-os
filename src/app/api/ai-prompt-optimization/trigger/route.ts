import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireServerAuth } from '@/lib/auth/server-auth';
import { PermissionService } from '@/lib/auth/permission-service';

export const dynamic = 'force-dynamic';

/**
 * Manually trigger a prompt optimization job
 * Only available to super admins
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize
    const user = await requireServerAuth();
    const isSuperAdmin = await PermissionService.isSuperAdmin(user.id);

    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Super admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { job_type, job_name, config } = body;

    if (!job_type || !job_name) {
      return NextResponse.json(
        { error: 'Missing required fields: job_type, job_name' },
        { status: 400 }
      );
    }

    const validJobTypes = [
      'pattern_analysis',
      'variant_generation',
      'experiment_creation',
      'experiment_monitoring',
      'full_optimization_cycle',
    ];

    if (!validJobTypes.includes(job_type)) {
      return NextResponse.json(
        { error: `Invalid job_type. Must be one of: ${validJobTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    // Create the job
    const { data: job, error } = await supabase
      .from('ai_agent_jobs')
      .insert({
        job_type,
        job_name,
        schedule_type: 'manual',
        status: 'pending',
        config: config || {},
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating job:', error);
      return NextResponse.json(
        { error: 'Failed to create job', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      job,
      message: 'Prompt optimization job created and will be processed by Railway worker within 1 minute',
    });
  } catch (error) {
    console.error('Error in trigger API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
