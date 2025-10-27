import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * Metrics Calculator - Single Source of Truth
 *
 * This module provides THE ONLY centralized functions to calculate ALL metrics
 * (emissions, energy, water, waste, etc.) from metrics data.
 *
 * All APIs MUST use these functions to ensure consistent values across the platform.
 *
 * Key principles:
 * 1. Scope-by-scope calculation (for emissions)
 * 2. Category-by-category calculation (for other metrics)
 * 3. Round individual values before summing
 * 4. Round final total to prevent floating point errors
 */

/**
 * ============================================================================
 * HELPER FUNCTIONS - Pagination Support
 * ============================================================================
 */

/**
 * Fetch all metrics data with pagination to avoid 1000-record limit
 * This is used by all calculator functions to ensure complete data retrieval
 */
async function fetchAllMetricsData(
  organizationId: string,
  selectFields: string,
  startDate?: string,
  endDate?: string,
  additionalFilters?: Record<string, any>
): Promise<any[]> {
  let allData: any[] = [];
  let rangeStart = 0;
  const batchSize = 1000;
  let hasMore = true;

  while (hasMore) {
    let query = supabaseAdmin
      .from('metrics_data')
      .select(selectFields)
      .eq('organization_id', organizationId)
      .order('period_start', { ascending: true })
      .range(rangeStart, rangeStart + batchSize - 1);

    if (startDate) {
      query = query.gte('period_start', startDate);
    }

    if (endDate) {
      // Filter out future months - only include data through current month
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const maxHistoricalDate = new Date(currentYear, currentMonth, 0); // Last day of current month
      const requestedEndDate = new Date(endDate);

      // Use the earlier of: requested end date OR current month end
      const effectiveEndDate = requestedEndDate <= maxHistoricalDate ? endDate : maxHistoricalDate.toISOString().split('T')[0];

      // Use period_start for filtering since period_end is often the first day of the next month
      query = query.lte('period_start', effectiveEndDate);
    }

    // Apply any additional filters
    if (additionalFilters) {
      Object.keys(additionalFilters).forEach(key => {
        query = query.eq(key, additionalFilters[key]);
      });
    }

    const { data: batchData, error } = await query;

    if (error || !batchData || batchData.length === 0) {
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

export interface BaselineEmissions {
  year: number;
  scope_1: number;
  scope_2: number;
  scope_3: number;
  total: number;
  scope_3_percentage: number;
  recordCount: number;
  unit: 'tCO2e';
}

export interface ScopeBreakdown {
  scope_1: number;
  scope_2: number;
  scope_3: number;
  total: number;
}

export interface CategoryBreakdown {
  category: string;
  scope_1: number;
  scope_2: number;
  scope_3: number;
  total: number;
  percentage: number;
}

export interface MetricTotal {
  value: number;
  unit: string;
  recordCount: number;
}

/**
 * Calculate baseline emissions from metrics data for a specific year
 * Returns emissions rounded to 1 decimal place for consistency
 *
 * @param organizationId - Organization UUID
 * @param baselineYear - Year to calculate baseline for (default: current year - 2)
 * @returns BaselineEmissions object or null if no data found
 */
export async function getBaselineEmissions(
  organizationId: string,
  baselineYear?: number,
  siteId?: string
): Promise<BaselineEmissions | null> {
  const currentYear = new Date().getFullYear();
  const year = baselineYear || currentYear - 2;

  const additionalFilters = siteId ? { site_id: siteId } : undefined;

  // Get scope-specific emissions for baseline year by joining with metrics_catalog
  const metricsData = await fetchAllMetricsData(
    organizationId,
    `
      co2e_emissions,
      metrics_catalog!inner(scope)
    `,
    `${year}-01-01`,
    `${year}-12-31`,
    additionalFilters
  );

  if (!metricsData || metricsData.length === 0) {
    return null;
  }

  // OPTIMIZED: Single-pass calculation instead of 3 filters
  let scope1Sum = 0;
  let scope2Sum = 0;
  let scope3Sum = 0;

  metricsData.forEach(d => {
    const emissions = d.co2e_emissions || 0;
    const scope = (d.metrics_catalog as any)?.scope;

    if (scope === 'scope_1') scope1Sum += emissions;
    else if (scope === 'scope_2') scope2Sum += emissions;
    else if (scope === 'scope_3') scope3Sum += emissions;
  });

  // Convert kg CO2e to tonnes CO2e and round
  const scope1 = Math.round(scope1Sum / 1000 * 10) / 10;
  const scope2 = Math.round(scope2Sum / 1000 * 10) / 10;
  const scope3 = Math.round(scope3Sum / 1000 * 10) / 10;
  const total = Math.round((scope1 + scope2 + scope3) * 10) / 10;

  const scope_3_percentage = total > 0 ? (scope3 / total) * 100 : 0;

  return {
    year,
    scope_1: scope1,
    scope_2: scope2,
    scope_3: scope3,
    total,
    scope_3_percentage,
    recordCount: metricsData.length,
    unit: 'tCO2e'
  };
}

/**
 * Calculate total emissions for any year (not just baseline)
 * Useful for current year calculations, trends, etc.
 * IMPORTANT: Uses scope-by-scope rounding for consistency
 */
export async function getYearEmissions(
  organizationId: string,
  year: number,
  siteId?: string
): Promise<number> {
  const additionalFilters = siteId ? { site_id: siteId } : undefined;

  const metricsData = await fetchAllMetricsData(
    organizationId,
    `
      co2e_emissions,
      metrics_catalog!inner(scope)
    `,
    `${year}-01-01`,
    `${year}-12-31`,
    additionalFilters
  );

  if (!metricsData || metricsData.length === 0) {
    return 0;
  }

  // OPTIMIZED: Single-pass calculation
  let scope1Sum = 0, scope2Sum = 0, scope3Sum = 0;
  metricsData.forEach(d => {
    const emissions = d.co2e_emissions || 0;
    const scope = (d.metrics_catalog as any)?.scope;
    if (scope === 'scope_1') scope1Sum += emissions;
    else if (scope === 'scope_2') scope2Sum += emissions;
    else if (scope === 'scope_3') scope3Sum += emissions;
  });

  const scope1 = Math.round(scope1Sum / 1000 * 10) / 10;
  const scope2 = Math.round(scope2Sum / 1000 * 10) / 10;
  const scope3 = Math.round(scope3Sum / 1000 * 10) / 10;

  return Math.round((scope1 + scope2 + scope3) * 10) / 10;
}

/**
 * Calculate emissions for any custom date range
 * Returns total with scope-by-scope rounding for consistency
 */
export async function getPeriodEmissions(
  organizationId: string,
  startDate: string,
  endDate: string,
  siteId?: string
): Promise<{ total: number; scope_1: number; scope_2: number; scope_3: number }> {
  const additionalFilters = siteId ? { site_id: siteId } : undefined;

  const metricsData = await fetchAllMetricsData(
    organizationId,
    `
      co2e_emissions,
      metrics_catalog!inner(scope)
    `,
    startDate,
    endDate,
    additionalFilters
  );

  if (!metricsData || metricsData.length === 0) {
    return { total: 0, scope_1: 0, scope_2: 0, scope_3: 0 };
  }

  // OPTIMIZED: Single-pass calculation
  let scope1Sum = 0, scope2Sum = 0, scope3Sum = 0;
  metricsData.forEach(d => {
    const emissions = d.co2e_emissions || 0;
    const scope = (d.metrics_catalog as any)?.scope;
    if (scope === 'scope_1') scope1Sum += emissions;
    else if (scope === 'scope_2') scope2Sum += emissions;
    else if (scope === 'scope_3') scope3Sum += emissions;
  });

  const scope1 = Math.round(scope1Sum / 1000 * 10) / 10;
  const scope2 = Math.round(scope2Sum / 1000 * 10) / 10;
  const scope3 = Math.round(scope3Sum / 1000 * 10) / 10;
  const total = Math.round((scope1 + scope2 + scope3) * 10) / 10;

  return {
    total,
    scope_1: scope1,
    scope_2: scope2,
    scope_3: scope3
  };
}

/**
 * ============================================================================
 * SCOPE BREAKDOWN FUNCTIONS
 * ============================================================================
 */

/**
 * Calculate scope breakdown with emissions by scope
 * Used for charts and detailed breakdowns
 */
export async function getScopeBreakdown(
  organizationId: string,
  startDate: string,
  endDate: string,
  siteId?: string
): Promise<ScopeBreakdown> {
  const emissions = await getPeriodEmissions(organizationId, startDate, endDate, siteId);
  return {
    scope_1: emissions.scope_1,
    scope_2: emissions.scope_2,
    scope_3: emissions.scope_3,
    total: emissions.total
  };
}

/**
 * Calculate emissions by category with scope breakdown
 * Returns array of categories sorted by total emissions (highest first)
 *
 * @param organizationId - Organization UUID
 * @param startDate - Start date for the period
 * @param endDate - End date for the period
 * @param siteId - Optional site ID to filter by specific site
 */
export async function getCategoryBreakdown(
  organizationId: string,
  startDate: string,
  endDate: string,
  siteId?: string
): Promise<CategoryBreakdown[]> {
  const additionalFilters = siteId ? { site_id: siteId } : undefined;

  const metricsData = await fetchAllMetricsData(
    organizationId,
    `
      co2e_emissions,
      metrics_catalog!inner(scope, category)
    `,
    startDate,
    endDate,
    additionalFilters
  );

  if (!metricsData || metricsData.length === 0) {
    return [];
  }

  // Group by category
  const categoryMap = new Map<string, { scope_1: number; scope_2: number; scope_3: number }>();

  metricsData.forEach(d => {
    const category = (d.metrics_catalog as any)?.category || 'Unknown';
    const scope = (d.metrics_catalog as any)?.scope;
    const emissions = (d.co2e_emissions || 0) / 1000; // Convert to tCO2e

    if (!categoryMap.has(category)) {
      categoryMap.set(category, { scope_1: 0, scope_2: 0, scope_3: 0 });
    }

    const cat = categoryMap.get(category)!;
    if (scope === 'scope_1') cat.scope_1 += emissions;
    else if (scope === 'scope_2') cat.scope_2 += emissions;
    else if (scope === 'scope_3') cat.scope_3 += emissions;
  });

  // Calculate totals and round
  const categories: CategoryBreakdown[] = [];
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
      percentage: 0 // Will calculate after we have grand total
    });

    grandTotal += total;
  });

  // Calculate percentages and sort by total (highest first)
  return categories
    .map(cat => ({
      ...cat,
      percentage: grandTotal > 0 ? Math.round((cat.total / grandTotal) * 1000) / 10 : 0
    }))
    .sort((a, b) => b.total - a.total);
}

