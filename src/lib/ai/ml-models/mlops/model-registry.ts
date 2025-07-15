/**
 * Model Registry
 * Centralized model versioning and metadata management
 */

export interface ModelVersion {
  id: string;
  modelId: string;
  version: string;
  metadata: {
    framework: 'tensorflow' | 'pytorch' | 'onnx' | 'sklearn';
    algorithm: string;
    performance: {
      accuracy: number;
      precision: number;
      recall: number;
      f1Score: number;
    };
    trainingData: {
      size: number;
      features: string[];
      labels: string[];
    };
    hyperparameters: Record<string, any>;
  };
  artifactPath: string;
  createdAt: Date;
  createdBy: string;
  status: 'training' | 'validation' | 'production' | 'archived';
  tags: string[];
}

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  type: 'classification' | 'regression' | 'clustering' | 'anomaly_detection';
  domain: 'emissions' | 'energy' | 'compliance' | 'sustainability';
  versions: ModelVersion[];
  currentVersion: string;
  owner: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ModelRegistry {
  private models: Map<string, ModelInfo> = new Map();
  private versions: Map<string, ModelVersion> = new Map();

  async registerModel(model: Omit<ModelInfo, 'id' | 'versions' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const modelId = `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const modelInfo: ModelInfo = {
      ...model,
      id: modelId,
      versions: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.models.set(modelId, modelInfo);
    return modelId;
  }

  async registerVersion(
    modelId: string, 
    version: Omit<ModelVersion, 'id' | 'modelId' | 'createdAt'>
  ): Promise<string> {
    const versionId = `${modelId}_v${version.version}`;
    
    const modelVersion: ModelVersion = {
      ...version,
      id: versionId,
      modelId,
      createdAt: new Date()
    };

    this.versions.set(versionId, modelVersion);

    // Update model info
    const model = this.models.get(modelId);
    if (model) {
      model.versions.push(modelVersion);
      model.updatedAt = new Date();
      this.models.set(modelId, model);
    }

    return versionId;
  }

  async getModel(modelId: string): Promise<ModelInfo | null> {
    return this.models.get(modelId) || null;
  }

  async getVersion(versionId: string): Promise<ModelVersion | null> {
    return this.versions.get(versionId) || null;
  }

  async listModels(filters?: {
    type?: string;
    domain?: string;
    owner?: string;
    tags?: string[];
  }): Promise<ModelInfo[]> {
    let models = Array.from(this.models.values());

    if (filters) {
      if (filters.type) {
        models = models.filter(m => m.type === filters.type);
      }
      if (filters.domain) {
        models = models.filter(m => m.domain === filters.domain);
      }
      if (filters.owner) {
        models = models.filter(m => m.owner === filters.owner);
      }
      if (filters.tags) {
        models = models.filter(m => 
          m.versions.some(v => 
            filters.tags!.some(tag => v.tags.includes(tag))
          )
        );
      }
    }

    return models;
  }

  async promoteVersion(versionId: string, status: 'production' | 'archived'): Promise<void> {
    const version = this.versions.get(versionId);
    if (!version) {
      throw new Error(`Version ${versionId} not found`);
    }

    version.status = status;
    this.versions.set(versionId, version);

    // Update current version if promoting to production
    if (status === 'production') {
      const model = this.models.get(version.modelId);
      if (model) {
        model.currentVersion = version.version;
        model.updatedAt = new Date();
        this.models.set(version.modelId, model);
      }
    }
  }

  async deleteModel(modelId: string): Promise<void> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    // Delete all versions
    for (const version of model.versions) {
      this.versions.delete(version.id);
    }

    // Delete model
    this.models.delete(modelId);
  }

  async getModelMetrics(modelId: string): Promise<any> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    const productionVersion = model.versions.find(v => v.status === 'production');
    const allVersions = model.versions;

    return {
      totalVersions: allVersions.length,
      currentVersion: productionVersion?.version || 'none',
      averageAccuracy: allVersions.length > 0 
        ? allVersions.reduce((sum, v) => sum + v.metadata.performance.accuracy, 0) / allVersions.length 
        : 0,
      latestUpdate: model.updatedAt,
      status: productionVersion ? 'deployed' : 'development'
    };
  }
}