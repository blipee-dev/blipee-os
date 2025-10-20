import { NextRequest, NextResponse } from 'next/server';
import { UnifiedSustainabilityCalculator } from '@/lib/sustainability/unified-calculator';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { EnterpriseForecast } from '@/lib/forecasting/enterprise-forecaster';

/**
 * Unified Waste Targets API
 *
 * Uses: UnifiedSustainabilityCalculator for consistent calculations
 *
 * GET /api/sustainability/targets/unified-waste?organizationId=xxx&categories=Waste,...
 *
 * Returns:
 * {
 *   success: true,
 *   data: [
 *     {
 *       category: "Waste to Landfill",
 *       metricName: "General Waste",
 *       baselineWaste: 45.2,
 *       targetWaste: 42.9,
 *       currentWaste: 38.5,
 *       projected2025FullYear: 50.0,
 *       progress: { ... }
 *     }
 *   ],
 *   overall: {
 *     baseline: 45.2,
 *     target: 42.9,
 *     projected: 50.0,
 *     progress: { ... }
 *   },
 *   configuration: {
 *     baselineYear: 2023,
 *     targetYear: 2025,
 *     reductionPercent: 3.0
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const categoriesParam = searchParams.get('categories');

    if (!organizationId) {
      return NextResponse.json({ error: 'Missing organizationId' }, { status: 400 });
    }

    // Parse categories
    const categories = categoriesParam?.split(',').map(c => c.trim()) || [
      'Waste',
      'Waste to Landfill',
      'Waste Incinerated',
      'Paper & Cardboard Recycling',
      'Plastic Recycling',
      'Metal Recycling',
      'Glass Recycling',
      'Mixed Materials Recycling',
      'Food Waste Composting',
      'Garden Waste Composting',
      'E-Waste',
      'Hazardous Waste'
    ];

    // Create unified calculator
    const calculator = new UnifiedSustainabilityCalculator(organizationId);

    // Get configuration
    const targetConfig = await calculator.getSustainabilityTarget();
    if (!targetConfig) {
      return NextResponse.json({
        error: 'No sustainability target found',
        hint: 'Create a sustainability target for this organization first'
      }, { status: 404 });
    }

    const currentYear = new Date().getFullYear();
    const baselineYear = targetConfig.baseline_year;
    const reductionPercent = targetConfig.waste_reduction_percent;

    // Get overall metrics using unified calculator
    const [baseline, target, projected] = await Promise.all([
      calculator.getBaseline('waste', baselineYear),
      calculator.getTarget('waste'),
      calculator.getProjected('waste'),
    ]);

    if (!baseline || !target || !projected) {
      return NextResponse.json({
        error: 'Unable to calculate metrics',
        hint: 'Ensure organization has waste data for baseline year'
      }, { status: 500 });
    }

    // Get category-level breakdown
    const categoryData = await getCategoryBreakdown(
      organizationId,
      categories,
      baselineYear,
      currentYear,
      reductionPercent
    );

    // Calculate overall progress
    const progress = await calculator.calculateProgressToTarget('waste');

    return NextResponse.json({
      success: true,
      data: categoryData,
      overall: {
        baseline: baseline.value,
        target: target.value,
        projected: projected.value,
        ytd: projected.ytd,
        progress: progress ? {
          progressPercent: progress.progressPercent,
          exceedancePercent: progress.exceedancePercent,
          status: progress.status,
          reductionNeeded: progress.reductionNeeded,
          reductionAchieved: progress.reductionAchieved,
        } : null,
      },
      configuration: {
        baselineYear,
        targetYear: currentYear,
        reductionPercent,
        formula: 'linear',
        source: 'unified_calculator',
      },
      message: 'Calculated using UnifiedSustainabilityCalculator with linear reduction formula'
    });

  } catch (error: any) {
    console.error('Error in unified-waste API:', error);
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Get category-level breakdown for waste metrics
 */
