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

async function checkAndSetPassword() {
  try {
    // First, check if user exists in auth.users by email
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
          password: '123456',
          email_confirm: true
        }
      );

      if (error) {
        console.error('Error updating password:', error);
        return;
      }

      console.log('✅ Password updated successfully');

      // Update app_users with the auth_user_id if not already set
      const { data: appUser } = await supabase
        .from('app_users')
        .select('*')
        .eq('email', 'diogo.veiga@plmj.pt')
        .single();

      if (appUser && !appUser.auth_user_id) {
        const { error: updateError } = await supabase
          .from('app_users')
          .update({
            auth_user_id: existingAuthUser.id,
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('email', 'diogo.veiga@plmj.pt');

        if (updateError) {
          console.error('Error updating app_users:', updateError);
        } else {
          console.log('✅ Linked auth user to app_users');
        }
      }
    } else {
      console.log('No existing auth user found, creating new one...');

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

      // Try creating with sign up instead
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: 'diogo.veiga@plmj.pt',
        password: '123456',
        options: {
          data: {
            full_name: appUser.name,
            display_name: appUser.name,
            organization_id: appUser.organization_id
          }
        }
      });

      if (signUpError) {
        console.error('Error creating user via signup:', signUpError);

        // If signup fails, try admin create with different approach
        console.log('Trying alternative creation method...');

        const { data: authUser, error: createError } = await supabase.auth.admin.inviteUserByEmail('diogo.veiga@plmj.pt', {
          data: {
            full_name: appUser.name,
            display_name: appUser.name,
            organization_id: appUser.organization_id
          }
        });

        if (createError) {
          console.error('Error with invite:', createError);
          return;
        }

        if (authUser) {
          // Now update the password
          const { error: pwError } = await supabase.auth.admin.updateUserById(
            authUser.user.id,
            {
              password: '123456',
              email_confirm: true
            }
          );

          if (pwError) {
            console.error('Error setting password:', pwError);
            return;
          }

          console.log('✅ User created via invite and password set');
        }
      } else if (authData.user) {
        console.log('✅ User created successfully with ID:', authData.user.id);

        // Update app_users with the auth_user_id
        const { error: updateError } = await supabase
          .from('app_users')
          .update({
            auth_user_id: authData.user.id,
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('email', 'diogo.veiga@plmj.pt');

        if (updateError) {
          console.error('Error updating app_users:', updateError);
        }
      }
    }

    console.log('\n=== User can now login with ===');
    console.log('Email: diogo.veiga@plmj.pt');
    console.log('Password: 123456');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkAndSetPassword();