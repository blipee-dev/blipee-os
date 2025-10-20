import { config } from 'dotenv';
config({ path: '.env.local' });

import { supabaseAdmin } from './src/lib/supabase/admin';
import { EnterpriseForecast } from './src/lib/forecasting/enterprise-forecaster';

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function replacePlaneTravel2025() {
  console.log('🔄 REPLACING 2025 PLANE TRAVEL DATA WITH ML FORECAST\n');
  console.log('='.repeat(100));

  // Step 1: Get the metric_id for plane travel
  const { data: catalog, error: catalogError } = await supabaseAdmin
    .from('metrics_catalog')
    .select('id, code, name')
    .eq('code', 'scope3_business_travel_air')
    .single();

  if (catalogError || !catalog) {
    console.error('❌ Error finding metric:', catalogError);
    return;
  }

  console.log(`\n✅ Found metric: ${catalog.name} (${catalog.code})`);
  console.log(`   Metric ID: ${catalog.id}`);

  // Step 2: Fetch ALL historical data (2022-2024) - 36 months
  const { data: historicalData, error: historicalError } = await supabaseAdmin
    .from('metrics_data')
    .select('period_start, value, co2e_emissions')
    .eq('organization_id', organizationId)
    .eq('metric_id', catalog.id)
    .gte('period_start', '2022-01-01')
    .lt('period_start', '2025-01-01')
    .order('period_start', { ascending: true });

  if (historicalError || !historicalData) {
    console.error('❌ Error fetching historical data:', historicalError);
    return;
  }

  console.log(`\n📊 Historical Data: ${historicalData.length} months (2022-2024)`);

  // Step 3: Prepare monthly data for ML model - ONLY historical (no 2025)
  const monthlyData: { month: string; emissions: number }[] = [];

  historicalData.forEach(d => {
    const month = d.period_start?.substring(0, 7) || '';
    const emissions = (d.co2e_emissions || 0) / 1000;
    monthlyData.push({ month, emissions });
  });

  console.log(`   Training data: ${monthlyData.length} months`);

  // Step 4: Run 36-month seasonal decomposition forecast
  const forecast = EnterpriseForecast.forecast(monthlyData, 12, false);

  console.log(`\n✅ ML Forecast Complete`);
  console.log(`   Method: ${forecast.method}`);
  console.log(`   R²: ${forecast.metadata.r2.toFixed(4)}`);
  console.log(`   Seasonal strength: ${forecast.metadata.seasonalStrength.toFixed(4)}`);
  console.log(`   Trend slope: ${forecast.metadata.trendSlope.toFixed(4)} tCO2e/month`);

  if (forecast.method !== 'seasonal-decomposition') {
    console.warn('\n⚠️  WARNING: Expected seasonal-decomposition but got ' + forecast.method);
    console.warn('   Proceeding anyway, but results may not be optimal.');
  }

  // Step 5: Fetch existing 2025 data to check what needs updating
  const { data: existing2025, error: error2025 } = await supabaseAdmin
    .from('metrics_data')
    .select('id, period_start, value, co2e_emissions, data_quality')
    .eq('organization_id', organizationId)
    .eq('metric_id', catalog.id)
    .gte('period_start', '2025-01-01')
    .lt('period_start', '2026-01-01')
    .order('period_start', { ascending: true });

  if (error2025) {
    console.error('❌ Error fetching 2025 data:', error2025);
    return;
  }

  console.log(`\n📋 Existing 2025 Data: ${existing2025?.length || 0} months`);

  // Step 6: Calculate emissions to distance conversion (using avg emission factor from historical data)
  const avgEmissionFactor = historicalData.reduce((sum, d) => {
    const distance = d.value || 0;
    const emissions = d.co2e_emissions || 0;
    return sum + (distance > 0 ? emissions / distance : 0);
  }, 0) / historicalData.filter(d => (d.value || 0) > 0).length;

  console.log(`   Average emission factor: ${avgEmissionFactor.toFixed(6)} kgCO2e/km`);

  // Step 7: Prepare updates for each month
  const months = ['2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06',
                  '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12'];

  console.log('\n\n📅 UPDATING 2025 DATA WITH ML FORECAST');
  console.log('═'.repeat(100));
  console.log('Month       Old Emissions    New Emissions    Old Distance    New Distance    Change      Status');
  console.log('═'.repeat(100));

  const updates: Array<{
    id: string;
    period_start: string;
    old_emissions: number;
    new_emissions: number;
    old_distance: number;
    new_distance: number;
  }> = [];

  for (let i = 0; i < months.length; i++) {
    const monthStr = months[i];
    const forecastEmissionsKg = forecast.forecasted[i] * 1000; // Convert tCO2e to kg
    const forecastDistance = forecastEmissionsKg / avgEmissionFactor; // Calculate distance

    const existing = existing2025?.find(d => d.period_start?.startsWith(monthStr));

    if (existing) {
      const oldEmissions = (existing.co2e_emissions || 0) / 1000;
      const oldDistance = existing.value || 0;
      const newEmissions = forecast.forecasted[i];
      const change = ((newEmissions - oldEmissions) / oldEmissions) * 100;

      console.log(
        `${monthStr}   ${oldEmissions.toFixed(4).padStart(16)}   ${newEmissions.toFixed(4).padStart(16)}   ` +
        `${oldDistance.toFixed(0).padStart(14)}   ${forecastDistance.toFixed(0).padStart(14)}   ` +
        `${(change > 0 ? '+' : '') + change.toFixed(1).padStart(10)}%   Update`
      );

      updates.push({
        id: existing.id,
        period_start: monthStr + '-01',
        old_emissions: oldEmissions,
        new_emissions: newEmissions,
        old_distance: oldDistance,
        new_distance: forecastDistance
      });
    } else {
      console.log(
        `${monthStr}   ${'N/A'.padStart(16)}   ${forecast.forecasted[i].toFixed(4).padStart(16)}   ` +
        `${'N/A'.padStart(14)}   ${forecastDistance.toFixed(0).padStart(14)}   ` +
        `${'N/A'.padStart(11)}   Insert`
      );
    }
  }

  // Step 8: Ask for confirmation
  const totalOld = updates.reduce((sum, u) => sum + u.old_emissions, 0);
  const totalNew = updates.reduce((sum, u) => sum + u.new_emissions, 0);
  const totalChange = ((totalNew - totalOld) / totalOld) * 100;

  console.log('─'.repeat(100));
  console.log(
    `TOTAL       ${totalOld.toFixed(2).padStart(16)}   ${totalNew.toFixed(2).padStart(16)}   ` +
    `${' '.repeat(14)}   ${' '.repeat(14)}   ${(totalChange > 0 ? '+' : '') + totalChange.toFixed(1).padStart(10)}%`
  );

  console.log('\n\n⚠️  CONFIRMATION REQUIRED');
  console.log('═'.repeat(100));
  console.log(`\nThis will update ${updates.length} records in the metrics_data table.`);
  console.log(`Annual 2025 emissions will change from ${totalOld.toFixed(2)} tCO2e to ${totalNew.toFixed(2)} tCO2e`);
  console.log(`Change: ${(totalChange > 0 ? '+' : '') + totalChange.toFixed(1)}%`);
  console.log('\nThe updates will:');
  console.log('  • Replace linear pattern with realistic ML forecast');
  console.log('  • Use 36-month seasonal decomposition model');
  console.log('  • Mark data_quality as "calculated"');
  console.log('  • Preserve original data in metadata.original_value');

  // Execute updates
  console.log('\n\n🔄 EXECUTING UPDATES...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const update of updates) {
    const newEmissionsKg = update.new_emissions * 1000;
    const newDistance = update.new_distance;

    const { error: updateError } = await supabaseAdmin
      .from('metrics_data')
      .update({
        value: newDistance,
        co2e_emissions: newEmissionsKg,
        data_quality: 'calculated',
        metadata: {
          forecast_method: 'seasonal-decomposition',
          forecast_model: 'EnterpriseForecast',
          forecast_r2: forecast.metadata.r2,
          seasonal_strength: forecast.metadata.seasonalStrength,
          trend_slope: forecast.metadata.trendSlope,
          original_value: update.old_distance,
          original_emissions: update.old_emissions * 1000,
          replaced_at: new Date().toISOString(),
          training_months: monthlyData.length
        },
        notes: 'ML forecast using 36-month seasonal decomposition (2022-2024 training data)'
      })
      .eq('id', update.id);

    if (updateError) {
      console.error(`❌ Error updating ${update.period_start}:`, updateError);
      errorCount++;
    } else {
      console.log(`✅ Updated ${update.period_start}: ${update.old_emissions.toFixed(2)} → ${update.new_emissions.toFixed(2)} tCO2e`);
      successCount++;
    }
  }

  console.log('\n\n📊 UPDATE SUMMARY');
  console.log('═'.repeat(100));
  console.log(`✅ Successful updates: ${successCount}`);
  console.log(`❌ Failed updates: ${errorCount}`);
  console.log(`📈 Total records processed: ${updates.length}`);

  if (successCount === updates.length) {
    console.log('\n🎉 SUCCESS! All 2025 plane travel data has been replaced with ML forecast.');
    console.log('\nNext steps:');
    console.log('  1. Refresh the Emissions Dashboard to see realistic trend line');
    console.log('  2. Scope 3 will no longer show linear pattern');
    console.log('  3. Annual projection: ' + totalNew.toFixed(2) + ' tCO2e (was ' + totalOld.toFixed(2) + ' tCO2e)');
  }

  console.log('\n' + '═'.repeat(100));
}

replacePlaneTravel2025().catch(console.error);
