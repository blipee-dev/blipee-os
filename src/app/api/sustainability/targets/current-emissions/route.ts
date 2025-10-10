import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getPeriodEmissions, getYearEmissions } from '@/lib/sustainability/baseline-calculator';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization using supabaseAdmin
    const { data: memberData, error: memberError } = await supabaseAdmin
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (memberError || !memberData?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const organizationId = memberData.organization_id;

    // ✅ USE CALCULATOR for current emissions (scope-by-scope rounding)
    console.log('✅ Using calculator for current emissions...');

    // Determine baseline year dynamically
    const currentYear = new Date().getFullYear();
    const baselineYear = currentYear - 1; // Most recent complete year

    // Try to get emissions for the baseline year using calculator
    let emissions = await getYearEmissions(organizationId, baselineYear);
    let actualBaselineYear = baselineYear;
    let dataPoints = 0;

    // If no data for baseline year, try to find the most recent year with data
    if (emissions.total === 0) {
      // Query for the most recent year with data
      const { data: availableYears } = await supabaseAdmin
        .from('metrics_data')
        .select('period_end')
        .eq('organization_id', organizationId)
        .not('co2e_emissions', 'is', null)
        .gt('co2e_emissions', 0)
        .order('period_end', { ascending: false })
        .limit(1);

      if (availableYears && availableYears.length > 0) {
        actualBaselineYear = new Date(availableYears[0].period_end).getFullYear();
        // Get emissions for the actual baseline year
        emissions = await getYearEmissions(organizationId, actualBaselineYear);
      }
    }

    // Get data point count for reference
    const { data: metricsData } = await supabaseAdmin
      .from('metrics_data')
      .select('co2e_emissions, period_end')
      .eq('organization_id', organizationId)
      .not('co2e_emissions', 'is', null)
      .gt('co2e_emissions', 0)
      .gte('period_start', `${actualBaselineYear}-01-01`)
      .lte('period_end', `${actualBaselineYear}-12-31`)
      .order('period_end', { ascending: false });

    dataPoints = metricsData?.length || 0;
    const latestPeriod = metricsData?.[0]?.period_end ?
      new Date(metricsData[0].period_end).toISOString().split('T')[0] :
      null;

    console.log('✅ Calculator emissions:', emissions);
    console.log(`   Baseline year: ${actualBaselineYear}, Data points: ${dataPoints}`);

    return NextResponse.json({
      scope1: emissions.scope_1,
      scope2: emissions.scope_2,
      scope3: emissions.scope_3,
      unscoped: 0, // Calculator handles all scopes properly
      total: emissions.total,
      baselineYear: actualBaselineYear,
      latestDataDate: latestPeriod,
      dataPoints: dataPoints,
      note: `Annual baseline for ${actualBaselineYear} reporting year (from calculator)`
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}