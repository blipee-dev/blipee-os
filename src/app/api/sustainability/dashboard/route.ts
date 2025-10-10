import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserOrganizationById } from '@/lib/auth/get-user-org';
import { SCOPE_COLORS } from '@/lib/constants/sustainability-colors';
import {
  getBaselineEmissions,
  getYearEmissions,
  getPeriodEmissions,
  getScopeBreakdown,
  getCategoryBreakdown,
  getMonthlyEmissions,
  getYoYComparison,
  getIntensityMetrics,
  getEnergyTotal,
  getWaterTotal,
  getWasteTotal,
  getTopEmissionSources
} from '@/lib/sustainability/baseline-calculator';

/**
 * Fetch all metrics data with pagination to avoid 1000-record limit
 * This ensures we get complete data even for large organizations
 */
async function fetchAllMetricsData(
  organizationId: string,
  selectFields: string,
  startDate: Date,
  endDate: Date,
  siteId?: string
): Promise<any[]> {
  let allData: any[] = [];
  let rangeStart = 0;
  const batchSize = 1000;
  let hasMore = true;

  console.log(`📊 Fetching metrics with pagination for org ${organizationId.slice(0, 8)}...`);

  while (hasMore) {
    let query = supabaseAdmin
      .from('metrics_data')
      .select(selectFields)
      .eq('organization_id', organizationId)
      .gte('period_start', startDate.toISOString())
      .lte('period_end', endDate.toISOString())
      .order('period_start', { ascending: true })
      .range(rangeStart, rangeStart + batchSize - 1);

    if (siteId && siteId !== 'all') {
      query = query.eq('site_id', siteId);
    }

    const { data: batchData, error } = await query;

    if (error) {
      console.error('❌ Error fetching batch:', error);
      throw error;
    }

    if (!batchData || batchData.length === 0) {
      hasMore = false;
      break;
    }

    allData = allData.concat(batchData);

    if (batchData.length < batchSize) {
      hasMore = false;
    } else {
      rangeStart += batchSize;
    }
  }

  console.log(`✅ Fetched ${allData.length} total records (${Math.ceil(allData.length / batchSize)} batches)`);
  return allData;
}

