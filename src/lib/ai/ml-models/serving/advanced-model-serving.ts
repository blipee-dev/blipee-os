/**
 * Stream B Day 33-34: Advanced Model Serving
 * Batch prediction and streaming capabilities for production ML models
 */

import { BaseModel } from '../base-model';
import { LoadedModel, InferenceOptions, InferenceRequest } from '../types';

export interface BatchPredictionConfig {
  maxBatchSize: number;
  maxWaitTime: number; // milliseconds
  enableDynamicBatching: boolean;
  priorityQueuing: boolean;
}

export interface StreamingConfig {
  protocol: 'websocket' | 'server-sent-events' | 'grpc-stream';
  bufferSize: number;
  backpressure: boolean;
  compression: boolean;
}

export interface ModelServingConfig {
  modelId: string;
  version: string;
  replicas: number;
  batch: BatchPredictionConfig;
  streaming: StreamingConfig;
  caching: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
  };
  monitoring: {
    latencyTracking: boolean;
    throughputTracking: boolean;
    errorTracking: boolean;
  };
}

export interface PredictionRequest {
  id: string;
  input: any;
  priority?: 'low' | 'medium' | 'high';
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface PredictionResponse {
  id: string;
  prediction: any;
  confidence?: number;
  latency: number;
  modelVersion: string;
  timestamp: Date;
}

export interface StreamingPredictionChunk {
  sequenceId: string;
  chunkIndex: number;
  totalChunks: number;
  data: any;
  isComplete: boolean;
}

export class AdvancedModelServer {
  private models: Map<string, LoadedModel> = new Map();
  private batchQueues: Map<string, BatchQueue> = new Map();
  private streamingSessions: Map<string, StreamingSession> = new Map();
  private cache: Map<string, CachedPrediction> = new Map();
  private metrics: ServingMetrics;

  constructor() {
    this.metrics = new ServingMetrics();
  }

  async loadModel(
    model: BaseModel,
    config: ModelServingConfig
  ): Promise<void> {
    const modelKey = `${config.modelId}:${config.version}`;
    
    // Create loaded model wrapper
    const loadedModel: LoadedModel = {
      id: config.modelId,
      version: config.version,
      model: model,
      preprocess: async (input: any) => this.preprocessInput(input, config.modelId),
      predict: async (input: any) => model.predict(input),
      postprocess: async (output: any) => this.postprocessOutput(output, config.modelId),
      batchPredict: async (inputs: any[]) => this.batchPredict(model, inputs)
    };

    this.models.set(modelKey, loadedModel);

    // Initialize batch queue if batch prediction is enabled
    if (config.batch.maxBatchSize > 1) {
      const batchQueue = new BatchQueue(config.batch, loadedModel, this.metrics, modelKey);
      this.batchQueues.set(modelKey, batchQueue);
      batchQueue.start();
    }

    // Initialize replicas
    for (let i = 1; i < config.replicas; i++) {
      const replicaKey = `${modelKey}:replica-${i}`;
      this.models.set(replicaKey, { ...loadedModel });
    }
  }

  async predict(
    modelId: string,
    version: string,
    request: PredictionRequest
  ): Promise<PredictionResponse> {
    const startTime = Date.now();
    const modelKey = `${modelId}:${version}`;

    // Check cache first
    const cached = this.checkCache(modelKey, request.input);
    if (cached) {
      return {
        ...cached,
        id: request.id,
        timestamp: new Date()
      };
    }

    // Get model or batch queue
    const batchQueue = this.batchQueues.get(modelKey);
    if (batchQueue) {
      // Use batch prediction
      const response = await batchQueue.addRequest(request);
      this.cacheResult(modelKey, request.input, response);
      return response;
    }

    // Direct prediction
    const model = this.models.get(modelKey);
    if (!model) {
      throw new Error(`Model ${modelKey} not found`);
    }

    try {
      const preprocessed = await model.preprocess(request.input);
      const prediction = await model.predict(preprocessed);
      const postprocessed = await model.postprocess(prediction);

      const response: PredictionResponse = {
        id: request.id,
        prediction: postprocessed,
        confidence: prediction.confidence,
        latency: Date.now() - startTime,
        modelVersion: version,
        timestamp: new Date()
      };

      this.cacheResult(modelKey, request.input, response);
      this.metrics.recordPrediction(modelKey, response.latency);

      return response;
    } catch (error) {
      this.metrics.recordError(modelKey);
      throw error;
    }
  }

  async batchPredict(
    model: BaseModel,
    inputs: any[]
  ): Promise<any[]> {
    // Default batch prediction - can be overridden by specific models
    const predictions = await Promise.all(
      inputs.map(input => model.predict(input))
    );
    return predictions;
  }

  async streamPredict(
    modelId: string,
    version: string,
    input: any,
    config: StreamingConfig
  ): Promise<AsyncGenerator<StreamingPredictionChunk>> {
    const modelKey = `${modelId}:${version}`;
    const model = this.models.get(modelKey);
    
    if (!model) {
      throw new Error(`Model ${modelKey} not found`);
    }

    const sessionId = `stream-${Date.now()}-${Math.random()}`;
    const session = new StreamingSession(sessionId, model, config);
    this.streamingSessions.set(sessionId, session);

    return session.stream(input);
  }

