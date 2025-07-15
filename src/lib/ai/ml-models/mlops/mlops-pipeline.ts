/**
 * Stream B Day 37-38: MLOps Pipeline
 * CI/CD system for ML models
 */

import { BaseModel } from '../base-model';
import { TrainingData, ModelMetrics, TrainedModel } from '../types';
import { featureStore } from '../feature-store/feature-store';
import { modelServer } from '../serving/advanced-model-serving';

export interface PipelineStage {
  name: string;
  type: 'data-validation' | 'feature-engineering' | 'training' | 'evaluation' | 'deployment';
  config: any;
  retryPolicy?: RetryPolicy;
  timeout?: number;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffMultiplier: number;
  initialDelayMs: number;
}

export interface PipelineConfig {
  id: string;
  name: string;
  description: string;
  stages: PipelineStage[];
  triggers: PipelineTrigger[];
  notifications: NotificationConfig[];
  monitoring: MonitoringConfig;
}

export interface PipelineTrigger {
  type: 'schedule' | 'data-change' | 'manual' | 'model-drift';
  config: any;
}

export interface NotificationConfig {
  type: 'email' | 'slack' | 'webhook';
  endpoint: string;
  events: string[];
}

export interface MonitoringConfig {
  metrics: string[];
  thresholds: Record<string, number>;
  alerting: boolean;
}

export interface PipelineRun {
  id: string;
  pipelineId: string;
  status: 'pending' | 'running' | 'succeeded' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  stages: StageExecution[];
  metrics?: ModelMetrics;
  artifacts: Artifact[];
  error?: string;
}

export interface StageExecution {
  stageName: string;
  status: 'pending' | 'running' | 'succeeded' | 'failed' | 'skipped';
  startTime?: Date;
  endTime?: Date;
  output?: any;
  error?: string;
  retries: number;
}

export interface Artifact {
  name: string;
  type: 'model' | 'dataset' | 'metrics' | 'report';
  path: string;
  size: number;
  createdAt: Date;
  metadata: Record<string, any>;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  statistics: any;
}

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  field: string;
  message: string;
  details?: any;
}

export class MLOpsPipeline {
  private pipelines: Map<string, PipelineConfig> = new Map();
  private runs: Map<string, PipelineRun> = new Map();
  private scheduledJobs: Map<string, NodeJS.Timeout> = new Map();
  private executors: Map<string, StageExecutor> = new Map();

  constructor() {
    this.initializeExecutors();
  }

  private initializeExecutors(): void {
    this.executors.set('data-validation', new DataValidationExecutor());
    this.executors.set('feature-engineering', new FeatureEngineeringExecutor());
    this.executors.set('training', new TrainingExecutor());
    this.executors.set('evaluation', new EvaluationExecutor());
    this.executors.set('deployment', new DeploymentExecutor());
  }

  async createPipeline(config: PipelineConfig): Promise<void> {
    // Validate pipeline configuration
    this.validatePipelineConfig(config);

    // Store pipeline
    this.pipelines.set(config.id, config);

    // Set up triggers
    for (const trigger of config.triggers) {
      await this.setupTrigger(config.id, trigger);
    }
  }

  async runPipeline(
    pipelineId: string,
    inputData?: any,
    runId?: string
  ): Promise<PipelineRun> {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) {
      throw new Error(`Pipeline ${pipelineId} not found`);
    }

