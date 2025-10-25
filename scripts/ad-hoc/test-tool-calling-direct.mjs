/**
 * Direct OpenAI API Tool Calling Test
 *
 * Tests tool calling WITHOUT Vercel AI SDK to isolate the issue
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '.env.local') });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY not found in .env.local');
  process.exit(1);
}

console.log('🧪 Direct OpenAI API Tool Calling Test\n');
console.log('='.repeat(60));

/**
 * Test 1: Minimal tool definition
 */
async function testMinimalTool() {
  console.log('\n📋 Test 1: Minimal Tool Definition');
  console.log('-'.repeat(60));

  const messages = [
    {
      role: 'system',
      content: 'You are a helpful assistant. Use the getEmissions tool to answer questions about emissions data.'
    },
    {
      role: 'user',
      content: 'What are my Scope 2 emissions this year?'
    }
  ];

  const tools = [
    {
      type: 'function',
      function: {
        name: 'getEmissions',
        description: 'Get Scope 2 emissions for the year',
        parameters: {
          type: 'object',
          properties: {
            scope: {
              type: 'string',
              description: 'The scope to query (scope_1, scope_2, or scope_3)'
            }
          },
          required: ['scope']
        }
      }
    }
  ];

  console.log('📤 Sending request to OpenAI API...');
  console.log('Model: gpt-4o-mini');
  console.log('Tool:', tools[0].function.name);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        tools,
        tool_choice: 'auto',
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ API Error:', error);
      return;
    }

    const data = await response.json();

    console.log('\n📥 Response received:');
    console.log('Finish reason:', data.choices[0].finish_reason);
    console.log('Message:', data.choices[0].message);

    if (data.choices[0].message.tool_calls) {
      console.log('\n✅ SUCCESS: Tool was called!');
      console.log('Tool calls:', data.choices[0].message.tool_calls);
      return true;
    } else {
      console.log('\n❌ FAIL: No tool calls made');
      console.log('Response content:', data.choices[0].message.content);
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

/**
 * Test 2: Force tool use
 */
async function testForcedTool() {
  console.log('\n📋 Test 2: Force Tool Use with tool_choice');
  console.log('-'.repeat(60));

  const messages = [
    {
      role: 'system',
      content: 'You are a helpful assistant.'
    },
    {
      role: 'user',
      content: 'What are my Scope 2 emissions?'
    }
  ];

  const tools = [
    {
      type: 'function',
      function: {
        name: 'getEmissions',
        description: 'Get emissions data',
        parameters: {
          type: 'object',
          properties: {
            scope: {
              type: 'string',
              description: 'Emissions scope'
            }
          },
          required: ['scope']
        }
      }
    }
  ];

  console.log('📤 Sending request with tool_choice: required...');

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        tools,
        tool_choice: 'required', // Force tool use
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ API Error:', error);
      return;
    }

    const data = await response.json();

    console.log('\n📥 Response received:');
    console.log('Finish reason:', data.choices[0].finish_reason);

    if (data.choices[0].message.tool_calls) {
      console.log('\n✅ SUCCESS: Tool was forced and called!');
      console.log('Tool calls:', data.choices[0].message.tool_calls);
      return true;
    } else {
      console.log('\n❌ FAIL: Tool not called even when forced');
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

/**
 * Test 3: gpt-4o (full model)
 */
async function testGPT4o() {
  console.log('\n📋 Test 3: Test with gpt-4o (full model)');
  console.log('-'.repeat(60));

  const messages = [
    {
      role: 'system',
      content: 'You are a helpful assistant. Use the getEmissions tool to answer emissions questions.'
    },
    {
      role: 'user',
      content: 'What are my Scope 2 emissions this year?'
    }
  ];

  const tools = [
    {
      type: 'function',
      function: {
        name: 'getEmissions',
        description: 'Get Scope 2 emissions for the year',
        parameters: {
          type: 'object',
          properties: {
            scope: {
              type: 'string',
              description: 'The scope to query'
            }
          },
          required: ['scope']
        }
      }
    }
  ];

  console.log('📤 Sending request to gpt-4o...');

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        tools,
        tool_choice: 'auto',
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ API Error:', error);
      return;
    }

    const data = await response.json();

    console.log('\n📥 Response received:');
    console.log('Finish reason:', data.choices[0].finish_reason);

    if (data.choices[0].message.tool_calls) {
      console.log('\n✅ SUCCESS: gpt-4o called the tool!');
      console.log('Tool calls:', data.choices[0].message.tool_calls);
      return true;
    } else {
      console.log('\n❌ FAIL: gpt-4o did not call tool');
      console.log('Response content:', data.choices[0].message.content);
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  const results = {
    minimalTool: await testMinimalTool(),
    forcedTool: await testForcedTool(),
    gpt4o: await testGPT4o()
  };

  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Results Summary');
  console.log('='.repeat(60));
  console.log(`✅ Minimal Tool (auto): ${results.minimalTool ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Forced Tool (required): ${results.forcedTool ? 'PASS' : 'FAIL'}`);
  console.log(`✅ GPT-4o Model: ${results.gpt4o ? 'PASS' : 'FAIL'}`);

  const allPassed = Object.values(results).every(r => r === true);

  if (allPassed) {
    console.log('\n🎉 ALL TESTS PASSED! Tool calling works with direct API.');
    console.log('🔍 Issue is likely with Vercel AI SDK integration.');
  } else {
    console.log('\n⚠️ Some tests failed. Investigating tool schema or model behavior.');
  }

  console.log('\n' + '='.repeat(60));
}

// Run tests
runAllTests().catch(console.error);
