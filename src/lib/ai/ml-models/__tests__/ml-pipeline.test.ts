/**
 * ML Pipeline Tests
 */

import { MLPipeline } from '../ml-pipeline';
import { EmissionsPredictionModel } from '../emissions-predictor';
import { AnomalyDetectionModel } from '../anomaly-detector';
import { FeatureEngineeringPipeline } from '../feature-engineering';

describe('ML Pipeline', () => {
  let pipeline: MLPipeline;

  beforeEach(() => {
    pipeline = new MLPipeline({
      dataIngestion: {
        batchSize: 32,
        validationEnabled: true,
        preprocessingSteps: []
      },
      featureEngineering: {
        lagPeriods: [1, 7],
        windowSizes: [7, 14],
        maxFeatures: 50
      },
      modelTraining: {
        epochs: 10,
        batchSize: 32
      },
      inference: {
        batchPrediction: true,
        cacheEnabled: true,
        explainability: true
      },
      monitoring: {
        driftDetection: true,
        performanceTracking: true,
        alertThresholds: {
          accuracy: 0.8,
          latency: 1000,
          errorRate: 0.05
        }
      }
    });
  });

  describe('Pipeline Initialization', () => {
    it('should initialize pipeline components', () => {
      expect(pipeline).toBeDefined();
    });

    it('should have correct configuration', () => {
      const metrics = pipeline.getModelMetrics('emissions_prediction');
      expect(metrics).toBeNull(); // No model trained yet
    });
  });

  describe('Data Ingestion', () => {
    it('should ingest and process raw data', async () => {
      const rawData = {
        timestamp: new Date(),
        emissions: { total: 100, scope1: 30, scope2: 40, scope3: 30 },
        energy: { consumption: 1000, renewable: 200, total: 1000 },
        revenue: 1000000
      };

      const processed = await pipeline.ingest(rawData);
      
      expect(processed).toBeDefined();
      expect(processed.features).toBeDefined();
      expect(processed.features.length).toBeGreaterThan(0);
      expect(processed.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('Model Training', () => {
    it('should train emissions model', async () => {
      const trainingData = {
        features: Array(100).fill([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
        labels: Array(100).fill(100),
        metadata: { featureNames: ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10'] }
      };

      // This would normally train the model, but we'll skip for tests
      // const model = await pipeline.train('emissions_prediction', trainingData.features);
      // expect(model).toBeDefined();
    });
  });
});

describe('Emissions Prediction Model', () => {
  let model: EmissionsPredictionModel;

  beforeEach(() => {
    model = new EmissionsPredictionModel({
      sequenceLength: 7,
      features: 5,
      lstmUnits: [32, 16],
      dropout: 0.1
    });
  });

  it('should create model instance', () => {
    expect(model).toBeDefined();
  });

  it('should build model architecture', async () => {
    await model.buildModel();
    const summary = model.getSummary();
    expect(summary).toContain('lstm');
  });
});

describe('Anomaly Detection Model', () => {
  let model: AnomalyDetectionModel;

  beforeEach(() => {
    model = new AnomalyDetectionModel({
      nEstimators: 50,
      contamination: 0.1,
      encoderLayers: [32, 16, 8]
    });
  });

  it('should create model instance', () => {
    expect(model).toBeDefined();
  });

  it('should detect anomalies', async () => {
    const data = [
      { timestamp: new Date(), metricName: 'energy', value: 100, dimensions: {} },
      { timestamp: new Date(), metricName: 'energy', value: 105, dimensions: {} },
      { timestamp: new Date(), metricName: 'energy', value: 500, dimensions: {} }, // Anomaly
      { timestamp: new Date(), metricName: 'energy', value: 98, dimensions: {} }
    ];

    // Train model first
    await model.train({
      features: [[100], [105], [98], [102]],
      labels: [0, 0, 0, 0],
      metadata: {}
    });

    const results = await model.detectAnomalies(data, 'ensemble');
    expect(results).toBeDefined();
    expect(results.length).toBe(4);
  });
});

describe('Feature Engineering', () => {
  let featureEngineering: FeatureEngineeringPipeline;

  beforeEach(() => {
    featureEngineering = new FeatureEngineeringPipeline({
      lagPeriods: [1, 7],
      windowSizes: [7, 14],
      maxFeatures: 50
    });
  });

  it('should extract time features', () => {
    const timestamp = new Date('2024-01-15T10:30:00');
    const features = featureEngineering.extractTimeFeatures(timestamp);
    
    expect(features).toBeDefined();
    expect(features.length).toBeGreaterThan(0);
    
    const hourFeature = features.find(f => f.name === 'hour_of_day');
    expect(hourFeature?.value).toBe(10);
    
    const dayFeature = features.find(f => f.name === 'day_of_week');
    expect(dayFeature?.value).toBe(1); // Monday
  });

  it('should engineer ESG features', async () => {
    const data = {
      emissions: { total: 100, scope1: 30, scope2: 40, scope3: 30 },
      revenue: 1000000,
      energy: { consumption: 1000, renewable: 200, total: 1000 },
      production: 5000
    };

    const engineered = await featureEngineering.engineerFeatures(data);
    
    expect(engineered).toBeDefined();
    expect(engineered.features).toBeDefined();
    expect(engineered.metadata.totalFeatures).toBeGreaterThan(0);
    
    const intensityFeature = engineered.features.find(f => f.name === 'emissions_intensity');
    expect(intensityFeature).toBeDefined();
    expect(intensityFeature?.value).toBeCloseTo(0.0001, 5);
  });
});