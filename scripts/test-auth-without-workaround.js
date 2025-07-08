#!/usr/bin/env node

/**
 * Test script to verify auth flow works without workarounds
 * This tests that the database trigger properly creates user profiles
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

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
    persistSession: false,
  },
});

async function testAuthFlow() {
  console.log('🧪 Testing auth flow without workarounds...\n');
  
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  const testFullName = 'Test User';
  
  try {
    // Step 1: Create auth user
    console.log('1️⃣ Creating auth user...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        full_name: testFullName,
        role: 'viewer',
        preferred_language: 'en',
        timezone: 'UTC',
      },
    });
    
    if (authError) {
      throw new Error(`Auth creation failed: ${authError.message}`);
    }
    
    console.log(`✅ Auth user created: ${authData.user.id}`);
    
    // Step 2: Wait for trigger to create profile
    console.log('\n2️⃣ Waiting for trigger to create profile...');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Step 3: Check if profile was created
    console.log('3️⃣ Checking for user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    if (profileError) {
      console.error(`❌ Profile not found: ${profileError.message}`);
      
      // Check trigger logs
      console.log('\n📋 Checking trigger logs...');
      const { data: logs, error: logsError } = await supabase
        .from('auth_trigger_logs')
        .select('*')
        .eq('user_id', authData.user.id)
        .order('created_at', { ascending: false });
      
      if (logs && logs.length > 0) {
        console.log('Trigger logs:');
        logs.forEach(log => {
          console.log(`  - ${log.event_type}: ${log.success ? '✅' : '❌'} ${log.error_message || ''}`);
          if (log.details) {
            console.log(`    Details: ${JSON.stringify(log.details, null, 2)}`);
          }
        });
      } else {
        console.log('  No trigger logs found');
      }
      
      throw new Error('Profile was not created by trigger');
    }
    
    console.log('✅ Profile created successfully!');
    console.log(`  - ID: ${profile.id}`);
    console.log(`  - Email: ${profile.email}`);
    console.log(`  - Full Name: ${profile.full_name}`);
    console.log(`  - Metadata: ${JSON.stringify(profile.metadata)}`);
    console.log(`  - Preferred Language: ${profile.preferred_language}`);
    console.log(`  - Timezone: ${profile.timezone}`);
    
    // Step 4: Test sign in
    console.log('\n4️⃣ Testing sign in...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });
    
    if (signInError) {
      throw new Error(`Sign in failed: ${signInError.message}`);
    }
    
    console.log('✅ Sign in successful!');
    
    // Step 5: Clean up test user
    console.log('\n5️⃣ Cleaning up test user...');
    const { error: deleteError } = await supabase.auth.admin.deleteUser(authData.user.id);
    
    if (deleteError) {
      console.warn(`⚠️  Failed to delete test user: ${deleteError.message}`);
    } else {
      console.log('✅ Test user deleted');
    }
    
    console.log('\n✨ All tests passed! Auth flow works correctly without workarounds.');
    
  } catch (error) {
    console.error(`\n❌ Test failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the test
testAuthFlow().catch(console.error);