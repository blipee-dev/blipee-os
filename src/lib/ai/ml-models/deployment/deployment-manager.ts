/**
 * ML Deployment Manager
 * Orchestrates model deployment, scaling, and lifecycle management
 */

import { ModelRegistry, ModelVersion } from './model-registry';
import { ProductionDeploymentConfig, validateDeploymentConfig, generateK8sManifests, PRODUCTION_PRESETS } from './production-config';
import { ModelServer } from '../serving/model-server';
import { MonitoringService } from '../mlops/monitoring';

export interface DeploymentRequest {
  modelId: string;
  version?: string;
  environment: 'dev' | 'staging' | 'production';
  preset?: keyof typeof PRODUCTION_PRESETS;
  customConfig?: Partial<ProductionDeploymentConfig>;
  autoScale?: boolean;
  monitoring?: boolean;
}

export interface DeploymentStatus {
  deploymentId: string;
  status: 'pending' | 'deploying' | 'running' | 'failed' | 'stopped';
  endpoint?: string;
  health: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    lastCheck: Date;
    details?: any;
  };
  metrics?: {
    requestRate: number;
    errorRate: number;
    avgLatency: number;
    p95Latency: number;
    p99Latency: number;
  };
  replicas: {
    current: number;
    desired: number;
    ready: number;
  };
}

export class DeploymentManager {
  private registry: ModelRegistry;
  private modelServer: ModelServer;
  private monitoring: MonitoringService;
  private activeDeployments: Map<string, DeploymentStatus> = new Map();

  constructor() {
    this.registry = new ModelRegistry();
    this.modelServer = new ModelServer();
    this.monitoring = new MonitoringService();
  }

  /**
   * Deploy a model to production
   */
  async deployModel(request: DeploymentRequest): Promise<string> {
    try {
      console.log(`🚀 Starting deployment for model ${request.modelId}`);

      // 1. Get model version
      const modelVersion = await this.registry.getModelVersion(
        request.modelId,
        request.version
      );

      if (!modelVersion) {
        throw new Error('Model version not found');
      }

      if (modelVersion.status !== 'ready') {
        throw new Error(`Model status is ${modelVersion.status}, must be 'ready' to deploy`);
      }

      // 2. Create deployment configuration
      const config = this.createDeploymentConfig(modelVersion, request);

      // 3. Validate configuration
      const validation = validateDeploymentConfig(config);
      if (!validation.valid) {
        throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
      }

      // 4. Create deployment in registry
      const deploymentId = await this.registry.deployModel(
        modelVersion.id,
        request.environment,
        {
          replicas: config.serving.replicas.target,
          endpoint: this.generateEndpoint(modelVersion, request.environment)
        }
      );

      // 5. Deploy to infrastructure
      await this.deployToInfrastructure(deploymentId, modelVersion, config);

      // 6. Setup monitoring if enabled
      if (request.monitoring) {
        await this.setupMonitoring(deploymentId, config);
      }

      // 7. Initialize deployment status
      this.activeDeployments.set(deploymentId, {
        deploymentId,
        status: 'deploying',
        health: {
          status: 'unhealthy',
          lastCheck: new Date()
        },
        replicas: {
          current: 0,
          desired: config.serving.replicas.target,
          ready: 0
        }
      });

      // 8. Start health monitoring
      this.startHealthMonitoring(deploymentId);

      console.log(`✅ Deployment ${deploymentId} initiated successfully`);
      return deploymentId;

    } catch (error) {
      console.error('Deployment failed:', error);
      throw error;
    }
  }

  /**
   * Get deployment status
   */
  async getDeploymentStatus(deploymentId: string): Promise<DeploymentStatus | null> {
    // Check cache first
    if (this.activeDeployments.has(deploymentId)) {
      return this.activeDeployments.get(deploymentId)!;
    }

    // Query from infrastructure
    try {
      const status = await this.queryDeploymentStatus(deploymentId);
      if (status) {
        this.activeDeployments.set(deploymentId, status);
      }
      return status;
    } catch (error) {
      console.error('Error getting deployment status:', error);
      return null;
    }
  }

