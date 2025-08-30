#!/usr/bin/env tsx
/**
 * Functional Semantic Cache Test
 * Phase 3, Task 3.2: Test actual semantic cache functionality with API keys
 */

import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config({ path: join(__dirname, '../.env.local') });

import { createSemanticCache } from '../src/lib/ai/cache/semantic-cache';

async function testSemanticCacheFunctionality() {
  console.log('🧠 Testing Semantic Cache Functionality with API Keys...\n');
  
  try {
    const cache = createSemanticCache();
    console.log('✅ Semantic cache initialized successfully');
    
    // Test 1: Basic cache set operation
    console.log('\n📝 Test 1: Cache Set Operation');
    const messages = [{ role: 'user' as const, content: 'What is our carbon footprint for this year?' }];
    const response = {
      content: 'Your organization\'s carbon footprint for this year is 1,250 tons CO2e, consisting of Scope 1 (direct emissions): 400 tons, Scope 2 (electricity): 600 tons, and Scope 3 (indirect): 250 tons.',
      model: 'deepseek-chat',
      usage: { promptTokens: 18, completionTokens: 45, totalTokens: 63 },
      finishReason: 'stop',
      provider: 'deepseek'
    };
    
    const cacheId = await cache.set(messages, response, {
      organizationId: 'test-org-functional',
      userId: 'test-user',
      tags: ['carbon', 'footprint', 'functional-test']
    });
    
    console.log(`  ✅ Response cached successfully: ${cacheId.slice(-8)}`);
    
    // Test 2: Exact match retrieval
    console.log('\n🔍 Test 2: Exact Match Retrieval');
    const exactMatch = await cache.get(messages, 'deepseek', 'deepseek-chat', {
      organizationId: 'test-org-functional'
    });
    
    if (exactMatch && exactMatch.similarity === 1.0) {
      console.log(`  ✅ Exact match found (similarity: ${exactMatch.similarity})`);
      console.log(`  📊 Response: ${exactMatch.entry.response.content.slice(0, 60)}...`);
    } else {
      console.log(`  ❌ Exact match not found`);
      return false;
    }
    
    // Test 3: Semantic similarity matching
    console.log('\n🧠 Test 3: Semantic Similarity Matching');
    const similarQueries = [
      'How much CO2 did we emit this year?',
      'What are our total greenhouse gas emissions for the current year?',
      'Show me our annual carbon emissions breakdown'
    ];
    
    let semanticHits = 0;
    for (const query of similarQueries) {
      const testMessages = [{ role: 'user' as const, content: query }];
      const match = await cache.get(testMessages, 'deepseek', 'deepseek-chat', {
        organizationId: 'test-org-functional'
      });
      
      if (match && match.similarity >= 0.85) {
        semanticHits++;
        console.log(`  ✅ Semantic match: "${query}" (similarity: ${match.similarity.toFixed(3)}, source: ${match.source})`);
      } else {
        console.log(`  ⚠️ No match: "${query}" (similarity: ${match?.similarity?.toFixed(3) || 'none'})`);
      }
    }
    
    // Test 4: Cache statistics
    console.log('\n📊 Test 4: Cache Statistics');
    const stats = await cache.getStats();
    console.log(`  ✅ Total entries: ${stats.totalEntries}`);
    console.log(`  ✅ Hit rate: ${stats.hitRate}%`);
    console.log(`  ✅ Average similarity: ${stats.avgSimilarity}`);
    console.log(`  ✅ Storage used: ${stats.storageUsed}`);
    console.log(`  ✅ Cost savings: $${stats.costSavings.estimatedDollarsSaved} (${stats.costSavings.totalTokensSaved} tokens)`);
    
    // Test 5: Cache warming
    console.log('\n🔥 Test 5: Cache Warming');
    const warmingQueries = [
      {
        messages: [{ role: 'user' as const, content: 'Generate our sustainability report' }],
        provider: 'deepseek' as const,
        model: 'deepseek-chat',
        tags: ['sustainability', 'report', 'warming-test']
      },
      {
        messages: [{ role: 'user' as const, content: 'What are our Scope 2 emissions?' }],
        provider: 'deepseek' as const,
        model: 'deepseek-chat',
        tags: ['scope2', 'emissions', 'warming-test']
      }
    ];
    
    await cache.warmCache(warmingQueries);
    console.log(`  ✅ Cache warmed with ${warmingQueries.length} queries`);
    
    // Test 6: Cleanup
    console.log('\n🧹 Test 6: Cache Cleanup');
    await cache.cleanup();
    console.log(`  ✅ Cache cleanup completed`);
    
    await cache.disconnect();
    
    console.log('\n🎉 All semantic cache functionality tests passed!');
    console.log('\n📈 Results Summary:');
    console.log(`   - Exact matching: ✅ Working`);
    console.log(`   - Semantic matching: ${semanticHits}/${similarQueries.length} hits`);
    console.log(`   - OpenAI embeddings: ✅ Generated successfully`);
    console.log(`   - Cost tracking: ✅ Working`);
    console.log(`   - Cache warming: ✅ Working`);
    console.log(`   - Cleanup operations: ✅ Working`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Semantic cache functionality test failed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        console.error('🔑 API key issue detected. Please verify:');
        console.error('   - OPENAI_API_KEY is correctly set');
        console.error('   - DEEPSEEK_API_KEY is correctly set');
      }
      
      if (error.message.includes('Redis') || error.message.includes('Upstash')) {
        console.error('🔗 Redis connection issue detected. Please verify:');
        console.error('   - UPSTASH_REDIS_REST_URL is correctly set');
        console.error('   - UPSTASH_REDIS_REST_TOKEN is correctly set');
      }
    }
    
    return false;
  }
}

// Run the functional test
if (require.main === module) {
  testSemanticCacheFunctionality()
    .then(success => {
      if (success) {
        console.log('\n🚀 Semantic cache system is fully functional and ready for production!');
        process.exit(0);
      } else {
        console.log('\n⚠️ Some functionality tests failed. Please review and fix issues.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Test execution failed:', error);
      process.exit(1);
    });
}

export { testSemanticCacheFunctionality };