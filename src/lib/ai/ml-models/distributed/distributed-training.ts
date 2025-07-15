/**
 * Stream B Day 31-32: Distributed Training System
 * Multi-node model training with data parallelism and model parallelism
 */

import { BaseModel } from '../base-model';
import { TrainingData, ModelConfig } from '../types';

export interface WorkerNode {
  id: string;
  host: string;
  port: number;
  status: 'idle' | 'training' | 'error' | 'offline';
  gpuCount?: number;
  memoryGB?: number;
  lastHeartbeat: Date;
}

export interface DistributedTrainingConfig {
  strategy: 'data-parallel' | 'model-parallel' | 'hybrid';
  nodes: WorkerNode[];
  batchSizePerNode: number;
  gradientAggregation: 'average' | 'sum' | 'weighted';
  communicationProtocol: 'grpc' | 'http' | 'nccl';
  checkpointFrequency: number;
  faultTolerance: boolean;
  asyncUpdates?: boolean;
}

export interface TrainingProgress {
  epoch: number;
  totalEpochs: number;
  batchesProcessed: number;
  totalBatches: number;
  loss: number;
  accuracy: number;
  nodesActive: number;
  estimatedTimeRemaining: number;
}

export class DistributedTrainingCoordinator {
  private workers: Map<string, WorkerNode> = new Map();
  private activeJobs: Map<string, DistributedTrainingJob> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startHeartbeatMonitoring();
  }

  private startHeartbeatMonitoring(): void {
    this.heartbeatInterval = setInterval(() => {
      this.checkWorkerHealth();
    }, 5000);
  }

  private checkWorkerHealth(): void {
    const now = new Date();
    for (const [id, worker] of this.workers) {
      const timeSinceHeartbeat = now.getTime() - worker.lastHeartbeat.getTime();
      if (timeSinceHeartbeat > 30000 && worker.status !== 'offline') {
        worker.status = 'offline';
        this.handleWorkerFailure(id);
      }
    }
  }

  async registerWorker(worker: WorkerNode): Promise<void> {
    worker.lastHeartbeat = new Date();
    this.workers.set(worker.id, worker);
  }

  async unregisterWorker(workerId: string): Promise<void> {
    this.workers.delete(workerId);
  }

  async startDistributedTraining(
    model: BaseModel,
    trainingData: TrainingData,
    config: DistributedTrainingConfig
  ): Promise<string> {
    const jobId = `dist-${Date.now()}`;
    
    // Validate workers
    const availableWorkers = this.getAvailableWorkers(config.nodes);
    if (availableWorkers.length < 2) {
      throw new Error('Distributed training requires at least 2 available workers');
    }

    // Create distributed training job
    const job = new DistributedTrainingJob(
      jobId,
      model,
      trainingData,
      config,
      availableWorkers
    );

    this.activeJobs.set(jobId, job);

    // Start training
    await job.start();

    return jobId;
  }

  async getTrainingProgress(jobId: string): Promise<TrainingProgress | null> {
    const job = this.activeJobs.get(jobId);
    return job ? job.getProgress() : null;
  }

  async stopTraining(jobId: string): Promise<void> {
    const job = this.activeJobs.get(jobId);
    if (job) {
      await job.stop();
      this.activeJobs.delete(jobId);
    }
  }

  private getAvailableWorkers(requestedNodes: WorkerNode[]): WorkerNode[] {
    return requestedNodes.filter(node => {
      const worker = this.workers.get(node.id);
      return worker && worker.status === 'idle';
    });
  }

  private async handleWorkerFailure(workerId: string): Promise<void> {
    // Find jobs affected by worker failure
    for (const [jobId, job] of this.activeJobs) {
      if (job.hasWorker(workerId)) {
        await job.handleWorkerFailure(workerId);
      }
    }
  }

  cleanup(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
  }
}

export class DistributedTrainingJob {
  private progress: TrainingProgress;
  private workerTasks: Map<string, WorkerTask> = new Map();
  private checkpoints: ModelCheckpoint[] = [];
  private isRunning = false;

  constructor(
    private jobId: string,
    private model: BaseModel,
    private trainingData: TrainingData,
    private config: DistributedTrainingConfig,
    private workers: WorkerNode[]
  ) {
    this.progress = {
      epoch: 0,
      totalEpochs: model.config.epochs || 100,
      batchesProcessed: 0,
      totalBatches: Math.ceil(trainingData.features.length / config.batchSizePerNode),
      loss: 0,
      accuracy: 0,
      nodesActive: workers.length,
      estimatedTimeRemaining: 0
    };
  }

