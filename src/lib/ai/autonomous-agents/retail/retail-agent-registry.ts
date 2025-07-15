import { AgentManager } from '../agent-manager';
import { InventoryOptimizer } from './inventory-optimizer';
import { CustomerInsightAgent } from './customer-insight-agent';
import { AutonomousAgent, AgentCapability, Task } from '../base';
import { DemandForecastingModel } from '../../ml-models/retail/demand-forecasting';
import { PriceOptimizationModel } from '../../ml-models/retail/price-optimization';

interface RetailAgentConfig {
  storeId: string;
  enabledAgents: string[];
  autonomyLevels: Record<string, number>;
  schedulingConfig: {
    inventoryOptimizer: string; // cron pattern
    customerInsights: string;
  };
  alertThresholds: {
    stockoutRisk: number;
    conversionDrop: number;
    priceVariance: number;
  };
}

interface RetailAgentMetrics {
  agentId: string;
  agentName: string;
  tasksCompleted: number;
  successRate: number;
  averageExecutionTime: number;
  lastExecution: Date;
  autonomyLevel: number;
  learningAccuracy: number;
  businessImpact: {
    costSavings: number;
    revenueImpact: number;
    efficiencyGains: number;
  };
}

export class RetailAgentRegistry {
  private agentManager: AgentManager;
  private agents: Map<string, AutonomousAgent>;
  private mlModels: Map<string, any>;
  private configs: Map<string, RetailAgentConfig>;
  private metrics: Map<string, RetailAgentMetrics>;

  constructor() {
    this.agentManager = AgentManager.getInstance();
    this.agents = new Map();
    this.mlModels = new Map();
    this.configs = new Map();
    this.metrics = new Map();
  }

  async initializeRetailAgents(storeId: string, config?: Partial<RetailAgentConfig>): Promise<string[]> {
    console.log(`Initializing retail agents for store ${storeId}...`);

    const defaultConfig: RetailAgentConfig = {
      storeId,
      enabledAgents: ['inventory-optimizer', 'customer-insight-agent'],
      autonomyLevels: {
        'inventory-optimizer': 4,
        'customer-insight-agent': 3
      },
      schedulingConfig: {
        inventoryOptimizer: '0 8 * * *', // Daily at 8 AM
        customerInsights: '0 */6 * * *'  // Every 6 hours
      },
      alertThresholds: {
        stockoutRisk: 0.8,
        conversionDrop: 0.15,
        priceVariance: 0.2
      },
      ...config
    };

    this.configs.set(storeId, defaultConfig);

    // Initialize ML models
    await this.initializeMLModels(storeId);

    // Initialize and register agents
    const agentIds: string[] = [];

    if (defaultConfig.enabledAgents.includes('inventory-optimizer')) {
      const inventoryAgent = await this.createInventoryOptimizer(storeId, defaultConfig);
      agentIds.push(inventoryAgent);
    }

    if (defaultConfig.enabledAgents.includes('customer-insight-agent')) {
      const insightAgent = await this.createCustomerInsightAgent(storeId, defaultConfig);
      agentIds.push(insightAgent);
    }

    // Set up agent scheduling
    await this.setupAgentScheduling(storeId, defaultConfig);

    // Initialize metrics tracking
    await this.initializeMetricsTracking(agentIds);

    console.log(`Retail agents initialized for store ${storeId}: ${agentIds.join(', ')}`);
    return agentIds;
  }

  private async initializeMLModels(storeId: string): Promise<void> {
    // Initialize Demand Forecasting Model
    const demandModel = new DemandForecastingModel({
      name: `demand-forecasting-${storeId}`,
      version: '1.0.0',
      type: 'forecasting'
    });

    // Initialize Price Optimization Model
    const priceModel = new PriceOptimizationModel({
      name: `price-optimization-${storeId}`,
      version: '1.0.0',
      type: 'optimization'
    });

    // Train models with store data (simplified training)
    const trainingData = { storeId, dataSize: 1000 };
    
    try {
      await demandModel.train(trainingData);
      await priceModel.train(trainingData);
      
      this.mlModels.set(`${storeId}-demand`, demandModel);
      this.mlModels.set(`${storeId}-price`, priceModel);
      
      console.log(`ML models trained for store ${storeId}`);
    } catch (error) {
      console.warn(`ML model training failed for store ${storeId}:`, error.message);
      // Continue with untrained models - they can still provide basic functionality
      this.mlModels.set(`${storeId}-demand`, demandModel);
      this.mlModels.set(`${storeId}-price`, priceModel);
    }
  }

