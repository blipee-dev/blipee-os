const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

(async () => {
  console.log('=== SIMULATING THE EXACT API FLOW ===\n');

  const orgId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2'; // PLMJ
  const userId = 'e1c83a34-424d-4114-94c5-1a11942dcdea'; // jose.pinto@plmj.pt

  // Using service role like getUserOrganizationById does
  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Using anon key like the API route does
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  console.log('STEP 1: Get user org (using service role - should work)');
  const { data: memberData } = await serviceClient
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', userId)
    .single();

  console.log('  ✅ Member data:', memberData);

  console.log('\nSTEP 2: Get travel metrics from catalog (using anon key)');
  const { data: travelMetrics, error: metricsError } = await anonClient
    .from('metrics_catalog')
    .select('*')
    .or('code.like.scope3_business_travel_%,code.eq.scope3_hotel_nights');

  console.log('  ✅ Travel metrics found:', travelMetrics?.length || 0);
  if (metricsError) console.log('  ❌ Error:', metricsError);

  if (!travelMetrics || travelMetrics.length === 0) {
    console.log('\n⚠️  No travel metrics in catalog!');
    return;
  }

  console.log('\nSTEP 3: Query metrics_data (using anon key WITHOUT auth - should FAIL)');
  const metricIds = travelMetrics.map(m => m.id);
  const { data: dataNoAuth, error: errorNoAuth } = await anonClient
    .from('metrics_data')
    .select('*')
    .eq('organization_id', orgId)
    .in('metric_id', metricIds);

  console.log('  Rows found:', dataNoAuth?.length || 0);
  if (errorNoAuth) console.log('  ❌ Error:', errorNoAuth);

  console.log('\nSTEP 4: Query metrics_data (using SERVICE ROLE - should WORK)');
  const { data: dataWithService } = await serviceClient
    .from('metrics_data')
    .select('*')
    .eq('organization_id', orgId)
    .in('metric_id', metricIds);

  console.log('  Rows found:', dataWithService?.length || 0);

  console.log('\n\n🔍 ANALYSIS:');
  console.log('   The API route uses createServerSupabaseClient() which uses ANON KEY');
  console.log('   The RLS policy requires auth.uid() to match organization_members.user_id');
  console.log('   BUT the anon client has NO authenticated user session in this test!');
  console.log('   ');
  console.log('   In the real API, Next.js passes the user session via cookies automatically');
  console.log('   So auth.uid() SHOULD work... unless there\'s a timing issue or RLS bug');
  console.log('   ');
  console.log('   NEXT STEP: Check the server logs when the APIs are actually called from the browser');
})();
