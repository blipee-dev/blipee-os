const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkDatabase() {
  console.log('🔍 Checking database structure and user data...\n');

  try {
    // 1. Check what tables exist
    console.log('📊 Available tables:');
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_tables_list')
      .select('*');

    if (tablesError) {
      // Try a different approach - query information_schema
      const { data: schemaData, error: schemaError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');

      if (schemaError) {
        console.log('   Could not list tables directly, trying specific tables...\n');
      } else if (schemaData) {
        console.log('   Tables found:', schemaData.map(t => t.table_name).join(', '));
      }
    }

    // 2. Check profiles table (common in Supabase projects)
    console.log('\n📋 Checking profiles table:');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'jose.pinto@plmj.pt')
      .single();

    if (profilesError) {
      if (profilesError.code === 'PGRST204') {
        console.log('   ❌ No profile found for jose.pinto@plmj.pt');
      } else if (profilesError.message.includes('relation') && profilesError.message.includes('does not exist')) {
        console.log('   ℹ️  profiles table does not exist');
      } else {
        console.log('   Error:', profilesError.message);
      }
    } else if (profiles) {
      console.log('   ✅ Found profile:', JSON.stringify(profiles, null, 2));
    }

    // 3. Check users table
    console.log('\n📋 Checking users table:');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'jose.pinto@plmj.pt')
      .single();

    if (usersError) {
      if (usersError.code === 'PGRST204' || usersError.code === 'PGRST116') {
        console.log('   ❌ No user found for jose.pinto@plmj.pt');
      } else if (usersError.message.includes('relation') && usersError.message.includes('does not exist')) {
        console.log('   ℹ️  users table does not exist');
      } else {
        console.log('   Error:', usersError.message);
      }
    } else if (users) {
      console.log('   ✅ Found user:', JSON.stringify(users, null, 2));
    }

    // 4. Check user_profiles table (another common pattern)
    console.log('\n📋 Checking user_profiles table:');
    const { data: userProfiles, error: userProfilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', 'jose.pinto@plmj.pt')
      .single();

    if (userProfilesError) {
      if (userProfilesError.code === 'PGRST204' || userProfilesError.code === 'PGRST116') {
        console.log('   ❌ No user_profile found');
      } else if (userProfilesError.message.includes('relation') && userProfilesError.message.includes('does not exist')) {
        console.log('   ℹ️  user_profiles table does not exist');
      } else {
        console.log('   Error:', userProfilesError.message);
      }
    } else if (userProfiles) {
      console.log('   ✅ Found user_profile:', JSON.stringify(userProfiles, null, 2));
    }

    // 5. Check organizations table
    console.log('\n🏢 Checking organizations table:');
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('*')
      .or('name.ilike.%plmj%,display_name.ilike.%plmj%');

    if (orgsError) {
      if (orgsError.message.includes('relation') && orgsError.message.includes('does not exist')) {
        console.log('   ℹ️  organizations table does not exist');
      } else {
        console.log('   Error:', orgsError.message);
      }
    } else if (orgs && orgs.length > 0) {
      console.log('   ✅ Found organizations:');
      orgs.forEach(org => {
        console.log(`      - ${org.name} (ID: ${org.id})`);
      });
    } else {
      console.log('   ❌ No PLMJ organization found');
    }

    // 6. Try to find user by checking auth.users via admin API
    console.log('\n🔐 Checking auth.users:');

    // First, let's try to get all users with email filter
    const { data: authData, error: authError } = await supabase
      .from('auth.users')
      .select('id, email, raw_user_meta_data')
      .eq('email', 'jose.pinto@plmj.pt')
      .single();

    if (authError) {
      // auth.users might not be directly accessible, try RPC
      console.log('   Direct access failed, trying alternative methods...');

      // Check if there's a user_organization view or function
      const { data: userOrg, error: userOrgError } = await supabase
        .rpc('get_user_organization', { user_email: 'jose.pinto@plmj.pt' });

      if (userOrgError) {
        console.log('   No custom function found');
      } else {
        console.log('   Custom function result:', userOrg);
      }
    } else if (authData) {
      console.log('   ✅ Found in auth.users:');
      console.log('      ID:', authData.id);
      console.log('      Email:', authData.email);
      console.log('      Metadata:', JSON.stringify(authData.raw_user_meta_data, null, 2));
    }

    // 7. Check for any table with 'user' in the name
    console.log('\n🔎 Looking for user-related tables...');
    const tableNames = [
      'profiles',
      'users',
      'user_profiles',
      'user_organizations',
      'user_organization',
      'members',
      'team_members',
      'employees'
    ];

    for (const tableName of tableNames) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (!error) {
        console.log(`   ✅ Table "${tableName}" exists`);

        // Try to find jose.pinto@plmj.pt in this table
        const { data: userData, error: userError } = await supabase
          .from(tableName)
          .select('*')
          .or('email.eq.jose.pinto@plmj.pt,user_email.eq.jose.pinto@plmj.pt')
          .single();

        if (!userError && userData) {
          console.log(`      🎯 Found user in ${tableName}:`, JSON.stringify(userData, null, 2));
        }
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

checkDatabase().catch(console.error);