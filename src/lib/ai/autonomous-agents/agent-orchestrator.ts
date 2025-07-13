/**
 * Agent Orchestrator
 * 
 * Coordinates multiple autonomous agents, manages their interactions,
 * prevents conflicts, and optimizes resource allocation across the
 * autonomous agent ecosystem.
 */

import { AutonomousAgent } from './agent-framework';
import { AgentTask, AgentResult } from './agent-framework';
import { ESGChiefOfStaffAgent } from './esg-chief-of-staff';
import { ComplianceGuardianAgent } from './compliance-guardian';
import { CarbonHunterAgent } from './carbon-hunter';
import { SupplyChainInvestigatorAgent } from './supply-chain-investigator';
import { createClient } from '@supabase/supabase-js';

export interface AgentCoordination {
  id: string;
  type: 'collaboration' | 'sequence' | 'parallel' | 'conditional';
  description: string;
  participating_agents: string[];
  trigger_conditions: TriggerCondition[];
  coordination_rules: CoordinationRule[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'pending' | 'active' | 'completed' | 'failed';
}

export interface TriggerCondition {
  agent_id: string;
  task_type: string;
  result_criteria: any;
  threshold_values: Record<string, number>;
}

export interface CoordinationRule {
  rule_type: 'resource_sharing' | 'data_dependency' | 'conflict_resolution' | 'optimization';
  conditions: string[];
  actions: string[];
  priority: number;
}

export interface AgentResourceUsage {
  agent_id: string;
  cpu_usage: number;
  memory_usage: number;
  api_calls_per_minute: number;
  concurrent_tasks: number;
  last_updated: string;
}

export interface WorkflowExecution {
  id: string;
  name: string;
  description: string;
  participating_agents: string[];
  execution_plan: ExecutionStep[];
  status: 'scheduled' | 'running' | 'completed' | 'failed' | 'paused';
  started_at?: string;
  completed_at?: string;
  results: Record<string, AgentResult>;
}

export interface ExecutionStep {
  step_id: string;
  agent_id: string;
  task_type: string;
  dependencies: string[];
  task_data: any;
  timeout_ms: number;
  retry_count: number;
  max_retries: number;
}

export class AgentOrchestrator {
  private agents: Map<string, AutonomousAgent> = new Map();
  private activeCoordinations: Map<string, AgentCoordination> = new Map();
  private resourceUsage: Map<string, AgentResourceUsage> = new Map();
  private activeWorkflows: Map<string, WorkflowExecution> = new Map();
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  private coordinationRules: CoordinationRule[] = [];
  private conflictResolutionStrategies: Map<string, any> = new Map();

  constructor(private organizationId: string) {
    this.setupCoordinationRules();
    this.setupConflictResolution();
  }

  async initialize(): Promise<void> {
    // Initialize all available agents
    const agents: AutonomousAgent[] = [
      new ESGChiefOfStaffAgent(this.organizationId),
      new ComplianceGuardianAgent(this.organizationId),
      new CarbonHunterAgent(this.organizationId),
      new SupplyChainInvestigatorAgent(this.organizationId)
    ];

    // Initialize each agent
    for (const agent of agents) {
      if (agent["initialize"] && typeof agent["initialize"] === 'function') {
        await agent["initialize"]();
      }
      this.agents.set(agent.id, agent);
      
      // Initialize resource tracking
      this.resourceUsage.set(agent.id, {
        agent_id: agent.id,
        cpu_usage: 0,
        memory_usage: 0,
        api_calls_per_minute: 0,
        concurrent_tasks: 0,
        last_updated: new Date().toISOString()
      });
    }

    // Load existing coordinations from database
    await this.loadActiveCoordinations();
    
    console.log(`Agent Orchestrator initialized with ${this.agents.size} agents`);
  }

