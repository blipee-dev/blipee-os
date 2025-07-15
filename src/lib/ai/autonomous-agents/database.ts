import { createClient } from '@supabase/supabase-js'
import type { Database } from '../../database/types'
import type {
  AgentDefinition,
  AgentInstance,
  AgentInstanceInsert,
  AgentInstanceUpdate,
  AgentScheduledTask,
  AgentScheduledTaskInsert,
  AgentTaskExecution,
  AgentTaskExecutionInsert,
  AgentTaskExecutionUpdate,
  AgentApproval,
  AgentApprovalInsert,
  AgentApprovalUpdate,
  AgentLearningPattern,
  AgentLearningPatternInsert,
  AgentMetric,
  AgentMetricInsert,
  AgentDecision,
  AgentDecisionInsert,
  AgentCollaboration,
  AgentCollaborationInsert,
  AgentInstanceWithDefinition,
  AgentStatus,
  TaskStatus,
  TaskPriority,
  ApprovalStatus
} from '../../database/types'

export class AgentDatabase {
  private supabase: ReturnType<typeof createClient<Database>>

  constructor() {
    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  // Agent Definitions
  async getAgentDefinitions(): Promise<AgentDefinition[]> {
    const { data, error } = await this.supabase
      .from('agent_definitions')
      .select('*')
      .order('name')

    if (error) throw error
    return data || []
  }

  async getAgentDefinitionByType(type: string): Promise<AgentDefinition | null> {
    const { data, error } = await this.supabase
      .from('agent_definitions')
      .select('*')
      .eq('type', type)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  // Agent Instances
  async getAgentInstances(organizationId: string): Promise<AgentInstanceWithDefinition[]> {
    const { data, error } = await this.supabase
      .from('agent_instances')
      .select(`
        *,
        agent_definition:agent_definitions(*)
      `)
      .eq('organization_id', organizationId)
      .order('created_at')

    if (error) throw error
    return data || []
  }

  async getAgentInstance(id: string): Promise<AgentInstanceWithDefinition | null> {
    const { data, error } = await this.supabase
      .from('agent_instances')
      .select(`
        *,
        agent_definition:agent_definitions(*)
      `)
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async createAgentInstance(instance: AgentInstanceInsert): Promise<AgentInstance> {
    const { data, error } = await this.supabase
      .from('agent_instances')
      .insert(instance)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateAgentInstance(id: string, updates: AgentInstanceUpdate): Promise<AgentInstance> {
    const { data, error } = await this.supabase
      .from('agent_instances')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateAgentStatus(id: string, status: AgentStatus): Promise<void> {
    const { error } = await this.supabase
      .from('agent_instances')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
  }

  async updateAgentHealth(id: string, healthScore: number): Promise<void> {
    const { error } = await this.supabase.rpc('update_agent_health', {
      p_agent_instance_id: id,
      p_health_score: healthScore
    })

    if (error) throw error
  }

  async initializeAgentsForOrganization(organizationId: string): Promise<void> {
    const { error } = await this.supabase.rpc('initialize_agents_for_organization', {
      org_id: organizationId
    })

    if (error) throw error
  }

  // Scheduled Tasks
  async getScheduledTasks(agentInstanceId: string): Promise<AgentScheduledTask[]> {
    const { data, error } = await this.supabase
      .from('agent_scheduled_tasks')
      .select('*')
      .eq('agent_instance_id', agentInstanceId)
      .eq('is_active', true)
      .order('next_run')

    if (error) throw error
    return data || []
  }

  async getDueScheduledTasks(): Promise<AgentScheduledTask[]> {
    const { data, error } = await this.supabase
      .from('agent_scheduled_tasks')
      .select('*')
      .eq('is_active', true)
      .lte('next_run', new Date().toISOString())
      .order('priority', { ascending: false })

    if (error) throw error
    return data || []
  }

  async createScheduledTask(task: AgentScheduledTaskInsert): Promise<AgentScheduledTask> {
    const { data, error } = await this.supabase
      .from('agent_scheduled_tasks')
      .insert(task)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async scheduleAgentTask(
    agentInstanceId: string,
    taskType: string,
    taskName: string,
    schedulePattern: string,
    priority: TaskPriority = 'medium',
    taskConfig: any = {}
  ): Promise<string> {
    const { data, error } = await this.supabase.rpc('schedule_agent_task', {
      p_agent_instance_id: agentInstanceId,
      p_task_type: taskType,
      p_task_name: taskName,
      p_schedule_pattern: schedulePattern,
      p_priority: priority,
      p_task_config: taskConfig
    })

    if (error) throw error
    return data
  }

  async updateScheduledTaskNextRun(taskId: string, nextRun: string): Promise<void> {
    const { error } = await this.supabase
      .from('agent_scheduled_tasks')
      .update({ next_run: nextRun, last_run: new Date().toISOString() })
      .eq('id', taskId)

    if (error) throw error
  }

  // Task Executions
  async getTaskExecutions(agentInstanceId: string, limit: number = 100): Promise<AgentTaskExecution[]> {
    const { data, error } = await this.supabase
      .from('agent_task_executions')
      .select('*')
      .eq('agent_instance_id', agentInstanceId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }

  async getTaskExecution(id: string): Promise<AgentTaskExecution | null> {
    const { data, error } = await this.supabase
      .from('agent_task_executions')
      .select('*')
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async createTaskExecution(execution: AgentTaskExecutionInsert): Promise<AgentTaskExecution> {
    const { data, error } = await this.supabase
      .from('agent_task_executions')
      .insert(execution)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateTaskExecution(id: string, updates: AgentTaskExecutionUpdate): Promise<AgentTaskExecution> {
    const { data, error } = await this.supabase
      .from('agent_task_executions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async executeAgentTask(
    agentInstanceId: string,
    taskType: string,
    taskName: string,
    inputData: any = {},
    priority: TaskPriority = 'medium'
  ): Promise<string> {
    const { data, error } = await this.supabase.rpc('execute_agent_task', {
      p_agent_instance_id: agentInstanceId,
      p_task_type: taskType,
      p_task_name: taskName,
      p_input_data: inputData,
      p_priority: priority
    })

    if (error) throw error
    return data
  }

  async completeTaskExecution(
    id: string,
    outputData: any,
    status: TaskStatus = 'completed'
  ): Promise<void> {
    const now = new Date().toISOString()
    const { error } = await this.supabase
      .from('agent_task_executions')
      .update({
        status,
        output_data: outputData,
        completed_at: now
      })
      .eq('id', id)

    if (error) throw error
  }

  async failTaskExecution(id: string, errorMessage: string): Promise<void> {
    const { error } = await this.supabase
      .from('agent_task_executions')
      .update({
        status: 'failed',
        error_message: errorMessage,
        completed_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) throw error
  }

  // Approvals
  async getPendingApprovals(agentInstanceId?: string): Promise<AgentApproval[]> {
    let query = this.supabase
      .from('agent_approvals')
      .select('*')
      .eq('status', 'pending')

    if (agentInstanceId) {
      query = query.eq('agent_instance_id', agentInstanceId)
    }

    const { data, error } = await query.order('created_at')

    if (error) throw error
    return data || []
  }

  async createApproval(approval: AgentApprovalInsert): Promise<AgentApproval> {
    const { data, error } = await this.supabase
      .from('agent_approvals')
      .insert(approval)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateApproval(id: string, updates: AgentApprovalUpdate): Promise<AgentApproval> {
    const { data, error } = await this.supabase
      .from('agent_approvals')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async approveAction(
    id: string,
    approvedBy: string,
    reason?: string
  ): Promise<void> {
    const { error } = await this.supabase
      .from('agent_approvals')
      .update({
        status: 'approved',
        approved_by: approvedBy,
        approval_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) throw error
  }

  async rejectAction(
    id: string,
    approvedBy: string,
    reason?: string
  ): Promise<void> {
    const { error } = await this.supabase
      .from('agent_approvals')
      .update({
        status: 'rejected',
        approved_by: approvedBy,
        approval_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) throw error
  }

  // Learning Patterns
  async getLearningPatterns(agentInstanceId: string): Promise<AgentLearningPattern[]> {
    const { data, error } = await this.supabase
      .from('agent_learning_patterns')
      .select('*')
      .eq('agent_instance_id', agentInstanceId)
      .order('success_rate', { ascending: false })

    if (error) throw error
    return data || []
  }

  async createLearningPattern(pattern: AgentLearningPatternInsert): Promise<AgentLearningPattern> {
    const { data, error } = await this.supabase
      .from('agent_learning_patterns')
      .insert(pattern)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateLearningPatternSuccess(
    id: string,
    successful: boolean
  ): Promise<void> {
    const pattern = await this.supabase
      .from('agent_learning_patterns')
      .select('usage_count, success_rate')
      .eq('id', id)
      .single()

    if (pattern.error) throw pattern.error

    const currentUsage = pattern.data.usage_count
    const currentSuccessRate = pattern.data.success_rate
    const newUsage = currentUsage + 1
    const newSuccessRate = successful
      ? (currentSuccessRate * currentUsage + 1) / newUsage
      : (currentSuccessRate * currentUsage) / newUsage

    const { error } = await this.supabase
      .from('agent_learning_patterns')
      .update({
        usage_count: newUsage,
        success_rate: newSuccessRate,
        last_used: new Date().toISOString()
      })
      .eq('id', id)

    if (error) throw error
  }

  // Metrics
  async recordMetric(metric: AgentMetricInsert): Promise<void> {
    const { error } = await this.supabase
      .from('agent_metrics')
      .insert(metric)

    if (error) throw error
  }

  async getMetrics(
    agentInstanceId: string,
    metricType?: string,
    limit: number = 1000
  ): Promise<AgentMetric[]> {
    let query = this.supabase
      .from('agent_metrics')
      .select('*')
      .eq('agent_instance_id', agentInstanceId)

    if (metricType) {
      query = query.eq('metric_type', metricType)
    }

    const { data, error } = await query
      .order('recorded_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }

  // Decisions
  async recordDecision(decision: AgentDecisionInsert): Promise<string> {
    const { data, error } = await this.supabase.rpc('record_agent_decision', {
      p_agent_instance_id: decision.agent_instance_id,
      p_task_execution_id: decision.task_execution_id || null,
      p_decision_type: decision.decision_type,
      p_decision_context: decision.decision_context,
      p_decision_outcome: decision.decision_outcome,
      p_confidence_score: decision.confidence_score || 0,
      p_autonomy_level_used: decision.autonomy_level_used || 1
    })

    if (error) throw error
    return data
  }

  async getDecisions(
    agentInstanceId: string,
    limit: number = 100
  ): Promise<AgentDecision[]> {
    const { data, error } = await this.supabase
      .from('agent_decisions')
      .select('*')
      .eq('agent_instance_id', agentInstanceId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }

  // Collaborations
  async createCollaboration(collaboration: AgentCollaborationInsert): Promise<AgentCollaboration> {
    const { data, error } = await this.supabase
      .from('agent_collaborations')
      .insert(collaboration)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getActiveCollaborations(agentInstanceId: string): Promise<AgentCollaboration[]> {
    const { data, error } = await this.supabase
      .from('agent_collaborations')
      .select('*')
      .or(`initiator_agent_id.eq.${agentInstanceId},collaborator_agent_id.eq.${agentInstanceId}`)
      .eq('status', 'active')
      .order('created_at')

    if (error) throw error
    return data || []
  }

  // Utility functions
  async getAgentHealthScores(organizationId: string): Promise<{ [agentId: string]: number }> {
    const { data, error } = await this.supabase
      .from('agent_instances')
      .select('id, health_score')
      .eq('organization_id', organizationId)

    if (error) throw error

    const healthScores: { [agentId: string]: number } = {}
    data?.forEach(agent => {
      healthScores[agent.id] = agent.health_score
    })

    return healthScores
  }

  async getAgentStatistics(agentInstanceId: string): Promise<{
    totalTasks: number
    completedTasks: number
    failedTasks: number
    averageExecutionTime: number
    successRate: number
  }> {
    const { data, error } = await this.supabase
      .from('agent_task_executions')
      .select('status, duration_ms')
      .eq('agent_instance_id', agentInstanceId)

    if (error) throw error

    const totalTasks = data?.length || 0
    const completedTasks = data?.filter(t => t.status === 'completed').length || 0
    const failedTasks = data?.filter(t => t.status === 'failed').length || 0
    const executionTimes = data?.filter(t => t.duration_ms).map(t => t.duration_ms!) || []
    const averageExecutionTime = executionTimes.length > 0
      ? executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length
      : 0
    const successRate = totalTasks > 0 ? completedTasks / totalTasks : 0

    return {
      totalTasks,
      completedTasks,
      failedTasks,
      averageExecutionTime,
      successRate
    }
  }
}