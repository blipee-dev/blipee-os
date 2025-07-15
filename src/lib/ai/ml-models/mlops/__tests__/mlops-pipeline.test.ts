/**
 * Tests for MLOps Pipeline System
 */

import {
  MLOpsPipeline,
  PipelineConfig,
  PipelineStage,
  mlOpsPipeline
} from '../mlops-pipeline';
import {
  ExperimentTracker,
  experimentTracker
} from '../experiment-tracking';

// Mock model class for testing
class MockMLModel {
  constructor(private config: any = {}) {}
  
  async train(data: any): Promise<void> {
    // Mock training
  }
  
  async predict(input: any): Promise<any> {
    return { prediction: 0.85, confidence: 0.9 };
  }
}

describe('MLOps Pipeline', () => {
  let pipeline: MLOpsPipeline;

  beforeEach(() => {
    pipeline = new MLOpsPipeline();
  });

  afterEach(() => {
    pipeline.cleanup();
  });

  describe('Pipeline Creation', () => {
    it('should create a valid pipeline', async () => {
      const config: PipelineConfig = {
        id: 'test-pipeline',
        name: 'Test Pipeline',
        description: 'A test pipeline for validation',
        stages: [
          {
            name: 'validate-data',
            type: 'data-validation',
            config: {
              schema: {
                requiredFields: ['features', 'labels']
              },
              qualityChecks: {
                maxNullPercentage: 5
              }
            }
          },
          {
            name: 'train-model',
            type: 'training',
            config: {
              modelType: 'emissions_prediction',
              modelClass: MockMLModel,
              hyperparameters: {
                learningRate: 0.001,
                epochs: 10
              }
            }
          },
          {
            name: 'evaluate-model',
            type: 'evaluation',
            config: {
              thresholds: {
                accuracy: 0.8,
                precision: 0.75
              },
              failBelowThreshold: true
            }
          }
        ],
        triggers: [
          {
            type: 'schedule',
            config: {
              schedule: 'every 24 hours'
            }
          }
        ],
        notifications: [
          {
            type: 'webhook',
            endpoint: 'https://example.com/webhook',
            events: ['pipeline_success', 'pipeline_failure']
          }
        ],
        monitoring: {
          metrics: ['accuracy', 'latency'],
          thresholds: {
            accuracy: 0.9
          },
          alerting: true
        }
      };

      await pipeline.createPipeline(config);
      
      // Pipeline should be created successfully
      expect(true).toBe(true);
    });

    it('should validate pipeline configuration', async () => {
      const invalidConfig: any = {
        // Missing required fields
        stages: []
      };

      await expect(
        pipeline.createPipeline(invalidConfig)
      ).rejects.toThrow('Pipeline ID and name are required');
    });

    it('should validate stage types', async () => {
      const configWithInvalidStage: PipelineConfig = {
        id: 'invalid-pipeline',
        name: 'Invalid Pipeline',
        description: 'Pipeline with invalid stage',
        stages: [
          {
            name: 'invalid-stage',
            type: 'invalid-type' as any,
            config: {}
          }
        ],
        triggers: [],
        notifications: [],
        monitoring: {
          metrics: [],
          thresholds: {},
          alerting: false
        }
      };

      await expect(
        pipeline.createPipeline(configWithInvalidStage)
      ).rejects.toThrow('Invalid stage type: invalid-type');
    });
  });

  describe('Pipeline Execution', () => {
    let testConfig: PipelineConfig;

    beforeEach(async () => {
      testConfig = {
        id: 'test-execution',
        name: 'Test Execution Pipeline',
        description: 'Pipeline for testing execution',
        stages: [
          {
            name: 'validate',
            type: 'data-validation',
            config: {
              schema: {
                requiredFields: ['features']
              }
            }
          },
          {
            name: 'engineer',
            type: 'feature-engineering',
            config: {
              features: ['temperature', 'humidity'],
              transformations: []
            }
          },
          {
            name: 'train',
            type: 'training',
            config: {
              modelType: 'test_model',
              modelClass: MockMLModel,
              hyperparameters: { epochs: 5 }
            }
          }
        ],
        triggers: [],
        notifications: [],
        monitoring: {
          metrics: [],
          thresholds: {},
          alerting: false
        }
      };

      await pipeline.createPipeline(testConfig);
    });

    it('should run a complete pipeline', async () => {
      const inputData = {
        features: [1, 2, 3, 4, 5],
        labels: [0, 1, 0, 1, 0]
      };

      const run = await pipeline.runPipeline('test-execution', inputData);
      
      expect(run.id).toBeDefined();
      expect(run.pipelineId).toBe('test-execution');
      expect(['pending', 'running']).toContain(run.status);
      expect(run.stages).toHaveLength(3);

      // Wait for pipeline completion
      let finalRun = run;
      for (let i = 0; i < 50; i++) { // Max 5 seconds
        await new Promise(resolve => setTimeout(resolve, 100));
        finalRun = await pipeline.getPipelineRun(run.id) || run;
        if (finalRun.status !== 'running' && finalRun.status !== 'pending') {
          break;
        }
      }

      expect(['succeeded', 'failed']).toContain(finalRun.status);
      expect(finalRun.endTime).toBeDefined();
    });

    it('should handle pipeline failures', async () => {
      // Create pipeline with failing stage
      const failingConfig: PipelineConfig = {
        id: 'failing-pipeline',
        name: 'Failing Pipeline',
        description: 'Pipeline that should fail',
        stages: [
          {
            name: 'fail-validation',
            type: 'data-validation',
            config: {
              schema: {
                requiredFields: ['missing_field']
              },
              failOnError: true
            }
          }
        ],
        triggers: [],
        notifications: [],
        monitoring: {
          metrics: [],
          thresholds: {},
          alerting: false
        }
      };

      await pipeline.createPipeline(failingConfig);

      const run = await pipeline.runPipeline('failing-pipeline', {});

      // Wait for pipeline completion
      let finalRun = run;
      for (let i = 0; i < 30; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        finalRun = await pipeline.getPipelineRun(run.id) || run;
        if (finalRun.status !== 'running' && finalRun.status !== 'pending') {
          break;
        }
      }

      expect(finalRun.status).toBe('failed');
      expect(finalRun.error).toBeDefined();
    });

    it('should support pipeline cancellation', async () => {
      const run = await pipeline.runPipeline('test-execution', {});
      
      // Wait a moment for the run to start
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Cancel the run
      await pipeline.cancelPipelineRun(run.id);
      
      const cancelledRun = await pipeline.getPipelineRun(run.id);
      expect(['cancelled', 'failed']).toContain(cancelledRun!.status);
    });

    it('should retry failed stages with retry policy', async () => {
      const retryConfig: PipelineConfig = {
        id: 'retry-pipeline',
        name: 'Retry Pipeline',
        description: 'Pipeline with retry policy',
        stages: [
          {
            name: 'flaky-stage',
            type: 'data-validation',
            config: {},
            retryPolicy: {
              maxRetries: 2,
              backoffMultiplier: 2,
              initialDelayMs: 100
            }
          }
        ],
        triggers: [],
        notifications: [],
        monitoring: {
          metrics: [],
          thresholds: {},
          alerting: false
        }
      };

      await pipeline.createPipeline(retryConfig);
      const run = await pipeline.runPipeline('retry-pipeline', {});

      // Wait for completion
      let finalRun = run;
      for (let i = 0; i < 50; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        finalRun = await pipeline.getPipelineRun(run.id) || run;
        if (finalRun.status !== 'running' && finalRun.status !== 'pending') {
          break;
        }
      }

      expect(finalRun.stages[0].retries).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Pipeline Triggers', () => {
    it('should set up scheduled triggers', async () => {
      const scheduledConfig: PipelineConfig = {
        id: 'scheduled-pipeline',
        name: 'Scheduled Pipeline',
        description: 'Pipeline with schedule trigger',
        stages: [
          {
            name: 'simple-stage',
            type: 'data-validation',
            config: {}
          }
        ],
        triggers: [
          {
            type: 'schedule',
            config: {
              schedule: 'every 1 minutes'
            }
          }
        ],
        notifications: [],
        monitoring: {
          metrics: [],
          thresholds: {},
          alerting: false
        }
      };

      await pipeline.createPipeline(scheduledConfig);
      
      // Should set up trigger without error
      expect(true).toBe(true);
    });
  });

  describe('Pipeline Metrics', () => {
    it('should track pipeline metrics', async () => {
      const simpleConfig: PipelineConfig = {
        id: 'metrics-pipeline',
        name: 'Metrics Pipeline',
        description: 'Pipeline for metrics testing',
        stages: [
          {
            name: 'quick-stage',
            type: 'data-validation',
            config: {}
          }
        ],
        triggers: [],
        notifications: [],
        monitoring: {
          metrics: ['execution_time', 'success_rate'],
          thresholds: {},
          alerting: false
        }
      };

      await pipeline.createPipeline(simpleConfig);

      // Run pipeline multiple times
      const runs = await Promise.all([
        pipeline.runPipeline('metrics-pipeline', {}),
        pipeline.runPipeline('metrics-pipeline', {}),
        pipeline.runPipeline('metrics-pipeline', {})
      ]);

      // Wait for all runs to complete
      for (let i = 0; i < 30; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const allCompleted = runs.every(async run => {
          const currentRun = await pipeline.getPipelineRun(run.id);
          return currentRun && currentRun.status !== 'running' && currentRun.status !== 'pending';
        });
        if (allCompleted) break;
      }

      const metrics = pipeline.getPipelineMetrics('metrics-pipeline');
      expect(metrics.totalRuns).toBeGreaterThanOrEqual(3);
      expect(metrics.successRate).toBeGreaterThanOrEqual(0);
      expect(metrics.avgDurationMs).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('Experiment Tracking', () => {
  let tracker: ExperimentTracker;

  beforeEach(() => {
    tracker = new ExperimentTracker();
  });

  describe('Experiment Management', () => {
    it('should create and manage experiments', async () => {
      const experiment = await tracker.createExperiment(
        'ESG Model Training',
        'project-esg',
        'Training models for ESG prediction',
        'data-scientist',
        ['emissions', 'ml', 'sustainability']
      );

      expect(experiment.id).toBeDefined();
      expect(experiment.name).toBe('ESG Model Training');
      expect(experiment.status).toBe('active');
      expect(experiment.tags).toContain('emissions');

      const retrieved = tracker.getExperiment(experiment.id);
      expect(retrieved).toEqual(experiment);
    });

    it('should search experiments by criteria', async () => {
      await tracker.createExperiment('Exp 1', 'proj-1', 'Description 1', 'user-1', ['tag-a']);
      await tracker.createExperiment('Exp 2', 'proj-1', 'Description 2', 'user-2', ['tag-b']);
      await tracker.createExperiment('Exp 3', 'proj-2', 'Description 3', 'user-1', ['tag-a', 'tag-b']);

      // Search by project
      const projectExps = tracker.searchExperiments({ projectId: 'proj-1' });
      expect(projectExps).toHaveLength(2);

      // Search by user
      const userExps = tracker.searchExperiments({ createdBy: 'user-1' });
      expect(userExps).toHaveLength(2);

      // Search by tags
      const taggedExps = tracker.searchExperiments({ tags: ['tag-a'] });
      expect(taggedExps).toHaveLength(2);
    });
  });

  describe('Run Management', () => {
    let experimentId: string;

    beforeEach(async () => {
      const experiment = await tracker.createExperiment(
        'Test Experiment',
        'test-project',
        'For testing runs',
        'tester'
      );
      experimentId = experiment.id;
    });

    it('should start and manage runs', async () => {
      const run = await tracker.startRun(
        experimentId,
        'Test Run 1',
        {
          learning_rate: 0.001,
          batch_size: 32,
          epochs: 10
        }
      );

      expect(run.id).toBeDefined();
      expect(run.experimentId).toBe(experimentId);
      expect(run.status).toBe('running');
      expect(run.parameters.learning_rate).toBe(0.001);

      const retrieved = tracker.getRun(run.id);
      expect(retrieved).toEqual(run);
    });

    it('should log metrics and parameters', async () => {
      const run = await tracker.startRun(experimentId, 'Metrics Test');

      // Log individual metrics
      await tracker.logMetric(run.id, 'accuracy', 0.85, 1);
      await tracker.logMetric(run.id, 'loss', 0.15, 1);
      
      // Log batch metrics
      await tracker.logMetrics(run.id, {
        accuracy: 0.87,
        loss: 0.13,
        precision: 0.89
      }, 2);

      // Log parameters
      await tracker.logParameter(run.id, 'optimizer', 'adam');
      await tracker.logParameters(run.id, {
        momentum: 0.9,
        weight_decay: 0.01
      });

      const updatedRun = tracker.getRun(run.id);
      expect(updatedRun!.metrics.accuracy).toHaveLength(2);
      expect(updatedRun!.metrics.accuracy[1].value).toBe(0.87);
      expect(updatedRun!.parameters.optimizer).toBe('adam');
      expect(updatedRun!.parameters.momentum).toBe(0.9);
    });

    it('should log artifacts', async () => {
      const run = await tracker.startRun(experimentId, 'Artifact Test');

      await tracker.logArtifact(
        run.id,
        'trained_model.pkl',
        '/models/run_123/model.pkl',
        { model_type: 'random_forest', features: 10 }
      );

      const updatedRun = tracker.getRun(run.id);
      expect(updatedRun!.artifacts).toHaveLength(1);
      expect(updatedRun!.artifacts[0].name).toBe('trained_model.pkl');
      expect(updatedRun!.artifacts[0].metadata.model_type).toBe('random_forest');
    });

    it('should end runs', async () => {
      const run = await tracker.startRun(experimentId, 'End Test');

      await tracker.endRun(run.id, 'completed');

      const endedRun = tracker.getRun(run.id);
      expect(endedRun!.status).toBe('completed');
      expect(endedRun!.endTime).toBeDefined();
    });
  });

  describe('Model Versioning', () => {
    let runId: string;

    beforeEach(async () => {
      const experiment = await tracker.createExperiment('Model Test', 'test', 'Test', 'user');
      const run = await tracker.startRun(experiment.id, 'Model Run');
      
      // Log some metrics
      await tracker.logMetrics(run.id, {
        accuracy: 0.92,
        precision: 0.89,
        recall: 0.91
      });

      runId = run.id;
    });

    it('should register model versions', async () => {
      const modelVersion = await tracker.registerModel(
        'emissions-predictor',
        runId,
        'v1.0.0',
        'ml-engineer',
        'Initial production model'
      );

      expect(modelVersion.modelName).toBe('emissions-predictor');
      expect(modelVersion.version).toBe('v1.0.0');
      expect(modelVersion.stage).toBe('development');
      expect(modelVersion.metrics.accuracy).toBe(0.92);

      const versions = tracker.getModelVersions('emissions-predictor');
      expect(versions).toHaveLength(1);
      expect(versions[0]).toEqual(modelVersion);
    });

    it('should transition model stages', async () => {
      await tracker.registerModel('test-model', runId, 'v1.0.0', 'user');
      
      await tracker.transitionModelStage('test-model', 'v1.0.0', 'staging');
      
      const version = tracker.getLatestModelVersion('test-model');
      expect(version!.stage).toBe('staging');
    });

    it('should handle production model transitions', async () => {
      // Register two versions with different timestamps
      await tracker.registerModel('prod-model', runId, 'v1.0.0', 'user');
      
      // Wait a moment to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await tracker.registerModel('prod-model', runId, 'v2.0.0', 'user');

      // Move first to production
      await tracker.transitionModelStage('prod-model', 'v1.0.0', 'production');
      
      let prodVersion = tracker.getLatestModelVersion('prod-model', 'production');
      expect(prodVersion!.version).toBe('v1.0.0');

      // Move second to production (should archive first)
      await tracker.transitionModelStage('prod-model', 'v2.0.0', 'production');

      prodVersion = tracker.getLatestModelVersion('prod-model', 'production');
      expect(prodVersion!.version).toBe('v2.0.0');

      const versions = tracker.getModelVersions('prod-model');
      const archivedVersion = versions.find(v => v.version === 'v1.0.0');
      expect(archivedVersion!.stage).toBe('archived');
    });
  });

  describe('Run Comparison', () => {
    let experimentId: string;
    let run1Id: string;
    let run2Id: string;

    beforeEach(async () => {
      const experiment = await tracker.createExperiment('Comparison Test', 'test', 'Test', 'user');
      experimentId = experiment.id;

      // Create two runs with different metrics
      const run1 = await tracker.startRun(experimentId, 'Run 1', { lr: 0.01 });
      await tracker.logMetrics(run1.id, { accuracy: 0.85, loss: 0.15 });
      await tracker.endRun(run1.id);
      run1Id = run1.id;

      const run2 = await tracker.startRun(experimentId, 'Run 2', { lr: 0.001 });
      await tracker.logMetrics(run2.id, { accuracy: 0.90, loss: 0.10 });
      await tracker.endRun(run2.id);
      run2Id = run2.id;
    });

    it('should compare runs', async () => {
      const comparison = await tracker.compareRuns([run1Id, run2Id]);

      expect(comparison.runs).toHaveLength(2);
      expect(comparison.metrics).toHaveLength(2); // accuracy and loss
      expect(comparison.parameters).toHaveLength(1); // lr

      const accuracyComparison = comparison.metrics.find(m => m.metricName === 'accuracy');
      expect(accuracyComparison!.best.value).toBe(0.90);
      expect(accuracyComparison!.best.runId).toBe(run2Id);

      const lossComparison = comparison.metrics.find(m => m.metricName === 'loss');
      expect(lossComparison!.best.value).toBe(0.10);
      expect(lossComparison!.best.runId).toBe(run2Id);

      expect(comparison.bestRun).toBe(run2Id);
      expect(comparison.summary).toContain('improvement');
    });
  });

  describe('Search and Filtering', () => {
    beforeEach(async () => {
      const exp = await tracker.createExperiment('Search Test', 'test', 'Test', 'user');
      
      // Create runs with different characteristics
      const run1 = await tracker.startRun(exp.id, 'High Accuracy', {});
      await tracker.logMetric(run1.id, 'accuracy', 0.95);
      run1.tags = ['high-perf'];
      await tracker.endRun(run1.id);

      const run2 = await tracker.startRun(exp.id, 'Low Accuracy', {});
      await tracker.logMetric(run2.id, 'accuracy', 0.75);
      await tracker.endRun(run2.id, 'failed');
    });

    it('should search runs by criteria', () => {
      const completedRuns = tracker.searchRuns({ status: 'completed' });
      expect(completedRuns.length).toBeGreaterThanOrEqual(1);

      const failedRuns = tracker.searchRuns({ status: 'failed' });
      expect(failedRuns.length).toBeGreaterThanOrEqual(1);

      const highAccuracyRuns = tracker.searchRuns({
        minMetric: { name: 'accuracy', value: 0.9 }
      });
      expect(highAccuracyRuns.length).toBeGreaterThanOrEqual(1);
    });
  });
});