import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getUserOrganization } from '@/lib/auth/get-user-org';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const orgData = await getUserOrganization(supabase);
    if (!orgData || !orgData.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }
    const organizationId = orgData.organizationId;

    // Use supabaseAdmin to bypass RLS and get all metrics data
    const { supabaseAdmin } = await import('@/lib/supabase/admin');
    const { data: metricsData, error: dataError } = await supabaseAdmin
      .from('metrics_data')
      .select(`
        id,
        metric_id,
        site_id,
        period_start,
        period_end,
        value,
        unit,
        co2e_emissions,
        data_quality,
        verification_status,
        created_at,
        updated_at,
        metrics_catalog (
          id,
          name,
          scope,
          category,
          unit,
          code
        ),
        sites (
          id,
          name,
          location
        )
      `)
      .eq('organization_id', organizationId)
      .order('period_end', { ascending: false });

    if (dataError) {
      console.error('Error fetching metrics data:', dataError);
      return NextResponse.json({ error: 'Failed to fetch metrics data' }, { status: 500 });
    }

    // Get summary stats
    const totalEntries = metricsData?.length || 0;
    const uniqueMetrics = new Set(metricsData?.map(d => d.metric_id)).size;
    const uniqueSites = new Set(metricsData?.filter(d => d.site_id).map(d => d.site_id)).size;

    // Calculate date range
    const dates = metricsData?.map(d => new Date(d.period_end)) || [];
    const earliestDate = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : null;
    const latestDate = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : null;

    // Group by metric for easier display
    const groupedByMetric = metricsData?.reduce((acc: any, item) => {
      const metricName = item.metrics_catalog?.name || 'Unknown Metric';
      if (!acc[metricName]) {
        acc[metricName] = {
          metric: item.metrics_catalog,
          entries: []
        };
      }
      acc[metricName].entries.push({
        id: item.id,
        site: item.sites?.name || 'Organization-wide',
        period_start: item.period_start,
        period_end: item.period_end,
        value: item.value,
        unit: item.unit,
        co2e_emissions: item.co2e_emissions,
        data_quality: item.data_quality,
        verification_status: item.verification_status,
        created_at: item.created_at
      });
      return acc;
    }, {});

    return NextResponse.json({
      stats: {
        totalEntries,
        uniqueMetrics,
        uniqueSites,
        dateRange: {
          earliest: earliestDate?.toISOString().split('T')[0],
          latest: latestDate?.toISOString().split('T')[0]
        }
      },
      groupedData: groupedByMetric,
      rawData: metricsData
    });
  } catch (error) {
    console.error('Error in all metrics API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}