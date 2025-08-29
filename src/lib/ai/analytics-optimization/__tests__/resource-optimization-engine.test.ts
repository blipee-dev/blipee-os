/**
 * Tests for Resource Optimization Engine
 * Phase 7: Advanced Analytics & Optimization
 */

import { ResourceOptimizationEngine } from '../resource-optimization-engine';
import type {
  ResourceAllocationProblem,
  Resource,
  Demand,
  Objective,
  Constraint,
  OptimizationResult,
  MultiObjectiveProblem,
  StochasticOptimizationProblem,
  DynamicOptimizationProblem
} from '../resource-optimization-engine';

describe('ResourceOptimizationEngine', () => {
  let engine: ResourceOptimizationEngine;

  beforeEach(() => {
    engine = new ResourceOptimizationEngine();
  });

  describe('Resource Allocation', () => {
    it('should solve basic resource allocation problem', async () => {
      const problem: ResourceAllocationProblem = {
        resources: [
          {
            resourceId: 'solar_1',
            name: 'Solar Farm 1',
            type: 'energy',
            capacity: 500,
            availability: {
              pattern: 'constant',
              values: 1.0,
              reliability: 0.95
            },
            cost: {
              fixed: 1000,
              variable: 20,
              unit: 'USD/MWh',
              currency: 'USD'
            },
            emissions: {
              scope1: 0,
              scope2: 0,
              scope3: 10,
              unit: 'kgCO2e/MWh'
            }
          }
        ],
        demands: [
          {
            demandId: 'factory_1',
            name: 'Factory Demand',
            resourceType: 'energy',
            quantity: 200,
            priority: 10,
            timeWindow: {
              earliest: new Date(),
              latest: new Date(Date.now() + 4 * 60 * 60 * 1000)
            },
            flexibility: 0.2
          }
        ],
        objectives: [
          {
            name: 'Minimize Cost',
            type: 'minimize_cost',
            weight: 1.0
          }
        ],
        constraints: [],
        timeHorizon: {
          start: new Date(),
          end: new Date(Date.now() + 24 * 60 * 60 * 1000),
          granularity: 'hour',
          periods: 24
        }
      };

      const result = await engine.optimizeResourceAllocation(problem);
      
      expect(result).toBeDefined();
      expect(result.status).toBe('optimal');
      expect(result.allocation).toBeDefined();
      expect(result.allocation.size).toBeGreaterThan(0);
    });

    it('should handle multiple resources and demands', async () => {
      const problem: ResourceAllocationProblem = {
        resources: [
          {
            resourceId: 'solar_1',
            name: 'Solar Farm 1',
            type: 'energy',
            capacity: 500,
            availability: { pattern: 'constant', values: 1.0, reliability: 0.95 },
            cost: { fixed: 1000, variable: 20, unit: 'USD/MWh', currency: 'USD' },
            emissions: { scope1: 0, scope2: 0, scope3: 10, unit: 'kgCO2e/MWh' }
          },
          {
            resourceId: 'wind_1',
            name: 'Wind Farm 1',
            type: 'energy',
            capacity: 300,
            availability: { pattern: 'variable', values: [0.6, 0.7, 0.8], reliability: 0.90 },
            cost: { fixed: 800, variable: 25, unit: 'USD/MWh', currency: 'USD' },
            emissions: { scope1: 0, scope2: 0, scope3: 15, unit: 'kgCO2e/MWh' }
          }
        ],
        demands: [
          {
            demandId: 'factory_1',
            name: 'Factory 1',
            resourceType: 'energy',
            quantity: 200,
            priority: 10,
            timeWindow: {
              earliest: new Date(),
              latest: new Date(Date.now() + 4 * 60 * 60 * 1000)
            },
            flexibility: 0.2
          },
          {
            demandId: 'office_1',
            name: 'Office 1',
            resourceType: 'energy',
            quantity: 150,
            priority: 8,
            timeWindow: {
              earliest: new Date(),
              latest: new Date(Date.now() + 8 * 60 * 60 * 1000)
            },
            flexibility: 0.5
          }
        ],
        objectives: [
          { name: 'Minimize Cost', type: 'minimize_cost', weight: 0.6 },
          { name: 'Minimize Emissions', type: 'minimize_emissions', weight: 0.4 }
        ],
        constraints: [
          {
            name: 'Emissions Limit',
            type: 'emissions_limit',
            limit: 10000,
            enforcement: 'hard'
          }
        ],
        timeHorizon: {
          start: new Date(),
          end: new Date(Date.now() + 24 * 60 * 60 * 1000),
          granularity: 'hour',
          periods: 24
        }
      };

      const result = await engine.optimizeResourceAllocation(problem);
      
      expect(result.status).toBe('optimal');
      expect(result.totalCost).toBeGreaterThan(0);
      expect(result.totalEmissions).toBeGreaterThan(0);
      expect(result.allocation.size).toBe(2); // Should allocate for both demands
    });
  });

  describe('Multi-Objective Optimization', () => {
    it('should solve multi-objective problems', async () => {
      const problem: MultiObjectiveProblem = {
        objectives: [
          {
            type: 'minimize',
            expression: 'total_cost',
            components: [
              { name: 'energy_cost', coefficient: 1, variable: 'energy', unit: 'USD' }
            ]
          },
          {
            type: 'minimize',
            expression: 'total_emissions',
            components: [
              { name: 'carbon_emissions', coefficient: 1, variable: 'emissions', unit: 'kgCO2e' }
            ]
          }
        ],
        constraints: [
          {
            constraintId: 'demand_met',
            name: 'Meet demand',
            type: 'equality',
            leftExpression: 'total_supply',
            operator: '=',
            rightExpression: 500,
            priority: 'hard'
          }
        ],
        variables: [
          {
            variableId: 'solar_use',
            name: 'Solar energy use',
            type: 'continuous',
            lowerBound: 0,
            upperBound: 500,
            unit: 'MWh',
            category: 'allocation'
          },
          {
            variableId: 'wind_use',
            name: 'Wind energy use',
            type: 'continuous',
            lowerBound: 0,
            upperBound: 300,
            unit: 'MWh',
            category: 'allocation'
          }
        ]
      };

      const result = await engine.optimizeMultiObjective(problem);
      
      expect(result).toBeDefined();
      expect(result.paretoFront).toBeDefined();
      expect(result.paretoFront.length).toBeGreaterThan(0);
      expect(result.recommendedSolution).toBeDefined();
    });

    it('should generate Pareto frontier', async () => {
      const objectives = [
        { type: 'minimize' as const, expression: 'cost', components: [] },
        { type: 'minimize' as const, expression: 'emissions', components: [] }
      ];

      const result = await engine.generateParetoFrontier(objectives, [], []);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      // Each solution should be non-dominated
      result.forEach(solution => {
        expect(solution.objectives).toBeDefined();
        expect(solution.variables).toBeDefined();
      });
    });
  });

  describe('Stochastic Optimization', () => {
    it('should handle uncertainty in parameters', async () => {
      const problem: StochasticOptimizationProblem = {
        deterministicProblem: {
          objectives: [],
          constraints: [],
          variables: []
        },
        uncertainParameters: [
          {
            parameterId: 'solar_availability',
            name: 'Solar availability',
            distribution: {
              type: 'normal',
              mean: 0.85,
              stdDev: 0.15
            }
          }
        ],
        robustnessLevel: 0.95,
        scenarios: 100
      };

      const result = await engine.optimizeWithUncertainty(problem);
      
      expect(result).toBeDefined();
      expect(result.robustSolution).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    });
  });

  describe('Dynamic Optimization', () => {
    it('should solve time-dependent optimization problems', async () => {
      const problem: DynamicOptimizationProblem = {
        timeHorizon: {
          periods: 24,
          periodDuration: 60 // minutes
        },
        stateDynamics: {
          initialState: {
            stateVariables: {
              'battery_charge': 50,
              'cost_accumulated': 0
            },
            time: 0
          },
          transitionFunction: (state, control) => ({
            stateVariables: {
              'battery_charge': Math.max(0, Math.min(100, 
                state.stateVariables.battery_charge + (control.charge_rate || 0)
              )),
              'cost_accumulated': state.stateVariables.cost_accumulated + (control.cost || 0)
            },
            time: state.time + 1
          })
        },
        controlVariables: [
          {
            name: 'charge_rate',
            bounds: { min: -50, max: 50 },
            unit: 'MW'
          }
        ],
        objectives: [
          {
            type: 'minimize',
            expression: 'total_cost'
          }
        ],
        pathConstraints: [
          {
            expression: 'battery_charge',
            bounds: { min: 0, max: 100 }
          }
        ]
      };

      const result = await engine.solveDynamicOptimization(problem);
      
      expect(result).toBeDefined();
      expect(result.controlTrajectory).toBeDefined();
      expect(result.controlTrajectory.length).toBe(24);
      expect(result.stateTrajectory).toBeDefined();
    });
  });

  describe('Sensitivity Analysis', () => {
    it('should perform sensitivity analysis', async () => {
      const baseResult: OptimizationResult = {
        status: 'optimal',
        allocation: new Map([
          ['resource_1', [{ demandId: 'demand_1', quantity: 100, time: 0 }]]
        ]),
        totalCost: 5000,
        totalEmissions: 1000,
        resourceUtilization: new Map([['resource_1', 0.5]]),
        unmetDemand: [],
        executionTime: 100,
        iterations: 10,
        gap: 0
      };

      const parameters = [
        { name: 'cost', baseValue: 20, range: { min: 15, max: 25 } },
        { name: 'emissions', baseValue: 10, range: { min: 5, max: 15 } }
      ];

      const sensitivity = await engine.performSensitivityAnalysis(baseResult, parameters);
      
      expect(sensitivity).toBeDefined();
      expect(sensitivity.parameters).toHaveLength(2);
      sensitivity.parameters.forEach(param => {
        expect(param.impact).toBeDefined();
        expect(param.elasticity).toBeDefined();
      });
    });
  });

  describe('Performance and Constraints', () => {
    it('should respect hard constraints', async () => {
      const problem: ResourceAllocationProblem = {
        resources: [{
          resourceId: 'limited_resource',
          name: 'Limited Resource',
          type: 'energy',
          capacity: 100,
          availability: { pattern: 'constant', values: 1.0, reliability: 1.0 },
          cost: { fixed: 0, variable: 10, unit: 'USD/unit', currency: 'USD' },
          emissions: { scope1: 5, scope2: 0, scope3: 0, unit: 'kg/unit' }
        }],
        demands: [{
          demandId: 'high_demand',
          name: 'High Demand',
          resourceType: 'energy',
          quantity: 200, // More than available
          priority: 10,
          timeWindow: {
            earliest: new Date(),
            latest: new Date(Date.now() + 1000)
          },
          flexibility: 0
        }],
        objectives: [{ name: 'Minimize Cost', type: 'minimize_cost', weight: 1.0 }],
        constraints: [{
          name: 'Capacity Limit',
          type: 'capacity',
          limit: 100,
          enforcement: 'hard'
        }],
        timeHorizon: {
          start: new Date(),
          end: new Date(Date.now() + 3600000),
          granularity: 'hour',
          periods: 1
        }
      };

      const result = await engine.optimizeResourceAllocation(problem);
      
      expect(result.status).toBe('infeasible');
      expect(result.unmetDemand.length).toBeGreaterThan(0);
    });

    it('should complete optimization within time limit', async () => {
      const startTime = Date.now();
      
      // Create a moderately complex problem
      const problem = createComplexProblem();
      
      const result = await engine.optimizeResourceAllocation(problem);
      const executionTime = Date.now() - startTime;
      
      expect(executionTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(result.executionTime).toBeDefined();
    });
  });
});

// Helper function to create complex test problem
function createComplexProblem(): ResourceAllocationProblem {
  const resources: Resource[] = [];
  const demands: Demand[] = [];
  
  // Create 10 resources
  for (let i = 0; i < 10; i++) {
    resources.push({
      resourceId: `resource_${i}`,
      name: `Resource ${i}`,
      type: 'energy',
      capacity: Math.random() * 500 + 100,
      availability: {
        pattern: 'constant',
        values: 0.9 + Math.random() * 0.1,
        reliability: 0.95
      },
      cost: {
        fixed: Math.random() * 1000,
        variable: Math.random() * 50 + 10,
        unit: 'USD/MWh',
        currency: 'USD'
      },
      emissions: {
        scope1: Math.random() * 100,
        scope2: Math.random() * 50,
        scope3: Math.random() * 20,
        unit: 'kgCO2e/MWh'
      }
    });
  }
  
  // Create 20 demands
  for (let i = 0; i < 20; i++) {
    demands.push({
      demandId: `demand_${i}`,
      name: `Demand ${i}`,
      resourceType: 'energy',
      quantity: Math.random() * 100 + 50,
      priority: Math.floor(Math.random() * 10) + 1,
      timeWindow: {
        earliest: new Date(),
        latest: new Date(Date.now() + Math.random() * 8 * 60 * 60 * 1000)
      },
      flexibility: Math.random() * 0.5
    });
  }
  
  return {
    resources,
    demands,
    objectives: [
      { name: 'Minimize Cost', type: 'minimize_cost', weight: 0.5 },
      { name: 'Minimize Emissions', type: 'minimize_emissions', weight: 0.5 }
    ],
    constraints: [
      { name: 'Budget', type: 'budget', limit: 50000, enforcement: 'soft' },
      { name: 'Emissions', type: 'emissions_limit', limit: 10000, enforcement: 'hard' }
    ],
    timeHorizon: {
      start: new Date(),
      end: new Date(Date.now() + 24 * 60 * 60 * 1000),
      granularity: 'hour',
      periods: 24
    }
  };
}