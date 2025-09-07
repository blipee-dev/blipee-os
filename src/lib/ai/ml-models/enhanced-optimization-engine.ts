/**
 * Enhanced Optimization Engine for Phase 5
 * Genetic Algorithm + Reinforcement Learning for ESG optimization
 */

interface Resource {
  name: string;
  min: number;
  max: number;
  cost: number;
  emissions: number;
  efficiency: number;
}

interface Constraint {
  type: 'budget' | 'emissions' | 'efficiency' | 'regulatory';
  value: number;
  operator: '<=' | '>=' | '=';
}

interface Objective {
  name: string;
  weight: number;
  minimize: boolean;
  target?: number;
}

interface OptimizationResult {
  allocation: Record<string, number>;
  expectedImpact: {
    cost: number;
    emissions: number;
    efficiency: number;
  };
  confidence: number;
  implementationPlan: ImplementationPlan;
  alternatives?: OptimizationResult[];
}

interface ImplementationPlan {
  steps: Array<{
    action: string;
    timeline: string;
    impact: string;
    risk: 'low' | 'medium' | 'high';
    cost: number;
    dependencies?: string[];
  }>;
  totalDuration: string;
  totalCost: number;
  riskAssessment: {
    overall: 'low' | 'medium' | 'high';
    factors: string[];
  };
  rollbackPlan: string;
}

interface Individual {
  genes: number[];
  fitness: number;
  objectives: {
    cost: number;
    emissions: number;
    efficiency: number;
  };
  feasible: boolean;
}

class GeneticAlgorithm {
  private populationSize: number;
  private mutationRate: number;
  private crossoverRate: number;
  private elitism: number;
  private maxGenerations: number;
  private resources: Resource[];
  private constraints: Constraint[];
  private objectives: Objective[];

  constructor(config: {
    populationSize: number;
    mutationRate: number;
    crossoverRate: number;
    elitism: number;
    maxGenerations?: number;
  }) {
    this.populationSize = config.populationSize;
    this.mutationRate = config.mutationRate;
    this.crossoverRate = config.crossoverRate;
    this.elitism = config.elitism;
    this.maxGenerations = config.maxGenerations || 1000;
  }

  async optimize(
    resources: Resource[],
    constraints: Constraint[],
    objectives: Objective[]
  ): Promise<Individual> {
    console.log('🧬 Starting genetic algorithm optimization...');
    
    this.resources = resources;
    this.constraints = constraints;
    this.objectives = objectives;
    
    // Initialize population
    let population = this.initializePopulation();
    
    let bestFitness = -Infinity;
    let stagnationCount = 0;
    const maxStagnation = 50;
    
    for (let generation = 0; generation < this.maxGenerations; generation++) {
      // Evaluate fitness
      population = population.map(individual => this.evaluateFitness(individual));
      
      // Sort by fitness
      population.sort((a, b) => b.fitness - a.fitness);
      
      const currentBest = population[0].fitness;
      if (currentBest > bestFitness) {
        bestFitness = currentBest;
        stagnationCount = 0;
      } else {
        stagnationCount++;
      }
      
      // Early stopping
      if (stagnationCount >= maxStagnation) {
        console.log(`🏁 Converged at generation ${generation}`);
        break;
      }
      
      // Progress logging
      if (generation % 100 === 0) {
        console.log(`Generation ${generation}: Best fitness = ${bestFitness.toFixed(4)}`);
      }
      
      // Create next generation
      const newPopulation: Individual[] = [];
      
      // Elitism - keep best individuals
      const eliteCount = Math.floor(this.populationSize * this.elitism);
      newPopulation.push(...population.slice(0, eliteCount));
      
      // Generate offspring
      while (newPopulation.length < this.populationSize) {
        const parent1 = this.tournamentSelection(population);
        const parent2 = this.tournamentSelection(population);
        
        let offspring1 = { ...parent1 };
        let offspring2 = { ...parent2 };
        
        // Crossover
        if (Math.random() < this.crossoverRate) {
          [offspring1, offspring2] = this.crossover(parent1, parent2);
        }
        
        // Mutation
        if (Math.random() < this.mutationRate) {
          offspring1 = this.mutate(offspring1);
        }
        if (Math.random() < this.mutationRate) {
          offspring2 = this.mutate(offspring2);
        }
        
        newPopulation.push(offspring1);
        if (newPopulation.length < this.populationSize) {
          newPopulation.push(offspring2);
        }
      }
      
      population = newPopulation;
    }
    
    // Return best solution
    const finalPopulation = population.map(individual => this.evaluateFitness(individual));
    finalPopulation.sort((a, b) => b.fitness - a.fitness);
    
    console.log(`✅ Genetic algorithm completed with fitness: ${finalPopulation[0].fitness.toFixed(4)}`);
    return finalPopulation[0];
  }

