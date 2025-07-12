/**
 * Production Deployment Manager for Stream B ML Pipeline
 * Manages deployment, health checks, and lifecycle of ML models in production
 */

import { ProductionConfig, getProductionConfig, validateProductionConfig } from '../config/production-config';
import { EnhancedModelMonitoring, MonitoringConfig } from '../production/enhanced-monitoring';
import { ModelABTesting, ABTestConfig } from '../production/ab-testing';
import { ModelOptimizer } from '../performance/model-optimizer';
import { ModelScaler } from '../performance/model-scaling';
import { AutoMLPipeline } from '../automl/automl-pipeline';
import { HyperparameterOptimizer } from '../hyperopt/hyperparameter-optimizer';
import { BaseModel } from '../base/base-model';

export interface DeploymentStatus {
  modelId: string;
  version: string;
  status: 'deploying' | 'healthy' | 'degraded' | 'failed' | 'rolling_back';
  deployedAt: Date;
  lastHealthCheck: Date;
  metrics: {
    requestCount: number;
    averageLatency: number;
    errorRate: number;
    accuracy?: number;
  };
  alerts: Array<{
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: Date;
  }>;
}

export interface DeploymentPlan {
  modelId: string;
  targetVersion: string;
  rolloutStrategy: 'blue-green' | 'canary' | 'rolling' | 'immediate';
  trafficSplitPercentage: number;
  rollbackOnFailure: boolean;
  healthCheckCriteria: {
    maxErrorRate: number;
    maxLatency: number;
    minAccuracy?: number;
  };
  approvalRequired: boolean;
}

export interface ModelRegistry {
  models: Map<string, RegisteredModel>;
  versions: Map<string, ModelVersion[]>;
}

export interface RegisteredModel {
  id: string;
  name: string;
  description: string;
  currentVersion: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  owner: string;
}

export interface ModelVersion {
  modelId: string;
  version: string;
  model: BaseModel;
  metadata: {
    trainingDate: Date;
    datasetVersion: string;
    hyperparameters: Record<string, any>;
    metrics: Record<string, number>;
    artifacts: string[];
  };
  status: 'staging' | 'production' | 'retired';
  deploymentHistory: DeploymentRecord[];
}

export interface DeploymentRecord {
  version: string;
  deployedAt: Date;
  deployedBy: string;
  rolloutStrategy: string;
  successfulRequests: number;
  failedRequests: number;
  rollbackAt?: Date;
  rollbackReason?: string;
}

export class ProductionMLManager {
  private config: ProductionConfig;
  private monitoring: Map<string, EnhancedModelMonitoring> = new Map();
  private abTesting: Map<string, ModelABTesting> = new Map();
  private optimizer: ModelOptimizer;
  private scaler: ModelScaler;
  private autoML: AutoMLPipeline;
  private hyperOptimizer: HyperparameterOptimizer;
  private modelRegistry: ModelRegistry;
  private deploymentStatus: Map<string, DeploymentStatus> = new Map();

  constructor(environment?: string) {
    this.config = getProductionConfig(environment);
    
    // Validate configuration
    const validation = validateProductionConfig(this.config);
    if (!validation.valid) {
      throw new Error(`Invalid production configuration: ${validation.errors.join(', ')}`);
    }

    this.initializeComponents();
    this.modelRegistry = {
      models: new Map(),
      versions: new Map()
    };

    console.log(`🚀 Production ML Manager initialized for ${this.config.environment.name} environment`);
  }

  /**
   * Initialize all ML pipeline components
   */
  private initializeComponents(): void {
    // Initialize optimizer
    this.optimizer = new ModelOptimizer();

    // Initialize scaler with production config
    this.scaler = new ModelScaler({
      minInstances: this.config.scaling.autoScaling.minInstances,
      maxInstances: this.config.scaling.autoScaling.maxInstances,
      targetCPU: this.config.scaling.autoScaling.targetCpuPercent,
      scaleUpThreshold: this.config.scaling.autoScaling.targetCpuPercent + 10,
      scaleDownThreshold: this.config.scaling.autoScaling.targetCpuPercent - 20
    });

    // Initialize AutoML
    this.autoML = new AutoMLPipeline();

    // Initialize hyperparameter optimizer
    this.hyperOptimizer = new HyperparameterOptimizer(
      HyperparameterOptimizer.createOptimizationConfig('balanced')
    );

    console.log('   ✅ All ML components initialized');
  }

