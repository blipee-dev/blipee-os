import { config } from 'dotenv';
config({ path: '.env.local' });

import { supabaseAdmin } from './src/lib/supabase/admin';
import { EnterpriseForecast } from './src/lib/forecasting/enterprise-forecaster';

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

// Metrics to skip (already replaced)
const SKIP_METRICS = [
  'scope3_business_travel_air',
  'scope3_waste_incineration',
  'scope3_business_travel_rail'
];

async function replaceMetricWithML(metricId: string, metricCode: string, metricName: string, scope: string) {
  console.log(`\n${'─'.repeat(100)}`);
  console.log(`🔄 ${metricName} (${scope.replace('scope_', 'Scope ')})`);
  console.log('─'.repeat(100));

  // Fetch historical data (2022-2024)
  const { data: historicalData, error: historicalError } = await supabaseAdmin
    .from('metrics_data')
    .select('period_start, value, co2e_emissions')
    .eq('organization_id', organizationId)
    .eq('metric_id', metricId)
    .gte('period_start', '2022-01-01')
    .lt('period_start', '2025-01-01')
    .order('period_start', { ascending: true });

  if (historicalError || !historicalData || historicalData.length < 12) {
    console.log(`❌ Insufficient historical data (${historicalData?.length || 0} months)`);
    return { success: false, metric: metricName };
  }

  // Prepare monthly data for ML model
  const monthlyData: { month: string; emissions: number }[] = historicalData.map(d => ({
    month: d.period_start?.substring(0, 7) || '',
    emissions: (d.co2e_emissions || 0) / 1000
  }));

  // Run ML forecast
  const forecast = EnterpriseForecast.forecast(monthlyData, 12, false);

  console.log(`✅ ML Forecast: ${forecast.method} | R²: ${forecast.metadata.r2.toFixed(4)} | ${historicalData.length} months training`);

  // Fetch existing 2025 data
  const { data: existing2025, error: error2025 } = await supabaseAdmin
    .from('metrics_data')
    .select('id, period_start, value, co2e_emissions, data_quality')
    .eq('organization_id', organizationId)
    .eq('metric_id', metricId)
    .gte('period_start', '2025-01-01')
    .lt('period_start', '2026-01-01')
    .order('period_start', { ascending: true });

  if (error2025 || !existing2025) {
    console.log(`❌ Error fetching 2025 data`);
    return { success: false, metric: metricName };
  }

  // Calculate emission factor
  const avgEmissionFactor = historicalData.reduce((sum, d) => {
    const value = d.value || 0;
    const emissions = d.co2e_emissions || 0;
    return sum + (value > 0 ? emissions / value : 0);
  }, 0) / historicalData.filter(d => (d.value || 0) > 0).length;

  // Update records
  const months = ['2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06',
                  '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12'];

  let successCount = 0;
  let errorCount = 0;
  let totalOld = 0;
  let totalNew = 0;

  for (let i = 0; i < months.length; i++) {
    const monthStr = months[i];
    const forecastEmissionsKg = forecast.forecasted[i] * 1000;
    const forecastValue = avgEmissionFactor > 0 ? forecastEmissionsKg / avgEmissionFactor : 0;

    const existing = existing2025.find(d => d.period_start?.startsWith(monthStr));

    if (existing) {
      const oldEmissions = (existing.co2e_emissions || 0) / 1000;
      const newEmissions = forecast.forecasted[i];
      totalOld += oldEmissions;
      totalNew += newEmissions;

      const { error: updateError } = await supabaseAdmin
        .from('metrics_data')
        .update({
          value: forecastValue,
          co2e_emissions: forecastEmissionsKg,
          data_quality: 'calculated',
          metadata: {
            forecast_method: forecast.method,
            forecast_model: 'EnterpriseForecast',
            forecast_r2: forecast.metadata.r2,
            seasonal_strength: forecast.metadata.seasonalStrength,
            trend_slope: forecast.metadata.trendSlope,
            original_value: existing.value,
            original_emissions: existing.co2e_emissions,
            replaced_at: new Date().toISOString(),
            training_months: monthlyData.length
          },
          notes: `ML forecast using ${forecast.method} (${monthlyData.length} months training data)`
        })
        .eq('id', existing.id);

      if (updateError) {
        errorCount++;
      } else {
        successCount++;
      }
    }
  }

  const change = totalOld > 0 ? ((totalNew - totalOld) / totalOld) * 100 : 0;
  console.log(`   Updates: ${successCount} success, ${errorCount} errors`);
  console.log(`   Emissions: ${totalOld.toFixed(2)} → ${totalNew.toFixed(2)} tCO2e (${change > 0 ? '+' : ''}${change.toFixed(1)}%)`);

  return {
    success: errorCount === 0,
    metric: metricName,
    successCount,
    errorCount,
    oldEmissions: totalOld,
    newEmissions: totalNew
  };
}

