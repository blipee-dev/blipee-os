/**
 * Feature Store Implementation
 * Manages storage and retrieval of ML features
 */

import { Feature, FeatureQuery, FeatureStore as IFeatureStore } from './types';

export class FeatureStore implements IFeatureStore {
  private features: Map<string, Feature[]> = new Map();
  private featureHistory: Map<string, Feature[]> = new Map();

  /**
   * Store features in the feature store
   */
  async store(features: Feature[]): Promise<void> {
    const timestamp = new Date().toISOString();
    
    // Store current features
    this.features.set(timestamp, features);
    
    // Update feature history
    for (const feature of features) {
      const history = this.featureHistory.get(feature.name) || [];
      history.push({ ...feature, timestamp: new Date() } as any);
      
      // Keep only last 10000 entries per feature
      if (history.length > 10000) {
        history.shift();
      }
      
      this.featureHistory.set(feature.name, history);
    }
  }

  /**
   * Retrieve features based on query
   */
  async retrieve(query: FeatureQuery): Promise<Feature[]> {
    let allFeatures: Feature[] = [];
    
    // Get all stored features
    for (const [timestamp, features] of Array.from(this.features.entries())) {
      const date = new Date(timestamp);
      
      // Apply time range filter
      if (query.timeRange) {
        if (date < query.timeRange.start || date > query.timeRange.end) {
          continue;
        }
      }
      
      // Apply name filter
      let filteredFeatures = features;
      if (query.names && query.names.length > 0) {
        filteredFeatures = features.filter(f => query.names!.includes(f.name));
      }
      
      allFeatures = allFeatures.concat(filteredFeatures);
    }
    
    // Apply limit
    if (query.limit) {
      allFeatures = allFeatures.slice(-query.limit);
    }
    
    return allFeatures;
  }

  /**
   * Get feature history for a specific feature
   */
  async getFeatureHistory(featureName: string, limit: number): Promise<Feature[]> {
    const history = this.featureHistory.get(featureName) || [];
    return history.slice(-limit);
  }

  /**
   * Clear old features to manage memory
   */
  async cleanup(retentionDays: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    for (const [timestamp, _] of Array.from(this.features.entries())) {
      if (new Date(timestamp) < cutoffDate) {
        this.features.delete(timestamp);
      }
    }
  }

  /**
   * Get feature statistics
   */
  async getFeatureStats(featureName: string): Promise<{
    count: number;
    mean: number;
    std: number;
    min: number;
    max: number;
  }> {
    const history = this.featureHistory.get(featureName) || [];
    const values = history.map(f => f.value);
    
    if (values.length === 0) {
      return { count: 0, mean: 0, std: 0, min: 0, max: 0 };
    }
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const std = Math.sqrt(variance);
    
    return {
      count: values.length,
      mean,
      std,
      min: Math.min(...values),
      max: Math.max(...values)
    };
  }
}