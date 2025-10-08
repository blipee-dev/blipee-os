const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Import the enterprise forecaster
const { EnterpriseForecast } = require('./src/lib/forecasting/enterprise-forecaster');

async function checkAPIForecast() {
  console.log('🔍 Checking API Forecast vs Manual Calculation\n');
  console.log('='.repeat(70));

  const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';
  const currentYear = 2025;

  // Get current year data
  const { data: currentYearMetrics } = await supabase
    .from('metrics_data')
    .select('co2e_emissions, period_start, period_end')
    .eq('organization_id', organizationId)
    .gte('period_start', `${currentYear}-01-01`)
    .lt('period_start', `${currentYear + 1}-01-01`)
    .order('period_start', { ascending: true });

  console.log('\n📊 Current Year (2025) Data:\n');

  const actualEmissions = currentYearMetrics.reduce((sum, m) => sum + (m.co2e_emissions || 0), 0) / 1000;
  const uniqueMonths = new Set(currentYearMetrics.map(m => m.period_start?.substring(0, 7)));
  const monthsCovered = uniqueMonths.size;

  console.log(`Records: ${currentYearMetrics.length}`);
  console.log(`Unique months: ${monthsCovered}/12`);
  console.log(`Actual YTD: ${actualEmissions.toFixed(2)} tCO2e`);
  console.log(`Months: ${Array.from(uniqueMonths).sort().join(', ')}`);

  // Get 3 years of historical data for enterprise forecasting
  const { data: historicalMetrics } = await supabase
    .from('metrics_data')
    .select('co2e_emissions, period_start')
    .eq('organization_id', organizationId)
    .gte('period_start', `${currentYear - 3}-01-01`)
    .lt('period_start', `${currentYear + 1}-01-01`)
    .order('period_start', { ascending: true });

  console.log(`\nHistorical data: ${historicalMetrics.length} records`);

  // Group by month to get monthly totals
  const monthlyData = {};
  historicalMetrics.forEach(m => {
    const month = m.period_start?.substring(0, 7);
    if (month) {
      monthlyData[month] = (monthlyData[month] || 0) + (m.co2e_emissions || 0);
    }
  });

  // Prepare data for forecaster
  const monthlyEmissions = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, emissions]) => ({
      month,
      emissions: emissions / 1000 // Convert kg to tCO2e
    }));

  console.log(`\nMonthly data points: ${monthlyEmissions.length}`);
  console.log('Last 6 months of historical data:');
  monthlyEmissions.slice(-6).forEach(m => {
    console.log(`  ${m.month}: ${m.emissions.toFixed(2)} tCO2e`);
  });

  // Use enterprise-grade forecasting
  console.log('\n' + '='.repeat(70));
  console.log('\n🤖 Running EnterpriseForecast Model:\n');

  const remainingMonths = 12 - monthsCovered;
  const forecast = EnterpriseForecast.forecast(monthlyEmissions, remainingMonths, true);

  console.log(`Method: ${forecast.method.toUpperCase()}`);
  console.log(`Model Quality: R² = ${forecast.metadata.r2?.toFixed(3) || 'N/A'}`);
  console.log(`Trend Slope: ${forecast.metadata.trendSlope?.toFixed(3) || 'N/A'} tCO2e/month`);
  console.log(`Seasonality Detected: ${forecast.metadata.seasonality?.detected ? 'Yes' : 'No'}`);

  const forecastedRemaining = forecast.forecasted.reduce((a, b) => a + b, 0);
  const totalProjected = actualEmissions + forecastedRemaining;

  console.log(`\nForecasted months (${remainingMonths} months):`);
  forecast.forecasted.forEach((value, i) => {
    const month = monthsCovered + i + 1;
    console.log(`  Month ${month}: ${value.toFixed(2)} tCO2e`);
  });

  console.log('\n' + '='.repeat(70));
  console.log('\n📈 Forecast Summary:\n');

  console.log(`Actual YTD (${monthsCovered} months): ${actualEmissions.toFixed(2)} tCO2e`);
  console.log(`Forecasted remaining (${remainingMonths} months): ${forecastedRemaining.toFixed(2)} tCO2e`);
  console.log(`Total projected 2025: ${totalProjected.toFixed(2)} tCO2e`);

  // Compare with simple average
  const simpleAvg = actualEmissions / monthsCovered;
  const simpleProjected = simpleAvg * 12;

  console.log(`\nComparison:`);
  console.log(`  Simple average projection: ${simpleProjected.toFixed(2)} tCO2e`);
  console.log(`  Enterprise ML projection: ${totalProjected.toFixed(2)} tCO2e`);
  console.log(`  Difference: ${(totalProjected - simpleProjected).toFixed(2)} tCO2e`);

  console.log('\n' + '='.repeat(70));
}

checkAPIForecast();
