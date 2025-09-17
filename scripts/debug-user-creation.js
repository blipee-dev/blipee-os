#!/usr/bin/env node

// Debug script for user creation issues
// Run with: node scripts/debug-user-creation.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugUserCreation() {
  console.log('🔍 Debugging User Creation Issues\n');

  // Test email that's failing
  const testEmail = `test-${Date.now()}@example.com`;
  console.log('Testing with email:', testEmail);

  // 1. Check if email exists in app_users
  console.log('\n1. Checking app_users table...');
  const { data: appUser, error: appError } = await supabase
    .from('app_users')
    .select('*')
    .eq('email', testEmail)
    .single();

  if (appUser) {
    console.log('❌ Email already exists in app_users:', appUser);
  } else {
    console.log('✅ Email not in app_users');
  }

  // 2. Check if email exists in auth.users
  console.log('\n2. Checking auth.users...');
  const { data: authData } = await supabase.auth.admin.listUsers();
  const authUser = authData?.users?.find(u => u.email === testEmail);

  if (authUser) {
    console.log('❌ Email already exists in auth.users:', authUser.id);
  } else {
    console.log('✅ Email not in auth.users');
  }

  // 3. Check for any orphaned test users
  console.log('\n3. Checking for orphaned test users...');
  const { data: testUsers, error: testError } = await supabase
    .from('app_users')
    .select('*')
    .or('email.like.%test%,email.like.%demo%')
    .limit(10);

  if (testUsers && testUsers.length > 0) {
    console.log(`Found ${testUsers.length} test users:`);
    testUsers.forEach(u => {
      console.log(`  - ${u.email} (auth_id: ${u.auth_user_id || 'NONE'})`);
    });

    // Check which ones have no auth account
    const orphaned = testUsers.filter(u => !u.auth_user_id);
    if (orphaned.length > 0) {
      console.log(`\n⚠️  Found ${orphaned.length} orphaned users (no auth account)`);

      // Offer to clean them up
      console.log('\nCleaning up orphaned users...');
      for (const user of orphaned) {
        const { error: deleteError } = await supabase
          .from('app_users')
          .delete()
          .eq('email', user.email);

        if (deleteError) {
          console.error(`Failed to delete ${user.email}:`, deleteError.message);
        } else {
          console.log(`✅ Deleted orphaned user: ${user.email}`);
        }
      }
    }
  }

  // 4. Try to create a new test user
  console.log('\n4. Attempting to create new test user...');
  const newTestEmail = `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
  console.log('New test email:', newTestEmail);

  // First create auth user
  const { data: newAuthUser, error: authCreateError } = await supabase.auth.admin.createUser({
    email: newTestEmail,
    password: 'TestPassword123!',
    email_confirm: false,
    user_metadata: {
      full_name: 'Test User',
      organization_id: '77e8b513-dcdf-4b99-8bd3-abd437bb187d'
    }
  });

  if (authCreateError) {
    console.error('❌ Failed to create auth user:', authCreateError.message);
  } else {
    console.log('✅ Auth user created:', newAuthUser.user.id);

    // Then create app_users record
    const { data: newAppUser, error: appCreateError } = await supabase
      .from('app_users')
      .insert([{
        email: newTestEmail,
        name: 'Test User',
        auth_user_id: newAuthUser.user.id,
        organization_id: '77e8b513-dcdf-4b99-8bd3-abd437bb187d',
        role: 'viewer',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (appCreateError) {
      console.error('❌ Failed to create app_users record:', appCreateError.message);
      // Clean up auth user
      await supabase.auth.admin.deleteUser(newAuthUser.user.id);
    } else {
      console.log('✅ App user created:', newAppUser.id);
      console.log('\n🎉 SUCCESS! User created: ' + newTestEmail);
    }
  }

  // 5. List all app_users emails to see what's there
  console.log('\n5. Listing all app_users emails...');
  const { data: allUsers } = await supabase
    .from('app_users')
    .select('email, auth_user_id')
    .order('created_at', { ascending: false })
    .limit(20);

  if (allUsers) {
    console.log(`Found ${allUsers.length} recent users:`);
    allUsers.forEach(u => {
      console.log(`  - ${u.email} (auth: ${u.auth_user_id ? 'YES' : 'NO'})`);
    });
  }
}

// Run the debug directly
debugUserCreation().catch(console.error);