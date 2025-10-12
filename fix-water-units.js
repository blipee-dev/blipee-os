const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const ORG_ID = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';
const TARGET_ID = 'd4a00170-7964-41e2-a61e-3d7b0059cfe5';

async function fixWaterUnits() {
  console.log('🔧 Fixing Water Metric Units (m³ → L)\n');

  // Get water category metrics
  const { data: waterMetrics } = await supabase
    .from('metrics_catalog')
    .select('id, name, category, unit')
    .in('category', ['Water Withdrawal', 'Water Discharge', 'Water Consumption']);

  const metricIds = waterMetrics.map(m => m.id);

  // Get metric targets
  const { data: targets } = await supabase
    .from('metric_targets')
    .select('*')
    .eq('organization_id', ORG_ID)
    .eq('target_id', TARGET_ID)
    .in('metric_catalog_id', metricIds);

  console.log('📊 Current values (stored as m³, but unit says L):\n');

  for (const target of targets) {
    const metric = waterMetrics.find(m => m.id === target.metric_catalog_id);

    console.log(`${metric.name}:`);
    console.log(`   Current baseline_value: ${target.baseline_value} (says ${metric.unit}, actually m³)`);
    console.log(`   Current target_value: ${target.target_value} (says ${metric.unit}, actually m³)`);

    // Convert m³ to L (multiply by 1000)
    const newBaselineValue = target.baseline_value * 1000;
    const newTargetValue = target.target_value * 1000;

    console.log(`   ✅ Converting to actual Liters:`);
    console.log(`      New baseline_value: ${newBaselineValue} L (${(newBaselineValue / 1000000).toFixed(2)} ML)`);
    console.log(`      New target_value: ${newTargetValue} L (${(newTargetValue / 1000000).toFixed(2)} ML)\n`);

    // Update the target with correct values in Liters
    const { error: updateError } = await supabase
      .from('metric_targets')
      .update({
        baseline_value: newBaselineValue,
        baseline_emissions: newBaselineValue,
        target_value: newTargetValue,
        target_emissions: newTargetValue,
        updated_at: new Date().toISOString()
      })
      .eq('id', target.id);

    if (updateError) {
      console.error(`❌ Error updating ${metric.name}:`, updateError);
    } else {
      console.log(`   ✅ Updated ${metric.name} to actual Liters\n`);
    }
  }

  // Also need to update monthly actuals (they are also in m³ but should be in L)
  console.log('\n🔧 Fixing monthly actuals (m³ → L)...\n');

  const targetIds = targets.map(t => t.id);
  const { data: monthlyRecords } = await supabase
    .from('metric_targets_monthly')
    .select('*')
    .in('metric_target_id', targetIds);

  console.log(`Found ${monthlyRecords.length} monthly records to update\n`);

  for (const record of monthlyRecords) {
    const newPlannedValue = record.planned_value * 1000;
    const newActualValue = record.actual_value * 1000;
    const newPlannedEmissions = record.planned_emissions * 1000;
    const newActualEmissions = record.actual_emissions * 1000;

    const { error: updateError } = await supabase
      .from('metric_targets_monthly')
      .update({
        planned_value: newPlannedValue,
        planned_emissions: newPlannedEmissions,
        actual_value: newActualValue,
        actual_emissions: newActualEmissions,
        updated_at: new Date().toISOString()
      })
      .eq('id', record.id);

    if (updateError) {
      console.error(`❌ Error updating monthly record ${record.id}:`, updateError);
    }
  }

  console.log('✅ All monthly records updated to actual Liters\n');

  // Verify
  console.log('🔍 Verifying updated values...\n');

  const { data: verifiedTargets } = await supabase
    .from('metric_targets')
    .select('*')
    .eq('organization_id', ORG_ID)
    .eq('target_id', TARGET_ID)
    .in('metric_catalog_id', metricIds);

  for (const target of verifiedTargets) {
    const metric = waterMetrics.find(m => m.id === target.metric_catalog_id);
    console.log(`${metric.name}:`);
    console.log(`   Baseline: ${target.baseline_value} L = ${(target.baseline_value / 1000000).toFixed(2)} ML`);
    console.log(`   Target: ${target.target_value} L = ${(target.target_value / 1000000).toFixed(2)} ML\n`);
  }

  console.log('✨ Water units fixed! Values are now in actual Liters.\n');
}

fixWaterUnits().catch(console.error);