  /**
   * Register a new model in the production registry
   */
  async registerModel(
    modelId: string,
    name: string,
    description: string,
    model: BaseModel,
    version: string,
    metadata: any,
    owner: string
  ): Promise<void> {
    console.log(`📝 Registering model: ${name} (${modelId}) version ${version}`);

    // Register model
    const registeredModel: RegisteredModel = {
      id: modelId,
      name,
      description,
      currentVersion: version,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
      owner
    };

    this.modelRegistry.models.set(modelId, registeredModel);

    // Register version
    const modelVersion: ModelVersion = {
      modelId,
      version,
      model,
      metadata: {
        trainingDate: new Date(),
        datasetVersion: metadata.datasetVersion || '1.0',
        hyperparameters: metadata.hyperparameters || {},
        metrics: metadata.metrics || {},
        artifacts: metadata.artifacts || []
      },
      status: 'staging',
      deploymentHistory: []
    };

    if (!this.modelRegistry.versions.has(modelId)) {
      this.modelRegistry.versions.set(modelId, []);
    }
    this.modelRegistry.versions.get(modelId)!.push(modelVersion);

    // Register with scaler
    this.scaler.registerModel(modelId, () => model);

    console.log(`   ✅ Model ${name} registered successfully`);
  }

  /**
   * Deploy a model to production
   */
  async deployModel(deploymentPlan: DeploymentPlan): Promise<boolean> {
    console.log(`🚀 Deploying model ${deploymentPlan.modelId} version ${deploymentPlan.targetVersion}`);
    console.log(`   📋 Strategy: ${deploymentPlan.rolloutStrategy}`);
    console.log(`   📊 Traffic split: ${deploymentPlan.trafficSplitPercentage}%`);

    try {
      // Get model version
      const versions = this.modelRegistry.versions.get(deploymentPlan.modelId);
      if (!versions) {
        throw new Error(`Model ${deploymentPlan.modelId} not found in registry`);
      }

      const version = versions.find(v => v.version === deploymentPlan.targetVersion);
      if (!version) {
        throw new Error(`Version ${deploymentPlan.targetVersion} not found for model ${deploymentPlan.modelId}`);
      }

      // Set up monitoring for this deployment
      await this.setupModelMonitoring(deploymentPlan.modelId);

      // Execute deployment strategy
      switch (deploymentPlan.rolloutStrategy) {
        case 'blue-green':
          await this.blueGreenDeployment(deploymentPlan, version);
          break;
        case 'canary':
          await this.canaryDeployment(deploymentPlan, version);
          break;
        case 'rolling':
          await this.rollingDeployment(deploymentPlan, version);
          break;
        case 'immediate':
          await this.immediateDeployment(deploymentPlan, version);
          break;
      }

      // Update deployment status
      this.updateDeploymentStatus(deploymentPlan.modelId, {
        modelId: deploymentPlan.modelId,
        version: deploymentPlan.targetVersion,
        status: 'healthy',
        deployedAt: new Date(),
        lastHealthCheck: new Date(),
        metrics: {
          requestCount: 0,
          averageLatency: 0,
          errorRate: 0
        },
        alerts: []
      });

      // Update model version status
      version.status = 'production';
      version.deploymentHistory.push({
        version: deploymentPlan.targetVersion,
        deployedAt: new Date(),
        deployedBy: 'system', // In real implementation, would get from auth context
        rolloutStrategy: deploymentPlan.rolloutStrategy,
        successfulRequests: 0,
        failedRequests: 0
      });

      console.log(`   ✅ Model ${deploymentPlan.modelId} deployed successfully`);
      return true;

    } catch (error) {
      console.error(`   ❌ Deployment failed: ${error.message}`);
      
      if (deploymentPlan.rollbackOnFailure) {
        await this.rollbackDeployment(deploymentPlan.modelId, `Deployment failed: ${error.message}`);
      }
      
      return false;
    }
  }

