/**
 * Phase 8 Test Suite - Advanced Analytics & Network Intelligence
 * Tests analytics engine, ML models, network intelligence, and localization
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AdvancedAnalyticsEngine } from '../analytics/analytics-engine';
import { RealTimePipeline } from '../analytics/real-time-pipeline';
import { MLPredictionSystem } from '../ml/prediction-models';
import { NetworkIntelligence } from '../network/network-intelligence';
import { GlobalBenchmarkingSystem } from '../global/benchmarking-system';
import { LocalizationSystem } from '../global/localization-system';

describe('Phase 8: Advanced Analytics & Network Intelligence', () => {
  describe('Analytics Engine', () => {
    let analyticsEngine: AdvancedAnalyticsEngine;

    beforeEach(() => {
      analyticsEngine = new AdvancedAnalyticsEngine();
    });

    it('should process data points and generate insights', async () => {
      const dataPoint = {
        id: 'dp-1',
        organizationId: 'org-123',
        buildingId: 'building-456',
        timestamp: new Date(),
        type: 'energy' as const,
        value: 150,
        unit: 'kWh',
        source: 'sensor' as const,
        metadata: { sensorId: 'sensor-789' }
      };

      await analyticsEngine.ingestDataPoint(dataPoint);
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const insights = analyticsEngine.getRecentInsights('org-123');
      expect(insights.length).toBeGreaterThan(0);
    });

    it('should detect anomalies in real-time', async () => {
      const normalData = Array.from({ length: 100 }, (_, i) => ({
        id: `dp-${i}`,
        organizationId: 'org-123',
        timestamp: new Date(Date.now() - i * 60000),
        type: 'energy' as const,
        value: 100 + Math.random() * 20,
        unit: 'kWh',
        source: 'sensor' as const,
        metadata: {}
      }));

      // Ingest normal data
      for (const dp of normalData) {
        await analyticsEngine.ingestDataPoint(dp);
      }

      // Inject anomaly
      const anomaly = {
        id: 'anomaly-1',
        organizationId: 'org-123',
        timestamp: new Date(),
        type: 'energy' as const,
        value: 500, // Anomalous spike
        unit: 'kWh',
        source: 'sensor' as const,
        metadata: {}
      };

      await analyticsEngine.ingestDataPoint(anomaly);
      
      const insights = analyticsEngine.getRecentInsights('org-123');
      const anomalyInsight = insights.find(i => i.type === 'anomaly');
      
      expect(anomalyInsight).toBeDefined();
      expect(anomalyInsight?.severity).toBe('critical');
    });

    it('should generate predictive insights', async () => {
      const predictions = await analyticsEngine.generatePredictions('org-123', {
        metric: 'energy',
        horizon: 30 // 30 days
      });

      expect(predictions).toBeDefined();
      expect(predictions.confidence).toBeGreaterThan(0);
      expect(predictions.forecast.length).toBe(30);
    });
  });

  describe('Real-Time Pipeline', () => {
    let pipeline: RealTimePipeline;

    beforeEach(() => {
      pipeline = new RealTimePipeline();
    });

    it('should process streaming data with transformations', async () => {
      const stream = await pipeline.createStream({
        organizationId: 'org-123',
        source: 'sensor',
        processors: ['validator', 'enricher', 'aggregator']
      });

      expect(stream.id).toBeDefined();
      expect(stream.processors.length).toBe(3);
    });

    it('should validate data quality', async () => {
      const dataPoint = {
        id: 'dp-1',
        organizationId: 'org-123',
        timestamp: new Date(),
        type: 'temperature' as const,
        value: -500, // Invalid temperature
        unit: 'C',
        source: 'sensor' as const,
        metadata: {}
      };

      const validation = await pipeline.validateDataPoint(dataPoint);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Temperature out of valid range');
    });

    it('should handle backpressure gracefully', async () => {
      const metrics = pipeline.getMetrics();
      const initialBufferSize = metrics.bufferUtilization;

      // Simulate high load
      const promises = Array.from({ length: 10000 }, (_, i) => 
        pipeline.ingest({
          id: `dp-${i}`,
          organizationId: 'org-123',
          timestamp: new Date(),
          type: 'energy' as const,
          value: Math.random() * 100,
          unit: 'kWh',
          source: 'sensor' as const,
          metadata: {}
        })
      );

      await Promise.all(promises);
      
      const newMetrics = pipeline.getMetrics();
      expect(newMetrics.droppedDataPoints).toBeLessThan(100); // Less than 1% dropped
    });
  });

  describe('ML Prediction Models', () => {
    let mlSystem: MLPredictionSystem;

    beforeEach(() => {
      mlSystem = new MLPredictionSystem();
    });

    it('should train LSTM model for time series prediction', async () => {
      const trainingData = Array.from({ length: 1000 }, (_, i) => ({
        timestamp: new Date(Date.now() - i * 3600000),
        value: 100 + 50 * Math.sin(i / 24) + Math.random() * 10
      }));

      const model = await mlSystem.trainModel({
        type: 'lstm',
        data: trainingData,
        features: ['hour', 'dayOfWeek', 'month'],
        target: 'energy_consumption'
      });

      expect(model.status).toBe('ready');
      expect(model.metrics.accuracy).toBeGreaterThan(0.8);
    });

    it('should achieve 95% accuracy target', async () => {
      const models = await mlSystem.getModels();
      const productionModels = models.filter(m => m.status === 'production');
      
      const avgAccuracy = productionModels.reduce((sum, m) => 
        sum + m.performance.accuracy, 0) / productionModels.length;
      
      expect(avgAccuracy).toBeGreaterThan(0.95);
    });

    it('should auto-retrain models when performance degrades', async () => {
      const model = await mlSystem.getModel('energy-predictor');
      
      // Simulate performance degradation
      await mlSystem.reportPrediction(model.id, {
        predicted: 100,
        actual: 150,
        timestamp: new Date()
      });

      // Check if retraining was triggered
      const updatedModel = await mlSystem.getModel('energy-predictor');
      expect(updatedModel.status).toBe('retraining');
    });
  });

  describe('Network Intelligence', () => {
    let networkIntel: NetworkIntelligence;

    beforeEach(() => {
      networkIntel = new NetworkIntelligence();
    });

    it('should anonymize organization data', async () => {
      const orgProfile = {
        industry: 'manufacturing',
        sizeCategory: 'enterprise',
        buildingTypes: ['factory', 'warehouse'],
        geographicRegion: 'north_america'
      };

      const anonymousId = await networkIntel.joinNetwork('org-123', orgProfile);
      
      expect(anonymousId).toMatch(/^anon_[a-f0-9]{32}$/);
      expect(anonymousId).not.toContain('org-123');
    });

    it('should discover network insights from collective data', async () => {
      // Simulate multiple organizations
      for (let i = 0; i < 10; i++) {
        await networkIntel.joinNetwork(`org-${i}`, {
          industry: 'manufacturing',
          sizeCategory: 'enterprise',
          buildingTypes: ['factory'],
          geographicRegion: 'north_america'
        });
      }

      const insights = await networkIntel.discoverNetworkInsights('org-1');
      
      expect(insights.length).toBeGreaterThan(0);
      expect(insights[0].type).toBeDefined();
      expect(insights[0].networkSize).toBeGreaterThanOrEqual(10);
    });

    it('should benchmark against anonymous peers', async () => {
      const benchmark = await networkIntel.getBenchmark('org-123', {
        metric: 'energy_intensity',
        period: 'monthly'
      });

      expect(benchmark.percentile).toBeDefined();
      expect(benchmark.peerAverage).toBeDefined();
      expect(benchmark.topPerformer).toBeDefined();
      expect(benchmark.anonymizedComparison).toBe(true);
    });

    it('should detect industry-wide patterns', async () => {
      const patterns = networkIntel.getDiscoveredPatterns();
      
      expect(patterns.length).toBeGreaterThan(0);
      
      const energyPattern = patterns.find(p => 
        p.type === 'seasonal' && p.category === 'energy'
      );
      
      expect(energyPattern).toBeDefined();
      expect(energyPattern?.confidence).toBeGreaterThan(0.7);
    });
  });

  describe('Global Benchmarking', () => {
    let benchmarking: GlobalBenchmarkingSystem;

    beforeEach(() => {
      benchmarking = new GlobalBenchmarkingSystem();
    });

    it('should provide benchmarks for 50+ countries', async () => {
      const countries = benchmarking.getSupportedCountries();
      expect(countries.length).toBeGreaterThanOrEqual(50);
    });

    it('should include regulatory compliance per region', async () => {
      const euBenchmark = await benchmarking.getBenchmark('org-123', {
        countries: ['DE', 'FR', 'ES'],
        metrics: ['emissions', 'energy']
      });

      expect(euBenchmark.regulatoryFrameworks).toContain('EU_TAXONOMY');
      expect(euBenchmark.regulatoryFrameworks).toContain('CSRD');
    });

    it('should calculate competitive positioning', async () => {
      const position = await benchmarking.getCompetitivePosition('org-123', {
        industry: 'manufacturing',
        region: 'europe'
      });

      expect(position.rank).toBeDefined();
      expect(position.percentile).toBeBetween(0, 100);
      expect(position.strengthAreas).toBeDefined();
      expect(position.improvementAreas).toBeDefined();
    });
  });

  describe('Localization System', () => {
    let localization: LocalizationSystem;

    beforeEach(() => {
      localization = new LocalizationSystem();
    });

    it('should support 20+ languages', () => {
      const languages = localization.getSupportedLanguages();
      expect(languages.length).toBeGreaterThanOrEqual(20);
      
      // Check major languages
      expect(languages.map(l => l.code)).toContain('en');
      expect(languages.map(l => l.code)).toContain('zh');
      expect(languages.map(l => l.code)).toContain('es');
      expect(languages.map(l => l.code)).toContain('ar');
    });

    it('should translate content using AI', async () => {
      const content = {
        key: 'dashboard.welcome',
        text: 'Welcome to your sustainability dashboard'
      };

      const translated = await localization.translate(content, 'es');
      
      expect(translated.text).toContain('Bienvenido');
      expect(translated.quality).toBeGreaterThan(0.9);
    });

    it('should format currencies correctly', () => {
      const amount = 1234567.89;
      
      const usd = localization.formatCurrency(amount, 'USD', 'en-US');
      expect(usd).toBe('$1,234,567.89');
      
      const eur = localization.formatCurrency(amount, 'EUR', 'de-DE');
      expect(eur).toContain('€');
      expect(eur).toContain('1.234.567');
      
      const jpy = localization.formatCurrency(amount, 'JPY', 'ja-JP');
      expect(jpy).toContain('¥');
    });

    it('should handle RTL languages properly', () => {
      const rtlConfig = localization.getLanguageConfig('ar');
      
      expect(rtlConfig.direction).toBe('rtl');
      expect(rtlConfig.fontFamily).toContain('Arabic');
    });
  });

  describe('Integration Tests', () => {
    it('should integrate analytics with ML predictions', async () => {
      const analytics = new AdvancedAnalyticsEngine();
      const mlSystem = new MLPredictionSystem();

      // Analytics generates data
      const historicalData = await analytics.getHistoricalData('org-123', {
        metric: 'energy',
        period: '90days'
      });

      // ML system uses it for prediction
      const prediction = await mlSystem.predict({
        model: 'energy-lstm',
        input: historicalData,
        horizon: 30
      });

      expect(prediction.values.length).toBe(30);
      expect(prediction.confidence).toBeGreaterThan(0.8);
    });

    it('should combine network intelligence with benchmarking', async () => {
      const networkIntel = new NetworkIntelligence();
      const benchmarking = new GlobalBenchmarkingSystem();

      const networkInsights = await networkIntel.discoverNetworkInsights('org-123');
      const globalBenchmark = await benchmarking.getBenchmark('org-123', {
        countries: ['US'],
        metrics: ['energy']
      });

      // Network insights should influence benchmarking
      expect(globalBenchmark.networkEnhanced).toBe(true);
      expect(globalBenchmark.peerGroupSize).toBeGreaterThan(0);
    });
  });
});

// Test utilities
expect.extend({
  toBeBetween(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be between ${floor} and ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be between ${floor} and ${ceiling}`,
        pass: false,
      };
    }
  },
});