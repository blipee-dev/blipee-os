import { config } from 'dotenv';
config({ path: '.env.local' });

import { supabaseAdmin } from './src/lib/supabase/admin';
import { EnterpriseForecast } from './src/lib/forecasting/enterprise-forecaster';

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

const metricsToReplace = [
  { code: 'scope3_waste_incineration', name: 'Waste Incinerated' },
  { code: 'scope3_business_travel_rail', name: 'Train Travel' }
];

async function replaceMetric(metricCode: string, metricName: string) {
  console.log(`\n${'='.repeat(100)}`);
  console.log(`🔄 Processing: ${metricName} (${metricCode})`);
  console.log('='.repeat(100));

  // Get metric_id
  const { data: catalog, error: catalogError } = await supabaseAdmin
    .from('metrics_catalog')
    .select('id')
    .eq('code', metricCode)
    .single();

  if (catalogError || !catalog) {
    console.error(`❌ Error finding metric:`, catalogError);
    return { success: false, error: catalogError };
  }

  console.log(`✅ Metric ID: ${catalog.id}`);

  // Fetch historical data
  const { data: historicalData, error: historicalError } = await supabaseAdmin
    .from('metrics_data')
    .select('period_start, value, co2e_emissions')
    .eq('organization_id', organizationId)
    .eq('metric_id', catalog.id)
    .gte('period_start', '2022-01-01')
    .lt('period_start', '2025-01-01')
    .order('period_start', { ascending: true });

  if (historicalError || !historicalData) {
    console.error(`❌ Error fetching historical data:`, historicalError);
    return { success: false, error: historicalError };
  }

  console.log(`📊 Historical data: ${historicalData.length} months`);

  if (historicalData.length < 12) {
    console.log(`⚠️  Insufficient historical data (need 12+). Skipping.`);
    return { success: false, error: 'Insufficient data' };
  }

  // Prepare monthly data for ML model
  const monthlyData: { month: string; emissions: number }[] = [];
  historicalData.forEach(d => {
    const month = d.period_start?.substring(0, 7) || '';
    const emissions = (d.co2e_emissions || 0) / 1000;
    monthlyData.push({ month, emissions });
  });

  // Run ML forecast
  const forecast = EnterpriseForecast.forecast(monthlyData, 12, false);

  console.log(`✅ ML Forecast complete`);
  console.log(`   Method: ${forecast.method}`);
  console.log(`   R²: ${forecast.metadata.r2.toFixed(4)}`);
  console.log(`   Seasonal strength: ${forecast.metadata.seasonalStrength.toFixed(4)}`);

  // Fetch existing 2025 data
  const { data: existing2025, error: error2025 } = await supabaseAdmin
    .from('metrics_data')
    .select('id, period_start, value, co2e_emissions')
    .eq('organization_id', organizationId)
    .eq('metric_id', catalog.id)
    .gte('period_start', '2025-01-01')
    .lt('period_start', '2026-01-01')
    .order('period_start', { ascending: true });

  if (error2025) {
    console.error(`❌ Error fetching 2025 data:`, error2025);
    return { success: false, error: error2025 };
  }

  console.log(`📋 Existing 2025 data: ${existing2025?.length || 0} months`);

  // Calculate emission factor
  const avgEmissionFactor = historicalData.reduce((sum, d) => {
    const value = d.value || 0;
    const emissions = d.co2e_emissions || 0;
    return sum + (value > 0 ? emissions / value : 0);
  }, 0) / historicalData.filter(d => (d.value || 0) > 0).length;

  console.log(`   Avg emission factor: ${avgEmissionFactor.toFixed(6)}`);

  // Prepare updates
  const months = ['2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06',
                  '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12'];

  console.log('\n📅 Month-by-month changes:');
  console.log('─'.repeat(100));
  console.log('Month       Old (tCO2e)      New (tCO2e)      Change');
  console.log('─'.repeat(100));

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < months.length; i++) {
    const monthStr = months[i];
    const forecastEmissionsKg = forecast.forecasted[i] * 1000;
    const forecastValue = avgEmissionFactor > 0 ? forecastEmissionsKg / avgEmissionFactor : 0;

    const existing = existing2025?.find(d => d.period_start?.startsWith(monthStr));

    if (existing) {
      const oldEmissions = (existing.co2e_emissions || 0) / 1000;
      const newEmissions = forecast.forecasted[i];
      const change = ((newEmissions - oldEmissions) / oldEmissions) * 100;

      console.log(
        `${monthStr}   ${oldEmissions.toFixed(4).padStart(16)}   ${newEmissions.toFixed(4).padStart(16)}   ` +
        `${(change > 0 ? '+' : '') + change.toFixed(1)}%`
      );

      // Update record
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
        console.error(`❌ Error updating ${monthStr}:`, updateError.message);
        errorCount++;
      } else {
        successCount++;
      }
    }
  }

  console.log('─'.repeat(100));
  console.log(`✅ Success: ${successCount} | ❌ Errors: ${errorCount}`);

  return { success: errorCount === 0, successCount, errorCount };
}

async function replaceAllLinearScope3() {
  console.log('🔄 REPLACING ALL LINEAR SCOPE 3 METRICS WITH ML FORECASTS\n');
  console.log('='.repeat(100));
  console.log(`\nProcessing ${metricsToReplace.length} metrics with linear patterns\n`);

  const results: Array<{ metric: string; success: boolean; successCount?: number; errorCount?: number }> = [];

  for (const metric of metricsToReplace) {
    const result = await replaceMetric(metric.code, metric.name);
    results.push({
      metric: metric.name,
      success: result.success,
      successCount: result.successCount,
      errorCount: result.errorCount
    });
  }

  console.log('\n\n📊 FINAL SUMMARY');
  console.log('='.repeat(100));

  results.forEach(r => {
    const status = r.success ? '✅ SUCCESS' : '❌ FAILED';
    const details = r.successCount !== undefined
      ? ` (${r.successCount} updated, ${r.errorCount} errors)`
      : '';
    console.log(`${status}: ${r.metric}${details}`);
  });

  const totalSuccess = results.filter(r => r.success).length;
  const totalFailed = results.filter(r => !r.success).length;

  console.log('\n─'.repeat(100));
  console.log(`Total metrics processed: ${results.length}`);
  console.log(`✅ Successful: ${totalSuccess}`);
  console.log(`❌ Failed: ${totalFailed}`);

  if (totalSuccess === results.length) {
    console.log('\n🎉 All linear Scope 3 metrics successfully replaced with ML forecasts!');
    console.log('\nNext steps:');
    console.log('  1. Refresh the Emissions Dashboard');
    console.log('  2. Scope 3 trend lines will now show realistic variation');
    console.log('  3. Data quality marked as "calculated" for ML-generated values');
  }

  console.log('\n' + '='.repeat(100));
}

replaceAllLinearScope3().catch(console.error);