export async function GET(request: NextRequest) {
  console.log('🔧 API: Dashboard endpoint called');
  try {
    const supabase = await createServerSupabaseClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('🔧 API: User auth:', user ? `User ${user.id.slice(0, 8)}...` : 'Not authenticated');

    if (!user) {
      console.log('🔧 API: Returning 401 - not authenticated');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || null;
    const startDateParam = searchParams.get('start_date');
    const endDateParam = searchParams.get('end_date');
    const siteId = searchParams.get('site') || searchParams.get('site_id') || 'all';

    console.log('📅 Dashboard API: URL params - start_date:', startDateParam, 'end_date:', endDateParam, 'range:', range);

    // Get user's organization
    let organizationId: string | null = null;

    // Check if super admin
    const { data: superAdmin } = await supabase
      .from('super_admins')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    console.log('🔧 API: Is super admin:', !!superAdmin);

    if (superAdmin) {
      // Get PLMJ organization for super admin
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('name', 'PLMJ')
        .single();
      organizationId = org?.id;
      console.log('🔧 API: PLMJ org found:', organizationId);

      if (!organizationId) {
        // Fallback to first organization
        const { data: firstOrg } = await supabase
          .from('organizations')
          .select('id')
          .limit(1)
          .single();
        organizationId = firstOrg?.id;
      }
    } else {
      // Get user's organization using centralized helper
      const { organizationId: userOrgId } = await getUserOrganizationById(user.id);

      if (userOrgId) {
        organizationId = userOrgId;
      } else {
        // If no user access, try to get PLMJ organization as fallback
        const { data: plmjOrg } = await supabase
          .from('organizations')
          .select('id')
          .eq('name', 'PLMJ')
          .single();
        organizationId = plmjOrg?.id;
      }
    }

    if (!organizationId) {
      console.log('🔧 API: No organization found for user');
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    console.log('🔧 API: Using organization:', organizationId);

    // Get sites with their details for the organization - use admin to bypass RLS
    const { data: sites } = await supabaseAdmin
      .from('sites')
      .select('id, name, total_area_sqm, total_employees, type')
      .eq('organization_id', organizationId);

    console.log('📊 Dashboard API: Found', sites?.length || 0, 'sites for organization', organizationId);
    console.log('📊 Dashboard API: Sites:', sites?.map(s => ({ id: s.id, name: s.name })));

    const sitesMap = new Map(sites?.map(s => [s.id, {
      ...s,
      area_m2: s.total_area_sqm,
      employee_count: s.total_employees,
      site_type: s.type
    }]) || []);

    console.log('📊 Dashboard API: Sites with areas:', sites?.map(s => ({
      name: s.name,
      area: s.total_area_sqm
    })));

    // Calculate date range - support both explicit dates and range parameter
    const now = new Date();
    console.log('📊 Dashboard API: Current date (now):', now.toISOString());

    let startDate: Date;
    let endDate: Date;

    // If explicit dates provided, use them (like Energy API does)
    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam);
      endDate = new Date(endDateParam);
      console.log('📊 Dashboard API: Using explicit dates:', startDateParam, 'to', endDateParam);
    } else {
      // Fallback to range-based calculation
      startDate = new Date();
      endDate = new Date();

      switch (range) {
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          endDate = now;
          break;
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3);
          endDate = now;
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          endDate = now;
          break;
        case '2025':
          startDate = new Date('2025-01-01');
          endDate = new Date('2025-12-31');
          break;
        case '2024':
          startDate = new Date('2024-01-01');
          endDate = new Date('2024-12-31');
          break;
        case '2023':
          startDate = new Date('2023-01-01');
          endDate = new Date('2023-12-31');
          break;
        case '2022':
          startDate = new Date('2022-01-01');
          endDate = new Date('2022-12-31');
          break;
        case 'all':
          startDate = new Date('2020-01-01');
          endDate = now;
          break;
        default:
          // Default to current year
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = now;
      }
      console.log('📊 Dashboard API: Using range-based dates:', range);
    }

    // Fetch metrics data with pagination - use admin client for full data access
    const metricsData = await fetchAllMetricsData(
      organizationId,
      `
        *,
        metrics_catalog (
          id, name, code, unit, scope, category, subcategory,
          emission_factor, emission_factor_unit
        )
      `,
      startDate,
      endDate,
      siteId
    );

    const dataError = null; // Error handling is done in fetchAllMetricsData

    console.log('🔧 API: Query params:', { organizationId, startDate: startDate.toISOString(), endDate: endDate.toISOString(), siteId });
    console.log('🔧 API: Metrics data count:', metricsData?.length || 0);

    // Log unique site_ids in the data
    if (metricsData && metricsData.length > 0) {
      const uniqueSiteIds = [...new Set(metricsData.map(d => d.site_id).filter(Boolean))];
      console.log('📊 Dashboard API: Unique site_ids in metrics data:', uniqueSiteIds);
      console.log('📊 Dashboard API: Sample data records:', metricsData.slice(0, 3).map(d => ({
        site_id: d.site_id,
        co2e_emissions: d.co2e_emissions,
        period_start: d.period_start
      })));
    }

    if (dataError) {
      console.error('🔧 API: Error fetching metrics data:', dataError);
      throw dataError;
    }

    // Process data for dashboard
    const processedData = await processDashboardData(metricsData || [], range, sitesMap, organizationId, startDate, endDate);

    console.log('📊 Year-over-Year data in API:', {
      hasData: !!processedData.yearOverYearComparison,
      currentYear: processedData.yearOverYearComparison?.currentYear,
      previousYear: processedData.yearOverYearComparison?.previousYear,
      dataPoints: processedData.yearOverYearComparison?.data?.length
    });

    console.error('🚨 SITE COMPARISON DEBUG:', {
      siteComparisonData: processedData.siteComparison,
      siteComparisonLength: processedData.siteComparison?.length,
      sitesMapSize: sitesMap.size,
      metricsDataLength: metricsData?.length
    });

    // Log site comparison data for debugging
    console.log('📊 Site comparison data final:', {
      count: processedData.siteComparison?.length,
      sites: processedData.siteComparison?.map((s: any) => ({
        name: s.site,
        intensity: s.intensity,
        total: s.total,
        performance: s.performance
      }))
    });

    return NextResponse.json(processedData);

  } catch (error: any) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data', details: error.message },
      { status: 500 }
    );
  }
}

