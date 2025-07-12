/**
 * Model Registry Implementation
 * Manages model versioning and retrieval
 */

import { 
  ModelRegistry as IModelRegistry,
  TrainedModel,
  ModelMetrics,
  ModelType 
} from './types';

export class ModelRegistry implements IModelRegistry {
  private models: Map<string, TrainedModel> = new Map();
  private modelsByType: Map<ModelType, string[]> = new Map();

  /**
   * Register a new model
   */
  async register(model: TrainedModel, metrics: ModelMetrics): Promise<string> {
    const modelId = this.generateModelId(model.type);
    const versionedModel: TrainedModel = {
      ...model,
      id: modelId,
      version: this.generateVersion(model.type),
      metrics,
      createdAt: new Date()
    };
    
    // Store model
    this.models.set(modelId, versionedModel);
    
    // Update type index
    const typeModels = this.modelsByType.get(model.type) || [];
    typeModels.push(modelId);
    this.modelsByType.set(model.type, typeModels);
    
    return modelId;
  }

  /**
   * Get the latest model of a specific type
   */
  async getLatest(modelType: ModelType): Promise<TrainedModel | null> {
    const modelIds = this.modelsByType.get(modelType) || [];
    
    if (modelIds.length === 0) {
      return null;
    }
    
    // Get the most recent model
    const latestId = modelIds[modelIds.length - 1];
    return this.models.get(latestId) || null;
  }

  /**
   * Get all versions of a model type
   */
  async getAllVersions(modelType: ModelType): Promise<TrainedModel[]> {
    const modelIds = this.modelsByType.get(modelType) || [];
    const models: TrainedModel[] = [];
    
    for (const id of modelIds) {
      const model = this.models.get(id);
      if (model) {
        models.push(model);
      }
    }
    
    return models.sort((a, b) => 
      a.createdAt.getTime() - b.createdAt.getTime()
    );
  }

  /**
   * Get a specific model by ID
   */
  async getModel(modelId: string): Promise<TrainedModel | null> {
    return this.models.get(modelId) || null;
  }

  /**
   * Compare two model versions
   */
  async compareModels(modelId1: string, modelId2: string): Promise<{
    model1: TrainedModel;
    model2: TrainedModel;
    comparison: {
      accuracyDiff: number;
      maeDiff: number;
      performanceGain: number;
    };
  } | null> {
    const model1 = await this.getModel(modelId1);
    const model2 = await this.getModel(modelId2);
    
    if (!model1 || !model2) {
      return null;
    }
    
    const accuracyDiff = (model2.metrics.accuracy || 0) - (model1.metrics.accuracy || 0);
    const maeDiff = (model1.metrics.mae || 0) - (model2.metrics.mae || 0);
    const performanceGain = (accuracyDiff + maeDiff) / 2;
    
    return {
      model1,
      model2,
      comparison: {
        accuracyDiff,
        maeDiff,
        performanceGain
      }
    };
  }

  /**
   * Delete old model versions
   */
  async pruneOldVersions(modelType: ModelType, keepVersions: number = 5): Promise<void> {
    const modelIds = this.modelsByType.get(modelType) || [];
    
    if (modelIds.length <= keepVersions) {
      return;
    }
    
    const toDelete = modelIds.length - keepVersions;
    const deletedIds = modelIds.splice(0, toDelete);
    
    for (const id of deletedIds) {
      this.models.delete(id);
    }
  }

  /**
   * Generate unique model ID
   */
  private generateModelId(modelType: ModelType): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `${modelType}_${timestamp}_${random}`;
  }

  /**
   * Generate version string
   */
  private generateVersion(modelType: ModelType): string {
    const modelIds = this.modelsByType.get(modelType) || [];
    const versionNumber = modelIds.length + 1;
    const date = new Date().toISOString().split('T')[0];
    return `v${versionNumber}.0.0-${date}`;
  }

  /**
   * Get registry statistics
   */
  async getStats(): Promise<{
    totalModels: number;
    modelsByType: Record<string, number>;
    averageAccuracy: number;
  }> {
    const stats: Record<string, number> = {};
    let totalAccuracy = 0;
    let accuracyCount = 0;
    
    for (const [type, ids] of this.modelsByType.entries()) {
      stats[type] = ids.length;
      
      for (const id of ids) {
        const model = this.models.get(id);
        if (model?.metrics.accuracy) {
          totalAccuracy += model.metrics.accuracy;
          accuracyCount++;
        }
      }
    }
    
    return {
      totalModels: this.models.size,
      modelsByType: stats,
      averageAccuracy: accuracyCount > 0 ? totalAccuracy / accuracyCount : 0
    };
  }
}