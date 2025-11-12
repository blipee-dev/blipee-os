/**
 * Test Script: Chat Integration
 * Tests the basic LLM integration with Anthropic
 *
 * Usage:
 *   npx tsx scripts/test-chat-integration.ts
 */

// Load environment variables
import { config } from 'dotenv'
import { resolve, join } from 'path'

// Load .env.local from project root
const envPath = join(process.cwd(), '.env.local')
const result = config({ path: envPath })

if (result.error) {
  console.error('Error loading .env.local:', result.error)
  console.log('Tried path:', envPath)
} else {
  console.log('✓ Environment variables loaded from:', envPath)
}

import { createChatCompletion, createStreamingChatCompletion, testAnthropicConnection } from '../src/lib/llm/anthropic'
import { buildSystemPrompt } from '../src/lib/llm/prompt-builder'
import type { AgentType } from '../src/types/chat'

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(60))
  log(title, colors.bright + colors.blue)
  console.log('='.repeat(60) + '\n')
}

async function test1_ConnectionTest() {
  logSection('TEST 1: Connection Test')

  try {
    log('Testing connection to Anthropic API...', colors.yellow)
    const isConnected = await testAnthropicConnection()

    if (isConnected) {
      log('✓ Connection successful!', colors.green)
      return true
    } else {
      log('✗ Connection failed', colors.red)
      return false
    }
  } catch (error: any) {
    log('✗ Connection test error: ' + error.message, colors.red)
    return false
  }
}

async function test2_BasicCompletion() {
  logSection('TEST 2: Basic Completion')

  try {
    log('Sending basic chat completion request...', colors.yellow)

    const result = await createChatCompletion({
      messages: [
        {
          role: 'user',
          content: 'What is blipee and what does it do? Answer in 2-3 sentences.',
        },
      ],
      max_tokens: 200,
    })

    log('✓ Completion successful!', colors.green)
    log('\nResponse:', colors.cyan)
    console.log(result.content)
    log('\nMetrics:', colors.cyan)
    console.log(`  Model: ${result.model}`)
    console.log(`  Input tokens: ${result.usage.input_tokens}`)
    console.log(`  Output tokens: ${result.usage.output_tokens}`)
    console.log(`  Latency: ${result.latency_ms}ms`)
    console.log(`  Cost: $${result.cost_usd.toFixed(6)}`)

    return true
  } catch (error: any) {
    log('✗ Basic completion error: ' + error.message, colors.red)
    console.error(error)
    return false
  }
}

async function test3_SystemPromptWithAgent() {
  logSection('TEST 3: System Prompt with Agent')

  try {
    log('Testing system prompt builder with Carbon Hunter agent...', colors.yellow)

    const systemPrompt = buildSystemPrompt({
      agentType: 'carbon_hunter' as AgentType,
      personality: {
        tone: 'professional',
        proactivity: 'medium',
        detail_level: 'balanced',
      },
      preferences: {
        response_format: 'mixed',
        include_examples: true,
        show_technical_details: false,
        suggest_improvements: true,
      },
      organizationContext: {
        name: 'Test Company',
        industry: 'Manufacturing',
        size: 'Medium (50-250 employees)',
      },
    })

    log('✓ System prompt generated', colors.green)
    log('\nSystem Prompt (first 500 chars):', colors.cyan)
    console.log(systemPrompt.substring(0, 500) + '...\n')

    log('Sending completion with system prompt...', colors.yellow)

    const result = await createChatCompletion({
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: 'What are the top 3 ways a manufacturing company can reduce its carbon emissions?',
        },
      ],
      max_tokens: 500,
    })

    log('✓ Completion with system prompt successful!', colors.green)
    log('\nResponse:', colors.cyan)
    console.log(result.content)
    log('\nMetrics:', colors.cyan)
    console.log(`  Latency: ${result.latency_ms}ms`)
    console.log(`  Cost: $${result.cost_usd.toFixed(6)}`)

    return true
  } catch (error: any) {
    log('✗ System prompt test error: ' + error.message, colors.red)
    console.error(error)
    return false
  }
}

