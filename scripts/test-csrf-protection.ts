#!/usr/bin/env tsx

/**
 * Test script for CSRF protection
 * Run with: npm run test:csrf
 */

async function testCSRFProtection() {
  const baseUrl = 'http://localhost:3000';

  console.log('🔐 Testing CSRF Protection...\n');

  // Test 1: Request without CSRF token
  console.log('Test 1: POST without CSRF token');
  try {
    const response = await fetch(`${baseUrl}/api/organizations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Organization',
      }),
    });

    if (response.status === 403) {
      console.log('✅ Correctly blocked request without CSRF token');
    } else {
      console.log(`❌ Expected 403, got ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Request failed:', error);
  }

  // Test 2: GET request should work without CSRF
  console.log('\nTest 2: GET request (should work without CSRF)');
  try {
    const response = await fetch(`${baseUrl}/api/health`);
    
    if (response.ok) {
      console.log('✅ GET request works without CSRF token');
    } else {
      console.log(`❌ GET request failed with status ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Request failed:', error);
  }

  // Test 3: Request with valid CSRF token
  console.log('\nTest 3: POST with valid CSRF token');
  try {
    // First, get a CSRF token by visiting a page
    const pageResponse = await fetch(`${baseUrl}/signin`);
    const cookies = pageResponse.headers.get('set-cookie');
    const csrfToken = cookies?.match(/_csrf=([^;]+)/)?.[1];

    if (csrfToken) {
      console.log('Got CSRF token:', csrfToken.substring(0, 20) + '...');

      const response = await fetch(`${baseUrl}/api/organizations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
          'Cookie': `_csrf=${csrfToken}`,
        },
        body: JSON.stringify({
          name: 'Test Organization',
        }),
      });

      if (response.status !== 403) {
        console.log('✅ Request with CSRF token was allowed');
      } else {
        console.log('❌ Request with CSRF token was blocked');
      }
    } else {
      console.log('❌ Could not extract CSRF token from response');
    }
  } catch (error) {
    console.log('❌ Request failed:', error);
  }

  // Test 4: Test exempt endpoints
  console.log('\nTest 4: Exempt endpoint (webhooks)');
  try {
    const response = await fetch(`${baseUrl}/api/webhooks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: 'test',
      }),
    });

    console.log(`Webhook endpoint responded with ${response.status}`);
    if (response.status !== 403) {
      console.log('✅ Webhook endpoint correctly exempted from CSRF');
    }
  } catch (error) {
    console.log('❌ Request failed:', error);
  }

  console.log('\n✨ CSRF protection tests completed!');
}

// Run the tests
testCSRFProtection().catch(console.error);