  /**
   * Set up monitoring for a deployed model
   */
  private async setupModelMonitoring(modelId: string): Promise<void> {
    const monitoringConfig: MonitoringConfig = {
      modelName: modelId,
      monitoringInterval: 30000, // 30 seconds
      driftDetectionEnabled: true,
      performanceThresholds: {
        maxLatency: this.config.monitoring.performanceAlertThresholds.latencyP95Ms,
        minAccuracy: this.config.monitoring.performanceAlertThresholds.accuracyThreshold,
        maxErrorRate: this.config.monitoring.performanceAlertThresholds.errorRatePercent / 100,
        minThroughput: this.config.monitoring.performanceAlertThresholds.throughputReqPerSec,
        maxDriftScore: 0.3
      },
      alertingEnabled: this.config.monitoring.alertingEnabled,
      alertChannels: [
        { type: 'console', target: 'console', severity: 'medium' }
      ],
      retentionPeriod: this.config.monitoring.metricsRetentionDays,
      samplingRate: 1.0
    };

    const monitoring = new EnhancedModelMonitoring(monitoringConfig);
    await monitoring.startMonitoring();
    this.monitoring.set(modelId, monitoring);

    console.log(`   📊 Monitoring set up for model ${modelId}`);
  }

  /**
   * Blue-green deployment strategy
   */
  private async blueGreenDeployment(plan: DeploymentPlan, version: ModelVersion): Promise<void> {
    console.log(`   🔵 Executing blue-green deployment for ${plan.modelId}`);
    
    // In a real implementation, this would:
    // 1. Deploy new version to green environment
    // 2. Run health checks
    // 3. Switch traffic from blue to green
    // 4. Monitor for issues
    // 5. Keep blue as backup for quick rollback
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate deployment time
    console.log(`   ✅ Blue-green deployment completed`);
  }

  /**
   * Canary deployment strategy
   */
  private async canaryDeployment(plan: DeploymentPlan, version: ModelVersion): Promise<void> {
    console.log(`   🐤 Executing canary deployment for ${plan.modelId}`);
    
    // Set up A/B test for canary
    const currentModel = this.getProductionModel(plan.modelId);
    if (!currentModel) {
      throw new Error(`No current production model found for ${plan.modelId}`);
    }

    const abTesting = new ModelABTesting();
    const testConfig: ABTestConfig = {
      testName: `Canary deployment - ${plan.modelId}`,
      description: `Canary testing version ${plan.targetVersion}`,
      startDate: new Date(),
      trafficSplit: {
        control: {
          percentage: 100 - plan.trafficSplitPercentage,
          model: currentModel,
          label: 'Current Production'
        },
        variants: [{
          id: 'canary',
          percentage: plan.trafficSplitPercentage,
          model: version.model,
          label: `Canary ${plan.targetVersion}`
        }]
      },
      successMetrics: ['conversion_rate', 'latency'],
      minimumSampleSize: 100,
      significanceLevel: 0.05,
      maxDuration: 3600000 // 1 hour
    };

    const testId = await abTesting.startExperiment(testConfig);
    this.abTesting.set(plan.modelId, abTesting);

    console.log(`   ✅ Canary deployment initiated with ${plan.trafficSplitPercentage}% traffic`);
  }

  /**
   * Rolling deployment strategy
   */
  private async rollingDeployment(plan: DeploymentPlan, version: ModelVersion): Promise<void> {
    console.log(`   🔄 Executing rolling deployment for ${plan.modelId}`);
    
    // In a real implementation, this would:
    // 1. Gradually replace instances with new version
    // 2. Monitor health at each step
    // 3. Continue if healthy, rollback if not
    
    const steps = 5; // Number of rolling steps
    for (let i = 1; i <= steps; i++) {
      const percentage = (i / steps) * 100;
      console.log(`   📈 Rolling step ${i}/${steps}: ${percentage}% deployed`);
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate gradual rollout
      
      // Simulate health check
      if (Math.random() < 0.95) { // 95% success rate
        console.log(`   ✅ Step ${i} healthy`);
      } else {
        throw new Error(`Health check failed at step ${i}`);
      }
    }
    
    console.log(`   ✅ Rolling deployment completed`);
  }

