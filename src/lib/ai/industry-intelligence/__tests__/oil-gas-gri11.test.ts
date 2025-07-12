/**
 * Tests for OilGasGRI11Model
 * Validates oil & gas industry-specific functionality
 */

import { OilGasGRI11Model } from '../models/oil-gas-gri11';
import { IndustryClassification, GRISectorStandard } from '../types';

describe('OilGasGRI11Model', () => {
  let model: OilGasGRI11Model;

  beforeEach(() => {
    model = new OilGasGRI11Model();
  });

  describe('Model Configuration', () => {
    test('should have correct industry name', () => {
      expect(model.getName()).toBe('Oil and Gas');
    });

    test('should have GRI 11 standard', () => {
      const standards = model.getGRIStandards();
      expect(standards).toContain(GRISectorStandard.GRI_11_OIL_GAS);
    });

    test('should have oil & gas NAICS codes', () => {
      const config = (model as any).config;
      expect(config.naicsCodes).toContain('211');
      expect(config.naicsCodes).toContain('213111');
      expect(config.naicsCodes).toContain('324110');
    });

    test('should have oil & gas SIC codes', () => {
      const config = (model as any).config;
      expect(config.sicCodes).toContain('1311');
      expect(config.sicCodes).toContain('1321');
    });
  });

  describe('Applicability Tests', () => {
    test('should be applicable to oil & gas NAICS codes', async () => {
      const classification: IndustryClassification = {
        naicsCode: '211110',
        confidence: 0.9
      };

      const isApplicable = await model.isApplicable(classification);
      expect(isApplicable).toBe(true);
    });

    test('should be applicable to oil & gas SIC codes', async () => {
      const classification: IndustryClassification = {
        naicsCode: '1311',
        confidence: 0.9
      };

      const isApplicable = await model.isApplicable(classification);
      expect(isApplicable).toBe(true);
    });

    test('should be applicable to oil & gas custom codes', async () => {
      const classification: IndustryClassification = {
        customCode: 'oil-exploration-company',
        confidence: 0.8
      };

      const isApplicable = await model.isApplicable(classification);
      expect(isApplicable).toBe(true);
    });

    test('should not be applicable to non-oil & gas industries', async () => {
      const classification: IndustryClassification = {
        naicsCode: '541511', // Software development
        confidence: 0.9
      };

      const isApplicable = await model.isApplicable(classification);
      expect(isApplicable).toBe(false);
    });
  });

  describe('Material Topics', () => {
    test('should return oil & gas specific material topics', () => {
      const topics = model.getMaterialTopics();

      expect(topics.length).toBeGreaterThan(0);
      
      // Check for key oil & gas topics
      const climateTopics = topics.filter(t => t.name.toLowerCase().includes('climate'));
      expect(climateTopics.length).toBeGreaterThan(0);

      const airTopics = topics.filter(t => t.name.toLowerCase().includes('air'));
      expect(airTopics.length).toBeGreaterThan(0);

      const biodiversityTopics = topics.filter(t => t.name.toLowerCase().includes('biodiversity'));
      expect(biodiversityTopics.length).toBeGreaterThan(0);
    });

    test('should have GRI 11 aligned topics', () => {
      const topics = model.getMaterialTopics();

      topics.forEach(topic => {
        expect(topic.griStandard).toContain('GRI 11');
        expect(topic.relevance).toMatch(/high|medium|low/);
        expect(Array.isArray(topic.impactAreas)).toBe(true);
        expect(Array.isArray(topic.metrics)).toBe(true);
        expect(Array.isArray(topic.disclosures)).toBe(true);
      });
    });
  });

  describe('Industry Metrics', () => {
    test('should return oil & gas specific metrics', () => {
      const metrics = model.getIndustryMetrics();

      expect(metrics.length).toBeGreaterThan(0);

      // Check for key oil & gas metrics
      const ghgMetrics = metrics.filter(m => m.id.includes('ghg'));
      expect(ghgMetrics.length).toBeGreaterThan(0);

      const methaneMetrics = metrics.filter(m => m.id.includes('methane'));
      expect(methaneMetrics.length).toBeGreaterThan(0);

      const safetyMetrics = metrics.filter(m => m.id.includes('trir') || m.id.includes('safety'));
      expect(safetyMetrics.length).toBeGreaterThan(0);
    });

    test('should have proper metric configuration', () => {
      const metrics = model.getIndustryMetrics();

      metrics.forEach(metric => {
        expect(metric.id).toBeDefined();
        expect(metric.name).toBeDefined();
        expect(metric.unit).toBeDefined();
        expect(metric.category).toMatch(/environmental|social|governance|economic/);
        expect(metric.calculationMethod).toBeDefined();
        expect(typeof metric.benchmarkAvailable).toBe('boolean');
        expect(typeof metric.regulatoryRequired).toBe('boolean');
        expect(Array.isArray(metric.griAlignment)).toBe(true);
      });
    });
  });

  describe('ESG Score Calculation', () => {
    test('should calculate ESG scores with proper weighting', async () => {
      const testData = {
        ghg_intensity_upstream: 25.0,
        methane_intensity: 0.15,
        water_intensity: 1.5,
        spill_volume: 5,
        trir: 0.3,
        process_safety_events: 1,
        local_procurement: 60,
        transparency_score: 0.8
      };

      const scores = await model.calculateESGScore(testData);

      expect(scores.overall).toBeGreaterThan(0);
      expect(scores.overall).toBeLessThanOrEqual(100);
      expect(scores.environmental).toBeGreaterThan(0);
      expect(scores.social).toBeGreaterThan(0);
      expect(scores.governance).toBeGreaterThan(0);
      expect(typeof scores.breakdown).toBe('object');
    });

    test('should handle missing data gracefully', async () => {
      const incompleteData = {
        ghg_intensity_upstream: 30.0
        // Missing other metrics
      };

      const scores = await model.calculateESGScore(incompleteData);

      expect(scores.overall).toBeGreaterThan(0);
      expect(scores.environmental).toBeGreaterThan(0);
      expect(scores.social).toBeGreaterThan(0);
      expect(scores.governance).toBeGreaterThan(0);
    });

    test('should penalize poor performance', async () => {
      const poorData = {
        ghg_intensity_upstream: 80.0, // Very high
        methane_intensity: 1.5, // Very high
        spill_volume: 1000, // Large spills
        trir: 5.0, // Very high injury rate
        process_safety_events: 10 // Many incidents
      };

      const scores = await model.calculateESGScore(poorData);

      expect(scores.environmental).toBeLessThan(50);
      expect(scores.social).toBeLessThan(50);
    });

    test('should reward good performance', async () => {
      const goodData = {
        ghg_intensity_upstream: 8.0, // Very low
        methane_intensity: 0.05, // Very low
        water_intensity: 0.3, // Low
        spill_volume: 0, // No spills
        trir: 0.1, // Low injury rate
        process_safety_events: 0, // No incidents
        local_procurement: 90 // High local content
      };

      const scores = await model.calculateESGScore(goodData);

      expect(scores.environmental).toBeGreaterThan(70);
      expect(scores.social).toBeGreaterThan(70);
    });
  });

  describe('Regulatory Requirements', () => {
    test('should return US regulations', () => {
      const regulations = model.getRegulatoryRequirements('US');

      expect(regulations.length).toBeGreaterThan(0);
      
      const epaRegs = regulations.filter(r => r.id.includes('epa'));
      expect(epaRegs.length).toBeGreaterThan(0);
    });

    test('should return EU regulations', () => {
      const regulations = model.getRegulatoryRequirements('EU');

      expect(regulations.length).toBeGreaterThan(0);
      
      const euRegs = regulations.filter(r => r.jurisdiction === 'EU');
      expect(euRegs.length).toBeGreaterThan(0);
    });

    test('should return global regulations', () => {
      const regulations = model.getRegulatoryRequirements('global');

      expect(regulations.length).toBeGreaterThan(0);
    });

    test('should have proper regulation structure', () => {
      const regulations = model.getRegulatoryRequirements('US');

      regulations.forEach(reg => {
        expect(reg.id).toBeDefined();
        expect(reg.name).toBeDefined();
        expect(reg.jurisdiction).toBeDefined();
        expect(Array.isArray(reg.applicableIndustries)).toBe(true);
        expect(reg.effectiveDate).toBeInstanceOf(Date);
        expect(Array.isArray(reg.requirements)).toBe(true);
        expect(reg.penalties).toBeDefined();
        expect(Array.isArray(reg.griAlignment)).toBe(true);
      });
    });
  });

  describe('Benchmarking', () => {
    test('should return industry benchmarks', async () => {
      const benchmarks = await model.getBenchmarks();

      expect(benchmarks.length).toBeGreaterThan(0);

      benchmarks.forEach(benchmark => {
        expect(benchmark.metricId).toBeDefined();
        expect(benchmark.industry).toBe('Oil & Gas');
        expect(benchmark.year).toBeDefined();
        expect(benchmark.percentiles).toBeDefined();
        expect(benchmark.percentiles.p10).toBeLessThan(benchmark.percentiles.p90);
        expect(benchmark.average).toBeGreaterThan(0);
        expect(benchmark.sampleSize).toBeGreaterThan(0);
        expect(Array.isArray(benchmark.leaders)).toBe(true);
      });
    });

    test('should support regional benchmarks', async () => {
      const globalBenchmarks = await model.getBenchmarks('global');
      const naBenchmarks = await model.getBenchmarks('north_america');

      expect(globalBenchmarks.length).toBeGreaterThan(0);
      expect(naBenchmarks.length).toBeGreaterThan(0);
    });
  });

  describe('Peer Comparison', () => {
    test('should compare to peer companies', async () => {
      const orgData = {
        ghg_intensity_upstream: 25.0,
        methane_intensity: 0.2,
        trir: 0.4,
        water_intensity: 1.8
      };

      const peerData = [
        { id: 'peer1', ghg_intensity_upstream: 20.0, methane_intensity: 0.15, trir: 0.3 },
        { id: 'peer2', ghg_intensity_upstream: 30.0, methane_intensity: 0.25, trir: 0.5 },
        { id: 'peer3', ghg_intensity_upstream: 22.0, methane_intensity: 0.18, trir: 0.35 }
      ];

      const comparison = await model.compareToPeers(orgData, peerData);

      expect(comparison.industryAverage).toBeDefined();
      expect(comparison.percentileRank).toBeDefined();
      expect(Array.isArray(comparison.topPerformers)).toBe(true);
      expect(Array.isArray(comparison.improvementOpportunities)).toBe(true);
    });

    test('should handle empty peer data', async () => {
      const orgData = {
        ghg_intensity_upstream: 25.0
      };

      const comparison = await model.compareToPeers(orgData, []);

      expect(comparison).toBeDefined();
      expect(comparison.improvementOpportunities.length).toBeGreaterThan(0);
    });
  });

  describe('Recommendations', () => {
    test('should generate recommendations based on performance', async () => {
      const benchmarks = await model.getBenchmarks();
      const currentPerformance = {
        ghg_intensity_upstream: 40.0, // Above median
        methane_intensity: 0.3, // High
        trir: 1.0 // High
      };

      const recommendations = await model.generateRecommendations(currentPerformance, benchmarks);

      expect(recommendations.length).toBeGreaterThan(0);

      recommendations.forEach(rec => {
        expect(rec.type).toMatch(/compliance|performance|reporting|strategic/);
        expect(rec.priority).toMatch(/critical|high|medium|low/);
        expect(rec.title).toBeDefined();
        expect(rec.description).toBeDefined();
        expect(rec.impact).toBeDefined();
        expect(rec.effort).toMatch(/low|medium|high/);
        expect(Array.isArray(rec.griAlignment)).toBe(true);
      });
    });

    test('should prioritize critical issues', async () => {
      const benchmarks = await model.getBenchmarks();
      const poorPerformance = {
        ghg_intensity_upstream: 60.0,
        methane_intensity: 0.8,
        trir: 2.0,
        tcfd_aligned: false
      };

      const recommendations = await model.generateRecommendations(poorPerformance, benchmarks);

      const criticalRecs = recommendations.filter(r => r.priority === 'critical');
      expect(criticalRecs.length).toBeGreaterThan(0);
    });
  });

  describe('Data Validation', () => {
    test('should validate complete data successfully', async () => {
      const validData = {
        ghg_intensity_upstream: 25.0,
        methane_intensity: 0.15,
        spill_volume: 5,
        trir: 0.3
      };

      const validation = await model.validateData(validData);

      expect(validation.isValid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });

    test('should detect missing required metrics', async () => {
      const incompleteData = {
        ghg_intensity_upstream: 25.0
        // Missing other required metrics
      };

      const validation = await model.validateData(incompleteData);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    test('should detect invalid values', async () => {
      const invalidData = {
        ghg_intensity_upstream: -10.0, // Negative value
        methane_intensity: 150, // > 100%
        spill_volume: 1000,
        trir: 0.3
      };

      const validation = await model.validateData(invalidData);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('GHG intensity cannot be negative');
      expect(validation.errors).toContain('Methane intensity must be between 0 and 100%');
    });

    test('should generate warnings for concerning values', async () => {
      const concerningData = {
        ghg_intensity_upstream: 150.0, // Very high
        methane_intensity: 0.15,
        spill_volume: 0,
        trir: 8.0 // Very high
      };

      const validation = await model.validateData(concerningData);

      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(validation.warnings.some(w => w.includes('GHG intensity'))).toBe(true);
      expect(validation.warnings.some(w => w.includes('TRIR'))).toBe(true);
    });
  });

  describe('Reporting Guidance', () => {
    test('should provide comprehensive reporting guidance', () => {
      const guidance = model.getReportingGuidance();

      expect(guidance).toBeDefined();
      expect(guidance.length).toBeGreaterThan(100);
      expect(guidance).toContain('Oil and Gas');
      expect(guidance).toContain('GRI 11');
      expect(guidance).toContain('TCFD');
      expect(guidance).toContain('methane');
      expect(guidance).toContain('emissions');
    });
  });

  describe('Required Disclosures', () => {
    test('should return complete set of required disclosures', () => {
      const disclosures = model.getRequiredDisclosures();

      expect(disclosures.length).toBeGreaterThan(0);

      // Should include universal disclosures
      const universalDisclosures = disclosures.filter(d => d.code.startsWith('GRI 2'));
      expect(universalDisclosures.length).toBeGreaterThan(0);

      // Should include sector-specific disclosures
      const sectorDisclosures = disclosures.filter(d => d.code.startsWith('GRI 11'));
      expect(sectorDisclosures.length).toBeGreaterThan(0);
    });
  });

  describe('Analysis Integration', () => {
    test('should perform complete analysis', async () => {
      const classification: IndustryClassification = {
        naicsCode: '211110',
        confidence: 0.9
      };

      const organizationData = {
        ghg_intensity_upstream: 25.0,
        methane_intensity: 0.15,
        water_intensity: 1.5,
        spill_volume: 0,
        trir: 0.3,
        process_safety_events: 1
      };

      const analysis = await model.analyze('test-org', organizationData, classification);

      expect(analysis.organizationId).toBe('test-org');
      expect(analysis.industry).toEqual(classification);
      expect(analysis.applicableGRIStandards).toContain(GRISectorStandard.GRI_11_OIL_GAS);
      expect(analysis.materialTopics.length).toBeGreaterThan(0);
      expect(analysis.requiredDisclosures.length).toBeGreaterThan(0);
      expect(analysis.benchmarks.length).toBeGreaterThan(0);
      expect(analysis.regulations.length).toBeGreaterThan(0);
      expect(analysis.recommendations.length).toBeGreaterThan(0);
    });
  });
});