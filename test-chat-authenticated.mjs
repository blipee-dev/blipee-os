#!/usr/bin/env node
/**
 * Authenticated Chat API Test with Strong Debugging
 *
 * Usage:
 *   node test-chat-authenticated.mjs [SESSION_COOKIE]
 *
 * To get your session cookie:
 * 1. Open http://localhost:3000 in browser
 * 2. Sign in to your account
 * 3. Open DevTools (F12) → Application → Cookies
 * 4. Copy the cookies and pass them as an argument
 */

const BASE_URL = 'http://localhost:3000';

// ANSI color codes
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
  if (data !== undefined) {
    console.log(JSON.stringify(data, null, 2));
  }
}

async function testAuthenticatedChat(sessionCookie) {
  logSection('AUTHENTICATED CHAT API TEST - START');

  if (!sessionCookie) {
    logWarning('No session cookie provided');
    logInfo('Usage: node test-chat-authenticated.mjs [SESSION_COOKIE]');
    logInfo('Attempting to continue without authentication...\n');
  }

  // Test payload with a simple question
  const testPayload = {
    messages: [
      {
        id: 'msg-' + Date.now(),
        role: 'user',
        content: 'What is the current carbon footprint for our organization?'
      }
    ],
    conversationId: 'test-conv-' + Date.now(),
    organizationId: 'test-org-123',
    model: 'gpt-4o-mini' // Use mini for faster testing
  };

  logSection('REQUEST DETAILS');
  logDebug('Endpoint:', `${BASE_URL}/api/chat`);
  logDebug('Method:', 'POST');
  logDebug('Headers:', {
    'Content-Type': 'application/json',
    'Cookie': sessionCookie ? `${sessionCookie.substring(0, 50)}...` : 'None'
  });
  logDebug('Payload:', testPayload);

  try {
    logInfo('Sending request...');
    const startTime = Date.now();

    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(sessionCookie ? { 'Cookie': sessionCookie } : {})
      },
      body: JSON.stringify(testPayload)
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    logSection('RESPONSE DETAILS');
    log(colors.cyan, 'Status:', `${response.status} ${response.statusText}`);
    log(colors.cyan, 'Duration:', `${duration}ms`);
    log(colors.cyan, 'Content-Type:', response.headers.get('content-type'));

    // Show all response headers
    logDebug('Response Headers:', Object.fromEntries(response.headers.entries()));

    // Handle different content types
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('text/event-stream')) {
      logSuccess('Received streaming response!');
      logInfo('Reading stream chunks...\n');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      let chunkCount = 0;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            logSuccess(`Stream completed! Total chunks: ${chunkCount}`);
            break;
          }

          chunkCount++;
          const chunk = decoder.decode(value, { stream: true });
          fullResponse += chunk;

          // Parse SSE data
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.substring(6);
              if (data === '[DONE]') {
                log(colors.magenta, 'STREAM:', '[DONE]');
              } else {
                try {
                  const parsed = JSON.parse(data);
                  log(colors.magenta, `CHUNK ${chunkCount}:`, JSON.stringify(parsed, null, 2));
                } catch {
                  log(colors.magenta, `CHUNK ${chunkCount}:`, data);
                }
              }
            } else if (line.trim()) {
              log(colors.magenta, 'STREAM:', line);
            }
          }
        }

        logSection('STREAM SUMMARY');
        logInfo(`Total chunks received: ${chunkCount}`);
        logInfo(`Total data length: ${fullResponse.length} bytes`);
        logDebug('Full stream (first 500 chars):', fullResponse.substring(0, 500));

      } catch (streamError) {
        logError('Error reading stream', streamError);
      }

    } else if (contentType?.includes('application/json')) {
      const data = await response.json();
      logSection('JSON RESPONSE');
      logDebug('Response Body:', data);

      if (response.ok) {
        logSuccess('Request successful!');
      } else {
        logError('Request failed with error response');

        if (response.status === 401) {
          logWarning('Authentication failed. Your session may have expired.');
          logInfo('Try signing in again and copying new cookies.');
        } else if (response.status === 403) {
          logWarning('Access denied. Check organization permissions.');
        }
      }

    } else {
      const text = await response.text();
      logSection('TEXT RESPONSE');
      log(colors.yellow, 'Response Body:', text);
    }

  } catch (error) {
    logError('Request failed', error);

    if (error.code === 'ECONNREFUSED') {
      logError('Cannot connect to server');
      logInfo('Make sure the dev server is running: npm run dev');
    }
  }

  // Additional debug information
  logSection('DEBUG INFORMATION');
  logInfo('Environment check:');
  console.log('  - Node version:', process.version);
  console.log('  - Server URL:', BASE_URL);
  console.log('  - Auth provided:', !!sessionCookie);

  logSection('AUTHENTICATED CHAT API TEST - END');
}

// Get session cookie from command line argument
const sessionCookie = process.argv[2];

testAuthenticatedChat(sessionCookie).catch(error => {
  logError('Fatal error', error);
  process.exit(1);
});
