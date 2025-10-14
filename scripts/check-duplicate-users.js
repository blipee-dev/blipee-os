/**
 * Check for duplicate app_users entries
 * Usage: node scripts/check-duplicate-users.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkDuplicates() {
  try {
    console.log('\n🔍 Checking for duplicate app_users entries...\n');

    // Get all app_users
    const { data: users, error } = await supabaseAdmin
      .from('app_users')
      .select('id, email, auth_user_id, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    console.log(`📊 Total app_users records: ${users.length}\n`);

    // Check for duplicates by email
    const emailMap = new Map();
    const duplicateEmails = [];

    users.forEach(user => {
      if (user.email) {
        if (emailMap.has(user.email)) {
          emailMap.get(user.email).push(user);
        } else {
          emailMap.set(user.email, [user]);
        }
      }
    });

    emailMap.forEach((usersWithEmail, email) => {
      if (usersWithEmail.length > 1) {
        duplicateEmails.push({ email, users: usersWithEmail });
      }
    });

    // Check for duplicates by auth_user_id
    const authIdMap = new Map();
    const duplicateAuthIds = [];

    users.forEach(user => {
      if (user.auth_user_id) {
        if (authIdMap.has(user.auth_user_id)) {
          authIdMap.get(user.auth_user_id).push(user);
        } else {
          authIdMap.set(user.auth_user_id, [user]);
        }
      }
    });

    authIdMap.forEach((usersWithAuthId, authId) => {
      if (usersWithAuthId.length > 1) {
        duplicateAuthIds.push({ authId, users: usersWithAuthId });
      }
    });

    // Check for users without auth_user_id
    const usersWithoutAuth = users.filter(u => !u.auth_user_id);

    // Report findings
    console.log('═══════════════════════════════════════════════════');
    console.log('📋 Duplicate Analysis Results\n');

    if (duplicateEmails.length === 0 && duplicateAuthIds.length === 0 && usersWithoutAuth.length === 0) {
      console.log('✅ No Issues Found!\n');
      console.log('   • No duplicate emails');
      console.log('   • No duplicate auth_user_ids');
      console.log('   • All users have auth_user_id\n');
      console.log('🎉 Database integrity is excellent!\n');
      return;
    }

    let issuesFound = 0;

    if (duplicateEmails.length > 0) {
      issuesFound++;
      console.log(`⚠️  Duplicate Emails Found: ${duplicateEmails.length}\n`);
      duplicateEmails.forEach(({ email, users }) => {
        console.log(`   Email: ${email}`);
        console.log(`   Duplicates: ${users.length} records`);
        users.forEach((u, i) => {
          console.log(`      ${i + 1}. ID: ${u.id.substring(0, 8)}... | Auth ID: ${u.auth_user_id ? u.auth_user_id.substring(0, 8) + '...' : 'NONE'} | Created: ${new Date(u.created_at).toLocaleString()}`);
        });
        console.log('');
      });
    }

    if (duplicateAuthIds.length > 0) {
      issuesFound++;
      console.log(`❌ CRITICAL: Duplicate auth_user_ids Found: ${duplicateAuthIds.length}\n`);
      duplicateAuthIds.forEach(({ authId, users }) => {
        console.log(`   Auth User ID: ${authId.substring(0, 16)}...`);
        console.log(`   Duplicates: ${users.length} records`);
        users.forEach((u, i) => {
          console.log(`      ${i + 1}. ID: ${u.id.substring(0, 8)}... | Email: ${u.email} | Created: ${new Date(u.created_at).toLocaleString()}`);
        });
        console.log('');
      });
      console.log('   🔴 This should NOT happen with the new UNIQUE constraint!');
      console.log('   🔧 Action required: Review migration status\n');
    }

    if (usersWithoutAuth.length > 0) {
      issuesFound++;
      console.log(`⚠️  Users Without auth_user_id: ${usersWithoutAuth.length}\n`);
      usersWithoutAuth.slice(0, 10).forEach((u, i) => {
        console.log(`   ${i + 1}. ${u.email} (ID: ${u.id.substring(0, 8)}...) - Created: ${new Date(u.created_at).toLocaleString()}`);
      });
      if (usersWithoutAuth.length > 10) {
        console.log(`   ... and ${usersWithoutAuth.length - 10} more`);
      }
      console.log('');
    }

    console.log('═══════════════════════════════════════════════════');
    console.log(`\n📊 Summary: ${issuesFound} issue type(s) found\n`);

    if (duplicateAuthIds.length > 0) {
      console.log('🚨 CRITICAL: Duplicate auth_user_ids detected!');
      console.log('   This indicates the migration may not have been applied correctly.');
      console.log('   Please run: ./scripts/apply-race-condition-fix.sh\n');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

checkDuplicates();
