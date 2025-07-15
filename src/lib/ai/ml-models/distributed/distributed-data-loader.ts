/**
 * Distributed Data Loader for efficient data distribution across training nodes
 */

import { TrainingData } from '../types';

export interface DataShard {
  shardId: string;
  nodeId: string;
  startIndex: number;
  endIndex: number;
  data: any[];
  labels: any[];
}

export interface DistributedDataConfig {
  shardingStrategy: 'sequential' | 'interleaved' | 'random' | 'stratified';
  cacheSize: number;
  prefetchBatches: number;
  compressionEnabled: boolean;
  replicationFactor: number;
}

export class DistributedDataLoader {
  private shards: Map<string, DataShard> = new Map();
  private nodeAssignments: Map<string, string[]> = new Map();
  private dataCache: Map<string, any> = new Map();

  constructor(private config: DistributedDataConfig) {}

  async shardData(
    data: TrainingData,
    nodeIds: string[]
  ): Promise<Map<string, DataShard>> {
    const totalSamples = data.features.length;
    const samplesPerNode = Math.ceil(totalSamples / nodeIds.length);

    const shards = new Map<string, DataShard>();

    switch (this.config.shardingStrategy) {
      case 'sequential':
        return this.sequentialSharding(data, nodeIds, samplesPerNode);
      
      case 'interleaved':
        return this.interleavedSharding(data, nodeIds);
      
      case 'random':
        return this.randomSharding(data, nodeIds, samplesPerNode);
      
      case 'stratified':
        return this.stratifiedSharding(data, nodeIds);
      
      default:
        return this.sequentialSharding(data, nodeIds, samplesPerNode);
    }
  }

  private sequentialSharding(
    data: TrainingData,
    nodeIds: string[],
    samplesPerNode: number
  ): Map<string, DataShard> {
    const shards = new Map<string, DataShard>();

    nodeIds.forEach((nodeId, idx) => {
      const startIndex = idx * samplesPerNode;
      const endIndex = Math.min((idx + 1) * samplesPerNode, data.features.length);
      
      const shardId = `shard-${nodeId}-${idx}`;
      const shard: DataShard = {
        shardId,
        nodeId,
        startIndex,
        endIndex,
        data: data.features.slice(startIndex, endIndex),
        labels: data.labels.slice(startIndex, endIndex)
      };

      shards.set(shardId, shard);
      this.shards.set(shardId, shard); // Also store in internal shards map
      this.addNodeAssignment(nodeId, shardId);
    });

    return shards;
  }

  private interleavedSharding(
    data: TrainingData,
    nodeIds: string[]
  ): Map<string, DataShard> {
    const shards = new Map<string, DataShard>();
    const nodeData: Map<string, { features: any[], labels: any[] }> = new Map();

    // Initialize node data
    nodeIds.forEach(nodeId => {
      nodeData.set(nodeId, { features: [], labels: [] });
    });

    // Interleave data across nodes
    data.features.forEach((feature, idx) => {
      const nodeIdx = idx % nodeIds.length;
      const nodeId = nodeIds[nodeIdx];
      const node = nodeData.get(nodeId)!;
      node.features.push(feature);
      node.labels.push(data.labels[idx]);
    });

    // Create shards
    nodeIds.forEach((nodeId, idx) => {
      const nodeDataItem = nodeData.get(nodeId)!;
      const shardId = `shard-${nodeId}-${idx}`;
      
      const shard: DataShard = {
        shardId,
        nodeId,
        startIndex: -1, // Not applicable for interleaved
        endIndex: -1,
        data: nodeDataItem.features,
        labels: nodeDataItem.labels
      };

      shards.set(shardId, shard);
      this.shards.set(shardId, shard); // Also store in internal shards map
      this.addNodeAssignment(nodeId, shardId);
    });

    return shards;
  }

  private randomSharding(
    data: TrainingData,
    nodeIds: string[],
    samplesPerNode: number
  ): Map<string, DataShard> {
    const shards = new Map<string, DataShard>();
    
    // Shuffle indices
    const indices = Array.from({ length: data.features.length }, (_, i) => i);
    this.shuffleArray(indices);

    // Distribute shuffled data
    nodeIds.forEach((nodeId, idx) => {
      const startIdx = idx * samplesPerNode;
      const endIdx = Math.min((idx + 1) * samplesPerNode, indices.length);
      const nodeIndices = indices.slice(startIdx, endIdx);

      const shardId = `shard-${nodeId}-${idx}`;
      const shard: DataShard = {
        shardId,
        nodeId,
        startIndex: -1,
        endIndex: -1,
        data: nodeIndices.map(i => data.features[i]),
        labels: nodeIndices.map(i => data.labels[i])
      };

      shards.set(shardId, shard);
      this.shards.set(shardId, shard); // Also store in internal shards map
      this.addNodeAssignment(nodeId, shardId);
    });

    return shards;
  }

