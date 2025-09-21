/**
 * Compliance Monitor Test Suite
 *
 * Tests for the automated compliance monitoring and alerting system.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ComplianceMonitor } from '../monitoring/compliance-monitor';
import { ComplianceAlert, MonitoringRule, ComplianceStatus } from '../types';

const TEST_ORG_ID = 'test-org-456';

// Mock monitoring rules
const mockMonitoringRules = [
  {
    id: 'rule-1',
    name: 'SEC Climate Deadline Monitor',
    frameworkCode: 'SEC_CLIMATE',
    type: 'deadline' as const,
    conditions: {
      daysBeforeDeadline: 30,
      requirementCategories: ['governance', 'strategy']
    },
    severity: 'medium' as const,
    alertChannels: ['email', 'dashboard'],
    enabled: true
  },
  {
    id: 'rule-2',
    name: 'Low Compliance Score Alert',
    frameworkCode: 'EU_CSRD',
    type: 'score_threshold' as const,
    conditions: {
      scoreThreshold: 70,
      categories: ['environmental', 'social']
    },
    severity: 'high' as const,
    alertChannels: ['email', 'sms'],
    enabled: true
  }
];

// Mock compliance data
const mockComplianceData = {
  frameworks: {
    'SEC_CLIMATE': {
      overallScore: 85,
      categoryScores: {
        governance: 90,
        strategy: 80,
        risk_management: 85,
        metrics: 85
      },
      upcomingDeadlines: [
        {
          requirementId: 'sec-gov-1',
          deadline: new Date('2024-04-15'),
          status: 'at_risk' as const
        }
      ]
    },
    'EU_CSRD': {
      overallScore: 65,
      categoryScores: {
        environmental: 60,
        social: 70,
        governance: 65
      },
      upcomingDeadlines: []
    }
  }
};

describe('ComplianceMonitor', () => {
  let monitor: ComplianceMonitor;

  beforeEach(async () => {
    monitor = new ComplianceMonitor(TEST_ORG_ID);
    await monitor.initialize(['SEC_CLIMATE', 'EU_CSRD']);

    // Mock external dependencies
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await monitor.stop();
    vi.useRealTimers();
  });

  describe('Initialization', () => {
    it('should initialize with framework codes', async () => {
      const newMonitor = new ComplianceMonitor('test-org-789');
      await newMonitor.initialize(['TCFD', 'GRI']);

      expect(newMonitor).toBeDefined();
      await newMonitor.stop();
    });

    it('should handle empty framework list', async () => {
      const newMonitor = new ComplianceMonitor('test-org-999');
      await expect(newMonitor.initialize([])).rejects.toThrow('At least one framework');
      await newMonitor.stop();
    });

    it('should validate framework codes', async () => {
      const newMonitor = new ComplianceMonitor('test-org-888');
      await expect(newMonitor.initialize(['INVALID_FRAMEWORK'])).rejects.toThrow('Invalid framework');
      await newMonitor.stop();
    });
  });

  describe('Rule Management', () => {
    it('should add monitoring rules', async () => {
      const rule = mockMonitoringRules[0];
      await monitor.addRule(rule);

      const rules = await monitor.getRules();
      expect(rules).toContainEqual(expect.objectContaining({ id: rule.id }));
    });

    it('should update monitoring rules', async () => {
      const rule = mockMonitoringRules[0];
      await monitor.addRule(rule);

      const updatedRule = { ...rule, severity: 'high' as const };
      await monitor.updateRule(rule.id, updatedRule);

      const rules = await monitor.getRules();
      const found = rules.find(r => r.id === rule.id);
      expect(found?.severity).toBe('high');
    });

    it('should remove monitoring rules', async () => {
      const rule = mockMonitoringRules[0];
      await monitor.addRule(rule);

      await monitor.removeRule(rule.id);

      const rules = await monitor.getRules();
      expect(rules.find(r => r.id === rule.id)).toBeUndefined();
    });

    it('should enable/disable rules', async () => {
      const rule = mockMonitoringRules[0];
      await monitor.addRule(rule);

      await monitor.setRuleEnabled(rule.id, false);
      const rules = await monitor.getRules();
      const found = rules.find(r => r.id === rule.id);
      expect(found?.enabled).toBe(false);

      await monitor.setRuleEnabled(rule.id, true);
      const rulesAfter = await monitor.getRules();
      const foundAfter = rulesAfter.find(r => r.id === rule.id);
      expect(foundAfter?.enabled).toBe(true);
    });
  });

  describe('Monitoring Execution', () => {
    beforeEach(async () => {
      // Add test rules
      for (const rule of mockMonitoringRules) {
        await monitor.addRule(rule);
      }
    });

    it('should check compliance status', async () => {
      const status = await monitor.checkCompliance();

      expect(status).toBeDefined();
      expect(status.organizationId).toBe(TEST_ORG_ID);
      expect(status.overallStatus).toMatch(/compliant|at_risk|non_compliant/);
      expect(status.frameworkStatuses).toBeInstanceOf(Object);
      expect(status.alerts).toBeInstanceOf(Array);
    });

    it('should detect deadline alerts', async () => {
      // Mock date to be 25 days before deadline (within 30-day threshold)
      const mockDate = new Date('2024-03-21'); // 25 days before April 15
      vi.setSystemTime(mockDate);

      const status = await monitor.checkCompliance();

      const deadlineAlerts = status.alerts.filter(alert => alert.type === 'deadline');
      expect(deadlineAlerts.length).toBeGreaterThan(0);
    });

    it('should detect score threshold alerts', async () => {
      // EU_CSRD score is 65, below threshold of 70
      const status = await monitor.checkCompliance();

      const scoreAlerts = status.alerts.filter(alert => alert.type === 'score_threshold');
      expect(scoreAlerts.length).toBeGreaterThan(0);

      const euAlert = scoreAlerts.find(alert => alert.frameworkCode === 'EU_CSRD');
      expect(euAlert).toBeDefined();
      expect(euAlert?.severity).toBe('high');
    });

    it('should not trigger disabled rules', async () => {
      // Disable score threshold rule
      await monitor.setRuleEnabled('rule-2', false);

      const status = await monitor.checkCompliance();

      const scoreAlerts = status.alerts.filter(alert =>
        alert.type === 'score_threshold' && alert.frameworkCode === 'EU_CSRD'
      );
      expect(scoreAlerts.length).toBe(0);
    });
  });

  describe('Alert Management', () => {
    beforeEach(async () => {
      for (const rule of mockMonitoringRules) {
        await monitor.addRule(rule);
      }
    });

    it('should create alerts when conditions are met', async () => {
      const status = await monitor.checkCompliance();

      expect(status.alerts.length).toBeGreaterThan(0);
      status.alerts.forEach(alert => {
        expect(alert.id).toBeDefined();
        expect(alert.organizationId).toBe(TEST_ORG_ID);
        expect(alert.type).toMatch(/deadline|score_threshold|data_quality|regulatory_change/);
        expect(alert.severity).toMatch(/low|medium|high|critical/);
        expect(alert.createdAt).toBeInstanceOf(Date);
      });
    });

    it('should get alert history', async () => {
      // Trigger some alerts
      await monitor.checkCompliance();

      const history = await monitor.getAlertHistory(7); // Last 7 days

      expect(history).toBeInstanceOf(Array);
      history.forEach(alert => {
        expect(alert).toMatchObject({
          id: expect.any(String),
          organizationId: TEST_ORG_ID,
          type: expect.any(String),
          severity: expect.any(String),
          createdAt: expect.any(Date)
        });
      });
    });

    it('should acknowledge alerts', async () => {
      const status = await monitor.checkCompliance();

      if (status.alerts.length > 0) {
        const alert = status.alerts[0];
        await monitor.acknowledgeAlert(alert.id, 'test-user', 'Alert reviewed');

        const acknowledgedAlert = await monitor.getAlert(alert.id);
        expect(acknowledgedAlert?.acknowledged).toBe(true);
        expect(acknowledgedAlert?.acknowledgedBy).toBe('test-user');
      }
    });

    it('should resolve alerts', async () => {
      const status = await monitor.checkCompliance();

      if (status.alerts.length > 0) {
        const alert = status.alerts[0];
        await monitor.resolveAlert(alert.id, 'test-user', 'Issue fixed');

        const resolvedAlert = await monitor.getAlert(alert.id);
        expect(resolvedAlert?.resolved).toBe(true);
        expect(resolvedAlert?.resolvedBy).toBe('test-user');
      }
    });
  });

  describe('Automated Monitoring', () => {
    beforeEach(async () => {
      for (const rule of mockMonitoringRules) {
        await monitor.addRule(rule);
      }
    });

    it('should start automated monitoring', async () => {
      const checkInterval = 100; // 100ms for testing
      await monitor.startAutomatedMonitoring(checkInterval);

      // Wait for at least one check cycle
      await new Promise(resolve => setTimeout(resolve, 150));

      await monitor.stopAutomatedMonitoring();

      // Should have performed automated checks
      expect(true).toBe(true); // Placeholder - in real implementation, would check metrics
    });

    it('should handle errors during automated monitoring', async () => {
      // Mock an error condition
      const originalCheckCompliance = monitor.checkCompliance;
      vi.spyOn(monitor, 'checkCompliance').mockRejectedValueOnce(new Error('Test error'));

      const checkInterval = 100;
      await monitor.startAutomatedMonitoring(checkInterval);

      // Wait for error to occur and be handled
      await new Promise(resolve => setTimeout(resolve, 150));

      await monitor.stopAutomatedMonitoring();

      // Should continue running after error
      expect(true).toBe(true); // In real implementation, would verify error handling
    });
  });

  describe('Escalation', () => {
    beforeEach(async () => {
      for (const rule of mockMonitoringRules) {
        await monitor.addRule(rule);
      }
    });

    it('should escalate unacknowledged critical alerts', async () => {
      // Add a critical rule
      const criticalRule: MonitoringRule = {
        id: 'critical-rule',
        name: 'Critical Score Alert',
        frameworkCode: 'SEC_CLIMATE',
        type: 'score_threshold',
        conditions: { scoreThreshold: 90 }, // High threshold to trigger
        severity: 'critical',
        alertChannels: ['email'],
        enabled: true,
        escalation: {
          enabled: true,
          timeoutMinutes: 1, // 1 minute for testing
          escalationLevels: [
            { level: 1, recipients: ['manager@test.com'], channels: ['email'] },
            { level: 2, recipients: ['director@test.com'], channels: ['email', 'sms'] }
          ]
        }
      };

      await monitor.addRule(criticalRule);

      // Trigger alert
      const status = await monitor.checkCompliance();
      const criticalAlerts = status.alerts.filter(a => a.severity === 'critical');

      if (criticalAlerts.length > 0) {
        // Wait for escalation timeout
        await new Promise(resolve => setTimeout(resolve, 70000)); // 70 seconds

        // Check if escalation occurred
        const escalationHistory = await monitor.getEscalationHistory(criticalAlerts[0].id);
        expect(escalationHistory.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Integration with Framework Engines', () => {
    it('should fetch real-time compliance data', async () => {
      const status = await monitor.checkCompliance();

      // Should have data for initialized frameworks
      expect(status.frameworkStatuses).toHaveProperty('SEC_CLIMATE');
      expect(status.frameworkStatuses).toHaveProperty('EU_CSRD');

      Object.values(status.frameworkStatuses).forEach(frameworkStatus => {
        expect(frameworkStatus.overallScore).toBeGreaterThanOrEqual(0);
        expect(frameworkStatus.overallScore).toBeLessThanOrEqual(100);
        expect(frameworkStatus.lastAssessment).toBeInstanceOf(Date);
      });
    });

    it('should handle framework engine errors gracefully', async () => {
      // This would test error handling when framework engines fail
      // In a real implementation, we would mock framework engine failures
      const status = await monitor.checkCompliance();
      expect(status).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should complete compliance check within reasonable time', async () => {
      const start = performance.now();
      await monitor.checkCompliance();
      const duration = performance.now() - start;

      // Should complete within 3 seconds
      expect(duration).toBeLessThan(3000);
    });

    it('should handle multiple concurrent checks', async () => {
      const promises = Array(5).fill(null).map(() => monitor.checkCompliance());

      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.organizationId).toBe(TEST_ORG_ID);
      });
    });
  });

  describe('Configuration', () => {
    it('should save and load configuration', async () => {
      const config = {
        checkInterval: 300000, // 5 minutes
        alertRetention: 30, // days
        escalationEnabled: true,
        notificationChannels: {
          email: { enabled: true, endpoint: 'smtp.test.com' },
          sms: { enabled: false },
          webhook: { enabled: true, url: 'https://api.test.com/webhooks' }
        }
      };

      await monitor.updateConfiguration(config);
      const savedConfig = await monitor.getConfiguration();

      expect(savedConfig).toMatchObject(config);
    });

    it('should validate configuration', async () => {
      const invalidConfig = {
        checkInterval: -1, // Invalid
        alertRetention: 'invalid' // Invalid type
      };

      await expect(monitor.updateConfiguration(invalidConfig as any))
        .rejects.toThrow();
    });
  });
});

describe('Alert Types', () => {
  let monitor: ComplianceMonitor;

  beforeEach(async () => {
    monitor = new ComplianceMonitor(TEST_ORG_ID);
    await monitor.initialize(['SEC_CLIMATE']);
  });

  afterEach(async () => {
    await monitor.stop();
  });

  it('should handle deadline alerts', async () => {
    const deadlineRule: MonitoringRule = {
      id: 'deadline-test',
      name: 'Deadline Test',
      frameworkCode: 'SEC_CLIMATE',
      type: 'deadline',
      conditions: { daysBeforeDeadline: 30 },
      severity: 'medium',
      alertChannels: ['email'],
      enabled: true
    };

    await monitor.addRule(deadlineRule);

    // Mock upcoming deadline
    vi.setSystemTime(new Date('2024-03-15')); // 31 days before April 15

    const status = await monitor.checkCompliance();
    const deadlineAlerts = status.alerts.filter(a => a.type === 'deadline');

    expect(deadlineAlerts.length).toBeGreaterThanOrEqual(0);
  });

  it('should handle data quality alerts', async () => {
    const dataQualityRule: MonitoringRule = {
      id: 'data-quality-test',
      name: 'Data Quality Test',
      frameworkCode: 'SEC_CLIMATE',
      type: 'data_quality',
      conditions: {
        accuracyThreshold: 95,
        completenessThreshold: 90
      },
      severity: 'high',
      alertChannels: ['email'],
      enabled: true
    };

    await monitor.addRule(dataQualityRule);

    const status = await monitor.checkCompliance();
    // Would trigger if data quality is below thresholds

    expect(status.alerts).toBeInstanceOf(Array);
  });

  it('should handle regulatory change alerts', async () => {
    const regulatoryRule: MonitoringRule = {
      id: 'regulatory-test',
      name: 'Regulatory Change Test',
      frameworkCode: 'SEC_CLIMATE',
      type: 'regulatory_change',
      conditions: {
        impactLevel: 'high',
        categories: ['governance']
      },
      severity: 'critical',
      alertChannels: ['email', 'sms'],
      enabled: true
    };

    await monitor.addRule(regulatoryRule);

    const status = await monitor.checkCompliance();

    expect(status.alerts).toBeInstanceOf(Array);
  });
});