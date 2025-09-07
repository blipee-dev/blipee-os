/**
 * Inference Engine for Phase 5
 * High-performance prediction serving with batch processing and caching
 */

import * as tf from '@tensorflow/tfjs-node';
import {
  ModelType,
  LoadedModel,
  InferenceOptions,
  InferenceRequest,
  Prediction
} from './types';

interface CacheEntry {
  prediction: Prediction;
  timestamp: Date;
  hits: number;
}

export class InferenceEngine {
  private modelCache: Map<string, LoadedModel> = new Map();
  private predictionCache: Map<string, CacheEntry> = new Map();
  private batchQueue: Map<string, InferenceRequest[]> = new Map();
  private batchTimers: Map<string, NodeJS.Timeout> = new Map();
  private config: {
    batchProcessing: boolean;
    modelCaching: boolean;
    predictionCaching: boolean;
    maxCacheSize: number;
    cacheTimeout: number;
    batchTimeout: number;
    maxBatchSize: number;
  };

  constructor() {
    this.config = {
      batchProcessing: true,
      modelCaching: true,
      predictionCaching: true,
      maxCacheSize: 10000,
      cacheTimeout: 5 * 60 * 1000, // 5 minutes
      batchTimeout: 100, // 100ms
      maxBatchSize: 32
    };
  }

  /**
   * Make optimized predictions with caching and batching
   */
  async predict(
    modelType: ModelType,
    input: any,
    options: InferenceOptions = {}
  ): Promise<Prediction> {
    // Generate cache key
    const cacheKey = this.generateCacheKey(modelType, input, options);
    
    // Check prediction cache
    if (this.config.predictionCaching && !options.batch) {
      const cachedResult = this.getCachedPrediction(cacheKey);
      if (cachedResult) {
        console.log('⚡ Cache hit for prediction');
        return cachedResult;
      }
    }
    
    // Get or load model
    const model = await this.getModel(modelType);
    
    let prediction: Prediction;
    
    if (options.batch && this.config.batchProcessing) {
      // Handle batch prediction
      prediction = await this.batchPredict(model, input, options);
    } else {
      // Single prediction
      prediction = await this.singlePredict(model, input, options);
    }
    
    // Cache the result
    if (this.config.predictionCaching) {
      this.cachePrediction(cacheKey, prediction);
    }
    
    return prediction;
  }

  /**
   * Enable batch processing optimization
   */
  async enableBatchProcessing(): Promise<void> {
    this.config.batchProcessing = true;
    console.log('📊 Batch processing enabled');
  }

  /**
   * Enable model caching
   */
  async enableModelCaching(): Promise<void> {
    this.config.modelCaching = true;
    console.log('💾 Model caching enabled');
  }

  /**
   * Get model performance statistics
   */
  getPerformanceStats(): {
    cacheHits: number;
    cacheMisses: number;
    batchedRequests: number;
    averageBatchSize: number;
    memoryUsage: {
      modelCache: number;
      predictionCache: number;
      tensors: { numTensors: number; numBytes: number };
    };
  } {
    const cacheHits = Array.from(this.predictionCache.values())
      .reduce((sum, entry) => sum + entry.hits, 0);
    const cacheMisses = this.predictionCache.size;
    
    // Calculate memory usage
    const modelCacheSize = this.modelCache.size * 1024 * 1024; // Rough estimate
    const predictionCacheSize = this.predictionCache.size * 1024; // Rough estimate
    
    return {
      cacheHits,
      cacheMisses,
      batchedRequests: 0, // Would track in real implementation
      averageBatchSize: 0, // Would track in real implementation
      memoryUsage: {
        modelCache: modelCacheSize,
        predictionCache: predictionCacheSize,
        tensors: tf.memory()
      }
    };
  }

  /**
   * Clear caches and optimize memory
   */
  async optimize(): Promise<void> {
    console.log('🧹 Optimizing inference engine...');
    
    // Clear expired cache entries
    this.cleanupCache();
    
    // Dispose unused tensors
    tf.dispose();
    
    console.log('✅ Inference engine optimized');
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    // Clear all caches
    this.predictionCache.clear();
    
    // Dispose models
    for (const [, model] of Array.from(this.modelCache.entries())) {
      if (model.model && model.model.dispose) {
        model.model.dispose();
      }
    }
    this.modelCache.clear();
    
    // Clear batch timers
    for (const [, timer] of Array.from(this.batchTimers.entries())) {
      clearTimeout(timer);
    }
    this.batchTimers.clear();
    
    console.log('✅ Inference engine disposed');
  }

  // Private methods

  private async getModel(modelType: ModelType): Promise<LoadedModel> {
    const cacheKey = modelType.toString();
    
    if (this.config.modelCaching && this.modelCache.has(cacheKey)) {
      return this.modelCache.get(cacheKey)!;
    }
    
    // In a real implementation, this would load the actual model
    const loadedModel: LoadedModel = {
      id: cacheKey,
      version: '1.0.0',
      model: null, // Would be actual TensorFlow model
      preprocess: async (input) => input,
      predict: async (input) => ({ value: Math.random() * 100 }),
      postprocess: async (output) => output
    };
    
    if (this.config.modelCaching) {
      this.modelCache.set(cacheKey, loadedModel);
    }
    
    return loadedModel;
  }