async function getCategoryBreakdown(
  organizationId: string,
  categories: string[],
  baselineYear: number,
  currentYear: number,
  overallReductionPercent: number
) {
  const currentMonth = new Date().getMonth() + 1;

  // Get metrics for each category
  const { data: metricsData, error: metricsError } = await supabaseAdmin
    .from('metrics_catalog')
    .select('id, name, code, category, scope, unit')
    .in('category', categories);

  if (metricsError || !metricsData) {
    console.error('Error fetching metrics catalog:', metricsError);
    return [];
  }

  // Get category-specific targets if they exist
  const { data: categoryTargets } = await supabaseAdmin
    .from('category_targets')
    .select('category, reduction_rate')
    .eq('organization_id', organizationId);

  // Create reduction rate map (category-specific overrides overall rate)
  const reductionRateMap = new Map<string, number>();
  categoryTargets?.forEach(ct => {
    reductionRateMap.set(ct.category, ct.reduction_rate);
  });

  // Process each category
  const results = await Promise.all(
    categories.map(async (category) => {
      // Get metrics in this category
      const categoryMetrics = metricsData.filter(m => m.category === category);
      const metricIds = categoryMetrics.map(m => m.id);

      if (metricIds.length === 0) {
        return null;
      }

      // Get baseline data
      const { data: baselineData } = await supabaseAdmin
        .from('metrics_data')
        .select('value')
        .eq('organization_id', organizationId)
        .in('metric_id', metricIds)
        .gte('period_start', `${baselineYear}-01-01`)
        .lt('period_start', `${baselineYear + 1}-01-01`);

      const baselineWaste = (baselineData || [])
        .reduce((sum, d) => sum + parseFloat(d.value || '0'), 0) / 1000; // kg to tonnes

      if (baselineWaste === 0) {
        return null; // Skip categories with no baseline data
      }

      // Use ALL available historical data from 2022 onwards, including 2025 YTD
      // This gives the ML model the most comprehensive dataset with recent patterns
      const historicalStartDate = new Date('2022-01-01');
      const { data: historicalData } = await supabaseAdmin
        .from('metrics_data')
        .select('period_start, value')
        .eq('organization_id', organizationId)
        .in('metric_id', metricIds)
        .gte('period_start', historicalStartDate.toISOString().split('T')[0])
        .lte('period_start', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-31`)
        .order('period_start', { ascending: true });

      // Calculate YTD waste for current year
      const currentYearData = (historicalData || []).filter(d =>
        d.period_start >= `${currentYear}-01-01`
      );
      const currentWaste = currentYearData
        .reduce((sum, d) => sum + parseFloat(d.value || '0'), 0) / 1000; // kg to tonnes

      // Calculate target using linear formula
      const categoryReductionRate = reductionRateMap.get(category) || overallReductionPercent;
      const years = currentYear - baselineYear;
      const targetWaste = baselineWaste * (1 - (categoryReductionRate / 100) * years);

      // Use EnterpriseForecast ML to project full year
      let projected2025FullYear = currentWaste; // fallback
      let forecastMethod = 'ytd-only';

      try {
        // Group historical data by month
        const monthlyWaste: { [key: string]: number } = {};
        (historicalData || []).forEach(d => {
          const monthKey = d.period_start.substring(0, 7); // YYYY-MM
          if (!monthlyWaste[monthKey]) {
            monthlyWaste[monthKey] = 0;
          }
          monthlyWaste[monthKey] += parseFloat(d.value || '0') / 1000; // Convert to tonnes
        });

        // Convert to array format for EnterpriseForecast
        const monthlyDataArray = Object.entries(monthlyWaste)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, waste]) => ({
            month,
            emissions: waste // EnterpriseForecast uses 'emissions' field name
          }));

        if (monthlyDataArray.length >= 12) {
          // Calculate how many months we need to forecast
          const monthsToForecast = 12 - currentMonth;

          if (monthsToForecast > 0) {
            // Use Enterprise ML Forecast
            const forecast = EnterpriseForecast.forecast(
              monthlyDataArray,
              monthsToForecast,
              false // debug = false
            );

            // Projected = YTD actual + ML forecast for remaining months
            const forecastedRemaining = forecast.forecasted.reduce((sum, val) => sum + val, 0);
            projected2025FullYear = currentWaste + forecastedRemaining;
            forecastMethod = forecast.method;
          } else {
            // Full year data available, no forecast needed
            projected2025FullYear = currentWaste;
            forecastMethod = 'actual-full-year';
          }
        } else {
          // Not enough data for ML, use simple linear projection
          const monthlyAverage = currentWaste / currentMonth;
          projected2025FullYear = monthlyAverage * 12;
          forecastMethod = 'simple-linear';
        }
      } catch (error) {
        console.error(`Error forecasting for category ${category}:`, error);
        // Fall back to simple linear projection
        const monthlyAverage = currentWaste / currentMonth;
        projected2025FullYear = monthlyAverage * 12;
        forecastMethod = 'simple-linear-fallback';
      }

      // Calculate progress
      let progressPercent = 0;
      let status = 'off-track';

      if (projected2025FullYear <= targetWaste) {
        progressPercent = 100;
        status = 'on-track';
      } else if (projected2025FullYear >= baselineWaste) {
        progressPercent = 0;
        status = 'exceeded-baseline';
      } else {
        progressPercent = ((baselineWaste - projected2025FullYear) / (baselineWaste - targetWaste)) * 100;
        status = progressPercent >= 95 ? 'on-track' : progressPercent >= 80 ? 'at-risk' : 'off-track';
      }

      return {
        category,
        metricName: categoryMetrics[0]?.name || category,
        metricIds,
        baselineWaste: Math.round(baselineWaste * 10) / 10,
        targetWaste: Math.round(targetWaste * 10) / 10,
        currentWaste: Math.round(currentWaste * 10) / 10,
        projected2025FullYear: Math.round(projected2025FullYear * 10) / 10,
        reductionRate: categoryReductionRate,
        progress: {
          progressPercent: Math.round(progressPercent * 10) / 10,
          status,
          ytdWaste: Math.round(currentWaste * 10) / 10,
        },
      };
    })
  );

  // Filter out null results and return
  return results.filter(r => r !== null);
}
