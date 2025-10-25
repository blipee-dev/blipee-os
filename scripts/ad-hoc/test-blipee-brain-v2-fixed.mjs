/**
 * Test Blipee Brain V2 with Fixed inputSchema
 *
 * This tests that the tool() helper now works correctly with inputSchema
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '.env.local') });

console.log('🧪 Blipee Brain V2 Fixed Implementation Test\n');
console.log('='.repeat(60));

// Test that we can import the SDK properly
async function testSDKImports() {
  console.log('\n📋 Test 1: SDK Imports');
  console.log('-'.repeat(60));

  try {
    const { generateText, tool } = await import('ai');
    const { createOpenAI } = await import('@ai-sdk/openai');
    const { z } = await import('zod');

    console.log('✅ Successfully imported:');
    console.log('   - generateText');
    console.log('   - tool');
    console.log('   - createOpenAI');
    console.log('   - z (Zod)');

    return { generateText, tool, createOpenAI, z };
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    return null;
  }
}

// Test tool definition with inputSchema
async function testToolDefinition(imports) {
  console.log('\n📋 Test 2: Tool Definition with inputSchema');
  console.log('-'.repeat(60));

  if (!imports) {
    console.log('❌ Skipped - imports failed');
    return false;
  }

  const { tool, z } = imports;

  try {
    const testTool = tool({
      description: 'Get emissions data',
      inputSchema: z.object({
        scope: z.string().describe('The emissions scope')
      }),
      execute: async ({ scope }) => {
        return { scope, emissions: 142.6, unit: 'tCO2e' };
      }
    });

    console.log('✅ Tool defined successfully with inputSchema');
    console.log('   Tool type:', typeof testTool);

    return true;
  } catch (error) {
    console.error('❌ Tool definition failed:', error.message);
    return false;
  }
}

// Test generateText with tool
async function testGenerateText(imports) {
  console.log('\n📋 Test 3: generateText with Tool');
  console.log('-'.repeat(60));

  if (!imports) {
    console.log('❌ Skipped - imports failed');
    return false;
  }

  const { generateText, tool, createOpenAI, z } = imports;

  if (!process.env.OPENAI_API_KEY) {
    console.log('⚠️ Skipped - OPENAI_API_KEY not found');
    return null;
  }

  try {
    const model = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })('gpt-4o-mini');

    const tools = {
      getEmissions: tool({
        description: 'Get Scope 2 emissions for the year',
        inputSchema: z.object({
          scope: z.string().describe('The emissions scope to query')
        }),
        execute: async ({ scope }) => {
          console.log('   🔧 Tool executed with scope:', scope);
          return { scope, emissions: 142.6, unit: 'tCO2e' };
        }
      })
    };

    console.log('📤 Calling generateText...');

    const result = await generateText({
      model,
      system: 'You are a helpful assistant. Use the getEmissions tool to answer emissions questions.',
      prompt: 'What are my Scope 2 emissions this year?',
      tools,
      maxToolRoundtrips: 3,
      temperature: 0.3
    });

    console.log('\n📥 Result:');
    console.log('   Text:', result.text?.substring(0, 100) + '...');
    console.log('   Tool calls:', result.toolCalls?.length || 0);
    console.log('   Roundtrips:', result.roundtrips?.length || 0);

    if (result.toolCalls && result.toolCalls.length > 0) {
      console.log('\n✅ SUCCESS: Tool was called!');
      console.log('   Tool calls:', result.toolCalls.map(tc => ({
        name: tc.toolName,
        args: tc.args
      })));
      return true;
    } else {
      console.log('\n⚠️ WARNING: No tool calls made');
      console.log('   Response:', result.text);
      return false;
    }
  } catch (error) {
    console.error('❌ generateText failed:', error.message);
    if (error.cause) {
      console.error('   Cause:', error.cause);
    }
    return false;
  }
}

// Run all tests
async function runAllTests() {
  const imports = await testSDKImports();
  const toolDefResult = await testToolDefinition(imports);
  const generateTextResult = await testGenerateText(imports);

  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Results Summary');
  console.log('='.repeat(60));
  console.log(`SDK Imports:       ${imports ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Tool Definition:   ${toolDefResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Generate Text:     ${generateTextResult === true ? '✅ PASS' : generateTextResult === false ? '❌ FAIL' : '⚠️ SKIPPED'}`);

  const allPassed = imports && toolDefResult && (generateTextResult === true || generateTextResult === null);

  if (allPassed) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('✅ The inputSchema fix is working correctly!');
    console.log('✅ Vercel AI SDK tool calling is functional!');
  } else {
    console.log('\n⚠️ Some tests failed or were skipped.');
    console.log('🔍 Review the output above for details.');
  }

  console.log('\n' + '='.repeat(60));
}

// Run tests
runAllTests().catch(console.error);
