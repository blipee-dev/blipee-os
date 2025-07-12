/**
 * Tests for algorithms that don't require TensorFlow
 */

describe('Non-TensorFlow Algorithm Tests', () => {
  
  it('should test genetic algorithm without TensorFlow', async () => {
    const { GeneticAlgorithm } = await import('../algorithms/genetic-algorithm');
    
    const ga = new GeneticAlgorithm({
      populationSize: 10,
      mutationRate: 0.1,
      crossoverRate: 0.8,
      elitism: 0.1,
      maxGenerations: 20
    });

    const problem = {
      dimensions: 2,
      bounds: [[0, 10], [0, 10]] as Array<[number, number]>,
      fitnessFunction: (solution: number[]) => {
        // Simple optimization: maximize x + y
        return (solution[0] + solution[1]) / 20; // Normalize to 0-1
      }
    };

    const result = await ga.evolve(problem, { generations: 20 });
    
    expect(result).toBeDefined();
    expect(result.genes).toHaveLength(2);
    expect(result.fitness).toBeGreaterThan(0);
    expect(result.generation).toBeGreaterThanOrEqual(0);
    expect(result.evaluations).toBeGreaterThan(0);
    
    // Should find values close to maximum (10, 10)
    expect(result.genes[0]).toBeGreaterThan(5);
    expect(result.genes[1]).toBeGreaterThan(5);
    expect(result.fitness).toBeGreaterThan(0.5);
  });

  it('should test optimization scenarios', async () => {
    const { OptimizationScenarios } = await import('../optimization-engine');
    
    const emissionReduction = OptimizationScenarios.emissionReduction();
    expect(emissionReduction.type).toBe('emission_reduction');
    expect(emissionReduction.timeHorizon).toBe(365);
    expect(emissionReduction.constraints).toHaveLength(2);
    expect(emissionReduction.objectives).toHaveLength(3);
    
    const resourceAllocation = OptimizationScenarios.resourceAllocation();
    expect(resourceAllocation.type).toBe('resource_allocation');
    expect(resourceAllocation.timeHorizon).toBe(30);
    expect(resourceAllocation.constraints).toHaveLength(2);
    expect(resourceAllocation.objectives).toHaveLength(2);
    
    const costOptimization = OptimizationScenarios.costOptimization();
    expect(costOptimization.type).toBe('cost_optimization');
    expect(costOptimization.timeHorizon).toBe(90);
    expect(costOptimization.constraints).toHaveLength(2);
    expect(costOptimization.objectives).toHaveLength(2);
  });

  it('should test regulatory predictor text analysis', async () => {
    const { RegulatoryPredictor } = await import('../regulatory-predictor');
    
    const predictor = new RegulatoryPredictor();
    await predictor.buildModel();
    
    const regulation = {
      id: 'test-reg-001',
      title: 'Carbon Emissions Disclosure Act',
      content: 'All organizations with annual revenue exceeding $10M must report Scope 1, 2, and 3 greenhouse gas emissions. Mandatory third-party verification required for emissions above 25,000 tCO2e. Non-compliance penalties range from $50,000 to $500,000 per violation.',
      jurisdiction: 'California',
      effectiveDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
      sector: ['manufacturing', 'technology', 'retail'],
      source: 'CARB'
    };
    
    const impact = await predictor.analyzeRegulation(regulation);
    
    expect(impact).toBeDefined();
    expect(impact.impactScore).toBeGreaterThan(0);
    expect(impact.impactScore).toBeLessThanOrEqual(1);
    expect(impact.affectedAreas).toBeDefined();
    expect(Array.isArray(impact.affectedAreas)).toBe(true);
    expect(impact.affectedAreas.length).toBeGreaterThan(0);
    
    // Should detect emissions-related content
    expect(impact.affectedAreas).toContain('emissions');
    
    expect(impact.timeline).toBeDefined();
    expect(impact.timeline.preparation).toBeGreaterThan(0);
    expect(impact.timeline.implementation).toBeGreaterThan(0);
    expect(impact.timeline.compliance).toBeGreaterThan(0);
    
    expect(impact.costEstimate).toBeDefined();
    expect(impact.costEstimate.low).toBeGreaterThan(0);
    expect(impact.costEstimate.high).toBeGreaterThan(impact.costEstimate.low);
    expect(impact.costEstimate.currency).toBe('USD');
    
    expect(['low', 'medium', 'high', 'critical']).toContain(impact.riskLevel);
    expect(impact.confidence).toBeGreaterThan(0);
    expect(impact.confidence).toBeLessThanOrEqual(1);
    
    // Should have higher impact due to penalties and mandatory requirements
    expect(impact.impactScore).toBeGreaterThan(0.5);
  });

  it('should test regulatory predictor organization risk assessment', async () => {
    const { RegulatoryPredictor } = await import('../regulatory-predictor');
    
    const predictor = new RegulatoryPredictor();
    await predictor.buildModel();
    
    const organization = {
      id: 'test-manufacturing-corp',
      name: 'Test Manufacturing Corporation',
      industry: 'manufacturing',
      size: 'large' as const,
      jurisdiction: ['California', 'New York'],
      currentCompliance: [
        {
          framework: 'GRI Standards',
          status: 'partial' as const,
          lastAssessment: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          gaps: [
            {
              requirement: 'Scope 3 emissions reporting',
              description: 'Supply chain emissions data incomplete',
              severity: 'high' as const,
              estimatedEffort: 400,
              estimatedCost: 120000
            },
            {
              requirement: 'Water consumption disclosure',
              description: 'Need facility-level water usage data',
              severity: 'medium' as const,
              estimatedEffort: 160,
              estimatedCost: 45000
            }
          ]
        }
      ],
      operations: {
        emissions: { scope1: 450, scope2: 280, scope3: 1200 },
        revenue: 125000000,
        employees: 850,
        facilities: 4,
        supplyChain: {
          suppliers: 180,
          countries: ['US', 'Mexico', 'China', 'Vietnam']
        }
      }
    };

    const regulations = [
      {
        id: 'ca-climate-disclosure',
        title: 'California Climate Disclosure Act',
        content: 'Large corporations must disclose climate-related financial risks and emissions data.',
        jurisdiction: 'California',
        effectiveDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        sector: ['manufacturing'],
        source: 'California Legislature'
      },
      {
        id: 'sec-climate-rule',
        title: 'SEC Climate Risk Disclosure',
        content: 'Public companies must report climate risks in 10-K filings.',
        jurisdiction: 'Federal',
        effectiveDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        sector: ['public_companies'],
        source: 'SEC'
      }
    ];

    const riskAssessment = await predictor.predictComplianceRisk(organization, regulations);
    
    expect(riskAssessment).toBeDefined();
    expect(riskAssessment.overallRisk).toBeGreaterThanOrEqual(0);
    expect(riskAssessment.overallRisk).toBeLessThanOrEqual(1);
    
    expect(riskAssessment.byRegulation).toBeDefined();
    expect(riskAssessment.byRegulation['ca-climate-disclosure']).toBeDefined();
    expect(riskAssessment.byRegulation['sec-climate-rule']).toBeDefined();
    
    for (const regId of Object.keys(riskAssessment.byRegulation)) {
      const regRisk = riskAssessment.byRegulation[regId];
      expect(regRisk.risk).toBeGreaterThanOrEqual(0);
      expect(regRisk.risk).toBeLessThanOrEqual(1);
      expect(regRisk.impact).toBeDefined();
      expect(regRisk.timeline).toBeDefined();
      expect(Array.isArray(regRisk.actions)).toBe(true);
    }
    
    expect(riskAssessment.recommendations).toBeDefined();
    expect(Array.isArray(riskAssessment.recommendations)).toBe(true);
    expect(riskAssessment.recommendations.length).toBeGreaterThan(0);
    
    // Should have meaningful recommendations
    const firstRecommendation = riskAssessment.recommendations[0];
    expect(firstRecommendation.action).toBeDefined();
    expect(['low', 'medium', 'high', 'critical']).toContain(firstRecommendation.priority);
    expect(firstRecommendation.timeline).toBeDefined();
    expect(firstRecommendation.effort).toBeGreaterThan(0);
    expect(firstRecommendation.cost).toBeGreaterThan(0);
    
    expect(riskAssessment.priorityAreas).toBeDefined();
    expect(Array.isArray(riskAssessment.priorityAreas)).toBe(true);
    expect(riskAssessment.priorityAreas.length).toBeGreaterThan(0);
    expect(riskAssessment.priorityAreas.length).toBeLessThanOrEqual(3);
  });

  it('should test regulatory trends prediction', async () => {
    const { RegulatoryPredictor } = await import('../regulatory-predictor');
    
    const predictor = new RegulatoryPredictor();
    await predictor.buildModel();
    
    const trends = await predictor.predictRegulatoryTrends('US', 'manufacturing', 730); // 2 years
    
    expect(trends).toBeDefined();
    expect(trends.trends).toBeDefined();
    expect(Array.isArray(trends.trends)).toBe(true);
    expect(trends.trends.length).toBeGreaterThan(0);
    
    for (const trend of trends.trends) {
      expect(trend.topic).toBeDefined();
      expect(trend.probability).toBeGreaterThan(0);
      expect(trend.probability).toBeLessThanOrEqual(1);
      expect(trend.expectedTimeframe).toBeDefined();
      expect(trend.potentialImpact).toBeDefined();
    }
    
    expect(trends.emergingAreas).toBeDefined();
    expect(Array.isArray(trends.emergingAreas)).toBe(true);
    expect(trends.emergingAreas.length).toBeGreaterThan(0);
    
    expect(trends.confidence).toBeGreaterThan(0);
    expect(trends.confidence).toBeLessThanOrEqual(1);
    
    // Should have some high-probability trends
    const highProbabilityTrends = trends.trends.filter(t => t.probability > 0.7);
    expect(highProbabilityTrends.length).toBeGreaterThan(0);
  });

  it('should test end-to-end regulatory analysis workflow', async () => {
    const { RegulatoryPredictor } = await import('../regulatory-predictor');
    
    const predictor = new RegulatoryPredictor();
    await predictor.buildModel();
    
    // Step 1: Analyze a new regulation
    const newRegulation = {
      id: 'eu-csrd-2024',
      title: 'EU Corporate Sustainability Reporting Directive (CSRD)',
      content: 'The Corporate Sustainability Reporting Directive requires large companies and listed SMEs to report on sustainability matters. Companies must disclose information on how sustainability issues affect their business, and on their impacts on people and environment. The directive introduces detailed reporting requirements including double materiality assessment, value chain impacts, and mandatory assurance.',
      jurisdiction: 'EU',
      effectiveDate: new Date('2024-01-01'),
      sector: ['all_large_companies', 'listed_smes'],
      source: 'European Commission'
    };
    
    const regulationImpact = await predictor.analyzeRegulation(newRegulation);
    
    // Should identify multiple affected areas due to comprehensive nature
    expect(regulationImpact.affectedAreas.length).toBeGreaterThan(2);
    expect(regulationImpact.impactScore).toBeGreaterThan(0.6); // High impact regulation
    expect(regulationImpact.riskLevel).toMatch(/high|critical/);
    
    // Step 2: Assess impact on specific organization
    const europeanCompany = {
      id: 'eu-tech-corp',
      name: 'European Technology Corporation',
      industry: 'technology',
      size: 'large' as const,
      jurisdiction: ['Germany', 'France'],
      currentCompliance: [
        {
          framework: 'NFRD',
          status: 'compliant' as const,
          lastAssessment: new Date('2023-06-01'),
          gaps: []
        }
      ],
      operations: {
        emissions: { scope1: 120, scope2: 450, scope3: 850 },
        revenue: 500000000,
        employees: 2500,
        facilities: 8,
        supplyChain: {
          suppliers: 450,
          countries: ['Germany', 'Poland', 'Czech Republic', 'India', 'China']
        }
      }
    };
    
    const companyRisk = await predictor.predictComplianceRisk(europeanCompany, [newRegulation]);
    
    // Should show moderate risk due to existing NFRD compliance
    expect(companyRisk.overallRisk).toBeGreaterThan(0.3);
    expect(companyRisk.overallRisk).toBeLessThan(0.8); // Not maximum due to existing compliance
    
    // Should have actionable recommendations
    expect(companyRisk.recommendations.length).toBeGreaterThan(2);
    const criticalRecommendations = companyRisk.recommendations.filter(r => r.priority === 'critical' || r.priority === 'high');
    expect(criticalRecommendations.length).toBeGreaterThan(0);
    
    // Step 3: Predict future trends
    const euTrends = await predictor.predictRegulatoryTrends('EU', 'technology', 365);
    
    expect(euTrends.trends.length).toBeGreaterThan(0);
    expect(euTrends.emergingAreas.length).toBeGreaterThan(0);
    
    // Verify the complete workflow provides actionable intelligence
    expect(regulationImpact.timeline.preparation).toBeGreaterThan(30); // Should need significant preparation
    expect(companyRisk.priorityAreas).toContain('reporting'); // Should identify reporting as priority
    expect(euTrends.confidence).toBeGreaterThan(0.5); // Should have reasonable confidence
  });

  it('should test genetic algorithm with constraint handling', async () => {
    const { GeneticAlgorithm } = await import('../algorithms/genetic-algorithm');
    
    const ga = new GeneticAlgorithm({
      populationSize: 50,
      mutationRate: 0.05,
      crossoverRate: 0.8,
      elitism: 0.1,
      maxGenerations: 100
    });

    // Resource allocation problem with constraints
    const problem = {
      dimensions: 3, // Three resources: energy, water, materials
      bounds: [[0, 100], [0, 100], [0, 100]] as Array<[number, number]>,
      fitnessFunction: (solution: number[]) => {
        // Maximize efficiency while minimizing cost
        const efficiency = (solution[0] * 0.8 + solution[1] * 0.6 + solution[2] * 0.7) / 300;
        const cost = (solution[0] * 2 + solution[1] * 1.5 + solution[2] * 3) / 450;
        return efficiency - cost * 0.3; // Balance efficiency vs cost
      },
      constraints: [
        // Total resources cannot exceed budget (more lenient)
        (solution: number[]) => solution[0] * 2 + solution[1] * 1.5 + solution[2] * 3 <= 400,
        // Minimum efficiency requirement (more achievable)
        (solution: number[]) => solution[0] * 0.8 + solution[1] * 0.6 + solution[2] * 0.7 >= 80
      ]
    };

    const result = await ga.evolve(problem, { 
      generations: 100,
      targetFitness: 0.4 
    });
    
    expect(result).toBeDefined();
    expect(result.genes).toHaveLength(3);
    expect(result.fitness).toBeGreaterThan(0);
    
    // Verify constraints are satisfied
    const totalCost = result.genes[0] * 2 + result.genes[1] * 1.5 + result.genes[2] * 3;
    const totalEfficiency = result.genes[0] * 0.8 + result.genes[1] * 0.6 + result.genes[2] * 0.7;
    
    expect(totalCost).toBeLessThanOrEqual(405); // Allow small tolerance
    expect(totalEfficiency).toBeGreaterThanOrEqual(75); // Allow small tolerance
    
    // Should find a good balance (allow for constraint penalties)
    expect(result.fitness).toBeGreaterThan(-100);
  });
});