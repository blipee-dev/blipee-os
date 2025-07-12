/**
 * Hyperparameter Optimization System
 * High-level interface for optimizing ML model hyperparameters
 */

import { BaseModel } from '../base/base-model';
import { BayesianOptimizer, SearchSpace, OptimizationConfig, OptimizationResult } from './bayesian-optimizer';
import { TrainingData, EvaluationMetrics } from '../types';

export interface ModelOptimizationConfig {
  model: BaseModel;
  trainingData: TrainingData;
  validationData: TrainingData;
  searchSpace: SearchSpace;
  objective: 'accuracy' | 'loss' | 'f1Score' | 'auc' | 'custom';
  customObjective?: (metrics: EvaluationMetrics) => number;
  optimizationConfig: OptimizationConfig;
  crossValidationFolds?: number;
  earlyStoppingPatience?: number;
  maxTrainingTime?: number; // seconds
}

export interface OptimizedModel {
  model: BaseModel;
  bestParameters: Record<string, any>;
  bestScore: number;
  optimizationHistory: OptimizationResult;
  validationMetrics: EvaluationMetrics;
  improvements: {
    baselineScore: number;
    optimizedScore: number;
    relativeImprovement: number;
  };
}

export class HyperparameterOptimizer {
  private optimizer: BayesianOptimizer;
  private evaluationCache: Map<string, number> = new Map();

  constructor(config: OptimizationConfig) {
    this.optimizer = new BayesianOptimizer(config);
  }

  /**
   * Optimize hyperparameters for a given model
   */
  async optimizeModel(config: ModelOptimizationConfig): Promise<OptimizedModel> {
    console.log(`🔧 Optimizing hyperparameters for ${config.model.getModelName()}`);
    
    // Get baseline performance
    const baselineScore = await this.evaluateModelPerformance(
      config.model,
      config.trainingData,
      config.validationData,
      config.objective,
      config.customObjective
    );
    
    console.log(`   Baseline ${config.objective}: ${baselineScore.toFixed(4)}`);
    
    // Define objective function for optimization
    const objectiveFunction = async (parameters: Record<string, any>): Promise<number> => {
      return await this.evaluateParameterSet(parameters, config);
    };
    
    // Run optimization
    const optimizationResult = await this.optimizer.optimize(
      objectiveFunction,
      config.searchSpace
    );
    
    // Train final model with best parameters
    const optimizedModel = await this.trainModelWithParameters(
      config.model,
      optimizationResult.bestParameters,
      config.trainingData
    );
    
    // Evaluate final model
    const finalMetrics = await optimizedModel.evaluate(config.validationData);
    const finalScore = this.extractObjectiveValue(finalMetrics, config.objective, config.customObjective);
    
    const relativeImprovement = ((finalScore - baselineScore) / Math.abs(baselineScore)) * 100;
    
    console.log(`✅ Optimization complete!`);
    console.log(`   Best ${config.objective}: ${finalScore.toFixed(4)}`);
    console.log(`   Improvement: ${relativeImprovement.toFixed(1)}%`);
    
    return {
      model: optimizedModel,
      bestParameters: optimizationResult.bestParameters,
      bestScore: finalScore,
      optimizationHistory: optimizationResult,
      validationMetrics: finalMetrics,
      improvements: {
        baselineScore,
        optimizedScore: finalScore,
        relativeImprovement
      }
    };
  }

  /**
   * Optimize multiple models and return the best one
   */
  async optimizeMultipleModels(
    models: BaseModel[],
    config: Omit<ModelOptimizationConfig, 'model'>
  ): Promise<{
    bestModel: OptimizedModel;
    allResults: OptimizedModel[];
    comparison: ModelComparison[];
  }> {
    console.log(`🏆 Optimizing ${models.length} models to find the best performer`);
    
    const results: OptimizedModel[] = [];
    
    for (let i = 0; i < models.length; i++) {
      const model = models[i];
      console.log(`\n   Optimizing model ${i + 1}/${models.length}: ${model.getModelName()}`);
      
      try {
        const result = await this.optimizeModel({
          ...config,
          model
        });
        results.push(result);
      } catch (error) {
        console.warn(`   Failed to optimize ${model.getModelName()}:`, error.message);
      }
    }
    
    // Find best model
    const bestModel = results.reduce((best, current) => 
      current.bestScore > best.bestScore ? current : best
    );
    
    // Generate comparison
    const comparison = this.generateModelComparison(results);
    
    console.log(`\n🎯 Best model: ${bestModel.model.getModelName()}`);
    console.log(`   Score: ${bestModel.bestScore.toFixed(4)}`);
    console.log(`   Improvement: ${bestModel.improvements.relativeImprovement.toFixed(1)}%`);
    
    return {
      bestModel,
      allResults: results,
      comparison
    };
  }

