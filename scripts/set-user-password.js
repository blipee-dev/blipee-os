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

async function setUserPassword() {
  try {
    // First, check if the user exists in app_users
    const { data: appUser, error: appUserError } = await supabase
      .from('app_users')
      .select('*')
      .eq('email', 'diogo.veiga@plmj.pt')
      .single();

    if (appUserError || !appUser) {
      console.error('User not found in app_users:', appUserError);
      return;
    }

    console.log('Found user:', appUser.name, '(' + appUser.email + ')');

    // Check if user already has an auth account
    if (appUser.auth_user_id) {
      console.log('User already has auth account, updating password...');

      // Update existing user's password
      const { data, error } = await supabase.auth.admin.updateUserById(
        appUser.auth_user_id,
        {
          password: '123456',
          email_confirm: true
        }
      );

      if (error) {
        console.error('Error updating password:', error);
        return;
      }

      console.log('✅ Password updated successfully for existing user');
    } else {
      console.log('Creating new auth account...');

      // Create auth user with the password
      const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
        email: 'diogo.veiga@plmj.pt',
        password: '123456',
        email_confirm: true,
        user_metadata: {
          full_name: appUser.name,
          display_name: appUser.name,
          organization_id: appUser.organization_id
        }
      });

      if (createError) {
        console.error('Error creating auth user:', createError);
        return;
      }

      console.log('Auth user created with ID:', authUser.user.id);

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
        return;
      }

      console.log('✅ User account created successfully');
    }

    console.log('\n=== User can now login with ===');
    console.log('Email: diogo.veiga@plmj.pt');
    console.log('Password: 123456');

  } catch (error) {
    console.error('Error:', error);
  }
}

setUserPassword();