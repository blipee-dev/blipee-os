/**
 * Phase 7: Advanced Optimization Algorithms
 * Particle Swarm Optimization, Simulated Annealing, and Genetic Algorithms
 * for ESG performance optimization and sustainability target achievement
 */

interface OptimizationVariable {
  name: string;
  min: number;
  max: number;
  type: 'continuous' | 'discrete' | 'integer';
  unit?: string;
  description?: string;
}

interface OptimizationConstraint {
  name: string;
  type: 'equality' | 'inequality';
  expression: (variables: Record<string, number>) => number;
  limit: number;
  description?: string;
}

interface OptimizationObjective {
  name: string;
  type: 'minimize' | 'maximize';
  weight: number;
  evaluate: (variables: Record<string, number>) => number;
  description?: string;
}

interface OptimizationResult {
  variables: Record<string, number>;
  objectiveValue: number;
  constraintViolations: number;
  iterations: number;
  convergenceHistory: number[];
  feasible: boolean;
  executionTime: number;
}

interface OptimizationProblem {
  name: string;
  variables: OptimizationVariable[];
  objectives: OptimizationObjective[];
  constraints: OptimizationConstraint[];
  maxIterations?: number;
  tolerance?: number;
}

class AdvancedOptimizationEngine {
  private results: Map<string, OptimizationResult[]> = new Map();

  /**
   * Particle Swarm Optimization Algorithm
   * Excellent for continuous optimization problems
   */
  async particleSwarmOptimization(
    problem: OptimizationProblem,
    options: {
      swarmSize?: number;
      maxIterations?: number;
      inertiaWeight?: number;
      cognitiveCoefficient?: number;
      socialCoefficient?: number;
      tolerance?: number;
    } = {}
  ): Promise<OptimizationResult> {
    const startTime = Date.now();

    // PSO Parameters
    const swarmSize = options.swarmSize || 30;
    const maxIterations = options.maxIterations || problem.maxIterations || 1000;
    const w = options.inertiaWeight || 0.7;
    const c1 = options.cognitiveCoefficient || 2.0;
    const c2 = options.socialCoefficient || 2.0;
    const tolerance = options.tolerance || problem.tolerance || 1e-6;

    // Initialize particles
    const particles = this.initializeParticles(problem, swarmSize);
    let globalBest = this.findGlobalBest(particles, problem);
    const convergenceHistory: number[] = [];

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      for (const particle of particles) {
        // Update velocity and position
        this.updateParticleVelocity(particle, globalBest, w, c1, c2);
        this.updateParticlePosition(particle, problem);

        // Evaluate new position
        const fitness = this.evaluateParticle(particle.position, problem);

        // Update personal best
        if (fitness < particle.bestFitness) {
          particle.bestPosition = { ...particle.position };
          particle.bestFitness = fitness;
        }
      }

      // Update global best
      const newGlobalBest = this.findGlobalBest(particles, problem);
      if (newGlobalBest.fitness < globalBest.fitness) {
        globalBest = newGlobalBest;
      }

      convergenceHistory.push(globalBest.fitness);

      // Check convergence
      if (iteration > 10 && this.checkConvergence(convergenceHistory.slice(-10), tolerance)) {
        break;
      }
    }

    const result: OptimizationResult = {
      variables: globalBest.position,
      objectiveValue: globalBest.fitness,
      constraintViolations: this.countConstraintViolations(globalBest.position, problem),
      iterations: convergenceHistory.length,
      convergenceHistory,
      feasible: this.isFeasible(globalBest.position, problem),
      executionTime: Date.now() - startTime
    };

