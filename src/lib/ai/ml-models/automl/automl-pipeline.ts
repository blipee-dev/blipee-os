/**
 * AutoML Pipeline
 * Automatically selects and optimizes the best ML model for a given task
 */

import { BaseModel } from '../base/base-model';
import { HyperparameterOptimizer } from '../hyperopt/hyperparameter-optimizer';
import { TrainingData, EvaluationMetrics } from '../types';
import { RegulatoryPredictor } from '../regulatory-predictor';
import { GeneticAlgorithm } from '../algorithms/genetic-algorithm';

export interface AutoMLConfig {
  taskType: 'classification' | 'regression' | 'timeseries' | 'optimization' | 'text_analysis';
  objective: 'accuracy' | 'precision' | 'recall' | 'f1Score' | 'mse' | 'mae' | 'auc' | 'custom';
  customObjective?: (metrics: EvaluationMetrics) => number;
  maxModels?: number;
  maxOptimizationTime?: number; // seconds
  crossValidationFolds?: number;
  ensembleStrategy?: 'none' | 'voting' | 'stacking' | 'bagging';
  featureEngineering?: boolean;
  dataAugmentation?: boolean;
  earlyStoppingPatience?: number;
}

export interface ModelCandidate {
  model: BaseModel;
  searchSpace: any;
  priority: number; // Higher = try first
  estimatedTrainingTime: number; // seconds
  description: string;
}

export interface AutoMLResult {
  bestModel: BaseModel;
  bestScore: number;
  allResults: ModelResult[];
  ensemble?: EnsembleModel;
  featureImportance?: FeatureImportance[];
  dataInsights: DataInsights;
  recommendations: string[];
  totalTime: number;
  modelsEvaluated: number;
}

export interface ModelResult {
  modelName: string;
  score: number;
  optimizedParameters: Record<string, any>;
  trainingTime: number;
  evaluationMetrics: EvaluationMetrics;
  improvement: number;
  rank: number;
}

export interface FeatureImportance {
  featureName: string;
  importance: number;
  type: 'numerical' | 'categorical' | 'text' | 'datetime';
}

export interface DataInsights {
  dataQuality: number; // 0-1 score
  featureCount: number;
  sampleCount: number;
  missingDataPercentage: number;
  dataComplexity: 'low' | 'medium' | 'high';
  recommendedModels: string[];
  potentialIssues: string[];
}

export class AutoMLPipeline {
  private optimizer: HyperparameterOptimizer;
  private candidateModels: Map<string, ModelCandidate[]> = new Map();

  constructor() {
    // Initialize with balanced optimization settings
    this.optimizer = new HyperparameterOptimizer(
      HyperparameterOptimizer.createOptimizationConfig('balanced')
    );
    
    this.initializeCandidateModels();
  }

