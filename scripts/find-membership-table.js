const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findMembershipTable() {
  console.log('🔍 Finding the correct membership table...\n');

  // Method 1: Try to query potential tables directly
  const potentialTables = [
    'team_members',
    'organization_members',
    'user_organizations',
    'organization_users',
    'members',
    'memberships',
    'user_roles',
    'organization_roles'
  ];

  console.log('Checking potential membership tables:');
  for (const table of potentialTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (!error) {
        console.log(`✅ ${table} exists - checking structure...`);
        
        // Try to get column info
        const { data: sample, error: sampleError } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (sample && sample.length > 0) {
          console.log(`   Columns: ${Object.keys(sample[0]).join(', ')}`);
          
          // Check if it has the expected columns
          const hasUserId = Object.keys(sample[0]).includes('user_id');
          const hasOrgId = Object.keys(sample[0]).includes('organization_id');
          const hasRole = Object.keys(sample[0]).includes('role');
          
          if (hasUserId && hasOrgId) {
            console.log(`   ⭐ This looks like the membership table!`);
            console.log(`   Has user_id: ${hasUserId}`);
            console.log(`   Has organization_id: ${hasOrgId}`);
            console.log(`   Has role: ${hasRole}`);
          }
        }
      } else if (error.message.includes('does not exist')) {
        console.log(`❌ ${table} does not exist`);
      } else {
        console.log(`⚠️  ${table} - Error: ${error.message}`);
      }
    } catch (e) {
      console.log(`❌ ${table} - Error: ${e.message}`);
    }
  }

  // Method 2: Check organizations table for clues
  console.log('\n\nChecking organizations table structure:');
  try {
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .limit(1);
    
    if (org && org.length > 0) {
      console.log('Organizations table columns:', Object.keys(org[0]).join(', '));
    }
  } catch (e) {
    console.log('Error checking organizations:', e.message);
  }

  // Method 3: Try to find tables with both user_id and organization_id columns
  console.log('\n\nLooking for tables with both user_id and organization_id columns...');
  
  // This is a bit hacky but we'll try common table names
  const allTables = [
    'profiles',
    'users',
    'user_profiles',
    'organization_members',
    'team_members',
    'members',
    'user_organizations',
    'user_roles',
    'roles',
    'permissions',
    'user_permissions',
    'organization_users',
    'employees',
    'staff',
    'personnel'
  ];

  const candidateTables = [];
  
  for (const table of allTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('user_id, organization_id')
        .limit(1);
      
      if (!error) {
        candidateTables.push(table);
        console.log(`✅ ${table} has both user_id and organization_id columns!`);
      }
    } catch (e) {
      // Silently continue
    }
  }

  console.log('\n\n📊 SUMMARY');
  console.log('===========');
  if (candidateTables.length > 0) {
    console.log('Found these tables that link users to organizations:');
    candidateTables.forEach(t => console.log(`  - ${t}`));
    console.log('\nUse one of these tables in your RLS policies.');
  } else {
    console.log('❌ Could not find a table that links users to organizations.');
    console.log('You may need to create one or check the database schema documentation.');
  }
}

findMembershipTable().catch(console.error);