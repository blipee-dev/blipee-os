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

async function testUserCreationFlow() {
  console.log('🧪 Testing User Creation Flow with Supabase Auth Integration\n');

  const testEmail = `test-${Date.now()}@example.com`;
  const testName = 'Test User';
  const testRole = 'viewer';

  console.log(`📧 Test Email: ${testEmail}`);
  console.log(`👤 Test Name: ${testName}`);
  console.log(`🔑 Test Role: ${testRole}\n`);

  try {
    // Step 1: Check initial state
    console.log('1️⃣ Checking initial state...');

    const { data: initialAppUser } = await supabaseAdmin
      .from('app_users')
      .select('*')
      .eq('email', testEmail)
      .single();

    const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
    const initialAuthUser = authData.users.find(u => u.email === testEmail);

    console.log(`   App User Exists: ${!!initialAppUser}`);
    console.log(`   Auth User Exists: ${!!initialAuthUser}\n`);

    // Step 2: Create user through our flow (mimicking API)
    console.log('2️⃣ Creating user through our flow...');

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-16) + 'Aa1!';

    // Create auth user
    const { data: authUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: tempPassword,
      email_confirm: false,
      user_metadata: {
        full_name: testName,
        display_name: testName,
        role: testRole
      }
    });

    if (createError) {
      console.log(`   ❌ Failed to create auth user: ${createError.message}`);
      return;
    }

    console.log(`   ✅ Auth user created with ID: ${authUser.user.id}`);

    // Wait for trigger to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 3: Verify both records exist
    console.log('\n3️⃣ Verifying integration...');

    const { data: finalAppUser } = await supabaseAdmin
      .from('app_users')
      .select('*')
      .eq('email', testEmail)
      .single();

    const { data: finalAuthData } = await supabaseAdmin.auth.admin.listUsers();
    const finalAuthUser = finalAuthData.users.find(u => u.email === testEmail);

    console.log(`   ✅ App User Created: ${!!finalAppUser}`);
    if (finalAppUser) {
      console.log(`      - ID: ${finalAppUser.id}`);
      console.log(`      - Auth User ID: ${finalAppUser.auth_user_id}`);
      console.log(`      - Name: ${finalAppUser.name}`);
      console.log(`      - Role: ${finalAppUser.role}`);
      console.log(`      - Status: ${finalAppUser.status}`);
    }

    console.log(`   ✅ Auth User Created: ${!!finalAuthUser}`);
    if (finalAuthUser) {
      console.log(`      - ID: ${finalAuthUser.id}`);
      console.log(`      - Email Confirmed: ${finalAuthUser.email_confirmed_at ? 'Yes' : 'No'}`);
    }

    // Step 4: Verify linkage
    console.log('\n4️⃣ Verifying linkage...');

    if (finalAppUser && finalAuthUser) {
      const isLinked = finalAppUser.auth_user_id === finalAuthUser.id;
      if (isLinked) {
        console.log(`   ✅ Users are properly linked!`);
        console.log(`      App User auth_user_id: ${finalAppUser.auth_user_id}`);
        console.log(`      Auth User ID: ${finalAuthUser.id}`);
      } else {
        console.log(`   ❌ Users are NOT linked!`);
        console.log(`      App User auth_user_id: ${finalAppUser.auth_user_id}`);
        console.log(`      Auth User ID: ${finalAuthUser.id}`);
      }
    } else {
      console.log(`   ❌ Cannot verify linkage - missing user(s)`);
    }

    // Step 5: Test invitation link generation
    console.log('\n5️⃣ Testing invitation link generation...');

    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email: testEmail,
      options: {
        data: {
          full_name: testName,
          role: testRole
        }
      }
    });

    if (resetData && !resetError) {
      console.log(`   ✅ Invitation link generated successfully`);
      console.log(`      Link (first 100 chars): ${resetData.properties.action_link.substring(0, 100)}...`);
    } else {
      console.log(`   ❌ Failed to generate invitation link: ${resetError?.message}`);
    }

    // Step 6: Clean up test user
    console.log('\n6️⃣ Cleaning up test user...');

    // Delete from app_users first (due to foreign key)
    if (finalAppUser) {
      const { error: deleteAppError } = await supabaseAdmin
        .from('app_users')
        .delete()
        .eq('id', finalAppUser.id);

      if (deleteAppError) {
        console.log(`   ⚠️  Failed to delete app_user: ${deleteAppError.message}`);
      } else {
        console.log(`   ✅ Deleted app_user`);
      }
    }

    // Delete from auth.users
    if (finalAuthUser) {
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(finalAuthUser.id);

      if (deleteAuthError) {
        console.log(`   ⚠️  Failed to delete auth user: ${deleteAuthError.message}`);
      } else {
        console.log(`   ✅ Deleted auth user`);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY:');
    console.log('='.repeat(60));

    const allTestsPassed = finalAppUser && finalAuthUser &&
                          (finalAppUser.auth_user_id === finalAuthUser.id) &&
                          resetData && !resetError;

    if (allTestsPassed) {
      console.log('✅ All tests passed!');
      console.log('   - Auth user creation: ✓');
      console.log('   - App user creation (via trigger): ✓');
      console.log('   - User linkage: ✓');
      console.log('   - Invitation link generation: ✓');
      console.log('\n🎉 The user creation flow is properly integrated with Supabase Auth!');
    } else {
      console.log('⚠️  Some tests failed. Review the output above.');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testUserCreationFlow();