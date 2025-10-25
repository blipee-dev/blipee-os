const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function removeDuplicateTarget() {
  console.log('🧹 Removing Duplicate SBTi Target\n');
  console.log('='.repeat(70));

  const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

  // Get all targets
  const { data: targets, error } = await supabase
    .from('sustainability_targets')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ Error fetching targets:', error);
    return;
  }

  console.log(`\nFound ${targets.length} targets:\n`);
  targets.forEach((t, i) => {
    console.log(`${i + 1}. ${t.target_name}`);
    console.log(`   ID: ${t.id}`);
    console.log(`   Created: ${t.created_at}`);
    console.log(`   Baseline: ${t.baseline_emissions} tCO2e`);
    console.log(`   Target: ${t.target_emissions} tCO2e\n`);
  });

  if (targets.length === 2) {
    // Keep the newer one (with the degree symbol), delete the older one
    const targetToDelete = targets[0]; // The older "1.5C Target"
    const targetToKeep = targets[1];   // The newer "1.5°C Target"

    console.log('='.repeat(70));
    console.log('\n🗑️  Will DELETE:');
    console.log(`   "${targetToDelete.target_name}" (${targetToDelete.id})`);
    console.log(`   Created: ${targetToDelete.created_at}\n`);

    console.log('✅ Will KEEP:');
    console.log(`   "${targetToKeep.target_name}" (${targetToKeep.id})`);
    console.log(`   Created: ${targetToKeep.created_at}\n`);

    // Delete the duplicate
    const { error: deleteError } = await supabase
      .from('sustainability_targets')
      .delete()
      .eq('id', targetToDelete.id);

    if (deleteError) {
      console.error('❌ Error deleting target:', deleteError);
      return;
    }

    console.log('='.repeat(70));
    console.log('\n✅ Successfully deleted duplicate target!');
    console.log('   The Overview Dashboard should now show "1/1" targets.\n');
  } else {
    console.log('⚠️  Expected 2 targets but found', targets.length);
  }
}

removeDuplicateTarget();
