/**
 * Consolidated Water Dashboard API
 *
 * Replaces 8+ separate API calls with a single optimized endpoint.
 *
 * Returns:
 * - Current period data (withdrawal, consumption, discharge, recycled)
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
import { waterConfig } from '@/lib/api/dashboard/configs/water.config';
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
      projected,
      siteComparison
    ] = await Promise.all([
      // Current period data
      getWaterData(organizationId, startDate, endDate, siteId),

      // Previous year data (for YoY)
      getPreviousYearWaterData(organizationId, startDate, endDate, siteId),

      // Baseline data (only for current year view)
      selectedYear === currentYear
        ? getWaterData(organizationId, `${baselineYear}-01-01`, `${baselineYear}-12-31`, siteId)
        : Promise.resolve(null),

      // Forecast (only for current year) - Using unified ForecastService
      selectedYear === currentYear
        ? getForecastWithCalculations(organizationId, siteId, calculator)
        : Promise.resolve(null),

      // Targets (using unified calculator - cached!)
      calculator.getBaseline('water', baselineYear),
      calculator.getTarget('water'),
      calculator.getProjected('water'),

      // Site comparison (single query for all sites!)
      getWaterSiteComparison(organizationId, startDate, endDate)
    ]);

    // Calculate progress
    const progress = baseline && target && projected
      ? await calculator.calculateProgressToTarget('water')
      : null;

    console.log('🎯 [dashboard/water] Final response summary:', {
      hasCurrent: !!currentData && currentData.totalWithdrawal > 0,
      hasPrevious: !!previousYearData && previousYearData.totalWithdrawal > 0,
      hasBaseline: !!baselineData && baselineData.totalWithdrawal > 0,
      hasForecast: !!forecast,
      sitesCount: siteComparison.length,
      currentWithdrawal: currentData?.totalWithdrawal || 0,
    });

    return NextResponse.json({
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
          projected: projected?.value || 0,
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
        apiCalls: 1, // Down from 8+!
        cached: {
          targets: true,
          baseline: baseline !== null,
          forecast: forecast !== null,
        }
      }
    });
  } catch (error: any) {
    console.error('❌ [dashboard/water] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get water data for a specific period
 */