async function processDashboardData(
  data: any[],
  range: string,
  sitesMap: Map<string, any>,
  organizationId: string,
  providedStartDate: Date,
  providedEndDate: Date
) {
  console.log('🔧 Processing: Input data length:', data.length);
  console.log('🔧 Processing: Sites map:', Array.from(sitesMap.entries()));

  // ✅ USE CALCULATOR for emissions calculations (scope-by-scope rounding)
  console.log('✅ Using calculator for all dashboard metrics...');

  // Use provided dates (already validated and calculated in main GET function)
  const startDate = providedStartDate instanceof Date
    ? providedStartDate.toISOString().split('T')[0]
    : String(providedStartDate);
  const endDate = providedEndDate instanceof Date
    ? providedEndDate.toISOString().split('T')[0]
    : String(providedEndDate);

  console.log('📅 processDashboardData: Using dates', startDate, 'to', endDate);

  // Get emissions using calculator
  const emissions = await getPeriodEmissions(organizationId, startDate, endDate);
  const scopes = await getScopeBreakdown(organizationId, startDate, endDate);

  const totalEmissions = emissions.total;
  const scope1Emissions = emissions.scope_1;
  const scope2Emissions = emissions.scope_2;
  const scope3Emissions = emissions.scope_3;

  console.log('✅ Calculator emissions:', totalEmissions, 'tCO2e');
  console.log('✅ By scope - S1:', scope1Emissions, 'S2:', scope2Emissions, 'S3:', scope3Emissions);

  // ✅ USE CALCULATOR for YoY comparison
  let emissionsChange = 0;
  let previousEmissions = 0;

  if (range !== 'all') {
    const yoyComparison = await getYoYComparison(organizationId, startDate, endDate, 'emissions');
    emissionsChange = yoyComparison.percentageChange;
    previousEmissions = yoyComparison.previousValue;
    console.log('✅ Calculator YoY:', emissionsChange, '% (prev:', previousEmissions, 'tCO2e)');
  }

  // ✅ USE CALCULATOR for scope breakdown, trends, and categories
  // Convert scope breakdown object to array format for dashboard
  const totalForPercentage = scopes.total || 0.001; // Avoid division by zero
  const scopeBreakdown = [
    {
      name: 'Scope 1',
      value: scopes.scope_1,
      percentage: totalForPercentage > 0 ? Math.round((scopes.scope_1 / totalForPercentage) * 1000) / 10 : 0,
      color: SCOPE_COLORS.scope1
    },
    {
      name: 'Scope 2',
      value: scopes.scope_2,
      percentage: totalForPercentage > 0 ? Math.round((scopes.scope_2 / totalForPercentage) * 1000) / 10 : 0,
      color: SCOPE_COLORS.scope2
    },
    {
      name: 'Scope 3',
      value: scopes.scope_3,
      percentage: totalForPercentage > 0 ? Math.round((scopes.scope_3 / totalForPercentage) * 1000) / 10 : 0,
      color: SCOPE_COLORS.scope3
    }
  ].filter(s => s.value > 0);

  // Get monthly emissions from calculator
  // Convert Date objects to ISO date strings (YYYY-MM-DD)
  console.log('🔍 DEBUG: startDate type:', typeof startDate, 'value:', startDate);
  console.log('🔍 DEBUG: endDate type:', typeof endDate, 'value:', endDate);
  console.log('🔍 DEBUG: startDate instanceof Date?', startDate instanceof Date);

  const startDateStr = typeof startDate.toISOString === 'function'
    ? startDate.toISOString().split('T')[0]
    : String(startDate);
  const endDateStr = typeof endDate.toISOString === 'function'
    ? endDate.toISOString().split('T')[0]
    : String(endDate);
  console.log(`📅 Dashboard API: Calling getMonthlyEmissions with startDate=${startDateStr}, endDate=${endDateStr}`);
  const monthlyEmissions = await getMonthlyEmissions(organizationId, startDateStr, endDateStr);
  console.log(`📊 Dashboard API: getMonthlyEmissions returned ${monthlyEmissions.length} months`);
  console.log(`📊 Dashboard API: First 3 months from calculator:`, JSON.stringify(monthlyEmissions.slice(0, 3).map(m => ({ month: m.month, emissions: m.emissions }))));
  const trendData = formatTrendDataFromCalculator(monthlyEmissions, range);
  console.log(`📊 Dashboard API: First 3 formatted months:`, JSON.stringify(trendData.slice(0, 3).map(t => ({ month: t.month, emissions: t.emissions }))));

  // Site comparison (still needs raw data for site-specific filtering)
  console.log('📊 Dashboard API: Generating site comparison with', data.length, 'data records and', sitesMap.size, 'sites');
  const siteComparison = generateSiteComparison(data, sitesMap);
  console.log('📊 Dashboard API: Site comparison result:', siteComparison);

  // Get category breakdown from calculator
  const categories = await getCategoryBreakdown(organizationId, startDate, endDate);
  const categoryHeatmap = formatCategoryHeatmap(categories);

  // ✅ USE CALCULATOR for energy, water, waste
  const energyConsumption = await getEnergyTotal(organizationId, startDate, endDate);
  const waterUsage = await getWaterTotal(organizationId, startDate, endDate);
  const wasteGenerated = await getWasteTotal(organizationId, startDate, endDate);

  console.log('✅ Calculator metrics - Energy:', energyConsumption, 'kWh, Water:', waterUsage, 'm³, Waste:', wasteGenerated, 'kg');

  // ✅ USE CALCULATOR for YoY comparisons
  let energyChange = 0;
  let waterChange = 0;
  let wasteChange = 0;

  if (range !== 'all') {
    const energyYoY = await getYoYComparison(organizationId, startDate, endDate, 'energy');
    const waterYoY = await getYoYComparison(organizationId, startDate, endDate, 'water');
    const wasteYoY = await getYoYComparison(organizationId, startDate, endDate, 'waste');

    energyChange = energyYoY.percentageChange;
    waterChange = waterYoY.percentageChange;
    wasteChange = wasteYoY.percentageChange;

    console.log('✅ Calculator YoY changes - Energy:', energyChange, '%, Water:', waterChange, '%, Waste:', wasteChange, '%');
  }

  // ✅ USE CALCULATOR for intensity metrics
  // Calculate total area from sites
  let totalAreaM2 = 0;
  sitesMap.forEach(site => {
    const area = typeof site.total_area_sqm === 'string'
      ? parseFloat(site.total_area_sqm)
      : (site.total_area_sqm || 0);
    totalAreaM2 += area;
  });

  // Get organization data for employee count and revenue
  const { data: orgData } = await supabaseAdmin
    .from('organizations')
    .select('employee_count, annual_revenue')
    .eq('id', organizationId)
    .single();

  const intensityMetrics = await getIntensityMetrics(
    organizationId,
    startDate,
    endDate,
    orgData?.employee_count || 0,
    orgData?.annual_revenue || 0,
    totalAreaM2
  );

  console.log('✅ Calculator intensity metrics:', intensityMetrics);

  return {
    metrics: {
      totalEmissions: {
        value: totalEmissions,
        unit: 'tCO2e',
        change: emissionsChange,
        trend: emissionsChange < 0 ? 'down' : emissionsChange > 0 ? 'up' : 'stable'
      },
      energyConsumption: {
        value: Math.round(energyConsumption / 1000 * 10) / 10, // Convert kWh to MWh
        unit: 'MWh',
        change: energyChange,
        trend: energyChange < 0 ? 'down' : energyChange > 0 ? 'up' : 'stable'
      },
      waterUsage: {
        value: Math.round(waterUsage),
        unit: 'm³',
        change: waterChange,
        trend: waterChange < 0 ? 'down' : waterChange > 0 ? 'up' : 'stable'
      },
      wasteGenerated: {
        value: Math.round(wasteGenerated / 1000 * 10) / 10, // Convert kg to tons
        unit: 'tons',
        change: wasteChange,
        trend: wasteChange < 0 ? 'down' : wasteChange > 0 ? 'up' : 'stable'
      },
      carbonIntensity: {
        value: intensityMetrics.perArea || 0,
        unit: 'kgCO2e/m²',
        change: emissionsChange, // Use emissions change as proxy
        trend: emissionsChange < 0 ? 'down' : emissionsChange > 0 ? 'up' : 'stable'
      }
    },
    scopeBreakdown,
    trendData,
    siteComparison,
    categoryHeatmap,
    yearOverYearComparison: await calculateYearOverYearComparison(data, range, organizationId)
  };
}

