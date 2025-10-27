import { getUserOrganizationById } from '@/lib/auth/get-user-org';
import { getAPIUser } from '@/lib/auth/server-auth';
import { SCOPE_COLORS } from '@/lib/constants/sustainability-colors';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

type SiteRecord = {
  id: string;
  name?: string | null;
  total_area_sqm?: number | string | null;
  total_employees?: number | null;
  type?: string | null;
};

type SiteMapEntry = SiteRecord & {
  area_m2?: number | string | null;
  employee_count?: number | null;
  site_type?: string | null;
};

export const dynamic = 'force-dynamic';

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

  while (hasMore) {
    // Filter out future months - only include data through current month
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const maxHistoricalDate = new Date(currentYear, currentMonth, 0); // Last day of current month
    const effectiveEndDate = endDate <= maxHistoricalDate ? endDate : maxHistoricalDate;

    let query = supabaseAdmin
      .from('metrics_data')
      .select(selectFields)
      .eq('organization_id', organizationId)
      .gte('period_start', startDate.toISOString())
      .lte('period_end', effectiveEndDate.toISOString())
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

  return allData;
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range');
    const startDateParam = searchParams.get('start_date');
    const endDateParam = searchParams.get('end_date');
    const siteId = searchParams.get('site') || searchParams.get('site_id') || 'all';

    // Get user's organization
    let organizationId: string | null = null;

    // Check if super admin
    const { data: superAdmin } = await supabaseAdmin
      .from('super_admins')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (superAdmin) {
      // Get PLMJ organization for super admin
      const { data: org } = await supabaseAdmin
        .from('organizations')
        .select('id')
        .eq('name', 'PLMJ')
        .single();
      organizationId = org?.id;

      if (!organizationId) {
        // Fallback to first organization
        const { data: firstOrg } = await supabaseAdmin
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
        const { data: plmjOrg } = await supabaseAdmin
          .from('organizations')
          .select('id')
          .eq('name', 'PLMJ')
          .single();
        organizationId = plmjOrg?.id;
      }
    }

    if (!organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Get sites with their details for the organization - use admin to bypass RLS
    const { data: sites } = await supabaseAdmin
      .from('sites')
      .select('id, name, total_area_sqm, total_employees, type')
      .eq('organization_id', organizationId);

    const siteRecords: SiteRecord[] = (sites ?? []) as SiteRecord[];
    const sitesMap = new Map<string, SiteMapEntry>(
      siteRecords.map((site) => [
        site.id,
        {
          ...site,
          area_m2: site.total_area_sqm,
          employee_count: site.total_employees,
          site_type: site.type,
        },
      ])
    );

    // Calculate date range - support both explicit dates and range parameter
    const now = new Date();

    let startDate: Date;
    let endDate: Date;

    // If explicit dates provided, use them (like Energy API does)
    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam);
      endDate = new Date(endDateParam);
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
    }

    // ⚡ PERFORMANCE OPTIMIZATION: Fetch ALL data once with minimal fields
    const startTime = Date.now();
    const metricsData = await fetchAllMetricsData(
      organizationId,
      `
        value,
        co2e_emissions,
        period_start,
        site_id,
        metrics_catalog!inner(name, unit, scope, category)
      `,
      startDate,
      endDate,
      siteId
    );
    const fetchTime = Date.now() - startTime;

    const dataError = null; // Error handling is done in fetchAllMetricsData

    if (dataError) {
      console.error('🔧 API: Error fetching metrics data:', dataError);
      throw dataError;
    }

    // Process data for dashboard (now uses pre-fetched data)
    const processedData = await processDashboardData(
      metricsData || [],
      range,
      sitesMap,
      organizationId,
      startDate,
      endDate,
      fetchTime
    );

    return NextResponse.json(processedData, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
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
  range: string | null,
  sitesMap: Map<string, SiteMapEntry>,
  organizationId: string,
  providedStartDate: Date,
  providedEndDate: Date,
  fetchTime?: number
) {
  // ⚡ OPTIMIZED: Calculate ALL metrics from the single dataset
  const processingStartTime = Date.now();

  // Use provided dates (already validated and calculated in main GET function)
  const startDate =
    providedStartDate instanceof Date
      ? providedStartDate.toISOString().split('T')[0]
      : String(providedStartDate);
  const endDate =
    providedEndDate instanceof Date
      ? providedEndDate.toISOString().split('T')[0]
      : String(providedEndDate);

  // ⚡ SINGLE-PASS CALCULATION: Calculate everything from the data we already have
  const emissions = calculateEmissionsFromData(data);
  const scopes = {
    scope_1: emissions.scope_1,
    scope_2: emissions.scope_2,
    scope_3: emissions.scope_3,
    total: emissions.total,
  };

  const totalEmissions = emissions.total;
  const scope1Emissions = emissions.scope_1;
  const scope2Emissions = emissions.scope_2;
  const scope3Emissions = emissions.scope_3;

  // ⚡ OPTIMIZED: Calculate monthly emissions from data (NO database call)
  const monthlyEmissions = calculateMonthlyEmissionsFromData(data);
  const trendData = formatTrendDataFromCalculator(monthlyEmissions, range);

  // ⚡ OPTIMIZED: Calculate category breakdown from data (NO database call)
  const categories = calculateCategoryBreakdownFromData(data);
  const categoryHeatmap = formatCategoryHeatmap(categories);

  // ⚡ OPTIMIZED: Calculate metric totals from data (NO database call)
  const metricTotals = calculateMetricTotalsFromData(data);
  const energyConsumption = metricTotals.energy;
  const waterUsage = metricTotals.water;
  const wasteGenerated = metricTotals.waste;

  // Site comparison (uses raw data for site-specific filtering)
  const siteComparison = generateSiteComparison(data, sitesMap);

  // Convert scope breakdown to array format for dashboard
  const totalForPercentage = scopes.total || 0.001;
  const scopeBreakdown = [
    {
      name: 'Scope 1',
      value: scopes.scope_1,
      percentage:
        totalForPercentage > 0 ? Math.round((scopes.scope_1 / totalForPercentage) * 1000) / 10 : 0,
      color: SCOPE_COLORS.scope1,
    },
    {
      name: 'Scope 2',
      value: scopes.scope_2,
      percentage:
        totalForPercentage > 0 ? Math.round((scopes.scope_2 / totalForPercentage) * 1000) / 10 : 0,
      color: SCOPE_COLORS.scope2,
    },
    {
      name: 'Scope 3',
      value: scopes.scope_3,
      percentage:
        totalForPercentage > 0 ? Math.round((scopes.scope_3 / totalForPercentage) * 1000) / 10 : 0,
      color: SCOPE_COLORS.scope3,
    },
  ].filter((s) => s.value > 0);

  // Calculate total area from sites for intensity
  let totalAreaM2 = 0;
  sitesMap.forEach((site) => {
    const area =
      typeof site.total_area_sqm === 'string'
        ? parseFloat(site.total_area_sqm)
        : site.total_area_sqm || 0;
    totalAreaM2 += area;
  });

  // Get organization data for employee count
  const { data: orgData } = await supabaseAdmin
    .from('organizations')
    .select('employee_count')
    .eq('id', organizationId)
    .single();

  const perArea =
    totalAreaM2 > 0 ? Math.round(((emissions.total * 1000) / totalAreaM2) * 10) / 10 : 0;

  // TODO: YoY comparison requires previous year data - keep as 0 for now (can add later with caching)
  let emissionsChange = 0;
  let energyChange = 0;
  let waterChange = 0;
  let wasteChange = 0;

  const processingTime = Date.now() - processingStartTime;

  return {
    metrics: {
      totalEmissions: {
        value: totalEmissions,
        unit: 'tCO2e',
        change: emissionsChange,
        trend: emissionsChange < 0 ? 'down' : emissionsChange > 0 ? 'up' : 'stable',
      },
      energyConsumption: {
        value: energyConsumption, // Already converted to MWh
        unit: 'MWh',
        change: energyChange,
        trend: energyChange < 0 ? 'down' : energyChange > 0 ? 'up' : 'stable',
      },
      waterUsage: {
        value: waterUsage, // Already rounded
        unit: 'm³',
        change: waterChange,
        trend: waterChange < 0 ? 'down' : waterChange > 0 ? 'up' : 'stable',
      },
      wasteGenerated: {
        value: Math.round((wasteGenerated / 1000) * 10) / 10, // Convert kg to tons
        unit: 'tons',
        change: wasteChange,
        trend: wasteChange < 0 ? 'down' : wasteChange > 0 ? 'up' : 'stable',
      },
      carbonIntensity: {
        value: perArea,
        unit: 'kgCO2e/m²',
        change: emissionsChange,
        trend: emissionsChange < 0 ? 'down' : emissionsChange > 0 ? 'up' : 'stable',
      },
    },
    scopeBreakdown,
    trendData,
    siteComparison,
    categoryHeatmap,
    yearOverYearComparison: await calculateYearOverYearComparison(data, range, organizationId),
  };
}

