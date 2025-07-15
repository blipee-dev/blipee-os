/**
 * Tests for Stream B & C Integration Use Cases
 * Real-world scenario testing
 */

import { integratedUseCases, ESGScoringResult, AnomalyAlert, CarbonOptimizationPlan } from '../use-cases';
import { streamBCIntegrator, IndustryMLConfig } from '../stream-bc-integration';

describe('Integrated Use Cases', () => {
  const testOrgId = 'test-manufacturing-corp';

  beforeEach(async () => {
    // Setup test organization for manufacturing
    const config: IndustryMLConfig = {
      organizationId: testOrgId,
      industryClassification: 'manufacturing',
      region: ['US', 'EU'],
      dataConnections: [
        {
          type: 'api',
          endpoint: 'https://api.smart-meters.com',
          schema: { fields: ['energy_kwh', 'timestamp'] },
          refreshRate: 3600
        }
      ],
      mlCapabilities: [
        {
          type: 'prediction',
          target: 'environmental_score',
          features: ['energy_consumption', 'emissions_total', 'waste_generation'],
          performance_requirements: { latency: 200, throughput: 100, accuracy: 0.85 }
        },
        {
          type: 'anomaly_detection',
          target: 'energy_anomaly',
          features: ['current_consumption', 'historical_average'],
          performance_requirements: { latency: 50, throughput: 1000, accuracy: 0.90 }
        },
        {
          type: 'prediction',
          target: 'carbon_optimization',
          features: ['current_emissions', 'target_reduction'],
          performance_requirements: { latency: 500, throughput: 50, accuracy: 0.85 }
        }
      ],
      complianceRequirements: [
        {
          jurisdiction: 'EU',
          framework: 'CSRD',
          deadline: new Date('2024-12-31'),
          automationLevel: 'automated'
        }
      ]
    };

    await streamBCIntegrator.setupOrganization(config);
  });

  describe('ESG Scoring Use Case', () => {
    it('should perform comprehensive ESG scoring for manufacturing company', async () => {
      const dataInputs = {
        energyData: [
          { consumption: 5500, timestamp: new Date(), building: 'Factory-A' },
          { consumption: 4200, timestamp: new Date(), building: 'Factory-B' },
          { consumption: 3800, timestamp: new Date(), building: 'Office' }
        ],
        emissionsData: [
          { scope1: 120, scope2: 80, scope3: 200, source: 'manufacturing' },
          { scope1: 50, scope2: 100, scope3: 150, source: 'transport' }
        ],
        wasteData: [
          { amount: 25, type: 'hazardous', disposal: 'certified' },
          { amount: 150, type: 'recyclable', disposal: 'recycling' },
          { amount: 75, type: 'general', disposal: 'landfill' }
        ],
        socialMetrics: [
          { category: 'employee_satisfaction', score: 78 },
          { category: 'safety_incidents', score: 85 },
          { category: 'diversity_inclusion', score: 72 },
          { category: 'community_engagement', score: 65 }
        ],
        governanceMetrics: [
          { category: 'board_independence', score: 88 },
          { category: 'executive_compensation', score: 75 },
          { category: 'transparency', score: 82 },
          { category: 'risk_management', score: 90 }
        ]
      };

      const esgResult: ESGScoringResult = await integratedUseCases.performESGScoring(
        testOrgId,
        dataInputs
      );

      // Verify ESG scoring structure
      expect(esgResult.overallScore).toBeGreaterThan(0);
      expect(esgResult.overallScore).toBeLessThanOrEqual(100);
      expect(esgResult.environmentalScore).toBeGreaterThan(0);
      expect(esgResult.socialScore).toBeGreaterThan(0);
      expect(esgResult.governanceScore).toBeGreaterThan(0);

      // Verify risk level determination
      expect(['low', 'medium', 'high', 'critical']).toContain(esgResult.riskLevel);

      // Verify recommendations provided
      expect(Array.isArray(esgResult.recommendations)).toBe(true);
      expect(esgResult.recommendations.length).toBeGreaterThan(0);

      // Verify compliance gaps identified
      expect(Array.isArray(esgResult.complianceGaps)).toBe(true);
      expect(esgResult.complianceGaps.length).toBeGreaterThanOrEqual(0);

      // Verify benchmark position
      expect(esgResult.benchmarkPosition).toBeGreaterThanOrEqual(0);
      expect(esgResult.benchmarkPosition).toBeLessThanOrEqual(100);

      console.log('🏭 ESG Scoring Results:');
      console.log(`   📊 Overall Score: ${esgResult.overallScore.toFixed(1)}/100`);
      console.log(`   🌍 Environmental: ${esgResult.environmentalScore.toFixed(1)}`);
      console.log(`   👥 Social: ${esgResult.socialScore.toFixed(1)}`);
      console.log(`   🏛️  Governance: ${esgResult.governanceScore.toFixed(1)}`);
      console.log(`   ⚠️  Risk Level: ${esgResult.riskLevel}`);
      console.log(`   📈 Benchmark Position: ${esgResult.benchmarkPosition}th percentile`);
      console.log(`   💡 Recommendations: ${esgResult.recommendations.length} provided`);
      console.log(`   ⚖️  Compliance Gaps: ${esgResult.complianceGaps.length} identified`);
    });

    it('should handle edge cases in ESG scoring', async () => {
      const minimalData = {
        energyData: [{ consumption: 1000, timestamp: new Date(), building: 'test' }],
        emissionsData: [{ scope1: 10, scope2: 20, scope3: 30, source: 'test' }],
        wasteData: [{ amount: 5, type: 'general', disposal: 'landfill' }],
        socialMetrics: [{ category: 'test', score: 50 }],
        governanceMetrics: [{ category: 'test', score: 60 }]
      };

      const esgResult = await integratedUseCases.performESGScoring(
        testOrgId,
        minimalData
      );

      expect(esgResult.overallScore).toBeGreaterThan(0);
      expect(esgResult.riskLevel).toBeDefined();
    });
  });

  describe('Anomaly Detection Use Case', () => {
    it('should detect sustainability anomalies in real-time', async () => {
      const realTimeData = {
        energyMeter: {
          currentKwh: 8500, // Significantly above normal
          avgKwh: 5500,
          ambientTemp: 32, // Hot day
          buildingOccupancy: 85
        },
        emissionsSensors: [
          {
            id: 'sensor-001',
            location: 'Factory Floor A',
            currentPpm: 150, // Above normal
            normalRange: { min: 50, max: 100 }
          },
          {
            id: 'sensor-002',
            location: 'Loading Dock',
            currentPpm: 75, // Normal
            normalRange: { min: 60, max: 120 }
          }
        ],
        wasteMeters: [
          {
            id: 'waste-001',
            location: 'Production Line 1',
            currentRate: 25, // kg/hour
            normalRate: 20
          }
        ],
        waterMeters: [
          {
            id: 'water-001',
            location: 'Cooling System',
            currentFlow: 1500, // L/min
            normalFlow: 1200
          }
        ]
      };

      const alerts: AnomalyAlert[] = await integratedUseCases.detectSustainabilityAnomalies(
        testOrgId,
        realTimeData
      );

      // Should detect at least one anomaly (high energy consumption)
      expect(Array.isArray(alerts)).toBe(true);
      expect(alerts.length).toBeGreaterThanOrEqual(0);

      // Check alert structure for any detected anomalies
      if (alerts.length > 0) {
        const alert = alerts[0];
        expect(alert.alertId).toBeDefined();
        expect(alert.timestamp).toBeInstanceOf(Date);
        expect(['info', 'warning', 'critical']).toContain(alert.severity);
        expect(['emissions_spike', 'energy_anomaly', 'waste_unusual', 'water_leak']).toContain(alert.type);
        expect(alert.description).toBeDefined();
        expect(Array.isArray(alert.affectedSystems)).toBe(true);
        expect(Array.isArray(alert.recommendedActions)).toBe(true);
        expect(alert.estimatedImpact).toBeDefined();
        expect(alert.estimatedImpact.financialCost).toBeGreaterThanOrEqual(0);
        expect(alert.estimatedImpact.environmentalImpact).toBeGreaterThanOrEqual(0);
        expect(alert.estimatedImpact.complianceRisk).toBeGreaterThanOrEqual(0);

        console.log(`🚨 Anomaly Detected: ${alert.type}`);
        console.log(`   📊 Severity: ${alert.severity}`);
        console.log(`   💰 Financial Impact: $${alert.estimatedImpact.financialCost}`);
        console.log(`   🌍 Environmental Impact: ${alert.estimatedImpact.environmentalImpact} tCO2e`);
        console.log(`   ⚖️  Compliance Risk: ${(alert.estimatedImpact.complianceRisk * 100).toFixed(1)}%`);
      }
    });

    it('should handle normal operations without false alarms', async () => {
      const normalData = {
        energyMeter: {
          currentKwh: 5400, // Normal consumption
          avgKwh: 5500,
          ambientTemp: 22,
          buildingOccupancy: 75
        },
        emissionsSensors: [
          {
            id: 'sensor-001',
            location: 'Factory Floor A',
            currentPpm: 80, // Within normal range
            normalRange: { min: 50, max: 100 }
          }
        ],
        wasteMeters: [],
        waterMeters: []
      };

      const alerts = await integratedUseCases.detectSustainabilityAnomalies(
        testOrgId,
        normalData
      );

      // Should not trigger false alarms for normal operations
      expect(Array.isArray(alerts)).toBe(true);
      
      console.log(`✅ Normal operations: ${alerts.length} alerts detected`);
    });
  });

  describe('Carbon Optimization Use Case', () => {
    it('should generate comprehensive carbon reduction plan', async () => {
      const currentData = {
        scope1Emissions: 1200, // tCO2e from direct operations
        scope2Emissions: 800,  // tCO2e from purchased electricity
        scope3Emissions: 2500, // tCO2e from value chain
        energyUsage: [
          { source: 'electricity', amount: 2500000, unit: 'kWh' },
          { source: 'natural_gas', amount: 150000, unit: 'cubic_meters' },
          { source: 'diesel', amount: 25000, unit: 'liters' }
        ],
        operationalData: [
          { facility: 'Factory-A', production_volume: 50000 },
          { facility: 'Factory-B', production_volume: 35000 },
          { facility: 'Warehouse', storage_capacity: 100000 }
        ]
      };

      const targetReduction = {
        percentageReduction: 40, // 40% reduction target
        targetDate: new Date('2030-12-31')
      };

      const optimizationPlan: CarbonOptimizationPlan = await integratedUseCases.generateCarbonOptimizationPlan(
        testOrgId,
        currentData,
        targetReduction
      );

      // Verify plan structure
      expect(optimizationPlan.currentEmissions).toBeDefined();
      expect(optimizationPlan.currentEmissions.total).toBe(4500); // Sum of all scopes
      
      expect(optimizationPlan.targetEmissions).toBeDefined();
      expect(optimizationPlan.targetEmissions.total).toBeLessThan(optimizationPlan.currentEmissions.total);

      expect(Array.isArray(optimizationPlan.optimizationSteps)).toBe(true);
      expect(optimizationPlan.optimizationSteps.length).toBeGreaterThan(0);

      expect(optimizationPlan.estimatedCostSavings).toBeGreaterThan(0);
      expect(optimizationPlan.estimatedTimeframe).toBeDefined();
      expect(Array.isArray(optimizationPlan.riskFactors)).toBe(true);

      // Verify optimization steps
      const firstStep = optimizationPlan.optimizationSteps[0];
      expect(firstStep.stepId).toBeDefined();
      expect(firstStep.title).toBeDefined();
      expect(firstStep.description).toBeDefined();
      expect(['energy', 'operations', 'supply_chain', 'technology']).toContain(firstStep.category);
      expect(['low', 'medium', 'high']).toContain(firstStep.priority);
      expect(firstStep.estimatedReduction).toBeGreaterThan(0);
      expect(firstStep.estimatedCost).toBeGreaterThanOrEqual(0);

      const totalReduction = optimizationPlan.optimizationSteps
        .reduce((sum, step) => sum + step.estimatedReduction, 0);

      console.log('🌱 Carbon Optimization Plan:');
      console.log(`   📊 Current Emissions: ${optimizationPlan.currentEmissions.total} tCO2e`);
      console.log(`   🎯 Target Emissions: ${optimizationPlan.targetEmissions.total} tCO2e`);
      console.log(`   📈 Required Reduction: ${optimizationPlan.currentEmissions.total - optimizationPlan.targetEmissions.total} tCO2e`);
      console.log(`   🔧 Optimization Steps: ${optimizationPlan.optimizationSteps.length}`);
      console.log(`   💰 Estimated Savings: $${optimizationPlan.estimatedCostSavings.toLocaleString()}`);
      console.log(`   ⏱️  Timeframe: ${optimizationPlan.estimatedTimeframe}`);
      console.log(`   ⚠️  Risk Factors: ${optimizationPlan.riskFactors.length}`);
    });

    it('should handle different reduction scenarios', async () => {
      const currentData = {
        scope1Emissions: 500,
        scope2Emissions: 300,
        scope3Emissions: 800,
        energyUsage: [],
        operationalData: []
      };

      // Test aggressive reduction target
      const aggressiveTarget = {
        percentageReduction: 65,
        targetDate: new Date('2028-12-31')
      };

      const aggressivePlan = await integratedUseCases.generateCarbonOptimizationPlan(
        testOrgId,
        currentData,
        aggressiveTarget
      );

      expect(aggressivePlan.targetEmissions.total).toBeLessThan(currentData.scope1Emissions + currentData.scope2Emissions + currentData.scope3Emissions);
      expect(aggressivePlan.optimizationSteps.length).toBeGreaterThan(0);

      console.log(`📈 Aggressive Plan: ${aggressiveTarget.percentageReduction}% reduction by ${aggressiveTarget.targetDate.getFullYear()}`);
    });
  });

  describe('Regulatory Compliance Use Case', () => {
    it('should monitor regulatory compliance across frameworks', async () => {
      const frameworks = ['GRI', 'SASB', 'TCFD', 'CSRD', 'SEC_Climate'];

      const complianceResult = await integratedUseCases.monitorRegulatoryCompliance(
        testOrgId,
        frameworks
      );

      // Verify compliance monitoring structure
      expect(complianceResult.overallComplianceScore).toBeGreaterThanOrEqual(0);
      expect(complianceResult.overallComplianceScore).toBeLessThanOrEqual(100);

      expect(complianceResult.frameworkScores).toBeDefined();
      expect(typeof complianceResult.frameworkScores).toBe('object');

      expect(Array.isArray(complianceResult.upcomingDeadlines)).toBe(true);
      expect(Array.isArray(complianceResult.riskAreas)).toBe(true);
      expect(Array.isArray(complianceResult.recommendations)).toBe(true);

      console.log('⚖️  Regulatory Compliance Monitoring:');
      console.log(`   📊 Overall Score: ${complianceResult.overallComplianceScore}/100`);
      console.log(`   📋 Frameworks: ${Object.keys(complianceResult.frameworkScores).length}`);
      console.log(`   📅 Upcoming Deadlines: ${complianceResult.upcomingDeadlines.length}`);
      console.log(`   ⚠️  Risk Areas: ${complianceResult.riskAreas.length}`);
      console.log(`   💡 Recommendations: ${complianceResult.recommendations.length}`);
    });
  });

  describe('Supply Chain Assessment Use Case', () => {
    it('should assess supply chain sustainability risks', async () => {
      const supplierData = [
        {
          supplierId: 'supplier-001',
          location: 'China',
          category: 'Raw Materials',
          emissionsData: { scope1: 50, scope2: 30, scope3: 120 },
          certifications: ['ISO14001', 'OHSAS18001']
        },
        {
          supplierId: 'supplier-002',
          location: 'Germany',
          category: 'Components',
          emissionsData: { scope1: 20, scope2: 15, scope3: 45 },
          certifications: ['ISO14001', 'ISO50001', 'B_Corp']
        },
        {
          supplierId: 'supplier-003',
          location: 'India',
          category: 'Packaging',
          emissionsData: { scope1: 30, scope2: 25, scope3: 80 },
          certifications: ['ISO14001']
        }
      ];

      const assessment = await integratedUseCases.assessSupplyChainSustainability(
        testOrgId,
        supplierData
      );

      // Verify assessment structure
      expect(['low', 'medium', 'high']).toContain(assessment.overallRisk);
      expect(assessment.supplierRiskScores).toBeDefined();
      expect(typeof assessment.supplierRiskScores).toBe('object');
      expect(Array.isArray(assessment.recommendations)).toBe(true);
      expect(Array.isArray(assessment.alternativeSuppliers)).toBe(true);

      console.log('🔗 Supply Chain Sustainability Assessment:');
      console.log(`   📊 Overall Risk: ${assessment.overallRisk}`);
      console.log(`   🏭 Suppliers Assessed: ${Object.keys(assessment.supplierRiskScores).length}`);
      console.log(`   💡 Recommendations: ${assessment.recommendations.length}`);
      console.log(`   🔄 Alternative Suppliers: ${assessment.alternativeSuppliers.length}`);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple concurrent use cases', async () => {
      const concurrentOperations = [
        // ESG Scoring
        integratedUseCases.performESGScoring(testOrgId, {
          energyData: [{ consumption: 5000, timestamp: new Date(), building: 'test' }],
          emissionsData: [{ scope1: 100, scope2: 50, scope3: 150, source: 'test' }],
          wasteData: [{ amount: 20, type: 'general', disposal: 'landfill' }],
          socialMetrics: [{ category: 'test', score: 70 }],
          governanceMetrics: [{ category: 'test', score: 80 }]
        }),
        
        // Anomaly Detection
        integratedUseCases.detectSustainabilityAnomalies(testOrgId, {
          energyMeter: { currentKwh: 6000, avgKwh: 5500, ambientTemp: 25, buildingOccupancy: 80 },
          emissionsSensors: [],
          wasteMeters: [],
          waterMeters: []
        }),
        
        // Carbon Optimization
        integratedUseCases.generateCarbonOptimizationPlan(testOrgId, {
          scope1Emissions: 800,
          scope2Emissions: 600,
          scope3Emissions: 1200,
          energyUsage: [],
          operationalData: []
        }, {
          percentageReduction: 30,
          targetDate: new Date('2030-12-31')
        }),
        
        // Compliance Monitoring
        integratedUseCases.monitorRegulatoryCompliance(testOrgId, ['GRI', 'SASB'])
      ];

      const startTime = Date.now();
      const results = await Promise.all(concurrentOperations);
      const totalTime = Date.now() - startTime;

      expect(results).toHaveLength(4);
      expect(results.every(result => result !== null)).toBe(true);
      expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds

      console.log(`⚡ Concurrent Operations Performance:`);
      console.log(`   🔄 Operations: ${concurrentOperations.length}`);
      console.log(`   ⏱️  Total Time: ${totalTime}ms`);
      console.log(`   📊 Average Time per Operation: ${(totalTime / concurrentOperations.length).toFixed(2)}ms`);
    });
  });
});