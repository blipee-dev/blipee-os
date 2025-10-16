/**
 * Resource Scheduler
 * Intelligent scheduling system for cost optimization through resource management
 */

export interface ScheduledAction {
  id: string;
  name: string;
  description: string;
  resourceId: string;
  actionType: 'scale-up' | 'scale-down' | 'start' | 'stop' | 'switch-provider' | 'migrate-region';
  schedule: {
    type: 'cron' | 'interval' | 'one-time' | 'event-driven';
    expression: string; // cron expression or interval
    timezone: string;
    conditions?: {
      metric: string;
      operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
      threshold: number;
      duration?: number; // minutes to wait before triggering
    }[];
  };
  parameters: {
    targetCapacity?: number;
    targetProvider?: string;
    targetRegion?: string;
    gracePeriod?: number; // minutes
    maxRetries?: number;
  };
  costImpact: {
    estimatedSavings: number; // monthly
    riskLevel: 'low' | 'medium' | 'high';
  };
  status: 'active' | 'paused' | 'disabled';
  lastExecution?: {
    timestamp: Date;
    success: boolean;
    duration: number; // seconds
    error?: string;
    costSaving?: number;
  };
  nextExecution: Date;
  createdAt: Date;
  createdBy: string;
}

export interface ResourceUsagePattern {
  resourceId: string;
  patterns: {
    hourly: Array<{ hour: number; avgUsage: number; stdDev: number }>;
    daily: Array<{ dayOfWeek: number; avgUsage: number; stdDev: number }>;
    monthly: Array<{ day: number; avgUsage: number; stdDev: number }>;
  };
  predictions: {
    nextHour: number;
    next24Hours: number[];
    nextWeek: number[];
    confidence: 'high' | 'medium' | 'low';
  };
  anomalies: Array<{
    timestamp: Date;
    expectedUsage: number;
    actualUsage: number;
    deviation: number;
  }>;
  lastAnalyzed: Date;
}

export interface SchedulerExecutionLog {
  id: string;
  actionId: string;
  timestamp: Date;
  status: 'success' | 'failure' | 'partial';
  duration: number; // seconds
  beforeState: any;
  afterState: any;
  costImpact: number;
  metrics: {
    resourcesAffected: number;
    actualVsExpectedSaving: number;
    performanceImpact: string;
  };
  error?: string;
  rollbackAvailable: boolean;
}

/**
 * Resource Scheduler for Cost Optimization
 */
export class ResourceScheduler {
  private scheduledActions: Map<string, ScheduledAction> = new Map();
  private usagePatterns: Map<string, ResourceUsagePattern> = new Map();
  private executionLogs: Map<string, SchedulerExecutionLog> = new Map();
  private isRunning: boolean = false;
  private intervalId?: NodeJS.Timeout;

  constructor() {
    this.initializeDefaultSchedules();
    this.startScheduler();
  }

