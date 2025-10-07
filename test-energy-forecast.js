// Test energy forecasting with real data
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testEnergyForecast() {
  // Get organization
  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id')
    .limit(1)
    .single();

  const orgId = member.organization_id;

  // Get energy metrics
  const { data: energyMetrics } = await supabase
    .from('metrics_catalog')
    .select('*')
    .in('category', ['Purchased Energy', 'Electricity']);

  const metricIds = energyMetrics.map(m => m.id);

  // Get 3 years of energy data
  const { data: historicalData } = await supabase
    .from('metrics_data')
    .select('*')
    .eq('organization_id', orgId)
    .in('metric_id', metricIds)
    .gte('period_start', '2022-01-01')
    .order('period_start', { ascending: true });

  console.log(`📊 Total records: ${historicalData.length}`);

  // Group by month
  const monthlyData = {};
  historicalData.forEach(record => {
    const date = new Date(record.period_start);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = 0;
    }
    monthlyData[monthKey] += parseFloat(record.value) || 0;
  });

  const months = Object.keys(monthlyData).sort();
  console.log(`\n📅 Monthly energy consumption (kWh):`);
  console.log(`Months available: ${months.length}`);
  console.log(`First month: ${months[0]}`);
  console.log(`Last month: ${months[months.length - 1]}`);

  // Show monthly pattern
  console.log(`\n📈 Monthly consumption pattern:`);
  months.forEach(month => {
    const [year, monthNum] = month.split('-');
    const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleString('default', { month: 'short' });
    console.log(`  ${month} (${monthName}): ${(monthlyData[month] / 1000).toFixed(1)} MWh`);
  });

  // Calculate average per month of year (seasonality)
  console.log(`\n🔄 Seasonal pattern (average per month):`);
  const seasonalAvg = {};
  for (let m = 1; m <= 12; m++) {
    const monthNum = String(m).padStart(2, '0');
    const monthData = months.filter(month => month.endsWith(`-${monthNum}`));
    if (monthData.length > 0) {
      const avg = monthData.reduce((sum, month) => sum + monthlyData[month], 0) / monthData.length;
      const monthName = new Date(2000, m - 1).toLocaleString('default', { month: 'short' });
      seasonalAvg[monthNum] = avg;
      console.log(`  ${monthName}: ${(avg / 1000).toFixed(1)} MWh (${monthData.length} years)`);
    }
  }

  // Check variance
  const allValues = Object.values(monthlyData);
  const mean = allValues.reduce((a, b) => a + b, 0) / allValues.length;
  const variance = allValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / allValues.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = stdDev / mean;

  console.log(`\n📊 Statistical Analysis:`);
  console.log(`  Mean: ${(mean / 1000).toFixed(1)} MWh`);
  console.log(`  Std Dev: ${(stdDev / 1000).toFixed(1)} MWh`);
  console.log(`  Coefficient of Variation: ${(coefficientOfVariation * 100).toFixed(1)}%`);

  if (coefficientOfVariation > 0.15) {
    console.log(`  ⚠️ HIGH SEASONALITY DETECTED - forecast MUST account for this!`);
  }
}

testEnergyForecast().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
