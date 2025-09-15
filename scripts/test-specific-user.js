require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Admin client for checking users
const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Regular client for authentication
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUser() {
  const email = 'pedro@blipee.com';
  const password = '350098Pb';
  
  console.log('🔍 Testing user:', email);
  console.log('=====================================\n');

  try {
    // 1. Check if user exists in auth.users
    console.log('📋 Checking if user exists...');
    const { data: authUsers, error: authError } = await adminSupabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error fetching users:', authError);
      return;
    }

    const user = authUsers?.users?.find(u => u.email === email);
    
    if (user) {
      console.log('✅ User found in auth.users');
      console.log('   ID:', user.id);
      console.log('   Email:', user.email);
      console.log('   Created:', new Date(user.created_at).toLocaleString());
      console.log('   Confirmed:', user.email_confirmed_at ? 'Yes' : 'No');
      console.log('   Last Sign In:', user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never');
      console.log('\n');
      
      // Check profile
      const { data: profile } = await adminSupabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        console.log('✅ User profile found');
        console.log('   Name:', profile.full_name || profile.display_name || 'Not set');
        console.log('   Email:', profile.email);
      } else {
        console.log('⚠️  No user profile found');
      }
      console.log('\n');
      
      // Check app_users
      const { data: appUser } = await adminSupabase
        .from('app_users')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();
      
      if (appUser) {
        console.log('✅ App user found');
        console.log('   Name:', appUser.name);
        console.log('   Role:', appUser.role);
        console.log('   Status:', appUser.status);
      } else {
        console.log('⚠️  No app_users record found');
      }
      console.log('\n');
      
      // Check organization memberships
      const { data: memberships } = await adminSupabase
        .from('organization_members')
        .select(`
          *,
          organization:organizations(name)
        `)
        .eq('user_id', user.id);
      
      if (memberships && memberships.length > 0) {
        console.log('✅ Organization memberships:', memberships.length);
        memberships.forEach(m => {
          console.log(`   - ${m.organization.name} (${m.role}, status: ${m.invitation_status})`);
        });
      } else {
        console.log('⚠️  No organization memberships');
      }
      
    } else {
      console.log('❌ User NOT found in auth.users');
      console.log('   This user does not exist in the authentication system');
      return;
    }
    
    // 2. Test authentication
    console.log('\n🔐 Testing authentication...');
    console.log('   Email:', email);
    console.log('   Password:', password);
    console.log('\n');
    
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (signInError) {
      console.error('❌ Authentication failed:', signInError.message);
      console.error('   Error code:', signInError.code);
      console.error('   Status:', signInError.status);
      
      if (signInError.message.includes('Invalid login credentials')) {
        console.log('\n🔑 The password is incorrect.');
        console.log('   The user exists but the password "' + password + '" is not valid.');
      }
    } else if (authData.user) {
      console.log('✅ Authentication successful!');
      console.log('\n🎉 You can sign in with:');
      console.log('   Email:', email);
      console.log('   Password:', password);
      
      // Sign out
      await supabase.auth.signOut();
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
  
  console.log('\n=====================================');
}

testUser();