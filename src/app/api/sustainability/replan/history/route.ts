import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const targetId = searchParams.get('targetId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Missing organizationId parameter' },
        { status: 400 }
      );
    }

    if (!targetId) {
      return NextResponse.json(
        { error: 'Missing targetId parameter' },
        { status: 400 }
      );
    }

    // Fetch replanning history for this target
    const { data: history, error: historyError } = await supabaseAdmin
      .from('target_replanning_history')
      .select('*')
      .eq('sustainability_target_id', targetId)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (historyError) {
      console.error('Error fetching replanning history:', historyError);
      return NextResponse.json(
        { error: 'Failed to fetch replanning history' },
        { status: 500 }
      );
    }

    // For each history entry, count associated metric targets and initiatives
    const enrichedHistory = await Promise.all(
      (history || []).map(async (entry) => {
        // Count metric targets created in this replanning
        const { count: metricCount } = await supabaseAdmin
          .from('metric_targets')
          .select('*', { count: 'exact', head: true })
          .eq('sustainability_target_id', targetId)
          .gte('created_at', entry.created_at)
          .lte('created_at', new Date(new Date(entry.created_at).getTime() + 1000).toISOString());

        // Count initiatives
        const { data: metricTargets } = await supabaseAdmin
          .from('metric_targets')
          .select('id')
          .eq('sustainability_target_id', targetId)
          .gte('created_at', entry.created_at)
          .lte('created_at', new Date(new Date(entry.created_at).getTime() + 1000).toISOString());

        let initiativeCount = 0;
        if (metricTargets && metricTargets.length > 0) {
          const { count } = await supabaseAdmin
            .from('reduction_initiatives')
            .select('*', { count: 'exact', head: true })
            .in('metric_target_id', metricTargets.map(mt => mt.id));
          initiativeCount = count || 0;
        }

        return {
          ...entry,
          metric_targets_count: metricCount || 0,
          initiatives_count: initiativeCount
        };
      })
    );

    return NextResponse.json({
      success: true,
      history: enrichedHistory,
      count: enrichedHistory.length
    });

  } catch (error) {
    console.error('Error in history API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
