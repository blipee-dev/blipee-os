/**
 * SOC 2 Controls Manager Test Suite
 * Tests for SOC 2 Type II compliance controls and monitoring
 */

import { jest } from '@jest/globals';
import { SOC2ControlsManager } from '../soc2/soc2-controls';
import { SOC2Control, SOC2TestResult, SOC2Report, TrustServicePrinciple } from '../soc2/soc2-controls';

// Mock dependencies
jest.mock('@supabase/supabase-js');
jest.mock('ioredis');

describe('SOC2ControlsManager', () => {
  let controlsManager: SOC2ControlsManager;

  beforeEach(() => {
    jest.clearAllMocks();
    controlsManager = new SOC2ControlsManager();
  });

  describe('Control Management', () => {
    it('should initialize with all SOC 2 controls', () => {
      const controls = controlsManager.getAllControls();
      expect(controls).toHaveLength(14); // 14 controls as defined
      
      // Verify all trust service principles are represented
      const principles = new Set(controls.map(c => c.category));
      expect(principles).toContain('Security');
      expect(principles).toContain('Availability');
      expect(principles).toContain('Processing Integrity');
      expect(principles).toContain('Confidentiality');
      expect(principles).toContain('Privacy');
    });

    it('should retrieve control by ID', () => {
      const control = controlsManager.getControl('SEC-001');
      expect(control).toBeDefined();
      expect(control?.name).toBe('Access Control');
      expect(control?.category).toBe('Security');
    });

    it('should get controls by category', () => {
      const securityControls = controlsManager.getControlsByCategory('Security');
      expect(securityControls.length).toBeGreaterThan(0);
      expect(securityControls.every(c => c.category === 'Security')).toBe(true);
    });

    it('should validate control implementation', () => {
      const control = controlsManager.getControl('SEC-001')!;
      const implementation = {
        hasMultiFactorAuth: true,
        hasRoleBasedAccess: true,
        hasPasswordPolicy: true,
        hasSessionTimeout: true,
        lastReviewDate: new Date()
      };

      const validation = controlsManager.validateImplementation(control, implementation);
      expect(validation.isValid).toBe(true);
      expect(validation.missingElements).toHaveLength(0);
    });
  });

  describe('Control Testing', () => {
    it('should test access control', async () => {
      const result = await controlsManager.testControl('SEC-001');
      
      expect(result).toHaveProperty('controlId', 'SEC-001');
      expect(result).toHaveProperty('testDate');
      expect(result).toHaveProperty('passed');
      expect(result).toHaveProperty('findings');
      expect(result).toHaveProperty('evidence');
      expect(result).toHaveProperty('recommendations');
    });

    it('should test data encryption at rest', async () => {
      const result = await controlsManager.testControl('SEC-002');
      
      expect(result.evidence).toContain('Database encryption: Enabled');
      expect(result.evidence).toContain('File storage encryption: Enabled');
      expect(result.evidence).toContain('Encryption algorithm: AES-256');
    });

    it('should test availability monitoring', async () => {
      const result = await controlsManager.testControl('AVL-001');
      
      expect(result.findings).toContain('System uptime: 99.95%');
      expect(result.findings).toContain('Health checks: Configured');
      expect(result.findings).toContain('Alert thresholds: Set');
    });

    it('should test backup procedures', async () => {
      const result = await controlsManager.testControl('AVL-002');
      
      expect(result.evidence).toContain('Automated backups: Enabled');
      expect(result.evidence).toContain('Backup frequency: Daily');
      expect(result.evidence).toContain('Retention period: 30 days');
    });

    it('should test data validation', async () => {
      const result = await controlsManager.testControl('PI-001');
      
      expect(result.passed).toBe(true);
      expect(result.findings).toContain('Input validation: Implemented');
      expect(result.findings).toContain('Data type checking: Enabled');
    });

    it('should test encryption in transit', async () => {
      const result = await controlsManager.testControl('CON-001');
      
      expect(result.evidence).toContain('TLS version: 1.3');
      expect(result.evidence).toContain('Certificate validation: Enabled');
      expect(result.evidence).toContain('HSTS: Enabled');
    });

    it('should batch test multiple controls', async () => {
      const controlIds = ['SEC-001', 'SEC-002', 'AVL-001'];
      const results = await controlsManager.batchTestControls(controlIds);
      
      expect(results).toHaveLength(3);
      expect(results.every(r => r.testDate instanceof Date)).toBe(true);
    });
  });

  describe('Compliance Monitoring', () => {
    it('should track control status over time', () => {
      const history = controlsManager.getControlHistory('SEC-001');
      
      expect(Array.isArray(history)).toBe(true);
      if (history.length > 0) {
        expect(history[0]).toHaveProperty('timestamp');
        expect(history[0]).toHaveProperty('status');
        expect(history[0]).toHaveProperty('score');
      }
    });

    it('should detect compliance drift', async () => {
      // Simulate control degradation
      const control = controlsManager.getControl('SEC-001')!;
      control.status = 'Non-Compliant';
      
      const driftReport = controlsManager.detectComplianceDrift();
      expect(driftReport.driftedControls).toContain('SEC-001');
      expect(driftReport.severity).toBe('high');
    });

    it('should generate alerts for non-compliant controls', () => {
      const alerts = controlsManager.getComplianceAlerts();
      
      expect(Array.isArray(alerts)).toBe(true);
      alerts.forEach(alert => {
        expect(alert).toHaveProperty('controlId');
        expect(alert).toHaveProperty('severity');
        expect(alert).toHaveProperty('message');
        expect(alert).toHaveProperty('timestamp');
      });
    });

    it('should calculate overall compliance score', () => {
      const score = controlsManager.calculateComplianceScore();
      
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('Report Generation', () => {
    it('should generate comprehensive SOC 2 report', async () => {
      const report = await controlsManager.generateSOC2Report();
      
      expect(report).toHaveProperty('reportDate');
      expect(report).toHaveProperty('reportPeriod');
      expect(report).toHaveProperty('organizationName');
      expect(report).toHaveProperty('auditScope');
      expect(report).toHaveProperty('controlResults');
      expect(report).toHaveProperty('overallCompliance');
      expect(report).toHaveProperty('findings');
      expect(report).toHaveProperty('recommendations');
      expect(report).toHaveProperty('managementAssertion');
    });

    it('should include all control test results in report', async () => {
      const report = await controlsManager.generateSOC2Report();
      
      expect(report.controlResults).toHaveLength(14);
      report.controlResults.forEach(result => {
        expect(result).toHaveProperty('control');
        expect(result).toHaveProperty('testResults');
        expect(result).toHaveProperty('complianceStatus');
      });
    });

    it('should generate executive summary', async () => {
      const summary = await controlsManager.generateExecutiveSummary();
      
      expect(summary).toHaveProperty('overallScore');
      expect(summary).toHaveProperty('criticalFindings');
      expect(summary).toHaveProperty('keyRisks');
      expect(summary).toHaveProperty('recommendations');
      expect(summary).toHaveProperty('certificationReadiness');
    });

    it('should export report in multiple formats', async () => {
      const formats = ['pdf', 'json', 'csv'] as const;
      
      for (const format of formats) {
        const exported = await controlsManager.exportReport(format);
        expect(exported).toHaveProperty('format', format);
        expect(exported).toHaveProperty('data');
        expect(exported).toHaveProperty('filename');
      }
    });
  });

  describe('Continuous Monitoring', () => {
    it('should schedule automated control tests', () => {
      const schedule = controlsManager.getTestSchedule();
      
      expect(schedule).toHaveProperty('daily');
      expect(schedule).toHaveProperty('weekly');
      expect(schedule).toHaveProperty('monthly');
      expect(schedule).toHaveProperty('quarterly');
      
      // Verify controls are scheduled based on frequency
      const dailyControls = schedule.daily;
      expect(dailyControls.length).toBeGreaterThan(0);
    });

    it('should track remediation progress', () => {
      const remediation = {
        controlId: 'SEC-001',
        finding: 'Missing MFA for admin accounts',
        priority: 'high' as const,
        assignee: 'security-team',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      };

      controlsManager.createRemediation(remediation);
      const progress = controlsManager.getRemediationProgress('SEC-001');
      
      expect(progress).toHaveProperty('status');
      expect(progress).toHaveProperty('percentComplete');
      expect(progress).toHaveProperty('daysRemaining');
    });

    it('should validate evidence collection', () => {
      const evidence = {
        controlId: 'SEC-002',
        type: 'screenshot' as const,
        description: 'Database encryption configuration',
        collectedDate: new Date(),
        collectedBy: 'auditor@example.com',
        location: '/evidence/sec-002-db-encryption.png'
      };

      const validation = controlsManager.validateEvidence(evidence);
      expect(validation.isValid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });
  });

  describe('Integration with Other Systems', () => {
    it('should integrate with audit trail', async () => {
      const auditEvents = await controlsManager.getControlAuditTrail('SEC-001');
      
      expect(Array.isArray(auditEvents)).toBe(true);
      auditEvents.forEach(event => {
        expect(event).toHaveProperty('timestamp');
        expect(event).toHaveProperty('action');
        expect(event).toHaveProperty('performedBy');
        expect(event).toHaveProperty('details');
      });
    });

    it('should integrate with risk management', () => {
      const riskMapping = controlsManager.mapControlsToRisks();
      
      expect(riskMapping).toHaveProperty('SEC-001');
      const risks = riskMapping['SEC-001'];
      expect(Array.isArray(risks)).toBe(true);
      expect(risks.length).toBeGreaterThan(0);
    });

    it('should support control inheritance', () => {
      const parentControl = controlsManager.getControl('SEC-001')!;
      const inheritedControls = controlsManager.getInheritedControls(parentControl);
      
      expect(Array.isArray(inheritedControls)).toBe(true);
      inheritedControls.forEach(control => {
        expect(control.parentId).toBe('SEC-001');
      });
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large number of control tests efficiently', async () => {
      const startTime = Date.now();
      const results = await controlsManager.batchTestControls(
        controlsManager.getAllControls().map(c => c.id)
      );
      const duration = Date.now() - startTime;
      
      expect(results).toHaveLength(14);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should cache frequently accessed control data', () => {
      // First access - cache miss
      const start1 = Date.now();
      controlsManager.getControl('SEC-001');
      const duration1 = Date.now() - start1;
      
      // Second access - cache hit
      const start2 = Date.now();
      controlsManager.getControl('SEC-001');
      const duration2 = Date.now() - start2;
      
      expect(duration2).toBeLessThan(duration1);
    });
  });
});
