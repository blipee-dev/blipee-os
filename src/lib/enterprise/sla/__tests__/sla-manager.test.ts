/**
 * SLA Manager Test Suite
 * Tests for Service Level Agreement management and monitoring
 */

import { jest } from '@jest/globals';
import { SLAManager } from '../sla-manager';
import { 
  SLA, 
  SLAMetric, 
  SLAViolation,
  SLAReport,
  SLATier
} from '../sla-manager';

// Mock dependencies
jest.mock('@supabase/supabase-js');
jest.mock('ioredis');

describe('SLAManager', () => {
  let slaManager: SLAManager;

  beforeEach(() => {
    jest.clearAllMocks();
    slaManager = new SLAManager();
  });

  describe('SLA Definition', () => {
    it('should create SLA with comprehensive metrics', async () => {
      const sla: SLA = {
        id: 'sla-enterprise',
        name: 'Enterprise SLA',
        tier: 'enterprise',
        description: 'Premium service level agreement',
        metrics: [
          {
            name: 'uptime',
            target: 99.95,
            measurement: 'percentage',
            period: 'monthly',
            calculation: 'availability_minutes / total_minutes * 100'
          },
          {
            name: 'response_time',
            target: 200,
            measurement: 'milliseconds',
            period: 'real_time',
            percentile: 95
          },
          {
            name: 'support_response',
            target: 30,
            measurement: 'minutes',
            period: 'business_hours',
            priority: 'critical'
          }
        ],
        penalties: {
          uptime: [
            { threshold: 99.9, credit: 10 },
            { threshold: 99.0, credit: 25 },
            { threshold: 95.0, credit: 50 }
          ]
        },
        exclusions: [
          'scheduled_maintenance',
          'force_majeure',
          'customer_caused'
        ],
        effectiveDate: new Date(),
        reviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      };

      const created = await slaManager.createSLA(sla);
      
      expect(created).toHaveProperty('id');
      expect(created).toHaveProperty('status', 'active');
      expect(created).toHaveProperty('version', 1);
      expect(created.metrics).toHaveLength(3);
    });

    it('should validate SLA targets against capabilities', async () => {
      const validation = await slaManager.validateSLATargets({
        uptime: 99.999, // Five nines
        responseTime: 10, // 10ms
        throughput: 1000000 // 1M requests/second
      });

      expect(validation).toHaveProperty('feasible');
      expect(validation).toHaveProperty('warnings');
      expect(validation).toHaveProperty('recommendations');
      
      if (!validation.feasible) {
        expect(validation.warnings).toContain('Uptime target exceeds current infrastructure capabilities');
      }
    });

    it('should support tiered SLAs', async () => {
      const tiers: SLATier[] = [
        {
          name: 'trial',
          uptime: 99.0,
          support: 'community',
          priority: 'low'
        },
        {
          name: 'starter',
          uptime: 99.5,
          support: 'email',
          priority: 'medium'
        },
        {
          name: 'professional',
          uptime: 99.9,
          support: '24x7',
          priority: 'high'
        },
        {
          name: 'enterprise',
          uptime: 99.95,
          support: 'dedicated',
          priority: 'critical'
        }
      ];

      const tieredSLAs = await slaManager.createTieredSLAs(tiers);
      
      expect(tieredSLAs).toHaveLength(4);
      expect(tieredSLAs[3].metrics[0].target).toBe(99.95); // Enterprise uptime
    });

    it('should handle custom SLA metrics', async () => {
      const customMetrics = [
        {
          name: 'data_accuracy',
          target: 99.99,
          measurement: 'percentage',
          calculation: 'accurate_records / total_records * 100'
        },
        {
          name: 'api_availability',
          target: 99.9,
          measurement: 'percentage',
          endpoints: ['/api/v1/*', '/api/v2/*']
        },
        {
          name: 'backup_rpo',
          target: 15,
          measurement: 'minutes',
          description: 'Recovery Point Objective'
        }
      ];

      const sla = await slaManager.createSLA({
        name: 'Custom Data SLA',
        metrics: customMetrics
      });

      expect(sla.metrics).toHaveLength(3);
      expect(sla.metrics.find(m => m.name === 'data_accuracy')).toBeDefined();
    });
  });

  describe('SLA Monitoring', () => {
    it('should track real-time SLA metrics', async () => {
      const metrics = await slaManager.getCurrentMetrics('sla-enterprise');
      
      expect(metrics).toHaveProperty('uptime');
      expect(metrics.uptime).toHaveProperty('current', 99.98);
      expect(metrics.uptime).toHaveProperty('target', 99.95);
      expect(metrics.uptime).toHaveProperty('status', 'meeting');
      expect(metrics.uptime).toHaveProperty('trend', 'stable');
      
      expect(metrics).toHaveProperty('responseTime');
      expect(metrics.responseTime).toHaveProperty('p50');
      expect(metrics.responseTime).toHaveProperty('p95');
      expect(metrics.responseTime).toHaveProperty('p99');
    });

    it('should detect SLA violations', async () => {
      const violations = await slaManager.detectViolations({
        slaId: 'sla-enterprise',
        timeRange: 'last_24_hours'
      });

      expect(Array.isArray(violations)).toBe(true);
      violations.forEach(violation => {
        expect(violation).toHaveProperty('id');
        expect(violation).toHaveProperty('metric');
        expect(violation).toHaveProperty('timestamp');
        expect(violation).toHaveProperty('duration');
        expect(violation).toHaveProperty('severity');
        expect(violation).toHaveProperty('impact');
        expect(violation).toHaveProperty('rootCause');
      });
    });

    it('should calculate service credits', async () => {
      const violations: SLAViolation[] = [
        {
          id: 'vio-001',
          slaId: 'sla-enterprise',
          metric: 'uptime',
          timestamp: new Date(),
          duration: 120, // 2 hours
          actualValue: 98.5,
          targetValue: 99.95,
          severity: 'major'
        }
      ];

      const credits = await slaManager.calculateServiceCredits(violations);
      
      expect(credits).toHaveProperty('totalCredit');
      expect(credits).toHaveProperty('breakdown');
      expect(credits.breakdown).toHaveLength(1);
      expect(credits.breakdown[0]).toHaveProperty('violation', 'vio-001');
      expect(credits.breakdown[0]).toHaveProperty('creditPercentage', 25);
      expect(credits.breakdown[0]).toHaveProperty('creditAmount');
    });

    it('should track SLA compliance trends', async () => {
      const trends = await slaManager.getComplianceTrends({
        slaId: 'sla-enterprise',
        period: 'last_12_months',
        granularity: 'monthly'
      });

      expect(Array.isArray(trends)).toBe(true);
      trends.forEach(point => {
        expect(point).toHaveProperty('period');
        expect(point).toHaveProperty('compliance');
        expect(point).toHaveProperty('violations');
        expect(point).toHaveProperty('credits');
        expect(point).toHaveProperty('incidents');
      });
    });
  });

  describe('Incident Management', () => {
    it('should create and track incidents', async () => {
      const incident = await slaManager.createIncident({
        title: 'API Outage',
        severity: 'critical',
        affectedServices: ['api', 'webhooks'],
        affectedSLAs: ['sla-enterprise', 'sla-professional'],
        startTime: new Date(),
        description: 'Complete API unavailability',
        rootCause: 'Database connection pool exhausted'
      });

      expect(incident).toHaveProperty('id');
      expect(incident).toHaveProperty('status', 'active');
      expect(incident).toHaveProperty('timeline');
      expect(incident).toHaveProperty('impactAnalysis');
      expect(incident.impactAnalysis).toHaveProperty('affectedCustomers');
      expect(incident.impactAnalysis).toHaveProperty('slaImpact');
    });

    it('should update incident timeline', async () => {
      const updates = [
        {
          timestamp: new Date(),
          status: 'investigating',
          message: 'Team investigating root cause'
        },
        {
          timestamp: new Date(Date.now() + 15 * 60 * 1000),
          status: 'identified',
          message: 'Root cause identified - implementing fix'
        },
        {
          timestamp: new Date(Date.now() + 30 * 60 * 1000),
          status: 'resolved',
          message: 'Service restored'
        }
      ];

      const incident = await slaManager.updateIncident('inc-001', updates);
      
      expect(incident.timeline).toHaveLength(updates.length + 1); // +1 for creation
      expect(incident.status).toBe('resolved');
      expect(incident).toHaveProperty('resolutionTime');
      expect(incident).toHaveProperty('totalDowntime');
    });

    it('should perform post-incident analysis', async () => {
      const analysis = await slaManager.analyzeIncident('inc-001');
      
      expect(analysis).toHaveProperty('summary');
      expect(analysis).toHaveProperty('timeline');
      expect(analysis).toHaveProperty('rootCause');
      expect(analysis).toHaveProperty('impact');
      expect(analysis.impact).toHaveProperty('slaViolations');
      expect(analysis.impact).toHaveProperty('customerImpact');
      expect(analysis.impact).toHaveProperty('financialImpact');
      expect(analysis).toHaveProperty('preventiveMeasures');
      expect(analysis).toHaveProperty('lessonsLearned');
    });

    it('should generate incident reports', async () => {
      const report = await slaManager.generateIncidentReport('inc-001', {
        format: 'detailed',
        includeRCA: true,
        includeMetrics: true
      });

      expect(report).toHaveProperty('incident');
      expect(report).toHaveProperty('timeline');
      expect(report).toHaveProperty('rootCauseAnalysis');
      expect(report).toHaveProperty('slaImpact');
      expect(report).toHaveProperty('remediation');
      expect(report).toHaveProperty('preventionPlan');
    });
  });

  describe('Reporting and Analytics', () => {
    it('should generate comprehensive SLA reports', async () => {
      const report = await slaManager.generateSLAReport({
        slaId: 'sla-enterprise',
        period: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end: new Date()
        },
        includeDetails: true
      });

      expect(report).toHaveProperty('summary');
      expect(report.summary).toHaveProperty('overallCompliance');
      expect(report.summary).toHaveProperty('totalViolations');
      expect(report.summary).toHaveProperty('totalCredits');
      
      expect(report).toHaveProperty('metricDetails');
      Object.values(report.metricDetails).forEach(metric => {
        expect(metric).toHaveProperty('compliance');
        expect(metric).toHaveProperty('average');
        expect(metric).toHaveProperty('violations');
        expect(metric).toHaveProperty('trend');
      });
      
      expect(report).toHaveProperty('incidents');
      expect(report).toHaveProperty('recommendations');
    });

    it('should compare SLA performance across tiers', async () => {
      const comparison = await slaManager.compareTierPerformance({
        period: 'last_quarter'
      });

      expect(comparison).toHaveProperty('tiers');
      ['trial', 'starter', 'professional', 'enterprise'].forEach(tier => {
        expect(comparison.tiers).toHaveProperty(tier);
        expect(comparison.tiers[tier]).toHaveProperty('compliance');
        expect(comparison.tiers[tier]).toHaveProperty('incidents');
        expect(comparison.tiers[tier]).toHaveProperty('customerSatisfaction');
      });
    });

    it('should provide predictive analytics', async () => {
      const predictions = await slaManager.predictSLACompliance({
        slaId: 'sla-enterprise',
        forecastDays: 30
      });

      expect(predictions).toHaveProperty('forecast');
      predictions.forecast.forEach(day => {
        expect(day).toHaveProperty('date');
        expect(day).toHaveProperty('predictedCompliance');
        expect(day).toHaveProperty('riskFactors');
        expect(day).toHaveProperty('confidence');
      });
      
      expect(predictions).toHaveProperty('risks');
      expect(predictions).toHaveProperty('recommendations');
    });

    it('should export SLA data for external analysis', async () => {
      const formats = ['json', 'csv', 'excel'] as const;
      
      for (const format of formats) {
        const exported = await slaManager.exportSLAData({
          slaIds: ['sla-enterprise', 'sla-professional'],
          period: 'last_month',
          format,
          includeRawData: true
        });

        expect(exported).toHaveProperty('format', format);
        expect(exported).toHaveProperty('data');
        expect(exported).toHaveProperty('metadata');
        expect(exported.metadata).toHaveProperty('exportDate');
        expect(exported.metadata).toHaveProperty('recordCount');
      }
    });
  });

  describe('Customer Communication', () => {
    it('should generate customer-facing status pages', async () => {
      const statusPage = await slaManager.generateStatusPage({
        slas: ['sla-enterprise', 'sla-professional'],
        includeHistory: 90 // days
      });

      expect(statusPage).toHaveProperty('currentStatus');
      expect(statusPage.currentStatus).toHaveProperty('overall');
      expect(statusPage.currentStatus).toHaveProperty('services');
      
      expect(statusPage).toHaveProperty('uptime');
      expect(statusPage).toHaveProperty('incidents');
      expect(statusPage).toHaveProperty('maintenanceWindows');
      expect(statusPage).toHaveProperty('performanceMetrics');
    });

    it('should send proactive notifications', async () => {
      const notifications = await slaManager.sendProactiveNotifications({
        type: 'performance_degradation',
        affectedSLAs: ['sla-enterprise'],
        message: 'Slight increase in API response times detected',
        expectedResolution: new Date(Date.now() + 2 * 60 * 60 * 1000)
      });

      expect(notifications).toHaveProperty('sent');
      expect(notifications.sent).toHaveLength(3); // Email, SMS, In-app
      notifications.sent.forEach(notification => {
        expect(notification).toHaveProperty('channel');
        expect(notification).toHaveProperty('recipients');
        expect(notification).toHaveProperty('status', 'delivered');
      });
    });

    it('should manage maintenance windows', async () => {
      const maintenance = await slaManager.scheduleMaintenance({
        title: 'Database upgrade',
        description: 'Upgrading to latest stable version',
        startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        duration: 2 * 60 * 60 * 1000, // 2 hours
        affectedServices: ['database', 'api'],
        affectedSLAs: ['sla-enterprise', 'sla-professional'],
        excludeFromSLA: true
      });

      expect(maintenance).toHaveProperty('id');
      expect(maintenance).toHaveProperty('status', 'scheduled');
      expect(maintenance).toHaveProperty('notifications');
      expect(maintenance).toHaveProperty('approvals');
    });
  });

  describe('Integration and Automation', () => {
    it('should integrate with monitoring systems', async () => {
      const integrations = await slaManager.configureMonitoringIntegrations([
        {
          type: 'prometheus',
          endpoint: 'http://prometheus:9090',
          metrics: ['uptime', 'response_time', 'error_rate']
        },
        {
          type: 'datadog',
          apiKey: 'test-key',
          monitors: ['synthetics', 'apm']
        }
      ]);

      expect(integrations).toHaveLength(2);
      integrations.forEach(integration => {
        expect(integration).toHaveProperty('status', 'active');
        expect(integration).toHaveProperty('lastSync');
        expect(integration).toHaveProperty('metrics');
      });
    });

    it('should automate incident response', async () => {
      const automation = await slaManager.configureAutomation({
        triggers: [
          {
            condition: 'uptime < 99.9',
            actions: ['page_oncall', 'create_incident', 'enable_fallback']
          },
          {
            condition: 'response_time > 500ms for 5 minutes',
            actions: ['scale_up', 'notify_team']
          }
        ],
        escalation: {
          levels: [
            { after: 5, notify: ['oncall'] },
            { after: 15, notify: ['team_lead'] },
            { after: 30, notify: ['cto'] }
          ]
        }
      });

      expect(automation).toHaveProperty('enabled', true);
      expect(automation).toHaveProperty('rules');
      expect(automation).toHaveProperty('lastTriggered');
    });

    it('should provide API for SLA queries', async () => {
      const api = slaManager.getAPI();
      
      // Test various API endpoints
      const currentStatus = await api.getCurrentStatus('sla-enterprise');
      expect(currentStatus).toHaveProperty('compliance');
      
      const historicalData = await api.getHistoricalData({
        slaId: 'sla-enterprise',
        metric: 'uptime',
        period: 'last_30_days'
      });
      expect(Array.isArray(historicalData)).toBe(true);
      
      const credits = await api.getServiceCredits('customer-123');
      expect(credits).toHaveProperty('total');
      expect(credits).toHaveProperty('pending');
      expect(credits).toHaveProperty('applied');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle high-frequency metric updates', async () => {
      const metrics = Array.from({ length: 10000 }, (_, i) => ({
        timestamp: new Date(Date.now() - i * 1000),
        metric: 'response_time',
        value: 150 + Math.random() * 100,
        endpoint: `/api/endpoint${i % 10}`
      }));

      const startTime = Date.now();
      await slaManager.ingestMetrics(metrics);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(1000); // Process 10k metrics in under 1 second
    });

    it('should efficiently calculate compliance for multiple SLAs', async () => {
      const slaIds = Array.from({ length: 100 }, (_, i) => `sla-${i}`);
      
      const startTime = Date.now();
      const compliance = await slaManager.batchCalculateCompliance(slaIds);
      const duration = Date.now() - startTime;

      expect(compliance).toHaveLength(100);
      expect(duration).toBeLessThan(500); // Calculate 100 SLAs in under 500ms
    });

    it('should optimize storage for historical data', async () => {
      const storageStats = await slaManager.getStorageStatistics();
      
      expect(storageStats).toHaveProperty('rawDataSize');
      expect(storageStats).toHaveProperty('aggregatedDataSize');
      expect(storageStats).toHaveProperty('compressionRatio');
      expect(storageStats.compressionRatio).toBeGreaterThan(5); // At least 5:1 compression
      
      expect(storageStats).toHaveProperty('retentionPolicy');
      expect(storageStats.retentionPolicy).toHaveProperty('raw', 30); // 30 days
      expect(storageStats.retentionPolicy).toHaveProperty('hourly', 90); // 90 days
      expect(storageStats.retentionPolicy).toHaveProperty('daily', 365); // 1 year
    });
  });
});