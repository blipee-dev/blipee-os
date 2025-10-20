/**
 * Test improved forecasting with outlier detection and robust statistics
 */

import { EnterpriseForecast } from './src/lib/forecasting/enterprise-forecaster';

// Real data from the analysis (2022-2025)
const realMonthlyData = [
  // 2022
  { month: '2022-01', emissions: 26.3 },
  { month: '2022-02', emissions: 28.6 },
  { month: '2022-03', emissions: 35.1 },
  { month: '2022-04', emissions: 39.8 },
  { month: '2022-05', emissions: 34.1 },
  { month: '2022-06', emissions: 25.0 },
  { month: '2022-07', emissions: 49.2 },
  { month: '2022-08', emissions: 31.0 },
  { month: '2022-09', emissions: 48.1 },
  { month: '2022-10', emissions: 61.8 }, // Outlier
  { month: '2022-11', emissions: 16.5 },
  { month: '2022-12', emissions: 21.3 },
  // 2023
  { month: '2023-01', emissions: 29.3 },
  { month: '2023-02', emissions: 37.0 },
  { month: '2023-03', emissions: 24.0 },
  { month: '2023-04', emissions: 23.3 },
  { month: '2023-05', emissions: 44.7 },
  { month: '2023-06', emissions: 38.0 },
  { month: '2023-07', emissions: 41.8 },
  { month: '2023-08', emissions: 18.9 },
  { month: '2023-09', emissions: 41.5 },
  { month: '2023-10', emissions: 39.0 },
  { month: '2023-11', emissions: 37.6 },
  { month: '2023-12', emissions: 37.8 },
  // 2024
  { month: '2024-01', emissions: 30.2 },
  { month: '2024-02', emissions: 34.2 },
  { month: '2024-03', emissions: 54.3 },
  { month: '2024-04', emissions: 50.1 },
  { month: '2024-05', emissions: 77.1 }, // OUTLIER!
  { month: '2024-06', emissions: 46.7 },
  { month: '2024-07', emissions: 31.8 },
  { month: '2024-08', emissions: 32.9 },
  { month: '2024-09', emissions: 76.7 }, // OUTLIER!
  { month: '2024-10', emissions: 82.2 }, // OUTLIER!
  { month: '2024-11', emissions: 55.2 },
  { month: '2024-12', emissions: 36.5 },
  // 2025
  { month: '2025-01', emissions: 66.3 },
  { month: '2025-02', emissions: 53.4 },
  { month: '2025-03', emissions: 46.4 },
  { month: '2025-04', emissions: 41.3 },
  { month: '2025-05', emissions: 49.8 },
  { month: '2025-06', emissions: 52.7 },
  { month: '2025-07', emissions: 36.9 },
  { month: '2025-08', emissions: 55.6 },
  { month: '2025-09', emissions: 62.7 },
];

console.log('🧪 Testing Improved Forecasting Model\n');
console.log('=' + '='.repeat(79) + '\n');

// Test forecast for Oct-Dec 2025
const forecastMonths = 3;
const result = EnterpriseForecast.forecast(realMonthlyData, forecastMonths, true);

console.log('\n📊 Forecast Results for Oct-Dec 2025:\n');
console.log(`Method: ${result.method}`);
console.log(`Historical Avg: ${result.actualMonthlyAvg.toFixed(1)} tCO2e/month`);
console.log(`Forecast Avg: ${result.forecastMonthlyAvg.toFixed(1)} tCO2e/month`);
console.log(`Trend Slope: ${result.metadata.trendSlope.toFixed(2)} tCO2e/month`);
console.log(`Seasonality Strength: ${(result.metadata.seasonalStrength * 100).toFixed(1)}%`);
console.log(`Model R²: ${result.metadata.r2.toFixed(3)}`);
console.log(`Volatility (std): ${result.metadata.volatility.toFixed(1)} tCO2e\n`);

console.log('Monthly Forecasts:');
const forecastMonthsNames = ['Oct 2025', 'Nov 2025', 'Dec 2025'];
result.forecasted.forEach((value, i) => {
  console.log(`  ${forecastMonthsNames[i]}: ${value.toFixed(1)} tCO2e`);
  console.log(`    Confidence: ${result.confidence.lower[i].toFixed(1)} - ${result.confidence.upper[i].toFixed(1)} tCO2e`);
});

// Calculate what annualized 2025 would be
const actual2025SoFar = realMonthlyData
  .filter(m => m.month.startsWith('2025'))
  .reduce((sum, m) => sum + m.emissions, 0);

const forecast2025Remaining = result.forecasted.reduce((a, b) => a + b, 0);
const total2025Projection = actual2025SoFar + forecast2025Remaining;

console.log(`\n📈 2025 Full Year Projection:`);
console.log(`  Jan-Sep (actual): ${actual2025SoFar.toFixed(1)} tCO2e`);
console.log(`  Oct-Dec (forecast): ${forecast2025Remaining.toFixed(1)} tCO2e`);
console.log(`  Total 2025: ${total2025Projection.toFixed(1)} tCO2e`);
console.log(`  vs 2024: ${((total2025Projection - 607.8) / 607.8 * 100).toFixed(1)}%`);
console.log(`  vs 2023: ${((total2025Projection - 412.9) / 412.9 * 100).toFixed(1)}%`);

console.log('\n✅ Improvements Applied:');
console.log('  ✓ Outlier detection using MAD (Median Absolute Deviation)');
console.log('  ✓ Longer trend window (24-36 months instead of 12)');
console.log('  ✓ Trend dampening (φ=0.95) to prevent extreme projections');
console.log('  ✓ Robust statistics throughout the model');
console.log('  ✓ Full historical data from 2022 onwards (45 months)');
