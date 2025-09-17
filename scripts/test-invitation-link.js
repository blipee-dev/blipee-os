#!/usr/bin/env node

// Test script to debug invitation link generation
// Run with: node scripts/test-invitation-link.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testInvitationLink() {
  console.log('🔍 Testing Invitation Link Generation\n');

  const testEmail = 'test-invitation@example.com';

  // Generate an invitation link
  const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
    type: 'invite',
    email: testEmail,
    options: {
      data: {
        full_name: 'Test User',
        organization_id: '77e8b513-dcdf-4b99-8bd3-abd437bb187d'
      }
    }
  });

  if (resetError) {
    console.error('Error generating link:', resetError);
    return;
  }

  console.log('Raw Supabase action link:');
  console.log(resetData.properties.action_link);
  console.log('\n');

  // Parse the link
  const actionLink = resetData.properties.action_link;
  const url = new URL(actionLink);

  console.log('URL parts:');
  console.log('- Host:', url.host);
  console.log('- Pathname:', url.pathname);
  console.log('- Hash:', url.hash);
  console.log('- Search params:', url.searchParams.toString());

  // Extract the token
  const hash = url.hash.substring(1); // Remove the # at the beginning
  console.log('\nExtracted hash/token:', hash);

  // Create our app's callback URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const confirmationUrl = `${baseUrl}/auth/callback?${hash}&type=invite`;

  console.log('\nConstructed app callback URL:');
  console.log(confirmationUrl);

  // Parse to verify
  const appUrl = new URL(confirmationUrl);
  console.log('\nApp URL params:');
  console.log('- type:', appUrl.searchParams.get('type'));
  console.log('- access_token:', appUrl.searchParams.get('access_token') ? 'present' : 'missing');
  console.log('- token_type:', appUrl.searchParams.get('token_type'));
  console.log('- expires_in:', appUrl.searchParams.get('expires_in'));

  // Clean up test user
  await supabase.auth.admin.deleteUser(resetData.user.id);
  console.log('\n✅ Test user cleaned up');
}

testInvitationLink().catch(console.error);