/**
 * Base Model class for all ML models
 */

import { TrainingData, ModelConfig } from './types';

export abstract class BaseModel {
  protected config: ModelConfig;
  protected isInitialized: boolean = false;
  protected metadata: Record<string, any> = {};

  constructor(config: ModelConfig = {}) {
    this.config = {
      epochs: config.epochs || 100,
      batchSize: config.batchSize || 32,
      learningRate: config.learningRate || 0.001,
      ...config
    };
  }

  abstract getModelName(): string;
  abstract train(data: TrainingData): Promise<void>;
  abstract predict(input: any): Promise<any>;
  abstract serialize(): Promise<any>;
  abstract deserialize(data: any): Promise<void>;

  async initialize(): Promise<void> {
    this.isInitialized = true;
  }

  getConfig(): ModelConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<ModelConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getMetadata(): Record<string, any> {
    return { ...this.metadata };
  }

  setMetadata(key: string, value: any): void {
    this.metadata[key] = value;
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}