  private initializePopulation(): Individual[] {
    const population: Individual[] = [];
    
    for (let i = 0; i < this.populationSize; i++) {
      const genes = this.resources.map(resource => {
        return resource.min + Math.random() * (resource.max - resource.min);
      });
      
      population.push({
        genes,
        fitness: 0,
        objectives: { cost: 0, emissions: 0, efficiency: 0 },
        feasible: false
      });
    }
    
    return population;
  }

  private evaluateFitness(individual: Individual): Individual {
    // Calculate objectives
    let totalCost = 0;
    let totalEmissions = 0;
    let totalEfficiency = 0;
    
    for (let i = 0; i < individual.genes.length; i++) {
      const allocation = individual.genes[i];
      const resource = this.resources[i];
      
      totalCost += allocation * resource.cost;
      totalEmissions += allocation * resource.emissions;
      totalEfficiency += allocation * resource.efficiency;
    }
    
    individual.objectives = {
      cost: totalCost,
      emissions: totalEmissions,
      efficiency: totalEfficiency
    };
    
    // Check constraints
    individual.feasible = this.checkConstraints(individual.objectives);
    
    // Calculate fitness (multi-objective)
    let fitness = 0;
    for (const objective of this.objectives) {
      const value = individual.objectives[objective.name as keyof typeof individual.objectives];
      if (objective.minimize) {
        fitness -= objective.weight * value;
      } else {
        fitness += objective.weight * value;
      }
    }
    
    // Penalty for infeasible solutions
    if (!individual.feasible) {
      fitness *= 0.1;
    }
    
    individual.fitness = fitness;
    return individual;
  }

  private checkConstraints(objectives: { cost: number; emissions: number; efficiency: number }): boolean {
    for (const constraint of this.constraints) {
      const value = objectives[constraint.type as keyof typeof objectives] || 0;
      
      switch (constraint.operator) {
        case '<=':
          if (value > constraint.value) return false;
          break;
        case '>=':
          if (value < constraint.value) return false;
          break;
        case '=':
          if (Math.abs(value - constraint.value) > 0.01) return false;
          break;
      }
    }
    return true;
  }

  private tournamentSelection(population: Individual[]): Individual {
    const tournamentSize = 3;
    const tournament: Individual[] = [];
    
    for (let i = 0; i < tournamentSize; i++) {
      const randomIndex = Math.floor(Math.random() * population.length);
      tournament.push(population[randomIndex]);
    }
    
    tournament.sort((a, b) => b.fitness - a.fitness);
    return { ...tournament[0] };
  }

  private crossover(parent1: Individual, parent2: Individual): [Individual, Individual] {
    const offspring1 = { ...parent1, genes: [...parent1.genes] };
    const offspring2 = { ...parent2, genes: [...parent2.genes] };
    
    // Single-point crossover
    const crossoverPoint = Math.floor(Math.random() * parent1.genes.length);
    
    for (let i = crossoverPoint; i < parent1.genes.length; i++) {
      offspring1.genes[i] = parent2.genes[i];
      offspring2.genes[i] = parent1.genes[i];
    }
    
    return [offspring1, offspring2];
  }

  private mutate(individual: Individual): Individual {
    const mutated = { ...individual, genes: [...individual.genes] };
    
    for (let i = 0; i < mutated.genes.length; i++) {
      if (Math.random() < 0.1) { // Gene mutation probability
        const resource = this.resources[i];
        const range = resource.max - resource.min;
        const mutation = (Math.random() - 0.5) * range * 0.1; // 10% of range
        
        mutated.genes[i] = Math.max(resource.min, 
          Math.min(resource.max, mutated.genes[i] + mutation));
      }
    }
    
    return mutated;
  }
}

