import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Get prompt A/B testing experiments
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');

    let query = supabase
      .from('ai_prompt_experiments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: experiments, error } = await query;

    if (error) {
      console.error('Error fetching experiments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch experiments', details: error.message },
        { status: 500 }
      );
    }

    // Get experiment statistics
    const { count: activeCount } = await supabase
      .from('ai_prompt_experiments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'running');

    const { count: completedCount } = await supabase
      .from('ai_prompt_experiments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    return NextResponse.json({
      experiments: experiments || [],
      stats: {
        active: activeCount || 0,
        completed: completedCount || 0,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in experiments API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
