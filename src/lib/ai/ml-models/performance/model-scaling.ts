/**
 * Model Scaling and Load Balancing System
 * Handles dynamic scaling of ML models based on demand
 */

import { BaseModel } from '../base/base-model';
import { PerformanceMonitor } from './performance-monitor';

export interface ScalingConfig {
  minInstances: number;
  maxInstances: number;
  targetLatency: number; // ms
  targetThroughput: number; // requests/sec
  scaleUpThreshold: number; // 0-1, when to scale up
  scaleDownThreshold: number; // 0-1, when to scale down
  cooldownPeriod: number; // ms between scaling decisions
  warmupTime: number; // ms for new instances to warm up
}

export interface ModelInstance {
  id: string;
  model: BaseModel | any;
  status: 'starting' | 'ready' | 'busy' | 'error' | 'stopping';
  requestCount: number;
  avgLatency: number;
  lastUsed: Date;
  createdAt: Date;
  memoryUsage: number;
}

export interface LoadBalancingStrategy {
  name: string;
  selectInstance: (instances: ModelInstance[], request: any) => ModelInstance | null;
}

export class ModelScaler {
  private instances: Map<string, ModelInstance[]> = new Map();
  private scalingConfig: Map<string, ScalingConfig> = new Map();
  private modelFactories: Map<string, () => Promise<BaseModel | any>> = new Map();
  private lastScalingDecision: Map<string, Date> = new Map();
  private performanceMonitor: PerformanceMonitor;
  private loadBalancer: LoadBalancer;
  private requestQueue: Map<string, any[]> = new Map();

  constructor(performanceMonitor: PerformanceMonitor) {
    this.performanceMonitor = performanceMonitor;
    this.loadBalancer = new LoadBalancer();
    this.startScalingLoop();
  }

  /**
   * Register a model for auto-scaling
   */
  async registerModel(
    modelName: string,
    modelFactory: () => Promise<BaseModel | any>,
    config: ScalingConfig
  ): Promise<void> {
    console.log(`Registering model for scaling: ${modelName}`);
    
    this.scalingConfig.set(modelName, config);
    this.modelFactories.set(modelName, modelFactory);
    this.instances.set(modelName, []);
    this.requestQueue.set(modelName, []);

    // Start with minimum instances
    for (let i = 0; i < config.minInstances; i++) {
      await this.createInstance(modelName, modelFactory);
    }

    console.log(`${modelName}: Started with ${config.minInstances} instances`);
  }

  /**
   * Make a prediction with load balancing and auto-scaling
   */
  async predict(
    modelName: string,
    input: any,
    options: { timeout?: number; priority?: 'low' | 'medium' | 'high' } = {}
  ): Promise<any> {
    const startTime = Date.now();
    
    // Get available instance
    const instance = await this.getAvailableInstance(modelName, options);
    
    if (!instance) {
      throw new Error(`No available instances for model: ${modelName}`);
    }

    try {
      // Update instance status
      instance.status = 'busy';
      instance.requestCount++;
      
      // Make prediction
      const result = await instance.model.predict(input);
      
      // Record performance metrics
      const latency = Date.now() - startTime;
      instance.avgLatency = (instance.avgLatency * (instance.requestCount - 1) + latency) / instance.requestCount;
      instance.lastUsed = new Date();
      instance.status = 'ready';

      // Record metrics for monitoring
      await this.performanceMonitor.recordPrediction(
        modelName,
        input,
        result,
        {
          latency,
          timestamp: new Date(),
          instanceId: instance.id
        } as any
      );

      return result;
    } catch (error) {
      instance.status = 'error';
      console.error(`Prediction error on instance ${instance.id}:`, error);
      
      // Try to recover or replace failed instance
      await this.handleInstanceError(modelName, instance);
      
      throw error;
    }
  }

