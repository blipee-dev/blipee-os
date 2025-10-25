import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  console.log('🔍 Analyzing Water Usage Breakdown...\n');
  
  // Get all water metrics
  const { data: metrics } = await supabase
    .from('metrics_catalog')
    .select('*')
    .or('subcategory.eq.Water,code.ilike.%water%,name.ilike.%water%,name.ilike.%toilet%,name.ilike.%sanitary%');

  console.log('📊 Available Water Metrics:\n');
  metrics?.forEach(m => {
    console.log(`${m.code}:`);
    console.log(`  Name: ${m.name}`);
    console.log(`  Category: ${m.category} > ${m.subcategory}`);
    console.log(`  Unit: ${m.unit}`);
    console.log('');
  });

  // Check if there are specific toilet/sanitary metrics
  const toiletMetrics = metrics?.filter(m => 
    m.name.toLowerCase().includes('toilet') || 
    m.name.toLowerCase().includes('sanitary') ||
    m.code.toLowerCase().includes('toilet') ||
    m.code.toLowerCase().includes('sanitary')
  );

  console.log('\n🚽 Toilet/Sanitary Specific Metrics:', toiletMetrics?.length || 0);
  toiletMetrics?.forEach(m => {
    console.log(`  - ${m.code}: ${m.name}`);
  });

  // Get 2025 data breakdown
  const ids = metrics?.map(m => m.id) || [];
  const { data } = await supabase
    .from('metrics_data')
    .select('metric_id, value')
    .in('metric_id', ids)
    .gte('period_start', '2025-01-01')
    .lt('period_start', '2026-01-01');

  console.log('\n\n📈 Current Water Data Structure:');
  console.log('Total records: ' + (data?.length || 0));
  
  const byMetric: any = {};
  data?.forEach(r => {
    const m = metrics?.find(x => x.id === r.metric_id);
    const name = m?.name || 'Unknown';
    if (!byMetric[name]) byMetric[name] = 0;
    byMetric[name] += parseFloat(r.value);
  });

  console.log('\nBreakdown by metric:');
  Object.entries(byMetric).forEach(([name, total]: any) => {
    console.log(`  ${name}: ${total.toFixed(2)} m³`);
  });

  console.log('\n\n💡 Recommendation:');
  console.log('To track toilet usage separately, you need to add specific metrics like:');
  console.log('  - scope3_water_toilet');
  console.log('  - scope3_water_kitchen');
  console.log('  - scope3_water_cooling');
  console.log('  - scope3_water_irrigation');
  console.log('  - scope3_water_process');
}

check();
