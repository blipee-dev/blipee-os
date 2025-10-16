/**
 * Bayesian Hyperparameter Optimization
 * Automatically finds optimal hyperparameters for ML models
 */

import { BaseModel } from '../base/base-model';

export interface SearchSpace {
  [paramName: string]: {
    type: 'categorical' | 'continuous' | 'discrete';
    values?: any[];
    min?: number;
    max?: number;
    step?: number;
  };
}

export interface OptimizationConfig {
  acquisitionFunction: 'expectedImprovement' | 'upperConfidenceBound' | 'probabilityOfImprovement';
  nInitialPoints: number;
  nIterations: number;
  randomSeed?: number;
  explorationWeight?: number;
  convergenceThreshold?: number;
}

export interface OptimizationPoint {
  parameters: Record<string, any>;
  objective: number;
  variance?: number;
  acquisitionValue?: number;
  timestamp: Date;
}

export interface OptimizationResult {
  bestParameters: Record<string, any>;
  bestObjective: number;
  convergenceHistory: OptimizationPoint[];
  totalEvaluations: number;
  optimizationTime: number;
  recommendations: string[];
}

export type ObjectiveFunction = (parameters: Record<string, any>) => Promise<number>;

export class BayesianOptimizer {
  private config: OptimizationConfig;
  private evaluationHistory: OptimizationPoint[] = [];
  private gaussianProcess: GaussianProcess;
  private acquisitionFunction: AcquisitionFunction;

  constructor(config: OptimizationConfig) {
    this.config = {
      explorationWeight: 2.576, // 99% confidence interval
      convergenceThreshold: 1e-6,
      randomSeed: Date.now(),
      ...config
    };
    
    this.gaussianProcess = new GaussianProcess();
    this.acquisitionFunction = this.createAcquisitionFunction();
  }

  /**
   * Optimize hyperparameters using Bayesian optimization
   */
  async optimize(
    objectiveFunction: ObjectiveFunction,
    searchSpace: SearchSpace
  ): Promise<OptimizationResult> {
    const startTime = Date.now();
    
    // Step 1: Generate initial random points
    await this.generateInitialPoints(objectiveFunction, searchSpace);
    
    // Step 2: Iterative optimization
    for (let iteration = 0; iteration < this.config.nIterations; iteration++) {
      
      // Fit Gaussian Process to current data
      await this.gaussianProcess.fit(this.evaluationHistory);
      
      // Find next point to evaluate using acquisition function
      const nextPoint = await this.selectNextPoint(searchSpace);
      
      // Evaluate objective function at next point
      const objective = await objectiveFunction(nextPoint);
      
      // Add to history
      this.evaluationHistory.push({
        parameters: nextPoint,
        objective,
        timestamp: new Date()
      });
      
      // Check for convergence
      if (this.hasConverged()) {
        break;
      }
    }
    
    const optimizationTime = Date.now() - startTime;
    const bestPoint = this.getBestPoint();
    
    
    return {
      bestParameters: bestPoint.parameters,
      bestObjective: bestPoint.objective,
      convergenceHistory: [...this.evaluationHistory],
      totalEvaluations: this.evaluationHistory.length,
      optimizationTime,
      recommendations: this.generateRecommendations()
    };
  }

  /**
   * Generate initial random points for exploration
   */
  private async generateInitialPoints(
    objectiveFunction: ObjectiveFunction,
    searchSpace: SearchSpace
  ): Promise<void> {
    
    for (let i = 0; i < this.config.nInitialPoints; i++) {
      const randomPoint = this.sampleRandomPoint(searchSpace);
      const objective = await objectiveFunction(randomPoint);
      
      this.evaluationHistory.push({
        parameters: randomPoint,
        objective,
        timestamp: new Date()
      });
    }
    
  }

  /**
   * Select next point to evaluate using acquisition function
   */
  private async selectNextPoint(searchSpace: SearchSpace): Promise<Record<string, any>> {
    const candidatePoints = this.generateCandidatePoints(searchSpace, 1000);
    let bestCandidate = candidatePoints[0];
    let bestAcquisitionValue = -Infinity;
    
    for (const candidate of candidatePoints) {
      const [mean, variance] = await this.gaussianProcess.predict(candidate);
      const acquisitionValue = this.acquisitionFunction.compute(mean, variance, this.getBestObjective());
      
      if (acquisitionValue > bestAcquisitionValue) {
        bestAcquisitionValue = acquisitionValue;
        bestCandidate = candidate;
      }
    }
    
    return bestCandidate;
  }

