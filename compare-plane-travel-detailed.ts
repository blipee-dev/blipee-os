import { config } from 'dotenv';
config({ path: '.env.local' });

import { supabaseAdmin } from './src/lib/supabase/admin';
import { EnterpriseForecast } from './src/lib/forecasting/enterprise-forecaster';

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function compareMonthByMonth() {
  console.log('✈️  DETAILED MONTH-BY-MONTH COMPARISON\n');
  console.log('Current Linear Data vs ML Forecast for 2025 Plane Travel\n');
  console.log('='.repeat(100));

  // Fetch 2025 data
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

  // Fetch historical data (2023-2024)
  const { data: historicalData } = await supabaseAdmin
    .from('metrics_data')
    .select(`
      period_start,
      value,
      co2e_emissions,
      metrics_catalog!inner(code, name)
    `)
    .eq('organization_id', organizationId)
    .eq('metrics_catalog.code', 'scope3_business_travel_air')
    .gte('period_start', '2023-01-01')
    .lt('period_start', '2025-01-01')
    .order('period_start', { ascending: true });

  if (!data2025 || !historicalData) {
    console.error('❌ Error fetching data');
    return;
  }

  // Prepare all monthly data for ML model
  const allMonthlyData: { month: string; emissions: number }[] = [];

  historicalData.forEach(d => {
    const month = d.period_start?.substring(0, 7) || '';
    const emissions = (d.co2e_emissions || 0) / 1000;
    allMonthlyData.push({ month, emissions });
  });

  data2025.forEach(d => {
    const month = d.period_start?.substring(0, 7) || '';
    const emissions = (d.co2e_emissions || 0) / 1000;
    allMonthlyData.push({ month, emissions });
  });

  // Run ML forecast for remaining months
  const monthsToForecast = 12 - data2025.length;
  const forecastResult = EnterpriseForecast.forecast(allMonthlyData, monthsToForecast, false);

  // Display detailed comparison
  console.log('\n📊 HISTORICAL CONTEXT (2023-2024)');
  console.log('─'.repeat(100));
  console.log('Month       Distance (km)    Emissions (tCO2e)    Month-over-Month Change    Pattern');
  console.log('─'.repeat(100));

  let prevEmissions = 0;
  historicalData.forEach((d, index) => {
    const month = d.period_start?.substring(0, 7) || '';
    const distance = d.value || 0;
    const emissions = (d.co2e_emissions || 0) / 1000;
    const change = index > 0 ? emissions - prevEmissions : 0;
    const changePercent = index > 0 && prevEmissions > 0 ? (change / prevEmissions) * 100 : 0;

    let pattern = '';
    if (index > 0) {
      if (Math.abs(changePercent) < 10) {
        pattern = '→ Stable';
      } else if (changePercent > 50) {
        pattern = '↑↑ Spike';
      } else if (changePercent > 10) {
        pattern = '↑ Increase';
      } else if (changePercent < -50) {
        pattern = '↓↓ Drop';
      } else if (changePercent < -10) {
        pattern = '↓ Decrease';
      }
    }

    console.log(
      `${month}   ${distance.toFixed(0).padStart(14)}   ${emissions.toFixed(4).padStart(16)}   ` +
      `${index > 0 ? (change > 0 ? '+' : '') + change.toFixed(2) + ' tCO2e (' + (changePercent > 0 ? '+' : '') + changePercent.toFixed(1) + '%)' : 'Baseline'.padStart(30)}   ${pattern}`
    );

    prevEmissions = emissions;
  });

  // Calculate historical statistics
  const historicalEmissions = historicalData.map(d => (d.co2e_emissions || 0) / 1000);
  const avgHistorical = historicalEmissions.reduce((a, b) => a + b, 0) / historicalEmissions.length;
  const minHistorical = Math.min(...historicalEmissions);
  const maxHistorical = Math.max(...historicalEmissions);
  const stdDevHistorical = Math.sqrt(
    historicalEmissions.reduce((sum, v) => sum + Math.pow(v - avgHistorical, 2), 0) / historicalEmissions.length
  );

  console.log('\n📈 Historical Statistics (2023-2024):');
  console.log(`   Average: ${avgHistorical.toFixed(2)} tCO2e/month`);
  console.log(`   Range: ${minHistorical.toFixed(2)} - ${maxHistorical.toFixed(2)} tCO2e`);
  console.log(`   Std Deviation: ${stdDevHistorical.toFixed(2)} tCO2e`);
  console.log(`   Coefficient of Variation: ${((stdDevHistorical / avgHistorical) * 100).toFixed(1)}%`);

  // Display 2025 data with comparison
  console.log('\n\n📊 2025 DATA COMPARISON');
  console.log('='.repeat(100));
  console.log('Month       Current (Linear)    ML Forecast        Difference      95% Confidence    Status');
  console.log('='.repeat(100));

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let totalCurrent = 0;
  let totalForecast = 0;

  months.forEach((monthName, index) => {
    const monthStr = `2025-${(index + 1).toString().padStart(2, '0')}`;
    const record = data2025?.find(d => d.period_start?.startsWith(monthStr));

    if (record) {
      // Current data (actual linear data)
      const currentEmissions = (record.co2e_emissions || 0) / 1000;
      totalCurrent += currentEmissions;

      console.log(
        `${monthName} 2025   ${currentEmissions.toFixed(4).padStart(18)}   ${'(actual data)'.padStart(18)}   ` +
        `${'N/A'.padStart(14)}   ${'N/A'.padStart(16)}   ✅ Actual`
      );
    } else {
      // Forecasted months (Oct-Dec)
      const forecastIndex = index - data2025.length;
      if (forecastIndex >= 0 && forecastIndex < forecastResult.forecasted.length) {
        const mlForecast = forecastResult.forecasted[forecastIndex];
        const lower = forecastResult.confidence.lower[forecastIndex];
        const upper = forecastResult.confidence.upper[forecastIndex];

        // Calculate what the linear pattern would predict
        const lastActual = data2025[data2025.length - 1];
        const lastEmissions = (lastActual.co2e_emissions || 0) / 1000;
        const avgIncrease = 1.553; // Average monthly increase in current linear data (tCO2e)
        const linearPrediction = lastEmissions + avgIncrease * (forecastIndex + 1);

        const difference = mlForecast - linearPrediction;
        const percentDiff = ((difference / linearPrediction) * 100);

        totalCurrent += linearPrediction;
        totalForecast += mlForecast;

        let status = '';
        if (Math.abs(percentDiff) < 5) {
          status = '≈ Similar';
        } else if (percentDiff > 0) {
          status = '↑ Higher';
        } else {
          status = '↓ Lower';
        }

        console.log(
          `${monthName} 2025   ${linearPrediction.toFixed(4).padStart(18)}   ${mlForecast.toFixed(4).padStart(18)}   ` +
          `${(difference > 0 ? '+' : '') + difference.toFixed(2).padStart(13)}   ${`[${lower.toFixed(1)}-${upper.toFixed(1)}]`.padStart(16)}   ${status}`
        );
      }
    }
  });

  console.log('─'.repeat(100));
  console.log(
    `TOTAL       ${totalCurrent.toFixed(2).padStart(18)}   ${(totalCurrent - (data2025.reduce((sum, d) => sum + ((d.co2e_emissions || 0) / 1000), 0)) + totalForecast).toFixed(2).padStart(18)}   ` +
    `${((totalForecast - (totalCurrent - (data2025.reduce((sum, d) => sum + ((d.co2e_emissions || 0) / 1000), 0)))).toFixed(2)).padStart(14)}`
  );

  // Key insights
  console.log('\n\n💡 KEY INSIGHTS');
  console.log('='.repeat(100));

  console.log('\n1️⃣  LINEAR PATTERN DETECTED:');
  console.log('   • Current 2025 data increases by EXACTLY 10,353.71 km every month');
  console.log('   • Zero deviation = mathematically impossible for real bookings');
  console.log('   • Emissions increase by ~1.55 tCO2e every month (perfect linear)');

  console.log('\n2️⃣  HISTORICAL BEHAVIOR (2023-2024):');
  console.log('   • Shows realistic variation with peaks and valleys');
  console.log('   • Coefficient of variation: ' + ((stdDevHistorical / avgHistorical) * 100).toFixed(1) + '%');
  console.log('   • Range: ' + minHistorical.toFixed(2) + ' - ' + maxHistorical.toFixed(2) + ' tCO2e');
  console.log('   • Seasonal patterns: Higher travel in certain months (e.g., May 2023: 19.17 tCO2e)');

  console.log('\n3️⃣  ML FORECAST (Oct-Dec 2025):');
  console.log('   • Method: ' + forecastResult.method);
  console.log('   • Trend: ' + (forecastResult.metadata.trendSlope > 0 ? 'Increasing' : 'Decreasing') + ' (' + forecastResult.metadata.trendSlope.toFixed(2) + ' tCO2e/month)');
  console.log('   • Volatility: ±' + forecastResult.metadata.volatility.toFixed(2) + ' tCO2e (95% confidence)');
  console.log('   • Forecasted range: ' + Math.min(...forecastResult.forecasted).toFixed(2) + ' - ' + Math.max(...forecastResult.forecasted).toFixed(2) + ' tCO2e');

  const actualYTD = data2025.reduce((sum, d) => sum + ((d.co2e_emissions || 0) / 1000), 0);
  const linearProjection = totalCurrent;
  const mlProjection = actualYTD + totalForecast;

  console.log('\n4️⃣  ANNUAL 2025 PROJECTIONS:');
  console.log('   • YTD Actual (Jan-Sep): ' + actualYTD.toFixed(2) + ' tCO2e');
  console.log('   • Linear Continuation: ' + linearProjection.toFixed(2) + ' tCO2e annual');
  console.log('   • ML Forecast: ' + mlProjection.toFixed(2) + ' tCO2e annual');
  console.log('   • Difference: ' + (mlProjection - linearProjection > 0 ? '+' : '') + (mlProjection - linearProjection).toFixed(2) + ' tCO2e (' + (((mlProjection - linearProjection) / linearProjection) * 100).toFixed(1) + '%)');

  console.log('\n5️⃣  COMPARISON TO HISTORICAL AVERAGE:');
  const avgMonthlyHistorical = avgHistorical;
  const avgMonthly2025Current = actualYTD / data2025.length;
  const avgMonthly2025Forecast = mlProjection / 12;

  console.log('   • Historical avg (2023-2024): ' + avgMonthlyHistorical.toFixed(2) + ' tCO2e/month');
  console.log('   • Current 2025 avg (Jan-Sep): ' + avgMonthly2025Current.toFixed(2) + ' tCO2e/month');
  console.log('   • Projected 2025 avg (with ML forecast): ' + avgMonthly2025Forecast.toFixed(2) + ' tCO2e/month');
  console.log('   • Change vs historical: ' + (avgMonthly2025Forecast > avgMonthlyHistorical ? '+' : '') + ((avgMonthly2025Forecast - avgMonthlyHistorical) / avgMonthlyHistorical * 100).toFixed(1) + '%');

  console.log('\n\n🎯 RECOMMENDATION');
  console.log('='.repeat(100));
  console.log('\nThe current 2025 data is CLEARLY projected/estimated (perfect linear pattern).\n');
  console.log('Options:');
  console.log('  1. Replace with ACTUAL booking data if available (best option)');
  console.log('  2. Use ML forecast for Oct-Dec (provides realistic variation)');
  console.log('  3. Flag current data as "estimated" in dashboard\n');
  console.log('The ML forecast suggests 2025 plane travel emissions will be ~' + ((avgMonthly2025Forecast / avgMonthlyHistorical - 1) * 100).toFixed(0) + '% ' + (avgMonthly2025Forecast > avgMonthlyHistorical ? 'higher' : 'lower') + ' than');
  console.log('the 2023-2024 average, accounting for the upward trend while maintaining realistic');
  console.log('month-to-month variation.\n');

  console.log('='.repeat(100));
}

compareMonthByMonth().catch(console.error);