  /**
   * Create search spaces for common ML models
   */
  static createSearchSpace(modelType: string): SearchSpace {
    switch (modelType.toLowerCase()) {
      case 'neural_network':
        return {
          learningRate: { type: 'continuous', min: 1e-5, max: 1e-1 },
          batchSize: { type: 'categorical', values: [16, 32, 64, 128, 256] },
          hiddenLayers: { type: 'discrete', min: 1, max: 5, step: 1 },
          hiddenUnits: { type: 'categorical', values: [32, 64, 128, 256, 512] },
          dropout: { type: 'continuous', min: 0.0, max: 0.7 },
          l2Regularization: { type: 'continuous', min: 1e-6, max: 1e-2 },
          optimizer: { type: 'categorical', values: ['adam', 'sgd', 'rmsprop'] },
          activation: { type: 'categorical', values: ['relu', 'tanh', 'sigmoid'] }
        };
        
      case 'genetic_algorithm':
        return {
          populationSize: { type: 'categorical', values: [20, 50, 100, 200] },
          mutationRate: { type: 'continuous', min: 0.001, max: 0.2 },
          crossoverRate: { type: 'continuous', min: 0.5, max: 0.95 },
          elitism: { type: 'continuous', min: 0.05, max: 0.3 },
          maxGenerations: { type: 'categorical', values: [50, 100, 200, 500] }
        };
        
      case 'regulatory_predictor':
        return {
          embeddingDim: { type: 'categorical', values: [128, 256, 384, 512] },
          learningRate: { type: 'continuous', min: 1e-5, max: 1e-2 },
          dropout: { type: 'continuous', min: 0.1, max: 0.5 },
          maxSequenceLength: { type: 'categorical', values: [256, 512, 1024] },
          numLayers: { type: 'discrete', min: 2, max: 8, step: 1 }
        };
        
      case 'anomaly_detector':
        return {
          contaminationRate: { type: 'continuous', min: 0.05, max: 0.3 },
          nEstimators: { type: 'categorical', values: [50, 100, 200, 300] },
          maxSamples: { type: 'categorical', values: [128, 256, 512] },
          threshold: { type: 'continuous', min: 0.5, max: 0.95 }
        };
        
      default:
        return {
          learningRate: { type: 'continuous', min: 1e-4, max: 1e-1 },
          regularization: { type: 'continuous', min: 1e-6, max: 1e-1 }
        };
    }
  }

  /**
   * Create optimization configuration presets
   */
  static createOptimizationConfig(preset: 'fast' | 'balanced' | 'thorough'): OptimizationConfig {
    switch (preset) {
      case 'fast':
        return {
          acquisitionFunction: 'upperConfidenceBound',
          nInitialPoints: 5,
          nIterations: 20,
          explorationWeight: 1.96, // 95% confidence
          convergenceThreshold: 1e-4
        };
        
      case 'balanced':
        return {
          acquisitionFunction: 'expectedImprovement',
          nInitialPoints: 10,
          nIterations: 50,
          explorationWeight: 2.576, // 99% confidence
          convergenceThreshold: 1e-5
        };
        
      case 'thorough':
        return {
          acquisitionFunction: 'expectedImprovement',
          nInitialPoints: 20,
          nIterations: 100,
          explorationWeight: 3.0, // High exploration
          convergenceThreshold: 1e-6
        };
        
      default:
        return {
          acquisitionFunction: 'expectedImprovement',
          nInitialPoints: 10,
          nIterations: 50
        };
    }
  }

  /**
   * Evaluate a specific parameter set
   */
  private async evaluateParameterSet(
    parameters: Record<string, any>,
    config: ModelOptimizationConfig
  ): Promise<number> {
    // Create cache key
    const cacheKey = JSON.stringify(parameters);
    if (this.evaluationCache.has(cacheKey)) {
      return this.evaluationCache.get(cacheKey)!;
    }
    
    try {
      // Clone model and set parameters
      const modelCopy = await this.cloneModel(config.model);
      modelCopy.setParameters(parameters);
      
      // Train with parameters
      await modelCopy.train(config.trainingData);
      
      // Evaluate performance
      let score: number;
      
      if (config.crossValidationFolds && config.crossValidationFolds > 1) {
        score = await this.crossValidateModel(
          modelCopy,
          config.trainingData,
          config.crossValidationFolds,
          config.objective,
          config.customObjective
        );
      } else {
        score = await this.evaluateModelPerformance(
          modelCopy,
          config.trainingData,
          config.validationData,
          config.objective,
          config.customObjective
        );
      }
      
      // Cache result
      this.evaluationCache.set(cacheKey, score);
      return score;
      
    } catch (error) {
      console.warn(`   Evaluation failed for parameters:`, parameters, error.message);
      return -Infinity; // Return worst possible score for failed evaluations
    }
  }

