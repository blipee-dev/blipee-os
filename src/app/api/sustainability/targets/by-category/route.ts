import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { EnterpriseForecast } from '@/lib/forecasting/enterprise-forecaster';
import { getMonthlyEmissions } from '@/lib/sustainability/baseline-calculator';

export const dynamic = 'force-dynamic';

/**
 * GET /api/sustainability/targets/by-category
 * Get metric targets filtered by category for dashboard integration
 *
 * Query params:
 * - organizationId: string (required)
 * - targetId: string (required) - Sustainability target ID
 * - categories: string[] (required) - Comma-separated metric categories (e.g., "Electricity,Heating")
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const targetId = searchParams.get('targetId');
    const categoriesParam = searchParams.get('categories');

    if (!organizationId || !targetId || !categoriesParam) {
      return NextResponse.json(
        { error: 'Missing required parameters: organizationId, targetId, categories' },
        { status: 400 }
      );
    }

    const categories = categoriesParam.split(',').map(c => c.trim());

    // Verify user has access to this organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'You do not have access to this organization' },
        { status: 403 }
      );
    }

    // Get all metric targets (will filter by category client-side)
    const { data: allMetricTargets, error: targetsError } = await supabase
      .from('metric_targets')
      .select(`
        id,
        metric_catalog_id,
        baseline_value,
        baseline_emissions,
        target_value,
        target_emissions,
        status,
        metrics_catalog (
          id,
          code,
          name,
          category,
          scope,
          unit
        )
      `)
      .eq('organization_id', organizationId)
      .eq('target_id', targetId)
      .eq('status', 'active');

    if (targetsError) {
      console.error('Error fetching metric targets:', targetsError);
      return NextResponse.json(
        { error: 'Failed to fetch metric targets' },
        { status: 500 }
      );
    }

    // Filter by categories client-side
    const metricTargets = (allMetricTargets || []).filter(mt =>
      categories.includes(mt.metrics_catalog?.category)
    );

    // Get monthly actuals for progress tracking
    const metricTargetIds = metricTargets?.map(mt => mt.id) || [];

    const { data: monthlyData, error: monthlyError } = await supabase
      .from('metric_targets_monthly')
      .select('*')
      .in('metric_target_id', metricTargetIds)
      .order('year', { ascending: true })
      .order('month', { ascending: true });

    if (monthlyError) {
      console.error('Error fetching monthly data:', monthlyError);
    }

    // Determine if we need to calculate forecast data
    const isWaterCategory = categories.some(cat =>
      cat.includes('Water')
    );
    const needsEmissionsForecast = !isWaterCategory; // All non-water categories need emissions forecast

    console.log(`🔍 Is water category? ${isWaterCategory}, needs emissions forecast? ${needsEmissionsForecast}, categories: ${categories.join(', ')}`);

    let forecastData: any = null;
    let emissionsForecastData: any = null;
    if (isWaterCategory) {
      try {
        console.log('🔮 Calculating water forecast using EnterpriseForecast (Prophet model)...');

        // Get water metrics from catalog
        const { data: waterMetrics } = await supabaseAdmin
          .from('metrics_catalog')
          .select('*')
          .or('subcategory.eq.Water,code.ilike.%water%');

        if (waterMetrics && waterMetrics.length > 0) {
          const metricIds = waterMetrics.map(m => m.id);
          const currentYear = new Date().getFullYear();

          // Get historical data for forecast calculation
          const { data: metricsData } = await supabaseAdmin
            .from('metrics_data')
            .select('metric_id, value, period_start')
            .eq('organization_id', organizationId)
            .in('metric_id', metricIds)
            .gte('period_start', `${currentYear}-01-01`)
            .lt('period_start', `${currentYear + 1}-01-01`)
            .order('period_start');

          if (metricsData && metricsData.length > 0) {
            // Calculate monthly aggregates
            const monthlyAggregates: any = {};

            metricsData.forEach(record => {
              const metric = waterMetrics.find(m => m.id === record.metric_id);
              const metricCode = metric?.code || '';
              const date = new Date(record.period_start);
              const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

              if (!monthlyAggregates[monthKey]) {
                monthlyAggregates[monthKey] = { withdrawal: 0, discharge: 0, consumption: 0 };
              }

              const value = parseFloat(record.value) || 0;
              const isDischarge = metricCode.includes('wastewater');

              if (isDischarge) {
                monthlyAggregates[monthKey].discharge += value;
              } else {
                monthlyAggregates[monthKey].withdrawal += value;
              }
            });

            // Calculate consumption for each month
            Object.keys(monthlyAggregates).forEach(monthKey => {
              const data = monthlyAggregates[monthKey];
              data.consumption = data.withdrawal - data.discharge;
            });

            // Get the last month with actual data
            const actualMonths = Object.keys(monthlyAggregates).sort();
            const lastActualMonth = actualMonths[actualMonths.length - 1];
            const lastActualMonthNum = parseInt(lastActualMonth.split('-')[1]);

            // Prepare historical data for EnterpriseForecast
            const withdrawalHistory = actualMonths.map(key => ({
              month: key,
              emissions: monthlyAggregates[key].withdrawal
            }));

            const dischargeHistory = actualMonths.map(key => ({
              month: key,
              emissions: monthlyAggregates[key].discharge
            }));

            const consumptionHistory = actualMonths.map(key => ({
              month: key,
              emissions: monthlyAggregates[key].consumption
            }));

            // Calculate how many months to forecast
            const monthsToForecast = 12 - lastActualMonthNum;

            // Use EnterpriseForecast (Prophet-style) for each metric
            const withdrawalForecast = EnterpriseForecast.forecast(withdrawalHistory, monthsToForecast, false);
            const dischargeForecast = EnterpriseForecast.forecast(dischargeHistory, monthsToForecast, false);
            const consumptionForecast = EnterpriseForecast.forecast(consumptionHistory, monthsToForecast, false);

            // Build forecast array
            const forecast = [];
            for (let i = 0; i < monthsToForecast; i++) {
              const month = lastActualMonthNum + i + 1;
              const monthName = new Date(currentYear, month - 1, 1).toLocaleString('default', { month: 'short' });
              forecast.push({
                month: monthName,
                monthKey: `${currentYear}-${String(month).padStart(2, '0')}`,
                withdrawal: withdrawalForecast.forecasted[i] || 0,
                discharge: dischargeForecast.forecasted[i] || 0,
                consumption: consumptionForecast.forecasted[i] || 0
              });
            }

            forecastData = { forecast, model: withdrawalForecast.method };
            console.log(`✅ Generated water forecast using ${withdrawalForecast.method} (EnterpriseForecast): ${forecast.length} months`);
            console.log(`   Sample forecast:`, JSON.stringify(forecast[0]));
          } else {
            console.log('⚠️ No historical water data available for forecasting');
          }
        } else {
          console.log('⚠️ No water metrics found in catalog');
        }
      } catch (err) {
        console.error('❌ Error generating water forecast:', err);
      }
    }

    // Calculate emissions forecast for non-water categories
    if (needsEmissionsForecast) {
      try {
        console.log('🔮 Calculating emissions forecast using EnterpriseForecast (Prophet model) with real emissions data...');

        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1; // 1-12

        // Get ALL monthly emissions from metrics_data using baseline-calculator
        const allMonthlyEmissions = await getMonthlyEmissions(
          organizationId,
          `${currentYear}-01-01`,
          `${currentYear}-12-31`
        );

        console.log(`📊 Got ${allMonthlyEmissions.length} months of emissions data from metrics_data`);

        // Get monthly emissions data for the current year for each metric target
        const metricForecastMap: Record<string, any> = {};

        for (const mt of metricTargets) {
          // Get the metric catalog ID to filter metrics_data
          const metricCatalogId = mt.metric_catalog_id;

          // Fetch monthly emissions for this specific metric from metrics_data
          const { data: metricMonthlyData } = await supabaseAdmin
            .from('metrics_data')
            .select('period_start, co2e_emissions')
            .eq('organization_id', organizationId)
            .eq('metric_id', metricCatalogId)
            .gte('period_start', `${currentYear}-01-01`)
            .lt('period_start', `${currentYear + 1}-01-01`)
            .order('period_start');

          if (metricMonthlyData && metricMonthlyData.length > 0) {
            // Aggregate by month
            const monthlyMap = new Map<string, number>();
            metricMonthlyData.forEach(d => {
              const monthKey = d.period_start?.substring(0, 7); // "2025-01"
              if (monthKey) {
                const current = monthlyMap.get(monthKey) || 0;
                monthlyMap.set(monthKey, current + (d.co2e_emissions || 0) / 1000); // Convert to tCO2e
              }
            });

            // Convert to sorted array
            const emissionsHistory = Array.from(monthlyMap.entries())
              .sort((a, b) => a[0].localeCompare(b[0]))
              .map(([month, emissions]) => ({
                month,
                emissions: Math.round(emissions * 10) / 10
              }));

            if (emissionsHistory.length > 0) {
              // Get last actual month
              const lastMonthKey = emissionsHistory[emissionsHistory.length - 1].month;
              const lastMonthNum = parseInt(lastMonthKey.split('-')[1]);
              const monthsToForecast = 12 - lastMonthNum;

              console.log(`📈 ${mt.metrics_catalog?.name}: ${emissionsHistory.length} months actual, forecasting ${monthsToForecast} months`);

              if (monthsToForecast > 0) {
                // Use EnterpriseForecast to predict remaining months
                const forecast = EnterpriseForecast.forecast(emissionsHistory, monthsToForecast, false);

                metricForecastMap[mt.id] = {
                  forecasted: forecast.forecasted,
                  method: forecast.method,
                  monthsToForecast,
                  actualMonths: emissionsHistory.length
                };

                console.log(`✅ Generated forecast for ${mt.metrics_catalog?.name}: ${monthsToForecast} months using ${forecast.method}`);
              }
            }
          } else {
            console.log(`⚠️ No emissions data found for ${mt.metrics_catalog?.name}`);
          }
        }

        emissionsForecastData = metricForecastMap;
        console.log(`✅ Generated emissions forecast for ${Object.keys(metricForecastMap).length} metrics`);

      } catch (err) {
        console.error('❌ Error generating emissions forecast:', err);
      }
    }

    // Transform for UI display
    const transformedTargets = await Promise.all((metricTargets || []).map(async mt => {
      const monthlyTargets = (monthlyData || []).filter(
        md => md.metric_target_id === mt.id
      );

      // Calculate YTD values from REAL metrics_data (not metric_targets_monthly)
      const currentYear = new Date().getFullYear();
      const { data: ytdMetricsData } = await supabaseAdmin
        .from('metrics_data')
        .select('value, co2e_emissions')
        .eq('organization_id', organizationId)
        .eq('metric_id', mt.metric_catalog_id)
        .gte('period_start', `${currentYear}-01-01`)
        .lt('period_start', `${currentYear + 1}-01-01`);

      const ytdValue = (ytdMetricsData || []).reduce(
        (sum, m) => sum + (m.value || 0),
        0
      );
      const ytdEmissions = Math.round((ytdMetricsData || []).reduce(
        (sum, m) => sum + ((m.co2e_emissions || 0) / 1000), // Convert kgCO2e to tCO2e
        0
      ) * 10) / 10;

      // Calculate projected end-of-year values using YTD + Forecast
      let currentValue = ytdValue;
      let currentEmissions = ytdEmissions;

      const category = mt.metrics_catalog?.category;
      console.log(`🔍 Processing ${category}: isWater=${category?.includes('Water')}, hasWaterForecast=${!!forecastData}, hasEmissionsForecast=${!!emissionsForecastData?.[mt.id]}`);

      // Apply water forecast for water categories
      if (forecastData && forecastData.forecast && forecastData.forecast.length > 0 && category?.includes('Water')) {
        // Sum forecast values for remaining months
        const forecastRemaining = forecastData.forecast.reduce((sum: number, f: any) => {
          if (category === 'Water Consumption') {
            return sum + (f.consumption || 0);
          } else if (category === 'Water Withdrawal') {
            return sum + (f.withdrawal || 0);
          } else if (category === 'Water Discharge') {
            return sum + (f.discharge || 0);
          }
          return sum;
        }, 0);

        console.log(`💧 ${category}: YTD=${ytdEmissions.toFixed(2)}, Forecast=${forecastRemaining.toFixed(2)}, Projected=${(ytdEmissions + forecastRemaining).toFixed(2)}`);

        currentValue = ytdValue + forecastRemaining;
        currentEmissions = ytdEmissions + forecastRemaining;
      }
      // Apply emissions forecast for non-water categories
      else if (emissionsForecastData && emissionsForecastData[mt.id]) {
        const metricForecast = emissionsForecastData[mt.id];
        const forecastSum = metricForecast.forecasted.reduce((sum: number, val: number) => sum + val, 0);

        console.log(`🔥 ${category}: YTD=${ytdEmissions.toFixed(2)} tCO2e, Forecast=${forecastSum.toFixed(2)} tCO2e, Projected=${(ytdEmissions + forecastSum).toFixed(2)} tCO2e (${metricForecast.method})`);

        currentValue = ytdValue + forecastSum;
        currentEmissions = ytdEmissions + forecastSum;
      } else {
        console.log(`⚠️ No forecast data available for ${category}`);
      }

      // Calculate progress metrics using projected values
      const totalPlannedEmissions = monthlyTargets.reduce(
        (sum, m) => sum + (m.planned_emissions || 0),
        0
      );
      const totalActualEmissions = currentEmissions; // This is now projected (YTD + forecast)
      const reductionNeeded = (mt.baseline_emissions || 0) - (mt.target_emissions || 0);
      const reductionAchieved = (mt.baseline_emissions || 0) - totalActualEmissions;
      const progressPercent = reductionNeeded > 0
        ? (reductionAchieved / reductionNeeded) * 100
        : 0;

      // Determine status
      let trajectoryStatus: 'on-track' | 'at-risk' | 'off-track' = 'on-track';
      if (progressPercent < 70) {
        trajectoryStatus = 'off-track';
      } else if (progressPercent < 90) {
        trajectoryStatus = 'at-risk';
      }

      return {
        id: mt.id,
        metricId: mt.metric_catalog_id,
        metricCode: mt.metrics_catalog?.code,
        metricName: mt.metrics_catalog?.name,
        category: mt.metrics_catalog?.category,
        scope: mt.metrics_catalog?.scope,
        unit: mt.metrics_catalog?.unit,
        baselineValue: mt.baseline_value,
        baselineEmissions: mt.baseline_emissions,
        targetValue: mt.target_value,
        targetEmissions: mt.target_emissions,
        currentValue: currentValue,
        currentEmissions: currentEmissions,
        progress: {
          totalPlannedEmissions,
          totalActualEmissions,
          reductionNeeded,
          reductionAchieved,
          progressPercent,
          trajectoryStatus
        },
        monthlyData: monthlyTargets.map(m => ({
          year: m.year,
          month: m.month,
          targetEmissions: m.planned_emissions,
          actualEmissions: m.actual_emissions,
          variance: (m.actual_emissions || 0) - (m.planned_emissions || 0),
          variancePercent: m.planned_emissions
            ? (((m.actual_emissions || 0) - (m.planned_emissions || 0)) / m.planned_emissions) * 100
            : 0
        }))
      };
    }));

    // Filter out metrics with no data (baseline = 0 AND target = 0 AND current = 0)
    const metricsWithData = transformedTargets.filter(mt => {
      const hasBaseline = (mt.baselineEmissions || 0) > 0;
      const hasTarget = (mt.targetEmissions || 0) > 0;
      const hasCurrent = (mt.currentEmissions || 0) > 0;
      const hasAnyData = hasBaseline || hasTarget || hasCurrent;

      if (!hasAnyData) {
        console.log(`🚫 Filtering out ${mt.metricName} (${mt.category}): no data (baseline=${mt.baselineEmissions}, target=${mt.targetEmissions}, current=${mt.currentEmissions})`);
      }

      return hasAnyData;
    });

    console.log(`✅ Filtered results: ${metricsWithData.length} metrics with data out of ${transformedTargets.length} total`);

    return NextResponse.json({
      success: true,
      data: metricsWithData
    });

  } catch (error: any) {
    console.error('Error in by-category API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
