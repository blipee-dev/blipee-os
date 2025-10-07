const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

(async () => {
  console.log('=== DEBUGGING RLS POLICIES ON METRICS_DATA ===\n');

  const orgId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2'; // PLMJ

  // Test with SERVICE ROLE (should bypass RLS)
  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('1️⃣ Testing with SERVICE ROLE KEY (bypasses RLS):');
  const { data: serviceData, error: serviceError } = await serviceClient
    .from('metrics_data')
    .select('*')
    .eq('organization_id', orgId)
    .limit(5);

  console.log('   Rows returned:', serviceData?.length || 0);
  if (serviceError) console.log('   Error:', serviceError);

  // Test with ANON KEY (subject to RLS)
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  console.log('\n2️⃣ Testing with ANON KEY (subject to RLS):');
  const { data: anonData, error: anonError } = await anonClient
    .from('metrics_data')
    .select('*')
    .eq('organization_id', orgId)
    .limit(5);

  console.log('   Rows returned:', anonData?.length || 0);
  if (anonError) console.log('   Error:', anonError);

  // Test metrics_catalog with anon key
  console.log('\n3️⃣ Testing metrics_catalog with ANON KEY:');
  const { data: catalogData, error: catalogError } = await anonClient
    .from('metrics_catalog')
    .select('*')
    .or('code.like.scope3_business_travel_%,code.eq.scope3_hotel_nights');

  console.log('   Rows returned:', catalogData?.length || 0);
  if (catalogError) console.log('   Error:', catalogError);
  if (catalogData?.length > 0) {
    console.log('   Sample metric:', catalogData[0].code);
  }

  // Check RLS policies
  console.log('\n4️⃣ Checking RLS policies on metrics_data:');
  const { data: policies } = await serviceClient
    .from('pg_policies')
    .select('*')
    .eq('tablename', 'metrics_data');

  if (policies && policies.length > 0) {
    policies.forEach(p => {
      console.log(`   - ${p.policyname}: ${p.cmd} (${p.permissive ? 'PERMISSIVE' : 'RESTRICTIVE'})`);
    });
  } else {
    console.log('   No RLS policies found (or pg_policies not accessible)');
  }

  console.log('\n5️⃣ Checking if RLS is enabled on metrics_data:');
  const { data: tableInfo } = await serviceClient.rpc('pg_get_tabledef', {
    table_name: 'metrics_data'
  }).single();

  console.log('   Table info:', tableInfo);
})();
