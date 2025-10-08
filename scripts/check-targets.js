const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTargets() {
  console.log('🎯 Checking for SBTi targets...\n');
  
  const { data: targets, error } = await supabase
    .from('sustainability_targets')
    .select('*')
    .eq('is_active', true);
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log(`Found ${targets?.length || 0} active targets:`);
  if (targets && targets.length > 0) {
    targets.forEach(t => {
      console.log(`\n- ${t.target_name}`);
      console.log(`  Type: ${t.target_type}`);
      console.log(`  Baseline: ${t.baseline_emissions} tCO2e (${t.baseline_year})`);
      console.log(`  Target: ${t.target_emissions} tCO2e (${t.target_year})`);
      console.log(`  Reduction: ${t.target_reduction_percent}%`);
      console.log(`  Validated: ${t.sbti_validated}`);
    });
  } else {
    console.log('\n⚠️  No active targets found!');
    console.log('The SBTi card will not display without targets.');
  }
}

checkTargets();
