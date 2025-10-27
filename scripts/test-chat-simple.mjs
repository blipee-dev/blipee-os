#!/usr/bin/env node

/**
 * Simple test script for /api/chat/test endpoint
 * Tests the chat API without authentication
 */

const API_URL = 'http://localhost:3002/api/chat/test';

async function testChat() {
  console.log('🧪 Testing Chat API (No Auth)\n');
  console.log('Endpoint:', API_URL);
  console.log('Model: gpt-4o-mini\n');

  const payload = {
    messages: [
      {
        id: 'msg_' + Date.now(),
        role: 'user',
        parts: [
          {
            type: 'text',
            text: 'Say hello in one short sentence.'
          }
        ]
      }
    ],
    model: 'gpt-4o-mini'
  };

  try {
    console.log('📤 Sending request...\n');

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('📊 Status:', response.status, response.statusText);
    console.log('📊 Content-Type:', response.headers.get('content-type'));

    if (!response.ok) {
      const error = await response.text();
      console.log('\n❌ Error:', error);
      return;
    }

    if (!response.body) {
      console.log('\n❌ No response body');
      return;
    }

    // Check if it's streaming
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('text/event-stream') || contentType?.includes('text/plain')) {
      console.log('\n✅ Streaming response detected\n');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let chunkCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        chunkCount++;

        // Show first few chunks
        if (chunkCount <= 5) {
          process.stdout.write(chunk);
        } else if (chunkCount === 6) {
          process.stdout.write('...');
        }
      }

      console.log(`\n\n✅ Received ${chunkCount} chunks`);
      console.log('📄 Total length:', fullText.length, 'characters');
      console.log('\n🎯 Complete response:');
      console.log(fullText);

    } else {
      // JSON response
      const data = await response.json();
      console.log('\n✅ JSON response:');
      console.log(JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.log('\n❌ Error:', error.message);
    if (error.cause) {
      console.log('Cause:', error.cause);
    }
  }
}

testChat();
