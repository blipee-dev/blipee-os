import { config } from 'dotenv';
config({ path: '.env.local' });

import { supabaseAdmin } from './src/lib/supabase/admin';
import { EnterpriseForecast } from './src/lib/forecasting/enterprise-forecaster';

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function forecastWith36Months() {
  console.log('🚀 ML FORECAST WITH FULL 36-MONTH SEASONAL DECOMPOSITION\n');
  console.log('='.repeat(100));

  // Fetch ALL historical data (2022-2024) - now including Dec 2022
  const { data: historicalData, error } = await supabaseAdmin
    .from('metrics_data')
    .select(`
      period_start,
      value,
      co2e_emissions,
      data_quality,
      metrics_catalog!inner(code, name)
    `)
    .eq('organization_id', organizationId)
    .eq('metrics_catalog.code', 'scope3_business_travel_air')
    .gte('period_start', '2022-01-01')
    .lt('period_start', '2025-01-01')
    .order('period_start', { ascending: true });

  if (error || !historicalData) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`\n📊 Historical Data: ${historicalData.length} months (2022-2024)`);

  // Fetch 2025 YTD data
  const { data: data2025 } = await supabaseAdmin
    .from('metrics_data')
    .select(`
      period_start,
      value,
      co2e_emissions,
      metrics_catalog!inner(code, name)
    `)
    .eq('organization_id', organizationId)
    .eq('metrics_catalog.code', 'scope3_business_travel_air')
    .gte('period_start', '2025-01-01')
    .lt('period_start', '2026-01-01')
    .order('period_start', { ascending: true });

  console.log(`📊 2025 YTD Data: ${data2025?.length || 0} months\n`);

  // Prepare monthly data for ML model - ONLY historical (no 2025 contamination)
  const monthlyData: { month: string; emissions: number }[] = [];

  historicalData.forEach(d => {
    const month = d.period_start?.substring(0, 7) || '';
    const emissions = (d.co2e_emissions || 0) / 1000;
    monthlyData.push({ month, emissions });
  });

  console.log('═'.repeat(100));
  console.log('COMPARISON: 24-Month vs 36-Month Training Data');
  console.log('═'.repeat(100));

  // Test 1: Forecast with only 24 months (2023-2024) - OLD METHOD
  console.log('\n\n📊 TEST 1: 24-Month Model (2023-2024 only)');
  console.log('─'.repeat(100));

  const data24Months = monthlyData.filter(d => {
    const year = d.month.substring(0, 4);
    return year === '2023' || year === '2024';
  });

  console.log(`Training data: ${data24Months.length} months`);
  const forecast24 = EnterpriseForecast.forecast(data24Months, 12, false);

  console.log(`\n✅ Model used: ${forecast24.method}`);
  console.log(`   Trend slope: ${forecast24.metadata.trendSlope.toFixed(4)} tCO2e/month`);
  console.log(`   Seasonal strength: ${forecast24.metadata.seasonalStrength.toFixed(4)}`);
  console.log(`   R²: ${forecast24.metadata.r2.toFixed(4)}`);
  console.log(`   Volatility: ±${forecast24.metadata.volatility.toFixed(2)} tCO2e`);

  // Test 2: Forecast with full 36 months (2022-2024) - NEW METHOD
  console.log('\n\n📊 TEST 2: 36-Month Model (2022-2024 full history)');
  console.log('─'.repeat(100));

  console.log(`Training data: ${monthlyData.length} months`);
  const forecast36 = EnterpriseForecast.forecast(monthlyData, 12, false);

  console.log(`\n✅ Model used: ${forecast36.method}`);
  console.log(`   Trend slope: ${forecast36.metadata.trendSlope.toFixed(4)} tCO2e/month`);
  console.log(`   Seasonal strength: ${forecast36.metadata.seasonalStrength.toFixed(4)}`);
  console.log(`   R²: ${forecast36.metadata.r2.toFixed(4)}`);
  console.log(`   Volatility: ±${forecast36.metadata.volatility.toFixed(2)} tCO2e`);

  // Compare forecasts month by month
  console.log('\n\n📅 MONTH-BY-MONTH FORECAST COMPARISON (2025)');
  console.log('═'.repeat(100));
  console.log('Month       24-Month Model    36-Month Model    Difference      Current Linear    Best Estimate');
  console.log('═'.repeat(100));

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let total24 = 0;
  let total36 = 0;
  let totalLinear = 0;

  months.forEach((monthName, index) => {
    const monthStr = `2025-${(index + 1).toString().padStart(2, '0')}`;
    const actual = data2025?.find(d => d.period_start?.startsWith(monthStr));

    if (actual) {
      // Actual data exists
      const actualEmissions = (actual.co2e_emissions || 0) / 1000;
      total24 += actualEmissions;
      total36 += actualEmissions;
      totalLinear += actualEmissions;

      console.log(
        `${monthName} 2025   ${actualEmissions.toFixed(4).padStart(16)}   ${actualEmissions.toFixed(4).padStart(16)}   ` +
        `${'(actual)'.padStart(14)}   ${actualEmissions.toFixed(4).padStart(16)}   ✅ Actual`
      );
    } else {
      // Forecasted months
      const forecast24Value = forecast24.forecasted[index];
      const forecast36Value = forecast36.forecasted[index];
      const difference = forecast36Value - forecast24Value;

      // Linear projection
      const lastActual = data2025?.[data2025.length - 1];
      const lastEmissions = (lastActual?.co2e_emissions || 0) / 1000;
      const monthsAhead = index - (data2025?.length || 0) + 1;
      const linearValue = lastEmissions + 1.553 * monthsAhead;

      total24 += forecast24Value;
      total36 += forecast36Value;
      totalLinear += linearValue;

      // Determine best estimate
      let bestEstimate = '';
      if (forecast36.method === 'seasonal-decomposition') {
        bestEstimate = forecast36Value.toFixed(4);
      } else {
        bestEstimate = forecast24Value.toFixed(4);
      }

      console.log(
        `${monthName} 2025   ${forecast24Value.toFixed(4).padStart(16)}   ${forecast36Value.toFixed(4).padStart(16)}   ` +
        `${(difference > 0 ? '+' : '') + difference.toFixed(2).padStart(13)}   ${linearValue.toFixed(4).padStart(16)}   ${bestEstimate}`
      );
    }
  });

  console.log('─'.repeat(100));
  console.log(
    `ANNUAL      ${total24.toFixed(2).padStart(16)}   ${total36.toFixed(2).padStart(16)}   ` +
    `${(total36 - total24 > 0 ? '+' : '') + (total36 - total24).toFixed(2).padStart(13)}   ${totalLinear.toFixed(2).padStart(16)}`
  );

  // Key insights
  console.log('\n\n💡 KEY INSIGHTS');
  console.log('═'.repeat(100));

  console.log('\n1️⃣  MODEL SELECTION:');
  if (forecast36.method === 'seasonal-decomposition') {
    console.log('   ✅ 36-month model uses SEASONAL DECOMPOSITION');
    console.log('      • Captures 3-year seasonal patterns');
    console.log('      • Separates trend, seasonality, and noise');
    console.log('      • Best for businesses with recurring patterns');
  } else {
    console.log('   ⚠️  36-month model still uses exponential smoothing');
    console.log('      • May need to check model threshold');
  }

  if (forecast24.method === 'exponential-smoothing') {
    console.log('   ⚠️  24-month model uses EXPONENTIAL SMOOTHING');
    console.log('      • Only captures trend, not seasonality');
    console.log('      • Less accurate for seasonal businesses');
  }

  console.log('\n2️⃣  SEASONAL STRENGTH:');
  console.log(`   24-month: ${forecast24.metadata.seasonalStrength.toFixed(4)} (${forecast24.method})`);
  console.log(`   36-month: ${forecast36.metadata.seasonalStrength.toFixed(4)} (${forecast36.method})`);

  if (forecast36.metadata.seasonalStrength > 0.3) {
    console.log('   ✅ Strong seasonality detected! Using 36-month model is crucial.');
  } else if (forecast36.metadata.seasonalStrength > 0.1) {
    console.log('   ⚠️  Moderate seasonality detected. 36-month model provides better accuracy.');
  } else {
    console.log('   ℹ️  Weak seasonality. Both models may perform similarly.');
  }

  console.log('\n3️⃣  MODEL QUALITY (R²):');
  console.log(`   24-month: ${forecast24.metadata.r2.toFixed(4)}`);
  console.log(`   36-month: ${forecast36.metadata.r2.toFixed(4)}`);

  if (forecast36.metadata.r2 > forecast24.metadata.r2) {
    console.log(`   ✅ 36-month model is ${((forecast36.metadata.r2 / forecast24.metadata.r2 - 1) * 100).toFixed(1)}% better fit`);
  } else if (forecast24.metadata.r2 > 0) {
    console.log(`   ⚠️  24-month model has better R² (unusual)`);
  }

  console.log('\n4️⃣  ANNUAL PROJECTION COMPARISON:');
  console.log(`   Linear continuation (current data): ${totalLinear.toFixed(2)} tCO2e`);
  console.log(`   24-month ML forecast: ${total24.toFixed(2)} tCO2e`);
  console.log(`   36-month ML forecast: ${total36.toFixed(2)} tCO2e`);
  console.log(`   Difference (36mo vs Linear): ${(total36 - totalLinear > 0 ? '+' : '') + (total36 - totalLinear).toFixed(2)} tCO2e (${(((total36 - totalLinear) / totalLinear) * 100).toFixed(1)}%)`);

  console.log('\n\n🎯 RECOMMENDATION');
  console.log('═'.repeat(100));

  if (forecast36.method === 'seasonal-decomposition') {
    console.log('\n✅ USE THE 36-MONTH SEASONAL DECOMPOSITION MODEL\n');
    console.log('Why:');
    console.log('  • Captures 3-year seasonal patterns (May and Sep travel spikes)');
    console.log('  • More accurate for businesses with recurring travel patterns');
    console.log('  • R² = ' + forecast36.metadata.r2.toFixed(4) + ' (explains ' + (forecast36.metadata.r2 * 100).toFixed(1) + '% of variance)');
    console.log('  • Seasonal strength: ' + forecast36.metadata.seasonalStrength.toFixed(4));
    console.log('\nProjected 2025 annual emissions: ' + total36.toFixed(2) + ' tCO2e');
  } else {
    console.log('\n⚠️  Both models use exponential smoothing\n');
    console.log('Consider:');
    console.log('  • The 36-month threshold may not be triggering correctly');
    console.log('  • Data quality or gaps may be preventing seasonal detection');
    console.log('  • For now, use the 36-month model as it has more training data');
    console.log('\nProjected 2025 annual emissions: ' + total36.toFixed(2) + ' tCO2e');
  }

  console.log('\n' + '═'.repeat(100));
}

forecastWith36Months().catch(console.error);
