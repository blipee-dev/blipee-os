const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const ORG_ID = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function checkAllThreeTargets() {
  console.log('🎯 Checking All 3 Targets\n');

  // Get all targets from database
  const { data: dbTargets } = await supabase
    .from('sustainability_targets')
    .select('*')
    .eq('organization_id', ORG_ID)
    .order('created_at', { ascending: false });

  console.log('📊 Database targets:', dbTargets.length);
  dbTargets.forEach(t => {
    console.log(`  - ${t.name} (${t.target_type}) - status: ${t.status}`);
  });
  console.log('');

  // Simulate what the API calculates - it may add calculated targets
  console.log('💡 The API may be adding calculated targets for target types that don\'t exist in the database:');
  console.log('  - Near-term (2030): If no near-term target exists, API calculates one');
  console.log('  - Long-term (2050): If no long-term target exists, API calculates one');
  console.log('  - Net-zero (2050): If no net-zero target exists, API calculates one');
  console.log('');

  // Check which target types exist
  const targetTypes = new Set(dbTargets.map(t => t.target_type));
  console.log('📋 Existing target types:', Array.from(targetTypes).join(', '));
  console.log('');

  // Check which would be calculated
  const allTypes = ['near-term', 'long-term', 'net-zero'];
  const calculatedTypes = allTypes.filter(type => !targetTypes.has(type));

  if (calculatedTypes.length > 0) {
    console.log('🤖 API would calculate these missing targets:', calculatedTypes.join(', '));
    console.log('   Total: ', dbTargets.length, 'existing +', calculatedTypes.length, 'calculated =', dbTargets.length + calculatedTypes.length, 'targets');
  } else {
    console.log('✅ All target types exist in database, no calculated targets needed');
  }
}

checkAllThreeTargets().catch(console.error);
