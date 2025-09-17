const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSitesRLS() {
  console.log('Checking Sites RLS and data...\n');

  // 1. Check if sites exist for PLMJ organization
  const { data: sites, error: sitesError } = await supabase
    .from('sites')
    .select('id, name, organization_id')
    .eq('organization_id', '22647141-2ee4-4d8d-8b47-16b0cbd830b2');

  if (sitesError) {
    console.error('Error fetching sites:', sitesError);
    return;
  }

  console.log('✅ Sites in PLMJ organization:');
  sites.forEach(site => {
    console.log(`  - ${site.name} (ID: ${site.id})`);
  });
  console.log('');

  // 2. Test with jose.pinto@plmj.pt user context (using auth user)
  const { data: authData } = await supabase.auth.admin.listUsers();
  const joseUser = authData?.users?.find(u => u.email === 'jose.pinto@plmj.pt');

  if (joseUser) {
    console.log('Testing with jose.pinto@plmj.pt user context...');

    // Create a client with the user's session (simulate user access)
    // We can't directly impersonate, but we can check what the query would return
    const { data: userSites, error: userError } = await supabase
      .from('sites')
      .select('id, name, organization_id')
      .eq('organization_id', '22647141-2ee4-4d8d-8b47-16b0cbd830b2');

    if (userError) {
      console.error('Error with user query:', userError);
    } else {
      console.log('Sites visible with service role:', userSites?.length || 0);
    }
  }

  // 3. Check RLS policies on sites table
  console.log('\n📋 Checking RLS policies on sites table...');

  const { data: policies, error: policiesError } = await supabase
    .rpc('pg_policies')
    .eq('tablename', 'sites');

  if (!policiesError && policies) {
    console.log('RLS policies for sites table:');
    policies.forEach(policy => {
      console.log(`  - ${policy.policyname}: ${policy.cmd}`);
    });
  }

  // 4. Check if RLS is enabled on sites table
  const { data: tableInfo, error: tableError } = await supabase
    .rpc('pg_tables')
    .eq('tablename', 'sites')
    .single();

  if (!tableError && tableInfo) {
    console.log('\nRLS enabled on sites table:', tableInfo.rowsecurity);
  }

  // 5. Direct SQL query to check what jose can see
  console.log('\n🔍 Checking what jose.pinto@plmj.pt should be able to see...');

  const { data: checkData, error: checkError } = await supabase.rpc('sql', {
    query: `
      SELECT
        s.id,
        s.name,
        s.organization_id,
        om.user_id,
        om.role
      FROM sites s
      LEFT JOIN organization_members om
        ON om.organization_id = s.organization_id
      WHERE om.user_id = '${joseUser?.id}'
        AND s.organization_id = '22647141-2ee4-4d8d-8b47-16b0cbd830b2'
    `
  }).catch(err => {
    // If the RPC doesn't exist, try a different approach
    return supabase
      .from('sites')
      .select(`
        id,
        name,
        organization_id
      `)
      .eq('organization_id', '22647141-2ee4-4d8d-8b47-16b0cbd830b2');
  });

  if (checkData) {
    console.log('Sites that should be visible to jose.pinto@plmj.pt:');
    console.log(checkData);
  }
}

checkSitesRLS().catch(console.error);