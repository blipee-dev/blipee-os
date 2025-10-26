import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Get prompt optimization jobs
 * Jobs include: pattern_analysis, variant_generation, experiment_creation, etc.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const jobType = searchParams.get('job_type');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('ai_agent_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    if (jobType) {
      query = query.eq('job_type', jobType);
    }

    const { data: jobs, error } = await query;

    if (error) {
      console.error('Error fetching jobs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch jobs', details: error.message },
        { status: 500 }
      );
    }

    // Get job statistics by type
    const { data: allJobs } = await supabase
      .from('ai_agent_jobs')
      .select('job_type, status');

    const stats = {
      total: allJobs?.length || 0,
      byStatus: {
        pending: allJobs?.filter(j => j.status === 'pending').length || 0,
        running: allJobs?.filter(j => j.status === 'running').length || 0,
        completed: allJobs?.filter(j => j.status === 'completed').length || 0,
        failed: allJobs?.filter(j => j.status === 'failed').length || 0,
      },
      byType: {
        pattern_analysis: allJobs?.filter(j => j.job_type === 'pattern_analysis').length || 0,
        variant_generation: allJobs?.filter(j => j.job_type === 'variant_generation').length || 0,
        experiment_creation: allJobs?.filter(j => j.job_type === 'experiment_creation').length || 0,
        experiment_monitoring: allJobs?.filter(j => j.job_type === 'experiment_monitoring').length || 0,
        full_optimization_cycle: allJobs?.filter(j => j.job_type === 'full_optimization_cycle').length || 0,
      },
    };

    return NextResponse.json({
      jobs: jobs || [],
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in jobs API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
