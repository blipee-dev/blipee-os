const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUnusedTables() {
  console.log('🔍 Checking for unused tables to cleanup...');
  console.log('===============================================');

  // Tables we should keep (needed for current system)
  const keepTables = [
    'organizations',
    'sites',
    'organization_members', // Legacy but still used for now
    'super_admins',
    'app_users',
    'roles', // New simple RBAC
    'user_access', // New simple RBAC
    'access_groups', // New simple RBAC (optional)
    'user_group_access', // New simple RBAC (optional)
    'access_audit_log'
  ];

  // Tables that might exist from old systems and can be dropped
  const potentialDropTables = [
    'user_roles', // Old Enterprise RBAC
    'permission_overrides', // Old Enterprise RBAC
    'delegations', // Old Enterprise RBAC
    'user_access_backup', // Backup tables
    'groups' // Old Simple RBAC
  ];

  console.log('✅ Tables we KEEP (needed for new system):');
  let keepCount = 0;
  for (const tableName of keepTables) {
    const { error } = await supabase.from(tableName).select('id').limit(1);
    const exists = !error;
    console.log(`   ${exists ? '✅' : '❌'} ${tableName}${exists ? '' : ' (missing)'}`);
    if (exists) keepCount++;
  }

  console.log('');
  console.log('🗑️  Tables we can DROP (unused/legacy):');
  let canDrop = [];

  for (const tableName of potentialDropTables) {
    const { error } = await supabase.from(tableName).select('id').limit(1);
    if (!error) {
      // Check if it has data
      const { count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      canDrop.push({ name: tableName, count: count || 0 });
      console.log(`   ❌ ${tableName} - CAN BE DROPPED (${count || 0} rows)`);
    } else {
      console.log(`   ✅ ${tableName} - already removed`);
    }
  }

  if (canDrop.length > 0) {
    console.log('');
    console.log('📋 CLEANUP SQL SCRIPT:');
    console.log('=======================');
    console.log('-- Drop unused tables from old RBAC systems');
    console.log('-- Run this in Supabase SQL Editor');
    console.log('');

    canDrop.forEach(table => {
      console.log(`-- Drop ${table.name} (${table.count} rows)`);
      console.log(`DROP TABLE IF EXISTS ${table.name} CASCADE;`);
      console.log('');
    });

    console.log('-- Verify cleanup');
    console.log('SELECT table_name FROM information_schema.tables');
    console.log('WHERE table_schema = \'public\' AND table_type = \'BASE TABLE\';');

    console.log('');
    console.log('💾 BACKUP RECOMMENDATION:');
    console.log('Before dropping, consider backing up data if needed:');
    canDrop.forEach(table => {
      if (table.count > 0) {
        console.log(`-- Backup ${table.name}: SELECT * FROM ${table.name};`);
      }
    });

  } else {
    console.log('');
    console.log('✅ No unused tables found - database is clean!');
  }

  console.log('');
  console.log('📊 SUMMARY:');
  console.log(`   Keep: ${keepCount} tables`);
  console.log(`   Drop: ${canDrop.length} tables`);
  console.log(`   Total cleanup: ${canDrop.reduce((sum, t) => sum + t.count, 0)} rows`);
}

checkUnusedTables().catch(console.error);