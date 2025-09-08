/**
 * Resource Scheduler Test Suite
 * Tests for automated resource scheduling and optimization
 */

import { jest } from '@jest/globals';
import { ResourceScheduler } from '../resource-scheduler';
import { 
  ScheduleRule, 
  ResourceSchedule, 
  SchedulePattern,
  ResourceState,
  ScheduleEvent
} from '../resource-scheduler';

// Mock dependencies
jest.mock('@supabase/supabase-js');
jest.mock('node-cron');

describe('ResourceScheduler', () => {
  let scheduler: ResourceScheduler;

  beforeEach(() => {
    jest.clearAllMocks();
    scheduler = new ResourceScheduler();
  });

  describe('Schedule Creation', () => {
    it('should create basic schedules', async () => {
      const schedule: ResourceSchedule = {
        id: 'schedule-001',
        resourceId: 'db-analytics',
        resourceType: 'database',
        provider: 'supabase',
        timezone: 'America/New_York',
        rules: [
          {
            id: 'rule-001',
            type: 'recurring',
            pattern: 'weekday',
            startTime: '08:00',
            endTime: '18:00',
            action: 'start'
          },
          {
            id: 'rule-002',
            type: 'recurring',
            pattern: 'weekday',
            startTime: '18:00',
            action: 'stop'
          }
        ],
        enabled: true
      };

      const created = await scheduler.createSchedule(schedule);
      
      expect(created).toHaveProperty('id');
      expect(created).toHaveProperty('status', 'active');
      expect(created).toHaveProperty('nextExecution');
      expect(created).toHaveProperty('estimatedSavings');
    });

    it('should support complex cron patterns', async () => {
      const complexSchedule = await scheduler.createSchedule({
        resourceId: 'batch-processor',
        rules: [
          {
            type: 'cron',
            pattern: '0 2 * * 1-5', // 2 AM on weekdays
            action: 'start'
          },
          {
            type: 'cron',
            pattern: '0 6 * * 1-5', // 6 AM on weekdays
            action: 'stop'
          }
        ]
      });

      expect(complexSchedule).toHaveProperty('parsed');
      expect(complexSchedule.parsed).toHaveProperty('humanReadable');
      expect(complexSchedule.parsed.humanReadable).toContain('weekdays');
    });

    it('should validate schedule conflicts', async () => {
      const conflictingRules = [
        {
          type: 'recurring' as const,
          pattern: 'daily' as const,
          startTime: '08:00',
          action: 'start' as const
        },
        {
          type: 'recurring' as const,
          pattern: 'daily' as const,
          startTime: '08:30',
          action: 'start' as const // Conflict: already started
        }
      ];

      const validation = await scheduler.validateSchedule({
        resourceId: 'test-resource',
        rules: conflictingRules
      });

      expect(validation).toHaveProperty('valid', false);
      expect(validation).toHaveProperty('conflicts');
      expect(validation.conflicts).toHaveLength(1);
      expect(validation.conflicts[0]).toHaveProperty('type', 'duplicate_action');
    });

    it('should handle timezone conversions', async () => {
      const schedule = await scheduler.createSchedule({
        resourceId: 'global-db',
        timezone: 'Europe/London',
        rules: [{
          type: 'recurring',
          pattern: 'daily',
          startTime: '09:00',
          action: 'start'
        }]
      });

      const nextExecution = await scheduler.getNextExecution(schedule.id);
      expect(nextExecution).toHaveProperty('localTime');
      expect(nextExecution).toHaveProperty('utcTime');
      expect(nextExecution).toHaveProperty('timezone', 'Europe/London');
    });
  });

  describe('Schedule Execution', () => {
    it('should execute scheduled actions', async () => {
      const executionLog: ScheduleEvent[] = [];
      
      scheduler.on('execution', (event) => {
        executionLog.push(event);
      });

      const schedule = await scheduler.createSchedule({
        resourceId: 'test-resource',
        rules: [{
          type: 'immediate',
          action: 'start'
        }]
      });

      // Wait for execution
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(executionLog).toHaveLength(1);
      expect(executionLog[0]).toHaveProperty('scheduleId', schedule.id);
      expect(executionLog[0]).toHaveProperty('action', 'start');
      expect(executionLog[0]).toHaveProperty('status', 'success');
    });

    it('should handle execution failures gracefully', async () => {
      // Mock a failing resource
      jest.spyOn(scheduler, 'executeAction').mockRejectedValueOnce(
        new Error('Resource unavailable')
      );

      const schedule = await scheduler.createSchedule({
        resourceId: 'failing-resource',
        rules: [{
          type: 'immediate',
          action: 'stop'
        }],
        retryPolicy: {
          maxRetries: 3,
          backoffMultiplier: 2
        }
      });

      const execution = await scheduler.getLastExecution(schedule.id);
      
      expect(execution).toHaveProperty('status', 'failed');
      expect(execution).toHaveProperty('error');
      expect(execution).toHaveProperty('retryCount');
    });

    it('should respect resource dependencies', async () => {
      const schedule = await scheduler.createSchedule({
        resourceId: 'app-server',
        dependencies: ['database', 'cache'],
        rules: [{
          type: 'recurring',
          pattern: 'daily',
          startTime: '08:00',
          action: 'start'
        }]
      });

      const executionPlan = await scheduler.getExecutionPlan(schedule.id);
      
      expect(executionPlan).toHaveProperty('steps');
      expect(executionPlan.steps[0].resourceId).toBe('database');
      expect(executionPlan.steps[1].resourceId).toBe('cache');
      expect(executionPlan.steps[2].resourceId).toBe('app-server');
    });

    it('should handle cascading actions', async () => {
      const cascade = await scheduler.executeCascade({
        triggerResource: 'load-balancer',
        action: 'stop',
        cascade: [
          { resourceId: 'web-server-1', delay: 0 },
          { resourceId: 'web-server-2', delay: 0 },
          { resourceId: 'app-server', delay: 5000 },
          { resourceId: 'database', delay: 10000 }
        ]
      });

      expect(cascade).toHaveProperty('executed');
      expect(cascade.executed).toHaveLength(5);
      expect(cascade).toHaveProperty('duration');
    });
  });

  describe('Optimization Features', () => {
    it('should learn usage patterns', async () => {
      // Simulate historical usage data
      const usageData = Array.from({ length: 30 }, (_, day) => ({
        date: new Date(Date.now() - day * 24 * 60 * 60 * 1000),
        resourceId: 'ml-cluster',
        hourlyUsage: Array.from({ length: 24 }, (_, hour) => ({
          hour,
          utilization: hour >= 9 && hour <= 17 ? 80 + Math.random() * 20 : Math.random() * 20
        }))
      }));

      const patterns = await scheduler.analyzeUsagePatterns('ml-cluster', usageData);
      
      expect(patterns).toHaveProperty('peakHours');
      expect(patterns.peakHours).toContain(12); // Noon
      expect(patterns).toHaveProperty('idleHours');
      expect(patterns.idleHours).toContain(3); // 3 AM
      expect(patterns).toHaveProperty('weekendUsage');
      expect(patterns).toHaveProperty('recommendedSchedule');
    });

    it('should generate optimal schedules', async () => {
      const optimization = await scheduler.optimizeSchedule({
        resourceId: 'batch-processor',
        constraints: {
          minUptime: 4, // hours per day
          maxDowntime: 20, // hours per day
          requiredWindows: [
            { start: '02:00', end: '06:00', days: ['Mon', 'Wed', 'Fri'] }
          ]
        },
        costModel: {
          hourlyRate: 0.5,
          startupCost: 0.1,
          shutdownCost: 0.05
        }
      });

      expect(optimization).toHaveProperty('schedule');
      expect(optimization).toHaveProperty('estimatedCost');
      expect(optimization).toHaveProperty('estimatedSavings');
      expect(optimization).toHaveProperty('savingsPercentage');
      expect(optimization.savingsPercentage).toBeGreaterThan(50);
    });

    it('should predict resource needs', async () => {
      const prediction = await scheduler.predictResourceNeeds({
        resourceId: 'api-server',
        lookbackDays: 30,
        forecastDays: 7
      });

      expect(prediction).toHaveProperty('forecast');
      expect(prediction.forecast).toHaveLength(7);
      prediction.forecast.forEach(day => {
        expect(day).toHaveProperty('date');
        expect(day).toHaveProperty('predictedUsage');
        expect(day).toHaveProperty('confidence');
        expect(day).toHaveProperty('recommendedCapacity');
      });
    });

    it('should adapt schedules based on actual usage', async () => {
      const adaptiveSchedule = await scheduler.enableAdaptiveScheduling({
        resourceId: 'web-server',
        learningPeriod: 7, // days
        adjustmentThreshold: 0.2, // 20% deviation triggers adjustment
        maxAdjustmentsPerDay: 2
      });

      expect(adaptiveSchedule).toHaveProperty('enabled', true);
      expect(adaptiveSchedule).toHaveProperty('currentModel');
      expect(adaptiveSchedule).toHaveProperty('nextReview');
      expect(adaptiveSchedule).toHaveProperty('adaptations');
    });
  });

  describe('Multi-Resource Coordination', () => {
    it('should manage resource groups', async () => {
      const group = await scheduler.createResourceGroup({
        name: 'web-stack',
        resources: [
          { id: 'load-balancer', type: 'network', tier: 1 },
          { id: 'web-server-1', type: 'compute', tier: 2 },
          { id: 'web-server-2', type: 'compute', tier: 2 },
          { id: 'app-server', type: 'compute', tier: 3 },
          { id: 'database', type: 'database', tier: 4 }
        ],
        coordinationStrategy: 'sequential_by_tier'
      });

      expect(group).toHaveProperty('id');
      expect(group).toHaveProperty('resources');
      expect(group).toHaveProperty('schedule');
      
      const groupSchedule = await scheduler.scheduleGroup(group.id, {
        action: 'start',
        pattern: 'weekday',
        time: '08:00'
      });

      expect(groupSchedule).toHaveProperty('executionOrder');
      expect(groupSchedule.executionOrder[0]).toContain('load-balancer');
    });

    it('should handle inter-resource communication', async () => {
      const healthCheck = await scheduler.performHealthCheck('web-stack');
      
      expect(healthCheck).toHaveProperty('healthy');
      expect(healthCheck).toHaveProperty('resources');
      Object.values(healthCheck.resources).forEach(resource => {
        expect(resource).toHaveProperty('status');
        expect(resource).toHaveProperty('lastCheck');
        expect(resource).toHaveProperty('dependencies');
      });
    });

    it('should coordinate maintenance windows', async () => {
      const maintenance = await scheduler.scheduleMaintenanceWindow({
        resources: ['db-primary', 'db-replica', 'cache'],
        window: {
          start: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          duration: 2 * 60 * 60 * 1000 // 2 hours
        },
        strategy: 'rolling', // vs 'simultaneous'
        rollbackOnFailure: true
      });

      expect(maintenance).toHaveProperty('id');
      expect(maintenance).toHaveProperty('schedule');
      expect(maintenance.schedule).toHaveLength(3);
      expect(maintenance).toHaveProperty('notifications');
      expect(maintenance).toHaveProperty('rollbackPlan');
    });
  });

  describe('Cost Impact Analysis', () => {
    it('should calculate schedule cost impact', async () => {
      const impact = await scheduler.analyzeCostImpact({
        scheduleId: 'schedule-001',
        period: 'monthly'
      });

      expect(impact).toHaveProperty('currentCost');
      expect(impact).toHaveProperty('projectedCost');
      expect(impact).toHaveProperty('savings');
      expect(impact).toHaveProperty('savingsBreakdown');
      expect(impact.savingsBreakdown).toHaveProperty('compute');
      expect(impact.savingsBreakdown).toHaveProperty('storage');
      expect(impact.savingsBreakdown).toHaveProperty('network');
    });

    it('should compare scheduling strategies', async () => {
      const strategies = [
        { name: 'business_hours', schedule: '9-5 weekdays' },
        { name: 'always_on', schedule: '24/7' },
        { name: 'on_demand', schedule: 'usage-based' }
      ];

      const comparison = await scheduler.compareStrategies('api-cluster', strategies);
      
      expect(comparison).toHaveProperty('strategies');
      comparison.strategies.forEach(strategy => {
        expect(strategy).toHaveProperty('name');
        expect(strategy).toHaveProperty('monthlyCost');
        expect(strategy).toHaveProperty('availability');
        expect(strategy).toHaveProperty('recommendation');
      });
      expect(comparison).toHaveProperty('recommended');
    });

    it('should track actual vs projected savings', async () => {
      const tracking = await scheduler.getSavingsTracking({
        scheduleId: 'schedule-001',
        period: 'last_30_days'
      });

      expect(tracking).toHaveProperty('projectedSavings');
      expect(tracking).toHaveProperty('actualSavings');
      expect(tracking).toHaveProperty('variance');
      expect(tracking).toHaveProperty('varianceReasons');
      expect(tracking).toHaveProperty('adjustmentRecommendations');
    });
  });

  describe('Integration and Automation', () => {
    it('should integrate with cloud provider APIs', async () => {
      const providers = ['aws', 'gcp', 'azure'];
      
      for (const provider of providers) {
        const integration = await scheduler.configureProviderIntegration({
          provider,
          credentials: { /* mocked */ },
          resources: ['compute', 'database', 'storage']
        });

        expect(integration).toHaveProperty('provider', provider);
        expect(integration).toHaveProperty('status', 'connected');
        expect(integration).toHaveProperty('discoveredResources');
      }
    });

    it('should auto-discover schedulable resources', async () => {
      const discovery = await scheduler.discoverResources({
        providers: ['supabase', 'vercel'],
        filters: {
          minMonthlyCost: 50,
          utilizationBelow: 70
        }
      });

      expect(discovery).toHaveProperty('resources');
      expect(Array.isArray(discovery.resources)).toBe(true);
      discovery.resources.forEach(resource => {
        expect(resource).toHaveProperty('id');
        expect(resource).toHaveProperty('provider');
        expect(resource).toHaveProperty('type');
        expect(resource).toHaveProperty('currentCost');
        expect(resource).toHaveProperty('potentialSavings');
      });
    });

    it('should generate automation scripts', async () => {
      const automation = await scheduler.generateAutomation({
        scheduleId: 'schedule-001',
        format: 'terraform'
      });

      expect(automation).toHaveProperty('format', 'terraform');
      expect(automation).toHaveProperty('script');
      expect(automation.script).toContain('resource');
      expect(automation.script).toContain('schedule');
      expect(automation).toHaveProperty('documentation');
    });
  });

  describe('Monitoring and Alerts', () => {
    it('should monitor schedule effectiveness', async () => {
      const effectiveness = await scheduler.getScheduleEffectiveness('schedule-001');
      
      expect(effectiveness).toHaveProperty('uptimeCompliance');
      expect(effectiveness).toHaveProperty('costSavingsRealized');
      expect(effectiveness).toHaveProperty('missedExecutions');
      expect(effectiveness).toHaveProperty('userSatisfaction');
      expect(effectiveness).toHaveProperty('recommendations');
    });

    it('should alert on schedule failures', async () => {
      const alerts: any[] = [];
      scheduler.on('alert', (alert) => alerts.push(alert));

      // Simulate schedule failure
      await scheduler.simulateFailure('schedule-001', 'Resource not responding');

      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toHaveProperty('type', 'schedule_failure');
      expect(alerts[0]).toHaveProperty('severity');
      expect(alerts[0]).toHaveProperty('message');
      expect(alerts[0]).toHaveProperty('remediation');
    });

    it('should provide schedule analytics', async () => {
      const analytics = await scheduler.getAnalytics({
        period: 'last_30_days',
        metrics: ['execution_rate', 'savings', 'reliability']
      });

      expect(analytics).toHaveProperty('executionRate');
      expect(analytics.executionRate).toBeGreaterThan(0.95); // 95%+ success rate
      expect(analytics).toHaveProperty('totalSavings');
      expect(analytics).toHaveProperty('reliabilityScore');
      expect(analytics).toHaveProperty('topPerformingSchedules');
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle concurrent schedule executions', async () => {
      const schedules = Array.from({ length: 100 }, (_, i) => ({
        resourceId: `resource-${i}`,
        rules: [{ type: 'immediate' as const, action: 'start' as const }]
      }));

      const startTime = Date.now();
      const results = await Promise.all(
        schedules.map(s => scheduler.createSchedule(s))
      );
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(100);
      expect(duration).toBeLessThan(5000); // Handle 100 schedules in under 5 seconds
    });

    it('should maintain schedule state consistency', async () => {
      const schedule = await scheduler.createSchedule({
        resourceId: 'stateful-resource',
        rules: [
          { type: 'recurring', pattern: 'hourly', action: 'toggle' }
        ]
      });

      // Verify state tracking
      const state1 = await scheduler.getResourceState('stateful-resource');
      await scheduler.executeAction('stateful-resource', 'toggle');
      const state2 = await scheduler.getResourceState('stateful-resource');

      expect(state1.state).not.toBe(state2.state);
      expect(state2.lastChanged).toBeInstanceOf(Date);
    });

    it('should recover from system failures', async () => {
      // Simulate scheduler restart
      const schedule = await scheduler.createSchedule({
        resourceId: 'persistent-resource',
        rules: [{ type: 'recurring', pattern: 'daily', startTime: '08:00', action: 'start' }]
      });

      // Create new scheduler instance (simulating restart)
      const newScheduler = new ResourceScheduler();
      await newScheduler.recover();

      const recoveredSchedule = await newScheduler.getSchedule(schedule.id);
      expect(recoveredSchedule).toBeDefined();
      expect(recoveredSchedule.status).toBe('active');
    });
  });
});