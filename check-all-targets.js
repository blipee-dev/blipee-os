const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const ORG_ID = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function checkAllTargets() {
  console.log('🎯 Checking All Sustainability Targets\n');

  // Get all targets for the organization
  const { data: targets, error } = await supabase
    .from('sustainability_targets')
    .select('*')
    .eq('organization_id', ORG_ID)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching targets:', error);
    return;
  }

  console.log(`Found ${targets.length} sustainability targets:\n`);

  for (const target of targets) {
    console.log(`📊 ${target.name}`);
    console.log(`   ID: ${target.id}`);
    console.log(`   Type: ${target.target_type}`);
    console.log(`   Baseline: ${target.baseline_year} - ${target.baseline_value} tCO2e`);
    console.log(`   Target: ${target.target_year} - ${target.target_value} tCO2e`);
    console.log(`   Current: ${target.current_emissions} tCO2e`);
    console.log(`   Status: ${target.status}`);
    console.log(`   Created: ${target.created_at}\n`);
  }

  // Check if SBTi target exists
  const sbtiTarget = targets.find(t => t.name?.toLowerCase().includes('sbti') || t.target_type === 'sbti');
  if (sbtiTarget) {
    console.log('✅ SBTi target found!');
  } else {
    console.log('⚠️  No SBTi target found');
  }
}

checkAllTargets().catch(console.error);
