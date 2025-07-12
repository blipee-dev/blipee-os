/**
 * Basic tests for individual algorithms to verify they work
 */

describe('Basic Algorithm Tests', () => {
  
  it('should be able to import genetic algorithm', async () => {
    const { GeneticAlgorithm } = await import('../algorithms/genetic-algorithm');
    expect(GeneticAlgorithm).toBeDefined();
    
    const ga = new GeneticAlgorithm({
      populationSize: 10,
      mutationRate: 0.1,
      crossoverRate: 0.8,
      elitism: 0.1
    });
    
    expect(ga).toBeDefined();
    expect(ga.getStatistics).toBeDefined();
  });

  it('should be able to import DQN agent', async () => {
    const { DQNAgent } = await import('../algorithms/dqn-agent');
    expect(DQNAgent).toBeDefined();
    
    const agent = new DQNAgent({
      stateSize: 5,
      actionSize: 3,
      learningRate: 0.01
    });
    
    expect(agent).toBeDefined();
    expect(agent.getAction).toBeDefined();
  });

  it('should be able to import optimization engine', async () => {
    const { OptimizationEngine } = await import('../optimization-engine');
    expect(OptimizationEngine).toBeDefined();
    
    const engine = new OptimizationEngine();
    expect(engine).toBeDefined();
  });

  it('should be able to import regulatory predictor', async () => {
    const { RegulatoryPredictor } = await import('../regulatory-predictor');
    expect(RegulatoryPredictor).toBeDefined();
    
    const predictor = new RegulatoryPredictor();
    expect(predictor).toBeDefined();
  });

  it('should test basic genetic algorithm functionality', async () => {
    const { GeneticAlgorithm } = await import('../algorithms/genetic-algorithm');
    
    const ga = new GeneticAlgorithm({
      populationSize: 20,
      mutationRate: 0.02,
      crossoverRate: 0.8,
      elitism: 0.1,
      maxGenerations: 10
    });

    const problem = {
      dimensions: 2,
      bounds: [[0, 10], [0, 10]] as Array<[number, number]>,
      fitnessFunction: (solution: number[]) => {
        // Simple sphere function - maximize distance from origin
        return Math.sqrt(solution[0] * solution[0] + solution[1] * solution[1]) / 14.14; // Normalize
      }
    };

    const result = await ga.evolve(problem, { generations: 10 });
    
    expect(result).toBeDefined();
    expect(result.genes).toHaveLength(2);
    expect(result.fitness).toBeGreaterThan(0);
    expect(result.generation).toBeGreaterThanOrEqual(0);
    expect(result.evaluations).toBeGreaterThan(0);
  });

  it('should test basic DQN agent functionality', async () => {
    const { DQNAgent, ESGEnvironment } = await import('../algorithms/dqn-agent');
    
    const agent = new DQNAgent({
      stateSize: 5,
      actionSize: 3,
      learningRate: 0.01,
      epsilon: 0.1
    });

    const state = { features: [0.1, 0.2, 0.3, 0.4, 0.5] };
    const action = agent.getAction(state);
    
    expect(action).toBeDefined();
    expect(action.index).toBeGreaterThanOrEqual(0);
    expect(action.index).toBeLessThan(3);
    
    // Test environment
    const env = new ESGEnvironment({ stateSize: 5, actionSize: 3 });
    const initialState = env.reset();
    
    expect(initialState.features).toHaveLength(5);
    
    const { nextState, reward, done } = env.step(action);
    expect(nextState.features).toHaveLength(5);
    expect(typeof reward).toBe('number');
    expect(typeof done).toBe('boolean');
  });

  it('should test basic optimization engine functionality', async () => {
    const { OptimizationEngine, OptimizationScenarios } = await import('../optimization-engine');
    
    const engine = new OptimizationEngine();
    await engine.buildModel();
    
    const task = OptimizationScenarios.resourceAllocation();
    expect(task).toBeDefined();
    expect(task.type).toBe('resource_allocation');
    expect(task.constraints).toBeDefined();
    expect(task.objectives).toBeDefined();
    
    // Test basic resource allocation
    const data = {
      resources: [
        { name: 'energy', current: 100, min: 50, max: 200, unit: 'kWh' }
      ],
      activities: [
        { name: 'production' }
      ]
    };
    
    const result = await engine.optimize(task, data);
    
    expect(result).toBeDefined();
    expect(result.algorithm).toBeDefined();
    expect(['genetic', 'reinforcement', 'hybrid']).toContain(result.algorithm);
    expect(result.feasible).toBe(true);
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('should test basic regulatory predictor functionality', async () => {
    const { RegulatoryPredictor } = await import('../regulatory-predictor');
    
    const predictor = new RegulatoryPredictor();
    await predictor.buildModel();
    
    const regulation = {
      id: 'test-reg',
      title: 'Test Regulation',
      content: 'Companies must report emissions annually with verification.',
      jurisdiction: 'US',
      effectiveDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      sector: ['manufacturing'],
      source: 'EPA'
    };
    
    const impact = await predictor.analyzeRegulation(regulation);
    
    expect(impact).toBeDefined();
    expect(impact.impactScore).toBeGreaterThan(0);
    expect(impact.impactScore).toBeLessThanOrEqual(1);
    expect(Array.isArray(impact.affectedAreas)).toBe(true);
    expect(impact.timeline).toBeDefined();
    expect(impact.costEstimate).toBeDefined();
    expect(['low', 'medium', 'high', 'critical']).toContain(impact.riskLevel);
  });
});