async function test4_StreamingCompletion() {
  logSection('TEST 4: Streaming Completion')

  try {
    log('Testing streaming completion...', colors.yellow)

    const stream = createStreamingChatCompletion({
      messages: [
        {
          role: 'user',
          content: 'List 5 benefits of renewable energy in buildings. Be concise.',
        },
      ],
      max_tokens: 300,
    })

    log('✓ Stream started, receiving chunks...', colors.green)
    log('\nStreaming response:', colors.cyan)

    let chunkCount = 0
    for await (const chunk of stream) {
      process.stdout.write(chunk)
      chunkCount++
    }

    log(`\n\n✓ Streaming completed! Received ${chunkCount} chunks`, colors.green)

    return true
  } catch (error: any) {
    log('✗ Streaming test error: ' + error.message, colors.red)
    console.error(error)
    return false
  }
}

async function test5_ConversationHistory() {
  logSection('TEST 5: Conversation with History')

  try {
    log('Testing multi-turn conversation...', colors.yellow)

    // First message
    const response1 = await createChatCompletion({
      messages: [
        {
          role: 'user',
          content: 'What is Scope 1 emissions?',
        },
      ],
      max_tokens: 150,
    })

    log('✓ First response received', colors.green)
    log('\nFirst response:', colors.cyan)
    console.log(response1.content.substring(0, 200) + '...\n')

    // Follow-up message with history
    log('Sending follow-up with conversation history...', colors.yellow)

    const response2 = await createChatCompletion({
      messages: [
        {
          role: 'user',
          content: 'What is Scope 1 emissions?',
        },
        {
          role: 'assistant',
          content: response1.content,
        },
        {
          role: 'user',
          content: 'Give me 2 examples of Scope 1 emissions in a building.',
        },
      ],
      max_tokens: 200,
    })

    log('✓ Follow-up response received', colors.green)
    log('\nFollow-up response:', colors.cyan)
    console.log(response2.content)

    return true
  } catch (error: any) {
    log('✗ Conversation history test error: ' + error.message, colors.red)
    console.error(error)
    return false
  }
}

// ============================================
// MAIN TEST RUNNER
// ============================================

async function runAllTests() {
  console.clear()
  log('\n🤖 BLIPEE CHAT INTEGRATION TEST SUITE\n', colors.bright + colors.cyan)

  const results = {
    test1: false,
    test2: false,
    test3: false,
    test4: false,
    test5: false,
  }

  // Run tests sequentially
  results.test1 = await test1_ConnectionTest()

  if (results.test1) {
    results.test2 = await test2_BasicCompletion()
    results.test3 = await test3_SystemPromptWithAgent()
    results.test4 = await test4_StreamingCompletion()
    results.test5 = await test5_ConversationHistory()
  } else {
    log('\n⚠️  Skipping remaining tests due to connection failure\n', colors.yellow)
  }

  // Summary
  logSection('TEST SUMMARY')

  const testNames = [
    'Connection Test',
    'Basic Completion',
    'System Prompt with Agent',
    'Streaming Completion',
    'Conversation History',
  ]

  Object.entries(results).forEach(([key, passed], index) => {
    const icon = passed ? '✓' : '✗'
    const color = passed ? colors.green : colors.red
    log(`${icon} ${testNames[index]}`, color)
  })

  const passedCount = Object.values(results).filter(Boolean).length
  const totalCount = Object.keys(results).length

  console.log('\n' + '='.repeat(60))
  if (passedCount === totalCount) {
    log(`\n🎉 ALL TESTS PASSED (${passedCount}/${totalCount})`, colors.bright + colors.green)
  } else {
    log(`\n⚠️  SOME TESTS FAILED (${passedCount}/${totalCount})`, colors.bright + colors.yellow)
  }
  console.log('\n' + '='.repeat(60) + '\n')

  process.exit(passedCount === totalCount ? 0 : 1)
}

// Run tests
runAllTests().catch((error) => {
  log('\n✗ Test suite crashed: ' + error.message, colors.red)
  console.error(error)
  process.exit(1)
})