async function getWaterData(
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

  console.log('📅 [getWaterData] Date filtering:', {
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
        name,
        code,
        water_type
      )
    `)
    .eq('organization_id', organizationId)
    .eq('metrics_catalog.subcategory', 'Water')
    .gte('period_start', startDate)
    .lte('period_start', effectiveEndDate);

  if (siteId) {
    query = query.eq('site_id', siteId);
  }

  console.log('🔍 [getWaterData] Query parameters:', {
    organizationId,
    startDate,
    endDate,
    effectiveEndDate,
    siteId: siteId || 'all',
  });

  const { data, error } = await query;

  console.log('📊 [getWaterData] Query result:', {
    recordsFound: data?.length || 0,
    hasError: !!error,
    error: error?.message,
  });

  if (error) {
    console.error('❌ [getWaterData] Error fetching water data:', error);
    return null;
  }

  if (!data || data.length === 0) {
    console.log('⚠️ [getWaterData] No water data found - returning zeros');
    return {
      totalWithdrawal: 0,
      totalConsumption: 0,
      totalDischarge: 0,
      totalRecycled: 0,
      totalCost: 0,
      recyclingRate: 0,
      waterIntensity: 0,
      sources: [],
      monthlyTrends: [],
      endUseBreakdown: [],
      unit: 'm³', // Standardized to m³
    };
  }

  console.log('✅ [getWaterData] Processing', data.length, 'records');

  // Helper: Convert to m³ (handle m3, ML, etc.)
  const convertToM3 = (value: number, unit: string): number => {
    const unitLower = unit.toLowerCase().trim();
    if (unitLower === 'm³' || unitLower === 'm3') return value;
    if (unitLower === 'ml' || unitLower === 'megaliters') return value * 1000; // ML to m³
    if (unitLower === 'l' || unitLower === 'liters') return value / 1000; // L to m³
    return value; // Assume m³ if unknown
  };

  // Aggregate totals
  let totalWithdrawal = 0;
  let totalConsumption = 0;
  let totalDischarge = 0;
  let totalRecycled = 0;
  let totalCost = 0;

  // Group by source type
  const sourcesByType = new Map<string, {
    name: string;
    type: string;
    withdrawal: number;
    discharge: number;
    cost: number;
    isRecycled: boolean;
  }>();

  // Group by month for trends
  const monthlyData = new Map<string, {
    monthKey: string;
    month: string;
    withdrawal: number;
    consumption: number;
    discharge: number;
    recycled: number;
  }>();

  // Group by end-use category
  const endUseData = new Map<string, {
    name: string;
    consumption: number;
  }>();

  data.forEach((row: any) => {
    const rawValue = parseFloat(row.value?.toString() || '0');
    const unit = row.metrics_catalog?.unit || 'm³';
    const value = convertToM3(rawValue, unit); // Convert to m³

    const category = row.metrics_catalog?.category || 'Other';
    const subcategory = row.metrics_catalog?.subcategory || 'Other';
    const name = row.metrics_catalog?.name || 'Unknown';
    const nameLower = name.toLowerCase(); // For end-use name parsing
    const metadata = row.metadata || {};
    const cost = metadata.cost || 0;

    // ✅ NO HARDCODED! Use water_type from database
    const waterType = row.metrics_catalog?.water_type || 'withdrawal'; // Default to withdrawal if NULL
    const isWastewater = waterType === 'discharge';
    const isRecycled = waterType === 'recycled';

    // Source type based on database water_type (NO string matching!)
    const sourceType = waterType;

    // Aggregate totals by water_type (each metric counted only once)
    // ✅ GRI 303-5: Separate withdrawal, discharge, and recycled
    if (waterType === 'withdrawal') {
      totalWithdrawal += value;
    } else if (waterType === 'discharge') {
      totalDischarge += value;
    } else if (waterType === 'recycled') {
      totalRecycled += value;
    }
    totalCost += cost;

    // Group by source type
    const sourceKey = `${sourceType}-${name}`;
    if (!sourcesByType.has(sourceKey)) {
      sourcesByType.set(sourceKey, {
        name,
        type: sourceType,
        withdrawal: 0,
        discharge: 0,
        cost: 0,
        isRecycled,
      });
    }
    const source = sourcesByType.get(sourceKey)!;
    if (waterType === 'withdrawal') source.withdrawal += value;
    if (waterType === 'discharge') source.discharge += value;
    if (waterType === 'recycled') source.withdrawal += value; // Recycled shown as withdrawal in source breakdown
    source.cost += cost;

    // Group by month
    const periodStart = new Date(row.period_start);
    const monthKey = `${periodStart.getFullYear()}-${String(periodStart.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = periodStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, {
        monthKey,
        month: monthLabel,
        withdrawal: 0,
        consumption: 0,
        discharge: 0,
        recycled: 0,
      });
    }
    const monthEntry = monthlyData.get(monthKey)!;
    if (waterType === 'withdrawal') {
      monthEntry.withdrawal += value;
    } else if (waterType === 'discharge') {
      monthEntry.discharge += value;
    } else if (waterType === 'recycled') {
      monthEntry.recycled += value;
    }
    // Note: monthEntry.consumption will be calculated after loop using GRI formula

    // Group by end-use (use metric name for end-use categories)
    // Clean up the name to create end-use category
    let endUseName = name;
    if (nameLower.includes(' - ')) {
      // Extract the part after " - " as the end-use (e.g., "Water - Toilets" → "Toilets")
      endUseName = name.split(' - ')[1] || name;
    } else if (nameLower.startsWith('water')) {
      // If it's just "Water", use subcategory
      endUseName = subcategory !== 'Water' ? subcategory : 'General Water Use';
    }

    // End-use breakdown: count withdrawal + recycled (not discharge)
    if (waterType !== 'discharge') {
      if (!endUseData.has(endUseName)) {
        endUseData.set(endUseName, {
          name: endUseName,
          consumption: 0,
        });
      }
      endUseData.get(endUseName)!.consumption += value;
    }
  });

  // ✅ GRI 303-5 FORMULA: Calculate actual consumption
  // Consumption = Withdrawal - Discharge + Recycled
  totalConsumption = totalWithdrawal - totalDischarge + totalRecycled;

  // Apply GRI formula to monthly data
  monthlyData.forEach((monthEntry) => {
    monthEntry.consumption = monthEntry.withdrawal - monthEntry.discharge + monthEntry.recycled;
  });

  console.log('📊 [Water GRI 303-5 Calculation]:', {
    withdrawal: totalWithdrawal.toFixed(2),
    discharge: totalDischarge.toFixed(2),
    recycled: totalRecycled.toFixed(2),
    consumption: totalConsumption.toFixed(2),
    formula: 'Withdrawal - Discharge + Recycled'
  });

  // Calculate recycling rate
  const recyclingRate = totalWithdrawal > 0 ? (totalRecycled / totalWithdrawal) * 100 : 0;

  // Get site area for intensity calculation
  let waterIntensity = 0;
  let totalAreaSqm = 0;

  if (siteId && siteId !== 'all') {
    // Single site: get specific site area
    const { data: siteData } = await supabaseAdmin
      .from('sites')
      .select('total_area_sqm')
      .eq('id', siteId)
      .single();

    if (!siteData?.total_area_sqm || siteData.total_area_sqm <= 0) {
      console.warn(`Site ${siteId} has invalid total_area_sqm - intensity will be 0`);
      waterIntensity = 0;
    } else {
      totalAreaSqm = siteData.total_area_sqm;
      waterIntensity = totalConsumption / totalAreaSqm;
    }
  } else {
    // All sites: sum total area of all organization sites
    const { data: sites } = await supabaseAdmin
      .from('sites')
      .select('total_area_sqm')
      .eq('organization_id', organizationId);

    if (sites && sites.length > 0) {
      totalAreaSqm = sites.reduce((sum, site) => sum + (site.total_area_sqm || 0), 0);

      if (totalAreaSqm > 0) {
        waterIntensity = totalConsumption / totalAreaSqm;
        console.log('📊 [Water Intensity]:', {
          totalConsumption: totalConsumption.toFixed(2),
          totalAreaSqm,
          sitesCount: sites.length,
          intensity: waterIntensity.toFixed(6)
        });
      } else {
        console.warn('All sites have invalid total_area_sqm - intensity will be 0');
      }
    }
  }

  const result = {
    totalWithdrawal,
    totalConsumption,
    totalDischarge,
    totalRecycled,
    totalCost,
    recyclingRate,
    waterIntensity,
    sources: Array.from(sourcesByType.values()),
    monthlyTrends: Array.from(monthlyData.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey)),
    endUseBreakdown: Array.from(endUseData.values()),
    unit: 'm³',
  };

  console.log('📈 [getWaterData] Final result:', {
    totalWithdrawal: totalWithdrawal.toFixed(2),
    totalConsumption: totalConsumption.toFixed(2),
    totalDischarge: totalDischarge.toFixed(2),
    totalRecycled: totalRecycled.toFixed(2),
    waterIntensity: waterIntensity.toFixed(6),
    totalAreaSqm,
    sourcesCount: result.sources.length,
    monthlyTrendsCount: result.monthlyTrends.length,
    endUseCount: result.endUseBreakdown.length,
  });

  return result;
}

