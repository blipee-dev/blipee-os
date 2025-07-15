/**
 * Test suite for Best Practice Library
 */

import { BestPracticeLibrary } from '../best-practice-library';
import { IndustryClassification } from '../types';

describe('BestPracticeLibrary', () => {
  let library: BestPracticeLibrary;

  beforeEach(() => {
    library = new BestPracticeLibrary();
  });

  describe('getBestPractices', () => {
    it('should return all practices when no filters applied', async () => {
      const practices = await library.getBestPractices();

      expect(practices.length).toBeGreaterThan(0);
      expect(practices[0]).toHaveProperty('id');
      expect(practices[0]).toHaveProperty('title');
      expect(practices[0]).toHaveProperty('description');
      expect(practices[0]).toHaveProperty('category');
    });

    it('should filter practices by category', async () => {
      const environmentalPractices = await library.getBestPractices({
        category: 'environmental'
      });

      expect(environmentalPractices.length).toBeGreaterThan(0);
      expect(environmentalPractices.every(p => p.category === 'environmental')).toBe(true);
    });

    it('should filter practices by industry applicability', async () => {
      const manufacturingPractices = await library.getBestPractices({
        industry: IndustryClassification.MANUFACTURING
      });

      expect(manufacturingPractices.length).toBeGreaterThan(0);
      expect(
        manufacturingPractices.every(
          p => p.applicableIndustries.includes(IndustryClassification.MANUFACTURING) ||
               p.applicableIndustries.includes('all')
        )
      ).toBe(true);
    });

    it('should filter by maturity level', async () => {
      const establishedPractices = await library.getBestPractices({
        maturityLevel: 'established'
      });

      expect(establishedPractices.length).toBeGreaterThan(0);
      expect(establishedPractices.every(p => p.maturityLevel === 'established')).toBe(true);
    });

    it('should apply multiple filters simultaneously', async () => {
      const filtered = await library.getBestPractices({
        category: 'environmental',
        maturityLevel: 'established',
        evidenceLevel: 'proven'
      });

      expect(filtered.every(p => 
        p.category === 'environmental' &&
        p.maturityLevel === 'established' &&
        p.evidenceLevel === 'proven'
      )).toBe(true);
    });
  });

  describe('getBestPractice', () => {
    it('should return specific practice by ID', async () => {
      const practice = await library.getBestPractice('sbti-net-zero-commitment');

      expect(practice).toBeDefined();
      expect(practice?.id).toBe('sbti-net-zero-commitment');
      expect(practice?.title).toContain('Science-Based Targets');
      expect(practice?.implementation.phases.length).toBeGreaterThan(0);
    });

    it('should return null for non-existent practice', async () => {
      const practice = await library.getBestPractice('non-existent-id');

      expect(practice).toBeNull();
    });
  });

  describe('recommendPractices', () => {
    it('should recommend practices for manufacturing organization', async () => {
      const recommendations = await library.recommendPractices(
        'org-123',
        {
          industry: IndustryClassification.MANUFACTURING,
          organizationSize: 'large',
          currentMaturity: {
            environmental: 'medium',
            social: 'low',
            governance: 'high'
          },
          priorities: ['emissions_reduction', 'supply_chain'],
          budget: 5000000,
          timeframe: '24_months'
        }
      );

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0]).toHaveProperty('practice');
      expect(recommendations[0]).toHaveProperty('relevanceScore');
      expect(recommendations[0]).toHaveProperty('rationale');
      expect(recommendations[0].relevanceScore).toBeGreaterThan(0);
      expect(recommendations[0].relevanceScore).toBeLessThanOrEqual(100);
    });

    it('should prioritize high-impact practices for budget-constrained organizations', async () => {
      const recommendations = await library.recommendPractices(
        'org-small',
        {
          industry: IndustryClassification.TECHNOLOGY,
          organizationSize: 'small',
          budget: 100000,
          priorities: ['cost_efficiency', 'quick_wins']
        }
      );

      expect(recommendations.length).toBeGreaterThan(0);
      // Should prioritize low-complexity, high-impact practices
      expect(recommendations[0].practice.implementation.complexity).toMatch(/low|medium/);
    });
  });

  describe('getImplementationGuidance', () => {
    it('should provide detailed implementation guidance', async () => {
      const guidance = await library.getImplementationGuidance(
        'circular-economy-manufacturing',
        'org-123',
        {
          organizationSize: 'large',
          currentCapabilities: ['waste_tracking', 'supplier_management'],
          budget: 2000000,
          timeline: '18_months'
        }
      );

      expect(guidance).toBeDefined();
      expect(guidance.customizedPhases.length).toBeGreaterThan(0);
      expect(guidance.resourcePlan).toBeDefined();
      expect(guidance.timeline.totalDuration).toBeDefined();
      expect(guidance.estimatedCost.total).toBeLessThanOrEqual(2000000);
    });

    it('should adjust timeline based on organizational constraints', async () => {
      const fastTrack = await library.getImplementationGuidance(
        'sbti-net-zero-commitment',
        'org-fast',
        {
          timeline: '6_months',
          resourceAvailability: 'high'
        }
      );

      const standard = await library.getImplementationGuidance(
        'sbti-net-zero-commitment',
        'org-standard',
        {
          timeline: '24_months',
          resourceAvailability: 'medium'
        }
      );

      expect(fastTrack.timeline.totalDuration).not.toBe(standard.timeline.totalDuration);
      expect(fastTrack.resourcePlan.financialResources[0]?.monthlyBudget || 0)
        .toBeGreaterThan(standard.resourcePlan.financialResources[0]?.monthlyBudget || 0);
    });
  });

  describe('trackImplementation', () => {
    it('should track implementation progress', async () => {
      const progress = await library.trackImplementation(
        'org-123',
        'sbti-net-zero-commitment',
        {
          phase_1_complete: true,
          baseline_established: true,
          targets_set: false,
          stakeholder_engagement: 'in_progress'
        }
      );

      expect(progress).toBeDefined();
      expect(progress.overallProgress).toBeGreaterThan(0);
      expect(progress.overallProgress).toBeLessThanOrEqual(100);
      expect(progress.currentPhase).toBeGreaterThan(0);
      expect(progress.completedMilestones).toContain('phase_1_complete');
    });

    it('should identify implementation blockers', async () => {
      const progress = await library.trackImplementation(
        'org-456',
        'living-wage-program',
        {
          stakeholder_buy_in: false,
          budget_approved: false,
          legal_review: 'blocked'
        }
      );

      expect(progress.blockers.length).toBeGreaterThan(0);
      expect(progress.blockers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: expect.stringMatching(/stakeholder|budget|legal/)
          })
        ])
      );
    });
  });

  describe('benchmarkPractice', () => {
    it('should benchmark practice adoption across industries', async () => {
      const benchmark = await library.benchmarkPractice(
        'renewable-energy-procurement',
        {
          industry: IndustryClassification.MANUFACTURING,
          region: 'north_america',
          organizationSize: 'large'
        }
      );

      expect(benchmark).toBeDefined();
      expect(benchmark.adoptionRate).toBeGreaterThanOrEqual(0);
      expect(benchmark.adoptionRate).toBeLessThanOrEqual(100);
      expect(benchmark.industryComparison).toBeDefined();
      expect(benchmark.maturityDistribution).toBeDefined();
    });
  });

  describe('calculateROI', () => {
    it('should calculate comprehensive ROI for practice', async () => {
      const roi = await library.calculateROI(
        'renewable-energy-procurement',
        {
          organizationSize: 'large',
          currentEnergySpend: 5000000,
          implementationCost: 500000,
          timeframe: '5_years'
        }
      );

      expect(roi).toBeDefined();
      expect(roi.financial.npv).toBeDefined();
      expect(roi.financial.irr).toBeDefined();
      expect(roi.financial.paybackPeriod).toBeDefined();
      expect(roi.environmental.co2Reduction).toBeGreaterThan(0);
      expect(roi.social.jobs).toBeDefined();
    });
  });

  describe('getRelatedPractices', () => {
    it('should find related practices', async () => {
      const related = await library.getRelatedPractices('sbti-net-zero-commitment');

      expect(related.length).toBeGreaterThan(0);
      expect(related[0]).toHaveProperty('practice');
      expect(related[0]).toHaveProperty('relationship');
      expect(related[0]).toHaveProperty('strength');
      expect(related[0].strength).toBeGreaterThan(0);
      expect(related[0].strength).toBeLessThanOrEqual(1);
    });
  });

  describe('getCaseStudy', () => {
    it('should return detailed case study', async () => {
      const caseStudy = await library.getCaseStudy(
        'renewable-energy-procurement',
        'microsoft-renewable-energy'
      );

      expect(caseStudy).toBeDefined();
      expect(caseStudy?.organization).toBe('Microsoft');
      expect(caseStudy?.industry).toBe('technology');
      expect(caseStudy?.results.quantitative.length).toBeGreaterThan(0);
      expect(caseStudy?.lessonsLearned.length).toBeGreaterThan(0);
    });
  });

  describe('search functionality', () => {
    it('should search practices by keywords', async () => {
      const results = await library.searchPractices('renewable energy');

      expect(results.length).toBeGreaterThan(0);
      expect(
        results.some(p => 
          p.title.toLowerCase().includes('renewable') ||
          p.description.toLowerCase().includes('renewable') ||
          p.tags.some(tag => tag.toLowerCase().includes('renewable'))
        )
      ).toBe(true);
    });

    it('should search by GRI alignment', async () => {
      const results = await library.searchPractices('GRI 305');

      expect(results.length).toBeGreaterThan(0);
      expect(
        results.some(p => 
          p.griAlignment.some(gri => gri.includes('305'))
        )
      ).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle invalid organization data gracefully', async () => {
      const recommendations = await library.recommendPractices(
        'org-invalid',
        {} as any
      );

      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle missing practice data', async () => {
      const guidance = await library.getImplementationGuidance(
        'non-existent-practice',
        'org-123',
        {}
      );

      expect(guidance).toBeNull();
    });
  });
});