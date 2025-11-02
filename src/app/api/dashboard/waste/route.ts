/**
 * Consolidated Waste Dashboard API
 *
 * Replaces 8+ separate API calls with a single optimized endpoint.
 *
 * Returns:
 * - Current period data (recycling, disposal, composting, e-waste, incineration)
 * - Previous year data (for YoY comparison)
 * - Baseline data (dynamic baseline year from targets)
 * - Forecast data (ML-based projections)
 * - Target data (baseline, target, progress)
 * - Site comparison data (all sites in one query - NO N+1!)
 *
 * Performance: 8+ calls → 1 call = 8x faster
 */

import { getAPIUser } from '@/lib/auth/server-auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { UnifiedSustainabilityCalculator } from '@/lib/sustainability/unified-calculator';
import { ForecastService } from '@/lib/api/dashboard/core/ForecastService';
import { wasteConfig } from '@/lib/api/dashboard/configs/waste.config';
import { calculateProgress } from '@/lib/utils/progress-calculation';
import { NextRequest, NextResponse } from 'next/server';

// Shared cache for targets (avoid duplicate fetches across domains)
const targetsCache = new Map<string, { data: any; timestamp: number }>();
const TARGETS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getCachedTargets(organizationId: string) {
  const cached = targetsCache.get(organizationId);
  const now = Date.now();

  if (cached && now - cached.timestamp < TARGETS_CACHE_TTL) {
    return cached.data;
  }

  const { data, error } = await supabaseAdmin
    .from('sustainability_targets')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  targetsCache.set(organizationId, { data, timestamp: now });
  return data;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const siteId = searchParams.get('siteId');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    console.log('🔍 [Waste API] Request params:', {
      organizationId,
      siteId: siteId || 'ALL SITES',
      startDate,
      endDate,
      hasSiteFilter: !!siteId,
    });

    if (!organizationId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required parameters: organizationId, start_date, end_date' },
        { status: 400 }
      );
    }

    const currentYear = new Date().getFullYear();
    const selectedYear = new Date(startDate).getFullYear();

    // Get sustainability targets (cached!)
    const sustainabilityTarget = await getCachedTargets(organizationId);

    // ✅ NO HARDCODED! Require sustainability_target with baseline_year
    if (!sustainabilityTarget || !sustainabilityTarget.baseline_year) {
      return NextResponse.json(
        { error: 'Organization must have a sustainability_target with baseline_year configured' },
        { status: 400 }
      );
    }

    const baselineYear = sustainabilityTarget.baseline_year;

    // Initialize unified calculator
    const calculator = new UnifiedSustainabilityCalculator(organizationId);

    // Fetch all data in parallel
    const [
      currentData,
      previousYearData,
      baselineData,
      forecast,
      baseline,
      target,
      siteComparison
    ] = await Promise.all([
      // Current period data
      getWasteData(organizationId, startDate, endDate, siteId),

      // Previous year data (for YoY)
      getPreviousYearWasteData(organizationId, startDate, endDate, siteId),

      // Baseline data (only for current year view)
      selectedYear === currentYear
        ? getWasteData(organizationId, `${baselineYear}-01-01`, `${baselineYear}-12-31`, siteId)
        : Promise.resolve(null),

      // Forecast (only for current year) - Using unified ForecastService
      selectedYear === currentYear
        ? getForecastWithCalculations(organizationId, siteId, calculator)
        : Promise.resolve(null),

      // Targets (using unified calculator - cached!)
      // NOTE: Baseline and target are always org-wide
      calculator.getBaseline('waste', baselineYear),
      calculator.getTarget('waste'),

      // Site comparison (single query for all sites!)
      getWasteSiteComparison(organizationId, startDate, endDate)
    ]);

    // ✅ Use forecast.value as projected (avoid duplicate calculation)
    const projected = forecast?.value || (await calculator.getProjected('waste', siteId))?.value || 0;

    console.log('📊 [Waste API] Projected calculation:', {
      forecastValue: forecast?.value,
      forecastMethod: forecast?.method,
      finalProjected: projected,
      source: forecast?.value ? 'prophet-forecast' : 'calculator-fallback',
    });

    // ✅ Manual progress calculation (avoid calling getProjected() again via calculateProgressToTarget)
    const progress = baseline && target && projected
      ? {
          baseline: baseline.value,
          target: target.value,
          projected: projected,
          ...calculateProgress(baseline.value, target.value, projected),
        }
      : null;

    console.log('🎯 [dashboard/waste] Final response summary:', {
      hasCurrent: !!currentData && currentData.total_waste > 0,
      hasPrevious: !!previousYearData && previousYearData.total_waste > 0,
      hasBaseline: !!baselineData && baselineData.total_waste > 0,
      hasForecast: !!forecast,
      sitesCount: siteComparison.length,
      currentWaste: currentData?.total_waste || 0,
      previousWaste: previousYearData?.total_waste || 0,
      baselineWaste: baselineData?.total_waste || 0,
      calculatorBaseline: baseline?.value || 0,
      calculatorTarget: target?.value || 0,
      projected,
    });

    const responseData = {
      success: true,
      data: {
        current: currentData,
        previous: previousYearData,
        baseline: baselineData,
        forecast: forecast ? {
          value: forecast.value,
          ytd: forecast.ytd,
          projected: forecast.forecast,
          method: forecast.method,
          breakdown: forecast.breakdown || [],
        } : null,
        targets: {
          baseline: baseline?.value || 0,
          target: target?.value || 0,
          projected: projected || 0,
          baselineYear,
          targetYear: currentYear,
          progress: progress ? {
            progressPercent: progress.progressPercent,
            status: progress.status,
            reductionNeeded: progress.reductionNeeded,
            reductionAchieved: progress.reductionAchieved,
          } : null,
        },
        sites: siteComparison,
      },
      meta: {
        period: { start: startDate, end: endDate },
        siteId: siteId || 'all',
        apiCalls: 1,
        cached: {
          targets: true,
          baseline: baseline !== null,
          forecast: forecast !== null,
        }
      }
    };

    console.log('📤 [dashboard/waste] Response targets being sent:', {
      baseline: responseData.data.targets.baseline,
      target: responseData.data.targets.target,
      projected: responseData.data.targets.projected,
    });

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('❌ [dashboard/waste] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get waste data for a specific period
 */
async function getWasteData(
  organizationId: string,
  startDate: string,
  endDate: string,
  siteId?: string | null
) {
  // Filter out future months - only include data through current month
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const maxHistoricalDate = new Date(currentYear, currentMonth, 0); // Last day of current month
  const requestedEndDate = new Date(endDate);

  // Use the earlier of: requested end date OR current month end
  const effectiveEndDate = requestedEndDate <= maxHistoricalDate
    ? endDate
    : maxHistoricalDate.toISOString().split('T')[0];

  console.log('📅 [getWasteData] Date filtering:', {
    currentDate: now.toISOString().split('T')[0],
    currentMonth,
    requestedEndDate: endDate,
    effectiveEndDate,
    filtering: requestedEndDate > maxHistoricalDate ? 'YES - excluding future months' : 'NO - within historical range'
  });

  // Dynamic query using database-driven filters (NO HARDCODED!)
  let query = supabaseAdmin
    .from('metrics_data')
    .select(`
      value,
      period_start,
      metric_id,
      metadata,
      metrics_catalog!inner(
        category,
        subcategory,
        unit,
        name
      )
    `)
    .eq('organization_id', organizationId)
    .eq('metrics_catalog.category', 'Waste')
    .gte('period_start', startDate)
    .lte('period_start', effectiveEndDate);

  if (siteId) {
    console.log(`🎯 [getWasteData] Applying site filter: ${siteId}`);
    query = query.eq('site_id', siteId);
  } else {
    console.log('🌍 [getWasteData] No site filter - fetching ALL sites');
  }

  console.log('🔍 [getWasteData] Query parameters:', {
    organizationId,
    startDate,
    endDate,
    effectiveEndDate,
    siteId: siteId || 'all',
  });

  const { data, error } = await query;

  console.log('📊 [getWasteData] Query result:', {
    recordsFound: data?.length || 0,
    hasError: !!error,
    error: error?.message,
  });

  if (error) {
    console.error('❌ [getWasteData] Error fetching waste data:', error);
    return null;
  }

  if (!data || data.length === 0) {
    console.log('⚠️ [getWasteData] No waste data found - returning zeros');
    return {
      total_waste: 0,
      recycling: 0,
      disposal: 0,
      composting: 0,
      e_waste: 0,
      incineration: 0,
      diversion_rate: 0,
      monthly_trends: [],
      breakdown_by_type: [],
      unit: 'kg',
    };
  }

  console.log('✅ [getWasteData] Processing', data.length, 'records');

  // Helper: Convert to kg (handle tonnes, g, etc.)
  const convertToKg = (value: number, unit: string): number => {
    const unitLower = unit.toLowerCase().trim();
    if (unitLower === 'kg' || unitLower === 'kilograms') return value;
    if (unitLower === 't' || unitLower === 'tonnes' || unitLower === 'tons') return value * 1000; // tonnes to kg
    if (unitLower === 'g' || unitLower === 'grams') return value / 1000; // g to kg
    return value; // Assume kg if unknown
  };

  // Aggregate totals by subcategory
  let recycling = 0;
  let disposal = 0;
  let composting = 0;
  let eWaste = 0;
  let incineration = 0;

  // Group by month for trends
  const monthlyData = new Map<string, {
    monthKey: string;
    month: string;
    recycling: number;
    disposal: number;
    composting: number;
    eWaste: number;
    incineration: number;
    total: number;
  }>();

  // Group by type
  const typeBreakdown = new Map<string, {
    name: string;
    value: number;
  }>();

  data.forEach((row: any) => {
    const rawValue = parseFloat(row.value?.toString() || '0');
    const unit = row.metrics_catalog?.unit || 'kg';
    const value = convertToKg(rawValue, unit); // Convert to kg

    const subcategory = row.metrics_catalog?.subcategory || 'Other';

    // Aggregate by subcategory
    switch (subcategory) {
      case 'Recycling':
        recycling += value;
        break;
      case 'Disposal':
        disposal += value;
        break;
      case 'Composting':
        composting += value;
        break;
      case 'E-Waste':
        eWaste += value;
        break;
      case 'Incineration':
        incineration += value;
        break;
    }

    // Group by month
    const periodStart = new Date(row.period_start);
    const monthKey = `${periodStart.getFullYear()}-${String(periodStart.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = periodStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, {
        monthKey,
        month: monthLabel,
        recycling: 0,
        disposal: 0,
        composting: 0,
        eWaste: 0,
        incineration: 0,
        total: 0,
      });
    }
    const monthEntry = monthlyData.get(monthKey)!;
    switch (subcategory) {
      case 'Recycling':
        monthEntry.recycling += value;
        break;
      case 'Disposal':
        monthEntry.disposal += value;
        break;
      case 'Composting':
        monthEntry.composting += value;
        break;
      case 'E-Waste':
        monthEntry.eWaste += value;
        break;
      case 'Incineration':
        monthEntry.incineration += value;
        break;
    }
    monthEntry.total += value;

    // Group by type
    if (!typeBreakdown.has(subcategory)) {
      typeBreakdown.set(subcategory, {
        name: subcategory,
        value: 0,
      });
    }
    typeBreakdown.get(subcategory)!.value += value;
  });

  // Calculate total waste
  const totalWaste = recycling + disposal + composting + eWaste + incineration;

  // Calculate diversion rate (diverted from landfill)
  const diverted = recycling + composting;
  const diversionRate = totalWaste > 0 ? (diverted / totalWaste) * 100 : 0;

  console.log('📊 [Waste Calculation]:', {
    totalWaste: totalWaste.toFixed(2),
    recycling: recycling.toFixed(2),
    disposal: disposal.toFixed(2),
    composting: composting.toFixed(2),
    eWaste: eWaste.toFixed(2),
    incineration: incineration.toFixed(2),
    diversionRate: diversionRate.toFixed(2),
  });

  const result = {
    total_waste: totalWaste,
    recycling,
    disposal,
    composting,
    e_waste: eWaste,
    incineration,
    diversion_rate: diversionRate,
    monthly_trends: Array.from(monthlyData.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey)),
    breakdown_by_type: Array.from(typeBreakdown.values()),
    unit: 'kg',
  };

  console.log('📈 [getWasteData] Final result:', {
    totalWaste: totalWaste.toFixed(2),
    diversionRate: diversionRate.toFixed(2),
    monthlyTrendsCount: result.monthly_trends.length,
    breakdownCount: result.breakdown_by_type.length,
  });

  return result;
}

/**
 * Get previous year waste data (same period, shifted by 1 year)
 */
async function getPreviousYearWasteData(
  organizationId: string,
  startDate: string,
  endDate: string,
  siteId?: string | null
) {
  const previousYearStart = new Date(startDate);
  previousYearStart.setFullYear(previousYearStart.getFullYear() - 1);

  const previousYearEnd = new Date(endDate);
  previousYearEnd.setFullYear(previousYearEnd.getFullYear() - 1);

  return getWasteData(
    organizationId,
    previousYearStart.toISOString().split('T')[0],
    previousYearEnd.toISOString().split('T')[0],
    siteId
  );
}

/**
 * Get site comparison data (all sites in ONE query - no N+1!)
 */
async function getWasteSiteComparison(
  organizationId: string,
  startDate: string,
  endDate: string
) {
  // Get all sites for organization
  const { data: sites, error: sitesError } = await supabaseAdmin
    .from('sites')
    .select('id, name, total_area_sqm')
    .eq('organization_id', organizationId);

  if (sitesError || !sites || sites.length === 0) {
    return [];
  }

  // Single query for ALL sites waste data
  const { data: metricsData, error: metricsError} = await supabaseAdmin
    .from('metrics_data')
    .select(`
      value,
      site_id,
      metrics_catalog!inner(
        category,
        subcategory,
        name,
        unit
      )
    `)
    .eq('organization_id', organizationId)
    .eq('metrics_catalog.category', 'Waste')
    .gte('period_start', startDate)
    .lte('period_start', endDate)
    .in('site_id', sites.map(s => s.id));

  if (metricsError) {
    console.error('Error fetching site metrics:', metricsError);
    return [];
  }

  // Aggregate by site
  const siteDataMap = new Map<string, {
    total: number;
    recycling: number;
    disposal: number;
  }>();

  // Helper: Convert to kg (same as getWasteData)
  const convertToKg = (value: number, unit: string): number => {
    const unitLower = unit.toLowerCase().trim();
    if (unitLower === 'kg' || unitLower === 'kilograms') return value;
    if (unitLower === 't' || unitLower === 'tonnes' || unitLower === 'tons') return value * 1000;
    if (unitLower === 'g' || unitLower === 'grams') return value / 1000;
    return value;
  };

  metricsData?.forEach((row: any) => {
    const siteId = row.site_id;
    const rawValue = parseFloat(row.value?.toString() || '0');
    const unit = row.metrics_catalog?.unit || 'kg';
    const value = convertToKg(rawValue, unit); // Convert to kg
    const subcategory = row.metrics_catalog?.subcategory || 'Other';

    if (!siteDataMap.has(siteId)) {
      siteDataMap.set(siteId, { total: 0, recycling: 0, disposal: 0 });
    }

    const siteData = siteDataMap.get(siteId)!;
    siteData.total += value;

    if (subcategory === 'Recycling' || subcategory === 'Composting') {
      siteData.recycling += value;
    } else if (subcategory === 'Disposal' || subcategory === 'Incineration' || subcategory === 'E-Waste') {
      siteData.disposal += value;
    }
  });

  // Build final site comparison array
  return sites
    .map(site => {
      const data = siteDataMap.get(site.id) || { total: 0, recycling: 0, disposal: 0 };

      // ✅ NO HARDCODED! Require total_area_sqm to be set (NOT NULL in DB)
      if (!site.total_area_sqm || site.total_area_sqm <= 0) {
        console.warn(`Site ${site.id} (${site.name}) has invalid total_area_sqm - excluded from comparison`);
        return null; // Exclude sites without valid area
      }

      const intensity = data.total / site.total_area_sqm; // kg/m²
      const diversionRate = data.total > 0 ? (data.recycling / data.total) * 100 : 0;

      return {
        id: site.id,
        name: site.name,
        total: data.total,
        recycling: data.recycling,
        disposal: data.disposal,
        diversion_rate: parseFloat(diversionRate.toFixed(1)),
        intensity: parseFloat(intensity.toFixed(3)),
        area: site.total_area_sqm,
        unit: 'kg',
      };
    })
    .filter((site): site is NonNullable<typeof site> => site !== null) // Remove null entries
    .sort((a, b) => b.total - a.total); // Sort by total (highest first)
}

/**
 * Get waste forecast using unified ForecastService with calculations
 * Uses ForecastService (Prophet + EnterpriseForecast fallback)
 */
async function getForecastWithCalculations(
  organizationId: string,
  siteId: string | null,
  calculator: UnifiedSustainabilityCalculator
) {
  try {
    // If no site selected, aggregate Prophet forecasts from ALL sites
    if (!siteId) {
      console.log('🌍 [Waste Forecast] No site selected - aggregating Prophet forecasts from all sites');
      return await getAggregatedProphetForecast(organizationId, calculator);
    }

    // For site-specific: Use unified ForecastService (Prophet + fallback)
    const forecastResult = await ForecastService.getForecast(
      organizationId,
      siteId,
      wasteConfig,
      calculator
    );

    if (!forecastResult) {
      console.log('⚠️ [Waste Forecast] No Prophet data - falling back to calculator');
      return await calculator.getProjected('waste', siteId);
    }

    // Get YTD actual value (for this specific site)
    const ytd = await calculator.getYTDActual('waste', siteId);

    // Calculate total forecasted value (sum of all forecast months)
    const forecastedTotal = forecastResult.forecast.reduce((sum, month) => sum + month.total, 0);
    const projectedValue = (ytd || 0) + forecastedTotal;  // ✅ FIXED: ytd is a number, not an object

    console.log(`✅ [Waste Forecast] Using ${forecastResult.model} forecast`, {
      model: forecastResult.model,
      confidence: forecastResult.confidence,
      dataPoints: forecastResult.forecast.length,
      ytdValue: ytd,
      forecastedTotal,
      projectedValue,
      calculation: `${ytd} + ${forecastedTotal} = ${projectedValue}`,
    });

    return {
      value: projectedValue,
      ytd: ytd || 0,  // ✅ FIXED: ytd is a number, not an object
      forecast: forecastResult.forecast,
      method: forecastResult.model,
      breakdown: forecastResult.forecast,
      metadata: {
        ...forecastResult.metadata,
        confidence: forecastResult.confidence,
        source: forecastResult.model === 'prophet' ? 'prophet-service' : 'enterprise-forecast',
      },
    };
  } catch (error) {
    console.error('❌ [Waste Forecast] Error in getForecastWithCalculations:', error);
    return await calculator.getProjected('waste');
  }
}

/**
 * Aggregate Prophet forecasts from all sites in the organization
 * Falls back to EnterpriseForecast if no Prophet data available
 */
async function getAggregatedProphetForecast(
  organizationId: string,
  calculator: UnifiedSustainabilityCalculator
) {
  try {
    // Get all sites for this organization
    const { data: sites, error: sitesError } = await supabaseAdmin
      .from('sites')
      .select('id, name')
      .eq('organization_id', organizationId);

    if (sitesError || !sites || sites.length === 0) {
      console.log('⚠️ [Aggregated Forecast] No sites found - using EnterpriseForecast');
      return await calculator.getProjected('waste');
    }

    console.log(`📊 [Aggregated Forecast] Found ${sites.length} sites - fetching Prophet forecasts`);

    // Fetch Prophet forecasts for all sites in parallel
    const forecastPromises = sites.map(site =>
      ForecastService.getForecast(organizationId, site.id, wasteConfig, calculator)
    );
    const forecasts = await Promise.all(forecastPromises);

    // Filter out null forecasts and keep only Prophet forecasts
    const prophetForecasts = forecasts.filter(f => f && f.hasProphetData);

    if (prophetForecasts.length === 0) {
      console.log('⚠️ [Aggregated Forecast] No Prophet forecasts available - using EnterpriseForecast');
      return await calculator.getProjected('waste');
    }

    console.log(`✅ [Aggregated Forecast] Found ${prophetForecasts.length}/${sites.length} sites with Prophet forecasts`);

    // Aggregate forecasts month by month
    const aggregatedForecast = aggregateForecasts(prophetForecasts);

    // Get organization-wide YTD
    const ytd = await calculator.getYTDActual('waste');

    // Calculate total forecasted value
    const forecastedTotal = aggregatedForecast.reduce((sum, month) => sum + month.total, 0);
    const projectedValue = (ytd || 0) + forecastedTotal;

    console.log('✅ [Aggregated Forecast] Successfully aggregated Prophet forecasts:', {
      sitesWithProphet: prophetForecasts.length,
      totalSites: sites.length,
      forecastMonths: aggregatedForecast.length,
      ytdValue: ytd,
      forecastedTotal,
      projectedValue,
      calculation: `${ytd} + ${forecastedTotal} = ${projectedValue}`,
    });

    return {
      value: projectedValue,
      ytd: ytd || 0,
      forecast: aggregatedForecast,
      method: 'prophet',
      breakdown: aggregatedForecast,
      metadata: {
        totalTrend: 'aggregated',
        dataPoints: prophetForecasts.reduce((sum, f) => sum + f.metadata.dataPoints, 0),
        generatedAt: new Date().toISOString(),
        method: 'prophet-aggregated',
        forecastHorizon: aggregatedForecast.length,
        confidence: prophetForecasts.reduce((sum, f) => sum + f.confidence, 0) / prophetForecasts.length,
        source: 'prophet-service',
        sitesAggregated: prophetForecasts.length,
      },
    };
  } catch (error) {
    console.error('❌ [Aggregated Forecast] Error:', error);
    return await calculator.getProjected('waste');
  }
}

/**
 * Aggregate multiple Prophet forecasts by summing month by month
 */
function aggregateForecasts(forecasts: any[]) {
  if (forecasts.length === 0) return [];

  // Use the first forecast as template for monthKeys and months
  const template = forecasts[0].forecast;

  return template.map((monthTemplate: any, i: number) => {
    // Sum values from all forecasts for this month
    const total = forecasts.reduce((sum, f) => sum + (f.forecast[i]?.total || 0), 0);

    const totalLower = forecasts.reduce((sum, f) => sum + (f.forecast[i]?.confidence?.totalLower || 0), 0);
    const totalUpper = forecasts.reduce((sum, f) => sum + (f.forecast[i]?.confidence?.totalUpper || 0), 0);

    return {
      monthKey: monthTemplate.monthKey,
      month: monthTemplate.month,
      total,
      isForecast: true,
      confidence: {
        totalLower,
        totalUpper,
      },
    };
  });
}
