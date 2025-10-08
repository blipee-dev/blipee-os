const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTargetFields() {
  console.log('Checking sustainability_targets fields...\\n');

  const { data, error } = await supabase
    .from('sustainability_targets')
    .select('*')
    .eq('organization_id', '22647141-2ee4-4d8d-8b47-16b0cbd830b2')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error:', error);
  } else if (data && data.length > 0) {
    console.log('Field names in sustainability_targets record:');
    console.log(Object.keys(data[0]).join(', '));
    console.log('\\nFull record:');
    console.log(JSON.stringify(data[0], null, 2));
  } else {
    console.log('No targets found');
  }
}

checkTargetFields();
