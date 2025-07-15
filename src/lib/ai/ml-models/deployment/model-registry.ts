/**
 * Model Registry for Production ML Deployment
 * Manages model versions, artifacts, and deployment lifecycle
 */

import { createClient } from '@supabase/supabase-js';

export interface ModelVersion {
  id: string;
  modelId: string;
  version: string;
  framework: 'tensorflow' | 'pytorch' | 'onnx' | 'sklearn';
  artifacts: {
    modelPath: string;
    weightsPath?: string;
    configPath?: string;
    preprocessorPath?: string;
  };
  metadata: {
    createdAt: Date;
    createdBy: string;
    description?: string;
    metrics?: Record<string, number>;
    tags?: string[];
    datasetVersion?: string;
    trainingConfig?: any;
  };
  status: 'training' | 'validating' | 'ready' | 'deployed' | 'deprecated' | 'failed';
  deployments: Deployment[];
}

export interface Deployment {
  id: string;
  environment: 'dev' | 'staging' | 'production';
  status: 'pending' | 'deploying' | 'active' | 'failed' | 'terminated';
  endpoint?: string;
  replicas: number;
  createdAt: Date;
  updatedAt: Date;
  metrics?: {
    requestCount: number;
    errorRate: number;
    avgLatency: number;
    lastUpdated: Date;
  };
}

export interface ModelMetadata {
  inputSchema: {
    type: string;
    shape?: number[];
    features?: Array<{
      name: string;
      type: 'numeric' | 'categorical' | 'text' | 'image';
      preprocessing?: string;
    }>;
  };
  outputSchema: {
    type: string;
    shape?: number[];
    classes?: string[];
    range?: { min: number; max: number };
  };
  requirements: {
    minMemory: string;
    recommendedMemory: string;
    gpu?: boolean;
    dependencies?: string[];
  };
  performance: {
    inferenceTime: number; // ms
    throughput: number; // requests/sec
    accuracy?: number;
    f1Score?: number;
  };
}

export class ModelRegistry {
  private supabase: ReturnType<typeof createClient>;
  private cache: Map<string, ModelVersion> = new Map();

