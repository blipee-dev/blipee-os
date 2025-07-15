/**
 * Experiment Tracking and Model Versioning System
 */

import { ModelMetrics, ModelConfig } from '../types';

export interface Experiment {
  id: string;
  name: string;
  description: string;
  projectId: string;
  createdAt: Date;
  createdBy: string;
  tags: string[];
  status: 'active' | 'completed' | 'failed' | 'archived';
  runs: string[]; // Run IDs
}

export interface ExperimentRun {
  id: string;
  experimentId: string;
  name: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed' | 'stopped';
  parameters: Record<string, any>;
  metrics: Record<string, MetricValue[]>;
  artifacts: RunArtifact[];
  tags: string[];
  gitCommit?: string;
  environment?: EnvironmentInfo;
}

export interface MetricValue {
  value: number;
  step?: number;
  timestamp: Date;
}

export interface RunArtifact {
  name: string;
  type: string;
  path: string;
  size: number;
  hash: string;
  metadata: Record<string, any>;
}

export interface EnvironmentInfo {
  pythonVersion?: string;
  frameworks: Record<string, string>;
  systemInfo: {
    os: string;
    cpu: string;
    memory: string;
    gpu?: string;
  };
}

export interface ModelVersion {
  id: string;
  modelName: string;
  version: string;
  experimentRunId: string;
  createdAt: Date;
  createdBy: string;
  stage: 'development' | 'staging' | 'production' | 'archived';
  metrics: ModelMetrics;
  parameters: ModelConfig;
  artifacts: ModelArtifact[];
  tags: string[];
  description?: string;
}

export interface ModelArtifact {
  type: 'weights' | 'config' | 'preprocessor' | 'metadata';
  path: string;
  size: number;
  hash: string;
}

export interface ComparisonResult {
  runs: ExperimentRun[];
  metrics: MetricComparison[];
  parameters: ParameterComparison[];
  bestRun: string;
  summary: string;
}

export interface MetricComparison {
  metricName: string;
  values: Array<{
    runId: string;
    value: number;
    improvement?: number;
  }>;
  best: {
    runId: string;
    value: number;
  };
}

export interface ParameterComparison {
  parameterName: string;
  values: Array<{
    runId: string;
    value: any;
  }>;
}

export class ExperimentTracker {
  private experiments: Map<string, Experiment> = new Map();
  private runs: Map<string, ExperimentRun> = new Map();
  private models: Map<string, ModelVersion[]> = new Map();
  private activeRuns: Map<string, ExperimentRun> = new Map();

  async createExperiment(
    name: string,
    projectId: string,
    description: string,
    createdBy: string,
    tags: string[] = []
  ): Promise<Experiment> {
    const experiment: Experiment = {
      id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      projectId,
      createdAt: new Date(),
      createdBy,
      tags,
      status: 'active',
      runs: []
    };

    this.experiments.set(experiment.id, experiment);
    return experiment;
  }

