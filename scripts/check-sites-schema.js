const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

(async () => {
  const { data, error } = await supabaseAdmin
    .from('sites')
    .select('*')
    .limit(1)
    .single();

  if (error) {
    console.log('Error:', error);
  } else {
    console.log('Sites table columns:');
    console.log(Object.keys(data).join(', '));
    console.log('\nSample data:');
    console.log(JSON.stringify(data, null, 2));
  }
})();
