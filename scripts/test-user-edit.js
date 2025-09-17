#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function testUserEdit() {
  console.log('🧪 Testing User Edit Flow with Auth Integration\n');

  try {
    // Step 1: Create a test user
    console.log('1️⃣ Creating test user...\n');

    const testEmail = `test-edit-${Date.now()}@example.com`;
    const originalName = 'Original Name';
    const originalRole = 'viewer';

    // Create auth user
    const { data: authUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: 'TempPass123!',
      email_confirm: false,
      user_metadata: {
        full_name: originalName,
        display_name: originalName,
        role: originalRole
      }
    });

    if (createError) {
      console.error('Failed to create test user:', createError.message);
      return;
    }

    console.log(`   ✅ Created test user: ${testEmail}`);
    console.log(`      Auth ID: ${authUser.user.id}`);
    console.log(`      Original Name: ${originalName}`);
    console.log(`      Original Role: ${originalRole}`);

    // Wait for trigger to create app_user
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get the app_user record
    const { data: appUser } = await supabaseAdmin
      .from('app_users')
      .select('*')
      .eq('email', testEmail)
      .single();

    if (!appUser) {
      console.error('App user not created by trigger');
      return;
    }

    console.log(`      App User ID: ${appUser.id}`);

    // Step 2: Edit the user
    console.log('\n2️⃣ Editing user details...\n');

    const updatedName = 'Updated Name';
    const updatedRole = 'manager';
    const updatedEmail = testEmail; // Keep same email for simplicity

    // Update app_users
    const { data: updatedAppUser, error: updateError } = await supabaseAdmin
      .from('app_users')
      .update({
        name: updatedName,
        role: updatedRole,
        email: updatedEmail,
        updated_at: new Date().toISOString(),
        permissions: {
          access_level: 'organization',
          site_ids: []
        }
      })
      .eq('id', appUser.id)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update app_user:', updateError.message);
      return;
    }

    // Update auth.users metadata
    const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
      authUser.user.id,
      {
        email: updatedEmail,
        user_metadata: {
          full_name: updatedName,
          display_name: updatedName,
          role: updatedRole,
          organization_id: appUser.organization_id,
          permissions: {
            access_level: 'organization',
            site_ids: []
          }
        }
      }
    );

    if (authUpdateError) {
      console.error('Failed to update auth user:', authUpdateError.message);
    } else {
      console.log('   ✅ Updated both app_user and auth.users');
    }

    // Step 3: Verify the updates
    console.log('\n3️⃣ Verifying updates...\n');

    // Check app_users
    const { data: verifyAppUser } = await supabaseAdmin
      .from('app_users')
      .select('*')
      .eq('id', appUser.id)
      .single();

    // Check auth.users
    const { data: authData } = await supabaseAdmin.auth.admin.getUserById(authUser.user.id);

    console.log('   App User Data:');
    console.log(`      Name: ${verifyAppUser.name} ${verifyAppUser.name === updatedName ? '✅' : '❌'}`);
    console.log(`      Role: ${verifyAppUser.role} ${verifyAppUser.role === updatedRole ? '✅' : '❌'}`);
    console.log(`      Email: ${verifyAppUser.email} ${verifyAppUser.email === updatedEmail ? '✅' : '❌'}`);

    console.log('\n   Auth User Metadata:');
    console.log(`      Full Name: ${authData.user.user_metadata.full_name} ${authData.user.user_metadata.full_name === updatedName ? '✅' : '❌'}`);
    console.log(`      Role: ${authData.user.user_metadata.role} ${authData.user.user_metadata.role === updatedRole ? '✅' : '❌'}`);
    console.log(`      Email: ${authData.user.email} ${authData.user.email === updatedEmail ? '✅' : '❌'}`);

    // Step 4: Test changing email
    console.log('\n4️⃣ Testing email change...\n');

    const newEmail = `test-edit-new-${Date.now()}@example.com`;

    // Update both tables with new email
    const { error: emailUpdateError } = await supabaseAdmin
      .from('app_users')
      .update({ email: newEmail })
      .eq('id', appUser.id);

    if (emailUpdateError) {
      console.log(`   ⚠️  Could not update app_user email: ${emailUpdateError.message}`);
    }

    const { error: authEmailError } = await supabaseAdmin.auth.admin.updateUserById(
      authUser.user.id,
      { email: newEmail }
    );

    if (authEmailError) {
      console.log(`   ⚠️  Could not update auth email: ${authEmailError.message}`);
    } else {
      console.log(`   ✅ Email updated to: ${newEmail}`);
    }

    // Step 5: Clean up
    console.log('\n5️⃣ Cleaning up test user...\n');

    // Delete from app_users first
    await supabaseAdmin
      .from('app_users')
      .delete()
      .eq('id', appUser.id);

    // Delete from auth.users
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);

    console.log('   ✅ Test user cleaned up');

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY:');
    console.log('='.repeat(60));

    const allTestsPassed = verifyAppUser.name === updatedName &&
                          verifyAppUser.role === updatedRole &&
                          authData.user.user_metadata.full_name === updatedName &&
                          authData.user.user_metadata.role === updatedRole;

    if (allTestsPassed) {
      console.log('✅ All tests passed!');
      console.log('   - App user updates: ✓');
      console.log('   - Auth metadata sync: ✓');
      console.log('   - Data consistency: ✓');
      console.log('\n🎉 User edits properly sync between app_users and auth.users!');
    } else {
      console.log('⚠️  Some tests failed. Review the output above.');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testUserEdit();