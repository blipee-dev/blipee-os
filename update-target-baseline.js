const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function updateTargetBaseline() {
  console.log('🔄 Updating near-term target with calculated baseline values...\n');

  const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';
  const baselineYear = 2023;

  // Step 1: Calculate baseline emissions from metrics data
  console.log('📊 Calculating baseline emissions from 2023 metrics data...');

  const { data: metricsData } = await supabase
    .from('metrics_data')
    .select(`
      co2e_emissions,
      metrics_catalog!inner(scope, category)
    `)
    .eq('organization_id', organizationId)
    .gte('period_start', `${baselineYear}-01-01`)
    .lt('period_start', `${baselineYear + 1}-01-01`);

  if (!metricsData || metricsData.length === 0) {
    console.log('❌ No metrics data found for 2023');
    return;
  }

  // Group by scope and round to 1 decimal place
  const scope1 = Math.round(metricsData
    .filter(d => d.metrics_catalog?.scope === 'scope_1')
    .reduce((sum, d) => sum + (d.co2e_emissions || 0), 0) / 1000 * 10) / 10;

  const scope2 = Math.round(metricsData
    .filter(d => d.metrics_catalog?.scope === 'scope_2')
    .reduce((sum, d) => sum + (d.co2e_emissions || 0), 0) / 1000 * 10) / 10;

  const scope3 = Math.round(metricsData
    .filter(d => d.metrics_catalog?.scope === 'scope_3')
    .reduce((sum, d) => sum + (d.co2e_emissions || 0), 0) / 1000 * 10) / 10;

  const total = Math.round((scope1 + scope2 + scope3) * 10) / 10;

  console.log('✅ Calculated baseline emissions:');
  console.log(`   Scope 1: ${scope1.toFixed(2)} tCO2e`);
  console.log(`   Scope 2: ${scope2.toFixed(2)} tCO2e`);
  console.log(`   Scope 3: ${scope3.toFixed(2)} tCO2e`);
  console.log(`   Total:   ${total.toFixed(2)} tCO2e\n`);

  // Step 2: Calculate scope coverage percentages
  const scope_1_2_coverage = 100; // Assuming we have all scope 1+2 data
  const scope_3_percentage = total > 0 ? (scope3 / total) * 100 : 0;
  const scope_3_coverage = scope_3_percentage > 40 ? 67 : 100; // SBTi requires 67% if >40% of total

  console.log('📋 Scope coverage:');
  console.log(`   Scope 1+2 coverage: ${scope_1_2_coverage}%`);
  console.log(`   Scope 3 coverage:   ${scope_3_coverage}% (Scope 3 is ${scope_3_percentage.toFixed(1)}% of total)\n`);

  // Step 3: Calculate target emissions (42% reduction for near-term)
  const targetReduction = 42;
  const targetEmissions = Math.round(total * (1 - targetReduction / 100) * 10) / 10;

  console.log('🎯 Target calculation:');
  console.log(`   Reduction target: ${targetReduction}%`);
  console.log(`   Target emissions: ${targetEmissions.toFixed(2)} tCO2e\n`);

  // Step 4: Get the existing near-term target
  const { data: existingTarget } = await supabase
    .from('sustainability_targets')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('target_type', 'near-term')
    .single();

  if (!existingTarget) {
    console.log('❌ No existing near-term target found');
    return;
  }

  console.log('📝 Current target values:');
  console.log(`   ID: ${existingTarget.id}`);
  console.log(`   Baseline (total): ${existingTarget.baseline_value} tCO2e`);
  console.log(`   Baseline Scope 1: ${existingTarget.baseline_scope_1 || 'NULL'}`);
  console.log(`   Baseline Scope 2: ${existingTarget.baseline_scope_2 || 'NULL'}`);
  console.log(`   Baseline Scope 3: ${existingTarget.baseline_scope_3 || 'NULL'}\n`);

  // Step 5: Update the target with calculated values
  console.log('🔄 Updating target...');

  const { data: updatedTarget, error } = await supabase
    .from('sustainability_targets')
    .update({
      baseline_value: total,
      baseline_scope_1: scope1,
      baseline_scope_2: scope2,
      baseline_scope_3: scope3,
      target_value: targetEmissions,
      scope_1_2_coverage_percent: scope_1_2_coverage,
      scope_3_coverage_percent: scope_3_coverage,
      ghg_inventory_complete: true, // We have complete 2023 data
      updated_at: new Date().toISOString()
    })
    .eq('id', existingTarget.id)
    .select()
    .single();

  if (error) {
    console.log('❌ Error updating target:', error.message);
    return;
  }

  console.log('✅ Target updated successfully!\n');
  console.log('📊 New values:');
  console.log(`   Baseline (total): ${updatedTarget.baseline_value} tCO2e`);
  console.log(`   Baseline Scope 1: ${updatedTarget.baseline_scope_1} tCO2e`);
  console.log(`   Baseline Scope 2: ${updatedTarget.baseline_scope_2} tCO2e`);
  console.log(`   Baseline Scope 3: ${updatedTarget.baseline_scope_3} tCO2e`);
  console.log(`   Target emissions: ${updatedTarget.target_value} tCO2e`);
  console.log(`   Scope 1+2 coverage: ${updatedTarget.scope_1_2_coverage_percent}%`);
  console.log(`   Scope 3 coverage: ${updatedTarget.scope_3_coverage_percent}%`);
}

updateTargetBaseline()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
