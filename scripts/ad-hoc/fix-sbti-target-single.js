const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixSBTiTarget() {
  console.log('🔧 Fixing SBTi Target with Correct Values\n');
  console.log('='.repeat(70));

  const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

  // First, check all targets
  const { data: allTargets } = await supabase
    .from('sustainability_targets')
    .select('id, name, target_type, is_active, baseline_year, baseline_value, target_value, created_at')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  console.log(`\nFound ${allTargets.length} targets:\n`);
  allTargets.forEach((t, i) => {
    console.log(`${i + 1}. ${t.name} (${t.target_type})`);
    console.log(`   ID: ${t.id}`);
    console.log(`   Active: ${t.is_active}`);
    console.log(`   Baseline: ${t.baseline_value} tCO2e (${t.baseline_year})`);
    console.log(`   Created: ${t.created_at}\n`);
  });

  // Update the most recent one (the one we just created)
  const targetToUpdate = allTargets[0];

  console.log(`Updating target: ${targetToUpdate.name}\n`);

  // Correct values based on actual 2023 emissions
  const correctBaseline = 324.73;
  const reductionPercent = 42;
  const correctTarget = correctBaseline * (1 - reductionPercent / 100);

  console.log('📊 Correct Values:\n');
  console.log(`Baseline (2023): ${correctBaseline} tCO2e`);
  console.log(`Reduction: ${reductionPercent}%`);
  console.log(`Target (2030): ${correctTarget.toFixed(2)} tCO2e`);

  // Update the specific target by ID
  const { data: updated, error } = await supabase
    .from('sustainability_targets')
    .update({
      baseline_value: correctBaseline,
      baseline_emissions: correctBaseline,
      target_value: parseFloat(correctTarget.toFixed(2)),
      target_reduction_percent: reductionPercent,
      updated_at: new Date().toISOString()
    })
    .eq('id', targetToUpdate.id)
    .select()
    .single();

  if (error) {
    console.error('\n❌ Error updating target:', error);
    return;
  }

  console.log('\n✅ Successfully updated SBTi target!\n');
  console.log('='.repeat(70));
  console.log('\n📋 Updated Target Record:\n');
  console.log(`Target Name: ${updated.target_name}`);
  console.log(`Baseline Year: ${updated.baseline_year}`);
  console.log(`Baseline: ${updated.baseline_emissions} tCO2e`);
  console.log(`Target Year: ${updated.target_year}`);
  console.log(`Target: ${updated.target_emissions} tCO2e`);
  console.log(`Reduction: ${updated.target_reduction_percent}%`);
  console.log(`Annual Rate: ${updated.annual_reduction_rate}%/year`);
  console.log(`SBTi Validated: ${updated.sbti_validated ? 'Yes' : 'No'}`);
  console.log(`Ambition: ${updated.sbti_ambition}`);

  console.log('\n' + '='.repeat(70));
  console.log('\n✨ The Overview Dashboard should now show correct values!');
  console.log('   Please refresh the page to see the updated data.\n');
}

fixSBTiTarget();
