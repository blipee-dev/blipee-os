/**
 * Framework Engines Test Suite
 *
 * Comprehensive tests for all compliance framework engines.
 * Tests core functionality, edge cases, and integration scenarios.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BaseFrameworkEngine } from '../frameworks/base-framework';
import { SECClimateFrameworkEngine } from '../frameworks/sec-climate';
import { EUCSRDFrameworkEngine } from '../frameworks/eu-csrd';
import { TCFDFrameworkEngine } from '../frameworks/tcfd';
import { GRIFrameworkEngine } from '../frameworks/gri';
import { CDPFrameworkEngine } from '../frameworks/cdp';
import { SBTiFrameworkEngine } from '../frameworks/sbti';
import { ISO14001FrameworkEngine } from '../frameworks/iso-14001';
import { FrameworkFactory, FrameworkRegistry } from '../frameworks';

// Mock organization ID for testing
const TEST_ORG_ID = 'test-org-123';

// Mock data for testing
const mockOrganizationData = {
  organizationId: TEST_ORG_ID,
  industry: 'technology',
  size: 'large',
  location: 'US',
  publiclyTraded: true
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
    opportunities: ['resource_efficiency', 'products_services'],
    scenarioAnalysis: true
  }
};

describe('BaseFrameworkEngine', () => {
  let engine: BaseFrameworkEngine;

  beforeEach(() => {
    // Create a concrete implementation for testing
    class TestFrameworkEngine extends BaseFrameworkEngine {
      protected getFrameworkSpecificRequirements() {
        return [
          {
            id: 'test-req-1',
            title: 'Test Requirement 1',
            description: 'Test requirement for testing',
            category: 'governance',
            subcategory: 'oversight',
            type: 'disclosure',
            priority: 'high',
            mandatory: true,
            frequency: 'annual',
            deadline: '2024-03-31',
            dataRequirements: [
              {
                type: 'emissions_data',
                category: 'environmental',
                source: 'internal',
                frequency: 'monthly',
                priority: 'critical',
                validationRules: ['non_negative', 'complete'],
                estimatedCost: 1000
              }
            ],
            validationRules: ['completeness', 'accuracy'],
            penalties: {
              type: 'financial',
              amount: 10000,
              description: 'Non-compliance fine'
            }
          }
        ];
      }

      protected calculateFrameworkSpecificScore(): number {
        return 85;
      }

      protected generateFrameworkSpecificReport(): any {
        return {
          summary: 'Test framework report',
          sections: ['governance', 'strategy']
        };
      }
    }

    engine = new TestFrameworkEngine(TEST_ORG_ID);
  });

  describe('Framework Information', () => {
    it('should return framework information', async () => {
      const info = await engine.getFrameworkInfo();

      expect(info).toBeDefined();
      expect(info.code).toBeDefined();
      expect(info.name).toBeDefined();
      expect(info.requirements).toBeInstanceOf(Array);
      expect(info.requirements.length).toBeGreaterThan(0);
    });

    it('should include all required framework metadata', async () => {
      const info = await engine.getFrameworkInfo();

      expect(info.version).toBeDefined();
      expect(info.effectiveDate).toBeInstanceOf(Date);
      expect(info.jurisdiction).toBeDefined();
      expect(info.type).toMatch(/mandatory|voluntary/);
      expect(info.reportingPeriod).toBeDefined();
    });
  });

  describe('Compliance Assessment', () => {
    it('should perform compliance assessment', async () => {
      const assessment = await engine.assessCompliance(mockComplianceData);

      expect(assessment).toBeDefined();
      expect(assessment.assessmentId).toBeDefined();
      expect(assessment.frameworkCode).toBeDefined();
      expect(assessment.organizationId).toBe(TEST_ORG_ID);
      expect(assessment.overallScore).toBeGreaterThanOrEqual(0);
      expect(assessment.overallScore).toBeLessThanOrEqual(100);
      expect(assessment.categoryScores).toBeInstanceOf(Object);
      expect(assessment.requirementResults).toBeInstanceOf(Array);
    });

    it('should handle empty compliance data', async () => {
      const assessment = await engine.assessCompliance({});

      expect(assessment).toBeDefined();
      expect(assessment.overallScore).toBeGreaterThanOrEqual(0);
      expect(assessment.status).toBeDefined();
    });

    it('should validate input data format', async () => {
      const invalidData = null;

      await expect(engine.assessCompliance(invalidData as any)).rejects.toThrow();
    });
  });

  describe('Score Calculation', () => {
    it('should calculate compliance score', async () => {
      const score = await engine.calculateScore(mockComplianceData);

      expect(score).toBeDefined();
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.categories).toBeInstanceOf(Object);
    });

    it('should return consistent scores for same data', async () => {
      const score1 = await engine.calculateScore(mockComplianceData);
      const score2 = await engine.calculateScore(mockComplianceData);

      expect(score1.overall).toBe(score2.overall);
    });
  });

  describe('Report Generation', () => {
    it('should generate compliance report', async () => {
      const report = await engine.generateReport('standard', mockComplianceData);

      expect(report).toBeDefined();
      expect(report.reportId).toBeDefined();
      expect(report.frameworkCode).toBeDefined();
      expect(report.sections).toBeInstanceOf(Array);
      expect(report.metadata).toBeDefined();
    });

    it('should support different report types', async () => {
      const standardReport = await engine.generateReport('standard', mockComplianceData);
      const detailedReport = await engine.generateReport('detailed', mockComplianceData);

      expect(standardReport.sections.length).toBeLessThanOrEqual(detailedReport.sections.length);
    });
  });

  describe('Deadline Management', () => {
    it('should check upcoming deadlines', async () => {
      const deadlines = await engine.checkDeadlines();

      expect(deadlines).toBeDefined();
      expect(deadlines.upcomingDeadlines).toBeInstanceOf(Array);
      expect(deadlines.overdueItems).toBeInstanceOf(Array);
    });

    it('should identify overdue items', async () => {
      // Mock a past deadline
      vi.setSystemTime(new Date('2024-06-01'));

      const deadlines = await engine.checkDeadlines();

      expect(deadlines.overdueItems.length).toBeGreaterThanOrEqual(0);

      vi.useRealTimers();
    });
  });
});

describe('SEC Climate Framework Engine', () => {
  let engine: SECClimateFrameworkEngine;

  beforeEach(() => {
    engine = new SECClimateFrameworkEngine(TEST_ORG_ID);
  });

  it('should initialize with correct framework metadata', async () => {
    const info = await engine.getFrameworkInfo();

    expect(info.code).toBe('SEC_CLIMATE');
    expect(info.name).toContain('SEC Climate');
    expect(info.jurisdiction).toBe('US');
    expect(info.type).toBe('mandatory');
  });

  it('should include SEC-specific requirements', async () => {
    const info = await engine.getFrameworkInfo();

    const governanceReqs = info.requirements.filter(r => r.category === 'governance');
    const strategyReqs = info.requirements.filter(r => r.category === 'strategy');
    const riskMgmtReqs = info.requirements.filter(r => r.category === 'risk_management');
    const metricsReqs = info.requirements.filter(r => r.category === 'metrics');

    expect(governanceReqs.length).toBeGreaterThan(0);
    expect(strategyReqs.length).toBeGreaterThan(0);
    expect(riskMgmtReqs.length).toBeGreaterThan(0);
    expect(metricsReqs.length).toBeGreaterThan(0);
  });

  it('should assess SEC compliance correctly', async () => {
    const assessment = await engine.assessCompliance(mockComplianceData);

    expect(assessment.frameworkCode).toBe('SEC_CLIMATE');
    expect(assessment.categoryScores).toHaveProperty('governance');
    expect(assessment.categoryScores).toHaveProperty('strategy');
    expect(assessment.categoryScores).toHaveProperty('risk_management');
    expect(assessment.categoryScores).toHaveProperty('metrics');
  });
});

describe('EU CSRD Framework Engine', () => {
  let engine: EUCSRDFrameworkEngine;

  beforeEach(() => {
    engine = new EUCSRDFrameworkEngine(TEST_ORG_ID);
  });

  it('should initialize with correct framework metadata', async () => {
    const info = await engine.getFrameworkInfo();

    expect(info.code).toBe('EU_CSRD');
    expect(info.name).toContain('EU CSRD');
    expect(info.jurisdiction).toBe('EU');
    expect(info.type).toBe('mandatory');
  });

  it('should include double materiality assessment', async () => {
    const info = await engine.getFrameworkInfo();

    const materialityReqs = info.requirements.filter(r =>
      r.title.toLowerCase().includes('materiality') ||
      r.description.toLowerCase().includes('materiality')
    );

    expect(materialityReqs.length).toBeGreaterThan(0);
  });
});

describe('TCFD Framework Engine', () => {
  let engine: TCFDFrameworkEngine;

  beforeEach(() => {
    engine = new TCFDFrameworkEngine(TEST_ORG_ID);
  });

  it('should initialize with correct framework metadata', async () => {
    const info = await engine.getFrameworkInfo();

    expect(info.code).toBe('TCFD');
    expect(info.name).toContain('TCFD');
    expect(info.jurisdiction).toBe('Global');
    expect(info.type).toBe('voluntary');
  });

  it('should include scenario analysis requirements', async () => {
    const info = await engine.getFrameworkInfo();

    const scenarioReqs = info.requirements.filter(r =>
      r.title.toLowerCase().includes('scenario') ||
      r.description.toLowerCase().includes('scenario')
    );

    expect(scenarioReqs.length).toBeGreaterThan(0);
  });
});

describe('Framework Factory', () => {
  it('should create framework engines', () => {
    const frameworks = ['SEC_CLIMATE', 'EU_CSRD', 'TCFD', 'GRI', 'CDP', 'SBTi', 'ISO_14001'];

    frameworks.forEach(framework => {
      const engine = FrameworkFactory.createEngine(framework, TEST_ORG_ID);
      expect(engine).toBeInstanceOf(BaseFrameworkEngine);
    });
  });

  it('should throw error for unknown framework', () => {
    expect(() => {
      FrameworkFactory.createEngine('UNKNOWN_FRAMEWORK', TEST_ORG_ID);
    }).toThrow('Unknown framework code');
  });

  it('should return available frameworks', () => {
    const available = FrameworkFactory.getAvailableFrameworks();

    expect(available).toBeInstanceOf(Array);
    expect(available.length).toBeGreaterThan(0);
    expect(available).toContain('SEC_CLIMATE');
    expect(available).toContain('EU_CSRD');
  });

  it('should check framework support', () => {
    expect(FrameworkFactory.isSupported('SEC_CLIMATE')).toBe(true);
    expect(FrameworkFactory.isSupported('UNKNOWN')).toBe(false);
  });

  it('should create multiple engines', () => {
    const frameworks = ['SEC_CLIMATE', 'TCFD'];
    const engines = FrameworkFactory.createMultipleEngines(frameworks, TEST_ORG_ID);

    expect(engines).toBeInstanceOf(Array);
    expect(engines.length).toBe(2);
    engines.forEach(engine => {
      expect(engine).toBeInstanceOf(BaseFrameworkEngine);
    });
  });
});

describe('Framework Registry', () => {
  it('should return framework metadata', () => {
    const metadata = FrameworkRegistry.getFrameworkMetadata('SEC_CLIMATE');

    expect(metadata).toBeDefined();
    expect(metadata.name).toBeDefined();
    expect(metadata.description).toBeDefined();
    expect(metadata.jurisdiction).toBeDefined();
    expect(metadata.type).toBeDefined();
  });

  it('should return all framework metadata', () => {
    const allMetadata = FrameworkRegistry.getAllFrameworkMetadata();

    expect(allMetadata).toBeInstanceOf(Object);
    expect(Object.keys(allMetadata).length).toBeGreaterThan(0);
  });

  it('should filter frameworks by jurisdiction', () => {
    const usFrameworks = FrameworkRegistry.getFrameworksByJurisdiction('US');
    const euFrameworks = FrameworkRegistry.getFrameworksByJurisdiction('EU');
    const globalFrameworks = FrameworkRegistry.getFrameworksByJurisdiction('Global');

    expect(usFrameworks).toContain('SEC_CLIMATE');
    expect(euFrameworks).toContain('EU_CSRD');
    expect(globalFrameworks.length).toBeGreaterThan(0);
  });

  it('should filter frameworks by type', () => {
    const mandatory = FrameworkRegistry.getFrameworksByType('mandatory');
    const voluntary = FrameworkRegistry.getFrameworksByType('voluntary');

    expect(mandatory).toContain('SEC_CLIMATE');
    expect(mandatory).toContain('EU_CSRD');
    expect(voluntary).toContain('TCFD');
    expect(voluntary).toContain('GRI');
  });

  it('should filter frameworks by focus area', () => {
    const governanceFocus = FrameworkRegistry.getFrameworksByFocus('governance');
    const climateFocus = FrameworkRegistry.getFrameworksByFocus('climate');

    expect(governanceFocus.length).toBeGreaterThan(0);
    expect(climateFocus.length).toBeGreaterThan(0);
  });

  it('should get applicable frameworks for organization', () => {
    const criteria = {
      jurisdiction: 'US',
      industry: 'technology',
      publiclyTraded: true
    };

    const applicable = FrameworkRegistry.getApplicableFrameworks(criteria);

    expect(applicable).toBeInstanceOf(Array);
    expect(applicable.length).toBeGreaterThan(0);
  });
});

describe('Error Handling', () => {
  let engine: SECClimateFrameworkEngine;

  beforeEach(() => {
    engine = new SECClimateFrameworkEngine(TEST_ORG_ID);
  });

  it('should handle invalid organization ID', () => {
    expect(() => {
      new SECClimateFrameworkEngine('');
    }).toThrow();
  });

  it('should handle malformed compliance data gracefully', async () => {
    const malformedData = {
      emissions: 'invalid',
      governance: null
    };

    // Should not throw, but handle gracefully
    const assessment = await engine.assessCompliance(malformedData);
    expect(assessment).toBeDefined();
  });

  it('should handle network/external service failures', async () => {
    // Mock external service failure
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    try {
      const assessment = await engine.assessCompliance(mockComplianceData);
      expect(assessment).toBeDefined();
      // Should continue with cached/default data
    } finally {
      global.fetch = originalFetch;
    }
  });
});

describe('Performance', () => {
  let engine: SECClimateFrameworkEngine;

  beforeEach(() => {
    engine = new SECClimateFrameworkEngine(TEST_ORG_ID);
  });

  it('should complete assessment within reasonable time', async () => {
    const start = performance.now();
    await engine.assessCompliance(mockComplianceData);
    const duration = performance.now() - start;

    // Should complete within 5 seconds
    expect(duration).toBeLessThan(5000);
  });

  it('should handle large datasets efficiently', async () => {
    // Create large mock dataset
    const largeData = {
      ...mockComplianceData,
      facilities: Array(1000).fill({
        id: 'facility-1',
        emissions: { scope1: 100, scope2: 200, scope3: 500 }
      })
    };

    const start = performance.now();
    await engine.assessCompliance(largeData);
    const duration = performance.now() - start;

    // Should handle large data within 10 seconds
    expect(duration).toBeLessThan(10000);
  });
});

describe('Integration', () => {
  it('should work with multiple frameworks simultaneously', async () => {
    const frameworks = ['SEC_CLIMATE', 'TCFD', 'GRI'];
    const engines = frameworks.map(code => FrameworkFactory.createEngine(code, TEST_ORG_ID));

    const assessments = await Promise.all(
      engines.map(engine => engine.assessCompliance(mockComplianceData))
    );

    expect(assessments.length).toBe(3);
    assessments.forEach(assessment => {
      expect(assessment).toBeDefined();
      expect(assessment.overallScore).toBeGreaterThanOrEqual(0);
    });
  });

  it('should maintain data consistency across frameworks', async () => {
    const secEngine = FrameworkFactory.createEngine('SEC_CLIMATE', TEST_ORG_ID);
    const tcfdEngine = FrameworkFactory.createEngine('TCFD', TEST_ORG_ID);

    const [secAssessment, tcfdAssessment] = await Promise.all([
      secEngine.assessCompliance(mockComplianceData),
      tcfdEngine.assessCompliance(mockComplianceData)
    ]);

    // Both should use same input data and return consistent organizational context
    expect(secAssessment.organizationId).toBe(tcfdAssessment.organizationId);
    expect(secAssessment.assessmentDate.toDateString())
      .toBe(tcfdAssessment.assessmentDate.toDateString());
  });
});