/**
 * ============================================================================
 * OTHER METRICS CALCULATORS
 * ============================================================================
 */

/**
 * Calculate total energy consumption for a period
 * Returns value in MWh (rounded to 1 decimal)
 */
export async function getEnergyTotal(
  organizationId: string,
  startDate: string,
  endDate: string,
  siteId?: string
): Promise<MetricTotal> {
  const additionalFilters = siteId ? { site_id: siteId } : undefined;

  const metricsData = await fetchAllMetricsData(
    organizationId,
    `
      value,
      metrics_catalog!inner(category, unit)
    `,
    startDate,
    endDate,
    additionalFilters
  );

  if (!metricsData || metricsData.length === 0) {
    return { value: 0, unit: 'MWh', recordCount: 0 };
  }

  // OPTIMIZED: Single-pass calculation with filter + sum
  let totalKWh = 0;
  let recordCount = 0;

  metricsData.forEach(d => {
    const category = (d.metrics_catalog as any)?.category;
    if (category === 'Electricity' || category === 'Purchased Energy') {
      totalKWh += d.value || 0;
      recordCount++;
    }
  });

  const totalMWh = Math.round(totalKWh / 1000 * 10) / 10;

  return {
    value: totalMWh,
    unit: 'MWh',
    recordCount
  };
}

