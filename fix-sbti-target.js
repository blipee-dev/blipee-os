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

  // Correct values based on actual 2023 emissions
  const correctBaseline = 324.73;
  const reductionPercent = 42;
  const correctTarget = correctBaseline * (1 - reductionPercent / 100);

  console.log('\n📊 Correct Values:\n');
  console.log(`Baseline (2023): ${correctBaseline} tCO2e`);
  console.log(`Reduction: ${reductionPercent}%`);
  console.log(`Target (2030): ${correctTarget.toFixed(2)} tCO2e`);

  // Update the target
  const { data: updated, error } = await supabase
    .from('sustainability_targets')
    .update({
      baseline_value: correctBaseline,
      baseline_emissions: correctBaseline,
      target_value: parseFloat(correctTarget.toFixed(2)),
      target_reduction_percent: reductionPercent,
      updated_at: new Date().toISOString()
    })
    .eq('organization_id', organizationId)
    .eq('target_type', 'near-term')
    .select();

  if (error) {
    console.error('\n❌ Error updating target:', error);
    return;
  }

  console.log('\n✅ Successfully updated SBTi target!\n');

  // Verify the update
  const { data: verified, error: verifyError } = await supabase
    .from('sustainability_targets')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .single();

  if (verifyError) {
    console.error('Error verifying:', verifyError);
    return;
  }

  console.log('='.repeat(70));
  console.log('\n📋 Updated Target Record:\n');
  console.log(`Target Name: ${verified.target_name}`);
  console.log(`Baseline Year: ${verified.baseline_year}`);
  console.log(`Baseline: ${verified.baseline_emissions} tCO2e`);
  console.log(`Target Year: ${verified.target_year}`);
  console.log(`Target: ${verified.target_emissions} tCO2e`);
  console.log(`Reduction: ${verified.target_reduction_percent}%`);
  console.log(`Annual Rate: ${verified.annual_reduction_rate}%/year`);
  console.log(`SBTi Validated: ${verified.sbti_validated ? 'Yes' : 'No'}`);
  console.log(`Ambition: ${verified.sbti_ambition}`);

  console.log('\n' + '='.repeat(70));
  console.log('\n✨ The Overview Dashboard should now show correct values!');
  console.log('   Please refresh the page to see the updated data.\n');
}

fixSBTiTarget();