    this.storeResult(problem.name, result);
    return result;
  }

  /**
   * Simulated Annealing Algorithm
   * Excellent for discrete optimization and escaping local minima
   */
  async simulatedAnnealing(
    problem: OptimizationProblem,
    options: {
      initialTemperature?: number;
      finalTemperature?: number;
      coolingRate?: number;
      maxIterations?: number;
      temperatureSchedule?: 'exponential' | 'linear' | 'logarithmic';
    } = {}
  ): Promise<OptimizationResult> {
    const startTime = Date.now();

    // SA Parameters
    const initialTemp = options.initialTemperature || 1000;
    const finalTemp = options.finalTemperature || 1e-8;
    const coolingRate = options.coolingRate || 0.95;
    const maxIterations = options.maxIterations || problem.maxIterations || 10000;
    const schedule = options.temperatureSchedule || 'exponential';

    // Initialize solution
    let currentSolution = this.generateRandomSolution(problem);
    let currentFitness = this.evaluateParticle(currentSolution, problem);

    let bestSolution = { ...currentSolution };
    let bestFitness = currentFitness;

    const convergenceHistory: number[] = [];
    let temperature = initialTemp;

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      // Generate neighbor solution
      const neighborSolution = this.generateNeighborSolution(currentSolution, problem, temperature);
      const neighborFitness = this.evaluateParticle(neighborSolution, problem);

      // Accept or reject neighbor
      const delta = neighborFitness - currentFitness;
      const probability = delta < 0 ? 1 : Math.exp(-delta / temperature);

      if (Math.random() < probability) {
        currentSolution = neighborSolution;
        currentFitness = neighborFitness;
      }

      // Update best solution
      if (currentFitness < bestFitness) {
        bestSolution = { ...currentSolution };
        bestFitness = currentFitness;
      }

      convergenceHistory.push(bestFitness);

      // Cool down temperature
      temperature = this.updateTemperature(initialTemp, iteration, maxIterations, schedule, coolingRate);

      // Early termination
      if (temperature < finalTemp) break;
    }

    const result: OptimizationResult = {
      variables: bestSolution,
      objectiveValue: bestFitness,
      constraintViolations: this.countConstraintViolations(bestSolution, problem),
      iterations: convergenceHistory.length,
      convergenceHistory,
      feasible: this.isFeasible(bestSolution, problem),
      executionTime: Date.now() - startTime
    };

    this.storeResult(problem.name, result);
    return result;
  }

  /**
   * Genetic Algorithm
   * Excellent for complex multi-objective optimization
   */
  async geneticAlgorithm(
    problem: OptimizationProblem,
    options: {
      populationSize?: number;
      maxGenerations?: number;
      crossoverRate?: number;
      mutationRate?: number;
      elitismRate?: number;
      selectionMethod?: 'tournament' | 'roulette' | 'rank';
    } = {}
  ): Promise<OptimizationResult> {
    const startTime = Date.now();

    // GA Parameters
    const populationSize = options.populationSize || 50;
    const maxGenerations = options.maxGenerations || problem.maxIterations || 500;
    const crossoverRate = options.crossoverRate || 0.8;
    const mutationRate = options.mutationRate || 0.1;
    const elitismRate = options.elitismRate || 0.1;
    const selectionMethod = options.selectionMethod || 'tournament';

    // Initialize population
    let population = this.initializePopulation(problem, populationSize);
    let bestSolution = this.findBestIndividual(population, problem);
    const convergenceHistory: number[] = [];

    for (let generation = 0; generation < maxGenerations; generation++) {
      // Evaluate population
      const fitness = population.map(individual => this.evaluateParticle(individual, problem));

      // Selection
      const selected = this.selection(population, fitness, selectionMethod);

      // Crossover
      const offspring = this.crossover(selected, crossoverRate, problem);

      // Mutation
      this.mutation(offspring, mutationRate, problem);

      // Elitism - keep best solutions
      const eliteCount = Math.floor(populationSize * elitismRate);
      const elite = this.selectElite(population, fitness, eliteCount);

      // Form new population
      population = [...elite, ...offspring.slice(0, populationSize - eliteCount)];

      // Update best solution
      const currentBest = this.findBestIndividual(population, problem);
      if (this.evaluateParticle(currentBest, problem) < this.evaluateParticle(bestSolution, problem)) {
        bestSolution = currentBest;
      }

      convergenceHistory.push(this.evaluateParticle(bestSolution, problem));
    }

    const result: OptimizationResult = {
      variables: bestSolution,
      objectiveValue: this.evaluateParticle(bestSolution, problem),
      constraintViolations: this.countConstraintViolations(bestSolution, problem),
      iterations: convergenceHistory.length,
      convergenceHistory,
      feasible: this.isFeasible(bestSolution, problem),
      executionTime: Date.now() - startTime
    };

    this.storeResult(problem.name, result);
    return result;
  }

  /**
   * Multi-objective optimization using NSGA-II
   */
  async multiObjectiveOptimization(
    problem: OptimizationProblem,
    options: {
      populationSize?: number;
      maxGenerations?: number;
      crossoverRate?: number;
      mutationRate?: number;
    } = {}
  ): Promise<OptimizationResult[]> {
    const startTime = Date.now();

    const populationSize = options.populationSize || 100;
    const maxGenerations = options.maxGenerations || 250;

    // Initialize population
    let population = this.initializePopulation(problem, populationSize);
    const paretoFront: OptimizationResult[] = [];

    for (let generation = 0; generation < maxGenerations; generation++) {
      // Non-dominated sorting
      const fronts = this.nonDominatedSort(population, problem);

      // Crowding distance calculation
      for (const front of fronts) {
        this.calculateCrowdingDistance(front, problem);
      }

      // Selection for next generation
      population = this.environmentalSelection(fronts, populationSize);

      // Genetic operators
      const offspring = this.crossover(population, options.crossoverRate || 0.9, problem);
      this.mutation(offspring, options.mutationRate || 0.1, problem);

      // Combine parent and offspring populations
      population = [...population, ...offspring];
    }

    // Extract final Pareto front
    const finalFronts = this.nonDominatedSort(population, problem);

    return finalFronts[0].map(solution => ({
      variables: solution,
      objectiveValue: this.evaluateParticle(solution, problem),
      constraintViolations: this.countConstraintViolations(solution, problem),
      iterations: maxGenerations,
      convergenceHistory: [],
      feasible: this.isFeasible(solution, problem),
      executionTime: Date.now() - startTime
    }));
  }

  /**
   * Create sustainability optimization problems
   */
  createCarbonOptimizationProblem(): OptimizationProblem {
    return {
      name: 'Carbon Footprint Minimization',
      variables: [
        { name: 'renewable_energy_pct', min: 0, max: 100, type: 'continuous', unit: '%' },
        { name: 'energy_efficiency_improvement', min: 0, max: 50, type: 'continuous', unit: '%' },
        { name: 'transport_electrification', min: 0, max: 100, type: 'continuous', unit: '%' },
        { name: 'supply_chain_optimization', min: 0, max: 30, type: 'continuous', unit: '%' },
        { name: 'carbon_offset_investment', min: 0, max: 1000000, type: 'continuous', unit: 'USD' }
      ],
      objectives: [
        {
          name: 'Carbon Emissions',
          type: 'minimize',
          weight: 0.6,
          evaluate: (vars) => {
            const baseEmissions = 10000; // tonnes CO2e
            const renewableReduction = (vars.renewable_energy_pct / 100) * 0.4;
            const efficiencyReduction = (vars.energy_efficiency_improvement / 100) * 0.3;
            const transportReduction = (vars.transport_electrification / 100) * 0.2;
            const supplyChainReduction = (vars.supply_chain_optimization / 100) * 0.15;
            const offsetReduction = (vars.carbon_offset_investment / 1000000) * 0.1;

            return baseEmissions * (1 - renewableReduction - efficiencyReduction - transportReduction - supplyChainReduction - offsetReduction);
          }
        },
        {
          name: 'Total Cost',
          type: 'minimize',
          weight: 0.4,
          evaluate: (vars) => {
            const renewableCost = vars.renewable_energy_pct * 5000;
            const efficiencyCost = vars.energy_efficiency_improvement * 3000;
            const transportCost = vars.transport_electrification * 4000;
            const supplyChainCost = vars.supply_chain_optimization * 2000;
            const offsetCost = vars.carbon_offset_investment;

            return renewableCost + efficiencyCost + transportCost + supplyChainCost + offsetCost;
          }
        }
      ],
      constraints: [
        {
          name: 'Budget Constraint',
          type: 'inequality',
          expression: (vars) => vars.renewable_energy_pct * 5000 + vars.energy_efficiency_improvement * 3000 + vars.transport_electrification * 4000 + vars.supply_chain_optimization * 2000 + vars.carbon_offset_investment,
          limit: 2000000
        },
        {
          name: 'Renewable Energy Feasibility',
          type: 'inequality',
          expression: (vars) => vars.renewable_energy_pct - vars.energy_efficiency_improvement,
          limit: 20
        }
      ],
      maxIterations: 1000,
      tolerance: 1e-6
    };
  }

  createESGScoreOptimizationProblem(): OptimizationProblem {
    return {
      name: 'ESG Score Maximization',
      variables: [
        { name: 'environmental_initiatives', min: 0, max: 20, type: 'integer', unit: 'count' },
        { name: 'social_programs_budget', min: 0, max: 500000, type: 'continuous', unit: 'USD' },
        { name: 'governance_improvements', min: 0, max: 15, type: 'integer', unit: 'count' },
        { name: 'diversity_hiring_target', min: 0, max: 50, type: 'continuous', unit: '%' },
        { name: 'transparency_measures', min: 0, max: 10, type: 'integer', unit: 'count' }
      ],
      objectives: [
        {
          name: 'ESG Score',
          type: 'maximize',
          weight: 1.0,
          evaluate: (vars) => {
            const envScore = Math.min(vars.environmental_initiatives * 2.5, 50);
            const socialScore = Math.min((vars.social_programs_budget / 10000) + (vars.diversity_hiring_target * 0.5), 30);
            const govScore = Math.min((vars.governance_improvements * 1.5) + (vars.transparency_measures * 2), 20);

            return envScore + socialScore + govScore;
          }
        }
      ],
      constraints: [
        {
          name: 'Total Budget',
          type: 'inequality',
          expression: (vars) => (vars.environmental_initiatives * 25000) + vars.social_programs_budget + (vars.governance_improvements * 15000) + (vars.transparency_measures * 10000),
          limit: 1000000
        }
      ],
      maxIterations: 500
    };
  }

  // PSO Helper Methods
  private initializeParticles(problem: OptimizationProblem, swarmSize: number): any[] {
    const particles = [];

    for (let i = 0; i < swarmSize; i++) {
      const position = this.generateRandomSolution(problem);
      const velocity: Record<string, number> = {};

      for (const variable of problem.variables) {
        velocity[variable.name] = Math.random() * (variable.max - variable.min) * 0.1;
      }

      particles.push({
        position,
        velocity,
        bestPosition: { ...position },
        bestFitness: this.evaluateParticle(position, problem)
      });
    }

    return particles;
  }

  private updateParticleVelocity(particle: any, globalBest: any, w: number, c1: number, c2: number): void {
    for (const varName in particle.velocity) {
      const r1 = Math.random();
      const r2 = Math.random();

      particle.velocity[varName] = w * particle.velocity[varName] +
        c1 * r1 * (particle.bestPosition[varName] - particle.position[varName]) +
        c2 * r2 * (globalBest.position[varName] - particle.position[varName]);
    }
  }

  private updateParticlePosition(particle: any, problem: OptimizationProblem): void {
    for (const variable of problem.variables) {
      particle.position[variable.name] += particle.velocity[variable.name];

      // Enforce bounds
      particle.position[variable.name] = Math.max(variable.min, Math.min(variable.max, particle.position[variable.name]));

      // Handle discrete variables
      if (variable.type === 'integer' || variable.type === 'discrete') {
        particle.position[variable.name] = Math.round(particle.position[variable.name]);
      }
    }
  }

  private findGlobalBest(particles: any[], problem: OptimizationProblem): any {
    let best = particles[0];
    let bestFitness = this.evaluateParticle(best.position, problem);

    for (const particle of particles) {
      const fitness = this.evaluateParticle(particle.position, problem);
      if (fitness < bestFitness) {
        best = particle;
        bestFitness = fitness;
      }
    }

    return { position: best.position, fitness: bestFitness };
  }

  // Evaluation and utility methods
  private evaluateParticle(variables: Record<string, number>, problem: OptimizationProblem): number {
    let totalObjective = 0;

    for (const objective of problem.objectives) {
      const value = objective.evaluate(variables);
      const normalizedValue = objective.type === 'minimize' ? value : -value;
      totalObjective += objective.weight * normalizedValue;
    }

    // Add penalty for constraint violations
    const penalty = this.calculateConstraintPenalty(variables, problem);

    return totalObjective + penalty;
  }

  private calculateConstraintPenalty(variables: Record<string, number>, problem: OptimizationProblem): number {
    let penalty = 0;

    for (const constraint of problem.constraints) {
      const value = constraint.expression(variables);

      if (constraint.type === 'inequality' && value > constraint.limit) {
        penalty += 1000 * Math.pow(value - constraint.limit, 2);
      } else if (constraint.type === 'equality') {
        penalty += 1000 * Math.pow(value - constraint.limit, 2);
      }
    }

    return penalty;
  }

  private generateRandomSolution(problem: OptimizationProblem): Record<string, number> {
    const solution: Record<string, number> = {};

    for (const variable of problem.variables) {
      let value = Math.random() * (variable.max - variable.min) + variable.min;

      if (variable.type === 'integer' || variable.type === 'discrete') {
        value = Math.round(value);
      }

      solution[variable.name] = value;
    }

    return solution;
  }

  private generateNeighborSolution(current: Record<string, number>, problem: OptimizationProblem, temperature: number): Record<string, number> {
    const neighbor = { ...current };

    // Randomly select a variable to modify
    const variables = problem.variables;
    const selectedVar = variables[Math.floor(Math.random() * variables.length)];

    // Generate perturbation based on temperature
    const range = selectedVar.max - selectedVar.min;
    const perturbation = (Math.random() - 0.5) * range * (temperature / 1000);

    neighbor[selectedVar.name] = Math.max(selectedVar.min,
      Math.min(selectedVar.max, current[selectedVar.name] + perturbation));

    if (selectedVar.type === 'integer' || selectedVar.type === 'discrete') {
      neighbor[selectedVar.name] = Math.round(neighbor[selectedVar.name]);
    }

    return neighbor;
  }

  private updateTemperature(initial: number, iteration: number, maxIterations: number, schedule: string, coolingRate: number): number {
    switch (schedule) {
      case 'exponential':
        return initial * Math.pow(coolingRate, iteration);
      case 'linear':
        return initial * (1 - iteration / maxIterations);
      case 'logarithmic':
        return initial / Math.log(iteration + 2);
      default:
        return initial * Math.pow(coolingRate, iteration);
    }
  }

  // Genetic Algorithm Helper Methods
  private initializePopulation(problem: OptimizationProblem, size: number): Record<string, number>[] {
    const population = [];
    for (let i = 0; i < size; i++) {
      population.push(this.generateRandomSolution(problem));
    }
    return population;
  }

  private selection(population: Record<string, number>[], fitness: number[], method: string): Record<string, number>[] {
    switch (method) {
      case 'tournament':
        return this.tournamentSelection(population, fitness);
      case 'roulette':
        return this.rouletteSelection(population, fitness);
      case 'rank':
        return this.rankSelection(population, fitness);
      default:
        return this.tournamentSelection(population, fitness);
    }
  }

  private tournamentSelection(population: Record<string, number>[], fitness: number[]): Record<string, number>[] {
    const selected = [];
    const tournamentSize = 3;

    for (let i = 0; i < population.length; i++) {
      let best = Math.floor(Math.random() * population.length);

      for (let j = 1; j < tournamentSize; j++) {
        const candidate = Math.floor(Math.random() * population.length);
        if (fitness[candidate] < fitness[best]) {
          best = candidate;
        }
      }

      selected.push({ ...population[best] });
    }

    return selected;
  }

  private crossover(population: Record<string, number>[], rate: number, problem: OptimizationProblem): Record<string, number>[] {
    const offspring = [];

    for (let i = 0; i < population.length - 1; i += 2) {
      if (Math.random() < rate) {
        const [child1, child2] = this.singlePointCrossover(population[i], population[i + 1], problem);
        offspring.push(child1, child2);
      } else {
        offspring.push({ ...population[i] }, { ...population[i + 1] });
      }
    }

    return offspring;
  }

  private singlePointCrossover(parent1: Record<string, number>, parent2: Record<string, number>, problem: OptimizationProblem): [Record<string, number>, Record<string, number>] {
    const variables = problem.variables;
    const crossoverPoint = Math.floor(Math.random() * variables.length);

    const child1 = { ...parent1 };
    const child2 = { ...parent2 };

    for (let i = crossoverPoint; i < variables.length; i++) {
      const varName = variables[i].name;
      child1[varName] = parent2[varName];
      child2[varName] = parent1[varName];
    }

    return [child1, child2];
  }

  private mutation(population: Record<string, number>[], rate: number, problem: OptimizationProblem): void {
    for (const individual of population) {
      for (const variable of problem.variables) {
        if (Math.random() < rate) {
          const range = variable.max - variable.min;
          const mutation = (Math.random() - 0.5) * range * 0.1;

          individual[variable.name] = Math.max(variable.min,
            Math.min(variable.max, individual[variable.name] + mutation));

          if (variable.type === 'integer' || variable.type === 'discrete') {
            individual[variable.name] = Math.round(individual[variable.name]);
          }
        }
      }
    }
  }

  // Utility methods
  private countConstraintViolations(variables: Record<string, number>, problem: OptimizationProblem): number {
    let violations = 0;

    for (const constraint of problem.constraints) {
      const value = constraint.expression(variables);

      if (constraint.type === 'inequality' && value > constraint.limit) {
        violations++;
      } else if (constraint.type === 'equality' && Math.abs(value - constraint.limit) > 1e-6) {
        violations++;
      }
    }

    return violations;
  }

  private isFeasible(variables: Record<string, number>, problem: OptimizationProblem): boolean {
    return this.countConstraintViolations(variables, problem) === 0;
  }

  private checkConvergence(history: number[], tolerance: number): boolean {
    if (history.length < 5) return false;

    const recent = history.slice(-5);
    const variance = this.calculateVariance(recent);

    return variance < tolerance;
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return variance;
  }

  private storeResult(problemName: string, result: OptimizationResult): void {
    if (!this.results.has(problemName)) {
      this.results.set(problemName, []);
    }
    this.results.get(problemName)!.push(result);
  }

  // Additional stub methods for completeness
  private rouletteSelection(population: Record<string, number>[], fitness: number[]): Record<string, number>[] {
    // Implementation would go here
    return this.tournamentSelection(population, fitness);
  }

  private rankSelection(population: Record<string, number>[], fitness: number[]): Record<string, number>[] {
    // Implementation would go here
    return this.tournamentSelection(population, fitness);
  }

  private findBestIndividual(population: Record<string, number>[], problem: OptimizationProblem): Record<string, number> {
    let best = population[0];
    let bestFitness = this.evaluateParticle(best, problem);

    for (const individual of population) {
      const fitness = this.evaluateParticle(individual, problem);
      if (fitness < bestFitness) {
        best = individual;
        bestFitness = fitness;
      }
    }

    return best;
  }

  private selectElite(population: Record<string, number>[], fitness: number[], count: number): Record<string, number>[] {
    const indexed = population.map((individual, index) => ({ individual, fitness: fitness[index] }));
    indexed.sort((a, b) => a.fitness - b.fitness);
    return indexed.slice(0, count).map(item => item.individual);
  }

  private nonDominatedSort(population: Record<string, number>[], problem: OptimizationProblem): Record<string, number>[][] {
    // Simplified implementation - full NSGA-II would be more complex
    const fronts: Record<string, number>[][] = [[]];

    // For now, just return first front with best solutions
    const evaluated = population.map(individual => ({
      individual,
      fitness: this.evaluateParticle(individual, problem)
    }));

    evaluated.sort((a, b) => a.fitness - b.fitness);
    fronts[0] = evaluated.slice(0, Math.min(50, population.length)).map(item => item.individual);

    return fronts;
  }

  private calculateCrowdingDistance(front: Record<string, number>[], problem: OptimizationProblem): void {
    // Implementation would calculate crowding distance for diversity preservation
  }

  private environmentalSelection(fronts: Record<string, number>[][], populationSize: number): Record<string, number>[] {
    const selected = [];

    for (const front of fronts) {
      if (selected.length + front.length <= populationSize) {
        selected.push(...front);
      } else {
        const remaining = populationSize - selected.length;
        selected.push(...front.slice(0, remaining));
        break;
      }
    }

    return selected;
  }

  /**
   * Get optimization results for analysis
   */
  getResults(problemName: string): OptimizationResult[] {
    return this.results.get(problemName) || [];
  }

  /**
   * Compare optimization algorithms
   */
  compareAlgorithms(problem: OptimizationProblem): Promise<{ pso: OptimizationResult; sa: OptimizationResult; ga: OptimizationResult }> {
    return Promise.all([
      this.particleSwarmOptimization(problem),
      this.simulatedAnnealing(problem),
      this.geneticAlgorithm(problem)
    ]).then(([pso, sa, ga]) => ({ pso, sa, ga }));
  }
}

// Export singleton instance
export const optimizationEngine = new AdvancedOptimizationEngine();

export type {
  OptimizationVariable,
  OptimizationConstraint,
  OptimizationObjective,
  OptimizationProblem,
  OptimizationResult
};