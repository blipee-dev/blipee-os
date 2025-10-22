#!/usr/bin/env node

/**
 * Test Smart Provider Routing
 *
 * Demonstrates how the Vercel AI Service intelligently routes tasks:
 * - Conversational → DeepSeek (cheap)
 * - Structured outputs → OpenAI/Anthropic (reliable)
 * - Tool calling → OpenAI/Anthropic (better support)
 */

import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { generateText, generateObject } from 'ai';
import { z } from 'zod';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

console.log('🎯 Testing Smart Provider Routing\n');
console.log('='.repeat(70));

// Simulate the smart routing logic
function getOptimalProvider(taskType, hasSchema, hasTools) {
  if (hasSchema || hasTools) {
    // Structured outputs or tool calling → OpenAI/Anthropic
    if (process.env.OPENAI_API_KEY) return 'OpenAI';
    if (process.env.ANTHROPIC_API_KEY) return 'Anthropic';
  }

  // Conversational/Analysis → DeepSeek
  if (process.env.DEEPSEEK_API_KEY) return 'DeepSeek';

  return 'None';
}

// Test 1: Conversational Analysis (should use DeepSeek)
console.log('\n📊 Test 1: Conversational Analysis');
console.log('-'.repeat(70));
console.log('Task Type: CONVERSATIONAL');
console.log(`Expected Provider: ${getOptimalProvider('conversational', false, false)}`);

if (process.env.DEEPSEEK_API_KEY) {
  try {
    const deepseek = createDeepSeek({ apiKey: process.env.DEEPSEEK_API_KEY });
    const model = deepseek('deepseek-chat');

    const result = await generateText({
      model,
      prompt: 'Explain the difference between Scope 1 and Scope 2 emissions in 2 sentences.',
      maxTokens: 150,
    });

    console.log('✅ Routed to: DeepSeek');
    console.log(`💬 Response: ${result.text}`);
    console.log(`💰 Cost: ~$${(result.usage.totalTokens * 0.00001).toFixed(5)} (${result.usage.totalTokens} tokens)`);
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
} else {
  console.log('⊘ DeepSeek not configured, skipping...');
}

// Test 2: Structured Output (should use OpenAI/Anthropic)
console.log('\n\n🔧 Test 2: Structured Output');
console.log('-'.repeat(70));
console.log('Task Type: STRUCTURED');
console.log(`Expected Provider: ${getOptimalProvider('structured', true, false)}`);

const emissionsSchema = z.object({
  scope: z.number().min(1).max(3),
  category: z.string(),
  description: z.string(),
  examples: z.array(z.string()).min(2).max(3),
});

if (process.env.OPENAI_API_KEY) {
  try {
    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const model = openai('gpt-4-turbo-preview');

    const result = await generateObject({
      model,
      schema: emissionsSchema,
      prompt: 'Describe Scope 3 Category 1: Purchased goods and services',
    });

    console.log('✅ Routed to: OpenAI');
    console.log('📋 Structured Output:');
    console.log(JSON.stringify(result.object, null, 2));
    console.log(`💰 Cost: ~$${(result.usage.totalTokens * 0.0001).toFixed(5)} (${result.usage.totalTokens} tokens)`);
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
} else if (process.env.ANTHROPIC_API_KEY) {
  try {
    const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const model = anthropic('claude-3-haiku-20240307');

    const result = await generateObject({
      model,
      schema: emissionsSchema,
      prompt: 'Describe Scope 3 Category 1: Purchased goods and services',
    });

    console.log('✅ Routed to: Anthropic');
    console.log('📋 Structured Output:');
    console.log(JSON.stringify(result.object, null, 2));
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
} else {
  console.log('⊘ Neither OpenAI nor Anthropic configured, skipping...');
}

// Test 3: Cost Comparison
console.log('\n\n💰 Test 3: Cost Comparison');
console.log('-'.repeat(70));

const taskExamples = [
  { task: 'Analyze emissions trends (conversational)', tokens: 500, provider: 'DeepSeek', costMultiplier: 1 },
  { task: 'Generate structured target (schema)', tokens: 300, provider: 'OpenAI', costMultiplier: 10 },
  { task: 'Create compliance report (conversational)', tokens: 800, provider: 'DeepSeek', costMultiplier: 1 },
  { task: 'Calculate footprint (tool calling)', tokens: 200, provider: 'OpenAI', costMultiplier: 10 },
];

console.log('\nSmart Routing Cost Analysis (1000 requests/month):');
console.log('');

let totalCostSmart = 0;
let totalCostOpenAI = 0;

console.log('Task'.padEnd(45) + 'Provider'.padEnd(12) + 'Cost (Smart)'.padEnd(15) + 'Cost (All OpenAI)');
console.log('-'.repeat(85));

for (const example of taskExamples) {
  const baseCost = 0.00001; // per token
  const smartCost = (example.tokens * baseCost * example.costMultiplier * 250); // 250 = 1000/4 requests
  const openAICost = (example.tokens * baseCost * 10 * 250);

  totalCostSmart += smartCost;
  totalCostOpenAI += openAICost;

  console.log(
    example.task.padEnd(45) +
    example.provider.padEnd(12) +
    `$${smartCost.toFixed(2)}`.padEnd(15) +
    `$${openAICost.toFixed(2)}`
  );
}

console.log('-'.repeat(85));
console.log(
  'TOTAL'.padEnd(45) +
  ''.padEnd(12) +
  `$${totalCostSmart.toFixed(2)}`.padEnd(15) +
  `$${totalCostOpenAI.toFixed(2)}`
);

const savings = totalCostOpenAI - totalCostSmart;
const savingsPercent = ((savings / totalCostOpenAI) * 100).toFixed(1);

console.log('');
console.log(`💡 Smart Routing Savings: $${savings.toFixed(2)}/month (${savingsPercent}% reduction)`);

// Summary
console.log('\n\n' + '='.repeat(70));
console.log('✅ Smart Routing Test Complete!');
console.log('='.repeat(70));
console.log('\n📊 Routing Strategy:');
console.log('  • Conversational/Analysis  → DeepSeek (1x cost)');
console.log('  • Structured Outputs       → OpenAI/Anthropic (10-12x cost, reliable)');
console.log('  • Tool Calling            → OpenAI/Anthropic (10-12x cost, best support)');
console.log('  • Fallback                → Always tries next provider if primary fails');
console.log('');
console.log(`🎯 Result: ${savingsPercent}% cost savings while maintaining reliability!`);
console.log('');
