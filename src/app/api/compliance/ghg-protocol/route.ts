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

    // Get organization name
    const { data: org } = await supabaseAdmin
      .from('organizations')
      .select('name')
      .eq('id', organizationId)
      .single();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const siteId = searchParams.get('siteId');

    // Parallelize database queries for better performance
    const [
      { data: settings },
      { data: metricsData, error: metricsError }
    ] = await Promise.all([
      // Fetch GHG inventory settings
      supabaseAdmin
        .from('ghg_inventory_settings')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('reporting_year', year)
        .single(),

      // Fetch only necessary fields from metrics_data (not *)
      supabaseAdmin
        .from('metrics_data')
        .select(`
          co2e_emissions,
          scope2_method,
          metrics_catalog!inner (
            scope,
            subcategory
          )
        `)
        .eq('organization_id', organizationId)
        .gte('period_start', `${year}-01-01`)
        .lte('period_end', `${year}-12-31`)
        .then(result => siteId ?
          supabaseAdmin
            .from('metrics_data')
            .select(`
              co2e_emissions,
              scope2_method,
              metrics_catalog!inner (
                scope,
                subcategory
              )
            `)
            .eq('organization_id', organizationId)
            .eq('site_id', siteId)
            .gte('period_start', `${year}-01-01`)
            .lte('period_end', `${year}-12-31`)
          : result
        )
    ]);

    if (metricsError) {
      console.error('Error fetching metrics data:', metricsError);
    }

    // Optimized: Calculate all scopes in a single pass
    let scope1Gross = 0;
    let scope2LocationBased = 0;
    let scope2MarketBased = 0;
    let scope3Gross = 0;
    const scope3Categories = new Set<string>();

    metricsData?.forEach(m => {
      const emissions = m.co2e_emissions || 0;
      const scope = m.metrics_catalog?.scope;

      if (scope === 'scope_1') {
        scope1Gross += emissions;
      } else if (scope === 'scope_2') {
        if (m.scope2_method === 'market_based') {
          scope2MarketBased += emissions;
        } else {
          scope2LocationBased += emissions;
        }
      } else if (scope === 'scope_3') {
        scope3Gross += emissions;
        if (m.metrics_catalog?.subcategory) {
          scope3Categories.add(m.metrics_catalog.subcategory);
        }
      }
    });

    // If no market-based data, use location-based
    if (scope2MarketBased === 0) {
      scope2MarketBased = scope2LocationBased;
    }

    const scope3CategoriesInData = Array.from(scope3Categories);
    const totalGross = scope1Gross + scope2MarketBased + scope3Gross;

    // Get base year data if needed (optimized query)
    let baseYearEmissions = null;
    if (settings?.base_year && settings.base_year !== year) {
      const { data: baseYearData } = await supabaseAdmin
        .from('metrics_data')
        .select(`
          co2e_emissions,
          metrics_catalog!inner (
            scope
          )
        `)
        .eq('organization_id', organizationId)
        .gte('period_start', `${settings.base_year}-01-01`)
        .lte('period_end', `${settings.base_year}-12-31`);

      if (baseYearData && baseYearData.length > 0) {
        let baseScope1 = 0;
        let baseScope2 = 0;
        let baseScope3 = 0;

        baseYearData.forEach(m => {
          const emissions = m.co2e_emissions || 0;
          const scope = m.metrics_catalog?.scope;

          if (scope === 'scope_1') baseScope1 += emissions;
          else if (scope === 'scope_2') baseScope2 += emissions;
          else if (scope === 'scope_3') baseScope3 += emissions;
        });

        baseYearEmissions = {
          scope_1: parseFloat(baseScope1.toFixed(2)),
          scope_2: parseFloat(baseScope2.toFixed(2)),
          scope_3: parseFloat(baseScope3.toFixed(2)),
          total: parseFloat((baseScope1 + baseScope2 + baseScope3).toFixed(2))
        };
      }
    }

    const response = {
      reporting_year: year,
      organization_name: org?.name || 'Organization',

      // Organizational Boundary
      consolidation_approach: settings?.consolidation_approach || 'operational_control',
      reporting_entity: settings?.reporting_entity || org?.name || 'Organization',

      // Operational Boundary
      gases_covered: settings?.gases_covered || ['CO2', 'CH4', 'N2O', 'HFCs', 'PFCs', 'SF6', 'NF3'],
      gwp_standard: settings?.gwp_standard || 'IPCC AR6',

      // Base Year
      base_year: settings?.base_year || year,
      base_year_rationale: settings?.base_year_rationale || 'First complete year of data collection',
      recalculation_threshold: settings?.recalculation_threshold || 5.0,
      base_year_emissions: baseYearEmissions,

      // Reporting Period
      period_start: settings?.period_start || `${year}-01-01`,
      period_end: settings?.period_end || `${year}-12-31`,

      // Assurance
      assurance_level: settings?.assurance_level || 'not_verified',
      assurance_provider: settings?.assurance_provider || null,
      assurance_statement_url: settings?.assurance_statement_url || null,

      // Compliance Statement
      compliance_statement: settings?.compliance_statement || 'This inventory has been prepared in conformance with the GHG Protocol Corporate Accounting and Reporting Standard (Revised Edition). Scope 2 emissions are reported using both location-based and market-based methods as per the Scope 2 Guidance.',
      methodology_description: settings?.methodology_description || 'Emissions calculated using activity-based approach with region and year-specific emission factors from DEFRA, EPA, and IEA. Scope 3 categories screened per GHG Protocol Corporate Value Chain (Scope 3) Standard.',

      // Scope 3 Categories
      scope3_categories_included: settings?.scope3_categories_included || [],
      scope3_categories_in_data: scope3CategoriesInData,
      scope3_screening_rationale: settings?.scope3_screening_rationale || null,

      // Emissions Summary (from actual data)
      emissions: {
        scope_1_gross: parseFloat(scope1Gross.toFixed(2)),
        scope_2_location_based: parseFloat(scope2LocationBased.toFixed(2)),
        scope_2_market_based: parseFloat(scope2MarketBased.toFixed(2)),
        scope_3_gross: parseFloat(scope3Gross.toFixed(2)),
        total_gross: parseFloat(totalGross.toFixed(2))
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in ghg-protocol API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
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

    // Upsert GHG inventory settings
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('ghg_inventory_settings')
      .upsert({
        organization_id: appUser.organization_id,
        ...body,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (settingsError) {
      console.error('Error upserting GHG inventory settings:', settingsError);
      return NextResponse.json({ error: 'Failed to save GHG inventory settings' }, { status: 500 });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error in ghg-protocol POST API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
