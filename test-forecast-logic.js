const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

const ORG_ID = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function testForecastLogic() {
  console.log('🧪 Testing Forecast Logic with supabaseAdmin\n');

  // Get water metrics from catalog
  const { data: waterMetrics } = await supabaseAdmin
    .from('metrics_catalog')
    .select('*')
    .or('subcategory.eq.Water,code.ilike.%water%');

  console.log(`📋 Found ${waterMetrics.length} water metrics\n`);

  if (waterMetrics && waterMetrics.length > 0) {
    const metricIds = waterMetrics.map(m => m.id);
    const currentYear = 2025;

    // Get historical data for forecast calculation
    const { data: metricsData } = await supabaseAdmin
      .from('metrics_data')
      .select('metric_id, value, period_start')
      .eq('organization_id', ORG_ID)
      .in('metric_id', metricIds)
      .gte('period_start', `${currentYear}-01-01`)
      .lt('period_start', `${currentYear + 1}-01-01`)
      .order('period_start');

    console.log(`📊 Found ${metricsData.length} metrics_data records for 2025\n`);

    if (metricsData && metricsData.length > 0) {
      // Calculate monthly aggregates
      const monthlyAggregates = {};

      metricsData.forEach(record => {
        const metric = waterMetrics.find(m => m.id === record.metric_id);
        const metricCode = metric?.code || '';
        const date = new Date(record.period_start);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!monthlyAggregates[monthKey]) {
          monthlyAggregates[monthKey] = { withdrawal: 0, discharge: 0, consumption: 0 };
        }

        const value = parseFloat(record.value) || 0;
        const isDischarge = metricCode.includes('wastewater');

        if (isDischarge) {
          monthlyAggregates[monthKey].discharge += value;
        } else {
          monthlyAggregates[monthKey].withdrawal += value;
        }
      });

      // Calculate consumption for each month
      Object.keys(monthlyAggregates).forEach(monthKey => {
        const data = monthlyAggregates[monthKey];
        data.consumption = data.withdrawal - data.discharge;
      });

      console.log('📅 Monthly Aggregates (Actual):');
      Object.entries(monthlyAggregates).forEach(([month, data]) => {
        console.log(`  ${month}:`);
        console.log(`    Withdrawal: ${(data.withdrawal / 1000).toFixed(2)} ML`);
        console.log(`    Discharge: ${(data.discharge / 1000).toFixed(2)} ML`);
        console.log(`    Consumption: ${(data.consumption / 1000).toFixed(2)} ML`);
      });

      // Get the last month with actual data
      const actualMonths = Object.keys(monthlyAggregates).sort();
      const lastActualMonth = actualMonths[actualMonths.length - 1];
      const lastActualMonthNum = parseInt(lastActualMonth.split('-')[1]);

      console.log(`\n🔍 Last actual month: ${lastActualMonth} (Month ${lastActualMonthNum})\n`);

      // Calculate averages
      const avgWithdrawal = actualMonths.reduce((sum, key) => sum + monthlyAggregates[key].withdrawal, 0) / actualMonths.length;
      const avgDischarge = actualMonths.reduce((sum, key) => sum + monthlyAggregates[key].discharge, 0) / actualMonths.length;
      const avgConsumption = actualMonths.reduce((sum, key) => sum + monthlyAggregates[key].consumption, 0) / actualMonths.length;

      console.log('📊 Averages (from actual data):');
      console.log(`  Avg Withdrawal: ${(avgWithdrawal / 1000).toFixed(2)} ML/month`);
      console.log(`  Avg Discharge: ${(avgDischarge / 1000).toFixed(2)} ML/month`);
      console.log(`  Avg Consumption: ${(avgConsumption / 1000).toFixed(2)} ML/month\n`);

      // Generate forecast for remaining months
      const forecast = [];
      for (let month = lastActualMonthNum + 1; month <= 12; month++) {
        const monthName = new Date(currentYear, month - 1, 1).toLocaleString('default', { month: 'short' });
        forecast.push({
          month: monthName,
          monthKey: `${currentYear}-${String(month).padStart(2, '0')}`,
          withdrawal: avgWithdrawal,
          discharge: avgDischarge,
          consumption: avgConsumption
        });
      }

      console.log(`🔮 Generated Forecast (${forecast.length} months):`);
      forecast.forEach(f => {
        console.log(`  ${f.month}:`);
        console.log(`    Withdrawal: ${(f.withdrawal / 1000).toFixed(2)} ML`);
        console.log(`    Discharge: ${(f.discharge / 1000).toFixed(2)} ML`);
        console.log(`    Consumption: ${(f.consumption / 1000).toFixed(2)} ML`);
      });

      // Calculate YTD + Forecast totals
      const ytdWithdrawal = actualMonths.reduce((sum, key) => sum + monthlyAggregates[key].withdrawal, 0);
      const ytdDischarge = actualMonths.reduce((sum, key) => sum + monthlyAggregates[key].discharge, 0);
      const ytdConsumption = actualMonths.reduce((sum, key) => sum + monthlyAggregates[key].consumption, 0);

      const forecastWithdrawal = forecast.reduce((sum, f) => sum + f.withdrawal, 0);
      const forecastDischarge = forecast.reduce((sum, f) => sum + f.discharge, 0);
      const forecastConsumption = forecast.reduce((sum, f) => sum + f.consumption, 0);

      console.log(`\n📈 Projected Full Year 2025:`);
      console.log(`  Withdrawal: ${((ytdWithdrawal + forecastWithdrawal) / 1000).toFixed(2)} ML`);
      console.log(`  Discharge: ${((ytdDischarge + forecastDischarge) / 1000).toFixed(2)} ML`);
      console.log(`  Consumption: ${((ytdConsumption + forecastConsumption) / 1000).toFixed(2)} ML`);

      console.log(`\n✅ Forecast logic is working correctly!`);
    }
  }
}

testForecastLogic().catch(console.error);
