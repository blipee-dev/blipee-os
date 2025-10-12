import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

export async function GET(request: NextRequest) {
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

    // Fetch metric targets for this target
    const { data: metricTargets, error: metricsError } = await supabaseAdmin
      .from('metric_targets')
      .select(`
        *,
        metrics_catalog (
          id,
          code,
          name,
          unit,
          scope,
          category
        )
      `)
      .eq('target_id', targetId)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (metricsError) {
      console.error('Error fetching metric targets:', metricsError);
      return NextResponse.json(
        { error: 'Failed to fetch metric targets' },
        { status: 500 }
      );
    }

    // Transform the data for the frontend
    const transformedMetrics = metricTargets?.map(mt => ({
      id: mt.id,
      metric_catalog_id: mt.metric_catalog_id,
      metric_name: mt.metrics_catalog?.name || 'Unknown Metric',
      metric_code: mt.metrics_catalog?.code || '',
      scope: mt.metrics_catalog?.scope || '',
      category: mt.metrics_catalog?.category || '',
      unit: mt.metrics_catalog?.unit || '',
      baseline_value: mt.baseline_value || 0,
      baseline_emissions: mt.baseline_emissions || 0,
      target_value: mt.target_value || 0,
      target_emissions: mt.target_emissions || 0,
      reduction_percent: mt.reduction_percent || 0,
      strategy_type: mt.strategy_type || 'activity_reduction',
      confidence_level: mt.confidence_level || 'medium',
      created_at: mt.created_at
    })) || [];

    // Filter out metrics that don't have actual historical data in metrics_data table
    // We need to check if there's real data, not just targets set to 0
    const metricsWithActualData = [];

    for (const mt of transformedMetrics) {
      // Check if this metric has any actual data entries with value > 0 or co2e_emissions > 0
      const { data: hasData, error: dataError } = await supabaseAdmin
        .from('metrics_data')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('metric_id', mt.metric_catalog_id)
        .or('value.gt.0,co2e_emissions.gt.0')
        .limit(1);

      if (!dataError && hasData && hasData.length > 0) {
        metricsWithActualData.push(mt);
      } else {
        console.log(`🚫 Filtering out ${mt.metric_name} (${mt.category}): no actual historical data in metrics_data table`);
      }
    }

    console.log(`✅ Replanning metrics filtered: ${metricsWithActualData.length} metrics with actual data out of ${transformedMetrics.length} total`);

    return NextResponse.json({
      success: true,
      metricTargets: metricsWithActualData,
      count: metricsWithActualData.length
    });

  } catch (error) {
    console.error('Error in metrics API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
