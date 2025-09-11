#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Using service role key to bypass RLS
const supabaseUrl = 'https://quovvwrwyfkzhgqdeham.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkRoles() {
  console.log('🔍 Checking Actual Roles in Database...\n');
  
  try {
    // 1. Check app_users table for roles
    console.log('📊 APP_USERS TABLE - ROLES:');
    console.log('============================');
    const { data: appUsers, error: appError } = await supabase
      .from('app_users')
      .select('id, email, name, role, auth_user_id');
    
    if (appError) {
      console.log('❌ Error accessing app_users:', appError.message);
    } else if (appUsers && appUsers.length > 0) {
      // Count roles
      const roleCounts = {};
      appUsers.forEach(user => {
        roleCounts[user.role || 'null'] = (roleCounts[user.role || 'null'] || 0) + 1;
        console.log(`  - ${user.email || user.name || 'Unknown'}: ${user.role || 'NO ROLE'}`);
      });
      
      console.log('\n📊 ROLE DISTRIBUTION:');
      Object.entries(roleCounts).forEach(([role, count]) => {
        console.log(`  ${role}: ${count} users`);
      });
    } else {
      console.log('  No users found in app_users table');
    }
    
    // 2. Check user_organizations table for roles
    console.log('\n\n📊 USER_ORGANIZATIONS TABLE - ROLES:');
    console.log('=====================================');
    const { data: userOrgs, error: uoError } = await supabase
      .from('user_organizations')
      .select('*, organizations(name)');
    
    if (uoError) {
      console.log('❌ Error accessing user_organizations:', uoError.message);
    } else if (userOrgs && userOrgs.length > 0) {
      const orgRoleCounts = {};
      userOrgs.forEach(uo => {
        orgRoleCounts[uo.role || 'null'] = (orgRoleCounts[uo.role || 'null'] || 0) + 1;
        console.log(`  - User ${uo.user_id} in ${uo.organizations?.name}: ${uo.role}`);
      });
      
      console.log('\n📊 ORGANIZATION ROLE DISTRIBUTION:');
      Object.entries(orgRoleCounts).forEach(([role, count]) => {
        console.log(`  ${role}: ${count} assignments`);
      });
    } else {
      console.log('  No user-organization relationships found');
    }
    
    // 3. Check if there's a roles enum or constraint
    console.log('\n\n📊 DATABASE CONSTRAINTS/ENUMS:');
    console.log('===============================');
    
    // Check for enum types
    const { data: enumTypes, error: enumError } = await supabase.rpc('get_enum_types', {});
    if (!enumError && enumTypes) {
      console.log('Enum types found:', enumTypes);
    }
    
    // Check column information
    const { data: columnInfo } = await supabase
      .from('information_schema.columns')
      .select('table_name, column_name, data_type, column_default')
      .in('table_name', ['app_users', 'user_organizations'])
      .eq('column_name', 'role');
    
    if (columnInfo) {
      console.log('\nRole column definitions:');
      columnInfo.forEach(col => {
        console.log(`  ${col.table_name}.${col.column_name}: ${col.data_type}`);
      });
    }
    
    // 4. Check what roles are actually defined in the codebase vs database
    console.log('\n\n📊 DEFINED ROLES (from codebase):');
    console.log('==================================');
    console.log('  1. super_admin - Platform-wide admin');
    console.log('  2. account_owner - Organization owner');
    console.log('  3. sustainability_manager - Sustainability lead');
    console.log('  4. facility_manager - Building/facility manager');
    console.log('  5. analyst - Data analyst');
    console.log('  6. viewer - Read-only access');
    
    // 5. Check for custom role definitions
    console.log('\n\n📊 CHECKING FOR CUSTOM ROLE TABLES:');
    console.log('====================================');
    const { data: tables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .ilike('table_name', '%role%');
    
    if (tables && tables.length > 0) {
      console.log('Found role-related tables:');
      tables.forEach(t => console.log(`  - ${t.table_name}`));
    } else {
      console.log('  No dedicated role tables found');
    }
    
    console.log('\n✅ Role check complete!');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkRoles();