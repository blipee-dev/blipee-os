/**
 * Test suite for Mining GRI14 Model
 */

import { MiningGRI14Model } from '../models/mining-gri14';
import { IndustryClassification } from '../types';

describe('MiningGRI14Model', () => {
  let model: MiningGRI14Model;

  beforeEach(() => {
    model = new MiningGRI14Model();
  });

  describe('constructor and configuration', () => {
    it('should initialize with correct mining industry configuration', () => {
      expect(model.config.industryName).toBe('Mining');
      expect(model.config.griStandards).toContain('GRI_14_MINING');
      expect(model.config.naicsCodes).toContain('212');
      expect(model.config.sicCodes).toContain('10');
    });

    it('should include mining-specific material topics', () => {
      const topics = model.config.materialTopics;
      expect(topics).toContain('mine-closure');
      expect(topics).toContain('waste-tailings');
      expect(topics).toContain('water-stewardship');
      expect(topics).toContain('mining-safety');
      expect(topics).toContain('artisanal-small-scale-mining');
      expect(topics).toContain('resettlement');
      expect(topics).toContain('land-rights');
    });

    it('should include relevant regulatory frameworks', () => {
      const frameworks = model.config.regulatoryFrameworks;
      expect(frameworks).toContain('MSHA');
      expect(frameworks).toContain('SMCRA');
      expect(frameworks).toContain('RCRA');
      expect(frameworks).toContain('CWA');
    });
  });

  describe('isApplicable', () => {
    it('should be applicable to mining organizations', () => {
      const applicable = model.isApplicable({
        industry: IndustryClassification.OIL_AND_GAS, // Mining would be closest to this
        naicsCode: '212111',
        sicCode: '1011',
        products: ['coal', 'metals'],
        geographicScope: ['US', 'Australia']
      });

      expect(applicable).toBe(true);
    });

    it('should not be applicable to non-mining organizations', () => {
      const applicable = model.isApplicable({
        industry: IndustryClassification.TECHNOLOGY,
        naicsCode: '541511',
        sicCode: '7372',
        products: ['software'],
        geographicScope: ['US']
      });

      expect(applicable).toBe(false);
    });

    it('should be applicable based on SIC codes', () => {
      const applicable = model.isApplicable({
        industry: IndustryClassification.MANUFACTURING,
        sicCode: '1041', // Gold ores
        products: ['gold'],
        geographicScope: ['Canada']
      });

      expect(applicable).toBe(true);
    });
  });

  describe('calculateESGScore', () => {
    it('should calculate comprehensive ESG score for mining operations', async () => {
      const organizationData = {
        emissions: {
          scope1: 85000,
          scope2: 45000,
          scope3: 125000
        },
        safety: {
          total_recordable_injury_rate: 2.1,
          fatalities: 0,
          near_misses: 45,
          safety_training_hours: 12000
        },
        environmental: {
          water_consumption: 15000000,
          water_recycling_rate: 65,
          waste_generated: 2500000,
          waste_diverted_from_landfill: 78,
          land_disturbed: 1200,
          land_rehabilitated: 340
        },
        social: {
          local_employment_percentage: 85,
          community_investment: 2500000,
          grievances_received: 12,
          grievances_resolved: 10
        },
        governance: {
          board_independence: 75,
          environmental_committees: true,
          sustainability_reporting: true,
          ethics_training_completion: 95
        }
      };

      const score = await model.calculateESGScore(organizationData);

      expect(score.overall).toBeGreaterThan(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.environmental).toBeDefined();
      expect(score.social).toBeDefined();
      expect(score.governance).toBeDefined();
      expect(score.breakdown.length).toBeGreaterThan(0);
    });

    it('should penalize poor safety performance', async () => {
      const poorSafetyData = {
        safety: {
          total_recordable_injury_rate: 8.5, // Very high
          fatalities: 2, // Unacceptable
          safety_training_hours: 500 // Insufficient
        },
        environmental: {
          water_recycling_rate: 80,
          waste_diverted_from_landfill: 85
        },
        social: {
          local_employment_percentage: 90
        },
        governance: {
          board_independence: 80
        }
      };

      const score = await model.calculateESGScore(poorSafetyData);

      expect(score.social).toBeLessThan(50); // Should be heavily penalized
      expect(score.overall).toBeLessThan(60);
    });
  });

  describe('getMaterialTopics', () => {
    it('should return mining-specific material topics with GRI alignment', () => {
      const topics = model.getMaterialTopics();

      expect(topics.length).toBeGreaterThan(0);
      
      const mineClosureTopic = topics.find(t => t.id === 'mine-closure');
      expect(mineClosureTopic).toBeDefined();
      expect(mineClosureTopic?.griDisclosures).toContain('GRI 14.22.1');
      
      const wasteManagementTopic = topics.find(t => t.id === 'waste-tailings');
      expect(wasteManagementTopic).toBeDefined();
      expect(wasteManagementTopic?.griDisclosures).toContain('GRI 14.23.1');
    });

    it('should include appropriate impact categories', () => {
      const topics = model.getMaterialTopics();
      
      const waterTopic = topics.find(t => t.id === 'water-stewardship');
      expect(waterTopic?.impacts).toContain('environmental');
      expect(waterTopic?.impacts).toContain('social');
      
      const safetyTopic = topics.find(t => t.id === 'mining-safety');
      expect(safetyTopic?.impacts).toContain('social');
    });
  });

  describe('getBenchmarkData', () => {
    it('should return mining industry benchmarks', async () => {
      const benchmarks = await model.getBenchmarkData('large', 'global');

      expect(benchmarks.length).toBeGreaterThan(0);
      
      const safetyBenchmark = benchmarks.find(b => b.metricId === 'total_recordable_injury_rate');
      expect(safetyBenchmark).toBeDefined();
      expect(safetyBenchmark?.industry25th).toBeDefined();
      expect(safetyBenchmark?.industryMedian).toBeDefined();
      expect(safetyBenchmark?.industry75th).toBeDefined();
    });

    it('should include mining-specific metrics', async () => {
      const benchmarks = await model.getBenchmarkData('medium', 'regional');

      const specificMetrics = ['ore_grade', 'recovery_rate', 'mine_life', 'stripping_ratio'];
      const foundMetrics = benchmarks.filter(b => specificMetrics.includes(b.metricId));
      
      expect(foundMetrics.length).toBeGreaterThan(0);
    });
  });

  describe('getComplianceRequirements', () => {
    it('should return mining-specific compliance requirements', async () => {
      const requirements = await model.getComplianceRequirements(['US', 'Australia']);

      expect(requirements.length).toBeGreaterThan(0);
      
      const mshaRequirement = requirements.find(r => r.regulation === 'MSHA');
      expect(mshaRequirement).toBeDefined();
      expect(mshaRequirement?.description).toContain('safety');
      
      const smcraRequirement = requirements.find(r => r.regulation === 'SMCRA');
      expect(smcraRequirement).toBeDefined();
      expect(smcraRequirement?.description).toContain('reclamation');
    });

    it('should include jurisdiction-specific requirements', async () => {
      const australiaRequirements = await model.getComplianceRequirements(['Australia']);
      
      expect(australiaRequirements.some(r => r.jurisdiction === 'Australia')).toBe(true);
    });
  });

  describe('generateRecommendations', () => {
    it('should generate mining-specific recommendations', async () => {
      const organizationData = {
        safety: {
          total_recordable_injury_rate: 4.2, // Above industry average
          safety_training_hours: 8000
        },
        environmental: {
          water_recycling_rate: 45, // Below best practice
          land_rehabilitation_percentage: 25 // Low
        },
        social: {
          local_employment_percentage: 65, // Could be improved
          community_investment: 1000000
        }
      };

      const recommendations = await model.generateRecommendations(
        'mining-org-123',
        organizationData
      );

      expect(recommendations.length).toBeGreaterThan(0);
      
      // Should recommend safety improvements
      expect(recommendations.some(r => 
        r.topic === 'mining-safety' && r.priority === 'high'
      )).toBe(true);
      
      // Should recommend environmental improvements
      expect(recommendations.some(r => 
        r.topic === 'water-stewardship'
      )).toBe(true);
    });

    it('should prioritize critical safety issues', async () => {
      const criticalSafetyData = {
        safety: {
          total_recordable_injury_rate: 9.5,
          fatalities: 1,
          safety_violations: 15
        }
      };

      const recommendations = await model.generateRecommendations(
        'critical-mining-org',
        criticalSafetyData
      );

      const criticalRecommendations = recommendations.filter(r => r.priority === 'critical');
      expect(criticalRecommendations.length).toBeGreaterThan(0);
      expect(criticalRecommendations[0].topic).toBe('mining-safety');
    });
  });

  describe('industry-specific metrics', () => {
    it('should include comprehensive mining metrics', () => {
      const metrics = model.config.specificMetrics;
      
      expect(metrics.some(m => m.id === 'ore_production')).toBe(true);
      expect(metrics.some(m => m.id === 'stripping_ratio')).toBe(true);
      expect(metrics.some(m => m.id === 'recovery_rate')).toBe(true);
      expect(metrics.some(m => m.id === 'mine_water_consumption')).toBe(true);
      expect(metrics.some(m => m.id === 'tailings_produced')).toBe(true);
    });

    it('should have appropriate metric categories', () => {
      const metrics = model.config.specificMetrics;
      
      const categories = [...new Set(metrics.map(m => m.category))];
      expect(categories).toContain('operational');
      expect(categories).toContain('environmental');
      expect(categories).toContain('social');
    });
  });

  describe('error handling', () => {
    it('should handle missing safety data gracefully', async () => {
      const incompleteData = {
        environmental: {
          water_consumption: 10000000
        }
      };

      const score = await model.calculateESGScore(incompleteData);
      
      expect(score.overall).toBeGreaterThan(0);
      expect(score.social).toBeLessThan(100); // Should be lower due to missing safety data
    });

    it('should handle invalid region for benchmarks', async () => {
      const benchmarks = await model.getBenchmarkData('large', 'invalid_region');
      
      expect(Array.isArray(benchmarks)).toBe(true);
      expect(benchmarks.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('integration with base model', () => {
    it('should properly inherit from IndustryModel', () => {
      expect(model.config).toBeDefined();
      expect(model.config.industryName).toBe('Mining');
      expect(typeof model.isApplicable).toBe('function');
      expect(typeof model.calculateESGScore).toBe('function');
    });

    it('should override base methods appropriately', async () => {
      const score = await model.calculateESGScore({});
      expect(typeof score).toBe('object');
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('environmental');
      expect(score).toHaveProperty('social');
      expect(score).toHaveProperty('governance');
    });
  });
});