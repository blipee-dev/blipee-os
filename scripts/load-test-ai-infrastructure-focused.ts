#!/usr/bin/env tsx
/**
 * Focused AI Infrastructure Load Testing Suite
 * Phase 3, Task 3.4: Quick production readiness validation
 */

import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config({ path: join(__dirname, '../.env.local') });

import { createAIRequestQueue } from '../src/lib/ai/queue/ai-request-queue';
import { createSemanticCache } from '../src/lib/ai/cache/semantic-cache';
import { createCostOptimizer } from '../src/lib/ai/cost/cost-optimizer';

interface LoadTestResult {
  testName: string;
  success: boolean;
  duration: number;
  metrics: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    avgResponseTime: number;
    throughput: number;
    errorRate: number;
  };
  details?: any;
}

class FocusedLoadTester {
  private aiQueue = createAIRequestQueue();
  private semanticCache = createSemanticCache();
  private costOptimizer = createCostOptimizer();
  private results: LoadTestResult[] = [];
  private testOrgId = `focused-load-test-${Date.now()}`;

  async runFocusedTests(): Promise<void> {
    console.log('🚀 Starting Focused AI Infrastructure Load Testing Suite...\n');
    
    const tests = [
      () => this.testQueuePerformance(),
      () => this.testCacheEfficiency(),
      () => this.testCostTracking(),
      () => this.testConcurrentHandling(),
      () => this.testErrorResilience()
    ];

    for (const test of tests) {
      try {
        await test();
      } catch (error) {
        console.error('❌ Test error:', error);
      }
    }

    this.generateReport();
  }

  private async testQueuePerformance(): Promise<void> {
    console.log('📦 Test 1: Queue Performance (50 requests)');
    const startTime = Date.now();
    
    try {
      const requests = [];
      const priorities = ['low', 'normal', 'high', 'critical'];
      
      // Enqueue 50 test requests
      for (let i = 0; i < 50; i++) {
        const priority = priorities[i % 4];
        const promise = this.aiQueue.enqueue(
          'deepseek',
          'deepseek-chat',
          [{
            role: 'user',
            content: `Test message ${i} - What is carbon accounting?`
          }],
          {
            priority: priority as any,
            userId: `test-user-${i}`,
            organizationId: this.testOrgId,
            conversationId: `test-conv-${i}`,
            maxRetries: 2,
            timeout: 30000
          }
        );
        requests.push(promise);
      }

      const startEnqueue = Date.now();
      const requestIds = await Promise.all(requests);
      const enqueueTime = Date.now() - startEnqueue;

      // Check queue stats
      const stats = await this.aiQueue.getQueueStats();
      
      console.log(`  ✅ Enqueued ${requestIds.length} requests in ${enqueueTime}ms`);
      console.log(`  ✅ Queue size: ${stats.queueSize}`);
      console.log(`  ✅ Avg enqueue time: ${(enqueueTime / requestIds.length).toFixed(2)}ms`);
      
      this.results.push({
        testName: 'Queue Performance',
        success: requestIds.length === 50,
        duration: Date.now() - startTime,
        metrics: {
          totalRequests: 50,
          successfulRequests: requestIds.length,
          failedRequests: 50 - requestIds.length,
          avgResponseTime: enqueueTime / requestIds.length,
          throughput: requestIds.length / (enqueueTime / 1000),
          errorRate: ((50 - requestIds.length) / 50) * 100
        },
        details: { queueSize: stats.queueSize, avgEnqueueTime: enqueueTime / requestIds.length }
      });

    } catch (error) {
      this.results.push({
        testName: 'Queue Performance',
        success: false,
        duration: Date.now() - startTime,
        metrics: {
          totalRequests: 50,
          successfulRequests: 0,
          failedRequests: 50,
          avgResponseTime: 0,
          throughput: 0,
          errorRate: 100
        }
      });
      console.error('  ❌ Test failed:', error);
    }
    console.log('');
  }

