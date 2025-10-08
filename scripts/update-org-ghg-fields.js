const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateOrganization() {
  // Get the first organization
  const { data: orgs, error: orgError } = await supabase
    .from('organizations')
    .select('id, name')
    .limit(1);
    
  if (orgError || !orgs || orgs.length === 0) {
    console.error('Error fetching organization:', orgError);
    return;
  }
  
  const org = orgs[0];
  console.log(`Updating organization: ${org.name} (${org.id})`);
  
  // Update with GHG Protocol fields
  const { data, error } = await supabase
    .from('organizations')
    .update({
      employees: 150,
      base_year: 2019,
      consolidation_approach: 'Operational Control'
    })
    .eq('id', org.id)
    .select();
    
  if (error) {
    console.error('Error updating organization:', error);
  } else {
    console.log('✅ Organization updated successfully!');
    console.log('Data:', data);
  }
}

updateOrganization();
