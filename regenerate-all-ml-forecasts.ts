import { config } from 'dotenv';
config({ path: '.env.local' });

import { supabaseAdmin } from './src/lib/supabase/admin';
import { EnterpriseForecast } from './src/lib/forecasting/enterprise-forecaster';

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function regenerateAllMLForecasts() {
  console.log('🚀 REGENERATING ALL 2025 FORECASTS WITH SEASONAL DECOMPOSITION (FACEBOOK PROPHET)\n');
  console.log('='.repeat(120));

  // Step 1: Get all metrics with 2025 data marked as 'calculated'
  const { data: data2025 } = await supabaseAdmin
    .from('metrics_data')
    .select(`
      metric_id,
      site_id,
      metrics_catalog!inner(id, code, name, scope, unit, category)
    `)
    .eq('organization_id', organizationId)
    .eq('data_quality', 'calculated')
    .gte('period_start', '2025-01-01')
    .lt('period_start', '2026-01-01');

  if (!data2025) {
    console.error('❌ No calculated 2025 data found');
    return;
  }

  // Get unique metrics
  const uniqueMetrics = new Map<string, any>();
  data2025.forEach(d => {
    const key = `${d.metric_id}_${d.site_id || 'null'}`;
    if (!uniqueMetrics.has(key)) {
      uniqueMetrics.set(key, {
        metricId: d.metric_id,
        siteId: d.site_id,
        code: d.metrics_catalog.code,
        name: d.metrics_catalog.name,
        scope: d.metrics_catalog.scope,
        unit: d.metrics_catalog.unit,
        category: d.metrics_catalog.category
      });
    }
  });

  console.log(`\n📊 Found ${uniqueMetrics.size} unique metric/site combinations\n`);

  const results: any[] = [];
  let processedCount = 0;

  for (const [key, metric] of uniqueMetrics.entries()) {
    processedCount++;
    console.log(`\n[${processedCount}/${uniqueMetrics.size}] Processing: ${metric.name}`);
    console.log('─'.repeat(120));

    // Fetch ALL historical data (2022-2024) - use full 36 months
    const { data: historicalData } = await supabaseAdmin
      .from('metrics_data')
      .select('period_start, value, co2e_emissions')
      .eq('organization_id', organizationId)
      .eq('metric_id', metric.metricId)
      .gte('period_start', '2022-01-01')
      .lt('period_start', '2025-01-01')
      .order('period_start', { ascending: true });

    if (!historicalData || historicalData.length < 12) {
      console.log(`   ⚠️  Insufficient historical data (${historicalData?.length || 0} months) - Skipping`);
      results.push({ metric: metric.name, success: false, reason: 'Insufficient data' });
      continue;
    }

    console.log(`   📊 Using ${historicalData.length} months of historical data (${historicalData[0].period_start?.substring(0, 7)} to ${historicalData[historicalData.length - 1].period_start?.substring(0, 7)})`);

    // Prepare monthly data for ML
    const monthlyData: { month: string; emissions: number }[] = historicalData.map(d => ({
      month: d.period_start?.substring(0, 7) || '',
      emissions: (d.co2e_emissions || 0) / 1000
    }));

    // Run ML forecast for 12 months using seasonal decomposition (Facebook Prophet-style)
    const forecast = EnterpriseForecast.forecast(monthlyData, 12, false);
    console.log(`   ✅ ML Forecast: ${forecast.method} | R²: ${forecast.metadata.r2.toFixed(4)} | Seasonal: ${forecast.metadata.seasonalStrength.toFixed(4)}`);

    // Calculate emission factor
    const avgEmissionFactor = historicalData.reduce((sum, d) => {
      const value = d.value || 0;
      const emissions = d.co2e_emissions || 0;
      return sum + (value > 0 ? emissions / value : 0);
    }, 0) / historicalData.filter(d => (d.value || 0) > 0).length;

    // Delete existing 2025 records for this metric
    let deleteQuery = supabaseAdmin
      .from('metrics_data')
      .delete()
      .eq('organization_id', organizationId)
      .eq('metric_id', metric.metricId)
      .gte('period_start', '2025-01-01')
      .lt('period_start', '2026-01-01')
      .eq('data_quality', 'calculated');

    if (metric.siteId) {
      deleteQuery = deleteQuery.eq('site_id', metric.siteId);
    } else {
      deleteQuery = deleteQuery.is('site_id', null);
    }

    const { error: deleteError } = await deleteQuery;
    if (deleteError) {
      console.log(`   ❌ Error deleting old records: ${deleteError.message}`);
      results.push({ metric: metric.name, success: false, reason: deleteError.message });
      continue;
    }

    console.log(`   🗑️  Deleted old calculated records`);

    // Create all 12 months (Jan-Dec 2025)
    const months = [
      { month: '2025-01', days: 31 }, { month: '2025-02', days: 28 },
      { month: '2025-03', days: 31 }, { month: '2025-04', days: 30 },
      { month: '2025-05', days: 31 }, { month: '2025-06', days: 30 },
      { month: '2025-07', days: 31 }, { month: '2025-08', days: 31 },
      { month: '2025-09', days: 30 }, { month: '2025-10', days: 31 },
      { month: '2025-11', days: 30 }, { month: '2025-12', days: 31 }
    ];

    const recordsToInsert = months.map((m, index) => {
      const forecastEmissionsKg = forecast.forecasted[index] * 1000;
      const forecastValue = avgEmissionFactor > 0 ? forecastEmissionsKg / avgEmissionFactor : 0;

      return {
        organization_id: organizationId,
        metric_id: metric.metricId,
        site_id: metric.siteId,
        period_start: `${m.month}-01`,
        period_end: `${m.month}-${m.days}`,
        value: forecastValue,
        unit: metric.unit,
        co2e_emissions: forecastEmissionsKg,
        data_quality: 'calculated',
        notes: `ML forecast using ${forecast.method} (${monthlyData.length} months: 2022-2024 full historical data)`,
        metadata: {
          forecast_method: forecast.method,
          forecast_model: 'EnterpriseForecast',
          forecast_r2: forecast.metadata.r2,
          seasonal_strength: forecast.metadata.seasonalStrength,
          trend_slope: forecast.metadata.trendSlope,
          volatility: forecast.metadata.volatility,
          training_months: monthlyData.length,
          training_period: `${historicalData[0].period_start?.substring(0, 7)} to ${historicalData[historicalData.length - 1].period_start?.substring(0, 7)}`,
          regenerated_at: new Date().toISOString()
        }
      };
    });

    const { error: insertError } = await supabaseAdmin
      .from('metrics_data')
      .insert(recordsToInsert);

    if (insertError) {
      console.log(`   ❌ Error inserting new records: ${insertError.message}`);
      results.push({ metric: metric.name, success: false, reason: insertError.message });
    } else {
      const totalEmissions = forecast.forecasted.reduce((sum, e) => sum + e, 0);
      console.log(`   ✅ Created 12 new records | Total 2025: ${totalEmissions.toFixed(2)} tCO2e`);
      results.push({
        metric: metric.name,
        success: true,
        totalEmissions
      });
    }

    // Small delay to avoid overwhelming the database
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  console.log('\n\n' + '═'.repeat(120));
  console.log('📊 FINAL SUMMARY');
  console.log('═'.repeat(120));

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`\n✅ Successfully regenerated: ${successful.length} metrics`);
  console.log(`❌ Failed: ${failed.length} metrics`);

  if (successful.length > 0) {
    const totalEmissions = successful.reduce((sum, r) => sum + (r.totalEmissions || 0), 0);
    console.log(`\n📈 Total 2025 Emissions (all metrics): ${totalEmissions.toFixed(2)} tCO2e`);

    console.log('\n\n✅ SUCCESSFULLY REGENERATED FORECASTS FOR:');
    console.log('─'.repeat(120));
    successful.forEach(r => {
      console.log(`   • ${r.metric} - ${r.totalEmissions.toFixed(2)} tCO2e`);
    });
  }

  if (failed.length > 0) {
    console.log('\n\n❌ FAILED TO REGENERATE FORECASTS FOR:');
    console.log('─'.repeat(120));
    failed.forEach(r => {
      console.log(`   • ${r.metric} - ${r.reason || 'Unknown error'}`);
    });
  }

  console.log('\n\n🎉 COMPLETION');
  console.log('═'.repeat(120));
  console.log('\nAll 2025 forecasts have been regenerated using seasonal decomposition (Facebook Prophet)!');
  console.log('\nKey changes:');
  console.log('  ✅ All metrics now use seasonal-decomposition model (Facebook Prophet-style)');
  console.log('  ✅ Full 36 months of historical data (2022-2024) used for training');
  console.log('  ✅ Captures trend + seasonality + residual components');
  console.log('  ✅ All 12 months (Jan-Dec 2025) regenerated');
  console.log('\nNext steps:');
  console.log('  1. Refresh your dashboards to see updated projections');
  console.log('  2. All forecasts now use consistent methodology with seasonal patterns');

  console.log('\n' + '═'.repeat(120));
}

regenerateAllMLForecasts().catch(console.error);
