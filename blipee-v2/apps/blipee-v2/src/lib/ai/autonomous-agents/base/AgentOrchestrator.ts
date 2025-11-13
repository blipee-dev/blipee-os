/**
 * AgentOrchestrator - Central Command for Autonomous AI Employees
 * 
 * Coordinates multiple autonomous agents, manages workload distribution,
 * handles inter-agent communication, and ensures optimal performance.
 * 
 * This is the conductor of our autonomous sustainability intelligence orchestra.
 */

import { AutonomousAgent, AgentRegistry, Task, TaskResult, AgentContext } from './AutonomousAgent';
import { TaskScheduler } from './TaskScheduler';
import { createClient } from '../utils/supabase-stub';
// import { simpleCache } from '../utils/simple-cache';

export interface AgentWorkload {
  agentName: string;
  currentTasks: number;
  queuedTasks: number;
  averageExecutionTime: number;
  successRate: number;
  lastActivity: Date;
  specializations: string[];
  availability: 'available' | 'busy' | 'overloaded' | 'offline';
}

export interface WorkloadDistribution {
  totalTasks: number;
  activeAgents: number;
  loadBalanceScore: number; // 0-1, where 1 is perfectly balanced
  bottlenecks: string[];
  recommendations: string[];
}

export interface InterAgentMessage {
  id: string;
  fromAgent: string;
  toAgent: string;
  messageType: 'request' | 'response' | 'notification' | 'collaboration';
  payload: any;
  priority: 'low' | 'medium' | 'high' | 'critical';
  sentAt: Date;
  deliveredAt?: Date;
  responseRequired: boolean;
  expiresAt?: Date;
}

export interface CollaborationRequest {
  id: string;
  initiatingAgent: string;
  targetAgents: string[];
  objective: string;
  requiredCapabilities: string[];
  timeframe: string;
  context: AgentContext;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'rejected';
}

export interface OrchestrationMetrics {
  totalAgents: number;
  activeAgents: number;
  tasksCompleted24h: number;
  averageTaskTime: number;
  systemUtilization: number;
  collaborationEfficiency: number;
  errorRate: number;
  costSavings: number; // USD
  carbonReduced: number; // tCO2e
}

export class AgentOrchestrator {
  private readonly supabase = createClient();
  private readonly masterScheduler = new TaskScheduler();
  private workloadMonitor?: NodeJS.Timeout;
  private collaborationHub = new Map<string, CollaborationRequest>();
  private messageQueue = new Map<string, InterAgentMessage[]>();
  
  private readonly maxTasksPerAgent = 10;
  private readonly loadBalanceThreshold = 0.3; // 30% imbalance triggers rebalancing
  private readonly collaborationTimeout = 60 * 60 * 1000; // 1 hour
  
  /**
   * Start the agent orchestrator
   */
  async start(): Promise<void> {
    
    // Start master scheduler
    this.masterScheduler.start(this.handleGlobalTask.bind(this));
    
    // Start workload monitoring
    this.startWorkloadMonitoring();
    
    // Initialize collaboration hub
    await this.initializeCollaborationHub();
    
    // Start all registered agents
    await AgentRegistry.startAllAgents();
    
  }
  
  /**
   * Stop the orchestrator
   */
  async stop(): Promise<void> {
    
    // Stop workload monitoring
    if (this.workloadMonitor) {
      clearInterval(this.workloadMonitor);
    }
    
    // Stop master scheduler
    this.masterScheduler.stop();
    
    // Stop all agents
    await AgentRegistry.stopAllAgents();
    
  }
  
  /**
   * Select optimal agent for a task type (called by chat API)
   */
  async selectAgent(taskType: string): Promise<AutonomousAgent | null> {

    try {
      // Create a temporary task to use existing agent selection logic
      const tempTask: Task = {
        id: `temp_${Date.now()}`,
        type: taskType,
        description: `Task of type ${taskType}`,
        context: {},
        priority: 'medium',
        createdAt: new Date(),
        status: 'pending'
      };

      const optimalAgent = await this.findOptimalAgent(tempTask);

      if (optimalAgent) {
      } else {
      }

      return optimalAgent;

    } catch (error) {
      console.error('Error selecting agent:', error);
      return null;
    }
  }

