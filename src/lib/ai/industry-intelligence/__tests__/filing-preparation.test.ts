/**
 * Test suite for Automated Filing Preparation System
 */

import { 
  FilingPreparationSystem,
  FilingType,
  FilingFormat 
} from '../filing-preparation';
import { IndustryClassification } from '../types';

describe('FilingPreparationSystem', () => {
  let system: FilingPreparationSystem;

  beforeEach(() => {
    system = new FilingPreparationSystem();
  });

  describe('prepareFiling', () => {
    it('should prepare GRI report filing', async () => {
      const filing = await system.prepareFiling({
        organizationId: 'org-123',
        filingType: FilingType.GRI_REPORT,
        reportingPeriod: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31')
        },
        jurisdiction: 'Global',
        format: FilingFormat.PDF,
        options: {
          includeComparatives: true,
          comparativePeriods: 2,
          includeNarratives: true,
          generateSummary: true
        }
      });

      expect(filing).toBeDefined();
      expect(filing.organizationId).toBe('org-123');
      expect(filing.filingType).toBe(FilingType.GRI_REPORT);
      expect(filing.format).toBe(FilingFormat.PDF);
      expect(filing.sections.length).toBeGreaterThan(0);
      expect(filing.dataRequirements.length).toBeGreaterThan(0);
      expect(filing.validationResults.isValid).toBe(true);
    });

    it('should prepare SEC climate disclosure', async () => {
      const filing = await system.prepareFiling({
        organizationId: 'org-sec',
        filingType: FilingType.SEC_CLIMATE_DISCLOSURE,
        reportingPeriod: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31')
        },
        jurisdiction: 'US',
        format: FilingFormat.INLINE_XBRL,
        options: {
          filingForm: '10-K',
          includeTransitionPlans: true,
          includeScenarioAnalysis: true
        }
      });

      expect(filing.filingType).toBe(FilingType.SEC_CLIMATE_DISCLOSURE);
      expect(filing.format).toBe(FilingFormat.INLINE_XBRL);
      expect(filing.jurisdiction).toBe('US');
      expect(filing.sections).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            title: expect.stringContaining('Climate')
          })
        ])
      );
    });

    it('should prepare EU CSRD filing', async () => {
      const filing = await system.prepareFiling({
        organizationId: 'org-eu',
        filingType: FilingType.EU_CSRD,
        reportingPeriod: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31')
        },
        jurisdiction: 'EU',
        format: FilingFormat.XBRL,
        options: {
          esrsStandards: ['ESRS-E1', 'ESRS-S1', 'ESRS-G1'],
          taxonomyAlignment: true,
          materialityAssessment: true
        }
      });

      expect(filing.filingType).toBe(FilingType.EU_CSRD);
      expect(filing.sections.length).toBeGreaterThan(0);
      expect(filing.dataRequirements).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            category: expect.stringMatching(/environmental|social|governance/)
          })
        ])
      );
    });
  });

  describe('collectData', () => {
    it('should collect and map organization data', async () => {
      const data = await system['collectData']('org-123', {
        start: new Date('2024-01-01'),
        end: new Date('2024-12-31')
      });

      expect(data).toBeDefined();
      expect(data.organizationProfile).toBeDefined();
      expect(data.emissions).toBeDefined();
      expect(data.energy).toBeDefined();
      expect(data.governance).toBeDefined();
    });

    it('should identify missing data', async () => {
      const data = await system['collectData']('org-incomplete', {
        start: new Date('2024-01-01'),
        end: new Date('2024-12-31')
      });

      expect(data.missingData.length).toBeGreaterThan(0);
      expect(data.missingData[0]).toHaveProperty('field');
      expect(data.missingData[0]).toHaveProperty('source');
      expect(data.missingData[0]).toHaveProperty('alternatives');
    });
  });

  describe('generateNarrative', () => {
    it('should generate contextual narratives', async () => {
      const narrative = await system['generateNarrative'](
        'climate_strategy',
        {
          organizationName: 'Test Corp',
          industry: IndustryClassification.MANUFACTURING,
          emissions: {
            scope1: 15000,
            scope2: 8000,
            scope3: 45000,
            trend: 'decreasing'
          },
          targets: ['net_zero_2050', 'sbti_approved']
        },
        'strategic'
      );

      expect(narrative).toBeDefined();
      expect(narrative.length).toBeGreaterThan(100);
      expect(narrative).toContain('Test Corp');
      expect(narrative.toLowerCase()).toContain('emissions');
    });

    it('should generate different styles of narratives', async () => {
      const technical = await system['generateNarrative'](
        'emissions_methodology',
        { methodology: 'market_based' },
        'technical'
      );

      const executive = await system['generateNarrative'](
        'sustainability_overview',
        { performance: 'strong' },
        'executive'
      );

      expect(technical).toMatch(/methodology|calculation|approach/i);
      expect(executive).toMatch(/strategy|performance|leadership/i);
    });
  });

  describe('validateFiling', () => {
    it('should validate complete filing', () => {
      const filing = {
        organizationId: 'org-123',
        filingType: FilingType.GRI_REPORT,
        format: FilingFormat.PDF,
        jurisdiction: 'Global',
        reportingPeriod: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31')
        },
        sections: [
          {
            id: 'organizational_profile',
            title: 'Organizational Profile',
            content: 'Test content',
            subsections: [],
            dataPoints: [],
            narratives: [],
            calculations: []
          }
        ],
        dataRequirements: [],
        validationResults: {
          isValid: false,
          errors: [],
          warnings: [],
          info: [],
          completeness: 100,
          qualityScore: 95
        }
      };

      const validation = system['validateFiling'](filing);

      expect(validation.isValid).toBe(true);
      expect(validation.completeness).toBeGreaterThan(0);
      expect(validation.qualityScore).toBeGreaterThan(0);
    });

    it('should identify validation errors', () => {
      const incompleteFiling = {
        organizationId: 'org-123',
        filingType: FilingType.SEC_CLIMATE_DISCLOSURE,
        format: FilingFormat.PDF,
        jurisdiction: 'US',
        reportingPeriod: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31')
        },
        sections: [], // Empty sections should trigger errors
        dataRequirements: [],
        validationResults: {
          isValid: false,
          errors: [],
          warnings: [],
          info: [],
          completeness: 0,
          qualityScore: 0
        }
      };

      const validation = system['validateFiling'](incompleteFiling);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.completeness).toBeLessThan(100);
    });
  });

  describe('createFilingCalendar', () => {
    it('should create comprehensive filing calendar', async () => {
      const calendar = await system.createFilingCalendar(
        'org-123',
        ['US', 'EU', 'UK'],
        2024
      );

      expect(calendar).toBeDefined();
      expect(calendar.organizationId).toBe('org-123');
      expect(calendar.year).toBe(2024);
      expect(calendar.filings.length).toBeGreaterThan(0);
      expect(calendar.reminders.length).toBeGreaterThan(0);
    });

    it('should handle multi-jurisdiction calendar', async () => {
      const calendar = await system.createFilingCalendar(
        'org-multi',
        ['US', 'EU', 'UK', 'Canada', 'Australia'],
        2024
      );

      const jurisdictions = [...new Set(calendar.filings.map(f => f.jurisdiction))];
      expect(jurisdictions).toEqual(
        expect.arrayContaining(['US', 'EU', 'UK', 'Canada', 'Australia'])
      );
    });

    it('should set appropriate reminder dates', async () => {
      const calendar = await system.createFilingCalendar('org-123', ['US'], 2024);
      
      const filing = calendar.filings[0];
      const reminder = calendar.reminders.find(r => r.filingId === filing.id);
      
      expect(reminder).toBeDefined();
      expect(reminder?.reminderDate).toBeDefined();
      expect(reminder?.reminderDate.getTime()).toBeLessThan(filing.dueDate.getTime());
    });
  });

  describe('createSubmissionPackage', () => {
    it('should create complete submission package', async () => {
      const filing = await system.prepareFiling({
        organizationId: 'org-123',
        filingType: FilingType.GRI_REPORT,
        reportingPeriod: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31')
        },
        jurisdiction: 'Global',
        format: FilingFormat.PDF
      });

      const certifications = [
        {
          type: 'CEO Certification',
          certifiedBy: 'John Doe',
          title: 'Chief Executive Officer',
          date: new Date(),
          statement: 'I certify this report is accurate and complete'
        }
      ];

      const package_ = await system.createSubmissionPackage(filing, certifications);

      expect(package_).toBeDefined();
      expect(package_.filingId).toBe(filing.id);
      expect(package_.mainDocument).toBeDefined();
      expect(package_.certifications.length).toBe(1);
      expect(package_.submissionChecklist.length).toBeGreaterThan(0);
    });

    it('should include all required attachments', async () => {
      const filing = await system.prepareFiling({
        organizationId: 'org-comprehensive',
        filingType: FilingType.EU_CSRD,
        reportingPeriod: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31')
        },
        jurisdiction: 'EU',
        format: FilingFormat.XBRL,
        options: {
          includeAssurance: true,
          includeDataTables: true
        }
      });

      const package_ = await system.createSubmissionPackage(filing, []);

      expect(package_.attachments.length).toBeGreaterThan(0);
      expect(package_.attachments).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: expect.stringMatching(/assurance|data_tables|supporting/)
          })
        ])
      );
    });
  });

  describe('formatFiling', () => {
    it('should format to PDF', () => {
      const filing = {
        sections: [
          {
            id: 'test',
            title: 'Test Section',
            content: 'Test content',
            subsections: [],
            dataPoints: [],
            narratives: [],
            calculations: []
          }
        ]
      };

      const formatted = system['formatFiling'](filing as any, FilingFormat.PDF);

      expect(formatted.format).toBe('PDF');
      expect(formatted.content).toContain('Test Section');
      expect(formatted.metadata).toBeDefined();
    });

    it('should format to XBRL', () => {
      const filing = {
        sections: [
          {
            id: 'emissions',
            title: 'Emissions',
            dataPoints: [
              {
                id: 'scope1',
                value: 15000,
                unit: 'tCO2e',
                xbrlTag: 'esrs:Scope1Emissions'
              }
            ],
            subsections: [],
            narratives: [],
            calculations: []
          }
        ]
      };

      const formatted = system['formatFiling'](filing as any, FilingFormat.XBRL);

      expect(formatted.format).toBe('XBRL');
      expect(formatted.content).toContain('<?xml');
      expect(formatted.content).toContain('esrs:Scope1Emissions');
    });
  });

  describe('trackSubmissionStatus', () => {
    it('should track submission progress', async () => {
      const status = await system.trackSubmissionStatus(
        'submission-123',
        'org-123'
      );

      expect(status).toBeDefined();
      expect(status.submissionId).toBe('submission-123');
      expect(status.status).toMatch(/submitted|processing|accepted|rejected/);
      expect(status.lastUpdated).toBeDefined();
    });
  });

  describe('generateFilingHistory', () => {
    it('should generate comprehensive filing history', async () => {
      const history = await system.generateFilingHistory(
        'org-123',
        {
          startDate: new Date('2022-01-01'),
          endDate: new Date('2024-12-31'),
          filingTypes: [FilingType.GRI_REPORT, FilingType.SEC_CLIMATE_DISCLOSURE],
          includeStatus: true
        }
      );

      expect(history).toBeDefined();
      expect(history.organizationId).toBe('org-123');
      expect(history.filings.length).toBeGreaterThanOrEqual(0);
      expect(history.summary).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle invalid filing type', async () => {
      await expect(
        system.prepareFiling({
          organizationId: 'org-123',
          filingType: 'invalid_type' as FilingType,
          reportingPeriod: {
            start: new Date('2024-01-01'),
            end: new Date('2024-12-31')
          },
          jurisdiction: 'US',
          format: FilingFormat.PDF
        })
      ).rejects.toThrow('Unsupported filing type');
    });

    it('should handle invalid jurisdiction', async () => {
      await expect(
        system.prepareFiling({
          organizationId: 'org-123',
          filingType: FilingType.GRI_REPORT,
          reportingPeriod: {
            start: new Date('2024-01-01'),
            end: new Date('2024-12-31')
          },
          jurisdiction: 'INVALID',
          format: FilingFormat.PDF
        })
      ).rejects.toThrow('Invalid jurisdiction');
    });

    it('should handle missing organization data', async () => {
      await expect(
        system.prepareFiling({
          organizationId: 'non-existent',
          filingType: FilingType.GRI_REPORT,
          reportingPeriod: {
            start: new Date('2024-01-01'),
            end: new Date('2024-12-31')
          },
          jurisdiction: 'Global',
          format: FilingFormat.PDF
        })
      ).rejects.toThrow('Organization not found');
    });
  });

  describe('integration scenarios', () => {
    it('should handle complex multi-format, multi-jurisdiction filing', async () => {
      // Prepare multiple filings for the same organization
      const griReport = await system.prepareFiling({
        organizationId: 'org-complex',
        filingType: FilingType.GRI_REPORT,
        reportingPeriod: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31')
        },
        jurisdiction: 'Global',
        format: FilingFormat.PDF
      });

      const secDisclosure = await system.prepareFiling({
        organizationId: 'org-complex',
        filingType: FilingType.SEC_CLIMATE_DISCLOSURE,
        reportingPeriod: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31')
        },
        jurisdiction: 'US',
        format: FilingFormat.INLINE_XBRL
      });

      const euCsrd = await system.prepareFiling({
        organizationId: 'org-complex',
        filingType: FilingType.EU_CSRD,
        reportingPeriod: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31')
        },
        jurisdiction: 'EU',
        format: FilingFormat.XBRL
      });

      expect(griReport.organizationId).toBe('org-complex');
      expect(secDisclosure.organizationId).toBe('org-complex');
      expect(euCsrd.organizationId).toBe('org-complex');

      // All filings should be valid
      expect(griReport.validationResults.isValid).toBe(true);
      expect(secDisclosure.validationResults.isValid).toBe(true);
      expect(euCsrd.validationResults.isValid).toBe(true);
    });
  });
});