/**
 * ML Pipeline
 * Orchestrates data preprocessing, model training, and prediction workflows
 */

import { BaseMLModel, TrainingData, PredictionResult, ModelMetrics } from './base';

export interface PipelineStage {
  name: string;
  type: 'preprocessing' | 'feature_engineering' | 'model' | 'postprocessing';
  config: Record<string, any>;
  execute: (input: any) => Promise<any>;
}

export interface PipelineConfig {
  id: string;
  name: string;
  description: string;
  stages: PipelineStage[];
  metadata: Record<string, any>;
}

export class MLPipeline {
  private config: PipelineConfig;
  private stages: PipelineStage[];
  private isInitialized: boolean = false;
  private executionHistory: any[] = [];

  constructor(config: PipelineConfig) {
    this.config = config;
    this.stages = config.stages;
  }

  async initialize(): Promise<void> {
    // Initialize all pipeline stages
    console.log(`Initializing ML Pipeline: ${this.config.name}`);
    
    for (const stage of this.stages) {
      console.log(`Initializing stage: ${stage.name}`);
      // Stage-specific initialization would go here
    }
    
    this.isInitialized = true;
  }

  async execute(input: any): Promise<any> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    
    try {
      let currentOutput = input;
      const stageResults: any[] = [];

      // Execute each stage in sequence
      for (const stage of this.stages) {
        const stageStart = Date.now();
        currentOutput = await stage.execute(currentOutput);
        const stageDuration = Date.now() - stageStart;
        
        stageResults.push({
          stage: stage.name,
          duration: stageDuration,
          outputSize: JSON.stringify(currentOutput).length
        });
      }

      const totalDuration = Date.now() - startTime;
      
      // Record execution history
      this.executionHistory.push({
        id: executionId,
        timestamp: new Date(),
        duration: totalDuration,
        stages: stageResults,
        success: true
      });

      return currentOutput;
      
    } catch (error) {
      const totalDuration = Date.now() - startTime;
      
      this.executionHistory.push({
        id: executionId,
        timestamp: new Date(),
        duration: totalDuration,
        error: error instanceof Error ? error.message : String(error),
        success: false
      });
      
      throw error;
    }
  }

  async addStage(stage: PipelineStage, position?: number): Promise<void> {
    if (position !== undefined && position >= 0 && position <= this.stages.length) {
      this.stages.splice(position, 0, stage);
    } else {
      this.stages.push(stage);
    }
    
    // Update config
    this.config.stages = this.stages;
  }

  async removeStage(stageName: string): Promise<boolean> {
    const index = this.stages.findIndex(stage => stage.name === stageName);
    if (index >= 0) {
      this.stages.splice(index, 1);
      this.config.stages = this.stages;
      return true;
    }
    return false;
  }

  getConfig(): PipelineConfig {
    return { ...this.config };
  }

  getStages(): PipelineStage[] {
    return [...this.stages];
  }

  getExecutionHistory(): any[] {
    return [...this.executionHistory];
  }

  getMetrics() {
    const executions = this.executionHistory;
    const successful = executions.filter(e => e.success);
    const failed = executions.filter(e => !e.success);
    
    const avgDuration = successful.length > 0 
      ? successful.reduce((sum, e) => sum + e.duration, 0) / successful.length 
      : 0;

    return {
      totalExecutions: executions.length,
      successfulExecutions: successful.length,
      failedExecutions: failed.length,
      successRate: executions.length > 0 ? successful.length / executions.length : 0,
      averageDuration: avgDuration,
      lastExecution: executions.length > 0 ? executions[executions.length - 1].timestamp : null
    };
  }
}

/**
 * Common pipeline stages
 */
export class PipelineStages {
  static createDataValidation(config: any = {}): PipelineStage {
    return {
      name: 'data_validation',
      type: 'preprocessing',
      config,
      execute: async (input: any) => {
        // Basic data validation
        if (!input || typeof input !== 'object') {
          throw new Error('Invalid input data');
        }
        return input;
      }
    };
  }

  static createDataNormalization(config: any = {}): PipelineStage {
    return {
      name: 'data_normalization',
      type: 'preprocessing',
      config,
      execute: async (input: any) => {
        // Mock normalization - in reality this would normalize numerical features
        if (Array.isArray(input)) {
          return input.map(value => typeof value === 'number' ? value / 100 : value);
        }
        return input;
      }
    };
  }

  static createFeatureExtraction(config: any = {}): PipelineStage {
    return {
      name: 'feature_extraction',
      type: 'feature_engineering',
      config,
      execute: async (input: any) => {
        // Mock feature extraction
        return {
          ...input,
          extractedFeatures: {
            timestamp: new Date().toISOString(),
            processed: true
          }
        };
      }
    };
  }

  static createModelPrediction(model: BaseMLModel): PipelineStage {
    return {
      name: 'model_prediction',
      type: 'model',
      config: { modelId: model.getConfig().id },
      execute: async (input: any) => {
        return await model.predict(input);
      }
    };
  }

  static createResultFormatting(config: any = {}): PipelineStage {
    return {
      name: 'result_formatting',
      type: 'postprocessing',
      config,
      execute: async (input: any) => {
        // Format the final result
        return {
          result: input,
          timestamp: new Date().toISOString(),
          formatted: true
        };
      }
    };
  }
}

/**
 * Pipeline Builder for easy pipeline construction
 */
export class PipelineBuilder {
  private config: Partial<PipelineConfig> = {
    stages: []
  };

  setId(id: string): this {
    this.config.id = id;
    return this;
  }

  setName(name: string): this {
    this.config.name = name;
    return this;
  }

  setDescription(description: string): this {
    this.config.description = description;
    return this;
  }

  addStage(stage: PipelineStage): this {
    if (!this.config.stages) this.config.stages = [];
    this.config.stages.push(stage);
    return this;
  }

  addDataValidation(config?: any): this {
    return this.addStage(PipelineStages.createDataValidation(config));
  }

  addDataNormalization(config?: any): this {
    return this.addStage(PipelineStages.createDataNormalization(config));
  }

  addFeatureExtraction(config?: any): this {
    return this.addStage(PipelineStages.createFeatureExtraction(config));
  }

  addModelPrediction(model: BaseMLModel): this {
    return this.addStage(PipelineStages.createModelPrediction(model));
  }

  addResultFormatting(config?: any): this {
    return this.addStage(PipelineStages.createResultFormatting(config));
  }

  build(): MLPipeline {
    if (!this.config.id || !this.config.name || !this.config.stages?.length) {
      throw new Error('Pipeline must have id, name, and at least one stage');
    }

    const fullConfig: PipelineConfig = {
      id: this.config.id!,
      name: this.config.name!,
      description: this.config.description || '',
      stages: this.config.stages!,
      metadata: this.config.metadata || {}
    };

    return new MLPipeline(fullConfig);
  }
}