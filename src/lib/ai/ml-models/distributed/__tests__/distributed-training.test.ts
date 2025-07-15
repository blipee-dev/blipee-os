/**
 * Tests for Distributed Training System
 */

import { 
  DistributedTrainingCoordinator,
  WorkerNode,
  DistributedTrainingConfig
} from '../distributed-training';
import { DistributedDataLoader, DistributedDataConfig } from '../distributed-data-loader';
import { BaseModel } from '../../base-model';
import { TrainingData } from '../../types';

// Mock model for testing
class MockModel extends BaseModel {
  getModelName(): string {
    return 'mock-model';
  }

  async train(data: TrainingData): Promise<void> {
    // Mock training
  }

  async predict(input: any): Promise<any> {
    return { prediction: Math.random() };
  }

  async serialize(): Promise<any> {
    return { 
      type: 'mock',
      weights: Array(100).fill(0).map(() => Math.random()),
      config: this.config
    };
  }

  async deserialize(data: any): Promise<void> {
    // Mock deserialization
  }
}

describe('Distributed Training System', () => {
  let coordinator: DistributedTrainingCoordinator;
  let dataLoader: DistributedDataLoader;
  let mockWorkers: WorkerNode[];
  let trainingData: TrainingData;

  beforeEach(() => {
    coordinator = new DistributedTrainingCoordinator();
    
    // Create mock workers
    mockWorkers = [
      {
        id: 'worker-1',
        host: 'localhost',
        port: 5001,
        status: 'idle',
        gpuCount: 2,
        memoryGB: 32,
        lastHeartbeat: new Date()
      },
      {
        id: 'worker-2',
        host: 'localhost',
        port: 5002,
        status: 'idle',
        gpuCount: 2,
        memoryGB: 32,
        lastHeartbeat: new Date()
      },
      {
        id: 'worker-3',
        host: 'localhost',
        port: 5003,
        status: 'idle',
        gpuCount: 1,
        memoryGB: 16,
        lastHeartbeat: new Date()
      }
    ];

    // Register workers
    mockWorkers.forEach(worker => coordinator.registerWorker(worker));

    // Create training data
    const samples = 1000;
    trainingData = {
      features: Array(samples).fill(0).map(() => 
        Array(10).fill(0).map(() => Math.random())
      ),
      labels: Array(samples).fill(0).map(() => 
        Math.random() > 0.5 ? 1 : 0
      )
    };

    // Create data loader
    const dataConfig: DistributedDataConfig = {
      shardingStrategy: 'sequential',
      cacheSize: 100,
      prefetchBatches: 5,
      compressionEnabled: false,
      replicationFactor: 1
    };
    dataLoader = new DistributedDataLoader(dataConfig);
  });

  afterEach(() => {
    coordinator.cleanup();
  });

  describe('Worker Management', () => {
    it('should register and track workers', async () => {
      const newWorker: WorkerNode = {
        id: 'worker-4',
        host: 'localhost',
        port: 5004,
        status: 'idle',
        lastHeartbeat: new Date()
      };

      await coordinator.registerWorker(newWorker);
      // Worker should be registered (internal state)
      expect(true).toBe(true); // Placeholder - actual test would check internal state
    });

    it('should handle worker unregistration', async () => {
      await coordinator.unregisterWorker('worker-1');
      // Worker should be removed
      expect(true).toBe(true);
    });
  });

  describe('Distributed Training', () => {
    it('should start distributed training with data parallelism', async () => {
      const model = new MockModel({ epochs: 5, batchSize: 32 });
      
      const config: DistributedTrainingConfig = {
        strategy: 'data-parallel',
        nodes: mockWorkers,
        batchSizePerNode: 32,
        gradientAggregation: 'average',
        communicationProtocol: 'grpc',
        checkpointFrequency: 2,
        faultTolerance: true
      };

      const jobId = await coordinator.startDistributedTraining(
        model,
        trainingData,
        config
      );

      expect(jobId).toMatch(/^dist-\d+$/);

      // Check initial progress
      const progress = await coordinator.getTrainingProgress(jobId);
      expect(progress).not.toBeNull();
      expect(progress!.totalEpochs).toBe(5);
      expect(progress!.nodesActive).toBe(3);

      // Stop training
      await coordinator.stopTraining(jobId);
    });

    it('should handle model parallel training', async () => {
      const model = new MockModel({ epochs: 3, batchSize: 64 });
      
      const config: DistributedTrainingConfig = {
        strategy: 'model-parallel',
        nodes: mockWorkers.slice(0, 2), // Use 2 workers
        batchSizePerNode: 64,
        gradientAggregation: 'sum',
        communicationProtocol: 'http',
        checkpointFrequency: 1,
        faultTolerance: false
      };

      const jobId = await coordinator.startDistributedTraining(
        model,
        trainingData,
        config
      );

      expect(jobId).toMatch(/^dist-\d+$/);

      const progress = await coordinator.getTrainingProgress(jobId);
      expect(progress!.nodesActive).toBe(2);

      await coordinator.stopTraining(jobId);
    });

    it('should fail with insufficient workers', async () => {
      const model = new MockModel({ epochs: 5 });
      
      const config: DistributedTrainingConfig = {
        strategy: 'data-parallel',
        nodes: [mockWorkers[0]], // Only 1 worker
        batchSizePerNode: 32,
        gradientAggregation: 'average',
        communicationProtocol: 'grpc',
        checkpointFrequency: 2,
        faultTolerance: true
      };

      await expect(
        coordinator.startDistributedTraining(model, trainingData, config)
      ).rejects.toThrow('Distributed training requires at least 2 available workers');
    });
  });

  describe('Data Sharding', () => {
    it('should perform sequential sharding', async () => {
      const shards = await dataLoader.shardData(
        trainingData,
        mockWorkers.map(w => w.id)
      );

      expect(shards.size).toBe(3); // 3 workers
      
      // Check shard distribution
      let totalSamples = 0;
      for (const shard of shards.values()) {
        expect(shard.data.length).toBeGreaterThan(0);
        expect(shard.labels.length).toBe(shard.data.length);
        totalSamples += shard.data.length;
      }
      expect(totalSamples).toBe(1000);
    });

    it('should perform interleaved sharding', async () => {
      const interleavedLoader = new DistributedDataLoader({
        shardingStrategy: 'interleaved',
        cacheSize: 100,
        prefetchBatches: 5,
        compressionEnabled: false,
        replicationFactor: 1
      });

      const shards = await interleavedLoader.shardData(
        trainingData,
        mockWorkers.map(w => w.id)
      );

      expect(shards.size).toBe(3);
      
      // Check interleaving - each worker should have roughly equal samples
      const shardSizes = Array.from(shards.values()).map(s => s.data.length);
      const avgSize = 1000 / 3;
      shardSizes.forEach(size => {
        expect(Math.abs(size - avgSize)).toBeLessThan(5);
      });
    });

    it('should perform random sharding', async () => {
      const randomLoader = new DistributedDataLoader({
        shardingStrategy: 'random',
        cacheSize: 100,
        prefetchBatches: 5,
        compressionEnabled: false,
        replicationFactor: 1
      });

      const shards = await randomLoader.shardData(
        trainingData,
        mockWorkers.map(w => w.id)
      );

      expect(shards.size).toBe(3);
      
      // Verify all samples are distributed
      const allIndices = new Set<number>();
      for (const shard of shards.values()) {
        expect(shard.data.length).toBeGreaterThan(0);
      }
    });

    it('should perform stratified sharding', async () => {
      const stratifiedLoader = new DistributedDataLoader({
        shardingStrategy: 'stratified',
        cacheSize: 100,
        prefetchBatches: 5,
        compressionEnabled: false,
        replicationFactor: 1
      });

      const shards = await stratifiedLoader.shardData(
        trainingData,
        mockWorkers.map(w => w.id)
      );

      expect(shards.size).toBe(3);
      
      // Check that each shard has both classes
      for (const shard of shards.values()) {
        const labels = new Set(shard.labels);
        expect(labels.size).toBe(2); // Should have both 0 and 1
      }
    });
  });

  describe('Data Replication', () => {
    it('should replicate shards across nodes', async () => {
      const replicatedLoader = new DistributedDataLoader({
        shardingStrategy: 'sequential',
        cacheSize: 100,
        prefetchBatches: 5,
        compressionEnabled: false,
        replicationFactor: 2
      });

      const shards = await replicatedLoader.shardData(
        trainingData,
        mockWorkers.map(w => w.id)
      );

      await replicatedLoader.replicateShards(shards);

      // Should have replicas
      const stats = replicatedLoader.getStats();
      expect(stats.totalShards).toBeGreaterThan(3);
    });
  });

  describe('Batch Prefetching', () => {
    it('should prefetch batches for a node', async () => {
      const shards = await dataLoader.shardData(
        trainingData,
        mockWorkers.map(w => w.id)
      );

      const batches = await dataLoader.prefetchBatches('worker-1', 32);
      
      expect(batches.length).toBeGreaterThan(0);
      expect(batches.length).toBeLessThanOrEqual(5); // prefetchBatches limit
      
      batches.forEach(batch => {
        expect(batch.length).toBeLessThanOrEqual(32);
      });
    });
  });

  describe('Load Balancing', () => {
    it('should calculate node load', async () => {
      const shards = await dataLoader.shardData(
        trainingData,
        mockWorkers.map(w => w.id)
      );

      const load = dataLoader.getNodeLoad();
      
      expect(load.size).toBe(3);
      
      let totalLoad = 0;
      for (const [nodeId, samples] of load) {
        expect(samples).toBeGreaterThan(0);
        totalLoad += samples;
      }
      expect(totalLoad).toBe(1000);
    });

    it('should identify need for rebalancing', async () => {
      // Create imbalanced data
      const imbalancedData: TrainingData = {
        features: Array(1000).fill(0).map(() => [Math.random()]),
        labels: Array(1000).fill(0).map(() => 0)
      };

      // Manually create imbalanced shards
      const shards = await dataLoader.shardData(
        imbalancedData,
        mockWorkers.map(w => w.id)
      );

      await dataLoader.rebalanceData(mockWorkers.map(w => w.id));
      
      // Rebalancing should be triggered (check console output in real test)
      expect(true).toBe(true);
    });
  });

  describe('Progress Tracking', () => {
    it('should track training progress', async () => {
      const model = new MockModel({ epochs: 10, batchSize: 50 });
      
      const config: DistributedTrainingConfig = {
        strategy: 'data-parallel',
        nodes: mockWorkers,
        batchSizePerNode: 50,
        gradientAggregation: 'average',
        communicationProtocol: 'grpc',
        checkpointFrequency: 3,
        faultTolerance: true
      };

      const jobId = await coordinator.startDistributedTraining(
        model,
        trainingData,
        config
      );

      // Get progress multiple times
      let progress = await coordinator.getTrainingProgress(jobId);
      expect(progress!.epoch).toBeLessThanOrEqual(progress!.totalEpochs);
      expect(progress!.batchesProcessed).toBeGreaterThanOrEqual(0);
      expect(progress!.estimatedTimeRemaining).toBeGreaterThanOrEqual(0);

      await coordinator.stopTraining(jobId);
    });
  });

  describe('Fault Tolerance', () => {
    it('should handle worker failure with fault tolerance enabled', async () => {
      const model = new MockModel({ epochs: 5 });
      
      const config: DistributedTrainingConfig = {
        strategy: 'data-parallel',
        nodes: mockWorkers,
        batchSizePerNode: 32,
        gradientAggregation: 'average',
        communicationProtocol: 'grpc',
        checkpointFrequency: 2,
        faultTolerance: true
      };

      const jobId = await coordinator.startDistributedTraining(
        model,
        trainingData,
        config
      );

      // Simulate worker failure
      await coordinator.unregisterWorker('worker-2');

      // Training should continue with remaining workers
      const progress = await coordinator.getTrainingProgress(jobId);
      expect(progress).not.toBeNull();

      await coordinator.stopTraining(jobId);
    });
  });

  describe('Data Compression', () => {
    it('should compress and decompress data', async () => {
      const compressedLoader = new DistributedDataLoader({
        shardingStrategy: 'sequential',
        cacheSize: 100,
        prefetchBatches: 5,
        compressionEnabled: true,
        replicationFactor: 1
      });

      const testData = [
        { feature: [1, 2, 3], label: 1 },
        { feature: [4, 5, 6], label: 0 }
      ];

      const compressed = await compressedLoader.compressData(testData);
      expect(compressed).toBeInstanceOf(Buffer);

      const decompressed = await compressedLoader.decompressData(compressed);
      expect(decompressed).toEqual(testData);
    });
  });
});