  async startRun(
    experimentId: string,
    name: string,
    parameters: Record<string, any> = {}
  ): Promise<ExperimentRun> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    const run: ExperimentRun = {
      id: `run-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      experimentId,
      name,
      startTime: new Date(),
      status: 'running',
      parameters,
      metrics: {},
      artifacts: [],
      tags: [],
      environment: this.captureEnvironment()
    };

    this.runs.set(run.id, run);
    this.activeRuns.set(run.id, run);
    experiment.runs.push(run.id);

    return run;
  }

  async logMetric(
    runId: string,
    metricName: string,
    value: number,
    step?: number
  ): Promise<void> {
    const run = this.activeRuns.get(runId);
    if (!run) {
      throw new Error(`Active run ${runId} not found`);
    }

    if (!run.metrics[metricName]) {
      run.metrics[metricName] = [];
    }

    run.metrics[metricName].push({
      value,
      step,
      timestamp: new Date()
    });
  }

  async logMetrics(
    runId: string,
    metrics: Record<string, number>,
    step?: number
  ): Promise<void> {
    for (const [name, value] of Object.entries(metrics)) {
      await this.logMetric(runId, name, value, step);
    }
  }

  async logParameter(
    runId: string,
    paramName: string,
    value: any
  ): Promise<void> {
    const run = this.activeRuns.get(runId);
    if (!run) {
      throw new Error(`Active run ${runId} not found`);
    }

    run.parameters[paramName] = value;
  }

  async logParameters(
    runId: string,
    params: Record<string, any>
  ): Promise<void> {
    const run = this.activeRuns.get(runId);
    if (!run) {
      throw new Error(`Active run ${runId} not found`);
    }

    Object.assign(run.parameters, params);
  }

  async logArtifact(
    runId: string,
    name: string,
    path: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const run = this.activeRuns.get(runId);
    if (!run) {
      throw new Error(`Active run ${runId} not found`);
    }

    const artifact: RunArtifact = {
      name,
      type: this.inferArtifactType(name),
      path,
      size: 0, // Would calculate actual size
      hash: this.calculateHash(path),
      metadata
    };

    run.artifacts.push(artifact);
  }

  async endRun(
    runId: string,
    status: 'completed' | 'failed' | 'stopped' = 'completed'
  ): Promise<void> {
    const run = this.activeRuns.get(runId);
    if (!run) {
      throw new Error(`Active run ${runId} not found`);
    }

    run.status = status;
    run.endTime = new Date();
    this.activeRuns.delete(runId);

    // Update experiment status if all runs are completed
    const experiment = this.experiments.get(run.experimentId);
    if (experiment) {
      const allRunsCompleted = experiment.runs
        .map(id => this.runs.get(id))
        .every(r => r && r.status !== 'running');
      
      if (allRunsCompleted) {
        experiment.status = 'completed';
      }
    }
  }

  async registerModel(
    modelName: string,
    runId: string,
    version: string,
    createdBy: string,
    description?: string
  ): Promise<ModelVersion> {
    const run = this.runs.get(runId);
    if (!run) {
      throw new Error(`Run ${runId} not found`);
    }

    // Extract final metrics
    const metrics: ModelMetrics = {};
    for (const [name, values] of Object.entries(run.metrics)) {
      if (values.length > 0) {
        metrics[name] = values[values.length - 1].value;
      }
    }

    const modelVersion: ModelVersion = {
      id: `model-${Date.now()}`,
      modelName,
      version,
      experimentRunId: runId,
      createdAt: new Date(),
      createdBy,
      stage: 'development',
      metrics,
      parameters: run.parameters as ModelConfig,
      artifacts: this.extractModelArtifacts(run.artifacts),
      tags: run.tags,
      description
    };

    const versions = this.models.get(modelName) || [];
    versions.push(modelVersion);
    versions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    this.models.set(modelName, versions);

    return modelVersion;
  }

  async transitionModelStage(
    modelName: string,
    version: string,
    stage: 'development' | 'staging' | 'production' | 'archived'
  ): Promise<void> {
    const versions = this.models.get(modelName);
    if (!versions) {
      throw new Error(`Model ${modelName} not found`);
    }

    const modelVersion = versions.find(v => v.version === version);
    if (!modelVersion) {
      throw new Error(`Version ${version} not found for model ${modelName}`);
    }

    // If transitioning to production, archive current production version
    if (stage === 'production') {
      const currentProd = versions.find(v => v.stage === 'production');
      if (currentProd && currentProd.id !== modelVersion.id) {
        currentProd.stage = 'archived';
      }
    }

    modelVersion.stage = stage;
  }

  async compareRuns(runIds: string[]): Promise<ComparisonResult> {
    const runs = runIds
      .map(id => this.runs.get(id))
      .filter(run => run !== undefined) as ExperimentRun[];

    if (runs.length < 2) {
      throw new Error('At least 2 runs required for comparison');
    }

    // Compare metrics
    const metricComparisons = this.compareMetrics(runs);
    
    // Compare parameters
    const parameterComparisons = this.compareParameters(runs);

    // Determine best run based on primary metric
    const primaryMetric = 'accuracy'; // Configurable
    const bestRun = this.determineBestRun(runs, primaryMetric);

    return {
      runs,
      metrics: metricComparisons,
      parameters: parameterComparisons,
      bestRun,
      summary: this.generateComparisonSummary(runs, metricComparisons)
    };
  }

  private compareMetrics(runs: ExperimentRun[]): MetricComparison[] {
    const allMetrics = new Set<string>();
    runs.forEach(run => {
      Object.keys(run.metrics).forEach(metric => allMetrics.add(metric));
    });

    const comparisons: MetricComparison[] = [];

    for (const metricName of allMetrics) {
      const values = runs.map(run => {
        const metricValues = run.metrics[metricName];
        const finalValue = metricValues && metricValues.length > 0
          ? metricValues[metricValues.length - 1].value
          : null;

        return {
          runId: run.id,
          value: finalValue || 0
        };
      }).filter(v => v.value !== null);

      if (values.length > 0) {
        const best = values.reduce((a, b) => 
          this.isBetterMetric(metricName, a.value, b.value) ? a : b
        );

        // Calculate improvements
        values.forEach(v => {
          if (v.runId !== best.runId) {
            v.improvement = ((best.value - v.value) / v.value) * 100;
          }
        });

        comparisons.push({
          metricName,
          values,
          best
        });
      }
    }

    return comparisons;
  }

  private compareParameters(runs: ExperimentRun[]): ParameterComparison[] {
    const allParams = new Set<string>();
    runs.forEach(run => {
      Object.keys(run.parameters).forEach(param => allParams.add(param));
    });

    return Array.from(allParams).map(paramName => ({
      parameterName: paramName,
      values: runs.map(run => ({
        runId: run.id,
        value: run.parameters[paramName]
      }))
    }));
  }

  private determineBestRun(runs: ExperimentRun[], primaryMetric: string): string {
    let bestRun = runs[0];
    let bestValue = this.getMetricValue(bestRun, primaryMetric);

    for (const run of runs.slice(1)) {
      const value = this.getMetricValue(run, primaryMetric);
      if (this.isBetterMetric(primaryMetric, value, bestValue)) {
        bestRun = run;
        bestValue = value;
      }
    }

    return bestRun.id;
  }

  private getMetricValue(run: ExperimentRun, metricName: string): number {
    const values = run.metrics[metricName];
    return values && values.length > 0 
      ? values[values.length - 1].value 
      : 0;
  }

  private isBetterMetric(metricName: string, a: number, b: number): boolean {
    // Metrics where lower is better
    const lowerIsBetter = ['loss', 'error', 'mae', 'mse', 'rmse'];
    
    if (lowerIsBetter.includes(metricName.toLowerCase())) {
      return a < b;
    }
    
    return a > b;
  }

  private generateComparisonSummary(
    runs: ExperimentRun[],
    metrics: MetricComparison[]
  ): string {
    const summary: string[] = [];
    
    summary.push(`Compared ${runs.length} runs:`);
    
    for (const metric of metrics) {
      const improvement = metric.values
        .filter(v => v.improvement !== undefined)
        .map(v => v.improvement!)
        .reduce((max, val) => Math.max(max, Math.abs(val)), 0);
      
      if (improvement > 0) {
        summary.push(
          `- ${metric.metricName}: Best run shows ${improvement.toFixed(1)}% improvement`
        );
      }
    }

    return summary.join('\n');
  }

  private captureEnvironment(): EnvironmentInfo {
    return {
      frameworks: {
        nodejs: process.version,
        typescript: '5.0' // Would detect actual version
      },
      systemInfo: {
        os: process.platform,
        cpu: process.arch,
        memory: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
      }
    };
  }

  private inferArtifactType(name: string): string {
    if (name.includes('model')) return 'model';
    if (name.includes('dataset') || name.includes('data')) return 'dataset';
    if (name.includes('plot') || name.includes('chart')) return 'visualization';
    return 'other';
  }

  private calculateHash(path: string): string {
    // Simplified hash calculation
    return Buffer.from(path).toString('base64').substr(0, 16);
  }

  private extractModelArtifacts(artifacts: RunArtifact[]): ModelArtifact[] {
    return artifacts
      .filter(a => a.type === 'model' || a.name.includes('model'))
      .map(a => ({
        type: 'weights' as const,
        path: a.path,
        size: a.size,
        hash: a.hash
      }));
  }

  // Query methods
  getExperiment(experimentId: string): Experiment | null {
    return this.experiments.get(experimentId) || null;
  }

  getRun(runId: string): ExperimentRun | null {
    return this.runs.get(runId) || null;
  }

  getModelVersions(modelName: string): ModelVersion[] {
    return this.models.get(modelName) || [];
  }

  getLatestModelVersion(
    modelName: string,
    stage?: 'development' | 'staging' | 'production'
  ): ModelVersion | null {
    const versions = this.models.get(modelName) || [];
    
    if (stage) {
      const stageVersions = versions.filter(v => v.stage === stage);
      return stageVersions.length > 0 ? stageVersions[0] : null;
    }
    
    return versions[0] || null;
  }

  searchExperiments(query: {
    projectId?: string;
    tags?: string[];
    status?: string;
    createdBy?: string;
  }): Experiment[] {
    return Array.from(this.experiments.values()).filter(exp => {
      if (query.projectId && exp.projectId !== query.projectId) return false;
      if (query.status && exp.status !== query.status) return false;
      if (query.createdBy && exp.createdBy !== query.createdBy) return false;
      if (query.tags && !query.tags.every(tag => exp.tags.includes(tag))) return false;
      return true;
    });
  }

  searchRuns(query: {
    experimentId?: string;
    status?: string;
    tags?: string[];
    minMetric?: { name: string; value: number };
  }): ExperimentRun[] {
    return Array.from(this.runs.values()).filter(run => {
      if (query.experimentId && run.experimentId !== query.experimentId) return false;
      if (query.status && run.status !== query.status) return false;
      if (query.tags && !query.tags.every(tag => run.tags.includes(tag))) return false;
      
      if (query.minMetric) {
        const value = this.getMetricValue(run, query.minMetric.name);
        if (value < query.minMetric.value) return false;
      }
      
      return true;
    });
  }
}

// Export singleton experiment tracker
export const experimentTracker = new ExperimentTracker();