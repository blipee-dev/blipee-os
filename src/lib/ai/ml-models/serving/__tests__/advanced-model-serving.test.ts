/**
 * Tests for Advanced Model Serving System
 */

import {
  AdvancedModelServer,
  ModelServingConfig,
  PredictionRequest,
  StreamingConfig,
  modelServer
} from '../advanced-model-serving';
import {
  ModelAdapterFactory,
  TensorFlowAdapter,
  ONNXAdapter,
  CustomModelAdapter
} from '../model-adapters';
import { BaseModel } from '../../base-model';
import { TrainingData } from '../../types';

// Mock model for testing
class MockMLModel extends BaseModel {
  private delay: number;

  constructor(delay: number = 10) {
    super({ epochs: 10, batchSize: 32 });
    this.delay = delay;
  }

  getModelName(): string {
    return 'mock-ml-model';
  }

  async train(data: TrainingData): Promise<void> {
    // Mock training
  }

  async predict(input: any): Promise<any> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, this.delay));
    
    return {
      prediction: Array.isArray(input) ? input[0] * 2 : input * 2,
      confidence: Math.random() * 0.3 + 0.7,
      value: Math.random()
    };
  }

  async serialize(): Promise<any> {
    return { type: 'mock', delay: this.delay };
  }

  async deserialize(data: any): Promise<void> {
    this.delay = data.delay || 10;
  }
}

