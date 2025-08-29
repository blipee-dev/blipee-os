/**
 * AutonomousAgent Base Class
 * 
 * The foundation for all autonomous AI employees in blipee OS.
 * These agents work 24/7, make decisions, and take actions within approved parameters.
 * 
 * This is REVOLUTIONARY - the world's first autonomous sustainability intelligence.
 */

import { createClient } from '../utils/supabase-stub';
import { TaskScheduler } from './TaskScheduler';
import { DecisionEngine } from './DecisionEngine';
import { ApprovalWorkflow } from './ApprovalWorkflow';

export interface AgentCapabilities {
  canMakeDecisions: boolean;
  canTakeActions: boolean;
  canLearnFromFeedback: boolean;
  canWorkWithOtherAgents: boolean;
  requiresHumanApproval: string[]; // Actions requiring approval
}

export interface AgentContext {
  organizationId: string;
  buildingId?: string;
  userId?: string;
  sessionId?: string;
  timestamp: Date;
  environment: 'development' | 'staging' | 'production';
}

export interface Task {
  id: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  payload: any;
  scheduledFor?: Date;
  createdAt: Date;
  createdBy: 'system' | 'user' | 'agent';
  context: AgentContext;
}

export interface TaskResult {
  taskId: string;
  status: 'success' | 'failure' | 'partial' | 'pending_approval';
  result?: any;
  error?: string;
  confidence: number; // 0-1 score
  reasoning: string[];
  actionsToken?: string; // For actions requiring approval
  metadata?: Record<string, any>;
  completedAt: Date;
}

export interface Decision {
  id: string;
  type: 'operational' | 'strategic' | 'communication' | 'emergency';
  description: string;
  options: DecisionOption[];
  selectedOption?: DecisionOption;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  reasoning: string[];
  requiresApproval: boolean;
  autoExecute: boolean;
  context: AgentContext;
  createdAt: Date;
}

export interface DecisionOption {
  id: string;
  name: string;
  description: string;
  impact: {
    financial?: number;
    environmental?: number;
    compliance?: number;
    reputation?: number;
  };
  pros: string[];
  cons: string[];
  riskScore: number; // 0-10
}

export interface LearningFeedback {
  taskId: string;
  decisionId?: string;
  outcome: 'positive' | 'negative' | 'neutral';
  humanFeedback?: string;
  metrics?: Record<string, number>;
  suggestions?: string[];
  timestamp: Date;
}

export abstract class AutonomousAgent {
  protected name: string;
  protected version: string;
  protected capabilities: AgentCapabilities;
  protected taskScheduler: TaskScheduler;
  protected decisionEngine: DecisionEngine;
  protected approvalWorkflow: ApprovalWorkflow;
  protected isActive: boolean = false;
  protected supabase = createClient();

  constructor(
    name: string,
    version: string,
    capabilities: AgentCapabilities
  ) {
    this.name = name;
    this.version = version;
    this.capabilities = capabilities;
    this.taskScheduler = new TaskScheduler();
    this.decisionEngine = new DecisionEngine();
    this.approvalWorkflow = new ApprovalWorkflow();
  }

  /**
   * Start the autonomous agent
   * Begins background processing and scheduled tasks
   */
  async start(): Promise<void> {
    console.log(`🤖 Starting ${this.name} v${this.version}...`);
    
    this.isActive = true;
    
    // Initialize agent-specific setup
    await this.initialize();
    
    // Start background task processing
    this.taskScheduler.start(this.processTask.bind(this));
    
    // Schedule recurring tasks
    await this.scheduleRecurringTasks();
    
    console.log(`✅ ${this.name} is now active and autonomous!`);
  }

  /**
   * Stop the autonomous agent
   */
  async stop(): Promise<void> {
    console.log(`⏹️ Stopping ${this.name}...`);
    
    this.isActive = false;
    this.taskScheduler.stop();
    
    await this.cleanup();
    
    console.log(`✅ ${this.name} stopped safely`);
  }

  /**
   * Process a task autonomously
   */
  private async processTask(task: Task): Promise<TaskResult> {
    if (!this.isActive) {
      return {
        taskId: task.id,
        status: 'failure',
        error: 'Agent is not active',
        confidence: 0,
        reasoning: ['Agent was stopped before task completion'],
        completedAt: new Date()
      };
    }

    try {
      // Log task start
      await this.logActivity('task_started', {
        taskId: task.id,
        taskType: task.type,
        priority: task.priority
      });

      // Execute the task (implemented by specific agents)
      const result = await this.executeTask(task);

      // If task requires approval and isn't auto-approved
      if (result.status === 'pending_approval') {
        const approval = await this.approvalWorkflow.requestApproval({
          taskId: task.id,
          agentName: this.name,
          decision: result.result,
          riskLevel: task.priority === 'critical' ? 'high' : 
                     task.priority === 'high' ? 'medium' : 'low',
          reasoning: result.reasoning,
          urgency: 'medium',
          stakeholders: ['admin'],
          requiredApprovals: 1,
          context: {
            organizationId: task.context.organizationId,
            buildingId: task.context.buildingId,
            impactEstimate: {
              financial: 0,
              environmental: 0,
              compliance: 0,
              reputation: 0
            }
          }
        });

        if (approval.approved) {
          result.status = 'success';
        } else {
          result.status = 'failure';
          result.error = approval.reason || 'Human approval denied';
        }
      }

      // Log task completion
      await this.logActivity('task_completed', {
        taskId: task.id,
        status: result.status,
        confidence: result.confidence
      });

      return result;

    } catch (error) {
      const errorResult: TaskResult = {
        taskId: task.id,
        status: 'failure',
        error: error instanceof Error ? error.message : 'Unknown error',
        confidence: 0,
        reasoning: ['Task execution failed with error'],
        completedAt: new Date()
      };

      await this.logActivity('task_failed', {
        taskId: task.id,
        error: errorResult.error
      });

      return errorResult;
    }
  }

