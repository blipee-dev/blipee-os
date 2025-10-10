import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { EnterpriseForecast } from './src/lib/forecasting/enterprise-forecaster';

const SUPABASE_URL = 'https://quovvwrwyfkzhgqdeham.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';
const ORG_ID = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function testForecastAPI() {
  console.log('🔮 Testing Energy Forecast API Logic\n');

  // Get historical energy data
  const { data: energyMetrics } = await supabase
    .from('metrics_catalog')
    .select('*')
    .in('category', ['Purchased Energy', 'Electricity']);

  const metricIds = energyMetrics?.map(m => m.id) || [];

  // Fetch data from last 36 months
  const historicalStartDate = new Date('2025-01-01');
  historicalStartDate.setMonth(historicalStartDate.getMonth() - 36);

  const { data: historicalData } = await supabase
    .from('metrics_data')
    .select('*')
    .eq('organization_id', ORG_ID)
    .in('metric_id', metricIds)
    .gte('period_start', historicalStartDate.toISOString().split('T')[0])
    .order('period_start', { ascending: true });

  console.log(`📊 Fetched ${historicalData?.length} historical records\n`);

  // Group by month (simulating the API logic)
  const monthlyData: { [key: string]: { total: number; renewable: number; fossil: number; count: number } } = {};

  historicalData?.forEach((record: any) => {
    const metric = energyMetrics?.find(m => m.id === record.metric_id);
    const date = new Date(record.period_start);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { total: 0, renewable: 0, fossil: 0, count: 0 };
    }

    const consumption = parseFloat(record.value) || 0;
    const isRenewable = metric?.is_renewable || false;

    // Check if we have grid mix metadata for this record
    const gridMix = record.metadata?.grid_mix;

    monthlyData[monthKey].total += consumption;

    if (isRenewable) {
      // Direct renewable energy (solar panels, wind turbines owned)
      monthlyData[monthKey].renewable += consumption;
    } else if (gridMix && gridMix.renewable_kwh) {
      // Grid electricity with renewable component from grid mix
      monthlyData[monthKey].renewable += gridMix.renewable_kwh;
      monthlyData[monthKey].fossil += gridMix.non_renewable_kwh || (consumption - gridMix.renewable_kwh);
    } else {
      // Fossil fuel energy (no renewable component)
      monthlyData[monthKey].fossil += consumption;
    }

    monthlyData[monthKey].count++;
  });

  // Convert to array
  const months = Object.keys(monthlyData).sort();
  const historicalMonthly = months.map(monthKey => ({
    monthKey,
    total: monthlyData[monthKey].total,
    renewable: monthlyData[monthKey].renewable,
    fossil: monthlyData[monthKey].fossil
  }));

  console.log('📈 Historical Monthly Data (last 12 months):\n');
  console.log('Month       | Total (MWh) | Renewable (MWh) | Fossil (MWh) | Renewable %');
  console.log('------------|-------------|-----------------|--------------|------------');

  historicalMonthly.slice(-12).forEach(m => {
    const renewablePct = m.total > 0 ? (m.renewable / m.total * 100).toFixed(1) : '0.0';
    console.log(
      `${m.monthKey} | ${(m.total / 1000).toFixed(1).padStart(11)} | ` +
      `${(m.renewable / 1000).toFixed(1).padStart(15)} | ` +
      `${(m.fossil / 1000).toFixed(1).padStart(12)} | ${renewablePct.padStart(11)}%`
    );
  });

  // Generate forecasts using EnterpriseForecast
  const monthsToForecast = 6;

  console.log(`\n🔮 Generating ${monthsToForecast}-month forecast...\n`);

  // Total energy forecast
  const totalEnergyData = historicalMonthly.map(m => ({
    month: m.monthKey,
    emissions: m.total
  }));
  const totalForecast = EnterpriseForecast.forecast(totalEnergyData, monthsToForecast, false);

  // Renewable forecast
  const renewableData = historicalMonthly.map(m => ({
    month: m.monthKey,
    emissions: m.renewable
  }));
  const renewableForecast = EnterpriseForecast.forecast(renewableData, monthsToForecast, false);

  // Fossil forecast
  const fossilData = historicalMonthly.map(m => ({
    month: m.monthKey,
    emissions: m.fossil
  }));
  const fossilForecast = EnterpriseForecast.forecast(fossilData, monthsToForecast, false);

  console.log('🔮 Forecast Results:\n');
  console.log(`Model: ${totalForecast.method}`);
  console.log(`R² Score: ${totalForecast.metadata.r2.toFixed(3)}`);
  console.log(`Volatility: ${totalForecast.metadata.volatility.toFixed(3)}\n`);

  console.log('Month | Total (MWh) | Renewable (MWh) | Fossil (MWh) | Renewable %');
  console.log('------|-------------|-----------------|--------------|------------');

  for (let i = 0; i < monthsToForecast; i++) {
    const total = totalForecast.forecasted[i] || 0;
    const renewable = renewableForecast.forecasted[i] || 0;
    const fossil = fossilForecast.forecasted[i] || 0;
    const renewablePct = total > 0 ? (renewable / total * 100).toFixed(1) : '0.0';

    // Generate month label
    const lastMonth = historicalMonthly[historicalMonthly.length - 1].monthKey.split('-');
    let year = parseInt(lastMonth[0]);
    let month = parseInt(lastMonth[1]) + i + 1;
    if (month > 12) {
      month -= 12;
      year++;
    }
    const monthLabel = `${year}-${String(month).padStart(2, '0')}`;

    console.log(
      `${monthLabel} | ${(total / 1000).toFixed(1).padStart(11)} | ` +
      `${(renewable / 1000).toFixed(1).padStart(15)} | ` +
      `${(fossil / 1000).toFixed(1).padStart(12)} | ${renewablePct.padStart(11)}%`
    );
  }

  console.log('\n✅ Forecast generation complete!');
  console.log(`\n📊 Key Findings:`);
  console.log(`  - Renewable forecast is ${renewableForecast.forecasted[0] > 0 ? 'WORKING ✅' : 'STILL ZERO ❌'}`);
  console.log(`  - First month renewable: ${(renewableForecast.forecasted[0] / 1000).toFixed(1)} MWh`);
  console.log(`  - First month total: ${(totalForecast.forecasted[0] / 1000).toFixed(1)} MWh`);
}

testForecastAPI().catch(console.error);
