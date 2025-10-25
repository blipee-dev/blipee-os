/**
 * Test script for streaming chat functionality
 * Tests the upgraded useChat hook with streamText implementation
 */

console.log('🧪 Starting Streaming Chat Test Suite\n');

// Test 1: Basic streaming response
async function testBasicStreaming() {
  console.log('📝 Test 1: Basic Streaming Response');
  console.log('=====================================');

  try {
    const response = await fetch('http://localhost:3000/api/ai/chat?stream=true', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hello! Can you tell me about sustainability in one sentence?',
        conversationId: 'test_' + Date.now(),
      }),
    });

    if (!response.ok) {
      console.log('❌ Request failed:', response.status, response.statusText);
      const text = await response.text();
      console.log('Response:', text);
      return false;
    }

    if (!response.body) {
      console.log('❌ No response body');
      return false;
    }

    console.log('✅ Streaming response received');
    console.log('📊 Content-Type:', response.headers.get('content-type'));

    // Read the stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let streamedText = '';
    let chunkCount = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      streamedText += chunk;
      chunkCount++;

      // Show first few chunks
      if (chunkCount <= 3) {
        console.log(`📦 Chunk ${chunkCount}:`, chunk.substring(0, 100));
      }
    }

    console.log(`\n✅ Received ${chunkCount} chunks`);
    console.log('📄 Total length:', streamedText.length, 'characters');
    console.log('🎯 First 200 chars:', streamedText.substring(0, 200));

    return chunkCount > 0 && streamedText.length > 0;

  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

// Test 2: Check API route configuration
async function testAPIConfiguration() {
  console.log('\n📝 Test 2: API Configuration Check');
  console.log('=====================================');

  try {
    // Test non-streaming endpoint (should still work)
    const response = await fetch('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hello!',
        conversationId: 'test_non_streaming',
      }),
    });

    console.log('📊 Non-streaming endpoint status:', response.status);
    console.log('📊 Content-Type:', response.headers.get('content-type'));

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Non-streaming mode works');
      console.log('📄 Response has content:', !!data.content);
    }

    return response.ok;

  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

// Test 3: Verify BlipeeBrain V2 methods exist
async function testBlipeeBrainMethods() {
  console.log('\n📝 Test 3: BlipeeBrain V2 Methods');
  console.log('=====================================');

  try {
    // Import the module to check methods
    const module = await import('./src/lib/ai/blipee-brain-v2.ts');
    const BlipeeBrainV2 = module.BlipeeBrainV2;

    if (!BlipeeBrainV2) {
      console.log('❌ BlipeeBrainV2 class not found');
      return false;
    }

    const brain = new BlipeeBrainV2();

    console.log('✅ BlipeeBrainV2 class instantiated');
    console.log('📊 Has process method:', typeof brain.process === 'function');
    console.log('📊 Has processStream method:', typeof brain.processStream === 'function');

    if (typeof brain.processStream !== 'function') {
      console.log('❌ processStream method not found!');
      return false;
    }

    console.log('✅ All required methods present');
    return true;

  } catch (error) {
    console.log('❌ Error loading BlipeeBrain:', error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  const results = [];

  results.push(await testBlipeeBrainMethods());
  results.push(await testAPIConfiguration());
  results.push(await testBasicStreaming());

  // Summary
  console.log('\n\n📊 Test Summary');
  console.log('=====================================');
  const passed = results.filter(r => r).length;
  const total = results.length;

  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);

  if (passed === total) {
    console.log('\n🎉 All tests passed! Streaming chat is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Review the output above for details.');
  }

  process.exit(passed === total ? 0 : 1);
}

// Wait a moment for dev server to be fully ready, then run tests
setTimeout(runTests, 2000);