// Helper function to format monthly emissions from calculator
function formatTrendDataFromCalculator(monthlyEmissions: any[], _range: string | null) {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  return monthlyEmissions.map((m) => {
    const [year, month] = m.month.split('-');
    return {
      month: `${months[parseInt(month) - 1]} ${year.slice(2)}`,
      emissions: m.emissions,
      scope1: m.scope_1,
      scope2: m.scope_2,
      scope3: m.scope_3,
      energy: 0, // TODO: Add energy to calculator monthly emissions
      water: 0, // TODO: Add water to calculator monthly emissions
      target: 50, // More realistic monthly target
    };
  });
}

// Helper function to format category heatmap from calculator
function formatCategoryHeatmap(categories: any[]) {
  return categories.map((cat) => ({
    category: cat.category,
    scope1: cat.scope_1 || 0,
    scope2: cat.scope_2 || 0,
    scope3: cat.scope_3 || 0,
    scope_1: cat.scope_1 || 0,
    scope_2: cat.scope_2 || 0,
    scope_3: cat.scope_3 || 0,
  }));
}

// ⚡ PERFORMANCE HELPER: Calculate emissions from pre-fetched data (NO database calls)
function calculateEmissionsFromData(data: any[]) {
  let scope1Sum = 0,
    scope2Sum = 0,
    scope3Sum = 0;

  data.forEach((d) => {
    const emissions = d.co2e_emissions || 0;
    const scope = d.metrics_catalog?.scope;
    if (scope === 'scope_1') scope1Sum += emissions;
    else if (scope === 'scope_2') scope2Sum += emissions;
    else if (scope === 'scope_3') scope3Sum += emissions;
  });

  const scope1 = Math.round((scope1Sum / 1000) * 10) / 10;
  const scope2 = Math.round((scope2Sum / 1000) * 10) / 10;
  const scope3 = Math.round((scope3Sum / 1000) * 10) / 10;
  const total = Math.round((scope1 + scope2 + scope3) * 10) / 10;

  return { total, scope_1: scope1, scope_2: scope2, scope_3: scope3 };
}

