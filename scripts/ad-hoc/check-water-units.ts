import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkWaterUnits() {
  console.log('🔍 Checking water data units...\n');

  const { data: waterMetrics } = await supabase
    .from('metrics_catalog')
    .select('id, code, name, unit')
    .or('subcategory.eq.Water,code.ilike.%water%');

  console.log('📊 Water Metrics Units:');
  waterMetrics?.forEach(m => {
    console.log(`  ${m.name}: ${m.unit}`);
  });

  // Get sample data to see actual values
  const metricIds = waterMetrics?.map(m => m.id) || [];
  const { data: sampleData } = await supabase
    .from('metrics_data')
    .select('metric_id, value, period_start')
    .in('metric_id', metricIds)
    .order('period_start', { ascending: false })
    .limit(10);

  console.log('\n📈 Sample Data Values:');
  sampleData?.forEach(record => {
    const metric = waterMetrics?.find(m => m.id === record.metric_id);
    console.log(`  ${metric?.name}: ${record.value} ${metric?.unit} (${record.period_start})`);
  });

  // Calculate totals for a month
  const { data: monthData } = await supabase
    .from('metrics_data')
    .select('metric_id, value')
    .in('metric_id', metricIds)
    .gte('period_start', '2025-03-01')
    .lt('period_start', '2025-04-01');

  console.log('\n📊 March 2025 Totals:');
  const totals: any = {};
  monthData?.forEach(record => {
    const metric = waterMetrics?.find(m => m.id === record.metric_id);
    if (!totals[metric?.name || 'Unknown']) {
      totals[metric?.name || 'Unknown'] = { total: 0, unit: metric?.unit };
    }
    totals[metric?.name || 'Unknown'].total += parseFloat(record.value);
  });

  Object.entries(totals).forEach(([name, data]: any) => {
    console.log(`  ${name}: ${data.total.toFixed(2)} ${data.unit}`);
    if (data.unit === 'm³' || data.unit === 'm3') {
      console.log(`    → ${(data.total / 1000).toFixed(3)} ML (megaliters)`);
    }
  });

  console.log('\n💡 Unit Conversion:');
  console.log('  1 ML (megaliter) = 1,000 m³ (cubic meters)');
  console.log('  Dashboard divides m³ values by 1000 to display in ML');
}

checkWaterUnits().catch(console.error);
