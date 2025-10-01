import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

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

    // Determine baseline year dynamically
    // Use the most recent complete year of data (current year - 1)
    const currentYear = new Date().getFullYear();
    const baselineYear = currentYear - 1; // Most recent complete year

    // Also check if we have data for the baseline year
    const startOfBaseline = `${baselineYear}-01-01`;
    const endOfBaseline = `${baselineYear}-12-31`;

    // Fetch metrics data for baseline year
    let { data: metricsData, error: metricsError } = await supabaseAdmin
      .from('metrics_data')
      .select(`
        co2e_emissions,
        period_start,
        period_end,
        metrics_catalog (
          scope,
          name,
          category
        )
      `)
      .eq('organization_id', organizationId)
      .not('co2e_emissions', 'is', null)
      .gt('co2e_emissions', 0)
      .gte('period_start', startOfBaseline)
      .lte('period_end', endOfBaseline)
      .order('period_end', { ascending: false });

    if (metricsError) {
      console.error('Error fetching metrics:', metricsError);
      return NextResponse.json({ error: 'Failed to fetch emissions data' }, { status: 500 });
    }

    // Calculate total emissions and try to categorize by scope if available
    const emissionsByScope = {
      scope1: 0,
      scope2: 0,
      scope3: 0,
      total: 0,
      unscoped: 0
    };

    metricsData?.forEach(item => {
      const emissions = item.co2e_emissions || 0;
      const scope = item.metrics_catalog?.scope;

      if (scope === 'scope_1') {
        emissionsByScope.scope1 += emissions;
      } else if (scope === 'scope_2') {
        emissionsByScope.scope2 += emissions;
      } else if (scope === 'scope_3') {
        emissionsByScope.scope3 += emissions;
      } else {
        // If no scope is defined, add to unscoped
        emissionsByScope.unscoped += emissions;
      }

      emissionsByScope.total += emissions;
    });

    // Get the most recent period for reference
    const latestPeriod = metricsData?.[0]?.period_end ?
      new Date(metricsData[0].period_end).toISOString().split('T')[0] :
      null;

    // If no data for baseline year, try to find the most recent year with data
    let actualBaselineYear = baselineYear;
    if (!metricsData || metricsData.length === 0) {
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

        // Re-fetch with the actual baseline year
        const { data: historicalMetrics } = await supabaseAdmin
          .from('metrics_data')
          .select(`
            co2e_emissions,
            period_start,
            period_end,
            metrics_catalog (
              scope,
              name,
              category
            )
          `)
          .eq('organization_id', organizationId)
          .not('co2e_emissions', 'is', null)
          .gt('co2e_emissions', 0)
          .gte('period_start', `${actualBaselineYear}-01-01`)
          .lte('period_end', `${actualBaselineYear}-12-31`);

        if (historicalMetrics) {
          metricsData = historicalMetrics;
        }
      }
    }

    return NextResponse.json({
      scope1: emissionsByScope.scope1,
      scope2: emissionsByScope.scope2,
      scope3: emissionsByScope.scope3,
      unscoped: emissionsByScope.unscoped,
      total: emissionsByScope.total,
      baselineYear: actualBaselineYear,
      latestDataDate: latestPeriod,
      dataPoints: metricsData?.length || 0,
      note: `Annual baseline for ${actualBaselineYear} reporting year`
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}