  private async singlePredict(
    model: LoadedModel,
    input: any,
    options: InferenceOptions
  ): Promise<Prediction> {
    // Preprocess input
    const processedInput = await model.preprocess(input);
    
    // Make prediction
    const rawOutput = await model.predict(processedInput);
    
    // Postprocess output
    const processedOutput = await model.postprocess(rawOutput);
    
    // Add metadata
    const prediction: Prediction = {
      value: processedOutput.value,
      confidence: processedOutput.confidence || 0.85,
      timestamp: new Date(),
      modelVersion: model.version,
      explanation: options.explain ? await this.generateExplanation(input, processedOutput) : undefined
    };
    
    return prediction;
  }

  private async batchPredict(
    model: LoadedModel,
    input: any,
    options: InferenceOptions
  ): Promise<Prediction> {
    return new Promise((resolve) => {
      const modelId = model.id;
      
      // Add to batch queue
      if (!this.batchQueue.has(modelId)) {
        this.batchQueue.set(modelId, []);
      }
      
      this.batchQueue.get(modelId)!.push({
        input,
        resolve: resolve as (value: any) => void
      });
      
      // Process batch when full or after timeout
      const queue = this.batchQueue.get(modelId)!;
      
      if (queue.length >= (options.batchSize || this.config.maxBatchSize)) {
        this.processBatch(model);
      } else {
        // Set timeout if not already set
        if (!this.batchTimers.has(modelId)) {
          const timer = setTimeout(() => {
            this.processBatch(model);
          }, options.batchTimeout || this.config.batchTimeout);
          
          this.batchTimers.set(modelId, timer);
        }
      }
    });
  }

  private async processBatch(model: LoadedModel): Promise<void> {
    const batch = this.batchQueue.get(model.id) || [];
    if (batch.length === 0) return;
    
    // Clear queue and timer
    this.batchQueue.set(model.id, []);
    const timer = this.batchTimers.get(model.id);
    if (timer) {
      clearTimeout(timer);
      this.batchTimers.delete(model.id);
    }
    
    try {
      // Process all inputs in batch
      const inputs = batch.map(b => b.input);
      
      if (model.batchPredict) {
        // Use model's batch prediction if available
        const predictions = await model.batchPredict(inputs);
        
        // Resolve individual promises
        batch.forEach((_request, i) => {
          const prediction: Prediction = {
            value: predictions[i].value,
            confidence: predictions[i].confidence || 0.85,
            timestamp: new Date(),
            modelVersion: model.version
          };
          request.resolve(prediction);
        });
      } else {
        // Process individually (fallback)
        for (let i = 0; i < batch.length; i++) {
          const prediction = await this.singlePredict(model, batch[i].input, {});
          batch[i].resolve(prediction);
        }
      }
      
    } catch (error) {
      // Resolve all promises with error
      batch.forEach(request => {
        const errorPrediction: Prediction = {
          value: 0,
          confidence: 0,
          timestamp: new Date(),
          modelVersion: model.version,
          explanation: {
            factors: [],
            reasoning: `Batch prediction failed: ${(error as Error).message}`
          }
        };
        request.resolve(errorPrediction);
      });
    }
  }

  private generateCacheKey(modelType: ModelType, input: any, options: InferenceOptions): string {
    // Create hash of input and options for caching
    const inputStr = JSON.stringify(input);
    const optionsStr = JSON.stringify(options);
    
    // Simple hash function (in production would use crypto)
    let hash = 0;
    const str = `${modelType}_${inputStr}_${optionsStr}`;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return hash.toString();
  }

  private getCachedPrediction(cacheKey: string): Prediction | null {
    const entry = this.predictionCache.get(cacheKey);
    if (!entry) return null;
    
    // Check if cache entry is still valid
    const age = Date.now() - entry.timestamp.getTime();
    if (age > this.config.cacheTimeout) {
      this.predictionCache.delete(cacheKey);
      return null;
    }
    
    // Update hit count
    entry.hits++;
    
    return { ...entry.prediction };
  }

  private cachePrediction(cacheKey: string, prediction: Prediction): void {
    // Check cache size limit
    if (this.predictionCache.size >= this.config.maxCacheSize) {
      // Remove oldest entries
      const entries = Array.from(this.predictionCache.entries())
        .sort(([,a], [,b]) => a.timestamp.getTime() - b.timestamp.getTime());
      
      const toRemove = Math.floor(this.config.maxCacheSize * 0.1); // Remove 10%
      for (let i = 0; i < toRemove && i < entries.length; i++) {
        this.predictionCache.delete(entries[i][0]);
      }
    }
    
    this.predictionCache.set(cacheKey, {
      prediction: { ...prediction },
      timestamp: new Date(),
      hits: 0
    });
  }

  private cleanupCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    for (const [key, entry] of Array.from(this.predictionCache.entries())) {
      const age = now - entry.timestamp.getTime();
      if (age > this.config.cacheTimeout) {
        expiredKeys.push(key);
      }
    }
    
    for (const key of expiredKeys) {
      this.predictionCache.delete(key);
    }
    
    console.log(`🧹 Cleaned up ${expiredKeys.length} expired cache entries`);
  }

  private async generateExplanation(input: any, output: any): Promise<{
    factors: Array<{ feature: string; impact: number }>;
    reasoning: string;
  }> {
    // Simplified explanation generation
    // In production, this would use SHAP, LIME, or similar techniques
    
    const factors = [
      { feature: 'historical_trend', impact: 0.35 },
      { feature: 'seasonal_pattern', impact: 0.28 },
      { feature: 'external_factors', impact: 0.22 },
      { feature: 'operational_changes', impact: 0.15 }
    ];
    
    const reasoning = 'Prediction based on historical patterns, seasonal trends, and current operational context';
    
    return { factors, reasoning };
  }
}
