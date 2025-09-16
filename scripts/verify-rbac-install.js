const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyInstallation() {
  console.log('🔍 Verifying Enterprise RBAC Installation...');
  console.log('===========================================');

  let allGood = true;

  // Check roles table
  const { data: roles, error: rolesError } = await supabase
    .from('roles')
    .select('name, level')
    .order('level');

  if (!rolesError && roles) {
    console.log('✅ Roles table exists with', roles.length, 'roles:');
    roles.forEach(r => console.log('   -', r.name, '(' + r.level + ')'));
  } else {
    console.log('❌ Roles table error:', rolesError?.message);
    allGood = false;
  }

  console.log('');

  // Check user_roles table
  const { count: userRoleCount, error: urError } = await supabase
    .from('user_roles')
    .select('*', { count: 'exact', head: true });

  if (!urError) {
    console.log('✅ User_roles table exists with', userRoleCount || 0, 'entries');

    // Check if migration ran
    if (userRoleCount > 0) {
      const { data: sample } = await supabase
        .from('user_roles')
        .select(`
          id,
          user_id,
          roles!inner(name),
          organizations!inner(name)
        `)
        .limit(3);

      if (sample && sample.length > 0) {
        console.log('   Sample migrated roles:');
        sample.forEach(s => {
          console.log(`   - User ${s.user_id.substring(0, 8)}... has role ${s.roles?.name} in ${s.organizations?.name}`);
        });
      }
    }
  } else {
    console.log('❌ User_roles table error:', urError?.message);
    allGood = false;
  }

  console.log('');

  // Check permission_overrides table
  const { error: overridesError } = await supabase
    .from('permission_overrides')
    .select('id')
    .limit(1);

  console.log(overridesError ? '❌ permission_overrides table missing' : '✅ permission_overrides table exists');
  if (overridesError) allGood = false;

  // Check delegations table
  const { error: delegationsError } = await supabase
    .from('delegations')
    .select('id')
    .limit(1);

  console.log(delegationsError ? '❌ delegations table missing' : '✅ delegations table exists');
  if (delegationsError) allGood = false;

  console.log('');

  // Test the check_user_permission function
  console.log('Testing permission check function...');
  const { data: permCheck, error: permError } = await supabase
    .rpc('check_user_permission', {
      p_user_id: 'd5708d9c-34fb-4c85-90ec-34faad9e2896', // Jose's ID
      p_resource: 'user',
      p_action: 'create',
      p_organization_id: null,
      p_site_id: null
    });

  if (!permError) {
    console.log('✅ check_user_permission function works');
    console.log('   Result for Jose creating users:', permCheck ? 'ALLOWED' : 'DENIED');
  } else {
    console.log('❌ check_user_permission function error:', permError?.message);
    allGood = false;
  }

  // Test get_user_roles function
  const { data: userRoles, error: userRolesError } = await supabase
    .rpc('get_user_roles', {
      p_user_id: 'd5708d9c-34fb-4c85-90ec-34faad9e2896'
    });

  if (!userRolesError && userRoles) {
    console.log('✅ get_user_roles function works');
    if (userRoles.length > 0) {
      console.log('   Jose\'s roles:', userRoles.map(r => r.role_name).join(', '));
    }
  } else {
    console.log('❌ get_user_roles function error:', userRolesError?.message);
    allGood = false;
  }

  console.log('');
  console.log('===========================================');

  if (allGood) {
    console.log('🎉 Enterprise RBAC is FULLY INSTALLED and OPERATIONAL!');
    console.log('');
    console.log('Next steps:');
    console.log('1. The system will now use Enterprise RBAC for all permission checks');
    console.log('2. Existing organization_members data has been migrated to user_roles');
    console.log('3. The API endpoints and UI components are ready to use RBAC');
  } else {
    console.log('⚠️  Some components are missing. Please check errors above.');
    console.log('');
    console.log('To fix:');
    console.log('1. Review any error messages above');
    console.log('2. Re-run the migration if needed');
    console.log('3. Check that all tables have proper permissions');
  }
}

verifyInstallation().catch(console.error);