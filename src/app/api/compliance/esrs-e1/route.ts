import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: appUser, error: appUserError } = await supabaseAdmin
      .from('app_users')
      .select('organization_id')
      .eq('auth_user_id', user.id)
      .single();

    if (appUserError || !appUser) {
      return NextResponse.json({ error: 'User organization not found' }, { status: 404 });
    }

    const organizationId = appUser.organization_id;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const siteId = searchParams.get('siteId');

    // Fetch emissions data for the current year
    let metricsQuery = supabaseAdmin
      .from('metrics_data')
      .select(`
        *,
        metrics_catalog (
          code,
          scope,
          category,
          subcategory
        )
      `)
      .eq('organization_id', organizationId)
      .gte('period_start', `${year}-01-01`)
      .lte('period_end', `${year}-12-31`);

    // Filter by site if provided
    if (siteId) {
      metricsQuery = metricsQuery.eq('site_id', siteId);
    }

    const { data: metricsData, error: metricsError } = await metricsQuery;

    if (metricsError) {
      console.error('Error fetching metrics data:', metricsError);
      return NextResponse.json({ error: 'Failed to fetch emissions data' }, { status: 500 });
    }

    // Calculate Scope 1, 2, 3 emissions
    const scope1Data = metricsData?.filter(m => m.metrics_catalog?.scope === 'scope_1') || [];
    const scope1Gross = scope1Data.reduce((sum, m) => sum + (m.co2e_emissions || 0), 0);

    const scope2Data = metricsData?.filter(m => m.metrics_catalog?.scope === 'scope_2') || [];
    const scope2LocationBased = scope2Data
      .filter(m => !m.scope2_method || m.scope2_method === 'location_based')
      .reduce((sum, m) => sum + (m.co2e_emissions || 0), 0);
    const scope2MarketBased = scope2Data
      .filter(m => m.scope2_method === 'market_based')
      .reduce((sum, m) => sum + (m.co2e_emissions || 0), 0) || scope2LocationBased;

    const scope3Data = metricsData?.filter(m => m.metrics_catalog?.scope === 'scope_3') || [];
    const scope3Gross = scope3Data.reduce((sum, m) => sum + (m.co2e_emissions || 0), 0);

    const totalGross = scope1Gross + scope2MarketBased + scope3Gross;

    // Fetch ESRS E1 qualitative disclosures from database
    const { data: disclosures } = await supabaseAdmin
      .from('esrs_e1_disclosures')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('reporting_year', year)
      .single();

    // Calculate energy consumption from metrics
    const energyMetrics = metricsData?.filter(m =>
      m.metrics_catalog?.category === 'energy' ||
      m.metrics_catalog?.code?.includes('energy')
    ) || [];

    // Convert all energy values to MWh if needed
    const totalEnergyConsumption = energyMetrics.reduce((sum, m) => {
      const value = parseFloat(m.value || 0);
      // Convert kWh to MWh if unit is kWh
      const mwhValue = m.unit?.toLowerCase() === 'kwh' ? value / 1000 : value;
      return sum + mwhValue;
    }, 0);

    const renewableEnergy = energyMetrics
      .filter(m => m.metrics_catalog?.code?.includes('renewable'))
      .reduce((sum, m) => {
        const value = parseFloat(m.value || 0);
        const mwhValue = m.unit?.toLowerCase() === 'kwh' ? value / 1000 : value;
        return sum + mwhValue;
      }, 0);

    const renewablePercentage = totalEnergyConsumption > 0
      ? (renewableEnergy / totalEnergyConsumption) * 100
      : 0;

    // Group energy by source
    const energyBySource = new Map<string, number>();
    energyMetrics.forEach(m => {
      const source = m.metrics_catalog?.subcategory || m.metrics_catalog?.category || 'Other';
      const value = parseFloat(m.value || 0);
      const mwhValue = m.unit?.toLowerCase() === 'kwh' ? value / 1000 : value;
      energyBySource.set(source, (energyBySource.get(source) || 0) + mwhValue);
    });

    const response = {
      reporting_year: year,

      // E1-1: Transition Plan (from database)
      transition_plan: disclosures?.transition_plan || null,

      // E1-2: Policies (from database)
      climate_policies: disclosures?.climate_policies || null,

      // E1-3: Actions and Resources (from database)
      mitigation_actions: disclosures?.mitigation_actions || null,
      capex_green: disclosures?.capex_green || null,
      opex_green: disclosures?.opex_green || null,

      // E1-4: Targets (from sustainability_targets table)
      targets: await fetchESRSTargets(organizationId),

      // E1-5: Energy Consumption (calculated from metrics)
      energy_consumption: totalEnergyConsumption > 0 ? {
        total_consumption: parseFloat(totalEnergyConsumption.toFixed(2)),
        renewable_percentage: parseFloat(renewablePercentage.toFixed(2)),
        by_source: Array.from(energyBySource.entries()).map(([source, value]) => ({
          source,
          value: parseFloat(value.toFixed(2))
        }))
      } : null,

      // E1-6: Gross GHG Emissions (calculated from metrics)
      scope_1_gross: parseFloat(scope1Gross.toFixed(2)),
      scope_2_gross_lb: parseFloat(scope2LocationBased.toFixed(2)),
      scope_2_gross_mb: parseFloat(scope2MarketBased.toFixed(2)),
      scope_3_gross: parseFloat(scope3Gross.toFixed(2)),
      total_gross: parseFloat(totalGross.toFixed(2)),

      // E1-7: Removals and Credits (from database)
      removals_total: disclosures?.removals_total || null,
      credits_total: disclosures?.credits_total || null,

      // E1-8: Carbon Pricing (from database)
      carbon_price_used: disclosures?.carbon_price_used || null,
      carbon_price_currency: disclosures?.carbon_price_currency || '€',

      // E1-9: Financial Effects (from database)
      financial_effects: disclosures?.financial_effects || null
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in esrs-e1 API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to fetch ESRS-formatted targets from sustainability_targets table
async function fetchESRSTargets(organizationId: string) {
  const { data: targets, error } = await supabaseAdmin
    .from('sustainability_targets')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (error || !targets || targets.length === 0) {
    return null;
  }

  // Transform sustainability_targets to ESRS E1-4 format
  return targets.map(target => ({
    target_type: target.target_type || 'Emission reduction',
    base_year: target.baseline_year,
    target_year: target.target_year,
    reduction_percentage: target.baseline_value && target.target_value
      ? ((target.baseline_value - target.target_value) / target.baseline_value) * 100
      : 0,
    scopes_covered: target.scopes || [],
    target_description: target.description || target.name,
    sbti_validated: target.sbti_approved || false,
    baseline_value: target.baseline_value,
    target_value: target.target_value,
    current_value: target.current_value,
    status: target.status
  }));
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: appUser, error: appUserError } = await supabaseAdmin
      .from('app_users')
      .select('organization_id')
      .eq('auth_user_id', user.id)
      .single();

    if (appUserError || !appUser) {
      return NextResponse.json({ error: 'User organization not found' }, { status: 404 });
    }

    const body = await request.json();

    // Upsert ESRS E1 disclosures
    const { data: disclosures, error: disclosuresError } = await supabaseAdmin
      .from('esrs_e1_disclosures')
      .upsert({
        organization_id: appUser.organization_id,
        ...body,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (disclosuresError) {
      console.error('Error upserting ESRS E1 disclosures:', disclosuresError);
      return NextResponse.json({ error: 'Failed to save ESRS E1 disclosures' }, { status: 500 });
    }

    return NextResponse.json(disclosures);
  } catch (error) {
    console.error('Error in esrs-e1 POST API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
