/**
 * Stream B Day 39-40: Integration Tests for Advanced Features
 * Tests end-to-end workflows combining all Stream B Week 7-8 features
 */

import { BaseModel } from '../base-model';
import { TrainingData } from '../types';
import { DistributedTrainingCoordinator, WorkerNode } from '../distributed/distributed-training';
import { AdvancedModelServer, ModelServingConfig } from '../serving/advanced-model-serving';
import { FeatureStore, FeatureDefinition, FeatureSet } from '../feature-store/feature-store';
import { FeatureRegistry } from '../feature-store/feature-registry';
import { MLOpsPipeline, PipelineConfig } from '../mlops/mlops-pipeline';
import { ExperimentTracker } from '../mlops/experiment-tracking';

// Mock sustainability prediction model
class SustainabilityModel extends BaseModel {
  private weights: number[] = [];

  getModelName(): string {
    return 'sustainability-predictor';
  }

  async train(data: TrainingData): Promise<void> {
    // Simulate training by generating random weights
    this.weights = Array(data.features[0]?.length || 10)
      .fill(0)
      .map(() => Math.random() - 0.5);
    
    // Simulate training time
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  async predict(input: any): Promise<any> {
    const features = Array.isArray(input) ? input : [input];
    const score = features.reduce((sum, val, idx) => 
      sum + val * (this.weights[idx] || 0), 0
    );
    
    return {
      emissionsScore: Math.max(0, Math.min(100, 50 + score * 10)),
      riskLevel: score > 0.1 ? 'high' : score > -0.1 ? 'medium' : 'low',
      confidence: 0.85 + Math.random() * 0.1,
      timestamp: new Date()
    };
  }

  async serialize(): Promise<any> {
    return {
      type: 'sustainability-model',
      weights: this.weights,
      config: this.config
    };
  }

  async deserialize(data: any): Promise<void> {
    this.weights = data.weights || [];
    this.config = data.config || {};
  }
}

describe('Stream B Integration Tests', () => {
  let distributedTrainer: DistributedTrainingCoordinator;
  let modelServer: AdvancedModelServer;
  let featureStore: FeatureStore;
  let featureRegistry: FeatureRegistry;
  let mlOpsPipeline: MLOpsPipeline;
  let experimentTracker: ExperimentTracker;

  beforeEach(() => {
    distributedTrainer = new DistributedTrainingCoordinator();
    modelServer = new AdvancedModelServer();
    featureStore = new FeatureStore();
    featureRegistry = new FeatureRegistry();
    mlOpsPipeline = new MLOpsPipeline();
    experimentTracker = new ExperimentTracker();
  });

  afterEach(async () => {
    distributedTrainer.cleanup();
    await modelServer.shutdown();
    featureStore.clearAll();
    mlOpsPipeline.cleanup();
  });

  describe('End-to-End ML Pipeline', () => {
    it('should execute complete ML workflow from features to deployment', async () => {
      // === PHASE 1: Feature Engineering ===
      
      // Register sustainability features
      const features: FeatureDefinition[] = [
        {
          name: 'energy_consumption',
          type: 'numeric',
          description: 'Monthly energy consumption in kWh',
          owner: 'sustainability-team',
          tags: ['energy', 'scope2'],
          validation: { required: true, min: 0 }
        },
        {
          name: 'carbon_intensity',
          type: 'numeric',
          description: 'Grid carbon intensity gCO2/kWh',
          owner: 'data-team',
          tags: ['carbon', 'grid']
        },
        {
          name: 'building_type',
          type: 'categorical',
          description: 'Type of building',
          owner: 'facilities-team',
          tags: ['building'],
          transformation: {
            type: 'encode',
            config: {
              type: 'label',
              mapping: { office: 0, warehouse: 1, retail: 2, manufacturing: 3 }
            }
          }
        }
      ];

      // Register features
      for (const feature of features) {
        await featureStore.registerFeature(feature);
        await featureRegistry.registerFeatureVersion(
          feature,
          '1.0.0',
          'integration-test',
          'Initial version for integration test'
        );
      }

      // Create feature set
      const featureSet: FeatureSet = {
        id: 'sustainability-features-v1',
        name: 'Sustainability Features V1',
        description: 'Core features for sustainability prediction',
        features: ['energy_consumption', 'carbon_intensity', 'building_type'],
        version: '1.0.0',
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: { purpose: 'ml-training' }
      };

      await featureStore.registerFeatureSet(featureSet);

      // Ingest sample data
      const sampleData = Array.from({ length: 1000 }, (_, i) => [
        {
          featureName: 'energy_consumption',
          value: 5000 + Math.random() * 3000,
          timestamp: new Date(Date.now() - i * 3600000),
          metadata: { entityId: `building-${Math.floor(i / 10)}`, source: 'smart-meter' }
        },
        {
          featureName: 'carbon_intensity',
          value: 300 + Math.random() * 200,
          timestamp: new Date(Date.now() - i * 3600000),
          metadata: { entityId: `building-${Math.floor(i / 10)}`, source: 'grid-api' }
        },
        {
          featureName: 'building_type',
          value: ['office', 'warehouse', 'retail', 'manufacturing'][i % 4],
          timestamp: new Date(Date.now() - i * 3600000),
          metadata: { entityId: `building-${Math.floor(i / 10)}`, source: 'facilities-db' }
        }
      ]).flat();

      await featureStore.ingestFeatures(sampleData);

      expect(await featureStore.getFeatures({ names: ['energy_consumption'] }))
        .toHaveLength(1000);

      // === PHASE 2: Experiment Setup ===
      
      const experiment = await experimentTracker.createExperiment(
        'Sustainability Prediction Model',
        'esg-project',
        'Training ML model for sustainability scoring',
        'integration-test',
        ['sustainability', 'emissions', 'ml']
      );

      const run = await experimentTracker.startRun(
        experiment.id,
        'Integration Test Run',
        {
          model_type: 'sustainability',
          learning_rate: 0.001,
          epochs: 5,
          batch_size: 32
        }
      );

      // === PHASE 3: Distributed Training ===
      
      // Set up mock workers
      const workers: WorkerNode[] = [
        {
          id: 'worker-1',
          host: 'localhost',
          port: 5001,
          status: 'idle',
          gpuCount: 1,
          memoryGB: 16,
          lastHeartbeat: new Date()
        },
        {
          id: 'worker-2', 
          host: 'localhost',
          port: 5002,
          status: 'idle',
          gpuCount: 1,
          memoryGB: 16,
          lastHeartbeat: new Date()
        }
      ];

      // Register workers
      for (const worker of workers) {
        await distributedTrainer.registerWorker(worker);
      }

      // Prepare training data from feature store
      const trainingFeatures = await featureStore.getFeatures({
        names: ['energy_consumption', 'carbon_intensity', 'building_type']
      });

      const processedData = trainingFeatures.reduce((acc, feature) => {
        const entityId = feature.metadata?.entityId;
        if (!acc[entityId]) {
          acc[entityId] = {};
        }
        acc[entityId][feature.featureName] = feature.value;
        return acc;
      }, {} as Record<string, any>);

      const trainingData: TrainingData = {
        features: Object.values(processedData).map(entity => [
          entity.energy_consumption || 0,
          entity.carbon_intensity || 0,
          typeof entity.building_type === 'string' 
            ? ['office', 'warehouse', 'retail', 'manufacturing'].indexOf(entity.building_type)
            : entity.building_type || 0
        ]),
        labels: Object.values(processedData).map(entity => 
          // Calculate sustainability score (lower is better)
          Math.max(0, Math.min(100, 
            (entity.energy_consumption || 0) / 100 + 
            (entity.carbon_intensity || 0) / 10
          ))
        )
      };

      expect(trainingData.features).toHaveLength(100); // 1000 samples across 100 buildings

      // Start distributed training
      const model = new SustainabilityModel({
        epochs: 5,
        batchSize: 16,
        learningRate: 0.001
      });

      const distTrainingConfig = {
        strategy: 'data-parallel' as const,
        nodes: workers,
        batchSizePerNode: 16,
        gradientAggregation: 'average' as const,
        communicationProtocol: 'grpc' as const,
        checkpointFrequency: 2,
        faultTolerance: true
      };

      const jobId = await distributedTrainer.startDistributedTraining(
        model,
        trainingData,
        distTrainingConfig
      );

      // Monitor training progress
      let progress = await distributedTrainer.getTrainingProgress(jobId);
      expect(progress).not.toBeNull();
      expect(progress!.nodesActive).toBe(2);

      // Log training metrics
      await experimentTracker.logMetrics(run.id, {
        training_loss: 0.25,
        validation_accuracy: 0.82,
        distributed_efficiency: 0.95
      });

      // Update feature lineage with model usage
      await featureStore.updateLineage('energy_consumption', {
        type: 'derived',
        name: 'distributed_training'
      }, 'model_v1');

      // === PHASE 4: Model Serving Setup ===
      
      const servingConfig: ModelServingConfig = {
        modelId: 'sustainability-predictor',
        version: '1.0.0',
        replicas: 2,
        batch: {
          maxBatchSize: 32,
          maxWaitTime: 100,
          enableDynamicBatching: true,
          priorityQueuing: false
        },
        streaming: {
          protocol: 'websocket',
          bufferSize: 1000,
          backpressure: true,
          compression: false
        },
        caching: {
          enabled: true,
          ttl: 300,
          maxSize: 1000
        },
        monitoring: {
          latencyTracking: true,
          throughputTracking: true,
          errorTracking: true
        }
      };

      await modelServer.loadModel(model, servingConfig);

      // Test serving
      const predictionRequest = {
        id: 'test-prediction-1',
        input: [6500, 420, 0], // office building with high consumption
        timestamp: new Date()
      };

      const prediction = await modelServer.predict(
        'sustainability-predictor',
        '1.0.0',
        predictionRequest
      );

      expect(prediction.prediction).toBeDefined();
      expect(prediction.latency).toBeGreaterThanOrEqual(0);
      expect(prediction.modelVersion).toBe('1.0.0');

      // Log inference metrics
      await experimentTracker.logMetrics(run.id, {
        inference_latency: prediction.latency,
        prediction_confidence: prediction.prediction.confidence
      });

      // === PHASE 5: MLOps Pipeline Integration ===
      
      const pipelineConfig: PipelineConfig = {
        id: 'sustainability-ml-pipeline',
        name: 'Sustainability ML Pipeline',
        description: 'End-to-end pipeline for sustainability model',
        stages: [
          {
            name: 'validate-features',
            type: 'data-validation',
            config: {
              schema: {
                requiredFields: ['energy_consumption', 'carbon_intensity', 'building_type']
              },
              qualityChecks: {
                maxNullPercentage: 5
              }
            }
          },
          {
            name: 'feature-engineering',
            type: 'feature-engineering',
            config: {
              features: ['energy_consumption', 'carbon_intensity', 'building_type'],
              featureSetId: 'sustainability-features-v1'
            }
          },
          {
            name: 'model-training',
            type: 'training',
            config: {
              modelType: 'sustainability_prediction',
              modelClass: SustainabilityModel,
              hyperparameters: {
                epochs: 5,
                batchSize: 32,
                learningRate: 0.001
              },
              distributedTraining: true
            }
          },
          {
            name: 'model-evaluation',
            type: 'evaluation',
            config: {
              thresholds: {
                accuracy: 0.75,
                precision: 0.70
              },
              testDataRatio: 0.2
            }
          },
          {
            name: 'model-deployment',
            type: 'deployment',
            config: {
              autoServe: true,
              servingConfig: servingConfig,
              endpoint: 'https://api.blipee.ai/predict/sustainability'
            }
          }
        ],
        triggers: [
          {
            type: 'schedule',
            config: { schedule: 'every 24 hours' }
          }
        ],
        notifications: [
          {
            type: 'webhook',
            endpoint: 'https://alerts.blipee.ai/ml-pipeline',
            events: ['pipeline_success', 'pipeline_failure']
          }
        ],
        monitoring: {
          metrics: ['accuracy', 'latency', 'drift'],
          thresholds: { accuracy: 0.8 },
          alerting: true
        }
      };

      await mlOpsPipeline.createPipeline(pipelineConfig);

      // Run the complete pipeline
      const pipelineRun = await mlOpsPipeline.runPipeline(
        'sustainability-ml-pipeline',
        trainingData
      );

      expect(pipelineRun.pipelineId).toBe('sustainability-ml-pipeline');
      expect(pipelineRun.stages).toHaveLength(5);

      // === PHASE 6: Quality Checks ===
      
      // Register model version
      await experimentTracker.endRun(run.id, 'completed');
      
      const modelVersion = await experimentTracker.registerModel(
        'sustainability-predictor',
        run.id,
        '1.0.0',
        'integration-test',
        'Model trained via integration test'
      );

      expect(modelVersion.stage).toBe('development');
      expect(modelVersion.metrics).toBeDefined();

      // Record feature quality metrics
      featureRegistry.recordQualityMetrics({
        featureName: 'energy_consumption',
        completeness: 0.98,
        uniqueness: 0.85,
        validity: 0.99,
        freshness: 1, // 1 hour
        consistency: 0.96,
        timestamp: new Date()
      });

      const qualityMetrics = featureRegistry.getQualityMetrics('energy_consumption');
      expect(qualityMetrics).not.toBeNull();
      expect(qualityMetrics!.completeness).toBe(0.98);

      // Test model serving performance
      const servingMetrics = modelServer.getMetrics();
      expect(servingMetrics['sustainability-predictor:1.0.0']).toBeDefined();
      expect(servingMetrics['sustainability-predictor:1.0.0'].predictions).toBeGreaterThan(0);

      // === PHASE 7: Validation ===
      
      // Verify feature lineage
      const lineage = featureStore.getFeatureLineage('energy_consumption');
      expect(lineage).not.toBeNull();
      expect(lineage!.consumers).toContain('model_v1');

      // Verify experiment tracking
      const completedRun = experimentTracker.getRun(run.id);
      expect(completedRun!.status).toBe('completed');
      expect(Object.keys(completedRun!.metrics)).toContain('training_loss');

      // Verify pipeline metrics
      const pipelineMetrics = mlOpsPipeline.getPipelineMetrics('sustainability-ml-pipeline');
      expect(pipelineMetrics.totalRuns).toBeGreaterThanOrEqual(1);

      console.log('✅ End-to-end ML pipeline completed successfully');
      console.log(`📊 Training data: ${trainingData.features.length} samples`);
      console.log(`🤖 Model: ${modelVersion.modelName} v${modelVersion.version}`);
      console.log(`⚡ Serving latency: ${prediction.latency}ms`);
      console.log(`📈 Pipeline stages: ${pipelineRun.stages.length}`);

    }, 30000); // 30 second timeout for integration test

    it('should handle feature drift detection and model retraining', async () => {
      // === SETUP ===
      
      // Register base features
      await featureStore.registerFeature({
        name: 'baseline_emissions',
        type: 'numeric',
        description: 'Baseline emissions metric',
        owner: 'test',
        tags: ['emissions']
      });

      // Ingest initial data
      const initialData = Array.from({ length: 100 }, (_, i) => ({
        featureName: 'baseline_emissions',
        value: 50 + Math.random() * 20, // Normal distribution around 50-70
        timestamp: new Date(Date.now() - i * 60000),
        metadata: { entityId: `entity-${i}` }
      }));

      await featureStore.ingestFeatures(initialData);

      // Calculate initial statistics
      const initialStats = featureStore.getFeatureStatistics('baseline_emissions');
      expect(initialStats.mean).toBeGreaterThan(55);
      expect(initialStats.mean).toBeLessThan(65);

      // === SIMULATE DRIFT ===
      
      // Ingest drifted data (shifted distribution)
      const driftedData = Array.from({ length: 100 }, (_, i) => ({
        featureName: 'baseline_emissions',
        value: 80 + Math.random() * 20, // Shifted to 80-100
        timestamp: new Date(Date.now() - i * 30000), // More recent
        metadata: { entityId: `entity-${i + 100}` }
      }));

      await featureStore.ingestFeatures(driftedData);

      // Calculate new statistics
      const newStats = featureStore.getFeatureStatistics('baseline_emissions');
      expect(newStats.mean).toBeGreaterThan(initialStats.mean);

      // Detect drift (simplified drift detection)
      const driftDetected = Math.abs(newStats.mean - initialStats.mean) > 10;
      expect(driftDetected).toBe(true);

      console.log(`📊 Drift detected: Mean shifted from ${initialStats.mean.toFixed(2)} to ${newStats.mean.toFixed(2)}`);

      // === TRIGGER RETRAINING ===
      
      if (driftDetected) {
        const retrainingPipeline: PipelineConfig = {
          id: 'drift-retraining-pipeline',
          name: 'Drift-Triggered Retraining',
          description: 'Automatic retraining due to detected feature drift',
          stages: [
            {
              name: 'drift-validation',
              type: 'data-validation',
              config: {
                driftThreshold: 0.1,
                referenceWindow: '7d'
              }
            },
            {
              name: 'retrain-model',
              type: 'training',
              config: {
                modelType: 'sustainability_prediction',
                modelClass: SustainabilityModel,
                hyperparameters: { epochs: 3 }
              }
            }
          ],
          triggers: [
            {
              type: 'model-drift',
              config: { threshold: 0.1 }
            }
          ],
          notifications: [],
          monitoring: {
            metrics: ['drift_score'],
            thresholds: {},
            alerting: true
          }
        };

        await mlOpsPipeline.createPipeline(retrainingPipeline);

        const retrainingRun = await mlOpsPipeline.runPipeline(
          'drift-retraining-pipeline',
          { driftScore: 0.15 }
        );

        expect(retrainingRun.stages).toHaveLength(2);
        console.log('🔄 Retraining pipeline triggered successfully');
      }
    });

    it('should demonstrate real-time prediction pipeline', async () => {
      // === SETUP STREAMING FEATURES ===
      
      await featureStore.registerFeature({
        name: 'real_time_consumption',
        type: 'time-series',
        description: 'Real-time energy consumption stream',
        owner: 'iot-team',
        tags: ['realtime', 'energy'],
        ttl: 3600 // 1 hour TTL
      });

      // === STREAMING INGESTION ===
      
      const streamingData = [];
      for (let i = 0; i < 50; i++) {
        streamingData.push({
          featureName: 'real_time_consumption',
          value: 1000 + Math.sin(i / 10) * 200 + Math.random() * 100,
          timestamp: new Date(Date.now() - i * 1000), // 1 second intervals
          metadata: { 
            deviceId: 'smart-meter-001',
            buildingId: 'hq-building-1'
          }
        });
      }

      await featureStore.ingestFeatures(streamingData);

      // === REAL-TIME PREDICTION ===
      
      const model = new SustainabilityModel();
      await model.train({
        features: [[1000], [1200], [800], [1500], [900]],
        labels: [50, 60, 40, 75, 45]
      });

      const servingConfig: ModelServingConfig = {
        modelId: 'realtime-predictor',
        version: '1.0.0',
        replicas: 1,
        batch: {
          maxBatchSize: 10,
          maxWaitTime: 50, // Low latency
          enableDynamicBatching: true,
          priorityQueuing: true
        },
        streaming: {
          protocol: 'websocket',
          bufferSize: 100,
          backpressure: true,
          compression: true
        },
        caching: {
          enabled: true,
          ttl: 60, // Short TTL for real-time
          maxSize: 500
        },
        monitoring: {
          latencyTracking: true,
          throughputTracking: true,
          errorTracking: true
        }
      };

      await modelServer.loadModel(model, servingConfig);

      // === STREAM PROCESSING ===
      
      const realtimeFeatures = await featureStore.getFeatures({
        names: ['real_time_consumption'],
        limit: 10
      });

      const predictions = [];
      for (const feature of realtimeFeatures) {
        const prediction = await modelServer.predict(
          'realtime-predictor',
          '1.0.0',
          {
            id: `rt-${Date.now()}`,
            input: [feature.value],
            priority: 'high',
            timestamp: new Date()
          }
        );

        predictions.push({
          timestamp: feature.timestamp,
          consumption: feature.value,
          prediction: prediction.prediction,
          latency: prediction.latency
        });
      }

      expect(predictions).toHaveLength(10);
      
      const avgLatency = predictions.reduce((sum, p) => sum + p.latency, 0) / predictions.length;
      expect(avgLatency).toBeLessThan(100); // Real-time requirement

      console.log(`⚡ Real-time prediction average latency: ${avgLatency.toFixed(2)}ms`);
      console.log(`📊 Processed ${predictions.length} real-time predictions`);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle high-throughput batch predictions', async () => {
      const model = new SustainabilityModel();
      await model.train({
        features: Array(100).fill(0).map(() => [Math.random() * 1000]),
        labels: Array(100).fill(0).map(() => Math.random() * 100)
      });

      const servingConfig: ModelServingConfig = {
        modelId: 'batch-predictor',
        version: '1.0.0',
        replicas: 3,
        batch: {
          maxBatchSize: 100,
          maxWaitTime: 200,
          enableDynamicBatching: true,
          priorityQueuing: false
        },
        streaming: {
          protocol: 'websocket',
          bufferSize: 1000,
          backpressure: false,
          compression: false
        },
        caching: {
          enabled: false,
          ttl: 0,
          maxSize: 0
        },
        monitoring: {
          latencyTracking: true,
          throughputTracking: true,
          errorTracking: true
        }
      };

      await modelServer.loadModel(model, servingConfig);

      // Generate many prediction requests
      const requests = Array.from({ length: 1000 }, (_, i) => ({
        id: `batch-${i}`,
        input: [Math.random() * 1000],
        timestamp: new Date()
      }));

      const startTime = Date.now();
      const predictions = await Promise.all(
        requests.map(req => 
          modelServer.predict('batch-predictor', '1.0.0', req)
        )
      );
      const totalTime = Date.now() - startTime;

      expect(predictions).toHaveLength(1000);
      
      const throughput = 1000 / (totalTime / 1000); // requests per second
      expect(throughput).toBeGreaterThan(50); // Minimum 50 RPS

      console.log(`🚀 Batch prediction throughput: ${throughput.toFixed(2)} RPS`);
      console.log(`⏱️  Total time for 1000 predictions: ${totalTime}ms`);
    });

    it('should scale feature ingestion and retrieval', async () => {
      // Register multiple features
      const features = ['cpu_usage', 'memory_usage', 'disk_io', 'network_io', 'temperature'];
      
      for (const featureName of features) {
        await featureStore.registerFeature({
          name: featureName,
          type: 'numeric',
          description: `${featureName} metric`,
          owner: 'monitoring',
          tags: ['system', 'metrics']
        });
      }

      // Large-scale data ingestion
      const largeDataset = [];
      const entityCount = 100;
      const timePoints = 100;

      for (let entity = 0; entity < entityCount; entity++) {
        for (let time = 0; time < timePoints; time++) {
          for (const featureName of features) {
            largeDataset.push({
              featureName,
              value: Math.random() * 100,
              timestamp: new Date(Date.now() - time * 60000),
              metadata: { 
                entityId: `server-${entity.toString().padStart(3, '0')}`,
                datacenter: `dc-${Math.floor(entity / 10)}`
              }
            });
          }
        }
      }

      const ingestionStart = Date.now();
      await featureStore.ingestFeatures(largeDataset);
      const ingestionTime = Date.now() - ingestionStart;

      expect(largeDataset).toHaveLength(entityCount * timePoints * features.length);

      // Test retrieval performance
      const retrievalStart = Date.now();
      const retrievedFeatures = await featureStore.getFeatures({
        names: features,
        timeRange: {
          start: new Date(Date.now() - 3600000), // Last hour
          end: new Date()
        }
      });
      const retrievalTime = Date.now() - retrievalStart;

      expect(retrievedFeatures.length).toBeGreaterThan(0);

      const ingestionRate = largeDataset.length / (ingestionTime / 1000);
      const retrievalRate = retrievedFeatures.length / (retrievalTime / 1000);

      console.log(`📥 Feature ingestion: ${largeDataset.length} features in ${ingestionTime}ms (${ingestionRate.toFixed(0)} features/sec)`);
      console.log(`📤 Feature retrieval: ${retrievedFeatures.length} features in ${retrievalTime}ms (${retrievalRate.toFixed(0)} features/sec)`);

      expect(ingestionRate).toBeGreaterThan(1000); // At least 1000 features/sec
      expect(retrievalRate).toBeGreaterThan(5000); // At least 5000 features/sec
    });
  });
});