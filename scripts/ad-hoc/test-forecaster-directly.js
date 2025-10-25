// Test the enterprise forecaster with real seasonal data
const { EnterpriseForecast } = require('./src/lib/forecasting/enterprise-forecaster.ts');

// Real monthly data from your system (Jan 2022 - Jul 2025)
const monthlyEmissions = [
  { month: '2022-01', emissions: 93.8 },
  { month: '2022-02', emissions: 87.6 },
  { month: '2022-03', emissions: 93.9 },
  { month: '2022-04', emissions: 84.6 },
  { month: '2022-05', emissions: 110.2 },
  { month: '2022-06', emissions: 101.7 },
  { month: '2022-07', emissions: 139.0 },
  { month: '2022-08', emissions: 121.9 },
  { month: '2022-09', emissions: 118.8 },
  { month: '2022-10', emissions: 104.6 },
  { month: '2022-11', emissions: 82.2 },
  { month: '2022-12', emissions: 70.7 },
  { month: '2023-01', emissions: 90.2 },
  { month: '2023-02', emissions: 93.7 },
  { month: '2023-03', emissions: 69.8 },
  { month: '2023-04', emissions: 73.3 },
  { month: '2023-05', emissions: 91.0 },
  { month: '2023-06', emissions: 105.6 },
  { month: '2023-07', emissions: 116.0 },
  { month: '2023-08', emissions: 113.3 },
  { month: '2023-09', emissions: 98.5 },
  { month: '2023-10', emissions: 94.2 },
  { month: '2023-11', emissions: 68.7 },
  { month: '2023-12', emissions: 73.8 },
  { month: '2024-01', emissions: 81.2 },
  { month: '2024-02', emissions: 63.7 },
  { month: '2024-03', emissions: 70.8 },
  { month: '2024-04', emissions: 87.0 },
  { month: '2024-05', emissions: 86.4 },
  { month: '2024-06', emissions: 105.4 },
  { month: '2024-07', emissions: 104.0 },
  { month: '2024-08', emissions: 106.5 },
  { month: '2024-09', emissions: 100.9 },
  { month: '2024-10', emissions: 95.3 },
  { month: '2024-11', emissions: 55.9 },
  { month: '2024-12', emissions: 86.1 },
  { month: '2025-01', emissions: 89.3 },
  { month: '2025-02', emissions: 70.1 },
  { month: '2025-03', emissions: 173.5 },
  { month: '2025-04', emissions: 95.0 },
  { month: '2025-05', emissions: 115.9 },
  { month: '2025-06', emissions: 114.4 },
  { month: '2025-07', emissions: 117.2 }
];

console.log('🧪 Testing Enterprise Forecaster with REAL seasonal data\n');
console.log(`📊 Input: ${monthlyEmissions.length} months of data`);
console.log(`📅 Last month: ${monthlyEmissions[monthlyEmissions.length - 1].month}\n`);

// Forecast 5 months (Aug-Dec 2025)
const forecast = EnterpriseForecast.forecast(monthlyEmissions, 5, true);

console.log('\n✅ Forecast Results:');
forecast.forecasted.forEach((value, i) => {
  const monthNames = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  console.log(`  2025-${monthNames[i]}: ${value.toFixed(1)} MWh`);
});

console.log(`\n📊 Forecast vs Seasonal Averages:`);
console.log(`  Aug forecast: ${forecast.forecasted[0].toFixed(1)} vs avg 113.9 MWh`);
console.log(`  Sep forecast: ${forecast.forecasted[1].toFixed(1)} vs avg 106.1 MWh`);
console.log(`  Oct forecast: ${forecast.forecasted[2].toFixed(1)} vs avg 98.0 MWh`);
console.log(`  Nov forecast: ${forecast.forecasted[3].toFixed(1)} vs avg 68.9 MWh`);
console.log(`  Dec forecast: ${forecast.forecasted[4].toFixed(1)} vs avg 76.9 MWh`);

console.log(`\n🎯 Quality Metrics:`);
console.log(`  Method: ${forecast.method}`);
console.log(`  R²: ${forecast.metadata.r2.toFixed(3)}`);
console.log(`  Seasonal Strength: ${(forecast.metadata.seasonalStrength * 100).toFixed(1)}%`);