/**
 * Calculate total water usage for a period
 * Returns value in m³ (rounded to nearest integer)
 */
export async function getWaterTotal(
  organizationId: string,
  startDate: string,
  endDate: string,
  siteId?: string
): Promise<MetricTotal> {
  const additionalFilters = siteId ? { site_id: siteId } : undefined;

  const metricsData = await fetchAllMetricsData(
    organizationId,
    `
      value,
      metrics_catalog!inner(name, category)
    `,
    startDate,
    endDate,
    additionalFilters
  );

  if (!metricsData || metricsData.length === 0) {
    return { value: 0, unit: 'm³', recordCount: 0 };
  }

  // OPTIMIZED: Single-pass calculation with filter + sum
  let total = 0;
  let recordCount = 0;

  metricsData.forEach(d => {
    const name = (d.metrics_catalog as any)?.name;
    const category = (d.metrics_catalog as any)?.category;
    if (name === 'Water' || name === 'Wastewater' || category === 'Water') {
      total += d.value || 0;
      recordCount++;
    }
  });

  return {
    value: Math.round(total),
    unit: 'm³',
    recordCount
  };
}

/**
 * Calculate total waste generated for a period
 * Returns value in kg (rounded to nearest integer)
 */
export async function getWasteTotal(
  organizationId: string,
  startDate: string,
  endDate: string,
  siteId?: string
): Promise<MetricTotal> {
  const additionalFilters = siteId ? { site_id: siteId } : undefined;

  const metricsData = await fetchAllMetricsData(
    organizationId,
    `
      value,
      metrics_catalog!inner(category)
    `,
    startDate,
    endDate,
    additionalFilters
  );

  if (!metricsData || metricsData.length === 0) {
    return { value: 0, unit: 'kg', recordCount: 0 };
  }

  // OPTIMIZED: Single-pass calculation with filter + sum
  let total = 0;
  let recordCount = 0;

  metricsData.forEach(d => {
    const category = (d.metrics_catalog as any)?.category;
    if (category === 'Waste') {
      total += d.value || 0;
      recordCount++;
    }
  });

  return {
    value: Math.round(total),
    unit: 'kg',
    recordCount
  };
}

/**
 * ============================================================================
 * MONTHLY/TREND DATA CALCULATORS
 * ============================================================================
 */

export interface MonthlyData {
  month: string; // Format: "2024-01"
  emissions: number;
  scope_1: number;
  scope_2: number;
  scope_3: number;
  energy?: number;
  water?: number;
  waste?: number;
}

/**
 * Calculate monthly emissions trend for a period
 * Returns array of monthly data sorted chronologically
 */