// ⚡ PERFORMANCE HELPER: Calculate monthly emissions from pre-fetched data
function calculateMonthlyEmissionsFromData(data: any[]) {
  const monthlyMap = new Map<string, { scope_1: number; scope_2: number; scope_3: number }>();

  data.forEach((d) => {
    const month = d.period_start?.substring(0, 7);
    if (!month) return;

    const scope = d.metrics_catalog?.scope;
    const emissions = (d.co2e_emissions || 0) / 1000;

    if (!monthlyMap.has(month)) {
      monthlyMap.set(month, { scope_1: 0, scope_2: 0, scope_3: 0 });
    }

    const monthData = monthlyMap.get(month)!;
    if (scope === 'scope_1') monthData.scope_1 += emissions;
    else if (scope === 'scope_2') monthData.scope_2 += emissions;
    else if (scope === 'scope_3') monthData.scope_3 += emissions;
  });

  const monthlyData: any[] = [];
  monthlyMap.forEach((scopes, month) => {
    const scope1 = Math.round(scopes.scope_1 * 10) / 10;
    const scope2 = Math.round(scopes.scope_2 * 10) / 10;
    const scope3 = Math.round(scopes.scope_3 * 10) / 10;
    const total = Math.round((scope1 + scope2 + scope3) * 10) / 10;

    monthlyData.push({
      month,
      emissions: total,
      scope_1: scope1,
      scope_2: scope2,
      scope_3: scope3,
    });
  });

  return monthlyData.sort((a, b) => a.month.localeCompare(b.month));
}

