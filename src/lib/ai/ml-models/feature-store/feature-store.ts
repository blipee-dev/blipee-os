/**
 * Stream B Day 35-36: Feature Store
 * Centralized feature management system for ML pipelines
 */

import { Feature, FeatureQuery, ProcessedData } from '../types';

export interface FeatureDefinition {
  name: string;
  type: 'numeric' | 'categorical' | 'binary' | 'text' | 'embedding' | 'time-series';
  description: string;
  owner: string;
  tags: string[];
  schema?: any;
  transformation?: FeatureTransformation;
  validation?: FeatureValidation;
  ttl?: number; // Time to live in seconds
}

export interface FeatureTransformation {
  type: 'normalize' | 'standardize' | 'encode' | 'aggregate' | 'custom';
  config: any;
  code?: string; // Custom transformation code
}

export interface FeatureValidation {
  required: boolean;
  min?: number;
  max?: number;
  enum?: any[];
  pattern?: string;
  customValidator?: string; // Custom validation code
}

export interface FeatureSet {
  id: string;
  name: string;
  description: string;
  features: string[]; // Feature names
  version: string;
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, any>;
}

export interface FeatureValue {
  featureName: string;
  value: any;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface MaterializedFeatures {
  entity: string;
  features: FeatureValue[];
  computedAt: Date;
  ttl: number;
}

export interface FeatureLineage {
  featureName: string;
  sources: Array<{
    type: 'raw' | 'derived' | 'external';
    name: string;
    timestamp: Date;
  }>;
  transformations: string[];
  consumers: string[];
}

export class FeatureStore {
  private features: Map<string, FeatureDefinition> = new Map();
  private featureSets: Map<string, FeatureSet> = new Map();
  private materializedFeatures: Map<string, MaterializedFeatures> = new Map();
  private featureData: Map<string, FeatureValue[]> = new Map();
  private lineage: Map<string, FeatureLineage> = new Map();
  private transformers: Map<string, FeatureTransformer> = new Map();

  constructor() {
    this.initializeDefaultTransformers();
  }

  private initializeDefaultTransformers(): void {
    // Normalization transformer
    this.transformers.set('normalize', new NormalizeTransformer());
    
    // Standardization transformer
    this.transformers.set('standardize', new StandardizeTransformer());
    
    // Encoding transformer
    this.transformers.set('encode', new EncodingTransformer());
    
    // Aggregation transformer
    this.transformers.set('aggregate', new AggregationTransformer());
  }

  async registerFeature(definition: FeatureDefinition): Promise<void> {
    // Validate feature definition
    this.validateFeatureDefinition(definition);

    // Store feature definition
    this.features.set(definition.name, definition);

    // Initialize lineage
    this.lineage.set(definition.name, {
      featureName: definition.name,
      sources: [],
      transformations: definition.transformation ? [definition.transformation.type] : [],
      consumers: []
    });
  }

  async registerFeatureSet(featureSet: FeatureSet): Promise<void> {
    // Validate all features exist
    for (const featureName of featureSet.features) {
      if (!this.features.has(featureName)) {
        throw new Error(`Feature ${featureName} not found in registry`);
      }
    }

    this.featureSets.set(featureSet.id, featureSet);
  }

  async ingestFeatures(
    features: FeatureValue[],
    validate = true
  ): Promise<void> {
    if (validate) {
      for (const feature of features) {
        await this.validateFeatureValue(feature);
      }
    }

    // Group by feature name
    for (const feature of features) {
      if (!this.featureData.has(feature.featureName)) {
        this.featureData.set(feature.featureName, []);
      }
      
      this.featureData.get(feature.featureName)!.push(feature);

      // Apply TTL cleanup if needed
      const definition = this.features.get(feature.featureName);
      if (definition?.ttl) {
        this.cleanupOldFeatures(feature.featureName, definition.ttl);
      }
    }
  }

  async getFeatures(query: FeatureQuery): Promise<FeatureValue[]> {
    const results: FeatureValue[] = [];

    // Get requested features
    const featureNames = query.names || Array.from(this.features.keys());

    for (const name of featureNames) {
      const values = this.featureData.get(name) || [];
      
      // Apply time range filter
      let filtered = values;
      if (query.timeRange) {
        filtered = values.filter(v => 
          v.timestamp >= query.timeRange!.start &&
          v.timestamp <= query.timeRange!.end
        );
      }

      // Apply limit
      if (query.limit) {
        filtered = filtered.slice(-query.limit);
      }

      results.push(...filtered);
    }

    return results;
  }

