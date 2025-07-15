/**
 * Base Autonomous Agent
 * Foundation class for all autonomous agents
 */

export interface AgentCapability {
  name: string;
  description: string;
  confidence: number;
  lastUsed?: Date;
}

export interface AgentTask {
  id: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
}

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  version: string;
  capabilities: AgentCapability[];
  maxConcurrentTasks: number;
  retryAttempts: number;
}

export abstract class BaseAutonomousAgent {
  protected config: AgentConfig;
  protected tasks: Map<string, AgentTask> = new Map();
  protected isActive: boolean = false;
  protected metrics: {
    tasksCompleted: number;
    tasksErrored: number;
    averageResponseTime: number;
    lastActivity?: Date;
  };

  constructor(config: AgentConfig) {
    this.config = config;
    this.metrics = {
      tasksCompleted: 0,
      tasksErrored: 0,
      averageResponseTime: 0
    };
  }

  // Abstract methods that must be implemented by subclasses
  abstract executeTask(task: AgentTask): Promise<any>;
  abstract validateInput(input: any): boolean;
  abstract getCapabilities(): AgentCapability[];

  // Common agent functionality
  async start(): Promise<void> {
    this.isActive = true;
    console.log(`Agent ${this.config.name} started`);
  }

  async stop(): Promise<void> {
    this.isActive = false;
    console.log(`Agent ${this.config.name} stopped`);
  }

  async addTask(task: Omit<AgentTask, 'id' | 'createdAt' | 'status'>): Promise<string> {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newTask: AgentTask = {
      id: taskId,
      ...task,
      createdAt: new Date(),
      status: 'pending'
    };

    this.tasks.set(taskId, newTask);
    
    // Auto-execute if agent is active
    if (this.isActive) {
      this.processTask(taskId);
    }

    return taskId;
  }

  private async processTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) return;

    const startTime = Date.now();
    
    try {
      task.status = 'in_progress';
      this.tasks.set(taskId, task);

      const result = await this.executeTask(task);
      
      task.status = 'completed';
      task.result = result;
      task.completedAt = new Date();
      
      this.metrics.tasksCompleted++;
      this.metrics.lastActivity = new Date();
      
      // Update average response time
      const responseTime = Date.now() - startTime;
      this.metrics.averageResponseTime = 
        (this.metrics.averageResponseTime * (this.metrics.tasksCompleted - 1) + responseTime) / 
        this.metrics.tasksCompleted;

    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : String(error);
      task.completedAt = new Date();
      
      this.metrics.tasksErrored++;
      
      console.error(`Task ${taskId} failed for agent ${this.config.name}:`, error);
    }

    this.tasks.set(taskId, task);
  }

  getTask(taskId: string): AgentTask | undefined {
    return this.tasks.get(taskId);
  }

  getTasks(status?: AgentTask['status']): AgentTask[] {
    const allTasks = Array.from(this.tasks.values());
    return status ? allTasks.filter(task => task.status === status) : allTasks;
  }

  getMetrics() {
    return {
      ...this.metrics,
      activeTasks: this.getTasks('pending').length + this.getTasks('in_progress').length,
      isActive: this.isActive,
      config: this.config
    };
  }

  getHealth(): { status: 'healthy' | 'degraded' | 'unhealthy'; details: any } {
    const errorRate = this.metrics.tasksErrored / (this.metrics.tasksCompleted + this.metrics.tasksErrored);
    const hasRecentActivity = this.metrics.lastActivity && 
      (Date.now() - this.metrics.lastActivity.getTime()) < 300000; // 5 minutes

    if (!this.isActive) {
      return { status: 'unhealthy', details: { reason: 'Agent not active' } };
    }

    if (errorRate > 0.5) {
      return { status: 'unhealthy', details: { reason: 'High error rate', errorRate } };
    }

    if (errorRate > 0.2) {
      return { status: 'degraded', details: { reason: 'Elevated error rate', errorRate } };
    }

    if (!hasRecentActivity && this.metrics.tasksCompleted > 0) {
      return { status: 'degraded', details: { reason: 'No recent activity' } };
    }

    return { status: 'healthy', details: { errorRate, hasRecentActivity } };
  }
}