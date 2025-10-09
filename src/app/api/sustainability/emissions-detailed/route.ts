import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserOrganizationById } from '@/lib/auth/get-user-org';

export const dynamic = 'force-dynamic';

/**
 * Comprehensive emissions data endpoint for GHG reporting dashboard
 * Provides all data needed for GHG Protocol, GRI 305, ESRS E1, TCFD, and SBTi reporting
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgInfo = await getUserOrganizationById(user.id);
    if (!orgInfo.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const siteId = searchParams.get('site_id');

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'start_date and end_date required' }, { status: 400 });
    }

    console.log(`📊 Emissions Detailed API: ${startDate} to ${endDate}, site: ${siteId || 'all'}`);

    // Fetch all emissions data with full details
    let query = supabaseAdmin
      .from('metrics_data')
      .select(`
        *,
        metrics_catalog!inner(
          id,
          name,
          category,
          subcategory,
          scope,
          unit,
          emission_factor,
          ghg_gas_type
        ),
        sites(
          id,
          name,
          city,
          country,
          total_area_sqm
        )
      `)
      .eq('organization_id', orgInfo.organizationId)
      .gte('period_start', startDate)
      .lte('period_end', endDate)
      .order('period_start', { ascending: true });

    if (siteId) {
      query = query.eq('site_id', siteId);
    }

    const { data: metricsData, error: metricsError } = await query;

    if (metricsError) {
      console.error('Error fetching metrics:', metricsError);
      return NextResponse.json({ error: 'Failed to fetch emissions data' }, { status: 500 });
    }

    console.log(`📊 Fetched ${metricsData?.length || 0} records`);

    // Get organization employees count for intensity metrics
    const { data: orgData } = await supabaseAdmin
      .from('organizations')
      .select('employee_count, annual_revenue')
      .eq('id', orgInfo.organizationId)
      .single();

    // Get all sites for geographic breakdown
    let sitesQuery = supabaseAdmin
      .from('sites')
      .select('id, name, city, country, total_area_sqm')
      .eq('organization_id', orgInfo.organizationId);

    if (siteId) {
      sitesQuery = sitesQuery.eq('id', siteId);
    }

    const { data: sites } = await sitesQuery;

    // Calculate total area
    const totalAreaM2 = sites?.reduce((sum, site) => {
      const area = typeof site.total_area_sqm === 'string'
        ? parseFloat(site.total_area_sqm)
        : (site.total_area_sqm || 0);
      return sum + area;
    }, 0) || 0;

    // Process all the data
    const processedData = processEmissionsData(metricsData || [], sites || [], orgData);

    return NextResponse.json({
      ...processedData,
      metadata: {
        startDate,
        endDate,
        siteId: siteId || null,
        totalRecords: metricsData?.length || 0,
        totalAreaM2,
        employeeCount: orgData?.employee_count || 0,
        annualRevenue: orgData?.annual_revenue || 0
      }
    });

  } catch (error) {
    console.error('Error in emissions detailed API:', error);
    return NextResponse.json(
      { error: 'Failed to generate detailed emissions report' },
      { status: 500 }
    );
  }
}

function processEmissionsData(metricsData: any[], sites: any[], orgData: any) {
  // Initialize data structures
  const summary = {
    total: 0,
    scope1: 0,
    scope2: 0,
    scope3: 0,
    trend: 0
  };

  // Scope 1 breakdown by gas type
  const scope1ByGas: { [key: string]: number } = {
    co2: 0,
    ch4: 0,
    n2o: 0,
    hfcs: 0,
    pfcs: 0,
    sf6: 0,
    nf3: 0
  };

  // Scope 1 sources
  const scope1Sources = {
    stationaryCombustion: 0,
    mobileCombustion: 0,
    fugitiveEmissions: 0,
    processEmissions: 0
  };

  // Scope 2 dual reporting
  const scope2Reporting = {
    locationBased: 0,
    marketBased: 0,
    renewableImpact: 0,
    gridEmissionFactor: 0
  };

  // Scope 3 categories (all 15)
  const scope3Categories: { [key: number]: { name: string; emissions: number; tracked: boolean } } = {
    1: { name: 'Purchased Goods and Services', emissions: 0, tracked: false },
    2: { name: 'Capital Goods', emissions: 0, tracked: false },
    3: { name: 'Fuel and Energy Related Activities', emissions: 0, tracked: false },
    4: { name: 'Upstream Transportation & Distribution', emissions: 0, tracked: false },
    5: { name: 'Waste Generated in Operations', emissions: 0, tracked: false },
    6: { name: 'Business Travel', emissions: 0, tracked: false },
    7: { name: 'Employee Commuting', emissions: 0, tracked: false },
    8: { name: 'Upstream Leased Assets', emissions: 0, tracked: false },
    9: { name: 'Downstream Transportation & Distribution', emissions: 0, tracked: false },
    10: { name: 'Processing of Sold Products', emissions: 0, tracked: false },
    11: { name: 'Use of Sold Products', emissions: 0, tracked: false },
    12: { name: 'End-of-Life Treatment of Sold Products', emissions: 0, tracked: false },
    13: { name: 'Downstream Leased Assets', emissions: 0, tracked: false },
    14: { name: 'Franchises', emissions: 0, tracked: false },
    15: { name: 'Investments', emissions: 0, tracked: false }
  };

  // Comprehensive intensity metrics for all standards compliance
  const intensityMetrics = {
    // GRI 305-4 & TCFD - Common denominators
    perEmployee: 0,        // tCO2e/FTE
    perRevenue: 0,         // tCO2e/M€ (ESRS E1 mandatory)
    perSqm: 0,             // kgCO2e/m²

    // SBTi - Economic intensity (GEVA method)
    perValueAdded: 0,      // tCO2e/M€ value added

    // Sector-specific physical intensity (SBTi & GRI 305-4)
    perProduction: 0,      // tCO2e/unit (if applicable)
    productionUnit: '',    // The unit being measured (e.g., 'ton', 'MWh', 'room-night')

    // Additional metrics for comprehensive reporting
    perOperatingHour: 0,   // kgCO2e/operating hour
    perCustomer: 0,        // kgCO2e/customer served

    // Scope-specific intensities (GRI 305-4 recommendation)
    scope1: {
      perEmployee: 0,
      perRevenue: 0,
      perSqm: 0
    },
    scope2: {
      perEmployee: 0,
      perRevenue: 0,
      perSqm: 0
    },
    scope3: {
      perEmployee: 0,
      perRevenue: 0,
      perSqm: 0
    }
  };

  // Geographic breakdown
  const geographicBreakdown: { [key: string]: number } = {};

  // Multi-year trends (for TCFD/ESRS)
  const multiYearTrends: { [key: string]: { total: number; scope1: number; scope2: number; scope3: number } } = {};

  // Biogenic and other emissions
  const otherEmissions = {
    biogenicCO2: 0,
    ods: 0,
    nox: 0,
    sox: 0
  };

  // Process each record
  metricsData.forEach((record: any) => {
    const emissions = parseFloat(record.co2e_emissions) || 0;
    const scope = record.metrics_catalog?.scope;
    const category = record.metrics_catalog?.category?.toLowerCase() || '';
    const subcategory = record.metrics_catalog?.subcategory?.toLowerCase() || '';
    const gasType = record.metrics_catalog?.ghg_gas_type?.toLowerCase() || 'co2';

    // Add to totals
    summary.total += emissions;

    // Scope breakdown
    if (scope === 'scope_1') {
      summary.scope1 += emissions;

      // Gas type breakdown
      if (scope1ByGas.hasOwnProperty(gasType)) {
        scope1ByGas[gasType] += emissions;
      } else {
        scope1ByGas.co2 += emissions; // Default to CO2
      }

      // Source breakdown
      if (category.includes('stationary') || subcategory.includes('stationary')) {
        scope1Sources.stationaryCombustion += emissions;
      } else if (category.includes('mobile') || category.includes('vehicle') || category.includes('transport')) {
        scope1Sources.mobileCombustion += emissions;
      } else if (category.includes('fugitive') || subcategory.includes('fugitive')) {
        scope1Sources.fugitiveEmissions += emissions;
      } else {
        scope1Sources.processEmissions += emissions;
      }
    } else if (scope === 'scope_2') {
      summary.scope2 += emissions;

      // For now, use same value for both location and market-based
      // In real implementation, this would come from different data sources
      scope2Reporting.locationBased += emissions;
      scope2Reporting.marketBased += emissions;
    } else if (scope === 'scope_3') {
      summary.scope3 += emissions;

      // Map to Scope 3 categories based on category/subcategory
      // This is a simplified mapping - real implementation would have more detailed logic
      if (category.includes('purchase') || category.includes('supply')) {
        scope3Categories[1].emissions += emissions;
        scope3Categories[1].tracked = true;
      } else if (category.includes('travel') && category.includes('business')) {
        scope3Categories[6].emissions += emissions;
        scope3Categories[6].tracked = true;
      } else if (category.includes('commut')) {
        scope3Categories[7].emissions += emissions;
        scope3Categories[7].tracked = true;
      } else if (category.includes('waste')) {
        scope3Categories[5].emissions += emissions;
        scope3Categories[5].tracked = true;
      } else if (category.includes('transport') || category.includes('distribution')) {
        scope3Categories[4].emissions += emissions;
        scope3Categories[4].tracked = true;
      } else if (category.includes('fuel') || category.includes('energy')) {
        scope3Categories[3].emissions += emissions;
        scope3Categories[3].tracked = true;
      } else {
        // Default to category 1 if we can't determine
        scope3Categories[1].emissions += emissions;
        scope3Categories[1].tracked = true;
      }
    }

    // Geographic breakdown
    if (record.sites) {
      const location = record.sites.country || 'Unknown';
      geographicBreakdown[location] = (geographicBreakdown[location] || 0) + emissions;
    }

    // Multi-year trends
    const year = new Date(record.period_start).getFullYear().toString();
    if (!multiYearTrends[year]) {
      multiYearTrends[year] = { total: 0, scope1: 0, scope2: 0, scope3: 0 };
    }
    multiYearTrends[year].total += emissions;
    if (scope === 'scope_1') multiYearTrends[year].scope1 += emissions;
    if (scope === 'scope_2') multiYearTrends[year].scope2 += emissions;
    if (scope === 'scope_3') multiYearTrends[year].scope3 += emissions;
  });

  // Convert kg to tonnes
  summary.total = summary.total / 1000;
  summary.scope1 = summary.scope1 / 1000;
  summary.scope2 = summary.scope2 / 1000;
  summary.scope3 = summary.scope3 / 1000;

  Object.keys(scope1ByGas).forEach(key => {
    scope1ByGas[key] = scope1ByGas[key] / 1000;
  });

  scope1Sources.stationaryCombustion = scope1Sources.stationaryCombustion / 1000;
  scope1Sources.mobileCombustion = scope1Sources.mobileCombustion / 1000;
  scope1Sources.fugitiveEmissions = scope1Sources.fugitiveEmissions / 1000;
  scope1Sources.processEmissions = scope1Sources.processEmissions / 1000;

  scope2Reporting.locationBased = scope2Reporting.locationBased / 1000;
  scope2Reporting.marketBased = scope2Reporting.marketBased / 1000;

  Object.keys(scope3Categories).forEach(key => {
    scope3Categories[parseInt(key)].emissions = scope3Categories[parseInt(key)].emissions / 1000;
  });

  Object.keys(multiYearTrends).forEach(year => {
    multiYearTrends[year].total = multiYearTrends[year].total / 1000;
    multiYearTrends[year].scope1 = multiYearTrends[year].scope1 / 1000;
    multiYearTrends[year].scope2 = multiYearTrends[year].scope2 / 1000;
    multiYearTrends[year].scope3 = multiYearTrends[year].scope3 / 1000;
  });

  // Calculate comprehensive intensity metrics
  const employees = orgData?.employee_count || 0;
  const revenue = orgData?.annual_revenue || 0;
  const valueAdded = orgData?.value_added || (revenue * 0.4); // Estimate as 40% of revenue if not available
  const operatingHours = orgData?.annual_operating_hours || (employees * 2000); // Estimate 2000 hours/employee/year
  const customers = orgData?.annual_customers || 0;

  const totalAreaM2 = sites?.reduce((sum, site) => {
    const area = typeof site.total_area_sqm === 'string'
      ? parseFloat(site.total_area_sqm)
      : (site.total_area_sqm || 0);
    return sum + area;
  }, 0) || 0;

  // Total emissions intensities (GRI 305-4, ESRS E1, TCFD)
  if (employees > 0) {
    intensityMetrics.perEmployee = summary.total / employees;
  }

  if (revenue > 0) {
    intensityMetrics.perRevenue = (summary.total * 1000000) / revenue; // tCO2e per M€ (ESRS E1 mandatory)
  }

  if (totalAreaM2 > 0) {
    intensityMetrics.perSqm = (summary.total * 1000) / totalAreaM2; // kgCO2e per m²
  }

  // SBTi - Economic intensity (GEVA method)
  if (valueAdded > 0) {
    intensityMetrics.perValueAdded = (summary.total * 1000000) / valueAdded; // tCO2e per M€ value added
  }

  // Additional comprehensive metrics
  if (operatingHours > 0) {
    intensityMetrics.perOperatingHour = (summary.total * 1000) / operatingHours; // kgCO2e per operating hour
  }

  if (customers > 0) {
    intensityMetrics.perCustomer = (summary.total * 1000) / customers; // kgCO2e per customer
  }

  // Scope-specific intensities (GRI 305-4 separate reporting recommendation)
  if (employees > 0) {
    intensityMetrics.scope1.perEmployee = summary.scope1 / employees;
    intensityMetrics.scope2.perEmployee = summary.scope2 / employees;
    intensityMetrics.scope3.perEmployee = summary.scope3 / employees;
  }

  if (revenue > 0) {
    intensityMetrics.scope1.perRevenue = (summary.scope1 * 1000000) / revenue;
    intensityMetrics.scope2.perRevenue = (summary.scope2 * 1000000) / revenue;
    intensityMetrics.scope3.perRevenue = (summary.scope3 * 1000000) / revenue;
  }

  if (totalAreaM2 > 0) {
    intensityMetrics.scope1.perSqm = (summary.scope1 * 1000) / totalAreaM2;
    intensityMetrics.scope2.perSqm = (summary.scope2 * 1000) / totalAreaM2;
    intensityMetrics.scope3.perSqm = (summary.scope3 * 1000) / totalAreaM2;
  }

  // Calculate Scope 3 coverage
  const trackedCategories = Object.values(scope3Categories).filter(cat => cat.tracked).length;
  const scope3Coverage = (trackedCategories / 15) * 100;

  // Data quality assessment
  const dataQuality = {
    totalRecords: metricsData.length,
    verified: metricsData.filter(r => r.is_verified).length,
    estimated: metricsData.filter(r => r.is_estimate).length,
    measured: metricsData.filter(r => !r.is_estimate).length,
    qualityScore: 0
  };

  dataQuality.qualityScore = dataQuality.totalRecords > 0
    ? ((dataQuality.measured / dataQuality.totalRecords) * 100)
    : 0;

  console.log(`✅ Processed emissions: ${summary.total.toFixed(2)} tCO2e (Scope 1: ${summary.scope1.toFixed(2)}, Scope 2: ${summary.scope2.toFixed(2)}, Scope 3: ${summary.scope3.toFixed(2)})`);

  return {
    summary,
    scope1: {
      byGasType: scope1ByGas,
      sources: scope1Sources
    },
    scope2: scope2Reporting,
    scope3: {
      categories: scope3Categories,
      coverage: scope3Coverage
    },
    intensityMetrics,
    geographic: Object.entries(geographicBreakdown).map(([location, emissions]) => ({
      location,
      emissions: emissions / 1000
    })),
    multiYearTrends,
    otherEmissions,
    dataQuality
  };
}
