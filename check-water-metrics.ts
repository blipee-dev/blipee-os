import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkWaterMetrics() {
  console.log('🔍 Checking water metrics in database...\n');

  // Check water metrics in catalog
  const { data: waterMetrics } = await supabase
    .from('metrics_catalog')
    .select('id, code, name, category, subcategory, unit')
    .or('subcategory.eq.Water,code.ilike.%water%')
    .order('code');

  console.log('📊 Water Metrics in Catalog:', waterMetrics?.length || 0);
  console.log('\nMetrics:');
  waterMetrics?.forEach(m => {
    console.log(`  - ${m.code}: ${m.name} (${m.category} > ${m.subcategory}) [${m.unit}]`);
  });

  if (!waterMetrics || waterMetrics.length === 0) {
    console.log('\n❌ No water metrics found in metrics_catalog!');
    return;
  }

  // Check if there's any data
  const metricIds = waterMetrics.map(m => m.id);
  const { data: waterData, count } = await supabase
    .from('metrics_data')
    .select('*', { count: 'exact' })
    .in('metric_id', metricIds);

  console.log('\n📈 Water Data Records:', count || 0);

  if (waterData && waterData.length > 0) {
    const byMonth: any = {};
    waterData.forEach(record => {
      const date = new Date(record.period_start);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!byMonth[monthKey]) byMonth[monthKey] = 0;
      byMonth[monthKey]++;
    });

    console.log('\n📅 Records by Month:');
    Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([month, count]) => {
        console.log(`  ${month}: ${count} records`);
      });

    // Show sample record
    console.log('\n📋 Sample Record:');
    const sample = waterData[0];
    const metric = waterMetrics.find(m => m.id === sample.metric_id);
    console.log(`  Metric: ${metric?.name}`);
    console.log(`  Value: ${sample.value} ${metric?.unit}`);
    console.log(`  Date: ${sample.period_start}`);
    console.log(`  Emissions: ${sample.co2e_emissions} kgCO2e`);
  } else {
    console.log('\n❌ No water data found in metrics_data!');
  }
}

checkWaterMetrics().catch(console.error);
