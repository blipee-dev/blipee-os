/**
 * Script to inspect the actual database schema
 * This will help us understand the current state of tables and columns
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectSchema() {
  console.log('🔍 Inspecting Database Schema\n');
  console.log('=' .repeat(80));

  try {
    // 1. Check what tables exist
    console.log('\n📊 CHECKING EXISTING TABLES:');
    console.log('-'.repeat(40));

    const tables = [
      'user_profiles',
      'profiles',
      'app_users',
      'organization_members',
      'user_organizations',
      'user_access',
      'user_access_backup',
      'super_admins',
      'organizations',
      'auth_audit_log'
    ];

    for (const tableName of tables) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(0);

      if (!error) {
        console.log(`✅ Table exists: ${tableName}`);

        // Try to get one row to see structure
        try {
          const { data: sampleRow, error: sampleError } = await supabase
            .from(tableName)
            .select('*')
            .limit(1)
            .single();

          if (sampleRow) {
            console.log(`   Columns: ${Object.keys(sampleRow).join(', ')}`);
          }
        } catch (e) {
          // Ignore errors for single row fetch
        }
      } else if (error.code === '42P01') {
        console.log(`❌ Table does not exist: ${tableName}`);
      } else {
        console.log(`⚠️  Table ${tableName}: ${error.message}`);
      }
    }

    // 2. Detailed inspection of key tables
    console.log('\n📋 DETAILED TABLE INSPECTION:');
    console.log('-'.repeat(40));

    // Check organization_members structure
    console.log('\n🏢 organization_members table:');
    const { data: orgMembers, error: orgMembersError } = await supabase
      .from('organization_members')
      .select('*')
      .limit(1);

    if (!orgMembersError && orgMembers) {
      if (orgMembers.length > 0) {
        console.log('Sample row structure:');
        Object.entries(orgMembers[0]).forEach(([key, value]) => {
          console.log(`  - ${key}: ${typeof value} ${value === null ? '(null)' : ''}`);
        });
      } else {
        // Try to get column info from empty select
        const { data: emptySelect } = await supabase
          .from('organization_members')
          .select('*')
          .limit(0);
        console.log('Table exists but is empty');
      }
    } else if (orgMembersError) {
      console.log(`Error: ${orgMembersError.message}`);
    }

    // Check user_organizations structure
    console.log('\n👥 user_organizations table:');
    const { data: userOrgs, error: userOrgsError } = await supabase
      .from('user_organizations')
      .select('*')
      .limit(1);

    if (!userOrgsError && userOrgs) {
      if (userOrgs.length > 0) {
        console.log('Sample row structure:');
        Object.entries(userOrgs[0]).forEach(([key, value]) => {
          console.log(`  - ${key}: ${typeof value} ${value === null ? '(null)' : ''}`);
        });
      } else {
        console.log('Table exists but is empty');
      }
    } else if (userOrgsError) {
      console.log(`Error: ${userOrgsError.message}`);
    }

    // Check user_profiles structure
    console.log('\n👤 user_profiles table:');
    const { data: userProfiles, error: userProfilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);

    if (!userProfilesError && userProfiles) {
      if (userProfiles.length > 0) {
        console.log('Sample row structure:');
        Object.entries(userProfiles[0]).forEach(([key, value]) => {
          console.log(`  - ${key}: ${typeof value} ${value === null ? '(null)' : ''}`);
        });
      } else {
        console.log('Table exists but is empty');
      }
    } else if (userProfilesError) {
      console.log(`Error: ${userProfilesError.message}`);
    }

    // Check profiles structure
    console.log('\n👤 profiles table:');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (!profilesError && profiles) {
      if (profiles.length > 0) {
        console.log('Sample row structure:');
        Object.entries(profiles[0]).forEach(([key, value]) => {
          console.log(`  - ${key}: ${typeof value} ${value === null ? '(null)' : ''}`);
        });
      } else {
        console.log('Table exists but is empty');
      }
    } else if (profilesError) {
      console.log(`Error: ${profilesError.message}`);
    }

    // 3. Check for existing data
    console.log('\n📈 DATA STATISTICS:');
    console.log('-'.repeat(40));

    // Count users
    try {
      const { count: userCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });
      console.log(`User profiles count: ${userCount || 0}`);
    } catch (e) {
      console.log(`User profiles count: N/A`);
    }

    try {
      const { count: profileCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      console.log(`Profiles count: ${profileCount || 0}`);
    } catch (e) {
      console.log(`Profiles count: N/A`);
    }

    // Count organizations
    try {
      const { count: orgCount } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true });
      console.log(`Organizations count: ${orgCount || 0}`);
    } catch (e) {
      console.log(`Organizations count: N/A`);
    }

    // Count memberships
    try {
      const { count: memberCount } = await supabase
        .from('organization_members')
        .select('*', { count: 'exact', head: true });
      console.log(`Organization members count: ${memberCount || 0}`);
    } catch (e) {
      console.log(`Organization members count: N/A`);
    }

    try {
      const { count: userOrgCount } = await supabase
        .from('user_organizations')
        .select('*', { count: 'exact', head: true });
      console.log(`User organizations count: ${userOrgCount || 0}`);
    } catch (e) {
      console.log(`User organizations count: N/A`);
    }

    // 4. Check auth.users
    console.log('\n🔐 AUTH USERS:');
    console.log('-'.repeat(40));

    // Note: We can't directly query auth.users with service role in JS client
    // But we can check user_profiles which should mirror it
    const { data: allProfiles } = await supabase
      .from('user_profiles')
      .select('id, email, full_name')
      .limit(5);

    if (allProfiles && allProfiles.length > 0) {
      console.log('Sample users:');
      allProfiles.forEach(profile => {
        console.log(`  - ${profile.email} (${profile.id})`);
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ Schema inspection complete!');

  } catch (error) {
    console.error('❌ Error inspecting schema:', error);
  }
}

// Run the inspection
inspectSchema();