  /**
   * Get current scaling status
   */
  getScalingStatus(modelName: string): {
    totalInstances: number;
    readyInstances: number;
    busyInstances: number;
    errorInstances: number;
    queueLength: number;
    avgLatency: number;
    totalRequests: number;
  } | null {
    const instances = this.instances.get(modelName);
    const queue = this.requestQueue.get(modelName);
    
    if (!instances) return null;

    const readyInstances = instances.filter(i => i.status === 'ready').length;
    const busyInstances = instances.filter(i => i.status === 'busy').length;
    const errorInstances = instances.filter(i => i.status === 'error').length;
    
    const totalRequests = instances.reduce((sum, i) => sum + i.requestCount, 0);
    const avgLatency = instances.length > 0 
      ? instances.reduce((sum, i) => sum + i.avgLatency, 0) / instances.length 
      : 0;

    return {
      totalInstances: instances.length,
      readyInstances,
      busyInstances,
      errorInstances,
      queueLength: queue?.length || 0,
      avgLatency,
      totalRequests
    };
  }

  /**
   * Manual scaling operations
   */
  async scaleUp(modelName: string, count: number = 1): Promise<void> {
    const config = this.scalingConfig.get(modelName);
    const instances = this.instances.get(modelName);
    const modelFactory = this.modelFactories.get(modelName);
    
    if (!config || !instances || !modelFactory) {
      throw new Error(`Model not registered: ${modelName}`);
    }

    const currentCount = instances.length;
    const targetCount = Math.min(currentCount + count, config.maxInstances);
    
    console.log(`Manually scaling up ${modelName} from ${currentCount} to ${targetCount} instances`);
    
    for (let i = currentCount; i < targetCount; i++) {
      await this.createInstance(modelName, modelFactory);
    }
  }

  async scaleDown(modelName: string, count: number = 1): Promise<void> {
    const config = this.scalingConfig.get(modelName);
    const instances = this.instances.get(modelName);
    
    if (!config || !instances) {
      throw new Error(`Model not registered: ${modelName}`);
    }

    const currentCount = instances.length;
    const targetCount = Math.max(currentCount - count, config.minInstances);
    
    console.log(`Manually scaling down ${modelName} from ${currentCount} to ${targetCount} instances`);
    
    // Remove least recently used instances
    const sortedInstances = instances
      .filter(i => i.status === 'ready')
      .sort((a, b) => a.lastUsed.getTime() - b.lastUsed.getTime());
    
    const instancesToRemove = sortedInstances.slice(0, currentCount - targetCount);
    
    for (const instance of instancesToRemove) {
      await this.removeInstance(modelName, instance.id);
    }
  }

