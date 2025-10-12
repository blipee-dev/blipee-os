const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const ORG_ID = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';
const TARGET_ID = 'd4a00170-7964-41e2-a61e-3d7b0059cfe5';

async function checkWaterUnits() {
  console.log('🔍 Checking Water Metrics Units and Values\n');

  // Get water category metrics
  const { data: waterMetrics } = await supabase
    .from('metrics_catalog')
    .select('id, name, category, unit')
    .in('category', ['Water Withdrawal', 'Water Discharge', 'Water Consumption']);

  console.log('📋 Water Metrics in Catalog:');
  waterMetrics.forEach(m => {
    console.log(`   ${m.name} (${m.category}): unit="${m.unit}"`);
  });

  // Get metric targets
  const metricIds = waterMetrics.map(m => m.id);
  const { data: targets } = await supabase
    .from('metric_targets')
    .select('id, metric_catalog_id, baseline_value, baseline_emissions, target_value, target_emissions')
    .eq('organization_id', ORG_ID)
    .eq('target_id', TARGET_ID)
    .in('metric_catalog_id', metricIds);

  console.log('\n📊 Metric Targets Values:');
  targets.forEach(t => {
    const metric = waterMetrics.find(m => m.id === t.metric_catalog_id);
    console.log(`\n   ${metric.name} (${metric.category}):`);
    console.log(`      Baseline Value: ${t.baseline_value} ${metric.unit}`);
    console.log(`      Baseline Emissions: ${t.baseline_emissions} ${metric.unit}`);
    console.log(`      Target Value: ${t.target_value} ${metric.unit}`);
    console.log(`      Target Emissions: ${t.target_emissions} ${metric.unit}`);

    // Show in different units
    if (metric.unit === 'L') {
      console.log(`      Baseline in ML: ${(t.baseline_value / 1000000).toFixed(2)} ML`);
      console.log(`      Target in ML: ${(t.target_value / 1000000).toFixed(2)} ML`);
    } else if (metric.unit === 'm³' || metric.unit === 'm3') {
      console.log(`      Baseline in ML: ${(t.baseline_value / 1000).toFixed(2)} ML`);
      console.log(`      Target in ML: ${(t.target_value / 1000).toFixed(2)} ML`);
    }
  });

  console.log('\n✅ Check complete\n');
}

checkWaterUnits().catch(console.error);