  /**
   * Scale deployment
   */
  async scaleDeployment(
    deploymentId: string,
    replicas: number
  ): Promise<void> {
    try {
      const status = await this.getDeploymentStatus(deploymentId);
      if (!status) {
        throw new Error('Deployment not found');
      }

      if (status.status !== 'running') {
        throw new Error('Can only scale running deployments');
      }

      // Update desired replicas
      await this.updateReplicas(deploymentId, replicas);

      // Update status
      status.replicas.desired = replicas;
      this.activeDeployments.set(deploymentId, status);

      console.log(`📊 Scaling deployment ${deploymentId} to ${replicas} replicas`);

    } catch (error) {
      console.error('Error scaling deployment:', error);
      throw error;
    }
  }

  /**
   * Stop deployment
   */
  async stopDeployment(deploymentId: string): Promise<void> {
    try {
      const status = await this.getDeploymentStatus(deploymentId);
      if (!status) {
        throw new Error('Deployment not found');
      }

      // Stop infrastructure resources
      await this.stopInfrastructure(deploymentId);

      // Update registry
      await this.registry.updateDeploymentStatus(deploymentId, 'terminated');

      // Update local status
      status.status = 'stopped';
      status.replicas = { current: 0, desired: 0, ready: 0 };
      this.activeDeployments.set(deploymentId, status);

      console.log(`🛑 Deployment ${deploymentId} stopped`);

    } catch (error) {
      console.error('Error stopping deployment:', error);
      throw error;
    }
  }

  /**
   * Promote deployment to next environment
   */
  async promoteDeployment(
    deploymentId: string,
    targetEnvironment: 'staging' | 'production'
  ): Promise<string> {
    try {
      console.log(`📤 Promoting deployment ${deploymentId} to ${targetEnvironment}`);

      // Get current deployment info
      const status = await this.getDeploymentStatus(deploymentId);
      if (!status) {
        throw new Error('Deployment not found');
      }

      if (status.status !== 'running') {
        throw new Error('Can only promote running deployments');
      }

      // Check health
      if (status.health.status !== 'healthy') {
        throw new Error('Can only promote healthy deployments');
      }

      // Promote via registry
      const newDeploymentId = await this.registry.promoteModel(
        deploymentId,
        targetEnvironment
      );

      console.log(`✅ Promoted to ${targetEnvironment} as deployment ${newDeploymentId}`);
      return newDeploymentId;

    } catch (error) {
      console.error('Error promoting deployment:', error);
      throw error;
    }
  }

