// Test the forecasting calculation manually

const data = {
  // From check-emissions.js
  2023: { months: 12, total: 426.3 },
  2024: { months: 12, total: 642.1 },
  2025: { months: 7, total: 398.7 }
};

console.log('Historical Data:');
console.log('2023:', data[2023].total, 'tCO2e (full year)');
console.log('2024:', data[2024].total, 'tCO2e (full year)');
console.log('2025:', data[2025].total, 'tCO2e (7 months)');
console.log('');

// Method 1: Simple Average (current fallback)
const simpleMonthlyAvg = data[2025].total / data[2025].months;
const simpleForecast = simpleMonthlyAvg * 5;
const simpleTotal = data[2025].total + simpleForecast;

console.log('Method 1: Simple Average');
console.log('  Monthly average:', simpleMonthlyAvg.toFixed(2), 'tCO2e/month');
console.log('  Forecast (5 months):', simpleForecast.toFixed(1), 'tCO2e');
console.log('  Total 2025:', simpleTotal.toFixed(1), 'tCO2e');
console.log('');

// Method 2: Trend from 2024
const monthlyAvg2024 = data[2024].total / 12;
const trendForecast = monthlyAvg2024 * 5;
const trendTotal = data[2025].total + trendForecast;

console.log('Method 2: Based on 2024 trend');
console.log('  2024 monthly average:', monthlyAvg2024.toFixed(2), 'tCO2e/month');
console.log('  Forecast (5 months):', trendForecast.toFixed(1), 'tCO2e');
console.log('  Total 2025:', trendTotal.toFixed(1), 'tCO2e');
console.log('');

// Method 3: Linear trend (2023 -> 2024 -> 2025)
// Calculate what 2025 should be based on trend
const growth2023to2024 = (data[2024].total - data[2023].total) / data[2023].total;
const projected2025 = data[2024].total * (1 + growth2023to2024);
const monthlyAvgTrend = projected2025 / 12;
const trendForecast2 = monthlyAvgTrend * 5;
const trendTotal2 = data[2025].total + trendForecast2;

console.log('Method 3: Linear growth trend');
console.log('  2023->2024 growth:', (growth2023to2024 * 100).toFixed(1), '%');
console.log('  Expected monthly (2025):', monthlyAvgTrend.toFixed(2), 'tCO2e/month');
console.log('  Forecast (5 months):', trendForecast2.toFixed(1), 'tCO2e');
console.log('  Total 2025:', trendTotal2.toFixed(1), 'tCO2e');
console.log('');

// BAU Projection to 2030
console.log('BAU Projection to 2030:');
const yearsFrom2023 = 2025 - 2023;
const annualRate2023to2025 = (simpleTotal - data[2023].total) / data[2023].total / yearsFrom2023;
const yearsTo2030 = 2030 - 2025;
const bau2030 = simpleTotal * Math.pow(1 + annualRate2023to2025, yearsTo2030);

console.log('  2023:', data[2023].total, 'tCO2e');
console.log('  2025:', simpleTotal.toFixed(1), 'tCO2e (actual + forecast)');
console.log('  Annual growth rate:', (annualRate2023to2025 * 100).toFixed(2), '%');
console.log('  2030 BAU:', bau2030.toFixed(1), 'tCO2e');
console.log('');

// Target comparison
const target2030 = 308.7; // From earlier (426.3 - 27.56%)
const gap = bau2030 - target2030;
const percentAbove = (gap / target2030) * 100;

console.log('Target Comparison:');
console.log('  Target 2030:', target2030, 'tCO2e');
console.log('  BAU 2030:', bau2030.toFixed(1), 'tCO2e');
console.log('  Gap:', gap.toFixed(1), 'tCO2e');
console.log('  % above target:', percentAbove.toFixed(0), '%');
