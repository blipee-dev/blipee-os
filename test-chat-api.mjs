#!/usr/bin/env node
/**
 * Chat API Test with Strong Debugging
 * Tests the /api/chat endpoint with detailed logging
 */

const BASE_URL = 'http://localhost:3000';

// ANSI color codes for better visibility
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(color, prefix, ...args) {
  console.log(`${color}${prefix}${colors.reset}`, ...args);
}

function logSection(title) {
  console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${'='.repeat(60)}${colors.reset}\n`);
}

function logError(message, error) {
  log(colors.red, '❌ ERROR:', message);
  if (error) {
    console.error(error);
  }
}

function logSuccess(message) {
  log(colors.green, '✅ SUCCESS:', message);
}

function logInfo(message) {
  log(colors.blue, 'ℹ️  INFO:', message);
}

function logWarning(message) {
  log(colors.yellow, '⚠️  WARNING:', message);
}

function logDebug(message, data) {
  log(colors.magenta, '🔍 DEBUG:', message);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

async function testChatAPI() {
  logSection('CHAT API TEST - START');

  // Step 1: Get Authentication Cookies
  logSection('STEP 1: Testing Authentication');

  let cookies = '';

  try {
    logInfo('Attempting to get session cookies...');

    // Try to get the signin page to see if we can establish a session
    const signinResponse = await fetch(`${BASE_URL}/signin`, {
      method: 'GET',
      redirect: 'manual'
    });

    logDebug('Signin Response Status:', signinResponse.status);
    logDebug('Signin Response Headers:', Object.fromEntries(signinResponse.headers.entries()));

    // Extract cookies if available
    const setCookieHeaders = signinResponse.headers.getSetCookie?.() || [];
    if (setCookieHeaders.length > 0) {
      cookies = setCookieHeaders.map(cookie => cookie.split(';')[0]).join('; ');
      logSuccess(`Got cookies: ${cookies.substring(0, 50)}...`);
    } else {
      logWarning('No cookies received from signin page');
    }
  } catch (error) {
    logError('Failed to get session cookies', error);
  }

  // Step 2: Test Chat API without authentication
  logSection('STEP 2: Testing Chat API (Unauthenticated)');

  const testPayload = {
    messages: [
      {
        id: 'msg-1',
        role: 'user',
        content: 'Hello, can you help me with sustainability metrics?'
      }
    ],
    conversationId: 'test-conversation-123',
    organizationId: 'test-org-123',
    model: 'gpt-4o'
  };

  logDebug('Request Payload:', testPayload);

  try {
    logInfo('Sending POST request to /api/chat...');

    const startTime = Date.now();
    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(cookies ? { 'Cookie': cookies } : {})
      },
      body: JSON.stringify(testPayload)
    });
    const endTime = Date.now();

    logInfo(`Request completed in ${endTime - startTime}ms`);

    // Log response details
    logSection('RESPONSE DETAILS');
    log(colors.cyan, 'Status:', response.status, response.statusText);
    log(colors.cyan, 'Headers:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));

    // Check content type
    const contentType = response.headers.get('content-type');
    logInfo(`Content-Type: ${contentType}`);

    // Handle different response types
    if (contentType?.includes('application/json')) {
      const data = await response.json();
      logDebug('JSON Response Body:', data);

      if (response.ok) {
        logSuccess('API returned successful JSON response');
      } else {
        logError('API returned error JSON response');
      }
    } else if (contentType?.includes('text/plain')) {
      const text = await response.text();
      log(colors.yellow, 'Text Response:', text);

      if (response.status === 401) {
        logWarning('Authentication required - this is expected');
      }
    } else if (contentType?.includes('text/event-stream')) {
      logInfo('Response is a stream (SSE)');

      // Read stream chunks
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamData = '';

      logInfo('Reading stream...');
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          streamData += chunk;
          log(colors.magenta, 'STREAM CHUNK:', chunk);
        }

        logSuccess('Stream completed successfully');
        logDebug('Full stream data:', streamData);
      } catch (streamError) {
        logError('Error reading stream', streamError);
      }
    } else {
      const text = await response.text();
      log(colors.yellow, 'Response Body (first 500 chars):', text.substring(0, 500));
    }

  } catch (error) {
    logError('Request failed', error);
  }

  // Step 3: Check if server is running
  logSection('STEP 3: Server Health Check');

  try {
    logInfo('Checking if server is responding...');
    const healthResponse = await fetch(`${BASE_URL}/`, {
      method: 'GET'
    });

    logInfo(`Server responded with status: ${healthResponse.status}`);

    if (healthResponse.ok) {
      logSuccess('Server is running and responding');
    } else {
      logWarning(`Server returned status ${healthResponse.status}`);
    }
  } catch (error) {
    logError('Cannot reach server', error);
    logWarning('Make sure the dev server is running on http://localhost:3000');
  }

  // Step 4: Test with minimal payload
  logSection('STEP 4: Testing with Minimal Payload');

  const minimalPayload = {
    messages: [],
    conversationId: 'test-123',
    organizationId: 'org-123'
  };

  logDebug('Minimal Payload:', minimalPayload);

  try {
    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(minimalPayload)
    });

    log(colors.cyan, 'Status:', response.status);
    const text = await response.text();
    log(colors.cyan, 'Response:', text);

  } catch (error) {
    logError('Minimal payload test failed', error);
  }

  // Summary
  logSection('TEST SUMMARY');
  logInfo('Test completed. Key findings:');
  console.log('  1. Authentication appears to be required (401/403 expected)');
  console.log('  2. To fully test, you need valid session cookies');
  console.log('  3. Check the terminal output above for detailed logs');
  console.log(`\n${colors.bright}Next steps:${colors.reset}`);
  console.log('  - Sign in through the browser at http://localhost:3000/signin');
  console.log('  - Copy session cookies from browser DevTools');
  console.log('  - Run this test with valid cookies');

  logSection('CHAT API TEST - END');
}

// Run the test
testChatAPI().catch(error => {
  logError('Fatal error in test script', error);
  process.exit(1);
});