  /**
   * Initialize default cost optimization schedules
   */
  private initializeDefaultSchedules(): void {
    const defaultSchedules: ScheduledAction[] = [
      {
        id: 'nightly-scale-down',
        name: 'Nightly Scale Down',
        description: 'Scale down non-production resources during off-hours (10 PM - 6 AM PST)',
        resourceId: 'vercel-pro-functions',
        actionType: 'scale-down',
        schedule: {
          type: 'cron',
          expression: '0 22 * * *', // 10 PM daily
          timezone: 'America/Los_Angeles'
        },
        parameters: {
          targetCapacity: 0.3, // Scale to 30% capacity
          gracePeriod: 10,
          maxRetries: 3
        },
        costImpact: {
          estimatedSavings: 420, // $420/month
          riskLevel: 'low'
        },
        status: 'active',
        nextExecution: this.calculateNextExecution('0 22 * * *'),
        createdAt: new Date(),
        createdBy: 'system'
      },
      {
        id: 'morning-scale-up',
        name: 'Morning Scale Up',
        description: 'Scale up resources for business hours (6 AM PST)',
        resourceId: 'vercel-pro-functions',
        actionType: 'scale-up',
        schedule: {
          type: 'cron',
          expression: '0 6 * * 1-5', // 6 AM Monday-Friday
          timezone: 'America/Los_Angeles'
        },
        parameters: {
          targetCapacity: 1.0, // Full capacity
          gracePeriod: 5,
          maxRetries: 3
        },
        costImpact: {
          estimatedSavings: 0, // This is for performance, not cost savings
          riskLevel: 'low'
        },
        status: 'active',
        nextExecution: this.calculateNextExecution('0 6 * * 1-5'),
        createdAt: new Date(),
        createdBy: 'system'
      },
      {
        id: 'weekend-deep-sleep',
        name: 'Weekend Deep Sleep',
        description: 'Minimize resource usage during weekends',
        resourceId: 'supabase-pro-database',
        actionType: 'scale-down',
        schedule: {
          type: 'cron',
          expression: '0 23 * * 5', // 11 PM Friday
          timezone: 'America/Los_Angeles'
        },
        parameters: {
          targetCapacity: 0.2, // Minimal capacity
          gracePeriod: 30,
          maxRetries: 2
        },
        costImpact: {
          estimatedSavings: 180, // $180/month
          riskLevel: 'medium'
        },
        status: 'active',
        nextExecution: this.calculateNextExecution('0 23 * * 5'),
        createdAt: new Date(),
        createdBy: 'system'
      },
      {
        id: 'ai-model-switch-lowtraffic',
        name: 'Switch to DeepSeek During Low Traffic',
        description: 'Automatically switch to DeepSeek API during low traffic hours for cost savings',
        resourceId: 'openai-gpt-4-api',
        actionType: 'switch-provider',
        schedule: {
          type: 'event-driven',
          expression: 'traffic-threshold',
          timezone: 'UTC',
          conditions: [{
            metric: 'requests-per-hour',
            operator: '<',
            threshold: 100,
            duration: 15 // Wait 15 minutes below threshold
          }]
        },
        parameters: {
          targetProvider: 'deepseek',
          gracePeriod: 5,
          maxRetries: 2
        },
        costImpact: {
          estimatedSavings: 960, // $960/month (80% savings during low traffic)
          riskLevel: 'medium'
        },
        status: 'active',
        nextExecution: new Date(Date.now() + 60 * 60 * 1000), // Check every hour
        createdAt: new Date(),
        createdBy: 'system'
      },
      {
        id: 'holiday-resource-optimization',
        name: 'Holiday Resource Optimization',
        description: 'Scale down resources during major holidays',
        resourceId: '*', // Apply to all resources
        actionType: 'scale-down',
        schedule: {
          type: 'one-time',
          expression: '2025-12-25', // Christmas day example
          timezone: 'America/Los_Angeles'
        },
        parameters: {
          targetCapacity: 0.4, // 40% capacity
          gracePeriod: 60,
          maxRetries: 1
        },
        costImpact: {
          estimatedSavings: 312, // One-time savings
          riskLevel: 'low'
        },
        status: 'paused', // Will be activated closer to the date
        nextExecution: new Date('2025-12-25T00:00:00.000Z'),
        createdAt: new Date(),
        createdBy: 'system'
      }
    ];

    defaultSchedules.forEach(schedule => {
      this.scheduledActions.set(schedule.id, schedule);
    });
  }

  /**
   * Calculate next execution time for cron expression
   */
  private calculateNextExecution(cronExpression: string): Date {
    // Simplified cron calculation - in production, use a proper cron library
    const now = new Date();
    const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
    return nextHour;
  }

  /**
   * Start the scheduler
   */
  startScheduler(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    // Check for scheduled actions every minute
    this.intervalId = setInterval(() => {
      this.processScheduledActions();
    }, 60 * 1000);
  }

  /**
   * Stop the scheduler
   */
  stopScheduler(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    
  }

