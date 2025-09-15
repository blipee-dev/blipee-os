require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixTestUserProfile() {
  const userId = '2d7ac97b-0afe-418e-a31f-447dcfd47587';
  const testEmail = 'pedro@blipee.co';
  
  console.log('🔧 Fixing test user profile...');
  console.log('=====================================\n');

  try {
    // 1. Create the profile
    console.log('📝 Creating user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: userId,
        email: testEmail,
        full_name: 'Pedro Admin',
        display_name: 'Pedro Admin',
        email_verified: true
      })
      .select()
      .single();
    
    if (profileError) {
      if (profileError.code === '23505') {
        console.log('ℹ️  Profile already exists');
      } else {
        console.error('❌ Error creating profile:', profileError);
        return;
      }
    } else {
      console.log('✅ Profile created successfully');
    }
    
    // 2. Get the first organization
    const { data: orgs } = await supabase
      .from('organizations')
      .select('*')
      .limit(1);
    
    if (!orgs || orgs.length === 0) {
      console.log('⚠️  No organizations found');
      return;
    }
    
    const orgId = orgs[0].id;
    console.log('\n🏢 Using organization:', orgs[0].name);
    
    // 3. Add to organization
    console.log('👥 Adding to organization...');
    const { data: membership, error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: orgId,
        user_id: userId,
        role: 'account_owner',
        is_owner: true,
        invitation_status: 'accepted',
        joined_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (memberError) {
      if (memberError.code === '23505') {
        console.log('ℹ️  Already a member of this organization');
        
        // Update the membership to ensure it's correct
        const { error: updateError } = await supabase
          .from('organization_members')
          .update({
            role: 'account_owner',
            is_owner: true,
            invitation_status: 'accepted'
          })
          .eq('organization_id', orgId)
          .eq('user_id', userId);
        
        if (updateError) {
          console.error('❌ Error updating membership:', updateError);
        } else {
          console.log('✅ Updated membership to account_owner');
        }
      } else {
        console.error('❌ Error adding to organization:', memberError);
      }
    } else {
      console.log('✅ Added as account_owner');
    }
    
    // 4. Update app_users
    console.log('\n📝 Updating app_users record...');
    const { error: appUpdateError } = await supabase
      .from('app_users')
      .update({
        status: 'active',
        role: 'account_owner'
      })
      .eq('auth_user_id', userId);
    
    if (appUpdateError) {
      console.error('⚠️  Error updating app_users:', appUpdateError.message);
    } else {
      console.log('✅ Updated app_users record');
    }
    
    console.log('\n=====================================');
    console.log('✅ Test user setup complete!');
    console.log('\n📋 Login credentials:');
    console.log('   Email: pedro@blipee.co');
    console.log('   Password: Welcome123!');
    console.log('   Role: account_owner');
    console.log('   Organization:', orgs[0].name);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixTestUserProfile();