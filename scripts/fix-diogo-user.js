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

async function fixDiogoUser() {
  try {
    // Get the app user
    const { data: appUser, error: appUserError } = await supabase
      .from('app_users')
      .select('*')
      .eq('email', 'diogo.veiga@plmj.pt')
      .single();

    if (appUserError || !appUser) {
      console.error('User not found in app_users:', appUserError);
      return;
    }

    console.log('Found app user:', appUser.name);
    console.log('Auth User ID:', appUser.auth_user_id || 'None');

    // Check if user already has an auth account
    if (!appUser.auth_user_id) {
      console.log('\nUser does not have an auth account. Creating one...');

      // Send an invite which will create the auth account
      const { data: authUser, error: inviteError } = await supabase.auth.admin.inviteUserByEmail('diogo.veiga@plmj.pt', {
        data: {
          full_name: appUser.name,
          display_name: appUser.name,
          organization_id: appUser.organization_id
        }
      });

      if (inviteError) {
        console.error('Error creating auth account:', inviteError);

        // Check if the error is because user already exists
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(u => u.email === 'diogo.veiga@plmj.pt');

        if (existingUser) {
          console.log('\nAuth user already exists with ID:', existingUser.id);
          console.log('Linking to app_users...');

          // Update app_users with the auth_user_id
          const { error: updateError } = await supabase
            .from('app_users')
            .update({
              auth_user_id: existingUser.id,
              status: 'active',
              updated_at: new Date().toISOString()
            })
            .eq('email', 'diogo.veiga@plmj.pt');

          if (updateError) {
            console.error('Error updating app_users:', updateError);
          } else {
            console.log('✅ Successfully linked auth user to app_users');
            console.log('\nUser should now be able to reset their password using "Forgot Password" on the login page');
          }
        }
        return;
      }

      if (authUser) {
        console.log('✅ Auth account created with ID:', authUser.user.id);

        // Update app_users with the auth_user_id
        const { error: updateError } = await supabase
          .from('app_users')
          .update({
            auth_user_id: authUser.user.id,
            status: 'pending',
            updated_at: new Date().toISOString()
          })
          .eq('email', 'diogo.veiga@plmj.pt');

        if (updateError) {
          console.error('Error updating app_users:', updateError);
        } else {
          console.log('✅ Successfully linked auth user to app_users');
          console.log('\n📧 An invite email has been sent to diogo.veiga@plmj.pt');
          console.log('They can set their password using the link in the email');
        }
      }
    } else {
      console.log('\nUser already has an auth account.');
      console.log('They can reset their password using "Forgot Password" on the login page');
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

fixDiogoUser();