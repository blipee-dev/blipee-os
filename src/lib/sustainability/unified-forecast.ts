/**
 * Unified Forecast System
 *
 * Single forecasting engine for all sustainability domains.
 * Uses EnterpriseForecast (Prophet-style) with automatic seasonality detection.
 *
 * Fallback hierarchy:
 * 1. Replanning trajectory (if exists - Emissions only)
 * 2. ML forecast (EnterpriseForecast with seasonal decomposition)
 * 3. Simple linear (YTD / months × 12)
 */

import { supabaseAdmin } from '@/lib/supabase/admin';
import { EnterpriseForecast } from '@/lib/forecasting/enterprise-forecaster';
import type { Domain } from './unified-calculator';

export interface ForecastParams {
  organizationId: string;
  domain: Domain;
  startDate: string;
  endDate: string;
  siteId?: string;
}

export interface ForecastResult {
  total: number;
  unit: string;
  method: 'ml_forecast' | 'replanning' | 'linear_fallback';
  breakdown?: Array<{
    month: string;
    value: number;
    renewable?: number;
    fossil?: number;
  }>;
}

/**
 * Get historical data for forecasting
 */
async function getHistoricalData(params: ForecastParams): Promise<Array<{ date: Date; value: number }>> {
  const { organizationId, domain, siteId } = params;

  // Use ALL available historical data from 2022 onwards, including 2025 YTD
  // This gives the ML model the most comprehensive dataset with recent patterns
  const startDate = new Date('2022-01-01');
  const endDate = new Date(params.startDate); // Up to forecast start (e.g., Oct 2025)

  // Filter out future months from current year to avoid using forecast data as historical data
  const now = new Date();
  const maxHistoricalDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month

  // Get metrics for the domain first
  let metricQuery;
  switch (domain) {
    case 'energy':
      metricQuery = supabaseAdmin
        .from('metrics_catalog')
        .select('id')
        .in('category', ['Purchased Energy', 'Electricity', 'Natural Gas', 'Heating', 'Cooling']);
      break;
    case 'water':
      metricQuery = supabaseAdmin
        .from('metrics_catalog')
        .select('id')
        .or('name.ilike.%water%,name.ilike.%wastewater%')
        .eq('category', 'Purchased Goods & Services');
      break;
    case 'waste':
      metricQuery = supabaseAdmin
        .from('metrics_catalog')
        .select('id')
        .eq('category', 'Waste');
      break;
    case 'emissions':
    default:
      // For emissions, use all metrics
      metricQuery = supabaseAdmin
        .from('metrics_catalog')
        .select('id');
      break;
  }

  const { data: metrics, error: metricsError } = await metricQuery;

  if (metricsError || !metrics || metrics.length === 0) {
    console.error('Error fetching metrics:', metricsError);
    return [];
  }

  const metricIds = metrics.map(m => m.id);

  // Fetch data with pagination to handle >1000 records
  let allData: any[] = [];
  let rangeStart = 0;
  const batchSize = 1000;
  let hasMore = true;

  while (hasMore) {
    let query = supabaseAdmin
      .from('metrics_data')
      .select(`
        metric_id,
        site_id,
        period_start,
        value,
        co2e_emissions,
        metadata,
        metrics_catalog!inner(is_renewable, code)
      `)
      .eq('organization_id', organizationId)
      .in('metric_id', metricIds)
      .gte('period_start', startDate.toISOString().split('T')[0])
      .lt('period_start', endDate.toISOString().split('T')[0])
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

  // DEDUPLICATION: Track unique records to prevent double-counting
  // The database has duplicate records (same metric_id, period_start, site_id)
  const seenRecords = new Set<string>();
  const historicalData = allData.filter((row: any) => {
    // Skip future months from current year (they might be forecasts stored in the database)
    const recordDate = new Date(row.period_start);
    if (recordDate > maxHistoricalDate) {
      return false;
    }

    const key = `${row.metric_id || 'null'}|${row.period_start}|${row.site_id || 'null'}`;
    if (seenRecords.has(key)) {
      return false; // Skip duplicate
    }
    seenRecords.add(key);
    return true;
  });

  // Aggregate by month and domain
  const monthlyData = new Map<string, { total: number; renewable?: number; fossil?: number }>();

  historicalData.forEach((row: any) => {
    const month = row.period_start.substring(0, 7); // YYYY-MM
    let value = 0;
    let renewable = 0;
    let fossil = 0;

    switch (domain) {
      case 'energy': {
        // For energy, use consumption value (kWh) - keep in kWh
        value = parseFloat(row.value || '0');

        // Calculate renewable/fossil split
        const isRenewable = row.metrics_catalog?.is_renewable || false;
        const metricCode = row.metrics_catalog?.code || '';
        const gridMix = row.metadata?.grid_mix;

        if (isRenewable) {
          // Pure renewable (solar, wind owned)
          renewable = value;
          fossil = 0;
        } else if ((metricCode.includes('electricity') || metricCode.includes('ev')) && gridMix) {
          // Grid electricity - split by grid mix
          renewable = gridMix.renewable_kwh || 0;
          fossil = gridMix.non_renewable_kwh || 0;
        } else {
          // Non-renewable (gas, heating, etc.)
          renewable = 0;
          fossil = value;
        }
        break;
      }

      case 'water':
        // For water, use value (consumption/withdrawal in liters)
        value = parseFloat(row.value || '0') / 1000000; // L to ML
        break;

      case 'waste':
        // For waste, use value (weight in kg)
        value = parseFloat(row.value || '0') / 1000; // kg to tonnes
        break;

      case 'emissions':
        // For emissions, use emissions
        value = parseFloat(row.co2e_emissions || '0') / 1000; // kg to tCO2e
        break;
    }

    if (value > 0) {
      const existing = monthlyData.get(month) || { total: 0, renewable: 0, fossil: 0 };
      monthlyData.set(month, {
        total: existing.total + value,
        renewable: existing.renewable + renewable,
        fossil: existing.fossil + fossil,
      });
    }
  });

  // Convert to array format for forecaster
  return Array.from(monthlyData.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, data]) => ({
      date: new Date(month + '-01'),
      value: data.total,
      renewable: data.renewable,
      fossil: data.fossil,
    }));
}