  /**
   * Generate candidate points for acquisition optimization
   */
  private generateCandidatePoints(searchSpace: SearchSpace, count: number): Record<string, any>[] {
    const candidates: Record<string, any>[] = [];
    
    for (let i = 0; i < count; i++) {
      candidates.push(this.sampleRandomPoint(searchSpace));
    }
    
    return candidates;
  }

  /**
   * Sample a random point from the search space
   */
  private sampleRandomPoint(searchSpace: SearchSpace): Record<string, any> {
    const point: Record<string, any> = {};
    
    for (const [paramName, space] of Object.entries(searchSpace)) {
      switch (space.type) {
        case 'categorical':
          point[paramName] = space.values![Math.floor(Math.random() * space.values!.length)];
          break;
          
        case 'continuous':
          point[paramName] = Math.random() * (space.max! - space.min!) + space.min!;
          break;
          
        case 'discrete':
          const range = space.max! - space.min!;
          const steps = Math.floor(range / (space.step || 1));
          point[paramName] = space.min! + Math.floor(Math.random() * (steps + 1)) * (space.step || 1);
          break;
      }
    }
    
    return point;
  }

  /**
   * Check if optimization has converged
   */
  private hasConverged(): boolean {
    if (this.evaluationHistory.length < 5) return false;
    
    const recentPoints = this.evaluationHistory.slice(-5);
    const objectives = recentPoints.map(p => p.objective);
    const variance = this.calculateVariance(objectives);
    
    return variance < this.config.convergenceThreshold!;
  }

  /**
   * Get the best point found so far
   */
  private getBestPoint(): OptimizationPoint {
    return this.evaluationHistory.reduce((best, current) => 
      current.objective > best.objective ? current : best
    );
  }

  /**
   * Get the best objective value found so far
   */
  private getBestObjective(): number {
    return this.getBestPoint().objective;
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const bestPoint = this.getBestPoint();
    const totalEvaluations = this.evaluationHistory.length;
    
    recommendations.push(`Found optimal parameters after ${totalEvaluations} evaluations`);
    
    // Parameter-specific recommendations
    for (const [param, value] of Object.entries(bestPoint.parameters)) {
      if (typeof value === 'number') {
        recommendations.push(`${param}: ${value.toFixed(4)} (optimal value found)`);
      } else {
        recommendations.push(`${param}: ${value} (optimal category selected)`);
      }
    }
    
    // Performance improvement
    const initialBest = this.evaluationHistory.slice(0, this.config.nInitialPoints)
      .reduce((best, current) => current.objective > best.objective ? current : best);
    const improvement = ((bestPoint.objective - initialBest.objective) / initialBest.objective) * 100;
    
    if (improvement > 5) {
      recommendations.push(`Achieved ${improvement.toFixed(1)}% improvement over random search`);
    }
    
    // Convergence analysis
    if (this.hasConverged()) {
      recommendations.push('Optimization converged successfully');
    } else {
      recommendations.push('Consider running more iterations for further improvement');
    }
    
    return recommendations;
  }

  /**
   * Create acquisition function based on configuration
   */
  private createAcquisitionFunction(): AcquisitionFunction {
    switch (this.config.acquisitionFunction) {
      case 'expectedImprovement':
        return new ExpectedImprovement(this.config.explorationWeight!);
      case 'upperConfidenceBound':
        return new UpperConfidenceBound(this.config.explorationWeight!);
      case 'probabilityOfImprovement':
        return new ProbabilityOfImprovement(this.config.explorationWeight!);
      default:
        return new ExpectedImprovement(this.config.explorationWeight!);
    }
  }

  /**
   * Calculate variance of a set of values
   */
  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  }
}

/**
 * Gaussian Process for modeling the objective function
 */
class GaussianProcess {
  private trainedData: OptimizationPoint[] = [];
  private kernel: RBFKernel;
  private noise: number = 1e-6;

  constructor() {
    this.kernel = new RBFKernel(1.0, 1.0); // length_scale, output_scale
  }

