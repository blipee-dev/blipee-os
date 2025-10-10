import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { EnterpriseForecast } from './src/lib/forecasting/enterprise-forecaster';

const SUPABASE_URL = 'https://quovvwrwyfkzhgqdeham.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';
const ORG_ID = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function testWaterForecastAPI() {
  console.log('🔮 Testing Water Forecast API Logic\n');

  const startDate = '2025-01-01';
  const endDate = '2025-12-31';

  // Get historical water data for the past 36 months to build forecast model
  const historicalStartDate = new Date(startDate);
  historicalStartDate.setMonth(historicalStartDate.getMonth() - 36);

  console.log(`📅 Historical range: ${historicalStartDate.toISOString().split('T')[0]} to ${endDate}`);

  // Get water-related metrics
  const { data: waterMetrics } = await supabase
    .from('metrics_catalog')
    .select('*')
    .or('name.ilike.%water%,name.ilike.%wastewater%')
    .eq('category', 'Purchased Goods & Services');

  console.log(`\n📊 Found ${waterMetrics?.length || 0} water metrics`);

  if (!waterMetrics || waterMetrics.length === 0) {
    console.log('❌ No water metrics found');
    return;
  }

  const metricIds = waterMetrics.map(m => m.id);

  // Fetch ALL data with pagination
  let allData: any[] = [];
  let rangeStart = 0;
  const batchSize = 1000;
  let hasMore = true;

  console.log('\n📥 Fetching historical data...');

  while (hasMore) {
    const { data: batchData, error } = await supabase
      .from('metrics_data')
      .select('*')
      .eq('organization_id', ORG_ID)
      .in('metric_id', metricIds)
      .gte('period_start', historicalStartDate.toISOString().split('T')[0])
      .order('period_start', { ascending: true })
      .range(rangeStart, rangeStart + batchSize - 1);

    if (error) {
      console.error('Error fetching data:', error);
      break;
    }

    if (!batchData || batchData.length === 0) {
      hasMore = false;
      break;
    }

    allData = allData.concat(batchData);

    if (batchData.length < batchSize) {
      hasMore = false;
    } else {
      rangeStart += batchSize;
    }
  }

  console.log(`✅ Fetched ${allData.length} records\n`);

  if (allData.length === 0) {
    console.log('❌ No historical data found');
    return;
  }

  // Group by month
  const monthlyData: { [key: string]: { withdrawal: number; discharge: number; consumption: number; count: number } } = {};

  allData.forEach((record: any) => {
    const date = new Date(record.period_start);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { withdrawal: 0, discharge: 0, consumption: 0, count: 0 };
    }

    const value = parseFloat(record.value) || 0;

    // Get metric details
    const metric = waterMetrics.find(m => m.id === record.metric_id);
    const metricName = metric?.name?.toLowerCase() || '';

    if (metricName.includes('wastewater') || metricName.includes('discharge') || metricName.includes('effluent')) {
      // Wastewater = discharge
      monthlyData[monthKey].discharge += value;
    } else if (metricName.includes('consumption')) {
      monthlyData[monthKey].consumption += value;
    } else if (metricName.includes('water')) {
      // Water = withdrawal
      monthlyData[monthKey].withdrawal += value;
    }

    monthlyData[monthKey].count++;
  });

  // Calculate consumption if not directly available
  Object.keys(monthlyData).forEach(monthKey => {
    if (monthlyData[monthKey].consumption === 0) {
      monthlyData[monthKey].consumption = monthlyData[monthKey].withdrawal - monthlyData[monthKey].discharge;
    }
  });

  // Convert to array
  const months = Object.keys(monthlyData).sort();
  const historicalMonthly = months.map(monthKey => ({
    monthKey,
    withdrawal: monthlyData[monthKey].withdrawal,
    discharge: monthlyData[monthKey].discharge,
    consumption: monthlyData[monthKey].consumption
  }));

  console.log(`📈 Historical monthly data: ${historicalMonthly.length} months`);
  console.log('Sample months:', historicalMonthly.slice(-6).map(m => m.monthKey).join(', '));

  // Find last month with actual data
  const lastDataMonth = historicalMonthly[historicalMonthly.length - 1];
  console.log(`\n📍 Last data month: ${lastDataMonth.monthKey}`);
  console.log(`   Withdrawal: ${(lastDataMonth.withdrawal / 1000).toFixed(2)} ML`);
  console.log(`   Discharge: ${(lastDataMonth.discharge / 1000).toFixed(2)} ML`);
  console.log(`   Consumption: ${(lastDataMonth.consumption / 1000).toFixed(2)} ML`);

  // Calculate how many months to forecast
  const [lastYear, lastMonth] = lastDataMonth.monthKey.split('-').map(Number);
  const endYear = new Date(endDate).getFullYear();
  const endMonth = new Date(endDate).getMonth() + 1;

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

  console.log(`\n🔮 Forecasting ${monthsToForecast} months...`);

  if (monthsToForecast <= 0) {
    console.log('⚠️ No months to forecast');
    return;
  }

  // Use enterprise forecaster for withdrawal
  const withdrawalData = historicalMonthly.map(m => ({
    month: m.monthKey,
    emissions: m.withdrawal
  }));

  const withdrawalForecast = EnterpriseForecast.forecast(withdrawalData, monthsToForecast, false);

  // Use enterprise forecaster for discharge
  const dischargeData = historicalMonthly.map(m => ({
    month: m.monthKey,
    emissions: m.discharge
  }));

  const dischargeForecast = EnterpriseForecast.forecast(dischargeData, monthsToForecast, false);

  // Use enterprise forecaster for consumption
  const consumptionData = historicalMonthly.map(m => ({
    month: m.monthKey,
    emissions: m.consumption
  }));

  const consumptionForecast = EnterpriseForecast.forecast(consumptionData, monthsToForecast, false);

  console.log(`\n✅ Forecast complete!`);
  console.log(`   Method: ${withdrawalForecast.method}`);
  console.log(`   R²: ${withdrawalForecast.metadata.r2.toFixed(3)}`);
  console.log(`   Volatility: ${withdrawalForecast.metadata.volatility.toFixed(3)}`);

  console.log('\n📊 Forecast results:');
  console.log('Month       | Withdrawal (ML) | Discharge (ML) | Consumption (ML)');
  console.log('------------|-----------------|----------------|------------------');

  currentYear = lastYear;
  currentMonth = lastMonth + 1;

  for (let i = 0; i < Math.min(monthsToForecast, 6); i++) {
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear++;
    }

    const monthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    const withdrawal = withdrawalForecast.forecasted[i] || 0;
    const discharge = dischargeForecast.forecasted[i] || 0;
    const consumption = consumptionForecast.forecasted[i] || 0;

    console.log(
      `${monthKey} | ${(withdrawal / 1000).toFixed(2).padStart(15)} | ` +
      `${(discharge / 1000).toFixed(2).padStart(14)} | ` +
      `${(consumption / 1000).toFixed(2).padStart(16)}`
    );

    currentMonth++;
  }

  if (monthsToForecast > 6) {
    console.log(`... and ${monthsToForecast - 6} more months`);
  }
}

testWaterForecastAPI().catch(console.error);
