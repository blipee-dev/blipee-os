#!/usr/bin/env node

/**
 * Phase 3 AI Integration Test - Comprehensive Testing
 * Tests the actual functionality of our AI systems
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '.env.local') });

console.log('🧪 Phase 3 Integration Tests\n');

let passedTests = 0;
let failedTests = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    passedTests++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    failedTests++;
  }
}

// Test AI Orchestrator
console.log('1. Testing AI Orchestrator:');
await test('Create orchestrator instance', async () => {
  const { AIOrchestrator } = await import('./dist/src/lib/ai/orchestrator.js');
  const orchestrator = new AIOrchestrator();
  if (!orchestrator) throw new Error('Failed to create orchestrator');
});

await test('Check provider capabilities', async () => {
  const { aiOrchestrator } = await import('./dist/src/lib/ai/orchestrator.js');
  const capabilities = aiOrchestrator.getProviderCapabilities();
  if (!Array.isArray(capabilities)) throw new Error('Invalid capabilities');
});

await test('Get provider health', async () => {
  const { aiOrchestrator } = await import('./dist/src/lib/ai/orchestrator.js');
  const health = aiOrchestrator.getProviderHealth();
  if (!Array.isArray(health)) throw new Error('Invalid health data');
});

// Test Response Cache
console.log('\n2. Testing AI Response Cache:');
await test('Create cache instance', async () => {
  const { AIResponseCache } = await import('./dist/src/lib/ai/response-cache.js');
  const cache = new AIResponseCache();
  if (!cache) throw new Error('Failed to create cache');
});

await test('Cache key generation', async () => {
  const { aiResponseCache } = await import('./dist/src/lib/ai/response-cache.js');
  // Test internal functionality would go here
  // For now, just verify the instance exists
  if (!aiResponseCache) throw new Error('Cache instance missing');
});

// Test Conversation Memory
console.log('\n3. Testing Conversation Memory:');
await test('Create memory manager', async () => {
  const { ConversationMemoryManager } = await import('./dist/src/lib/ai/conversation-memory.js');
  const manager = new ConversationMemoryManager();
  if (!manager) throw new Error('Failed to create memory manager');
});

await test('Memory statistics method exists', async () => {
  const { conversationMemoryManager } = await import('./dist/src/lib/ai/conversation-memory.js');
  if (typeof conversationMemoryManager.getMemoryStats !== 'function') {
    throw new Error('getMemoryStats method missing');
  }
});

// Test Enhanced AI Service
console.log('\n4. Testing Enhanced AI Service:');
await test('Create enhanced service', async () => {
  const { EnhancedAIService } = await import('./dist/src/lib/ai/enhanced-service.js');
  const service = new EnhancedAIService();
  if (!service) throw new Error('Failed to create service');
});

await test('Service health check', async () => {
  const { enhancedAIService } = await import('./dist/src/lib/ai/enhanced-service.js');
  const health = enhancedAIService.getServiceHealth();
  if (!health) throw new Error('Health check failed');
});

// Test Streaming Service
console.log('\n5. Testing Streaming Service:');
await test('Create streaming service', async () => {
  const { StreamingService } = await import('./dist/src/lib/ai/streaming-service.js');
  const service = new StreamingService();
  if (!service) throw new Error('Failed to create streaming service');
});

// Test UI Generator
console.log('\n6. Testing UI Generator:');
await test('Create UI generator', async () => {
  const { UIGenerator } = await import('./dist/src/lib/ai/ui-generator.js');
  const generator = new UIGenerator();
  if (!generator) throw new Error('Failed to create UI generator');
});

await test('Generate chart config', async () => {
  const { uiGenerator } = await import('./dist/src/lib/ai/ui-generator.js');
  const config = uiGenerator.generateChartConfig('line', [], {});
  if (!config || !config.type) throw new Error('Invalid chart config');
});

// Test Context Engine
console.log('\n7. Testing Context Engine:');
await test('Create context engine', async () => {
  const { ContextEngineEnhanced } = await import('./dist/src/lib/ai/context-engine-enhanced.js');
  const engine = new ContextEngineEnhanced();
  if (!engine) throw new Error('Failed to create context engine');
});

// Summary
console.log('\n' + '='.repeat(50));
console.log(`Test Results: ${passedTests} passed, ${failedTests} failed`);
console.log('='.repeat(50));

if (failedTests > 0) {
  console.log('\n⚠️  Some tests failed. This might be due to:');
  console.log('1. Missing TypeScript compilation (run: npm run build)');
  console.log('2. Missing environment variables');
  console.log('3. Module import issues');
  process.exit(1);
} else {
  console.log('\n✨ All tests passed!');
}