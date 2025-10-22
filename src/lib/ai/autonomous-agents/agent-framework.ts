import { createClient } from '@supabase/supabase-js';
import { aiService } from '../service';
import { chainOfThoughtEngine } from '../chain-of-thought';
import { supabaseAdmin } from '@/lib/supabase/admin';
import * as cron from 'node-cron';

export interface AgentCapability {
  name: string;
  description: string;
  requiredPermissions: string[];
  maxAutonomyLevel: 1 | 2 | 3 | 4 | 5; // 5 = full autonomy
  maxExecutionTime?: number; // milliseconds
  retryable?: boolean;
}

export interface AgentTask {
  id: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  data: any;
  deadline?: Date;
  scheduledFor?: Date;
  requiresApproval: boolean;
  retryCount?: number;
  maxRetries?: number;
  status?: 'pending' | 'in_progress' | 'completed' | 'failed' | 'waiting_approval';
  createdBy?: 'system' | 'user' | 'agent';
}

export interface AgentResult {
  taskId?: string;
  success: boolean;
  result: any;
  actions?: ExecutedAction[];
  insights?: string[];
  nextSteps?: string[];
  learnings?: Learning[];
  metadata?: any;
  executionTimeMs?: number;
  error?: string;
  executedActions?: ExecutedAction[];
}

export interface ExecutedAction {
  type: string;
  description: string;
  impact: any;
  reversible: boolean;
  rollbackPlan?: string;
  // Common optional properties used by various agents
  timestamp?: string | Date;
  category?: string;
  opportunityId?: string;
  annualSavings?: number;
  roi?: number;
  payback?: number;
  framework?: string;
  severity?: string;
  [key: string]: any; // Allow additional properties
}

export interface Learning {
  pattern?: string;
  context: string;
  insight: string;
  impact: number; // 0-1 scale
  confidence: number;
  applicableTo?: string[];
  timestamp: Date;
  metadata?: any;
}

export interface AgentConfig {
  agentId: string;
  capabilities: AgentCapability[];
  maxAutonomyLevel?: number;
  executionInterval?: number;
  requiredApprovals?: {
    critical?: string[];
    high?: string[];
    medium?: string[];
    low?: string[];
  };
  learningEnabled?: boolean;
  maxConcurrentTasks?: number;
  taskQueueSize?: number;
  errorThreshold?: number; // Error rate threshold for alerts
  performanceThreshold?: {
    minSuccessRate: number;
    maxResponseTime: number;
    maxMemoryUsage: number;
  };
}

export abstract class AutonomousAgent {
  protected organizationId: string;
  protected agentId: string;
  protected capabilities: AgentCapability[];
  protected learningEnabled: boolean = true;
  protected maxAutonomyLevel: number = 3;
  protected executionInterval: number;
  protected supabase: ReturnType<typeof createClient>;
  private isRunning: boolean = false;
  private runTimeout?: NodeJS.Timeout;
  private cronJobs: Map<string, cron.ScheduledTask> = new Map();
  private taskQueue: AgentTask[] = [];
  private activeTaskCount: number = 0;
  private maxConcurrentTasks: number = 3;
  private errorRate: number = 0;
  private successRate: number = 1;
  private avgResponseTime: number = 0;
  private totalExecutions: number = 0;
  private requiredApprovals: AgentConfig['requiredApprovals'];
  private performanceThreshold: AgentConfig['performanceThreshold'];
  
  // Getters for commonly accessed properties
  get id(): string { return this.agentId; }
  get organizationId_(): string { return this.organizationId; }
  
