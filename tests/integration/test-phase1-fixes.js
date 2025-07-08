#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testPhase1Fixes() {
  console.log('🧪 Testing Phase 1 Security & Auth Fixes\n');
  
  const results = {
    authSignup: false,
    fileUploadAuth: false,
    aiChatAuth: false,
    securityHeaders: false
  };

  // Test 1: Auth Signup Flow
  console.log('1️⃣  Testing Auth Signup Flow...');
  try {
    // Generate unique test email
    const testEmail = `test-${Date.now()}@blipee-test.com`;
    const testPassword = 'TestPassword123!';
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test User',
          role: 'viewer'
        }
      }
    });
    
    if (error) {
      console.log('   ❌ Signup failed:', error.message);
    } else {
      console.log('   ✅ Signup successful!');
      console.log('   User ID:', data.user?.id);
      results.authSignup = true;
      
      // Clean up test user
      if (data.user?.id) {
        await supabase.auth.signOut();
      }
    }
  } catch (err) {
    console.log('   ❌ Signup error:', err.message);
  }

  // Test 2: File Upload Requires Auth
  console.log('\n2️⃣  Testing File Upload Auth Requirement...');
  try {
    const response = await fetch('http://localhost:3000/api/files/upload', {
      method: 'POST',
      body: new FormData()
    });
    
    if (response.status === 401) {
      console.log('   ✅ File upload correctly requires authentication!');
      results.fileUploadAuth = true;
    } else {
      console.log('   ❌ File upload should require auth but returned:', response.status);
    }
  } catch (err) {
    console.log('   ⚠️  Could not test file upload (server may not be running)');
  }

  // Test 3: AI Chat Requires Auth
  console.log('\n3️⃣  Testing AI Chat Auth Requirement...');
  try {
    const response = await fetch('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Hello' })
    });
    
    if (response.status === 401) {
      console.log('   ✅ AI chat correctly requires authentication!');
      results.aiChatAuth = true;
    } else {
      console.log('   ❌ AI chat should require auth but returned:', response.status);
    }
  } catch (err) {
    console.log('   ⚠️  Could not test AI chat (server may not be running)');
  }

  // Test 4: Security Headers
  console.log('\n4️⃣  Testing Security Headers...');
  try {
    const response = await fetch('http://localhost:3000');
    const headers = response.headers;
    
    const securityHeaders = [
      'x-frame-options',
      'x-content-type-options',
      'x-xss-protection',
      'referrer-policy',
      'content-security-policy'
    ];
    
    let allPresent = true;
    for (const header of securityHeaders) {
      if (headers.get(header)) {
        console.log(`   ✅ ${header}: ${headers.get(header)}`);
      } else {
        console.log(`   ❌ Missing: ${header}`);
        allPresent = false;
      }
    }
    
    results.securityHeaders = allPresent;
  } catch (err) {
    console.log('   ⚠️  Could not test security headers (server may not be running)');
  }

  // Summary
  console.log('\n📊 Test Summary:');
  console.log('================');
  let passedTests = 0;
  for (const [test, passed] of Object.entries(results)) {
    console.log(`${passed ? '✅' : '❌'} ${test}`);
    if (passed) passedTests++;
  }
  console.log(`\nPassed: ${passedTests}/4 tests`);
  
  if (passedTests < 4) {
    console.log('\n⚠️  Note: Some tests require the dev server to be running (npm run dev)');
  }
}

// Run tests
testPhase1Fixes().catch(console.error);