  constructor() {
    this.supabase = createClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env.SUPABASE_SERVICE_KEY!
    );
  }

  /**
   * Register a new model version
   */
  async registerModel(
    model: Omit<ModelVersion, 'id' | 'deployments'>
  ): Promise<string> {
    try {
      // Validate model artifacts exist
      await this.validateArtifacts(model.artifacts);

      // Store in database
      const { data, error } = await this.supabase
        .from('ml_model_versions')
        .insert({
          model_id: model.modelId,
          version: model.version,
          framework: model.framework,
          artifacts: model.artifacts,
          metadata: model.metadata,
          status: model.status
        })
        .select()
        .single();

      if (error) throw error;

      // Update cache
      this.cache.set(data.id, { ...model, id: data.id, deployments: [] });

      // Trigger validation if ready
      if (model.status === 'ready') {
        await this.validateModel(data.id);
      }

      return data.id;

    } catch (error) {
      console.error('Error registering model:', error);
      throw error;
    }
  }

  /**
   * Get model version details
   */
  async getModelVersion(
    modelId: string,
    version?: string
  ): Promise<ModelVersion | null> {
    try {
      // Check cache first
      const cacheKey = version ? `${modelId}:${version}` : modelId;
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey)!;
      }

      // Query database
      let query = this.supabase
        .from('ml_model_versions')
        .select(`
          *,
          deployments:ml_deployments(*)
        `)
        .eq('model_id', modelId);

      if (version) {
        query = query.eq('version', version);
      } else {
        // Get latest version
        query = query.order('created_at', { ascending: false }).limit(1);
      }

      const { data, error } = await query.single();

      if (error || !data) return null;

      const modelVersion = this.mapToModelVersion(data);
      this.cache.set(cacheKey, modelVersion);

      return modelVersion;

    } catch (error) {
      console.error('Error getting model version:', error);
      return null;
    }
  }

  /**
   * List all versions of a model
   */
  async listModelVersions(
    modelId: string,
    filters?: {
      status?: ModelVersion['status'];
      limit?: number;
    }
  ): Promise<ModelVersion[]> {
    try {
      let query = this.supabase
        .from('ml_model_versions')
        .select(`
          *,
          deployments:ml_deployments(*)
        `)
        .eq('model_id', modelId)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(this.mapToModelVersion);

    } catch (error) {
      console.error('Error listing model versions:', error);
      return [];
    }
  }

  /**
   * Deploy a model version
   */
  async deployModel(
    versionId: string,
    environment: Deployment['environment'],
    config?: {
      replicas?: number;
      endpoint?: string;
    }
  ): Promise<string> {
    try {
      // Get model version
      const modelVersion = await this.getModelVersionById(versionId);
      if (!modelVersion) {
        throw new Error('Model version not found');
      }

      if (modelVersion.status !== 'ready') {
        throw new Error('Model must be in ready status to deploy');
      }

      // Create deployment record
      const { data: deployment, error } = await this.supabase
        .from('ml_deployments')
        .insert({
          model_version_id: versionId,
          environment,
          status: 'pending',
          replicas: config?.replicas || 1,
          endpoint: config?.endpoint,
          created_at: new Date(),
          updated_at: new Date()
        })
        .select()
        .single();

      if (error) throw error;

      // Trigger deployment pipeline
      await this.triggerDeployment(deployment.id, modelVersion, environment);

      return deployment.id;

    } catch (error) {
      console.error('Error deploying model:', error);
      throw error;
    }
  }

  /**
   * Update deployment status
   */
  async updateDeploymentStatus(
    deploymentId: string,
    status: Deployment['status'],
    metrics?: Deployment['metrics']
  ): Promise<void> {
    try {
      const updates: any = {
        status,
        updated_at: new Date()
      };

      if (metrics) {
        updates.metrics = metrics;
      }

      await this.supabase
        .from('ml_deployments')
        .update(updates)
        .eq('id', deploymentId);

    } catch (error) {
      console.error('Error updating deployment status:', error);
      throw error;
    }
  }

  /**
   * Promote model version between environments
   */
  async promoteModel(
    deploymentId: string,
    targetEnvironment: Deployment['environment']
  ): Promise<string> {
    try {
      // Get current deployment
      const { data: deployment } = await this.supabase
        .from('ml_deployments')
        .select('*, model_version:ml_model_versions(*)')
        .eq('id', deploymentId)
        .single();

      if (!deployment) {
        throw new Error('Deployment not found');
      }

      if (deployment.status !== 'active') {
        throw new Error('Only active deployments can be promoted');
      }

      // Check promotion path
      const validPromotions = {
        'dev': ['staging'],
        'staging': ['production'],
        'production': []
      };

      if (!validPromotions[deployment.environment].includes(targetEnvironment)) {
        throw new Error(`Cannot promote from ${deployment.environment} to ${targetEnvironment}`);
      }

      // Create new deployment in target environment
      return await this.deployModel(
        deployment.model_version_id,
        targetEnvironment,
        {
          replicas: deployment.replicas,
          endpoint: deployment.endpoint
        }
      );

    } catch (error) {
      console.error('Error promoting model:', error);
      throw error;
    }
  }

  /**
   * Rollback to previous model version
   */
  async rollbackDeployment(
    modelId: string,
    environment: Deployment['environment']
  ): Promise<string> {
    try {
      // Find previous active deployment
      const { data: deployments } = await this.supabase
        .from('ml_deployments')
        .select('*, model_version:ml_model_versions(*)')
        .eq('environment', environment)
        .eq('model_version.model_id', modelId)
        .order('created_at', { ascending: false })
        .limit(2);

      if (!deployments || deployments.length < 2) {
        throw new Error('No previous deployment found for rollback');
      }

      const previousDeployment = deployments[1];

      // Deploy previous version
      return await this.deployModel(
        previousDeployment.model_version_id,
        environment,
        {
          replicas: previousDeployment.replicas
        }
      );

    } catch (error) {
      console.error('Error rolling back deployment:', error);
      throw error;
    }
  }

  /**
   * Get deployment metrics
   */
  async getDeploymentMetrics(
    deploymentId: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<{
    requests: Array<{ timestamp: Date; count: number }>;
    latency: Array<{ timestamp: Date; p50: number; p95: number; p99: number }>;
    errors: Array<{ timestamp: Date; count: number; rate: number }>;
    resources: Array<{ timestamp: Date; cpu: number; memory: number }>;
  }> {
    try {
      // Query metrics from time-series database
      const metrics = await this.queryMetrics(deploymentId, timeRange);

      return {
        requests: metrics.requests || [],
        latency: metrics.latency || [],
        errors: metrics.errors || [],
        resources: metrics.resources || []
      };

    } catch (error) {
      console.error('Error getting deployment metrics:', error);
      return {
        requests: [],
        latency: [],
        errors: [],
        resources: []
      };
    }
  }

  /**
   * A/B test between model versions
   */
  async createABTest(
    modelId: string,
    config: {
      versionA: string;
      versionB: string;
      trafficSplit: number; // Percentage to version B
      duration: string;
      successMetrics: string[];
    }
  ): Promise<string> {
    try {
      const { data: abTest, error } = await this.supabase
        .from('ml_ab_tests')
        .insert({
          model_id: modelId,
          version_a: config.versionA,
          version_b: config.versionB,
          traffic_split: config.trafficSplit,
          duration: config.duration,
          success_metrics: config.successMetrics,
          status: 'active',
          created_at: new Date()
        })
        .select()
        .single();

      if (error) throw error;

      // Configure traffic routing
      await this.configureABTraffic(abTest.id, config);

      return abTest.id;

    } catch (error) {
      console.error('Error creating A/B test:', error);
      throw error;
    }
  }

  // Private helper methods

  private async validateArtifacts(artifacts: ModelVersion['artifacts']): Promise<void> {
    // Check if artifacts exist in storage
    const paths = [
      artifacts.modelPath,
      artifacts.weightsPath,
      artifacts.configPath,
      artifacts.preprocessorPath
    ].filter(Boolean);

    for (const path of paths) {
      const exists = await this.checkArtifactExists(path!);
      if (!exists) {
        throw new Error(`Artifact not found: ${path}`);
      }
    }
  }

  private async checkArtifactExists(path: string): Promise<boolean> {
    // Check in object storage
    try {
      const { data, error } = await this.supabase.storage
        .from('ml-artifacts')
        .list(path);

      return !error && data.length > 0;
    } catch {
      return false;
    }
  }

  private async validateModel(versionId: string): Promise<void> {
    // Run model validation pipeline
    console.log(`Validating model version ${versionId}`);
    
    // Update status after validation
    await this.supabase
      .from('ml_model_versions')
      .update({ status: 'ready' })
      .eq('id', versionId);
  }

  private async triggerDeployment(
    deploymentId: string,
    modelVersion: ModelVersion,
    environment: string
  ): Promise<void> {
    // Trigger deployment pipeline (e.g., Kubernetes, cloud provider)
    console.log(`Triggering deployment ${deploymentId} for model ${modelVersion.modelId} to ${environment}`);
    
    // Simulate deployment
    await this.updateDeploymentStatus(deploymentId, 'deploying');
    
    setTimeout(async () => {
      await this.updateDeploymentStatus(deploymentId, 'active', {
        requestCount: 0,
        errorRate: 0,
        avgLatency: 0,
        lastUpdated: new Date()
      });
    }, 5000);
  }

  private async getModelVersionById(versionId: string): Promise<ModelVersion | null> {
    const { data } = await this.supabase
      .from('ml_model_versions')
      .select('*')
      .eq('id', versionId)
      .single();

    return data ? this.mapToModelVersion(data) : null;
  }

  private mapToModelVersion(data: any): ModelVersion {
    return {
      id: data.id,
      modelId: data.model_id,
      version: data.version,
      framework: data.framework,
      artifacts: data.artifacts,
      metadata: {
        ...data.metadata,
        createdAt: new Date(data.created_at)
      },
      status: data.status,
      deployments: data.deployments || []
    };
  }

  private async queryMetrics(
    deploymentId: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<any> {
    // Query from metrics store (e.g., Prometheus, CloudWatch)
    return {
      requests: [],
      latency: [],
      errors: [],
      resources: []
    };
  }

  private async configureABTraffic(
    testId: string,
    config: any
  ): Promise<void> {
    // Configure load balancer or service mesh for A/B traffic split
    console.log(`Configuring A/B test ${testId} with ${config.trafficSplit}% to version B`);
  }
}