class ReinforcementLearningAgent {
  private qTable: Map<string, Map<string, number>> = new Map();
  private learningRate: number = 0.1;
  private discountFactor: number = 0.9;
  private explorationRate: number = 0.1;

  async refineAllocation(
    initialAllocation: number[],
    resources: Resource[],
    constraints: Constraint[],
    objectives: Objective[]
  ): Promise<{
    allocation: number[];
    confidence: number;
    learningSteps: number;
  }> {
    console.log('🤖 Refining allocation with reinforcement learning...');
    
    let currentAllocation = [...initialAllocation];
    let bestAllocation = [...initialAllocation];
    let bestReward = this.calculateReward(initialAllocation, resources, objectives);
    
    const maxSteps = 1000;
    let improvementCount = 0;
    
    for (let step = 0; step < maxSteps; step++) {
      const state = this.encodeState(currentAllocation);
      const action = this.chooseAction(state, resources.length);
      
      // Apply action
      const newAllocation = this.applyAction(currentAllocation, action, resources);
      const reward = this.calculateReward(newAllocation, resources, objectives);
      
      // Check if feasible
      const objectives_calc = this.calculateObjectives(newAllocation, resources);
      const feasible = this.checkConstraints(objectives_calc, constraints);
      
      if (feasible && reward > bestReward) {
        bestAllocation = [...newAllocation];
        bestReward = reward;
        improvementCount++;
      }
      
      // Update Q-table
      this.updateQValue(state, action, reward);
      
      currentAllocation = feasible ? newAllocation : currentAllocation;
      
      // Decay exploration rate
      this.explorationRate *= 0.999;
    }
    
    const confidence = Math.min(0.95, 0.5 + (improvementCount / 100));
    
    console.log(`✅ RL refinement completed with ${improvementCount} improvements`);
    
    return {
      allocation: bestAllocation,
      confidence,
      learningSteps: maxSteps
    };
  }

  private encodeState(allocation: number[]): string {
    // Discretize allocation for state representation
    return allocation.map(x => Math.floor(x / 10).toString()).join(',');
  }

  private chooseAction(state: string, numResources: number): string {
    if (Math.random() < this.explorationRate) {
      // Explore: random action
      const resourceIndex = Math.floor(Math.random() * numResources);
      const adjustment = Math.random() < 0.5 ? 'increase' : 'decrease';
      return `${resourceIndex}_${adjustment}`;
    } else {
      // Exploit: best known action
      const stateActions = this.qTable.get(state);
      if (!stateActions || stateActions.size === 0) {
        // No Q-values yet, random action
        const resourceIndex = Math.floor(Math.random() * numResources);
        const adjustment = Math.random() < 0.5 ? 'increase' : 'decrease';
        return `${resourceIndex}_${adjustment}`;
      }
      
      let bestAction = '';
      let bestValue = -Infinity;
      for (const [action, value] of Array.from(stateActions.entries())) {
        if (value > bestValue) {
          bestValue = value;
          bestAction = action;
        }
      }
      return bestAction;
    }
  }

  private applyAction(allocation: number[], action: string, resources: Resource[]): number[] {
    const [resourceIndexStr, adjustment] = action.split('_');
    const resourceIndex = parseInt(resourceIndexStr);
    
    if (resourceIndex >= resources.length) {
      return [...allocation];
    }
    
    const newAllocation = [...allocation];
    const resource = resources[resourceIndex];
    const adjustmentSize = (resource.max - resource.min) * 0.05; // 5% of range
    
    if (adjustment === 'increase') {
      newAllocation[resourceIndex] = Math.min(resource.max, 
        newAllocation[resourceIndex] + adjustmentSize);
    } else {
      newAllocation[resourceIndex] = Math.max(resource.min, 
        newAllocation[resourceIndex] - adjustmentSize);
    }
    
    return newAllocation;
  }

  private calculateReward(allocation: number[], resources: Resource[], objectives: Objective[]): number {
    const calculated = this.calculateObjectives(allocation, resources);
    
    let reward = 0;
    for (const objective of objectives) {
      const value = calculated[objective.name as keyof typeof calculated];
      if (objective.minimize) {
        reward -= objective.weight * value;
      } else {
        reward += objective.weight * value;
      }
    }
    
    return reward;
  }