  /**
   * Rollback to previous version
   */
  async rollbackDeployment(
    modelId: string,
    environment: 'dev' | 'staging' | 'production'
  ): Promise<string> {
    try {
      console.log(`⏮️ Rolling back ${modelId} in ${environment}`);

      const newDeploymentId = await this.registry.rollbackDeployment(
        modelId,
        environment
      );

      console.log(`✅ Rolled back to deployment ${newDeploymentId}`);
      return newDeploymentId;

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
  ): Promise<any> {
    try {
      return await this.registry.getDeploymentMetrics(deploymentId, timeRange);
    } catch (error) {
      console.error('Error getting deployment metrics:', error);
      return null;
    }
  }

  /**
   * Run A/B test between versions
   */
  async startABTest(
    modelId: string,
    config: {
      versionA: string;
      versionB: string;
      trafficSplit: number;
      duration: string;
      successMetrics: string[];
    }
  ): Promise<string> {
    try {
      console.log(`🧪 Starting A/B test for model ${modelId}`);

      const testId = await this.registry.createABTest(modelId, config);

      console.log(`✅ A/B test ${testId} started`);
      return testId;

    } catch (error) {
      console.error('Error starting A/B test:', error);
      throw error;
    }
  }

  // Private helper methods

  private createDeploymentConfig(
    modelVersion: ModelVersion,
    request: DeploymentRequest
  ): ProductionDeploymentConfig {
    // Start with preset if specified
    const preset = request.preset ? PRODUCTION_PRESETS[request.preset] : PRODUCTION_PRESETS.batchPrediction;
    
    // Merge with custom config
    const config: ProductionDeploymentConfig = {
      model: {
        id: modelVersion.modelId,
        version: modelVersion.version,
        framework: modelVersion.framework,
        artifactPath: modelVersion.artifacts.modelPath,
        requirements: preset.model.requirements
      },
      serving: {
        ...preset.serving,
        ...(request.customConfig?.serving || {})
      },
      scaling: {
        ...preset.scaling,
        ...(request.customConfig?.scaling || {})
      },
      monitoring: {
        ...preset.monitoring,
        ...(request.customConfig?.monitoring || {})
      },
      deployment: {
        ...preset.deployment,
        ...(request.customConfig?.deployment || {})
      },
      security: {
        ...preset.security,
        ...(request.customConfig?.security || {})
      }
    };

    // Adjust for environment
    if (request.environment === 'dev') {
      config.serving.replicas = {
        min: 1,
        max: 2,
        target: 1
      };
      config.monitoring.metrics.enabled = false;
    }

    return config;
  }

  private generateEndpoint(
    modelVersion: ModelVersion,
    environment: string
  ): string {
    return `https://ml-${environment}.blipee.com/v1/models/${modelVersion.modelId}/predict`;
  }

  private async deployToInfrastructure(
    deploymentId: string,
    modelVersion: ModelVersion,
    config: ProductionDeploymentConfig
  ): Promise<void> {
    // Generate Kubernetes manifests
    const manifests = generateK8sManifests(config);

    // Apply manifests (simulated)
    console.log('📦 Applying Kubernetes manifests...');
    
    // In production, this would:
    // 1. Apply deployment manifest
    // 2. Apply service manifest
    // 3. Apply HPA manifest
    // 4. Apply configmap
    // 5. Apply network policies if configured

    // Simulate deployment time
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Update deployment status
    await this.registry.updateDeploymentStatus(deploymentId, 'deploying');
  }

  private async setupMonitoring(
    deploymentId: string,
    config: ProductionDeploymentConfig
  ): Promise<void> {
    if (!config.monitoring.metrics.enabled) return;

    // Configure monitoring
    await this.monitoring.configureDeployment(deploymentId, {
      metrics: config.monitoring.metrics,
      alerts: config.monitoring.alerts.rules
    });

    console.log('📊 Monitoring configured for deployment');
  }

  private startHealthMonitoring(deploymentId: string): void {
    // Start periodic health checks
    const checkHealth = async () => {
      try {
        const health = await this.checkDeploymentHealth(deploymentId);
        
        const status = this.activeDeployments.get(deploymentId);
        if (status) {
          status.health = {
            status: health.healthy ? 'healthy' : 'unhealthy',
            lastCheck: new Date(),
            details: health
          };
          
          // Update deployment status based on health
          if (status.status === 'deploying' && health.ready) {
            status.status = 'running';
            await this.registry.updateDeploymentStatus(deploymentId, 'active');
          }
          
          this.activeDeployments.set(deploymentId, status);
        }
      } catch (error) {
        console.error(`Health check failed for ${deploymentId}:`, error);
      }
    };

    // Check immediately
    checkHealth();

    // Then check every 30 seconds
    const interval = setInterval(checkHealth, 30000);

    // Store interval for cleanup
    (this as any)[`healthCheck_${deploymentId}`] = interval;
  }

  private async checkDeploymentHealth(deploymentId: string): Promise<any> {
    // In production, this would check:
    // 1. Pod readiness
    // 2. Service availability
    // 3. Endpoint health
    // 4. Resource usage

    // Simulated health check
    return {
      healthy: true,
      ready: true,
      pods: {
        total: 3,
        ready: 3,
        restarts: 0
      },
      endpoint: {
        available: true,
        latency: 45
      }
    };
  }

  private async queryDeploymentStatus(deploymentId: string): Promise<DeploymentStatus | null> {
    // Query from Kubernetes API or cloud provider
    // This is a simplified implementation
    return null;
  }

  private async updateReplicas(deploymentId: string, replicas: number): Promise<void> {
    // Update Kubernetes deployment or cloud service
    console.log(`Updating replicas for ${deploymentId} to ${replicas}`);
  }

  private async stopInfrastructure(deploymentId: string): Promise<void> {
    // Delete Kubernetes resources or stop cloud service
    console.log(`Stopping infrastructure for ${deploymentId}`);
    
    // Clear health check interval
    const interval = (this as any)[`healthCheck_${deploymentId}`];
    if (interval) {
      clearInterval(interval);
      delete (this as any)[`healthCheck_${deploymentId}`];
    }
  }
}