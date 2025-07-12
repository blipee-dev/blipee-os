/**
 * Tests for AgricultureGRI13Model
 * Validates agriculture, aquaculture and fishing industry-specific functionality
 */

import { AgricultureGRI13Model } from '../models/agriculture-gri13';
import { IndustryClassification, GRISectorStandard } from '../types';

describe('AgricultureGRI13Model', () => {
  let model: AgricultureGRI13Model;

  beforeEach(() => {
    model = new AgricultureGRI13Model();
  });

  describe('Model Configuration', () => {
    test('should have correct industry name', () => {
      expect(model.getName()).toBe('Agriculture, Aquaculture and Fishing');
    });

    test('should have GRI 13 standard', () => {
      const standards = model.getGRIStandards();
      expect(standards).toContain(GRISectorStandard.GRI_13_AGRICULTURE);
    });

    test('should have agriculture NAICS codes', () => {
      const config = (model as any).config;
      expect(config.naicsCodes).toContain('111');
      expect(config.naicsCodes).toContain('112');
      expect(config.naicsCodes).toContain('114');
    });

    test('should have agriculture SIC codes', () => {
      const config = (model as any).config;
      expect(config.sicCodes).toContain('01');
      expect(config.sicCodes).toContain('02');
      expect(config.sicCodes).toContain('09');
    });
  });

  describe('Applicability Tests', () => {
    test('should be applicable to crop farming NAICS codes', async () => {
      const classification: IndustryClassification = {
        naicsCode: '111110',
        confidence: 0.9
      };

      const isApplicable = await model.isApplicable(classification);
      expect(isApplicable).toBe(true);
    });

    test('should be applicable to livestock NAICS codes', async () => {
      const classification: IndustryClassification = {
        naicsCode: '112111',
        confidence: 0.9
      };

      const isApplicable = await model.isApplicable(classification);
      expect(isApplicable).toBe(true);
    });

    test('should be applicable to aquaculture NAICS codes', async () => {
      const classification: IndustryClassification = {
        naicsCode: '112511',
        confidence: 0.9
      };

      const isApplicable = await model.isApplicable(classification);
      expect(isApplicable).toBe(true);
    });

    test('should be applicable to fishing NAICS codes', async () => {
      const classification: IndustryClassification = {
        naicsCode: '114111',
        confidence: 0.9
      };

      const isApplicable = await model.isApplicable(classification);
      expect(isApplicable).toBe(true);
    });

    test('should be applicable to agriculture custom codes', async () => {
      const classification: IndustryClassification = {
        customCode: 'sustainable-farming-company',
        confidence: 0.8
      };

      const isApplicable = await model.isApplicable(classification);
      expect(isApplicable).toBe(true);
    });

    test('should not be applicable to non-agriculture industries', async () => {
      const classification: IndustryClassification = {
        naicsCode: '541511', // Software development
        confidence: 0.9
      };

      const isApplicable = await model.isApplicable(classification);
      expect(isApplicable).toBe(false);
    });
  });

  describe('Material Topics', () => {
    test('should return agriculture specific material topics', () => {
      const topics = model.getMaterialTopics();

      expect(topics.length).toBeGreaterThan(0);
      
      // Check for key agriculture topics
      const soilTopics = topics.filter(t => t.name.toLowerCase().includes('soil'));
      expect(soilTopics.length).toBeGreaterThan(0);

      const foodTopics = topics.filter(t => t.name.toLowerCase().includes('food'));
      expect(foodTopics.length).toBeGreaterThan(0);

      const biodiversityTopics = topics.filter(t => t.name.toLowerCase().includes('biodiversity'));
      expect(biodiversityTopics.length).toBeGreaterThan(0);

      const animalTopics = topics.filter(t => t.name.toLowerCase().includes('animal'));
      expect(animalTopics.length).toBeGreaterThan(0);
    });

    test('should have GRI 13 aligned topics', () => {
      const topics = model.getMaterialTopics();

      topics.forEach(topic => {
        expect(topic.griStandard).toContain('GRI 13');
        expect(topic.relevance).toMatch(/high|medium|low/);
        expect(Array.isArray(topic.impactAreas)).toBe(true);
        expect(Array.isArray(topic.metrics)).toBe(true);
        expect(Array.isArray(topic.disclosures)).toBe(true);
      });
    });
  });

  describe('Industry Metrics', () => {
    test('should return agriculture specific metrics', () => {
      const metrics = model.getIndustryMetrics();

      expect(metrics.length).toBeGreaterThan(0);

      // Check for key agriculture metrics
      const yieldMetrics = metrics.filter(m => m.id.includes('yield'));
      expect(yieldMetrics.length).toBeGreaterThan(0);

      const waterMetrics = metrics.filter(m => m.id.includes('water'));
      expect(waterMetrics.length).toBeGreaterThan(0);

      const pesticideMetrics = metrics.filter(m => m.id.includes('pesticide'));
      expect(pesticideMetrics.length).toBeGreaterThan(0);

      const fertiliserMetrics = metrics.filter(m => m.id.includes('fertiliser'));
      expect(fertiliserMetrics.length).toBeGreaterThan(0);
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
        crop_yield_productivity: 85.0,
        water_intensity: 1200.0,
        pesticide_intensity: 2.5,
        fertiliser_intensity: 150.0,
        soil_health_index: 75.0,
        biodiversity_impact: 0.8,
        food_safety_incidents: 1,
        animal_welfare_score: 80.0,
        worker_safety_rate: 95.0,
        local_procurement: 60.0,
        certification_coverage: 70.0,
        traceability_score: 0.8
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
        crop_yield_productivity: 70.0
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
        crop_yield_productivity: 30.0, // Very low
        water_intensity: 5000.0, // Very high water use
        pesticide_intensity: 15.0, // Very high pesticide use
        soil_health_index: 20.0, // Poor soil health
        food_safety_incidents: 10, // Many incidents
        animal_welfare_score: 20.0 // Poor animal welfare
      };

      const scores = await model.calculateESGScore(poorData);

      expect(scores.environmental).toBeLessThan(40);
      expect(scores.social).toBeLessThan(40);
    });

    test('should reward good performance', async () => {
      const goodData = {
        crop_yield_productivity: 95.0, // High productivity
        water_intensity: 500.0, // Low water use
        pesticide_intensity: 0.5, // Low pesticide use
        fertiliser_intensity: 50.0, // Low fertiliser use
        soil_health_index: 90.0, // Excellent soil health
        biodiversity_impact: 0.2, // Low impact
        food_safety_incidents: 0, // No incidents
        animal_welfare_score: 95.0, // Excellent welfare
        certification_coverage: 95.0 // High certification
      };

      const scores = await model.calculateESGScore(goodData);

      expect(scores.environmental).toBeGreaterThan(75);
      expect(scores.social).toBeGreaterThan(75);
    });
  });

  describe('Regulatory Requirements', () => {
    test('should return US regulations', () => {
      const regulations = model.getRegulatoryRequirements('US');

      expect(regulations.length).toBeGreaterThan(0);
      
      const fdaRegs = regulations.filter(r => r.id.includes('fda'));
      expect(fdaRegs.length).toBeGreaterThan(0);

      const usdaRegs = regulations.filter(r => r.id.includes('usda'));
      expect(usdaRegs.length).toBeGreaterThan(0);
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
        expect(benchmark.industry).toBe('Agriculture, Aquaculture and Fishing');
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
        crop_yield_productivity: 80.0,
        water_intensity: 1500.0,
        pesticide_intensity: 3.0,
        soil_health_index: 70.0
      };

      const peerData = [
        { id: 'peer1', crop_yield_productivity: 85.0, water_intensity: 1200.0, pesticide_intensity: 2.0 },
        { id: 'peer2', crop_yield_productivity: 75.0, water_intensity: 1800.0, pesticide_intensity: 4.0 },
        { id: 'peer3', crop_yield_productivity: 90.0, water_intensity: 1000.0, pesticide_intensity: 1.5 }
      ];

      const comparison = await model.compareToPeers(orgData, peerData);

      expect(comparison.industryAverage).toBeDefined();
      expect(comparison.percentileRank).toBeDefined();
      expect(Array.isArray(comparison.topPerformers)).toBe(true);
      expect(Array.isArray(comparison.improvementOpportunities)).toBe(true);
    });

    test('should handle empty peer data', async () => {
      const orgData = {
        crop_yield_productivity: 80.0
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
        crop_yield_productivity: 60.0, // Below median
        water_intensity: 3000.0, // High water use
        pesticide_intensity: 8.0, // High pesticide use
        soil_health_index: 40.0 // Poor soil health
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
        water_intensity: 5000.0,
        pesticide_intensity: 20.0,
        food_safety_incidents: 15,
        soil_health_index: 15.0
      };

      const recommendations = await model.generateRecommendations(poorPerformance, benchmarks);

      const criticalRecs = recommendations.filter(r => r.priority === 'critical');
      expect(criticalRecs.length).toBeGreaterThan(0);
    });
  });

  describe('Data Validation', () => {
    test('should validate complete data successfully', async () => {
      const validData = {
        crop_yield_productivity: 80.0,
        water_intensity: 1200.0,
        pesticide_intensity: 2.5,
        soil_health_index: 75.0
      };

      const validation = await model.validateData(validData);

      expect(validation.isValid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });

    test('should detect missing required metrics', async () => {
      const incompleteData = {
        crop_yield_productivity: 80.0
        // Missing other required metrics
      };

      const validation = await model.validateData(incompleteData);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    test('should detect invalid values', async () => {
      const invalidData = {
        crop_yield_productivity: -10.0, // Negative value
        water_intensity: -500.0, // Negative value
        soil_health_index: 150.0, // > 100
        certification_coverage: 150.0 // > 100%
      };

      const validation = await model.validateData(invalidData);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Crop yield productivity cannot be negative');
      expect(validation.errors).toContain('Water intensity cannot be negative');
      expect(validation.errors).toContain('Soil health index cannot exceed 100');
      expect(validation.errors).toContain('Certification coverage cannot exceed 100%');
    });

    test('should generate warnings for concerning values', async () => {
      const concerningData = {
        crop_yield_productivity: 25.0, // Very low
        water_intensity: 8000.0, // Very high
        pesticide_intensity: 25.0, // Very high
        food_safety_incidents: 20 // Very high
      };

      const validation = await model.validateData(concerningData);

      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(validation.warnings.some(w => w.includes('crop yield'))).toBe(true);
      expect(validation.warnings.some(w => w.includes('water intensity'))).toBe(true);
    });
  });

  describe('Reporting Guidance', () => {
    test('should provide comprehensive reporting guidance', () => {
      const guidance = model.getReportingGuidance();

      expect(guidance).toBeDefined();
      expect(guidance.length).toBeGreaterThan(100);
      expect(guidance).toContain('Agriculture');
      expect(guidance).toContain('GRI 13');
      expect(guidance).toContain('food safety');
      expect(guidance).toContain('animal welfare');
      expect(guidance).toContain('soil health');
      expect(guidance).toContain('biodiversity');
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
      const sectorDisclosures = disclosures.filter(d => d.code.startsWith('GRI 13'));
      expect(sectorDisclosures.length).toBeGreaterThan(0);
    });
  });

  describe('Analysis Integration', () => {
    test('should perform complete analysis', async () => {
      const classification: IndustryClassification = {
        naicsCode: '111110',
        confidence: 0.9
      };

      const organizationData = {
        crop_yield_productivity: 80.0,
        water_intensity: 1200.0,
        pesticide_intensity: 2.5,
        soil_health_index: 75.0,
        food_safety_incidents: 1,
        animal_welfare_score: 80.0
      };

      const analysis = await model.analyze('test-org', organizationData, classification);

      expect(analysis.organizationId).toBe('test-org');
      expect(analysis.industry).toEqual(classification);
      expect(analysis.applicableGRIStandards).toContain(GRISectorStandard.GRI_13_AGRICULTURE);
      expect(analysis.materialTopics.length).toBeGreaterThan(0);
      expect(analysis.requiredDisclosures.length).toBeGreaterThan(0);
      expect(analysis.benchmarks.length).toBeGreaterThan(0);
      expect(analysis.regulations.length).toBeGreaterThan(0);
      expect(analysis.recommendations.length).toBeGreaterThan(0);
    });
  });
});