  /**
   * Make an autonomous decision
   */
  async makeDecision(
    type: Decision['type'],
    description: string,
    options: DecisionOption[],
    context: AgentContext
  ): Promise<Decision> {
    const decision: Decision = {
      id: `decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      description,
      options,
      riskLevel: 'low', // Will be calculated by decision engine
      confidence: 0,
      reasoning: [],
      requiresApproval: false,
      autoExecute: false,
      context,
      createdAt: new Date()
    };

    // Let the decision engine analyze and make the decision
    const analyzedDecision = await this.decisionEngine.analyzeDecision(decision, this.capabilities);

    // Log the decision
    await this.logActivity('decision_made', {
      decisionId: analyzedDecision.id,
      type: analyzedDecision.type,
      riskLevel: analyzedDecision.riskLevel,
      requiresApproval: analyzedDecision.requiresApproval,
      confidence: analyzedDecision.confidence
    });

    return analyzedDecision;
  }

  /**
   * Learn from feedback to improve future performance
   */
  async learn(feedback: LearningFeedback): Promise<void> {
    // Store learning data
    await this.supabase
      .from('agent_learning')
      .insert({
        agent_name: this.name,
        task_id: feedback.taskId,
        decision_id: feedback.decisionId,
        outcome: feedback.outcome,
        human_feedback: feedback.humanFeedback,
        metrics: feedback.metrics || {},
        suggestions: feedback.suggestions || [],
        created_at: feedback.timestamp.toISOString()
      });

    // Update agent's learning model (implemented by specific agents)
    await this.updateLearningModel(feedback);

    await this.logActivity('learning_updated', {
      taskId: feedback.taskId,
      outcome: feedback.outcome,
      hasHumanFeedback: !!feedback.humanFeedback
    });
  }

  /**
   * Get agent status and metrics
   */
  async getStatus(): Promise<{
    name: string;
    version: string;
    isActive: boolean;
    capabilities: AgentCapabilities;
    metrics: {
      tasksCompleted: number;
      decisionsMode: number;
      successRate: number;
      averageConfidence: number;
    };
  }> {
    // Get metrics from database
    const { data: metrics } = await this.supabase
      .from('agent_activity')
      .select('*')
      .eq('agent_name', this.name)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const tasksCompleted = metrics?.filter(m => m.activity_type === 'task_completed').length || 0;
    const decisionsMode = metrics?.filter(m => m.activity_type === 'decision_made').length || 0;
    const successfulTasks = metrics?.filter(m => 
      m.activity_type === 'task_completed' && 
      m.metadata?.status === 'success'
    ).length || 0;
    
    const successRate = tasksCompleted > 0 ? (successfulTasks / tasksCompleted) * 100 : 0;
    const averageConfidence = metrics?.length > 0 
      ? metrics.reduce((sum, m) => sum + (m.metadata?.confidence || 0), 0) / metrics.length 
      : 0;

    return {
      name: this.name,
      version: this.version,
      isActive: this.isActive,
      capabilities: this.capabilities,
      metrics: {
        tasksCompleted,
        decisionsMode,
        successRate,
        averageConfidence
      }
    };
  }

  /**
   * Schedule a task for execution
   */
  async scheduleTask(task: Omit<Task, 'id' | 'createdAt'>): Promise<string> {
    const fullTask: Task = {
      ...task,
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    };

    await this.taskScheduler.scheduleTask(fullTask);
    return fullTask.id;
  }

  /**
   * Log agent activity
   */
  protected async logActivity(
    activityType: string, 
    metadata: Record<string, any>
  ): Promise<void> {
    try {
      await this.supabase
        .from('agent_activity')
        .insert({
          agent_name: this.name,
          activity_type: activityType,
          metadata,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error(`Failed to log activity for ${this.name}:`, error);
    }
  }

  // Abstract methods that must be implemented by specific agents
  protected abstract initialize(): Promise<void>;
  protected abstract executeTask(task: Task): Promise<TaskResult>;
  protected abstract scheduleRecurringTasks(): Promise<void>;
  protected abstract updateLearningModel(feedback: LearningFeedback): Promise<void>;
  protected abstract cleanup(): Promise<void>;

  // Getters
  get agentName(): string { return this.name; }
  get agentVersion(): string { return this.version; }
  get agentCapabilities(): AgentCapabilities { return this.capabilities; }
  get active(): boolean { return this.isActive; }
}

/**
 * Agent Registry - Manages all autonomous agents
 */
export class AgentRegistry {
  private static agents: Map<string, AutonomousAgent> = new Map();

  static register(agent: AutonomousAgent): void {
    this.agents.set(agent.agentName, agent);
  }

  static unregister(agentName: string): void {
    this.agents.delete(agentName);
  }

  static getAgent(agentName: string): AutonomousAgent | undefined {
    return this.agents.get(agentName);
  }

  static getAllAgents(): AutonomousAgent[] {
    return Array.from(this.agents.values());
  }

  static async getActiveAgents(): Promise<AutonomousAgent[]> {
    return Array.from(this.agents.values()).filter(agent => agent.active);
  }

  static async startAllAgents(): Promise<void> {
    const startPromises = Array.from(this.agents.values()).map(agent => agent.start());
    await Promise.all(startPromises);
  }

  static async stopAllAgents(): Promise<void> {
    const stopPromises = Array.from(this.agents.values()).map(agent => agent.stop());
    await Promise.all(stopPromises);
  }
}

/**
 * This is the foundation of autonomous sustainability intelligence.
 * Every AI employee in blipee OS inherits from this base class.
 * 
 * We're making history! 🚀
 */