  async getFeatureSet(
    featureSetId: string,
    entityId: string,
    pointInTime?: Date
  ): Promise<ProcessedData> {
    const featureSet = this.featureSets.get(featureSetId);
    if (!featureSet) {
      throw new Error(`Feature set ${featureSetId} not found`);
    }

    // Check materialized features cache
    const cacheKey = `${featureSetId}:${entityId}`;
    const cached = this.materializedFeatures.get(cacheKey);
    
    if (cached && this.isCacheValid(cached)) {
      return this.convertToProcessedData(cached.features);
    }

    // Compute features
    const features: Feature[] = [];
    const timestamp = pointInTime || new Date();

    for (const featureName of featureSet.features) {
      const definition = this.features.get(featureName)!;
      const value = await this.computeFeature(
        featureName,
        entityId,
        timestamp
      );

      features.push({
        name: featureName,
        value,
        type: definition.type as any
      });
    }

    // Cache materialized features
    const materialized: MaterializedFeatures = {
      entity: entityId,
      features: features.map(f => ({
        featureName: f.name,
        value: f.value,
        timestamp
      })),
      computedAt: new Date(),
      ttl: 300 // 5 minutes default
    };

    this.materializedFeatures.set(cacheKey, materialized);

    return {
      features,
      timestamp,
      metadata: {
        featureSetId,
        entityId,
        version: featureSet.version
      }
    };
  }

  async transformFeature(
    featureName: string,
    value: any
  ): Promise<any> {
    const definition = this.features.get(featureName);
    if (!definition || !definition.transformation) {
      return value;
    }

    const transformer = this.transformers.get(definition.transformation.type);
    if (!transformer) {
      throw new Error(`Transformer ${definition.transformation.type} not found`);
    }

    return transformer.transform(value, definition.transformation.config);
  }

  async validateFeatureValue(feature: FeatureValue): Promise<void> {
    const definition = this.features.get(feature.featureName);
    if (!definition) {
      throw new Error(`Feature ${feature.featureName} not registered`);
    }

    if (!definition.validation) {
      return;
    }

    const validation = definition.validation;

    // Required check
    if (validation.required && (feature.value === null || feature.value === undefined)) {
      throw new Error(`Feature ${feature.featureName} is required`);
    }

    // Type-specific validation
    switch (definition.type) {
      case 'numeric':
        if (validation.min !== undefined && feature.value < validation.min) {
          throw new Error(`Feature ${feature.featureName} value ${feature.value} is below minimum ${validation.min}`);
        }
        if (validation.max !== undefined && feature.value > validation.max) {
          throw new Error(`Feature ${feature.featureName} value ${feature.value} exceeds maximum ${validation.max}`);
        }
        break;

      case 'categorical':
        if (validation.enum && !validation.enum.includes(feature.value)) {
          throw new Error(`Feature ${feature.featureName} value ${feature.value} not in allowed values`);
        }
        break;

      case 'text':
        if (validation.pattern && !new RegExp(validation.pattern).test(feature.value)) {
          throw new Error(`Feature ${feature.featureName} value does not match pattern`);
        }
        break;
    }

    // Custom validation
    if (validation.customValidator) {
      // In production, this would run sandboxed custom code
      console.log(`Running custom validator for ${feature.featureName}`);
    }
  }

  async computeFeature(
    featureName: string,
    entityId: string,
    timestamp: Date
  ): Promise<any> {
    const definition = this.features.get(featureName);
    if (!definition) {
      throw new Error(`Feature ${featureName} not found`);
    }

    // Get latest value for entity
    const values = this.featureData.get(featureName) || [];
    const entityValues = values.filter(v => 
      v.metadata?.entityId === entityId &&
      v.timestamp <= timestamp
    );

    if (entityValues.length === 0) {
      // Return default value based on type
      switch (definition.type) {
        case 'numeric': return 0;
        case 'categorical': return null;
        case 'binary': return false;
        case 'text': return '';
        case 'embedding': return [];
        case 'time-series': return [];
        default: return null;
      }
    }

    // Get latest value
    const latest = entityValues.sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    )[0];

    // Apply transformation if needed
    return this.transformFeature(featureName, latest.value);
  }

  getFeatureLineage(featureName: string): FeatureLineage | null {
    return this.lineage.get(featureName) || null;
  }

  async updateLineage(
    featureName: string,
    source: { type: 'raw' | 'derived' | 'external'; name: string },
    consumer?: string
  ): Promise<void> {
    const lineage = this.lineage.get(featureName);
    if (!lineage) return;

    lineage.sources.push({
      ...source,
      timestamp: new Date()
    });

    if (consumer) {
      lineage.consumers.push(consumer);
    }
  }