// Helper function to format monthly emissions from calculator
function formatTrendDataFromCalculator(monthlyEmissions: any[], range: string) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return monthlyEmissions.map(m => {
    const [year, month] = m.month.split('-');
    return {
      month: `${months[parseInt(month) - 1]} ${year.slice(2)}`,
      emissions: m.emissions,
      scope1: m.scope_1,
      scope2: m.scope_2,
      scope3: m.scope_3,
      energy: 0, // TODO: Add energy to calculator monthly emissions
      water: 0,  // TODO: Add water to calculator monthly emissions
      target: 50 // More realistic monthly target
    };
  });
}

// Helper function to format category heatmap from calculator
function formatCategoryHeatmap(categories: any[]) {
  return categories.map(cat => ({
    category: cat.category,
    scope1: cat.scope_1 || 0,
    scope2: cat.scope_2 || 0,
    scope3: cat.scope_3 || 0,
    scope_1: cat.scope_1 || 0,
    scope_2: cat.scope_2 || 0,
    scope_3: cat.scope_3 || 0
  }));
}

/**
 * @deprecated Use getScopeBreakdown() from calculator instead
 * This function does DIRECT sum which gives inconsistent rounding
 */
function calculateScopeBreakdown(data: any[]) {
  const scopes = { scope_1: 0, scope_2: 0, scope_3: 0 };

  data.forEach(d => {
    const scope = d.metrics_catalog?.scope;
    if (scope && d.co2e_emissions) {
      scopes[scope] += d.co2e_emissions;
    }
  });

  const total = scopes.scope_1 + scopes.scope_2 + scopes.scope_3;

  // Only include scopes with values > 0
  const breakdown = [];

  if (scopes.scope_1 > 0) {
    breakdown.push({
      name: 'Scope 1',
      value: Math.round((scopes.scope_1 / 1000) * 10) / 10, // Convert kg to tons
      percentage: Math.round((scopes.scope_1 / total) * 1000) / 10,
      color: SCOPE_COLORS.scope1
    });
  }

  if (scopes.scope_2 > 0) {
    breakdown.push({
      name: 'Scope 2',
      value: Math.round((scopes.scope_2 / 1000) * 10) / 10, // Convert kg to tons
      percentage: Math.round((scopes.scope_2 / total) * 1000) / 10,
      color: SCOPE_COLORS.scope2
    });
  }

  if (scopes.scope_3 > 0) {
    breakdown.push({
      name: 'Scope 3',
      value: Math.round((scopes.scope_3 / 1000) * 10) / 10, // Convert kg to tons
      percentage: Math.round((scopes.scope_3 / total) * 1000) / 10,
      color: SCOPE_COLORS.scope3
    });
  }

  return breakdown;
}