// ⚡ PERFORMANCE HELPER: Calculate category breakdown from pre-fetched data
function calculateCategoryBreakdownFromData(data: any[]) {
  const categoryMap = new Map<string, { scope_1: number; scope_2: number; scope_3: number }>();

  data.forEach((d) => {
    const category = d.metrics_catalog?.category || 'Unknown';
    const scope = d.metrics_catalog?.scope;
    const emissions = (d.co2e_emissions || 0) / 1000;

    if (!categoryMap.has(category)) {
      categoryMap.set(category, { scope_1: 0, scope_2: 0, scope_3: 0 });
    }

    const cat = categoryMap.get(category)!;
    if (scope === 'scope_1') cat.scope_1 += emissions;
    else if (scope === 'scope_2') cat.scope_2 += emissions;
    else if (scope === 'scope_3') cat.scope_3 += emissions;
  });

  const categories: any[] = [];
  let grandTotal = 0;

  categoryMap.forEach((scopes, category) => {
    const scope1 = Math.round(scopes.scope_1 * 10) / 10;
    const scope2 = Math.round(scopes.scope_2 * 10) / 10;
    const scope3 = Math.round(scopes.scope_3 * 10) / 10;
    const total = Math.round((scope1 + scope2 + scope3) * 10) / 10;

    categories.push({
      category,
      scope_1: scope1,
      scope_2: scope2,
      scope_3: scope3,
      total,
      percentage: 0,
    });
    grandTotal += total;
  });

  return categories
    .map((cat) => ({
      ...cat,
      percentage: grandTotal > 0 ? Math.round((cat.total / grandTotal) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

// ⚡ PERFORMANCE HELPER: Calculate energy/water/waste from pre-fetched data
function calculateMetricTotalsFromData(data: any[]) {
  let energy = 0,
    water = 0,
    waste = 0;

  data.forEach((d) => {
    const category = d.metrics_catalog?.category;
    const name = d.metrics_catalog?.name;
    const value = d.value || 0;

    if (category === 'Electricity' || category === 'Purchased Energy') {
      energy += value;
    } else if (name === 'Water' || name === 'Wastewater' || category === 'Water') {
      water += value;
    } else if (category === 'Waste') {
      waste += value;
    }
  });

  return {
    energy: Math.round((energy / 1000) * 10) / 10, // kWh to MWh
    water: Math.round(water),
    waste: Math.round(waste),
  };
}

/**
 * @deprecated Use getScopeBreakdown() from calculator instead
 * This function does DIRECT sum which gives inconsistent rounding
 */
function calculateScopeBreakdown(data: any[]) {
  const scopes = { scope_1: 0, scope_2: 0, scope_3: 0 };

  data.forEach((d) => {
    const scope = d.metrics_catalog?.scope;
    const scopeKey: keyof typeof scopes | null =
      scope === 'scope_1' || scope === 'scope_2' || scope === 'scope_3' ? scope : null;

    if (scopeKey && typeof d.co2e_emissions === 'number') {
      scopes[scopeKey] += d.co2e_emissions;
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
      color: SCOPE_COLORS.scope1,
    });
  }

  if (scopes.scope_2 > 0) {
    breakdown.push({
      name: 'Scope 2',
      value: Math.round((scopes.scope_2 / 1000) * 10) / 10, // Convert kg to tons
      percentage: Math.round((scopes.scope_2 / total) * 1000) / 10,
      color: SCOPE_COLORS.scope2,
    });
  }

  if (scopes.scope_3 > 0) {
    breakdown.push({
      name: 'Scope 3',
      value: Math.round((scopes.scope_3 / 1000) * 10) / 10, // Convert kg to tons
      percentage: Math.round((scopes.scope_3 / total) * 1000) / 10,
      color: SCOPE_COLORS.scope3,
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

  data.forEach((d) => {
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
        count: 0,
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
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  // Get all months in the data, sorted
  const sortedData = Object.entries(monthlyData).sort((a, b) => a[0].localeCompare(b[0]));

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
      energy: Math.round((values.energy / 1000) * 10) / 10, // Convert to MWh
      water: Math.round(values.water),
      target: 50, // More realistic monthly target
    };
  });
}

function generateSiteComparison(data: any[], sitesMap: Map<string, SiteMapEntry>) {
  const siteData: Record<string, any> = {};

  data.forEach((d) => {
    const siteInfo = sitesMap.get(d.site_id);
    if (!siteInfo) {
      // Only log first few missing sites to avoid spam
      if (Object.keys(siteData).length < 3) {
      }
      return; // Skip if site not found
    }

    const siteName = siteInfo.name ?? 'Unknown';

    if (!siteData[siteName]) {
      siteData[siteName] = {
        site: siteName,
        emissions: 0,
        energy: 0,
        water: 0,
        waste: 0,
        area: siteInfo.area_m2 || 1000, // Use actual area from database, fallback to 1000m²
        employees: siteInfo.employee_count || 10, // Use actual employee count
        siteType: siteInfo.site_type || 'office',
      };
    }

    siteData[siteName].emissions += d.co2e_emissions || 0;

    // Add metric-specific values
    const category = d.metrics_catalog?.category;
    const name = d.metrics_catalog?.name;

    if (category === 'Electricity' || category === 'Purchased Energy') {
      siteData[siteName].energy += d.value || 0;
    } else if (
      category === 'Purchased Goods & Services' &&
      (name === 'Water' || name === 'Wastewater')
    ) {
      siteData[siteName].water += d.value || 0;
    } else if (category === 'Waste') {
      siteData[siteName].waste += d.value || 0;
    }
  });

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
      office: 50, // Good office building
      manufacturing: 150, // Efficient factory
      warehouse: 30, // Low-energy storage
      retail: 80, // Typical retail space
      default: 75, // Average commercial building
    };

    const targetIntensity = benchmarks[site.siteType] || benchmarks.default;
    const carbonIntensity = emissionsKg / area;

    // Determine performance based on intensity thresholds
    let performanceStatus: string;
    if (carbonIntensity <= 20) {
      performanceStatus = 'excellent'; // Very low emissions
    } else if (carbonIntensity <= 40) {
      performanceStatus = 'good'; // Below benchmark
    } else if (carbonIntensity <= 60) {
      performanceStatus = 'warning'; // Needs improvement
    } else {
      performanceStatus = 'poor'; // High emissions
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
      wasteIntensity: Math.round(((site.waste * 1000) / area) * 10) / 10, // kg/m²
    };
  });

  return result;
}

/**
 * @deprecated Use getCategoryBreakdown() from calculator and formatCategoryHeatmap() instead
 * This function does manual category aggregation
 */
function generateCategoryHeatmap(data: any[]) {
  const categoryData: any = {};

  data.forEach((d) => {
    const category = d.metrics_catalog?.category || 'Other';
    const scope = d.metrics_catalog?.scope || 'scope_1';

    if (!categoryData[category]) {
      categoryData[category] = {
        category,
        scope_1: 0,
        scope_2: 0,
        scope_3: 0,
      };
    }

    categoryData[category][scope] += d.co2e_emissions || 0;
  });

  return Object.values(categoryData).map((cat: any) => ({
    ...cat,
    scope1: Math.round((cat.scope_1 / 1000) * 10) / 10, // Convert kg to tons
    scope2: Math.round((cat.scope_2 / 1000) * 10) / 10, // Convert kg to tons
    scope3: Math.round((cat.scope_3 / 1000) * 10) / 10, // Convert kg to tons
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
  sitesMap.forEach((site) => {
    const area = site.area_m2 || 0;
    totalArea += area;
    if (area > 0) {
      siteAreas.push({ name: site.name, area });
    }
  });

  // If no area data, return 0
  if (totalArea === 0) {
    return 0;
  }

  // Calculate intensity: kgCO2e / m²
  const intensity = totalEmissions / totalArea;
  return Math.round(intensity * 10) / 10; // Round to 1 decimal place
}

/**
 * @deprecated Use getEnergyTotal() from calculator instead
 */
function calculateEnergyTotal(data: any[]) {
  // Energy includes both "Electricity" and "Purchased Energy" categories
  return data
    .filter((d) => {
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
    .filter((d) => {
      const category = d.metrics_catalog?.category;
      const name = d.metrics_catalog?.name;
      return (
        category === 'Purchased Goods & Services' && (name === 'Water' || name === 'Wastewater')
      );
    })
    .reduce((sum, d) => sum + (d.value || 0), 0);
}

async function calculateYearOverYearComparison(
  data: any[],
  range: string | null,
  organizationId: string
) {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
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
  ).then((data) => data.filter((d) => d.co2e_emissions !== null));

  // Group current year data by month
  const currentYearByMonth: { [key: number]: number } = {};
  data.forEach((d) => {
    const date = new Date(d.period_start);
    if (date.getFullYear() === currentYear) {
      const month = date.getMonth();
      currentYearByMonth[month] = (currentYearByMonth[month] || 0) + (d.co2e_emissions || 0);
    }
  });

  // Group previous year data by month
  const previousYearByMonth: { [key: number]: number } = {};
  previousYearData?.forEach((d) => {
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
      currentEmissions: Math.round((currentMonthEmissions / 1000) * 10) / 10, // Convert to tons, round to 1 decimal
      previousEmissions: Math.round((previousMonthEmissions / 1000) * 10) / 10,
      hasData: currentMonthEmissions > 0 || previousMonthEmissions > 0,
      hasCurrentData: currentMonthEmissions > 0,
      hasPreviousData: previousMonthEmissions > 0,
    });
  }

  return {
    data: comparison,
    currentYear,
    previousYear,
  };
}
