import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

// Force dynamic rendering - don't prerender this API route
export const dynamic = 'force-dynamic';

/**
 * API endpoint to detect new metrics that were added after the baseline year.
 * These metrics need to be considered for baseline restatement (SBTi Approach 1).
 *
 * GET /api/sustainability/baseline/detect-new-metrics?organizationId=xxx&baselineYear=2023
 */
export async function GET(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const baselineYear = searchParams.get('baselineYear');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Missing organizationId parameter' },
        { status: 400 }
      );
    }

    if (!baselineYear) {
      return NextResponse.json(
        { error: 'Missing baselineYear parameter' },
        { status: 400 }
      );
    }


    // Query to detect metrics that started being tracked AFTER the baseline year
    const { data: newMetrics, error: metricsError } = await supabaseAdmin.rpc(
      'detect_new_metrics',
      {
        p_organization_id: organizationId,
        p_baseline_year: parseInt(baselineYear)
      }
    );

    if (metricsError) {
      console.error('Error detecting new metrics:', metricsError);

      // If the function doesn't exist yet, fall back to manual query
      if (metricsError.message?.includes('function') && metricsError.message?.includes('does not exist')) {

        // Strategy: Find metrics that have data AFTER baseline year but NO data IN baseline year

        // Step 1: Get all metrics with data after baseline year
        const { data: metricsAfterBaseline, error: afterError } = await supabaseAdmin
          .from('metrics_data')
          .select('metric_id, metrics_catalog(id, code, name, category, scope, unit)')
          .eq('organization_id', organizationId)
          .gte('period_start', `${parseInt(baselineYear) + 1}-01-01`)
          .or('value.gt.0,co2e_emissions.gt.0');

        if (afterError) {
          console.error('Fallback query error:', afterError);
          return NextResponse.json(
            { error: 'Failed to detect new metrics' },
            { status: 500 }
          );
        }

        const uniqueMetricsAfter = [...new Set(metricsAfterBaseline?.map(m => m.metric_id) || [])];

        // Step 2: Check which of these metrics have NO data in baseline year
        const newMetricsList = [];

        for (const metricId of uniqueMetricsAfter) {
          // Check if this metric has ANY data in baseline year
          const { data: baselineData, error: baselineError } = await supabaseAdmin
            .from('metrics_data')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', organizationId)
            .eq('metric_id', metricId)
            .gte('period_start', `${baselineYear}-01-01`)
            .lt('period_start', `${parseInt(baselineYear) + 1}-01-01`)
            .or('value.gt.0,co2e_emissions.gt.0')
            .limit(1);

          // If NO data in baseline year, this is a new metric
          if (!baselineError && (!baselineData || baselineData.length === 0)) {
            // Get metric details and first data date
            const { data: metricDetails, error: detailsError } = await supabaseAdmin
              .from('metrics_data')
              .select('period_start, metrics_catalog(id, code, name, category, scope, unit)')
              .eq('organization_id', organizationId)
              .eq('metric_id', metricId)
              .or('value.gt.0,co2e_emissions.gt.0')
              .order('period_start', { ascending: true })
              .limit(1);

            if (!detailsError && metricDetails && metricDetails.length > 0) {
              const metric = metricDetails[0].metrics_catalog;
              if (metric) {
                newMetricsList.push({
                  metric_id: metric.id,
                  metric_name: metric.name,
                  metric_code: metric.code,
                  category: metric.category,
                  scope: metric.scope,
                  unit: metric.unit,
                  first_data_date: metricDetails[0].period_start
                });
              }
            }
          }
        }


        return NextResponse.json({
          success: true,
          newMetrics: newMetricsList,
          count: newMetricsList.length,
          baselineYear: parseInt(baselineYear),
          needsRestatement: newMetricsList.length > 0,
          message: newMetricsList.length > 0
            ? `Found ${newMetricsList.length} metric(s) that started being tracked after ${baselineYear}. Consider restating your baseline.`
            : `All metrics were tracked in the baseline year (${baselineYear}). No restatement needed.`
        });
      }

      return NextResponse.json(
        { error: 'Failed to detect new metrics' },
        { status: 500 }
      );
    }


    return NextResponse.json({
      success: true,
      newMetrics: newMetrics || [],
      count: newMetrics?.length || 0,
      baselineYear: parseInt(baselineYear),
      needsRestatement: (newMetrics?.length || 0) > 0,
      message: (newMetrics?.length || 0) > 0
        ? `Found ${newMetrics.length} metric(s) that started being tracked after ${baselineYear}. Consider restating your baseline.`
        : `All metrics were tracked in the baseline year (${baselineYear}). No restatement needed.`
    });

  } catch (error) {
    console.error('Error in detect-new-metrics API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