/**
 * @deprecated Use getMonthlyEmissions() from calculator and formatTrendDataFromCalculator() instead
 * This function does manual monthly aggregation
 */
function generateTrendData(data: any[], range: string) {
  // Group data by month
  const monthlyData: any = {};

  data.forEach(d => {
    const date = new Date(d.period_start);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        emissions: 0,
        scope1: 0,
        scope2: 0,
        scope3: 0,
        energy: 0,
        water: 0,
        count: 0
      };
    }

    const emissionsKg = d.co2e_emissions || 0;
    monthlyData[monthKey].emissions += emissionsKg;

    // Track emissions by scope
    const scope = d.metrics_catalog?.scope;
    if (scope === 'scope_1') {
      monthlyData[monthKey].scope1 += emissionsKg;
    } else if (scope === 'scope_2') {
      monthlyData[monthKey].scope2 += emissionsKg;
    } else if (scope === 'scope_3') {
      monthlyData[monthKey].scope3 += emissionsKg;
    }

    // Add metric-specific values
    const category = d.metrics_catalog?.category;
    const unit = d.unit?.toLowerCase();

    if (category === 'Electricity' || category === 'Purchased Energy') {
      monthlyData[monthKey].energy += d.value || 0;
    } else if (category === 'Purchased Goods & Services' && (unit === 'm³' || unit === 'm3')) {
      monthlyData[monthKey].water += d.value || 0;
    }
  });

  // Convert to array and format
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Get all months in the data, sorted
  const sortedData = Object.entries(monthlyData)
    .sort((a, b) => a[0].localeCompare(b[0]));

  // If we have specific year data (2025, 2024, 2023, etc), show all months for that year
  const useAllMonths = range === '2025' || range === '2024' || range === '2023' || range === '2022';
  const dataToShow = useAllMonths ? sortedData : sortedData.slice(-12);

  return dataToShow.map(([key, values]: [string, any]) => {
      const [year, month] = key.split('-');
      return {
        month: `${months[parseInt(month) - 1]} ${year.slice(2)}`,
        emissions: Math.round((values.emissions / 1000) * 10) / 10, // Convert kg to tons
        scope1: Math.round((values.scope1 / 1000) * 10) / 10, // Convert kg to tons
        scope2: Math.round((values.scope2 / 1000) * 10) / 10, // Convert kg to tons
        scope3: Math.round((values.scope3 / 1000) * 10) / 10, // Convert kg to tons
        energy: Math.round(values.energy / 1000 * 10) / 10, // Convert to MWh
        water: Math.round(values.water),
        target: 50 // More realistic monthly target
      };
    });
}