  async start(): Promise<void> {
    this.isRunning = true;

    try {
      // Initialize workers
      await this.initializeWorkers();

      // Distribute model to workers
      await this.distributeModel();

      // Start training loop
      await this.runTrainingLoop();
    } catch (error) {
      this.isRunning = false;
      throw error;
    }
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    
    // Stop all worker tasks
    for (const task of this.workerTasks.values()) {
      await task.stop();
    }
  }

  getProgress(): TrainingProgress {
    return { ...this.progress };
  }

  hasWorker(workerId: string): boolean {
    return this.workerTasks.has(workerId);
  }

  async handleWorkerFailure(workerId: string): Promise<void> {
    if (!this.config.faultTolerance) {
      // Stop entire job if fault tolerance is disabled
      await this.stop();
      return;
    }

    // Remove failed worker
    this.workerTasks.delete(workerId);
    this.progress.nodesActive--;

    // Redistribute work to remaining workers
    if (this.progress.nodesActive > 0) {
      await this.redistributeWork();
    } else {
      await this.stop();
    }
  }

  private async initializeWorkers(): Promise<void> {
    for (const worker of this.workers) {
      const task = new WorkerTask(worker, this.config);
      await task.initialize();
      this.workerTasks.set(worker.id, task);
    }
  }

  private async distributeModel(): Promise<void> {
    const modelData = await this.model.serialize();

    if (this.config.strategy === 'data-parallel') {
      // Send full model to each worker
      for (const task of this.workerTasks.values()) {
        await task.loadModel(modelData);
      }
    } else if (this.config.strategy === 'model-parallel') {
      // Split model across workers
      const modelParts = this.splitModel(modelData, this.workers.length);
      let i = 0;
      for (const task of this.workerTasks.values()) {
        await task.loadModelPart(modelParts[i], i, modelParts.length);
        i++;
      }
    }
  }

  private async runTrainingLoop(): Promise<void> {
    const startTime = Date.now();

    for (let epoch = 0; epoch < this.progress.totalEpochs && this.isRunning; epoch++) {
      this.progress.epoch = epoch + 1;

      // Shuffle and distribute data
      const dataBatches = this.createDataBatches();
      
      // Train on batches
      for (let batchIdx = 0; batchIdx < dataBatches.length && this.isRunning; batchIdx++) {
        await this.trainBatch(dataBatches[batchIdx], batchIdx);
        this.progress.batchesProcessed++;

        // Update time estimate
        const elapsedTime = Date.now() - startTime;
        const progressRatio = this.progress.batchesProcessed / (this.progress.totalBatches * this.progress.totalEpochs);
        this.progress.estimatedTimeRemaining = progressRatio > 0 
          ? (elapsedTime / progressRatio) - elapsedTime 
          : 0;
      }

      // Checkpoint if needed
      if (epoch % this.config.checkpointFrequency === 0) {
        await this.saveCheckpoint(epoch);
      }
    }
  }

  private createDataBatches(): any[][] {
    const batchSize = this.config.batchSizePerNode * this.workers.length;
    const batches: any[][] = [];

    for (let i = 0; i < this.trainingData.features.length; i += batchSize) {
      batches.push(
        this.trainingData.features.slice(i, i + batchSize)
      );
    }

    return batches;
  }

  private async trainBatch(batch: any[], batchIdx: number): Promise<void> {
    const workerBatches = this.splitBatchForWorkers(batch);
    const gradients: any[] = [];

    // Send batches to workers and collect gradients
    const promises = Array.from(this.workerTasks.entries()).map(async ([workerId, task], idx) => {
      if (idx < workerBatches.length) {
        const gradient = await task.computeGradient(workerBatches[idx], batchIdx);
        return { workerId, gradient };
      }
      return null;
    });

    const results = await Promise.all(promises);

    // Aggregate gradients
    for (const result of results) {
      if (result) {
        gradients.push(result.gradient);
      }
    }

    const aggregatedGradient = this.aggregateGradients(gradients);

    // Apply gradient updates
    for (const task of this.workerTasks.values()) {
      await task.applyGradient(aggregatedGradient);
    }

    // Update progress metrics
    if (gradients.length > 0) {
      this.progress.loss = gradients.reduce((sum, g) => sum + g.loss, 0) / gradients.length;
      this.progress.accuracy = gradients.reduce((sum, g) => sum + g.accuracy, 0) / gradients.length;
    }
  }