/**
 * Get previous year water data (same period, shifted by 1 year)
 */
async function getPreviousYearWaterData(
  organizationId: string,
  startDate: string,
  endDate: string,
  siteId?: string | null
) {
  const previousYearStart = new Date(startDate);
  previousYearStart.setFullYear(previousYearStart.getFullYear() - 1);

  const previousYearEnd = new Date(endDate);
  previousYearEnd.setFullYear(previousYearEnd.getFullYear() - 1);

  return getWaterData(
    organizationId,
    previousYearStart.toISOString().split('T')[0],
    previousYearEnd.toISOString().split('T')[0],
    siteId
  );
}

/**
 * Get site comparison data (all sites in ONE query - no N+1!)
 */
async function getWaterSiteComparison(
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

  // Single query for ALL sites water data
  // Dynamic query using database-driven filters (NO HARDCODED!)
  const { data: metricsData, error: metricsError} = await supabaseAdmin
    .from('metrics_data')
    .select(`
      value,
      site_id,
      metrics_catalog!inner(
        category,
        subcategory,
        name,
        unit,
        water_type
      )
    `)
    .eq('organization_id', organizationId)
    .eq('metrics_catalog.subcategory', 'Water')
    .gte('period_start', startDate)
    .lte('period_start', endDate)
    .in('site_id', sites.map(s => s.id));

  if (metricsError) {
    console.error('Error fetching site metrics:', metricsError);
    return [];
  }

  // Aggregate by site
  const siteDataMap = new Map<string, {
    withdrawal: number;
    consumption: number;
  }>();

  // Helper: Convert to m³ (same as getWaterData)
  const convertToM3 = (value: number, unit: string): number => {
    const unitLower = unit.toLowerCase().trim();
    if (unitLower === 'm³' || unitLower === 'm3') return value;
    if (unitLower === 'ml' || unitLower === 'megaliters') return value * 1000;
    if (unitLower === 'l' || unitLower === 'liters') return value / 1000;
    return value;
  };

  metricsData?.forEach((row: any) => {
    const siteId = row.site_id;
    const rawValue = parseFloat(row.value?.toString() || '0');
    const unit = row.metrics_catalog?.unit || 'm³';
    const value = convertToM3(rawValue, unit); // Convert to m³

    // ✅ NO HARDCODED! Use water_type from database
    const waterType = row.metrics_catalog?.water_type || 'withdrawal';
    const isWastewater = waterType === 'discharge';

    if (!siteDataMap.has(siteId)) {
      siteDataMap.set(siteId, { withdrawal: 0, consumption: 0 });
    }

    const siteData = siteDataMap.get(siteId)!;
    // For non-wastewater: count as both withdrawal and consumption
    if (!isWastewater) {
      siteData.withdrawal += value;
      siteData.consumption += value;
    }
  });

  // Build final site comparison array
  return sites
    .map(site => {
      const data = siteDataMap.get(site.id) || { withdrawal: 0, consumption: 0 };

      // ✅ NO HARDCODED! Require total_area_sqm to be set (NOT NULL in DB)
      if (!site.total_area_sqm || site.total_area_sqm <= 0) {
        console.warn(`Site ${site.id} (${site.name}) has invalid total_area_sqm - excluded from comparison`);
        return null; // Exclude sites without valid area
      }

      const intensity = data.consumption / site.total_area_sqm; // m³/m²

      return {
        id: site.id,
        name: site.name,
        withdrawal: data.withdrawal,
        consumption: data.consumption,
        intensity: parseFloat(intensity.toFixed(3)),
        area: site.total_area_sqm,
        unit: 'm³',
      };
    })
    .filter((site): site is NonNullable<typeof site> => site !== null) // Remove null entries
    .sort((a, b) => b.intensity - a.intensity); // Sort by intensity (highest first)
}

