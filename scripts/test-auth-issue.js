require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testAuth() {
  console.log('🔐 Testing authentication for pedro@blipee.com...\n');

  try {
    // Try to sign in
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'pedro@blipee.com',
      password: 'Blipee2025!Secure#'
    });

    if (authError) {
      console.error('❌ Auth error:', authError.message);
      return;
    }

    console.log('✅ Supabase auth successful');
    console.log('   User ID:', authData.user.id);
    console.log('   Email:', authData.user.email);
    console.log('   Session:', !!authData.session);

    // Try to get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    console.log('\n📝 Profile fetch:');
    console.log('   Has profile:', !!profile);
    if (profileError) {
      console.log('   Error:', profileError.message);
    }
    if (profile) {
      console.log('   Name:', profile.full_name || profile.display_name);
      console.log('   Email:', profile.email);
    }

    // Try to get organization memberships
    const { data: memberships, error: membershipError } = await supabase
      .from('organization_members')
      .select(`
        *,
        organization:organizations(*)
      `)
      .eq('user_id', authData.user.id)
      .eq('invitation_status', 'accepted');

    console.log('\n🏢 Organization memberships:');
    console.log('   Count:', memberships?.length || 0);
    if (membershipError) {
      console.log('   Error:', membershipError.message);
    }
    if (memberships && memberships.length > 0) {
      memberships.forEach(m => {
        console.log(`   - ${m.organization.name} (${m.role})`);
      });
    }

    // Sign out
    await supabase.auth.signOut();
    console.log('\n✅ Test complete');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testAuth();