/**
 * Test script to debug SQL query execution
 * Calls the chat API directly to see BlipeeBrain SQL logs
 */

const API_URL = 'http://localhost:3000/api/ai/chat';

async function testSQLQuery() {
  console.log('🧪 Testing SQL query for Scope 2 emissions...\n');

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'sb-quovvwrwyfkzhgqdeham-auth-token=base64-eyJhY2Nlc3NfdG9rZW4iOiJleUpoYkdjaU9pSklVekkxTmlJc0ltdHBaQ0k2SWpVNE0yRXdOV0ZoTFdNd05tWXROREkwWVMxaE1USTFMVEEyTXpnME1UYzJabVV6TmlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKcGMzTWlPaUpvZEhSd2N6b3ZMM0YxYjNaMmQzSjNlV1pyZW1oblhXUmxZbUZ0TG5OMWNHRmlZWE5sTG1OdkwyRjFkR2d2ZGpFaUxDSnpkV0lpT2lJMU1qVTFOMkpoTWkwek1UaGxMVFJtTldJdFlUYzRZaTB3TjJJelpHTmpNMk00T0dVaUxDSmhkV1FpT2lKaGRYUm9aVzUwYVdOaGRHVmtJaXdpWlhod0lqb3hOelE1TWpneU1UQXlMQ0pwWVhRaU9qRTNORGt5TnpVMU1ESXNJbVZ0WVdsc0lqb2lhbTl6WlM1d2FXNTBiMEJ3YkcxcUxuQjBJaXdpY0dodmJtVWlPaUlpTENKaGNIQmZiV1YwWVdSaGRHRWlPbnNpY0hKdmRtbGtaWElpT2lKbGJXRnBiQ0lzSW5CeWIzWnBaR1Z5Y3lJNld5SmxiV0ZwYkNKZGZTd2lkWE5sY2w5dFpYUmhaR0YwWVNJNmUzMHNJbkp2YkdVaU9pSmhkWFJvWlc1MGFXTmhkR1ZrSWl3aVlXRnNJam9pWVdGc01TSXNJbUZ0Y2lJNlczc2liV1YwYUc5a0lqb2ljR0Z6YzNkdmNtUWlMQ0owYVcxbGMzUmhiWEFpT2pFM05Ea3lOelUxTURKOVhTd2ljMlZ6YzJsdmJsOXBaQ0k2SW1ZNU56SmhOREl5TFdVNU5XRXRORFl3WlMxaFlXSmtMV1E1Tm1ZNE5tTTVZMk16TUNKOS5TU0lBYzduUjR3RlItY1hxUmswYl9vd0pkT3NLYjJIdmNJcU5ZMjkyNDJZIiwicmVmcmVzaF90b2tlbiI6IndjUkFNNjhEa3R5anpwSzFCZ19FdyIsInByb3ZpZGVyX3Rva2VuIjpudWxsLCJwcm92aWRlcl9yZWZyZXNoX3Rva2VuIjpudWxsLCJ0eXBlIjoic2lnbmVkLWluIn0='
      },
      body: JSON.stringify({
        message: 'Show me Scope 2 emissions for 2025',
        conversationId: 'test-' + Date.now()
      })
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Error response:', error);
      return;
    }

    // Check if it's a streaming response
    const contentType = response.headers.get('content-type');
    console.log('📝 Content-Type:', contentType);

    if (contentType?.includes('text/event-stream') || contentType?.includes('text/plain')) {
      console.log('\n🌊 Streaming response...\n');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        process.stdout.write(chunk);
      }
    } else {
      const data = await response.json();
      console.log('\n📦 JSON response:', JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testSQLQuery();
