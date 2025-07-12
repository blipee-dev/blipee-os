/**
 * End-to-End Integration Tests for Industry Intelligence
 * Tests the complete workflow from classification to recommendations
 */

import { IndustryOrchestrator } from '../industry-orchestrator';
import { GRIStandardsMapper } from '../gri-standards-mapper';
import { RegulatoryMapper } from '../regulatory-mapper';
import { BenchmarkEngine } from '../benchmark-engine';
import { AIIntegration } from '../ai-integration';
import { IndustryClassification, GRISectorStandard } from '../types';

describe('Industry Intelligence Integration', () => {
  let orchestrator: IndustryOrchestrator;
  let griMapper: GRIStandardsMapper;
  let regulatoryMapper: RegulatoryMapper;
  let benchmarkEngine: BenchmarkEngine;
  let aiIntegration: AIIntegration;

  beforeAll(() => {
    orchestrator = new IndustryOrchestrator({
      enableAutoClassification: true,
      enableBenchmarking: true,
      enableMLPredictions: false,
      cacheResults: false
    });
    griMapper = new GRIStandardsMapper();
    regulatoryMapper = new RegulatoryMapper();
    benchmarkEngine = new BenchmarkEngine();
    aiIntegration = new AIIntegration();
  });

  describe('Complete Oil & Gas Analysis Workflow', () => {
    test('should perform end-to-end analysis for oil & gas company', async () => {
      // Step 1: Organization data input
      const organizationData = {
        name: 'PetroMax Energy Corp',
        naicsCode: '211110',
        description: 'Oil and gas exploration and production',
        region: 'north_america',
        jurisdiction: 'US',
        employees: 5000,
        scope1_emissions: 150000,
        scope2_emissions: 35000,
        scope3_emissions: 500000,
        production_volume: 2000000, // barrels
        ghg_intensity_upstream: 28.5,
        methane_intensity: 0.18,
        water_intensity: 2.1,
        spill_volume: 12,
        trir: 0.35,
        process_safety_events: 2,
        local_procurement: 75,
        transparency_score: 0.85,
        tcfd_aligned: true,
        esg_report_published: true
      };

      // Step 2: Industry classification
      const classification = await orchestrator.classifyIndustry(organizationData);
      
      expect(classification.naicsCode).toBe('211110');
      expect(classification.confidence).toBeGreaterThan(0.8);

      // Step 3: Get applicable GRI standards
      const griMapping = await griMapper.mapToGRIStandards(classification);
      
      expect(griMapping.applicableStandards).toContain(GRISectorStandard.GRI_11_OIL_GAS);
      expect(griMapping.materialTopics.length).toBeGreaterThan(0);
      expect(griMapping.requiredDisclosures.length).toBeGreaterThan(0);

      // Step 4: Regulatory compliance assessment
      const complianceAssessment = await regulatoryMapper.assessCompliance(
        classification,
        organizationData,
        'US'
      );
      
      expect(complianceAssessment.overallScore).toBeGreaterThan(0);
      expect(complianceAssessment.overallScore).toBeLessThanOrEqual(100);

      // Step 5: Benchmark comparison
      const peerComparison = await benchmarkEngine.compareToPeers(
        classification,
        organizationData,
        'north_america'
      );
      
      expect(peerComparison.metrics).toBeDefined();
      expect(Object.keys(peerComparison.metrics).length).toBeGreaterThan(0);

      // Step 6: Complete industry analysis
      const fullAnalysis = await orchestrator.analyzeOrganization(
        'petromax-energy',
        organizationData
      );
      
      expect(fullAnalysis.organizationId).toBe('petromax-energy');
      expect(fullAnalysis.applicableGRIStandards).toContain(GRISectorStandard.GRI_11_OIL_GAS);
      expect(fullAnalysis.materialTopics.length).toBeGreaterThan(0);
      expect(fullAnalysis.recommendations.length).toBeGreaterThan(0);

      // Step 7: AI integration and context enhancement
      const aiContext = {
        organizationId: 'petromax-energy',
        organizationData,
        conversationHistory: [
          {
            role: 'user',
            content: 'How do our emissions compare to industry peers?',
            timestamp: new Date()
          }
        ]
      };

      const enhancedContext = await aiIntegration.enhanceContext(aiContext);
      
      expect(enhancedContext.industryIntelligence).toBeDefined();
      expect(enhancedContext.industryIntelligence.classification).toBeDefined();
      expect(enhancedContext.industryIntelligence.benchmarks).toBeDefined();

      // Verify data consistency across components
      expect(enhancedContext.industryIntelligence.classification.naicsCode)
        .toBe(classification.naicsCode);
    });

    test('should identify key improvement opportunities', async () => {
      const organizationData = {
        naicsCode: '211110',
        ghg_intensity_upstream: 45.0, // Above average
        methane_intensity: 0.8, // High leakage
        trir: 2.5, // Poor safety
        process_safety_events: 8, // Many incidents
        transparency_score: 0.4 // Low transparency
      };

      const recommendations = await orchestrator.getRecommendations(
        'test-org',
        organizationData
      );

      expect(recommendations.length).toBeGreaterThan(0);

      // Should prioritize safety and emissions
      const criticalRecs = recommendations.filter(r => r.priority === 'critical');
      expect(criticalRecs.length).toBeGreaterThan(0);

      const safetyRecs = recommendations.filter(r => 
        r.title.toLowerCase().includes('safety') || 
        r.description.toLowerCase().includes('safety')
      );
      expect(safetyRecs.length).toBeGreaterThan(0);

      const emissionsRecs = recommendations.filter(r => 
        r.title.toLowerCase().includes('emission') || 
        r.description.toLowerCase().includes('methane')
      );
      expect(emissionsRecs.length).toBeGreaterThan(0);
    });
  });

  describe('Complete Agriculture Analysis Workflow', () => {
    test('should perform end-to-end analysis for agriculture company', async () => {
      const organizationData = {
        name: 'GreenFields Agriculture',
        naicsCode: '111110',
        description: 'Sustainable soybean farming operation',
        region: 'north_america',
        jurisdiction: 'US',
        employees: 150,
        crop_yield_productivity: 92.0,
        water_intensity: 800.0,
        pesticide_intensity: 1.2,
        fertiliser_intensity: 80.0,
        soil_health_index: 88.0,
        biodiversity_impact: 0.3,
        food_safety_incidents: 0,
        animal_welfare_score: 85.0,
        worker_safety_rate: 98.0,
        local_procurement: 85.0,
        certification_coverage: 90.0,
        traceability_score: 0.95,
        organic_certification: true,
        food_safety_certification: true
      };

      // Complete analysis workflow
      const classification = await orchestrator.classifyIndustry(organizationData);
      expect(classification.naicsCode).toBe('111110');

      const griMapping = await griMapper.mapToGRIStandards(classification);
      expect(griMapping.applicableStandards).toContain(GRISectorStandard.GRI_13_AGRICULTURE);

      const fullAnalysis = await orchestrator.analyzeOrganization(
        'greenfields-ag',
        organizationData
      );

      expect(fullAnalysis.applicableGRIStandards).toContain(GRISectorStandard.GRI_13_AGRICULTURE);
      
      // Agriculture-specific material topics should be present
      const soilTopics = fullAnalysis.materialTopics.filter(t => 
        t.name.toLowerCase().includes('soil')
      );
      expect(soilTopics.length).toBeGreaterThan(0);
    });
  });

  describe('Complete Coal Analysis Workflow', () => {
    test('should perform end-to-end analysis for coal company', async () => {
      const organizationData = {
        name: 'Mountain Coal Mining Corp',
        naicsCode: '212111',
        description: 'Coal mining and processing',
        region: 'north_america',
        jurisdiction: 'US',
        employees: 2500,
        ghg_intensity: 180.0,
        water_intensity: 3.2,
        fatality_rate: 0.08,
        ltir: 2.8,
        mine_subsidence: 25,
        rehabilitation_progress: 45,
        community_investment: 1.8,
        just_transition_programs: 2,
        transparency_score: 0.6
      };

      const classification = await orchestrator.classifyIndustry(organizationData);
      expect(classification.naicsCode).toBe('212111');

      const griMapping = await griMapper.mapToGRIStandards(classification);
      expect(griMapping.applicableStandards).toContain(GRISectorStandard.GRI_12_COAL);

      const fullAnalysis = await orchestrator.analyzeOrganization(
        'mountain-coal',
        organizationData
      );

      expect(fullAnalysis.applicableGRIStandards).toContain(GRISectorStandard.GRI_12_COAL);
      
      // Coal-specific topics should be present
      const transitionTopics = fullAnalysis.materialTopics.filter(t => 
        t.name.toLowerCase().includes('transition')
      );
      expect(transitionTopics.length).toBeGreaterThan(0);

      // Should identify critical safety and transition recommendations
      const criticalRecs = fullAnalysis.recommendations.filter(r => 
        r.priority === 'critical'
      );
      expect(criticalRecs.length).toBeGreaterThan(0);
    });
  });

  describe('Cross-Industry Comparative Analysis', () => {
    test('should compare ESG performance across industries', async () => {
      const oilGasData = {
        naicsCode: '211110',
        ghg_intensity_upstream: 25.0,
        trir: 0.4
      };

      const agricultureData = {
        naicsCode: '111110',
        crop_yield_productivity: 85.0,
        water_intensity: 1000.0
      };

      const coalData = {
        naicsCode: '212111',
        ghg_intensity: 150.0,
        fatality_rate: 0.05
      };

      // Analyze each industry
      const oilGasAnalysis = await orchestrator.analyzeOrganization('oil-co', oilGasData);
      const agAnalysis = await orchestrator.analyzeOrganization('ag-co', agricultureData);
      const coalAnalysis = await orchestrator.analyzeOrganization('coal-co', coalData);

      // Each should have different applicable standards
      expect(oilGasAnalysis.applicableGRIStandards).toContain(GRISectorStandard.GRI_11_OIL_GAS);
      expect(agAnalysis.applicableGRIStandards).toContain(GRISectorStandard.GRI_13_AGRICULTURE);
      expect(coalAnalysis.applicableGRIStandards).toContain(GRISectorStandard.GRI_12_COAL);

      // Each should have industry-specific material topics
      expect(oilGasAnalysis.materialTopics).not.toEqual(agAnalysis.materialTopics);
      expect(agAnalysis.materialTopics).not.toEqual(coalAnalysis.materialTopics);

      // All should have some common universal topics
      const oilGasTopicIds = oilGasAnalysis.materialTopics.map(t => t.id);
      const agTopicIds = agAnalysis.materialTopics.map(t => t.id);
      
      const commonTopics = oilGasTopicIds.filter(id => agTopicIds.includes(id));
      expect(commonTopics.length).toBeGreaterThan(0); // Some overlap expected
    });
  });

  describe('AI-Driven Conversation Flow', () => {
    test('should handle multi-turn conversation with industry context', async () => {
      const organizationData = {
        naicsCode: '211110',
        ghg_intensity_upstream: 35.0,
        methane_intensity: 0.25,
        trir: 1.2
      };

      // Turn 1: Initial query
      let context = {
        organizationId: 'test-org',
        organizationData,
        conversationHistory: [
          {
            role: 'user',
            content: 'What are our emissions?',
            timestamp: new Date()
          }
        ]
      };

      let enhancedContext = await aiIntegration.enhanceContext(context);
      expect(enhancedContext.industryIntelligence).toBeDefined();

      // Turn 2: Follow-up comparison query
      context.conversationHistory.push(
        {
          role: 'assistant',
          content: 'Your Scope 1 emissions include 35.0 kg CO2e/barrel upstream intensity.',
          timestamp: new Date()
        },
        {
          role: 'user',
          content: 'How does that compare to industry average?',
          timestamp: new Date()
        }
      );

      enhancedContext = await aiIntegration.enhanceContext(context);
      
      // Should maintain context and add benchmark information
      expect(enhancedContext.industryIntelligence.benchmarks).toBeDefined();
      expect(enhancedContext.industryIntelligence.benchmarks.length).toBeGreaterThan(0);

      // Turn 3: Improvement query
      context.conversationHistory.push(
        {
          role: 'assistant',
          content: 'Your emissions are above the industry average of 25.0 kg CO2e/barrel.',
          timestamp: new Date()
        },
        {
          role: 'user',
          content: 'What can we do to improve?',
          timestamp: new Date()
        }
      );

      enhancedContext = await aiIntegration.enhanceContext(context);
      
      // Should provide relevant recommendations
      expect(enhancedContext.industryIntelligence.recommendations).toBeDefined();
      expect(enhancedContext.industryIntelligence.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Real-time Performance Monitoring', () => {
    test('should detect performance alerts and opportunities', async () => {
      const organizationData = {
        naicsCode: '211110',
        ghg_intensity_upstream: 60.0, // Significantly above average
        methane_intensity: 1.2, // Very high
        trir: 4.0, // Poor safety
        spill_volume: 150, // Large spills
        process_safety_events: 12 // Many incidents
      };

      // Generate proactive insights
      const insights = await aiIntegration.generateProactiveInsights(
        'test-org',
        organizationData
      );

      expect(insights.length).toBeGreaterThan(0);

      // Should have critical alerts for poor performance
      const criticalInsights = insights.filter(i => i.priority === 'critical');
      expect(criticalInsights.length).toBeGreaterThan(0);

      // Should include safety and environmental alerts
      const safetyAlerts = insights.filter(i => 
        i.title.toLowerCase().includes('safety') ||
        i.description.toLowerCase().includes('incident')
      );
      expect(safetyAlerts.length).toBeGreaterThan(0);

      const emissionAlerts = insights.filter(i => 
        i.title.toLowerCase().includes('emission') ||
        i.description.toLowerCase().includes('methane')
      );
      expect(emissionAlerts.length).toBeGreaterThan(0);
    });
  });

  describe('Regulatory Compliance Integration', () => {
    test('should provide comprehensive compliance assessment', async () => {
      const organizationData = {
        naicsCode: '211110',
        jurisdiction: 'US',
        scope1_emissions: 100000,
        scope2_emissions: 25000,
        ghg_reporting_submitted: true,
        tcfd_aligned: false, // Gap
        esg_report_published: true,
        methane_emissions_reported: false // Gap
      };

      const classification = await orchestrator.classifyIndustry(organizationData);
      
      // Get compliance assessment
      const compliance = await regulatoryMapper.assessCompliance(
        classification,
        organizationData,
        'US'
      );

      expect(compliance.overallScore).toBeGreaterThan(0);
      expect(compliance.gaps.length).toBeGreaterThan(0);

      // Should identify TCFD and methane reporting gaps
      const tcfdGap = compliance.gaps.find(g => g.regulation.includes('TCFD'));
      expect(tcfdGap).toBeDefined();

      // Get upcoming regulatory changes
      const upcomingChanges = await regulatoryMapper.getUpcomingChanges(
        classification,
        'US',
        'next-year'
      );

      expect(Array.isArray(upcomingChanges)).toBe(true);
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle multiple concurrent analyses', async () => {
      const companies = [
        { id: 'oil-1', naicsCode: '211110', ghg_intensity_upstream: 25.0 },
        { id: 'oil-2', naicsCode: '211110', ghg_intensity_upstream: 30.0 },
        { id: 'ag-1', naicsCode: '111110', crop_yield_productivity: 85.0 },
        { id: 'coal-1', naicsCode: '212111', ghg_intensity: 150.0 }
      ];

      const promises = companies.map(company => 
        orchestrator.analyzeOrganization(company.id, company)
      );

      const results = await Promise.all(promises);

      expect(results.length).toBe(4);
      results.forEach((result, index) => {
        expect(result.organizationId).toBe(companies[index].id);
        expect(result.applicableGRIStandards.length).toBeGreaterThan(0);
      });
    });

    test('should maintain performance with caching', async () => {
      const cachedOrchestrator = new IndustryOrchestrator({
        cacheResults: true
      });

      const organizationData = {
        naicsCode: '211110',
        ghg_intensity_upstream: 25.0
      };

      // First analysis
      const start1 = Date.now();
      const result1 = await cachedOrchestrator.analyzeOrganization('test-org', organizationData);
      const time1 = Date.now() - start1;

      // Second analysis (should be cached)
      const start2 = Date.now();
      const result2 = await cachedOrchestrator.analyzeOrganization('test-org', organizationData);
      const time2 = Date.now() - start2;

      expect(result1).toEqual(result2);
      expect(time2).toBeLessThan(time1); // Cached call should be faster
    });
  });

  describe('Error Recovery and Resilience', () => {
    test('should handle partial data gracefully', async () => {
      const incompleteData = {
        naicsCode: '211110'
        // Missing most metrics
      };

      const analysis = await orchestrator.analyzeOrganization('test-org', incompleteData);

      expect(analysis).toBeDefined();
      expect(analysis.organizationId).toBe('test-org');
      expect(analysis.applicableGRIStandards.length).toBeGreaterThan(0);
      
      // Should indicate data quality issues
      expect(analysis.peerComparison.improvementOpportunities).toContain(
        expect.stringMatching(/insufficient.*data/i)
      );
    });

    test('should handle unknown industries', async () => {
      const unknownIndustryData = {
        naicsCode: '999999', // Non-existent
        name: 'Unknown Industry Corp'
      };

      const analysis = await orchestrator.analyzeOrganization('unknown-org', unknownIndustryData);

      expect(analysis).toBeDefined();
      expect(analysis.organizationId).toBe('unknown-org');
      
      // Should provide generic analysis
      expect(analysis.peerComparison.improvementOpportunities).toContain(
        'Industry-specific model not yet available'
      );
    });
  });
});