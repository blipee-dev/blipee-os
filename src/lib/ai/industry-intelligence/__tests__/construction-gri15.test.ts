/**
 * Test suite for Construction GRI15 Model
 */

import { ConstructionGRI15Model } from '../models/construction-gri15';
import { IndustryClassification } from '../types';

describe('ConstructionGRI15Model', () => {
  let model: ConstructionGRI15Model;

  beforeEach(() => {
    model = new ConstructionGRI15Model();
  });

  describe('constructor and configuration', () => {
    it('should initialize with correct construction industry configuration', () => {
      expect(model.config.industryName).toBe('Construction');
      expect(model.config.griStandards).toContain('GRI_15_CONSTRUCTION');
      expect(model.config.naicsCodes).toContain('236');
      expect(model.config.naicsCodes).toContain('237');
      expect(model.config.naicsCodes).toContain('238');
      expect(model.config.sicCodes).toContain('15');
      expect(model.config.sicCodes).toContain('16');
      expect(model.config.sicCodes).toContain('17');
    });

    it('should include construction-specific material topics', () => {
      const topics = model.config.materialTopics;
      expect(topics).toContain('project-lifecycle-management');
      expect(topics).toContain('construction-safety');
      expect(topics).toContain('sustainable-materials');
      expect(topics).toContain('building-energy-efficiency');
      expect(topics).toContain('waste-construction-demolition');
      expect(topics).toContain('local-communities');
      expect(topics).toContain('supply-chain-management');
    });

    it('should include relevant construction regulatory frameworks', () => {
      const frameworks = model.config.regulatoryFrameworks;
      expect(frameworks).toContain('OSHA');
      expect(frameworks).toContain('Building-Codes');
      expect(frameworks).toContain('LEED');
      expect(frameworks).toContain('BREEAM');
      expect(frameworks).toContain('Energy-Codes');
    });

    it('should include construction certifications', () => {
      const certifications = model.config.certifications;
      expect(certifications).toContain('LEED');
      expect(certifications).toContain('BREEAM');
      expect(certifications).toContain('Green-Star');
      expect(certifications).toContain('EDGE');
      expect(certifications).toContain('Living-Building');
    });
  });

  describe('isApplicable', () => {
    it('should be applicable to construction organizations', () => {
      const applicable = model.isApplicable({
        industry: IndustryClassification.MANUFACTURING, // Construction would be closest to this
        naicsCode: '236220',
        sicCode: '1522',
        products: ['residential_buildings', 'commercial_construction'],
        geographicScope: ['US', 'Canada']
      });

      expect(applicable).toBe(true);
    });

    it('should not be applicable to non-construction organizations', () => {
      const applicable = model.isApplicable({
        industry: IndustryClassification.TECHNOLOGY,
        naicsCode: '541511',
        sicCode: '7372',
        products: ['software'],
        geographicScope: ['US']
      });

      expect(applicable).toBe(false);
    });

    it('should be applicable based on construction-related SIC codes', () => {
      const applicable = model.isApplicable({
        industry: IndustryClassification.MANUFACTURING,
        sicCode: '1542', // General contractors-nonresidential buildings
        products: ['office_buildings'],
        geographicScope: ['UK']
      });

      expect(applicable).toBe(true);
    });
  });

  describe('calculateESGScore', () => {
    it('should calculate comprehensive ESG score for construction operations', async () => {
      const organizationData = {
        safety: {
          total_recordable_injury_rate: 3.2,
          fatalities: 0,
          safety_training_hours: 15000,
          safety_incidents: 8,
          near_misses: 24
        },
        environmental: {
          construction_waste_diverted: 75,
          renewable_energy_projects: 65,
          water_consumption_per_sqft: 2.1,
          carbon_emissions_per_sqft: 45,
          sustainable_materials_percentage: 60,
          energy_efficient_buildings_percentage: 80
        },
        social: {
          local_workforce_percentage: 70,
          apprenticeship_programs: true,
          community_investment: 1500000,
          diversity_percentage: 35,
          supplier_diversity: 25
        },
        governance: {
          project_transparency: 85,
          ethics_training_completion: 92,
          sustainability_reporting: true,
          board_independence: 70,
          climate_governance: true
        },
        operations: {
          projects_completed_on_time: 88,
          projects_within_budget: 82,
          client_satisfaction: 4.3,
          repeat_business_rate: 65
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

    it('should penalize poor safety performance heavily', async () => {
      const poorSafetyData = {
        safety: {
          total_recordable_injury_rate: 12.5, // Very high for construction
          fatalities: 3, // Unacceptable
          safety_training_hours: 2000, // Insufficient
          safety_violations: 25
        },
        environmental: {
          construction_waste_diverted: 85,
          renewable_energy_projects: 90
        },
        social: {
          local_workforce_percentage: 85
        },
        governance: {
          project_transparency: 80
        }
      };

      const score = await model.calculateESGScore(poorSafetyData);

      expect(score.social).toBeLessThan(40); // Should be heavily penalized
      expect(score.overall).toBeLessThan(55);
    });

    it('should reward sustainable construction practices', async () => {
      const sustainableData = {
        environmental: {
          construction_waste_diverted: 95,
          renewable_energy_projects: 100,
          sustainable_materials_percentage: 90,
          energy_efficient_buildings_percentage: 95,
          carbon_emissions_per_sqft: 25 // Low emissions
        },
        safety: {
          total_recordable_injury_rate: 1.8,
          fatalities: 0,
          safety_training_hours: 20000
        }
      };

      const score = await model.calculateESGScore(sustainableData);

      expect(score.environmental).toBeGreaterThan(80);
      expect(score.overall).toBeGreaterThan(75);
    });
  });

  describe('getMaterialTopics', () => {
    it('should return construction-specific material topics with GRI alignment', () => {
      const topics = model.getMaterialTopics();

      expect(topics.length).toBeGreaterThan(0);
      
      const projectLifecycleTopic = topics.find(t => t.id === 'project-lifecycle-management');
      expect(projectLifecycleTopic).toBeDefined();
      expect(projectLifecycleTopic?.griDisclosures).toContain('GRI 15.25.1');
      
      const constructionSafetyTopic = topics.find(t => t.id === 'construction-safety');
      expect(constructionSafetyTopic).toBeDefined();
      expect(constructionSafetyTopic?.griDisclosures).toContain('GRI 403-9');
      
      const sustainableMaterialsTopic = topics.find(t => t.id === 'sustainable-materials');
      expect(sustainableMaterialsTopic).toBeDefined();
      expect(sustainableMaterialsTopic?.griDisclosures).toContain('GRI 15.26.1');
    });

    it('should include appropriate impact categories for construction', () => {
      const topics = model.getMaterialTopics();
      
      const energyEfficiencyTopic = topics.find(t => t.id === 'building-energy-efficiency');
      expect(energyEfficiencyTopic?.impacts).toContain('environmental');
      
      const communityTopic = topics.find(t => t.id === 'local-communities');
      expect(communityTopic?.impacts).toContain('social');
      expect(communityTopic?.impacts).toContain('economic');
    });
  });

  describe('getBenchmarkData', () => {
    it('should return construction industry benchmarks', async () => {
      const benchmarks = await model.getBenchmarkData('large', 'global');

      expect(benchmarks.length).toBeGreaterThan(0);
      
      const safetyBenchmark = benchmarks.find(b => b.metricId === 'total_recordable_injury_rate');
      expect(safetyBenchmark).toBeDefined();
      expect(safetyBenchmark?.industry25th).toBeDefined();
      expect(safetyBenchmark?.industryMedian).toBeDefined();
      expect(safetyBenchmark?.industry75th).toBeDefined();
      
      const wasteDiversionBenchmark = benchmarks.find(b => b.metricId === 'construction_waste_diverted');
      expect(wasteDiversionBenchmark).toBeDefined();
    });

    it('should include construction-specific metrics', async () => {
      const benchmarks = await model.getBenchmarkData('medium', 'regional');

      const specificMetrics = [
        'project_completion_time',
        'cost_overrun_percentage',
        'sustainable_materials_percentage',
        'energy_efficient_buildings_percentage'
      ];
      const foundMetrics = benchmarks.filter(b => specificMetrics.includes(b.metricId));
      
      expect(foundMetrics.length).toBeGreaterThan(0);
    });
  });

  describe('getComplianceRequirements', () => {
    it('should return construction-specific compliance requirements', async () => {
      const requirements = await model.getComplianceRequirements(['US', 'EU']);

      expect(requirements.length).toBeGreaterThan(0);
      
      const oshaRequirement = requirements.find(r => r.regulation === 'OSHA');
      expect(oshaRequirement).toBeDefined();
      expect(oshaRequirement?.description).toContain('safety');
      
      const buildingCodeRequirement = requirements.find(r => r.regulation === 'Building Codes');
      expect(buildingCodeRequirement).toBeDefined();
    });

    it('should include green building standards', async () => {
      const requirements = await model.getComplianceRequirements(['US', 'UK']);
      
      const leedRequirement = requirements.find(r => r.regulation === 'LEED');
      expect(leedRequirement).toBeDefined();
      
      const breeamRequirement = requirements.find(r => r.regulation === 'BREEAM');
      expect(breeamRequirement).toBeDefined();
    });
  });

  describe('generateRecommendations', () => {
    it('should generate construction-specific recommendations', async () => {
      const organizationData = {
        safety: {
          total_recordable_injury_rate: 6.5, // Above industry average
          safety_training_hours: 8000
        },
        environmental: {
          construction_waste_diverted: 55, // Below best practice
          sustainable_materials_percentage: 35, // Low
          energy_efficient_buildings_percentage: 45
        },
        social: {
          local_workforce_percentage: 50, // Could be improved
          apprenticeship_programs: false
        },
        operations: {
          projects_completed_on_time: 70, // Below expectations
          cost_overrun_percentage: 15 // High
        }
      };

      const recommendations = await model.generateRecommendations(
        'construction-org-123',
        organizationData
      );

      expect(recommendations.length).toBeGreaterThan(0);
      
      // Should recommend safety improvements
      expect(recommendations.some(r => 
        r.topic === 'construction-safety' && r.priority === 'high'
      )).toBe(true);
      
      // Should recommend waste management improvements
      expect(recommendations.some(r => 
        r.topic === 'waste-construction-demolition'
      )).toBe(true);
      
      // Should recommend workforce development
      expect(recommendations.some(r => 
        r.topic === 'local-communities'
      )).toBe(true);
    });

    it('should prioritize critical safety issues', async () => {
      const criticalSafetyData = {
        safety: {
          total_recordable_injury_rate: 15.2, // Extremely high
          fatalities: 2,
          safety_violations: 20
        }
      };

      const recommendations = await model.generateRecommendations(
        'critical-construction-org',
        criticalSafetyData
      );

      const criticalRecommendations = recommendations.filter(r => r.priority === 'critical');
      expect(criticalRecommendations.length).toBeGreaterThan(0);
      expect(criticalRecommendations[0].topic).toBe('construction-safety');
    });

    it('should recommend green building practices for low sustainability scores', async () => {
      const lowSustainabilityData = {
        environmental: {
          construction_waste_diverted: 25,
          sustainable_materials_percentage: 15,
          energy_efficient_buildings_percentage: 20,
          renewable_energy_projects: 10
        }
      };

      const recommendations = await model.generateRecommendations(
        'low-sustainability-org',
        lowSustainabilityData
      );

      expect(recommendations.some(r => r.topic === 'sustainable-materials')).toBe(true);
      expect(recommendations.some(r => r.topic === 'building-energy-efficiency')).toBe(true);
    });
  });

  describe('industry-specific metrics', () => {
    it('should include comprehensive construction metrics', () => {
      const metrics = model.config.specificMetrics;
      
      expect(metrics.some(m => m.id === 'construction_waste_diverted')).toBe(true);
      expect(metrics.some(m => m.id === 'project_completion_time')).toBe(true);
      expect(metrics.some(m => m.id === 'cost_overrun_percentage')).toBe(true);
      expect(metrics.some(m => m.id === 'sustainable_materials_percentage')).toBe(true);
      expect(metrics.some(m => m.id === 'energy_efficient_buildings_percentage')).toBe(true);
      expect(metrics.some(m => m.id === 'safety_incidents_per_project')).toBe(true);
    });

    it('should have appropriate metric categories', () => {
      const metrics = model.config.specificMetrics;
      
      const categories = [...new Set(metrics.map(m => m.category))];
      expect(categories).toContain('operational');
      expect(categories).toContain('environmental');
      expect(categories).toContain('social');
      expect(categories).toContain('governance');
    });

    it('should include GRI 15 specific alignments', () => {
      const metrics = model.config.specificMetrics;
      
      const gri15Metrics = metrics.filter(m => 
        m.griAlignment.some(gri => gri.includes('GRI 15'))
      );
      expect(gri15Metrics.length).toBeGreaterThan(0);
    });
  });

  describe('performance calculations', () => {
    it('should calculate project efficiency scores', async () => {
      const organizationData = {
        operations: {
          projects_completed_on_time: 95,
          projects_within_budget: 90,
          client_satisfaction: 4.8,
          repeat_business_rate: 85,
          quality_defects_per_project: 2
        }
      };

      const score = await model.calculateESGScore(organizationData);
      
      expect(score.governance).toBeGreaterThan(75); // Good operational performance
    });

    it('should calculate environmental impact per square foot', async () => {
      const organizationData = {
        environmental: {
          carbon_emissions_per_sqft: 30,
          water_consumption_per_sqft: 1.8,
          waste_generation_per_sqft: 5.2,
          energy_consumption_per_sqft: 15
        }
      };

      const score = await model.calculateESGScore(organizationData);
      
      expect(score.environmental).toBeGreaterThan(60); // Good environmental efficiency
    });
  });

  describe('error handling', () => {
    it('should handle missing safety data gracefully', async () => {
      const incompleteData = {
        environmental: {
          construction_waste_diverted: 80
        },
        operations: {
          projects_completed_on_time: 85
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

    it('should handle empty organization data', async () => {
      const score = await model.calculateESGScore({});
      
      expect(score.overall).toBeGreaterThan(0);
      expect(score.overall).toBeLessThan(50); // Should be low but not zero
    });
  });

  describe('integration with base model', () => {
    it('should properly inherit from IndustryModel', () => {
      expect(model.config).toBeDefined();
      expect(model.config.industryName).toBe('Construction');
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
      expect(score).toHaveProperty('breakdown');
    });
  });

  describe('certification and standards integration', () => {
    it('should recognize green building certifications', () => {
      const certifications = model.config.certifications;
      
      expect(certifications).toContain('LEED');
      expect(certifications).toContain('BREEAM');
      expect(certifications).toContain('Green-Star');
      expect(certifications).toContain('EDGE');
    });

    it('should align with building energy codes', () => {
      const frameworks = model.config.regulatoryFrameworks;
      
      expect(frameworks).toContain('Energy-Codes');
      expect(frameworks).toContain('Building-Codes');
    });
  });
});