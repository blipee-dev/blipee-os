import { createClient } from '@supabase/supabase-js';
import { aiService } from '../service';
import { chainOfThoughtEngine } from '../chain-of-thought';

export interface AgentCapability {
  name: string;
  description: string;
  requiredPermissions: string[];
  maxAutonomyLevel: 1 | 2 | 3 | 4 | 5; // 5 = full autonomy
}

export interface AgentTask {
  id: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  data: any;
  deadline?: Date;
  requiresApproval: boolean;
}

export interface AgentResult {
  taskId: string;
  success: boolean;
  actions: ExecutedAction[];
  insights: string[];
  nextSteps: string[];
  learnings: Learning[];
}

export interface ExecutedAction {
  type: string;
  description: string;
  impact: any;
  reversible: boolean;
  rollbackPlan?: string;
}

export interface Learning {
  pattern: string;
  confidence: number;
  applicableTo: string[];
}

export interface AgentConfig {
  agentId: string;
  capabilities: AgentCapability[];
  maxAutonomyLevel?: number;
  executionInterval?: number;
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
  
  constructor(organizationId: string, config: AgentConfig) {
    this.organizationId = organizationId;
    this.agentId = config.agentId;
    this.capabilities = config.capabilities;
    this.maxAutonomyLevel = config.maxAutonomyLevel || 3;
    this.executionInterval = config.executionInterval || 3600000; // Default 1 hour
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY! // Service key for autonomous operations
    );
  }
  
  // Core lifecycle
  async start() {
    console.log(`🤖 ${this.agentId} starting for org ${this.organizationId}`);
    this.isRunning = true;
    await this.logAgentEvent('started');
    this.scheduleNextRun();
  }
  
  async stop() {
    console.log(`🛑 ${this.agentId} stopping`);
    this.isRunning = false;
    if (this.runTimeout) {
      clearTimeout(this.runTimeout);
    }
    await this.logAgentEvent('stopped');
  }
  
  // Main execution loop
  private async run() {
    if (!this.isRunning) return;
    
    try {
      await this.logAgentEvent('run_started');
      
      // Get tasks for this agent
      const tasks = await this.getScheduledTasks();
      
      for (const task of tasks) {
        // Check if we have permission for this task
        if (await this.canExecuteTask(task)) {
          const result = await this.executeTask(task);
          await this.reportResult(result);
          
          if (this.learningEnabled) {
            await this.learn(result);
          }
        }
      }
      
      await this.logAgentEvent('run_completed');
      
      // Schedule next run
      this.scheduleNextRun();
    } catch (error) {
      await this.handleError(error);
    }
  }
  
  // Abstract methods to implement
  abstract async executeTask(task: AgentTask): Promise<AgentResult>;
  abstract async getScheduledTasks(): Promise<AgentTask[]>;
  abstract async learn(result: AgentResult): Promise<void>;
  
  // Permission checking
  protected async canExecuteTask(task: AgentTask): Promise<boolean> {
    // Check autonomy level
    if (task.requiresApproval && this.maxAutonomyLevel < 5) {
      return await this.requestApproval(task);
    }
    
    // Check capabilities
    const hasCapability = this.capabilities.some(cap => 
      task.type.startsWith(cap.name)
    );
    
    return hasCapability;
  }
  
  // Human-in-the-loop for critical decisions
  protected async requestApproval(task: AgentTask): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('agent_approvals')
      .insert({
        agent_id: this.agentId,
        organization_id: this.organizationId,
        task: task,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (error || !data) {
      console.error('Failed to create approval request:', error);
      return false;
    }
    
    // Wait for approval (with timeout)
    return this.waitForApproval(data.id, 3600000); // 1 hour timeout
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
  
  // Learning system
  protected async updateKnowledge(learning: Learning) {
    await this.supabase
      .from('agent_knowledge')
      .insert({
        agent_id: this.agentId,
        organization_id: this.organizationId,
        learning: learning,
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
      console.log(`🔄 ${this.agentId} attempting recovery...`);
      this.scheduleNextRun();
    }
  }
  
  // Result reporting
  protected async reportResult(result: AgentResult) {
    await this.supabase
      .from('agent_results')
      .insert({
        agent_id: this.agentId,
        organization_id: this.organizationId,
        task_id: result.taskId,
        success: result.success,
        actions: result.actions,
        insights: result.insights,
        next_steps: result.nextSteps,
        created_at: new Date().toISOString()
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
  
  // Scheduling
  private scheduleNextRun() {
    if (!this.isRunning) return;
    
    this.runTimeout = setTimeout(() => this.run(), this.executionInterval);
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
  
  // Health check
  async getHealth() {
    return {
      agentId: this.agentId,
      organizationId: this.organizationId,
      isRunning: this.isRunning,
      capabilities: this.capabilities.length,
      maxAutonomyLevel: this.maxAutonomyLevel,
      learningEnabled: this.learningEnabled
    };
  }
}