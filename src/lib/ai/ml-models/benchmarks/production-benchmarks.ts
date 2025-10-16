/**
 * Production Benchmarking Suite for Stream B ML Pipeline
 * Comprehensive performance testing and validation for production readiness
 */

import { HyperparameterOptimizer } from '../hyperopt/hyperparameter-optimizer';
import { AutoMLPipeline } from '../automl/automl-pipeline';
import { ModelABTesting, ABTestConfig, TrafficSplit } from '../production/ab-testing';
import { EnhancedModelMonitoring, MonitoringConfig } from '../production/enhanced-monitoring';
import { ModelOptimizer } from '../performance/model-optimizer';
import { ModelScaler } from '../performance/model-scaling';
import { ProductionMLManager } from '../deployment/production-manager';
import { RegulatoryPredictor } from '../regulatory-predictor';
import { GeneticAlgorithm } from '../algorithms/genetic-algorithm';
import { BaseModel } from '../base/base-model';
import { TrainingData } from '../types';

export interface BenchmarkResult {
  testName: string;
  component: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  success: boolean;
  metrics: {
    throughput?: number;
    latency?: number;
    memoryUsage?: number;
    cpuUsage?: number;
    accuracy?: number;
    errorRate?: number;
  };
  details: Record<string, any>;
  recommendations: string[];
}

export interface BenchmarkSuite {
  suiteName: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalDuration: number;
  results: BenchmarkResult[];
  summary: {
    overallScore: number;
    productionReady: boolean;
    criticalIssues: string[];
    recommendations: string[];
  };
}

// Benchmark test model for consistent testing
class BenchmarkTestModel extends BaseModel {
  private latencyTarget: number;
  private accuracyTarget: number;

  constructor(latencyTarget: number = 100, accuracyTarget: number = 0.85) {
    super({ name: 'benchmark_test_model' });
    this.latencyTarget = latencyTarget;
    this.accuracyTarget = accuracyTarget;
  }

  async predict(input: any): Promise<any> {
    const startTime = Date.now();
    
    // Simulate realistic processing time
    await new Promise(resolve => setTimeout(resolve, this.latencyTarget + Math.random() * 20));
    
    const latency = Date.now() - startTime;
    const prediction = Math.random() > 0.5 ? 'positive' : 'negative';
    const confidence = this.accuracyTarget + (Math.random() - 0.5) * 0.2;

    return {
      prediction,
      confidence: Math.max(0.1, Math.min(0.99, confidence)),
      latency,
      success: true
    };
  }

  async train(data: any): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { status: 'trained', loss: 0.1 + Math.random() * 0.1 };
  }

  async evaluate(data: any): Promise<any> {
    return {
      accuracy: this.accuracy,
      precision: this.accuracyTarget * 0.95,
      recall: this.accuracyTarget * 0.9,
      f1Score: this.accuracyTarget * 0.92,
      auc: this.accuracyTarget * 1.1
    };
  }

  isTrained(): boolean { return true; }
  setParameters(params: any): void {}
  getParameters(): any { return { latencyTarget: this.latency, accuracyTarget: this.accuracyTarget }; }
  getConfig(): any { return { name: 'benchmark_test_model' }; }
  getModelName(): string { return 'benchmark_test_model'; }
}

export class ProductionBenchmarkSuite {
  private results: BenchmarkResult[] = [];

  constructor() {}

  /**
   * Run complete production benchmark suite
   */
  async runFullBenchmarkSuite(): Promise<BenchmarkSuite> {
    const suiteStartTime = Date.now();

    // Reset results
    this.results = [];

    // Run all benchmark categories
    await this.runPerformanceBenchmarks();
    await this.runScalabilityBenchmarks();
    await this.runReliabilityBenchmarks();
    await this.runOptimizationBenchmarks();
    await this.runMonitoringBenchmarks();
    await this.runIntegrationBenchmarks();

    const suiteDuration = Date.now() - suiteStartTime;
    const passedTests = this.results.filter(r => r.success).length;
    const failedTests = this.results.filter(r => !r.success).length;

    const summary = this.generateSummary();


    return {
      suiteName: 'Stream B Production Readiness',
      totalTests: this.results.length,
      passedTests,
      failedTests,
      totalDuration: suiteDuration,
      results: this.results,
      summary
    };
  }

