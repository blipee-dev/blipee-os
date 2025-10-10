import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://quovvwrwyfkzhgqdeham.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';
const ORG_ID = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function testEnergyForecast() {
  console.log('🧪 Testing Energy Forecast API with Grid Mix Data\n');

  // Get energy metrics
  const { data: energyMetrics } = await supabase
    .from('metrics_catalog')
    .select('*')
    .in('category', ['Purchased Energy', 'Electricity']);

  console.log(`📊 Found ${energyMetrics?.length} energy metrics\n`);

  const metricIds = energyMetrics?.map(m => m.id) || [];

  // Fetch recent data with grid mix
  const { data: recentData } = await supabase
    .from('metrics_data')
    .select('period_start, value, metadata')
    .eq('organization_id', ORG_ID)
    .in('metric_id', metricIds)
    .gte('period_start', '2024-01-01')
    .order('period_start', { ascending: true })
    .limit(50);

  console.log(`📈 Sample recent records with grid mix:\n`);

  const monthlyData: { [key: string]: { total: number; renewable: number; fossil: number; hasGridMix: number } } = {};

  recentData?.forEach((record: any) => {
    const date = new Date(record.period_start);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { total: 0, renewable: 0, fossil: 0, hasGridMix: 0 };
    }

    const consumption = parseFloat(record.value) || 0;
    const gridMix = record.metadata?.grid_mix;

    monthlyData[monthKey].total += consumption;

    if (gridMix && gridMix.renewable_kwh) {
      monthlyData[monthKey].renewable += gridMix.renewable_kwh;
      monthlyData[monthKey].fossil += gridMix.non_renewable_kwh || (consumption - gridMix.renewable_kwh);
      monthlyData[monthKey].hasGridMix++;
    } else {
      monthlyData[monthKey].fossil += consumption;
    }
  });

  console.log('Month       | Total (MWh) | Renewable (MWh) | Fossil (MWh) | Renewable % | Records w/ Grid Mix');
  console.log('------------|-------------|-----------------|--------------|-------------|--------------------');

  const months = Object.keys(monthlyData).sort();
  months.forEach(month => {
    const d = monthlyData[month];
    const renewablePct = d.total > 0 ? (d.renewable / d.total * 100).toFixed(1) : '0.0';
    console.log(
      `${month} | ${(d.total / 1000).toFixed(1).padStart(11)} | ` +
      `${(d.renewable / 1000).toFixed(1).padStart(15)} | ` +
      `${(d.fossil / 1000).toFixed(1).padStart(12)} | ` +
      `${renewablePct.padStart(11)}% | ${d.hasGridMix.toString().padStart(19)}`
    );
  });

  // Check a specific record in detail
  console.log('\n🔍 Detailed record inspection:\n');
  const sampleRecord = recentData?.find(r => r.metadata?.grid_mix);
  if (sampleRecord) {
    console.log(`Date: ${sampleRecord.period_start}`);
    console.log(`Consumption: ${sampleRecord.value} kWh`);
    console.log(`Grid Mix:`, JSON.stringify(sampleRecord.metadata.grid_mix, null, 2));
  } else {
    console.log('⚠️ No records with grid mix found!');
  }

  // Calculate overall renewable percentage
  const totals = months.reduce((acc, month) => {
    acc.total += monthlyData[month].total;
    acc.renewable += monthlyData[month].renewable;
    return acc;
  }, { total: 0, renewable: 0 });

  const overallRenewablePct = totals.total > 0 ? (totals.renewable / totals.total * 100).toFixed(1) : '0.0';

  console.log(`\n✅ Overall 2024 Renewable Percentage: ${overallRenewablePct}%`);
  console.log(`   Total: ${(totals.total / 1000).toFixed(1)} MWh`);
  console.log(`   Renewable: ${(totals.renewable / 1000).toFixed(1)} MWh`);
  console.log(`   Fossil: ${((totals.total - totals.renewable) / 1000).toFixed(1)} MWh`);
}

testEnergyForecast().catch(console.error);
