/**
 * Get 2025 Emissions Forecast using ML Model
 * Loads environment variables and uses actual calculator + ML model
 */

import { config } from 'dotenv';
config();

// Now import after env is loaded
import { getMonthlyEmissions } from './src/lib/sustainability/baseline-calculator';
import { EnterpriseForecast } from './src/lib/forecasting/enterprise-forecaster';

const ORG_ID = '22647141-2ee4-4d8d-8b47-16b0cbd830b2'; // PLMJ

async function main() {
  console.log('🚀 2025 Emissions Forecast - Using EnterpriseForecast ML Model\n');

  try {
    // Get all historical data using the actual calculator
    const historicalStartDate = '2020-01-01';
    const endDate = '2025-12-31';

    console.log('📊 Fetching emissions data with pagination...');
    const monthlyData = await getMonthlyEmissions(ORG_ID, historicalStartDate, endDate);

    console.log(`✅ Fetched ${monthlyData.length} months\n`);

    if (monthlyData.length === 0) {
      console.log('⚠️ No data found');
      return;
    }

    console.log(`📊 Data Range: ${monthlyData[0].month} to ${monthlyData[monthlyData.length - 1].month}\n`);

    // Show recent months
    console.log('📅 Recent Months:');
    monthlyData.slice(-7).forEach(m => {
      console.log(`   ${m.month}: ${m.emissions.toFixed(1)} tCO2e`);
    });

    // Convert to forecast format (kg)
    const historicalMonthly = monthlyData.map(m => ({
      monthKey: m.month,
      total: m.emissions * 1000,
      scope1: m.scope_1 * 1000,
      scope2: m.scope_2 * 1000,
      scope3: m.scope_3 * 1000
    }));

    // Find last actual month
    const lastMonth = historicalMonthly[historicalMonthly.length - 1];
    console.log(`\n📊 Last Actual: ${lastMonth.monthKey} (${(lastMonth.total / 1000).toFixed(1)} tCO2e)\n`);

    // Calculate forecast months needed
    const [lastYear, lastMonthNum] = lastMonth.monthKey.split('-').map(Number);
    let monthsToForecast = 0;
    let year = lastYear;
    let month = lastMonthNum + 1;

    while (year < 2025 || (year === 2025 && month <= 12)) {
      monthsToForecast++;
      month++;
      if (month > 12) { month = 1; year++; }
    }

    console.log(`🔬 Forecasting ${monthsToForecast} months using EnterpriseForecast...\n`);

    // Run ML model
    const totalData = historicalMonthly.map(m => ({ month: m.monthKey, emissions: m.total }));
    const totalForecast = EnterpriseForecast.forecast(totalData, monthsToForecast, false);

    const scope1Data = historicalMonthly.map(m => ({ month: m.monthKey, emissions: m.scope1 }));
    const scope2Data = historicalMonthly.map(m => ({ month: m.monthKey, emissions: m.scope2 }));
    const scope3Data = historicalMonthly.map(m => ({ month: m.monthKey, emissions: m.scope3 }));

    const scope1Forecast = EnterpriseForecast.forecast(scope1Data, monthsToForecast, false);
    const scope2Forecast = EnterpriseForecast.forecast(scope2Data, monthsToForecast, false);
    const scope3Forecast = EnterpriseForecast.forecast(scope3Data, monthsToForecast, false);

    console.log(`✅ Model: ${totalForecast.method}`);
    console.log(`   R² Quality: ${totalForecast.metadata.r2.toFixed(3)}`);
    console.log(`   Trend: ${totalForecast.metadata.trendSlope.toFixed(2)} kg/month\n`);

    // Build forecast array
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const forecastMonths = [];
    year = lastYear;
    month = lastMonthNum + 1;

    for (let i = 0; i < monthsToForecast; i++) {
      if (month > 12) { month = 1; year++; }

      forecastMonths.push({
        monthKey: `${year}-${String(month).padStart(2, '0')}`,
        month: `${monthNames[month - 1]} ${year.toString().slice(-2)}`,
        total: totalForecast.forecasted[i] / 1000,
        scope1: scope1Forecast.forecasted[i] / 1000,
        scope2: scope2Forecast.forecasted[i] / 1000,
        scope3: scope3Forecast.forecasted[i] / 1000
      });

      month++;
    }

    // Show forecast
    console.log('📊 Forecast Results:');
    console.log('─'.repeat(80));

    forecastMonths.forEach(f => {
      console.log(`   ${f.month}: ${f.total.toFixed(1)} tCO2e (S1: ${f.scope1.toFixed(1)}, S2: ${f.scope2.toFixed(1)}, S3: ${f.scope3.toFixed(1)})`);
    });

    const totalForecastSum = forecastMonths.reduce((sum, f) => sum + f.total, 0);
    console.log('─'.repeat(80));
    console.log(`   TOTAL: ${totalForecastSum.toFixed(1)} tCO2e\n`);

    // 2025 breakdown
    const actual2025 = monthlyData
      .filter(m => m.month.startsWith('2025-'))
      .reduce((sum, m) => sum + m.emissions, 0);

    const forecast2025 = forecastMonths
      .filter(f => f.monthKey.startsWith('2025-'))
      .reduce((sum, f) => sum + f.total, 0);

    console.log('📊 2025 Full Year:');
    console.log(`   Actual (Jan-Jul): ${actual2025.toFixed(1)} tCO2e`);
    console.log(`   Forecast (Aug-Dec): ${forecast2025.toFixed(1)} tCO2e`);
    console.log(`   Total 2025: ${(actual2025 + forecast2025).toFixed(1)} tCO2e\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main();