  getFeatureStatistics(featureName: string): any {
    const values = this.featureData.get(featureName) || [];
    if (values.length === 0) return null;

    const definition = this.features.get(featureName);
    if (!definition) return null;

    switch (definition.type) {
      case 'numeric':
        const numericValues = values.map(v => v.value).filter(v => typeof v === 'number');
        return {
          count: numericValues.length,
          mean: numericValues.reduce((sum, v) => sum + v, 0) / numericValues.length,
          min: Math.min(...numericValues),
          max: Math.max(...numericValues),
          stdDev: this.calculateStdDev(numericValues)
        };

      case 'categorical':
        const categoryCounts = new Map<string, number>();
        values.forEach(v => {
          const key = String(v.value);
          categoryCounts.set(key, (categoryCounts.get(key) || 0) + 1);
        });
        return {
          count: values.length,
          uniqueValues: categoryCounts.size,
          distribution: Object.fromEntries(categoryCounts)
        };

      default:
        return {
          count: values.length
        };
    }
  }

  private validateFeatureDefinition(definition: FeatureDefinition): void {
    if (!definition.name || !definition.type) {
      throw new Error('Feature name and type are required');
    }

    if (!['numeric', 'categorical', 'binary', 'text', 'embedding', 'time-series'].includes(definition.type)) {
      throw new Error(`Invalid feature type: ${definition.type}`);
    }
  }

  private cleanupOldFeatures(featureName: string, ttlSeconds: number): void {
    const values = this.featureData.get(featureName);
    if (!values) return;

    const cutoffTime = new Date(Date.now() - ttlSeconds * 1000);
    const filtered = values.filter(v => v.timestamp > cutoffTime);
    
    this.featureData.set(featureName, filtered);
  }

  private isCacheValid(cached: MaterializedFeatures): boolean {
    const age = Date.now() - cached.computedAt.getTime();
    return age < cached.ttl * 1000;
  }

  private convertToProcessedData(features: FeatureValue[]): ProcessedData {
    return {
      features: features.map(f => {
        const definition = this.features.get(f.featureName)!;
        return {
          name: f.featureName,
          value: f.value,
          type: definition.type as any
        };
      }),
      timestamp: new Date(),
      metadata: {}
    };
  }

  private calculateStdDev(values: number[]): number {
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
    return Math.sqrt(variance);
  }

  // Export feature definitions for model reproducibility
  exportFeatureDefinitions(): FeatureDefinition[] {
    return Array.from(this.features.values());
  }

  // Import feature definitions
  async importFeatureDefinitions(definitions: FeatureDefinition[]): Promise<void> {
    for (const def of definitions) {
      await this.registerFeature(def);
    }
  }

  // Clear all data (for testing)
  clearAll(): void {
    this.features.clear();
    this.featureSets.clear();
    this.materializedFeatures.clear();
    this.featureData.clear();
    this.lineage.clear();
  }
}

// Feature Transformers
abstract class FeatureTransformer {
  abstract transform(value: any, config: any): any;
}

class NormalizeTransformer extends FeatureTransformer {
  transform(value: any, config: { min: number; max: number }): any {
    if (typeof value !== 'number') return value;
    return (value - config.min) / (config.max - config.min);
  }
}

class StandardizeTransformer extends FeatureTransformer {
  transform(value: any, config: { mean: number; stdDev: number }): any {
    if (typeof value !== 'number') return value;
    return (value - config.mean) / config.stdDev;
  }
}

class EncodingTransformer extends FeatureTransformer {
  transform(value: any, config: { type: 'onehot' | 'label' | 'ordinal'; mapping?: any }): any {
    switch (config.type) {
      case 'label':
        return config.mapping?.[value] ?? 0;
      
      case 'onehot':
        const categories = Object.keys(config.mapping || {});
        const encoded = new Array(categories.length).fill(0);
        const idx = categories.indexOf(String(value));
        if (idx >= 0) encoded[idx] = 1;
        return encoded;
      
      case 'ordinal':
        return config.mapping?.[value] ?? 0;
      
      default:
        return value;
    }
  }
}

class AggregationTransformer extends FeatureTransformer {
  transform(values: any[], config: { operation: 'sum' | 'mean' | 'min' | 'max' | 'count' }): any {
    if (!Array.isArray(values)) return values;
    
    const numericValues = values.filter(v => typeof v === 'number');
    if (numericValues.length === 0) return 0;

    switch (config.operation) {
      case 'sum':
        return numericValues.reduce((sum, v) => sum + v, 0);
      case 'mean':
        return numericValues.reduce((sum, v) => sum + v, 0) / numericValues.length;
      case 'min':
        return Math.min(...numericValues);
      case 'max':
        return Math.max(...numericValues);
      case 'count':
        return numericValues.length;
      default:
        return values;
    }
  }
}

// Export singleton feature store
export const featureStore = new FeatureStore();