function generateSiteComparison(data: any[], sitesMap: Map<string, any>) {
  const siteData: any = {};

  console.log('🔧 Site Comparison: Processing', data.length, 'data records');
  console.log('🔧 Site Comparison: Sites available:', Array.from(sitesMap.keys()));
  console.log('🔧 Site Comparison: Sites in map:', Array.from(sitesMap.entries()).map(([id, info]) => ({ id, name: info.name })));
  console.log('🔧 Site Comparison: Sample data site_ids:', data.slice(0, 3).map(d => d.site_id));
  console.log('🔧 Site Comparison: First data record:', data[0]);

  data.forEach(d => {
    const siteInfo = sitesMap.get(d.site_id);
    if (!siteInfo) {
      // Only log first few missing sites to avoid spam
      if (Object.keys(siteData).length < 3) {
        console.log('🔧 Site Comparison: Site not found for ID:', d.site_id);
      }
      return; // Skip if site not found
    }

    const siteName = siteInfo.name;

    if (!siteData[siteName]) {
      siteData[siteName] = {
        site: siteName,
        emissions: 0,
        energy: 0,
        water: 0,
        waste: 0,
        area: siteInfo.area_m2 || 1000, // Use actual area from database, fallback to 1000m²
        employees: siteInfo.employee_count || 10, // Use actual employee count
        siteType: siteInfo.site_type || 'office'
      };
    }

    siteData[siteName].emissions += d.co2e_emissions || 0;

    // Add metric-specific values
    const category = d.metrics_catalog?.category;
    const name = d.metrics_catalog?.name;

    if (category === 'Electricity' || category === 'Purchased Energy') {
      siteData[siteName].energy += d.value || 0;
    } else if (category === 'Purchased Goods & Services' &&
               (name === 'Water' || name === 'Wastewater')) {
      siteData[siteName].water += d.value || 0;
    } else if (category === 'Waste') {
      siteData[siteName].waste += d.value || 0;
    }
  });

  console.log('🔧 Site Comparison: Site data collected:', Object.keys(siteData));

  const result = Object.values(siteData).map((site: any) => {
    // Calculate intensity metrics using actual site data
    const emissionsKg = site.emissions || 0; // Already in kg
    const area = site.area > 0 ? site.area : 1000; // Prevent division by zero
    const employees = site.employees > 0 ? site.employees : 10;

    // Calculate emissions intensity
    const intensity = emissionsKg / area;
    const totalTons = emissionsKg / 1000; // Convert to tons

    // Industry benchmarks (kgCO2e/m²/year)
    const benchmarks: Record<string, number> = {
      office: 50,        // Good office building
      manufacturing: 150, // Efficient factory
      warehouse: 30,     // Low-energy storage
      retail: 80,        // Typical retail space
      default: 75        // Average commercial building
    };

    const targetIntensity = benchmarks[site.siteType] || benchmarks.default;
    const carbonIntensity = emissionsKg / area;

    // Determine performance based on intensity thresholds
    let performanceStatus: string;
    if (carbonIntensity <= 20) {
      performanceStatus = 'excellent'; // Very low emissions
    } else if (carbonIntensity <= 40) {
      performanceStatus = 'good';      // Below benchmark
    } else if (carbonIntensity <= 60) {
      performanceStatus = 'warning';   // Needs improvement
    } else {
      performanceStatus = 'poor';      // High emissions
    }

    return {
      site: site.site || 'Unknown',
      siteType: site.siteType || 'office',

      // Chart data - these are the main values used in the dashboard
      intensity: Math.round(carbonIntensity * 10) / 10, // kgCO2e/m² - for bar height
      total: Math.round((emissionsKg / 1000) * 10) / 10, // tons - for tooltip
      performance: performanceStatus, // For color coding

      // Absolute values (for reference)
      totalEmissions: Math.round((emissionsKg / 1000) * 10) / 10, // tons
      totalEnergy: Math.round(site.energy / 1000), // MWh

      // Intensity metrics for fair comparison
      emissions: Math.round(carbonIntensity * 10) / 10, // kgCO2e/m²
      energy: Math.round(site.energy / area), // kWh/m²

      // Performance indicator
      performanceScore: Math.round((targetIntensity / carbonIntensity) * 100), // % of target (>100% is good)
      performanceStatus: performanceStatus,

      // Additional intensity metrics
      emissionsPerEmployee: Math.round((emissionsKg / employees) * 10) / 10, // kgCO2e/employee
      energyPerEmployee: Math.round(site.energy / employees), // kWh/employee

      // Context data
      area: area,
      employees: employees,
      targetIntensity: targetIntensity,
      waterIntensity: Math.round((site.water / area) * 100) / 100, // m³/m²
      wasteIntensity: Math.round((site.waste * 1000 / area) * 10) / 10 // kg/m²
    };
  });

  console.log('🔧 Site Comparison: Final result:', result);
  return result;
}

