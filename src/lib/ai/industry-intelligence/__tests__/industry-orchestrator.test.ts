/**
 * Tests for IndustryOrchestrator
 * Core component that coordinates industry classification and model routing
 */

import { IndustryOrchestrator } from '../industry-orchestrator';
import { IndustryClassification, GRISectorStandard } from '../types';

// Mock the industry models
jest.mock('../models/oil-gas-gri11', () => ({
  OilGasGRI11Model: jest.fn().mockImplementation(() => ({
    getName: () => 'Oil and Gas',
    getGRIStandards: () => ['GRI 11'],
    isApplicable: jest.fn().mockResolvedValue(true),
    getMaterialTopics: () => [
      {
        id: 'climate',
        name: 'Climate adaptation',
        griStandard: 'GRI 11',
        relevance: 'high',
        impactAreas: ['Environment'],
        metrics: [],
        disclosures: []
      }
    ],
    getRequiredDisclosures: () => [],
    getIndustryMetrics: () => [],
    getRegulatoryRequirements: () => [],
    calculateESGScore: jest.fn().mockResolvedValue({
      overall: 75,
      environmental: 80,
      social: 70,
      governance: 75,
      breakdown: {}
    }),
    getBenchmarks: jest.fn().mockResolvedValue([]),
    compareToPeers: jest.fn().mockResolvedValue({
      industryAverage: {},
      percentileRank: {},
      topPerformers: [],
      improvementOpportunities: []
    }),
    generateRecommendations: jest.fn().mockResolvedValue([]),
    validateData: jest.fn().mockResolvedValue({
      isValid: true,
      errors: [],
      warnings: []
    }),
    getReportingGuidance: () => 'Oil & Gas reporting guidance',
    setContext: jest.fn(),
    analyze: jest.fn().mockResolvedValue({
      organizationId: 'test-org',
      industry: { naicsCode: '211', confidence: 0.9 },
      applicableGRIStandards: ['GRI 11'],
      materialTopics: [],
      requiredDisclosures: [],
      benchmarks: [],
      regulations: [],
      peerComparison: {
        industryAverage: {},
        percentileRank: {},
        topPerformers: [],
        improvementOpportunities: []
      },
      recommendations: []
    })
  }))
}));

jest.mock('../models/coal-gri12', () => ({
  CoalGRI12Model: jest.fn().mockImplementation(() => ({
    getName: () => 'Coal',
    isApplicable: jest.fn().mockResolvedValue(false)
  }))
}));

jest.mock('../models/agriculture-gri13', () => ({
  AgricultureGRI13Model: jest.fn().mockImplementation(() => ({
    getName: () => 'Agriculture',
    isApplicable: jest.fn().mockResolvedValue(false)
  }))
}));

