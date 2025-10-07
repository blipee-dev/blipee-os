import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkWater2025() {
  console.log('🔍 Calculating Water Values for 2025...\n');

  // Get water metrics
  const { data: waterMetrics } = await supabase
    .from('metrics_catalog')
    .select('id, code, name, unit')
    .or('subcategory.eq.Water,code.ilike.%water%');

  console.log('📊 Water Metrics:');
  waterMetrics?.forEach(m => {
    console.log(`  - ${m.code}: ${m.name} (${m.unit})`);
  });

  // Get all 2025 data
  const metricIds = waterMetrics?.map(m => m.id) || [];
  const { data: data2025 } = await supabase
    .from('metrics_data')
    .select('metric_id, value, period_start')
    .in('metric_id', metricIds)
    .gte('period_start', '2025-01-01')
    .lt('period_start', '2026-01-01')
    .order('period_start');

  console.log(`\n📈 Total 2025 Records: ${data2025?.length || 0}\n`);

  // Calculate by metric
  const byMetric: any = {};
  data2025?.forEach(record => {
    const metric = waterMetrics?.find(m => m.id === record.metric_id);
    const metricName = metric?.name || 'Unknown';
    if (!byMetric[metricName]) {
      byMetric[metricName] = { total: 0, unit: metric?.unit, records: 0 };
    }
    byMetric[metricName].total += parseFloat(record.value);
    byMetric[metricName].records++;
  });

  console.log('📊 2025 Totals by Metric:\n');
  Object.entries(byMetric).forEach(([name, data]: any) => {
    console.log(`${name}:`);
    console.log(`  Total: ${data.total.toFixed(2)} ${data.unit}`);
    if (data.unit === 'm³' || data.unit === 'm3') {
      console.log(`  In ML: ${(data.total / 1000).toFixed(2)} ML`);
    }
    console.log(`  Records: ${data.records}`);
    console.log('');
  });

  // Calculate GRI 303 metrics
  const waterSupply = byMetric['Water']?.total || 0;
  const wastewater = byMetric['Wastewater']?.total || 0;
  const consumption = waterSupply - wastewater;

  console.log('💧 GRI 303 Metrics for 2025:\n');
  console.log(`Total Withdrawal (GRI 303-3): ${waterSupply.toFixed(2)} m³ = ${(waterSupply / 1000).toFixed(2)} ML`);
  console.log(`Total Discharge (GRI 303-4):  ${wastewater.toFixed(2)} m³ = ${(wastewater / 1000).toFixed(2)} ML`);
  console.log(`Consumption (GRI 303-5):      ${consumption.toFixed(2)} m³ = ${(consumption / 1000).toFixed(2)} ML`);
  console.log(`  Formula: Consumption = Withdrawal - Discharge`);

  // Monthly breakdown
  console.log('\n\n📅 Monthly Breakdown 2025:\n');
  const byMonth: any = {};
  data2025?.forEach(record => {
    const metric = waterMetrics?.find(m => m.id === record.metric_id);
    const date = new Date(record.period_start);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = date.toLocaleString('default', { month: 'short', year: 'numeric' });

    if (!byMonth[monthKey]) {
      byMonth[monthKey] = {
        monthName,
        withdrawal: 0,
        discharge: 0
      };
    }

    const value = parseFloat(record.value);
    if (metric?.code === 'scope3_water_supply') {
      byMonth[monthKey].withdrawal += value;
    } else if (metric?.code === 'scope3_wastewater') {
      byMonth[monthKey].discharge += value;
    }
  });

  Object.values(byMonth)
    .sort((a: any, b: any) => a.monthName.localeCompare(b.monthName))
    .forEach((month: any) => {
      const consumption = month.withdrawal - month.discharge;
      console.log(`${month.monthName}:`);
      console.log(`  Withdrawal: ${(month.withdrawal / 1000).toFixed(2)} ML`);
      console.log(`  Discharge:  ${(month.discharge / 1000).toFixed(2)} ML`);
      console.log(`  Consumption: ${(consumption / 1000).toFixed(2)} ML`);
    });
}

checkWater2025().catch(console.error);