  private calculateObjectives(allocation: number[], resources: Resource[]): { cost: number; emissions: number; efficiency: number } {
    let cost = 0, emissions = 0, efficiency = 0;
    
    for (let i = 0; i < allocation.length; i++) {
      cost += allocation[i] * resources[i].cost;
      emissions += allocation[i] * resources[i].emissions;
      efficiency += allocation[i] * resources[i].efficiency;
    }
    
    return { cost, emissions, efficiency };
  }

  private checkConstraints(objectives: { cost: number; emissions: number; efficiency: number }, constraints: Constraint[]): boolean {
    for (const constraint of constraints) {
      const value = objectives[constraint.type as keyof typeof objectives] || 0;
      
      switch (constraint.operator) {
        case '<=':
          if (value > constraint.value) return false;
          break;
        case '>=':
          if (value < constraint.value) return false;
          break;
        case '=':
          if (Math.abs(value - constraint.value) > 0.01) return false;
          break;
      }
    }
    return true;
  }

  private updateQValue(state: string, action: string, reward: number): void {
    if (!this.qTable.has(state)) {
      this.qTable.set(state, new Map());
    }
    
    const stateActions = this.qTable.get(state)!;
    const currentQ = stateActions.get(action) || 0;
    
    // Q-learning update
    const newQ = currentQ + this.learningRate * (reward - currentQ);
    stateActions.set(action, newQ);
  }
}

export class OptimizationEngine {
  private ga: GeneticAlgorithm;
  private rl: ReinforcementLearningAgent;
  private config: {
    algorithms: string[];
    populationSize: number;
    maxGenerations: number;
  };

  constructor(config: { algorithms: string[]; populationSize: number }) {
    this.config = {
      ...config,
      maxGenerations: 1000
    };
    
    this.ga = new GeneticAlgorithm({
      populationSize: config.populationSize,
      mutationRate: 0.01,
      crossoverRate: 0.7,
      elitism: 0.1
    });
    
    this.rl = new ReinforcementLearningAgent();
  }

  /**
   * Optimize resource allocation using hybrid GA + RL approach
   */
  async optimizeResourceAllocation(
    resources: Resource[],
    constraints: Constraint[],
    objectives: Objective[]
  ): Promise<OptimizationResult> {
    console.log('⚡ Starting resource allocation optimization...');
    
    try {
      // Phase 1: Genetic Algorithm for global optimization
      const gaResult = await this.ga.optimize(resources, constraints, objectives);
      
      if (!gaResult.feasible) {
        throw new Error('No feasible solution found');
      }
      
      // Phase 2: Reinforcement Learning for local refinement
      const rlResult = await this.rl.refineAllocation(
        gaResult.genes,
        resources,
        constraints,
        objectives
      );
      
      // Convert allocation to resource mapping
      const allocation: Record<string, number> = {};
      for (let i = 0; i < resources.length; i++) {
        allocation[resources[i].name] = rlResult.allocation[i];
      }
      
      // Calculate final impact
      const expectedImpact = this.calculateImpact(rlResult.allocation, resources);
      
      // Generate implementation plan
      const implementationPlan = this.generateImplementationPlan(
        allocation,
        resources,
        expectedImpact
      );
      
      console.log('✅ Resource allocation optimization completed');
      
      return {
        allocation,
        expectedImpact,
        confidence: rlResult.confidence,
        implementationPlan
      };
      
    } catch (error) {
      console.error('❌ Optimization failed:', error);
      throw error;
    }
  }

  /**
   * Train optimizers with historical data
   */
  async trainOptimizers(historicalData: any[]): Promise<{ trained: boolean; iterations: number }> {
    console.log('🎯 Training optimization models...');
    
    // Simulate training with historical data
    // In a real implementation, this would use historical allocation decisions
    // and their outcomes to improve the optimization algorithms
    
    let iterations = 0;
    
    // Train RL agent with historical decisions
    for (const data of historicalData.slice(0, 100)) { // Limit for demo
      if (data.allocation && data.outcome) {
        // Simulate Q-table updates based on historical performance
        iterations++;
      }
    }
    
    console.log(`✅ Optimization models trained with ${iterations} iterations`);
    
    return {
      trained: true,
      iterations
    };
  }

