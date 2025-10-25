const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function deleteReplanningData() {
  const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

  console.log('🗑️  Deleting all replanning data...\n');
  console.log('='.repeat(80));

  // Step 1: Delete monthly targets
  console.log('\n1️⃣ Deleting metric_targets_monthly...');
  const { data: metricTargets } = await supabase
    .from('metric_targets')
    .select('id')
    .eq('organization_id', organizationId);

  if (metricTargets && metricTargets.length > 0) {
    const metricTargetIds = metricTargets.map(mt => mt.id);
    const { error: monthlyError, count: monthlyCount } = await supabase
      .from('metric_targets_monthly')
      .delete()
      .in('metric_target_id', metricTargetIds);

    if (monthlyError) {
      console.error('   ❌ Error:', monthlyError);
    } else {
      console.log(`   ✅ Deleted monthly targets`);
    }
  }

  // Step 2: Delete reduction initiatives
  console.log('\n2️⃣ Deleting reduction_initiatives...');
  const { error: initiativesError, count: initiativesCount } = await supabase
    .from('reduction_initiatives')
    .delete()
    .eq('organization_id', organizationId);

  if (initiativesError) {
    console.error('   ❌ Error:', initiativesError);
  } else {
    console.log(`   ✅ Deleted reduction initiatives`);
  }

  // Step 3: Delete metric targets
  console.log('\n3️⃣ Deleting metric_targets...');
  const { error: metricTargetsError, count: mtCount } = await supabase
    .from('metric_targets')
    .delete()
    .eq('organization_id', organizationId);

  if (metricTargetsError) {
    console.error('   ❌ Error:', metricTargetsError);
  } else {
    console.log(`   ✅ Deleted metric targets`);
  }

  // Step 4: Delete replanning history
  console.log('\n4️⃣ Deleting target_replanning_history...');
  const { error: historyError, count: historyCount } = await supabase
    .from('target_replanning_history')
    .delete()
    .eq('organization_id', organizationId);

  if (historyError) {
    console.error('   ❌ Error:', historyError);
  } else {
    console.log(`   ✅ Deleted replanning history`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n✨ All replanning data deleted successfully!');
  console.log('\n📝 You can now start fresh with a new replanning process.');
  console.log('💡 The dashboard will show the green "Target Path" line (linear reduction)');
}

deleteReplanningData().catch(console.error);
