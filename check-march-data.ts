import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMarchData() {
  console.log('🔍 Investigating March 2024 vs March 2025 data...\n');

  const { data: metrics } = await supabase
    .from('metrics_catalog')
    .select('id, name')
    .in('category', ['Purchased Energy', 'Electricity']);

  const metricIds = metrics?.map(m => m.id) || [];

  // Get March 2024 data
  const { data: march2024 } = await supabase
    .from('metrics_data')
    .select('period_start, value, co2e_emissions, metric_id')
    .in('metric_id', metricIds)
    .gte('period_start', '2024-03-01')
    .lt('period_start', '2024-04-01')
    .order('period_start');

  // Get March 2025 data
  const { data: march2025 } = await supabase
    .from('metrics_data')
    .select('period_start, value, co2e_emissions, metric_id')
    .in('metric_id', metricIds)
    .gte('period_start', '2025-03-01')
    .lt('period_start', '2025-04-01')
    .order('period_start');

  const total2024 = march2024?.reduce((sum, r) => sum + parseFloat(r.value), 0) || 0;
  const total2025 = march2025?.reduce((sum, r) => sum + parseFloat(r.value), 0) || 0;
  const emissions2024 = march2024?.reduce((sum, r) => sum + parseFloat(r.co2e_emissions), 0) || 0;
  const emissions2025 = march2025?.reduce((sum, r) => sum + parseFloat(r.co2e_emissions), 0) || 0;

  console.log('📊 March 2024:');
  console.log('  Records:', march2024?.length);
  console.log('  Total Energy:', (total2024 / 1000).toFixed(1), 'MWh');
  console.log('  Total Emissions:', (emissions2024 / 1000).toFixed(2), 'tCO2e');

  console.log('\n📊 March 2025:');
  console.log('  Records:', march2025?.length);
  console.log('  Total Energy:', (total2025 / 1000).toFixed(1), 'MWh');
  console.log('  Total Emissions:', (emissions2025 / 1000).toFixed(2), 'tCO2e');

  const change = ((total2025 - total2024) / total2024) * 100;
  console.log('\n📈 Year-over-Year Change:');
  console.log('  Energy:', change > 0 ? '+' : '', change.toFixed(1), '%');
  console.log('  Difference:', ((total2025 - total2024) / 1000).toFixed(1), 'MWh');

  console.log('\n📋 Detailed March 2025 records:');
  march2025?.forEach(r => {
    const metric = metrics?.find(m => m.id === r.metric_id);
    console.log(`  ${r.period_start}: ${metric?.name} = ${(parseFloat(r.value) / 1000).toFixed(2)} MWh`);
  });
}

checkMarchData().catch(console.error);
