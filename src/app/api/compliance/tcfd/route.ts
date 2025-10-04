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

    // Get year parameter
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

    // Fetch TCFD disclosures from database
    const { data: disclosures } = await supabaseAdmin
      .from('tcfd_disclosures')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('reporting_year', year)
      .single();

    // Fetch emissions data for Metrics & Targets pillar
    const { data: metricsData, error: metricsError } = await supabaseAdmin
      .from('metrics_data')
      .select(`
        *,
        metrics_catalog (
          code,
          scope,
          category
        )
      `)
      .eq('organization_id', organizationId)
      .gte('period_start', `${year}-01-01`)
      .lte('period_end', `${year}-12-31`);

    if (metricsError) {
      console.error('Error fetching metrics data:', metricsError);
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

    // Fetch targets from sustainability_targets table
    const targets = await fetchTCFDTargets(organizationId);

    // Calculate energy metrics
    const energyMetrics = metricsData?.filter(m =>
      m.metrics_catalog?.category === 'energy' ||
      m.metrics_catalog?.code?.includes('energy')
    ) || [];

    const totalEnergyConsumption = energyMetrics.reduce((sum, m) => {
      const value = parseFloat(m.value || 0);
      const mwhValue = m.unit?.toLowerCase() === 'kwh' ? value / 1000 : value;
      return sum + mwhValue;
    }, 0);

    const response = {
      reporting_year: year,

      // Pillar 1: Governance
      governance_oversight: disclosures?.governance_oversight || null,
      governance_management: disclosures?.governance_management || null,

      // Pillar 2: Strategy
      strategy_risks: disclosures?.strategy_risks || null,
      strategy_opportunities: disclosures?.strategy_opportunities || null,
      strategy_scenarios: disclosures?.strategy_scenarios || null,
      strategy_resilience: disclosures?.strategy_resilience || null,

      // Pillar 3: Risk Management
      risk_identification: disclosures?.risk_identification || null,
      risk_assessment: disclosures?.risk_assessment || null,
      risk_management_process: disclosures?.risk_management_process || null,
      risk_integration: disclosures?.risk_integration || null,

      // Pillar 4: Metrics & Targets (calculated from actual data)
      metrics: {
        scope_1_gross: parseFloat(scope1Gross.toFixed(2)),
        scope_2_gross_lb: parseFloat(scope2LocationBased.toFixed(2)),
        scope_2_gross_mb: parseFloat(scope2MarketBased.toFixed(2)),
        scope_3_gross: parseFloat(scope3Gross.toFixed(2)),
        total_gross: parseFloat(totalGross.toFixed(2)),
        energy_consumption_mwh: parseFloat(totalEnergyConsumption.toFixed(2)),
        description: disclosures?.metrics_description || null,
        scope123_methodology: disclosures?.metrics_scope123_methodology || null,
      },
      targets: targets,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in tcfd API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to fetch TCFD-formatted targets from sustainability_targets table
async function fetchTCFDTargets(organizationId: string) {
  const { data: targets, error } = await supabaseAdmin
    .from('sustainability_targets')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (error || !targets || targets.length === 0) {
    return null;
  }

  // Transform sustainability_targets to TCFD format
  return targets.map(target => ({
    name: target.name,
    description: target.description,
    base_year: target.baseline_year,
    target_year: target.target_year,
    baseline_value: target.baseline_value,
    target_value: target.target_value,
    current_value: target.current_value,
    unit: target.unit,
    reduction_percentage: target.baseline_value && target.target_value
      ? ((target.baseline_value - target.target_value) / target.baseline_value) * 100
      : 0,
    scopes_covered: target.scopes || [],
    status: target.status,
    sbti_validated: target.sbti_approved || false,
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

    // Upsert TCFD disclosures
    const { data: disclosures, error: disclosuresError } = await supabaseAdmin
      .from('tcfd_disclosures')
      .upsert({
        organization_id: appUser.organization_id,
        ...body,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (disclosuresError) {
      console.error('Error upserting TCFD disclosures:', disclosuresError);
      return NextResponse.json({ error: 'Failed to save TCFD disclosures' }, { status: 500 });
    }

    return NextResponse.json(disclosures);
  } catch (error) {
    console.error('Error in tcfd POST API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
