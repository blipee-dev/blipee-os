/**
 * Enhanced ML Models Module for Phase 5
 * Exports all ML pipeline components with advanced features
 */

// Phase 5 Enhanced Core Pipeline
export { EnhancedMLPipeline, createMLPipelineConfig } from './enhanced-ml-pipeline';
export { ModelTrainingPipeline } from './enhanced-training-pipeline';
export { FeatureEngineeringPipeline } from './enhanced-feature-engineering';
export { InferenceEngine } from './inference-engine';

// Legacy Core Pipeline (maintained for compatibility)
export { MLPipeline } from './ml-pipeline';

// Phase 5 Enhanced Models
export { EmissionsPredictionModel } from './emissions-predictor';
export { AnomalyDetectionModel } from './enhanced-anomaly-detector';
export { OptimizationEngine } from './enhanced-optimization-engine';

// Base Classes
export { BaseModel } from './base/base-model';
export { TimeSeriesModel } from './base/timeseries-model';
export { RegressionModel } from './base/regression-model';
export { ClassificationModel } from './base/classification-model';

// Supporting Components
export { FeatureStore } from './feature-store';
export { ModelRegistry } from './model-registry';
export { DataValidator } from './data-validator';
export { FeatureExtractor } from './feature-extractor';
export { ExperimentTracker } from './experiment-tracker';
export { HyperparameterOptimizer } from './hyperparameter-optimizer';

// Algorithms
export { IsolationForest } from './algorithms/isolation-forest';
export { AutoEncoder } from './algorithms/autoencoder';

// Types
export * from './types';

// Phase 5 Demo and Integration Functions
import { EnhancedMLPipeline, createMLPipelineConfig } from './enhanced-ml-pipeline';
import { EmissionsData, MetricData } from './types';

/**
 * Demonstrate the complete Phase 5 ML Pipeline
 */
export async function demonstrateEnhancedMLPipeline(): Promise<void> {
  console.log('🧠 Phase 5 Enhanced ML Pipeline Demo');
  console.log('=' .repeat(50));
  
  try {
    // Initialize enhanced pipeline
    const config = createMLPipelineConfig({
      production: false,
      tensorflowConfig: {
        backend: 'cpu',
        enableDebug: true
      },
      performance: {
        batchProcessing: true,
        modelCaching: true,
        quantization: false
      }
    });
    
    const pipeline = new EnhancedMLPipeline(config);
    await pipeline.initialize();
    
    // Generate sample data
    const sampleEmissionsData = generateSampleEmissionsData(100);
    const sampleMetricsData = generateSampleMetricsData(100);
    const sampleOperationsData = generateSampleOperationsData(50);
    
    console.log('📊 Training models with sample data...');
    
    // Train all models
    const trainingResults = await pipeline.trainModels({
      emissions: sampleEmissionsData,
      metrics: sampleMetricsData,
      operations: sampleOperationsData
    });
    
    console.log('🔮 Making predictions...');
    
    // Test predictions
    const emissionsPrediction = await pipeline.predict({
      type: 'emissions_prediction',
      data: sampleEmissionsData.slice(-10),
      options: { horizon: 7, confidence: true, explanation: true }
    });
    
    console.log('Emissions Prediction Result:', emissionsPrediction);
    
    // Test anomaly detection
    const anomalies = await pipeline.detectAnomalies(
      sampleMetricsData.slice(-20),
      { method: 'ensemble', explanation: true }
    );
    
    console.log(`Found ${anomalies.filter(a => a.isAnomaly).length} anomalies out of ${anomalies.length} data points`);
    
    // Test optimization
    const optimization = await pipeline.optimizeResources({
      resources: [
        { name: 'hvac_efficiency', min: 50, max: 100, cost: 1000, emissions: 0.5, efficiency: 1.2 },
        { name: 'lighting_optimization', min: 0, max: 100, cost: 500, emissions: 0.3, efficiency: 1.1 },
        { name: 'renewable_energy', min: 0, max: 100, cost: 2000, emissions: -0.8, efficiency: 0.9 }
      ],
      constraints: [
        { type: 'budget', value: 10000, operator: '<=' },
        { type: 'emissions', value: 100, operator: '<=' }
      ],
      objectives: [
        { name: 'cost', weight: 0.3, minimize: true },
        { name: 'emissions', weight: 0.5, minimize: true },
        { name: 'efficiency', weight: 0.2, minimize: false }
      ]
    });
    
    console.log('Resource Optimization Result:', optimization);
    
    // Get system metrics
    const metrics = await pipeline.getModelMetrics();
    console.log('\n📈 Model Performance Metrics:', metrics);
    
    const systemStatus = pipeline.getSystemStatus();
    console.log('\n🖥️ System Status:', systemStatus);
    
    // Cleanup
    pipeline.dispose();
    
    console.log('\n✅ Enhanced ML Pipeline demo completed successfully!');
    
  } catch (error) {
    console.error('❌ Demo failed:', error);
    throw error;
  }
}

// Helper functions to generate sample data

function generateSampleEmissionsData(count: number): EmissionsData[] {
  const data: EmissionsData[] = [];
  const baseDate = new Date('2024-01-01');
  
  for (let i = 0; i < count; i++) {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() + i);
    
    // Add some seasonal and trend patterns
    const seasonality = Math.sin(2 * Math.PI * i / 365) * 10;
    const trend = i * 0.1;
    const noise = (Math.random() - 0.5) * 20;
    
    const baseEmissions = 100 + seasonality + trend + noise;
    
    data.push({
      timestamp: date,
      scope1: baseEmissions * 0.4 + (Math.random() - 0.5) * 10,
      scope2: baseEmissions * 0.3 + (Math.random() - 0.5) * 8,
      scope3: baseEmissions * 0.3 + (Math.random() - 0.5) * 12,
      totalEmissions: baseEmissions,
      energyConsumption: baseEmissions * 2.5 + (Math.random() - 0.5) * 50,
      productionVolume: 1000 + Math.sin(2 * Math.PI * i / 30) * 200 + (Math.random() - 0.5) * 100,
      temperature: 20 + Math.sin(2 * Math.PI * i / 365) * 15 + (Math.random() - 0.5) * 5,
      dayOfWeek: date.getDay(),
      monthOfYear: date.getMonth() + 1,
      isHoliday: Math.random() < 0.05,
      economicIndex: 100 + (Math.random() - 0.5) * 20
    });
  }
  
  return data;
}

function generateSampleMetricsData(count: number): MetricData[] {
  const data: MetricData[] = [];
  const baseDate = new Date('2024-01-01');
  
  const metricNames = ['cpu_usage', 'memory_usage', 'disk_io', 'network_traffic', 'energy_consumption'];
  
  for (let i = 0; i < count; i++) {
    const date = new Date(baseDate);
    date.setHours(baseDate.getHours() + i);
    
    for (const metricName of metricNames) {
      data.push({
        timestamp: date,
        metricName,
        value: Math.random() * 100 + Math.sin(i * 0.1) * 20,
        dimensions: {
          source: `server_${Math.floor(Math.random() * 5) + 1}`,
          environment: 'production'
        }
      });
    }
  }
  
  return data;
}

function generateSampleOperationsData(count: number): any[] {
  const data: any[] = [];
  
  for (let i = 0; i < count; i++) {
    data.push({
      timestamp: new Date(Date.now() - (count - i) * 24 * 60 * 60 * 1000),
      allocation: {
        solar_panels: Math.random() * 500,
        wind_turbines: Math.random() * 200,
        energy_storage: Math.random() * 100
      },
      outcome: {
        cost: 20000 + Math.random() * 30000,
        emissions: -5 + Math.random() * 10,
        efficiency: 1 + Math.random() * 0.5
      }
    });
  }
  
  return data;
}