export async function getMonthlyEmissions(
  organizationId: string,
  startDate: string,
  endDate: string,
  siteId?: string
): Promise<MonthlyData[]> {
  // Fetch ALL data with pagination to avoid 1000-record limit
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
    const requestedEndDate = new Date(endDate);

    // Use the earlier of: requested end date OR current month end
    const effectiveEndDate = requestedEndDate <= maxHistoricalDate ? endDate : maxHistoricalDate.toISOString().split('T')[0];

    let query = supabaseAdmin
      .from('metrics_data')
      .select(`
        co2e_emissions,
        period_start,
        metrics_catalog!inner(scope)
      `)
      .eq('organization_id', organizationId)
      .gte('period_start', startDate)
      .lte('period_end', effectiveEndDate)
      .order('period_start', { ascending: true })
      .range(rangeStart, rangeStart + batchSize - 1);

    if (siteId) {
      query = query.eq('site_id', siteId);
    }

    const { data: batchData, error } = await query;

    if (error || !batchData || batchData.length === 0) {
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

  const metricsData = allData;

  if (!metricsData || metricsData.length === 0) {
    return [];
  }

  // Group by month
  const monthlyMap = new Map<string, { scope_1: number; scope_2: number; scope_3: number }>();

  metricsData.forEach(d => {
    const month = d.period_start?.substring(0, 7); // "2024-01"
    if (!month) return;

    const scope = (d.metrics_catalog as any)?.scope;
    const emissions = (d.co2e_emissions || 0) / 1000; // Convert to tCO2e

    if (!monthlyMap.has(month)) {
      monthlyMap.set(month, { scope_1: 0, scope_2: 0, scope_3: 0 });
    }

    const monthData = monthlyMap.get(month)!;
    if (scope === 'scope_1') monthData.scope_1 += emissions;
    else if (scope === 'scope_2') monthData.scope_2 += emissions;
    else if (scope === 'scope_3') monthData.scope_3 += emissions;
  });

  // Calculate totals and round
  const monthlyData: MonthlyData[] = [];

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
      scope_3: scope3
    });
  });

  // Sort chronologically
  return monthlyData.sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * ============================================================================
 * INTENSITY METRICS CALCULATORS
 * ============================================================================
 */

export interface IntensityMetrics {
  perEmployee: number;
  perEmployeeYoY: number | null;
  perRevenue: number; // tCO2e per million revenue
  perRevenueYoY: number | null;
  perSqm: number; // kg CO2e per sqm
  perSqmYoY: number | null;
  unit: string;
}

/**
 * Calculate all intensity metrics with YoY comparisons
 * Used for Overview and Emissions dashboards
 */
export async function getIntensityMetrics(
  organizationId: string,
  startDate: string,
  endDate: string,
  employees: number,
  revenue: number,
  totalAreaSqm: number,
  siteId?: string
): Promise<IntensityMetrics> {
  // Get current period emissions
  const emissions = await getPeriodEmissions(organizationId, startDate, endDate, siteId);

  // Calculate intensities (rounded to 2 decimals for precision)
  const perEmployee = employees > 0 ? Math.round((emissions.total / employees) * 100) / 100 : 0;
  const perRevenue = revenue > 0 ? Math.round((emissions.total * 1000000 / revenue) * 100) / 100 : 0;
  const perSqm = totalAreaSqm > 0 ? Math.round((emissions.total * 1000 / totalAreaSqm) * 10) / 10 : 0;

  // Get previous year same period for YoY
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);
  const prevStartDate = new Date(startDateObj.getFullYear() - 1, startDateObj.getMonth(), startDateObj.getDate());
  const prevEndDate = new Date(endDateObj.getFullYear() - 1, endDateObj.getMonth(), endDateObj.getDate());

  const prevEmissions = await getPeriodEmissions(
    organizationId,
    prevStartDate.toISOString().split('T')[0],
    prevEndDate.toISOString().split('T')[0],
    siteId
  );

  // Calculate YoY percentages
  let perEmployeeYoY: number | null = null;
  let perRevenueYoY: number | null = null;
  let perSqmYoY: number | null = null;

  if (prevEmissions.total > 0) {
    const prevPerEmployee = employees > 0 ? prevEmissions.total / employees : 0;
    const prevPerRevenue = revenue > 0 ? (prevEmissions.total * 1000000) / revenue : 0;
    const prevPerSqm = totalAreaSqm > 0 ? (prevEmissions.total * 1000) / totalAreaSqm : 0;

    if (prevPerEmployee > 0) {
      perEmployeeYoY = Math.round(((perEmployee - prevPerEmployee) / prevPerEmployee) * 1000) / 10;
    }
    if (prevPerRevenue > 0) {
      perRevenueYoY = Math.round(((perRevenue - prevPerRevenue) / prevPerRevenue) * 1000) / 10;
    }
    if (prevPerSqm > 0) {
      perSqmYoY = Math.round(((perSqm - prevPerSqm) / prevPerSqm) * 1000) / 10;
    }
  }

  return {
    perEmployee,
    perEmployeeYoY,
    perRevenue,
    perRevenueYoY,
    perSqm,
    perSqmYoY,
    unit: 'tCO2e'
  };
}

