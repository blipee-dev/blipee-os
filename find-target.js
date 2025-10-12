require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function findTarget() {
  const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

  console.log('🔍 Finding all targets for organization...\n');

  const { data: targets, error } = await supabaseAdmin
    .from('sustainability_targets')
    .select('id, name, baseline_year, baseline_emissions, target_year, target_emissions, current_emissions')
    .eq('organization_id', organizationId);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`Found ${targets.length} targets:\n`);

  targets.forEach((target, idx) => {
    console.log(`${idx + 1}. ${target.name}`);
    console.log(`   ID: ${target.id}`);
    console.log(`   Baseline (${target.baseline_year}): ${target.baseline_emissions} tCO2e`);
    console.log(`   Target (${target.target_year}): ${target.target_emissions} tCO2e`);
    console.log(`   Current Emissions: ${target.current_emissions ? target.current_emissions + ' tCO2e' : 'NULL ❌'}`);
    console.log('');
  });

  // Check which one is SBTi target
  const sbtiTarget = targets.find(t => t.name && t.name.toLowerCase().includes('sbti'));
  if (sbtiTarget) {
    console.log('🎯 SBTi Target Found:');
    console.log('   ID:', sbtiTarget.id);
    console.log('   Current Emissions:', sbtiTarget.current_emissions);
  }
}

findTarget().catch(console.error);