  /**
   * Process scheduled actions that are due for execution
   */
  private async processScheduledActions(): Promise<void> {
    const now = new Date();
    const dueActions = Array.from(this.scheduledActions.values())
      .filter(action => 
        action.status === 'active' && 
        action.nextExecution <= now
      );

    for (const action of dueActions) {
      try {
        await this.executeAction(action);
      } catch (error) {
        console.error(`Failed to execute scheduled action ${action.id}:`, error);
      }
    }
  }

  /**
   * Execute a scheduled action
   */
  private async executeAction(action: ScheduledAction): Promise<void> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    
    
    try {
      // Capture before state
      const beforeState = await this.captureResourceState(action.resourceId);
      
      // Execute the action based on type
      let success = false;
      let costSaving = 0;
      
      switch (action.actionType) {
        case 'scale-down':
          success = await this.scaleResource(action.resourceId, action.parameters.targetCapacity || 0.5);
          costSaving = success ? action.costImpact.estimatedSavings / 30 : 0; // Daily savings
          break;
        
        case 'scale-up':
          success = await this.scaleResource(action.resourceId, action.parameters.targetCapacity || 1.0);
          break;
        
        case 'switch-provider':
          success = await this.switchProvider(action.resourceId, action.parameters.targetProvider || 'deepseek');
          costSaving = success ? action.costImpact.estimatedSavings / 30 : 0; // Daily savings
          break;
        
        case 'stop':
          success = await this.stopResource(action.resourceId);
          costSaving = success ? action.costImpact.estimatedSavings / 30 : 0; // Daily savings
          break;
        
        case 'start':
          success = await this.startResource(action.resourceId);
          break;
        
        default:
          console.warn(`Unknown action type: ${action.actionType}`);
          success = false;
      }
      
      // Capture after state
      const afterState = await this.captureResourceState(action.resourceId);
      
      // Update action's last execution
      action.lastExecution = {
        timestamp: new Date(),
        success,
        duration: Math.round((Date.now() - startTime) / 1000),
        costSaving
      };
      
      // Calculate next execution
      action.nextExecution = this.calculateNextExecutionTime(action.schedule);
      
      // Log execution
      const executionLog: SchedulerExecutionLog = {
        id: executionId,
        actionId: action.id,
        timestamp: new Date(),
        status: success ? 'success' : 'failure',
        duration: Math.round((Date.now() - startTime) / 1000),
        beforeState,
        afterState,
        costImpact: costSaving,
        metrics: {
          resourcesAffected: 1,
          actualVsExpectedSaving: costSaving,
          performanceImpact: 'monitoring'
        },
        rollbackAvailable: true
      };
      
      this.executionLogs.set(executionId, executionLog);
      this.scheduledActions.set(action.id, action);
      
      if (success) {
      } else {
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      action.lastExecution = {
        timestamp: new Date(),
        success: false,
        duration: Math.round((Date.now() - startTime) / 1000),
        error: errorMessage,
        costSaving: 0
      };
      
      this.scheduledActions.set(action.id, action);
      
      console.error(`💥 Action ${action.name} failed:`, errorMessage);
    }
  }

  /**
   * Scale resource capacity
   */
  private async scaleResource(resourceId: string, targetCapacity: number): Promise<boolean> {
    
    // Simulate scaling operation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In real implementation, would call actual scaling APIs
    return Math.random() > 0.1; // 90% success rate
  }

  /**
   * Switch resource provider
   */
  private async switchProvider(resourceId: string, targetProvider: string): Promise<boolean> {
    
    // Simulate provider switch
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    return Math.random() > 0.15; // 85% success rate
  }

  /**
   * Stop resource
   */
  private async stopResource(resourceId: string): Promise<boolean> {
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return Math.random() > 0.05; // 95% success rate
  }

  /**
   * Start resource
   */
  private async startResource(resourceId: string): Promise<boolean> {
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return Math.random() > 0.08; // 92% success rate
  }

  /**
   * Capture current resource state
   */
  private async captureResourceState(resourceId: string): Promise<any> {
    return {
      resourceId,
      timestamp: new Date(),
      capacity: Math.random(),
      provider: 'current-provider',
      status: 'running',
      cost: Math.random() * 1000
    };
  }

