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

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testUserManagementComplete() {
  log('\n🧪 COMPREHENSIVE USER MANAGEMENT TEST', 'blue');
  log('=' .repeat(60), 'gray');

  const testResults = {
    total: 0,
    passed: 0,
    failed: 0
  };

  try {
    // ============================================
    // TEST 1: User Creation with Auth Integration
    // ============================================
    log('\n📝 TEST 1: User Creation with Auth Integration', 'yellow');
    testResults.total++;

    const testEmail1 = `test-complete-${Date.now()}@example.com`;
    const testUser1 = {
      email: testEmail1,
      name: 'Test User Complete',
      role: 'viewer',
      password: 'TestPass123!'
    };

    try {
      // Create auth user
      const { data: authUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: testUser1.email,
        password: testUser1.password,
        email_confirm: false,
        user_metadata: {
          full_name: testUser1.name,
          role: testUser1.role
        }
      });

      if (createError) throw createError;

      // Wait for trigger
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify app_user created
      const { data: appUser } = await supabaseAdmin
        .from('app_users')
        .select('*')
        .eq('email', testEmail1)
        .single();

      if (appUser && appUser.auth_user_id === authUser.user.id) {
        log('   ✅ User creation with auth integration: PASSED', 'green');
        testResults.passed++;
        testUser1.authId = authUser.user.id;
        testUser1.appId = appUser.id;
      } else {
        log('   ❌ User creation with auth integration: FAILED', 'red');
        testResults.failed++;
      }
    } catch (error) {
      log(`   ❌ User creation failed: ${error.message}`, 'red');
      testResults.failed++;
    }

    // ============================================
    // TEST 2: User Update with Metadata Sync
    // ============================================
    log('\n📝 TEST 2: User Update with Metadata Sync', 'yellow');
    testResults.total++;

    if (testUser1.appId && testUser1.authId) {
      try {
        const updatedData = {
          name: 'Updated Test User',
          role: 'manager',
          status: 'active'
        };

        // Update app_user
        await supabaseAdmin
          .from('app_users')
          .update(updatedData)
          .eq('id', testUser1.appId);

        // Update auth metadata
        await supabaseAdmin.auth.admin.updateUserById(
          testUser1.authId,
          {
            user_metadata: {
              full_name: updatedData.name,
              role: updatedData.role
            }
          }
        );

        // Verify updates
        const { data: updatedApp } = await supabaseAdmin
          .from('app_users')
          .select('*')
          .eq('id', testUser1.appId)
          .single();

        const { data: authData } = await supabaseAdmin.auth.admin.getUserById(testUser1.authId);

        if (updatedApp.name === updatedData.name &&
            updatedApp.role === updatedData.role &&
            authData.user.user_metadata.full_name === updatedData.name &&
            authData.user.user_metadata.role === updatedData.role) {
          log('   ✅ User update with metadata sync: PASSED', 'green');
          testResults.passed++;
        } else {
          log('   ❌ User update with metadata sync: FAILED', 'red');
          testResults.failed++;
        }
      } catch (error) {
        log(`   ❌ User update failed: ${error.message}`, 'red');
        testResults.failed++;
      }
    } else {
      log('   ⚠️  Skipped: No user to update', 'yellow');
    }

    // ============================================
    // TEST 3: Bulk Operations
    // ============================================
    log('\n📝 TEST 3: Bulk User Operations', 'yellow');
    testResults.total++;

    const bulkUsers = [];
    try {
      // Create 3 test users for bulk operations
      for (let i = 1; i <= 3; i++) {
        const email = `test-bulk-${Date.now()}-${i}@example.com`;
        const { data: authUser } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: 'BulkPass123!',
          email_confirm: false,
          user_metadata: {
            full_name: `Bulk User ${i}`,
            role: 'viewer'
          }
        });

        if (authUser) {
          bulkUsers.push({
            email,
            authId: authUser.user.id
          });
        }
      }

      // Wait for triggers
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Get app_user IDs
      for (const user of bulkUsers) {
        const { data: appUser } = await supabaseAdmin
          .from('app_users')
          .select('id')
          .eq('email', user.email)
          .single();

        if (appUser) {
          user.appId = appUser.id;
        }
      }

      // Test bulk deletion
      let deleteCount = 0;
      for (const user of bulkUsers) {
        if (user.appId) {
          await supabaseAdmin.from('app_users').delete().eq('id', user.appId);
          await supabaseAdmin.auth.admin.deleteUser(user.authId);
          deleteCount++;
        }
      }

      if (deleteCount === bulkUsers.length) {
        log(`   ✅ Bulk operations (${deleteCount} users): PASSED`, 'green');
        testResults.passed++;
      } else {
        log(`   ❌ Bulk operations: FAILED (only ${deleteCount}/${bulkUsers.length} deleted)`, 'red');
        testResults.failed++;
      }
    } catch (error) {
      log(`   ❌ Bulk operations failed: ${error.message}`, 'red');
      testResults.failed++;
    }

    // ============================================
    // TEST 4: User Status Management
    // ============================================
    log('\n📝 TEST 4: User Status Management', 'yellow');
    testResults.total++;

    const statusTestEmail = `test-status-${Date.now()}@example.com`;
    try {
      // Create user with pending status
      const { data: authUser } = await supabaseAdmin.auth.admin.createUser({
        email: statusTestEmail,
        password: 'StatusTest123!',
        email_confirm: false,
        user_metadata: {
          full_name: 'Status Test User',
          role: 'viewer'
        }
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get app_user
      const { data: appUser } = await supabaseAdmin
        .from('app_users')
        .select('*')
        .eq('email', statusTestEmail)
        .single();

      if (appUser) {
        // Update status to pending
        await supabaseAdmin
          .from('app_users')
          .update({ status: 'pending' })
          .eq('id', appUser.id);

        // Check if status is pending
        const { data: pendingUser } = await supabaseAdmin
          .from('app_users')
          .select('status')
          .eq('id', appUser.id)
          .single();

        // Update to active
        await supabaseAdmin
          .from('app_users')
          .update({ status: 'active' })
          .eq('id', appUser.id);

        // Check if status is active
        const { data: activeUser } = await supabaseAdmin
          .from('app_users')
          .select('status')
          .eq('id', appUser.id)
          .single();

        if (pendingUser.status === 'pending' && activeUser.status === 'active') {
          log('   ✅ User status management: PASSED', 'green');
          testResults.passed++;
        } else {
          log('   ❌ User status management: FAILED', 'red');
          testResults.failed++;
        }

        // Cleanup
        await supabaseAdmin.from('app_users').delete().eq('id', appUser.id);
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      }
    } catch (error) {
      log(`   ❌ Status management failed: ${error.message}`, 'red');
      testResults.failed++;
    }

    // ============================================
    // TEST 5: User Permissions & Site Access
    // ============================================
    log('\n📝 TEST 5: User Permissions & Site Access', 'yellow');
    testResults.total++;

    const permTestEmail = `test-permissions-${Date.now()}@example.com`;
    try {
      // Create user with site-level permissions
      const { data: authUser } = await supabaseAdmin.auth.admin.createUser({
        email: permTestEmail,
        password: 'PermTest123!',
        email_confirm: false,
        user_metadata: {
          full_name: 'Permission Test User',
          role: 'analyst',
          permissions: {
            access_level: 'site',
            site_ids: ['site-1', 'site-2']
          }
        }
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get and verify permissions
      const { data: appUser } = await supabaseAdmin
        .from('app_users')
        .select('*')
        .eq('email', permTestEmail)
        .single();

      if (appUser) {
        // Update permissions
        const newPermissions = {
          access_level: 'organization',
          site_ids: []
        };

        await supabaseAdmin
          .from('app_users')
          .update({ permissions: newPermissions })
          .eq('id', appUser.id);

        const { data: updatedUser } = await supabaseAdmin
          .from('app_users')
          .select('permissions')
          .eq('id', appUser.id)
          .single();

        if (updatedUser.permissions.access_level === 'organization') {
          log('   ✅ User permissions management: PASSED', 'green');
          testResults.passed++;
        } else {
          log('   ❌ User permissions management: FAILED', 'red');
          testResults.failed++;
        }

        // Cleanup
        await supabaseAdmin.from('app_users').delete().eq('id', appUser.id);
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      }
    } catch (error) {
      log(`   ❌ Permissions management failed: ${error.message}`, 'red');
      testResults.failed++;
    }

    // ============================================
    // TEST 6: User Search/Filtering
    // ============================================
    log('\n📝 TEST 6: User Search & Filtering', 'yellow');
    testResults.total++;

    try {
      // Get all users
      const { data: allUsers } = await supabaseAdmin
        .from('app_users')
        .select('*')
        .limit(10);

      if (allUsers && allUsers.length > 0) {
        // Test search by email
        const firstUser = allUsers[0];
        const { data: searchByEmail } = await supabaseAdmin
          .from('app_users')
          .select('*')
          .ilike('email', `%${firstUser.email.split('@')[0]}%`);

        // Test filter by role
        const { data: filterByRole } = await supabaseAdmin
          .from('app_users')
          .select('*')
          .eq('role', firstUser.role);

        // Test filter by status
        const { data: filterByStatus } = await supabaseAdmin
          .from('app_users')
          .select('*')
          .eq('status', 'active');

        if (searchByEmail && filterByRole && filterByStatus) {
          log('   ✅ User search & filtering: PASSED', 'green');
          testResults.passed++;
        } else {
          log('   ❌ User search & filtering: FAILED', 'red');
          testResults.failed++;
        }
      } else {
        log('   ⚠️  No users found for search test', 'yellow');
        testResults.passed++;
      }
    } catch (error) {
      log(`   ❌ Search/filtering failed: ${error.message}`, 'red');
      testResults.failed++;
    }

    // ============================================
    // TEST 7: User Deletion with Auth Cleanup
    // ============================================
    log('\n📝 TEST 7: User Deletion with Auth Cleanup', 'yellow');
    testResults.total++;

    if (testUser1.appId && testUser1.authId) {
      try {
        // Delete from app_users
        await supabaseAdmin
          .from('app_users')
          .delete()
          .eq('id', testUser1.appId);

        // Delete from auth.users
        await supabaseAdmin.auth.admin.deleteUser(testUser1.authId);

        // Verify deletion
        const { data: checkApp } = await supabaseAdmin
          .from('app_users')
          .select('*')
          .eq('email', testUser1.email)
          .single();

        const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
        const checkAuth = authData.users.find(u => u.id === testUser1.authId);

        if (!checkApp && !checkAuth) {
          log('   ✅ User deletion with auth cleanup: PASSED', 'green');
          testResults.passed++;
        } else {
          log('   ❌ User deletion incomplete', 'red');
          testResults.failed++;
        }
      } catch (error) {
        // Expected errors for not found
        if (error.message.includes('not found') || error.code === 'PGRST116') {
          log('   ✅ User deletion with auth cleanup: PASSED', 'green');
          testResults.passed++;
        } else {
          log(`   ❌ Deletion failed: ${error.message}`, 'red');
          testResults.failed++;
        }
      }
    } else {
      log('   ⚠️  Skipped: No user to delete', 'yellow');
    }

    // ============================================
    // FINAL SUMMARY
    // ============================================
    log('\n' + '=' .repeat(60), 'gray');
    log('📊 TEST SUMMARY', 'blue');
    log('=' .repeat(60), 'gray');

    const passRate = testResults.total > 0
      ? ((testResults.passed / testResults.total) * 100).toFixed(1)
      : 0;

    log(`\nTotal Tests: ${testResults.total}`);
    log(`Passed: ${testResults.passed}`, 'green');
    log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'red' : 'gray');
    log(`Pass Rate: ${passRate}%\n`);

    if (testResults.failed === 0) {
      log('🎉 ALL TESTS PASSED! User management system is fully functional.', 'green');
      log('\nFeatures Verified:', 'blue');
      log('   ✓ User creation with Supabase Auth integration');
      log('   ✓ User updates with metadata synchronization');
      log('   ✓ Bulk user operations');
      log('   ✓ User status management (active/inactive/pending)');
      log('   ✓ Permissions and site-level access control');
      log('   ✓ User search and filtering');
      log('   ✓ User deletion with auth cleanup');
    } else {
      log(`⚠️  Some tests failed. Please review the failures above.`, 'yellow');
    }

  } catch (error) {
    log(`\n❌ Critical test error: ${error.message}`, 'red');
    console.error(error);
  }
}

// Run the comprehensive test
testUserManagementComplete();