describe('IndustryOrchestrator', () => {
  let orchestrator: IndustryOrchestrator;

  beforeEach(() => {
    orchestrator = new IndustryOrchestrator({
      enableAutoClassification: true,
      enableBenchmarking: true,
      enableMLPredictions: false,
      cacheResults: false // Disable caching for tests
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Industry Classification', () => {
    test('should classify organization by NAICS code', async () => {
      const organizationData = {
        naicsCode: '211110',
        name: 'Test Oil Company'
      };

      const classification = await orchestrator.classifyIndustry(organizationData);

      expect(classification).toEqual({
        naicsCode: '211110',
        confidence: 0.9
      });
    });

    test('should classify organization by SIC code', async () => {
      const organizationData = {
        sicCode: '1311',
        name: 'Test Energy Company'
      };

      const classification = await orchestrator.classifyIndustry(organizationData);

      expect(classification).toEqual({
        sicCode: '1311',
        confidence: 0.85
      });
    });

    test('should classify by company description', async () => {
      const organizationData = {
        description: 'Oil and gas exploration and production company',
        name: 'Energy Corp'
      };

      const classification = await orchestrator.classifyIndustry(organizationData);

      expect(classification.customCode).toContain('oil-gas');
      expect(classification.confidence).toBeGreaterThan(0.6);
    });

    test('should handle unknown industry gracefully', async () => {
      const organizationData = {
        name: 'Unknown Company'
      };

      const classification = await orchestrator.classifyIndustry(organizationData);

      expect(classification.confidence).toBe(0);
    });

    test('should use provided classification if available', async () => {
      const existingClassification: IndustryClassification = {
        naicsCode: '211',
        confidence: 1.0
      };

      const organizationData = {
        industryClassification: existingClassification,
        name: 'Test Company'
      };

      const classification = await orchestrator.classifyIndustry(organizationData);

      expect(classification).toEqual(existingClassification);
    });
  });

  describe('Model Selection', () => {
    test('should select Oil & Gas model for petroleum industry', async () => {
      const classification: IndustryClassification = {
        naicsCode: '211110',
        confidence: 0.9
      };

      const model = await orchestrator.getApplicableModel(classification);

      expect(model).toBeDefined();
      expect(model?.getName()).toBe('Oil and Gas');
    });

    test('should return null if no applicable model found', async () => {
      const classification: IndustryClassification = {
        naicsCode: '999999', // Non-existent industry
        confidence: 0.9
      };

      const model = await orchestrator.getApplicableModel(classification);

      expect(model).toBeNull();
    });
  });

  describe('Organization Analysis', () => {
    test('should perform complete analysis for oil & gas company', async () => {
      const organizationData = {
        naicsCode: '211110',
        name: 'Test Oil Company',
        scope1_emissions: 100000,
        scope2_emissions: 25000,
        production_volume: 1000000
      };

      const analysis = await orchestrator.analyzeOrganization('test-org', organizationData);

      expect(analysis).toBeDefined();
      expect(analysis.organizationId).toBe('test-org');
      expect(analysis.industry.naicsCode).toBe('211110');
      expect(analysis.applicableGRIStandards).toContain('GRI 11');
    });

    test('should return generic analysis when no specific model available', async () => {
      const organizationData = {
        naicsCode: '999999', // Unknown industry
        name: 'Unknown Company'
      };

      const analysis = await orchestrator.analyzeOrganization('test-org', organizationData);

      expect(analysis).toBeDefined();
      expect(analysis.organizationId).toBe('test-org');
      expect(analysis.peerComparison.improvementOpportunities).toContain('Industry-specific model not yet available');
    });

    test('should cache analysis results when enabled', async () => {
      const cachingOrchestrator = new IndustryOrchestrator({
        cacheResults: true
      });

      const organizationData = {
        naicsCode: '211110',
        name: 'Test Oil Company'
      };

      // First call
      const analysis1 = await cachingOrchestrator.analyzeOrganization('test-org', organizationData);
      
      // Second call should return cached result
      const analysis2 = await cachingOrchestrator.analyzeOrganization('test-org', organizationData);

      expect(analysis1).toEqual(analysis2);
    });
  });

  describe('GRI Standards Mapping', () => {
    test('should map to GRI standards based on industry', async () => {
      const classification: IndustryClassification = {
        naicsCode: '211110',
        confidence: 0.9
      };

      const griMapping = await orchestrator.mapToGRIStandards(classification);

      expect(griMapping).toBeDefined();
      expect(griMapping.applicableStandards).toContain(GRISectorStandard.GRI_11_OIL_GAS);
    });
  });

  describe('Recommendations', () => {
    test('should generate industry-specific recommendations', async () => {
      const organizationData = {
        naicsCode: '211110',
        name: 'Test Oil Company',
        ghg_intensity_upstream: 35, // High intensity
        methane_intensity: 0.8 // High methane leakage
      };

      const recommendations = await orchestrator.getRecommendations('test-org', organizationData);

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
    });
  });

  describe('Material Topics', () => {
    test('should get material topics for organization', async () => {
      const organizationData = {
        naicsCode: '211110',
        name: 'Test Oil Company'
      };

      const materialTopics = await orchestrator.getMaterialTopics('test-org', organizationData);

      expect(materialTopics).toBeDefined();
      expect(Array.isArray(materialTopics)).toBe(true);
      expect(materialTopics.length).toBeGreaterThan(0);
    });
  });

  describe('Peer Comparison', () => {
    test('should compare organization to peers', async () => {
      const organizationData = {
        naicsCode: '211110',
        name: 'Test Oil Company',
        ghg_intensity_upstream: 25
      };

      const comparison = await orchestrator.compareToPeers('test-org', organizationData);

      expect(comparison).toBeDefined();
    });

    test('should handle peer comparison with specific peer IDs', async () => {
      const organizationData = {
        naicsCode: '211110',
        name: 'Test Oil Company'
      };

      const peerIds = ['peer1', 'peer2', 'peer3'];

      const comparison = await orchestrator.compareToPeers('test-org', organizationData, peerIds);

      expect(comparison).toBeDefined();
    });
  });

  describe('Regulatory Compliance', () => {
    test('should assess compliance for organization', async () => {
      const organizationData = {
        naicsCode: '211110',
        name: 'Test Oil Company',
        scope1_emissions: 100000
      };

      const compliance = await orchestrator.getComplianceAssessment(
        'test-org',
        organizationData,
        'US'
      );

      expect(compliance).toBeDefined();
    });

    test('should get applicable regulations', async () => {
      const organizationData = {
        naicsCode: '211110',
        name: 'Test Oil Company'
      };

      const regulations = await orchestrator.getApplicableRegulations(organizationData, 'US');

      expect(regulations).toBeDefined();
    });

    test('should get upcoming regulatory changes', async () => {
      const organizationData = {
        naicsCode: '211110',
        name: 'Test Oil Company'
      };

      const changes = await orchestrator.getUpcomingRegulatoryChanges(
        organizationData,
        'EU',
        'next-year'
      );

      expect(changes).toBeDefined();
    });
  });

  describe('Utility Methods', () => {
    test('should get available industries', () => {
      const industries = orchestrator.getAvailableIndustries();

      expect(industries).toBeDefined();
      expect(Array.isArray(industries)).toBe(true);
      expect(industries).toContain('oil-gas');
    });

    test('should register new industry model', () => {
      const mockModel = {
        getName: () => 'Test Industry',
        isApplicable: jest.fn().mockResolvedValue(true)
      } as any;

      orchestrator.registerModel('test-industry', mockModel);

      const industries = orchestrator.getAvailableIndustries();
      expect(industries).toContain('test-industry');
    });

    test('should clear cache', () => {
      expect(() => orchestrator.clearCache()).not.toThrow();
    });

    test('should get cache size', () => {
      const size = orchestrator.getCacheSize();
      expect(typeof size).toBe('number');
      expect(size).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid organization data gracefully', async () => {
      const invalidData = null;

      await expect(
        orchestrator.analyzeOrganization('test-org', invalidData as any)
      ).resolves.toBeDefined();
    });

    test('should handle network errors in analysis', async () => {
      // Mock a model that throws an error
      const mockFailingModel = {
        isApplicable: jest.fn().mockResolvedValue(true),
        analyze: jest.fn().mockRejectedValue(new Error('Network error'))
      } as any;

      orchestrator.registerModel('failing-model', mockFailingModel);

      const organizationData = {
        customCode: 'failing-industry',
        name: 'Test Company'
      };

      // Should not throw, but handle gracefully
      await expect(
        orchestrator.analyzeOrganization('test-org', organizationData)
      ).resolves.toBeDefined();
    });
  });

  describe('Configuration', () => {
    test('should respect configuration settings', () => {
      const config = {
        enableAutoClassification: false,
        enableBenchmarking: false,
        enableMLPredictions: true,
        cacheResults: false
      };

      const configuredOrchestrator = new IndustryOrchestrator(config);

      expect(configuredOrchestrator).toBeDefined();
    });
  });
});