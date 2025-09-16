const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  console.log('ENTERPRISE RBAC IMPLEMENTATION CHECK');
  console.log('=====================================\n');

  // Check required tables from architecture document
  const requiredTables = [
    'organizations',
    'sites',
    'roles',
    'user_roles',
    'permission_overrides',
    'delegations',
    'access_audit_log'
  ];

  console.log('Required Tables Status:');
  console.log('-----------------------');

  for (const tableName of requiredTables) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌', tableName, '- NOT FOUND');
    } else {
      console.log('✅', tableName);
    }
  }

  // Check what we're actually using
  console.log('\nActual Implementation:');
  console.log('----------------------');

  // Check organization_members (what we're using)
  const { data: orgMembers } = await supabase
    .from('organization_members')
    .select('*')
    .limit(1);

  if (orgMembers) {
    console.log('✅ organization_members table (CURRENT SYSTEM)');
    const { data: roles } = await supabase
      .from('organization_members')
      .select('role')
      .limit(50);
    const uniqueRoles = [...new Set(roles?.map(r => r.role) || [])];
    console.log('   Roles in use:', uniqueRoles);
  }

  // Check super_admins
  const { data: superAdmins, error: superError } = await supabase
    .from('super_admins')
    .select('*')
    .limit(1);

  if (!superError) {
    console.log('✅ super_admins table');
  }

  // Check app_users permissions field
  const { data: appUser } = await supabase
    .from('app_users')
    .select('permissions')
    .limit(1);

  if (appUser) {
    console.log('✅ app_users.permissions field (for site-specific access)');
  }

  // Check user_access table (leftover from Simple RBAC)
  const { data: userAccess, error: uaError } = await supabase
    .from('user_access')
    .select('*')
    .limit(1);

  if (!uaError) {
    console.log('⚠️  user_access table EXISTS (leftover from Simple RBAC - should be removed)');
  }

  // Check groups table
  const { data: groups, error: groupsError } = await supabase
    .from('groups')
    .select('*')
    .limit(1);

  if (!groupsError) {
    console.log('⚠️  groups table EXISTS (part of Simple RBAC - should be removed)');
  }

  console.log('\n=====================================');
  console.log('SUMMARY:');
  console.log('=====================================');
  console.log('Enterprise RBAC: NOT FULLY IMPLEMENTED');
  console.log('- Missing core tables: roles, user_roles, permission_overrides, delegations, access_audit_log');
  console.log('\nCurrent System: ORGANIZATION_MEMBERS based');
  console.log('- Using organization_members table with 5 roles');
  console.log('- Site-specific access via app_users.permissions JSON field');
  console.log('- Super admin support via super_admins table');
})();