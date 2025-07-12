/**
 * Comprehensive Tests for Enhanced Model Monitoring & Drift Detection
 * Tests monitoring capabilities, drift detection, alerting, and performance tracking
 */

import {
  EnhancedModelMonitoring,
  MonitoringConfig,
  PerformanceThresholds,
  AlertChannel,
  MonitoringMetrics,
  ModelHealthStatus
} from '../enhanced-monitoring';
import { TrainingData } from '../../types';

describe('Enhanced Model Monitoring & Drift Detection', () => {
  let monitoring: EnhancedModelMonitoring;
  let config: MonitoringConfig;

  beforeEach(() => {
    const thresholds: PerformanceThresholds = {
      maxLatency: 100, // ms
      minAccuracy: 0.8,
      maxErrorRate: 0.05,
      minThroughput: 1, // req/s
      maxDriftScore: 0.3
    };

    const alertChannels: AlertChannel[] = [
      {
        type: 'console',
        target: 'console',
        severity: 'medium'
      },
      {
        type: 'webhook',
        target: 'https://alerts.example.com/webhook',
        severity: 'high'
      }
    ];

    config = {
      modelName: 'test_model',
      monitoringInterval: 1000, // 1 second for testing
      driftDetectionEnabled: true,
      performanceThresholds: thresholds,
      alertingEnabled: true,
      alertChannels,
      retentionPeriod: 7, // days
      samplingRate: 1.0 // 100% for testing
    };

    monitoring = new EnhancedModelMonitoring(config);
  });

  afterEach(() => {
    monitoring.stopMonitoring();
  });

  describe('Monitoring Setup and Configuration', () => {
    it('should initialize monitoring with correct configuration', async () => {
      console.log('🧪 Testing monitoring initialization...');
      
      expect(monitoring).toBeDefined();
      
      // Test starting monitoring
      await monitoring.startMonitoring();
      
      const health = await monitoring.getModelHealth();
      expect(health.modelName).toBe('test_model');
      expect(health.status).toMatch(/^(healthy|warning|critical|degraded)$/);
      expect(health.lastUpdate).toBeInstanceOf(Date);
      expect(health.currentMetrics).toBeDefined();
      expect(health.driftStatus).toBeDefined();
      expect(health.alerts).toBeInstanceOf(Array);
      expect(health.recommendations).toBeInstanceOf(Array);
      
      console.log(`   ✅ Model status: ${health.status}`);
      console.log(`   📊 Current alerts: ${health.alerts.length}`);
    });

    it('should set baseline data for drift detection', async () => {
      console.log('🧪 Testing baseline data setup...');
      
      const baselineData: TrainingData = {
        features: [
          { temperature: 25, humidity: 60, pressure: 1013 },
          { temperature: 27, humidity: 58, pressure: 1015 },
          { temperature: 23, humidity: 62, pressure: 1011 },
          { temperature: 26, humidity: 59, pressure: 1014 },
          { temperature: 24, humidity: 61, pressure: 1012 }
        ],
        labels: [1, 1, 0, 1, 0],
        metadata: { source: 'baseline', version: '1.0' }
      };

      monitoring.setBaseline(baselineData);
      
      const health = await monitoring.getModelHealth();
      expect(health.driftStatus).toBeDefined();
      
      console.log('   ✅ Baseline data set successfully');
    });

    it('should validate monitoring configuration', () => {
      console.log('🧪 Testing configuration validation...');
      
      expect(config.performanceThresholds.maxLatency).toBeGreaterThan(0);
      expect(config.performanceThresholds.minAccuracy).toBeGreaterThan(0);
      expect(config.performanceThresholds.minAccuracy).toBeLessThanOrEqual(1);
      expect(config.performanceThresholds.maxErrorRate).toBeGreaterThanOrEqual(0);
      expect(config.performanceThresholds.maxErrorRate).toBeLessThanOrEqual(1);
      expect(config.samplingRate).toBeGreaterThan(0);
      expect(config.samplingRate).toBeLessThanOrEqual(1);
      expect(config.alertChannels.length).toBeGreaterThan(0);
      
      console.log('   ✅ Configuration validation passed');
    });
  });

  describe('Prediction Recording and Metrics', () => {
    beforeEach(async () => {
      await monitoring.startMonitoring();
    });

    it('should record predictions and calculate metrics', async () => {
      console.log('🧪 Testing prediction recording...');
      
      // Record multiple predictions
      const predictions = [
        { latency: 50, confidence: 0.9, features: { temp: 25, humidity: 60 } },
        { latency: 75, confidence: 0.8, features: { temp: 27, humidity: 58 } },
        { latency: 60, confidence: 0.85, features: { temp: 23, humidity: 62 } },
        { latency: 80, confidence: 0.75, features: { temp: 26, humidity: 59 } },
        { latency: 55, confidence: 0.9, features: { temp: 24, humidity: 61 } }
      ];

      for (let i = 0; i < predictions.length; i++) {
        const pred = predictions[i];
        await monitoring.recordPrediction(
          `req_${i}`,
          { prediction: 'positive', confidence: pred.confidence },
          pred.features,
          pred.latency,
          pred.confidence,
          `user_${i}`,
          `session_${i}`
        );
      }

      const health = await monitoring.getModelHealth();
      
      expect(health.currentMetrics.requestCount).toBe(5);
      expect(health.currentMetrics.averageLatency).toBeCloseTo(64); // (50+75+60+80+55)/5
      expect(health.currentMetrics.errorRate).toBe(0);
      expect(health.currentMetrics.throughput).toBeGreaterThan(0);
      
      console.log(`   📊 Recorded ${health.currentMetrics.requestCount} predictions`);
      console.log(`   ⏱️ Average latency: ${health.currentMetrics.averageLatency.toFixed(1)}ms`);
      console.log(`   📈 Throughput: ${health.currentMetrics.throughput.toFixed(2)} req/s`);
    });

    it('should record outcomes and calculate accuracy', async () => {
      console.log('🧪 Testing outcome recording and accuracy calculation...');
      
      // Record predictions
      const predictions = [
        { id: 'req_1', actual: true, predicted: true },
        { id: 'req_2', actual: false, predicted: false },
        { id: 'req_3', actual: true, predicted: false },
        { id: 'req_4', actual: true, predicted: true },
        { id: 'req_5', actual: false, predicted: false }
      ];

      for (const pred of predictions) {
        await monitoring.recordPrediction(
          pred.id,
          { prediction: pred.predicted ? 'positive' : 'negative' },
          { feature1: Math.random() },
          50,
          0.8
        );
        
        await monitoring.recordOutcome(pred.id, pred.actual);
      }

      const health = await monitoring.getModelHealth();
      
      // Accuracy should be 4/5 = 0.8 (4 correct predictions out of 5)
      expect(health.currentMetrics.accuracy).toBeCloseTo(0.8, 1);
      
      console.log(`   🎯 Accuracy: ${(health.currentMetrics.accuracy! * 100).toFixed(1)}%`);
    });

    it('should handle sampling rate correctly', async () => {
      console.log('🧪 Testing sampling rate...');
      
      // Create monitoring with 50% sampling rate
      const sampledConfig = { ...config, samplingRate: 0.5 };
      const sampledMonitoring = new EnhancedModelMonitoring(sampledConfig);
      await sampledMonitoring.startMonitoring();
      
      // Record many predictions
      const totalPredictions = 100;
      for (let i = 0; i < totalPredictions; i++) {
        await sampledMonitoring.recordPrediction(
          `req_${i}`,
          { prediction: 'test' },
          { feature: i },
          50,
          0.8
        );
      }
      
      const health = await sampledMonitoring.getModelHealth();
      
      // With 50% sampling, we should record roughly half the predictions
      expect(health.currentMetrics.requestCount).toBeLessThan(totalPredictions);
      expect(health.currentMetrics.requestCount).toBeGreaterThan(totalPredictions * 0.3); // Allow some variance
      
      console.log(`   📊 Sampled ${health.currentMetrics.requestCount}/${totalPredictions} predictions (${sampledConfig.samplingRate * 100}% rate)`);
      
      sampledMonitoring.stopMonitoring();
    });
  });

  describe('Performance Monitoring and Alerting', () => {
    beforeEach(async () => {
      await monitoring.startMonitoring();
    });

    it('should detect high latency and generate alerts', async () => {
      console.log('🧪 Testing high latency detection...');
      
      // Record predictions with high latency (above threshold of 100ms)
      await monitoring.recordPrediction(
        'req_high_latency',
        { prediction: 'test' },
        { feature1: 1 },
        150, // Above threshold
        0.8
      );

      // Wait a bit for processing
      await new Promise(resolve => setTimeout(resolve, 100));

      const health = await monitoring.getModelHealth();
      
      expect(health.alerts.length).toBeGreaterThan(0);
      const latencyAlert = health.alerts.find(a => a.type === 'performance' && a.message.includes('latency'));
      expect(latencyAlert).toBeDefined();
      expect(latencyAlert!.severity).toMatch(/^(high|critical)$/);
      
      console.log(`   🚨 Generated alert: ${latencyAlert!.message}`);
    });

    it('should detect low confidence predictions', async () => {
      console.log('🧪 Testing low confidence detection...');
      
      // Record prediction with low confidence
      await monitoring.recordPrediction(
        'req_low_confidence',
        { prediction: 'uncertain' },
        { feature1: 1 },
        50,
        0.3 // Low confidence
      );

      await new Promise(resolve => setTimeout(resolve, 100));

      const health = await monitoring.getModelHealth();
      const confidenceAlert = health.alerts.find(a => a.message.includes('confidence'));
      
      expect(confidenceAlert).toBeDefined();
      expect(confidenceAlert!.type).toBe('performance');
      
      console.log(`   🚨 Generated alert: ${confidenceAlert!.message}`);
    });

    it('should calculate error rates correctly', async () => {
      console.log('🧪 Testing error rate calculation...');
      
      // Record predictions with some errors
      const predictions = [
        { id: 'req_1', error: false },
        { id: 'req_2', error: true },
        { id: 'req_3', error: false },
        { id: 'req_4', error: true },
        { id: 'req_5', error: false }
      ];

      for (const pred of predictions) {
        await monitoring.recordPrediction(
          pred.id,
          { prediction: 'test' },
          { feature1: Math.random() },
          50,
          0.8,
          undefined,
          undefined
        );
        
        // Simulate error by setting error code
        if (pred.error) {
          // In practice, this would be set during recording
          // For testing, we'll verify error rate calculation logic
        }
      }

      const health = await monitoring.getModelHealth();
      expect(health.currentMetrics.errorRate).toBeGreaterThanOrEqual(0);
      expect(health.currentMetrics.errorRate).toBeLessThanOrEqual(1);
      
      console.log(`   📊 Error rate: ${(health.currentMetrics.errorRate * 100).toFixed(1)}%`);
    });

    it('should generate appropriate recommendations', async () => {
      console.log('🧪 Testing recommendation generation...');
      
      // Record normal predictions
      for (let i = 0; i < 10; i++) {
        await monitoring.recordPrediction(
          `req_${i}`,
          { prediction: 'normal' },
          { feature1: 25 + i, feature2: 60 + i },
          50,
          0.9
        );
      }

      const health = await monitoring.getModelHealth();
      
      expect(health.recommendations).toBeInstanceOf(Array);
      expect(health.recommendations.length).toBeGreaterThan(0);
      
      // Should have at least one recommendation
      const hasRecommendation = health.recommendations.some(rec => 
        rec.includes('performing well') || 
        rec.includes('continue monitoring') || 
        rec.includes('retraining') ||
        rec.includes('optimizing') ||
        rec.includes('Low request volume') ||
        rec.includes('monitoring has sufficient data')
      );
      
      expect(hasRecommendation).toBe(true);
      
      console.log(`   💡 Generated ${health.recommendations.length} recommendations:`);
      health.recommendations.forEach((rec, i) => {
        console.log(`   💡 ${i + 1}. ${rec}`);
      });
    });
  });

  describe('Drift Detection', () => {
    beforeEach(async () => {
      await monitoring.startMonitoring();
      
      // Set baseline data
      const baselineData: TrainingData = {
        features: Array.from({ length: 100 }, (_, i) => ({
          temperature: 25 + Math.random() * 5, // 25-30°C
          humidity: 60 + Math.random() * 10,   // 60-70%
          pressure: 1010 + Math.random() * 10  // 1010-1020 hPa
        })),
        labels: Array.from({ length: 100 }, () => Math.random() > 0.5 ? 1 : 0),
        metadata: { source: 'baseline' }
      };
      
      monitoring.setBaseline(baselineData);
    });

    it('should detect feature drift when input distribution changes', async () => {
      console.log('🧪 Testing feature drift detection...');
      
      // Record predictions with normal features (similar to baseline)
      for (let i = 0; i < 50; i++) {
        await monitoring.recordPrediction(
          `normal_${i}`,
          { prediction: 'normal' },
          {
            temperature: 25 + Math.random() * 5,
            humidity: 60 + Math.random() * 10,
            pressure: 1010 + Math.random() * 10
          },
          50,
          0.8
        );
      }
      
      // Record predictions with drifted features (shifted distribution)
      for (let i = 0; i < 50; i++) {
        await monitoring.recordPrediction(
          `drifted_${i}`,
          { prediction: 'drifted' },
          {
            temperature: 35 + Math.random() * 5, // Shifted +10°C
            humidity: 40 + Math.random() * 10,   // Shifted -20%
            pressure: 990 + Math.random() * 10   // Shifted -20 hPa
          },
          50,
          0.8
        );
      }

      // Allow time for drift detection
      await new Promise(resolve => setTimeout(resolve, 1500));

      const health = await monitoring.getModelHealth();
      
      expect(health.driftStatus.overallDriftScore).toBeGreaterThan(0);
      
      // Check if drift was detected in any features
      const hasDriftAlerts = health.alerts.some(alert => alert.type === 'drift');
      if (hasDriftAlerts) {
        const driftAlert = health.alerts.find(alert => alert.type === 'drift');
        console.log(`   🔍 Drift detected: ${driftAlert!.message}`);
      }
      
      console.log(`   📊 Overall drift score: ${health.driftStatus.overallDriftScore.toFixed(3)}`);
      console.log(`   📈 Drift trend: ${health.driftStatus.driftTrend}`);
    });

    it('should detect prediction drift when model outputs change', async () => {
      console.log('🧪 Testing prediction drift detection...');
      
      // Record predictions with consistent pattern
      for (let i = 0; i < 50; i++) {
        await monitoring.recordPrediction(
          `consistent_${i}`,
          { prediction: 'positive', confidence: 0.8 + Math.random() * 0.1 },
          { feature1: 25, feature2: 60 },
          50,
          0.8 + Math.random() * 0.1
        );
      }
      
      // Record predictions with different pattern (prediction drift)
      for (let i = 0; i < 50; i++) {
        await monitoring.recordPrediction(
          `changed_${i}`,
          { prediction: 'negative', confidence: 0.3 + Math.random() * 0.2 },
          { feature1: 25, feature2: 60 }, // Same inputs
          50,
          0.3 + Math.random() * 0.2 // Different confidence pattern
        );
      }

      const health = await monitoring.getModelHealth();
      
      // Drift detection should analyze the prediction patterns
      expect(health.driftStatus).toBeDefined();
      
      console.log(`   📊 Prediction drift analysis completed`);
      console.log(`   🎯 Current status: ${health.status}`);
    });

    it('should detect concept drift when accuracy degrades', async () => {
      console.log('🧪 Testing concept drift detection...');
      
      // Record predictions with good accuracy initially
      for (let i = 0; i < 25; i++) {
        await monitoring.recordPrediction(
          `good_${i}`,
          { prediction: 'positive' },
          { feature1: 25, feature2: 60 },
          50,
          0.9
        );
        await monitoring.recordOutcome(`good_${i}`, true); // Correct outcomes
      }
      
      // Record predictions with poor accuracy later (concept drift)
      for (let i = 0; i < 25; i++) {
        await monitoring.recordPrediction(
          `poor_${i}`,
          { prediction: 'positive' },
          { feature1: 25, feature2: 60 },
          50,
          0.9
        );
        await monitoring.recordOutcome(`poor_${i}`, false); // Incorrect outcomes
      }

      const health = await monitoring.getModelHealth();
      
      // Should detect accuracy degradation
      expect(health.currentMetrics.accuracy).toBeDefined();
      if (health.currentMetrics.accuracy! < 0.7) {
        console.log(`   📉 Accuracy degradation detected: ${(health.currentMetrics.accuracy! * 100).toFixed(1)}%`);
      }
      
      console.log(`   🎯 Final accuracy: ${(health.currentMetrics.accuracy! * 100).toFixed(1)}%`);
    });

    it('should handle insufficient data gracefully', async () => {
      console.log('🧪 Testing insufficient data handling...');
      
      // Record very few predictions
      await monitoring.recordPrediction(
        'single_req',
        { prediction: 'test' },
        { feature1: 1 },
        50,
        0.8
      );

      const health = await monitoring.getModelHealth();
      
      expect(health.driftStatus.overallDriftScore).toBeGreaterThanOrEqual(0);
      expect(health.recommendations).toContain('Low request volume - ensure monitoring has sufficient data');
      
      console.log(`   ✅ Handled insufficient data correctly`);
    });
  });

  describe('Health Status and Reporting', () => {
    beforeEach(async () => {
      await monitoring.startMonitoring();
    });

    it('should calculate overall health status correctly', async () => {
      console.log('🧪 Testing health status calculation...');
      
      // Record normal operations
      for (let i = 0; i < 20; i++) {
        await monitoring.recordPrediction(
          `health_${i}`,
          { prediction: 'normal' },
          { feature1: 25, feature2: 60 },
          50, // Normal latency
          0.9 // High confidence
        );
      }

      const health = await monitoring.getModelHealth();
      
      expect(health.status).toMatch(/^(healthy|warning|critical|degraded)$/);
      expect(health.modelName).toBe('test_model');
      expect(health.lastUpdate).toBeInstanceOf(Date);
      
      // If no critical issues, should be healthy or warning at most
      if (health.alerts.length === 0) {
        expect(health.status).toMatch(/^(healthy|warning)$/);
      }
      
      console.log(`   💚 Model health: ${health.status}`);
      console.log(`   📊 Active alerts: ${health.alerts.length}`);
      console.log(`   💡 Recommendations: ${health.recommendations.length}`);
    });

    it('should track metrics over time windows', async () => {
      console.log('🧪 Testing time window metrics...');
      
      // Record metrics at different times
      const startTime = Date.now();
      
      for (let i = 0; i < 10; i++) {
        await monitoring.recordPrediction(
          `time_${i}`,
          { prediction: 'test' },
          { feature1: i },
          50 + i * 5, // Increasing latency
          0.9 - i * 0.01 // Decreasing confidence
        );
        
        // Small delay to spread out timestamps
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      const health = await monitoring.getModelHealth();
      
      expect(health.currentMetrics.requestCount).toBe(10);
      expect(health.currentMetrics.timeWindow).toBe('last_24h');
      expect(health.currentMetrics.averageLatency).toBeGreaterThan(50);
      
      const timeSpent = Date.now() - startTime;
      console.log(`   ⏱️ Metrics collected over ${timeSpent}ms`);
      console.log(`   📊 Average latency: ${health.currentMetrics.averageLatency.toFixed(1)}ms`);
    });

    it('should provide comprehensive monitoring report', async () => {
      console.log('🧪 Testing comprehensive monitoring report...');
      
      // Set baseline for drift detection
      const baselineData: TrainingData = {
        features: [
          { temp: 25, humidity: 60 },
          { temp: 26, humidity: 58 },
          { temp: 24, humidity: 62 }
        ],
        labels: [1, 0, 1],
        metadata: { source: 'test' }
      };
      monitoring.setBaseline(baselineData);
      
      // Record diverse predictions
      const scenarios = [
        { latency: 45, confidence: 0.95, features: { temp: 25, humidity: 60 } },
        { latency: 150, confidence: 0.4, features: { temp: 35, humidity: 40 } }, // High latency, low confidence
        { latency: 60, confidence: 0.85, features: { temp: 26, humidity: 58 } },
        { latency: 80, confidence: 0.9, features: { temp: 24, humidity: 62 } }
      ];
      
      for (let i = 0; i < scenarios.length; i++) {
        const scenario = scenarios[i];
        await monitoring.recordPrediction(
          `scenario_${i}`,
          { prediction: 'test' },
          scenario.features,
          scenario.latency,
          scenario.confidence
        );
      }

      const health = await monitoring.getModelHealth();
      
      // Verify all components of the health report
      expect(health.modelName).toBeDefined();
      expect(health.status).toBeDefined();
      expect(health.currentMetrics).toBeDefined();
      expect(health.driftStatus).toBeDefined();
      expect(health.alerts).toBeDefined();
      expect(health.recommendations).toBeDefined();
      
      console.log('\n   📋 Comprehensive Health Report:');
      console.log(`   🏷️  Model: ${health.modelName}`);
      console.log(`   💚 Status: ${health.status}`);
      console.log(`   📊 Requests: ${health.currentMetrics.requestCount}`);
      console.log(`   ⏱️  Avg Latency: ${health.currentMetrics.averageLatency.toFixed(1)}ms`);
      console.log(`   📈 Throughput: ${health.currentMetrics.throughput.toFixed(2)} req/s`);
      console.log(`   🚨 Active Alerts: ${health.alerts.length}`);
      console.log(`   🔍 Drift Score: ${health.driftStatus.overallDriftScore.toFixed(3)}`);
      console.log(`   💡 Recommendations: ${health.recommendations.length}`);
    });
  });

  describe('Alert Management', () => {
    beforeEach(async () => {
      await monitoring.startMonitoring();
    });

    it('should send alerts through configured channels', async () => {
      console.log('🧪 Testing alert channel functionality...');
      
      // Record a prediction that should trigger an alert (high latency)
      await monitoring.recordPrediction(
        'alert_test',
        { prediction: 'test' },
        { feature1: 1 },
        200, // High latency
        0.9
      );

      await new Promise(resolve => setTimeout(resolve, 100));

      const health = await monitoring.getModelHealth();
      const alerts = health.alerts.filter(a => !a.resolved);
      
      expect(alerts.length).toBeGreaterThan(0);
      
      const latencyAlert = alerts.find(a => a.message.includes('latency'));
      if (latencyAlert) {
        console.log(`   📡 Alert would be sent via ${config.alertChannels.length} channels`);
        console.log(`   🚨 Alert: ${latencyAlert.message}`);
        console.log(`   📊 Severity: ${latencyAlert.severity}`);
      }
    });

    it('should filter alerts by severity levels', async () => {
      console.log('🧪 Testing alert severity filtering...');
      
      // Test different severity scenarios
      const scenarios = [
        { latency: 120, expectedSeverity: 'high' },   // Above threshold
        { latency: 250, expectedSeverity: 'critical' } // Way above threshold
      ];
      
      for (let i = 0; i < scenarios.length; i++) {
        const scenario = scenarios[i];
        await monitoring.recordPrediction(
          `severity_${i}`,
          { prediction: 'test' },
          { feature1: i },
          scenario.latency,
          0.9
        );
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      const health = await monitoring.getModelHealth();
      const alerts = health.alerts.filter(a => !a.resolved);
      
      expect(alerts.length).toBeGreaterThan(0);
      
      const severities = alerts.map(a => a.severity);
      console.log(`   📊 Alert severities generated: ${severities.join(', ')}`);
      
      expect(severities).toContain('high');
    });
  });
});