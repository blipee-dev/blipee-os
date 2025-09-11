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

async function checkSuperAdmin() {
  console.log('🔍 Checking Super Admin Status...\n');
  
  try {
    // 1. Check if super_admins table exists
    console.log('📊 SUPER_ADMINS TABLE:');
    console.log('----------------------');
    const { data: superAdmins, error: saError } = await supabase
      .from('super_admins')
      .select('*');
    
    if (saError) {
      if (saError.code === '42P01') {
        console.log('❌ Table does not exist - super admin system not initialized');
        console.log('   Run migration: 20250909_add_super_admin_system.sql');
      } else {
        console.log('❌ Error:', saError.message);
      }
    } else {
      console.log(`Total super admins: ${superAdmins?.length || 0}`);
      if (superAdmins && superAdmins.length > 0) {
        for (const sa of superAdmins) {
          // Get user details
          const { data: users } = await supabase.auth.admin.listUsers();
          const user = users.users?.find(u => u.id === sa.user_id);
          console.log(`\n  - User: ${user?.email || sa.user_id}`);
          console.log(`    ID: ${sa.user_id}`);
          console.log(`    Created: ${sa.created_at}`);
        }
      } else {
        console.log('  (No super admins found)');
      }
    }
    
    // 2. Check if pedro@blipee.com is super admin
    console.log('\n\n🔍 PEDRO@BLIPEE.COM STATUS:');
    console.log('----------------------------');
    
    // Get Pedro's user ID
    const { data: users } = await supabase.auth.admin.listUsers();
    const pedro = users.users?.find(u => u.email === 'pedro@blipee.com');
    
    if (pedro) {
      console.log(`User ID: ${pedro.id}`);
      
      // Check if Pedro is super admin
      const { data: pedroSA } = await supabase
        .from('super_admins')
        .select('*')
        .eq('user_id', pedro.id)
        .single();
      
      if (pedroSA) {
        console.log('✅ IS SUPER ADMIN');
        console.log(`   Since: ${pedroSA.created_at}`);
      } else {
        console.log('❌ NOT a super admin');
      }
      
      // Check organizations Pedro has access to
      console.log('\n📊 ORGANIZATIONS ACCESS:');
      const { data: pedroOrgs } = await supabase
        .from('user_organizations')
        .select('*, organizations(name)')
        .eq('user_id', pedro.id);
      
      if (pedroOrgs && pedroOrgs.length > 0) {
        pedroOrgs.forEach(org => {
          console.log(`  - ${org.organizations?.name} (Role: ${org.role})`);
        });
      } else {
        console.log('  (No direct organization memberships)');
      }
      
      // If super admin, should have access to ALL organizations
      if (pedroSA) {
        console.log('\n🌟 AS SUPER ADMIN, SHOULD SEE ALL:');
        const { data: allOrgs } = await supabase
          .from('organizations')
          .select('name, slug');
        
        allOrgs?.forEach(org => {
          console.log(`  - ${org.name} (${org.slug})`);
        });
      }
    } else {
      console.log('User pedro@blipee.com not found');
    }
    
    console.log('\n✅ Check complete!');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkSuperAdmin();