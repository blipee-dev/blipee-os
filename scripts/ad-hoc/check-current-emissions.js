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

async function checkCurrentEmissions() {
  const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';
  const targetId = 'f26e3d5e-f1c1-4e00-8bdd-4e7f2e5e2e5e';

  console.log('🔍 Checking current_emissions field in database...\n');

  const { data: target, error } = await supabaseAdmin
    .from('sustainability_targets')
    .select('id, name, baseline_year, baseline_emissions, target_year, target_emissions, current_emissions')
    .eq('id', targetId)
    .eq('organization_id', organizationId)
    .single();

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log('📊 Target Data:');
  console.log('  Name:', target.name);
  console.log('  Baseline Year:', target.baseline_year);
  console.log('  Baseline Emissions:', target.baseline_emissions, 'tCO2e');
  console.log('  Target Year:', target.target_year);
  console.log('  Target Emissions:', target.target_emissions, 'tCO2e');
  console.log('  Current Emissions (from DB):', target.current_emissions, 'tCO2e');
  console.log('\n❓ Is current_emissions null or populated?', target.current_emissions ? '✅ Populated' : '❌ NULL');

  if (target.current_emissions) {
    console.log('\n📐 Gap Calculation:');
    console.log('  Current:', target.current_emissions, 'tCO2e');
    console.log('  Target:', target.target_emissions, 'tCO2e');
    console.log('  Gap:', (target.current_emissions - target.target_emissions).toFixed(2), 'tCO2e');
  }
}

checkCurrentEmissions().catch(console.error);
