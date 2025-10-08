const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createSBTiTarget() {
  console.log('Creating SBTi near-term target...\n');
  
  const { data, error } = await supabase
    .from('sustainability_targets')
    .insert({
      organization_id: '22647141-2ee4-4d8d-8b47-16b0cbd830b2',
      name: 'PLMJ 1.5C Target',
      baseline_value: 472.6,
      baseline_unit: 'tCO2e',
      target_value: 274.11,
      target_unit: 'tCO2e',
      target_type: 'near-term',
      target_scope: 'all_scopes',
      target_name: 'PLMJ 1.5C Aligned Reduction Target',
      target_description: 'Reduce absolute GHG emissions by 42% by 2030 from a 2023 base year',
      sbti_ambition: '1.5C',
      sbti_validated: true,
      sbti_validation_date: '2024-06-15',
      target_status: 'committed',
      baseline_year: 2023,
      baseline_emissions: 472.6,
      target_year: 2030,
      target_reduction_percent: 42.0,
      is_active: true,
      priority: 1
    })
    .select();
    
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('SUCCESS! Target created');
    console.log('Refresh the Overview Dashboard!');
  }
}

createSBTiTarget();
