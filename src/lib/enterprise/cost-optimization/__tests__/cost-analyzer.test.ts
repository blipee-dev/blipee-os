/**
 * Cost Analyzer Test Suite
 * Tests for enterprise cost optimization and analysis features
 */

import { jest } from '@jest/globals';
import { CostAnalyzer } from '../cost-analyzer';
import { 
  ResourceUsage, 
  CostReport, 
  OptimizationRecommendation,
  Provider,
  ResourceType
} from '../cost-analyzer';

// Mock dependencies
jest.mock('@supabase/supabase-js');
jest.mock('ioredis');

describe('CostAnalyzer', () => {
  let costAnalyzer: CostAnalyzer;

  beforeEach(() => {
    jest.clearAllMocks();
    costAnalyzer = new CostAnalyzer();
  });

  describe('Resource Usage Tracking', () => {
    it('should track usage across multiple providers', async () => {
      const usage: ResourceUsage[] = [
        {
          provider: 'vercel',
          resourceType: 'compute',
          metric: 'function_invocations',
          value: 1500000,
          period: 'monthly',
          timestamp: new Date()
        },
        {
          provider: 'supabase',
          resourceType: 'database',
          metric: 'storage_gb',
          value: 50,
          period: 'monthly',
          timestamp: new Date()
        },
        {
          provider: 'openai',
          resourceType: 'ai',
          metric: 'tokens',
          value: 10000000,
          period: 'monthly',
          timestamp: new Date()
        }
      ];

      const tracked = await costAnalyzer.trackUsage(usage);
      
      expect(tracked).toHaveProperty('recordedCount', 3);
      expect(tracked).toHaveProperty('providers', ['vercel', 'supabase', 'openai']);
      expect(tracked).toHaveProperty('totalEstimatedCost');
    });

    it('should calculate accurate costs based on pricing models', async () => {
      const costs = await costAnalyzer.calculateCosts({
        provider: 'openai',
        model: 'gpt-4',
        usage: {
          inputTokens: 1000000,
          outputTokens: 500000
        }
      });

      expect(costs).toHaveProperty('inputCost');
      expect(costs).toHaveProperty('outputCost');
      expect(costs).toHaveProperty('totalCost');
      expect(costs.totalCost).toBe(costs.inputCost + costs.outputCost);
      
      // GPT-4 pricing: $0.03/1K input, $0.06/1K output
      expect(costs.inputCost).toBeCloseTo(30, 2);
      expect(costs.outputCost).toBeCloseTo(30, 2);
    });

    it('should track real-time usage metrics', async () => {
      const realTimeMetrics = await costAnalyzer.getRealTimeUsage();
      
      expect(realTimeMetrics).toHaveProperty('currentHour');
      expect(realTimeMetrics).toHaveProperty('currentDay');
      expect(realTimeMetrics).toHaveProperty('currentMonth');
      expect(realTimeMetrics).toHaveProperty('projectedMonthly');
      expect(realTimeMetrics).toHaveProperty('burnRate');
      expect(realTimeMetrics).toHaveProperty('anomalies');
    });

    it('should detect usage anomalies', async () => {
      const anomalies = await costAnalyzer.detectAnomalies({
        lookbackDays: 30,
        sensitivity: 'medium'
      });

      expect(Array.isArray(anomalies)).toBe(true);
      anomalies.forEach(anomaly => {
        expect(anomaly).toHaveProperty('provider');
        expect(anomaly).toHaveProperty('resourceType');
        expect(anomaly).toHaveProperty('anomalyType'); // 'spike', 'unusual_pattern', 'threshold_exceeded'
        expect(anomaly).toHaveProperty('severity');
        expect(anomaly).toHaveProperty('impact');
        expect(anomaly).toHaveProperty('recommendation');
      });
    });
  });

  describe('Cost Optimization Recommendations', () => {
    it('should recommend AI model optimizations', async () => {
      const recommendations = await costAnalyzer.getAIOptimizations();
      
      expect(Array.isArray(recommendations)).toBe(true);
      
      const modelSwitch = recommendations.find(r => r.type === 'model_switch');
      expect(modelSwitch).toBeDefined();
      expect(modelSwitch).toHaveProperty('currentModel', 'gpt-4');
      expect(modelSwitch).toHaveProperty('recommendedModel', 'deepseek-chat');
      expect(modelSwitch).toHaveProperty('estimatedSavings');
      expect(modelSwitch).toHaveProperty('performanceImpact');
      expect(modelSwitch?.estimatedSavings.percentage).toBeGreaterThan(70);
    });

    it('should recommend resource right-sizing', async () => {
      const rightSizing = await costAnalyzer.getRightSizingRecommendations();
      
      expect(Array.isArray(rightSizing)).toBe(true);
      rightSizing.forEach(recommendation => {
        expect(recommendation).toHaveProperty('resource');
        expect(recommendation).toHaveProperty('currentSize');
        expect(recommendation).toHaveProperty('recommendedSize');
        expect(recommendation).toHaveProperty('utilizationRate');
        expect(recommendation).toHaveProperty('monthlySavings');
        expect(recommendation).toHaveProperty('implementation');
      });
    });

    it('should identify unused resources', async () => {
      const unusedResources = await costAnalyzer.findUnusedResources();
      
      expect(Array.isArray(unusedResources)).toBe(true);
      unusedResources.forEach(resource => {
        expect(resource).toHaveProperty('provider');
        expect(resource).toHaveProperty('resourceId');
        expect(resource).toHaveProperty('resourceType');
        expect(resource).toHaveProperty('lastUsed');
        expect(resource).toHaveProperty('monthlyCost');
        expect(resource).toHaveProperty('recommendation', 'delete');
      });
    });

    it('should recommend caching strategies', async () => {
      const cachingRecs = await costAnalyzer.getCachingRecommendations();
      
      expect(Array.isArray(cachingRecs)).toBe(true);
      const apiCaching = cachingRecs.find(r => r.type === 'api_response_cache');
      expect(apiCaching).toBeDefined();
      expect(apiCaching).toHaveProperty('estimatedHitRate');
      expect(apiCaching).toHaveProperty('costReduction');
      expect(apiCaching).toHaveProperty('implementationEffort');
    });

    it('should calculate ROI for recommendations', async () => {
      const recommendation: OptimizationRecommendation = {
        id: 'opt-001',
        type: 'model_switch',
        priority: 'high',
        estimatedSavings: {
          monthly: 5000,
          percentage: 80
        },
        implementationCost: 500,
        implementationTime: '2 hours'
      };

      const roi = await costAnalyzer.calculateROI(recommendation);
      
      expect(roi).toHaveProperty('paybackPeriod');
      expect(roi).toHaveProperty('annualReturn');
      expect(roi).toHaveProperty('netPresentValue');
      expect(roi.paybackPeriod).toBeLessThan(1); // Less than 1 month
    });
  });

  describe('Budget Management', () => {
    it('should set and track budgets by provider', async () => {
      const budget = {
        provider: 'openai',
        monthlyLimit: 10000,
        alertThresholds: [50, 80, 90, 100],
        autoShutoff: true,
        notifications: ['finance@example.com', 'cto@example.com']
      };

      const created = await costAnalyzer.setBudget(budget);
      
      expect(created).toHaveProperty('id');
      expect(created).toHaveProperty('status', 'active');
      expect(created).toHaveProperty('currentSpend');
      expect(created).toHaveProperty('remainingBudget');
      expect(created).toHaveProperty('projectedOverage');
    });

    it('should trigger budget alerts', async () => {
      const alerts = await costAnalyzer.checkBudgetAlerts();
      
      expect(Array.isArray(alerts)).toBe(true);
      alerts.forEach(alert => {
        expect(alert).toHaveProperty('budgetId');
        expect(alert).toHaveProperty('provider');
        expect(alert).toHaveProperty('threshold');
        expect(alert).toHaveProperty('currentPercentage');
        expect(alert).toHaveProperty('message');
        expect(alert).toHaveProperty('severity');
      });
    });

    it('should forecast budget consumption', async () => {
      const forecast = await costAnalyzer.forecastBudget('openai', {
        lookbackDays: 30,
        forecastDays: 30
      });

      expect(forecast).toHaveProperty('currentTrend');
      expect(forecast).toHaveProperty('projectedSpend');
      expect(forecast).toHaveProperty('confidenceInterval');
      expect(forecast).toHaveProperty('budgetExhaustion');
      expect(forecast).toHaveProperty('recommendations');
    });

    it('should enforce spending limits', async () => {
      const enforcement = await costAnalyzer.enforceSpendingLimit({
        provider: 'openai',
        action: 'throttle', // or 'block'
        reason: 'Budget exceeded',
        until: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      expect(enforcement).toHaveProperty('applied', true);
      expect(enforcement).toHaveProperty('affectedServices');
      expect(enforcement).toHaveProperty('fallbackStrategy');
      expect(enforcement).toHaveProperty('estimatedImpact');
    });
  });

  describe('Cost Reporting', () => {
    it('should generate comprehensive cost reports', async () => {
      const report = await costAnalyzer.generateCostReport({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
        groupBy: ['provider', 'resourceType', 'team']
      });

      expect(report).toHaveProperty('period');
      expect(report).toHaveProperty('totalCost');
      expect(report).toHaveProperty('byProvider');
      expect(report).toHaveProperty('byResourceType');
      expect(report).toHaveProperty('byTeam');
      expect(report).toHaveProperty('trends');
      expect(report).toHaveProperty('comparisons');
      expect(report).toHaveProperty('optimizationOpportunities');
    });

    it('should provide cost breakdown analysis', async () => {
      const breakdown = await costAnalyzer.getCostBreakdown('monthly');
      
      expect(breakdown).toHaveProperty('infrastructure');
      expect(breakdown.infrastructure).toHaveProperty('compute');
      expect(breakdown.infrastructure).toHaveProperty('storage');
      expect(breakdown.infrastructure).toHaveProperty('network');
      
      expect(breakdown).toHaveProperty('services');
      expect(breakdown.services).toHaveProperty('ai');
      expect(breakdown.services).toHaveProperty('database');
      expect(breakdown.services).toHaveProperty('monitoring');
    });

    it('should track cost trends over time', async () => {
      const trends = await costAnalyzer.getCostTrends({
        period: 'last_6_months',
        granularity: 'monthly'
      });

      expect(Array.isArray(trends)).toBe(true);
      trends.forEach(point => {
        expect(point).toHaveProperty('date');
        expect(point).toHaveProperty('totalCost');
        expect(point).toHaveProperty('byProvider');
        expect(point).toHaveProperty('growthRate');
      });
    });

    it('should compare costs against benchmarks', async () => {
      const benchmark = await costAnalyzer.benchmarkCosts({
        industry: 'SaaS',
        companySize: 'medium',
        region: 'us-east-1'
      });

      expect(benchmark).toHaveProperty('yourCosts');
      expect(benchmark).toHaveProperty('industryAverage');
      expect(benchmark).toHaveProperty('percentile');
      expect(benchmark).toHaveProperty('recommendations');
      expect(benchmark).toHaveProperty('topPerformers');
    });
  });

  describe('Resource Scheduling', () => {
    it('should schedule resources based on usage patterns', async () => {
      const schedule = await costAnalyzer.createResourceSchedule({
        resourceId: 'db-analytics',
        provider: 'supabase',
        pattern: {
          weekdays: { start: '08:00', end: '18:00' },
          weekends: 'off',
          timezone: 'UTC'
        }
      });

      expect(schedule).toHaveProperty('id');
      expect(schedule).toHaveProperty('estimatedSavings');
      expect(schedule).toHaveProperty('schedule');
      expect(schedule).toHaveProperty('automation', 'enabled');
    });

    it('should auto-scale resources based on demand', async () => {
      const autoscaling = await costAnalyzer.configureAutoscaling({
        resourceId: 'api-cluster',
        provider: 'vercel',
        rules: [
          { metric: 'cpu', threshold: 70, action: 'scale_up' },
          { metric: 'cpu', threshold: 30, action: 'scale_down' },
          { metric: 'requests_per_second', threshold: 1000, action: 'scale_up' }
        ],
        minInstances: 1,
        maxInstances: 10
      });

      expect(autoscaling).toHaveProperty('enabled', true);
      expect(autoscaling).toHaveProperty('currentInstances');
      expect(autoscaling).toHaveProperty('rules');
      expect(autoscaling).toHaveProperty('costImpact');
    });

    it('should optimize spot instance usage', async () => {
      const spotOptimization = await costAnalyzer.optimizeSpotInstances({
        workloadType: 'batch_processing',
        interruptionTolerance: 'high',
        targetSavings: 70
      });

      expect(spotOptimization).toHaveProperty('recommendedMix');
      expect(spotOptimization.recommendedMix).toHaveProperty('onDemand', 30);
      expect(spotOptimization.recommendedMix).toHaveProperty('spot', 70);
      expect(spotOptimization).toHaveProperty('estimatedSavings');
      expect(spotOptimization).toHaveProperty('riskScore');
    });
  });

  describe('Cost Allocation', () => {
    it('should allocate costs to teams and projects', async () => {
      const allocation = await costAnalyzer.allocateCosts({
        method: 'usage_based',
        dimensions: ['team', 'project', 'environment']
      });

      expect(allocation).toHaveProperty('byTeam');
      expect(allocation).toHaveProperty('byProject');
      expect(allocation).toHaveProperty('byEnvironment');
      expect(allocation).toHaveProperty('unallocated');
      
      // Verify allocation adds up
      const totalAllocated = Object.values(allocation.byTeam as Record<string, number>)
        .reduce((sum, cost) => sum + cost, 0);
      expect(totalAllocated + allocation.unallocated).toBeCloseTo(allocation.total, 2);
    });

    it('should support cost tagging strategies', async () => {
      const tagging = await costAnalyzer.implementTaggingStrategy({
        mandatoryTags: ['team', 'project', 'environment', 'cost-center'],
        autoTagging: {
          enabled: true,
          rules: [
            { pattern: 'prod-*', tags: { environment: 'production' } },
            { pattern: 'dev-*', tags: { environment: 'development' } }
          ]
        }
      });

      expect(tagging).toHaveProperty('coverage');
      expect(tagging.coverage).toBeGreaterThan(90);
      expect(tagging).toHaveProperty('untaggedResources');
      expect(tagging).toHaveProperty('recommendations');
    });

    it('should generate chargeback reports', async () => {
      const chargeback = await costAnalyzer.generateChargebackReport({
        period: 'monthly',
        costCenter: 'engineering',
        includeSharedCosts: true
      });

      expect(chargeback).toHaveProperty('directCosts');
      expect(chargeback).toHaveProperty('sharedCosts');
      expect(chargeback).toHaveProperty('totalCharge');
      expect(chargeback).toHaveProperty('breakdown');
      expect(chargeback).toHaveProperty('invoice');
    });
  });

  describe('Integration with External Systems', () => {
    it('should sync with cloud provider billing APIs', async () => {
      const sync = await costAnalyzer.syncBillingData({
        providers: ['aws', 'gcp', 'azure'],
        period: 'last_30_days'
      });

      expect(sync).toHaveProperty('synced');
      expect(sync.synced).toHaveLength(3);
      sync.synced.forEach(provider => {
        expect(provider).toHaveProperty('name');
        expect(provider).toHaveProperty('lastSync');
        expect(provider).toHaveProperty('recordsImported');
        expect(provider).toHaveProperty('status', 'success');
      });
    });

    it('should export cost data to financial systems', async () => {
      const export_ = await costAnalyzer.exportToFinancialSystem({
        system: 'quickbooks',
        period: 'monthly',
        format: 'journal_entries'
      });

      expect(export_).toHaveProperty('entries');
      expect(export_).toHaveProperty('totalDebits');
      expect(export_).toHaveProperty('totalCredits');
      expect(export_.totalDebits).toBe(export_.totalCredits);
    });

    it('should integrate with monitoring tools', async () => {
      const monitoring = await costAnalyzer.setupCostMonitoring({
        tool: 'datadog',
        metrics: ['cost_per_hour', 'budget_utilization', 'anomaly_score'],
        alerting: {
          enabled: true,
          channels: ['slack', 'email']
        }
      });

      expect(monitoring).toHaveProperty('configured', true);
      expect(monitoring).toHaveProperty('dashboardUrl');
      expect(monitoring).toHaveProperty('metrics');
    });
  });

  describe('Performance and Accuracy', () => {
    it('should process large volumes of usage data efficiently', async () => {
      const largeDataset = Array.from({ length: 100000 }, (_, i) => ({
        timestamp: new Date(Date.now() - i * 60000),
        provider: ['openai', 'supabase', 'vercel'][i % 3],
        metric: 'requests',
        value: Math.random() * 1000
      }));

      const startTime = Date.now();
      const processed = await costAnalyzer.processUsageData(largeDataset);
      const duration = Date.now() - startTime;

      expect(processed).toHaveProperty('recordsProcessed', 100000);
      expect(duration).toBeLessThan(5000); // Process 100k records in under 5 seconds
    });

    it('should maintain cost calculation accuracy', async () => {
      const testCases = [
        { provider: 'openai', usage: 1000000, expected: 30 },
        { provider: 'supabase', usage: 100, expected: 25 },
        { provider: 'vercel', usage: 5000000, expected: 40 }
      ];

      for (const testCase of testCases) {
        const calculated = await costAnalyzer.calculateCost(
          testCase.provider,
          testCase.usage
        );
        expect(calculated).toBeCloseTo(testCase.expected, 2);
      }
    });

    it('should handle real-time cost updates', async () => {
      const realtime = costAnalyzer.subscribeToRealTimeCosts((update) => {
        expect(update).toHaveProperty('provider');
        expect(update).toHaveProperty('cost');
        expect(update).toHaveProperty('timestamp');
      });

      // Simulate usage
      await costAnalyzer.recordUsage({
        provider: 'openai',
        tokens: 1000
      });

      // Cleanup
      realtime.unsubscribe();
    });
  });
});