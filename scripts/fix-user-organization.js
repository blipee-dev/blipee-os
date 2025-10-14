#!/usr/bin/env node

/**
 * Script to check and fix user organization linking
 * Usage: node scripts/fix-user-organization.js
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkAndFixUsers() {
  const testEmails = ['diogo.veiga@plmj.pt', 'diogo.goncalves@plmj.pt'];

  console.log('🔍 Checking user organization status...\n');

  // Step 1: Find the PLMJ organization
  const { data: plmjOrg, error: orgError } = await supabase
    .from('organizations')
    .select('id, name')
    .ilike('name', '%plmj%')
    .single();

  if (orgError || !plmjOrg) {
    console.error('❌ PLMJ organization not found');
    console.error('Error:', orgError);

    // List all organizations
    const { data: allOrgs } = await supabase
      .from('organizations')
      .select('id, name')
      .order('name');

    console.log('\n📋 Available organizations:');
    allOrgs?.forEach(org => {
      console.log(`   - ${org.name} (${org.id})`);
    });

    process.exit(1);
  }

  console.log(`✅ Found PLMJ organization: ${plmjOrg.name} (${plmjOrg.id})\n`);

  // Step 2: Check each test user
  for (const email of testEmails) {
    console.log(`\n👤 Checking user: ${email}`);

    // Get user record
    const { data: user, error: userError } = await supabase
      .from('app_users')
      .select('id, email, organization_id, role, name, status')
      .eq('email', email)
      .single();

    if (userError || !user) {
      console.error(`   ❌ User not found in app_users table`);
      console.error(`   Error:`, userError);
      continue;
    }

    console.log(`   📧 Email: ${user.email}`);
    console.log(`   🆔 User ID: ${user.id}`);
    console.log(`   🏢 Current Organization ID: ${user.organization_id || 'NULL'}`);
    console.log(`   👔 Role: ${user.role || 'NULL'}`);

    // Check if organization needs to be updated
    if (user.organization_id === plmjOrg.id) {
      console.log(`   ✅ User already linked to PLMJ organization`);
    } else {
      console.log(`   🔧 Updating user to PLMJ organization...`);

      const { error: updateError } = await supabase
        .from('app_users')
        .update({
          organization_id: plmjOrg.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error(`   ❌ Failed to update user`);
        console.error(`   Error:`, updateError);
      } else {
        console.log(`   ✅ Successfully linked user to PLMJ organization`);
      }
    }

    // Check if user needs a role
    if (!user.role || user.role === 'viewer') {
      console.log(`   🔧 Updating user role to facility_manager...`);

      const { error: roleError } = await supabase
        .from('app_users')
        .update({
          role: 'facility_manager',
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (roleError) {
        console.error(`   ❌ Failed to update role`);
        console.error(`   Error:`, roleError);
      } else {
        console.log(`   ✅ Successfully updated role to facility_manager`);
      }
    }
  }

  console.log('\n✅ User organization check complete!');
}

checkAndFixUsers().catch(console.error);
