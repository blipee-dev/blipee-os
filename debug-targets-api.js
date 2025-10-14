const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const ORG_ID = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function debugTargetsAPI() {
  console.log('🔍 Debugging Targets API Response\n');

  // Simulate what the /api/sustainability/targets endpoint returns
  const { data: targets, error } = await supabase
    .from('sustainability_targets')
    .select(`
      id,
      name,
      target_type,
      baseline_year,
      baseline_value,
      target_year,
      target_value,
      current_emissions,
      status,
      created_at
    `)
    .eq('organization_id', ORG_ID)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log('📊 Raw targets from database:', targets.length);
  console.log(JSON.stringify(targets, null, 2));
  console.log('');

  // Check what the API would return
  const formattedTargets = targets.map(t => ({
    target_id: t.id,
    target_name: t.name,
    target_type: t.target_type,
    target_status: t.status, // ← This is the key field!
    baseline_year: t.baseline_year,
    baseline_emissions: t.baseline_value,
    target_year: t.target_year,
    target_emissions: t.target_value,
    current_emissions: t.current_emissions,
  }));

  console.log('📊 Formatted for API (what dashboard receives):');
  console.log(JSON.stringify({ targets: formattedTargets }, null, 2));
  console.log('');

  // Filter active targets
  const activeTargets = formattedTargets.filter(t => t.target_status === 'active');
  console.log('✅ Active targets:', activeTargets.length);
  activeTargets.forEach(t => {
    console.log(`  - ${t.target_name} (status: "${t.target_status}")`);
  });
}

debugTargetsAPI().catch(console.error);
