#!/usr/bin/env node

/**
 * Script to align existing roles to Simple RBAC system
 * Maps all legacy role names to the 4 Simple RBAC roles: owner, manager, member, viewer
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function alignRoles() {
  console.log('🔄 Starting role alignment to Simple RBAC system...\n');

  // First, check current role distribution
  console.log('📊 Current role distribution:');
  const { data: currentRoles, error: rolesError } = await supabase
    .from('app_users')
    .select('role')
    .order('role');

  if (rolesError) {
    console.error('Error fetching current roles:', rolesError);
    return;
  }

  const roleCounts = {};
  currentRoles.forEach(user => {
    roleCounts[user.role] = (roleCounts[user.role] || 0) + 1;
  });

  Object.entries(roleCounts).forEach(([role, count]) => {
    console.log(`  ${role}: ${count} users`);
  });

  console.log('\n🔄 Aligning roles to Simple RBAC (owner, manager, member, viewer)...\n');

  // Define the role mapping
  const roleMapping = {
    'account_owner': 'owner',
    'sustainability_manager': 'manager',
    'facility_manager': 'member',
    'analyst': 'member',
    'viewer': 'viewer',
    'stakeholder': 'viewer',
    'super_admin': 'owner', // Super admins get owner role, checked via super_admins table
    // Enterprise RBAC mappings
    'ORGANIZATION_OWNER': 'owner',
    'ORGANIZATION_ADMIN': 'manager',
    'SUSTAINABILITY_DIRECTOR': 'manager',
    'REGIONAL_MANAGER': 'manager',
    'SITE_MANAGER': 'member',
    'SITE_ANALYST': 'member',
    'SITE_OPERATOR': 'member',
    'AUDITOR': 'viewer',
    'STAKEHOLDER': 'viewer'
  };

  // Update each legacy role
  for (const [oldRole, newRole] of Object.entries(roleMapping)) {
    const { data, error } = await supabase
      .from('app_users')
      .update({ role: newRole })
      .eq('role', oldRole)
      .select();

    if (error) {
      console.error(`❌ Error updating role ${oldRole} to ${newRole}:`, error.message);
    } else if (data && data.length > 0) {
      console.log(`✅ Updated ${data.length} users from ${oldRole} to ${newRole}`);
    }
  }

  // Update any unknown roles to viewer (safest default)
  const validRoles = ['owner', 'manager', 'member', 'viewer'];
  const { data: unknownRoles, error: unknownError } = await supabase
    .from('app_users')
    .update({ role: 'viewer' })
    .not('role', 'in', `(${validRoles.join(',')})`)
    .select();

  if (unknownError) {
    console.error('❌ Error updating unknown roles:', unknownError.message);
  } else if (unknownRoles && unknownRoles.length > 0) {
    console.log(`✅ Updated ${unknownRoles.length} users with unknown roles to viewer`);
  }

  // Show final role distribution
  console.log('\n📊 Final role distribution:');
  const { data: finalRoles, error: finalError } = await supabase
    .from('app_users')
    .select('role')
    .order('role');

  if (finalError) {
    console.error('Error fetching final roles:', finalError);
    return;
  }

  const finalCounts = {};
  finalRoles.forEach(user => {
    finalCounts[user.role] = (finalCounts[user.role] || 0) + 1;
  });

  Object.entries(finalCounts).forEach(([role, count]) => {
    console.log(`  ${role}: ${count} users`);
  });

  console.log('\n✅ Role alignment complete!');
  console.log('The system now uses Simple RBAC with 4 roles: owner, manager, member, viewer');
}

alignRoles().catch(console.error);