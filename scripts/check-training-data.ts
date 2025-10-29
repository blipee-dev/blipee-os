/**
 * Check Training Data Availability
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkTrainingData() {
  console.log('🔍 Checking training data availability...\n');

  // Get PLMJ organization
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('name', 'PLMJ')
    .single();

  if (!org) {
    console.log('❌ PLMJ organization not found');
    return;
  }

  console.log(`📊 Organization: ${org.name} (${org.id})\n`);

  // Check last 6 months of data
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const { data, error } = await supabase
    .from('metrics_data')
    .select('metric_id, period_start, value, co2e_emissions')
    .eq('organization_id', org.id)
    .gte('period_start', sixMonthsAgo.toISOString())
    .order('period_start', { ascending: true });

  if (error) {
    console.log('❌ Error fetching data:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('❌ No training data found in the last 6 months');
    return;
  }

  console.log(`✅ Found ${data.length} data points in the last 6 months`);
  console.log(`   Earliest: ${data[0].period_start}`);
  console.log(`   Latest: ${data[data.length - 1].period_start}\n`);

  // Group by metric_id
  const byMetric: Record<string, number> = {};
  data.forEach(row => {
    byMetric[row.metric_id] = (byMetric[row.metric_id] || 0) + 1;
  });

  console.log('📈 Data points by metric_id:');
  Object.entries(byMetric).forEach(([metricId, count]) => {
    console.log(`   ${metricId.substring(0, 8)}...: ${count}`);
  });

  console.log('\n📝 Sample data (first 5 rows):');
  data.slice(0, 5).forEach(row => {
    console.log(`   ${row.period_start} | metric: ${row.metric_id.substring(0, 8)}... | value: ${row.value} | co2e: ${row.co2e_emissions}`);
  });
}

checkTrainingData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
