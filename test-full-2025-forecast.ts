import { createClient } from '@supabase/supabase-js';
import { getPeriodEmissions } from './src/lib/sustainability/baseline-calculator';
import { EnterpriseForecast } from './src/lib/forecasting/enterprise-forecaster';
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

async function testFullForecast() {
  const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';
  const currentYear = 2025;

  console.log('🔬 Testing Full 2025 Forecast Calculation');
  console.log('='.repeat(70));

  // Step 1: Get YTD emissions
  const today = new Date().toISOString().split('T')[0];
  const ytdEmissions = await getPeriodEmissions(
    organizationId,
    `${currentYear}-01-01`,
    today
  );

  console.log(`\n📅 YTD Actual (${currentYear}-01-01 to ${today}):`);
  console.log(`   Total: ${ytdEmissions.total.toFixed(2)} tCO2e`);

  // Step 2: Get historical data for forecasting (same as targets API)
  let allHistoricalMetrics: any[] = [];
  let rangeStart = 0;
  const batchSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data: batch } = await supabase
      .from('metrics_data')
      .select('co2e_emissions, period_start')
      .eq('organization_id', organizationId)
      .gte('period_start', `${currentYear - 3}-01-01`)
      .lt('period_start', `${currentYear + 1}-01-01`)
      .order('period_start', { ascending: true })
      .range(rangeStart, rangeStart + batchSize - 1);

    if (!batch || batch.length === 0) {
      hasMore = false;
      break;
    }

    allHistoricalMetrics = allHistoricalMetrics.concat(batch);

    if (batch.length < batchSize) {
      hasMore = false;
    } else {
      rangeStart += batchSize;
    }
  }

  console.log(`\n📊 Historical Data: ${allHistoricalMetrics.length} records fetched`);

  // Step 3: Group by month
  const monthlyData: { [key: string]: number } = {};

  allHistoricalMetrics.forEach(m => {
    const month = m.period_start?.substring(0, 7);
    if (month) {
      monthlyData[month] = (monthlyData[month] || 0) + (m.co2e_emissions || 0);
    }
  });

  // Step 4: Convert to tCO2e
  const monthlyEmissions = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, emissions]) => ({
      month,
      emissions: emissions / 1000 // Convert kg to tCO2e
    }));

  console.log(`\n📈 Monthly emissions (last 12 months):`);
  monthlyEmissions.slice(-12).forEach(m => {
    console.log(`   ${m.month}: ${m.emissions.toFixed(2)} tCO2e`);
  });

  // Step 5: Count current year months
  const currentYearMonths = monthlyEmissions.filter(m => m.month.startsWith(`${currentYear}`));
  const monthsCovered = currentYearMonths.length;
  const remainingMonths = 12 - monthsCovered;

  console.log(`\n🗓️  Coverage: ${monthsCovered} months actual, ${remainingMonths} months to forecast`);

  // Step 6: Run enterprise forecast
  console.log(`\n🔮 Running Enterprise Forecast...`);
  console.log('='.repeat(70));

  const forecast = EnterpriseForecast.forecast(monthlyEmissions, remainingMonths, true);

  console.log('='.repeat(70));

  const forecastedRemaining = forecast.forecasted.reduce((a, b) => a + b, 0);
  const totalProjected = ytdEmissions.total + forecastedRemaining;

  console.log(`\n🎯 Final 2025 Projection:`);
  console.log(`   Actual YTD: ${ytdEmissions.total.toFixed(2)} tCO2e`);
  console.log(`   Forecasted (${remainingMonths} months): ${forecastedRemaining.toFixed(2)} tCO2e`);
  console.log(`   Total 2025: ${totalProjected.toFixed(2)} tCO2e`);
  console.log(`\n   Method: ${forecast.method}`);
  console.log(`   Model R²: ${forecast.metadata.r2.toFixed(3)}`);
  console.log(`   Trend: ${forecast.metadata.trendSlope.toFixed(3)} tCO2e/month`);

  console.log('\n' + '='.repeat(70));
}

testFullForecast().catch(console.error);
