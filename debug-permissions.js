const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugPermissions() {
  console.log('🧪 Step-by-step debugging of permission function...');
  console.log('================================================');

  const userId = 'e1c83a34-424d-4114-94c5-1a11942dcdea';
  const orgId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';
  const resourceType = 'org';
  const action = 'users';

  // Step 1: Check super admin
  let isSuperAdmin = false;
  try {
    const { data } = await supabase
      .from('super_admins')
      .select('user_id')
      .eq('user_id', userId)
      .single();
    isSuperAdmin = !!data;
  } catch (e) {
    // Not a super admin
  }

  console.log('1. Super admin check:', isSuperAdmin ? '✅ YES' : '❌ NO');

  // Step 2: Get access record
  const { data: accessRecord, error } = await supabase
    .from('user_access')
    .select(`
      role,
      permissions,
      roles!inner(base_permissions)
    `)
    .eq('user_id', userId)
    .eq('resource_type', resourceType)
    .eq('resource_id', orgId)
    .single();

  console.log('2. Access record found:', accessRecord ? '✅ YES' : '❌ NO');
  if (error) console.log('   Error:', error.message);
  if (accessRecord) {
    console.log('   Role:', accessRecord.role);
    console.log('   Base permissions:', JSON.stringify(accessRecord.roles.base_permissions, null, 2));
    console.log('   Permission overrides:', accessRecord.permissions || 'None');
  }

  if (!accessRecord) return;

  // Step 3: Check permission logic manually
  const basePerms = accessRecord.roles.base_permissions;
  const finalPerms = { ...basePerms, ...(accessRecord.permissions || {}) };

  console.log('\n3. Final permissions:', JSON.stringify(finalPerms, null, 2));

  // Check the logic - this mimics the PostgreSQL function logic
  const hasResourceType = finalPerms.hasOwnProperty(resourceType);
  console.log('4. Has', resourceType, 'key:', hasResourceType ? '✅ YES' : '❌ NO');

  if (hasResourceType) {
    const resourcePerms = finalPerms[resourceType];
    const hasWildcard = Array.isArray(resourcePerms) && resourcePerms.includes('*');
    const hasSpecific = Array.isArray(resourcePerms) && resourcePerms.includes(action);

    console.log('5. Resource permissions for "' + resourceType + '":', resourcePerms);
    console.log('6. Has wildcard (*):', hasWildcard ? '✅ YES' : '❌ NO');
    console.log('7. Has specific action (' + action + '):', hasSpecific ? '✅ YES' : '❌ NO');
    console.log('8. Final result:', (hasWildcard || hasSpecific) ? '✅ ALLOWED' : '❌ DENIED');

    // Test the actual function call
    console.log('\n9. Testing actual RPC call...');
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('check_user_permission', {
        p_user_id: userId,
        p_resource_type: resourceType,
        p_resource_id: orgId,
        p_action: action
      });

    console.log('   RPC result:', rpcResult ? '✅ ALLOWED' : '❌ DENIED');
    if (rpcError) console.log('   RPC error:', rpcError.message);
  }
}

debugPermissions().catch(console.error);