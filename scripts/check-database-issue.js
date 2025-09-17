require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabaseIssue() {
  try {
    console.log('=== Checking for database issues ===\n');

    // 1. Check if there are any triggers on auth.users that might be failing
    const { data: triggers, error: triggerError } = await supabase.rpc('get_auth_triggers', {}, {
      get: true
    }).catch(() => ({ data: null, error: 'Function not found' }));

    if (triggers) {
      console.log('Auth triggers found:', triggers);
    }

    // 2. Check for orphaned records in auth tables
    console.log('Checking for potential issues with diogo.veiga@plmj.pt...\n');

    // 3. Try a different email to see if the issue is specific to this email
    const testEmail = `test_${Date.now()}@example.com`;
    console.log(`Testing with a different email: ${testEmail}`);

    const { data: testUser, error: testError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'TestPassword123!',
      email_confirm: true
    });

    if (testError) {
      console.log('❌ Test user creation also failed:', testError.message);
      console.log('\nThis indicates a general database issue, not specific to diogo.veiga@plmj.pt');
    } else {
      console.log('✅ Test user created successfully');
      console.log('Test user ID:', testUser.user.id);

      // Clean up test user
      await supabase.auth.admin.deleteUser(testUser.user.id);
      console.log('Test user cleaned up');

      console.log('\n⚠️  The issue seems specific to diogo.veiga@plmj.pt email');
      console.log('This usually means there\'s a deleted user record blocking creation');
    }

    // 4. Check if we can see deleted users
    console.log('\n=== Checking auth schema for issues ===');

    // Try to query auth.users directly (this might fail due to permissions)
    const { data: authCheck, error: authError } = await supabase
      .from('auth.users')
      .select('id, email')
      .eq('email', 'diogo.veiga@plmj.pt');

    if (!authError && authCheck) {
      console.log('Found in auth.users:', authCheck);
    } else if (authError) {
      console.log('Cannot directly query auth.users (expected):', authError.message);
    }

    console.log('\n=== SOLUTION ===');
    console.log('Since we cannot create the user programmatically, you have two options:\n');
    console.log('Option 1: Use a different email address');
    console.log('  - Create the user with email like: diogo.veiga+1@plmj.pt');
    console.log('  - This will work around the constraint\n');

    console.log('Option 2: Contact Supabase Support');
    console.log('  - Ask them to fully remove the deleted auth record for diogo.veiga@plmj.pt');
    console.log('  - Or check what database constraint is preventing creation\n');

    console.log('Option 3: Use SQL Editor in Supabase Dashboard');
    console.log('  - Try running this query to check for issues:');
    console.log('    SELECT * FROM auth.users WHERE email = \'diogo.veiga@plmj.pt\';');
    console.log('  - If a deleted record exists, you might see it there');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkDatabaseIssue();