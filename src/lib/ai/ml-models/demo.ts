/**
 * ML Pipeline Demo
 * Demonstrates the capabilities of the ML pipeline
 */

import { MLPipeline } from './ml-pipeline';
import { ModelTrainingPipeline } from './training-pipeline';
import { FeatureEngineeringPipeline } from './feature-engineering';
import { EmissionsData, MetricData } from './types';

async function runMLPipelineDemo() {

  // 1. Initialize ML Pipeline
  const pipeline = new MLPipeline({
    dataIngestion: {
      batchSize: 32,
      validationEnabled: true,
      preprocessingSteps: [
        { type: 'normalize', config: { fields: ['scope1', 'scope2', 'scope3'] } }
      ]
    },
    featureEngineering: {
      lagPeriods: [1, 7, 30],
      windowSizes: [7, 14, 30],
      maxFeatures: 50,
      maxInteractionDepth: 2
    },
    modelTraining: {
      epochs: 100,
      batchSize: 32,
      learningRate: 0.001,
      earlyStopping: true,
      patience: 10
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

  // 2. Feature Engineering Demo
  const featureEngine = new FeatureEngineeringPipeline();
  
  const sampleData = {
    timestamp: new Date(),
    emissions: { total: 1000, scope1: 300, scope2: 400, scope3: 300 },
    energy: { consumption: 5000, renewable: 1000, total: 5000 },
    revenue: 1000000,
    production: 10000,
    suppliers: [
      { id: 's1', riskScore: 0.2, location: 'USA' },
      { id: 's2', riskScore: 0.3, location: 'China' },
      { id: 's3', riskScore: 0.1, location: 'Germany' }
    ]
  };

  const engineeredFeatures = await featureEngine.engineerFeatures(sampleData);
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, score]) => `${name}: ${score.toFixed(3)}`)
  );

  // 3. Model Training Pipeline Demo
  const trainingPipeline = new ModelTrainingPipeline();
  
  // Generate synthetic training data
  const generateTrainingData = (samples: number) => {
    const features: number[][] = [];
    const labels: number[] = [];
    
    for (let i = 0; i < samples; i++) {
      features.push([
        Math.random() * 1000,  // emissions
        Math.random() * 5000,  // energy
        Math.random() * 10000, // production
        Math.random() * 50,    // temperature
        Math.random() * 7,     // day of week
        Math.random() * 24,    // hour of day
        Math.random() * 12,    // month
        Math.random(),         // is_holiday
        Math.random() * 100,   // economic index
        Math.random()          // renewable percentage
      ]);
      labels.push(Math.random() * 1500); // total emissions
    }
    
    return { features, labels, metadata: {} };
  };

  const trainingData = {
    emissions: generateTrainingData(1000),
    metrics: generateTrainingData(500),
    operations: generateTrainingData(300),
    test: {
      emissions: generateTrainingData(200),
      metrics: generateTrainingData(100),
      operations: generateTrainingData(50)
    }
  };

  
  // Note: Actual training would take time, so we're simulating here

  // 4. Emissions Prediction Demo
  const historicalEmissions: EmissionsData[] = Array(30).fill(null).map((_, i) => ({
    timestamp: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000),
    scope1: 300 + Math.random() * 50,
    scope2: 400 + Math.random() * 50,
    scope3: 300 + Math.random() * 50,
    totalEmissions: 1000 + Math.random() * 150,
    energyConsumption: 5000 + Math.random() * 500,
    productionVolume: 10000 + Math.random() * 1000,
    temperature: 20 + Math.random() * 10,
    dayOfWeek: i % 7,
    monthOfYear: new Date().getMonth() + 1,
    isHoliday: i % 7 === 0,
    economicIndex: 100 + Math.random() * 10
  }));


  // 5. Anomaly Detection Demo
  const metricsData: MetricData[] = [
    { timestamp: new Date(), metricName: 'energy_consumption', value: 5000, dimensions: {} },
    { timestamp: new Date(), metricName: 'energy_consumption', value: 5100, dimensions: {} },
    { timestamp: new Date(), metricName: 'energy_consumption', value: 8500, dimensions: {} }, // Anomaly
    { timestamp: new Date(), metricName: 'energy_consumption', value: 5050, dimensions: {} },
  ];


  // 6. Optimization Demo

  // 7. Summary
  
}

// Run demo if called directly
if (require.main === module) {
  runMLPipelineDemo().catch(console.error);
}

export { runMLPipelineDemo };