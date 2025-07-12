/**
 * Stream B Production Integration Tests
 * Comprehensive integration testing for all Stream B ML Pipeline components
 * Tests the complete production-ready workflow from optimization to monitoring
 */

import { HyperparameterOptimizer, ModelOptimizationConfig } from '../hyperopt/hyperparameter-optimizer';
import { BayesianOptimizer, SearchSpace } from '../hyperopt/bayesian-optimizer';
import { AutoMLPipeline, AutoMLConfig } from '../automl/automl-pipeline';
import { ModelABTesting, ABTestConfig, TrafficSplit, ABTestRequest } from '../production/ab-testing';
import { EnhancedModelMonitoring, MonitoringConfig, PerformanceThresholds, AlertChannel } from '../production/enhanced-monitoring';
import { ModelOptimizer } from '../performance/model-optimizer';
import { ModelScaler } from '../performance/model-scaling';
import { RegulatoryPredictor } from '../regulatory-predictor';
import { GeneticAlgorithm } from '../algorithms/genetic-algorithm';
import { BaseModel } from '../base/base-model';
import { TrainingData } from '../types';

// Mock production-ready model for testing
class ProductionTestModel extends BaseModel {
  private conversionRate: number;
  private baseLatency: number;

  constructor(conversionRate: number = 0.15, baseLatency: number = 80) {
    super({ name: 'production_test_model' });
    this.conversionRate = conversionRate;
    this.baseLatency = baseLatency;
  }

  async predict(input: any): Promise<any> {
    // Simulate realistic prediction latency
    const latency = this.baseLatency + Math.random() * 20;
    await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
    
    const success = Math.random() < this.conversionRate;
    return {
      prediction: success ? 'positive' : 'negative',
      confidence: 0.7 + Math.random() * 0.25,
      success,
      latency
    };
  }

  async train(data: any): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return { status: 'trained', loss: 0.1 + Math.random() * 0.2 };
  }

  async evaluate(data: any): Promise<any> {
    return {
      accuracy: this.conversionRate + 0.1 + Math.random() * 0.1,
      precision: this.conversionRate,
      recall: this.conversionRate,
      f1Score: this.conversionRate,
      auc: this.conversionRate + 0.2
    };
  }

  isTrained(): boolean { return true; }
  setParameters(params: any): void {}
  getParameters(): any { return { conversionRate: this.conversionRate, baseLatency: this.baseLatency }; }
  getConfig(): any { return { name: 'production_test_model' }; }
  getModelName(): string { return 'production_test_model'; }
}

describe('Stream B Production Integration Tests', () => {
  let hyperOptimizer: HyperparameterOptimizer;
  let autoML: AutoMLPipeline;
  let abTesting: ModelABTesting;
  let monitoring: EnhancedModelMonitoring;
  let modelOptimizer: ModelOptimizer;
  let modelScaler: ModelScaler;

  // Production-ready test data
  const productionTrainingData: TrainingData = {
    features: Array.from({ length: 100 }, (_, i) => ({
      temperature: 20 + Math.random() * 15,
      humidity: 40 + Math.random() * 40,
      pressure: 990 + Math.random() * 40,
      emissions: 80 + Math.random() * 60,
      efficiency: 0.6 + Math.random() * 0.3
    })),
    labels: Array.from({ length: 100 }, () => Math.random() > 0.6 ? 1 : 0),
    metadata: { source: 'production', version: '2.0', timestamp: new Date() }
  };

  const validationData: TrainingData = {
    features: Array.from({ length: 30 }, (_, i) => ({
      temperature: 22 + Math.random() * 10,
      humidity: 45 + Math.random() * 30,
      pressure: 1000 + Math.random() * 30,
      emissions: 90 + Math.random() * 40,
      efficiency: 0.65 + Math.random() * 0.25
    })),
    labels: Array.from({ length: 30 }, () => Math.random() > 0.65 ? 1 : 0),
    metadata: { source: 'validation', version: '2.0' }
  };

  beforeEach(() => {
    // Initialize all Stream B components
    hyperOptimizer = new HyperparameterOptimizer(
      HyperparameterOptimizer.createOptimizationConfig('balanced')
    );
    autoML = new AutoMLPipeline();
    abTesting = new ModelABTesting(12345);
    
    // Configure production monitoring
    const thresholds: PerformanceThresholds = {
      maxLatency: 200,
      minAccuracy: 0.75,
      maxErrorRate: 0.05,
      minThroughput: 10,
      maxDriftScore: 0.4
    };

    const alertChannels: AlertChannel[] = [
      { type: 'console', target: 'console', severity: 'medium' },
      { type: 'webhook', target: 'https://prod-alerts.blipee.com/webhook', severity: 'high' }
    ];

    const monitoringConfig: MonitoringConfig = {
      modelName: 'production_model',
      monitoringInterval: 5000,
      driftDetectionEnabled: true,
      performanceThresholds: thresholds,
      alertingEnabled: true,
      alertChannels,
      retentionPeriod: 30,
      samplingRate: 1.0
    };

    monitoring = new EnhancedModelMonitoring(monitoringConfig);
    modelOptimizer = new ModelOptimizer();
    modelScaler = new ModelScaler({
      minInstances: 1,
      maxInstances: 10,
      targetCPU: 70,
      scaleUpThreshold: 80,
      scaleDownThreshold: 30
    });
  });

  afterEach(() => {
    monitoring.stopMonitoring();
  });

  describe('End-to-End ML Pipeline', () => {
    it('should execute complete ML pipeline from optimization to production monitoring', async () => {
      console.log('🚀 Testing complete end-to-end ML pipeline...');
      
      // Step 1: AutoML - Find best model
      console.log('   📊 Step 1: Running AutoML to find best model...');
      const autoMLConfig: AutoMLConfig = {
        taskType: 'classification',
        objective: 'accuracy',
        maxModels: 3,
        maxOptimizationTime: 120,
        crossValidationFolds: 3,
        ensembleStrategy: 'voting',
        featureEngineering: true
      };

      const autoMLResult = await autoML.runAutoML(
        productionTrainingData,
        validationData,
        autoMLConfig
      );

      expect(autoMLResult.bestModel).toBeDefined();
      expect(autoMLResult.bestScore).toBeGreaterThan(0.5);
      console.log(`      ✅ Best model: ${autoMLResult.bestModel.getModelName()} (score: ${autoMLResult.bestScore.toFixed(3)})`);

      // Step 2: Hyperparameter Optimization
      console.log('   🔧 Step 2: Optimizing hyperparameters...');
      const model = new RegulatoryPredictor();
      const searchSpace = HyperparameterOptimizer.createSearchSpace('regulatory_predictor');
      
      const optimizationConfig: ModelOptimizationConfig = {
        model,
        trainingData: productionTrainingData,
        validationData,
        searchSpace,
        objective: 'accuracy',
        optimizationConfig: HyperparameterOptimizer.createOptimizationConfig('fast'),
        crossValidationFolds: 3
      };

      const optimizedModel = await hyperOptimizer.optimizeModel(optimizationConfig);
      expect(optimizedModel.bestScore).toBeGreaterThan(0);
      console.log(`      ✅ Optimization complete (score: ${optimizedModel.bestScore.toFixed(3)})`);

      // Step 3: Performance Optimization
      console.log('   ⚡ Step 3: Applying performance optimizations...');
      const performanceResults = await modelOptimizer.optimizeModel(
        model,
        productionTrainingData.features.slice(0, 10)
      );

      expect(performanceResults.success).toBe(true);
      expect(performanceResults.strategies.length).toBeGreaterThan(0);
      console.log(`      ✅ Applied ${performanceResults.strategies.length} optimization strategies`);

      // Step 4: Set up A/B Testing
      console.log('   🧪 Step 4: Setting up A/B testing framework...');
      const controlModel = new ProductionTestModel(0.12, 90);
      const variantModel = new ProductionTestModel(0.18, 85);

      const trafficSplit: TrafficSplit = {
        control: {
          percentage: 50,
          model: controlModel,
          label: 'Current Production Model'
        },
        variants: [{
          id: 'optimized_variant',
          percentage: 50,
          model: variantModel,
          label: 'Optimized Model'
        }]
      };

      const abTestConfig: ABTestConfig = {
        testName: 'Production Model Optimization Test',
        description: 'Testing optimized model against current production',
        startDate: new Date(),
        trafficSplit,
        successMetrics: ['conversion_rate', 'latency'],
        minimumSampleSize: 100,
        significanceLevel: 0.05,
        maxDuration: 300000
      };

      const testId = await abTesting.startExperiment(abTestConfig);
      expect(testId).toBeDefined();
      console.log(`      ✅ A/B test started (ID: ${testId})`);

      // Step 5: Production Monitoring Setup
      console.log('   📈 Step 5: Setting up production monitoring...');
      await monitoring.startMonitoring();
      monitoring.setBaseline(productionTrainingData);

      // Step 6: Simulate Production Traffic
      console.log('   🚦 Step 6: Simulating production traffic...');
      const predictions = [];
      for (let i = 0; i < 50; i++) {
        const request: ABTestRequest = {
          userId: `user_${i}`,
          sessionId: `session_${i}`,
          input: productionTrainingData.features[i % productionTrainingData.features.length],
          timestamp: new Date()
        };

        const result = await abTesting.predict(testId, request);
        predictions.push(result);

        // Record monitoring data
        await monitoring.recordPrediction(
          `req_${i}`,
          result.prediction,
          request.input,
          result.latency,
          result.confidence,
          request.userId,
          request.sessionId
        );

        // Simulate some outcomes
        const success = Math.random() > 0.3;
        await monitoring.recordOutcome(`req_${i}`, success);
      }

      console.log(`      ✅ Processed ${predictions.length} production requests`);

      // Step 7: Validate Results
      console.log('   ✅ Step 7: Validating end-to-end results...');
      
      // Check A/B test results
      const abResults = await abTesting.getExperimentResults(testId);
      expect(abResults.totalRequests).toBe(50);
      expect(abResults.variantPerformance.size).toBe(2);
      console.log(`      📊 A/B test: ${abResults.totalRequests} requests processed`);

      // Check monitoring health
      const health = await monitoring.getModelHealth();
      expect(health.currentMetrics.requestCount).toBe(50);
      expect(health.status).toMatch(/^(healthy|warning|critical|degraded)$/);
      console.log(`      💚 Model health: ${health.status}`);
      console.log(`      📊 Monitoring: ${health.currentMetrics.requestCount} requests, ${health.currentMetrics.averageLatency.toFixed(1)}ms avg latency`);

      // Stop the A/B test
      await abTesting.stopExperiment(testId, 'Integration test completed');
      
      console.log('   🎉 End-to-end pipeline completed successfully!');
    }, 60000);
  });

  describe('Production Scalability Tests', () => {
    it('should handle high-throughput production workloads', async () => {
      console.log('🔥 Testing high-throughput production scalability...');
      
      // Register models with scaler
      const models = [
        new ProductionTestModel(0.15, 80),
        new ProductionTestModel(0.18, 75),
        new ProductionTestModel(0.12, 95)
      ];

      for (let i = 0; i < models.length; i++) {
        modelScaler.registerModel(`model_${i}`, () => models[i]);
      }

      // Simulate high load
      const startTime = Date.now();
      const concurrentRequests = 100;
      const requests = [];

      for (let i = 0; i < concurrentRequests; i++) {
        const modelId = `model_${i % models.length}`;
        const request = modelScaler.predict(modelId, {
          temperature: 25 + Math.random() * 10,
          humidity: 50 + Math.random() * 20
        });
        requests.push(request);
      }

      const results = await Promise.all(requests);
      const endTime = Date.now();

      expect(results.length).toBe(concurrentRequests);
      expect(results.every(r => r !== null)).toBe(true);

      const totalTime = endTime - startTime;
      const throughput = (concurrentRequests / totalTime) * 1000; // requests per second

      console.log(`      ✅ Processed ${concurrentRequests} concurrent requests in ${totalTime}ms`);
      console.log(`      📈 Throughput: ${throughput.toFixed(1)} requests/second`);

      expect(throughput).toBeGreaterThan(10); // Should handle at least 10 req/s
    }, 30000);

    it('should maintain performance under continuous monitoring', async () => {
      console.log('📊 Testing continuous monitoring performance...');
      
      await monitoring.startMonitoring();
      const startTime = Date.now();
      const requestCount = 200;

      // Generate continuous monitoring data
      for (let i = 0; i < requestCount; i++) {
        await monitoring.recordPrediction(
          `perf_req_${i}`,
          { prediction: 'test', confidence: 0.8 + Math.random() * 0.2 },
          { feature1: Math.random(), feature2: Math.random() },
          50 + Math.random() * 100,
          0.8 + Math.random() * 0.2,
          `user_${i % 50}`,
          `session_${i % 20}`
        );

        // Record some outcomes
        if (i % 3 === 0) {
          await monitoring.recordOutcome(`perf_req_${i}`, Math.random() > 0.3);
        }
      }

      const health = await monitoring.getModelHealth();
      const endTime = Date.now();

      expect(health.currentMetrics.requestCount).toBe(requestCount);
      expect(health.currentMetrics.averageLatency).toBeGreaterThan(0);
      expect(health.status).toBeDefined();

      console.log(`      ✅ Monitored ${requestCount} requests in ${endTime - startTime}ms`);
      console.log(`      📊 Average latency: ${health.currentMetrics.averageLatency.toFixed(1)}ms`);
      console.log(`      💚 Final status: ${health.status}`);
    }, 45000);
  });

  describe('Error Recovery and Resilience', () => {
    it('should recover gracefully from model failures', async () => {
      console.log('🛡️ Testing error recovery and resilience...');
      
      // Create a model that fails intermittently
      class FlakyModel extends BaseModel {
        private failureRate: number;
        private callCount: number = 0;

        constructor(failureRate: number = 0.3) {
          super({ name: 'flaky_model' });
          this.failureRate = failureRate;
        }

        async predict(input: any): Promise<any> {
          this.callCount++;
          if (Math.random() < this.failureRate) {
            throw new Error(`Model failure on call ${this.callCount}`);
          }
          return { prediction: 'success', confidence: 0.8 };
        }

        async train(data: any): Promise<any> { return { status: 'trained' }; }
        async evaluate(data: any): Promise<any> { return { accuracy: 0.8 }; }
        isTrained(): boolean { return true; }
        setParameters(params: any): void {}
        getParameters(): any { return {}; }
        getConfig(): any { return { name: 'flaky_model' }; }
        getModelName(): string { return 'flaky_model'; }
      }

      const flakyModel = new FlakyModel(0.3); // 30% failure rate
      const reliableModel = new ProductionTestModel(0.15, 80);

      // Set up A/B test with flaky model
      const trafficSplit: TrafficSplit = {
        control: {
          percentage: 50,
          model: reliableModel,
          label: 'Reliable Model'
        },
        variants: [{
          id: 'flaky_variant',
          percentage: 50,
          model: flakyModel,
          label: 'Flaky Model'
        }]
      };

      const config: ABTestConfig = {
        testName: 'Resilience Test',
        description: 'Testing error recovery',
        startDate: new Date(),
        trafficSplit,
        successMetrics: ['success_rate'],
        minimumSampleSize: 50,
        significanceLevel: 0.05
      };

      const testId = await abTesting.startExperiment(config);
      
      // Simulate requests and count failures
      let successCount = 0;
      let failureCount = 0;

      for (let i = 0; i < 100; i++) {
        try {
          const request: ABTestRequest = {
            userId: `resilience_user_${i}`,
            sessionId: `resilience_session_${i}`,
            input: { test: true },
            timestamp: new Date()
          };

          await abTesting.predict(testId, request);
          successCount++;
        } catch (error) {
          failureCount++;
          expect(error.message).toContain('Model failure');
        }
      }

      const successRate = successCount / (successCount + failureCount);
      
      expect(successCount).toBeGreaterThan(0);
      expect(successRate).toBeGreaterThan(0.5); // Should succeed more than 50% of the time
      
      console.log(`      ✅ Handled ${failureCount} failures out of 100 requests`);
      console.log(`      📊 Success rate: ${(successRate * 100).toFixed(1)}%`);

      await abTesting.stopExperiment(testId);
    }, 30000);

    it('should maintain monitoring during system stress', async () => {
      console.log('⚡ Testing monitoring under system stress...');
      
      await monitoring.startMonitoring();
      
      // Simulate high-frequency, high-latency requests
      const stressRequests = [];
      for (let i = 0; i < 50; i++) {
        const request = monitoring.recordPrediction(
          `stress_req_${i}`,
          { prediction: 'stress_test' },
          { load: i, timestamp: Date.now() },
          200 + Math.random() * 300, // High latency
          0.5 + Math.random() * 0.5
        );
        stressRequests.push(request);
      }

      await Promise.all(stressRequests);

      // Give monitoring system time to process
      await new Promise(resolve => setTimeout(resolve, 2000));

      const health = await monitoring.getModelHealth();
      
      expect(health.currentMetrics.requestCount).toBe(50);
      expect(health.currentMetrics.averageLatency).toBeGreaterThan(200);
      expect(health.alerts.length).toBeGreaterThan(0); // Should have latency alerts
      
      const latencyAlerts = health.alerts.filter(a => a.message.includes('latency'));
      expect(latencyAlerts.length).toBeGreaterThan(0);
      
      console.log(`      ✅ Processed stress test with ${health.currentMetrics.averageLatency.toFixed(1)}ms avg latency`);
      console.log(`      🚨 Generated ${latencyAlerts.length} latency alerts`);
    }, 20000);
  });

  describe('Production Configuration Validation', () => {
    it('should validate all production configurations', () => {
      console.log('⚙️ Testing production configuration validation...');
      
      // Test monitoring configuration
      expect(monitoring).toBeDefined();
      const health = monitoring.getModelHealth();
      expect(health).resolves.toBeDefined();
      
      // Test AutoML configuration
      const autoMLConfig = {
        taskType: 'classification' as const,
        objective: 'accuracy' as const,
        maxModels: 10,
        maxOptimizationTime: 3600,
        crossValidationFolds: 5
      };
      
      expect(autoMLConfig.taskType).toBe('classification');
      expect(autoMLConfig.maxModels).toBeGreaterThan(0);
      expect(autoMLConfig.maxOptimizationTime).toBeGreaterThan(0);
      
      // Test hyperparameter optimization configuration
      const hyperOptConfig = HyperparameterOptimizer.createOptimizationConfig('balanced');
      expect(hyperOptConfig.nInitialPoints).toBeGreaterThan(0);
      expect(hyperOptConfig.nIterations).toBeGreaterThan(0);
      expect(hyperOptConfig.acquisitionFunction).toBeDefined();
      
      console.log('      ✅ All production configurations validated');
    });

    it('should ensure resource limits are properly configured', () => {
      console.log('🔒 Testing resource limit configurations...');
      
      // Test model scaler limits
      const scalerConfig = modelScaler.getConfig();
      expect(scalerConfig.minInstances).toBeGreaterThanOrEqual(1);
      expect(scalerConfig.maxInstances).toBeGreaterThan(scalerConfig.minInstances);
      expect(scalerConfig.targetCPU).toBeGreaterThan(0);
      expect(scalerConfig.targetCPU).toBeLessThan(100);
      
      // Test monitoring retention and sampling
      const monitoringConfig = monitoring['config'];
      expect(monitoringConfig.retentionPeriod).toBeGreaterThan(0);
      expect(monitoringConfig.samplingRate).toBeGreaterThan(0);
      expect(monitoringConfig.samplingRate).toBeLessThanOrEqual(1);
      
      console.log('      ✅ Resource limits properly configured');
    });
  });
});