/**
 * Calculate remaining months to forecast
 * Returns number of complete months from next month to end of year
 */
function calculateRemainingMonths(endDate: string): number {
  const now = new Date();
  const end = new Date(endDate);

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-11
  const endYear = end.getFullYear();
  const endMonth = end.getMonth(); // 0-11

  // If end date is before current month, return 0
  if (endYear < currentYear || (endYear === currentYear && endMonth <= currentMonth)) {
    return 0;
  }

  // If end date is in a future year, only forecast until end of current year
  const targetYear = Math.min(endYear, currentYear);
  const targetMonth = targetYear === currentYear ? 11 : endMonth; // December = 11

  // Calculate remaining months: from next month to target month (inclusive)
  const remainingMonths = targetMonth - currentMonth;

  console.log('📅 [calculateRemainingMonths]:', {
    endDate,
    today: now.toISOString().split('T')[0],
    currentMonth: currentMonth + 1, // Display as 1-12
    endMonth: endMonth + 1,
    targetMonth: targetMonth + 1,
    remainingMonths,
    explanation: `From month ${currentMonth + 2} to ${targetMonth + 1} = ${remainingMonths} months`
  });

  return Math.max(0, remainingMonths);
}

/**
 * Get unified forecast for any domain
 */
export async function getUnifiedForecast(params: ForecastParams): Promise<ForecastResult | null> {
  const { organizationId, domain } = params;

  // Step 1: Check for replanning trajectory (Emissions only)
  if (domain === 'emissions') {
    const trajectory = await getReplanningTrajectory(organizationId);
    if (trajectory) {
      return trajectory;
    }
  }

  // Step 2: Get historical data
  const historical = await getHistoricalData(params);

  if (historical.length < 12) {
    console.log('Insufficient historical data for ML forecast, using linear fallback');
    return null; // Will trigger fallback in unified-calculator
  }

  // Step 3: Run EnterpriseForecast
  try {
    const periods = calculateRemainingMonths(params.endDate);

    console.log('📊 [unified-forecast] Calculating periods:', {
      domain,
      endDate: params.endDate,
      startDate: params.startDate,
      now: new Date().toISOString().split('T')[0],
      periodsToForecast: periods
    });

    if (periods === 0) {
      return {
        total: 0,
        unit: getUnit(domain),
        method: 'ml_forecast',
        breakdown: [],
      };
    }

    // Convert historical data to the format expected by EnterpriseForecast
    const monthlyData = historical.map(h => ({
      month: h.date.toISOString().substring(0, 7),
      emissions: h.value,
    }));

    // Call EnterpriseForecast.forecast (it's a static method, not async)
    const forecast = EnterpriseForecast.forecast(monthlyData, periods, false);

    // For energy domain, also forecast renewable and fossil separately
    let renewableForecast: any = null;
    let fossilForecast: any = null;

    if (domain === 'energy') {
      // Forecast renewable energy
      const renewableData = historical.map(h => ({
        month: h.date.toISOString().substring(0, 7),
        emissions: h.renewable || 0,
      }));
      renewableForecast = EnterpriseForecast.forecast(renewableData, periods, false);

      // Forecast fossil energy
      const fossilData = historical.map(h => ({
        month: h.date.toISOString().substring(0, 7),
        emissions: h.fossil || 0,
      }));
      fossilForecast = EnterpriseForecast.forecast(fossilData, periods, false);
    }

    // Step 4: Build breakdown and calculate total
    let totalForecast = 0;
    const breakdown: Array<{ month: string; value: number; renewable?: number; fossil?: number }> = [];

    // Get last month from historical data
    const lastMonth = new Date(historical[historical.length - 1].date);

    console.log('📅 [unified-forecast] Date calculation:', {
      lastHistoricalDate: historical[historical.length - 1].date,
      lastMonthObject: lastMonth.toISOString(),
      lastMonthYear: lastMonth.getFullYear(),
      lastMonthMonth: lastMonth.getMonth(),
    });

    for (let i = 0; i < forecast.forecasted.length; i++) {
      const forecastDate = new Date(lastMonth);
      forecastDate.setMonth(forecastDate.getMonth() + i + 1);
      const month = forecastDate.toISOString().substring(0, 7);
      const value = forecast.forecasted[i];

      if (i === 0) {
        console.log('📅 [unified-forecast] First forecast month:', {
          i,
          lastMonthValue: forecastDate.getMonth(),
          forecastDateISO: forecastDate.toISOString(),
          monthString: month,
          forecastYear: forecastDate.getFullYear(),
        });
      }

      const monthData: any = {
        month,
        value,
      };

      // Add renewable/fossil if available
      if (renewableForecast && fossilForecast) {
        monthData.renewable = renewableForecast.forecasted[i] || 0;
        monthData.fossil = fossilForecast.forecasted[i] || 0;
      }

      breakdown.push(monthData);
      totalForecast += value;
    }

    console.log('📊 [unified-forecast] Energy forecast debug:', {
      domain,
      historicalMonthsCount: historical.length,
      lastHistoricalMonth: historical[historical.length - 1]?.date?.toISOString().substring(0, 7),
      lastHistoricalValue: historical[historical.length - 1]?.value,
      lastHistoricalRenewable: historical[historical.length - 1]?.renewable,
      lastHistoricalFossil: historical[historical.length - 1]?.fossil,
      forecastPeriodsCount: periods,
      forecastArrayLength: forecast.forecasted.length,
      allForecastMonths: breakdown.map(b => ({
        month: b.month,
        total: b.value,
        renewable: b.renewable,
        fossil: b.fossil
      })),
      totalForecast,
      unit: getUnit(domain),
    });

    return {
      total: Math.round(totalForecast * 10) / 10,
      unit: getUnit(domain),
      method: 'ml_forecast',
      breakdown,
    };
  } catch (error) {
    console.error('Error running EnterpriseForecast:', error);
    return null; // Will trigger fallback in unified-calculator
  }
}

/**
 * Get replanning trajectory if available (Emissions only)
 */
async function getReplanningTrajectory(organizationId: string): Promise<ForecastResult | null> {
  const { data, error } = await supabaseAdmin
    .from('target_replanning_history')
    .select('trajectory_data')
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data?.trajectory_data) {
    return null;
  }

  const currentYear = new Date().getFullYear();
  const trajectoryYear = data.trajectory_data.trajectory.find((t: any) => t.year === currentYear);

  if (!trajectoryYear) {
    return null;
  }

  return {
    total: trajectoryYear.emissions,
    unit: 'tCO2e',
    method: 'replanning',
  };
}

/**
 * Helper: Get unit for domain
 */
function getUnit(domain: Domain): string {
  switch (domain) {
    case 'energy':
      return 'kWh';
    case 'water':
      return 'ML';
    case 'waste':
      return 'tonnes';
    case 'emissions':
      return 'tCO2e';
  }
}