  /**
   * Calculate next execution time based on schedule
   */
  private calculateNextExecutionTime(schedule: ScheduledAction['schedule']): Date {
    const now = new Date();
    
    switch (schedule.type) {
      case 'cron':
        // Simplified - add 1 day for daily schedules
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      case 'interval':
        const intervalMs = parseInt(schedule.expression) * 1000;
        return new Date(now.getTime() + intervalMs);
      
      case 'one-time':
        // Already executed, set far in future
        return new Date('2099-01-01');
      
      case 'event-driven':
        // Check again in 1 hour
        return new Date(now.getTime() + 60 * 60 * 1000);
      
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Add a new scheduled action
   */
  addScheduledAction(action: Omit<ScheduledAction, 'id' | 'createdAt' | 'nextExecution'>): string {
    const id = `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const fullAction: ScheduledAction = {
      ...action,
      id,
      createdAt: new Date(),
      nextExecution: this.calculateNextExecutionTime(action.schedule)
    };
    
    this.scheduledActions.set(id, fullAction);
    
    
    return id;
  }

  /**
   * Remove scheduled action
   */
  removeScheduledAction(actionId: string): boolean {
    const removed = this.scheduledActions.delete(actionId);
    if (removed) {
    }
    return removed;
  }

  /**
   * Pause/resume scheduled action
   */
  updateActionStatus(actionId: string, status: 'active' | 'paused' | 'disabled'): boolean {
    const action = this.scheduledActions.get(actionId);
    if (action) {
      action.status = status;
      this.scheduledActions.set(actionId, action);
      return true;
    }
    return false;
  }

  /**
   * Get scheduler statistics
   */
  getSchedulerStatistics(): {
    totalActions: number;
    activeActions: number;
    pausedActions: number;
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    totalCostSavings: number;
    averageExecutionTime: number;
    nextExecution: Date | null;
  } {
    const actions = Array.from(this.scheduledActions.values());
    const logs = Array.from(this.executionLogs.values());
    
    const activeActions = actions.filter(a => a.status === 'active').length;
    const pausedActions = actions.filter(a => a.status === 'paused').length;
    const successfulExecutions = logs.filter(l => l.status === 'success').length;
    const failedExecutions = logs.filter(l => l.status === 'failure').length;
    const totalCostSavings = logs.reduce((sum, log) => sum + log.costImpact, 0);
    const averageExecutionTime = logs.length > 0 
      ? logs.reduce((sum, log) => sum + log.duration, 0) / logs.length 
      : 0;
    
    const nextActiveActions = actions.filter(a => a.status === 'active');
    const nextExecution = nextActiveActions.length > 0 
      ? nextActiveActions.reduce((earliest, action) => 
          action.nextExecution < earliest ? action.nextExecution : earliest, 
          nextActiveActions[0].nextExecution)
      : null;
    
    return {
      totalActions: actions.length,
      activeActions,
      pausedActions,
      totalExecutions: logs.length,
      successfulExecutions,
      failedExecutions,
      totalCostSavings: Math.round(totalCostSavings * 100) / 100,
      averageExecutionTime: Math.round(averageExecutionTime * 100) / 100,
      nextExecution
    };
  }

  /**
   * Get all scheduled actions
   */
  getScheduledActions(): Map<string, ScheduledAction> {
    return new Map(this.scheduledActions);
  }

  /**
   * Get execution logs
   */
  getExecutionLogs(): Map<string, SchedulerExecutionLog> {
    return new Map(this.executionLogs);
  }

  /**
   * Get upcoming executions
   */
  getUpcomingExecutions(hours: number = 24): ScheduledAction[] {
    const cutoff = new Date(Date.now() + hours * 60 * 60 * 1000);
    
    return Array.from(this.scheduledActions.values())
      .filter(action => 
        action.status === 'active' && 
        action.nextExecution <= cutoff
      )
      .sort((a, b) => a.nextExecution.getTime() - b.nextExecution.getTime());
  }
}

/**
 * Global resource scheduler instance
 */
export const resourceScheduler = new ResourceScheduler();