import { config } from 'dotenv';
config({ path: '.env.local' });

import { supabaseAdmin } from './src/lib/supabase/admin';
import { EnterpriseForecast } from './src/lib/forecasting/enterprise-forecaster';

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function forecastPlaneTravel() {
  console.log('✈️  Plane Travel Emissions - Current vs ML Forecast\n');
  console.log('='.repeat(80));

  // Fetch plane travel data for 2025
  const { data: data2025, error: error2025 } = await supabaseAdmin
    .from('metrics_data')
    .select(`
      period_start,
      value,
      unit,
      co2e_emissions,
      metrics_catalog!inner(
        code,
        name,
        category
      )
    `)
    .eq('organization_id', organizationId)
    .eq('metrics_catalog.code', 'scope3_business_travel_air')
    .gte('period_start', '2025-01-01')
    .lt('period_start', '2026-01-01')
    .order('period_start', { ascending: true });

  if (error2025) {
    console.error('❌ Error fetching 2025 data:', error2025);
    return;
  }

  // Fetch historical plane travel data (2023-2024)
  const { data: historicalData, error: historicalError } = await supabaseAdmin
    .from('metrics_data')
    .select(`
      period_start,
      value,
      unit,
      co2e_emissions,
      metrics_catalog!inner(
        code,
        name,
        category
      )
    `)
    .eq('organization_id', organizationId)
    .eq('metrics_catalog.code', 'scope3_business_travel_air')
    .gte('period_start', '2023-01-01')
    .lt('period_start', '2025-01-01')
    .order('period_start', { ascending: true });

  if (historicalError) {
    console.error('❌ Error fetching historical data:', historicalError);
    return;
  }

  console.log('\n📊 CURRENT DATA (2025)');
  console.log('─'.repeat(80));
  console.log('Month       Distance (km)    Emissions (tCO2e)    Pattern');
  console.log('─'.repeat(80));

  const months2025 = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentData: { distance: number; emissions: number }[] = [];

  months2025.forEach((monthName, index) => {
    const monthStr = `2025-${(index + 1).toString().padStart(2, '0')}`;
    const record = data2025.find(d => d.period_start?.startsWith(monthStr));

    if (record) {
      const distance = record.value || 0;
      const emissions = (record.co2e_emissions || 0) / 1000;
      currentData.push({ distance, emissions });

      // Check if it's linear
      let pattern = '';
      if (currentData.length > 1) {
        const prevDistance = currentData[currentData.length - 2].distance;
        const diff = distance - prevDistance;
        const avgDiff = currentData.length > 2
          ? currentData.slice(1).reduce((sum, d, i) => sum + (d.distance - currentData[i].distance), 0) / (currentData.length - 1)
          : diff;

        if (Math.abs(diff - avgDiff) < avgDiff * 0.05) {
          pattern = '⚠️  LINEAR';
        } else {
          pattern = '✅ VARIABLE';
        }
      }

      console.log(`${monthName} 2025   ${distance.toFixed(2).padStart(14)}   ${emissions.toFixed(4).padStart(16)}   ${pattern}`);
    } else {
      console.log(`${monthName} 2025   ${'NO DATA'.padStart(14)}   ${'NO DATA'.padStart(16)}`);
    }
  });

  // Analyze if current data is linear
  let avgDiff = 0;
  if (currentData.length >= 3) {
    const differences: number[] = [];
    for (let i = 1; i < currentData.length; i++) {
      differences.push(currentData[i].distance - currentData[i-1].distance);
    }

    avgDiff = differences.reduce((a, b) => a + b, 0) / differences.length;
    const maxDeviation = Math.max(...differences.map(d => Math.abs(d - avgDiff)));

    console.log('\n📈 Pattern Analysis:');
    console.log(`   Average monthly increase: ${avgDiff.toFixed(2)} km`);
    console.log(`   Max deviation: ${maxDeviation.toFixed(2)} km (${((maxDeviation/avgDiff)*100).toFixed(1)}% of average)`);

    if (maxDeviation < avgDiff * 0.1) {
      console.log(`   ⚠️  HIGHLY LINEAR - This data appears to be projected/estimated`);
    }
  }

  // Prepare historical data for ML forecast
  console.log('\n\n📚 HISTORICAL DATA (for ML training)');
  console.log('─'.repeat(80));

  if (historicalData.length === 0) {
    console.log('❌ No historical data found. Cannot use ML forecast.');
    console.log('   The ML model requires at least 12 months of historical data.');
    return;
  }

  console.log(`Found ${historicalData.length} months of historical data (2023-2024)`);
  console.log('\nSample historical months:');
  historicalData.slice(0, 6).forEach(d => {
    const month = d.period_start?.substring(0, 7);
    const distance = d.value || 0;
    const emissions = (d.co2e_emissions || 0) / 1000;
    console.log(`   ${month}: ${distance.toFixed(2)} km = ${emissions.toFixed(4)} tCO2e`);
  });

  // Prepare monthly data for ML model (combining historical + available 2025 data)
  const allMonthlyData: { month: string; emissions: number }[] = [];

  historicalData.forEach(d => {
    const month = d.period_start?.substring(0, 7) || '';
    const emissions = (d.co2e_emissions || 0) / 1000;
    allMonthlyData.push({ month, emissions });
  });

  // Add available 2025 data
  data2025.forEach(d => {
    const month = d.period_start?.substring(0, 7) || '';
    const emissions = (d.co2e_emissions || 0) / 1000;
    allMonthlyData.push({ month, emissions });
  });

  console.log(`\nTotal training data: ${allMonthlyData.length} months`);

  // Use EnterpriseForecast to predict remaining months
  const monthsToForecast = 12 - data2025.length; // Forecast remaining months of 2025

  if (monthsToForecast <= 0) {
    console.log('\n✅ All 2025 months already have data. No forecast needed.');
    return;
  }

  console.log('\n\n🤖 ML FORECAST (Enterprise Forecast Model)');
  console.log('─'.repeat(80));
  console.log(`Forecasting ${monthsToForecast} remaining months using ${allMonthlyData.length} months of training data`);

  const forecastResult = EnterpriseForecast.forecast(allMonthlyData, monthsToForecast, true);

  console.log('\n📊 Forecast Results:');
  console.log('─'.repeat(80));
  console.log(`Method: ${forecastResult.method}`);
  console.log(`Model Quality (R²): ${forecastResult.metadata.r2.toFixed(4)}`);
  console.log(`Trend Slope: ${forecastResult.metadata.trendSlope.toFixed(4)} tCO2e/month`);
  console.log(`Seasonal Strength: ${forecastResult.metadata.seasonalStrength.toFixed(4)}`);
  console.log(`Volatility (Std Dev): ${forecastResult.metadata.volatility.toFixed(4)} tCO2e`);

  console.log('\n📅 Forecasted Emissions (Remaining 2025 Months):');
  console.log('─'.repeat(80));
  console.log('Month       Forecasted (tCO2e)   95% Confidence Interval');
  console.log('─'.repeat(80));

  const startMonthIndex = data2025.length; // Start forecasting from next month
  forecastResult.forecasted.forEach((emission, index) => {
    const monthIndex = startMonthIndex + index;
    const monthName = months2025[monthIndex];
    const lower = forecastResult.confidence.lower[index];
    const upper = forecastResult.confidence.upper[index];

    console.log(`${monthName} 2025   ${emission.toFixed(4).padStart(18)}   [${lower.toFixed(2)} - ${upper.toFixed(2)}]`);
  });

  // Compare: Current (Linear) vs ML Forecast
  console.log('\n\n📊 COMPARISON: Current Data vs ML Forecast');
  console.log('='.repeat(80));

  const totalCurrentEmissions = currentData.reduce((sum, d) => sum + d.emissions, 0);
  const totalForecastedEmissions = forecastResult.forecasted.reduce((a, b) => a + b, 0);
  const projectedAnnual2025Current = totalCurrentEmissions + (currentData.length > 0 ? (currentData[currentData.length - 1].emissions + avgDiff) * monthsToForecast : 0);
  const projectedAnnual2025ML = totalCurrentEmissions + totalForecastedEmissions;

  console.log('\nCurrent Data (Linear Pattern):');
  console.log(`   YTD Emissions: ${totalCurrentEmissions.toFixed(2)} tCO2e (${data2025.length} months)`);
  console.log(`   Projected Annual: ${projectedAnnual2025Current.toFixed(2)} tCO2e`);
  console.log(`   Method: Linear extrapolation`);

  console.log('\nML Forecast (Enterprise Model):');
  console.log(`   YTD Emissions: ${totalCurrentEmissions.toFixed(2)} tCO2e (${data2025.length} months)`);
  console.log(`   Forecasted Remaining: ${totalForecastedEmissions.toFixed(2)} tCO2e (${monthsToForecast} months)`);
  console.log(`   Projected Annual: ${projectedAnnual2025ML.toFixed(2)} tCO2e`);
  console.log(`   Method: ${forecastResult.method}`);

  const difference = projectedAnnual2025ML - projectedAnnual2025Current;
  const percentDiff = ((difference / projectedAnnual2025Current) * 100);

  console.log('\nDifference:');
  console.log(`   ${difference > 0 ? '+' : ''}${difference.toFixed(2)} tCO2e (${percentDiff > 0 ? '+' : ''}${percentDiff.toFixed(1)}%)`);

  if (Math.abs(percentDiff) < 5) {
    console.log(`   ✅ Similar to current linear pattern`);
  } else if (difference < 0) {
    console.log(`   📉 ML predicts LOWER emissions (more realistic based on historical patterns)`);
  } else {
    console.log(`   📈 ML predicts HIGHER emissions (accounts for seasonal variations)`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n💡 RECOMMENDATION:');
  console.log('─'.repeat(80));
  console.log('The current 2025 data shows a highly linear pattern, suggesting it may be');
  console.log('projected/estimated rather than actual booking data.');
  console.log('');
  console.log('The ML model uses historical patterns (2023-2024) to provide a more realistic');
  console.log('forecast that accounts for:');
  console.log('  • Seasonal variations (higher travel in certain months)');
  console.log('  • Trend changes over time');
  console.log('  • Historical volatility');
  console.log('');
  console.log('Consider using the ML forecast for better accuracy, or replace with actual');
  console.log('booking data if available.');

  console.log('\n' + '='.repeat(80));
}

forecastPlaneTravel().catch(console.error);
