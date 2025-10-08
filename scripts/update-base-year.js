const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateBaseYear() {
  const { data, error } = await supabase
    .from('organizations')
    .update({
      base_year: 2023
    })
    .eq('id', '22647141-2ee4-4d8d-8b47-16b0cbd830b2')
    .select();
    
  if (error) {
    console.error('Error updating base year:', error);
  } else {
    console.log('✅ Base year updated to 2023');
    console.log('Data:', data);
  }
}

updateBaseYear();