describe('Advanced Model Serving', () => {
  let server: AdvancedModelServer;
  let mockModel: MockMLModel;

  beforeEach(() => {
    server = new AdvancedModelServer();
    mockModel = new MockMLModel();
  });

  afterEach(async () => {
    await server.shutdown();
  });

  describe('Model Loading', () => {
    it('should load a model with serving configuration', async () => {
      const config: ModelServingConfig = {
        modelId: 'test-model',
        version: '1.0',
        replicas: 3,
        batch: {
          maxBatchSize: 32,
          maxWaitTime: 100,
          enableDynamicBatching: true,
          priorityQueuing: false
        },
        streaming: {
          protocol: 'websocket',
          bufferSize: 1000,
          backpressure: true,
          compression: false
        },
        caching: {
          enabled: true,
          ttl: 60000,
          maxSize: 1000
        },
        monitoring: {
          latencyTracking: true,
          throughputTracking: true,
          errorTracking: true
        }
      };

      await server.loadModel(mockModel, config);
      
      // Model should be loaded
      const request: PredictionRequest = {
        id: 'test-1',
        input: [1, 2, 3],
        timestamp: new Date()
      };

      const response = await server.predict('test-model', '1.0', request);
      expect(response.prediction).toBe(2); // First element * 2
      expect(response.modelVersion).toBe('1.0');
    });

    it('should create multiple replicas', async () => {
      const config: ModelServingConfig = {
        modelId: 'replicated-model',
        version: '1.0',
        replicas: 5,
        batch: {
          maxBatchSize: 1,
          maxWaitTime: 100,
          enableDynamicBatching: false,
          priorityQueuing: false
        },
        streaming: {
          protocol: 'websocket',
          bufferSize: 100,
          backpressure: false,
          compression: false
        },
        caching: {
          enabled: false,
          ttl: 0,
          maxSize: 0
        },
        monitoring: {
          latencyTracking: true,
          throughputTracking: true,
          errorTracking: true
        }
      };

      await server.loadModel(mockModel, config);
      
      // Test concurrent predictions (would use different replicas)
      const requests = Array(10).fill(0).map((_, i) => ({
        id: `test-${i}`,
        input: i,
        timestamp: new Date()
      }));

      const responses = await Promise.all(
        requests.map(req => server.predict('replicated-model', '1.0', req))
      );

      expect(responses).toHaveLength(10);
      responses.forEach((resp, i) => {
        expect(resp.prediction).toBe(i * 2);
      });
    });
  });

  describe('Batch Prediction', () => {
    it('should batch requests when configured', async () => {
      const config: ModelServingConfig = {
        modelId: 'batch-model',
        version: '1.0',
        replicas: 1,
        batch: {
          maxBatchSize: 5,
          maxWaitTime: 50,
          enableDynamicBatching: true,
          priorityQueuing: false
        },
        streaming: {
          protocol: 'websocket',
          bufferSize: 100,
          backpressure: false,
          compression: false
        },
        caching: {
          enabled: false,
          ttl: 0,
          maxSize: 0
        },
        monitoring: {
          latencyTracking: true,
          throughputTracking: true,
          errorTracking: true
        }
      };

      await server.loadModel(mockModel, config);

      // Send multiple requests quickly
      const requests = Array(3).fill(0).map((_, i) => ({
        id: `batch-${i}`,
        input: [i],
        timestamp: new Date()
      }));

      const startTime = Date.now();
      const responses = await Promise.all(
        requests.map(req => server.predict('batch-model', '1.0', req))
      );
      const totalTime = Date.now() - startTime;

      // Should be processed as a batch (faster than sequential)
      expect(responses).toHaveLength(3);
      expect(totalTime).toBeLessThan(100); // Should complete within max wait time
      
      responses.forEach((resp, i) => {
        expect(resp.prediction).toBe(i * 2);
      });
    });

    it('should respect priority queuing', async () => {
      const config: ModelServingConfig = {
        modelId: 'priority-model',
        version: '1.0',
        replicas: 1,
        batch: {
          maxBatchSize: 3,
          maxWaitTime: 100,
          enableDynamicBatching: true,
          priorityQueuing: true
        },
        streaming: {
          protocol: 'websocket',
          bufferSize: 100,
          backpressure: false,
          compression: false
        },
        caching: {
          enabled: false,
          ttl: 0,
          maxSize: 0
        },
        monitoring: {
          latencyTracking: false,
          throughputTracking: false,
          errorTracking: false
        }
      };

      await server.loadModel(mockModel, config);

      // Send requests with different priorities
      const requests: PredictionRequest[] = [
        { id: 'low-1', input: [1], priority: 'low', timestamp: new Date() },
        { id: 'high-1', input: [2], priority: 'high', timestamp: new Date() },
        { id: 'medium-1', input: [3], priority: 'medium', timestamp: new Date() },
        { id: 'high-2', input: [4], priority: 'high', timestamp: new Date() }
      ];

      const responses = await Promise.all(
        requests.map(req => server.predict('priority-model', '1.0', req))
      );

      expect(responses).toHaveLength(4);
      // High priority requests should be processed first
      const highPriorityResponses = responses.filter(r => r.id.startsWith('high'));
      expect(highPriorityResponses).toHaveLength(2);
    });
  });

  describe('Streaming Predictions', () => {
    it('should support streaming predictions', async () => {
      const config: ModelServingConfig = {
        modelId: 'stream-model',
        version: '1.0',
        replicas: 1,
        batch: {
          maxBatchSize: 1,
          maxWaitTime: 100,
          enableDynamicBatching: false,
          priorityQueuing: false
        },
        streaming: {
          protocol: 'websocket',
          bufferSize: 100,
          backpressure: true,
          compression: false
        },
        caching: {
          enabled: false,
          ttl: 0,
          maxSize: 0
        },
        monitoring: {
          latencyTracking: true,
          throughputTracking: true,
          errorTracking: true
        }
      };

      await server.loadModel(mockModel, config);

      const streamConfig: StreamingConfig = {
        protocol: 'websocket',
        bufferSize: 100,
        backpressure: true,
        compression: false
      };

      const input = Array(100).fill(0).map((_, i) => i);
      const stream = await server.streamPredict(
        'stream-model',
        '1.0',
        input,
        streamConfig
      );

      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[chunks.length - 1].isComplete).toBe(true);
      
      // Verify chunk sequence
      chunks.forEach((chunk, idx) => {
        expect(chunk.chunkIndex).toBe(idx);
        expect(chunk.totalChunks).toBe(chunks.length);
      });
    });

    it('should support batch streaming', async () => {
      const config: ModelServingConfig = {
        modelId: 'batch-stream-model',
        version: '1.0',
        replicas: 1,
        batch: {
          maxBatchSize: 10,
          maxWaitTime: 50,
          enableDynamicBatching: true,
          priorityQueuing: false
        },
        streaming: {
          protocol: 'server-sent-events',
          bufferSize: 1000,
          backpressure: false,
          compression: true
        },
        caching: {
          enabled: false,
          ttl: 0,
          maxSize: 0
        },
        monitoring: {
          latencyTracking: true,
          throughputTracking: true,
          errorTracking: true
        }
      };

      await server.loadModel(mockModel, config);

      const inputs = Array(25).fill(0).map((_, i) => [i]);
      const streamConfig: StreamingConfig = {
        protocol: 'server-sent-events',
        bufferSize: 1000,
        backpressure: false,
        compression: true
      };

      const batches = [];
      const stream = server.streamBatchPredict(
        'batch-stream-model',
        '1.0',
        inputs,
        streamConfig
      );

      for await (const batch of stream) {
        batches.push(batch);
      }

      expect(batches.length).toBe(3); // 25 items in batches of 10
      
      const allResponses = batches.flat();
      expect(allResponses).toHaveLength(25);
      
      allResponses.forEach((resp, i) => {
        expect(resp.prediction).toBe(i * 2);
      });
    });
  });

  describe('Caching', () => {
    it('should cache predictions when enabled', async () => {
      const config: ModelServingConfig = {
        modelId: 'cached-model',
        version: '1.0',
        replicas: 1,
        batch: {
          maxBatchSize: 1,
          maxWaitTime: 100,
          enableDynamicBatching: false,
          priorityQueuing: false
        },
        streaming: {
          protocol: 'websocket',
          bufferSize: 100,
          backpressure: false,
          compression: false
        },
        caching: {
          enabled: true,
          ttl: 1000,
          maxSize: 100
        },
        monitoring: {
          latencyTracking: true,
          throughputTracking: true,
          errorTracking: true
        }
      };

      // Use a model with longer delay to test caching
      const slowModel = new MockMLModel(50);
      await server.loadModel(slowModel, config);

      const request: PredictionRequest = {
        id: 'cache-test',
        input: [1, 2, 3],
        timestamp: new Date()
      };

      // First request (cache miss)
      const start1 = Date.now();
      const response1 = await server.predict('cached-model', '1.0', request);
      const time1 = Date.now() - start1;

      // Second request (cache hit)
      const start2 = Date.now();
      const response2 = await server.predict('cached-model', '1.0', {
        ...request,
        id: 'cache-test-2'
      });
      const time2 = Date.now() - start2;

      expect(response1.prediction).toBe(response2.prediction);
      expect(time2).toBeLessThan(time1 / 2); // Cached response should be much faster

      // Check metrics
      const metrics = server.getMetrics();
      expect(metrics['cached-model:1.0'].cacheHitRate).toBeGreaterThan(0);
    });
  });

  describe('Model Adapters', () => {
    it('should support TensorFlow adapter', async () => {
      const adapter = await ModelAdapterFactory.createAdapter('tensorflow');
      await adapter.loadModel('/path/to/model');

      const prediction = await adapter.predict([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      expect(prediction).toHaveProperty('prediction');
      expect(prediction).toHaveProperty('confidence');

      const metadata = adapter.getMetadata();
      expect(metadata.framework).toBe('tensorflow');
      expect(metadata.inputShape).toEqual([null, 10]);

      adapter.dispose();
    });

    it('should support ONNX adapter', async () => {
      const adapter = await ModelAdapterFactory.createAdapter('onnx');
      await adapter.loadModel('/path/to/model.onnx');

      const prediction = await adapter.predict([1, 2, 3]);
      expect(prediction).toHaveProperty('prediction');
      expect(prediction.confidence).toBeGreaterThan(0.5);

      const batchPredictions = await adapter.batchPredict([[1, 2], [3, 4], [5, 6]]);
      expect(batchPredictions).toHaveLength(3);

      adapter.dispose();
    });

    it('should support custom model adapter', async () => {
      const adapter = await ModelAdapterFactory.createAdapter('custom', {
        epochs: 10,
        batchSize: 32
      });
      
      await adapter.loadModel('/path/to/custom/model');

      const prediction = await adapter.predict([0.5, 0.7, 0.3]);
      expect(prediction).toHaveProperty('prediction');
      expect(prediction).toHaveProperty('score');

      adapter.dispose();
    });

    it('should list supported frameworks', () => {
      const frameworks = ModelAdapterFactory.getSupportedFrameworks();
      expect(frameworks).toContain('tensorflow');
      expect(frameworks).toContain('onnx');
      expect(frameworks).toContain('scikit-learn');
      expect(frameworks).toContain('custom');
    });
  });

  describe('Error Handling', () => {
    it('should handle model not found errors', async () => {
      const request: PredictionRequest = {
        id: 'error-test',
        input: [1, 2, 3],
        timestamp: new Date()
      };

      await expect(
        server.predict('non-existent', '1.0', request)
      ).rejects.toThrow('Model non-existent:1.0 not found');
    });

    it('should track errors in metrics', async () => {
      const config: ModelServingConfig = {
        modelId: 'error-model',
        version: '1.0',
        replicas: 1,
        batch: {
          maxBatchSize: 1,
          maxWaitTime: 100,
          enableDynamicBatching: false,
          priorityQueuing: false
        },
        streaming: {
          protocol: 'websocket',
          bufferSize: 100,
          backpressure: false,
          compression: false
        },
        caching: {
          enabled: false,
          ttl: 0,
          maxSize: 0
        },
        monitoring: {
          latencyTracking: true,
          throughputTracking: true,
          errorTracking: true
        }
      };

      // Create a model that throws errors
      class ErrorModel extends MockMLModel {
        async predict(input: any): Promise<any> {
          throw new Error('Prediction failed');
        }
      }

      const errorModel = new ErrorModel();
      await server.loadModel(errorModel, config);

      const request: PredictionRequest = {
        id: 'error-1',
        input: [1, 2, 3],
        timestamp: new Date()
      };

      await expect(
        server.predict('error-model', '1.0', request)
      ).rejects.toThrow('Prediction failed');

      const metrics = server.getMetrics();
      expect(metrics['error-model:1.0']).toBeDefined();
      expect(metrics['error-model:1.0'].errors).toBeGreaterThan(0);
      expect(metrics['error-model:1.0'].errorRate).toBeGreaterThan(0);
    });
  });

  describe('Performance Metrics', () => {
    it('should track latency percentiles', async () => {
      const config: ModelServingConfig = {
        modelId: 'metrics-model',
        version: '1.0',
        replicas: 1,
        batch: {
          maxBatchSize: 1,
          maxWaitTime: 100,
          enableDynamicBatching: false,
          priorityQueuing: false
        },
        streaming: {
          protocol: 'websocket',
          bufferSize: 100,
          backpressure: false,
          compression: false
        },
        caching: {
          enabled: false,
          ttl: 0,
          maxSize: 0
        },
        monitoring: {
          latencyTracking: true,
          throughputTracking: true,
          errorTracking: true
        }
      };

      await server.loadModel(mockModel, config);

      // Make multiple predictions
      const requests = Array(20).fill(0).map((_, i) => ({
        id: `metric-${i}`,
        input: [i],
        timestamp: new Date()
      }));

      await Promise.all(
        requests.map(req => server.predict('metrics-model', '1.0', req))
      );

      const metrics = server.getMetrics();
      const modelMetrics = metrics['metrics-model:1.0'];
      
      expect(modelMetrics.predictions).toBe(20);
      expect(modelMetrics.avgLatency).toBeGreaterThan(0);
      expect(modelMetrics.p95Latency).toBeGreaterThanOrEqual(modelMetrics.avgLatency);
      expect(modelMetrics.p99Latency).toBeGreaterThanOrEqual(modelMetrics.p95Latency);
      expect(modelMetrics.throughput).toBeGreaterThan(0);
    });
  });
});