/**
 * Tests for GRIStandardsMapper
 * Validates mapping of organizations to GRI sector standards
 */

import { GRIStandardsMapper } from '../gri-standards-mapper';
import { IndustryClassification, GRISectorStandard } from '../types';

describe('GRIStandardsMapper', () => {
  let mapper: GRIStandardsMapper;

  beforeEach(() => {
    mapper = new GRIStandardsMapper();
  });

  describe('Initialization', () => {
    test('should initialize with predefined GRI standards', () => {
      const standards = mapper.getAllStandards();
      
      expect(standards).toContain(GRISectorStandard.GRI_11_OIL_GAS);
      expect(standards).toContain(GRISectorStandard.GRI_12_COAL);
      expect(standards).toContain(GRISectorStandard.GRI_13_AGRICULTURE);
      expect(standards.length).toBeGreaterThanOrEqual(3);
    });

    test('should have standard details for each GRI standard', () => {
      const oilGasDetails = mapper.getStandardDetails(GRISectorStandard.GRI_11_OIL_GAS);
      
      expect(oilGasDetails).toBeDefined();
      expect(oilGasDetails?.standard).toBe(GRISectorStandard.GRI_11_OIL_GAS);
      expect(oilGasDetails?.name).toBe('Oil and Gas Sector');
      expect(oilGasDetails?.industries).toContain('211');
      expect(oilGasDetails?.materialTopics).toBeDefined();
      expect(oilGasDetails?.coreDisclosures).toBeDefined();
      expect(oilGasDetails?.sectorSpecificDisclosures).toBeDefined();
    });
  });

  describe('Oil & Gas (GRI 11) Mapping', () => {
    test('should map oil & gas NAICS codes to GRI 11', async () => {
      const classification: IndustryClassification = {
        naicsCode: '211110', // Crude Petroleum and Natural Gas Extraction
        confidence: 0.9
      };

      const mapping = await mapper.mapToGRIStandards(classification);

      expect(mapping.applicableStandards).toContain(GRISectorStandard.GRI_11_OIL_GAS);
      expect(mapping.materialTopics.length).toBeGreaterThan(0);
      expect(mapping.requiredDisclosures.length).toBeGreaterThan(0);
      expect(mapping.reportingGuidance).toContain('GRI 11');
    });

    test('should include GRI 11 material topics', async () => {
      const classification: IndustryClassification = {
        naicsCode: '213111', // Drilling Oil and Gas Wells
        confidence: 0.85
      };

      const mapping = await mapper.mapToGRIStandards(classification);

      const climateTopics = mapping.materialTopics.filter(topic => 
        topic.name.toLowerCase().includes('climate')
      );
      expect(climateTopics.length).toBeGreaterThan(0);

      const airEmissionTopics = mapping.materialTopics.filter(topic => 
        topic.name.toLowerCase().includes('air')
      );
      expect(airEmissionTopics.length).toBeGreaterThan(0);
    });

    test('should include GRI 11 specific disclosures', async () => {
      const classification: IndustryClassification = {
        naicsCode: '324110', // Petroleum Refineries
        confidence: 0.9
      };

      const mapping = await mapper.mapToGRIStandards(classification);

      const gri11Disclosures = mapping.requiredDisclosures.filter(disclosure => 
        disclosure.code.startsWith('GRI 11')
      );
      expect(gri11Disclosures.length).toBeGreaterThan(0);
    });
  });

  describe('Coal (GRI 12) Mapping', () => {
    test('should map coal NAICS codes to GRI 12', async () => {
      const classification: IndustryClassification = {
        naicsCode: '212111', // Bituminous Coal and Lignite Surface Mining
        confidence: 0.9
      };

      const mapping = await mapper.mapToGRIStandards(classification);

      expect(mapping.applicableStandards).toContain(GRISectorStandard.GRI_12_COAL);
      expect(mapping.sectorSpecificRequirements).toContain('Coal Sector: Follow specific guidance in GRI 12');
    });

    test('should include coal-specific material topics', async () => {
      const classification: IndustryClassification = {
        naicsCode: '2121', // Coal Mining
        confidence: 0.85
      };

      const mapping = await mapper.mapToGRIStandards(classification);

      const coalTopics = mapping.materialTopics.filter(topic => 
        topic.griStandard === 'GRI 12'
      );
      expect(coalTopics.length).toBeGreaterThan(0);
    });
  });

  describe('Agriculture (GRI 13) Mapping', () => {
    test('should map agriculture NAICS codes to GRI 13', async () => {
      const classification: IndustryClassification = {
        naicsCode: '111110', // Soybean Farming
        confidence: 0.9
      };

      const mapping = await mapper.mapToGRIStandards(classification);

      expect(mapping.applicableStandards).toContain(GRISectorStandard.GRI_13_AGRICULTURE);
      expect(mapping.sectorSpecificRequirements).toContain('Agriculture, Aquaculture and Fishing Sectors: Follow specific guidance in GRI 13');
    });

    test('should include agriculture-specific material topics', async () => {
      const classification: IndustryClassification = {
        naicsCode: '112111', // Beef Cattle Ranching and Farming
        confidence: 0.85
      };

      const mapping = await mapper.mapToGRIStandards(classification);

      const agTopics = mapping.materialTopics.filter(topic => 
        topic.griStandard === 'GRI 13'
      );
      expect(agTopics.length).toBeGreaterThan(0);
    });
  });

  describe('Core Disclosures', () => {
    test('should include universal GRI disclosures for all industries', async () => {
      const classification: IndustryClassification = {
        naicsCode: '211110',
        confidence: 0.9
      };

      const mapping = await mapper.mapToGRIStandards(classification);

      const coreDisclosures = mapping.requiredDisclosures.filter(disclosure => 
        disclosure.code.startsWith('GRI 305') || disclosure.code.startsWith('GRI 2')
      );
      expect(coreDisclosures.length).toBeGreaterThan(0);

      // Should include Scope 1 and Scope 2 emissions
      const scope1 = mapping.requiredDisclosures.find(d => d.code === 'GRI 305-1');
      const scope2 = mapping.requiredDisclosures.find(d => d.code === 'GRI 305-2');
      
      expect(scope1).toBeDefined();
      expect(scope1?.title).toContain('Direct (Scope 1) GHG emissions');
      expect(scope2).toBeDefined();
      expect(scope2?.title).toContain('Energy indirect (Scope 2) GHG emissions');
    });

    test('should provide reporting guidance for disclosures', async () => {
      const classification: IndustryClassification = {
        naicsCode: '211110',
        confidence: 0.9
      };

      const mapping = await mapper.mapToGRIStandards(classification);

      mapping.requiredDisclosures.forEach(disclosure => {
        expect(disclosure.reportingGuidance).toBeDefined();
        expect(disclosure.reportingGuidance.length).toBeGreaterThan(0);
        expect(disclosure.requirements).toBeDefined();
        expect(disclosure.requirements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Multiple Standards Mapping', () => {
    test('should handle organizations that might apply to multiple standards', async () => {
      // Test with a diversified energy company that might have both oil/gas and coal operations
      const classification: IndustryClassification = {
        naicsCode: '211', // Broader oil and gas extraction
        confidence: 0.8
      };

      const mapping = await mapper.mapToGRIStandards(classification);

      expect(mapping.applicableStandards.length).toBeGreaterThanOrEqual(1);
      expect(mapping.materialTopics.length).toBeGreaterThan(0);
      expect(mapping.requiredDisclosures.length).toBeGreaterThan(0);
    });

    test('should deduplicate material topics across standards', async () => {
      const classification: IndustryClassification = {
        naicsCode: '211', // Could match multiple energy standards
        confidence: 0.8
      };

      const mapping = await mapper.mapToGRIStandards(classification);

      // Check that topic IDs are unique
      const topicIds = mapping.materialTopics.map(t => t.id);
      const uniqueTopicIds = [...new Set(topicIds)];
      
      expect(topicIds.length).toBe(uniqueTopicIds.length);
    });

    test('should deduplicate disclosures across standards', async () => {
      const classification: IndustryClassification = {
        naicsCode: '211',
        confidence: 0.8
      };

      const mapping = await mapper.mapToGRIStandards(classification);

      // Check that disclosure codes are unique
      const disclosureCodes = mapping.requiredDisclosures.map(d => d.code);
      const uniqueDisclosureCodes = [...new Set(disclosureCodes)];
      
      expect(disclosureCodes.length).toBe(uniqueDisclosureCodes.length);
    });
  });

  describe('No Applicable Standards', () => {
    test('should handle industries with no sector-specific GRI standards', async () => {
      const classification: IndustryClassification = {
        naicsCode: '541511', // Custom Computer Programming Services
        confidence: 0.9
      };

      const mapping = await mapper.mapToGRIStandards(classification);

      expect(mapping.applicableStandards.length).toBe(0);
      expect(mapping.reportingGuidance).toContain('No sector-specific GRI standards apply');
      expect(mapping.reportingGuidance).toContain('GRI Universal Standards');
    });

    test('should provide guidance for non-sector organizations', async () => {
      const classification: IndustryClassification = {
        naicsCode: '999999', // Non-existent code
        confidence: 0.5
      };

      const mapping = await mapper.mapToGRIStandards(classification);

      expect(mapping.applicableStandards.length).toBe(0);
      expect(mapping.materialTopics.length).toBe(0);
      expect(mapping.reportingGuidance).toContain('Universal Standards');
    });
  });

  describe('Material Topics Validation', () => {
    test('should provide complete material topic information', async () => {
      const classification: IndustryClassification = {
        naicsCode: '211110',
        confidence: 0.9
      };

      const mapping = await mapper.mapToGRIStandards(classification);

      mapping.materialTopics.forEach(topic => {
        expect(topic.id).toBeDefined();
        expect(topic.name).toBeDefined();
        expect(topic.description).toBeDefined();
        expect(topic.griStandard).toBeDefined();
        expect(topic.relevance).toMatch(/high|medium|low/);
        expect(Array.isArray(topic.impactAreas)).toBe(true);
        expect(Array.isArray(topic.metrics)).toBe(true);
        expect(Array.isArray(topic.disclosures)).toBe(true);
      });
    });
  });

  describe('Disclosure Validation', () => {
    test('should provide complete disclosure information', async () => {
      const classification: IndustryClassification = {
        naicsCode: '211110',
        confidence: 0.9
      };

      const mapping = await mapper.mapToGRIStandards(classification);

      mapping.requiredDisclosures.forEach(disclosure => {
        expect(disclosure.code).toBeDefined();
        expect(disclosure.title).toBeDefined();
        expect(disclosure.description).toBeDefined();
        expect(Array.isArray(disclosure.requirements)).toBe(true);
        expect(disclosure.requirements.length).toBeGreaterThan(0);
        expect(Array.isArray(disclosure.dataPoints)).toBeDefined();
        expect(disclosure.reportingGuidance).toBeDefined();
      });
    });
  });

  describe('Reporting Guidance', () => {
    test('should generate comprehensive reporting guidance', async () => {
      const standards = [GRISectorStandard.GRI_11_OIL_GAS, GRISectorStandard.GRI_12_COAL];
      
      const classification: IndustryClassification = {
        naicsCode: '211110',
        confidence: 0.9
      };

      const mapping = await mapper.mapToGRIStandards(classification);

      expect(mapping.reportingGuidance).toContain('GRI Sector Standards');
      expect(mapping.reportingGuidance).toContain('material topics');
      expect(mapping.reportingGuidance).toContain('Universal Standards');
      expect(mapping.reportingGuidance).toContain('Sector Standards');
    });

    test('should provide specific guidance for each applicable standard', async () => {
      const classification: IndustryClassification = {
        naicsCode: '211110',
        confidence: 0.9
      };

      const mapping = await mapper.mapToGRIStandards(classification);

      expect(mapping.reportingGuidance).toContain('GRI 11');
      expect(mapping.reportingGuidance).toContain('Oil and Gas');
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing NAICS code', async () => {
      const classification: IndustryClassification = {
        confidence: 0.5
      };

      const mapping = await mapper.mapToGRIStandards(classification);

      expect(mapping).toBeDefined();
      expect(mapping.applicableStandards.length).toBe(0);
    });

    test('should handle invalid NAICS code format', async () => {
      const classification: IndustryClassification = {
        naicsCode: 'invalid',
        confidence: 0.9
      };

      const mapping = await mapper.mapToGRIStandards(classification);

      expect(mapping).toBeDefined();
      expect(mapping.applicableStandards.length).toBe(0);
    });

    test('should handle very short NAICS codes', async () => {
      const classification: IndustryClassification = {
        naicsCode: '21', // Valid 2-digit NAICS
        confidence: 0.9
      };

      const mapping = await mapper.mapToGRIStandards(classification);

      expect(mapping).toBeDefined();
      // Should match oil & gas since it starts with '21'
      expect(mapping.applicableStandards).toContain(GRISectorStandard.GRI_11_OIL_GAS);
    });
  });

  describe('Standard Details', () => {
    test('should return null for non-existent standards', () => {
      const details = mapper.getStandardDetails('INVALID' as GRISectorStandard);
      expect(details).toBeUndefined();
    });

    test('should return complete details for valid standards', () => {
      const details = mapper.getStandardDetails(GRISectorStandard.GRI_11_OIL_GAS);
      
      expect(details).toBeDefined();
      expect(details!.standard).toBe(GRISectorStandard.GRI_11_OIL_GAS);
      expect(details!.name).toBe('Oil and Gas Sector');
      expect(Array.isArray(details!.industries)).toBe(true);
      expect(Array.isArray(details!.materialTopics)).toBe(true);
      expect(Array.isArray(details!.coreDisclosures)).toBe(true);
      expect(Array.isArray(details!.sectorSpecificDisclosures)).toBe(true);
    });
  });
});