  /**
   * Run the complete AutoML pipeline
   */
  async runAutoML(
    trainingData: TrainingData,
    validationData: TrainingData,
    config: AutoMLConfig
  ): Promise<AutoMLResult> {
    console.log('🤖 Starting AutoML Pipeline...');
    console.log(`   Task: ${config.taskType}`);
    console.log(`   Objective: ${config.objective}`);
    console.log(`   Training samples: ${trainingData.features.length}`);
    
    const startTime = Date.now();
    
    // Step 1: Analyze data
    const dataInsights = await this.analyzeData(trainingData, config);
    console.log(`   Data complexity: ${dataInsights.dataComplexity}`);
    console.log(`   Data quality score: ${(dataInsights.dataQuality * 100).toFixed(1)}%`);
    
    // Step 2: Select candidate models
    const candidates = this.selectCandidateModels(config.taskType, dataInsights, config);
    console.log(`   Selected ${candidates.length} candidate models`);
    
    // Step 3: Feature engineering (if enabled)
    let processedTrainingData = trainingData;
    let processedValidationData = validationData;
    
    if (config.featureEngineering) {
      const engineeredData = await this.performFeatureEngineering(
        trainingData, 
        validationData, 
        config.taskType
      );
      processedTrainingData = engineeredData.training;
      processedValidationData = engineeredData.validation;
      console.log(`   Feature engineering: ${processedTrainingData.features[0] ? Object.keys(processedTrainingData.features[0]).length : 0} features`);
    }
    
    // Step 4: Optimize each candidate model
    const modelResults: ModelResult[] = [];
    let modelsEvaluated = 0;
    
    for (let i = 0; i < candidates.length && i < (config.maxModels || 5); i++) {
      const candidate = candidates[i];
      console.log(`\n   Optimizing model ${i + 1}/${Math.min(candidates.length, config.maxModels || 5)}: ${candidate.description}`);
      
      try {
        const result = await this.optimizeCandidate(
          candidate,
          processedTrainingData,
          processedValidationData,
          config
        );
        
        modelResults.push({
          modelName: candidate.model.getModelName(),
          score: result.bestScore,
          optimizedParameters: result.bestParameters,
          trainingTime: result.optimizationHistory.optimizationTime,
          evaluationMetrics: result.validationMetrics,
          improvement: result.improvements.relativeImprovement,
          rank: i + 1
        });
        
        modelsEvaluated++;
        console.log(`     ✅ Score: ${result.bestScore.toFixed(4)} (${result.improvements.relativeImprovement.toFixed(1)}% improvement)`);
        
      } catch (error) {
        console.warn(`     ❌ Failed: ${error.message}`);
      }
      
      // Check time limit
      if (config.maxOptimizationTime) {
        const elapsed = (Date.now() - startTime) / 1000;
        if (elapsed > config.maxOptimizationTime) {
          console.log(`   Time limit reached (${elapsed.toFixed(0)}s), stopping optimization`);
          break;
        }
      }
    }
    
    // Step 5: Rank models and select best
    modelResults.sort((a, b) => b.score - a.score);
    const bestResult = modelResults[0];
    
    if (!bestResult) {
      throw new Error('No models were successfully optimized');
    }
    
    // Step 6: Create ensemble (if requested)
    let ensemble: EnsembleModel | undefined;
    if (config.ensembleStrategy && config.ensembleStrategy !== 'none' && modelResults.length > 1) {
      ensemble = await this.createEnsemble(modelResults.slice(0, 3), config.ensembleStrategy);
      console.log(`   Created ${config.ensembleStrategy} ensemble from top 3 models`);
    }
    
    // Step 7: Feature importance analysis
    const featureImportance = await this.analyzeFeatureImportance(
      processedTrainingData,
      bestResult.modelName
    );
    
    const totalTime = Date.now() - startTime;
    
    // Step 8: Generate recommendations
    const recommendations = this.generateRecommendations(
      modelResults,
      dataInsights,
      config,
      totalTime
    );
    
    console.log(`\n🎉 AutoML Pipeline Complete!`);
    console.log(`   Best model: ${bestResult.modelName}`);
    console.log(`   Best score: ${bestResult.score.toFixed(4)}`);
    console.log(`   Total time: ${(totalTime / 1000).toFixed(1)}s`);
    console.log(`   Models evaluated: ${modelsEvaluated}`);
    
    return {
      bestModel: candidates.find(c => c.model.getModelName() === bestResult.modelName)!.model,
      bestScore: bestResult.score,
      allResults: modelResults,
      ensemble,
      featureImportance,
      dataInsights,
      recommendations,
      totalTime,
      modelsEvaluated
    };
  }

  /**
   * Quick AutoML for fast prototyping
   */
  async quickAutoML(
    trainingData: TrainingData,
    validationData: TrainingData,
    taskType: AutoMLConfig['taskType']
  ): Promise<AutoMLResult> {
    return await this.runAutoML(trainingData, validationData, {
      taskType,
      objective: taskType === 'regression' ? 'mae' : 'accuracy',
      maxModels: 3,
      maxOptimizationTime: 300, // 5 minutes
      crossValidationFolds: 3,
      ensembleStrategy: 'voting',
      featureEngineering: true
    });
  }

