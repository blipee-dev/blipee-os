require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkTestUser() {
  const testEmail = 'pedro@blipee.co';
  
  console.log('🔍 Checking for test user:', testEmail);
  console.log('=====================================\n');

  try {
    // 1. Check if user exists in auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
      return;
    }

    const testUser = authUsers?.users?.find(u => u.email === testEmail);
    
    if (testUser) {
      console.log('✅ User found in auth.users table');
      console.log('   ID:', testUser.id);
      console.log('   Email:', testUser.email);
      console.log('   Created:', new Date(testUser.created_at).toLocaleString());
      console.log('   Confirmed:', testUser.email_confirmed_at ? 'Yes' : 'No');
      console.log('   Last Sign In:', testUser.last_sign_in_at ? new Date(testUser.last_sign_in_at).toLocaleString() : 'Never');
      console.log('\n');
      
      // 2. Check if user has a profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', testUser.id)
        .single();
      
      if (profile) {
        console.log('✅ User profile found');
        console.log('   Name:', profile.full_name || profile.name || 'Not set');
        console.log('   Role:', profile.role);
        console.log('   Onboarding:', profile.onboarding_completed ? 'Completed' : 'Pending');
      } else {
        console.log('⚠️  No user profile found');
        if (profileError) console.log('   Error:', profileError.message);
      }
      console.log('\n');
      
      // 3. Check organization memberships
      const { data: memberships, error: memberError } = await supabase
        .from('organization_members')
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq('user_id', testUser.id);
      
      if (memberships && memberships.length > 0) {
        console.log('✅ Organization memberships found:', memberships.length);
        memberships.forEach(m => {
          console.log(`   - ${m.organization.name} (${m.role})`);
          console.log(`     Status: ${m.invitation_status}`);
          console.log(`     Is Owner: ${m.is_owner}`);
        });
      } else {
        console.log('⚠️  No organization memberships found');
        if (memberError) console.log('   Error:', memberError.message);
      }
      console.log('\n');
      
      // 4. Check app_users table
      const { data: appUser, error: appUserError } = await supabase
        .from('app_users')
        .select('*')
        .eq('auth_user_id', testUser.id)
        .single();
      
      if (appUser) {
        console.log('✅ App user record found');
        console.log('   Name:', appUser.name);
        console.log('   Email:', appUser.email);
        console.log('   Role:', appUser.role);
        console.log('   Status:', appUser.status);
        console.log('   Last Login:', appUser.last_login ? new Date(appUser.last_login).toLocaleString() : 'Never');
      } else {
        console.log('⚠️  No app_users record found');
        if (appUserError) console.log('   Error:', appUserError.message);
      }
      
    } else {
      console.log('❌ User NOT found in auth.users table');
      console.log('\n📝 Creating test user...');
      
      // Create the user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: 'Welcome123!',
        email_confirm: true,
        user_metadata: {
          full_name: 'Pedro Admin',
          role: 'account_owner'
        }
      });
      
      if (createError) {
        console.error('❌ Error creating user:', createError);
        return;
      }
      
      console.log('✅ User created successfully!');
      console.log('   ID:', newUser.user?.id);
      console.log('   Email:', newUser.user?.email);
      console.log('\n📧 Credentials:');
      console.log('   Email: pedro@blipee.co');
      console.log('   Password: Welcome123!');
      
      // Wait for trigger to create profile
      console.log('\n⏳ Waiting for profile creation trigger...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if profile was created
      const { data: newProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', newUser.user?.id)
        .single();
      
      if (newProfile) {
        console.log('✅ Profile created by trigger');
      } else {
        console.log('⚠️  Profile not created - trigger may be missing');
      }
      
      // Create or get an organization
      console.log('\n🏢 Setting up organization...');
      const { data: orgs } = await supabase
        .from('organizations')
        .select('*')
        .limit(1);
      
      let orgId;
      if (orgs && orgs.length > 0) {
        orgId = orgs[0].id;
        console.log('   Using existing organization:', orgs[0].name);
      } else {
        // Create an organization
        const { data: newOrg, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: 'Blipee Technologies',
            slug: 'blipee-tech',
            industry: 'Technology',
            employee_count: '50-100'
          })
          .select()
          .single();
        
        if (orgError) {
          console.error('❌ Error creating organization:', orgError);
        } else {
          orgId = newOrg.id;
          console.log('   Created organization:', newOrg.name);
        }
      }
      
      // Add user to organization
      if (orgId && newUser.user?.id) {
        const { error: memberError } = await supabase
          .from('organization_members')
          .insert({
            organization_id: orgId,
            user_id: newUser.user.id,
            role: 'account_owner',
            is_owner: true,
            invitation_status: 'accepted',
            joined_at: new Date().toISOString()
          });
        
        if (memberError) {
          console.error('❌ Error adding to organization:', memberError);
        } else {
          console.log('✅ Added to organization as account_owner');
        }
      }
      
      // Create app_users record
      if (newUser.user?.id) {
        const { error: appUserError } = await supabase
          .from('app_users')
          .insert({
            auth_user_id: newUser.user.id,
            name: 'Pedro Admin',
            email: testEmail,
            role: 'account_owner',
            status: 'active'
          });
        
        if (appUserError && appUserError.code !== '23505') { // Ignore duplicate key error
          console.error('⚠️  Error creating app_users record:', appUserError.message);
        } else {
          console.log('✅ Created app_users record');
        }
      }
    }
    
    console.log('\n=====================================');
    console.log('📋 Summary:');
    console.log('   Test user email: pedro@blipee.co');
    console.log('   Password: Welcome123!');
    console.log('   You can now sign in with these credentials');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkTestUser();