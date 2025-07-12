/**
 * Tests for RegulatoryMapper
 * Validates regulatory compliance mapping and assessment
 */

import { RegulatoryMapper } from '../regulatory-mapper';
import { IndustryClassification } from '../types';

describe('RegulatoryMapper', () => {
  let mapper: RegulatoryMapper;

  beforeEach(() => {
    mapper = new RegulatoryMapper();
  });

  describe('Initialization', () => {
    test('should initialize with predefined jurisdictions', () => {
      const jurisdictions = mapper.getSupportedJurisdictions();
      
      expect(jurisdictions).toContain('US');
      expect(jurisdictions).toContain('EU');
      expect(jurisdictions).toContain('global');
      expect(jurisdictions.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('US Regulatory Mapping', () => {
    test('should map oil & gas regulations in US', async () => {
      const classification: IndustryClassification = {
        naicsCode: '211110',
        confidence: 0.9
      };

      const regulations = await mapper.getApplicableRegulations(classification, 'US');

      expect(regulations.length).toBeGreaterThan(0);
      
      const epaRegs = regulations.filter(r => r.agency === 'EPA');
      expect(epaRegs.length).toBeGreaterThan(0);

      const oshaRegs = regulations.filter(r => r.agency === 'OSHA');
      expect(oshaRegs.length).toBeGreaterThan(0);
    });

    test('should map coal mining regulations in US', async () => {
      const classification: IndustryClassification = {
        naicsCode: '212111',
        confidence: 0.9
      };

      const regulations = await mapper.getApplicableRegulations(classification, 'US');

      expect(regulations.length).toBeGreaterThan(0);
      
      const mshaRegs = regulations.filter(r => r.agency === 'MSHA');
      expect(mshaRegs.length).toBeGreaterThan(0);
    });

    test('should map agriculture regulations in US', async () => {
      const classification: IndustryClassification = {
        naicsCode: '111110',
        confidence: 0.9
      };

      const regulations = await mapper.getApplicableRegulations(classification, 'US');

      expect(regulations.length).toBeGreaterThan(0);
      
      const usdaRegs = regulations.filter(r => r.agency === 'USDA');
      expect(usdaRegs.length).toBeGreaterThan(0);

      const fdaRegs = regulations.filter(r => r.agency === 'FDA');
      expect(fdaRegs.length).toBeGreaterThan(0);
    });
  });

  describe('EU Regulatory Mapping', () => {
    test('should map oil & gas regulations in EU', async () => {
      const classification: IndustryClassification = {
        naicsCode: '211110',
        confidence: 0.9
      };

      const regulations = await mapper.getApplicableRegulations(classification, 'EU');

      expect(regulations.length).toBeGreaterThan(0);
      
      const euRegs = regulations.filter(r => r.jurisdiction === 'EU');
      expect(euRegs.length).toBeGreaterThan(0);

      // Should include EU taxonomy, emissions trading, etc.
      const taxonomyRegs = regulations.filter(r => r.name.toLowerCase().includes('taxonomy'));
      expect(taxonomyRegs.length).toBeGreaterThan(0);
    });

    test('should map agriculture regulations in EU', async () => {
      const classification: IndustryClassification = {
        naicsCode: '111110',
        confidence: 0.9
      };

      const regulations = await mapper.getApplicableRegulations(classification, 'EU');

      expect(regulations.length).toBeGreaterThan(0);
      
      const capRegs = regulations.filter(r => r.name.toLowerCase().includes('cap'));
      expect(capRegs.length).toBeGreaterThan(0);
    });
  });

  describe('Global Regulatory Mapping', () => {
    test('should map global regulations for any industry', async () => {
      const classification: IndustryClassification = {
        naicsCode: '211110',
        confidence: 0.9
      };

      const regulations = await mapper.getApplicableRegulations(classification, 'global');

      expect(regulations.length).toBeGreaterThan(0);
      
      const tcfdRegs = regulations.filter(r => r.name.toLowerCase().includes('tcfd'));
      expect(tcfdRegs.length).toBeGreaterThan(0);

      const parisRegs = regulations.filter(r => r.name.toLowerCase().includes('paris'));
      expect(parisRegs.length).toBeGreaterThan(0);
    });
  });

  describe('Compliance Assessment', () => {
    test('should assess compliance for oil & gas company', async () => {
      const classification: IndustryClassification = {
        naicsCode: '211110',
        confidence: 0.9
      };

      const organizationData = {
        scope1_emissions: 100000,
        scope2_emissions: 25000,
        methane_emissions: 500,
        ghg_reporting_submitted: true,
        tcfd_aligned: false,
        esg_report_published: true
      };

      const assessment = await mapper.assessCompliance(
        classification,
        organizationData,
        'US'
      );

      expect(assessment).toBeDefined();
      expect(assessment.overallScore).toBeGreaterThanOrEqual(0);
      expect(assessment.overallScore).toBeLessThanOrEqual(100);
      expect(Array.isArray(assessment.compliantRegulations)).toBe(true);
      expect(Array.isArray(assessment.nonCompliantRegulations)).toBe(true);
      expect(Array.isArray(assessment.gaps)).toBe(true);
      expect(Array.isArray(assessment.recommendations)).toBe(true);
    });

    test('should assess compliance for agriculture company', async () => {
      const classification: IndustryClassification = {
        naicsCode: '111110',
        confidence: 0.9
      };

      const organizationData = {
        organic_certification: true,
        food_safety_certification: true,
        pesticide_usage_reported: true,
        worker_safety_training: true,
        animal_welfare_certification: false
      };

      const assessment = await mapper.assessCompliance(
        classification,
        organizationData,
        'US'
      );

      expect(assessment).toBeDefined();
      expect(assessment.overallScore).toBeGreaterThan(0);
      expect(assessment.gaps.length).toBeGreaterThan(0);
    });

    test('should handle missing compliance data', async () => {
      const classification: IndustryClassification = {
        naicsCode: '211110',
        confidence: 0.9
      };

      const incompleteData = {
        scope1_emissions: 100000
        // Missing other compliance indicators
      };

      const assessment = await mapper.assessCompliance(
        classification,
        incompleteData,
        'US'
      );

      expect(assessment).toBeDefined();
      expect(assessment.overallScore).toBeLessThan(50); // Should be low due to missing data
      expect(assessment.gaps.length).toBeGreaterThan(0);
    });
  });

  describe('Compliance Gap Analysis', () => {
    test('should identify specific gaps', async () => {
      const classification: IndustryClassification = {
        naicsCode: '211110',
        confidence: 0.9
      };

      const organizationData = {
        scope1_emissions: 100000,
        scope2_emissions: 25000,
        tcfd_aligned: false, // Gap
        ghg_reporting_submitted: false, // Gap
        esg_report_published: true
      };

      const gaps = await mapper.identifyComplianceGaps(
        classification,
        organizationData,
        'US'
      );

      expect(gaps.length).toBeGreaterThan(0);
      
      const tcfdGap = gaps.find(g => g.regulation.includes('TCFD'));
      expect(tcfdGap).toBeDefined();

      const reportingGap = gaps.find(g => g.regulation.includes('GHG Reporting'));
      expect(reportingGap).toBeDefined();
    });

    test('should provide remediation guidance', async () => {
      const classification: IndustryClassification = {
        naicsCode: '211110',
        confidence: 0.9
      };

      const organizationData = {
        tcfd_aligned: false,
        ghg_reporting_submitted: false
      };

      const gaps = await mapper.identifyComplianceGaps(
        classification,
        organizationData,
        'US'
      );

      gaps.forEach(gap => {
        expect(gap.severity).toMatch(/critical|high|medium|low/);
        expect(gap.remediation).toBeDefined();
        expect(gap.remediation.length).toBeGreaterThan(0);
        expect(gap.deadline).toBeInstanceOf(Date);
        expect(gap.estimatedCost).toBeGreaterThan(0);
        expect(gap.implementation).toBeDefined();
      });
    });
  });

  describe('Upcoming Regulatory Changes', () => {
    test('should return upcoming changes for oil & gas', async () => {
      const classification: IndustryClassification = {
        naicsCode: '211110',
        confidence: 0.9
      };

      const changes = await mapper.getUpcomingChanges(
        classification,
        'US',
        'next-year'
      );

      expect(changes.length).toBeGreaterThan(0);
      
      changes.forEach(change => {
        expect(change.regulationId).toBeDefined();
        expect(change.title).toBeDefined();
        expect(change.effectiveDate).toBeInstanceOf(Date);
        expect(change.effectiveDate.getTime()).toBeGreaterThan(Date.now());
        expect(change.impact).toMatch(/high|medium|low/);
        expect(change.description).toBeDefined();
        expect(Array.isArray(change.preparationSteps)).toBe(true);
      });
    });

    test('should support different time horizons', async () => {
      const classification: IndustryClassification = {
        naicsCode: '211110',
        confidence: 0.9
      };

      const nextYearChanges = await mapper.getUpcomingChanges(
        classification,
        'US',
        'next-year'
      );

      const next5YearChanges = await mapper.getUpcomingChanges(
        classification,
        'US',
        'next-5-years'
      );

      expect(nextYearChanges.length).toBeGreaterThanOrEqual(0);
      expect(next5YearChanges.length).toBeGreaterThanOrEqual(nextYearChanges.length);
    });
  });

  describe('Implementation Guidance', () => {
    test('should provide implementation guidance for regulations', async () => {
      const classification: IndustryClassification = {
        naicsCode: '211110',
        confidence: 0.9
      };

      const regulations = await mapper.getApplicableRegulations(classification, 'US');
      const firstRegulation = regulations[0];

      const guidance = await mapper.getImplementationGuidance(
        firstRegulation.id,
        classification
      );

      expect(guidance).toBeDefined();
      expect(guidance.regulation).toEqual(firstRegulation);
      expect(Array.isArray(guidance.steps)).toBe(true);
      expect(guidance.steps.length).toBeGreaterThan(0);
      
      guidance.steps.forEach(step => {
        expect(step.order).toBeGreaterThan(0);
        expect(step.title).toBeDefined();
        expect(step.description).toBeDefined();
        expect(step.estimatedTime).toBeDefined();
        expect(Array.isArray(step.resources)).toBe(true);
        expect(Array.isArray(step.dependencies)).toBe(true);
      });

      expect(guidance.timeline).toBeDefined();
      expect(guidance.timeline.totalDuration).toBeGreaterThan(0);
      expect(guidance.budget).toBeDefined();
      expect(guidance.budget.estimatedCost).toBeGreaterThan(0);
      expect(Array.isArray(guidance.risks)).toBe(true);
    });
  });

  describe('Regulatory Monitoring', () => {
    test('should track regulatory changes', async () => {
      const classification: IndustryClassification = {
        naicsCode: '211110',
        confidence: 0.9
      };

      const updates = await mapper.getRecentUpdates(
        classification,
        'US',
        30 // Last 30 days
      );

      expect(Array.isArray(updates)).toBe(true);
      
      updates.forEach(update => {
        expect(update.regulationId).toBeDefined();
        expect(update.changeType).toMatch(/new|modified|repealed|clarified/);
        expect(update.effectiveDate).toBeInstanceOf(Date);
        expect(update.summary).toBeDefined();
        expect(update.impactLevel).toMatch(/high|medium|low/);
        expect(Array.isArray(update.affectedSections)).toBe(true);
      });
    });
  });

  describe('Cross-Jurisdiction Analysis', () => {
    test('should compare regulations across jurisdictions', async () => {
      const classification: IndustryClassification = {
        naicsCode: '211110',
        confidence: 0.9
      };

      const comparison = await mapper.compareJurisdictions(
        classification,
        ['US', 'EU']
      );

      expect(comparison).toBeDefined();
      expect(comparison.commonRegulations.length).toBeGreaterThanOrEqual(0);
      expect(comparison.uniqueToJurisdiction).toBeDefined();
      expect(comparison.uniqueToJurisdiction['US']).toBeDefined();
      expect(comparison.uniqueToJurisdiction['EU']).toBeDefined();
      expect(comparison.conflictingRequirements.length).toBeGreaterThanOrEqual(0);
      expect(comparison.harmonizationOpportunities.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Edge Cases', () => {
    test('should handle unknown jurisdictions', async () => {
      const classification: IndustryClassification = {
        naicsCode: '211110',
        confidence: 0.9
      };

      const regulations = await mapper.getApplicableRegulations(
        classification,
        'UNKNOWN'
      );

      expect(regulations).toBeDefined();
      expect(regulations.length).toBe(0);
    });

    test('should handle invalid industry classifications', async () => {
      const classification: IndustryClassification = {
        naicsCode: '999999',
        confidence: 0.1
      };

      const regulations = await mapper.getApplicableRegulations(
        classification,
        'US'
      );

      expect(regulations).toBeDefined();
      // Should return generic/universal regulations
      expect(regulations.length).toBeGreaterThanOrEqual(0);
    });

    test('should handle missing classification data', async () => {
      const classification: IndustryClassification = {
        confidence: 0.0
      };

      const regulations = await mapper.getApplicableRegulations(
        classification,
        'US'
      );

      expect(regulations).toBeDefined();
      expect(regulations.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance', () => {
    test('should cache regulation lookups', async () => {
      const classification: IndustryClassification = {
        naicsCode: '211110',
        confidence: 0.9
      };

      const start1 = Date.now();
      const regulations1 = await mapper.getApplicableRegulations(classification, 'US');
      const time1 = Date.now() - start1;

      const start2 = Date.now();
      const regulations2 = await mapper.getApplicableRegulations(classification, 'US');
      const time2 = Date.now() - start2;

      expect(regulations1).toEqual(regulations2);
      expect(time2).toBeLessThan(time1); // Second call should be faster due to caching
    });
  });

  describe('Regulation Details', () => {
    test('should provide detailed regulation information', () => {
      const supportedJurisdictions = mapper.getSupportedJurisdictions();
      expect(supportedJurisdictions.length).toBeGreaterThan(0);

      supportedJurisdictions.forEach(jurisdiction => {
        expect(typeof jurisdiction).toBe('string');
        expect(jurisdiction.length).toBeGreaterThan(0);
      });
    });
  });
});