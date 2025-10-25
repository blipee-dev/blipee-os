import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check2025OriginalWaste() {
  console.log('🔍 Checking 2025 original waste data (before backfill)...\n');

  // Get all waste metrics
  const { data: wasteMetrics } = await supabase
    .from('metrics_catalog')
    .select('*')
    .eq('category', 'Waste');

  console.log('📋 Checking for aggregated metrics that need to be split:\n');

  // Check for old aggregated metrics in 2025
  const aggregatedMetrics = [
    'scope3_waste_recycling',
    'scope3_waste_composting',
    'scope3_waste_landfill',
    'scope3_waste_incineration',
    'scope3_waste_ewaste'
  ];

  for (const code of aggregatedMetrics) {
    const metric = wasteMetrics?.find(m => m.code === code);
    if (!metric) continue;

    const { data, count } = await supabase
      .from('metrics_data')
      .select('*', { count: 'exact' })
      .eq('metric_id', metric.id)
      .gte('period_start', '2025-01-01')
      .lte('period_end', '2025-12-31');

    const total = data?.reduce((sum, r) => sum + parseFloat(r.value), 0) || 0;

    console.log(`${code}:`);
    console.log(`  Records: ${count || 0}`);
    console.log(`  Total: ${total.toFixed(2)} tons`);
    console.log(`  Status: ${total > 0 ? '✅ Has data - can split' : '⚪ No data'}\n`);
  }

  console.log('💡 Solution:');
  console.log('  We need to check if there are ANY aggregated recycling/composting records');
  console.log('  in 2025 that we deleted earlier. If not, we need to look elsewhere.\n');

  // Check what was deleted
  console.log('🗑️  Reminder: We deleted these aggregated metrics earlier:');
  console.log('  - scope3_waste_recycling (was split into paper/plastic/metal/glass/mixed)');
  console.log('  - scope3_waste_composting (was split into food/garden)\n');

  console.log('🔍 Checking if 2025 HAD these before deletion...');
  console.log('  (We can check by looking at 2023-2024 patterns)\n');

  // Check 2023 and 2024 for comparison
  for (const year of [2023, 2024]) {
    const { data: yearData } = await supabase
      .from('metrics_data')
      .select('metric_id, value')
      .in('metric_id', wasteMetrics?.filter(m =>
        ['scope3_waste_landfill', 'scope3_waste_incineration', 'scope3_waste_ewaste'].includes(m.code)
      ).map(m => m.id) || [])
      .gte('period_start', `${year}-01-01`)
      .lte('period_end', `${year}-12-31`);

    const total = yearData?.reduce((sum, r) => sum + parseFloat(r.value), 0) || 0;
    console.log(`${year} disposal total: ${total.toFixed(2)} tons`);
  }
}

check2025OriginalWaste();