/**
 * ============================================================================
 * YEAR-OVER-YEAR COMPARISON CALCULATORS
 * ============================================================================
 */

export interface YoYComparison {
  current: number;
  previous: number;
  change: number; // Absolute change
  percentageChange: number; // Percentage change (can be negative)
  trend: 'up' | 'down' | 'stable';
}

/**
 * Calculate YoY comparison for any metric
 * Returns standardized comparison object
 */
export async function getYoYComparison(
  organizationId: string,
  startDate: string,
  endDate: string,
  metricType: 'emissions' | 'energy' | 'water' | 'waste',
  siteId?: string
): Promise<YoYComparison> {
  // Get current period value
  let current = 0;
  if (metricType === 'emissions') {
    const emissions = await getPeriodEmissions(organizationId, startDate, endDate, siteId);
    current = emissions.total;
  } else if (metricType === 'energy') {
    const energy = await getEnergyTotal(organizationId, startDate, endDate, siteId);
    current = energy.value;
  } else if (metricType === 'water') {
    const water = await getWaterTotal(organizationId, startDate, endDate, siteId);
    current = water.value;
  } else if (metricType === 'waste') {
    const waste = await getWasteTotal(organizationId, startDate, endDate, siteId);
    current = waste.value;
  }

  // Get previous year same period
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);
  const prevStartDate = new Date(startDateObj.getFullYear() - 1, startDateObj.getMonth(), startDateObj.getDate());
  const prevEndDate = new Date(endDateObj.getFullYear() - 1, endDateObj.getMonth(), endDateObj.getDate());

  console.log('[YoY Comparison] Current period:', startDate, 'to', endDate);
  console.log('[YoY Comparison] Previous period:', prevStartDate.toISOString().split('T')[0], 'to', prevEndDate.toISOString().split('T')[0]);
  console.log('[YoY Comparison] Metric type:', metricType);

  let previous = 0;
  if (metricType === 'emissions') {
    const emissions = await getPeriodEmissions(
      organizationId,
      prevStartDate.toISOString().split('T')[0],
      prevEndDate.toISOString().split('T')[0],
      siteId
    );
    previous = emissions.total;
  } else if (metricType === 'energy') {
    const energy = await getEnergyTotal(
      organizationId,
      prevStartDate.toISOString().split('T')[0],
      prevEndDate.toISOString().split('T')[0],
      siteId
    );
    previous = energy.value;
  } else if (metricType === 'water') {
    const water = await getWaterTotal(
      organizationId,
      prevStartDate.toISOString().split('T')[0],
      prevEndDate.toISOString().split('T')[0],
      siteId
    );
    previous = water.value;
  } else if (metricType === 'waste') {
    const waste = await getWasteTotal(
      organizationId,
      prevStartDate.toISOString().split('T')[0],
      prevEndDate.toISOString().split('T')[0],
      siteId
    );
    previous = waste.value;
  }

  // Calculate changes
  const change = Math.round((current - previous) * 10) / 10;
  const percentageChange = previous > 0 ? Math.round(((current - previous) / previous) * 1000) / 10 : 0;

  console.log('[YoY Comparison] Current value:', current);
  console.log('[YoY Comparison] Previous value:', previous);
  console.log('[YoY Comparison] Change:', change, '(', percentageChange, '%)');

  // Determine trend
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (Math.abs(percentageChange) < 1) {
    trend = 'stable';
  } else if (percentageChange > 0) {
    trend = 'up';
  } else {
    trend = 'down';
  }

  return {
    current,
    previous,
    change,
    percentageChange,
    trend
  };
}

/**
 * ============================================================================
 * TOP EMISSION SOURCES CALCULATOR
 * ============================================================================
 */

export interface EmissionSource {
  category: string;
  scope: string;
  emissions: number; // tCO2e
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  yoyChange: number | null;
  recommendation: string;
}

/**
 * Get top emission sources ranked by total emissions
 * Includes YoY trend and AI-powered recommendations
 */
