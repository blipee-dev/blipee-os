#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function checkJWTHook() {
  console.log('🔍 Checking JWT Hook Function...\n');

  // Get a user to test with
  const { data: users, error: usersError } = await supabase
    .from('app_users')
    .select('auth_user_id, email')
    .limit(1);

  if (usersError || !users || users.length === 0) {
    console.log('⚠️  No users found in app_users table');
    console.log('   The function needs users to test with\n');
    return;
  }

  const testUser = users[0];
  console.log(`✅ Found test user: ${testUser.email}`);
  console.log(`   Auth User ID: ${testUser.auth_user_id}\n`);

  // Check if user has organization membership
  const { data: membership, error: membershipError } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', testUser.auth_user_id)
    .single();

  if (membershipError) {
    console.log('⚠️  User not found in organization_members');
    console.log('   Error:', membershipError.message);
    console.log('\n❌ THIS IS THE PROBLEM!');
    console.log('   The JWT hook expects users to be in organization_members table.');
    console.log('   Your user might be using app_users.id instead of auth_user_id.\n');

    // Check what's actually in organization_members
    const { data: allMembers } = await supabase
      .from('organization_members')
      .select('user_id, organization_id, role')
      .limit(5);

    if (allMembers && allMembers.length > 0) {
      console.log('   Sample organization_members records:');
      allMembers.forEach(m => {
        console.log(`     user_id: ${m.user_id}`);
      });
    }

    return;
  }

  console.log(`✅ User has organization membership:`);
  console.log(`   Organization ID: ${membership.organization_id}`);
  console.log(`   Role: ${membership.role}\n`);

  console.log('✅ JWT Hook should work!\n');
  console.log('The error might be transient. Try signing in again.');
}

checkJWTHook().catch(console.error);