async function replaceAllMetricsWithML() {
  console.log('🚀 REPLACING ALL METRICS WITH ML FORECASTS\n');
  console.log('='.repeat(100));

  // Fetch all metrics with 2025 data
  const { data: data2025, error } = await supabaseAdmin
    .from('metrics_data')
    .select(`
      metric_id,
      data_quality,
      co2e_emissions,
      metrics_catalog!inner(
        id,
        code,
        name,
        scope
      )
    `)
    .eq('organization_id', organizationId)
    .gte('period_start', '2025-01-01')
    .lt('period_start', '2026-01-01');

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  // Group by metric and filter
  const metricMap = new Map<string, any>();
  data2025.forEach(d => {
    const metricId = d.metric_id;
    const code = d.metrics_catalog.code;

    if (SKIP_METRICS.includes(code)) {
      return; // Skip already replaced metrics
    }

    if (!metricMap.has(metricId)) {
      metricMap.set(metricId, {
        metricId,
        code,
        name: d.metrics_catalog.name,
        scope: d.metrics_catalog.scope,
        dataQuality: d.data_quality,
        totalEmissions: 0
      });
    }

    metricMap.get(metricId)!.totalEmissions += (d.co2e_emissions || 0) / 1000;
  });

  // Filter to only metrics with emissions > 0 and not already calculated
  const metricsToProcess = Array.from(metricMap.values())
    .filter(m => m.totalEmissions > 0.001) // Skip near-zero emissions
    .filter(m => m.dataQuality !== 'calculated')
    .sort((a, b) => b.totalEmissions - a.totalEmissions);

  console.log(`\n📊 Processing ${metricsToProcess.length} metrics\n`);

  const results: any[] = [];
  let processedCount = 0;

  for (const metric of metricsToProcess) {
    processedCount++;
    console.log(`\n[${processedCount}/${metricsToProcess.length}]`);

    const result = await replaceMetricWithML(
      metric.metricId,
      metric.code,
      metric.name,
      metric.scope
    );

    results.push(result);

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n\n' + '═'.repeat(100));
  console.log('📊 FINAL SUMMARY');
  console.log('═'.repeat(100));

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`\n✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);

  if (successful.length > 0) {
    console.log('\n📈 Emissions Changes:');
    console.log('─'.repeat(100));
    console.log('Metric                                  Old (tCO2e)      New (tCO2e)      Change');
    console.log('─'.repeat(100));

    let grandTotalOld = 0;
    let grandTotalNew = 0;

    successful.forEach(r => {
      if (r.oldEmissions !== undefined) {
        const metricName = r.metric.substring(0, 38).padEnd(38);
        const oldDisplay = r.oldEmissions.toFixed(2).padStart(16);
        const newDisplay = r.newEmissions.toFixed(2).padStart(16);
        const change = r.oldEmissions > 0 ? ((r.newEmissions - r.oldEmissions) / r.oldEmissions) * 100 : 0;
        const changeDisplay = `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;

        console.log(`${metricName}  ${oldDisplay}  ${newDisplay}  ${changeDisplay.padStart(10)}`);

        grandTotalOld += r.oldEmissions;
        grandTotalNew += r.newEmissions;
      }
    });

    console.log('─'.repeat(100));
    const grandChange = grandTotalOld > 0 ? ((grandTotalNew - grandTotalOld) / grandTotalOld) * 100 : 0;
    console.log(`${'TOTAL'.padEnd(38)}  ${grandTotalOld.toFixed(2).padStart(16)}  ${grandTotalNew.toFixed(2).padStart(16)}  ${(grandChange > 0 ? '+' : '') + grandChange.toFixed(1)}%`.padStart(10));
  }

  if (failed.length > 0) {
    console.log('\n\n❌ Failed metrics:');
    failed.forEach(r => console.log(`   • ${r.metric}`));
  }

  console.log('\n\n🎉 COMPLETION');
  console.log('═'.repeat(100));
  console.log('\nAll eligible metrics have been replaced with ML forecasts!');
  console.log('\nNext steps:');
  console.log('  1. Refresh your dashboards (Emissions, Energy, Water, Waste)');
  console.log('  2. All trend lines will now show realistic ML-based patterns');
  console.log('  3. Data quality marked as "calculated" for all ML-generated values');
  console.log('  4. Original values preserved in metadata for audit trail');

  console.log('\n' + '═'.repeat(100));
}

replaceAllMetricsWithML().catch(console.error);
