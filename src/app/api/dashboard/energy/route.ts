/**
 * Consolidated Energy Dashboard API
 *
 * Replaces 11+ separate API calls with a single optimized endpoint.
 *
 * Returns:
 * - Current period data (sources, intensity, consumption)
 * - Previous year data (for YoY comparison)
 * - Baseline data (dynamic baseline year from targets)
 * - Forecast data (ML-based projections)
 * - Target data (baseline, target, progress)
 * - Site comparison data (all sites in one query - NO N+1!)
 *
 * Performance: 11 calls → 1 call = 11x faster
 */

import { getAPIUser } from '@/lib/auth/server-auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { UnifiedSustainabilityCalculator } from '@/lib/sustainability/unified-calculator';
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
    const baselineYear = sustainabilityTarget?.baseline_year || 2023;

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
      getEnergyData(organizationId, startDate, endDate, siteId),

      // Previous year data (for YoY)
      getPreviousYearData(organizationId, startDate, endDate, siteId),

      // Baseline data (only for current year view)
      selectedYear === currentYear
        ? getEnergyData(organizationId, `${baselineYear}-01-01`, `${baselineYear}-12-31`, siteId)
        : Promise.resolve(null),

      // Forecast (only for current year)
      selectedYear === currentYear
        ? calculator.getProjected('energy')
        : Promise.resolve(null),

      // Targets (using unified calculator - cached!)
      calculator.getBaseline('energy', baselineYear),
      calculator.getTarget('energy'),
      calculator.getProjected('energy'),

      // Site comparison (single query for all sites!)
      getSiteComparison(organizationId, startDate, endDate)
    ]);

    // Calculate progress
    const progress = baseline && target && projected
      ? await calculator.calculateProgressToTarget('energy')
      : null;

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
        apiCalls: 1, // Down from 11+!
        cached: {
          targets: true,
          baseline: baseline !== null,
          forecast: forecast !== null,
        }
      }
    });
  } catch (error: any) {
    console.error('❌ [dashboard/energy] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get energy data for a specific period
 */
async function getEnergyData(
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

  console.log('📅 [getEnergyData] Date filtering:', {
    currentDate: now.toISOString().split('T')[0],
    currentMonth,
    requestedEndDate: endDate,
    effectiveEndDate,
    filtering: requestedEndDate > maxHistoricalDate ? 'YES - excluding future months' : 'NO - within historical range'
  });

  let query = supabaseAdmin
    .from('metrics_data')
    .select(`
      value,
      co2e_emissions,
      period_start,
      metric_id,
      metadata,
      metrics_catalog!inner(
        category,
        subcategory,
        unit,
        name,
        code,
        is_renewable,
        energy_type
      )
    `)
    .eq('organization_id', organizationId)
    .in('metrics_catalog.category', ['Electricity', 'Purchased Energy', 'Natural Gas', 'Heating', 'Cooling'])
    .gte('period_start', startDate)
    .lte('period_start', effectiveEndDate);

  if (siteId) {
    query = query.eq('site_id', siteId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching energy data:', error);
    return null;
  }

  // Aggregate data
  const totalConsumption = data.reduce((sum, row) => {
    const value = parseFloat(row.value?.toString() || '0');
    return sum + value;
  }, 0);

  const totalEmissions = data.reduce((sum, row) => {
    const emissions = parseFloat(row.co2e_emissions?.toString() || '0');
    return sum + emissions;
  }, 0) / 1000; // kg to tCO2e

  // Group by source with hierarchical breakdown: category > subcategory > metrics
  const sources = data.reduce((acc: any, row: any) => {
    const category = row.metrics_catalog?.category || 'Other';
    const subcategory = row.metrics_catalog?.subcategory || 'Other';
    const metricName = row.metrics_catalog?.name || 'Unknown';
    const value = parseFloat(row.value?.toString() || '0');
    const emissions = parseFloat(row.co2e_emissions?.toString() || '0') / 1000; // kg to tCO2e
    const isRenewable = row.metrics_catalog?.is_renewable || false;

    // Initialize category if not exists
    if (!acc[category]) {
      acc[category] = {
        name: category,
        consumption: 0,
        value: 0,
        emissions: 0,
        renewable: isRenewable,
        subcategories: {},
      };
    }

    // Initialize subcategory if not exists
    if (!acc[category].subcategories[subcategory]) {
      acc[category].subcategories[subcategory] = {
        name: subcategory,
        consumption: 0,
        value: 0,
        emissions: 0,
        metrics: {},
      };
    }

    // Initialize metric if not exists
    if (!acc[category].subcategories[subcategory].metrics[metricName]) {
      acc[category].subcategories[subcategory].metrics[metricName] = {
        name: metricName,
        consumption: 0,
        value: 0,
        emissions: 0,
      };
    }

    // Aggregate at all levels
    acc[category].consumption += value;
    acc[category].value += value;
    acc[category].emissions += emissions;

    acc[category].subcategories[subcategory].consumption += value;
    acc[category].subcategories[subcategory].value += value;
    acc[category].subcategories[subcategory].emissions += emissions;

    acc[category].subcategories[subcategory].metrics[metricName].consumption += value;
    acc[category].subcategories[subcategory].metrics[metricName].value += value;
    acc[category].subcategories[subcategory].metrics[metricName].emissions += emissions;

    return acc;
  }, {});

  // Convert nested objects to arrays for easier frontend consumption
  Object.keys(sources).forEach(categoryKey => {
    const category = sources[categoryKey];
    category.subcategories = Object.values(category.subcategories).map((sub: any) => ({
      ...sub,
      metrics: Object.values(sub.metrics),
    }));
  });

  // Calculate renewable percentage
  // IMPORTANT: This matches production calculation exactly
  // 1. Pure renewable (solar, wind owned) = sources with is_renewable = true
  let pureRenewableConsumption = 0;

  Object.values(sources).forEach((source: any) => {
    if (source.renewable) {
      pureRenewableConsumption += source.value;
    }
  });

  // 2. Renewable from grid electricity = sum of grid_mix.renewable_kwh
  let totalRenewableFromGrid = 0;

  data.forEach((row: any) => {
    const metricCode = row.metrics_catalog?.code || '';
    // Only count grid electricity and EV charging (not owned renewables)
    if ((metricCode.includes('electricity') || metricCode.includes('ev')) && !row.metrics_catalog?.is_renewable) {
      const gridMix = row.metadata?.grid_mix;
      if (gridMix) {
        totalRenewableFromGrid += gridMix.renewable_kwh || 0;
      }
    }
  });

  // 3. Total renewable = pure renewable + renewable from grid
  const totalRenewableEnergy = pureRenewableConsumption + totalRenewableFromGrid;
  const renewablePercentage = totalConsumption > 0
    ? (totalRenewableEnergy / totalConsumption) * 100
    : 0;

  // Group by energy type
  const energyTypes = data.reduce((acc: any, row: any) => {
    const energyType = row.metrics_catalog?.energy_type || 'electricity';
    const value = parseFloat(row.value?.toString() || '0');

    if (!acc[energyType]) {
      acc[energyType] = {
        name: energyType.charAt(0).toUpperCase() + energyType.slice(1),
        type: energyType,
        value: 0,
      };
    }
    acc[energyType].value += value;
    return acc;
  }, {});

  // Group by month for monthly trends
  const monthlyData = data.reduce((acc: any, row: any) => {
    const periodStart = row.period_start;
    const monthKey = periodStart ? periodStart.substring(0, 7) : 'unknown'; // YYYY-MM
    const value = parseFloat(row.value?.toString() || '0');
    const category = row.metrics_catalog?.category || 'Other';
    const isRenewable = row.metrics_catalog?.is_renewable || false;
    const metricCode = row.metrics_catalog?.code || '';

    if (!acc[monthKey]) {
      acc[monthKey] = {
        total: 0,
        renewable: 0,
        fossil: 0,
        sources: {},
      };
    }

    acc[monthKey].total += value;

    // Calculate renewable correctly:
    // 1. Pure renewable sources (solar, wind owned)
    if (isRenewable) {
      acc[monthKey].renewable += value;
    }
    // 2. Grid electricity - split by grid mix
    else if ((metricCode.includes('electricity') || metricCode.includes('ev')) && row.metadata?.grid_mix) {
      const gridMix = row.metadata.grid_mix;
      acc[monthKey].renewable += gridMix.renewable_kwh || 0;
      acc[monthKey].fossil += gridMix.non_renewable_kwh || 0;
    }
    // 3. Non-renewable sources (gas, heating, etc.)
    else {
      acc[monthKey].fossil += value;
    }

    acc[monthKey].sources[category] = (acc[monthKey].sources[category] || 0) + value;

    return acc;
  }, {});

  // Convert monthly data to array format
  const monthlyTrends = Object.entries(monthlyData)
    .map(([monthKey, data]: [string, any]) => ({
      monthKey,
      month: new Date(monthKey + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      total: data.total,
      renewable: data.renewable,
      fossil: data.fossil,
      sources: data.sources,
    }))
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey));

  // Debug: Log last 2 months for comparison with forecast
  if (monthlyTrends.length >= 2) {
    console.log('📊 [getEnergyData] Last 2 historical months:', {
      month1: monthlyTrends[monthlyTrends.length - 2],
      month2: monthlyTrends[monthlyTrends.length - 1],
    });
  }

  // Process energy mixes from metadata
  const energyMixesByType: { [key: string]: any } = {};

  data.forEach((row: any) => {
    const energyType = row.metrics_catalog?.energy_type || 'electricity';
    const gridMix = row.metadata?.grid_mix;
    const supplierMix = row.metadata?.supplier_mix;
    const mixInfo = gridMix || supplierMix;

    if (mixInfo) {
      if (!energyMixesByType[energyType]) {
        energyMixesByType[energyType] = {
          renewable_kwh: 0,
          non_renewable_kwh: 0,
          data_points: 0,
          provider: null,
          year: null,
          sources_map: {},
          emission_factors: {
            lifecycle_sum: 0,
            scope2_sum: 0,
            scope3_sum: 0,
            count: 0,
          },
        };
      }

      const mixData = energyMixesByType[energyType];
      mixData.renewable_kwh += mixInfo.renewable_kwh || 0;
      mixData.non_renewable_kwh += mixInfo.non_renewable_kwh || 0;
      mixData.data_points++;

      if (!mixData.provider && mixInfo.provider) {
        mixData.provider = mixInfo.provider;
      }
      if (!mixData.year && mixInfo.year) {
        mixData.year = mixInfo.year;
      }

      // Aggregate sources
      if (mixInfo.sources && Array.isArray(mixInfo.sources)) {
        mixInfo.sources.forEach((source: any) => {
          if (!mixData.sources_map[source.name]) {
            mixData.sources_map[source.name] = {
              name: source.name,
              percentage: 0,
              renewable: source.renewable,
              count: 0,
            };
          }
          mixData.sources_map[source.name].percentage += source.percentage || 0;
          mixData.sources_map[source.name].count++;
        });
      }

      // Aggregate emission factors
      if (mixInfo.carbon_intensity_lifecycle) {
        mixData.emission_factors.lifecycle_sum += mixInfo.carbon_intensity_lifecycle;
        mixData.emission_factors.count++;
      }
      if (mixInfo.carbon_intensity_scope2) {
        mixData.emission_factors.scope2_sum += mixInfo.carbon_intensity_scope2;
      }
      if (mixInfo.carbon_intensity_scope3_cat3) {
        mixData.emission_factors.scope3_sum += mixInfo.carbon_intensity_scope3_cat3;
      }
    }
  });

  // Convert to energy_mixes array
  const energyMixes = Object.entries(energyMixesByType)
    .filter(([_, mix]: [string, any]) => mix.data_points > 0)
    .map(([energyType, mix]: [string, any]) => {
      const totalEnergy = mix.renewable_kwh + mix.non_renewable_kwh;
      const renewablePercentage = totalEnergy > 0 ? (mix.renewable_kwh / totalEnergy * 100) : 0;

      const sources = Object.values(mix.sources_map).map((source: any) => ({
        name: source.name,
        percentage: source.count > 0 ? source.percentage / source.count : null,
        renewable: source.renewable,
      }));

      const hasUnknownSources = sources.some((s: any) => s.percentage === null);

      const emissionFactors = mix.emission_factors.count > 0 ? {
        carbon_intensity_lifecycle: mix.emission_factors.lifecycle_sum / mix.emission_factors.count,
        carbon_intensity_scope2: mix.emission_factors.scope2_sum / mix.emission_factors.count,
        carbon_intensity_scope3_cat3: mix.emission_factors.scope3_sum / mix.emission_factors.count,
      } : null;

      return {
        energy_type: energyType,
        provider_name: mix.provider,
        year: mix.year,
        sources: sources.length > 0 ? sources : [],
        renewable_percentage: renewablePercentage,
        has_unknown_sources: hasUnknownSources,
        emission_factors: emissionFactors,
      };
    });

  console.log('⚡ [ENERGY DATA] Complete breakdown:', {
    totalRows: data.length,
    sources: Object.keys(sources),
    monthlyTrendsCount: monthlyTrends.length,
    energyTypes: Object.keys(energyTypes),
    energyMixes: energyMixes.length,
    renewablePercentage: renewablePercentage.toFixed(1),
  });

  return {
    totalConsumption,
    totalEmissions,
    renewablePercentage,
    sources: Object.values(sources), // Convert to array
    monthlyTrends,
    energyTypes: Object.values(energyTypes), // Convert to array
    energyMixes,
    unit: 'kWh',
  };
}

/**
 * Get previous year data for YoY comparison
 */
async function getPreviousYearData(
  organizationId: string,
  startDate: string,
  endDate: string,
  siteId?: string | null
) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const prevStart = new Date(start);
  prevStart.setFullYear(start.getFullYear() - 1);

  const prevEnd = new Date(end);
  prevEnd.setFullYear(end.getFullYear() - 1);

  return getEnergyData(
    organizationId,
    prevStart.toISOString().split('T')[0],
    prevEnd.toISOString().split('T')[0],
    siteId
  );
}

/**
 * Get site comparison data with a SINGLE query (no N+1!)
 */
async function getSiteComparison(
  organizationId: string,
  startDate: string,
  endDate: string
) {
  // Get all sites for the organization
  const { data: sites, error: sitesError } = await supabaseAdmin
    .from('sites')
    .select('id, name, total_area_sqm')
    .eq('organization_id', organizationId);

  console.log('🏢 [SITE COMPARISON] Sites query:', {
    siteCount: sites?.length || 0,
    hasSites: !!sites && sites.length > 0,
    error: sitesError?.message,
  });

  if (sitesError || !sites || sites.length <= 1) {
    console.log('🏢 [SITE COMPARISON] Returning empty - not enough sites for comparison');
    return [];
  }

  const siteIds = sites.map(s => s.id);

  // Fetch energy data for ALL sites in ONE query
  const { data, error } = await supabaseAdmin
    .from('metrics_data')
    .select(`
      value,
      site_id,
      metrics_catalog!inner(category)
    `)
    .eq('organization_id', organizationId)
    .in('metrics_catalog.category', ['Electricity', 'Purchased Energy'])
    .in('site_id', siteIds)
    .gte('period_start', startDate)
    .lte('period_start', endDate);

  if (error) {
    console.error('Error fetching site comparison:', error);
    return [];
  }

  // Aggregate by site
  const siteData = new Map<string, number>();

  data.forEach((row: any) => {
    const siteId = row.site_id;
    const value = parseFloat(row.value?.toString() || '0');
    siteData.set(siteId, (siteData.get(siteId) || 0) + value);
  });

  // Map to site info and calculate intensity
  const result = sites
    .map(site => {
      const consumption = siteData.get(site.id) || 0;
      const area = site.total_area_sqm || 1000;
      const intensity = consumption / area;

      return {
        id: site.id,
        name: site.name,
        consumption,
        intensity,
        area,
        unit: 'kWh/m²',
      };
    })
    .filter(site => site.consumption > 0)
    .sort((a, b) => b.consumption - a.consumption);

  console.log('🏢 [SITE COMPARISON] Final result:', {
    totalSites: sites.length,
    sitesWithData: result.length,
    sites: result.map(s => ({ name: s.name, consumption: s.consumption, intensity: s.intensity })),
  });

  return result;
}