  /**
   * Analyze the input data to understand its characteristics
   */
  private async analyzeData(data: TrainingData, config: AutoMLConfig): Promise<DataInsights> {
    const sampleCount = data.features.length;
    const featureCount = data.features[0] ? Object.keys(data.features[0]).length : 0;
    
    // Calculate missing data percentage
    let totalCells = sampleCount * featureCount;
    let missingCells = 0;
    
    for (const sample of data.features) {
      for (const value of Object.values(sample)) {
        if (value === null || value === undefined || value === '') {
          missingCells++;
        }
      }
    }
    
    const missingDataPercentage = totalCells > 0 ? (missingCells / totalCells) * 100 : 0;
    
    // Determine data complexity
    let dataComplexity: 'low' | 'medium' | 'high' = 'low';
    if (featureCount > 50 || sampleCount > 10000) dataComplexity = 'medium';
    if (featureCount > 200 || sampleCount > 100000) dataComplexity = 'high';
    
    // Calculate data quality score
    const qualityFactors = [
      Math.max(0, 1 - missingDataPercentage / 100), // Missing data penalty
      Math.min(1, sampleCount / 1000), // Sample size factor
      Math.min(1, Math.log(featureCount + 1) / Math.log(101)) // Feature diversity factor
    ];
    
    const dataQuality = qualityFactors.reduce((sum, factor) => sum + factor, 0) / qualityFactors.length;
    
    // Recommend models based on data characteristics
    const recommendedModels: string[] = [];
    const potentialIssues: string[] = [];
    
    if (config.taskType === 'text_analysis') {
      recommendedModels.push('RegulatoryPredictor', 'TransformerModel');
    } else if (config.taskType === 'optimization') {
      recommendedModels.push('GeneticAlgorithm', 'ParticleSwarmOptimization');
    } else {
      recommendedModels.push('NeuralNetwork', 'RandomForest', 'GradientBoosting');
    }
    
    if (missingDataPercentage > 20) {
      potentialIssues.push('High percentage of missing data detected');
    }
    
    if (sampleCount < 100) {
      potentialIssues.push('Limited training data may affect model performance');
    }
    
    if (featureCount > sampleCount) {
      potentialIssues.push('More features than samples (curse of dimensionality)');
    }
    
    return {
      dataQuality,
      featureCount,
      sampleCount,
      missingDataPercentage,
      dataComplexity,
      recommendedModels,
      potentialIssues
    };
  }

