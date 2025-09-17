const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyJoseAccess() {
  console.log('Verifying access for jose.pinto@plmj.pt...\n');

  // 1. Find the user
  const { data: authData } = await supabase.auth.admin.listUsers();
  const user = authData?.users?.find(u => u.email === 'jose.pinto@plmj.pt');

  if (!user) {
    console.error('User not found!');
    return;
  }

  console.log('✅ User found:');
  console.log('  ID:', user.id);
  console.log('  Email:', user.email);
  console.log('');

  // 2. Check organization memberships
  const { data: memberships, error: membershipError } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id);

  if (membershipError) {
    console.error('Error fetching memberships:', membershipError);
    return;
  }

  console.log('✅ Organization memberships:');
  console.log('  Found', memberships?.length || 0, 'membership(s)');

  if (!memberships || memberships.length === 0) {
    console.error('❌ User has no organization memberships!');
    return;
  }

  for (const membership of memberships) {
    // Get organization details
    const { data: org } = await supabase
      .from('organizations')
      .select('name, slug')
      .eq('id', membership.organization_id)
      .single();

    console.log(`  - ${org?.name} (${org?.slug}): ${membership.role}`);
  }
  console.log('');

  // 3. Check sites access
  const orgIds = memberships.map(m => m.organization_id);

  const { data: sites, error: sitesError } = await supabase
    .from('sites')
    .select('id, name, organization_id')
    .in('organization_id', orgIds);

  if (sitesError) {
    console.error('Error fetching sites:', sitesError);
    return;
  }

  console.log('✅ Sites access:');
  console.log('  Found', sites?.length || 0, 'site(s)');

  for (const site of sites || []) {
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', site.organization_id)
      .single();

    console.log(`  - ${site.name} (Org: ${org?.name})`);
  }
  console.log('');

  // 4. Check user profiles (app_users)
  const { data: appUsers, error: appUsersError } = await supabase
    .from('app_users')
    .select('id, role, organization_id')
    .eq('auth_user_id', user.id);

  console.log('✅ App Users records:');
  console.log('  Found', appUsers?.length || 0, 'app_user record(s)');

  for (const appUser of appUsers || []) {
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', appUser.organization_id)
      .single();

    console.log(`  - Role: ${appUser.role}, Org: ${org?.name}`);
  }
  console.log('');

  // 5. Summary
  console.log('📊 Summary:');
  console.log('  ✅ User exists in auth system');
  console.log('  ✅ User has', memberships?.length || 0, 'organization membership(s)');
  console.log('  ✅ User can access', sites?.length || 0, 'site(s)');
  console.log('  ✅ User has', appUsers?.length || 0, 'app_user record(s)');
  console.log('');

  if (memberships?.[0]?.role === 'account_owner') {
    console.log('  🔑 User has account_owner role - should have full access');
  }
}

verifyJoseAccess().catch(console.error);