  /**
   * Fit the Gaussian Process to observed data
   */
  async fit(data: OptimizationPoint[]): Promise<void> {
    this.trainedData = [...data];
    
    // In a full implementation, this would optimize kernel hyperparameters
    // For now, we use fixed parameters
  }

  /**
   * Predict mean and variance at a new point
   */
  async predict(point: Record<string, any>): Promise<[number, number]> {
    if (this.trainedData.length === 0) {
      return [0, 1]; // Prior: mean=0, variance=1
    }

    // Convert point to feature vector
    const queryFeatures = this.pointToFeatures(point);
    
    // Compute kernel values between query point and training data
    const kernelValues = this.trainedData.map(trainPoint => {
      const trainFeatures = this.pointToFeatures(trainPoint.parameters);
      return this.kernel.compute(queryFeatures, trainFeatures);
    });

    // Compute mean prediction (simplified)
    const weights = this.computeWeights(kernelValues);
    const mean = this.trainedData.reduce((sum, point, i) => 
      sum + weights[i] * point.objective, 0
    );

    // Compute variance prediction (simplified)
    const variance = Math.max(0.01, 1.0 - kernelValues.reduce((sum, k) => sum + k, 0) / kernelValues.length);

    return [mean, variance];
  }

  /**
   * Convert parameter point to feature vector
   */
  private pointToFeatures(point: Record<string, any>): number[] {
    const features: number[] = [];
    
    for (const [key, value] of Object.entries(point)) {
      if (typeof value === 'number') {
        features.push(value);
      } else if (typeof value === 'string') {
        // Simple hash for categorical features
        features.push(this.hashString(value) / 1000000);
      } else if (typeof value === 'boolean') {
        features.push(value ? 1 : 0);
      }
    }
    
    return features;
  }

  /**
   * Compute weights for prediction
   */
  private computeWeights(kernelValues: number[]): number[] {
    const sum = kernelValues.reduce((s, k) => s + k, 0) + this.noise;
    return kernelValues.map(k => k / sum);
  }

  /**
   * Simple string hash function
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

/**
 * RBF (Radial Basis Function) Kernel
 */
class RBFKernel {
  constructor(
    private lengthScale: number,
    private outputScale: number
  ) {}

  compute(x1: number[], x2: number[]): number {
    const squaredDistance = x1.reduce((sum, val, i) => 
      sum + Math.pow(val - (x2[i] || 0), 2), 0
    );
    
    return this.outputScale * Math.exp(-squaredDistance / (2 * this.lengthScale * this.lengthScale));
  }
}

/**
 * Acquisition Function Interface
 */
abstract class AcquisitionFunction {
  constructor(protected explorationWeight: number) {}
  abstract compute(mean: number, variance: number, bestObserved: number): number;
}

/**
 * Expected Improvement Acquisition Function
 */
class ExpectedImprovement extends AcquisitionFunction {
  compute(mean: number, variance: number, bestObserved: number): number {
    const sigma = Math.sqrt(variance);
    const improvement = mean - bestObserved;
    
    if (sigma === 0) {
      return improvement > 0 ? improvement : 0;
    }
    
    const z = improvement / sigma;
    const cdf = this.standardNormalCDF(z);
    const pdf = this.standardNormalPDF(z);
    
    return improvement * cdf + sigma * pdf;
  }

  private standardNormalCDF(x: number): number {
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  private standardNormalPDF(x: number): number {
    return (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x);
  }

  private erf(x: number): number {
    // Approximation of error function
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }
}

/**
 * Upper Confidence Bound Acquisition Function
 */
class UpperConfidenceBound extends AcquisitionFunction {
  compute(mean: number, variance: number, bestObserved: number): number {
    const sigma = Math.sqrt(variance);
    return mean + this.explorationWeight * sigma;
  }
}

/**
 * Probability of Improvement Acquisition Function
 */
class ProbabilityOfImprovement extends AcquisitionFunction {
  compute(mean: number, variance: number, bestObserved: number): number {
    const sigma = Math.sqrt(variance);
    
    if (sigma === 0) {
      return mean > bestObserved ? 1 : 0;
    }
    
    const z = (mean - bestObserved) / sigma;
    return this.standardNormalCDF(z);
  }

  private standardNormalCDF(x: number): number {
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  private erf(x: number): number {
    // Same implementation as ExpectedImprovement
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }
}