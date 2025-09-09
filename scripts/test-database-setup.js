#!/usr/bin/env node
/**
 * Test script to verify database setup for role and invitation system
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDatabaseSetup() {
  console.log('🧪 Testing Database Setup for Role and Invitation System\n');

  try {
    // Test 1: Check if super_admins table exists and has data
    console.log('1. Testing super_admins table...');
    const { data: superAdmins, error: superAdminsError } = await supabase
      .from('super_admins')
      .select('*');
    
    if (superAdminsError) {
      console.error(`❌ Error querying super_admins: ${superAdminsError.message}`);
    } else {
      console.log(`✅ super_admins table exists with ${superAdmins.length} records`);
      if (superAdmins.length > 0) {
        console.log(`   📋 Super admin found for user_id: ${superAdmins[0].user_id}`);
      }
    }

    // Test 2: Check if user_profiles table exists
    console.log('\n2. Testing user_profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);
    
    if (profilesError) {
      console.error(`❌ Error querying user_profiles: ${profilesError.message}`);
    } else {
      console.log(`✅ user_profiles table exists`);
    }

    // Test 3: Check if organization_creation_invitations table exists
    console.log('\n3. Testing organization_creation_invitations table...');
    const { data: invitations, error: invitationsError } = await supabase
      .from('organization_creation_invitations')
      .select('id')
      .limit(1);
    
    if (invitationsError) {
      console.error(`❌ Error querying organization_creation_invitations: ${invitationsError.message}`);
    } else {
      console.log(`✅ organization_creation_invitations table exists`);
    }

    // Test 4: Check if helper functions exist
    console.log('\n4. Testing helper functions...');
    
    // Test is_super_admin function
    const { data: functionTest, error: functionError } = await supabase
      .rpc('is_super_admin', { user_uuid: '00000000-0000-0000-0000-000000000000' });
    
    if (functionError) {
      console.error(`❌ Error testing is_super_admin function: ${functionError.message}`);
    } else {
      console.log(`✅ is_super_admin function exists and returns: ${functionTest}`);
    }

    // Test 5: Test invitation validation function
    console.log('\n5. Testing invitation validation function...');
    const { data: validationTest, error: validationError } = await supabase
      .rpc('validate_organization_invitation_token', { invitation_token: 'test-token' });
    
    if (validationError) {
      console.error(`❌ Error testing validate_organization_invitation_token: ${validationError.message}`);
    } else {
      console.log(`✅ validate_organization_invitation_token function exists`);
      if (validationTest && validationTest.length > 0) {
        console.log(`   📋 Returns: valid=${validationTest[0].valid}, error_code=${validationTest[0].error_code}`);
      }
    }

    // Test 6: Check organizations table for compatibility
    console.log('\n6. Testing organizations table compatibility...');
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('id, name, setup_step, onboarding_completed')
      .limit(1);
    
    if (orgsError) {
      console.error(`❌ Error querying organizations: ${orgsError.message}`);
    } else {
      console.log(`✅ organizations table is compatible with invitation system`);
    }

    console.log('\n🎉 Database setup test completed!');
    
  } catch (error) {
    console.error('❌ Unexpected error during testing:', error.message);
    process.exit(1);
  }
}

testDatabaseSetup();