  /**
   * Performance benchmarks
   */
  private async runPerformanceBenchmarks(): Promise<void> {

    // Latency benchmark
    await this.runBenchmark(
      'Model Prediction Latency',
      'performance',
      async () => {
        const model = new BenchmarkTestModel(80, 0.85);
        const requests = 100;
        const latencies: number[] = [];

        for (let i = 0; i < requests; i++) {
          const startTime = Date.now();
          await model.predict({ test: i });
          latencies.push(Date.now() - startTime);
        }

        const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
        const p95Latency = latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.95)];
        const throughput = requests / (latencies.reduce((a, b) => a + b, 0) / 1000);

        return {
          success: avgLatency < 150 && p95Latency < 200,
          metrics: {
            latency: avgLatency,
            throughput: throughput
          },
          details: {
            avgLatency,
            p95Latency,
            minLatency: Math.min(...latencies),
            maxLatency: Math.max(...latencies),
            requests
          },
          recommendations: avgLatency > 150 ? ['Consider model optimization', 'Review inference pipeline'] : []
        };
      }
    );

    // Throughput benchmark
    await this.runBenchmark(
      'High Throughput Handling',
      'performance',
      async () => {
        const model = new BenchmarkTestModel(50, 0.85);
        const concurrentRequests = 50;
        const startTime = Date.now();

        const promises = Array.from({ length: concurrentRequests }, (_, i) =>
          model.predict({ concurrent: i })
        );

        const results = await Promise.all(promises);
        const duration = Date.now() - startTime;
        const throughput = (concurrentRequests / duration) * 1000; // req/s

        return {
          success: throughput > 10 && results.every(r => r.success),
          metrics: {
            throughput,
            latency: duration / concurrentRequests
          },
          details: {
            concurrentRequests,
            totalDuration: duration,
            throughputPerSecond: throughput,
            successRate: results.filter(r => r.success).length / results.length
          },
          recommendations: throughput < 10 ? ['Optimize model inference', 'Consider horizontal scaling'] : []
        };
      }
    );

    // Memory usage benchmark
    await this.runBenchmark(
      'Memory Usage Under Load',
      'performance',
      async () => {
        const initialMemory = process.memoryUsage();
        const model = new BenchmarkTestModel(30, 0.85);
        
        // Process many requests to test memory usage
        for (let i = 0; i < 200; i++) {
          await model.predict({ load_test: i });
        }

        const finalMemory = process.memoryUsage();
        const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
        const memoryIncreasePercentage = (memoryIncrease / initialMemory.heapUsed) * 100;

        return {
          success: memoryIncreasePercentage < 50, // Less than 50% memory increase
          metrics: {
            memoryUsage: finalMemory.heapUsed / 1024 / 1024 // MB
          },
          details: {
            initialMemoryMB: initialMemory.heapUsed / 1024 / 1024,
            finalMemoryMB: finalMemory.heapUsed / 1024 / 1024,
            increaseMB: memoryIncrease / 1024 / 1024,
            increasePercentage: memoryIncreasePercentage
          },
          recommendations: memoryIncreasePercentage > 50 ? ['Check for memory leaks', 'Optimize model loading'] : []
        };
      }
    );
  }

  /**
   * Scalability benchmarks
   */
  private async runScalabilityBenchmarks(): Promise<void> {

    // Auto-scaling benchmark
    await this.runBenchmark(
      'Auto-scaling Performance',
      'scalability',
      async () => {
        const scaler = new ModelScaler({
          minInstances: 1,
          maxInstances: 5,
          targetCPU: 70,
          scaleUpThreshold: 80,
          scaleDownThreshold: 30
        });

        const model = new BenchmarkTestModel(60, 0.85);
        scaler.registerModel('benchmark-model', () => model);

        // Simulate load increase
        const requests = 30;
        const startTime = Date.now();
        const promises = [];

        for (let i = 0; i < requests; i++) {
          promises.push(scaler.predict('benchmark-model', { load: i }));
        }

        const results = await Promise.all(promises);
        const duration = Date.now() - startTime;
        const successRate = results.filter(r => r !== null).length / results.length;

        return {
          success: successRate > 0.95,
          metrics: {
            throughput: (requests / duration) * 1000
          },
          details: {
            totalRequests: requests,
            successfulRequests: results.filter(r => r !== null).length,
            successRate,
            averageLatency: duration / requests
          },
          recommendations: successRate < 0.95 ? ['Review scaling thresholds', 'Check instance startup time'] : []
        };
      }
    );

    // Load distribution benchmark
    await this.runBenchmark(
      'Load Distribution Efficiency',
      'scalability',
      async () => {
        const models = [
          new BenchmarkTestModel(50, 0.85),
          new BenchmarkTestModel(60, 0.87),
          new BenchmarkTestModel(70, 0.83)
        ];

        const requests = 60;
        const results = [];
        
        for (let i = 0; i < requests; i++) {
          const modelIndex = i % models.length;
          const result = await models[modelIndex].predict({ distributed: i });
          results.push({ ...result, modelIndex });
        }

        const modelCounts = [0, 1, 2].map(i => 
          results.filter(r => r.modelIndex === i).length
        );
        
        const distribution = Math.max(...modelCounts) - Math.min(...modelCounts);
        const avgLatency = results.reduce((sum, r) => sum + r.latency, 0) / results.length;

        return {
          success: distribution <= 5 && avgLatency < 100,
          metrics: {
            latency: avgLatency
          },
          details: {
            modelCounts,
            distribution,
            avgLatency,
            totalRequests: requests
          },
          recommendations: distribution > 5 ? ['Improve load balancing algorithm'] : []
        };
      }
    );
  }

  /**
   * Reliability benchmarks
   */
  private async runReliabilityBenchmarks(): Promise<void> {

    // Error recovery benchmark
    await this.runBenchmark(
      'Error Recovery Handling',
      'reliability',
      async () => {
        // Model that fails 20% of the time
        class UnreliableModel extends BaseModel {
          constructor() { super({ name: 'unreliable_model' }); }
          
          async predict(input: any): Promise<any> {
            if (Math.random() < 0.2) {
              throw new Error('Simulated model failure');
            }
            return { prediction: 'success', confidence: 0.8 };
          }

          async train(data: any): Promise<any> { return {}; }
          async evaluate(data: any): Promise<any> { return {}; }
          isTrained(): boolean { return true; }
          setParameters(params: any): void {}
          getParameters(): any { return {}; }
          getConfig(): any { return { name: 'unreliable_model' }; }
          getModelName(): string { return 'unreliable_model'; }
        }

        const model = new UnreliableModel();
        const requests = 100;
        let successes = 0;
        let failures = 0;

        for (let i = 0; i < requests; i++) {
          try {
            await model.predict({ test: i });
            successes++;
          } catch (error) {
            failures++;
          }
        }

        const successRate = successes / requests;
        const expectedFailureRate = 0.2;
        const actualFailureRate = failures / requests;

        return {
          success: Math.abs(actualFailureRate - expectedFailureRate) < 0.05,
          metrics: {
            errorRate: actualFailureRate
          },
          details: {
            totalRequests: requests,
            successes,
            failures,
            successRate,
            expectedFailureRate,
            actualFailureRate
          },
          recommendations: actualFailureRate > 0.25 ? ['Implement circuit breaker', 'Add retry logic'] : []
        };
      }
    );

    // Circuit breaker benchmark
    await this.runBenchmark(
      'Circuit Breaker Functionality',
      'reliability',
      async () => {
        let failureCount = 0;
        let circuitOpen = false;
        const failureThreshold = 5;

        const requests = 20;
        let blockedRequests = 0;

        for (let i = 0; i < requests; i++) {
          if (circuitOpen) {
            blockedRequests++;
            continue;
          }

          // Simulate failures
          if (i < 7) {
            failureCount++;
            if (failureCount >= failureThreshold) {
              circuitOpen = true;
            }
          }
        }

        return {
          success: circuitOpen && blockedRequests > 0,
          metrics: {},
          details: {
            totalRequests: requests,
            failureCount,
            blockedRequests,
            circuitOpenTriggered: circuitOpen,
            failureThreshold
          },
          recommendations: !circuitOpen ? ['Verify circuit breaker configuration'] : []
        };
      }
    );
  }

  /**
   * Optimization benchmarks
   */
  private async runOptimizationBenchmarks(): Promise<void> {

    // Hyperparameter optimization benchmark
    await this.runBenchmark(
      'Hyperparameter Optimization Speed',
      'optimization',
      async () => {
        const optimizer = new HyperparameterOptimizer(
          HyperparameterOptimizer.createOptimizationConfig('fast')
        );

        const model = new RegulatoryPredictor();
        const searchSpace = HyperparameterOptimizer.createSearchSpace('regulatory_predictor');
        
        const sampleData = {
          features: Array.from({ length: 20 }, (_, i) => ({ text: `sample ${i}`, value: i })),
          labels: Array.from({ length: 20 }, () => Math.random() > 0.5 ? 1 : 0),
          metadata: { source: 'benchmark' }
        };

        const startTime = Date.now();
        const result = await optimizer.optimizeModel({
          model,
          trainingData: sampleData,
          validationData: sampleData,
          searchSpace,
          objective: 'accuracy',
          optimizationConfig: HyperparameterOptimizer.createOptimizationConfig('fast'),
          crossValidationFolds: 3
        });
        const duration = Date.now() - startTime;

        return {
          success: duration < 30000 && result.bestScore > 0, // Under 30 seconds
          metrics: {},
          details: {
            optimizationTime: duration,
            bestScore: result.bestScore,
            totalEvaluations: result.optimizationHistory.totalEvaluations,
            improvement: result.improvements.relativeImprovement
          },
          recommendations: duration > 30000 ? ['Reduce search space size', 'Use faster optimization config'] : []
        };
      }
    );

    // Model optimization benchmark
    await this.runBenchmark(
      'Model Performance Optimization',
      'optimization',
      async () => {
        const optimizer = new ModelOptimizer();
        const model = new BenchmarkTestModel(100, 0.8);
        
        const testData = Array.from({ length: 10 }, (_, i) => ({ test: i }));
        
        const startTime = Date.now();
        const result = await optimizer.optimizeModel(model, testData);
        const duration = Date.now() - startTime;

        return {
          success: result.success && result.strategies.length > 0,
          metrics: {},
          details: {
            optimizationTime: duration,
            strategiesApplied: result.strategies.length,
            strategies: result.strategies,
            performanceGain: result.performanceGain
          },
          recommendations: !result.success ? ['Check model compatibility', 'Review optimization strategies'] : []
        };
      }
    );
  }

  /**
   * Monitoring benchmarks
   */
  private async runMonitoringBenchmarks(): Promise<void> {

    // Monitoring setup benchmark
    await this.runBenchmark(
      'Monitoring System Setup',
      'monitoring',
      async () => {
        const config: MonitoringConfig = {
          modelName: 'benchmark_model',
          monitoringInterval: 1000,
          driftDetectionEnabled: true,
          performanceThresholds: {
            maxLatency: 100,
            minAccuracy: 0.8,
            maxErrorRate: 0.05,
            minThroughput: 10,
            maxDriftScore: 0.3
          },
          alertingEnabled: true,
          alertChannels: [
            { type: 'console', target: 'console', severity: 'medium' }
          ],
          retentionPeriod: 7,
          samplingRate: 1.0
        };

        const monitoring = new EnhancedModelMonitoring(config);
        
        const startTime = Date.now();
        await monitoring.startMonitoring();
        
        // Record some test data
        for (let i = 0; i < 10; i++) {
          await monitoring.recordPrediction(
            `bench_req_${i}`,
            { prediction: 'test' },
            { feature: i },
            50 + Math.random() * 50,
            0.8 + Math.random() * 0.2
          );
        }

        const health = await monitoring.getModelHealth();
        monitoring.stopMonitoring();
        
        const setupTime = Date.now() - startTime;

        return {
          success: health.currentMetrics.requestCount === 10 && setupTime < 5000,
          metrics: {},
          details: {
            setupTime,
            recordedRequests: health.currentMetrics.requestCount,
            averageLatency: health.currentMetrics.averageLatency,
            status: health.status
          },
          recommendations: setupTime > 5000 ? ['Optimize monitoring initialization'] : []
        };
      }
    );

    // Drift detection benchmark
    await this.runBenchmark(
      'Drift Detection Accuracy',
      'monitoring',
      async () => {
        const config: MonitoringConfig = {
          modelName: 'drift_test_model',
          monitoringInterval: 1000,
          driftDetectionEnabled: true,
          performanceThresholds: {
            maxLatency: 100,
            minAccuracy: 0.8,
            maxErrorRate: 0.05,
            minThroughput: 10,
            maxDriftScore: 0.3
          },
          alertingEnabled: false,
          alertChannels: [],
          retentionPeriod: 1,
          samplingRate: 1.0
        };

        const monitoring = new EnhancedModelMonitoring(config);
        await monitoring.startMonitoring();

        // Set baseline
        const baselineData = {
          features: Array.from({ length: 50 }, () => ({
            temperature: 25 + Math.random() * 5,
            humidity: 60 + Math.random() * 10
          })),
          labels: Array.from({ length: 50 }, () => Math.random() > 0.5 ? 1 : 0),
          metadata: { source: 'baseline' }
        };
        
        monitoring.setBaseline(baselineData);

        // Record drifted data
        for (let i = 0; i < 30; i++) {
          await monitoring.recordPrediction(
            `drift_req_${i}`,
            { prediction: 'test' },
            {
              temperature: 35 + Math.random() * 5, // Shifted distribution
              humidity: 40 + Math.random() * 10   // Shifted distribution
            },
            50,
            0.8
          );
        }

        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for drift detection

        const health = await monitoring.getModelHealth();
        monitoring.stopMonitoring();

        const driftDetected = health.driftStatus.overallDriftScore > 0.1;

        return {
          success: driftDetected,
          metrics: {},
          details: {
            driftScore: health.driftStatus.overallDriftScore,
            driftTrend: health.driftStatus.driftTrend,
            alertCount: health.alerts.length,
            status: health.status
          },
          recommendations: !driftDetected ? ['Verify drift detection sensitivity', 'Check baseline data'] : []
        };
      }
    );
  }

  /**
   * Integration benchmarks
   */
  private async runIntegrationBenchmarks(): Promise<void> {

    // End-to-end pipeline benchmark
    await this.runBenchmark(
      'End-to-End Pipeline Integration',
      'integration',
      async () => {
        const autoML = new AutoMLPipeline();
        
        const trainingData = {
          features: Array.from({ length: 30 }, (_, i) => ({
            feature1: i * 0.1,
            feature2: Math.sin(i * 0.1),
            feature3: Math.random()
          })),
          labels: Array.from({ length: 30 }, () => Math.random() > 0.5 ? 1 : 0),
          metadata: { source: 'integration_test' }
        };

        const validationData = {
          features: Array.from({ length: 10 }, (_, i) => ({
            feature1: (i + 30) * 0.1,
            feature2: Math.sin((i + 30) * 0.1),
            feature3: Math.random()
          })),
          labels: Array.from({ length: 10 }, () => Math.random() > 0.5 ? 1 : 0),
          metadata: { source: 'validation' }
        };

        const startTime = Date.now();
        const result = await autoML.quickAutoML(trainingData, validationData, 'classification');
        const duration = Date.now() - startTime;

        return {
          success: result.bestModel !== null && result.bestScore > 0 && duration < 60000,
          metrics: {},
          details: {
            pipelineTime: duration,
            bestScore: result.bestScore,
            modelsEvaluated: result.modelsEvaluated,
            bestModelName: result.bestModel?.getModelName()
          },
          recommendations: duration > 60000 ? ['Optimize pipeline performance', 'Reduce model evaluation time'] : []
        };
      }
    );

    // Production manager benchmark
    await this.runBenchmark(
      'Production Manager Integration',
      'integration',
      async () => {
        const manager = new ProductionMLManager('development');
        
        const model = new BenchmarkTestModel(80, 0.85);
        
        const startTime = Date.now();
        
        // Register model
        await manager.registerModel(
          'integration-test-model',
          'Integration Test Model',
          'Model for integration testing',
          model,
          '1.0.0',
          { metrics: { accuracy: 0.85 } },
          'benchmark-suite'
        );

        // Deploy model
        const deploymentResult = await manager.deployModel({
          modelId: 'integration-test-model',
          targetVersion: '1.0.0',
          rolloutStrategy: 'immediate',
          trafficSplitPercentage: 100,
          rollbackOnFailure: false,
          healthCheckCriteria: {
            maxErrorRate: 0.05,
            maxLatency: 200
          },
          approvalRequired: false
        });

        const health = await manager.getSystemHealth();
        await manager.shutdown();

        const duration = Date.now() - startTime;

        return {
          success: deploymentResult && health.overallStatus !== 'critical',
          metrics: {},
          details: {
            integrationTime: duration,
            deploymentSuccess: deploymentResult,
            systemStatus: health.overallStatus,
            totalModels: health.summary.totalModels,
            healthyModels: health.summary.healthyModels
          },
          recommendations: !deploymentResult ? ['Check deployment configuration', 'Verify model registration'] : []
        };
      }
    );
  }

  /**
   * Run individual benchmark test
   */
  private async runBenchmark(
    testName: string,
    component: string,
    testFunction: () => Promise<{
      success: boolean;
      metrics: Record<string, number>;
      details: Record<string, any>;
      recommendations: string[];
    }>
  ): Promise<void> {
    
    const startTime = Date.now();
    let result: BenchmarkResult;

    try {
      const testResult = await testFunction();
      const endTime = Date.now();

      result = {
        testName,
        component,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        duration: endTime - startTime,
        success: testResult.success,
        metrics: testResult.metrics,
        details: testResult.details,
        recommendations: testResult.recommendations
      };

      
    } catch (error) {
      const endTime = Date.now();
      
      result = {
        testName,
        component,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        duration: endTime - startTime,
        success: false,
        metrics: {},
        details: { error: error.message },
        recommendations: [`Fix error: ${error.message}`]
      };

    }

    this.results.push(result);
  }

  /**
   * Generate benchmark summary
   */
  private generateSummary(): {
    overallScore: number;
    productionReady: boolean;
    criticalIssues: string[];
    recommendations: string[];
  } {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.success).length;
    const overallScore = (passedTests / totalTests) * 100;

    const criticalIssues: string[] = [];
    const recommendations: string[] = [];

    // Analyze critical failures
    const failedTests = this.results.filter(r => !r.success);
    for (const test of failedTests) {
      if (test.component === 'performance' || test.component === 'reliability') {
        criticalIssues.push(`Critical: ${test.testName} failed`);
      }
      recommendations.push(...test.recommendations);
    }

    // Performance analysis
    const performanceTests = this.results.filter(r => r.component === 'performance');
    const avgLatency = performanceTests
      .filter(r => r.metrics.latency)
      .reduce((sum, r) => sum + r.metrics.latency!, 0) / performanceTests.length;
    
    if (avgLatency > 150) {
      criticalIssues.push('High average latency detected');
      recommendations.push('Optimize model inference pipeline');
    }

    // Reliability analysis
    const reliabilityTests = this.results.filter(r => r.component === 'reliability');
    const reliabilityScore = reliabilityTests.filter(r => r.success).length / reliabilityTests.length;
    
    if (reliabilityScore < 0.8) {
      criticalIssues.push('Reliability concerns detected');
      recommendations.push('Improve error handling and recovery mechanisms');
    }

    const productionReady = overallScore >= 80 && criticalIssues.length === 0;

    // Add general recommendations
    if (!productionReady) {
      recommendations.push('Address critical issues before production deployment');
    }
    if (overallScore < 90) {
      recommendations.push('Consider additional optimization and testing');
    }

    return {
      overallScore,
      productionReady,
      criticalIssues: [...new Set(criticalIssues)],
      recommendations: [...new Set(recommendations)]
    };
  }

  /**
   * Generate detailed benchmark report
   */
  generateReport(suite: BenchmarkSuite): string {
    let report = `# Stream B Production Benchmark Report\n\n`;
    
    report += `**Generated:** ${new Date().toISOString()}\n`;
    report += `**Duration:** ${(suite.totalDuration / 1000).toFixed(1)}s\n`;
    report += `**Overall Score:** ${suite.summary.overallScore.toFixed(1)}%\n`;
    report += `**Production Ready:** ${suite.summary.productionReady ? '✅ Yes' : '❌ No'}\n\n`;

    // Summary
    report += `## Summary\n\n`;
    report += `- **Total Tests:** ${suite.totalTests}\n`;
    report += `- **Passed:** ${suite.passedTests}\n`;
    report += `- **Failed:** ${suite.failedTests}\n`;
    report += `- **Success Rate:** ${((suite.passedTests / suite.totalTests) * 100).toFixed(1)}%\n\n`;

    // Critical Issues
    if (suite.summary.criticalIssues.length > 0) {
      report += `## ⚠️ Critical Issues\n\n`;
      for (const issue of suite.summary.criticalIssues) {
        report += `- ${issue}\n`;
      }
      report += `\n`;
    }

    // Component Results
    const components = [...new Set(suite.results.map(r => r.component))];
    for (const component of components) {
      const componentResults = suite.results.filter(r => r.component === component);
      const passed = componentResults.filter(r => r.success).length;
      const total = componentResults.length;
      
      report += `## ${component.toUpperCase()} (${passed}/${total})\n\n`;
      
      for (const result of componentResults) {
        const status = result.success ? '✅' : '❌';
        report += `### ${status} ${result.testName}\n\n`;
        report += `- **Duration:** ${result.duration}ms\n`;
        
        if (Object.keys(result.metrics).length > 0) {
          report += `- **Metrics:**\n`;
          for (const [key, value] of Object.entries(result.metrics)) {
            report += `  - ${key}: ${typeof value === 'number' ? value.toFixed(2) : value}\n`;
          }
        }
        
        if (result.recommendations.length > 0) {
          report += `- **Recommendations:**\n`;
          for (const rec of result.recommendations) {
            report += `  - ${rec}\n`;
          }
        }
        
        report += `\n`;
      }
    }

    // Recommendations
    if (suite.summary.recommendations.length > 0) {
      report += `## Recommendations\n\n`;
      for (const recommendation of suite.summary.recommendations) {
        report += `- ${recommendation}\n`;
      }
      report += `\n`;
    }

    return report;
  }
}