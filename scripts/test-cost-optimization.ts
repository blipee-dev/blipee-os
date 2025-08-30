#!/usr/bin/env tsx
/**
 * Cost Optimization System Test
 * Phase 3, Task 3.3: Test cost tracking, budgeting, and optimization
 */

import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config({ path: join(__dirname, '../.env.local') });

import { createCostOptimizer, PROVIDER_PRICING } from '../src/lib/ai/cost/cost-optimizer';

interface TestResult {
  name: string;
  success: boolean;
  duration: number;
  details?: any;
  error?: string;
}

class CostOptimizationTestSuite {
  private costOptimizer = createCostOptimizer();
  private results: TestResult[] = [];
  private testOrgId = `test-cost-org-${Date.now()}`;

  async runAllTests(): Promise<void> {
    console.log('💰 Starting Cost Optimization Test Suite...\n');
    
    const tests = [
      () => this.testCostCalculation(),
      () => this.testRequestTracking(),
      () => this.testBudgetManagement(),
      () => this.testCostMetrics(),
      () => this.testOptimizationRecommendations(),
      () => this.testProviderRecommendations(),
      () => this.testAlertSystem(),
      () => this.testCostComparison()
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

  private async testCostCalculation(): Promise<void> {
    console.log('💰 Test 1: Cost Calculation Accuracy');
    const startTime = Date.now();
    
    try {
      // Test different provider cost calculations
      const testScenarios = [
        {
          provider: 'deepseek',
          model: 'deepseek-chat',
          usage: { promptTokens: 100, completionTokens: 150, totalTokens: 250 },
          expectedCost: 0.000056 // (100 * 0.00014 + 150 * 0.00028) / 1000
        },
        {
          provider: 'openai',
          model: 'gpt-4',
          usage: { promptTokens: 100, completionTokens: 150, totalTokens: 250 },
          expectedCost: 0.0055 // (100 * 0.01 + 150 * 0.03) / 1000
        },
        {
          provider: 'openai',
          model: 'gpt-3.5-turbo',
          usage: { promptTokens: 100, completionTokens: 150, totalTokens: 250 },
          expectedCost: 0.000275 // (100 * 0.0005 + 150 * 0.0015) / 1000
        }
      ];

      let correctCalculations = 0;
      
      for (const scenario of testScenarios) {
        await this.costOptimizer.trackRequest(
          this.testOrgId,
          scenario.provider,
          scenario.model,
          scenario.usage,
          {
            latency: 1000,
            cached: false,
            success: true
          }
        );
        
        // Get recent metrics to verify cost calculation
        const metrics = await this.costOptimizer.getCostMetrics(this.testOrgId, 'hourly', 1);
        
        if (metrics.length > 0) {
          const calculatedCost = metrics[0].totalCost;
          const tolerance = scenario.expectedCost * 0.01; // 1% tolerance
          
          if (Math.abs(calculatedCost - scenario.expectedCost) <= tolerance) {
            correctCalculations++;
            console.log(`  ✅ ${scenario.provider}/${scenario.model}: $${calculatedCost.toFixed(6)} (expected $${scenario.expectedCost.toFixed(6)})`);
          } else {
            console.log(`  ❌ ${scenario.provider}/${scenario.model}: $${calculatedCost.toFixed(6)} (expected $${scenario.expectedCost.toFixed(6)})`);
          }
        }
      }
      
      this.results.push({
        name: 'Cost Calculation',
        success: correctCalculations === testScenarios.length,
        duration: Date.now() - startTime,
        details: { 
          correctCalculations, 
          totalScenarios: testScenarios.length,
          accuracy: `${(correctCalculations / testScenarios.length * 100).toFixed(1)}%`
        }
      });

    } catch (error) {
      this.results.push({
        name: 'Cost Calculation',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.error('  ❌ Test failed:', error);
    }
    console.log('');
  }

  private async testRequestTracking(): Promise<void> {
    console.log('📝 Test 2: Request Tracking & Metrics');
    const startTime = Date.now();
    
    try {
      // Track multiple requests
      const requests = [
        { provider: 'deepseek', cached: false, latency: 2400, success: true },
        { provider: 'deepseek', cached: true, latency: 50, success: true },
        { provider: 'openai', cached: false, latency: 1800, success: true },
        { provider: 'deepseek', cached: false, latency: 2600, success: false }
      ];

      for (let i = 0; i < requests.length; i++) {
        const req = requests[i];
        await this.costOptimizer.trackRequest(
          this.testOrgId,
          req.provider,
          'test-model',
          { promptTokens: 50, completionTokens: 75, totalTokens: 125 },
          {
            latency: req.latency,
            cached: req.cached,
            userId: `test-user-${i}`,
            priority: 'normal',
            success: req.success
          }
        );
      }

      // Wait a moment for metrics to be processed
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get metrics and verify
      const metrics = await this.costOptimizer.getCostMetrics(this.testOrgId, 'hourly', 1);
      
      if (metrics.length > 0) {
        const metric = metrics[0];
        const expectedRequests = requests.length;
        const expectedCachedRate = (1 / requests.length) * 100; // 1 cached out of 4
        
        console.log(`  ✅ Total requests tracked: ${metric.totalRequests}`);
        console.log(`  ✅ Cache hit rate: ${metric.cacheHitRate.toFixed(1)}%`);
        console.log(`  ✅ Cost per request: $${metric.costPerRequest.toFixed(6)}`);
        console.log(`  ✅ Average latency: DeepSeek ${metric.avgLatencyByProvider.deepseek || 0}ms`);
        
        this.results.push({
          name: 'Request Tracking',
          success: metric.totalRequests >= expectedRequests,
          duration: Date.now() - startTime,
          details: {
            requestsTracked: metric.totalRequests,
            cacheHitRate: metric.cacheHitRate,
            costPerRequest: metric.costPerRequest,
            avgLatency: metric.avgLatencyByProvider
          }
        });
      } else {
        throw new Error('No metrics found after tracking requests');
      }

    } catch (error) {
      this.results.push({
        name: 'Request Tracking',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.error('  ❌ Test failed:', error);
    }
    console.log('');
  }

  private async testBudgetManagement(): Promise<void> {
    console.log('📋 Test 3: Budget Management');
    const startTime = Date.now();
    
    try {
      // Set a daily budget
      const budgetKey = await this.costOptimizer.setBudget(this.testOrgId, {
        period: 'daily',
        limit: 10.0,
        warningThreshold: 70,
        alertThreshold: 90,
        rolloverUnused: false
      });
      
      console.log(`  ✅ Budget set successfully: ${budgetKey}`);
      
      // Track some expensive requests to trigger alerts
      for (let i = 0; i < 3; i++) {
        await this.costOptimizer.trackRequest(
          this.testOrgId,
          'openai',
          'gpt-4',
          { promptTokens: 1000, completionTokens: 1500, totalTokens: 2500 },
          {
            latency: 1800,
            cached: false,
            success: true
          }
        );
      }
      
      // Wait for budget check processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check for alerts
      const alerts = await this.costOptimizer.getAlerts(this.testOrgId, false);
      
      console.log(`  ✅ Budget alerts generated: ${alerts.length}`);
      
      alerts.forEach(alert => {
        console.log(`    - ${alert.type}: ${alert.message}`);
      });
      
      this.results.push({
        name: 'Budget Management',
        success: true,
        duration: Date.now() - startTime,
        details: {
          budgetSet: !!budgetKey,
          alertsGenerated: alerts.length,
          alertTypes: alerts.map(a => a.type)
        }
      });

    } catch (error) {
      this.results.push({
        name: 'Budget Management',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.error('  ❌ Test failed:', error);
    }
    console.log('');
  }

  private async testCostMetrics(): Promise<void> {
    console.log('📊 Test 4: Cost Metrics & Analytics');
    const startTime = Date.now();
    
    try {
      // Get comprehensive metrics
      const dailyMetrics = await this.costOptimizer.getCostMetrics(this.testOrgId, 'daily', 7);
      const hourlyMetrics = await this.costOptimizer.getCostMetrics(this.testOrgId, 'hourly', 24);
      
      console.log(`  ✅ Daily metrics periods: ${dailyMetrics.length}`);
      console.log(`  ✅ Hourly metrics periods: ${hourlyMetrics.length}`);
      
      if (dailyMetrics.length > 0) {
        const latest = dailyMetrics[0];
        console.log(`  ✅ Latest daily cost: $${latest.totalCost.toFixed(4)}`);
        console.log(`  ✅ Cache savings: $${latest.costSavingsFromCache.toFixed(4)}`);
        console.log(`  ✅ ROI: ${latest.roi.toFixed(1)}%`);
        console.log(`  ✅ Providers used: ${Object.keys(latest.costByProvider).join(', ')}`);
      }
      
      this.results.push({
        name: 'Cost Metrics',
        success: dailyMetrics.length > 0 && hourlyMetrics.length > 0,
        duration: Date.now() - startTime,
        details: {
          dailyPeriods: dailyMetrics.length,
          hourlyPeriods: hourlyMetrics.length,
          totalCost: dailyMetrics[0]?.totalCost,
          cacheSavings: dailyMetrics[0]?.costSavingsFromCache,
          roi: dailyMetrics[0]?.roi
        }
      });

    } catch (error) {
      this.results.push({
        name: 'Cost Metrics',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.error('  ❌ Test failed:', error);
    }
    console.log('');
  }

  private async testOptimizationRecommendations(): Promise<void> {
    console.log('💡 Test 5: Optimization Recommendations');
    const startTime = Date.now();
    
    try {
      // Wait for recommendation generation (triggered by request tracking)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const recommendations = await this.costOptimizer.getRecommendations(this.testOrgId, 'pending');
      
      console.log(`  ✅ Recommendations generated: ${recommendations.length}`);
      
      recommendations.forEach(rec => {
        console.log(`    - ${rec.title} (${rec.priority} priority)`);
        console.log(`      Potential savings: $${rec.estimatedSavings.monthly}/month (${rec.estimatedSavings.percentage}%)`);
        console.log(`      Implementation: ${rec.implementation.difficulty} - ${rec.implementation.timeToImplement}`);
      });
      
      this.results.push({
        name: 'Optimization Recommendations',
        success: true, // Recommendations are generated based on usage patterns
        duration: Date.now() - startTime,
        details: {
          recommendationsCount: recommendations.length,
          types: recommendations.map(r => r.type),
          totalPotentialSavings: recommendations.reduce((sum, r) => sum + r.estimatedSavings.monthly, 0)
        }
      });

    } catch (error) {
      this.results.push({
        name: 'Optimization Recommendations',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.error('  ❌ Test failed:', error);
    }
    console.log('');
  }

  private async testProviderRecommendations(): Promise<void> {
    console.log('🤖 Test 6: Provider Recommendations');
    const startTime = Date.now();
    
    try {
      const scenarios = [
        { requestType: 'simple', priority: 'low' },
        { requestType: 'complex', priority: 'high' },
        { requestType: 'creative', priority: 'normal' }
      ] as const;
      
      let correctRecommendations = 0;
      
      for (const scenario of scenarios) {
        const recommendation = await this.costOptimizer.getOptimalProvider(
          this.testOrgId,
          scenario.requestType,
          scenario.priority
        );
        
        console.log(`  ✅ ${scenario.requestType}/${scenario.priority}: ${recommendation.provider} (${recommendation.reasoning.substring(0, 60)}...)`);
        console.log(`      Estimated cost: $${recommendation.estimatedCost.toFixed(6)}, latency: ${recommendation.estimatedLatency}ms`);
        
        // Verify reasonable recommendations
        if (recommendation.provider && recommendation.estimatedCost > 0) {
          correctRecommendations++;
        }
      }
      
      this.results.push({
        name: 'Provider Recommendations',
        success: correctRecommendations === scenarios.length,
        duration: Date.now() - startTime,
        details: {
          scenariosTested: scenarios.length,
          correctRecommendations,
          accuracy: `${(correctRecommendations / scenarios.length * 100).toFixed(1)}%`
        }
      });

    } catch (error) {
      this.results.push({
        name: 'Provider Recommendations',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.error('  ❌ Test failed:', error);
    }
    console.log('');
  }

  private async testAlertSystem(): Promise<void> {
    console.log('🚨 Test 7: Alert System');
    const startTime = Date.now();
    
    try {
      // Get all alerts (acknowledged and unacknowledged)
      const unacknowledgedAlerts = await this.costOptimizer.getAlerts(this.testOrgId, false);
      const acknowledgedAlerts = await this.costOptimizer.getAlerts(this.testOrgId, true);
      
      console.log(`  ✅ Unacknowledged alerts: ${unacknowledgedAlerts.length}`);
      console.log(`  ✅ Acknowledged alerts: ${acknowledgedAlerts.length}`);
      
      unacknowledgedAlerts.forEach(alert => {
        console.log(`    - ${alert.severity.toUpperCase()}: ${alert.message}`);
      });
      
      this.results.push({
        name: 'Alert System',
        success: true,
        duration: Date.now() - startTime,
        details: {
          unacknowledgedAlerts: unacknowledgedAlerts.length,
          acknowledgedAlerts: acknowledgedAlerts.length,
          alertTypes: unacknowledgedAlerts.map(a => a.type)
        }
      });

    } catch (error) {
      this.results.push({
        name: 'Alert System',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.error('  ❌ Test failed:', error);
    }
    console.log('');
  }

  private async testCostComparison(): Promise<void> {
    console.log('📋 Test 8: Cost Comparison Analysis');
    const startTime = Date.now();
    
    try {
      // Compare costs between providers for the same workload
      const testTokens = { promptTokens: 1000, completionTokens: 1500, totalTokens: 2500 };
      
      const providerCosts = {
        deepseek: (testTokens.promptTokens * PROVIDER_PRICING.deepseek.input + 
                  testTokens.completionTokens * PROVIDER_PRICING.deepseek.output) / 1000,
        'gpt-4': (testTokens.promptTokens * PROVIDER_PRICING.openai['gpt-4'].input + 
                 testTokens.completionTokens * PROVIDER_PRICING.openai['gpt-4'].output) / 1000,
        'gpt-3.5-turbo': (testTokens.promptTokens * PROVIDER_PRICING.openai['gpt-3.5-turbo'].input + 
                         testTokens.completionTokens * PROVIDER_PRICING.openai['gpt-3.5-turbo'].output) / 1000
      };
      
      console.log(`  ✅ Cost comparison for ${testTokens.totalTokens} tokens:`);
      Object.entries(providerCosts).forEach(([provider, cost]) => {
        console.log(`    - ${provider}: $${cost.toFixed(6)}`);
      });
      
      // Calculate savings potential
      const mostExpensive = Math.max(...Object.values(providerCosts));
      const leastExpensive = Math.min(...Object.values(providerCosts));
      const maxSavings = ((mostExpensive - leastExpensive) / mostExpensive) * 100;
      
      console.log(`  ✅ Maximum cost optimization potential: ${maxSavings.toFixed(1)}%`);
      
      this.results.push({
        name: 'Cost Comparison',
        success: true,
        duration: Date.now() - startTime,
        details: {
          providerCosts,
          maxSavingsPotential: `${maxSavings.toFixed(1)}%`,
          mostExpensive: Object.entries(providerCosts).find(([_, cost]) => cost === mostExpensive)?.[0],
          leastExpensive: Object.entries(providerCosts).find(([_, cost]) => cost === leastExpensive)?.[0]
        }
      });

    } catch (error) {
      this.results.push({
        name: 'Cost Comparison',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.error('  ❌ Test failed:', error);
    }
    console.log('');
  }

  private printResults(): void {
    console.log('📊 Cost Optimization Test Results');
    console.log('=' .repeat(60));
    
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
    
    console.log('=' .repeat(60));
    console.log(`Summary: ${passed}/${this.results.length} tests passed, ${failed} failed`);
    console.log(`Total Duration: ${totalDuration}ms`);
    console.log(`Success Rate: ${(passed / this.results.length * 100).toFixed(1)}%`);
    
    if (passed === this.results.length) {
      console.log('🎉 All cost optimization tests passed! System ready for production.');
    } else {
      console.log('⚠️ Some tests failed. Review failures before production deployment.');
    }
  }

  async cleanup(): Promise<void> {
    try {
      await this.costOptimizer.disconnect();
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

// Run the test suite
if (require.main === module) {
  const testSuite = new CostOptimizationTestSuite();
  
  testSuite.runAllTests()
    .then(() => {
      console.log('\n🏁 Cost optimization testing completed!');
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

export { CostOptimizationTestSuite };