require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAccountOwnerAccess() {
  console.log('🔍 Checking Account Owner Access\n');
  console.log('=' .repeat(80));

  try {
    // Get all users
    const { data: users } = await supabase.auth.admin.listUsers();
    console.log('All users in system:');
    users?.users?.forEach(u => {
      console.log(`  - ${u.email} (ID: ${u.id})`);
    });

    // Find non-pedro users (account owners)
    const accountOwners = users?.users?.filter(u => !u.email.includes('pedro'));

    if (!accountOwners || accountOwners.length === 0) {
      console.log('\n❌ No account_owner users found');
      return;
    }

    for (const user of accountOwners) {
      console.log('\n' + '='.repeat(80));
      console.log(`\n📋 Checking user: ${user.email}`);
      console.log(`   ID: ${user.id}`);

      // Check user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      console.log(`\n1. User Profile:`);
      if (profile) {
        console.log(`   - Name: ${profile.first_name} ${profile.last_name}`);
        console.log(`   - Role: ${profile.role}`);
        console.log(`   - Organization ID: ${profile.organization_id}`);
      } else {
        console.log('   ❌ No profile found');
      }

      // Check organization_members
      const { data: orgMembers } = await supabase
        .from('organization_members')
        .select('*')
        .eq('user_id', user.id);

      console.log(`\n2. Organization Memberships: ${orgMembers?.length || 0}`);
      if (orgMembers && orgMembers.length > 0) {
        for (const m of orgMembers) {
          console.log(`   - Organization: ${m.organization_id}`);
          console.log(`     Role: ${m.role}`);

          // Get org name
          const { data: org } = await supabase
            .from('organizations')
            .select('name')
            .eq('id', m.organization_id)
            .single();
          if (org) {
            console.log(`     Name: ${org.name}`);
          }
        }
      } else {
        console.log('   ❌ No organization memberships');
      }

      // Check user_access
      const { data: userAccess } = await supabase
        .from('user_access')
        .select('*')
        .eq('user_id', user.id);

      console.log(`\n3. User Access Records: ${userAccess?.length || 0}`);
      if (userAccess && userAccess.length > 0) {
        userAccess.forEach(a => {
          console.log(`   - Resource Type: ${a.resource_type}`);
          console.log(`     Resource ID: ${a.resource_id}`);
          console.log(`     Role: ${a.role}`);
        });
      } else {
        console.log('   ⚠️  No user_access records found');
        console.log('   This is why the user cannot see sites!');
      }

      // Check sites for the user's organization
      if (profile?.organization_id) {
        const { data: sites } = await supabase
          .from('sites')
          .select('id, name, organization_id')
          .eq('organization_id', profile.organization_id);

        console.log(`\n4. Sites in User's Organization: ${sites?.length || 0}`);
        if (sites && sites.length > 0) {
          sites.forEach(s => {
            console.log(`   - ${s.name} (ID: ${s.id})`);
          });
        } else {
          console.log('   ❌ No sites found in organization');
        }
      }

      // Check if we need to create user_access record
      if ((!userAccess || userAccess.length === 0) && profile?.organization_id) {
        console.log('\n⚠️  ISSUE FOUND: User has no user_access record!');
        console.log('   This user needs a user_access record to see sites.');
        console.log(`   Suggested fix: Add user_access record with:`);
        console.log(`   - user_id: ${user.id}`);
        console.log(`   - resource_type: 'organization'`);
        console.log(`   - resource_id: ${profile.organization_id}`);
        console.log(`   - role: ${profile.role || 'account_owner'}`);
      }
    }

    console.log('\n' + '=' .repeat(80));
    console.log('✅ Analysis complete');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAccountOwnerAccess();