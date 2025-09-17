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

async function createDiogoUser() {
  try {
    // Use a stronger password that meets security requirements
    const password = 'Diogo@PLMJ2025!';

    // Check if user already exists in auth.users
    const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('Error listing users:', listError);
      return;
    }

    const existingAuthUser = authUsers.users.find(u => u.email === 'diogo.veiga@plmj.pt');

    if (existingAuthUser) {
      console.log('Found existing auth user with ID:', existingAuthUser.id);

      // Update the password
      const { data, error } = await supabase.auth.admin.updateUserById(
        existingAuthUser.id,
        {
          password: password,
          email_confirm: true
        }
      );

      if (error) {
        console.error('Error updating password:', error);
        return;
      }

      console.log('✅ Password updated successfully');

      // Make sure app_users is linked
      const { data: appUser } = await supabase
        .from('app_users')
        .select('*')
        .eq('email', 'diogo.veiga@plmj.pt')
        .single();

      if (appUser && !appUser.auth_user_id) {
        await supabase
          .from('app_users')
          .update({
            auth_user_id: existingAuthUser.id,
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('email', 'diogo.veiga@plmj.pt');

        console.log('✅ Linked auth user to app_users');
      }

      console.log('\n=== User can now login with ===');
      console.log('Email: diogo.veiga@plmj.pt');
      console.log('Password:', password);

    } else {
      console.log('Creating new auth user...');

      // Get app user details first
      const { data: appUser, error: appUserError } = await supabase
        .from('app_users')
        .select('*')
        .eq('email', 'diogo.veiga@plmj.pt')
        .single();

      if (appUserError || !appUser) {
        console.error('User not found in app_users:', appUserError);
        return;
      }

      // Create auth user directly with admin API
      const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
        email: 'diogo.veiga@plmj.pt',
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: appUser.name,
          display_name: appUser.name,
          organization_id: appUser.organization_id
        }
      });

      if (createError) {
        // If it fails, try with signUp
        console.log('Admin create failed, trying signup...');
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: 'diogo.veiga@plmj.pt',
          password: password,
          options: {
            data: {
              full_name: appUser.name,
              display_name: appUser.name,
              organization_id: appUser.organization_id
            }
          }
        });

        if (signUpError) {
          console.error('Error creating user:', signUpError);
          return;
        }

        if (authData.user) {
          console.log('✅ User created successfully with ID:', authData.user.id);

          // Update app_users with the auth_user_id
          await supabase
            .from('app_users')
            .update({
              auth_user_id: authData.user.id,
              status: 'active',
              updated_at: new Date().toISOString()
            })
            .eq('email', 'diogo.veiga@plmj.pt');

          console.log('\n=== User can now login with ===');
          console.log('Email: diogo.veiga@plmj.pt');
          console.log('Password:', password);
        }
      } else {
        console.log('✅ User created successfully with ID:', authUser.user.id);

        // Update app_users with the auth_user_id
        await supabase
          .from('app_users')
          .update({
            auth_user_id: authUser.user.id,
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('email', 'diogo.veiga@plmj.pt');

        console.log('\n=== User can now login with ===');
        console.log('Email: diogo.veiga@plmj.pt');
        console.log('Password:', password);
      }
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createDiogoUser();