  private splitBatchForWorkers(batch: any[]): any[][] {
    const workerCount = this.workerTasks.size;
    const batchesPerWorker = Math.ceil(batch.length / workerCount);
    const workerBatches: any[][] = [];

    for (let i = 0; i < workerCount; i++) {
      const start = i * batchesPerWorker;
      const end = Math.min(start + batchesPerWorker, batch.length);
      if (start < batch.length) {
        workerBatches.push(batch.slice(start, end));
      }
    }

    return workerBatches;
  }

  private aggregateGradients(gradients: any[]): any {
    if (this.config.gradientAggregation === 'average') {
      // Average gradients across workers
      const aggregated = { ...gradients[0] };
      for (let i = 1; i < gradients.length; i++) {
        for (const key in aggregated) {
          if (typeof aggregated[key] === 'number') {
            aggregated[key] += gradients[i][key];
          }
        }
      }
      for (const key in aggregated) {
        if (typeof aggregated[key] === 'number') {
          aggregated[key] /= gradients.length;
        }
      }
      return aggregated;
    } else if (this.config.gradientAggregation === 'sum') {
      // Sum gradients
      const aggregated = { ...gradients[0] };
      for (let i = 1; i < gradients.length; i++) {
        for (const key in aggregated) {
          if (typeof aggregated[key] === 'number') {
            aggregated[key] += gradients[i][key];
          }
        }
      }
      return aggregated;
    } else {
      // Weighted aggregation based on batch sizes
      // Implementation would depend on actual gradient structure
      return gradients[0];
    }
  }

  private splitModel(modelData: any, parts: number): any[] {
    // Simplified model splitting - actual implementation would depend on model architecture
    const modelParts: any[] = [];
    for (let i = 0; i < parts; i++) {
      modelParts.push({
        ...modelData,
        partIndex: i,
        totalParts: parts
      });
    }
    return modelParts;
  }

  private async saveCheckpoint(epoch: number): Promise<void> {
    const checkpoint: ModelCheckpoint = {
      epoch,
      timestamp: new Date(),
      modelState: await this.collectModelState(),
      metrics: {
        loss: this.progress.loss,
        accuracy: this.progress.accuracy
      }
    };

    this.checkpoints.push(checkpoint);

    // Keep only last 5 checkpoints
    if (this.checkpoints.length > 5) {
      this.checkpoints.shift();
    }
  }

  private async collectModelState(): Promise<any> {
    // Collect model state from primary worker
    const primaryTask = this.workerTasks.values().next().value;
    return primaryTask ? await primaryTask.getModelState() : null;
  }

  private async redistributeWork(): Promise<void> {
    // Redistribute failed worker's tasks to remaining workers
    // This is a simplified implementation
    console.log(`Redistributing work among ${this.progress.nodesActive} remaining workers`);
  }
}

class WorkerTask {
  private modelState: any = null;

  constructor(
    private worker: WorkerNode,
    private config: DistributedTrainingConfig
  ) {}

  async initialize(): Promise<void> {
    // Initialize connection to worker
    // In real implementation, this would establish gRPC/HTTP connection
    console.log(`Initializing worker ${this.worker.id} at ${this.worker.host}:${this.worker.port}`);
  }

  async loadModel(modelData: any): Promise<void> {
    this.modelState = modelData;
    // Send model to worker
  }

  async loadModelPart(modelPart: any, partIndex: number, totalParts: number): Promise<void> {
    this.modelState = modelPart;
    // Send model part to worker
  }

  async computeGradient(batch: any[], batchIdx: number): Promise<any> {
    // Simulate gradient computation
    return {
      gradients: {},
      loss: Math.random() * 0.5,
      accuracy: 0.8 + Math.random() * 0.2,
      batchSize: batch.length
    };
  }

  async applyGradient(gradient: any): Promise<void> {
    // Apply gradient update to model
  }

  async getModelState(): Promise<any> {
    return this.modelState;
  }

  async stop(): Promise<void> {
    // Clean up worker connection
  }
}

interface ModelCheckpoint {
  epoch: number;
  timestamp: Date;
  modelState: any;
  metrics: {
    loss: number;
    accuracy: number;
  };
}

// Export singleton coordinator
export const distributedTrainingCoordinator = new DistributedTrainingCoordinator();