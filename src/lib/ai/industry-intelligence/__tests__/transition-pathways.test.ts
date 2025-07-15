/**
 * Test suite for Industry Transition Pathways
 */

import { 
  TransitionPathwayEngine,
  TransitionType,
  TransitionComplexity 
} from '../transition-pathways';
import { IndustryClassification } from '../types';

describe('TransitionPathwayEngine', () => {
  let engine: TransitionPathwayEngine;

  beforeEach(() => {
    engine = new TransitionPathwayEngine();
  });

  describe('getTransitionPathway', () => {
    it('should return coal to renewable transition pathway', async () => {
      const pathway = await engine.getTransitionPathway(
        'org-coal-123',
        IndustryClassification.OIL_AND_GAS,
        TransitionType.COAL_TO_RENEWABLE,
        {
          currentCapacity: 500,
          targetTimeline: '2030',
          budget: 50000000,
          regulatoryDrivers: ['net-zero-2050', 'carbon-pricing']
        }
      );

      expect(pathway).toBeDefined();
      expect(pathway.organizationId).toBe('org-coal-123');
      expect(pathway.transitionType).toBe(TransitionType.COAL_TO_RENEWABLE);
      expect(pathway.phases.length).toBe(4);
      expect(pathway.timeline.totalDuration).toBe('7-10 years');
      expect(pathway.investment.totalCost).toBe(45000000);
    });

    it('should return oil and gas to clean tech pathway', async () => {
      const pathway = await engine.getTransitionPathway(
        'org-og-456',
        IndustryClassification.OIL_AND_GAS,
        TransitionType.OIL_GAS_TO_CLEANTECH,
        {
          currentCapacity: 1000,
          targetTimeline: '2035',
          budget: 100000000
        }
      );

      expect(pathway.transitionType).toBe(TransitionType.OIL_GAS_TO_CLEANTECH);
      expect(pathway.phases.length).toBe(5);
      expect(pathway.complexity).toBe(TransitionComplexity.VERY_HIGH);
    });
  });

  describe('assessTransitionFeasibility', () => {
    it('should assess high feasibility for well-funded transition', async () => {
      const assessment = await engine.assessTransitionFeasibility(
        'org-123',
        TransitionType.COAL_TO_RENEWABLE,
        {
          currentCapacity: 200,
          targetTimeline: '2030',
          budget: 25000000,
          regulatoryDrivers: ['carbon-pricing'],
          stakeholderSupport: 'high',
          technicalReadiness: 'mature'
        }
      );

      expect(assessment.feasibilityScore).toBeGreaterThan(70);
      expect(assessment.riskLevel).toBe('medium');
      expect(assessment.criticalFactors).toContain('sufficient_funding');
    });

    it('should assess medium feasibility for constrained budget', async () => {
      const assessment = await engine.assessTransitionFeasibility(
        'org-456',
        TransitionType.OIL_GAS_TO_CLEANTECH,
        {
          currentCapacity: 500,
          targetTimeline: '2028',
          budget: 15000000,
          stakeholderSupport: 'medium'
        }
      );

      expect(assessment.feasibilityScore).toBeLessThan(70);
      expect(assessment.riskLevel).toBe('high');
      expect(assessment.barriers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'financial',
            severity: 'high'
          })
        ])
      );
    });
  });

  describe('customizePathway', () => {
    it('should customize pathway based on organization constraints', async () => {
      const basePathway = await engine.getTransitionPathway(
        'org-123',
        IndustryClassification.OIL_AND_GAS,
        TransitionType.COAL_TO_RENEWABLE,
        { currentCapacity: 300 }
      );

      const customized = await engine.customizePathway(
        basePathway,
        {
          budgetConstraint: 30000000,
          timelineConstraint: '2028',
          stakeholderRequirements: ['job_preservation', 'local_community_benefit'],
          regulatoryConstraints: ['environmental_permits'],
          technicalConstraints: ['grid_integration']
        }
      );

      expect(customized.phases.length).toBeGreaterThanOrEqual(basePathway.phases.length);
      expect(customized.investment.totalCost).toBeLessThanOrEqual(30000000);
      expect(customized.considerations).toEqual(
        expect.arrayContaining([
          expect.stringContaining('job_preservation')
        ])
      );
    });
  });

  describe('generateImplementationPlan', () => {
    it('should generate detailed implementation plan', async () => {
      const pathway = await engine.getTransitionPathway(
        'org-123',
        IndustryClassification.OIL_AND_GAS,
        TransitionType.COAL_TO_RENEWABLE,
        { currentCapacity: 250 }
      );

      const plan = await engine.generateImplementationPlan(pathway);

      expect(plan).toBeDefined();
      expect(plan.organizationId).toBe('org-123');
      expect(plan.phases.length).toBe(pathway.phases.length);
      expect(plan.timeline.milestones.length).toBeGreaterThan(0);
      expect(plan.resourcePlan.humanResources.length).toBeGreaterThan(0);
      expect(plan.resourcePlan.financialResources.length).toBeGreaterThan(0);
    });

    it('should include risk mitigation strategies', async () => {
      const pathway = await engine.getTransitionPathway(
        'org-456',
        IndustryClassification.OIL_AND_GAS,
        TransitionType.OIL_GAS_TO_CLEANTECH,
        { currentCapacity: 400 }
      );

      const plan = await engine.generateImplementationPlan(pathway);

      expect(plan.riskMitigation.length).toBeGreaterThan(0);
      expect(plan.riskMitigation[0]).toHaveProperty('risk');
      expect(plan.riskMitigation[0]).toHaveProperty('strategy');
      expect(plan.riskMitigation[0]).toHaveProperty('timeline');
    });
  });

  describe('trackTransitionProgress', () => {
    it('should track progress against milestones', async () => {
      const progress = await engine.trackTransitionProgress(
        'org-123',
        'transition-path-456',
        {
          'phase_1_complete': true,
          'phase_2_started': true,
          'regulatory_permits': 'in_progress',
          'technology_selection': 'complete',
          'financing_secured': false
        }
      );

      expect(progress).toBeDefined();
      expect(progress.overallProgress).toBeGreaterThan(0);
      expect(progress.overallProgress).toBeLessThanOrEqual(100);
      expect(progress.currentPhase).toBe(2);
      expect(progress.milestonesAchieved).toContain('phase_1_complete');
      expect(progress.blockers.length).toBeGreaterThan(0);
    });

    it('should identify critical path delays', async () => {
      const progress = await engine.trackTransitionProgress(
        'org-789',
        'transition-path-789',
        {
          'environmental_permits': 'delayed',
          'technology_deployment': 'on_track',
          'workforce_training': 'ahead_of_schedule'
        }
      );

      expect(progress.criticalPathStatus).toBe('delayed');
      expect(progress.blockers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'regulatory',
            severity: 'high'
          })
        ])
      );
    });
  });

  describe('getCaseStudies', () => {
    it('should return relevant case studies for transition type', async () => {
      const caseStudies = await engine.getCaseStudies(
        TransitionType.COAL_TO_RENEWABLE,
        {
          region: 'europe',
          organizationSize: 'large',
          timeframe: '2015-2025'
        }
      );

      expect(caseStudies.length).toBeGreaterThan(0);
      expect(caseStudies[0]).toHaveProperty('organization');
      expect(caseStudies[0]).toHaveProperty('transitionType');
      expect(caseStudies[0]).toHaveProperty('results');
      expect(caseStudies[0]).toHaveProperty('lessonsLearned');
    });
  });

  describe('calculateTransitionROI', () => {
    it('should calculate comprehensive ROI analysis', async () => {
      const roi = await engine.calculateTransitionROI(
        {
          currentCapacity: 300,
          targetTimeline: '2030',
          budget: 40000000
        },
        TransitionType.COAL_TO_RENEWABLE
      );

      expect(roi).toBeDefined();
      expect(roi.financialROI.npv).toBeDefined();
      expect(roi.financialROI.irr).toBeDefined();
      expect(roi.financialROI.paybackPeriod).toBeDefined();
      expect(roi.environmentalBenefits.emissionsReduction).toBeGreaterThan(0);
      expect(roi.socialBenefits.jobsCreated).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should handle invalid transition type', async () => {
      await expect(
        engine.getTransitionPathway(
          'org-123',
          IndustryClassification.MANUFACTURING,
          'invalid_transition' as TransitionType,
          {}
        )
      ).rejects.toThrow('Unsupported transition type');
    });

    it('should handle insufficient organization data', async () => {
      await expect(
        engine.assessTransitionFeasibility(
          'org-123',
          TransitionType.COAL_TO_RENEWABLE,
          {}
        )
      ).rejects.toThrow('Insufficient organization data');
    });
  });
});