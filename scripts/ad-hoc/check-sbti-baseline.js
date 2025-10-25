const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://quovvwrwyfkzhgqdeham.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';
const ORG_ID = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkBaseline() {
  console.log('🔍 Checking SBTi Targets Baseline Values\n');

  const { data: targets, error } = await supabase
    .from('sustainability_targets')
    .select('*')
    .eq('organization_id', ORG_ID)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`📊 Found ${targets.length} targets\n`);

  targets.forEach((target, i) => {
    console.log(`${i + 1}. ${target.name}`);
    console.log(`   Target Type: ${target.target_type}`);
    console.log(`   Baseline Year: ${target.baseline_year}`);
    console.log(`   Baseline Value: ${target.baseline_value}`);
    console.log(`   Baseline Emissions: ${target.baseline_emissions}`);
    console.log(`   Target Year: ${target.target_year}`);
    console.log(`   Target Value: ${target.target_value}`);
    console.log(`   Target Emissions: ${target.target_emissions}`);
    console.log(`   Status: ${target.status}`);
    console.log(`   Is Active: ${target.is_active}`);
    console.log('');
  });
}

checkBaseline().catch(console.error);
