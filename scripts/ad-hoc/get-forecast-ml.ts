/**
 * Get 2025 Emissions Forecast using Actual ML Model
 * Uses the same EnterpriseForecast and baseline calculator as the API
 */

import { supabaseAdmin } from './src/lib/supabase/admin';
import { getMonthlyEmissions } from './src/lib/sustainability/baseline-calculator';
import { EnterpriseForecast } from './src/lib/forecasting/enterprise-forecaster';

const ORG_ID = '22647141-2ee4-4d8d-8b47-16b0cbd830b2'; // PLMJ

async function main() {
  console.log('🚀 Starting 2025 Emissions Forecast using ML Model...\n');

  try {
    // Get all historical data using the actual calculator function
    console.log('📊 Fetching historical emissions data...');

    const historicalStartDate = '2020-01-01';
    const endDate = '2025-12-31';

    const monthlyEmissionsData = await getMonthlyEmissions(
      ORG_ID,
      historicalStartDate,
      endDate
    );

    console.log(`✅ Fetched ${monthlyEmissionsData.length} months of data\n`);

    if (!monthlyEmissionsData || monthlyEmissionsData.length === 0) {
      console.log('⚠️ No historical data found');
      return;
    }

    // Show data range
    console.log(`📊 Historical Data Summary:`);
    console.log(`   Date range: ${monthlyEmissionsData[0]?.month} to ${monthlyEmissionsData[monthlyEmissionsData.length - 1]?.month}`);
    console.log(`   Total months: ${monthlyEmissionsData.length}\n`);

    // Show last 5 months
    console.log('📅 Last 5 months of actual data:');
    monthlyEmissionsData.slice(-5).forEach(m => {
      console.log(`   ${m.month}: ${m.emissions.toFixed(1)} tCO2e (S1: ${m.scope_1.toFixed(1)}, S2: ${m.scope_2.toFixed(1)}, S3: ${m.scope_3.toFixed(1)})`);
    });

    // Convert to forecast format (kg CO2e)
    const historicalMonthly = monthlyEmissionsData.map(m => ({
      monthKey: m.month,
      total: m.emissions * 1000, // Convert tCO2e to kg
      scope1: m.scope_1 * 1000,
      scope2: m.scope_2 * 1000,
      scope3: m.scope_3 * 1000
    }));

    // Find last month
    const lastDataMonth = historicalMonthly[historicalMonthly.length - 1];
    const [lastYear, lastMonth] = lastDataMonth.monthKey.split('-').map(Number);

    console.log(`\n📊 Last actual data: ${lastDataMonth.monthKey} (${(lastDataMonth.total / 1000).toFixed(1)} tCO2e)\n`);

    // Calculate months to forecast (Aug-Dec = 5 months)
    const endYear = 2025;
    const endMonth = 12;

    let monthsToForecast = 0;
    let currentYear = lastYear;
    let currentMonth = lastMonth + 1;

    while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
      monthsToForecast++;
      currentMonth++;
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
      }
    }

    console.log(`🔬 Forecasting ${monthsToForecast} months (${lastYear}-${String(lastMonth).padStart(2, '0')} → 2025-12)\n`);

    // Run Enterprise Forecast for total emissions
    console.log('🤖 Running EnterpriseForecast Model...\n');

    const totalEmissionsData = historicalMonthly.map(m => ({
      month: m.monthKey,
      emissions: m.total
    }));

    const totalForecast = EnterpriseForecast.forecast(totalEmissionsData, monthsToForecast, false);

    // Forecast by scope
    const scope1Data = historicalMonthly.map(m => ({ month: m.monthKey, emissions: m.scope1 }));
    const scope2Data = historicalMonthly.map(m => ({ month: m.monthKey, emissions: m.scope2 }));
    const scope3Data = historicalMonthly.map(m => ({ month: m.monthKey, emissions: m.scope3 }));

    const scope1Forecast = EnterpriseForecast.forecast(scope1Data, monthsToForecast, false);
    const scope2Forecast = EnterpriseForecast.forecast(scope2Data, monthsToForecast, false);
    const scope3Forecast = EnterpriseForecast.forecast(scope3Data, monthsToForecast, false);

    console.log('✅ Forecast Results:');
    console.log(`   Model: ${totalForecast.method}`);
    console.log(`   R² (Model Quality): ${totalForecast.metadata.r2.toFixed(3)}`);
    console.log(`   Trend Slope: ${totalForecast.metadata.trendSlope.toFixed(2)}`);
    console.log(`   Volatility: ${totalForecast.metadata.volatility.toFixed(3)}\n`);

    // Build forecast months
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const forecastMonths = [];

    currentYear = lastYear;
    currentMonth = lastMonth + 1;

    for (let i = 0; i < monthsToForecast; i++) {
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
      }

      const monthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
      const yearShort = currentYear.toString().slice(-2);

      forecastMonths.push({
        monthKey,
        month: `${monthNames[currentMonth - 1]} ${yearShort}`,
        total: (totalForecast.forecasted[i] || 0) / 1000,
        scope1: (scope1Forecast.forecasted[i] || 0) / 1000,
        scope2: (scope2Forecast.forecasted[i] || 0) / 1000,
        scope3: (scope3Forecast.forecasted[i] || 0) / 1000
      });

      currentMonth++;
    }

    // Display forecast
    console.log('📊 Forecast Breakdown:');
    console.log('─'.repeat(80));

    forecastMonths.forEach(f => {
      console.log(`   ${f.month}: ${f.total.toFixed(1)} tCO2e (S1: ${f.scope1.toFixed(1)}, S2: ${f.scope2.toFixed(1)}, S3: ${f.scope3.toFixed(1)})`);
    });

    const totalForecastSum = forecastMonths.reduce((sum, f) => sum + f.total, 0);

    console.log('─'.repeat(80));
    console.log(`   TOTAL FORECAST: ${totalForecastSum.toFixed(1)} tCO2e`);
    console.log('─'.repeat(80));

    // Calculate full year 2025
    const actual2025 = monthlyEmissionsData
      .filter(m => m.month.startsWith('2025-'))
      .reduce((sum, m) => sum + m.emissions, 0);

    const forecast2025Only = forecastMonths
      .filter(f => f.monthKey.startsWith('2025-'))
      .reduce((sum, f) => sum + f.total, 0);

    const fullYear2025 = actual2025 + forecast2025Only;

    console.log(`\n📊 2025 Full Year Projection:`);
    console.log(`   Jan-Jul (actual): ${actual2025.toFixed(1)} tCO2e`);
    console.log(`   Aug-Dec (forecast): ${forecast2025Only.toFixed(1)} tCO2e`);
    console.log(`   Full Year 2025: ${fullYear2025.toFixed(1)} tCO2e\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main();
