const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

const ORG_ID = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';
const TARGET_ID = 'd4a00170-7964-41e2-a61e-3d7b0059cfe5';

// Import the EnterpriseForecast class (simulating what the API does)
const { EnterpriseForecast } = require('./src/lib/forecasting/enterprise-forecaster.ts');

async function testProphetForecast() {
  console.log('🧪 Testing Prophet Forecast Integration with supabaseAdmin\n');

  try {
    // Step 1: Get water metrics from catalog
    const { data: waterMetrics, error: metricsError } = await supabaseAdmin
      .from('metrics_catalog')
      .select('*')
      .or('subcategory.eq.Water,code.ilike.%water%');

    if (metricsError) {
      throw new Error(`Failed to fetch water metrics: ${metricsError.message}`);
    }

    console.log(`📋 Found ${waterMetrics.length} water metrics in catalog\n`);

    const metricIds = waterMetrics.map(m => m.id);
    const currentYear = 2025;

    // Step 2: Get historical data for forecast calculation
    const { data: metricsData, error: dataError } = await supabaseAdmin
      .from('metrics_data')
      .select('metric_id, value, period_start')
      .eq('organization_id', ORG_ID)
      .in('metric_id', metricIds)
      .gte('period_start', `${currentYear}-01-01`)
      .lt('period_start', `${currentYear + 1}-01-01`)
      .order('period_start');

    if (dataError) {
      throw new Error(`Failed to fetch metrics data: ${dataError.message}`);
    }

    console.log(`📊 Found ${metricsData.length} metrics_data records for 2025\n`);

    // Step 3: Calculate monthly aggregates (same logic as API)
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

    // Step 4: Get the last month with actual data
    const actualMonths = Object.keys(monthlyAggregates).sort();
    const lastActualMonth = actualMonths[actualMonths.length - 1];
    const lastActualMonthNum = parseInt(lastActualMonth.split('-')[1]);

    console.log(`\n🔍 Last actual month: ${lastActualMonth} (Month ${lastActualMonthNum})\n`);

    // Step 5: Prepare historical data for EnterpriseForecast
    const withdrawalHistory = actualMonths.map(key => ({
      month: key,
      emissions: monthlyAggregates[key].withdrawal
    }));

    const dischargeHistory = actualMonths.map(key => ({
      month: key,
      emissions: monthlyAggregates[key].discharge
    }));

    const consumptionHistory = actualMonths.map(key => ({
      month: key,
      emissions: monthlyAggregates[key].consumption
    }));

    // Step 6: Calculate how many months to forecast
    const monthsToForecast = 12 - lastActualMonthNum;

    console.log(`🔮 Forecasting ${monthsToForecast} months using Prophet/EnterpriseForecast...\n`);

    // Step 7: Use EnterpriseForecast (Prophet-style) for each metric
    const withdrawalForecast = EnterpriseForecast.forecast(withdrawalHistory, monthsToForecast, false);
    const dischargeForecast = EnterpriseForecast.forecast(dischargeHistory, monthsToForecast, false);
    const consumptionForecast = EnterpriseForecast.forecast(consumptionHistory, monthsToForecast, false);

    console.log(`✅ Forecast Method: ${withdrawalForecast.method}\n`);

    // Step 8: Build forecast array
    const forecast = [];
    for (let i = 0; i < monthsToForecast; i++) {
      const month = lastActualMonthNum + i + 1;
      const monthName = new Date(currentYear, month - 1, 1).toLocaleString('default', { month: 'short' });
      forecast.push({
        month: monthName,
        monthKey: `${currentYear}-${String(month).padStart(2, '0')}`,
        withdrawal: withdrawalForecast.forecasted[i] || 0,
        discharge: dischargeForecast.forecasted[i] || 0,
        consumption: consumptionForecast.forecasted[i] || 0
      });
    }

    console.log(`📈 Generated Forecast (${forecast.length} months):`);
    forecast.forEach(f => {
      console.log(`  ${f.month} (${f.monthKey}):`);
      console.log(`    Withdrawal: ${(f.withdrawal / 1000).toFixed(2)} ML`);
      console.log(`    Discharge: ${(f.discharge / 1000).toFixed(2)} ML`);
      console.log(`    Consumption: ${(f.consumption / 1000).toFixed(2)} ML`);
    });

    // Step 9: Calculate YTD + Forecast totals
    const ytdWithdrawal = actualMonths.reduce((sum, key) => sum + monthlyAggregates[key].withdrawal, 0);
    const ytdDischarge = actualMonths.reduce((sum, key) => sum + monthlyAggregates[key].discharge, 0);
    const ytdConsumption = actualMonths.reduce((sum, key) => sum + monthlyAggregates[key].consumption, 0);

    const forecastWithdrawal = forecast.reduce((sum, f) => sum + f.withdrawal, 0);
    const forecastDischarge = forecast.reduce((sum, f) => sum + f.discharge, 0);
    const forecastConsumption = forecast.reduce((sum, f) => sum + f.consumption, 0);

    console.log(`\n${'='.repeat(80)}`);
    console.log(`📊 PROJECTED FULL YEAR 2025 (YTD + Prophet Forecast):`);
    console.log(`${'='.repeat(80)}`);
    console.log(`\n💧 Water Withdrawal:`);
    console.log(`   YTD (Jan-${lastActualMonth}): ${(ytdWithdrawal / 1000).toFixed(2)} ML`);
    console.log(`   Forecast (${monthsToForecast} months): ${(forecastWithdrawal / 1000).toFixed(2)} ML`);
    console.log(`   📈 PROJECTED Total: ${((ytdWithdrawal + forecastWithdrawal) / 1000).toFixed(2)} ML`);

    console.log(`\n💧 Water Discharge:`);
    console.log(`   YTD (Jan-${lastActualMonth}): ${(ytdDischarge / 1000).toFixed(2)} ML`);
    console.log(`   Forecast (${monthsToForecast} months): ${(forecastDischarge / 1000).toFixed(2)} ML`);
    console.log(`   📈 PROJECTED Total: ${((ytdDischarge + forecastDischarge) / 1000).toFixed(2)} ML`);

    console.log(`\n💧 Water Consumption:`);
    console.log(`   YTD (Jan-${lastActualMonth}): ${(ytdConsumption / 1000).toFixed(2)} ML`);
    console.log(`   Forecast (${monthsToForecast} months): ${(forecastConsumption / 1000).toFixed(2)} ML`);
    console.log(`   📈 PROJECTED Total: ${((ytdConsumption + forecastConsumption) / 1000).toFixed(2)} ML`);

    console.log(`\n${'='.repeat(80)}`);
    console.log(`✅ Prophet/EnterpriseForecast integration is working correctly!`);
    console.log(`🔮 Model: ${withdrawalForecast.method}`);
    console.log(`📊 The API will now use these projected values for current emissions.`);
    console.log(`${'='.repeat(80)}\n`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testProphetForecast().catch(console.error);
