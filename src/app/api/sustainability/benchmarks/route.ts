import { NextResponse } from 'next/server';
import { getAPIUser } from '@/lib/auth/server-auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/sustainability/benchmarks
 * Get peer benchmark data for an organization
 *
 * Query params:
 * - industry: Industry type (default: 'Services')
 * - region: Geographic region (default: 'EU')
 * - size: Organization size category (default: '100-300')
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const industry = searchParams.get('industry') || 'Services';
    const region = searchParams.get('region') || 'EU';
    const size = searchParams.get('size') || '100-300';

    const supabase = createClient();

    // Get current user
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: userOrg } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!userOrg) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get peer benchmark data
    const { data: benchmarks, error: benchError } = await supabase
      .from('peer_benchmark_data')
      .select(`
        *,
        metric:metrics_catalog(*)
      `)
      .eq('industry', industry)
      .eq('region', region)
      .eq('size_category', size)
      .order('adoption_percent', { ascending: false });

    if (benchError) {
      console.error('Error fetching benchmarks:', benchError);
      return NextResponse.json({ error: 'Failed to fetch benchmarks' }, { status: 500 });
    }

    // Get organization's current metrics
    const { data: orgMetrics, error: metricsError } = await supabase
      .from('metrics_data')
      .select('metric_id, value, co2e_emissions')
      .eq('organization_id', userOrg.organization_id)
      .gt('value', 0);

    if (metricsError) {
      console.error('Error fetching org metrics:', metricsError);
      return NextResponse.json({ error: 'Failed to fetch organization metrics' }, { status: 500 });
    }

    // Get unique metrics tracked by org
    const trackedMetricIds = new Set(orgMetrics?.map((m: any) => m.metric_id) || []);

    // Calculate coverage metrics
    const totalBenchmarkedMetrics = benchmarks?.length || 0;
    const trackedBenchmarkedMetrics = benchmarks?.filter((b: any) =>
      trackedMetricIds.has(b.metric_catalog_id)
    ).length || 0;

    const peerAvgMetrics = benchmarks?.filter((b: any) =>
      b.adoption_percent >= 50
    ).length || 0;

    const topQuartileMetrics = benchmarks?.filter((b: any) =>
      b.adoption_percent >= 75
    ).length || 0;

    // Group benchmarks by metric type
    const grouped = {
      emissions: benchmarks?.filter((b: any) => b.metric_type === 'emissions') || [],
      water: benchmarks?.filter((b: any) => b.metric_type === 'water') || [],
      waste: benchmarks?.filter((b: any) => b.metric_type === 'waste') || [],
      energy: benchmarks?.filter((b: any) => b.metric_type === 'energy') || [],
      other: benchmarks?.filter((b: any) => !['emissions', 'water', 'waste', 'energy'].includes(b.metric_type)) || []
    };

    // Calculate org's coverage score
    const coveragePercent = totalBenchmarkedMetrics > 0
      ? (trackedBenchmarkedMetrics / totalBenchmarkedMetrics) * 100
      : 0;

    const peerAvgPercent = totalBenchmarkedMetrics > 0
      ? (peerAvgMetrics / totalBenchmarkedMetrics) * 100
      : 0;

    const topQuartilePercent = totalBenchmarkedMetrics > 0
      ? (topQuartileMetrics / totalBenchmarkedMetrics) * 100
      : 0;

    return NextResponse.json({
      benchmarks: grouped,
      coverage: {
        your_coverage: coveragePercent,
        peer_average: peerAvgPercent,
        top_quartile: topQuartilePercent,
        tracked_metrics: trackedBenchmarkedMetrics,
        total_metrics: totalBenchmarkedMetrics,
        peer_avg_metrics: peerAvgMetrics,
        top_quartile_metrics: topQuartileMetrics
      },
      peer_group: {
        industry,
        region,
        size_category: size,
        peer_count: benchmarks?.[0]?.peer_count || 0
      },
      metadata: {
        data_as_of: benchmarks?.[0]?.data_as_of || new Date().toISOString().split('T')[0],
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in benchmarks API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
