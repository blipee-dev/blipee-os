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

async function testUserInvitation() {
  const newUserEmail = 'test.user@blipee.co';
  const inviterUserId = '2d7ac97b-0afe-418e-a31f-447dcfd47587'; // Pedro's user ID
  
  console.log('📧 Testing User Invitation System');
  console.log('=====================================\n');
  console.log('Inviting user:', newUserEmail);
  console.log('\n');

  try {
    // 1. Get the first organization
    const { data: orgs } = await supabase
      .from('organizations')
      .select('*')
      .limit(1);
    
    if (!orgs || orgs.length === 0) {
      console.error('❌ No organizations found');
      return;
    }
    
    const orgId = orgs[0].id;
    console.log('🏢 Using organization:', orgs[0].name);
    console.log('\n');
    
    // 2. Check if user already exists
    console.log('🔍 Checking if user exists...');
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const existingUser = authUsers?.users?.find(u => u.email === newUserEmail);
    
    if (existingUser) {
      console.log('⚠️  User already exists, cleaning up...');
      
      // Remove from organization
      await supabase
        .from('organization_members')
        .delete()
        .eq('user_id', existingUser.id);
      
      // Delete the user
      await supabase.auth.admin.deleteUser(existingUser.id);
      
      console.log('✅ Cleaned up existing user\n');
    }
    
    // 3. Create new auth user with temporary password
    console.log('👤 Creating new auth user...');
    const tempPassword = `Temp-${Math.random().toString(36).slice(2)}-${Date.now()}`;
    
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: newUserEmail,
      password: tempPassword,
      email_confirm: false,
      user_metadata: {
        full_name: 'Test User',
        role: 'analyst',
        invited_by: inviterUserId,
        temp_password: true
      }
    });
    
    if (createError) {
      console.error('❌ Error creating user:', createError);
      return;
    }
    
    console.log('✅ User created');
    console.log('   ID:', newUser.user?.id);
    console.log('   Temp Password:', tempPassword);
    console.log('\n');
    
    // 4. Create user profile
    console.log('📝 Creating user profile...');
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: newUser.user?.id,
        email: newUserEmail,
        full_name: 'Test User',
        display_name: 'Test User',
        email_verified: false
      });
    
    if (profileError && profileError.code !== '23505') {
      console.error('❌ Error creating profile:', profileError);
    } else {
      console.log('✅ Profile created\n');
    }
    
    // 5. Create organization membership (invitation)
    console.log('🎫 Creating organization invitation...');
    const { data: membership, error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: orgId,
        user_id: newUser.user?.id,
        role: 'analyst',
        invitation_status: 'pending',
        invited_by: inviterUserId,
        invited_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (memberError) {
      console.error('❌ Error creating invitation:', memberError);
      return;
    }
    
    console.log('✅ Invitation created');
    console.log('   Status:', membership.invitation_status);
    console.log('   Role:', membership.role);
    console.log('\n');
    
    // 6. Send password reset email (invitation)
    console.log('📨 Sending invitation email...');
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      newUserEmail,
      {
        redirectTo: `http://localhost:3000/auth/accept-invitation?org=${orgId}`
      }
    );
    
    if (resetError) {
      console.error('❌ Error sending email:', resetError);
    } else {
      console.log('✅ Invitation email sent to:', newUserEmail);
    }
    
    // 7. Verify the invitation was created
    console.log('\n🔍 Verifying invitation...');
    const { data: invitations } = await supabase
      .from('organization_members')
      .select(`
        *,
        user:user_profiles(*)
      `)
      .eq('organization_id', orgId)
      .eq('invitation_status', 'pending');
    
    const userInvitation = invitations?.find(i => i.user_id === newUser.user?.id);
    
    if (userInvitation) {
      console.log('✅ Invitation verified');
      console.log('   User:', userInvitation.user?.email);
      console.log('   Status:', userInvitation.invitation_status);
      console.log('   Invited at:', new Date(userInvitation.invited_at).toLocaleString());
    } else {
      console.log('⚠️  Invitation not found in pending status');
    }
    
    console.log('\n=====================================');
    console.log('✅ User invitation test complete!\n');
    console.log('📋 Summary:');
    console.log('   - New user created:', newUserEmail);
    console.log('   - Profile created in user_profiles');
    console.log('   - Organization invitation created');
    console.log('   - Email sent with password reset link');
    console.log('\n👉 Next steps:');
    console.log('   1. Check email for invitation');
    console.log('   2. Click link to set password');
    console.log('   3. Will redirect to accept invitation page');
    console.log('   4. User can then access the organization');
    
    // 8. Create app_users record for testing
    console.log('\n📝 Creating app_users record for immediate testing...');
    const { error: appUserError } = await supabase
      .from('app_users')
      .insert({
        auth_user_id: newUser.user?.id,
        name: 'Test User',
        email: newUserEmail,
        role: 'analyst',
        status: 'pending'
      });
    
    if (appUserError && appUserError.code !== '23505') {
      console.error('⚠️  Error creating app_users record:', appUserError.message);
    } else {
      console.log('✅ Created app_users record');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testUserInvitation();