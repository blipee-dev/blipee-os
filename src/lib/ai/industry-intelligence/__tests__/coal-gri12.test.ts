/**
 * Tests for CoalGRI12Model
 * Validates coal industry-specific functionality
 */

import { CoalGRI12Model } from '../models/coal-gri12';
import { IndustryClassification, GRISectorStandard } from '../types';

describe('CoalGRI12Model', () => {
  let model: CoalGRI12Model;

  beforeEach(() => {
    model = new CoalGRI12Model();
  });

  describe('Model Configuration', () => {
    test('should have correct industry name', () => {
      expect(model.getName()).toBe('Coal');
    });

    test('should have GRI 12 standard', () => {
      const standards = model.getGRIStandards();
      expect(standards).toContain(GRISectorStandard.GRI_12_COAL);
    });

    test('should have coal NAICS codes', () => {
      const config = (model as any).config;
      expect(config.naicsCodes).toContain('212111');
      expect(config.naicsCodes).toContain('212112');
      expect(config.naicsCodes).toContain('213113');
    });

    test('should have coal SIC codes', () => {
      const config = (model as any).config;
      expect(config.sicCodes).toContain('1221');
      expect(config.sicCodes).toContain('1222');
    });
  });

  describe('Applicability Tests', () => {
    test('should be applicable to coal mining NAICS codes', async () => {
      const classification: IndustryClassification = {
        naicsCode: '212111',
        confidence: 0.9
      };

      const isApplicable = await model.isApplicable(classification);
      expect(isApplicable).toBe(true);
    });

    test('should be applicable to coal mining SIC codes', async () => {
      const classification: IndustryClassification = {
        sicCode: '1221',
        confidence: 0.9
      };

      const isApplicable = await model.isApplicable(classification);
      expect(isApplicable).toBe(true);
    });

    test('should be applicable to coal custom codes', async () => {
      const classification: IndustryClassification = {
        customCode: 'coal-mining-company',
        confidence: 0.8
      };

      const isApplicable = await model.isApplicable(classification);
      expect(isApplicable).toBe(true);
    });

    test('should not be applicable to non-coal industries', async () => {
      const classification: IndustryClassification = {
        naicsCode: '541511', // Software development
        confidence: 0.9
      };

      const isApplicable = await model.isApplicable(classification);
      expect(isApplicable).toBe(false);
    });
  });

  describe('Material Topics', () => {
    test('should return coal specific material topics', () => {
      const topics = model.getMaterialTopics();

      expect(topics.length).toBeGreaterThan(0);
      
      // Check for key coal topics
      const transitionTopics = topics.filter(t => t.name.toLowerCase().includes('transition'));
      expect(transitionTopics.length).toBeGreaterThan(0);

      const safetyTopics = topics.filter(t => t.name.toLowerCase().includes('safety'));
      expect(safetyTopics.length).toBeGreaterThan(0);

      const rehabilitationTopics = topics.filter(t => t.name.toLowerCase().includes('rehabilitation'));
      expect(rehabilitationTopics.length).toBeGreaterThan(0);
    });

    test('should have GRI 12 aligned topics', () => {
      const topics = model.getMaterialTopics();

      topics.forEach(topic => {
        expect(topic.griStandard).toContain('GRI 12');
        expect(topic.relevance).toMatch(/high|medium|low/);
        expect(Array.isArray(topic.impactAreas)).toBe(true);
        expect(Array.isArray(topic.metrics)).toBe(true);
        expect(Array.isArray(topic.disclosures)).toBe(true);
      });
    });
  });

  describe('Industry Metrics', () => {
    test('should return coal specific metrics', () => {
      const metrics = model.getIndustryMetrics();

      expect(metrics.length).toBeGreaterThan(0);

      // Check for key coal metrics
      const safetyMetrics = metrics.filter(m => m.id.includes('safety') || m.id.includes('fatality'));
      expect(safetyMetrics.length).toBeGreaterThan(0);

      const productionMetrics = metrics.filter(m => m.id.includes('production'));
      expect(productionMetrics.length).toBeGreaterThan(0);

      const rehabilitationMetrics = metrics.filter(m => m.id.includes('rehabilitation'));
      expect(rehabilitationMetrics.length).toBeGreaterThan(0);
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
        ghg_intensity: 120.0,
        water_intensity: 2.5,
        fatality_rate: 0.05,
        ltir: 1.2,
        mine_subsidence: 10,
        rehabilitation_progress: 75,
        community_investment: 2.5,
        just_transition_programs: 3,
        transparency_score: 0.7
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
        ghg_intensity: 150.0
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
        ghg_intensity: 200.0, // Very high
        fatality_rate: 0.5, // Very high
        ltir: 15.0, // Very high
        mine_subsidence: 90, // High subsidence
        rehabilitation_progress: 10 // Low progress
      };

      const scores = await model.calculateESGScore(poorData);

      expect(scores.environmental).toBeLessThan(40);
      expect(scores.social).toBeLessThan(40);
    });

    test('should reward good performance', async () => {
      const goodData = {
        ghg_intensity: 50.0, // Low
        water_intensity: 0.5, // Low
        fatality_rate: 0.0, // Zero fatalities
        ltir: 0.5, // Low injury rate
        mine_subsidence: 0, // No subsidence
        rehabilitation_progress: 95, // High progress
        community_investment: 5.0, // High investment
        just_transition_programs: 5 // Many programs
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
      
      const mshaRegs = regulations.filter(r => r.id.includes('msha'));
      expect(mshaRegs.length).toBeGreaterThan(0);
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
        expect(benchmark.industry).toBe('Coal');
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
        ghg_intensity: 120.0,
        fatality_rate: 0.1,
        ltir: 2.0,
        rehabilitation_progress: 60
      };

      const peerData = [
        { id: 'peer1', ghg_intensity: 100.0, fatality_rate: 0.05, ltir: 1.5 },
        { id: 'peer2', ghg_intensity: 140.0, fatality_rate: 0.15, ltir: 2.5 },
        { id: 'peer3', ghg_intensity: 110.0, fatality_rate: 0.08, ltir: 1.8 }
      ];

      const comparison = await model.compareToPeers(orgData, peerData);

      expect(comparison.industryAverage).toBeDefined();
      expect(comparison.percentileRank).toBeDefined();
      expect(Array.isArray(comparison.topPerformers)).toBe(true);
      expect(Array.isArray(comparison.improvementOpportunities)).toBe(true);
    });

    test('should handle empty peer data', async () => {
      const orgData = {
        ghg_intensity: 120.0
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
        ghg_intensity: 180.0, // Above median
        fatality_rate: 0.2, // High
        rehabilitation_progress: 30 // Low
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

    test('should prioritize safety issues', async () => {
      const benchmarks = await model.getBenchmarks();
      const poorSafety = {
        fatality_rate: 0.5,
        ltir: 20.0,
        mine_subsidence: 80,
        rehabilitation_progress: 5
      };

      const recommendations = await model.generateRecommendations(poorSafety, benchmarks);

      const criticalRecs = recommendations.filter(r => r.priority === 'critical');
      expect(criticalRecs.length).toBeGreaterThan(0);
    });
  });

  describe('Data Validation', () => {
    test('should validate complete data successfully', async () => {
      const validData = {
        ghg_intensity: 120.0,
        fatality_rate: 0.05,
        ltir: 1.5,
        rehabilitation_progress: 70
      };

      const validation = await model.validateData(validData);

      expect(validation.isValid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });

    test('should detect missing required metrics', async () => {
      const incompleteData = {
        ghg_intensity: 120.0
        // Missing other required metrics
      };

      const validation = await model.validateData(incompleteData);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    test('should detect invalid values', async () => {
      const invalidData = {
        ghg_intensity: -50.0, // Negative value
        fatality_rate: -0.1, // Negative rate
        rehabilitation_progress: 150 // > 100%
      };

      const validation = await model.validateData(invalidData);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('GHG intensity cannot be negative');
      expect(validation.errors).toContain('Fatality rate cannot be negative');
      expect(validation.errors).toContain('Rehabilitation progress cannot exceed 100%');
    });

    test('should generate warnings for concerning values', async () => {
      const concerningData = {
        ghg_intensity: 250.0, // Very high
        fatality_rate: 0.3, // Very high
        ltir: 25.0, // Very high
        mine_subsidence: 95 // Very high
      };

      const validation = await model.validateData(concerningData);

      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(validation.warnings.some(w => w.includes('GHG intensity'))).toBe(true);
      expect(validation.warnings.some(w => w.includes('fatality rate'))).toBe(true);
    });
  });

  describe('Reporting Guidance', () => {
    test('should provide comprehensive reporting guidance', () => {
      const guidance = model.getReportingGuidance();

      expect(guidance).toBeDefined();
      expect(guidance.length).toBeGreaterThan(100);
      expect(guidance).toContain('Coal');
      expect(guidance).toContain('GRI 12');
      expect(guidance).toContain('safety');
      expect(guidance).toContain('rehabilitation');
      expect(guidance).toContain('just transition');
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
      const sectorDisclosures = disclosures.filter(d => d.code.startsWith('GRI 12'));
      expect(sectorDisclosures.length).toBeGreaterThan(0);
    });
  });

  describe('Analysis Integration', () => {
    test('should perform complete analysis', async () => {
      const classification: IndustryClassification = {
        naicsCode: '212111',
        confidence: 0.9
      };

      const organizationData = {
        ghg_intensity: 150.0,
        fatality_rate: 0.1,
        ltir: 2.0,
        rehabilitation_progress: 60,
        community_investment: 2.0
      };

      const analysis = await model.analyze('test-org', organizationData, classification);

      expect(analysis.organizationId).toBe('test-org');
      expect(analysis.industry).toEqual(classification);
      expect(analysis.applicableGRIStandards).toContain(GRISectorStandard.GRI_12_COAL);
      expect(analysis.materialTopics.length).toBeGreaterThan(0);
      expect(analysis.requiredDisclosures.length).toBeGreaterThan(0);
      expect(analysis.benchmarks.length).toBeGreaterThan(0);
      expect(analysis.regulations.length).toBeGreaterThan(0);
      expect(analysis.recommendations.length).toBeGreaterThan(0);
    });
  });
});