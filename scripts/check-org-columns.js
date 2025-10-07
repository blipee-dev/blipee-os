const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

(async () => {
  const plmjOrgId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

  const { data, error } = await supabaseAdmin
    .from('organizations')
    .select('*')
    .eq('id', plmjOrgId)
    .single();

  if (error) {
    console.log('Error:', error);
  } else {
    console.log('Organization columns:');
    console.log(Object.keys(data));
  }
})();
