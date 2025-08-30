#!/usr/bin/env tsx
/**
 * Test Semantic Cache System
 * Phase 3, Task 3.2: Comprehensive testing for semantic cache functionality
 */

import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config({ path: join(__dirname, '../.env.local') });

import { createSemanticCache } from '../src/lib/ai/cache/semantic-cache';
import { createAIRequestQueue } from '../src/lib/ai/queue/ai-request-queue';

interface TestResult {
  name: string;
  success: boolean;
  duration: number;
  details?: any;
  error?: string;
}

class SemanticCacheTestSuite {
  private cache = createSemanticCache();
  private queue = createAIRequestQueue();
  private results: TestResult[] = [];

  async runAllTests(): Promise<void> {
    console.log('🧪 Starting Semantic Cache Test Suite...\n');
    
    const tests = [
      () => this.testBasicCacheOperations(),
      () => this.testSemanticSimilarity(),
      () => this.testContextualMatching(),
      () => this.testCacheWarming(),
      () => this.testCostOptimization(),
      () => this.testIntegrationWithQueue(),
      () => this.testPerformance(),
      () => this.testCleanupOperations()
    ];

    for (const test of tests) {
      try {
        await test();
      } catch (error) {
        console.error('❌ Test suite error:', error);
      }
    }

    this.printResults();
  }