  async orchestrateAgents(): Promise<void> {
    console.log('Starting agent orchestration cycle...');

    try {
      // 1. Collect scheduled tasks from all agents
      const allScheduledTasks = await this.collectScheduledTasks();

      // 2. Detect potential conflicts and overlaps
      const conflicts = this.detectTaskConflicts(allScheduledTasks);

      // 3. Resolve conflicts using coordination rules
      const resolvedTasks = await this.resolveConflicts(allScheduledTasks, conflicts);

      // 4. Optimize task execution order and resource allocation
      const optimizedExecution = this.optimizeExecution(resolvedTasks);

      // 5. Create coordinated workflows
      const workflows = this.createCoordinatedWorkflows(optimizedExecution);

      // 6. Execute workflows with monitoring
      for (const workflow of workflows) {
        await this.executeWorkflow(workflow);
      }

      // 7. Monitor and adjust based on results
      await this.monitorAndAdjust();

    } catch (error) {
      console.error('Error in agent orchestration:', error);
      await this.handleOrchestrationError(error as Error);
    }
  }

  async createAgentCoordination(coordination: Omit<AgentCoordination, 'id' | 'status'>): Promise<string> {
    const coordinationId = `coord-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const fullCoordination: AgentCoordination = {
      ...coordination,
      id: coordinationId,
      status: 'pending'
    };

    this.activeCoordinations.set(coordinationId, fullCoordination);
    
    // Store in database
    await this.supabase
      .from('agent_coordinations')
      .insert({
        id: coordinationId,
        organization_id: this.organizationId,
        type: coordination.type,
        description: coordination.description,
        participating_agents: coordination.participating_agents,
        trigger_conditions: coordination.trigger_conditions,
        coordination_rules: coordination.coordination_rules,
        priority: coordination.priority,
        status: 'pending',
        created_at: new Date().toISOString()
      });

    return coordinationId;
  }

  async executeCoordinatedWorkflow(workflowName: string, participatingAgents: string[]): Promise<WorkflowExecution> {
    const workflowId = `workflow-${Date.now()}`;
    
    const workflow: WorkflowExecution = {
      id: workflowId,
      name: workflowName,
      description: `Coordinated execution involving ${participatingAgents.join(', ')}`,
      participating_agents: participatingAgents,
      execution_plan: await this.generateExecutionPlan(workflowName, participatingAgents),
      status: 'scheduled',
      results: {}
    };

    this.activeWorkflows.set(workflowId, workflow);
    return await this.executeWorkflow(workflow);
  }

  private async collectScheduledTasks(): Promise<Map<string, AgentTask[]>> {
    const allTasks = new Map<string, AgentTask[]>();

    for (const [agentId, agent] of Array.from(this.agents.entries())) {
      try {
        const tasks = await agent.getScheduledTasks();
        allTasks.set(agentId, tasks);
      } catch (error) {
        console.error(`Error collecting tasks from ${agentId}:`, error);
        allTasks.set(agentId, []);
      }
    }

    return allTasks;
  }

  private detectTaskConflicts(allTasks: Map<string, AgentTask[]>): any[] {
    const conflicts = [];
    const tasksByTime = new Map<string, { agentId: string; task: AgentTask }[]>();

    // Group tasks by scheduled time
    for (const [agentId, tasks] of Array.from(allTasks.entries())) {
      for (const task of tasks) {
        const scheduleTime = task.scheduledFor || task.deadline || new Date();
        const timeKey = new Date(scheduleTime).toISOString().substring(0, 16); // Group by hour
        
        if (!tasksByTime.has(timeKey)) {
          tasksByTime.set(timeKey, []);
        }
        
        tasksByTime.get(timeKey)!.push({ agentId, task });
      }
    }

    // Detect potential conflicts
    for (const [timeKey, tasksAtTime] of Array.from(tasksByTime.entries())) {
      if (tasksAtTime.length > 1) {
        // Check for resource conflicts
        const resourceConflicts = this.checkResourceConflicts(tasksAtTime);
        if (resourceConflicts.length > 0) {
          conflicts.push({
            type: 'resource_conflict',
            time: timeKey,
            conflicting_tasks: resourceConflicts,
            severity: this.calculateConflictSeverity(resourceConflicts)
          });
        }

        // Check for data dependency conflicts
        const dataConflicts = this.checkDataDependencies(tasksAtTime);
        if (dataConflicts.length > 0) {
          conflicts.push({
            type: 'data_dependency',
            time: timeKey,
            conflicting_tasks: dataConflicts,
            severity: 'medium'
          });
        }
      }
    }

    return conflicts;
  }

  private async resolveConflicts(
    allTasks: Map<string, AgentTask[]>, 
    conflicts: any[]
  ): Promise<Map<string, AgentTask[]>> {
    const resolvedTasks = new Map<string, AgentTask[]>();

    // Copy original tasks
    for (const [agentId, tasks] of Array.from(allTasks.entries())) {
      resolvedTasks.set(agentId, [...tasks]);
    }

    // Apply conflict resolution strategies
    for (const conflict of conflicts) {
      const strategy = this.conflictResolutionStrategies.get(conflict.type);
      if (strategy) {
        await strategy.resolve(conflict, resolvedTasks);
      }
    }

    return resolvedTasks;
  }

  private optimizeExecution(tasks: Map<string, AgentTask[]>): Map<string, AgentTask[]> {
    const optimizedTasks = new Map<string, AgentTask[]>();

    for (const [agentId, agentTasks] of Array.from(tasks.entries())) {
      // Sort tasks by priority and dependencies
      const sortedTasks = agentTasks.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

      // Apply load balancing
      const balancedTasks = this.applyLoadBalancing(agentId, sortedTasks);
      
      optimizedTasks.set(agentId, balancedTasks);
    }

    return optimizedTasks;
  }

  private createCoordinatedWorkflows(optimizedTasks: Map<string, AgentTask[]>): WorkflowExecution[] {
    const workflows: WorkflowExecution[] = [];

    // Create compliance-focused workflow
    const complianceWorkflow = this.createComplianceWorkflow(optimizedTasks);
    if (complianceWorkflow) workflows.push(complianceWorkflow);

    // Create carbon optimization workflow
    const carbonWorkflow = this.createCarbonOptimizationWorkflow(optimizedTasks);
    if (carbonWorkflow) workflows.push(carbonWorkflow);

    // Create supply chain analysis workflow
    const supplyChainWorkflow = this.createSupplyChainWorkflow(optimizedTasks);
    if (supplyChainWorkflow) workflows.push(supplyChainWorkflow);

    return workflows;
  }

  private async executeWorkflow(workflow: WorkflowExecution): Promise<WorkflowExecution> {
    console.log(`Executing workflow: ${workflow.name}`);
    
    workflow.status = 'running';
    workflow.started_at = new Date().toISOString();

    try {
      // Execute steps based on dependencies
      const executionOrder = this.resolveExecutionOrder(workflow.execution_plan);
      
      for (const stepId of executionOrder) {
        const step = workflow.execution_plan.find(s => s.step_id === stepId);
        if (!step) continue;

        const agent = this.agents.get(step.agent_id);
        if (!agent) {
          throw new Error(`Agent ${step.agent_id} not found`);
        }

        // Create task for agent
        const task: AgentTask = {
          id: step.step_id,
          type: step.task_type,
          scheduledFor: new Date(),
          priority: 'medium',
          data: step.task_data,
          requiresApproval: false
        };

        // Execute with timeout and retry
        const result = await this.executeTaskWithRetry(agent, task, step);
        workflow.results[step.step_id] = result;

        // Update resource usage
        await this.updateResourceUsage(step.agent_id);
      }

      workflow.status = 'completed';
      workflow.completed_at = new Date().toISOString();

    } catch (error) {
      console.error(`Workflow ${workflow.name} failed:`, error);
      workflow.status = 'failed';
    }

    // Store workflow results
    await this.storeWorkflowResults(workflow);
    
    return workflow;
  }

  private async monitorAndAdjust(): Promise<void> {
    // Monitor resource usage
    await this.monitorResourceUsage();

    // Check for performance issues
    const performanceIssues = await this.detectPerformanceIssues();
    
    if (performanceIssues.length > 0) {
      await this.adjustAgentParameters(performanceIssues);
    }

    // Update coordination rules based on learnings
    await this.updateCoordinationRules();
  }

  private setupCoordinationRules(): void {
    this.coordinationRules = [
      {
        rule_type: 'resource_sharing',
        conditions: ['high_cpu_usage', 'concurrent_tasks > 3'],
        actions: ['delay_low_priority_tasks', 'redistribute_load'],
        priority: 1
      },
      {
        rule_type: 'data_dependency',
        conditions: ['requires_emission_data', 'carbon_hunter_active'],
        actions: ['wait_for_carbon_data', 'share_emission_insights'],
        priority: 2
      },
      {
        rule_type: 'conflict_resolution',
        conditions: ['same_supplier_analysis', 'multiple_agents'],
        actions: ['assign_primary_agent', 'coordinate_timing'],
        priority: 3
      }
    ];
  }

  private setupConflictResolution(): void {
    this.conflictResolutionStrategies.set('resource_conflict', {
      resolve: async (conflict: any, tasks: Map<string, AgentTask[]>) => {
        // Spread high-resource tasks across time
        for (const conflictTask of conflict.conflicting_tasks) {
          const agentTasks = tasks.get(conflictTask.agentId);
          if (agentTasks) {
            const taskIndex = agentTasks.findIndex(t => t.id === conflictTask.task.id);
            if (taskIndex !== -1) {
              // Delay by 30 minutes
              const scheduleTime = conflictTask.task.scheduledFor || conflictTask.task.deadline || new Date();
              const newTime = new Date(scheduleTime);
              newTime.setMinutes(newTime.getMinutes() + 30);
              agentTasks[taskIndex].scheduledFor = newTime;
            }
          }
        }
      }
    });

    this.conflictResolutionStrategies.set('data_dependency', {
      resolve: async (conflict: any, tasks: Map<string, AgentTask[]>) => {
        // Ensure dependent tasks run after their dependencies
        const dependencyGraph = this.buildDependencyGraph(conflict.conflicting_tasks);
        this.reorderTasksByDependencies(tasks, dependencyGraph);
      }
    });
  }

  private checkResourceConflicts(tasksAtTime: { agentId: string; task: AgentTask }[]): any[] {
    const conflicts = [];
    
    // Check if multiple resource-intensive tasks are scheduled simultaneously
    const highResourceTasks = tasksAtTime.filter(({ task }) => 
      this.isHighResourceTask(task.type)
    );

    if (highResourceTasks.length > 2) {
      conflicts.push(...highResourceTasks);
    }

    return conflicts;
  }

  private checkDataDependencies(tasksAtTime: { agentId: string; task: AgentTask }[]): any[] {
    const conflicts = [];
    
    // Check for tasks that might need data from other concurrent tasks
    const dataDependencies = [
      { consumer: 'assess_supplier_sustainability', producer: 'map_supplier_emissions' },
      { consumer: 'generate_compliance_reports', producer: 'monitor_compliance' },
      { consumer: 'optimize_carbon_efficiency', producer: 'hunt_carbon_opportunities' }
    ];

    for (const dependency of dataDependencies) {
      const consumer = tasksAtTime.find(({ task }) => task.type === dependency.consumer);
      const producer = tasksAtTime.find(({ task }) => task.type === dependency.producer);
      
      if (consumer && producer) {
        conflicts.push({ consumer, producer, dependency });
      }
    }

    return conflicts;
  }

  private calculateConflictSeverity(conflicts: any[]): string {
    if (conflicts.length > 3) return 'high';
    if (conflicts.length > 1) return 'medium';
    return 'low';
  }

  private isHighResourceTask(taskType: string): boolean {
    const highResourceTasks = [
      'investigate_supply_chain',
      'hunt_carbon_opportunities',
      'analyze_carbon_trends',
      'generate_compliance_reports'
    ];
    
    return highResourceTasks.includes(taskType);
  }

  private applyLoadBalancing(agentId: string, tasks: AgentTask[]): AgentTask[] {
    const usage = this.resourceUsage.get(agentId);
    if (!usage) return tasks;

    // If agent is under high load, space out tasks more
    if (usage.concurrent_tasks > 2) {
      return this.spaceOutTasks(tasks, 15); // 15 minute intervals
    }

    return tasks;
  }

  private spaceOutTasks(tasks: AgentTask[], intervalMinutes: number): AgentTask[] {
    return tasks.map((task, index) => {
      if (index === 0) return task;
      
      const previousSchedule = tasks[index - 1].scheduledFor || tasks[index - 1].deadline || new Date();
      const previousTime = new Date(previousSchedule);
      const newTime = new Date(previousTime.getTime() + intervalMinutes * 60000);
      
      return {
        ...task,
        scheduledFor: newTime
      };
    });
  }

  private createComplianceWorkflow(tasks: Map<string, AgentTask[]>): WorkflowExecution | null {
    const complianceGuardianTasks = tasks.get('compliance-guardian') || [];
    const esgTasks = tasks.get('esg-chief-of-staff') || [];

    const relevantTasks = [
      ...complianceGuardianTasks.filter(t => t.type.includes('compliance')),
      ...esgTasks.filter(t => t.type.includes('report'))
    ];

    if (relevantTasks.length === 0) return null;

    return {
      id: `compliance-workflow-${Date.now()}`,
      name: 'Compliance Monitoring & Reporting',
      description: 'Coordinated compliance monitoring and report generation',
      participating_agents: ['compliance-guardian', 'esg-chief-of-staff'],
      execution_plan: this.generateExecutionPlanFromTasks(relevantTasks),
      status: 'scheduled',
      results: {}
    };
  }

  private createCarbonOptimizationWorkflow(tasks: Map<string, AgentTask[]>): WorkflowExecution | null {
    const carbonHunterTasks = tasks.get('carbon-hunter') || [];
    const supplyChainTasks = tasks.get('supply-chain-investigator') || [];

    const relevantTasks = [
      ...carbonHunterTasks.filter(t => t.type.includes('carbon') || t.type.includes('emission')),
      ...supplyChainTasks.filter(t => t.type.includes('emission'))
    ];

    if (relevantTasks.length === 0) return null;

    return {
      id: `carbon-workflow-${Date.now()}`,
      name: 'Carbon Optimization',
      description: 'Coordinated carbon hunting and supply chain optimization',
      participating_agents: ['carbon-hunter', 'supply-chain-investigator'],
      execution_plan: this.generateExecutionPlanFromTasks(relevantTasks),
      status: 'scheduled',
      results: {}
    };
  }

  private createSupplyChainWorkflow(tasks: Map<string, AgentTask[]>): WorkflowExecution | null {
    const supplyChainTasks = tasks.get('supply-chain-investigator') || [];
    const complianceTasks = tasks.get('compliance-guardian') || [];

    const relevantTasks = [
      ...supplyChainTasks.filter(t => t.type.includes('supplier') || t.type.includes('risk')),
      ...complianceTasks.filter(t => t.type.includes('risk'))
    ];

    if (relevantTasks.length === 0) return null;

    return {
      id: `supply-chain-workflow-${Date.now()}`,
      name: 'Supply Chain Analysis',
      description: 'Coordinated supply chain investigation and risk assessment',
      participating_agents: ['supply-chain-investigator', 'compliance-guardian'],
      execution_plan: this.generateExecutionPlanFromTasks(relevantTasks),
      status: 'scheduled',
      results: {}
    };
  }

  private generateExecutionPlanFromTasks(tasks: AgentTask[]): ExecutionStep[] {
    return tasks.map((task, index) => ({
      step_id: task.id,
      agent_id: this.getAgentIdFromTaskType(task.type),
      task_type: task.type,
      dependencies: index > 0 ? [tasks[index - 1].id] : [],
      task_data: task.data || {},
      timeout_ms: 300000, // 5 minutes
      retry_count: 0,
      max_retries: 2
    }));
  }

  private getAgentIdFromTaskType(taskType: string): string {
    if (taskType.includes('compliance')) return 'compliance-guardian';
    if (taskType.includes('carbon') || taskType.includes('emission')) return 'carbon-hunter';
    if (taskType.includes('supplier') || taskType.includes('supply')) return 'supply-chain-investigator';
    return 'esg-chief-of-staff';
  }

  private resolveExecutionOrder(executionPlan: ExecutionStep[]): string[] {
    const resolved: string[] = [];
    const remaining = [...executionPlan];

    while (remaining.length > 0) {
      const ready = remaining.filter(step => 
        step.dependencies.every(dep => resolved.includes(dep))
      );

      if (ready.length === 0) {
        // Break circular dependencies by taking first remaining
        ready.push(remaining[0]);
      }

      for (const step of ready) {
        resolved.push(step.step_id);
        const index = remaining.findIndex(s => s.step_id === step.step_id);
        if (index !== -1) {
          remaining.splice(index, 1);
        }
      }
    }

    return resolved;
  }

  private async executeTaskWithRetry(
    agent: AutonomousAgent, 
    task: AgentTask, 
    step: ExecutionStep
  ): Promise<AgentResult> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= step.max_retries; attempt++) {
      try {
        // Execute with timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Task timeout')), step.timeout_ms);
        });

        const result = await Promise.race([
          agent.executeTask(task),
          timeoutPromise
        ]);

        step.retry_count = attempt;
        return result;

      } catch (error) {
        lastError = error as Error;
        console.warn(`Task ${task.id} attempt ${attempt + 1} failed:`, error);
        
        if (attempt < step.max_retries) {
          // Wait before retry (exponential backoff)
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    throw lastError || new Error('Task failed after all retries');
  }

  private async updateResourceUsage(agentId: string): Promise<void> {
    const usage = this.resourceUsage.get(agentId);
    if (usage) {
      usage.last_updated = new Date().toISOString();
      usage.api_calls_per_minute += 1;
      // Update other metrics based on actual monitoring
    }
  }

  private async loadActiveCoordinations(): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from('agent_coordinations')
        .select('*')
        .eq('organization_id', this.organizationId)
        .eq('status', 'active');

      if (error) throw error;

      for (const coord of data || []) {
        this.activeCoordinations.set(coord.id, coord);
      }
    } catch (error) {
      console.error('Error loading coordinations:', error);
    }
  }

  private async storeWorkflowResults(workflow: WorkflowExecution): Promise<void> {
    try {
      await this.supabase
        .from('agent_workflow_executions')
        .insert({
          id: workflow.id,
          organization_id: this.organizationId,
          name: workflow.name,
          description: workflow.description,
          participating_agents: workflow.participating_agents,
          status: workflow.status,
          started_at: workflow.started_at,
          completed_at: workflow.completed_at,
          results: workflow.results,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error storing workflow results:', error);
    }
  }

  private async generateExecutionPlan(workflowName: string, agents: string[]): Promise<ExecutionStep[]> {
    // Generate optimized execution plan based on workflow type
    const steps: ExecutionStep[] = [];
    
    // Add workflow-specific logic here
    return steps;
  }

  private buildDependencyGraph(tasks: any[]): Map<string, string[]> {
    const graph = new Map<string, string[]>();
    // Build dependency relationships
    return graph;
  }

  private reorderTasksByDependencies(tasks: Map<string, AgentTask[]>, graph: Map<string, string[]>): void {
    // Reorder tasks based on dependency graph
  }

  private async monitorResourceUsage(): Promise<void> {
    // Monitor system resources and agent performance
  }

  private async detectPerformanceIssues(): Promise<any[]> {
    // Detect performance bottlenecks and issues
    return [];
  }

  private async adjustAgentParameters(issues: any[]): Promise<void> {
    // Adjust agent parameters based on performance issues
  }

  private async updateCoordinationRules(): Promise<void> {
    // Update coordination rules based on learnings
  }

  private async handleOrchestrationError(error: Error): Promise<void> {
    console.error('Orchestration error:', error);
    // Implement error recovery strategies
  }

  // Public methods for external control
  async pauseAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (agent) {
      // Implement pause functionality
      console.log(`Pausing agent: ${agentId}`);
    }
  }

  async resumeAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (agent) {
      // Implement resume functionality
      console.log(`Resuming agent: ${agentId}`);
    }
  }

  async getAgentStatus(agentId?: string): Promise<any> {
    if (agentId) {
      return {
        agent_id: agentId,
        status: this.agents.has(agentId) ? 'active' : 'inactive',
        resource_usage: this.resourceUsage.get(agentId),
        active_workflows: Array.from(this.activeWorkflows.values())
          .filter(w => w.participating_agents.includes(agentId))
      };
    }

    // Return status for all agents
    const statuses: Record<string, any> = {};
    for (const id of Array.from(this.agents.keys())) {
      statuses[id] = await this.getAgentStatus(id);
    }
    return statuses;
  }

  async getOrchestrationMetrics(): Promise<any> {
    return {
      total_agents: this.agents.size,
      active_coordinations: this.activeCoordinations.size,
      active_workflows: this.activeWorkflows.size,
      resource_usage: Object.fromEntries(Array.from(this.resourceUsage.entries())),
      coordination_rules: this.coordinationRules.length
    };
  }
}