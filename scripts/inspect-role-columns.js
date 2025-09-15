/**
 * Script to find where roles are actually stored
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findRoleColumns() {
  console.log('🔍 Looking for role columns in database\n');
  console.log('=' .repeat(80));

  try {
    // 1. Check app_users table for role
    console.log('\n📊 APP_USERS TABLE:');
    console.log('-'.repeat(40));

    const { data: appUsers, error: appUsersError } = await supabase
      .from('app_users')
      .select('*')
      .limit(2);

    if (!appUsersError && appUsers && appUsers.length > 0) {
      console.log('Sample app_users row:');
      Object.entries(appUsers[0]).forEach(([key, value]) => {
        if (key === 'role' || key.includes('role')) {
          console.log(`  ✅ ${key}: ${value} (type: ${typeof value})`);
        }
      });

      if (appUsers[0].role) {
        console.log('\nSample role values:');
        appUsers.forEach(user => {
          console.log(`  - ${user.email}: role = "${user.role}"`);
        });
      }
    }

    // 2. Check organization_members for any role-like columns
    console.log('\n📊 ORGANIZATION_MEMBERS TABLE:');
    console.log('-'.repeat(40));

    const { data: orgMembers, error: orgMembersError } = await supabase
      .from('organization_members')
      .select('*')
      .limit(2);

    if (!orgMembersError && orgMembers) {
      if (orgMembers.length > 0) {
        console.log('All columns in organization_members:');
        Object.keys(orgMembers[0]).forEach(key => {
          console.log(`  - ${key}`);
        });

        // Check if custom_permissions might contain role info
        if (orgMembers[0].custom_permissions) {
          console.log('\nSample custom_permissions content:');
          console.log(JSON.stringify(orgMembers[0].custom_permissions, null, 2));
        }
      } else {
        console.log('Table is empty');
      }
    }

    // 3. Check user_access table
    console.log('\n📊 USER_ACCESS TABLE:');
    console.log('-'.repeat(40));

    const { data: userAccess, error: userAccessError } = await supabase
      .from('user_access')
      .select('*')
      .limit(5);

    if (!userAccessError && userAccess && userAccess.length > 0) {
      console.log('Sample user_access rows:');
      userAccess.forEach(access => {
        console.log(`  - User: ${access.user_id.substring(0, 8)}...`);
        console.log(`    Resource: ${access.resource_type} (${access.resource_id.substring(0, 8)}...)`);
        console.log(`    Role: "${access.role}"`);
      });
    }

    // 4. Check user_access_backup table
    console.log('\n📊 USER_ACCESS_BACKUP TABLE:');
    console.log('-'.repeat(40));

    const { data: userAccessBackup, error: backupError } = await supabase
      .from('user_access_backup')
      .select('*')
      .limit(5);

    if (!backupError && userAccessBackup && userAccessBackup.length > 0) {
      console.log('Sample user_access_backup rows:');
      userAccessBackup.forEach(backup => {
        console.log(`  - User: ${backup.user_id.substring(0, 8)}...`);
        console.log(`    Org: ${backup.organization_id.substring(0, 8)}...`);
        console.log(`    Role: "${backup.role}"`);
      });
    }

    // 5. Find where pedro's role is stored
    console.log('\n🔍 FINDING PEDRO\'S ROLE:');
    console.log('-'.repeat(40));

    const pedroId = 'd5708d9c-34fb-4c85-90ec-34faad9e2896';

    // Check app_users
    const { data: pedroAppUser } = await supabase
      .from('app_users')
      .select('*')
      .eq('auth_user_id', pedroId)
      .single();

    if (pedroAppUser) {
      console.log('Pedro in app_users:');
      console.log(`  - role: "${pedroAppUser.role}"`);
      console.log(`  - status: "${pedroAppUser.status}"`);
    }

    // Check organization_members
    const { data: pedroOrgMember } = await supabase
      .from('organization_members')
      .select('*')
      .eq('user_id', pedroId)
      .single();

    if (pedroOrgMember) {
      console.log('Pedro in organization_members:');
      console.log(`  - custom_permissions:`, pedroOrgMember.custom_permissions);
      console.log(`  - invitation_status: "${pedroOrgMember.invitation_status}"`);
    }

    // Check user_access
    const { data: pedroAccess } = await supabase
      .from('user_access')
      .select('*')
      .eq('user_id', pedroId);

    if (pedroAccess && pedroAccess.length > 0) {
      console.log('Pedro in user_access:');
      pedroAccess.forEach(access => {
        console.log(`  - ${access.resource_type}: role = "${access.role}"`);
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ Role inspection complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the inspection
findRoleColumns();