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

async function checkAuthIntegration() {
  console.log('🔍 Checking Supabase Auth Integration...\n');

  try {
    // 1. Get all app_users
    const { data: appUsers, error: appError } = await supabaseAdmin
      .from('app_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (appError) {
      console.error('Error fetching app_users:', appError);
      return;
    }

    console.log(`📊 Found ${appUsers.length} users in app_users table\n`);

    // 2. Get all auth users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      console.error('Error fetching auth users:', authError);
      return;
    }

    const authUsers = authData.users;
    console.log(`🔐 Found ${authUsers.length} users in auth.users\n`);

    // 3. Check for mismatches
    console.log('📋 Checking for synchronization issues:\n');

    let issues = [];

    // Check app_users without auth accounts
    console.log('1️⃣ App users WITHOUT auth accounts:');
    const orphanedAppUsers = appUsers.filter(appUser => {
      if (!appUser.auth_user_id) {
        return true;
      }
      // Also check if the auth_user_id actually exists in auth.users
      const authExists = authUsers.some(authUser => authUser.id === appUser.auth_user_id);
      return !authExists;
    });

    if (orphanedAppUsers.length > 0) {
      console.log(`   ⚠️  Found ${orphanedAppUsers.length} app_users without valid auth accounts:`);
      orphanedAppUsers.forEach(user => {
        console.log(`      - ${user.email} (ID: ${user.id}, Auth ID: ${user.auth_user_id || 'NULL'})`);
        issues.push({
          type: 'orphaned_app_user',
          email: user.email,
          app_user_id: user.id,
          auth_user_id: user.auth_user_id
        });
      });
    } else {
      console.log('   ✅ All app_users have valid auth accounts');
    }

    // Check auth users without app_users
    console.log('\n2️⃣ Auth users WITHOUT app_users entries:');
    const orphanedAuthUsers = authUsers.filter(authUser => {
      return !appUsers.some(appUser => appUser.auth_user_id === authUser.id);
    });

    if (orphanedAuthUsers.length > 0) {
      console.log(`   ⚠️  Found ${orphanedAuthUsers.length} auth users without app_users entries:`);
      orphanedAuthUsers.forEach(user => {
        console.log(`      - ${user.email} (Auth ID: ${user.id})`);
        issues.push({
          type: 'orphaned_auth_user',
          email: user.email,
          auth_user_id: user.id
        });
      });
    } else {
      console.log('   ✅ All auth users have corresponding app_users entries');
    }

    // Check for email mismatches
    console.log('\n3️⃣ Checking for email mismatches:');
    const emailMismatches = appUsers.filter(appUser => {
      if (!appUser.auth_user_id) return false;
      const authUser = authUsers.find(a => a.id === appUser.auth_user_id);
      return authUser && authUser.email !== appUser.email;
    });

    if (emailMismatches.length > 0) {
      console.log(`   ⚠️  Found ${emailMismatches.length} email mismatches:`);
      emailMismatches.forEach(user => {
        const authUser = authUsers.find(a => a.id === user.auth_user_id);
        console.log(`      - App: ${user.email} vs Auth: ${authUser?.email}`);
        issues.push({
          type: 'email_mismatch',
          app_email: user.email,
          auth_email: authUser?.email,
          auth_user_id: user.auth_user_id
        });
      });
    } else {
      console.log('   ✅ All emails match between app_users and auth.users');
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY:');
    console.log('='.repeat(60));

    if (issues.length === 0) {
      console.log('✅ No synchronization issues found!');
      console.log('   All users are properly integrated with Supabase Auth.');
    } else {
      console.log(`⚠️  Found ${issues.length} synchronization issues that need attention.`);
      console.log('\n💡 Recommendations:');

      if (orphanedAppUsers.length > 0) {
        console.log('\n   For app_users without auth accounts:');
        console.log('   1. These users cannot log in');
        console.log('   2. Either delete them or create auth accounts for them');
        console.log('   3. Use the invitation flow to send them setup links');
      }

      if (orphanedAuthUsers.length > 0) {
        console.log('\n   For auth users without app_users:');
        console.log('   1. These users can authenticate but have no app data');
        console.log('   2. The trigger should create app_users on next login');
        console.log('   3. Or manually create app_users entries for them');
      }

      if (emailMismatches.length > 0) {
        console.log('\n   For email mismatches:');
        console.log('   1. Update app_users to match auth.users emails');
        console.log('   2. This could cause login issues');
      }
    }

    // Export issues for potential fixing
    if (issues.length > 0) {
      console.log('\n💾 Saving issues to verify-auth-issues.json for review...');
      const fs = require('fs');
      fs.writeFileSync('verify-auth-issues.json', JSON.stringify(issues, null, 2));
      console.log('   File saved. Review and run fix-auth-integration.js if needed.');
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the verification
checkAuthIntegration();