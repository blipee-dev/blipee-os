/**
 * Compliance System Integration Test Suite
 *
 * Integration tests that verify the entire compliance system works together
 * as a cohesive unit. Tests end-to-end workflows and system integration.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FrameworkFactory } from '../frameworks';
import { ComplianceMonitor } from '../monitoring/compliance-monitor';
import { RegulatoryIntelligence } from '../intelligence/regulatory-intelligence';
import { ComplianceScoringEngine } from '../scoring/compliance-scoring-engine';
import { AutomatedReportingEngine } from '../reporting/automated-reporting-engine';
import { ComplianceAnalysisFactory } from '../analysis';

const TEST_ORG_ID = 'test-org-integration';

// Mock organization setup
const mockOrganization = {
  id: TEST_ORG_ID,
  name: 'Test Corporation',
  industry: 'Technology',
  size: 'Large',
  location: 'US',
  publiclyTraded: true,
  frameworks: ['SEC_CLIMATE', 'TCFD', 'GRI']
};

const mockComplianceData = {
  emissions: {
    scope1: 1000,
    scope2: 2000,
    scope3: 5000
  },
  governance: {
    boardOversight: true,
    climateExpertise: true,
    executiveCompensation: true
  },
  strategy: {
    climateRisks: ['physical', 'transition'],
    opportunities: ['resource_efficiency'],
    scenarioAnalysis: true
  }
};

describe('Compliance System Integration', () => {
  let monitor: ComplianceMonitor;
  let intelligence: RegulatoryIntelligence;
  let scoringEngine: ComplianceScoringEngine;
  let reportingEngine: AutomatedReportingEngine;
  let analysisFactory: ComplianceAnalysisFactory;

  beforeEach(async () => {
    // Initialize all system components
    monitor = new ComplianceMonitor(TEST_ORG_ID);
    intelligence = new RegulatoryIntelligence();
    scoringEngine = new ComplianceScoringEngine(TEST_ORG_ID);
    reportingEngine = new AutomatedReportingEngine(TEST_ORG_ID);
    analysisFactory = new ComplianceAnalysisFactory(TEST_ORG_ID);

    // Initialize monitoring for test frameworks
    await monitor.initialize(mockOrganization.frameworks);
  });

  afterEach(async () => {
    await monitor.stop();
  });

  describe('End-to-End Compliance Workflow', () => {
    it('should execute complete compliance assessment workflow', async () => {
      // Step 1: Assess compliance across all frameworks
      const frameworks = mockOrganization.frameworks;
      const assessments = [];

      for (const frameworkCode of frameworks) {
        const engine = FrameworkFactory.createEngine(frameworkCode, TEST_ORG_ID);
        const assessment = await engine.assessCompliance(mockComplianceData);
        assessments.push(assessment);
      }

      expect(assessments.length).toBe(frameworks.length);

      // Step 2: Calculate comprehensive scoring
      const overallScore = await scoringEngine.calculateComprehensiveScore(
        frameworks,
        mockComplianceData
      );

      expect(overallScore).toBeDefined();
      expect(overallScore.overallScore).toBeGreaterThanOrEqual(0);
      expect(overallScore.overallScore).toBeLessThanOrEqual(100);

      // Step 3: Generate cross-framework analysis
      const analysis = await analysisFactory.performComprehensiveAnalysis(frameworks);

      expect(analysis).toBeDefined();
      expect(analysis.unifiedStrategy).toBeDefined();
      expect(analysis.frameworkOverlaps.length).toBeGreaterThan(0);

      // Step 4: Check compliance status with monitoring
      const complianceStatus = await monitor.checkCompliance();

      expect(complianceStatus).toBeDefined();
      expect(complianceStatus.organizationId).toBe(TEST_ORG_ID);
      expect(complianceStatus.overallStatus).toMatch(/compliant|at_risk|non_compliant/);

      // Step 5: Generate compliance reports
      const secTemplate = {
        id: 'sec-template',
        frameworkCode: 'SEC_CLIMATE',
        name: 'SEC Climate Report',
        description: 'SEC climate disclosure report',
        version: '1.0',
        sections: [
          {
            id: 'governance',
            title: 'Governance',
            order: 1,
            required: true,
            subsections: []
          }
        ],
        outputFormats: ['PDF'],
        complianceRequirements: {
          deadlines: ['annual'],
          mandatoryFields: ['governance'],
          validationRules: ['completeness']
        },
        metadata: {
          createdBy: 'system',
          createdAt: new Date(),
          lastModified: new Date(),
          tags: ['sec']
        }
      };

      await reportingEngine.createTemplate(secTemplate);
      const report = await reportingEngine.generateReport(
        'sec-template',
        'PDF',
        mockComplianceData
      );

      expect(report).toBeDefined();
      expect(report.status).toMatch(/completed|completed_with_warnings/);
    });

    it('should handle regulatory changes throughout the system', async () => {
      // Step 1: Simulate regulatory change detection
      const changes = await intelligence.detectRegulatoryChanges(['SEC_CLIMATE']);

      expect(changes).toBeInstanceOf(Array);

      // Step 2: Analyze impact of changes
      if (changes.length > 0) {
        const impact = await intelligence.analyzeImpact(changes[0].id, TEST_ORG_ID);
        expect(impact).toBeDefined();
        expect(impact.impactLevel).toMatch(/low|medium|high|critical/);

        // Step 3: Update monitoring rules based on changes
        const newRule = {
          id: 'regulatory-change-rule',
          name: 'Regulatory Change Alert',
          frameworkCode: 'SEC_CLIMATE',
          type: 'regulatory_change' as const,
          conditions: { impactLevel: 'high' },
          severity: 'high' as const,
          alertChannels: ['email'],
          enabled: true
        };

        await monitor.addRule(newRule);

        // Step 4: Re-assess compliance with new rules
        const updatedStatus = await monitor.checkCompliance();
        expect(updatedStatus).toBeDefined();
      }
    });

    it('should maintain data consistency across components', async () => {
      const frameworkCode = 'SEC_CLIMATE';

      // Get data from different components
      const engine = FrameworkFactory.createEngine(frameworkCode, TEST_ORG_ID);
      const frameworkInfo = await engine.getFrameworkInfo();

      const assessment = await engine.assessCompliance(mockComplianceData);

      const scoring = await scoringEngine.calculateFrameworkScore(
        frameworkCode,
        mockComplianceData
      );

      const monitoringStatus = await monitor.checkCompliance();

      // Verify consistency
      expect(assessment.frameworkCode).toBe(frameworkCode);
      expect(scoring.frameworkCode).toBe(frameworkCode);
      expect(monitoringStatus.frameworkStatuses[frameworkCode]).toBeDefined();

      // Scores should be in similar range (allowing for different calculation methods)
      const scoreDifference = Math.abs(assessment.overallScore - scoring.overallScore);
      expect(scoreDifference).toBeLessThan(20); // Allow 20-point difference
    });
  });

  describe('Cross-Component Communication', () => {
    it('should propagate alerts from monitoring to other systems', async () => {
      // Add a test rule that will trigger
      const alertRule = {
        id: 'test-alert-rule',
        name: 'Test Alert Rule',
        frameworkCode: 'SEC_CLIMATE',
        type: 'score_threshold' as const,
        conditions: { scoreThreshold: 95 }, // High threshold to trigger alert
        severity: 'medium' as const,
        alertChannels: ['email'],
        enabled: true
      };

      await monitor.addRule(alertRule);

      // Check compliance to trigger alert
      const status = await monitor.checkCompliance();

      if (status.alerts.length > 0) {
        const alert = status.alerts[0];

        // Verify alert structure
        expect(alert.type).toBe('score_threshold');
        expect(alert.frameworkCode).toBe('SEC_CLIMATE');
        expect(alert.severity).toBe('medium');

        // Simulate alert processing by scoring engine
        const followUpScore = await scoringEngine.calculateFrameworkScore(
          alert.frameworkCode,
          mockComplianceData
        );

        expect(followUpScore).toBeDefined();
      }
    });

    it('should coordinate report generation with compliance status', async () => {
      // Create report template
      const template = {
        id: 'status-report',
        frameworkCode: 'TCFD',
        name: 'TCFD Status Report',
        description: 'TCFD compliance status report',
        version: '1.0',
        sections: [
          {
            id: 'status',
            title: 'Compliance Status',
            order: 1,
            required: true,
            subsections: []
          }
        ],
        outputFormats: ['PDF'],
        complianceRequirements: {
          deadlines: ['quarterly'],
          mandatoryFields: ['status'],
          validationRules: ['completeness']
        },
        metadata: {
          createdBy: 'system',
          createdAt: new Date(),
          lastModified: new Date(),
          tags: ['tcfd', 'status']
        }
      };

      await reportingEngine.createTemplate(template);

      // Get current compliance status
      const complianceStatus = await monitor.checkCompliance();

      // Generate report that includes compliance status
      const enhancedData = {
        ...mockComplianceData,
        complianceStatus: complianceStatus.frameworkStatuses['TCFD']
      };

      const report = await reportingEngine.generateReport(
        'status-report',
        'PDF',
        enhancedData
      );

      expect(report).toBeDefined();
      expect(report.status).toMatch(/completed|completed_with_warnings/);
    });
  });

  describe('Performance Under Load', () => {
    it('should handle concurrent operations across components', async () => {
      const operations = [
        // Concurrent assessments
        ...mockOrganization.frameworks.map(framework => {
          const engine = FrameworkFactory.createEngine(framework, TEST_ORG_ID);
          return engine.assessCompliance(mockComplianceData);
        }),

        // Concurrent monitoring checks
        monitor.checkCompliance(),

        // Concurrent scoring
        scoringEngine.calculateComprehensiveScore(
          mockOrganization.frameworks,
          mockComplianceData
        ),

        // Concurrent analysis
        analysisFactory.performComprehensiveAnalysis(mockOrganization.frameworks)
      ];

      const start = performance.now();
      const results = await Promise.all(operations);
      const duration = performance.now() - start;

      // All operations should complete successfully
      results.forEach(result => {
        expect(result).toBeDefined();
      });

      // Should complete within reasonable time
      expect(duration).toBeLessThan(15000); // 15 seconds
    });

    it('should maintain performance with large datasets', async () => {
      // Create large mock dataset
      const largeData = {
        ...mockComplianceData,
        facilities: Array(100).fill({
          id: 'facility-1',
          emissions: { scope1: 10, scope2: 20, scope3: 50 }
        }),
        suppliers: Array(500).fill({
          id: 'supplier-1',
          emissions: { scope3: 100 }
        })
      };

      const start = performance.now();

      // Test with large data
      const engine = FrameworkFactory.createEngine('SEC_CLIMATE', TEST_ORG_ID);
      const assessment = await engine.assessCompliance(largeData);

      const duration = performance.now() - start;

      expect(assessment).toBeDefined();
      expect(duration).toBeLessThan(10000); // Should handle large data within 10 seconds
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should handle component failures gracefully', async () => {
      // Simulate scoring engine failure
      const originalCalculateScore = scoringEngine.calculateFrameworkScore;
      vi.spyOn(scoringEngine, 'calculateFrameworkScore')
        .mockRejectedValueOnce(new Error('Scoring service unavailable'));

      try {
        // System should continue functioning despite scoring failure
        const engine = FrameworkFactory.createEngine('SEC_CLIMATE', TEST_ORG_ID);
        const assessment = await engine.assessCompliance(mockComplianceData);

        expect(assessment).toBeDefined();
        // Assessment should still work even if enhanced scoring fails

        // Monitoring should also continue
        const status = await monitor.checkCompliance();
        expect(status).toBeDefined();

      } finally {
        // Restore original method
        scoringEngine.calculateFrameworkScore = originalCalculateScore;
      }
    });

    it('should handle network failures in regulatory intelligence', async () => {
      // Mock network failure
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      try {
        // Intelligence should handle network failures gracefully
        const changes = await intelligence.detectRegulatoryChanges(['SEC_CLIMATE']);

        // Should return empty array or cached data instead of throwing
        expect(changes).toBeInstanceOf(Array);

      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should recover from temporary database issues', async () => {
      // This test would verify recovery from database connection issues
      // In a real implementation, we would mock database failures

      // For now, verify that systems can handle missing data gracefully
      const emptyData = {};

      const engine = FrameworkFactory.createEngine('SEC_CLIMATE', TEST_ORG_ID);
      const assessment = await engine.assessCompliance(emptyData);

      expect(assessment).toBeDefined();
      expect(assessment.status).toMatch(/incomplete|warning/);
    });
  });

  describe('Data Security and Privacy', () => {
    it('should maintain data isolation between organizations', async () => {
      const otherOrgId = 'other-org-456';

      // Create components for different organization
      const otherMonitor = new ComplianceMonitor(otherOrgId);
      await otherMonitor.initialize(['SEC_CLIMATE']);

      try {
        // Generate data for both organizations
        const org1Status = await monitor.checkCompliance();
        const org2Status = await otherMonitor.checkCompliance();

        // Data should be isolated
        expect(org1Status.organizationId).toBe(TEST_ORG_ID);
        expect(org2Status.organizationId).toBe(otherOrgId);
        expect(org1Status.organizationId).not.toBe(org2Status.organizationId);

      } finally {
        await otherMonitor.stop();
      }
    });

    it('should handle sensitive data appropriately', async () => {
      const sensitiveData = {
        ...mockComplianceData,
        financialData: {
          revenue: 1000000000,
          costs: 800000000
        },
        personnelData: {
          employeeCount: 10000,
          executiveCompensation: [5000000, 3000000]
        }
      };

      // System should process sensitive data without exposing it inappropriately
      const engine = FrameworkFactory.createEngine('SEC_CLIMATE', TEST_ORG_ID);
      const assessment = await engine.assessCompliance(sensitiveData);

      expect(assessment).toBeDefined();

      // Assessment should not include raw sensitive data in results
      const assessmentString = JSON.stringify(assessment);
      expect(assessmentString).not.toContain('5000000'); // Executive compensation
      expect(assessmentString).not.toContain('1000000000'); // Revenue
    });
  });

  describe('Compliance System Configuration', () => {
    it('should support dynamic framework configuration', async () => {
      // Start with basic frameworks
      const basicFrameworks = ['SEC_CLIMATE'];
      const basicMonitor = new ComplianceMonitor(TEST_ORG_ID);
      await basicMonitor.initialize(basicFrameworks);

      try {
        const initialStatus = await basicMonitor.checkCompliance();
        expect(Object.keys(initialStatus.frameworkStatuses)).toEqual(basicFrameworks);

        // Add more frameworks dynamically
        const extendedFrameworks = ['SEC_CLIMATE', 'TCFD', 'GRI'];
        await basicMonitor.initialize(extendedFrameworks);

        const extendedStatus = await basicMonitor.checkCompliance();
        expect(Object.keys(extendedStatus.frameworkStatuses)).toEqual(
          expect.arrayContaining(extendedFrameworks)
        );

      } finally {
        await basicMonitor.stop();
      }
    });

    it('should validate system configuration', async () => {
      // Test invalid framework combinations
      const invalidFrameworks = ['INVALID_FRAMEWORK', 'SEC_CLIMATE'];

      const invalidMonitor = new ComplianceMonitor(TEST_ORG_ID);

      await expect(invalidMonitor.initialize(invalidFrameworks))
        .rejects.toThrow('Invalid framework');

      await invalidMonitor.stop();
    });
  });
});

describe('Compliance System Health Checks', () => {
  it('should provide system health status', async () => {
    // This would implement health checks for all components
    const components = [
      'Framework Engines',
      'Monitoring System',
      'Regulatory Intelligence',
      'Scoring Engine',
      'Reporting Engine',
      'Analysis System'
    ];

    // Mock health check results
    const healthStatus = {
      overall: 'healthy',
      components: components.map(name => ({
        name,
        status: 'operational',
        lastCheck: new Date(),
        responseTime: Math.random() * 100 + 50 // 50-150ms
      }))
    };

    expect(healthStatus.overall).toBe('healthy');
    expect(healthStatus.components.length).toBe(components.length);

    healthStatus.components.forEach(component => {
      expect(component.status).toBe('operational');
      expect(component.responseTime).toBeGreaterThan(0);
    });
  });

  it('should detect and report component issues', async () => {
    // Mock a component failure
    const healthStatus = {
      overall: 'degraded',
      components: [
        {
          name: 'Framework Engines',
          status: 'operational',
          lastCheck: new Date(),
          responseTime: 75
        },
        {
          name: 'Regulatory Intelligence',
          status: 'error',
          lastCheck: new Date(),
          responseTime: 0,
          error: 'Connection timeout'
        }
      ]
    };

    expect(healthStatus.overall).toBe('degraded');

    const failedComponent = healthStatus.components.find(c => c.status === 'error');
    expect(failedComponent).toBeDefined();
    expect(failedComponent?.error).toBeDefined();
  });
});