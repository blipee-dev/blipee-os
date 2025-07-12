import { createClient } from '@supabase/supabase-js';
import { AutonomousAgent, AgentTask, ExecutedAction } from './agent-framework';

export interface AgentError {
  id: string;
  agentId: string;
  organizationId: string;
  error: Error;
  task?: AgentTask;
  context: Record<string, any>;
  timestamp: Date;
  recovered: boolean;
  recoveryAction?: string;
}

export interface RecoveryStrategy {
  errorType: string;
  strategy: 'retry' | 'rollback' | 'escalate' | 'ignore';
  maxRetries?: number;
  retryDelay?: number;
  escalationLevel?: string;
}

export interface RollbackAction {
  actionId: string;
  actionType: string;
  rollbackMethod: () => Promise<void>;
  priority: number;
}

export class AgentErrorHandler {
  private supabase: ReturnType<typeof createClient>;
  private recoveryStrategies: Map<string, RecoveryStrategy> = new Map();
  private rollbackRegistry: Map<string, RollbackAction[]> = new Map();
  
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
    
    this.initializeRecoveryStrategies();
  }
  
  // Initialize default recovery strategies
  private initializeRecoveryStrategies(): void {
    // Network errors - retry with backoff
    this.recoveryStrategies.set('NetworkError', {
      errorType: 'NetworkError',
      strategy: 'retry',
      maxRetries: 3,
      retryDelay: 5000
    });
    
    // Permission errors - escalate
    this.recoveryStrategies.set('PermissionError', {
      errorType: 'PermissionError',
      strategy: 'escalate',
      escalationLevel: 'admin'
    });
    
    // Data validation errors - rollback
    this.recoveryStrategies.set('ValidationError', {
      errorType: 'ValidationError',
      strategy: 'rollback'
    });
    
    // Rate limit errors - retry with longer delay
    this.recoveryStrategies.set('RateLimitError', {
      errorType: 'RateLimitError',
      strategy: 'retry',
      maxRetries: 5,
      retryDelay: 60000 // 1 minute
    });
    
    // Unknown errors - escalate
    this.recoveryStrategies.set('UnknownError', {
      errorType: 'UnknownError',
      strategy: 'escalate',
      escalationLevel: 'emergency'
    });
  }
  
  // Handle error with recovery attempt
  async handleError(
    error: Error,
    agent: AutonomousAgent,
    task?: AgentTask,
    executedActions?: ExecutedAction[]
  ): Promise<boolean> {
    console.error(`❌ Agent error: ${error.message}`, error);
    
    // Log the error
    const agentError = await this.logError(error, agent, task);
    
    // Determine error type
    const errorType = this.classifyError(error);
    
    // Get recovery strategy
    const strategy = this.recoveryStrategies.get(errorType) || 
                    this.recoveryStrategies.get('UnknownError')!;
    
    // Execute recovery strategy
    let recovered = false;
    switch (strategy.strategy) {
      case 'retry':
        recovered = await this.retryTask(agent, task, strategy);
        break;
        
      case 'rollback':
        recovered = await this.rollbackActions(agent, executedActions || []);
        break;
        
      case 'escalate':
        recovered = await this.escalateError(agentError, strategy);
        break;
        
      case 'ignore':
        console.log('Ignoring error as per strategy');
        recovered = true;
        break;
    }
    
    // Update error record with recovery status
    await this.updateErrorStatus(agentError.id, recovered, strategy.strategy);
    
    return recovered;
  }
  
  // Register rollback action for an executed action
  registerRollbackAction(
    agentId: string,
    actionId: string,
    actionType: string,
    rollbackMethod: () => Promise<void>,
    priority: number = 0
  ): void {
    if (!this.rollbackRegistry.has(agentId)) {
      this.rollbackRegistry.set(agentId, []);
    }
    
    const actions = this.rollbackRegistry.get(agentId)!;
    actions.push({
      actionId,
      actionType,
      rollbackMethod,
      priority
    });
    
    // Keep only last 100 actions per agent
    if (actions.length > 100) {
      actions.shift();
    }
  }
  
  // Rollback executed actions
  async rollback(
    agent: AutonomousAgent,
    actions: ExecutedAction[]
  ): Promise<boolean> {
    const agentId = agent['agentId'];
    const rollbackActions = this.rollbackRegistry.get(agentId) || [];
    
    // Filter actions that can be rolled back
    const reversibleActions = actions.filter(a => a.reversible);
    
    if (reversibleActions.length === 0) {
      console.log('No reversible actions to rollback');
      return true;
    }
    
    console.log(`🔄 Rolling back ${reversibleActions.length} actions...`);
    
    // Sort by priority (higher priority rolled back first)
    const sortedActions = rollbackActions
      .filter(ra => reversibleActions.some(a => a.type === ra.actionType))
      .sort((a, b) => b.priority - a.priority);
    
    let allSuccessful = true;
    
    for (const rollbackAction of sortedActions) {
      try {
        await rollbackAction.rollbackMethod();
        console.log(`✅ Rolled back ${rollbackAction.actionType}`);
        
        // Log rollback
        await this.logRollback(agentId, rollbackAction.actionType, true);
      } catch (error) {
        console.error(`Failed to rollback ${rollbackAction.actionType}:`, error);
        allSuccessful = false;
        
        // Log failed rollback
        await this.logRollback(agentId, rollbackAction.actionType, false, error as Error);
      }
    }
    
    return allSuccessful;
  }
  
  // Clear rollback registry for an agent
  clearRollbackRegistry(agentId: string): void {
    this.rollbackRegistry.delete(agentId);
  }
  
  // Classify error type
  private classifyError(error: Error): string {
    const message = error.message.toLowerCase();
    const name = error.name;
    
    // Network errors
    if (name === 'NetworkError' || 
        message.includes('network') || 
        message.includes('fetch') ||
        message.includes('connection')) {
      return 'NetworkError';
    }
    
    // Permission errors
    if (message.includes('permission') || 
        message.includes('unauthorized') ||
        message.includes('forbidden')) {
      return 'PermissionError';
    }
    
    // Validation errors
    if (name === 'ValidationError' || 
        message.includes('validation') ||
        message.includes('invalid')) {
      return 'ValidationError';
    }
    
    // Rate limit errors
    if (message.includes('rate limit') || 
        message.includes('too many requests')) {
      return 'RateLimitError';
    }
    
    // Database errors
    if (message.includes('database') || 
        message.includes('supabase') ||
        message.includes('postgres')) {
      return 'DatabaseError';
    }
    
    return 'UnknownError';
  }
  
  // Log error to database
  private async logError(
    error: Error,
    agent: AutonomousAgent,
    task?: AgentTask
  ): Promise<AgentError> {
    const health = await agent.getHealth();
    
    const errorRecord = {
      agent_id: health.agentId,
      organization_id: health.organizationId,
      error: error.message,
      stack: error.stack,
      context: {
        task: task ? { id: task.id, type: task.type } : null,
        errorType: this.classifyError(error),
        agentHealth: health
      },
      created_at: new Date().toISOString()
    };
    
    const { data } = await this.supabase
      .from('agent_errors')
      .insert(errorRecord)
      .select()
      .single();
    
    return {
      id: data?.id || '',
      agentId: health.agentId,
      organizationId: health.organizationId,
      error,
      task,
      context: errorRecord.context,
      timestamp: new Date(),
      recovered: false
    };
  }
  
  // Update error status after recovery attempt
  private async updateErrorStatus(
    errorId: string,
    recovered: boolean,
    recoveryAction: string
  ): Promise<void> {
    await this.supabase
      .from('agent_errors')
      .update({
        context: {
          recovered,
          recoveryAction,
          recoveredAt: recovered ? new Date().toISOString() : null
        }
      })
      .eq('id', errorId);
  }
  
  // Retry task with backoff
  private async retryTask(
    agent: AutonomousAgent,
    task?: AgentTask,
    strategy: RecoveryStrategy
  ): Promise<boolean> {
    if (!task || !strategy.maxRetries) return false;
    
    let retries = 0;
    const delay = strategy.retryDelay || 5000;
    
    while (retries < strategy.maxRetries) {
      retries++;
      console.log(`🔄 Retry attempt ${retries}/${strategy.maxRetries}...`);
      
      // Wait with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, retries - 1)));
      
      try {
        // Attempt to execute task again
        const result = await agent.executeTask(task);
        if (result.success) {
          console.log(`✅ Task succeeded on retry ${retries}`);
          return true;
        }
      } catch (error) {
        console.error(`Retry ${retries} failed:`, error);
      }
    }
    
    return false;
  }
  
  // Rollback executed actions
  private async rollbackActions(
    agent: AutonomousAgent,
    executedActions: ExecutedAction[]
  ): Promise<boolean> {
    return await this.rollback(agent, executedActions);
  }
  
  // Escalate error to humans
  private async escalateError(
    error: AgentError,
    strategy: RecoveryStrategy
  ): Promise<boolean> {
    console.log(`🚨 Escalating error to ${strategy.escalationLevel} level`);
    
    // Create escalation notification
    const { data: admins } = await this.supabase
      .from('team_members')
      .select('user_id')
      .eq('organization_id', error.organizationId)
      .in('role', ['account_owner', 'sustainability_manager']);
    
    if (!admins || admins.length === 0) {
      console.error('No admins found for escalation');
      return false;
    }
    
    // Create urgent notifications
    const notifications = admins.map(admin => ({
      user_id: admin.user_id,
      type: 'agent_error_escalation',
      title: `🚨 Agent Error: ${error.agentId}`,
      message: `Critical error requires immediate attention: ${error.error.message}`,
      priority: 'urgent',
      data: {
        errorId: error.id,
        agentId: error.agentId,
        errorType: error.context.errorType,
        taskType: error.task?.type,
        escalationLevel: strategy.escalationLevel
      },
      created_at: new Date().toISOString()
    }));
    
    await this.supabase
      .from('notifications')
      .insert(notifications);
    
    // Log escalation
    await this.supabase
      .from('agent_events')
      .insert({
        agent_id: error.agentId,
        organization_id: error.organizationId,
        event: 'error_escalated',
        details: {
          errorId: error.id,
          escalationLevel: strategy.escalationLevel,
          notifiedUsers: admins.length
        }
      });
    
    return true; // Escalation successful
  }
  
  // Log rollback attempt
  private async logRollback(
    agentId: string,
    actionType: string,
    success: boolean,
    error?: Error
  ): Promise<void> {
    await this.supabase
      .from('agent_events')
      .insert({
        agent_id: agentId,
        organization_id: 'system', // TODO: Get from context
        event: 'rollback_attempt',
        details: {
          actionType,
          success,
          error: error?.message
        }
      });
  }
  
  // Get error statistics
  async getErrorStats(
    agentId: string,
    organizationId: string,
    timeRange: { start: Date; end: Date }
  ): Promise<{
    totalErrors: number;
    errorsByType: Record<string, number>;
    recoveryRate: number;
    mostCommonErrors: Array<{ error: string; count: number }>;
  }> {
    const { data: errors } = await this.supabase
      .from('agent_errors')
      .select('*')
      .eq('agent_id', agentId)
      .eq('organization_id', organizationId)
      .gte('created_at', timeRange.start.toISOString())
      .lte('created_at', timeRange.end.toISOString());
    
    if (!errors || errors.length === 0) {
      return {
        totalErrors: 0,
        errorsByType: {},
        recoveryRate: 0,
        mostCommonErrors: []
      };
    }
    
    // Calculate statistics
    const errorsByType: Record<string, number> = {};
    const errorMessages: Record<string, number> = {};
    let recoveredCount = 0;
    
    for (const error of errors) {
      const errorType = error.context?.errorType || 'Unknown';
      errorsByType[errorType] = (errorsByType[errorType] || 0) + 1;
      
      errorMessages[error.error] = (errorMessages[error.error] || 0) + 1;
      
      if (error.context?.recovered) {
        recoveredCount++;
      }
    }
    
    const mostCommonErrors = Object.entries(errorMessages)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([error, count]) => ({ error, count }));
    
    return {
      totalErrors: errors.length,
      errorsByType,
      recoveryRate: errors.length > 0 ? recoveredCount / errors.length : 0,
      mostCommonErrors
    };
  }
}