  private stratifiedSharding(
    data: TrainingData,
    nodeIds: string[]
  ): Map<string, DataShard> {
    const shards = new Map<string, DataShard>();
    
    // Group by label
    const labelGroups = new Map<any, number[]>();
    data.labels.forEach((label, idx) => {
      const key = JSON.stringify(label);
      if (!labelGroups.has(key)) {
        labelGroups.set(key, []);
      }
      labelGroups.get(key)!.push(idx);
    });

    // Distribute each label group across nodes
    const nodeData: Map<string, { indices: number[] }> = new Map();
    nodeIds.forEach(nodeId => {
      nodeData.set(nodeId, { indices: [] });
    });

    let nodeIdx = 0;
    for (const [label, indices] of labelGroups) {
      // Distribute this label's samples across nodes
      indices.forEach(idx => {
        const nodeId = nodeIds[nodeIdx % nodeIds.length];
        nodeData.get(nodeId)!.indices.push(idx);
        nodeIdx++;
      });
    }

    // Create shards from distributed indices
    nodeIds.forEach((nodeId, idx) => {
      const indices = nodeData.get(nodeId)!.indices;
      const shardId = `shard-${nodeId}-${idx}`;
      
      const shard: DataShard = {
        shardId,
        nodeId,
        startIndex: -1,
        endIndex: -1,
        data: indices.map(i => data.features[i]),
        labels: indices.map(i => data.labels[i])
      };

      shards.set(shardId, shard);
      this.shards.set(shardId, shard); // Also store in internal shards map
      this.addNodeAssignment(nodeId, shardId);
    });

    return shards;
  }

  async replicateShards(shards: Map<string, DataShard>): Promise<void> {
    if (this.config.replicationFactor <= 1) return;

    // First, store the original shards
    for (const [shardId, shard] of shards) {
      this.shards.set(shardId, shard);
    }

    const nodeIds = Array.from(new Set(
      Array.from(shards.values()).map(s => s.nodeId)
    ));

    for (const [shardId, shard] of shards) {
      // Create replicas on other nodes
      for (let i = 1; i < this.config.replicationFactor; i++) {
        const replicaNodeIdx = (nodeIds.indexOf(shard.nodeId) + i) % nodeIds.length;
        const replicaNodeId = nodeIds[replicaNodeIdx];
        
        const replicaId = `${shardId}-replica-${i}`;
        const replica: DataShard = {
          ...shard,
          shardId: replicaId,
          nodeId: replicaNodeId
        };

        this.shards.set(replicaId, replica);
        this.addNodeAssignment(replicaNodeId, replicaId);
      }
    }
  }

  async prefetchBatches(nodeId: string, batchSize: number): Promise<any[][]> {
    const shardIds = this.nodeAssignments.get(nodeId) || [];
    const batches: any[][] = [];

    for (const shardId of shardIds) {
      const shard = this.shards.get(shardId);
      if (!shard) continue;

      // Create batches from shard
      for (let i = 0; i < shard.data.length; i += batchSize) {
        const batch = shard.data.slice(i, Math.min(i + batchSize, shard.data.length));
        batches.push(batch);

        // Limit prefetch
        if (batches.length >= this.config.prefetchBatches) {
          return batches;
        }
      }
    }

    return batches;
  }

  async compressData(data: any[]): Promise<Buffer> {
    if (!this.config.compressionEnabled) {
      return Buffer.from(JSON.stringify(data));
    }

    // Simulate compression (in real implementation, use zlib or similar)
    const jsonStr = JSON.stringify(data);
    return Buffer.from(jsonStr); // Would be compressed in real implementation
  }

  async decompressData(buffer: Buffer): Promise<any[]> {
    if (!this.config.compressionEnabled) {
      return JSON.parse(buffer.toString());
    }

    // Simulate decompression
    return JSON.parse(buffer.toString());
  }

  getNodeLoad(): Map<string, number> {
    const load = new Map<string, number>();
    
    for (const [nodeId, shardIds] of this.nodeAssignments) {
      let totalSamples = 0;
      for (const shardId of shardIds) {
        const shard = this.shards.get(shardId);
        if (shard) {
          totalSamples += shard.data.length;
        }
      }
      load.set(nodeId, totalSamples);
    }

    return load;
  }

  async rebalanceData(nodeIds: string[]): Promise<void> {
    const load = this.getNodeLoad();
    const totalSamples = Array.from(load.values()).reduce((sum, val) => sum + val, 0);
    const targetSamplesPerNode = Math.ceil(totalSamples / nodeIds.length);

    // Identify overloaded and underloaded nodes
    const overloaded: string[] = [];
    const underloaded: string[] = [];

    for (const [nodeId, samples] of load) {
      if (samples > targetSamplesPerNode * 1.1) {
        overloaded.push(nodeId);
      } else if (samples < targetSamplesPerNode * 0.9) {
        underloaded.push(nodeId);
      }
    }

    // Rebalance if needed
    if (overloaded.length > 0 && underloaded.length > 0) {
      console.log(`Rebalancing data: ${overloaded.length} overloaded, ${underloaded.length} underloaded nodes`);
      // Implementation would move shards from overloaded to underloaded nodes
    }
  }

  private addNodeAssignment(nodeId: string, shardId: string): void {
    if (!this.nodeAssignments.has(nodeId)) {
      this.nodeAssignments.set(nodeId, []);
    }
    this.nodeAssignments.get(nodeId)!.push(shardId);
  }

  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  clearCache(): void {
    this.dataCache.clear();
  }

  getStats(): {
    totalShards: number;
    totalNodes: number;
    avgSamplesPerNode: number;
    cacheSize: number;
  } {
    const load = this.getNodeLoad();
    const totalSamples = Array.from(load.values()).reduce((sum, val) => sum + val, 0);
    
    return {
      totalShards: this.shards.size,
      totalNodes: this.nodeAssignments.size,
      avgSamplesPerNode: this.nodeAssignments.size > 0 
        ? totalSamples / this.nodeAssignments.size 
        : 0,
      cacheSize: this.dataCache.size
    };
  }
}