  /**
   * Immediate deployment strategy
   */
  private async immediateDeployment(plan: DeploymentPlan, version: ModelVersion): Promise<void> {
    console.log(`   ⚡ Executing immediate deployment for ${plan.modelId}`);
    
    // Replace all traffic immediately
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate deployment
    
    console.log(`   ✅ Immediate deployment completed`);
  }

  /**
   * Rollback a failed deployment
   */
  async rollbackDeployment(modelId: string, reason: string): Promise<void> {
    console.log(`🔄 Rolling back deployment for model ${modelId}`);
    console.log(`   📝 Reason: ${reason}`);

    const status = this.deploymentStatus.get(modelId);
    if (status) {
      status.status = 'rolling_back';
      this.deploymentStatus.set(modelId, status);
    }

    // Stop monitoring for the failed version
    const monitoring = this.monitoring.get(modelId);
    if (monitoring) {
      monitoring.stopMonitoring();
    }

    // Stop any A/B tests
    const abTesting = this.abTesting.get(modelId);
    if (abTesting) {
      const activeTests = abTesting.getActiveExperiments();
      for (const test of activeTests) {
        await abTesting.stopExperiment(test.testId, `Rollback due to: ${reason}`);
      }
    }

    // In a real implementation, would restore previous version
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log(`   ✅ Rollback completed for model ${modelId}`);
  }

  /**
   * Get current production model
   */
  private getProductionModel(modelId: string): BaseModel | null {
    const versions = this.modelRegistry.versions.get(modelId);
    if (!versions) return null;

    const productionVersion = versions.find(v => v.status === 'production');
    return productionVersion?.model || null;
  }

  /**
   * Update deployment status
   */
  private updateDeploymentStatus(modelId: string, status: DeploymentStatus): void {
    this.deploymentStatus.set(modelId, status);
  }

  /**
   * Get health status for all deployed models
   */
  async getSystemHealth(): Promise<{
    overallStatus: 'healthy' | 'degraded' | 'critical';
    models: DeploymentStatus[];
    summary: {
      totalModels: number;
      healthyModels: number;
      degradedModels: number;
      failedModels: number;
    };
  }> {
    const models = Array.from(this.deploymentStatus.values());
    const healthyCount = models.filter(m => m.status === 'healthy').length;
    const degradedCount = models.filter(m => m.status === 'degraded').length;
    const failedCount = models.filter(m => m.status === 'failed').length;

    let overallStatus: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (failedCount > 0 || degradedCount > models.length / 2) {
      overallStatus = 'critical';
    } else if (degradedCount > 0) {
      overallStatus = 'degraded';
    }

    return {
      overallStatus,
      models,
      summary: {
        totalModels: models.length,
        healthyModels: healthyCount,
        degradedModels: degradedCount,
        failedModels: failedCount
      }
    };
  }

  /**
   * Get detailed metrics for a specific model
   */
  async getModelMetrics(modelId: string): Promise<any> {
    const monitoring = this.monitoring.get(modelId);
    if (!monitoring) {
      throw new Error(`No monitoring found for model ${modelId}`);
    }

    return await monitoring.getModelHealth();
  }

  /**
   * List all registered models
   */
  getRegisteredModels(): RegisteredModel[] {
    return Array.from(this.modelRegistry.models.values());
  }

  /**
   * Get versions for a specific model
   */
  getModelVersions(modelId: string): ModelVersion[] {
    return this.modelRegistry.versions.get(modelId) || [];
  }

  /**
   * Cleanup resources
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down Production ML Manager...');

    // Stop all monitoring
    for (const [modelId, monitoring] of this.monitoring) {
      monitoring.stopMonitoring();
    }

    // Stop all A/B tests
    for (const [modelId, abTesting] of this.abTesting) {
      const activeTests = abTesting.getActiveExperiments();
      for (const test of activeTests) {
        await abTesting.stopExperiment(test.testId, 'System shutdown');
      }
    }

    console.log('   ✅ Production ML Manager shutdown complete');
  }
}