#!/usr/bin/env node

/**
 * Script to sync app_users to organization_members table
 * This fixes users who have organization_id in app_users but no record in organization_members
 * Usage: node scripts/sync-organization-members.js
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

async function syncOrganizationMembers() {
  const testEmails = ['diogo.veiga@plmj.pt', 'diogo.goncalves@plmj.pt'];

  console.log('🔄 Syncing users to organization_members table...\n');

  for (const email of testEmails) {
    console.log(`\n👤 Processing user: ${email}`);

    // Get user from app_users
    const { data: appUser, error: appUserError } = await supabase
      .from('app_users')
      .select('id, email, organization_id, role, auth_user_id')
      .eq('email', email)
      .single();

    if (appUserError || !appUser) {
      console.error(`   ❌ User not found in app_users`);
      console.error(`   Error:`, appUserError);
      continue;
    }

    if (!appUser.organization_id) {
      console.error(`   ❌ User has no organization_id in app_users`);
      continue;
    }

    console.log(`   📧 Email: ${appUser.email}`);
    console.log(`   🔐 Auth User ID: ${appUser.auth_user_id}`);
    console.log(`   🏢 Organization ID: ${appUser.organization_id}`);
    console.log(`   👔 Role: ${appUser.role}`);

    // Check if already exists in organization_members
    const { data: existingMember } = await supabase
      .from('organization_members')
      .select('*')
      .eq('user_id', appUser.auth_user_id)
      .maybeSingle();

    if (existingMember) {
      console.log(`   ✅ Already exists in organization_members`);
      continue;
    }

    // Create organization_members record
    console.log(`   🔧 Creating organization_members record...`);

    // Map app_users role to organization_members role enum
    const roleMapping = {
      'owner': 'account_owner',
      'admin': 'account_owner',
      'manager': 'sustainability_manager',
      'sustainability_manager': 'sustainability_manager',
      'facility_manager': 'facility_manager',
      'analyst': 'analyst',
      'viewer': 'viewer',
      'user': 'viewer'
    };

    const mappedRole = roleMapping[appUser.role?.toLowerCase()] || 'viewer';
    console.log(`   📝 Mapping role: ${appUser.role} → ${mappedRole}`);

    const { data: newMember, error: insertError } = await supabase
      .from('organization_members')
      .insert({
        user_id: appUser.auth_user_id,
        organization_id: appUser.organization_id,
        role: mappedRole,
        invitation_status: 'accepted',
        joined_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error(`   ❌ Failed to create organization_members record`);
      console.error(`   Error:`, insertError);
    } else {
      console.log(`   ✅ Successfully created organization_members record`);
      console.log(`      ID: ${newMember.id}`);
      console.log(`      Organization: ${newMember.organization_id}`);
      console.log(`      Role: ${newMember.role}`);
    }
  }

  console.log('\n✅ Sync complete!');
  console.log('\n🔍 Verifying organization_members records...\n');

  // Verify all users now have organization_members records
  for (const email of testEmails) {
    const { data: appUser } = await supabase
      .from('app_users')
      .select('auth_user_id, email')
      .eq('email', email)
      .single();

    if (!appUser) continue;

    const { data: memberRecord } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', appUser.auth_user_id)
      .single();

    if (memberRecord) {
      console.log(`✅ ${email} - organization_members record exists`);
    } else {
      console.log(`❌ ${email} - organization_members record MISSING`);
    }
  }
}

syncOrganizationMembers().catch(console.error);