  async* streamBatchPredict(
    modelId: string,
    version: string,
    inputs: any[],
    config: StreamingConfig
  ): AsyncGenerator<PredictionResponse[]> {
    const batchSize = 10; // Process in smaller batches for streaming
    
    for (let i = 0; i < inputs.length; i += batchSize) {
      const batch = inputs.slice(i, i + batchSize);
      const requests = batch.map((input, idx) => ({
        id: `batch-${i + idx}`,
        input,
        timestamp: new Date()
      }));

      const responses = await Promise.all(
        requests.map(req => this.predict(modelId, version, req))
      );

      yield responses;
    }
  }

  private preprocessInput(input: any, modelId: string): any {
    // Default preprocessing - can be customized per model
    if (typeof input === 'string') {
      return { text: input };
    }
    return input;
  }

  private postprocessOutput(output: any, modelId: string): any {
    // Default postprocessing - can be customized per model
    if (output.prediction !== undefined) {
      return output.prediction;
    }
    return output;
  }

  private checkCache(modelKey: string, input: any): PredictionResponse | null {
    const cacheKey = `${modelKey}:${JSON.stringify(input)}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      this.metrics.recordCacheHit(modelKey);
      return cached.response;
    }
    
    this.metrics.recordCacheMiss(modelKey);
    return null;
  }

  getServingMetrics(): ServingMetrics {
    return this.metrics;
  }

  private cacheResult(
    modelKey: string,
    input: any,
    response: PredictionResponse
  ): void {
    const cacheKey = `${modelKey}:${JSON.stringify(input)}`;
    this.cache.set(cacheKey, {
      response,
      timestamp: Date.now(),
      ttl: 60000 // 1 minute default
    });

    // Implement LRU eviction if cache is too large
    if (this.cache.size > 10000) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }

  getMetrics(): any {
    return this.metrics.getStats();
  }

  async shutdown(): Promise<void> {
    // Stop all batch queues
    for (const queue of this.batchQueues.values()) {
      await queue.stop();
    }

    // Close all streaming sessions
    for (const session of this.streamingSessions.values()) {
      await session.close();
    }
  }
}

class BatchQueue {
  private queue: PredictionRequest[] = [];
  private processing = false;
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private config: BatchPredictionConfig,
    private model: LoadedModel,
    private metrics?: ServingMetrics,
    private modelKey?: string
  ) {}

  start(): void {
    this.processing = true;
    this.processLoop();
  }

  async stop(): Promise<void> {
    this.processing = false;
    if (this.timer) {
      clearTimeout(this.timer);
    }
    
    // Process remaining requests
    if (this.queue.length > 0) {
      await this.processBatch();
    }
  }

  async addRequest(request: PredictionRequest): Promise<PredictionResponse> {
    return new Promise((resolve, reject) => {
      // Store the resolver with the request
      const requestWithResolver = {
        ...request,
        _resolve: resolve,
        _reject: reject
      };

      if (this.config.priorityQueuing && request.priority) {
        this.addWithPriority(requestWithResolver, request.priority);
      } else {
        this.queue.push(requestWithResolver as any);
      }

      // Start timer for max wait time
      if (this.queue.length === 1) {
        this.timer = setTimeout(() => {
          this.processBatch();
        }, this.config.maxWaitTime);
      }

      // Process immediately if batch is full
      if (this.queue.length >= this.config.maxBatchSize) {
        this.processBatch();
      }
    });
  }

  private addWithPriority(request: any, priority: string): void {
    // Priority queue implementation
    const priorityValues = { high: 3, medium: 2, low: 1 };
    const value = priorityValues[priority as keyof typeof priorityValues] || 2;
    
    // Insert in priority order
    let inserted = false;
    for (let i = 0; i < this.queue.length; i++) {
      const existingPriority = this.queue[i].priority || 'medium';
      const existingValue = priorityValues[existingPriority as keyof typeof priorityValues];
      
      if (value > existingValue) {
        this.queue.splice(i, 0, request);
        inserted = true;
        break;
      }
    }
    
    if (!inserted) {
      this.queue.push(request);
    }
  }

  private async processLoop(): Promise<void> {
    while (this.processing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  private async processBatch(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.queue.length === 0) return;

    // Get batch
    const batchSize = Math.min(this.queue.length, this.config.maxBatchSize);
    const batch = this.queue.splice(0, batchSize);

    try {
      // Preprocess batch
      const preprocessed = await Promise.all(
        batch.map(req => this.model.preprocess(req.input))
      );

      // Batch predict
      const startTime = Date.now();
      const predictions = this.model.batchPredict
        ? await this.model.batchPredict(preprocessed)
        : await Promise.all(preprocessed.map(input => this.model.predict(input)));

      const latency = Date.now() - startTime;

      // Postprocess and create responses
      const responses = await Promise.all(
        predictions.map(async (pred, idx) => {
          const postprocessed = await this.model.postprocess(pred);
          return {
            id: batch[idx].id,
            prediction: postprocessed,
            confidence: pred.confidence,
            latency: latency / batch.length, // Average latency per request
            modelVersion: this.model.version,
            timestamp: new Date()
          };
        })
      );

      // Resolve promises
      batch.forEach((req: any, idx) => {
        if (req._resolve) {
          req._resolve(responses[idx]);
        }
      });

      // Record success metrics
      if (this.metrics && this.modelKey) {
        responses.forEach(resp => {
          this.metrics.recordPrediction(this.modelKey!, resp.latency);
        });
      }
    } catch (error) {
      // Record error metrics
      if (this.metrics && this.modelKey) {
        batch.forEach(() => {
          this.metrics.recordError(this.modelKey!);
        });
      }

      // Reject all promises in batch
      batch.forEach((req: any) => {
        if (req._reject) {
          req._reject(error);
        }
      });
    }
  }
}

class StreamingSession {
  private buffer: any[] = [];
  private closed = false;

  constructor(
    private sessionId: string,
    private model: LoadedModel,
    private config: StreamingConfig
  ) {}

  async* stream(input: any): AsyncGenerator<StreamingPredictionChunk> {
    const preprocessed = await this.model.preprocess(input);
    
    // Simulate streaming prediction (in practice, this would be model-specific)
    const chunks = this.createChunks(preprocessed);
    
    for (let i = 0; i < chunks.length && !this.closed; i++) {
      const prediction = await this.model.predict(chunks[i]);
      const postprocessed = await this.model.postprocess(prediction);

      yield {
        sequenceId: this.sessionId,
        chunkIndex: i,
        totalChunks: chunks.length,
        data: postprocessed,
        isComplete: i === chunks.length - 1
      };

      // Apply backpressure if needed
      if (this.config.backpressure && this.buffer.length > this.config.bufferSize) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
  }

  private createChunks(data: any): any[] {
    // Simulate chunking - actual implementation would depend on data type
    if (Array.isArray(data)) {
      const chunkSize = Math.ceil(data.length / 10);
      const chunks = [];
      for (let i = 0; i < data.length; i += chunkSize) {
        chunks.push(data.slice(i, i + chunkSize));
      }
      return chunks;
    }
    
    // For non-array data, return as single chunk
    return [data];
  }

  async close(): Promise<void> {
    this.closed = true;
    this.buffer = [];
  }
}

class ServingMetrics {
  private metrics: Map<string, ModelMetrics> = new Map();

  recordPrediction(modelKey: string, latency: number): void {
    const metric = this.getOrCreateMetric(modelKey);
    metric.predictions++;
    metric.totalLatency += latency;
    metric.latencies.push(latency);
    
    // Keep only last 1000 latencies
    if (metric.latencies.length > 1000) {
      metric.latencies.shift();
    }
  }

  recordError(modelKey: string): void {
    const metric = this.getOrCreateMetric(modelKey);
    metric.errors++;
  }

  recordCacheHit(modelKey: string): void {
    const metric = this.getOrCreateMetric(modelKey);
    metric.cacheHits++;
  }

  recordCacheMiss(modelKey: string): void {
    const metric = this.getOrCreateMetric(modelKey);
    metric.cacheMisses++;
  }

  getStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    for (const [modelKey, metric] of this.metrics) {
      const avgLatency = metric.predictions > 0 
        ? metric.totalLatency / metric.predictions 
        : 0;
      
      const p95Latency = this.calculatePercentile(metric.latencies, 0.95);
      const p99Latency = this.calculatePercentile(metric.latencies, 0.99);
      
      stats[modelKey] = {
        predictions: metric.predictions,
        errors: metric.errors,
        errorRate: (metric.predictions + metric.errors) > 0 
          ? metric.errors / (metric.predictions + metric.errors) 
          : 0,
        avgLatency,
        p95Latency,
        p99Latency,
        cacheHitRate: metric.cacheHits + metric.cacheMisses > 0
          ? metric.cacheHits / (metric.cacheHits + metric.cacheMisses)
          : 0,
        throughput: metric.predictions / ((Date.now() - metric.startTime) / 1000)
      };
    }
    
    return stats;
  }

  private getOrCreateMetric(modelKey: string): ModelMetrics {
    if (!this.metrics.has(modelKey)) {
      this.metrics.set(modelKey, {
        predictions: 0,
        errors: 0,
        totalLatency: 0,
        latencies: [],
        cacheHits: 0,
        cacheMisses: 0,
        startTime: Date.now()
      });
    }
    return this.metrics.get(modelKey)!;
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * percentile) - 1;
    return sorted[index];
  }
}

interface ModelMetrics {
  predictions: number;
  errors: number;
  totalLatency: number;
  latencies: number[];
  cacheHits: number;
  cacheMisses: number;
  startTime: number;
}

interface CachedPrediction {
  response: PredictionResponse;
  timestamp: number;
  ttl: number;
}

// Export singleton server
export const modelServer = new AdvancedModelServer();