/**
 * @deprecated Use getCategoryBreakdown() from calculator and formatCategoryHeatmap() instead
 * This function does manual category aggregation
 */
function generateCategoryHeatmap(data: any[]) {
  const categoryData: any = {};

  data.forEach(d => {
    const category = d.metrics_catalog?.category || 'Other';
    const scope = d.metrics_catalog?.scope || 'scope_1';

    if (!categoryData[category]) {
      categoryData[category] = {
        category,
        scope_1: 0,
        scope_2: 0,
        scope_3: 0
      };
    }

    categoryData[category][scope] += d.co2e_emissions || 0;
  });

  return Object.values(categoryData).map((cat: any) => ({
    ...cat,
    scope1: Math.round((cat.scope_1 / 1000) * 10) / 10, // Convert kg to tons
    scope2: Math.round((cat.scope_2 / 1000) * 10) / 10, // Convert kg to tons
    scope3: Math.round((cat.scope_3 / 1000) * 10) / 10  // Convert kg to tons
  }));
}

/**
 * @deprecated Use getIntensityMetrics() from calculator instead
 * This function does manual carbon intensity calculation
 */
function calculateCarbonIntensity(data: any[], sitesMap: Map<string, any>) {
  const totalEmissions = data.reduce((sum, d) => sum + (d.co2e_emissions || 0), 0); // Keep in kg

  // Calculate actual total area from sites
  let totalArea = 0;
  const siteAreas: any[] = [];
  sitesMap.forEach(site => {
    const area = site.area_m2 || 0;
    totalArea += area;
    if (area > 0) {
      siteAreas.push({ name: site.name, area });
    }
  });

  console.log('🔧 Carbon Intensity Calculation:', {
    totalEmissionsKg: totalEmissions,
    totalArea,
    siteCount: sitesMap.size,
    sitesWithArea: siteAreas
  });

  // If no area data, return 0
  if (totalArea === 0) {
    console.log('⚠️ No area data available, returning 0 intensity');
    return 0;
  }

  // Calculate intensity: kgCO2e / m²
  const intensity = totalEmissions / totalArea;
  console.log('✅ Carbon intensity calculated:', Math.round(intensity * 10) / 10, 'kgCO2e/m²');
  return Math.round(intensity * 10) / 10; // Round to 1 decimal place
}