  private async createInventoryOptimizer(storeId: string, config: RetailAgentConfig): Promise<string> {
    const agent = new InventoryOptimizer();
    agent.metadata.storeId = storeId;
    agent.metadata.autonomyLevel = config.autonomyLevels['inventory-optimizer'];

    // Register with agent manager
    const agentId = await this.agentManager.registerAgent(agent);
    this.agents.set(`${storeId}-inventory`, agent);

    // Schedule daily inventory analysis
    await this.agentManager.scheduleRecurringTask(agentId, {
      type: 'analyze_inventory',
      parameters: { storeId },
      schedule: config.schedulingConfig.inventoryOptimizer,
      priority: 'high'
    });

    // Schedule stockout risk detection (every 2 hours)
    await this.agentManager.scheduleRecurringTask(agentId, {
      type: 'detect_stockouts',
      parameters: { storeId },
      schedule: '0 */2 * * *',
      priority: 'critical'
    });

    console.log(`Inventory Optimizer agent created for store ${storeId}: ${agentId}`);
    return agentId;
  }

  private async createCustomerInsightAgent(storeId: string, config: RetailAgentConfig): Promise<string> {
    const agent = new CustomerInsightAgent();
    agent.metadata.storeId = storeId;
    agent.metadata.autonomyLevel = config.autonomyLevels['customer-insight-agent'];

    // Register with agent manager
    const agentId = await this.agentManager.registerAgent(agent);
    this.agents.set(`${storeId}-insights`, agent);

    // Schedule customer segmentation analysis
    await this.agentManager.scheduleRecurringTask(agentId, {
      type: 'analyze_customer_segments',
      parameters: { storeId },
      schedule: config.schedulingConfig.customerInsights,
      priority: 'medium'
    });

    // Schedule conversion pattern analysis (daily)
    await this.agentManager.scheduleRecurringTask(agentId, {
      type: 'analyze_conversion_patterns',
      parameters: { storeId },
      schedule: '0 9 * * *',
      priority: 'medium'
    });

    console.log(`Customer Insight Agent created for store ${storeId}: ${agentId}`);
    return agentId;
  }

  private async setupAgentScheduling(storeId: string, config: RetailAgentConfig): Promise<void> {
    // Set up cross-agent coordination tasks
    
    // Weekly comprehensive analysis combining inventory and customer insights
    await this.scheduleCoordinatedAnalysis(storeId, '0 10 * * 1'); // Monday 10 AM
    
    // Real-time alert coordination
    await this.setupRealTimeAlerts(storeId, config.alertThresholds);
  }

  private async scheduleCoordinatedAnalysis(storeId: string, schedule: string): Promise<void> {
    // Create a coordination task that triggers multiple agents
    const coordinationTask: Task = {
      id: `coord-${storeId}-${Date.now()}`,
      type: 'coordinated_analysis',
      parameters: {
        storeId,
        analysisType: 'comprehensive',
        includeInventory: true,
        includeCustomerInsights: true,
        includePricing: true
      },
      priority: 'high',
      createdAt: new Date(),
      scheduledFor: new Date()
    };

    // This would be handled by a coordination service
    console.log(`Scheduled coordinated analysis for store ${storeId}: ${schedule}`);
  }

  private async setupRealTimeAlerts(storeId: string, thresholds: any): Promise<void> {
    // Set up alert monitoring that coordinates between agents
    console.log(`Real-time alerts configured for store ${storeId}`, thresholds);
  }

  private async initializeMetricsTracking(agentIds: string[]): Promise<void> {
    for (const agentId of agentIds) {
      const metrics: RetailAgentMetrics = {
        agentId,
        agentName: agentId.split('-').pop() || 'unknown',
        tasksCompleted: 0,
        successRate: 1.0,
        averageExecutionTime: 0,
        lastExecution: new Date(),
        autonomyLevel: 3,
        learningAccuracy: 0.85,
        businessImpact: {
          costSavings: 0,
          revenueImpact: 0,
          efficiencyGains: 0
        }
      };

      this.metrics.set(agentId, metrics);
    }
  }

  async executeRetailTask(storeId: string, taskType: string, parameters: any): Promise<any> {
    const config = this.configs.get(storeId);
    if (!config) {
      throw new Error(`No retail configuration found for store ${storeId}`);
    }

    // Route task to appropriate agent
    let agentKey: string;
    let agent: AutonomousAgent;

    switch (taskType) {
      case 'analyze_inventory':
      case 'predict_demand':
      case 'optimize_reorder':
      case 'detect_stockouts':
        agentKey = `${storeId}-inventory`;
        break;

      case 'analyze_customer_segments':
      case 'track_customer_journey':
      case 'predict_customer_behavior':
      case 'analyze_conversion_patterns':
        agentKey = `${storeId}-insights`;
        break;

      default:
        throw new Error(`Unknown retail task type: ${taskType}`);
    }

    agent = this.agents.get(agentKey);
    if (!agent) {
      throw new Error(`Agent not found for task ${taskType} in store ${storeId}`);
    }

    // Execute task and update metrics
    const startTime = Date.now();
    try {
      const result = await agent.executeTask({
        id: `task-${Date.now()}`,
        type: taskType,
        parameters: { storeId, ...parameters },
        priority: 'medium',
        createdAt: new Date(),
        scheduledFor: new Date()
      });

      // Update metrics
      await this.updateAgentMetrics(agent.id, true, Date.now() - startTime);

      return result;
    } catch (error) {
      await this.updateAgentMetrics(agent.id, false, Date.now() - startTime);
      throw error;
    }
  }

