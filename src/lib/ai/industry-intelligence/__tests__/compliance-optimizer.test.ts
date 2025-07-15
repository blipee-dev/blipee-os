/**
 * Test suite for Multi-jurisdiction Compliance Optimizer
 */

import { ComplianceOptimizer } from '../compliance-optimizer';
import { IndustryClassification } from '../types';

describe('ComplianceOptimizer', () => {
  let optimizer: ComplianceOptimizer;

  beforeEach(() => {
    optimizer = new ComplianceOptimizer();
  });

  describe('optimizeCompliance', () => {
    it('should optimize compliance for multi-jurisdiction organization', async () => {
      const organizationData = {
        industry: IndustryClassification.MANUFACTURING,
        jurisdictions: ['US', 'EU', 'UK'],
        organizationSize: 'large',
        annualRevenue: 1000000000,
        employees: 5000,
        currentCompliance: {
          scope1_reporting: true,
          scope2_reporting: true,
          scope3_reporting: false,
          transition_plans: false,
          governance_disclosure: true
        },
        operationalComplexity: 'high',
        riskTolerance: 'medium'
      };

      const result = await optimizer.optimizeCompliance(
        'org-123',
        organizationData
      );

      expect(result).toBeDefined();
      expect(result.organizationId).toBe('org-123');
      expect(result.applicableJurisdictions).toEqual(['US', 'EU', 'UK']);
      expect(result.optimizationStrategy.approach).toMatch(/unified|federated|hybrid/);
      expect(result.implementationPlan.phases.length).toBeGreaterThan(0);
      expect(result.conflictResolutions.length).toBeGreaterThanOrEqual(0);
    });

    it('should recommend unified approach for similar requirements', async () => {
      const organizationData = {
        industry: IndustryClassification.TECHNOLOGY,
        jurisdictions: ['US', 'Canada'],
        organizationSize: 'medium',
        annualRevenue: 100000000,
        currentCompliance: {
          basic_esg_reporting: true
        },
        riskTolerance: 'low'
      };

      const result = await optimizer.optimizeCompliance(
        'org-unified',
        organizationData
      );

      expect(result.optimizationStrategy.approach).toBe('unified');
      expect(result.optimizationStrategy.costSavings).toBeGreaterThan(0);
    });

    it('should recommend federated approach for conflicting requirements', async () => {
      const organizationData = {
        industry: IndustryClassification.OIL_AND_GAS,
        jurisdictions: ['US', 'EU', 'UK', 'Canada', 'Australia'],
        organizationSize: 'large',
        annualRevenue: 5000000000,
        operationalComplexity: 'very_high',
        riskTolerance: 'low'
      };

      const result = await optimizer.optimizeCompliance(
        'org-federated',
        organizationData
      );

      expect(result.optimizationStrategy.approach).toBe('federated');
      expect(result.conflictResolutions.length).toBeGreaterThan(0);
    });
  });

  describe('identifyApplicableRequirements', () => {
    it('should identify requirements for manufacturing in US', async () => {
      const requirements = await optimizer['identifyApplicableRequirements'](
        IndustryClassification.MANUFACTURING,
        ['US'],
        {
          annualRevenue: 500000000,
          employees: 2000,
          publiclyTraded: true
        }
      );

      expect(requirements.length).toBeGreaterThan(0);
      expect(requirements).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            jurisdictionId: 'US',
            category: expect.stringMatching(/reporting|operational|governance|disclosure/)
          })
        ])
      );
    });

    it('should apply materialization thresholds correctly', async () => {
      const smallOrgRequirements = await optimizer['identifyApplicableRequirements'](
        IndustryClassification.TECHNOLOGY,
        ['EU'],
        {
          annualRevenue: 10000000,
          employees: 50,
          publiclyTraded: false
        }
      );

      const largeOrgRequirements = await optimizer['identifyApplicableRequirements'](
        IndustryClassification.TECHNOLOGY,
        ['EU'],
        {
          annualRevenue: 1000000000,
          employees: 5000,
          publiclyTraded: true
        }
      );

      expect(largeOrgRequirements.length).toBeGreaterThan(smallOrgRequirements.length);
    });
  });

  describe('identifyConflicts', () => {
    it('should identify conflicts between US and EU requirements', () => {
      const requirements = [
        {
          id: 'us-scope3-voluntary',
          jurisdictionId: 'US',
          regulation: 'SEC Climate Rule',
          requirement: 'Scope 3 emissions (voluntary)',
          category: 'disclosure' as const,
          frequency: 'annual' as const,
          complexity: 'medium' as const,
          dataRequirements: ['scope3_categories_1_15'],
          systemRequirements: ['emissions_tracking'],
          estimatedCost: { initial: 200000, recurring: 50000 },
          deadline: new Date('2025-01-01'),
          dependencies: []
        },
        {
          id: 'eu-scope3-mandatory',
          jurisdictionId: 'EU',
          regulation: 'CSRD',
          requirement: 'Scope 3 emissions (mandatory)',
          category: 'disclosure' as const,
          frequency: 'annual' as const,
          complexity: 'high' as const,
          dataRequirements: ['scope3_categories_1_15', 'value_chain_assessment'],
          systemRequirements: ['emissions_tracking', 'supply_chain_data'],
          estimatedCost: { initial: 500000, recurring: 100000 },
          deadline: new Date('2024-12-31'),
          dependencies: []
        }
      ];

      const conflicts = optimizer['identifyConflicts'](requirements);

      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts[0].conflictType).toBe('methodology');
      expect(conflicts[0].resolutionStrategy).toMatch(/harmonize|dual_track|prioritize/);
    });
  });

  describe('generateOptimizationStrategy', () => {
    it('should choose unified strategy for compatible requirements', () => {
      const requirements = [
        {
          id: 'us-basic',
          jurisdictionId: 'US',
          estimatedCost: { initial: 100000, recurring: 25000 }
        },
        {
          id: 'canada-basic',
          jurisdictionId: 'Canada',
          estimatedCost: { initial: 80000, recurring: 20000 }
        }
      ];

      const conflicts = [];

      const strategy = optimizer['generateOptimizationStrategy'](
        requirements as any,
        conflicts,
        { riskTolerance: 'medium' }
      );

      expect(strategy.approach).toBe('unified');
      expect(strategy.costSavings).toBeGreaterThan(0);
    });

    it('should choose federated strategy for high-conflict scenarios', () => {
      const requirements = [
        {
          id: 'us-complex',
          jurisdictionId: 'US',
          estimatedCost: { initial: 500000, recurring: 100000 }
        },
        {
          id: 'eu-complex',
          jurisdictionId: 'EU',
          estimatedCost: { initial: 600000, recurring: 120000 }
        }
      ];

      const conflicts = [
        {
          requirement1: 'us-complex',
          requirement2: 'eu-complex',
          conflictType: 'methodology' as const,
          description: 'Different calculation methods',
          resolutionStrategy: 'dual_track' as const,
          resolutionGuidance: 'Maintain separate systems'
        }
      ];

      const strategy = optimizer['generateOptimizationStrategy'](
        requirements as any,
        conflicts,
        { riskTolerance: 'low' }
      );

      expect(strategy.approach).toBe('federated');
    });
  });

  describe('createImplementationPlan', () => {
    it('should create phased implementation plan', () => {
      const requirements = [
        {
          id: 'req1',
          jurisdictionId: 'US',
          complexity: 'low' as const,
          deadline: new Date('2024-12-31'),
          dependencies: [],
          estimatedCost: { initial: 100000, recurring: 25000 }
        },
        {
          id: 'req2',
          jurisdictionId: 'EU',
          complexity: 'high' as const,
          deadline: new Date('2025-06-30'),
          dependencies: ['req1'],
          estimatedCost: { initial: 300000, recurring: 75000 }
        }
      ];

      const plan = optimizer['createImplementationPlan'](
        requirements as any,
        { approach: 'unified', rationale: 'Test', costSavings: 50000, efficiencyGain: 25 }
      );

      expect(plan.phases.length).toBeGreaterThan(0);
      expect(plan.phases[0].phase).toBe(1);
      expect(plan.totalCost.initial).toBe(400000);
      expect(plan.totalCost.annual).toBe(100000);
    });

    it('should handle dependency ordering correctly', () => {
      const requirements = [
        {
          id: 'dependent',
          dependencies: ['foundation'],
          complexity: 'medium' as const,
          deadline: new Date('2025-01-01'),
          estimatedCost: { initial: 200000, recurring: 50000 }
        },
        {
          id: 'foundation',
          dependencies: [],
          complexity: 'low' as const,
          deadline: new Date('2024-06-30'),
          estimatedCost: { initial: 100000, recurring: 25000 }
        }
      ];

      const plan = optimizer['createImplementationPlan'](
        requirements as any,
        { approach: 'unified', rationale: 'Test', costSavings: 0, efficiencyGain: 0 }
      );

      // Foundation should come before dependent
      const foundationPhase = plan.phases.find(p => p.activities.some(a => a.id.includes('foundation')));
      const dependentPhase = plan.phases.find(p => p.activities.some(a => a.id.includes('dependent')));

      expect(foundationPhase?.phase).toBeLessThan(dependentPhase?.phase || 0);
    });
  });

  describe('resolveConflicts', () => {
    it('should provide harmonization resolution for compatible conflicts', () => {
      const conflicts = [
        {
          requirement1: 'req1',
          requirement2: 'req2',
          conflictType: 'data_definition' as const,
          description: 'Different scope 3 category definitions',
          resolutionStrategy: 'harmonize' as const,
          resolutionGuidance: 'Use most comprehensive definition'
        }
      ];

      const resolutions = optimizer['resolveConflicts'](conflicts);

      expect(resolutions.length).toBe(1);
      expect(resolutions[0].strategy).toBe('harmonize');
      expect(resolutions[0].implementation.phases.length).toBeGreaterThan(0);
    });
  });

  describe('calculateCosts', () => {
    it('should calculate unified approach savings', () => {
      const requirements = [
        { estimatedCost: { initial: 100000, recurring: 25000 } },
        { estimatedCost: { initial: 120000, recurring: 30000 } },
        { estimatedCost: { initial: 80000, recurring: 20000 } }
      ];

      const costs = optimizer['calculateCosts'](
        requirements as any,
        'unified'
      );

      expect(costs.separateImplementation.initial).toBe(300000);
      expect(costs.optimizedImplementation.initial).toBeLessThan(300000);
      expect(costs.savings.initial).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should handle invalid jurisdiction codes', async () => {
      const organizationData = {
        industry: IndustryClassification.MANUFACTURING,
        jurisdictions: ['INVALID'],
        organizationSize: 'large' as const,
        annualRevenue: 1000000
      };

      await expect(
        optimizer.optimizeCompliance('org-123', organizationData)
      ).rejects.toThrow('Invalid jurisdiction');
    });

    it('should handle missing organization data', async () => {
      await expect(
        optimizer.optimizeCompliance('org-123', {} as any)
      ).rejects.toThrow('Invalid organization data');
    });
  });

  describe('integration scenarios', () => {
    it('should handle complex multi-jurisdiction scenario', async () => {
      const organizationData = {
        industry: IndustryClassification.OIL_AND_GAS,
        jurisdictions: ['US', 'EU', 'UK', 'Canada', 'Australia'],
        organizationSize: 'large' as const,
        annualRevenue: 10000000000,
        employees: 15000,
        operationalComplexity: 'very_high' as const,
        currentCompliance: {
          scope1_reporting: true,
          scope2_reporting: true,
          scope3_reporting: false,
          transition_plans: false,
          governance_disclosure: true,
          climate_risk_assessment: false
        },
        riskTolerance: 'low' as const,
        budget: 5000000,
        timeline: '36_months'
      };

      const result = await optimizer.optimizeCompliance(
        'complex-org',
        organizationData
      );

      expect(result.applicableJurisdictions.length).toBe(5);
      expect(result.implementationPlan.totalCost.initial).toBeLessThanOrEqual(5000000);
      expect(result.riskAssessment.overallRisk).toMatch(/low|medium|high/);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });
});