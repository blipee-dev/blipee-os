import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

export async function GET(request: NextRequest) {
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
