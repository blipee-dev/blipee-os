#!/usr/bin/env node

/**
 * Script to check organization_members table for test users
 * Usage: node scripts/check-organization-members.js
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkOrganizationMembers() {
  const testEmails = ['diogo.veiga@plmj.pt', 'diogo.goncalves@plmj.pt'];

  console.log('🔍 Checking organization_members table...\n');

  // Get the PLMJ organization
  const { data: plmjOrg } = await supabase
    .from('organizations')
    .select('id, name')
    .ilike('name', '%plmj%')
    .single();

  if (!plmjOrg) {
    console.error('❌ PLMJ organization not found');
    process.exit(1);
  }

  console.log(`✅ PLMJ organization: ${plmjOrg.name} (${plmjOrg.id})\n`);

  for (const email of testEmails) {
    console.log(`\n👤 Checking user: ${email}`);

    // Get user from app_users
    const { data: appUser } = await supabase
      .from('app_users')
      .select('id, email, organization_id, role, auth_user_id')
      .eq('email', email)
      .single();

    if (!appUser) {
      console.error(`   ❌ User not found in app_users`);
      continue;
    }

    console.log(`   📧 Email: ${appUser.email}`);
    console.log(`   🆔 App User ID: ${appUser.id}`);
    console.log(`   🔐 Auth User ID: ${appUser.auth_user_id}`);
    console.log(`   🏢 Organization ID (app_users): ${appUser.organization_id}`);
    console.log(`   👔 Role (app_users): ${appUser.role}`);

    // Check if user exists in organization_members
    const { data: memberRecord, error: memberError } = await supabase
      .from('organization_members')
      .select('*')
      .eq('user_id', appUser.auth_user_id)
      .maybeSingle();

    if (memberError) {
      console.error(`   ❌ Error checking organization_members:`, memberError);
    } else if (!memberRecord) {
      console.log(`   ⚠️  NO RECORD IN organization_members table!`);
      console.log(`   🔧 Need to create organization_members record`);
    } else {
      console.log(`   ✅ Found in organization_members:`);
      console.log(`      Organization ID: ${memberRecord.organization_id}`);
      console.log(`      Role: ${memberRecord.role}`);
      console.log(`      Created: ${memberRecord.created_at}`);
    }
  }

  console.log('\n✅ Check complete!');
}

checkOrganizationMembers().catch(console.error);