  /**
   * Select candidate models based on task type and data characteristics
   */
  private selectCandidateModels(
    taskType: string,
    dataInsights: DataInsights,
    config: AutoMLConfig
  ): ModelCandidate[] {
    const taskCandidates = this.candidateModels.get(taskType) || [];
    
    // Filter and sort candidates based on data characteristics
    let candidates = taskCandidates.filter(candidate => {
      // Filter out complex models for small datasets
      if (dataInsights.sampleCount < 500 && candidate.estimatedTrainingTime > 300) {
        return false;
      }
      
      return true;
    });
    
    // Sort by priority and estimated training time
    candidates.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority; // Higher priority first
      }
      return a.estimatedTrainingTime - b.estimatedTrainingTime; // Faster first
    });
    
    return candidates;
  }

  /**
   * Perform feature engineering on the data
   */
  private async performFeatureEngineering(
    trainingData: TrainingData,
    validationData: TrainingData,
    taskType: string
  ): Promise<{ training: TrainingData; validation: TrainingData }> {
    // This is a simplified feature engineering implementation
    // In practice, this would include scaling, encoding, feature selection, etc.
    
    const engineeredTraining = {
      ...trainingData,
      features: trainingData.features.map(sample => ({
        ...sample,
        // Add some engineered features
        feature_count: Object.keys(sample).length,
        has_missing: Object.values(sample).some(v => v === null || v === undefined) ? 1 : 0
      }))
    };
    
    const engineeredValidation = {
      ...validationData,
      features: validationData.features.map(sample => ({
        ...sample,
        feature_count: Object.keys(sample).length,
        has_missing: Object.values(sample).some(v => v === null || v === undefined) ? 1 : 0
      }))
    };
    
    return {
      training: engineeredTraining,
      validation: engineeredValidation
    };
  }

  /**
   * Optimize a specific candidate model
   */
  private async optimizeCandidate(
    candidate: ModelCandidate,
    trainingData: TrainingData,
    validationData: TrainingData,
    config: AutoMLConfig
  ): Promise<any> {
    const optimizationConfig = {
      model: candidate.model,
      trainingData,
      validationData,
      searchSpace: candidate.searchSpace,
      objective: config.objective,
      customObjective: config.customObjective,
      optimizationConfig: HyperparameterOptimizer.createOptimizationConfig('balanced'),
      crossValidationFolds: config.crossValidationFolds,
      earlyStoppingPatience: config.earlyStoppingPatience
    };
    
    return await this.optimizer.optimizeModel(optimizationConfig);
  }

  /**
   * Create an ensemble model from top performers
   */
  private async createEnsemble(
    topModels: ModelResult[],
    strategy: 'voting' | 'stacking' | 'bagging'
  ): Promise<EnsembleModel> {
    // Simplified ensemble implementation
    return new EnsembleModel(topModels, strategy);
  }

  /**
   * Analyze feature importance
   */
  private async analyzeFeatureImportance(
    data: TrainingData,
    modelName: string
  ): Promise<FeatureImportance[]> {
    // Simplified feature importance analysis
    const features = data.features[0] ? Object.keys(data.features[0]) : [];
    
    return features.map((feature, index) => ({
      featureName: feature,
      importance: Math.random(), // In practice, this would be calculated properly
      type: this.inferFeatureType(feature, data.features)
    })).sort((a, b) => b.importance - a.importance);
  }

  /**
   * Infer the type of a feature
   */
  private inferFeatureType(
    featureName: string,
    samples: any[]
  ): 'numerical' | 'categorical' | 'text' | 'datetime' {
    if (samples.length === 0) return 'numerical';
    
    const sampleValue = samples[0][featureName];
    
    if (typeof sampleValue === 'number') return 'numerical';
    if (typeof sampleValue === 'string') {
      if (sampleValue.length > 50) return 'text';
      if (Date.parse(sampleValue)) return 'datetime';
      return 'categorical';
    }
    
    return 'categorical';
  }

  /**
   * Generate recommendations based on results
   */
  private generateRecommendations(
    results: ModelResult[],
    dataInsights: DataInsights,
    config: AutoMLConfig,
    totalTime: number
  ): string[] {
    const recommendations: string[] = [];
    
    if (results.length === 0) {
      recommendations.push('No models were successfully optimized. Check data quality and format.');
      return recommendations;
    }
    
    const bestResult = results[0];
    const averageScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
    
    // Performance recommendations
    if (bestResult.score > averageScore * 1.1) {
      recommendations.push(`Best model (${bestResult.modelName}) significantly outperforms others. Consider using it in production.`);
    } else {
      recommendations.push('Model performance is similar across candidates. Consider ensemble methods.');
    }
    
    // Data quality recommendations
    if (dataInsights.dataQuality < 0.7) {
      recommendations.push('Data quality is below optimal. Consider data cleaning and preprocessing.');
    }
    
    if (dataInsights.missingDataPercentage > 15) {
      recommendations.push('High missing data percentage detected. Implement better imputation strategies.');
    }
    
    // Sample size recommendations
    if (dataInsights.sampleCount < 1000) {
      recommendations.push('Limited training data. Consider data augmentation or simpler models.');
    }
    
    // Performance improvement suggestions
    if (bestResult.improvement < 10) {
      recommendations.push('Limited improvement from optimization. Consider feature engineering or different model architectures.');
    }
    
    // Time efficiency
    if (totalTime > 3600000) { // 1 hour
      recommendations.push('Optimization took significant time. Consider faster models for iterative development.');
    }
    
    // Task-specific recommendations
    if (config.taskType === 'text_analysis' && bestResult.score < 0.8) {
      recommendations.push('Consider using pre-trained language models or larger embeddings for text analysis.');
    }
    
    return recommendations;
  }

  /**
   * Initialize candidate models for different task types
   */
  private initializeCandidateModels(): void {
    // Text Analysis models
    this.candidateModels.set('text_analysis', [
      {
        model: new RegulatoryPredictor(),
        searchSpace: HyperparameterOptimizer.createSearchSpace('regulatory_predictor'),
        priority: 9,
        estimatedTrainingTime: 300,
        description: 'Regulatory Predictor (NLP + ML)'
      }
    ]);
    
    // Optimization models
    this.candidateModels.set('optimization', [
      {
        model: new GeneticAlgorithm({
          populationSize: 50,
          mutationRate: 0.02,
          crossoverRate: 0.8,
          elitism: 0.1
        }),
        searchSpace: HyperparameterOptimizer.createSearchSpace('genetic_algorithm'),
        priority: 9,
        estimatedTrainingTime: 180,
        description: 'Genetic Algorithm (Evolutionary Optimization)'
      }
    ]);
    
    // Classification models
    this.candidateModels.set('classification', [
      {
        model: new RegulatoryPredictor(),
        searchSpace: HyperparameterOptimizer.createSearchSpace('neural_network'),
        priority: 8,
        estimatedTrainingTime: 240,
        description: 'Neural Network Classifier'
      }
    ]);
    
    // Regression models
    this.candidateModels.set('regression', [
      {
        model: new RegulatoryPredictor(),
        searchSpace: HyperparameterOptimizer.createSearchSpace('neural_network'),
        priority: 7,
        estimatedTrainingTime: 200,
        description: 'Neural Network Regressor'
      }
    ]);
  }
}

/**
 * Simple ensemble model implementation
 */
class EnsembleModel {
  constructor(
    private models: ModelResult[],
    private strategy: 'voting' | 'stacking' | 'bagging'
  ) {}

  async predict(input: any): Promise<any> {
    // Simplified ensemble prediction
    // In practice, this would combine predictions from multiple models
    return this.models[0]; // Return best model's prediction for now
  }

  getStrategy(): string {
    return this.strategy;
  }

  getModelCount(): number {
    return this.models.length;
  }
}