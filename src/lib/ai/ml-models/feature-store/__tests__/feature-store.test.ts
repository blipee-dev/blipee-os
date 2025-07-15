/**
 * Tests for Feature Store System
 */

import {
  FeatureStore,
  FeatureDefinition,
  FeatureSet,
  FeatureValue,
  featureStore
} from '../feature-store';
import {
  FeatureRegistry,
  FeatureUsage,
  FeatureQualityMetrics,
  featureRegistry
} from '../feature-registry';

describe('Feature Store', () => {
  let store: FeatureStore;
  let registry: FeatureRegistry;

  beforeEach(() => {
    store = new FeatureStore();
    registry = new FeatureRegistry();
  });

  afterEach(() => {
    store.clearAll();
  });

  describe('Feature Registration', () => {
    it('should register a feature definition', async () => {
      const definition: FeatureDefinition = {
        name: 'emissions_total',
        type: 'numeric',
        description: 'Total emissions in tons CO2e',
        owner: 'sustainability-team',
        tags: ['emissions', 'environmental'],
        validation: {
          required: true,
          min: 0,
          max: 1000000
        }
      };

      await store.registerFeature(definition);
      
      // Feature should be registered
      const features = store.exportFeatureDefinitions();
      expect(features).toHaveLength(1);
      expect(features[0].name).toBe('emissions_total');
    });

    it('should register feature with transformation', async () => {
      const definition: FeatureDefinition = {
        name: 'temperature_normalized',
        type: 'numeric',
        description: 'Normalized temperature',
        owner: 'data-team',
        tags: ['weather'],
        transformation: {
          type: 'normalize',
          config: { min: -50, max: 50 }
        }
      };

      await store.registerFeature(definition);
      
      // Test transformation
      const transformed = await store.transformFeature('temperature_normalized', 25);
      expect(transformed).toBeCloseTo(0.75); // (25 - (-50)) / (50 - (-50))
    });

    it('should validate feature definition', async () => {
      const invalidDefinition: any = {
        // Missing required fields
        type: 'numeric'
      };

      await expect(
        store.registerFeature(invalidDefinition)
      ).rejects.toThrow('Feature name and type are required');
    });
  });

  describe('Feature Sets', () => {
    beforeEach(async () => {
      // Register test features
      await store.registerFeature({
        name: 'revenue',
        type: 'numeric',
        description: 'Company revenue',
        owner: 'finance-team',
        tags: ['financial']
      });

      await store.registerFeature({
        name: 'employee_count',
        type: 'numeric',
        description: 'Number of employees',
        owner: 'hr-team',
        tags: ['organizational']
      });

      await store.registerFeature({
        name: 'industry',
        type: 'categorical',
        description: 'Industry sector',
        owner: 'data-team',
        tags: ['organizational']
      });
    });

    it('should register a feature set', async () => {
      const featureSet: FeatureSet = {
        id: 'esg-metrics',
        name: 'ESG Metrics',
        description: 'Core ESG metrics for reporting',
        features: ['revenue', 'employee_count', 'industry'],
        version: '1.0.0',
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: { purpose: 'quarterly-reporting' }
      };

      await store.registerFeatureSet(featureSet);
      
      // Should succeed
      expect(true).toBe(true);
    });

    it('should fail if feature set contains unknown features', async () => {
      const featureSet: FeatureSet = {
        id: 'invalid-set',
        name: 'Invalid Set',
        description: 'Set with unknown features',
        features: ['revenue', 'unknown_feature'],
        version: '1.0.0',
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {}
      };

      await expect(
        store.registerFeatureSet(featureSet)
      ).rejects.toThrow('Feature unknown_feature not found in registry');
    });
  });

  describe('Feature Ingestion', () => {
    beforeEach(async () => {
      await store.registerFeature({
        name: 'energy_consumption',
        type: 'numeric',
        description: 'Energy consumption in kWh',
        owner: 'operations',
        tags: ['energy'],
        validation: {
          required: true,
          min: 0
        }
      });
    });

    it('should ingest feature values', async () => {
      const features: FeatureValue[] = [
        {
          featureName: 'energy_consumption',
          value: 1500.5,
          timestamp: new Date(),
          metadata: { entityId: 'building-1', source: 'meter' }
        },
        {
          featureName: 'energy_consumption',
          value: 1600.2,
          timestamp: new Date(),
          metadata: { entityId: 'building-2', source: 'meter' }
        }
      ];

      await store.ingestFeatures(features);
      
      const retrieved = await store.getFeatures({ names: ['energy_consumption'] });
      expect(retrieved).toHaveLength(2);
      expect(retrieved[0].value).toBe(1500.5);
    });

    it('should validate feature values on ingestion', async () => {
      const invalidFeature: FeatureValue = {
        featureName: 'energy_consumption',
        value: -100, // Invalid: below minimum
        timestamp: new Date()
      };

      await expect(
        store.ingestFeatures([invalidFeature])
      ).rejects.toThrow('value -100 is below minimum 0');
    });

    it('should skip validation when requested', async () => {
      const invalidFeature: FeatureValue = {
        featureName: 'energy_consumption',
        value: -100,
        timestamp: new Date()
      };

      // Should not throw with validation disabled
      await store.ingestFeatures([invalidFeature], false);
      
      const retrieved = await store.getFeatures({ names: ['energy_consumption'] });
      expect(retrieved).toHaveLength(1);
      expect(retrieved[0].value).toBe(-100);
    });
  });

  describe('Feature Retrieval', () => {
    beforeEach(async () => {
      await store.registerFeature({
        name: 'carbon_intensity',
        type: 'numeric',
        description: 'Carbon intensity gCO2/kWh',
        owner: 'sustainability',
        tags: ['carbon']
      });

      // Ingest test data
      const now = new Date();
      const features: FeatureValue[] = [];
      
      for (let i = 0; i < 10; i++) {
        features.push({
          featureName: 'carbon_intensity',
          value: 400 + i * 10,
          timestamp: new Date(now.getTime() - i * 3600000), // 1 hour apart
          metadata: { grid: 'main' }
        });
      }

      await store.ingestFeatures(features);
    });

    it('should retrieve features by name', async () => {
      const features = await store.getFeatures({
        names: ['carbon_intensity']
      });

      expect(features).toHaveLength(10);
      expect(features[0].featureName).toBe('carbon_intensity');
    });

    it('should filter by time range', async () => {
      const now = new Date();
      const features = await store.getFeatures({
        names: ['carbon_intensity'],
        timeRange: {
          start: new Date(now.getTime() - 5 * 3600000), // 5 hours ago
          end: now
        }
      });

      expect(features.length).toBeLessThanOrEqual(6); // May include boundary timestamps
    });

    it('should apply limit', async () => {
      const features = await store.getFeatures({
        names: ['carbon_intensity'],
        limit: 3
      });

      expect(features).toHaveLength(3);
    });
  });

  describe('Feature Transformations', () => {
    it('should normalize numeric features', async () => {
      await store.registerFeature({
        name: 'score',
        type: 'numeric',
        description: 'Performance score',
        owner: 'analytics',
        tags: ['performance'],
        transformation: {
          type: 'normalize',
          config: { min: 0, max: 100 }
        }
      });

      const normalized = await store.transformFeature('score', 75);
      expect(normalized).toBe(0.75);
    });

    it('should standardize numeric features', async () => {
      await store.registerFeature({
        name: 'temperature_std',
        type: 'numeric',
        description: 'Standardized temperature',
        owner: 'analytics',
        tags: ['weather'],
        transformation: {
          type: 'standardize',
          config: { mean: 20, stdDev: 10 }
        }
      });

      const standardized = await store.transformFeature('temperature_std', 30);
      expect(standardized).toBe(1); // (30 - 20) / 10
    });

    it('should encode categorical features', async () => {
      await store.registerFeature({
        name: 'sector',
        type: 'categorical',
        description: 'Business sector',
        owner: 'analytics',
        tags: ['business'],
        transformation: {
          type: 'encode',
          config: {
            type: 'label',
            mapping: {
              'technology': 0,
              'finance': 1,
              'healthcare': 2,
              'retail': 3
            }
          }
        }
      });

      const encoded = await store.transformFeature('sector', 'finance');
      expect(encoded).toBe(1);
    });

    it('should one-hot encode categorical features', async () => {
      await store.registerFeature({
        name: 'region',
        type: 'categorical',
        description: 'Geographic region',
        owner: 'analytics',
        tags: ['geography'],
        transformation: {
          type: 'encode',
          config: {
            type: 'onehot',
            mapping: {
              'north': 0,
              'south': 1,
              'east': 2,
              'west': 3
            }
          }
        }
      });

      const encoded = await store.transformFeature('region', 'east');
      expect(encoded).toEqual([0, 0, 1, 0]);
    });
  });

  describe('Feature Statistics', () => {
    it('should calculate numeric feature statistics', async () => {
      await store.registerFeature({
        name: 'emissions',
        type: 'numeric',
        description: 'Emissions data',
        owner: 'sustainability',
        tags: ['environmental']
      });

      const values = [100, 200, 150, 300, 250];
      const features = values.map(v => ({
        featureName: 'emissions',
        value: v,
        timestamp: new Date()
      }));

      await store.ingestFeatures(features);

      const stats = store.getFeatureStatistics('emissions');
      expect(stats.count).toBe(5);
      expect(stats.mean).toBe(200);
      expect(stats.min).toBe(100);
      expect(stats.max).toBe(300);
      expect(stats.stdDev).toBeCloseTo(70.71, 2);
    });

    it('should calculate categorical feature statistics', async () => {
      await store.registerFeature({
        name: 'category',
        type: 'categorical',
        description: 'Category data',
        owner: 'analytics',
        tags: ['classification']
      });

      const values = ['A', 'B', 'A', 'C', 'B', 'A'];
      const features = values.map(v => ({
        featureName: 'category',
        value: v,
        timestamp: new Date()
      }));

      await store.ingestFeatures(features);

      const stats = store.getFeatureStatistics('category');
      expect(stats.count).toBe(6);
      expect(stats.uniqueValues).toBe(3);
      expect(stats.distribution).toEqual({
        'A': 3,
        'B': 2,
        'C': 1
      });
    });
  });

  describe('Feature Lineage', () => {
    it('should track feature lineage', async () => {
      await store.registerFeature({
        name: 'derived_metric',
        type: 'numeric',
        description: 'Derived metric',
        owner: 'analytics',
        tags: ['derived']
      });

      await store.updateLineage('derived_metric', {
        type: 'raw',
        name: 'source_data.csv'
      });

      await store.updateLineage('derived_metric', {
        type: 'derived',
        name: 'base_metric'
      }, 'model_v1');

      const lineage = store.getFeatureLineage('derived_metric');
      expect(lineage).not.toBeNull();
      expect(lineage!.sources).toHaveLength(2);
      expect(lineage!.consumers).toContain('model_v1');
    });
  });

  describe('Feature Registry', () => {
    it('should version features', async () => {
      const definition: FeatureDefinition = {
        name: 'revenue_adjusted',
        type: 'numeric',
        description: 'Inflation-adjusted revenue',
        owner: 'finance',
        tags: ['financial', 'adjusted']
      };

      await registry.registerFeatureVersion(
        definition,
        '1.0.0',
        'john.doe',
        'Initial version'
      );

      // Update definition
      definition.validation = { required: true, min: 0 };
      
      await registry.registerFeatureVersion(
        definition,
        '1.1.0',
        'jane.smith',
        'Added validation rules'
      );

      const versions = registry.getAllVersions('revenue_adjusted');
      expect(versions).toHaveLength(2);
      expect(versions[0].version).toBe('1.1.0'); // Latest first
    });

    it('should track feature usage', () => {
      const usage: FeatureUsage = {
        featureName: 'revenue_adjusted',
        modelId: 'esg-predictor',
        modelVersion: '2.0',
        lastUsed: new Date(),
        importance: 0.85,
        performance: {
          accuracy: 0.92,
          latency: 45
        }
      };

      registry.trackFeatureUsage(usage);

      const usages = registry.getFeatureUsage('revenue_adjusted');
      expect(usages).toHaveLength(1);
      expect(usages[0].importance).toBe(0.85);
    });

    it('should record quality metrics', () => {
      const metrics: FeatureQualityMetrics = {
        featureName: 'revenue_adjusted',
        completeness: 0.98,
        uniqueness: 0.85,
        validity: 0.99,
        freshness: 2,
        consistency: 0.97,
        timestamp: new Date()
      };

      registry.recordQualityMetrics(metrics);

      const latest = registry.getQualityMetrics('revenue_adjusted');
      expect(latest).not.toBeNull();
      expect(latest!.completeness).toBe(0.98);
    });

    it('should search features by criteria', async () => {
      // Register multiple features
      await registry.registerFeatureVersion({
        name: 'emissions_scope1',
        type: 'numeric',
        description: 'Scope 1 emissions',
        owner: 'sustainability',
        tags: ['emissions', 'scope1']
      }, '1.0.0', 'admin', 'Initial');

      await registry.registerFeatureVersion({
        name: 'emissions_scope2',
        type: 'numeric',
        description: 'Scope 2 emissions',
        owner: 'sustainability',
        tags: ['emissions', 'scope2']
      }, '1.0.0', 'admin', 'Initial');

      await registry.registerFeatureVersion({
        name: 'water_usage',
        type: 'numeric',
        description: 'Water consumption',
        owner: 'operations',
        tags: ['environmental', 'water']
      }, '1.0.0', 'admin', 'Initial');

      // Search by tags
      const emissionsFeatures = registry.searchFeatures({
        tags: ['emissions']
      });
      expect(emissionsFeatures).toHaveLength(2);

      // Search by owner
      const sustainabilityFeatures = registry.searchFeatures({
        owner: 'sustainability'
      });
      expect(sustainabilityFeatures).toHaveLength(2);
    });

    it('should generate compatibility reports', async () => {
      // Register features and feature set
      await registry.registerFeatureVersion({
        name: 'metric_a',
        type: 'numeric',
        description: 'Metric A',
        owner: 'team',
        tags: []
      }, '1.0.0', 'admin', 'Initial');

      await registry.registerFeatureVersion({
        name: 'metric_b',
        type: 'numeric',
        description: 'Metric B',
        owner: 'team',
        tags: []
      }, '2.0.0', 'admin', 'Major update');

      await registry.registerFeatureSetVersion({
        id: 'test-set',
        name: 'Test Set',
        description: 'Test feature set',
        features: ['metric_a', 'metric_b'],
        version: '1.0.0',
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {}
      }, 'admin', 'Initial', ['metric_a:1.0.0', 'metric_b:2.0.0']);

      const report = registry.generateCompatibilityReport('test-set', '1.0.0');
      expect(report.compatible).toBe(true);
      expect(report.issues).toHaveLength(0);
    });
  });

  describe('Feature Store with Feature Sets', () => {
    beforeEach(async () => {
      // Register features
      await store.registerFeature({
        name: 'temperature',
        type: 'numeric',
        description: 'Temperature in Celsius',
        owner: 'weather-team',
        tags: ['environmental']
      });

      await store.registerFeature({
        name: 'humidity',
        type: 'numeric',
        description: 'Humidity percentage',
        owner: 'weather-team',
        tags: ['environmental']
      });

      // Register feature set
      await store.registerFeatureSet({
        id: 'weather-features',
        name: 'Weather Features',
        description: 'Weather-related features',
        features: ['temperature', 'humidity'],
        version: '1.0.0',
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {}
      });

      // Ingest data
      await store.ingestFeatures([
        {
          featureName: 'temperature',
          value: 25,
          timestamp: new Date(),
          metadata: { entityId: 'sensor-1' }
        },
        {
          featureName: 'humidity',
          value: 65,
          timestamp: new Date(),
          metadata: { entityId: 'sensor-1' }
        }
      ]);
    });

    it('should retrieve feature set for entity', async () => {
      const processedData = await store.getFeatureSet(
        'weather-features',
        'sensor-1'
      );

      expect(processedData.features).toHaveLength(2);
      
      const temp = processedData.features.find(f => f.name === 'temperature');
      expect(temp?.value).toBe(25);
      
      const humidity = processedData.features.find(f => f.name === 'humidity');
      expect(humidity?.value).toBe(65);
    });

    it('should use materialized features cache', async () => {
      // First call - compute features
      const data1 = await store.getFeatureSet('weather-features', 'sensor-1');
      
      // Second call - should use cache
      const data2 = await store.getFeatureSet('weather-features', 'sensor-1');
      
      expect(data1.features).toEqual(data2.features);
    });
  });
});