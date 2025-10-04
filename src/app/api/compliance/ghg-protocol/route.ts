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

    // Get year parameter
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

    // Fetch GHG inventory settings
    const { data: settings } = await supabaseAdmin
      .from('ghg_inventory_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('reporting_year', year)
      .single();

    // Fetch emissions data for the year
    const { data: metricsData, error: metricsError } = await supabaseAdmin
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

    // Get Scope 3 categories present in data
    const scope3CategoriesInData = [...new Set(
      scope3Data
        .map(m => m.metrics_catalog?.subcategory)
        .filter(Boolean)
    )];

    const totalGross = scope1Gross + scope2MarketBased + scope3Gross;

    // Get base year data if base year is set
    let baseYearEmissions = null;
    if (settings?.base_year && settings.base_year !== year) {
      const { data: baseYearData } = await supabaseAdmin
        .from('metrics_data')
        .select(`
          *,
          metrics_catalog (
            scope
          )
        `)
        .eq('organization_id', organizationId)
        .gte('period_start', `${settings.base_year}-01-01`)
        .lte('period_end', `${settings.base_year}-12-31`);

      if (baseYearData) {
        const baseScope1 = baseYearData.filter(m => m.metrics_catalog?.scope === 'scope_1').reduce((sum, m) => sum + (m.co2e_emissions || 0), 0);
        const baseScope2 = baseYearData.filter(m => m.metrics_catalog?.scope === 'scope_2').reduce((sum, m) => sum + (m.co2e_emissions || 0), 0);
        const baseScope3 = baseYearData.filter(m => m.metrics_catalog?.scope === 'scope_3').reduce((sum, m) => sum + (m.co2e_emissions || 0), 0);

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