export async function getTopEmissionSources(
  organizationId: string,
  startDate: string,
  endDate: string,
  limit: number = 5,
  siteId?: string
): Promise<EmissionSource[]> {
  // Get category breakdown for current period
  const categories = await getCategoryBreakdown(organizationId, startDate, endDate, siteId);

  // Get previous year same period for trends
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);
  const prevStartDate = new Date(startDateObj.getFullYear() - 1, startDateObj.getMonth(), startDateObj.getDate());
  const prevEndDate = new Date(endDateObj.getFullYear() - 1, endDateObj.getMonth(), endDateObj.getDate());

  const prevCategories = await getCategoryBreakdown(
    organizationId,
    prevStartDate.toISOString().split('T')[0],
    prevEndDate.toISOString().split('T')[0],
    siteId
  );

  // Create lookup map for previous year
  const prevMap = new Map(prevCategories.map(c => [c.category, c.total]));

  // Build emission sources with trends and recommendations
  const sources: EmissionSource[] = categories.slice(0, limit).map(cat => {
    // Determine primary scope
    let scope = 'Scope 1';
    if (cat.scope_2 > cat.scope_1 && cat.scope_2 > cat.scope_3) scope = 'Scope 2';
    if (cat.scope_3 > cat.scope_1 && cat.scope_3 > cat.scope_2) scope = 'Scope 3';

    // Calculate YoY
    const prevTotal = prevMap.get(cat.category) || 0;
    let yoyChange: number | null = null;
    let trend: 'up' | 'down' | 'stable' = 'stable';

    if (prevTotal > 0) {
      yoyChange = Math.round(((cat.total - prevTotal) / prevTotal) * 1000) / 10;
      if (Math.abs(yoyChange) < 1) {
        trend = 'stable';
      } else if (yoyChange > 0) {
        trend = 'up';
      } else {
        trend = 'down';
      }
    }

    // Generate recommendation based on category and scope
    let recommendation = '';
    if (cat.category === 'Business Travel') {
      recommendation = 'Implement virtual meeting policy and promote public transportation';
    } else if (cat.category === 'Purchased Energy' || cat.category === 'Electricity') {
      recommendation = 'Switch to renewable energy contracts and improve energy efficiency';
    } else if (cat.category === 'Employee Commuting') {
      recommendation = 'Encourage carpooling, remote work, and provide EV charging stations';
    } else if (cat.category === 'Waste') {
      recommendation = 'Implement waste reduction and recycling programs';
    } else if (cat.category === 'Purchased Goods and Services') {
      recommendation = 'Engage suppliers with lower carbon footprints and optimize procurement';
    } else {
      recommendation = 'Monitor and set reduction targets for this emission source';
    }

    return {
      category: cat.category,
      scope,
      emissions: cat.total,
      percentage: cat.percentage,
      trend,
      yoyChange,
      recommendation
    };
  });

  return sources;
}

/**
 * ============================================================================
 * PROJECTED EMISSIONS CALCULATOR
 * ============================================================================
 */

export interface ProjectedEmissions {
  actualEmissions: number; // Actual emissions to date
  projectedTotal: number; // Projected full year total
  forecastEmissions: number; // Forecasted emissions for remaining period
  confidenceLevel: number; // 0-100
  method: string; // Forecasting method used
  daysActual: number;
  daysRemaining: number;
}

/**
 * Calculate projected annual emissions based on actual + forecast
 * Uses simple linear projection or advanced ML forecast if available
 */
