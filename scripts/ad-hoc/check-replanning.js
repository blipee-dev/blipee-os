require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkData() {
  console.log('Checking replanning data...\n');

  // Get metric targets for the near-term target
  const { data: targets, error } = await supabase
    .from('metric_targets')
    .select('id, metric_catalog_id, target_value, target_emissions, created_at')
    .eq('organization_id', '22647141-2ee4-4d8d-8b47-16b0cbd830b2')
    .eq('target_id', 'd4a00170-7964-41e2-a61e-3d7b0059cfe5')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.log('Error fetching metric targets:', error);
  } else {
    console.log(`✅ Metric Targets Count: ${targets?.length}`);
    if (targets && targets.length > 0) {
      console.log('Most Recent Targets:');
      targets.forEach((t, i) => {
        console.log(`  ${i + 1}. target_value: ${t.target_value}, target_emissions: ${t.target_emissions}, created: ${t.created_at}`);
      });
    }
  }

  // Check replanning history
  const { data: history, error: histError } = await supabase
    .from('target_replanning_history')
    .select('id, replanned_at, allocation_strategy, new_target_emissions, total_initiatives_added')
    .eq('organization_id', '22647141-2ee4-4d8d-8b47-16b0cbd830b2')
    .eq('sustainability_target_id', 'd4a00170-7964-41e2-a61e-3d7b0059cfe5')
    .order('replanned_at', { ascending: false })
    .limit(3);

  if (histError) {
    console.log('\nError fetching history:', histError);
  } else {
    console.log(`\n✅ Replanning History Count: ${history?.length}`);
    if (history && history.length > 0) {
      console.log('Recent History:');
      history.forEach((h, i) => {
        console.log(`  ${i + 1}. ${h.allocation_strategy} strategy, new target: ${h.new_target_emissions} tCO2e, initiatives: ${h.total_initiatives_added}, date: ${h.replanned_at}`);
      });
    }
  }
}

checkData()
  .catch(console.error)
  .finally(() => process.exit(0));
