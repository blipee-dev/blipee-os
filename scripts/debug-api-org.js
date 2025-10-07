const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('=== DEBUGGING API ORGANIZATION ISSUE ===\n');

  // Get the PLMJ user
  const userId = 'e1c83a34-424d-4114-94c5-1a11942dcdea';
  console.log('User ID from logs:', userId);

  // Check user_organizations table
  const { data: userOrgs } = await supabase
    .from('user_organizations')
    .select('*')
    .eq('user_id', userId);

  console.log('\nuser_organizations for this user:');
  console.log(JSON.stringify(userOrgs, null, 2));

  // Check app_users table
  const { data: appUsers } = await supabase
    .from('app_users')
    .select('*')
    .eq('auth_user_id', userId);

  console.log('\napp_users for this user:');
  console.log(JSON.stringify(appUsers, null, 2));

  // Simulate what getUserOrganizationById does
  console.log('\n=== SIMULATING getUserOrganizationById ===');
  
  const { data: userOrgData } = await supabase
    .from('user_organizations')
    .select('organization_id')
    .eq('user_id', userId)
    .single();

  console.log('Result:', userOrgData);

  if (userOrgData) {
    const orgId = userOrgData.organization_id;
    console.log('\nWould use organization_id:', orgId);

    // Test the business travel query
    const { data: travelMetrics } = await supabase
      .from('metrics_catalog')
      .select('*')
      .or('code.like.scope3_business_travel_%,code.eq.scope3_hotel_nights');

    console.log('\nTravel metrics found:', travelMetrics.length);

    const metricIds = travelMetrics.map(m => m.id);
    const { data: travelData } = await supabase
      .from('metrics_data')
      .select('*')
      .eq('organization_id', orgId)
      .in('metric_id', metricIds);

    console.log('Travel data rows for this org:', travelData?.length || 0);

    if (travelData && travelData.length > 0) {
      console.log('\nSample row:', travelData[0]);
    }
  }
})();
