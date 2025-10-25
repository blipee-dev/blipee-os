/**
 * Vercel AI SDK Tool Calling Test
 *
 * Tests tool calling WITH Vercel AI SDK to compare with direct API
 */

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '.env.local') });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY not found');
  process.exit(1);
}

console.log('🧪 Vercel AI SDK Tool Calling Test\n');
console.log('='.repeat(60));

/**
 * Test 1: Using tool() helper (current approach)
 */
async function testWithToolHelper() {
  console.log('\n📋 Test 1: Using tool() helper with Zod');
  console.log('-'.repeat(60));

  // Dynamic import of tool() helper
  const { tool } = await import('ai');

  const openai = createOpenAI({
    apiKey: OPENAI_API_KEY
  });

  const tools = {
    getEmissions: tool({
      description: 'Get Scope 2 emissions for the year',
      parameters: z.object({
        scope: z.string().describe('The emissions scope to query')
      }),
      execute: async ({ scope }) => {
        console.log('✅ TOOL EXECUTED! Scope:', scope);
        return { scope, emissions: 142.6, unit: 'tCO2e' };
      }
    })
  };

  try {
    console.log('📤 Calling generateText with tool() helper...');

    const result = await generateText({
      model: openai('gpt-4o-mini'),
      system: 'You are a helpful assistant. Use the getEmissions tool to answer emissions questions.',
      prompt: 'What are my Scope 2 emissions this year?',
      tools,
      maxToolRoundtrips: 5,
      temperature: 0.3
    });

    console.log('\n📥 Result:');
    console.log('Text:', result.text);
    console.log('Tool calls:', result.toolCalls?.length || 0);
    console.log('Roundtrips:', result.roundtrips?.length || 0);

    if (result.toolCalls && result.toolCalls.length > 0) {
      console.log('\n✅ SUCCESS: Tool was called via Vercel SDK!');
      console.log('Tool calls:', result.toolCalls);
      return true;
    } else {
      console.log('\n❌ FAIL: No tool calls via Vercel SDK');
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
    return false;
  }
}

/**
 * Test 2: Force tool use
 */
async function testForcedToolUse() {
  console.log('\n📋 Test 2: Force tool use with tool_choice');
  console.log('-'.repeat(60));

  const { tool } = await import('ai');

  const openai = createOpenAI({
    apiKey: OPENAI_API_KEY
  });

  const tools = {
    getEmissions: tool({
      description: 'Get emissions data',
      parameters: z.object({
        scope: z.string()
      }),
      execute: async ({ scope }) => {
        console.log('✅ TOOL EXECUTED! Scope:', scope);
        return { scope, emissions: 142.6, unit: 'tCO2e' };
      }
    })
  };

  try {
    console.log('📤 Calling with toolChoice: "required"...');

    const result = await generateText({
      model: openai('gpt-4o-mini'),
      system: 'You must use tools to answer questions.',
      prompt: 'What are my Scope 2 emissions?',
      tools,
      toolChoice: 'required',
      maxToolRoundtrips: 5,
      temperature: 0.3
    });

    console.log('\n📥 Result:');
    console.log('Tool calls:', result.toolCalls?.length || 0);

    if (result.toolCalls && result.toolCalls.length > 0) {
      console.log('\n✅ SUCCESS: Forced tool use works!');
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
 * Test 3: Simple test without Zod complexity
 */
async function testMinimalZod() {
  console.log('\n📋 Test 3: Minimal Zod schema');
  console.log('-'.repeat(60));

  const { tool } = await import('ai');

  const openai = createOpenAI({
    apiKey: OPENAI_API_KEY
  });

  // Simplest possible Zod schema
  const tools = {
    getEmissions: tool({
      description: 'Get emissions',
      parameters: z.object({
        scope: z.string()
      }),
      execute: async ({ scope }) => {
        return { emissions: 142.6 };
      }
    })
  };

  try {
    const result = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: 'Get scope_2 emissions',
      tools,
      temperature: 0.1
    });

    if (result.toolCalls && result.toolCalls.length > 0) {
      console.log('✅ SUCCESS: Minimal schema works!');
      return true;
    } else {
      console.log('❌ FAIL: Even minimal schema fails');
      console.log('Response:', result.text);
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
    toolHelper: await testWithToolHelper(),
    forcedTool: await testForcedToolUse(),
    minimalZod: await testMinimalZod()
  };

  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Results Summary');
  console.log('='.repeat(60));
  console.log(`Tool Helper: ${results.toolHelper ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Forced Tool: ${results.forcedTool ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Minimal Zod: ${results.minimalZod ? '✅ PASS' : '❌ FAIL'}`);

  const allPassed = Object.values(results).every(r => r === true);

  if (allPassed) {
    console.log('\n🎉 ALL TESTS PASSED! Vercel AI SDK tool calling works!');
    console.log('🔍 Issue must be in BlipeeBrain configuration or context.');
  } else {
    console.log('\n⚠️ Some tests failed. Vercel AI SDK has issues with tool calling.');
    console.log('🔍 Consider switching to direct OpenAI API or debugging SDK.');
  }

  console.log('\n' + '='.repeat(60));
}

// Run tests
runAllTests().catch(console.error);