  /**
   * Evaluate model performance with current parameters
   */
  private async evaluateModelPerformance(
    model: BaseModel,
    trainingData: TrainingData,
    validationData: TrainingData,
    objective: string,
    customObjective?: (metrics: EvaluationMetrics) => number
  ): Promise<number> {
    // If model isn't trained, train it first
    if (!model.isTrained()) {
      await model.train(trainingData);
    }
    
    const metrics = await model.evaluate(validationData);
    return this.extractObjectiveValue(metrics, objective, customObjective);
  }

  /**
   * Extract objective value from evaluation metrics
   */
  private extractObjectiveValue(
    metrics: EvaluationMetrics,
    objective: string,
    customObjective?: (metrics: EvaluationMetrics) => number
  ): number {
    if (customObjective) {
      return customObjective(metrics);
    }
    
    switch (objective) {
      case 'accuracy':
        return metrics.accuracy || 0;
      case 'loss':
        return -(metrics.loss || Infinity); // Negative because we want to maximize
      case 'f1Score':
        return metrics.f1Score || 0;
      case 'auc':
        return metrics.auc || 0;
      default:
        return metrics.accuracy || 0;
    }
  }

  /**
   * Perform cross-validation evaluation
   */
  private async crossValidateModel(
    model: BaseModel,
    data: TrainingData,
    folds: number,
    objective: string,
    customObjective?: (metrics: EvaluationMetrics) => number
  ): Promise<number> {
    const foldSize = Math.floor(data.features.length / folds);
    const scores: number[] = [];
    
    for (let fold = 0; fold < folds; fold++) {
      const validationStart = fold * foldSize;
      const validationEnd = fold === folds - 1 ? data.features.length : (fold + 1) * foldSize;
      
      // Split data
      const trainData: TrainingData = {
        features: [
          ...data.features.slice(0, validationStart),
          ...data.features.slice(validationEnd)
        ],
        labels: [
          ...data.labels.slice(0, validationStart),
          ...data.labels.slice(validationEnd)
        ],
        metadata: data.metadata
      };
      
      const validationData: TrainingData = {
        features: data.features.slice(validationStart, validationEnd),
        labels: data.labels.slice(validationStart, validationEnd),
        metadata: data.metadata
      };
      
      // Train and evaluate
      const foldModel = await this.cloneModel(model);
      await foldModel.train(trainData);
      const metrics = await foldModel.evaluate(validationData);
      const score = this.extractObjectiveValue(metrics, objective, customObjective);
      
      scores.push(score);
    }
    
    // Return average score
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  /**
   * Train model with specific parameters
   */
  private async trainModelWithParameters(
    model: BaseModel,
    parameters: Record<string, any>,
    trainingData: TrainingData
  ): Promise<BaseModel> {
    const trainedModel = await this.cloneModel(model);
    trainedModel.setParameters(parameters);
    await trainedModel.train(trainingData);
    return trainedModel;
  }

  /**
   * Clone a model for independent training
   */
  private async cloneModel(model: BaseModel): Promise<BaseModel> {
    // This is a simplified clone - in practice, you'd need model-specific cloning
    const config = model.getConfig();
    const ModelClass = model.constructor as new (config: any) => BaseModel;
    return new ModelClass(config);
  }

  /**
   * Generate comparison between optimized models
   */
  private generateModelComparison(results: OptimizedModel[]): ModelComparison[] {
    return results.map(result => ({
      modelName: result.model.getModelName(),
      score: result.bestScore,
      improvement: result.improvements.relativeImprovement,
      parameters: result.bestParameters,
      evaluations: result.optimizationHistory.totalEvaluations,
      optimizationTime: result.optimizationHistory.optimizationTime
    })).sort((a, b) => b.score - a.score);
  }
}

export interface ModelComparison {
  modelName: string;
  score: number;
  improvement: number;
  parameters: Record<string, any>;
  evaluations: number;
  optimizationTime: number;
}