  constructor(organizationId: string, config: AgentConfig) {
    this.organizationId = organizationId;
    this.agentId = config.agentId;
    this.capabilities = config.capabilities;
    this.maxAutonomyLevel = config.maxAutonomyLevel || 3;
    this.executionInterval = config.executionInterval || 3600000; // Default 1 hour
    this.learningEnabled = config.learningEnabled !== false;
    this.maxConcurrentTasks = config.maxConcurrentTasks || 3;
    this.requiredApprovals = config.requiredApprovals || {};
    this.performanceThreshold = config.performanceThreshold || {
      minSuccessRate: 0.95,
      maxResponseTime: 5000,
      maxMemoryUsage: 500 * 1024 * 1024 // 500MB
    };
    this.supabase = createClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env['SUPABASE_SERVICE_KEY']! // Service key for autonomous operations
    );
  }
  
  // Core lifecycle
  async start() {
    this.isRunning = true;
    await this.logAgentEvent('started');

    // Initialize performance monitoring
    await this.initializePerformanceMonitoring();

    // Load previous learnings
    await this.loadPreviousLearnings();

    // Schedule autonomous tasks
    await this.scheduleAutonomousTasks();

    // Start task processing
    this.scheduleNextRun();
  }
  
  async stop() {
    this.isRunning = false;
    if (this.runTimeout) {
      clearTimeout(this.runTimeout);
    }
    await this.logAgentEvent('stopped');
  }
  
  // Main execution loop with REAL task processing
  private async run() {
    if (!this.isRunning) return;

    const startTime = Date.now();

    try {
      await this.logAgentEvent('run_started');

      // Plan new autonomous tasks based on current state
      const autonomousTasks = await this.planAutonomousTasks();
      this.taskQueue.push(...autonomousTasks);

      // Get pending tasks from database
      const dbTasks = await this.getPendingTasksFromDatabase();
      this.taskQueue.push(...dbTasks);

      // Process tasks with concurrency control
      const results = await this.processTasksConcurrently();

      // Update performance metrics
      await this.updatePerformanceMetrics(results, Date.now() - startTime);

      // Learn from all results
      if (this.learningEnabled) {
        await this.learnFromResults(results);
      }

      // Check for performance issues
      await this.checkPerformanceHealth();

      await this.logAgentEvent('run_completed', {
        tasksProcessed: results.length,
        successRate: this.successRate,
        avgResponseTime: this.avgResponseTime
      });

      // Schedule next run
      this.scheduleNextRun();
    } catch (error) {
      await this.handleError(error);
    }
  }
  
  // Abstract methods to implement
  abstract executeTask(task: AgentTask): Promise<AgentResult>;
  abstract planAutonomousTasks(): Promise<AgentTask[]>;
  abstract learn(result: AgentResult): Promise<Learning[]>;

  // Deprecated - keeping for backward compatibility
  async getScheduledTasks(): Promise<AgentTask[]> {
    return this.planAutonomousTasks();
  }
  
  // Optional methods that agents can override
  public async initialize?(): Promise<void>;
  protected async logResult?(taskId: string, result: AgentResult): Promise<void>;
  protected async logError?(taskId: string, error: Error, executionTime: number): Promise<void>;
  protected async storePattern?(patternType: string, patterns: any, confidence: number, metadata: any): Promise<void>;
  
  // Enhanced permission checking with approval workflows
  protected async canExecuteTask(task: AgentTask): Promise<boolean> {
    // Check capabilities
    const hasCapability = this.capabilities.some(cap =>
      task.type === cap.name || task.type.startsWith(cap.name)
    );

    if (!hasCapability) {
      return false;
    }

    // Check approval requirements based on priority
    const approvers = this.requiredApprovals?.[task.priority];
    if (task.requiresApproval || (approvers && approvers.length > 0)) {
      if (this.maxAutonomyLevel >= 5) {
        // Full autonomy - can execute without approval
        return true;
      }
      return await this.requestApproval(task, approvers || []);
    }

    return true;
  }
  
  // Enhanced approval system with role-based approvers
  protected async requestApproval(task: AgentTask, approvers: string[]): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('agent_approvals')
      .insert({
        agent_id: this.agentId,
        organization_id: this.organizationId,
        task: task,
        status: 'pending',
        required_approvers: approvers,
        priority: task.priority,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (error || !data) {
      console.error('Failed to create approval request:', error);
      return false;
    }
    
    // Wait for approval (with timeout)
    return this.waitForApproval(data.id as string, 3600000); // 1 hour timeout
  }
  
  private async waitForApproval(approvalId: string, timeout: number): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const { data, error } = await this.supabase
        .from('agent_approvals')
        .select('status')
        .eq('id', approvalId)
        .single();
        
      if (data?.status === 'approved') {
        return true;
      } else if (data?.status === 'rejected') {
        return false;
      }
      
      // Wait 5 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // Timeout - mark as expired
    await this.supabase
      .from('agent_approvals')
      .update({ status: 'expired' })
      .eq('id', approvalId);
      
    return false;
  }
  
  // Enhanced learning system that actually stores and uses knowledge
  protected async updateKnowledge(learning: Learning) {
    // Store in database
    const { error } = await supabaseAdmin
      .from('agent_learnings')
      .insert({
        agent_id: this.agentId,
        organization_id: this.organizationId,
        context: learning.context,
        insight: learning.insight,
        impact: learning.impact,
        confidence: learning.confidence,
        metadata: learning.metadata,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to store learning:', error);
    }

    // Apply learning immediately if high impact
    if (learning.impact > 0.7 && learning.confidence > 0.8) {
      await this.applyLearning(learning);
    }
  }

  // Apply learnings to improve agent behavior
  protected async applyLearning(learning: Learning): Promise<void> {
    // Update agent configuration based on learning

    // Store as active rule for future decisions
    await supabaseAdmin
      .from('agent_rules')
      .upsert({
        agent_id: this.agentId,
        organization_id: this.organizationId,
        rule_type: learning.context,
        rule_content: learning.insight,
        confidence: learning.confidence,
        active: true,
        created_at: new Date().toISOString()
      });
  }
  
  // Error handling
  protected async handleError(error: any) {
    console.error(`❌ ${this.agentId} error:`, error);
    
    await this.supabase
      .from('agent_errors')
      .insert({
        agent_id: this.agentId,
        organization_id: this.organizationId,
        error: error.message,
        stack: error.stack,
        created_at: new Date().toISOString()
      });
      
    // Attempt recovery
    if (this.isRunning) {
      this.scheduleNextRun();
    }
  }
  
  // Enhanced result reporting with performance tracking
  protected async reportResult(result: AgentResult) {
    const executedActions = result.executedActions || result.actions || [];
    const insights = result.insights || [];
    const nextSteps = result.nextSteps || [];

    await supabaseAdmin
      .from('agent_tasks')
      .insert({
        agent_id: this.agentId,
        organization_id: this.organizationId,
        task_type: result.taskId || 'unknown',
        status: result.success ? 'completed' : 'failed',
        result: {
          success: result.success,
          actions: executedActions,
          insights,
          nextSteps,
          metadata: result.metadata
        },
        execution_time_ms: result.executionTimeMs,
        error: result.error,
        executed_at: new Date().toISOString()
      });
  }
  
  // Agent event logging
  private async logAgentEvent(event: string, details?: any) {
    await this.supabase
      .from('agent_events')
      .insert({
        agent_id: this.agentId,
        organization_id: this.organizationId,
        event: event,
        details: details,
        created_at: new Date().toISOString()
      });
  }
  
  // Enhanced scheduling with cron support
  private scheduleNextRun() {
    if (!this.isRunning) return;

    this.runTimeout = setTimeout(() => this.run(), this.executionInterval);
  }

  // Schedule recurring tasks using cron
  protected scheduleCronTask(cronPattern: string, taskGenerator: () => AgentTask): void {
    if (!cron.validate(cronPattern)) {
      console.error(`Invalid cron pattern: ${cronPattern}`);
      return;
    }

    const job = cron.schedule(cronPattern, async () => {
      const task = taskGenerator();
      this.taskQueue.push(task);
    });

    this.cronJobs.set(`${this.agentId}_${cronPattern}`, job);
    job.start();
  }
  
  // Utility methods
  protected async getAgentKnowledge(pattern?: string): Promise<Learning[]> {
    let query = this.supabase
      .from('agent_knowledge')
      .select('learning')
      .eq('agent_id', this.agentId)
      .eq('organization_id', this.organizationId);

    if (pattern) {
      query = query.ilike('learning->pattern', `%${pattern}%`);
    }

    const { data, error } = await query;

    if (error || !data) return [];

    return data.map(d => d.learning as Learning);
  }

  /**
   * ✅ PHASE 4: Check if user has rejected this recommendation before
   *
   * Queries agent_learnings table to see if users have provided negative feedback
   * on this type of recommendation (e.g., "already have LED lights", "not relevant")
   *
   * @param recommendationType - The type of recommendation to check (e.g., 'led_retrofit', 'hvac_optimization')
   * @returns true if safe to recommend, false if user has rejected it before
   */
  protected async checkLearnings(recommendationType: string): Promise<boolean> {
    try {
      const { data: learnings, error } = await this.supabase
        .from('agent_learnings')
        .select('*')
        .eq('organization_id', this.organizationId)
        .eq('agent_id', this.agentId)
        .eq('recommendation_type', recommendationType)
        .in('feedback', ['already_installed', 'not_relevant'])
        .gte('confidence', 0.7);

      if (error) {
        console.error(`[${this.agentId}] Error checking learnings:`, error);
        return true; // On error, allow recommendation (fail open)
      }

      // If we found learnings indicating user doesn't want this, skip it
      if (learnings && learnings.length > 0) {
        console.log(`[${this.agentId}] Skipping ${recommendationType} - user previously rejected (${learnings[0].feedback})`);
        return false;
      }

      // Safe to recommend
      return true;
    } catch (error) {
      console.error(`[${this.agentId}] Error in checkLearnings:`, error);
      return true; // Fail open
    }
  }
  
  // Enhanced health check with performance metrics
  async getHealth() {
    const memoryUsage = process.memoryUsage();

    return {
      agentId: this.agentId,
      organizationId: this.organizationId,
      isRunning: this.isRunning,
      capabilities: this.capabilities.length,
      maxAutonomyLevel: this.maxAutonomyLevel,
      learningEnabled: this.learningEnabled,
      performance: {
        successRate: this.successRate,
        errorRate: this.errorRate,
        avgResponseTime: this.avgResponseTime,
        totalExecutions: this.totalExecutions,
        activeTaskCount: this.activeTaskCount,
        queueSize: this.taskQueue.length,
        memoryUsage: memoryUsage.heapUsed,
        isHealthy: this.isPerformanceHealthy()
      }
    };
  }

  // New helper methods for REAL functionality

  private async initializePerformanceMonitoring(): Promise<void> {
    // Load historical performance data
    const { data } = await supabaseAdmin
      .from('agent_performance')
      .select('*')
      .eq('agent_id', this.agentId)
      .eq('organization_id', this.organizationId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (data && data[0]) {
      this.successRate = data[0].success_rate || 1;
      this.errorRate = data[0].error_rate || 0;
      this.avgResponseTime = data[0].avg_response_time || 0;
      this.totalExecutions = data[0].total_executions || 0;
    }
  }

  private async loadPreviousLearnings(): Promise<void> {
    const { data } = await supabaseAdmin
      .from('agent_learnings')
      .select('*')
      .eq('agent_id', this.agentId)
      .eq('organization_id', this.organizationId)
      .gte('impact', 0.5)
      .order('created_at', { ascending: false })
      .limit(100);

    if (data) {
    }
  }

  private async scheduleAutonomousTasks(): Promise<void> {
    // This will be implemented by each specific agent
    const tasks = await this.planAutonomousTasks();
    this.taskQueue.push(...tasks);
  }

  private async getPendingTasksFromDatabase(): Promise<AgentTask[]> {
    const { data } = await supabaseAdmin
      .from('agent_task_queue')
      .select('*')
      .eq('agent_id', this.agentId)
      .eq('organization_id', this.organizationId)
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .limit(10);

    return data || [];
  }

  private async processTasksConcurrently(): Promise<AgentResult[]> {
    const results: AgentResult[] = [];
    const tasksToProcess = Math.min(this.taskQueue.length, this.maxConcurrentTasks - this.activeTaskCount);

    if (tasksToProcess === 0) return results;

    const tasks = this.taskQueue.splice(0, tasksToProcess);
    const promises = tasks.map(async (task) => {
      this.activeTaskCount++;
      try {
        if (await this.canExecuteTask(task)) {
          const result = await this.executeTaskWithRetry(task);
          await this.reportResult(result);
          return result;
        }
        return { success: false, result: null, error: 'Permission denied' };
      } finally {
        this.activeTaskCount--;
      }
    });

    const processedResults = await Promise.all(promises);
    results.push(...processedResults);

    return results;
  }

  private async executeTaskWithRetry(task: AgentTask): Promise<AgentResult> {
    const maxRetries = task.maxRetries || 3;
    let lastError: string | undefined;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await this.executeTask(task);
        if (result.success) {
          return result;
        }
        lastError = result.error;
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
      }

      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    return { success: false, result: null, error: lastError };
  }

  private async updatePerformanceMetrics(results: AgentResult[], executionTime: number): Promise<void> {
    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;

    this.totalExecutions += results.length;
    this.successRate = (this.successRate * (this.totalExecutions - results.length) + successful) / this.totalExecutions;
    this.errorRate = 1 - this.successRate;
    this.avgResponseTime = (this.avgResponseTime * (this.totalExecutions - results.length) + executionTime) / this.totalExecutions;

    // Store metrics in database
    await supabaseAdmin
      .from('agent_performance')
      .insert({
        agent_id: this.agentId,
        organization_id: this.organizationId,
        success_rate: this.successRate,
        error_rate: this.errorRate,
        avg_response_time: this.avgResponseTime,
        total_executions: this.totalExecutions,
        tasks_processed: results.length,
        successful_tasks: successful,
        failed_tasks: failed,
        created_at: new Date().toISOString()
      });
  }

  private async learnFromResults(results: AgentResult[]): Promise<void> {
    for (const result of results) {
      if (result.learnings && result.learnings.length > 0) {
        for (const learning of result.learnings) {
          await this.updateKnowledge(learning);
        }
      } else {
        // Generate learnings from result
        const generatedLearnings = await this.learn(result);
        for (const learning of generatedLearnings) {
          await this.updateKnowledge(learning);
        }
      }
    }
  }

  private async checkPerformanceHealth(): Promise<void> {
    if (!this.isPerformanceHealthy()) {
      await this.logAgentEvent('performance_degradation', {
        successRate: this.successRate,
        errorRate: this.errorRate,
        avgResponseTime: this.avgResponseTime
      });

      // Send alert
      await supabaseAdmin
        .from('agent_alerts')
        .insert({
          agent_id: this.agentId,
          organization_id: this.organizationId,
          type: 'performance_degradation',
          severity: this.successRate < 0.8 ? 'critical' : 'warning',
          message: `Performance degradation detected: Success rate ${(this.successRate * 100).toFixed(1)}%`,
          created_at: new Date().toISOString()
        });
    }
  }

  private isPerformanceHealthy(): boolean {
    const memoryUsage = process.memoryUsage();
    return (
      this.successRate >= this.performanceThreshold.minSuccessRate &&
      this.avgResponseTime <= this.performanceThreshold.maxResponseTime &&
      memoryUsage.heapUsed <= this.performanceThreshold.maxMemoryUsage
    );
  }
}