export async function getProjectedAnnualEmissions(
  organizationId: string,
  year: number
): Promise<ProjectedEmissions> {
  const today = new Date();
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31);

  // Get actual emissions year-to-date
  const actualEmissions = await getPeriodEmissions(
    organizationId,
    yearStart.toISOString().split('T')[0],
    today.toISOString().split('T')[0]
  );

  // Calculate days
  const daysActual = Math.floor((today.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24));
  const daysInYear = Math.floor((yearEnd.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = daysInYear - daysActual;

  // Simple linear projection (can be replaced with ML forecast later)
  const dailyAverage = actualEmissions.total / daysActual;
  const forecastEmissions = Math.round(dailyAverage * daysRemaining * 10) / 10;
  const projectedTotal = Math.round((actualEmissions.total + forecastEmissions) * 10) / 10;

  // Confidence based on how much data we have
  const confidenceLevel = Math.min(95, Math.round((daysActual / daysInYear) * 100));

  return {
    actualEmissions: actualEmissions.total,
    projectedTotal,
    forecastEmissions,
    confidenceLevel,
    method: 'linear-projection',
    daysActual,
    daysRemaining
  };
}

/**
 * ============================================================================
 * INDIVIDUAL CATEGORY CALCULATORS
 * ============================================================================
 */

export interface CategoryEmissions {
  category: string;
  scope: string;
  emissions: number; // tCO2e
  percentage: number;
  recordCount: number;
}

/**
 * Get emissions for a specific category (e.g., "Business Travel", "Purchased Energy")
 * Uses same scope-by-scope rounding logic for consistency
 */
export async function getCategoryEmissions(
  organizationId: string,
  category: string,
  startDate: string,
  endDate: string
): Promise<CategoryEmissions | null> {
  const metricsData = await fetchAllMetricsData(
    organizationId,
    `
      co2e_emissions,
      metrics_catalog!inner(scope, category)
    `,
    startDate,
    endDate,
    { 'metrics_catalog.category': category }
  );

  if (!metricsData || metricsData.length === 0) {
    return null;
  }

  // Determine primary scope for this category
  const scopeCounts = { scope_1: 0, scope_2: 0, scope_3: 0 };
  metricsData.forEach(d => {
    const scope = (d.metrics_catalog as any)?.scope;
    if (scope) scopeCounts[scope as keyof typeof scopeCounts]++;
  });
  const primaryScope = Object.keys(scopeCounts).reduce((a, b) =>
    scopeCounts[a as keyof typeof scopeCounts] > scopeCounts[b as keyof typeof scopeCounts] ? a : b
  );

  // Calculate total emissions with rounding
  const totalKg = metricsData.reduce((sum, d) => sum + (d.co2e_emissions || 0), 0);
  const emissions = Math.round(totalKg / 1000 * 10) / 10;

  // Get total emissions for percentage calculation
  const totalEmissions = await getPeriodEmissions(organizationId, startDate, endDate);
  const percentage = totalEmissions.total > 0
    ? Math.round((emissions / totalEmissions.total) * 1000) / 10
    : 0;

  return {
    category,
    scope: primaryScope,
    emissions,
    percentage,
    recordCount: metricsData.length
  };
}

/**
 * Get emissions for all categories in a specific scope
 * Returns array of categories sorted by emissions (highest first)
 */
export async function getScopeCategoryBreakdown(
  organizationId: string,
  scope: 'scope_1' | 'scope_2' | 'scope_3',
  startDate: string,
  endDate: string,
  siteId?: string
): Promise<CategoryEmissions[]> {
  const additionalFilters: Record<string, any> = { 'metrics_catalog.scope': scope };
  if (siteId) {
    additionalFilters.site_id = siteId;
  }

  const metricsData = await fetchAllMetricsData(
    organizationId,
    `
      co2e_emissions,
      metrics_catalog!inner(scope, category)
    `,
    startDate,
    endDate,
    additionalFilters
  );

  if (!metricsData || metricsData.length === 0) {
    return [];
  }

  // Group by category
  const categoryMap = new Map<string, { emissions: number; count: number }>();

  metricsData.forEach(d => {
    const category = (d.metrics_catalog as any)?.category || 'Unknown';
    const emissionsKg = d.co2e_emissions || 0;

    if (!categoryMap.has(category)) {
      categoryMap.set(category, { emissions: 0, count: 0 });
    }

    const cat = categoryMap.get(category)!;
    cat.emissions += emissionsKg;
    cat.count++;
  });

  // Calculate total for percentages
  const scopeTotal = Array.from(categoryMap.values())
    .reduce((sum, cat) => sum + cat.emissions, 0) / 1000;
  const scopeTotalRounded = Math.round(scopeTotal * 10) / 10;

  // Build category array
  const categories: CategoryEmissions[] = [];
  categoryMap.forEach((data, category) => {
    const emissions = Math.round(data.emissions / 1000 * 10) / 10;
    const percentage = scopeTotalRounded > 0
      ? Math.round((emissions / scopeTotalRounded) * 1000) / 10
      : 0;

    categories.push({
      category,
      scope,
      emissions,
      percentage,
      recordCount: data.count
    });
  });

  // Sort by emissions (highest first)
  return categories.sort((a, b) => b.emissions - a.emissions);
}

/**
 * ============================================================================
 * INDIVIDUAL METRIC CALCULATORS
 * ============================================================================
 */

export interface MetricValue {
  name: string;
  value: number;
  unit: string;
  category: string;
  scope: string;
  emissions: number; // tCO2e generated by this metric
  recordCount: number;
}

/**
 * Get value for a specific metric (e.g., "Electricity", "Car Travel")
 * Returns actual value in its native unit + emissions generated
 */
export async function getMetricValue(
  organizationId: string,
  metricName: string,
  startDate: string,
  endDate: string
): Promise<MetricValue | null> {
  const metricsData = await fetchAllMetricsData(
    organizationId,
    `
      value,
      co2e_emissions,
      metrics_catalog!inner(name, unit, category, scope)
    `,
    startDate,
    endDate,
    { 'metrics_catalog.name': metricName }
  );

  if (!metricsData || metricsData.length === 0) {
    return null;
  }

  // Get metadata from first record
  const catalog = (metricsData[0].metrics_catalog as any);
  const name = catalog?.name || metricName;
  const unit = catalog?.unit || '';
  const category = catalog?.category || '';
  const scope = catalog?.scope || '';

  // Sum values and emissions
  const totalValue = metricsData.reduce((sum, d) => sum + (d.value || 0), 0);
  const totalEmissionsKg = metricsData.reduce((sum, d) => sum + (d.co2e_emissions || 0), 0);

  // Round based on unit type
  let value = totalValue;
  if (unit === 'kWh' || unit === 'MWh') {
    value = Math.round(totalValue * 10) / 10; // 1 decimal for energy
  } else if (unit === 'km' || unit === 'm³' || unit === 'kg') {
    value = Math.round(totalValue); // Integer for distances, volumes, weights
  } else if (unit === 'EUR' || unit === 'USD') {
    value = Math.round(totalValue * 100) / 100; // 2 decimals for currency
  } else {
    value = Math.round(totalValue * 10) / 10; // 1 decimal default
  }

  const emissions = Math.round(totalEmissionsKg / 1000 * 10) / 10;

  return {
    name,
    value,
    unit,
    category,
    scope,
    emissions,
    recordCount: metricsData.length
  };
}

/**
 * Get all metrics for a specific category
 * Returns array sorted by emissions (highest first)
 */
export async function getCategoryMetrics(
  organizationId: string,
  category: string,
  startDate: string,
  endDate: string
): Promise<MetricValue[]> {
  const metricsData = await fetchAllMetricsData(
    organizationId,
    `
      value,
      co2e_emissions,
      metrics_catalog!inner(name, unit, category, scope)
    `,
    startDate,
    endDate,
    { 'metrics_catalog.category': category }
  );

  if (!metricsData || metricsData.length === 0) {
    return [];
  }

  // Group by metric name
  const metricMap = new Map<string, {
    value: number;
    emissions: number;
    count: number;
    unit: string;
    scope: string;
  }>();

  metricsData.forEach(d => {
    const catalog = (d.metrics_catalog as any);
    const name = catalog?.name || 'Unknown';
    const unit = catalog?.unit || '';
    const scope = catalog?.scope || '';

    if (!metricMap.has(name)) {
      metricMap.set(name, { value: 0, emissions: 0, count: 0, unit, scope });
    }

    const metric = metricMap.get(name)!;
    metric.value += d.value || 0;
    metric.emissions += (d.co2e_emissions || 0) / 1000;
    metric.count++;
  });

  // Build metrics array
  const metrics: MetricValue[] = [];
  metricMap.forEach((data, name) => {
    // Round based on unit type
    let value = data.value;
    if (data.unit === 'kWh' || data.unit === 'MWh') {
      value = Math.round(data.value * 10) / 10;
    } else if (data.unit === 'km' || data.unit === 'm³' || data.unit === 'kg') {
      value = Math.round(data.value);
    } else if (data.unit === 'EUR' || data.unit === 'USD') {
      value = Math.round(data.value * 100) / 100;
    } else {
      value = Math.round(data.value * 10) / 10;
    }

    const emissions = Math.round(data.emissions * 10) / 10;

    metrics.push({
      name,
      value,
      unit: data.unit,
      category,
      scope: data.scope,
      emissions,
      recordCount: data.count
    });
  });

  // Sort by emissions (highest first)
  return metrics.sort((a, b) => b.emissions - a.emissions);
}

/**
 * Get top metrics across all categories
 * Returns highest emission-generating metrics regardless of category
 */
export async function getTopMetrics(
  organizationId: string,
  startDate: string,
  endDate: string,
  limit: number = 10,
  siteId?: string
): Promise<MetricValue[]> {
  const additionalFilters = siteId ? { site_id: siteId } : undefined;

  const metricsData = await fetchAllMetricsData(
    organizationId,
    `
      value,
      co2e_emissions,
      metrics_catalog!inner(name, unit, category, scope)
    `,
    startDate,
    endDate,
    additionalFilters
  );

  if (!metricsData || metricsData.length === 0) {
    return [];
  }

  // Group by metric name
  const metricMap = new Map<string, {
    value: number;
    emissions: number;
    count: number;
    unit: string;
    category: string;
    scope: string;
  }>();

  metricsData.forEach(d => {
    const catalog = (d.metrics_catalog as any);
    const name = catalog?.name || 'Unknown';
    const unit = catalog?.unit || '';
    const category = catalog?.category || '';
    const scope = catalog?.scope || '';

    if (!metricMap.has(name)) {
      metricMap.set(name, { value: 0, emissions: 0, count: 0, unit, category, scope });
    }

    const metric = metricMap.get(name)!;
    metric.value += d.value || 0;
    metric.emissions += (d.co2e_emissions || 0) / 1000;
    metric.count++;
  });

  // Build metrics array
  const metrics: MetricValue[] = [];
  metricMap.forEach((data, name) => {
    // Round based on unit type
    let value = data.value;
    if (data.unit === 'kWh' || data.unit === 'MWh') {
      value = Math.round(data.value * 10) / 10;
    } else if (data.unit === 'km' || data.unit === 'm³' || data.unit === 'kg') {
      value = Math.round(data.value);
    } else if (data.unit === 'EUR' || data.unit === 'USD') {
      value = Math.round(data.value * 100) / 100;
    } else {
      value = Math.round(data.value * 10) / 10;
    }

    const emissions = Math.round(data.emissions * 10) / 10;

    metrics.push({
      name,
      value,
      unit: data.unit,
      category: data.category,
      scope: data.scope,
      emissions,
      recordCount: data.count
    });
  });

  // Sort by emissions (highest first) and limit
  return metrics.sort((a, b) => b.emissions - a.emissions).slice(0, limit);
}