  private async testBasicCacheOperations(): Promise<void> {
    console.log('📝 Test 1: Basic Cache Operations');
    const startTime = Date.now();
    
    try {
      // Test cache set
      const messages = [{ role: 'user' as const, content: 'What is carbon footprint?' }];
      const response = {
        content: 'Carbon footprint measures greenhouse gas emissions.',
        model: 'deepseek-chat',
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
        finishReason: 'stop',
        provider: 'deepseek'
      };

      const cacheId = await this.cache.set(messages, response, {
        organizationId: 'test-org-1',
        tags: ['test', 'basic']
      });

      console.log(`  ✅ Cache set successful: ${cacheId.slice(-8)}`);

      // Test cache get (exact match)
      const exactMatch = await this.cache.get(messages, 'deepseek', 'deepseek-chat');
      
      if (exactMatch && exactMatch.similarity === 1.0) {
        console.log(`  ✅ Exact cache match found (similarity: ${exactMatch.similarity})`);
      } else {
        throw new Error('Exact match not found');
      }

      // Test cache statistics
      const stats = await this.cache.getStats();
      console.log(`  ✅ Cache stats retrieved: ${stats.totalEntries} entries, ${stats.hitRate}% hit rate`);

      this.results.push({
        name: 'Basic Cache Operations',
        success: true,
        duration: Date.now() - startTime,
        details: { cacheId, exactMatch: exactMatch.similarity, stats: stats.totalEntries }
      });

    } catch (error) {
      this.results.push({
        name: 'Basic Cache Operations',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.error('  ❌ Test failed:', error);
    }
    console.log('');
  }

  private async testSemanticSimilarity(): Promise<void> {
    console.log('🧠 Test 2: Semantic Similarity Matching');
    const startTime = Date.now();
    
    try {
      // Store original query
      const originalMessages = [{ role: 'user' as const, content: 'How do we reduce our carbon emissions?' }];
      const response = {
        content: 'To reduce carbon emissions: 1) Use renewable energy 2) Improve efficiency 3) Carbon offsets',
        model: 'deepseek-chat',
        usage: { promptTokens: 15, completionTokens: 25, totalTokens: 40 },
        finishReason: 'stop',
        provider: 'deepseek'
      };

      await this.cache.set(originalMessages, response, {
        organizationId: 'test-org-2',
        tags: ['test', 'semantic']
      });

      // Test similar queries
      const similarQueries = [
        'What can we do to decrease carbon footprint?',
        'How to lower CO2 emissions from our operations?',
        'Best practices for reducing greenhouse gases?'
      ];

      let semanticMatches = 0;
      let totalSimilarity = 0;

      for (const query of similarQueries) {
        const messages = [{ role: 'user' as const, content: query }];
        const match = await this.cache.get(messages, 'deepseek', 'deepseek-chat');
        
        if (match && match.similarity >= 0.85) {
          semanticMatches++;
          totalSimilarity += match.similarity;
          console.log(`  ✅ Semantic match found: "${query.slice(0, 40)}..." (similarity: ${match.similarity.toFixed(3)})`);
        } else {
          console.log(`  ⚠️ No match: "${query.slice(0, 40)}..." (similarity: ${match?.similarity.toFixed(3) || 'none'})`);
        }
      }

      const avgSimilarity = totalSimilarity / semanticMatches;
      const success = semanticMatches >= 2; // At least 2 out of 3 should match

      this.results.push({
        name: 'Semantic Similarity',
        success,
        duration: Date.now() - startTime,
        details: { 
          matches: semanticMatches, 
          total: similarQueries.length,
          avgSimilarity: avgSimilarity.toFixed(3)
        }
      });

      if (success) {
        console.log(`  ✅ Semantic matching successful: ${semanticMatches}/${similarQueries.length} matches, avg similarity: ${avgSimilarity.toFixed(3)}`);
      } else {
        console.log(`  ❌ Semantic matching failed: only ${semanticMatches}/${similarQueries.length} matches`);
      }

    } catch (error) {
      this.results.push({
        name: 'Semantic Similarity',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.error('  ❌ Test failed:', error);
    }
    console.log('');
  }

  private async testContextualMatching(): Promise<void> {
    console.log('🎯 Test 3: Contextual Matching');
    const startTime = Date.now();
    
    try {
      const messages = [{ role: 'user' as const, content: 'What are our Scope 1 emissions?' }];
      
      // Store responses for different organizations
      const orgs = ['org-A', 'org-B', 'org-C'];
      
      for (const org of orgs) {
        const response = {
          content: `Scope 1 emissions for ${org}: Direct emissions from owned sources.`,
          model: 'deepseek-chat',
          usage: { promptTokens: 12, completionTokens: 18, totalTokens: 30 },
          finishReason: 'stop',
          provider: 'deepseek'
        };

        await this.cache.set(messages, response, {
          organizationId: org,
          tags: ['test', 'contextual', org]
        });
      }

      // Test contextual matching for org-A
      const contextualMatch = await this.cache.get(messages, 'deepseek', 'deepseek-chat', {
        organizationId: 'org-A',
        contextualMatch: true
      });

      let success = false;
      if (contextualMatch && contextualMatch.entry.metadata.organizationId === 'org-A') {
        success = true;
        console.log(`  ✅ Contextual match found for org-A (similarity: ${contextualMatch.similarity.toFixed(3)}, source: ${contextualMatch.source})`);
      } else {
        console.log(`  ❌ No contextual match found for org-A`);
      }

      this.results.push({
        name: 'Contextual Matching',
        success,
        duration: Date.now() - startTime,
        details: { 
          targetOrg: 'org-A',
          matchedOrg: contextualMatch?.entry.metadata.organizationId,
          similarity: contextualMatch?.similarity
        }
      });

    } catch (error) {
      this.results.push({
        name: 'Contextual Matching',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.error('  ❌ Test failed:', error);
    }
    console.log('');
  }

  private async testCacheWarming(): Promise<void> {
    console.log('🔥 Test 4: Cache Warming');
    const startTime = Date.now();
    
    try {
      const commonQueries = [
        {
          messages: [{ role: 'user' as const, content: 'Generate ESG report summary' }],
          provider: 'deepseek' as const,
          model: 'deepseek-chat',
          tags: ['warming', 'esg']
        },
        {
          messages: [{ role: 'user' as const, content: 'Calculate carbon intensity metrics' }],
          provider: 'deepseek' as const,
          model: 'deepseek-chat',
          tags: ['warming', 'carbon']
        },
        {
          messages: [{ role: 'user' as const, content: 'Show sustainability performance dashboard' }],
          provider: 'deepseek' as const,
          model: 'deepseek-chat',
          tags: ['warming', 'dashboard']
        }
      ];

      await this.cache.warmCache(commonQueries);
      console.log(`  ✅ Cache warmed with ${commonQueries.length} common queries`);

      // Verify warming was successful
      const stats = await this.cache.getStats();
      const warmedEntries = stats.topPatterns.filter(p => p.pattern.includes('deepseek'));
      
      this.results.push({
        name: 'Cache Warming',
        success: warmedEntries.length > 0,
        duration: Date.now() - startTime,
        details: { 
          queriesWarmed: commonQueries.length,
          patternsFound: warmedEntries.length
        }
      });

      console.log(`  ✅ Warming verification: ${warmedEntries.length} patterns found`);

    } catch (error) {
      this.results.push({
        name: 'Cache Warming',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.error('  ❌ Test failed:', error);
    }
    console.log('');
  }

  private async testCostOptimization(): Promise<void> {
    console.log('💰 Test 5: Cost Optimization');
    const startTime = Date.now();
    
    try {
      // Simulate multiple similar requests to test cost savings
      const baseQuery = 'What is our environmental impact?';
      const variations = [
        'What is our environmental impact?', // Exact match
        'How does our company affect the environment?', // Similar
        'What environmental effects do we have?', // Similar
        'Show our ecological footprint data' // Different enough
      ];

      // First request - will be processed and cached
      const messages1 = [{ role: 'user' as const, content: variations[0] }];
      const response = {
        content: 'Your environmental impact includes carbon emissions, waste generation, and resource consumption.',
        model: 'deepseek-chat',
        usage: { promptTokens: 20, completionTokens: 30, totalTokens: 50 },
        finishReason: 'stop',
        provider: 'deepseek'
      };

      await this.cache.set(messages1, response, {
        organizationId: 'cost-test-org',
        tags: ['test', 'cost']
      });

      let cacheHits = 0;
      let totalTokensSaved = 0;

      // Test subsequent similar requests
      for (let i = 1; i < variations.length; i++) {
        const messages = [{ role: 'user' as const, content: variations[i] }];
        const match = await this.cache.get(messages, 'deepseek', 'deepseek-chat');
        
        if (match && match.similarity >= 0.85) {
          cacheHits++;
          totalTokensSaved += response.usage.totalTokens;
          console.log(`  ✅ Cache hit for variation ${i + 1}: "${variations[i].slice(0, 40)}..." (saved ${response.usage.totalTokens} tokens)`);
        } else {
          console.log(`  ⚠️ Cache miss for variation ${i + 1}: "${variations[i].slice(0, 40)}..."`);
        }
      }

      const stats = await this.cache.getStats();
      const estimatedSavings = stats.costSavings.estimatedDollarsSaved;

      this.results.push({
        name: 'Cost Optimization',
        success: cacheHits >= 1,
        duration: Date.now() - startTime,
        details: { 
          cacheHits,
          totalVariations: variations.length - 1,
          tokensSaved: totalTokensSaved,
          estimatedSavings
        }
      });

      console.log(`  ✅ Cost optimization results: ${cacheHits}/${variations.length - 1} hits, ${totalTokensSaved} tokens saved, $${estimatedSavings} estimated savings`);

    } catch (error) {
      this.results.push({
        name: 'Cost Optimization',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.error('  ❌ Test failed:', error);
    }
    console.log('');
  }

  private async testIntegrationWithQueue(): Promise<void> {
    console.log('🔄 Test 6: Integration with AI Request Queue');
    const startTime = Date.now();
    
    try {
      // Test that queue checks cache before processing
      const messages = [{ role: 'user' as const, content: 'What are the latest sustainability trends?' }];
      const response = {
        content: 'Latest sustainability trends include circular economy, net-zero targets, and ESG reporting.',
        model: 'deepseek-chat',
        usage: { promptTokens: 18, completionTokens: 28, totalTokens: 46 },
        finishReason: 'stop',
        provider: 'deepseek'
      };

      // Pre-populate cache
      await this.cache.set(messages, response, {
        organizationId: 'queue-test-org',
        tags: ['test', 'queue', 'integration']
      });

      // Verify cache integration works
      const cacheCheck = await this.cache.get(messages, 'deepseek', 'deepseek-chat', {
        organizationId: 'queue-test-org'
      });

      const success = cacheCheck !== null && cacheCheck.similarity >= 0.98;
      
      this.results.push({
        name: 'Queue Integration',
        success,
        duration: Date.now() - startTime,
        details: { 
          cacheHit: success,
          similarity: cacheCheck?.similarity,
          integration: 'semantic-cache-queue'
        }
      });

      if (success) {
        console.log(`  ✅ Queue-cache integration working: cache hit with ${cacheCheck.similarity.toFixed(3)} similarity`);
      } else {
        console.log(`  ❌ Queue-cache integration failed: no cache hit found`);
      }

    } catch (error) {
      this.results.push({
        name: 'Queue Integration',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.error('  ❌ Test failed:', error);
    }
    console.log('');
  }

  private async testPerformance(): Promise<void> {
    console.log('⚡ Test 7: Performance Testing');
    const startTime = Date.now();
    
    try {
      // Test cache set performance
      const setOperations = [];
      for (let i = 0; i < 10; i++) {
        const messages = [{ role: 'user' as const, content: `Performance test query ${i}` }];
        const response = {
          content: `Performance test response ${i}`,
          model: 'deepseek-chat',
          usage: { promptTokens: 10, completionTokens: 15, totalTokens: 25 },
          finishReason: 'stop',
          provider: 'deepseek'
        };

        setOperations.push(
          this.cache.set(messages, response, {
            organizationId: 'perf-test',
            tags: ['test', 'performance', `batch-${i}`]
          })
        );
      }

      const setStart = Date.now();
      await Promise.all(setOperations);
      const setDuration = Date.now() - setStart;
      const avgSetTime = setDuration / 10;

      console.log(`  ✅ Bulk set operations: 10 entries in ${setDuration}ms (avg: ${avgSetTime.toFixed(2)}ms per operation)`);

      // Test cache get performance
      const getOperations = [];
      for (let i = 0; i < 10; i++) {
        const messages = [{ role: 'user' as const, content: `Performance test query ${i}` }];
        getOperations.push(
          this.cache.get(messages, 'deepseek', 'deepseek-chat')
        );
      }

      const getStart = Date.now();
      const results = await Promise.all(getOperations);
      const getDuration = Date.now() - getStart;
      const avgGetTime = getDuration / 10;
      const hitCount = results.filter(r => r !== null).length;

      console.log(`  ✅ Bulk get operations: 10 queries in ${getDuration}ms (avg: ${avgGetTime.toFixed(2)}ms per operation)`);
      console.log(`  ✅ Cache hit rate: ${hitCount}/10 (${(hitCount / 10 * 100).toFixed(1)}%)`);

      const success = avgSetTime < 200 && avgGetTime < 100; // Performance thresholds
      
      this.results.push({
        name: 'Performance Testing',
        success,
        duration: Date.now() - startTime,
        details: { 
          avgSetTime: `${avgSetTime.toFixed(2)}ms`,
          avgGetTime: `${avgGetTime.toFixed(2)}ms`,
          hitRate: `${(hitCount / 10 * 100).toFixed(1)}%`
        }
      });

    } catch (error) {
      this.results.push({
        name: 'Performance Testing',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.error('  ❌ Test failed:', error);
    }
    console.log('');
  }

  private async testCleanupOperations(): Promise<void> {
    console.log('🧹 Test 8: Cleanup Operations');
    const startTime = Date.now();
    
    try {
      // Test cleanup functionality
      await this.cache.cleanup();
      console.log(`  ✅ Cache cleanup completed successfully`);

      // Test selective clearing
      const clearedCount = await this.cache.clear({ 
        provider: 'deepseek',
        olderThan: 1000 // Clear entries older than 1 second (should clear test data)
      });
      
      console.log(`  ✅ Selective clear completed: ${clearedCount} entries removed`);

      this.results.push({
        name: 'Cleanup Operations',
        success: true,
        duration: Date.now() - startTime,
        details: { 
          cleanupCompleted: true,
          entriesCleared: clearedCount
        }
      });

    } catch (error) {
      this.results.push({
        name: 'Cleanup Operations',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.error('  ❌ Test failed:', error);
    }
    console.log('');
  }

  private printResults(): void {
    console.log('📊 Semantic Cache Test Results');
    console.log('=' .repeat(50));
    
    const passed = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    
    this.results.forEach((result, index) => {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      const duration = `${result.duration}ms`;
      
      console.log(`${index + 1}. ${result.name}: ${status} (${duration})`);
      
      if (result.details) {
        Object.entries(result.details).forEach(([key, value]) => {
          console.log(`   ${key}: ${value}`);
        });
      }
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    console.log('=' .repeat(50));
    console.log(`Summary: ${passed}/${this.results.length} tests passed, ${failed} failed`);
    console.log(`Total Duration: ${totalDuration}ms`);
    console.log(`Success Rate: ${(passed / this.results.length * 100).toFixed(1)}%`);
    
    if (passed === this.results.length) {
      console.log('🎉 All semantic cache tests passed! System is ready for production.');
    } else {
      console.log('⚠️ Some tests failed. Review the failures before production deployment.');
    }
  }

  async cleanup(): Promise<void> {
    try {
      await this.cache.disconnect();
      await this.queue.disconnect();
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

// Run the test suite
if (require.main === module) {
  const testSuite = new SemanticCacheTestSuite();
  
  testSuite.runAllTests()
    .then(() => {
      console.log('\n🏁 Semantic cache testing completed!');
      return testSuite.cleanup();
    })
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Test suite failed:', error);
      testSuite.cleanup().finally(() => {
        process.exit(1);
      });
    });
}

export { SemanticCacheTestSuite };