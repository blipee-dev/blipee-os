import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Get execution logs from prompt optimization jobs
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get('job_id');
    const level = searchParams.get('level');
    const limit = parseInt(searchParams.get('limit') || '100');

    let query = supabase
      .from('ai_agent_execution_logs')
      .select('*')
      .order('logged_at', { ascending: false })
      .limit(limit);

    if (jobId) {
      query = query.eq('job_id', jobId);
    }

    if (level) {
      query = query.eq('level', level);
    }

    const { data: logs, error } = await query;

    if (error) {
      console.error('Error fetching logs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch logs', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      logs: logs || [],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in logs API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
