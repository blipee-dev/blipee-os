import type { 
  ComplianceRule,
  ComplianceCheck,
  ComplianceResult,
  ComplianceReport,
  RegulatoryFramework 
} from '../types';

describe('Compliance types', () => {
  it('should create valid ComplianceRule objects', () => {
    const rule: ComplianceRule = {
      id: 'rule-1',
      name: 'Energy Reporting',
      description: 'Monthly energy consumption reporting',
      framework: 'ISO-50001',
      severity: 'high',
      requirements: ['Monthly reports', 'Verified data']
    };
    expect(rule.id).toBe('rule-1');
    expect(rule.severity).toBe('high');
    expect(rule.requirements).toHaveLength(2);
  });

  it('should create valid ComplianceCheck objects', () => {
    const check: ComplianceCheck = {
      ruleId: 'rule-1',
      passed: true,
      timestamp: new Date().toISOString(),
      details: {
        checkedBy: 'system',
        evidence: ['report-link']
      }
    };
    expect(check.passed).toBe(true);
    expect(check.details?.evidence).toHaveLength(1);
  });

  it('should create valid ComplianceResult objects', () => {
    const result: ComplianceResult = {
      organizationId: 'org-1',
      frameworkId: 'ISO-50001',
      overallCompliance: 0.85,
      checks: [],
      generatedAt: new Date().toISOString()
    };
    expect(result.overallCompliance).toBe(0.85);
    expect(result.frameworkId).toBe('ISO-50001');
  });

  it('should create valid ComplianceReport objects', () => {
    const report: ComplianceReport = {
      id: 'report-1',
      title: 'Q4 2024 Compliance Report',
      period: {
        start: '2024-10-01',
        end: '2024-12-31'
      },
      results: [],
      summary: 'Overall compliance: 92%'
    };
    expect(report.title).toContain('Q4 2024');
    expect(report.period.start).toBe('2024-10-01');
  });

  it('should handle RegulatoryFramework enum', () => {
    const frameworks: RegulatoryFramework[] = [
      'ISO-50001',
      'LEED',
      'ENERGY-STAR',
      'BREEAM'
    ];
    frameworks.forEach(framework => {
      expect(framework).toBeTruthy();
    });
  });
});