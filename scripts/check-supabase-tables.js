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

async function checkTables() {
  console.log('🔍 Querying Supabase with Service Role Key (bypasses RLS)...\n');
  
  try {
    // 1. Check all organizations
    console.log('📊 ORGANIZATIONS TABLE:');
    console.log('------------------------');
    const { data: orgs, error: orgError, count: orgCount } = await supabase
      .from('organizations')
      .select('*', { count: 'exact' });
    
    if (orgError) {
      console.log('❌ Error:', orgError.message);
    } else {
      console.log(`Total organizations: ${orgCount || 0}`);
      if (orgs && orgs.length > 0) {
        orgs.forEach(org => {
          console.log(`\n  - ${org.name} (${org.slug})`);
          console.log(`    ID: ${org.id}`);
          console.log(`    Created: ${org.created_at}`);
          console.log(`    Industry: ${org.industry_primary || 'Not set'}`);
        });
      } else {
        console.log('  (No organizations found)');
      }
    }
    
    // 2. Check user_organizations
    console.log('\n\n📊 USER_ORGANIZATIONS TABLE:');
    console.log('-----------------------------');
    const { data: userOrgs, error: userOrgError, count: userOrgCount } = await supabase
      .from('user_organizations')
      .select('*, organizations(name)', { count: 'exact' });
    
    if (userOrgError) {
      console.log('❌ Error:', userOrgError.message);
    } else {
      console.log(`Total user-org relationships: ${userOrgCount || 0}`);
      if (userOrgs && userOrgs.length > 0) {
        userOrgs.forEach(uo => {
          console.log(`\n  - User: ${uo.user_id}`);
          console.log(`    Org: ${uo.organizations?.name || uo.organization_id}`);
          console.log(`    Role: ${uo.role}`);
        });
      } else {
        console.log('  (No user-organization relationships found)');
      }
    }
    
    // 3. Check users
    console.log('\n\n📊 AUTH.USERS TABLE:');
    console.log('---------------------');
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.log('❌ Error:', userError.message);
    } else {
      console.log(`Total users: ${users.users?.length || 0}`);
      if (users.users && users.users.length > 0) {
        users.users.forEach(user => {
          console.log(`\n  - ${user.email}`);
          console.log(`    ID: ${user.id}`);
          console.log(`    Created: ${user.created_at}`);
        });
      } else {
        console.log('  (No users found)');
      }
    }
    
    // 4. Check sites
    console.log('\n\n📊 SITES TABLE:');
    console.log('----------------');
    const { data: sites, error: sitesError, count: sitesCount } = await supabase
      .from('sites')
      .select('*', { count: 'exact' });
    
    if (sitesError) {
      console.log('❌ Error:', sitesError.message);
    } else {
      console.log(`Total sites: ${sitesCount || 0}`);
      if (sites && sites.length > 0) {
        sites.forEach(site => {
          console.log(`\n  - ${site.name}`);
          console.log(`    Org ID: ${site.organization_id}`);
        });
      } else {
        console.log('  (No sites found)');
      }
    }
    
    console.log('\n\n✅ Database check complete!');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkTables();