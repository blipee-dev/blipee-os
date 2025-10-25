/**
 * Test if the /api/ai/chat endpoint with streaming actually works
 * This tests the actual endpoint that useChat should be calling
 */

console.log('🧪 Testing /api/ai/chat streaming endpoint\n');

async function testStreamingEndpoint() {
  console.log('📝 Test: Direct POST to /api/ai/chat?stream=true');
  console.log('=' .repeat(60));

  try {
    const response = await fetch('http://localhost:3000/api/ai/chat?stream=true', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: This will fail without proper authentication and CSRF token
        // But it will show us if the endpoint is reachable
      },
      body: JSON.stringify({
        message: 'Hello! Tell me about emissions.',
        conversationId: 'test_' + Date.now(),
      }),
    });

    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:');
    response.headers.forEach((value, key) => {
      console.log(`   ${key}: ${value}`);
    });

    if (response.status === 401 || response.status === 403) {
      console.log('❌ Authentication/CSRF error (EXPECTED)');
      console.log('   This is why useChat might not be working!');
      console.log('   The endpoint requires:');
      console.log('   1. Valid session cookie');
      console.log('   2. CSRF token in headers');
      console.log('   3. Proper authentication');
    } else if (response.status === 200) {
      console.log('✅ Endpoint is reachable and responding');

      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let chunks = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks++;
          if (chunks <= 3) {
            const text = decoder.decode(value, { stream: true });
            console.log(`📦 Chunk ${chunks}:`, text.substring(0, 100));
          }
        }

        console.log(`✅ Received ${chunks} chunks (streaming works!)`);
      }
    } else {
      console.log(`❌ Unexpected status: ${response.status}`);
      const text = await response.text();
      console.log('Response:', text.substring(0, 200));
    }

  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

console.log('\n💡 Key Insight:');
console.log('If we get 401/403 errors, it means useChat needs proper CSRF headers');
console.log('Check ConversationInterface.tsx for csrfHeaders usage\n');

testStreamingEndpoint();
