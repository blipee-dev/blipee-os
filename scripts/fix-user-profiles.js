#!/usr/bin/env node

/**
 * Script to create missing user_profiles records and sync to organization_members
 * Usage: node scripts/fix-user-profiles.js
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

async function fixUserProfiles() {
  const testEmails = ['diogo.veiga@plmj.pt', 'diogo.goncalves@plmj.pt'];

  console.log('🔄 Fixing user profiles and organization members...\n');

  const plmjOrg = await supabase
    .from('organizations')
    .select('id, name')
    .ilike('name', '%plmj%')
    .single();

  if (!plmjOrg.data) {
    console.error('❌ PLMJ organization not found');
    process.exit(1);
  }

  console.log(`✅ Found organization: ${plmjOrg.data.name} (${plmjOrg.data.id})\n`);

  for (const email of testEmails) {
    console.log(`\n👤 Processing user: ${email}`);

    // Get user from app_users
    const { data: appUser } = await supabase
      .from('app_users')
      .select('id, email, name, organization_id, role, auth_user_id, status, phone, avatar_url')
      .eq('email', email)
      .single();

    if (!appUser) {
      console.error(`   ❌ User not found in app_users`);
      continue;
    }

    console.log(`   📧 Email: ${appUser.email}`);
    console.log(`   🔐 Auth User ID: ${appUser.auth_user_id}`);

    // Step 1: Check if user_profiles record exists
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', appUser.auth_user_id)
      .maybeSingle();

    if (!existingProfile) {
      console.log(`   🔧 Creating user_profiles record...`);

      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: appUser.auth_user_id,
          email: appUser.email,
          full_name: appUser.name,
          avatar_url: appUser.avatar_url,
          phone: appUser.phone,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.error(`   ❌ Failed to create user_profiles record`);
        console.error(`   Error:`, profileError);
        continue;
      } else {
        console.log(`   ✅ Created user_profiles record`);
      }
    } else {
      console.log(`   ✅ user_profiles record already exists`);
    }

    // Step 2: Check if organization_members record exists
    const { data: existingMember } = await supabase
      .from('organization_members')
      .select('*')
      .eq('user_id', appUser.auth_user_id)
      .maybeSingle();

    if (!existingMember) {
      console.log(`   🔧 Creating organization_members record...`);

      // Map role
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

      const { data: newMember, error: memberError } = await supabase
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

      if (memberError) {
        console.error(`   ❌ Failed to create organization_members record`);
        console.error(`   Error:`, memberError);
      } else {
        console.log(`   ✅ Created organization_members record`);
        console.log(`      Organization: ${newMember.organization_id}`);
        console.log(`      Role: ${newMember.role}`);
      }
    } else {
      console.log(`   ✅ organization_members record already exists`);
    }
  }

  console.log('\n\n✅ Fix complete! Verifying...\n');

  // Final verification
  for (const email of testEmails) {
    console.log(`\n📊 Verification for ${email}:`);

    const { data: appUser } = await supabase
      .from('app_users')
      .select('auth_user_id')
      .eq('email', email)
      .single();

    if (!appUser) continue;

    // Check user_profiles
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('email, full_name')
      .eq('id', appUser.auth_user_id)
      .single();

    if (profile) {
      console.log(`   ✅ user_profiles: ${profile.full_name} (${profile.email})`);
    } else {
      console.log(`   ❌ user_profiles: MISSING`);
    }

    // Check organization_members
    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id, role, invitation_status')
      .eq('user_id', appUser.auth_user_id)
      .single();

    if (member) {
      console.log(`   ✅ organization_members: ${member.role} (${member.invitation_status})`);
    } else {
      console.log(`   ❌ organization_members: MISSING`);
    }
  }

  console.log('\n\n🎉 All done! Users should now be able to access the application.');
}

fixUserProfiles().catch(console.error);
