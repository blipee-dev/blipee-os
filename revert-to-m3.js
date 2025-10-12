const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const ORG_ID = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';
const TARGET_ID = 'd4a00170-7964-41e2-a61e-3d7b0059cfe5';

async function revertToM3() {
  console.log('🔧 Reverting Water Units: L → m³\n');

  // Step 1: Update metrics_catalog to use m³ as unit
  const { data: waterMetrics, error: metricsError } = await supabase
    .from('metrics_catalog')
    .select('id, name, category, unit')
    .in('category', ['Water Withdrawal', 'Water Discharge', 'Water Consumption']);

  if (metricsError) {
    console.error('Error fetching metrics:', metricsError);
    return;
  }

  console.log('📋 Updating metrics_catalog unit from "L" to "m³"...\n');

  for (const metric of waterMetrics) {
    const { error: updateError } = await supabase
      .from('metrics_catalog')
      .update({ unit: 'm³' })
      .eq('id', metric.id);

    if (updateError) {
      console.error(`Error updating ${metric.name}:`, updateError);
    } else {
      console.log(`✅ ${metric.name}: unit updated to m³`);
    }
  }

  // Step 2: Revert metric_targets back to m³ (divide by 1000)
  const metricIds = waterMetrics.map(m => m.id);
  const { data: targets } = await supabase
    .from('metric_targets')
    .select('*')
    .eq('organization_id', ORG_ID)
    .eq('target_id', TARGET_ID)
    .in('metric_catalog_id', metricIds);

  console.log('\n📊 Reverting metric_targets values (L → m³)...\n');

  for (const target of targets) {
    const metric = waterMetrics.find(m => m.id === target.metric_catalog_id);

    // Divide by 1000 to convert L back to m³
    const newBaselineValue = target.baseline_value / 1000;
    const newTargetValue = target.target_value / 1000;

    console.log(`${metric.name}:`);
    console.log(`   Current: ${target.baseline_value} L`);
    console.log(`   Reverting to: ${newBaselineValue} m³\n`);

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
    }
  }

  // Step 3: Revert monthly actuals (L → m³)
  console.log('\n📅 Reverting monthly actuals (L → m³)...\n');

  const targetIds = targets.map(t => t.id);
  const { data: monthlyRecords } = await supabase
    .from('metric_targets_monthly')
    .select('*')
    .in('metric_target_id', targetIds);

  for (const record of monthlyRecords) {
    const { error: updateError } = await supabase
      .from('metric_targets_monthly')
      .update({
        planned_value: record.planned_value / 1000,
        planned_emissions: record.planned_emissions / 1000,
        actual_value: record.actual_value / 1000,
        actual_emissions: record.actual_emissions / 1000,
        updated_at: new Date().toISOString()
      })
      .eq('id', record.id);

    if (updateError) {
      console.error(`❌ Error updating monthly record:`, updateError);
    }
  }

  console.log(`✅ Updated ${monthlyRecords.length} monthly records\n`);

  // Step 4: Verify
  console.log('🔍 Verifying updated values...\n');

  const { data: verifiedTargets } = await supabase
    .from('metric_targets')
    .select(`
      id,
      baseline_value,
      target_value,
      metrics_catalog (
        name,
        category,
        unit
      )
    `)
    .eq('organization_id', ORG_ID)
    .eq('target_id', TARGET_ID)
    .in('metric_catalog_id', metricIds);

  for (const target of verifiedTargets) {
    console.log(`✅ ${target.metrics_catalog.name}:`);
    console.log(`   Unit: ${target.metrics_catalog.unit}`);
    console.log(`   Baseline: ${target.baseline_value.toFixed(2)} m³`);
    console.log(`   Target: ${target.target_value.toFixed(2)} m³\n`);
  }

  console.log('✨ Water units reverted to m³ successfully!\n');
}

revertToM3().catch(console.error);
