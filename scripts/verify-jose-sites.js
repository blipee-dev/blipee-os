require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyJoseSites() {
  console.log('🔍 Verifying jose.pinto@plmj.pt sites access\n');
  console.log('=' .repeat(80));

  const joseId = 'e1c83a34-424d-4114-94c5-1a11942dcdea';
  const plmjId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

  try {
    // 1. Check organization membership
    console.log('1. Organization Membership:');
    const { data: membership } = await supabase
      .from('organization_members')
      .select('*')
      .eq('user_id', joseId)
      .single();

    if (membership) {
      console.log('   ✅ Found membership');
      console.log('   - Organization ID:', membership.organization_id);
      console.log('   - Role:', membership.role);
      console.log('   - Is PLMJ?', membership.organization_id === plmjId ? 'Yes' : 'No');
    } else {
      console.log('   ❌ No membership found');
    }

    // 2. Check sites in PLMJ organization
    console.log('\n2. Sites in PLMJ organization:');
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('*')
      .eq('organization_id', plmjId);

    if (sitesError) {
      console.log('   ❌ Error fetching sites:', sitesError.message);
    } else if (sites && sites.length > 0) {
      console.log(`   ✅ Found ${sites.length} sites:`);
      sites.forEach(site => {
        console.log(`   - ${site.name}`);
        console.log(`     ID: ${site.id}`);
        console.log(`     Status: ${site.status || 'active'}`);
        console.log(`     Type: ${site.type || 'office'}`);
      });
    } else {
      console.log('   ❌ No sites found');
    }

    // 3. Test the API query directly (simulate what the API does)
    console.log('\n3. Testing API query simulation:');
    console.log('   Query: organization_members where user_id = jose');

    const { data: apiTest1 } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', joseId);

    console.log('   Result:', apiTest1);

    if (apiTest1 && apiTest1.length > 0) {
      const orgIds = apiTest1.map(om => om.organization_id);
      console.log('\n   Query: sites where organization_id IN', orgIds);

      const { data: apiTest2 } = await supabase
        .from('sites')
        .select('id, name, organization_id')
        .in('organization_id', orgIds);

      console.log('   Sites found:', apiTest2?.length || 0);
      if (apiTest2 && apiTest2.length > 0) {
        apiTest2.forEach(s => {
          console.log(`   - ${s.name} (org: ${s.organization_id})`);
        });
      }
    }

    // 4. Check if there's any RLS policy blocking sites
    console.log('\n4. Testing with service role (bypasses RLS):');
    const { data: allSitesTest } = await supabase
      .from('sites')
      .select('id, name, organization_id')
      .eq('organization_id', plmjId);

    console.log('   Sites visible with service role:', allSitesTest?.length || 0);

  } catch (error) {
    console.error('❌ Error:', error);
  }

  console.log('\n' + '=' .repeat(80));
  console.log('✅ Verification complete');
}

verifyJoseSites();