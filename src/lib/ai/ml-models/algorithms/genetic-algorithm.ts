/**
 * Genetic Algorithm Implementation
 * For optimization problems in ESG resource allocation
 */

export interface GAConfig {
  populationSize: number;
  mutationRate: number;
  crossoverRate: number;
  elitism: number;
  tournamentSize?: number;
  maxGenerations?: number;
}

export interface Individual {
  genes: number[];
  fitness: number;
}

export interface OptimizationProblem {
  dimensions: number;
  bounds: Array<[number, number]>;
  fitnessFunction: (solution: number[]) => number;
  constraints?: Array<(solution: number[]) => boolean>;
}

export interface Solution {
  genes: number[];
  fitness: number;
  generation: number;
  evaluations: number;
}

export class GeneticAlgorithm {
  private config: GAConfig;
  private population: Individual[] = [];
  private bestIndividual: Individual | null = null;
  private generation: number = 0;
  private evaluations: number = 0;

  constructor(config: GAConfig) {
    this.config = {
      tournamentSize: 3,
      maxGenerations: 1000,
      ...config
    };
  }

  /**
   * Evolve the population to find optimal solution
   */
  async evolve(
    problem: OptimizationProblem,
    options: {
      generations?: number;
      targetFitness?: number;
      timeLimit?: number;
    } = {}
  ): Promise<Solution> {
    const startTime = Date.now();
    const maxGenerations = options.generations || this.config.maxGenerations || 1000;
    
    // Initialize population
    this.initializePopulation(problem);
    
    // Evolution loop
    while (this.generation < maxGenerations) {
      // Check stopping criteria
      if (options.targetFitness && this.bestIndividual && 
          this.bestIndividual.fitness >= options.targetFitness) {
        break;
      }
      
      if (options.timeLimit && Date.now() - startTime > options.timeLimit) {
        break;
      }
      
      // Evolve one generation
      await this.evolveGeneration(problem);
      
      // Log progress every 10 generations
      if (this.generation % 10 === 0) {
      }
    }
    
    return {
      genes: this.bestIndividual!.genes,
      fitness: this.bestIndividual!.fitness,
      generation: this.generation,
      evaluations: this.evaluations
    };
  }

  /**
   * Initialize random population
   */
  private initializePopulation(problem: OptimizationProblem): void {
    this.population = [];
    
    for (let i = 0; i < this.config.populationSize; i++) {
      const genes = this.createRandomIndividual(problem);
      const fitness = this.evaluateFitness(genes, problem);
      const individual: Individual = { genes, fitness };
      
      this.population.push(individual);
      
      // Update best individual
      if (!this.bestIndividual || individual.fitness > this.bestIndividual.fitness) {
        this.bestIndividual = { ...individual };
      }
    }
    
    this.generation = 0;
  }

  /**
   * Create random individual within bounds
   */
  private createRandomIndividual(problem: OptimizationProblem): number[] {
    const genes: number[] = [];
    
    for (let i = 0; i < problem.dimensions; i++) {
      const [min, max] = problem.bounds[i];
      genes.push(min + Math.random() * (max - min));
    }
    
    return genes;
  }

  /**
   * Evaluate fitness of an individual
   */
  private evaluateFitness(genes: number[], problem: OptimizationProblem): number {
    this.evaluations++;
    
    // Check constraints
    if (problem.constraints) {
      for (const constraint of problem.constraints) {
        if (!constraint(genes)) {
          return -1000; // Heavy penalty for constraint violations instead of -Infinity
        }
      }
    }
    
    return problem.fitnessFunction(genes);
  }

  /**
   * Evolve one generation
   */
  private async evolveGeneration(problem: OptimizationProblem): Promise<void> {
    const newPopulation: Individual[] = [];
    
    // Elitism: Keep best individuals
    const eliteCount = Math.floor(this.config.populationSize * this.config.elitism);
    const sortedPopulation = [...this.population].sort((a, b) => b.fitness - a.fitness);
    
    for (let i = 0; i < eliteCount; i++) {
      newPopulation.push({ ...sortedPopulation[i] });
    }
    
    // Generate rest of population
    while (newPopulation.length < this.config.populationSize) {
      if (Math.random() < this.config.crossoverRate) {
        // Crossover
        const parent1 = this.tournamentSelection();
        const parent2 = this.tournamentSelection();
        const offspring = this.crossover(parent1, parent2, problem);
        newPopulation.push(...offspring);
      } else {
        // Direct reproduction
        const parent = this.tournamentSelection();
        newPopulation.push({ ...parent });
      }
    }
    
    // Ensure population size
    newPopulation.length = this.config.populationSize;
    
    // Apply mutation
    for (let i = eliteCount; i < newPopulation.length; i++) {
      if (Math.random() < this.config.mutationRate) {
        this.mutate(newPopulation[i], problem);
        newPopulation[i].fitness = this.evaluateFitness(newPopulation[i].genes, problem);
      }
    }
    
    // Update population and best individual
    this.population = newPopulation;
    for (const individual of this.population) {
      if (!this.bestIndividual || individual.fitness > this.bestIndividual.fitness) {
        this.bestIndividual = { ...individual };
      }
    }
    
    this.generation++;
  }

  /**
   * Tournament selection
   */
  private tournamentSelection(): Individual {
    let best: Individual | null = null;
    
    for (let i = 0; i < this.config.tournamentSize!; i++) {
      const idx = Math.floor(Math.random() * this.population.length);
      const candidate = this.population[idx];
      
      if (!best || candidate.fitness > best.fitness) {
        best = candidate;
      }
    }
    
    return best!;
  }

  /**
   * Crossover between two parents
   */
  private crossover(
    parent1: Individual,
    parent2: Individual,
    problem: OptimizationProblem
  ): Individual[] {
    const offspring1: number[] = [];
    const offspring2: number[] = [];
    
    // Uniform crossover
    for (let i = 0; i < parent1.genes.length; i++) {
      if (Math.random() < 0.5) {
        offspring1.push(parent1.genes[i]);
        offspring2.push(parent2.genes[i]);
      } else {
        offspring1.push(parent2.genes[i]);
        offspring2.push(parent1.genes[i]);
      }
    }
    
    return [
      { genes: offspring1, fitness: this.evaluateFitness(offspring1, problem) },
      { genes: offspring2, fitness: this.evaluateFitness(offspring2, problem) }
    ];
  }

  /**
   * Mutate an individual
   */
  private mutate(individual: Individual, problem: OptimizationProblem): void {
    // Gaussian mutation
    for (let i = 0; i < individual.genes.length; i++) {
      if (Math.random() < 0.1) { // 10% chance per gene
        const [min, max] = problem.bounds[i];
        const range = max - min;
        const mutation = (Math.random() - 0.5) * range * 0.1; // 10% of range
        
        individual.genes[i] = Math.max(min, Math.min(max, individual.genes[i] + mutation));
      }
    }
  }

  /**
   * Get current best solution
   */
  getBestSolution(): Individual | null {
    return this.bestIndividual ? { ...this.bestIndividual } : null;
  }

  /**
   * Get population statistics
   */
  getStatistics(): {
    generation: number;
    bestFitness: number;
    averageFitness: number;
    evaluations: number;
  } {
    const totalFitness = this.population.reduce((sum, ind) => sum + ind.fitness, 0);
    
    return {
      generation: this.generation,
      bestFitness: this.bestIndividual?.fitness || 0,
      averageFitness: totalFitness / this.population.length,
      evaluations: this.evaluations
    };
  }
}