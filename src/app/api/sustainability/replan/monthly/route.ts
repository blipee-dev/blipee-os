import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    const { searchParams } = new URL(request.url);
    const metricTargetId = searchParams.get('metricTargetId');

    if (!metricTargetId) {
      return NextResponse.json(
        { error: 'Missing metricTargetId parameter' },
        { status: 400 }
      );
    }

    // Fetch monthly targets for this metric target
    const { data: monthlyTargets, error: monthlyError } = await supabaseAdmin
      .from('metric_targets_monthly')
      .select('*')
      .eq('metric_target_id', metricTargetId)
      .order('year', { ascending: true })
      .order('month', { ascending: true });

    if (monthlyError) {
      console.error('Error fetching monthly targets:', monthlyError);
      return NextResponse.json(
        { error: 'Failed to fetch monthly targets' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      monthlyTargets: monthlyTargets || [],
      count: monthlyTargets?.length || 0
    });

  } catch (error) {
    console.error('Error in monthly API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
