#!/usr/bin/env node
/**
 * Full Chat API Test with Real Organization Data
 *
 * This test:
 * 1. Gets the user's actual organizations from the UI
 * 2. Uses real org/conversation IDs
 * 3. Tests the full chat flow with authentication
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
  console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(70)}`);
  console.log(`  ${title}`);
  console.log(`${'='.repeat(70)}${colors.reset}\n`);
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

async function testFullChatFlow(sessionCookie, organizationId, conversationId) {
  logSection('FULL CHAT API TEST WITH REAL DATA');

  if (!sessionCookie) {
    logError('No session cookie provided');
    logInfo('Usage: node test-chat-full.mjs "SESSION_COOKIE" [ORG_ID] [CONV_ID]');
    process.exit(1);
  }

  // If org/conv IDs not provided, use test values
  const orgId = organizationId || 'test-org-123';
  const convId = conversationId || 'test-conv-' + Date.now();

  logInfo('Test Configuration:');
  console.log(`  Organization ID: ${orgId}`);
  console.log(`  Conversation ID: ${convId}`);
  console.log(`  Auth Cookie: ${sessionCookie.substring(0, 50)}...\n`);

  // Test 1: Simple text message
  logSection('TEST 1: Simple Text Message');

  const simplePayload = {
    messages: [
      {
        id: 'msg-' + Date.now(),
        role: 'user',
        content: 'Hello! Please introduce yourself briefly.'
      }
    ],
    conversationId: convId,
    organizationId: orgId,
    model: 'gpt-4o-mini'
  };

  logDebug('Payload:', simplePayload);

  try {
    logInfo('Sending request...');
    const startTime = Date.now();

    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify(simplePayload)
    });

    const endTime = Date.now();

    logInfo(`Response received in ${endTime - startTime}ms`);
    log(colors.cyan, 'Status:', `${response.status} ${response.statusText}`);
    log(colors.cyan, 'Content-Type:', response.headers.get('content-type'));

    if (response.status === 403) {
      logError('Access denied - Organization ID may be invalid');
      logInfo('You need to provide a valid organization ID that you have access to');
      logInfo('Usage: node test-chat-full.mjs "SESSION_COOKIE" ORG_ID CONV_ID');

      // Try to help the user
      logSection('TROUBLESHOOTING');
      logInfo('To find your organization ID:');
      console.log('  1. Open http://localhost:3000/sustainability in browser');
      console.log('  2. Open DevTools (F12) → Console');
      console.log('  3. Run: localStorage.getItem("currentOrganization")');
      console.log('  4. Or check the URL parameters after signing in');

      return;
    }

    if (response.status === 401) {
      logError('Authentication failed - Session may have expired');
      logInfo('Try signing in again and copying fresh cookies');
      return;
    }

    const contentType = response.headers.get('content-type');

    if (contentType?.includes('text/event-stream')) {
      logSuccess('Received streaming response! 🎉');
      logInfo('Reading AI response stream...\n');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let chunkCount = 0;
      let textChunks = [];

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            logSuccess(`\nStream completed! Received ${chunkCount} chunks`);
            break;
          }

          chunkCount++;
          const chunk = decoder.decode(value, { stream: true });

          // Parse SSE format
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.substring(6);

              if (data === '[DONE]') {
                log(colors.green, '\n✓', 'Stream marked as complete');
              } else {
                try {
                  const parsed = JSON.parse(data);

                  // Extract text from different possible formats
                  let text = '';
                  if (parsed.choices?.[0]?.delta?.content) {
                    text = parsed.choices[0].delta.content;
                  } else if (parsed.content) {
                    text = parsed.content;
                  } else if (parsed.text) {
                    text = parsed.text;
                  }

                  if (text) {
                    fullText += text;
                    textChunks.push(text);
                    process.stdout.write(colors.magenta + text + colors.reset);
                  }

                  // Log tool calls if present
                  if (parsed.choices?.[0]?.delta?.tool_calls) {
                    log(colors.yellow, '\n🔧 TOOL CALL:', JSON.stringify(parsed.choices[0].delta.tool_calls, null, 2));
                  }

                } catch (e) {
                  // Not JSON, might be raw text
                  if (data.trim()) {
                    process.stdout.write(colors.magenta + data + colors.reset);
                    fullText += data;
                  }
                }
              }
            }
          }
        }

        // Summary
        logSection('RESPONSE SUMMARY');
        logSuccess('Chat API is working correctly! 🎉');
        logInfo(`Total chunks received: ${chunkCount}`);
        logInfo(`Total text length: ${fullText.length} characters`);
        logInfo(`First 200 chars: ${fullText.substring(0, 200)}...`);

        if (fullText.length === 0) {
          logWarning('No text content received - check if model is properly configured');
        }

      } catch (streamError) {
        logError('Error reading stream', streamError);
      }

    } else if (contentType?.includes('application/json')) {
      const data = await response.json();
      logDebug('JSON Response:', data);

      if (response.ok) {
        logSuccess('Request successful!');
      } else {
        logError('Request failed');
      }

    } else {
      const text = await response.text();
      log(colors.yellow, 'Response:', text);
    }

  } catch (error) {
    logError('Request failed', error);

    if (error.code === 'ECONNREFUSED') {
      logError('Cannot connect to server');
      logInfo('Make sure: npm run dev is running');
    }
  }

  logSection('TEST COMPLETE');
  logInfo('The chat API test has finished.');
  logInfo('Check the output above for results and any errors.');
}

// Get arguments
const sessionCookie = process.argv[2];
const organizationId = process.argv[3];
const conversationId = process.argv[4];

if (!sessionCookie) {
  logError('No session cookie provided');
  logInfo('Usage: node test-chat-full.mjs "SESSION_COOKIE" [ORG_ID] [CONV_ID]');
  logInfo('\nExample:');
  console.log('  node test-chat-full.mjs "_csrf=...; blipee-session=..." "org-123" "conv-456"');
  process.exit(1);
}

testFullChatFlow(sessionCookie, organizationId, conversationId).catch(error => {
  logError('Fatal error', error);
  process.exit(1);
});
