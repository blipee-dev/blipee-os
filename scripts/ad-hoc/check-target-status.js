const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const ORG_ID = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';
const TARGET_ID = 'd4a00170-7964-41e2-a61e-3d7b0059cfe5';

async function checkTargetStatus() {
  console.log('🔍 Checking Water Metric Target Status\n');

  // Get water category metrics
  const { data: waterMetrics } = await supabase
    .from('metrics_catalog')
    .select('id, name, category')
    .in('category', ['Water Withdrawal', 'Water Discharge', 'Water Consumption']);

  const metricIds = waterMetrics.map(m => m.id);

  // Get metric targets with status
  const { data: targets } = await supabase
    .from('metric_targets')
    .select('id, metric_catalog_id, status, baseline_value, target_value')
    .eq('organization_id', ORG_ID)
    .eq('target_id', TARGET_ID)
    .in('metric_catalog_id', metricIds);

  console.log(`Found ${targets.length} water metric targets:\n`);

  for (const target of targets) {
    const metric = waterMetrics.find(m => m.id === target.metric_catalog_id);
    console.log(`✅ ${metric.name}`);
    console.log(`   Status: "${target.status}"`);
    console.log(`   Baseline: ${target.baseline_value} m³`);
    console.log(`   Target: ${target.target_value} m³\n`);
  }

  // Check if any are not 'active'
  const nonActiveTargets = targets.filter(t => t.status !== 'active');
  if (nonActiveTargets.length > 0) {
    console.log(`⚠️  Found ${nonActiveTargets.length} targets that are NOT 'active'`);
    console.log(`   Need to update status to 'active'\n`);

    // Update to active
    for (const target of nonActiveTargets) {
      const { error } = await supabase
        .from('metric_targets')
        .update({ status: 'active' })
        .eq('id', target.id);

      if (error) {
        console.error(`❌ Error updating target:`, error);
      } else {
        const metric = waterMetrics.find(m => m.id === target.metric_catalog_id);
        console.log(`✅ Updated ${metric.name} status to 'active'`);
      }
    }
  } else {
    console.log('✅ All targets are already active');
  }
}

checkTargetStatus().catch(console.error);