/**
 * @deprecated Use getEnergyTotal() from calculator instead
 */
function calculateEnergyTotal(data: any[]) {
  // Energy includes both "Electricity" and "Purchased Energy" categories
  return data
    .filter(d => {
      const category = d.metrics_catalog?.category;
      return category === 'Electricity' || category === 'Purchased Energy';
    })
    .reduce((sum, d) => sum + (d.value || 0), 0);
}

/**
 * @deprecated Use getWaterTotal() from calculator instead
 */
function calculateWaterTotal(data: any[]) {
  // Water data is in "Purchased Goods & Services" category with name "Water" or "Wastewater"
  // This matches the zero-typing page approach
  return data
    .filter(d => {
      const category = d.metrics_catalog?.category;
      const name = d.metrics_catalog?.name;
      return category === 'Purchased Goods & Services' &&
             (name === 'Water' || name === 'Wastewater');
    })
    .reduce((sum, d) => sum + (d.value || 0), 0);
}

async function calculateYearOverYearComparison(data: any[], range: string, organizationId: string) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const comparison = [];

  // Determine current and previous year based on range
  let currentYear: number;
  let previousYear: number;

  if (range === 'all' || !range) {
    // For "all", we'll compare the latest year with data to the previous year
    const latestDate = data.reduce((max, d) => {
      const date = new Date(d.period_start);
      return date > max ? date : max;
    }, new Date(0));
    currentYear = latestDate.getFullYear();
    previousYear = currentYear - 1;
  } else if (['2025', '2024', '2023', '2022'].includes(range)) {
    currentYear = parseInt(range);
    previousYear = currentYear - 1;
  } else if (range === 'year') {
    currentYear = new Date().getFullYear();
    previousYear = currentYear - 1;
  } else {
    // Default to latest year
    currentYear = 2025;
    previousYear = 2024;
  }

  // Fetch previous year data with pagination
  const prevYearStart = new Date(`${previousYear}-01-01`);
  const prevYearEnd = new Date(`${previousYear}-12-31`);

  const previousYearData = await fetchAllMetricsData(
    organizationId,
    'co2e_emissions, period_start',
    prevYearStart,
    prevYearEnd
  ).then(data => data.filter(d => d.co2e_emissions !== null));

  // Group current year data by month
  const currentYearByMonth: { [key: number]: number } = {};
  data.forEach(d => {
    const date = new Date(d.period_start);
    if (date.getFullYear() === currentYear) {
      const month = date.getMonth();
      currentYearByMonth[month] = (currentYearByMonth[month] || 0) + (d.co2e_emissions || 0);
    }
  });

  // Group previous year data by month
  const previousYearByMonth: { [key: number]: number } = {};
  previousYearData?.forEach(d => {
    const date = new Date(d.period_start);
    const month = date.getMonth();
    previousYearByMonth[month] = (previousYearByMonth[month] || 0) + (d.co2e_emissions || 0);
  });

  // Calculate year-over-year change for each month
  for (let i = 0; i < 12; i++) {
    const currentMonthEmissions = currentYearByMonth[i] || 0;
    const previousMonthEmissions = previousYearByMonth[i] || 0;

    let change = 0;
    // Only show change if we have data for BOTH years
    if (currentMonthEmissions > 0 && previousMonthEmissions > 0) {
      // Both years have data - calculate percentage change
      change = ((currentMonthEmissions - previousMonthEmissions) / previousMonthEmissions) * 100;
    } else {
      // Missing data for either year - show as 0 (no comparison possible)
      change = 0;
    }

    comparison.push({
      month: months[i],
      change: Math.round(change * 10) / 10, // Round to 1 decimal
      currentEmissions: Math.round(currentMonthEmissions / 1000 * 10) / 10, // Convert to tons, round to 1 decimal
      previousEmissions: Math.round(previousMonthEmissions / 1000 * 10) / 10,
      hasData: currentMonthEmissions > 0 || previousMonthEmissions > 0,
      hasCurrentData: currentMonthEmissions > 0,
      hasPreviousData: previousMonthEmissions > 0
    });
  }

  return {
    data: comparison,
    currentYear,
    previousYear
  };
}