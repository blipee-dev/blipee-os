require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createDiogoAuth() {
  try {
    // Get the app user details
    const { data: appUser, error: appUserError } = await supabase
      .from('app_users')
      .select('*')
      .eq('email', 'diogo.veiga@plmj.pt')
      .single();

    if (appUserError || !appUser) {
      console.error('User not found in app_users');
      return;
    }

    console.log('Found app user:', appUser.name);

    // Try to create auth user with admin.createUser
    console.log('\nAttempting to create auth user...');

    // Use a temporary strong password
    const tempPassword = 'TempPass123!@#';

    const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
      email: 'diogo.veiga@plmj.pt',
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: appUser.name,
        display_name: appUser.name,
        organization_id: appUser.organization_id
      }
    });

    if (createError) {
      console.error('Error creating auth user:', createError.message);
      console.error('Full error:', createError);

      // The error might be because there's a deleted user or other constraint
      console.log('\n⚠️  Cannot create auth user due to database constraint.');
      console.log('This usually happens when:');
      console.log('1. A user was previously created and deleted');
      console.log('2. There are database constraints preventing creation');
      console.log('\nPossible solutions:');
      console.log('1. Go to Supabase Dashboard > Authentication > Users');
      console.log('2. Click "Add user" > "Create new user"');
      console.log('3. Enter email: diogo.veiga@plmj.pt');
      console.log('4. Set a password manually');
      console.log('5. After creation, copy the user ID');
      console.log('6. Run this SQL in Supabase SQL Editor:');
      console.log(`   UPDATE app_users SET auth_user_id = '<USER_ID_HERE>' WHERE email = 'diogo.veiga@plmj.pt';`);
      return;
    }

    console.log('✅ Auth user created successfully!');
    console.log('User ID:', authUser.user.id);

    // Update app_users with the auth_user_id
    const { error: updateError } = await supabase
      .from('app_users')
      .update({
        auth_user_id: authUser.user.id,
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('email', 'diogo.veiga@plmj.pt');

    if (updateError) {
      console.error('Error updating app_users:', updateError);
    } else {
      console.log('✅ Successfully linked auth user to app_users');
      console.log('\n=== User can login with ===');
      console.log('Email: diogo.veiga@plmj.pt');
      console.log('Password:', tempPassword);
      console.log('\n⚠️  User should change this password after first login!');
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createDiogoAuth();