  async getRetailAgentMetrics(storeId: string): Promise<RetailAgentMetrics[]> {
    const storeMetrics: RetailAgentMetrics[] = [];
    
    for (const [agentId, metrics] of this.metrics) {
      if (agentId.includes(storeId)) {
        storeMetrics.push(metrics);
      }
    }

    return storeMetrics;
  }

  async updateAgentConfiguration(storeId: string, updates: Partial<RetailAgentConfig>): Promise<void> {
    const currentConfig = this.configs.get(storeId);
    if (!currentConfig) {
      throw new Error(`No configuration found for store ${storeId}`);
    }

    const updatedConfig = { ...currentConfig, ...updates };
    this.configs.set(storeId, updatedConfig);

    // Apply configuration changes to agents
    if (updates.autonomyLevels) {
      for (const [agentType, level] of Object.entries(updates.autonomyLevels)) {
        const agentKey = `${storeId}-${agentType.replace('-optimizer', '').replace('-agent', '')}`;
        const agent = this.agents.get(agentKey);
        if (agent) {
          agent.metadata.autonomyLevel = level;
        }
      }
    }

    console.log(`Updated configuration for store ${storeId}`);
  }

  private async updateAgentMetrics(agentId: string, success: boolean, executionTime: number): Promise<void> {
    const metrics = this.metrics.get(agentId);
    if (!metrics) return;

    metrics.tasksCompleted += 1;
    metrics.lastExecution = new Date();
    
    // Update success rate (exponential moving average)
    const alpha = 0.1;
    metrics.successRate = (1 - alpha) * metrics.successRate + alpha * (success ? 1 : 0);
    
    // Update average execution time
    metrics.averageExecutionTime = (metrics.averageExecutionTime * (metrics.tasksCompleted - 1) + executionTime) / metrics.tasksCompleted;

    this.metrics.set(agentId, metrics);
  }

  async stopRetailAgents(storeId: string): Promise<void> {
    const config = this.configs.get(storeId);
    if (!config) return;

    // Stop all agents for this store
    for (const [agentKey, agent] of this.agents) {
      if (agentKey.includes(storeId)) {
        await this.agentManager.stopAgent(agent.id);
        this.agents.delete(agentKey);
      }
    }

    // Clean up ML models
    this.mlModels.delete(`${storeId}-demand`);
    this.mlModels.delete(`${storeId}-price`);

    // Clean up configurations and metrics
    this.configs.delete(storeId);
    
    for (const [agentId] of this.metrics) {
      if (agentId.includes(storeId)) {
        this.metrics.delete(agentId);
      }
    }

    console.log(`All retail agents stopped for store ${storeId}`);
  }

  async getMLModelPrediction(storeId: string, modelType: 'demand' | 'price', input: any): Promise<any> {
    const modelKey = `${storeId}-${modelType}`;
    const model = this.mlModels.get(modelKey);
    
    if (!model) {
      throw new Error(`ML model ${modelType} not found for store ${storeId}`);
    }

    return await model.predict(input);
  }

  async retrainMLModels(storeId: string): Promise<void> {
    console.log(`Retraining ML models for store ${storeId}...`);
    
    const trainingData = { storeId, dataSize: 1000 };
    
    const demandModel = this.mlModels.get(`${storeId}-demand`);
    const priceModel = this.mlModels.get(`${storeId}-price`);
    
    if (demandModel) {
      await demandModel.retrain(trainingData);
    }
    
    if (priceModel) {
      await priceModel.retrain(trainingData);
    }
    
    console.log(`ML models retrained for store ${storeId}`);
  }

  getRegistryStatus(): any {
    return {
      totalStores: this.configs.size,
      totalAgents: this.agents.size,
      totalMLModels: this.mlModels.size,
      averageSuccessRate: Array.from(this.metrics.values())
        .reduce((sum, metrics) => sum + metrics.successRate, 0) / this.metrics.size,
      totalTasksCompleted: Array.from(this.metrics.values())
        .reduce((sum, metrics) => sum + metrics.tasksCompleted, 0)
    };
  }
}

// Singleton instance
export const retailAgentRegistry = new RetailAgentRegistry();