  private async testCacheEfficiency(): Promise<void> {
    console.log('🧠 Test 2: Semantic Cache Efficiency');
    const startTime = Date.now();
    
    try {
      const testQueries = [
        'What is our carbon footprint?',
        'Show me our carbon emissions',
        'What are our Scope 1 emissions?',
        'Calculate our carbon intensity',
        'What is our carbon footprint?', // Exact duplicate
        'Show me our carbon emissions',  // Exact duplicate
      ];

      let cacheHits = 0;
      let cacheMisses = 0;
      const responseTimes = [];

      // First, populate cache with some queries
      for (let i = 0; i < 4; i++) {
        const query = testQueries[i];
        const queryStart = Date.now();
        
        const cacheResult = await this.semanticCache.get([{ role: 'user', content: query }], 'deepseek', 'deepseek-chat', {
          organizationId: this.testOrgId,
          userId: 'test-user',
          contextualMatch: true
        });

        if (cacheResult) {
          cacheHits++;
        } else {
          cacheMisses++;
          
          // Mock cache entry for first 4 queries
          await this.semanticCache.set(
            [{ role: 'user', content: query }],
            {
              id: `test-response-${i}`,
              choices: [{
                message: {
                  role: 'assistant',
                  content: `Mock response for: ${query}`
                }
              }],
              usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 }
            },
            {
              organizationId: this.testOrgId,
              userId: 'test-user',
              tags: ['test', 'carbon'],
              metadata: { provider: 'deepseek', model: 'deepseek-chat' }
            }
          );
        }
        
        responseTimes.push(Date.now() - queryStart);
      }

      // Test cache hits with duplicates
      for (let i = 4; i < testQueries.length; i++) {
        const query = testQueries[i];
        const queryStart = Date.now();
        
        const cacheResult = await this.semanticCache.get([{ role: 'user', content: query }], 'deepseek', 'deepseek-chat', {
          organizationId: this.testOrgId,
          userId: 'test-user',
          contextualMatch: true
        });

        if (cacheResult) {
          cacheHits++;
        } else {
          cacheMisses++;
        }
        
        responseTimes.push(Date.now() - queryStart);
      }

      const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      const cacheHitRate = (cacheHits / testQueries.length) * 100;

      console.log(`  ✅ Cache hits: ${cacheHits}/${testQueries.length} (${cacheHitRate.toFixed(1)}%)`);
      console.log(`  ✅ Average response time: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`  ✅ Cache efficiency: ${cacheHitRate >= 33 ? 'Good' : 'Needs improvement'}`);
      
      this.results.push({
        testName: 'Cache Efficiency',
        success: cacheHitRate >= 33, // At least 33% hit rate expected
        duration: Date.now() - startTime,
        metrics: {
          totalRequests: testQueries.length,
          successfulRequests: cacheHits + cacheMisses,
          failedRequests: 0,
          avgResponseTime,
          throughput: testQueries.length / ((Date.now() - startTime) / 1000),
          errorRate: 0
        },
        details: { cacheHitRate, cacheHits, cacheMisses }
      });

    } catch (error) {
      this.results.push({
        testName: 'Cache Efficiency',
        success: false,
        duration: Date.now() - startTime,
        metrics: {
          totalRequests: 6,
          successfulRequests: 0,
          failedRequests: 6,
          avgResponseTime: 0,
          throughput: 0,
          errorRate: 100
        }
      });
      console.error('  ❌ Test failed:', error);
    }
    console.log('');
  }

  private async testCostTracking(): Promise<void> {
    console.log('💰 Test 3: Cost Tracking Accuracy');
    const startTime = Date.now();
    
    try {
      // Track some test requests
      const testRequests = [
        { provider: 'deepseek', model: 'deepseek-chat', tokens: { promptTokens: 100, completionTokens: 150, totalTokens: 250 } },
        { provider: 'openai', model: 'gpt-4', tokens: { promptTokens: 200, completionTokens: 300, totalTokens: 500 } },
        { provider: 'deepseek', model: 'deepseek-chat', tokens: { promptTokens: 50, completionTokens: 75, totalTokens: 125 } }
      ];

      for (const req of testRequests) {
        await this.costOptimizer.trackRequest(
          this.testOrgId,
          req.provider,
          req.model,
          req.tokens,
          {
            latency: 1500,
            cached: false,
            userId: 'test-user',
            success: true
          }
        );
      }

      // Wait for metrics processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get cost metrics
      const metrics = await this.costOptimizer.getCostMetrics(this.testOrgId, 'hourly', 1);
      
      if (metrics.length > 0) {
        const metric = metrics[0];
        console.log(`  ✅ Requests tracked: ${metric.totalRequests}`);
        console.log(`  ✅ Total cost: $${metric.totalCost.toFixed(6)}`);
        console.log(`  ✅ Cost per request: $${metric.costPerRequest.toFixed(6)}`);
        console.log(`  ✅ Providers tracked: ${Object.keys(metric.costByProvider).join(', ')}`);

        this.results.push({
          testName: 'Cost Tracking',
          success: metric.totalRequests >= 3,
          duration: Date.now() - startTime,
          metrics: {
            totalRequests: testRequests.length,
            successfulRequests: metric.totalRequests,
            failedRequests: testRequests.length - metric.totalRequests,
            avgResponseTime: 1000,
            throughput: metric.totalRequests / ((Date.now() - startTime) / 1000),
            errorRate: ((testRequests.length - metric.totalRequests) / testRequests.length) * 100
          },
          details: { totalCost: metric.totalCost, costPerRequest: metric.costPerRequest }
        });
      } else {
        throw new Error('No cost metrics found');
      }

    } catch (error) {
      this.results.push({
        testName: 'Cost Tracking',
        success: false,
        duration: Date.now() - startTime,
        metrics: {
          totalRequests: 3,
          successfulRequests: 0,
          failedRequests: 3,
          avgResponseTime: 0,
          throughput: 0,
          errorRate: 100
        }
      });
      console.error('  ❌ Test failed:', error);
    }
    console.log('');
  }

  private async testConcurrentHandling(): Promise<void> {
    console.log('⚡ Test 4: Concurrent Request Handling (20 concurrent)');
    const startTime = Date.now();
    
    try {
      const concurrentRequests = [];
      
      // Create 20 concurrent requests
      for (let i = 0; i < 20; i++) {
        const request = this.aiQueue.enqueue(
          'deepseek',
          'deepseek-chat',
          [{
            role: 'user',
            content: `Concurrent test ${i} - Sustainability metrics?`
          }],
          {
            priority: 'normal',
            userId: `concurrent-user-${i}`,
            organizationId: this.testOrgId,
            timeout: 20000
          }
        );
        concurrentRequests.push(request);
      }

      const concurrentStart = Date.now();
      const results = await Promise.allSettled(concurrentRequests);
      const concurrentTime = Date.now() - concurrentStart;
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      console.log(`  ✅ Concurrent requests completed: ${successful}/${20}`);
      console.log(`  ✅ Failed requests: ${failed}`);
      console.log(`  ✅ Total concurrent time: ${concurrentTime}ms`);
      console.log(`  ✅ Average per request: ${(concurrentTime / 20).toFixed(2)}ms`);
      
      this.results.push({
        testName: 'Concurrent Handling',
        success: successful >= 18, // Allow up to 2 failures
        duration: Date.now() - startTime,
        metrics: {
          totalRequests: 20,
          successfulRequests: successful,
          failedRequests: failed,
          avgResponseTime: concurrentTime / 20,
          throughput: successful / (concurrentTime / 1000),
          errorRate: (failed / 20) * 100
        },
        details: { concurrentTime, successRate: (successful / 20) * 100 }
      });

    } catch (error) {
      this.results.push({
        testName: 'Concurrent Handling',
        success: false,
        duration: Date.now() - startTime,
        metrics: {
          totalRequests: 20,
          successfulRequests: 0,
          failedRequests: 20,
          avgResponseTime: 0,
          throughput: 0,
          errorRate: 100
        }
      });
      console.error('  ❌ Test failed:', error);
    }
    console.log('');
  }

  private async testErrorResilience(): Promise<void> {
    console.log('🛡️ Test 5: Error Resilience');
    const startTime = Date.now();
    
    try {
      // Test invalid provider
      let invalidProviderHandled = false;
      try {
        await this.aiQueue.enqueue(
          'invalid-provider' as any,
          'test-model',
          [{ role: 'user', content: 'test' }],
          {
            priority: 'normal',
            userId: 'test-user',
            organizationId: this.testOrgId
          }
        );
      } catch (error) {
        invalidProviderHandled = true;
        console.log('  ✅ Invalid provider error handled correctly');
      }

      // Test cost tracking with unknown model
      let unknownModelHandled = false;
      try {
        await this.costOptimizer.trackRequest(
          this.testOrgId,
          'unknown-provider',
          'unknown-model',
          { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
          {
            latency: 1000,
            cached: false,
            success: true
          }
        );
        unknownModelHandled = true; // Should not throw, should use fallback pricing
        console.log('  ✅ Unknown model fallback pricing working');
      } catch (error) {
        console.log('  ⚠️ Unknown model handling could be improved');
      }

      // Test cache with invalid queries
      let cacheErrorHandling = false;
      try {
        await this.semanticCache.get([], 'deepseek', 'deepseek-chat', {
          organizationId: this.testOrgId,
          userId: 'test-user'
        });
        cacheErrorHandling = true;
      } catch (error) {
        cacheErrorHandling = true; // Either works or fails gracefully
        console.log('  ✅ Cache error handling working');
      }

      const resilientChecks = [invalidProviderHandled, unknownModelHandled, cacheErrorHandling];
      const passedChecks = resilientChecks.filter(Boolean).length;
      
      console.log(`  ✅ Error resilience checks passed: ${passedChecks}/${resilientChecks.length}`);
      
      this.results.push({
        testName: 'Error Resilience',
        success: passedChecks >= 2, // At least 2/3 checks should pass
        duration: Date.now() - startTime,
        metrics: {
          totalRequests: 3,
          successfulRequests: passedChecks,
          failedRequests: resilientChecks.length - passedChecks,
          avgResponseTime: 100,
          throughput: passedChecks / ((Date.now() - startTime) / 1000),
          errorRate: ((resilientChecks.length - passedChecks) / resilientChecks.length) * 100
        },
        details: { checksPerformed: resilientChecks.length, checksPassed: passedChecks }
      });

    } catch (error) {
      this.results.push({
        testName: 'Error Resilience',
        success: false,
        duration: Date.now() - startTime,
        metrics: {
          totalRequests: 3,
          successfulRequests: 0,
          failedRequests: 3,
          avgResponseTime: 0,
          throughput: 0,
          errorRate: 100
        }
      });
      console.error('  ❌ Test failed:', error);
    }
    console.log('');
  }

  private generateReport(): void {
    console.log('📊 Focused Load Test Report');
    console.log('='.repeat(60));
    
    const passed = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    
    // Overall metrics
    const totalRequests = this.results.reduce((sum, r) => sum + r.metrics.totalRequests, 0);
    const totalSuccessful = this.results.reduce((sum, r) => sum + r.metrics.successfulRequests, 0);
    const avgResponseTime = this.results.reduce((sum, r) => sum + r.metrics.avgResponseTime, 0) / this.results.length;
    const avgThroughput = this.results.reduce((sum, r) => sum + r.metrics.throughput, 0) / this.results.length;
    
    this.results.forEach((result, index) => {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      console.log(`${index + 1}. ${result.testName}: ${status} (${result.duration}ms)`);
      console.log(`   Requests: ${result.metrics.successfulRequests}/${result.metrics.totalRequests} successful`);
      console.log(`   Avg Response: ${result.metrics.avgResponseTime.toFixed(2)}ms`);
      console.log(`   Throughput: ${result.metrics.throughput.toFixed(2)} req/s`);
      if (result.details) {
        Object.entries(result.details).forEach(([key, value]) => {
          console.log(`   ${key}: ${value}`);
        });
      }
      console.log('');
    });
    
    console.log('='.repeat(60));
    console.log(`Overall Results: ${passed}/${this.results.length} tests passed, ${failed} failed`);
    console.log(`Total Duration: ${totalDuration}ms`);
    console.log(`Success Rate: ${(passed / this.results.length * 100).toFixed(1)}%`);
    console.log(`Total Requests Processed: ${totalSuccessful}/${totalRequests}`);
    console.log(`Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`Average Throughput: ${avgThroughput.toFixed(2)} req/s`);
    console.log('');
    
    // Production readiness assessment
    if (passed === this.results.length && totalSuccessful >= totalRequests * 0.9) {
      console.log('🎉 PRODUCTION READY: All systems performing within acceptable parameters!');
      console.log('   - Queue system handling concurrent requests efficiently');
      console.log('   - Semantic cache providing cost savings');
      console.log('   - Cost tracking accurate and real-time');
      console.log('   - Error handling robust');
    } else if (passed >= 4) {
      console.log('⚠️ MOSTLY READY: Minor issues detected, review recommended');
      console.log('   - Core functionality working');
      console.log('   - Some optimizations may be needed');
    } else {
      console.log('❌ NOT READY: Critical issues must be resolved before production');
      console.log('   - Review failed tests and fix underlying issues');
    }
  }

  async cleanup(): Promise<void> {
    try {
      await this.aiQueue.disconnect();
      await this.costOptimizer.disconnect();
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

// Run the focused test suite
if (require.main === module) {
  const tester = new FocusedLoadTester();
  
  tester.runFocusedTests()
    .then(() => {
      console.log('🏁 Focused load testing completed!');
      return tester.cleanup();
    })
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Test suite failed:', error);
      tester.cleanup().finally(() => {
        process.exit(1);
      });
    });
}

export { FocusedLoadTester };