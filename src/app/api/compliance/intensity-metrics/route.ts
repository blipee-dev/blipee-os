import { NextRequest, NextResponse } from 'next/server';
import { getAPIUser } from '@/lib/auth/server-auth';

export async function GET(request: NextRequest) {
  try {

    // Get authenticated user
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: appUser, error: appUserError } = await supabase
      .from('app_users')
      .select('organization_id')
      .eq('auth_user_id', user.id)
      .single();

    if (appUserError || !appUser) {
      return NextResponse.json({ error: 'User organization not found' }, { status: 404 });
    }

    // Get year parameter
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get('year') || new Date().getFullYear().toString();

    // Fetch total emissions for the year
    const { data: metricsData, error: metricsError } = await supabase
      .from('metrics_data')
      .select('metric_id, value, metrics_catalog!inner(code, scope)')
      .eq('organization_id', appUser.organization_id)
      .gte('period_start', `${year}-01-01`)
      .lte('period_end', `${year}-12-31`);

    if (metricsError) {
      console.error('Error fetching metrics data:', metricsError);
      return NextResponse.json({ error: 'Failed to fetch metrics data' }, { status: 500 });
    }

    // Calculate total emissions by scope
    let scope1Total = 0;
    let scope2Total = 0;
    let scope3Total = 0;

    metricsData?.forEach((metric: any) => {
      const scope = metric.metrics_catalog?.scope;
      const value = parseFloat(metric.value) || 0;

      if (scope === 'scope_1') scope1Total += value;
      else if (scope === 'scope_2') scope2Total += value;
      else if (scope === 'scope_3') scope3Total += value;
    });

    const totalEmissions = scope1Total + scope2Total + scope3Total;

    // Fetch organization data for denominators
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', appUser.organization_id)
      .single();

    if (orgError) {
      console.error('Error fetching organization data:', orgError);
      return NextResponse.json({ error: 'Failed to fetch organization data' }, { status: 500 });
    }

    // Fetch site data for floor area
    const { data: sitesData, error: sitesError } = await supabase
      .from('sites')
      .select('floor_area')
      .eq('organization_id', appUser.organization_id);

    const totalFloorArea = sitesData?.reduce((sum, site) => sum + (parseFloat(site.floor_area) || 0), 0) || 0;

    // Calculate intensity metrics
    // Note: These denominators should ideally come from a dedicated table or organization settings
    // For now, using placeholder logic
    const revenue = 10000000; // €10M placeholder - should come from organization financial data
    const fteCount = 100; // placeholder - should come from organization HR data

    const intensityMetrics = {
      year: parseInt(year),
      total_emissions_tco2e: totalEmissions,
      scope_1_tco2e: scope1Total,
      scope_2_tco2e: scope2Total,
      scope_3_tco2e: scope3Total,

      // GRI 305-4 intensity ratios
      intensity_per_revenue: revenue > 0 ? (totalEmissions / (revenue / 1000000)) : 0, // tCO2e per €M
      intensity_per_floor_area: totalFloorArea > 0 ? (totalEmissions / totalFloorArea) : 0, // tCO2e per m²
      intensity_per_fte: fteCount > 0 ? (totalEmissions / fteCount) : 0, // tCO2e per employee

      // Denominators
      revenue_eur: revenue,
      floor_area_m2: totalFloorArea,
      fte_count: fteCount,

      // Metadata
      calculation_date: new Date().toISOString(),
      methodology: 'GRI 305-4'
    };

    return NextResponse.json(intensityMetrics);
  } catch (error) {
    console.error('Error in intensity-metrics API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
