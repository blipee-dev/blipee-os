import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  getPeriodEmissions,
  getScopeBreakdown,
  getCategoryBreakdown,
  getMonthlyEmissions,
  getYoYComparison
} from '@/lib/sustainability/baseline-calculator';

export async function GET(request: NextRequest) {
  console.log('🚀🚀🚀 EMISSIONS API CALLED');
  try {
    const supabase = await createServerSupabaseClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization from organization_members table
    const { data: memberData, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (memberError || !memberData?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const organizationId = memberData.organization_id;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '12m';
    const siteId = searchParams.get('site');

    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case '1m':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case '3m':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case '6m':
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case '12m':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setFullYear(2020); // All time
    }

    // Build metrics query
    let metricsQuery = supabaseAdmin
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
          emission_factor
        )
      `)
      .eq('organization_id', organizationId)
      .gte('period_start', startDate.toISOString())
      .lte('period_end', endDate.toISOString());

    // Filter by site if specified
    if (siteId && siteId !== 'all') {
      metricsQuery = metricsQuery.eq('site_id', siteId);
    }

    // Fetch metrics data with emissions
    const { data: metricsData, error: metricsError } = await metricsQuery
      .order('period_start', { ascending: true });

    if (metricsError) {
      console.error('Error fetching metrics data:', metricsError);
      return NextResponse.json({ error: 'Failed to fetch emissions data' }, { status: 500 });
    }

    // Fetch SBTi target - site-specific or organization-wide
    let sbtiTarget = null;

    if (siteId && siteId !== 'all') {
      // First try to get site-specific target
      const { data: siteTarget } = await supabaseAdmin
        .from('sustainability_targets')
        .select('baseline_year, baseline_value, target_year, target_value, sbti_ambition, site_id, status')
        .eq('site_id', siteId)
        .or('is_active.eq.true,is_active.is.null')  // Handle is_active column if exists
        .eq('target_type', 'near-term')
        .single();

      if (siteTarget) {
        // Calculate reduction percentage from values
        const reduction = siteTarget.baseline_value > 0
          ? ((siteTarget.baseline_value - siteTarget.target_value) / siteTarget.baseline_value) * 100
          : 0;

        sbtiTarget = {
          target_reduction_percent: reduction,
          baseline_year: siteTarget.baseline_year,
          target_year: siteTarget.target_year,
          sbti_ambition: siteTarget.sbti_ambition,
          site_id: siteTarget.site_id
        };
      }
    }

    // If no site-specific target, fall back to org-wide target
    if (!sbtiTarget) {
      const { data: orgTarget } = await supabaseAdmin
        .from('sustainability_targets')
        .select('baseline_year, baseline_value, target_year, target_value, sbti_ambition, status')
        .eq('organization_id', organizationId)
        .is('site_id', null)  // Org-wide targets have null site_id
        .or('is_active.eq.true,is_active.is.null')  // Handle is_active column if exists
        .eq('target_type', 'near-term')
        .single();

      if (orgTarget) {
        // Calculate reduction percentage from values
        const reduction = orgTarget.baseline_value > 0
          ? ((orgTarget.baseline_value - orgTarget.target_value) / orgTarget.baseline_value) * 100
          : 0;

        sbtiTarget = {
          target_reduction_percent: reduction,
          baseline_year: orgTarget.baseline_year,
          target_year: orgTarget.target_year,
          sbti_ambition: orgTarget.sbti_ambition,
          site_id: null
        };
      }
    }

    // Get sites FIRST to calculate proper carbon intensity (MOVED UP FROM LINE 153)
    let sitesQuery = supabaseAdmin
      .from('sites')
      .select('id, name, total_area_sqm')
      .eq('organization_id', organizationId);

    // If filtering by site, only get that site's area
    if (siteId && siteId !== 'all') {
      sitesQuery = sitesQuery.eq('id', siteId);
    }

    const { data: sites } = await sitesQuery;

    // Calculate total area from selected sites
    // Convert to number since Supabase returns NUMERIC as string
    const totalAreaM2 = sites?.reduce((sum, site) => {
      const area = typeof site.total_area_sqm === 'string'
        ? parseFloat(site.total_area_sqm)
        : (site.total_area_sqm || 0);
      return sum + area;
    }, 0) || 0;

    console.log('🔴🔴🔴 INTENSITY DEBUG - SITES FETCHED:', {
      sites: sites?.map(s => ({
        name: s.name,
        area: s.total_area_sqm,
        areaType: typeof s.total_area_sqm,
        areaValue: s.total_area_sqm
      })),
      totalAreaM2,
      siteCount: sites?.length || 0,
      metricsCount: metricsData?.length || 0,
      organizationId
    });

    // ✅ USE CALCULATOR for ALL emissions calculations (scope-by-scope rounding)
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Get emissions using centralized calculator
    const emissions = await getPeriodEmissions(organizationId, startDateStr, endDateStr);
    const scopes = await getScopeBreakdown(organizationId, startDateStr, endDateStr);

    // Get category breakdown using calculator
    const categories = await getCategoryBreakdown(organizationId, startDateStr, endDateStr);

    // Get monthly emissions using calculator
    const monthlyEmissions = await getMonthlyEmissions(organizationId, startDateStr, endDateStr);

    // Get YoY comparison using calculator
    const yoyComparison = await getYoYComparison(organizationId, startDateStr, endDateStr, 'emissions');

    // Current emissions from calculator (consistent 303.6 not 303.5!)
    const currentEmissions = {
      total: emissions.total,
      scope1: emissions.scope_1,
      scope2: emissions.scope_2,
      scope3: emissions.scope_3
    };

    // Trend from calculator
    const trend = yoyComparison.percentageChange;

    // Detect anomalies (simple threshold-based for now)
    const anomalies = detectAnomalies(metricsData || []);

    // Sites already fetched above, no need to fetch again
    console.log('🎯 Using totalAreaM2:', totalAreaM2, 'for', sites?.length || 0, 'sites');

    // Calculate carbon intensity: kgCO2e/m²
    let intensity = 0;
    if (totalAreaM2 > 0) {
      intensity = (currentEmissions.total * 1000) / totalAreaM2; // Convert tCO2e to kg for intensity
    }

    // Add intensity to monthly data from calculator
    const historicalWithIntensity = monthlyEmissions.map(month => {
      const monthIntensity = totalAreaM2 > 0 ? (month.emissions * 1000) / totalAreaM2 : 0;
      return {
        date: month.month,
        month: new Date(month.month + '-01').toLocaleDateString('en', { month: 'short' }),
        year: new Date(month.month + '-01').getFullYear(),
        scope1: month.scope_1,
        scope2: month.scope_2,
        scope3: month.scope_3,
        total: month.emissions,
        intensity: monthIntensity
      };
    });

    // Convert categories for response
    const categoriesFormatted = categories.map(cat => ({
      name: cat.category,
      value: cat.total,
      count: cat.recordCount
    }));

    console.log('✅ USING CALCULATOR - Values:', {
      total: currentEmissions.total,
      scope1: currentEmissions.scope1,
      scope2: currentEmissions.scope2,
      scope3: currentEmissions.scope3,
      trend: trend,
      intensity: intensity
    });

    return NextResponse.json({
      current: {
        ...currentEmissions,
        trend,
        intensity
      },
      historical: historicalWithIntensity,
      byCategory: categoriesFormatted,
      bySite: [], // TODO: Implement site breakdown in calculator
      anomalies,
      totalAreaM2,
      sbtiTarget: sbtiTarget ? {
        reductionPercent: sbtiTarget.target_reduction_percent,
        baselineYear: sbtiTarget.baseline_year,
        targetYear: sbtiTarget.target_year,
        ambition: sbtiTarget.sbti_ambition,
        isSiteSpecific: siteId && siteId !== 'all' && sbtiTarget.site_id === siteId
      } : null,
      metadata: {
        period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        dataPoints: metricsData?.length || 0
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * @deprecated Use calculator functions instead:
 * - getMonthlyEmissions() for monthly data
 * - getCategoryBreakdown() for categories
 * This function does DIRECT sum/divide which gives inconsistent rounding
 */
function aggregateEmissionsData(metricsData: any[], totalAreaM2?: number) {
  // Group by month for historical data
  const monthlyData = new Map();
  const categoryData = new Map();
  const siteData = new Map();

  metricsData.forEach(record => {
    const date = new Date(record.period_start);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    // Aggregate by month
    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, {
        date: monthKey,
        month: date.toLocaleDateString('en', { month: 'short' }),
        year: date.getFullYear(),
        scope1: 0,
        scope2: 0,
        scope3: 0,
        total: 0
      });
    }

    const monthData = monthlyData.get(monthKey);
    const emissions = record.co2e_emissions || 0;
    const scope = record.metrics_catalog?.scope || 'scope_3';

    // Add to appropriate scope
    if (scope === 'scope_1' || scope === 1) {
      monthData.scope1 += emissions;
    } else if (scope === 'scope_2' || scope === 2) {
      monthData.scope2 += emissions;
    } else {
      monthData.scope3 += emissions;
    }
    monthData.total += emissions;

    // Aggregate by category
    const category = record.metrics_catalog?.category || 'Other';
    if (!categoryData.has(category)) {
      categoryData.set(category, { name: category, value: 0, count: 0 });
    }
    const catData = categoryData.get(category);
    catData.value += emissions;
    catData.count += 1;

    // Aggregate by site
    if (record.site_id) {
      if (!siteData.has(record.site_id)) {
        siteData.set(record.site_id, {
          siteId: record.site_id,
          emissions: 0,
          dataPoints: 0
        });
      }
      const site = siteData.get(record.site_id);
      site.emissions += emissions;
      site.dataPoints += 1;
    }
  });

  // Convert historical data to tons before returning
  const historicalInTons = Array.from(monthlyData.values()).map(month => ({
    ...month,
    scope1: month.scope1 / 1000,
    scope2: month.scope2 / 1000,
    scope3: month.scope3 / 1000,
    total: month.total / 1000
  })).sort((a, b) => a.date.localeCompare(b.date));

  // Convert category and site data to tons as well
  const categoriesInTons = Array.from(categoryData.values()).map(cat => ({
    ...cat,
    value: cat.value / 1000
  })).sort((a, b) => b.value - a.value);

  const sitesInTons = Array.from(siteData.values()).map(site => ({
    ...site,
    value: site.value / 1000
  }));

  return {
    historical: historicalInTons,
    byCategory: categoriesInTons,
    bySite: sitesInTons
  };
}

/**
 * @deprecated Use getPeriodEmissions() or getScopeBreakdown() from calculator instead
 * This function does DIRECT sum which gives 303.5 instead of 303.6
 */
function calculateTotalEmissions(metricsData: any[]) {
  let scope1 = 0;
  let scope2 = 0;
  let scope3 = 0;

  metricsData.forEach(record => {
    const emissions = record.co2e_emissions || 0;
    const scope = record.metrics_catalog?.scope || 'scope_3';

    if (scope === 'scope_1' || scope === 1) {
      scope1 += emissions;
    } else if (scope === 'scope_2' || scope === 2) {
      scope2 += emissions;
    } else {
      scope3 += emissions;
    }
  });

  return {
    total: scope1 + scope2 + scope3,
    scope1,
    scope2,
    scope3
  };
}

function detectAnomalies(metricsData: any[]) {
  const anomalies = [];

  // Group by metric type
  const metricGroups = new Map();

  metricsData.forEach(record => {
    const metricId = record.metric_id;
    if (!metricGroups.has(metricId)) {
      metricGroups.set(metricId, []);
    }
    metricGroups.get(metricId).push(record);
  });

  // Detect anomalies per metric type
  metricGroups.forEach((records, metricId) => {
    if (records.length < 3) return; // Need at least 3 data points

    // Calculate mean and std dev
    const values = records.map(r => r.co2e_emissions || 0);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Flag values outside 2 standard deviations
    records.forEach(record => {
      const value = record.co2e_emissions || 0;
      const zScore = Math.abs((value - mean) / stdDev);

      if (zScore > 2) {
        anomalies.push({
          date: record.period_start,
          type: value > mean ? 'spike' : 'drop',
          severity: zScore > 3 ? 'high' : 'medium',
          value,
          expected: mean,
          metricName: record.metrics_catalog?.name || 'Unknown',
          category: record.metrics_catalog?.category || 'Other'
        });
      }
    });
  });

  return anomalies.sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  ).slice(0, 10); // Return top 10 most recent
}