#!/usr/bin/env node

// Test script for complete user creation flow with Gmail
// Run with: node scripts/test-user-creation.js

require('dotenv').config({ path: '.env.local' });

const TEST_USER = {
  name: 'Test User',
  email: `test-${Date.now()}@example.com`, // Unique email for testing
  role: 'viewer',
  organization_id: null, // Will be set from your current org
};

async function testUserCreation() {
  console.log('🚀 Testing User Creation Flow\n');

  // First, we need to authenticate as an admin user
  console.log('Step 1: Authenticating as admin...');
  console.log('Please make sure you are logged in as an admin/manager in your browser\n');

  console.log('Step 2: Test User Details:');
  console.log('  Name:', TEST_USER.name);
  console.log('  Email:', TEST_USER.email);
  console.log('  Role:', TEST_USER.role);
  console.log('');

  console.log('Step 3: Creating user via API...\n');

  // Note: This needs to be called from your app with proper authentication
  const createUserCode = `
// Run this in your browser console while logged in as admin:

fetch('/api/users/manage', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: '${TEST_USER.name}',
    email: '${TEST_USER.email}',
    role: '${TEST_USER.role}',
    organization_id: 'YOUR_ORG_ID_HERE', // Replace with actual org ID
    access_level: 'organization',
    site_ids: []
  })
})
.then(res => res.json())
.then(data => {
  if (data.error) {
    console.error('❌ Error:', data.error);
  } else {
    console.log('✅ User created successfully!');
    console.log('User data:', data);
    console.log('Check email for invitation!');
  }
})
.catch(err => console.error('❌ Failed:', err));
`;

  console.log('Copy and run this code in your browser console:');
  console.log('================================================\n');
  console.log(createUserCode);
  console.log('\n================================================');

  console.log('\nExpected Flow:');
  console.log('1. ✅ User created in database');
  console.log('2. 📧 Gmail invitation sent (check spam folder)');
  console.log('3. 🔗 User clicks link in email');
  console.log('4. 🔐 User sets password at /set-password');
  console.log('5. 🎉 User redirected to /blipee-ai');

  console.log('\nThings to verify:');
  console.log('- [ ] User appears in Supabase Auth dashboard');
  console.log('- [ ] User appears in app_users table');
  console.log('- [ ] Email received with correct language');
  console.log('- [ ] Link in email works');
  console.log('- [ ] Password setup page loads');
  console.log('- [ ] After password set, user can login');
}

// Run test
testUserCreation().catch(console.error);
