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

    // Fetch organization inventory settings for base year and gases
    const { data: inventorySettings } = await supabaseAdmin
      .from('ghg_inventory_settings')
      .select('base_year, gases_covered, consolidation_approach, period_start, period_end')
      .eq('organization_id', organizationId)
      .eq('reporting_year', year)
      .single();

    const baseYear = inventorySettings?.base_year || year;
    const gasesCovered = inventorySettings?.gases_covered || ['CO2', 'CH4', 'N2O', 'HFCs', 'PFCs', 'SF6', 'NF3'];
    const consolidationApproach = inventorySettings?.consolidation_approach || 'operational_control';
    const reportingPeriod = {
      start: inventorySettings?.period_start || `${year}-01-01`,
      end: inventorySettings?.period_end || `${year}-12-31`
    };

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

    // Calculate Scope 1 emissions
    const scope1Data = metricsData?.filter(m => m.metrics_catalog?.scope === 'scope_1') || [];
    const scope1Total = scope1Data.reduce((sum, m) => sum + (m.co2e_emissions || 0), 0);
    const scope1Biogenic = scope1Data
      .filter(m => m.metrics_catalog?.code?.includes('biogenic'))
      .reduce((sum, m) => sum + (m.co2e_emissions || 0), 0);

    // Calculate Scope 2 emissions
    const scope2Data = metricsData?.filter(m => m.metrics_catalog?.scope === 'scope_2') || [];
    const scope2LocationBased = scope2Data
      .filter(m => !m.scope2_method || m.scope2_method === 'location_based')
      .reduce((sum, m) => sum + (m.co2e_emissions || 0), 0);
    const scope2MarketBased = scope2Data
      .filter(m => m.scope2_method === 'market_based')
      .reduce((sum, m) => sum + (m.co2e_emissions || 0), 0) || scope2LocationBased;

    // Calculate Scope 3 emissions by category
    const scope3Data = metricsData?.filter(m => m.metrics_catalog?.scope === 'scope_3') || [];
    const scope3Total = scope3Data.reduce((sum, m) => sum + (m.co2e_emissions || 0), 0);

    // Group Scope 3 by category
    const scope3ByCategory = new Map<number, { name: string; emissions: number }>();

    const categoryMapping: { [key: string]: { category: number; name: string } } = {
      'purchased_goods': { category: 1, name: 'Purchased Goods & Services' },
      'capital_goods': { category: 2, name: 'Capital Goods' },
      'fuel_energy': { category: 3, name: 'Fuel & Energy Related Activities' },
      'upstream_transport': { category: 4, name: 'Upstream Transportation & Distribution' },
      'waste': { category: 5, name: 'Waste Generated in Operations' },
      'business_travel': { category: 6, name: 'Business Travel' },
      'employee_commuting': { category: 7, name: 'Employee Commuting' },
      'downstream_transport': { category: 9, name: 'Downstream Transportation & Distribution' },
      'end_of_life': { category: 12, name: 'End-of-Life Treatment of Sold Products' }
    };

    scope3Data.forEach(metric => {
      const code = metric.metrics_catalog?.code || '';
      let category = 15; // Default "Other"
      let categoryName = 'Other Indirect Emissions';

      for (const [key, value] of Object.entries(categoryMapping)) {
        if (code.includes(key)) {
          category = value.category;
          categoryName = value.name;
          break;
        }
      }

      const existing = scope3ByCategory.get(category) || { name: categoryName, emissions: 0 };
      existing.emissions += metric.co2e_emissions || 0;
      scope3ByCategory.set(category, existing);
    });

    const scope3Categories = Array.from(scope3ByCategory.entries())
      .map(([category, data]) => ({
        category,
        name: data.name,
        emissions: parseFloat(data.emissions.toFixed(2))
      }))
      .sort((a, b) => a.category - b.category);

    // Get organization data for intensity calculations
    let sitesQuery = supabaseAdmin
      .from('sites')
      .select('total_area_sqm, total_employees')
      .eq('organization_id', organizationId);

    // Filter by site if provided
    if (siteId) {
      sitesQuery = sitesQuery.eq('id', siteId);
    }

    const { data: sites } = await sitesQuery;

    const totalArea = sites?.reduce((sum, s) => sum + (s.total_area_sqm || 0), 0) || 1;
    const totalEmployees = sites?.reduce((sum, s) => sum + (s.total_employees || 0), 0) || 1;

    // Fetch organization revenue (in millions)
    const { data: orgData } = await supabaseAdmin
      .from('organizations')
      .select('annual_revenue')
      .eq('id', organizationId)
      .single();

    const revenue = (orgData?.annual_revenue || 100000000) / 1000000; // Convert to millions

    // Calculate total emissions for intensity
    const totalEmissions = scope1Total + scope2LocationBased + scope3Total;

    // Calculate intensity metrics
    const intensityRevenue = totalEmissions / revenue;
    const intensityArea = totalEmissions / (totalArea / 1000); // per 1000 m²
    const intensityFte = totalEmissions / totalEmployees;

    // Fetch base year emissions for comparison
    let baseYearQuery = supabaseAdmin
      .from('metrics_data')
      .select('co2e_emissions')
      .eq('organization_id', organizationId)
      .gte('period_start', `${baseYear}-01-01`)
      .lte('period_end', `${baseYear}-12-31`);

    // Filter by site if provided
    if (siteId) {
      baseYearQuery = baseYearQuery.eq('site_id', siteId);
    }

    const { data: baseYearMetrics } = await baseYearQuery;

    const baseYearEmissions = baseYearMetrics?.reduce((sum, m) => sum + (m.co2e_emissions || 0), 0) || totalEmissions;

    // Fetch reduction initiatives from database
    const { data: initiatives } = await supabaseAdmin
      .from('reduction_initiatives')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('implementation_year', year)
      .order('reduction_tco2e', { ascending: false });

    const reductionInitiatives = initiatives?.map(i => ({
      initiative: i.initiative_name,
      reduction: i.reduction_tco2e,
      year: i.implementation_year,
      status: i.status,
      category: i.category
    })) || [];

    const response = {
      scope1_total: parseFloat(scope1Total.toFixed(2)),
      scope1_biogenic: parseFloat(scope1Biogenic.toFixed(2)),
      scope2_location_based: parseFloat(scope2LocationBased.toFixed(2)),
      scope2_market_based: parseFloat(scope2MarketBased.toFixed(2)),
      scope3_total: parseFloat(scope3Total.toFixed(2)),
      scope3_categories: scope3Categories,
      intensity_revenue: parseFloat(intensityRevenue.toFixed(2)),
      intensity_area: parseFloat(intensityArea.toFixed(2)),
      intensity_fte: parseFloat(intensityFte.toFixed(2)),
      reduction_initiatives: reductionInitiatives,
      base_year: baseYear,
      base_year_emissions: parseFloat(baseYearEmissions.toFixed(2)),
      gases_covered: gasesCovered,
      consolidation_approach: consolidationApproach,
      reporting_period: reportingPeriod
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in GRI-305 API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
