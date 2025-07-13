/**
 * Comprehensive tests for Stream B Week 3-4: Advanced Models
 * Tests the Genetic Algorithm, DQN Agent, Optimization Engine, Regulatory Predictor, and Model Integration
 */

import { GeneticAlgorithm, OptimizationProblem } from '../algorithms/genetic-algorithm';
import { DQNAgent, ESGEnvironment } from '../algorithms/dqn-agent';
import { OptimizationEngine, OptimizationScenarios } from '../optimization-engine';
import { RegulatoryPredictor } from '../regulatory-predictor';
import { ModelIntegration } from '../model-integration';
import { AnomalyDetectionModel } from '../anomaly-detector';

describe('Stream B Week 3-4: Advanced Models', () => {
  
  describe('Genetic Algorithm', () => {
    let ga: GeneticAlgorithm;
    
    beforeEach(() => {
      ga = new GeneticAlgorithm({
        populationSize: 20,
        mutationRate: 0.02,
        crossoverRate: 0.8,
        elitism: 0.1,
        maxGenerations: 50
      });
    });

    it('should solve a simple optimization problem', async () => {
      const problem: OptimizationProblem = {
        dimensions: 2,
        bounds: [[0, 10], [0, 10]],
        fitnessFunction: (solution) => {
          // Maximize x^2 + y^2 (should converge to [10, 10])
          return (solution[0] * solution[0] + solution[1] * solution[1]) / 200;
        }
      };

      const result = await ga.evolve(problem, {
        generations: 50,
        targetFitness: 0.9
      });

      expect(result).toBeDefined();
      expect(result.genes).toHaveLength(2);
      expect(result.fitness).toBeGreaterThan(0.5);
      expect(result.generation).toBeGreaterThan(0);
      expect(result.evaluations).toBeGreaterThan(0);
    });

    it('should handle constraints correctly', async () => {
      const problem: OptimizationProblem = {
        dimensions: 2,
        bounds: [[0, 10], [0, 10]],
        fitnessFunction: (solution) => solution[0] + solution[1],
        constraints: [
          (solution) => solution[0] + solution[1] <= 15 // Sum constraint
        ]
      };

      const result = await ga.evolve(problem, {
        generations: 30
      });

      expect(result.genes[0] + result.genes[1]).toBeLessThanOrEqual(15.5); // Allow small tolerance
    });

    it('should provide population statistics', () => {
      const stats = ga.getStatistics();
      
      expect(stats).toHaveProperty('generation');
      expect(stats).toHaveProperty('bestFitness');
      expect(stats).toHaveProperty('averageFitness');
      expect(stats).toHaveProperty('evaluations');
      expect(typeof stats.generation).toBe('number');
      expect(typeof stats.bestFitness).toBe('number');
      expect(typeof stats.averageFitness).toBe('number');
      expect(typeof stats.evaluations).toBe('number');
    });
  });

  describe('DQN Agent', () => {
    let agent: DQNAgent;
    let environment: ESGEnvironment;

    beforeEach(() => {
      agent = new DQNAgent({
        stateSize: 5,
        actionSize: 3,
        learningRate: 0.01,
        discountFactor: 0.95,
        epsilon: 0.1,
        batchSize: 16,
        memorySize: 1000
      });

      environment = new ESGEnvironment({
        stateSize: 5,
        actionSize: 3,
        maxSteps: 20
      });
    });

    it('should initialize correctly', () => {
      const stats = agent.getStatistics();
      
      expect(stats.epsilon).toBe(0.1);
      expect(stats.bufferSize).toBe(0);
      expect(stats.trainStep).toBe(0);
    });

    it('should select actions consistently', () => {
      const state = { features: [0.1, 0.2, 0.3, 0.4, 0.5] };
      
      const action1 = agent.getAction(state);
      const action2 = agent.getAction(state);
      
      expect(action1).toHaveProperty('index');
      expect(action1).toHaveProperty('value');
      expect(action1.index).toBeGreaterThanOrEqual(0);
      expect(action1.index).toBeLessThan(3);
      
      expect(action2).toHaveProperty('index');
      expect(action2).toHaveProperty('value');
    });

    it('should learn from experiences', async () => {
      const initialStats = agent.getStatistics();
      
      // Generate some experiences
      const experiences = [];
      for (let i = 0; i < 20; i++) {
        experiences.push({
          state: { features: Array(5).fill(0).map(() => Math.random()) },
          action: { index: Math.floor(Math.random() * 3), value: null },
          reward: Math.random() * 2 - 1,
          nextState: { features: Array(5).fill(0).map(() => Math.random()) },
          done: false
        });
      }
      
      agent.updatePolicy(experiences);
      
      const finalStats = agent.getStatistics();
      expect(finalStats.bufferSize).toBeGreaterThan(initialStats.bufferSize);
    });

    it('should train in environment', async () => {
      const policy = await agent.train(environment, {
        episodes: 5,
        maxSteps: 10,
        verbose: false
      });

      expect(policy).toBeDefined();
      expect(policy.getAction).toBeDefined();
      
      const stats = agent.getStatistics();
      expect(stats.trainStep).toBeGreaterThan(0);
    });
  });

  describe('ESG Environment', () => {
    let environment: ESGEnvironment;

    beforeEach(() => {
      environment = new ESGEnvironment({
        stateSize: 10,
        actionSize: 5,
        maxSteps: 50
      });
    });

    it('should reset to initial state', () => {
      const state = environment.reset();
      
      expect(state).toHaveProperty('features');
      expect(state.features).toHaveLength(10);
      expect(state.features.every(f => f >= 0 && f <= 1)).toBe(true);
    });

    it('should execute actions and return valid transitions', () => {
      const initialState = environment.reset();
      const action = { index: 2, value: null };
      
      const { nextState, reward, done } = environment.step(action);
      
      expect(nextState).toHaveProperty('features');
      expect(nextState.features).toHaveLength(10);
      expect(typeof reward).toBe('number');
      expect(typeof done).toBe('boolean');
    });

    it('should provide action space', () => {
      const actions = environment.getActionSpace();
      
      expect(actions).toHaveLength(5);
      expect(actions.every(a => a.index >= 0 && a.index < 5)).toBe(true);
    });
  });

  describe('Optimization Engine', () => {
    let optimizer: OptimizationEngine;

    beforeEach(async () => {
      optimizer = new OptimizationEngine();
      await optimizer.buildModel();
    });

    it('should optimize emission reduction scenario', async () => {
      const task = OptimizationScenarios.emissionReduction();
      const data = {
        emissionSources: [
          { name: 'facility1', current: 100 },
          { name: 'facility2', current: 80 }
        ],
        current: Array(10).fill(0).map(() => Math.random())
      };

      const result = await optimizer.optimize(task, data);

      expect(result).toBeDefined();
      expect(result.algorithm).toBe('reinforcement'); // Should select RL for long horizon
      expect(result.score).toBeGreaterThanOrEqual(-1);
      expect(result.score).toBeLessThanOrEqual(1);
      expect(result.improvements).toBeDefined();
      expect(Array.isArray(result.improvements)).toBe(true);
      expect(result.feasible).toBe(true);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should optimize resource allocation scenario', async () => {
      const task = OptimizationScenarios.resourceAllocation();
      const data = {
        resources: [
          { name: 'energy', current: 100, min: 50, max: 200 },
          { name: 'water', current: 80, min: 40, max: 150 }
        ],
        activities: [
          { name: 'production' },
          { name: 'maintenance' }
        ],
        current: [0.5, 0.3, 0.8, 0.6]
      };

      const result = await optimizer.optimize(task, data);

      expect(result).toBeDefined();
      expect(result.algorithm).toBe('genetic'); // Should select GA for short horizon
      expect(result.score).toBeGreaterThan(0);
      expect(result.improvements).toBeDefined();
      expect(result.solution).toBeDefined();
      expect(result.solution.actions).toBeDefined();
    });

    it('should handle cost optimization scenario', async () => {
      const task = OptimizationScenarios.costOptimization();
      const data = {
        costCenters: [
          { name: 'operations', budget: 50000 },
          { name: 'maintenance', budget: 30000 }
        ],
        current: [0.7, 0.4, 0.9, 0.2]
      };

      const result = await optimizer.optimize(task, data);

      expect(result).toBeDefined();
      expect(result.algorithm).toBe('genetic');
      expect(result.feasible).toBe(true);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should provide legacy resource allocation interface', async () => {
      const resources = [
        { name: 'energy', current: 100, min: 50, max: 200, unit: 'kWh' },
        { name: 'water', current: 80, min: 40, max: 150, unit: 'L' }
      ];
      const constraints = [];
      const objectives = [
        { name: 'efficiency', weight: 0.6, minimize: false },
        { name: 'cost', weight: 0.4, minimize: true }
      ];

      const result = await optimizer.optimizeResourceAllocation(resources, constraints, objectives);

      expect(result).toBeDefined();
      expect(result.allocation).toBeDefined();
      expect(result.expectedImpact).toBeDefined();
      expect(result.confidence).toBeDefined();
      expect(result.implementation).toBeDefined();
    });
  });

  describe('Regulatory Predictor', () => {
    let predictor: RegulatoryPredictor;

    beforeEach(async () => {
      predictor = new RegulatoryPredictor();
      await predictor.buildModel();
    });

    it('should analyze regulation text', async () => {
      const regulation = {
        id: 'test-reg-1',
        title: 'Carbon Disclosure Requirements',
        content: 'Organizations must report Scope 1, 2, and 3 emissions annually. Mandatory verification required for emissions above 50,000 tCO2e. Penalties up to $500,000 for non-compliance.',
        jurisdiction: 'EU',
        effectiveDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 180 days from now
        sector: ['manufacturing', 'energy'],
        source: 'EU Commission'
      };

      const impact = await predictor.analyzeRegulation(regulation);

      expect(impact).toBeDefined();
      expect(impact.impactScore).toBeGreaterThan(0);
      expect(impact.impactScore).toBeLessThanOrEqual(1);
      expect(impact.affectedAreas).toBeDefined();
      expect(Array.isArray(impact.affectedAreas)).toBe(true);
      expect(impact.timeline).toBeDefined();
      expect(impact.timeline.preparation).toBeGreaterThan(0);
      expect(impact.timeline.implementation).toBeGreaterThan(0);
      expect(impact.timeline.compliance).toBeGreaterThan(0);
      expect(impact.costEstimate).toBeDefined();
      expect(impact.costEstimate.low).toBeGreaterThan(0);
      expect(impact.costEstimate.high).toBeGreaterThan(impact.costEstimate.low);
      expect(['low', 'medium', 'high', 'critical']).toContain(impact.riskLevel);
      expect(impact.confidence).toBeGreaterThan(0);
      expect(impact.confidence).toBeLessThanOrEqual(1);
    });

    it('should predict compliance risk for organization', async () => {
      const organization = {
        id: 'test-org',
        name: 'Test Manufacturing Corp',
        industry: 'manufacturing',
        size: 'large' as const,
        jurisdiction: ['EU', 'US'],
        currentCompliance: [
          {
            framework: 'GRI',
            status: 'partial' as const,
            lastAssessment: new Date(),
            gaps: [
              {
                requirement: 'Scope 3 reporting',
                description: 'Missing supply chain emissions data',
                severity: 'medium' as const,
                estimatedEffort: 200,
                estimatedCost: 50000
              }
            ]
          }
        ],
        operations: {
          emissions: { scope1: 120, scope2: 80, scope3: 300 },
          revenue: 10000000,
          employees: 500,
          facilities: 3,
          supplyChain: {
            suppliers: 150,
            countries: ['US', 'Canada', 'Mexico']
          }
        }
      };

      const regulations = [
        {
          id: 'test-reg-1',
          title: 'Emissions Reporting Act',
          content: 'Annual emissions reporting required for all manufacturing companies.',
          jurisdiction: 'EU',
          effectiveDate: new Date(),
          sector: ['manufacturing'],
          source: 'EU Commission'
        }
      ];

      const risk = await predictor.predictComplianceRisk(organization, regulations);

      expect(risk).toBeDefined();
      expect(risk.overallRisk).toBeGreaterThanOrEqual(0);
      expect(risk.overallRisk).toBeLessThanOrEqual(1);
      expect(risk.byRegulation).toBeDefined();
      expect(risk.byRegulation['test-reg-1']).toBeDefined();
      expect(risk.recommendations).toBeDefined();
      expect(Array.isArray(risk.recommendations)).toBe(true);
      expect(risk.priorityAreas).toBeDefined();
      expect(Array.isArray(risk.priorityAreas)).toBe(true);
    });

    it('should predict regulatory trends', async () => {
      const trends = await predictor.predictRegulatoryTrends('EU', 'manufacturing', 365);

      expect(trends).toBeDefined();
      expect(trends.trends).toBeDefined();
      expect(Array.isArray(trends.trends)).toBe(true);
      expect(trends.emergingAreas).toBeDefined();
      expect(Array.isArray(trends.emergingAreas)).toBe(true);
      expect(trends.confidence).toBeGreaterThan(0);
      expect(trends.confidence).toBeLessThanOrEqual(1);

      if (trends.trends.length > 0) {
        const trend = trends.trends[0];
        expect(trend.topic).toBeDefined();
        expect(trend.probability).toBeGreaterThan(0);
        expect(trend.probability).toBeLessThanOrEqual(1);
        expect(trend.expectedTimeframe).toBeDefined();
        expect(trend.potentialImpact).toBeDefined();
      }
    });
  });

  describe('Model Integration', () => {
    let integration: ModelIntegration;

    beforeEach(() => {
      integration = new ModelIntegration();
    });

    it('should handle emissions prediction requests', async () => {
      const _request = {
        type: 'emissions' as const,
        data: {
          historicalData: [
            { timestamp: new Date(), scope1: 100, scope2: 50, scope3: 200 }
          ],
          features: [0.1, 0.2, 0.3, 0.4, 0.5]
        },
        options: { includeExplanation: true }
      };

      const response = await integration.predict(request);

      expect(response).toBeDefined();
      expect(response.type).toBe('emissions');
      expect(response.prediction).toBeDefined();
      expect(response.confidence).toBeGreaterThan(0);
      expect(response.confidence).toBeLessThanOrEqual(1);
      expect(response.timestamp).toBeInstanceOf(Date);
      expect(response.modelVersion).toBeDefined();
      expect(response.explanation).toBeDefined();
      expect(response.metadata).toBeDefined();
      expect(response.metadata.processingTime).toBeGreaterThan(0);
      expect(Array.isArray(response.metadata.modelsUsed)).toBe(true);
      expect(response.metadata.dataQuality).toBeGreaterThan(0);
    });

    it('should handle optimization prediction requests', async () => {
      const _request = {
        type: 'optimization' as const,
        data: {
          task: OptimizationScenarios.resourceAllocation(),
          resources: [
            { name: 'energy', current: 100, min: 50, max: 200 }
          ],
          activities: [
            { name: 'production' }
          ]
        }
      };

      const response = await integration.predict(request);

      expect(response).toBeDefined();
      expect(response.type).toBe('optimization');
      expect(response.prediction).toBeDefined();
      expect(response.prediction.solution).toBeDefined();
      expect(response.prediction.algorithm).toBeDefined();
      expect(response.confidence).toBeGreaterThan(0);
    });

    it('should handle multi-model predictions', async () => {
      const _request = {
        type: 'multi_model' as const,
        data: {
          emissions: {
            historicalData: [{ timestamp: new Date(), scope1: 100, scope2: 50, scope3: 200 }]
          },
          metrics: {
            data: [0.1, 0.2, 0.3, 0.4, 0.5]
          },
          optimization: {
            task: OptimizationScenarios.costOptimization(),
            costCenters: [{ name: 'operations', budget: 50000 }]
          },
          regulatory: {
            organization: {
              id: 'test',
              name: 'Test Corp',
              industry: 'manufacturing',
              size: 'medium' as const,
              jurisdiction: ['US'],
              currentCompliance: [],
              operations: {
                emissions: { scope1: 50, scope2: 30, scope3: 100 },
                revenue: 5000000,
                employees: 200,
                facilities: 2,
                supplyChain: { suppliers: 50, countries: ['US'] }
              }
            },
            regulations: []
          }
        }
      };

      const response = await integration.predict(request);

      expect(response).toBeDefined();
      expect(response.type).toBe('multi_model');
      expect(response.prediction).toBeDefined();
      expect(response.prediction.emissions).toBeDefined();
      expect(response.prediction.anomalies).toBeDefined();
      expect(response.prediction.optimization).toBeDefined();
      expect(response.prediction.regulatory).toBeDefined();
      expect(response.prediction.insights).toBeDefined();
      expect(response.prediction.insights.summary).toBeDefined();
      expect(Array.isArray(response.prediction.insights.keyFindings)).toBe(true);
      expect(Array.isArray(response.prediction.insights.actionItems)).toBe(true);
    });

    it('should create prediction service', async () => {
      const service = await integration.createPredictionService();

      expect(service).toBeDefined();
      expect(typeof service.emissions).toBe('function');
      expect(typeof service.anomaly).toBe('function');
      expect(typeof service.optimization).toBe('function');
      expect(typeof service.regulatory).toBe('function');
      expect(typeof service.integrated).toBe('function');
      expect(typeof service.health).toBe('function');
    });

    it('should handle batch predictions', async () => {
      const requests = [
        {
          type: 'emissions' as const,
          data: { features: [0.1, 0.2, 0.3, 0.4, 0.5] }
        },
        {
          type: 'optimization' as const,
          data: {
            task: OptimizationScenarios.resourceAllocation(),
            resources: [{ name: 'energy', current: 100, min: 50, max: 200 }]
          }
        }
      ];

      const responses = await integration.batchPredict(requests);

      expect(responses).toBeDefined();
      expect(Array.isArray(responses)).toBe(true);
      expect(responses).toHaveLength(2);
      expect(responses[0].type).toBe('emissions');
      expect(responses[1].type).toBe('optimization');
    });

    it('should provide system health status', async () => {
      const health = await integration.getSystemHealth();

      expect(health).toBeDefined();
      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.status);
      expect(Array.isArray(health.models)).toBe(true);
      expect(health.overallPerformance).toBeDefined();
      expect(health.overallPerformance.averageLatency).toBeGreaterThanOrEqual(0);
      expect(health.overallPerformance.throughput).toBeGreaterThanOrEqual(0);
      expect(health.overallPerformance.availability).toBeGreaterThanOrEqual(0);
      expect(health.overallPerformance.availability).toBeLessThanOrEqual(1);
    });

    it('should provide performance metrics', () => {
      const metrics = integration.getPerformanceMetrics();

      expect(Array.isArray(metrics)).toBe(true);
      
      if (metrics.length > 0) {
        const metric = metrics[0];
        expect(metric.modelName).toBeDefined();
        expect(metric.accuracy).toBeGreaterThanOrEqual(0);
        expect(metric.accuracy).toBeLessThanOrEqual(1);
        expect(metric.latency).toBeGreaterThanOrEqual(0);
        expect(metric.throughput).toBeGreaterThanOrEqual(0);
        expect(metric.errorRate).toBeGreaterThanOrEqual(0);
        expect(metric.errorRate).toBeLessThanOrEqual(1);
        expect(metric.lastUpdated).toBeInstanceOf(Date);
      }
    });

    it('should handle errors gracefully', async () => {
      const _request = {
        type: 'invalid_type' as any,
        data: {}
      };

      await expect(integration.predict(request)).rejects.toThrow();
    });
  });

  describe('Integration Tests', () => {
    it('should work end-to-end for ESG optimization scenario', async () => {
      // Create a complete ESG optimization scenario
      const integration = new ModelIntegration();
      
      const scenario = {
        type: 'multi_model' as const,
        data: {
          emissions: {
            historicalData: [
              { timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), scope1: 120, scope2: 80, scope3: 250 },
              { timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), scope1: 115, scope2: 85, scope3: 260 },
              { timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), scope1: 110, scope2: 78, scope3: 245 }
            ]
          },
          metrics: {
            data: [0.85, 0.92, 0.78, 0.88, 0.95] // Efficiency metrics
          },
          optimization: {
            task: {
              type: 'emission_reduction' as const,
              constraints: [
                { type: 'budget' as const, limit: 500000, penalty: 1.0 },
                { type: 'time' as const, limit: 180, penalty: 0.5 }
              ],
              objectives: [
                { type: 'minimize' as const, metric: 'emissions', weight: 0.7 },
                { type: 'minimize' as const, metric: 'cost', weight: 0.3 }
              ],
              timeHorizon: 180
            },
            emissionSources: [
              { name: 'facility_a', current: 120 },
              { name: 'facility_b', current: 80 },
              { name: 'transport', current: 50 }
            ]
          },
          regulatory: {
            organization: {
              id: 'esg-corp',
              name: 'ESG Manufacturing Corp',
              industry: 'manufacturing',
              size: 'large' as const,
              jurisdiction: ['US', 'EU'],
              currentCompliance: [
                {
                  framework: 'GRI',
                  status: 'partial' as const,
                  lastAssessment: new Date(),
                  gaps: [
                    {
                      requirement: 'Scope 3 disclosure',
                      description: 'Need comprehensive supply chain emissions data',
                      severity: 'high' as const,
                      estimatedEffort: 400,
                      estimatedCost: 150000
                    }
                  ]
                }
              ],
              operations: {
                emissions: { scope1: 250, scope2: 163, scope3: 755 },
                revenue: 50000000,
                employees: 1200,
                facilities: 5,
                supplyChain: {
                  suppliers: 300,
                  countries: ['US', 'Canada', 'Mexico', 'China']
                }
              }
            },
            regulations: [
              {
                id: 'sec-climate-rule',
                title: 'SEC Climate Disclosure Rule',
                content: 'Public companies must disclose climate-related risks and GHG emissions data in annual reports. Scope 3 reporting required for material emissions.',
                jurisdiction: 'US',
                effectiveDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                sector: ['manufacturing', 'public_companies'],
                source: 'SEC'
              }
            ]
          }
        },
        options: {
          includeExplanation: true,
          confidence: 0.8,
          ensemble: true
        }
      };

      const response = await integration.predict(scenario);

      // Verify comprehensive response
      expect(response).toBeDefined();
      expect(response.type).toBe('multi_model');
      expect(response.confidence).toBeGreaterThan(0.5);
      
      const prediction = response.prediction;
      expect(prediction.emissions).toBeDefined();
      expect(prediction.emissions.scope1).toBeGreaterThan(0);
      expect(prediction.emissions.scope2).toBeGreaterThan(0);
      expect(prediction.emissions.scope3).toBeGreaterThan(0);
      expect(prediction.emissions.confidence).toBeGreaterThan(0);
      
      expect(prediction.optimization).toBeDefined();
      expect(prediction.optimization.algorithm).toBeDefined();
      expect(prediction.optimization.feasible).toBe(true);
      
      expect(prediction.regulatory).toBeDefined();
      expect(prediction.regulatory.riskScore).toBeGreaterThanOrEqual(0);
      
      expect(prediction.insights).toBeDefined();
      expect(prediction.insights.summary).toBeDefined();
      expect(Array.isArray(prediction.insights.actionItems)).toBe(true);
      expect(Array.isArray(prediction.insights.riskAreas)).toBe(true);
      
      // Verify metadata
      expect(response.metadata).toBeDefined();
      expect(response.metadata.modelsUsed).toContain('emissions');
      expect(response.metadata.modelsUsed).toContain('optimization');
      expect(response.metadata.modelsUsed).toContain('regulatory');
      expect(response.metadata.processingTime).toBeGreaterThan(0);
    });
  });
});