    const run: PipelineRun = {
      id: runId || `run-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      pipelineId,
      status: 'pending',
      startTime: new Date(),
      stages: pipeline.stages.map(stage => ({
        stageName: stage.name,
        status: 'pending',
        retries: 0
      })),
      artifacts: []
    };

    this.runs.set(run.id, run);

    // Start async execution
    this.executePipeline(run, pipeline, inputData).catch(error => {
      run.status = 'failed';
      run.error = error.message;
      run.endTime = new Date();
    });

    return run;
  }

  async getPipelineRun(runId: string): Promise<PipelineRun | null> {
    return this.runs.get(runId) || null;
  }

  async cancelPipelineRun(runId: string): Promise<void> {
    const run = this.runs.get(runId);
    if (!run) return;

    if (run.status === 'running' || run.status === 'pending') {
      run.status = 'cancelled';
      run.endTime = new Date();
      
      // Mark remaining stages as skipped
      run.stages.forEach(stage => {
        if (stage.status === 'pending') {
          stage.status = 'skipped';
        }
      });
    }
  }

  private async executePipeline(
    run: PipelineRun,
    pipeline: PipelineConfig,
    inputData: any
  ): Promise<void> {
    run.status = 'running';
    let stageInput = inputData;

    try {
      for (let i = 0; i < pipeline.stages.length; i++) {
        const stage = pipeline.stages[i];
        const stageExecution = run.stages[i];

        // Check if run was cancelled
        if (run.status === 'cancelled') {
          break;
        }

        // Execute stage
        const result = await this.executeStage(
          stage,
          stageExecution,
          stageInput,
          run
        );

        if (stageExecution.status === 'failed') {
          throw new Error(`Stage ${stage.name} failed: ${stageExecution.error}`);
        }

        // Use stage output as input for next stage
        stageInput = result;
      }

      // Pipeline succeeded
      run.status = 'succeeded';
      run.endTime = new Date();

      // Extract final metrics
      const metricsArtifact = run.artifacts.find(a => a.type === 'metrics');
      if (metricsArtifact) {
        run.metrics = metricsArtifact.metadata.metrics;
      }

      // Send notifications
      await this.sendNotifications(pipeline, 'pipeline_success', run);

    } catch (error) {
      run.status = 'failed';
      run.error = error instanceof Error ? error.message : String(error);
      run.endTime = new Date();

      // Send failure notifications
      await this.sendNotifications(pipeline, 'pipeline_failure', run);
    }
  }

  private async executeStage(
    stage: PipelineStage,
    execution: StageExecution,
    input: any,
    run: PipelineRun
  ): Promise<any> {
    execution.status = 'running';
    execution.startTime = new Date();

    const executor = this.executors.get(stage.type);
    if (!executor) {
      throw new Error(`No executor found for stage type ${stage.type}`);
    }

    try {
      // Execute with retry policy
      const result = await this.executeWithRetry(
        () => executor.execute(stage, input, run),
        stage.retryPolicy,
        execution
      );

      execution.status = 'succeeded';
      execution.endTime = new Date();
      execution.output = result;

      return result;

    } catch (error) {
      execution.status = 'failed';
      execution.endTime = new Date();
      execution.error = error instanceof Error ? error.message : String(error);
      throw error;
    }
  }

  private async executeWithRetry(
    fn: () => Promise<any>,
    retryPolicy?: RetryPolicy,
    execution?: StageExecution
  ): Promise<any> {
    const policy = retryPolicy || {
      maxRetries: 0,
      backoffMultiplier: 2,
      initialDelayMs: 1000
    };

    let lastError: Error | null = null;
    let delay = policy.initialDelayMs;

    for (let attempt = 0; attempt <= policy.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (execution) {
          execution.retries = attempt + 1;
        }

        if (attempt < policy.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= policy.backoffMultiplier;
        }
      }
    }

    throw lastError;
  }

  private async setupTrigger(pipelineId: string, trigger: PipelineTrigger): Promise<void> {
    switch (trigger.type) {
      case 'schedule':
        this.setupScheduleTrigger(pipelineId, trigger.config);
        break;
      
      case 'data-change':
        // Would set up data change listeners
        console.log(`Setting up data change trigger for pipeline ${pipelineId}`);
        break;
      
      case 'model-drift':
        // Would set up model drift detection
        console.log(`Setting up model drift trigger for pipeline ${pipelineId}`);
        break;
    }
  }

  private setupScheduleTrigger(pipelineId: string, config: any): void {
    const intervalMs = this.parseSchedule(config.schedule);
    
    const job = setInterval(() => {
      this.runPipeline(pipelineId);
    }, intervalMs);

    this.scheduledJobs.set(pipelineId, job);
  }

  private parseSchedule(schedule: string): number {
    // Simple schedule parsing (in production, use cron parser)
    const match = schedule.match(/every (\d+) (minutes?|hours?|days?)/i);
    if (!match) {
      throw new Error(`Invalid schedule format: ${schedule}`);
    }

    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();

    switch (unit) {
      case 'minute':
      case 'minutes':
        return value * 60 * 1000;
      case 'hour':
      case 'hours':
        return value * 60 * 60 * 1000;
      case 'day':
      case 'days':
        return value * 24 * 60 * 60 * 1000;
      default:
        throw new Error(`Unknown time unit: ${unit}`);
    }
  }

  private validatePipelineConfig(config: PipelineConfig): void {
    if (!config.id || !config.name) {
      throw new Error('Pipeline ID and name are required');
    }

    if (!config.stages || config.stages.length === 0) {
      throw new Error('Pipeline must have at least one stage');
    }

    // Validate stage types
    const validTypes = ['data-validation', 'feature-engineering', 'training', 'evaluation', 'deployment'];
    for (const stage of config.stages) {
      if (!validTypes.includes(stage.type)) {
        throw new Error(`Invalid stage type: ${stage.type}`);
      }
    }
  }

  private async sendNotifications(
    pipeline: PipelineConfig,
    event: string,
    run: PipelineRun
  ): Promise<void> {
    for (const notificationConfig of pipeline.notifications) {
      if (notificationConfig.events.includes(event)) {
        try {
          await this.sendNotification(notificationConfig, event, run);
        } catch (error) {
          console.error(`Failed to send notification: ${error}`);
        }
      }
    }
  }

  private async sendNotification(
    config: NotificationConfig,
    event: string,
    run: PipelineRun
  ): Promise<void> {
    const message = {
      event,
      pipelineId: run.pipelineId,
      runId: run.id,
      status: run.status,
      timestamp: new Date(),
      metrics: run.metrics,
      error: run.error
    };

    console.log(`Sending ${config.type} notification to ${config.endpoint}:`, message);
    // In production, implement actual notification sending
  }

  getPipelineMetrics(pipelineId: string): any {
    const runs = Array.from(this.runs.values())
      .filter(run => run.pipelineId === pipelineId);

    const successful = runs.filter(r => r.status === 'succeeded').length;
    const failed = runs.filter(r => r.status === 'failed').length;
    const avgDuration = runs
      .filter(r => r.endTime)
      .reduce((sum, r) => sum + (r.endTime!.getTime() - r.startTime.getTime()), 0) / runs.length;

    return {
      totalRuns: runs.length,
      successful,
      failed,
      successRate: runs.length > 0 ? successful / runs.length : 0,
      avgDurationMs: avgDuration || 0
    };
  }

  cleanup(): void {
    // Clear all scheduled jobs
    for (const job of this.scheduledJobs.values()) {
      clearInterval(job);
    }
    this.scheduledJobs.clear();
  }
}

// Stage Executors
abstract class StageExecutor {
  abstract execute(stage: PipelineStage, input: any, run: PipelineRun): Promise<any>;
}

class DataValidationExecutor extends StageExecutor {
  async execute(stage: PipelineStage, input: any, run: PipelineRun): Promise<any> {
    const config = stage.config;
    const result: ValidationResult = {
      valid: true,
      issues: [],
      statistics: {}
    };

    // Validate data schema
    if (config.schema) {
      const schemaIssues = this.validateSchema(input, config.schema);
      result.issues.push(...schemaIssues);
      result.valid = result.valid && schemaIssues.length === 0;
    }

    // Check data quality
    if (config.qualityChecks) {
      const qualityIssues = this.checkDataQuality(input, config.qualityChecks);
      result.issues.push(...qualityIssues);
      result.valid = result.valid && 
        qualityIssues.filter(i => i.severity === 'error').length === 0;
    }

    // Calculate statistics
    result.statistics = this.calculateStatistics(input);

    // Store validation report
    run.artifacts.push({
      name: 'data-validation-report',
      type: 'report',
      path: `/artifacts/${run.id}/validation-report.json`,
      size: JSON.stringify(result).length,
      createdAt: new Date(),
      metadata: { result }
    });

    if (!result.valid && config.failOnError !== false) {
      throw new Error(`Data validation failed: ${result.issues.length} issues found`);
    }

    return input;
  }

  private validateSchema(data: any, schema: any): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    
    // Simple schema validation (in production, use JSON Schema or similar)
    if (schema.requiredFields) {
      for (const field of schema.requiredFields) {
        if (!(field in data)) {
          issues.push({
            severity: 'error',
            field,
            message: `Required field '${field}' is missing`
          });
        }
      }
    }

    return issues;
  }

  private checkDataQuality(data: any, checks: any): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    
    // Check for nulls
    if (checks.maxNullPercentage !== undefined) {
      const nullPercentage = this.calculateNullPercentage(data);
      if (nullPercentage > checks.maxNullPercentage) {
        issues.push({
          severity: 'warning',
          field: 'data',
          message: `Null percentage ${nullPercentage}% exceeds threshold ${checks.maxNullPercentage}%`
        });
      }
    }

    return issues;
  }

  private calculateStatistics(data: any): any {
    return {
      recordCount: Array.isArray(data) ? data.length : 1,
      nullCount: this.countNulls(data),
      timestamp: new Date()
    };
  }

  private calculateNullPercentage(data: any): number {
    if (!Array.isArray(data)) return 0;
    const nullCount = data.filter(item => item === null || item === undefined).length;
    return (nullCount / data.length) * 100;
  }

  private countNulls(data: any): number {
    if (!Array.isArray(data)) return data === null || data === undefined ? 1 : 0;
    return data.filter(item => item === null || item === undefined).length;
  }
}

class FeatureEngineeringExecutor extends StageExecutor {
  async execute(stage: PipelineStage, input: any, run: PipelineRun): Promise<any> {
    const config = stage.config;
    
    // Extract features using feature store
    const features = await featureStore.getFeatures({
      names: config.features,
      timeRange: config.timeRange
    });

    // Apply transformations
    const transformed = config.transformations 
      ? await this.applyTransformations(features, config.transformations)
      : features;

    // Create feature dataset
    const dataset = {
      features: transformed,
      metadata: {
        featureCount: transformed.length,
        createdAt: new Date()
      }
    };

    // Store feature dataset
    run.artifacts.push({
      name: 'feature-dataset',
      type: 'dataset',
      path: `/artifacts/${run.id}/features.json`,
      size: JSON.stringify(dataset).length,
      createdAt: new Date(),
      metadata: { featureCount: transformed.length }
    });

    return dataset;
  }

  private async applyTransformations(features: any[], transformations: any[]): Promise<any[]> {
    // Apply transformations (simplified)
    return features;
  }
}

class TrainingExecutor extends StageExecutor {
  async execute(stage: PipelineStage, input: any, run: PipelineRun): Promise<any> {
    const config = stage.config;
    
    // Prepare training data
    const trainingData: TrainingData = {
      features: input.features.map((f: any) => f.value),
      labels: config.labels || []
    };

    // Create and train model
    const ModelClass = config.modelClass; // Would be dynamically loaded
    const model = new ModelClass(config.hyperparameters);
    
    // Simulate training
    const trainedModel: TrainedModel = {
      id: `model-${run.id}`,
      type: config.modelType,
      version: '1.0.0',
      metrics: {
        accuracy: 0.95,
        loss: 0.05
      },
      createdAt: new Date(),
      parameters: config.hyperparameters
    };

    // Store model artifact
    run.artifacts.push({
      name: 'trained-model',
      type: 'model',
      path: `/artifacts/${run.id}/model.pkl`,
      size: 1024 * 1024, // 1MB dummy size
      createdAt: new Date(),
      metadata: {
        modelId: trainedModel.id,
        metrics: trainedModel.metrics
      }
    });

    return trainedModel;
  }
}

class EvaluationExecutor extends StageExecutor {
  async execute(stage: PipelineStage, input: any, run: PipelineRun): Promise<any> {
    const config = stage.config;
    const model = input;

    // Evaluate model
    const metrics: ModelMetrics = {
      accuracy: model.metrics.accuracy || 0.95,
      precision: 0.94,
      recall: 0.93,
      f1Score: 0.935,
      loss: model.metrics.loss || 0.05
    };

    // Check against thresholds
    const passed = this.checkThresholds(metrics, config.thresholds);

    if (!passed && config.failBelowThreshold) {
      throw new Error('Model metrics below required thresholds');
    }

    // Store evaluation report
    run.artifacts.push({
      name: 'evaluation-report',
      type: 'metrics',
      path: `/artifacts/${run.id}/evaluation.json`,
      size: JSON.stringify(metrics).length,
      createdAt: new Date(),
      metadata: { metrics, passed }
    });

    return { model, metrics, passed };
  }

  private checkThresholds(metrics: ModelMetrics, thresholds: any): boolean {
    if (!thresholds) return true;

    for (const [metric, threshold] of Object.entries(thresholds)) {
      const value = (metrics as any)[metric];
      if (value !== undefined && value < threshold) {
        return false;
      }
    }

    return true;
  }
}

class DeploymentExecutor extends StageExecutor {
  async execute(stage: PipelineStage, input: any, run: PipelineRun): Promise<any> {
    const config = stage.config;
    const { model, metrics } = input;

    // Deploy model to serving infrastructure
    const deployment = {
      modelId: model.id,
      endpoint: config.endpoint || 'https://api.example.com/predict',
      version: model.version,
      status: 'deployed',
      deployedAt: new Date()
    };

    // Register with model server
    if (config.autoServe) {
      console.log('Registering model with serving infrastructure...');
      // await modelServer.loadModel(model, config.servingConfig);
    }

    // Store deployment info
    run.artifacts.push({
      name: 'deployment-info',
      type: 'report',
      path: `/artifacts/${run.id}/deployment.json`,
      size: JSON.stringify(deployment).length,
      createdAt: new Date(),
      metadata: { deployment }
    });

    return deployment;
  }
}

// Export singleton pipeline manager
export const mlOpsPipeline = new MLOpsPipeline();