  /**
   * Create new model instance
   */
  private async createInstance(
    modelName: string,
    modelFactory: () => Promise<BaseModel | any>
  ): Promise<ModelInstance> {
    const instanceId = `${modelName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`Creating new instance: ${instanceId}`);
    
    const instance: ModelInstance = {
      id: instanceId,
      model: null as any,
      status: 'starting',
      requestCount: 0,
      avgLatency: 0,
      lastUsed: new Date(),
      createdAt: new Date(),
      memoryUsage: 0
    };

    const instances = this.instances.get(modelName)!;
    instances.push(instance);

    try {
      // Create and initialize model
      instance.model = await modelFactory();
      
      // Warm up if needed
      await this.warmupInstance(instance);
      
      instance.status = 'ready';
      console.log(`✅ Instance ${instanceId} ready`);
      
      return instance;
    } catch (error) {
      console.error(`❌ Failed to create instance ${instanceId}:`, error);
      instance.status = 'error';
      throw error;
    }
  }

  /**
   * Remove model instance
   */
  private async removeInstance(modelName: string, instanceId: string): Promise<void> {
    const instances = this.instances.get(modelName);
    if (!instances) return;

    const instanceIndex = instances.findIndex(i => i.id === instanceId);
    if (instanceIndex === -1) return;

    const instance = instances[instanceIndex];
    instance.status = 'stopping';

    try {
      // Cleanup model resources if needed
      if (instance.model && typeof instance.model.cleanup === 'function') {
        await instance.model.cleanup();
      }
      
      instances.splice(instanceIndex, 1);
      console.log(`🗑️ Removed instance: ${instanceId}`);
    } catch (error) {
      console.error(`Error removing instance ${instanceId}:`, error);
    }
  }

  /**
   * Get available instance using load balancing
   */
  private async getAvailableInstance(
    modelName: string,
    options: { timeout?: number; priority?: 'low' | 'medium' | 'high' }
  ): Promise<ModelInstance | null> {
    const instances = this.instances.get(modelName);
    if (!instances || instances.length === 0) return null;

    // Try to get ready instance
    const readyInstances = instances.filter(i => i.status === 'ready');
    
    if (readyInstances.length > 0) {
      return this.loadBalancer.selectInstance(readyInstances, options);
    }

    // No ready instances - check if we should queue or scale
    const config = this.scalingConfig.get(modelName)!;
    const busyInstances = instances.filter(i => i.status === 'busy').length;
    
    // Try to scale up if needed
    if (instances.length < config.maxInstances && busyInstances / instances.length > config.scaleUpThreshold) {
      // Trigger scaling (don't wait for it)
      this.triggerScaling(modelName, 'up');
    }

    // Queue request or wait briefly for instance
    const timeout = options.timeout || 5000;
    const endTime = Date.now() + timeout;
    
    while (Date.now() < endTime) {
      const nowReadyInstances = instances.filter(i => i.status === 'ready');
      if (nowReadyInstances.length > 0) {
        return this.loadBalancer.selectInstance(nowReadyInstances, options);
      }
      
      // Wait briefly before checking again
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return null; // Timeout
  }

  /**
   * Handle instance errors
   */
  private async handleInstanceError(modelName: string, instance: ModelInstance): Promise<void> {
    console.warn(`Handling error for instance ${instance.id}`);
    
    // Mark instance as error
    instance.status = 'error';
    
    // If too many errors, remove instance
    const instances = this.instances.get(modelName)!;
    const errorInstances = instances.filter(i => i.status === 'error').length;
    
    if (errorInstances > instances.length * 0.5) {
      console.warn(`High error rate detected for ${modelName}, removing failed instances`);
      await this.removeInstance(modelName, instance.id);
      
      // Try to create replacement
      this.triggerScaling(modelName, 'replace');
    }
  }

  /**
   * Warmup instance with sample requests
   */
  private async warmupInstance(instance: ModelInstance): Promise<void> {
    // Perform a few sample predictions to warm up the model
    const warmupInputs = this.generateWarmupInputs();
    
    for (const input of warmupInputs) {
      try {
        await instance.model.predict(input);
      } catch (error) {
        // Warmup errors are not critical
        console.warn(`Warmup prediction failed:`, error);
      }
    }
  }

  /**
   * Generate sample inputs for warmup
   */
  private generateWarmupInputs(): any[] {
    // Return sample inputs for different model types
    return [
      { // Sample regulatory input
        regulation: {
          id: 'warmup-reg',
          title: 'Warmup Regulation',
          content: 'Sample regulatory text for warmup processing',
          jurisdiction: 'Test',
          effectiveDate: new Date(),
          sector: ['test'],
          source: 'Test'
        }
      },
      { // Sample optimization problem
        variables: [0.5, 0.7, 0.3],
        constraints: [1.0, 0.8]
      }
    ];
  }

  /**
   * Start automatic scaling loop
   */
  private startScalingLoop(): void {
    setInterval(() => {
      this.evaluateScaling();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Evaluate scaling decisions for all models
   */
  private async evaluateScaling(): Promise<void> {
    for (const [modelName, config] of this.scalingConfig.entries()) {
      await this.evaluateModelScaling(modelName, config);
    }
  }

  /**
   * Evaluate scaling for a specific model
   */
  private async evaluateModelScaling(modelName: string, config: ScalingConfig): Promise<void> {
    const instances = this.instances.get(modelName);
    if (!instances) return;

    const lastScaling = this.lastScalingDecision.get(modelName);
    if (lastScaling && Date.now() - lastScaling.getTime() < config.cooldownPeriod) {
      return; // Still in cooldown period
    }

    const status = this.getScalingStatus(modelName);
    if (!status) return;

    const utilization = status.busyInstances / status.totalInstances;
    const avgLatency = status.avgLatency;

    // Scale up conditions
    if (
      status.totalInstances < config.maxInstances &&
      (utilization > config.scaleUpThreshold || avgLatency > config.targetLatency)
    ) {
      console.log(`🔼 Auto-scaling up ${modelName}: utilization=${utilization.toFixed(2)}, latency=${avgLatency.toFixed(1)}ms`);
      await this.triggerScaling(modelName, 'up');
    }
    
    // Scale down conditions
    else if (
      status.totalInstances > config.minInstances &&
      utilization < config.scaleDownThreshold &&
      avgLatency < config.targetLatency * 0.7 &&
      status.queueLength === 0
    ) {
      console.log(`🔽 Auto-scaling down ${modelName}: utilization=${utilization.toFixed(2)}, latency=${avgLatency.toFixed(1)}ms`);
      await this.triggerScaling(modelName, 'down');
    }
  }

  /**
   * Trigger scaling action
   */
  private async triggerScaling(modelName: string, direction: 'up' | 'down' | 'replace'): Promise<void> {
    this.lastScalingDecision.set(modelName, new Date());
    
    try {
      switch (direction) {
        case 'up':
          await this.scaleUp(modelName, 1);
          break;
        case 'down':
          await this.scaleDown(modelName, 1);
          break;
        case 'replace':
          // Replace failed instances
          await this.scaleUp(modelName, 1);
          break;
      }
    } catch (error) {
      console.error(`Scaling ${direction} failed for ${modelName}:`, .message);
    }
  }
}

/**
 * Load Balancer for distributing requests across instances
 */
class LoadBalancer {
  private strategies: Map<string, LoadBalancingStrategy> = new Map();

  constructor() {
    this.initializeStrategies();
  }

  selectInstance(
    instances: ModelInstance[],
    request: any
  ): ModelInstance | null {
    if (instances.length === 0) return null;
    
    // Use round-robin with least connections as default
    const strategy = this.strategies.get('least_connections')!;
    return strategy.selectInstance(instances, request);
  }

  private initializeStrategies(): void {
    // Round Robin
    this.strategies.set('round_robin', {
      name: 'Round Robin',
      selectInstance: (instances: ModelInstance[]) => {
        // Simple round-robin based on request count
        return instances.reduce((min, current) => 
          current.requestCount < min.requestCount ? current : min
        );
      }
    });

    // Least Connections
    this.strategies.set('least_connections', {
      name: 'Least Connections',
      selectInstance: (instances: ModelInstance[]) => {
        return instances.reduce((best, current) => {
          if (current.status !== 'ready') return best;
          
          // Prefer instances with fewer requests and lower latency
          const currentScore = current.requestCount + (current.avgLatency / 1000);
          const bestScore = best.requestCount + (best.avgLatency / 1000);
          
          return currentScore < bestScore ? current : best;
        });
      }
    });

    // Fastest Response
    this.strategies.set('fastest_response', {
      name: 'Fastest Response',
      selectInstance: (instances: ModelInstance[]) => {
        return instances
          .filter(i => i.status === 'ready')
          .reduce((fastest, current) => 
            current.avgLatency < fastest.avgLatency ? current : fastest
          );
      }
    });

    // Weighted Random
    this.strategies.set('weighted_random', {
      name: 'Weighted Random',
      selectInstance: (instances: ModelInstance[]) => {
        const readyInstances = instances.filter(i => i.status === 'ready');
        if (readyInstances.length === 0) return null;
        
        // Weight by inverse of latency (faster instances get higher weight)
        const weights = readyInstances.map(i => 1 / (i.avgLatency + 1));
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);
        
        let random = Math.random() * totalWeight;
        for (let i = 0; i < readyInstances.length; i++) {
          random -= weights[i];
          if (random <= 0) {
            return readyInstances[i];
          }
        }
        
        return readyInstances[0]; // Fallback
      }
    });
  }
}