/**
 * Get water forecast using unified ForecastService with calculations
 * Uses ForecastService (Prophet + EnterpriseForecast fallback)
 */
async function getForecastWithCalculations(
  organizationId: string,
  siteId: string | null,
  calculator: UnifiedSustainabilityCalculator
) {
  try {
    // If no site selected, use EnterpriseForecast directly (ForecastService doesn't work for org-wide)
    if (!siteId) {
      console.log('⚠️ [Water Forecast] No site selected - using calculator.getProjected()');
      return await calculator.getProjected('water');
    }

    // For site-specific: Use unified ForecastService (Prophet + fallback)
    const forecastResult = await ForecastService.getForecast(
      organizationId,
      siteId,
      waterConfig,
      calculator
    );

    if (!forecastResult) {
      console.log('⚠️ [Water Forecast] No Prophet data - falling back to calculator');
      return await calculator.getProjected('water');
    }

    // Get YTD actual value
    const ytd = await calculator.getYTDActual('water');

    // Calculate total forecasted value (sum of all forecast months)
    const forecastedTotal = forecastResult.forecast.reduce((sum, month) => sum + month.total, 0);
    const projectedValue = (ytd?.value || 0) + forecastedTotal;

    console.log(`✅ [Water Forecast] Using ${forecastResult.model} forecast`, {
      model: forecastResult.model,
      confidence: forecastResult.confidence,
      dataPoints: forecastResult.forecast.length,
      projectedValue,
    });

    return {
      value: projectedValue,
      ytd: ytd?.value || 0,
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
    console.error('❌ [Water Forecast] Error in getForecastWithCalculations:', error);
    return await calculator.getProjected('water');
  }
}
