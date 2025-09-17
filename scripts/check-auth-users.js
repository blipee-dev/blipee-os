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

async function checkAuthUsers() {
  try {
    // List all auth users
    const { data: authUsers, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error('Error listing users:', error);
      return;
    }

    console.log(`\nTotal auth users: ${authUsers.users.length}`);

    // Check for diogo.veiga@plmj.pt
    const diogoAuth = authUsers.users.find(u => u.email === 'diogo.veiga@plmj.pt');

    if (diogoAuth) {
      console.log('\n=== Found diogo.veiga@plmj.pt in auth.users ===');
      console.log('ID:', diogoAuth.id);
      console.log('Email:', diogoAuth.email);
      console.log('Created:', diogoAuth.created_at);
      console.log('Email Confirmed:', diogoAuth.email_confirmed_at);
      console.log('Last Sign In:', diogoAuth.last_sign_in_at);
      console.log('Metadata:', JSON.stringify(diogoAuth.user_metadata, null, 2));

      // Now check app_users
      const { data: appUser } = await supabase
        .from('app_users')
        .select('*')
        .eq('email', 'diogo.veiga@plmj.pt')
        .single();

      if (appUser) {
        console.log('\n=== App User Status ===');
        console.log('Has auth_user_id:', !!appUser.auth_user_id);
        console.log('Auth ID matches:', appUser.auth_user_id === diogoAuth.id);

        if (!appUser.auth_user_id || appUser.auth_user_id !== diogoAuth.id) {
          console.log('\n⚠️  Need to link auth user to app_users');
          console.log('Run: UPDATE app_users SET auth_user_id = \'' + diogoAuth.id + '\' WHERE email = \'diogo.veiga@plmj.pt\'');
        }
      }
    } else {
      console.log('\n❌ diogo.veiga@plmj.pt NOT found in auth.users');

      // Check app_users
      const { data: appUser } = await supabase
        .from('app_users')
        .select('*')
        .eq('email', 'diogo.veiga@plmj.pt')
        .single();

      if (appUser) {
        console.log('✅ User exists in app_users but not in auth.users');
        console.log('Need to create auth account');
      }
    }

    // List all PLMJ users for reference
    console.log('\n=== All PLMJ email addresses in auth.users ===');
    const plmjUsers = authUsers.users.filter(u => u.email?.includes('@plmj'));
    plmjUsers.forEach(u => {
      console.log(`- ${u.email} (ID: ${u.id})`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

checkAuthUsers();