  /**
   * Distribute task to optimal agent
   */
  async distributeTask(task: Task): Promise<string> {
    
    try {
      // Find optimal agent for the task
      const optimalAgent = await this.findOptimalAgent(task);
      
      if (!optimalAgent) {
        // No suitable agent available, schedule for later
        await this.masterScheduler.scheduleTask(task);
        return task.id;
      }
      
      // Assign task to agent
      await optimalAgent.scheduleTask(task);
      
      // Update workload tracking
      await this.updateWorkloadTracking(optimalAgent.agentName, 'task_assigned');
      
      
      return task.id;
      
    } catch (error) {
      console.error('Error distributing task:', error);
      throw new Error(`Failed to distribute task ${task.id}`);
    }
  }
  
  /**
   * Facilitate collaboration between agents
   */
  async initiateCollaboration(
    initiatingAgent: string,
    targetAgents: string[],
    objective: string,
    requiredCapabilities: string[],
    context: AgentContext
  ): Promise<string> {
    
    const collaborationRequest: CollaborationRequest = {
      id: `collab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      initiatingAgent,
      targetAgents,
      objective,
      requiredCapabilities,
      timeframe: '24 hours', // Default
      context,
      status: 'pending'
    };
    
    // Store collaboration request
    this.collaborationHub.set(collaborationRequest.id, collaborationRequest);
    
    // Send collaboration messages to target agents
    for (const targetAgent of targetAgents) {
      await this.sendInterAgentMessage({
        fromAgent: initiatingAgent,
        toAgent: targetAgent,
        messageType: 'collaboration',
        payload: collaborationRequest,
        priority: 'high',
        responseRequired: true,
        expiresAt: new Date(Date.now() + this.collaborationTimeout)
      });
    }
    
    // Store in database
    await this.storeCollaborationRequest(collaborationRequest);
    
    
    return collaborationRequest.id;
  }
  
  /**
   * Get system-wide orchestration metrics
   */
  async getOrchestrationMetrics(): Promise<OrchestrationMetrics> {
    
    try {
      const agents = AgentRegistry.getAllAgents();
      const activeAgents = await AgentRegistry.getActiveAgents();
      
      // Get task completion metrics
      const { data: completedTasks } = await this.supabase
        .from('agent_task_executions')
        .select('*')
        .eq('status', 'completed')
        .gte('start_time', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      
      const tasksCompleted24h = completedTasks?.length || 0;
      
      // Calculate average task time
      const taskTimes = (completedTasks || [])
        .filter(task => task.end_time)
        .map(task => {
          const start = new Date(task.start_time).getTime();
          const end = new Date(task.end_time).getTime();
          return (end - start) / 1000; // seconds
        });
      
      const averageTaskTime = taskTimes.length > 0
        ? taskTimes.reduce((sum, time) => sum + time, 0) / taskTimes.length
        : 0;
      
      // Get error metrics
      const { data: failedTasks } = await this.supabase
        .from('agent_task_executions')
        .select('*')
        .eq('status', 'failed')
        .gte('start_time', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      
      const errorRate = tasksCompleted24h > 0
        ? (failedTasks?.length || 0) / (tasksCompleted24h + (failedTasks?.length || 0))
        : 0;
      
      // Calculate system utilization
      const workloads = await this.getWorkloadDistribution();
      const systemUtilization = workloads.loadBalanceScore;
      
      // Estimate impact metrics (would be calculated from actual data)
      const costSavings = await this.calculateCostSavings(tasksCompleted24h);
      const carbonReduced = await this.calculateCarbonImpact(tasksCompleted24h);
      
      return {
        totalAgents: agents.length,
        activeAgents: activeAgents.length,
        tasksCompleted24h,
        averageTaskTime,
        systemUtilization,
        collaborationEfficiency: await this.calculateCollaborationEfficiency(),
        errorRate,
        costSavings,
        carbonReduced
      };
      
    } catch (error) {
      console.error('Error gathering orchestration metrics:', error);
      
      return {
        totalAgents: 0,
        activeAgents: 0,
        tasksCompleted24h: 0,
        averageTaskTime: 0,
        systemUtilization: 0,
        collaborationEfficiency: 0,
        errorRate: 0,
        costSavings: 0,
        carbonReduced: 0
      };
    }
  }
  
  /**
   * Get current workload distribution
   */
  async getWorkloadDistribution(): Promise<WorkloadDistribution> {
    const agents = AgentRegistry.getAllAgents();
    const workloads: AgentWorkload[] = [];
    
    for (const agent of agents) {
      const status = await agent.getStatus();
      const schedulerStats = this.masterScheduler.getStats();
      
      workloads.push({
        agentName: agent.agentName,
        currentTasks: schedulerStats.runningTasks,
        queuedTasks: Object.values(schedulerStats.queueSizes).reduce((sum, count) => sum + count, 0),
        averageExecutionTime: schedulerStats.averageExecutionTime,
        successRate: status.metrics.successRate,
        lastActivity: new Date(),
        specializations: await this.getAgentSpecializations(agent.agentName),
        availability: this.determineAgentAvailability(schedulerStats)
      });
    }
    
    // Calculate load balance score
    const taskCounts = workloads.map(w => w.currentTasks + w.queuedTasks);
    const avgTasks = taskCounts.reduce((sum, count) => sum + count, 0) / taskCounts.length;
    const variance = taskCounts.reduce((sum, count) => sum + Math.pow(count - avgTasks, 2), 0) / taskCounts.length;
    const loadBalanceScore = Math.max(0, 1 - (Math.sqrt(variance) / (avgTasks + 1)));
    
    // Identify bottlenecks
    const bottlenecks = workloads
      .filter(w => w.availability === 'overloaded')
      .map(w => w.agentName);
    
    // Generate recommendations
    const recommendations = this.generateLoadBalanceRecommendations(workloads, loadBalanceScore);
    
    return {
      totalTasks: taskCounts.reduce((sum, count) => sum + count, 0),
      activeAgents: workloads.filter(w => w.availability !== 'offline').length,
      loadBalanceScore,
      bottlenecks,
      recommendations
    };
  }
  
  /**
   * Handle global tasks that couldn't be assigned to specific agents
   */
  private async handleGlobalTask(task: Task): Promise<TaskResult> {
    
    // Try to find an agent again
    const optimalAgent = await this.findOptimalAgent(task);
    
    if (optimalAgent) {
      // Agent became available, delegate the task
      const result = await optimalAgent.scheduleTask(task);
      return {
        taskId: task.id,
        status: 'success',
        result: `Delegated to ${optimalAgent.agentName}`,
        confidence: 0.9,
        reasoning: [`Task delegated to ${optimalAgent.agentName}`],
        completedAt: new Date()
      };
    }
    
    // Still no suitable agent - this would require human intervention
    return {
      taskId: task.id,
      status: 'failure',
      error: 'No suitable agent available for task execution',
      confidence: 0,
      reasoning: ['No agents with required capabilities available'],
      completedAt: new Date()
    };
  }
  
  /**
   * Find optimal agent for a task
   */
  private async findOptimalAgent(task: Task): Promise<AutonomousAgent | null> {
    const activeAgents = await AgentRegistry.getActiveAgents();
    
    if (activeAgents.length === 0) return null;
    
    // Score agents based on suitability
    const scoredAgents = await Promise.all(
      activeAgents.map(async agent => {
        const score = await this.calculateAgentSuitability(agent, task);
        return { agent, score };
      })
    );

    // Filter out overloaded agents and sort by score
    const availableAgents = scoredAgents
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score);

    return availableAgents.length > 0 ? availableAgents[0].agent : null;
  }
  
  /**
   * Calculate agent suitability score for a task
   */
  private async calculateAgentSuitability(agent: AutonomousAgent, task: Task): Promise<number> {
    const status = await agent.getStatus();
    let score = 0;

    // Base capability score
    if (agent.agentCapabilities.canTakeActions && task.type.includes('action')) score += 0.3;
    if (agent.agentCapabilities.canMakeDecisions && task.type.includes('decision')) score += 0.3;

    // Workload factor (prefer less loaded agents)
    const taskLoad = status.metrics.tasksCompleted; // Today's tasks
    const maxLoad = this.maxTasksPerAgent;
    const loadFactor = Math.max(0, (maxLoad - taskLoad) / maxLoad);
    score += loadFactor * 0.3;

    // Success rate factor
    score += (status.metrics.successRate / 100) * 0.1;

    // Agent-specific specialization bonus
    const specializationBonus = await this.calculateSpecializationBonus(agent.agentName, task.type);
    score += specializationBonus;


    
    // Penalize if agent is overloaded
    if (taskLoad >= maxLoad) score = 0;
    
    return Math.min(1, score);
  }
  
  /**
   * Calculate specialization bonus for agent-task combination
   */
  private async calculateSpecializationBonus(agentName: string, taskType: string): Promise<number> {
    const specializations = await this.getAgentSpecializations(agentName);

    const bonusMap: Record<string, string[]> = {
      'ESG Chief of Staff': ['strategic', 'planning', 'analysis', 'coordination', 'esg', 'leadership', 'oversight'],
      'Compliance Guardian': ['compliance', 'audit', 'standard', 'framework', 'current', 'existing', 'validation'],
      'Carbon Hunter': ['carbon', 'emissions', 'tracking', 'scope', 'ghg', 'co2', 'climate', 'reduction'],
      'Supply Chain Investigator': ['supply', 'chain', 'vendor', 'procurement', 'sourcing', 'supplier', 'investigation'],
      'Cost Saving Finder': ['cost', 'saving', 'financial', 'energy', 'expenses', 'budget', 'roi', 'finder'],
      'Predictive Maintenance': ['maintenance', 'predictive', 'equipment', 'device', 'failure', 'health', 'monitoring'],
      'Autonomous Optimizer': ['autonomous', 'optimizer', 'optimization', 'performance', 'efficiency', 'operations', 'automation', 'continuous'],
      'Regulatory Foresight': ['regulatory', 'foresight', 'regulations', 'changes', 'updates', 'monitoring', 'future', 'upcoming', 'track', 'deadlines', 'laws', 'proactive']
    };

    const agentKeywords = bonusMap[agentName] || [];

    // Normalize task type for better matching (handle hyphens and underscores)
    const normalizedTaskType = taskType.toLowerCase().replace(/[-_]/g, ' ');
    const taskWords = normalizedTaskType.split(' ').filter(word => word.length > 0);

    // Count matches - both direct inclusion and word-level matching
    let matchCount = 0;
    const matches: string[] = [];

    for (const keyword of agentKeywords) {
      // Direct inclusion check
      if (normalizedTaskType.includes(keyword.toLowerCase())) {
        matchCount++;
        matches.push(keyword);
      }
      // Word-level matching for compound task types
      else if (taskWords.some(word => word === keyword.toLowerCase())) {
        matchCount++;
        matches.push(keyword);
      }
    }


    // Special bonus for exact agent type matches
    if (this.isExactAgentMatch(agentName, normalizedTaskType)) {
      matchCount += 2; // Extra bonus for perfect matches
    }

    return Math.min(matchCount * 0.15, 0.8); // 15% bonus per match, max 80%
  }

  /**
   * Check for exact agent-task type matches
   */
  private isExactAgentMatch(agentName: string, normalizedTaskType: string): boolean {
    const exactMatches: Record<string, string[]> = {
      'Compliance Guardian': ['compliance', 'compliance monitoring', 'audit'],
      'Carbon Hunter': ['carbon tracking', 'carbon', 'emissions', 'emissions tracking', 'ghg'],
      'ESG Chief of Staff': ['strategic planning', 'strategic', 'esg', 'leadership', 'coordination'],
      'Supply Chain Investigator': ['supply chain analysis', 'supply chain', 'vendor', 'procurement', 'sourcing'],
      'Cost Saving Finder': ['cost saving', 'energy cost', 'financial optimization', 'roi calculation'],
      'Predictive Maintenance': ['predictive maintenance', 'device health', 'failure prediction', 'maintenance scheduling'],
      'Autonomous Optimizer': ['autonomous optimization', 'performance optimization', 'system automation', 'operations tuning'],
      'Regulatory Foresight': ['regulatory foresight', 'regulatory monitoring', 'compliance forecasting', 'law tracking', 'deadline management']
    };

    const agentMatches = exactMatches[agentName] || [];
    return agentMatches.some(match => normalizedTaskType.includes(match));
  }

  /**
   * Get agent specializations
   */
  private async getAgentSpecializations(agentName: string): Promise<string[]> {
    const specializationMap: Record<string, string[]> = {
      'ESG Chief of Staff': ['Strategic Planning', 'Stakeholder Management', 'ESG Analysis', 'Target Setting'],
      'Compliance Guardian': ['Compliance Assessment', 'Risk Analysis', 'Reporting', 'Standard Frameworks'],
      'Carbon Hunter': ['Emissions Tracking', 'Carbon Accounting', 'Data Collection', 'Verification'],
      'Supply Chain Investigator': ['Vendor Assessment', 'Supply Chain Analysis', 'Procurement', 'Due Diligence'],
      'Cost Saving Finder': ['Energy Cost Analysis', 'Financial Optimization', 'ROI Calculation', 'Expense Tracking'],
      'Predictive Maintenance': ['Device Health Monitoring', 'Failure Prediction', 'Maintenance Scheduling', 'Anomaly Detection'],
      'Autonomous Optimizer': ['Performance Optimization', 'System Automation', 'Efficiency Analysis', 'Operations Tuning'],
      'Regulatory Foresight': ['Regulatory Monitoring', 'Compliance Forecasting', 'Law Tracking', 'Deadline Management', 'Future Regulations']
    };

    return specializationMap[agentName] || [];
  }
  
  /**
   * Determine agent availability based on workload
   */
  private determineAgentAvailability(stats: any): AgentWorkload['availability'] {
    const totalTasks = stats.runningTasks + Object.values(stats.queueSizes).reduce((sum: number, count: number) => sum + count, 0);
    
    if (!stats.isRunning) return 'offline';
    if (totalTasks >= this.maxTasksPerAgent) return 'overloaded';
    if (totalTasks >= this.maxTasksPerAgent * 0.7) return 'busy';
    return 'available';
  }
  
  /**
   * Start workload monitoring
   */
  private startWorkloadMonitoring(): void {
    this.workloadMonitor = setInterval(async () => {
      const workloads = await this.getWorkloadDistribution();
      
      // Trigger rebalancing if needed
      if (workloads.loadBalanceScore < this.loadBalanceThreshold) {
        await this.rebalanceWorkload(workloads);
      }
      
      // Store metrics
      await this.storeWorkloadMetrics(workloads);
      
    }, 60000); // Check every minute
  }
  
  /**
   * Rebalance workload across agents
   */
  private async rebalanceWorkload(distribution: WorkloadDistribution): Promise<void> {
    
    // Implementation would move tasks from overloaded agents to available ones
    // This is a simplified placeholder
    
    for (const bottleneck of distribution.bottlenecks) {
      // Would implement task migration logic here
    }
  }
  
  /**
   * Generate load balance recommendations
   */
  private generateLoadBalanceRecommendations(
    workloads: AgentWorkload[],
    loadBalanceScore: number
  ): string[] {
    const recommendations: string[] = [];
    
    if (loadBalanceScore < 0.7) {
      recommendations.push('Consider redistributing tasks among agents');
    }
    
    const overloadedAgents = workloads.filter(w => w.availability === 'overloaded');
    if (overloadedAgents.length > 0) {
      recommendations.push(`Scale up capacity for: ${overloadedAgents.map(a => a.agentName).join(', ')}`);
    }
    
    const idleAgents = workloads.filter(w => w.currentTasks === 0 && w.queuedTasks === 0);
    if (idleAgents.length > 0) {
      recommendations.push(`Utilize idle agents: ${idleAgents.map(a => a.agentName).join(', ')}`);
    }
    
    return recommendations;
  }
  
  /**
   * Send message between agents
   */
  private async sendInterAgentMessage(
    message: Omit<InterAgentMessage, 'id' | 'sentAt'>
  ): Promise<void> {
    const fullMessage: InterAgentMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sentAt: new Date()
    };
    
    // Add to message queue
    if (!this.messageQueue.has(message.toAgent)) {
      this.messageQueue.set(message.toAgent, []);
    }
    this.messageQueue.get(message.toAgent)!.push(fullMessage);
    
    // Store in database
    await this.supabase
      .from('agent_messages')
      .insert({
        id: fullMessage.id,
        from_agent: fullMessage.fromAgent,
        to_agent: fullMessage.toAgent,
        message_type: fullMessage.messageType,
        payload: fullMessage.payload,
        priority: fullMessage.priority,
        sent_at: fullMessage.sentAt.toISOString(),
        response_required: fullMessage.responseRequired,
        expires_at: fullMessage.expiresAt?.toISOString()
      });
  }
  
  /**
   * Initialize collaboration hub
   */
  private async initializeCollaborationHub(): Promise<void> {
    
    // Load active collaborations from database
    const { data: collaborations } = await this.supabase
      .from('agent_collaborations')
      .select('*')
      .in('status', ['pending', 'accepted', 'in_progress']);
    
    (collaborations || []).forEach(collab => {
      const request: CollaborationRequest = {
        id: collab.id,
        initiatingAgent: collab.initiating_agent,
        targetAgents: collab.target_agents,
        objective: collab.objective,
        requiredCapabilities: collab.required_capabilities,
        timeframe: collab.timeframe,
        context: collab.context,
        status: collab.status
      };
      
      this.collaborationHub.set(request.id, request);
    });
    
  }
  
  /**
   * Store collaboration request
   */
  private async storeCollaborationRequest(request: CollaborationRequest): Promise<void> {
    await this.supabase
      .from('agent_collaborations')
      .insert({
        id: request.id,
        initiating_agent: request.initiatingAgent,
        target_agents: request.targetAgents,
        objective: request.objective,
        required_capabilities: request.requiredCapabilities,
        timeframe: request.timeframe,
        context: request.context,
        status: request.status,
        created_at: new Date().toISOString()
      });
  }
  
  /**
   * Update workload tracking
   */
  private async updateWorkloadTracking(agentName: string, eventType: string): Promise<void> {
    await this.supabase
      .from('agent_workload_events')
      .insert({
        agent_name: agentName,
        event_type: eventType,
        timestamp: new Date().toISOString()
      });
  }
  
  /**
   * Store workload metrics
   */
  private async storeWorkloadMetrics(distribution: WorkloadDistribution): Promise<void> {
    await this.supabase
      .from('agent_workload_metrics')
      .insert({
        total_tasks: distribution.totalTasks,
        active_agents: distribution.activeAgents,
        load_balance_score: distribution.loadBalanceScore,
        bottlenecks: distribution.bottlenecks,
        recommendations: distribution.recommendations,
        recorded_at: new Date().toISOString()
      });
  }
  
  /**
   * Calculate cost savings from automation
   */
  private async calculateCostSavings(tasksCompleted: number): Promise<number> {
    // Simplified calculation: assume each task saves 30 minutes of human work at $50/hour
    const avgSavingsPerTask = (30 / 60) * 50; // $25 per task
    return tasksCompleted * avgSavingsPerTask;
  }
  
  /**
   * Calculate carbon impact
   */
  private async calculateCarbonImpact(tasksCompleted: number): Promise<number> {
    // Simplified calculation: assume each completed task identifies 0.1 tCO2e of savings
    return tasksCompleted * 0.1;
  }
  
  /**
   * Calculate collaboration efficiency
   */
  private async calculateCollaborationEfficiency(): Promise<number> {
    const completedCollabs = Array.from(this.collaborationHub.values())
      .filter(c => c.status === 'completed').length;

    const totalCollabs = this.collaborationHub.size;

    return totalCollabs > 0 ? completedCollabs / totalCollabs : 0;
  }
}

// Lazy singleton initialization
let _agentOrchestratorInstance: AgentOrchestrator | null = null;

export const agentOrchestrator = {
  get instance(): AgentOrchestrator {
    if (!_agentOrchestratorInstance) {
      _agentOrchestratorInstance = new AgentOrchestrator();
    }
    return _agentOrchestratorInstance;
  },

  // For compatibility with existing code
  start: async () => _agentOrchestratorInstance?.start() || agentOrchestrator.instance.start(),
  stop: async () => _agentOrchestratorInstance?.stop(),
  executeTask: async (task: any) => agentOrchestrator.instance.executeTask(task),
  getWorkloadDistribution: async () => agentOrchestrator.instance.getWorkloadDistribution(),
} as AgentOrchestrator;