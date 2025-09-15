require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuthentication() {
  const email = 'pedro@blipee.co';
  const password = 'Welcome123!';
  
  console.log('🔐 Testing authentication...');
  console.log('=====================================\n');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('\n');

  try {
    // 1. Test sign in
    console.log('🔑 Attempting sign in...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('❌ Sign in failed:', error.message);
      console.error('   Error code:', error.code);
      console.error('   Status:', error.status);
      return;
    }
    
    if (!data.user) {
      console.error('❌ No user returned from sign in');
      return;
    }
    
    console.log('✅ Sign in successful!');
    console.log('\n👤 User details:');
    console.log('   ID:', data.user.id);
    console.log('   Email:', data.user.email);
    console.log('   Confirmed:', data.user.email_confirmed_at ? 'Yes' : 'No');
    console.log('   Role:', data.user.user_metadata?.role || 'Not set');
    console.log('   Name:', data.user.user_metadata?.full_name || 'Not set');
    
    if (data.session) {
      console.log('\n🎫 Session:');
      console.log('   Access token:', data.session.access_token ? 'Present' : 'Missing');
      console.log('   Refresh token:', data.session.refresh_token ? 'Present' : 'Missing');
      console.log('   Expires at:', new Date(data.session.expires_at * 1000).toLocaleString());
    }
    
    // 2. Test getting session
    console.log('\n🔍 Getting current session...');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Error getting session:', sessionError.message);
    } else if (sessionData.session) {
      console.log('✅ Session retrieved successfully');
    } else {
      console.log('⚠️  No session found');
    }
    
    // 3. Test getting user
    console.log('\n👥 Getting current user...');
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ Error getting user:', userError.message);
    } else if (userData.user) {
      console.log('✅ User retrieved successfully');
    } else {
      console.log('⚠️  No user found');
    }
    
    // 4. Sign out
    console.log('\n🚪 Signing out...');
    const { error: signOutError } = await supabase.auth.signOut();
    
    if (signOutError) {
      console.error('❌ Error signing out:', signOutError.message);
    } else {
      console.log('✅ Signed out successfully');
    }
    
    console.log('\n=====================================');
    console.log('✅ Authentication test complete!');
    console.log('\n🎉 The authentication is working correctly.');
    console.log('You can now sign in at http://localhost:3000/login');
    console.log('with email: pedro@blipee.co and password: Welcome123!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testAuthentication();