  /**
   * Get optimization metrics
   */
  getMetrics(): {
    algorithms: string[];
    populationSize: number;
    trained: boolean;
  } {
    return {
      algorithms: this.config.algorithms,
      populationSize: this.config.populationSize,
      trained: true
    };
  }

  /**
   * Check if models are trained
   */
  isTrained(): boolean {
    return true; // Algorithms don't require explicit training
  }

  // Private helper methods
  
  private calculateImpact(allocation: number[], resources: Resource[]): {
    cost: number;
    emissions: number;
    efficiency: number;
  } {
    let cost = 0, emissions = 0, efficiency = 0;
    
    for (let i = 0; i < allocation.length; i++) {
      cost += allocation[i] * resources[i].cost;
      emissions += allocation[i] * resources[i].emissions;
      efficiency += allocation[i] * resources[i].efficiency;
    }
    
    return { cost, emissions, efficiency };
  }

  private generateImplementationPlan(
    allocation: Record<string, number>,
    resources: Resource[],
    impact: { cost: number; emissions: number; efficiency: number }
  ): ImplementationPlan {
    const steps = [];
    let totalCost = 0;
    
    // Generate implementation steps based on allocation
    for (const [resourceName, amount] of Object.entries(allocation)) {
      const resource = resources.find(r => r.name === resourceName);
      if (!resource || amount <= resource.min) continue;
      
      const stepCost = (amount - resource.min) * resource.cost;
      totalCost += stepCost;
      
      // Determine timeline based on resource type and amount
      const timeline = this.calculateTimeline(resourceName, amount);
      const risk = this.assessRisk(resourceName, amount);
      
      steps.push({
        action: `Allocate ${amount.toFixed(2)} units to ${resourceName}`,
        timeline,
        impact: `Reduce emissions by ${(amount * resource.emissions * -0.1).toFixed(1)} tons CO2e`,
        risk,
        cost: stepCost,
        dependencies: this.findDependencies(resourceName)
      });
    }
    
    // Sort steps by dependencies and timeline
    steps.sort((a, b) => a.cost - b.cost); // Prioritize by cost for now
    
    const maxTimeline = Math.max(...steps.map(s => this.parseTimeline(s.timeline)));
    const riskFactors = steps.filter(s => s.risk === 'high').map(s => s.action);
    
    return {
      steps,
      totalDuration: `${maxTimeline} weeks`,
      totalCost,
      riskAssessment: {
        overall: riskFactors.length > 0 ? 'high' : steps.some(s => s.risk === 'medium') ? 'medium' : 'low',
        factors: riskFactors.length > 0 ? riskFactors : ['No significant risks identified']
      },
      rollbackPlan: 'Revert to previous allocation settings within 24 hours if performance degrades'
    };
  }

  private calculateTimeline(resourceName: string, amount: number): string {
    // Simple heuristic for timeline based on resource type
    if (resourceName.toLowerCase().includes('energy')) {
      return '2-4 weeks';
    } else if (resourceName.toLowerCase().includes('equipment')) {
      return '6-12 weeks';
    } else if (resourceName.toLowerCase().includes('process')) {
      return '1-3 weeks';
    }
    return '2-6 weeks';
  }

  private assessRisk(resourceName: string, amount: number): 'low' | 'medium' | 'high' {
    // Risk assessment heuristics
    if (amount > 1000 || resourceName.toLowerCase().includes('critical')) {
      return 'high';
    } else if (amount > 500 || resourceName.toLowerCase().includes('process')) {
      return 'medium';
    }
    return 'low';
  }

  private findDependencies(resourceName: string): string[] {
    // Simplified dependency mapping
    const dependencies: Record<string, string[]> = {
      'hvac_optimization': ['building_automation'],
      'process_improvement': ['staff_training'],
      'equipment_upgrade': ['maintenance_schedule']
    };
    
    return dependencies[resourceName] || [];
  }

  private parseTimeline(timeline: string): number {
    // Extract weeks from timeline string
    const match = timeline.match(/\d+/);
    return match ? parseInt(match[0]) : 4;
  }
}
