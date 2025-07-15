/**
 * Learning Integration for Autonomous Agents
 * 
 * Integrates advanced learning capabilities into the agent framework
 * Provides a unified interface for agents to leverage ML algorithms
 */

import { AutonomousAgent, AgentTask, AgentResult, Learning } from './agent-framework';
import { AdvancedLearningSystem } from './advanced-learning';
import { AgentLearningSystem } from './learning-system';

export class LearningEnabledAgent extends AutonomousAgent {
  protected advancedLearning: AdvancedLearningSystem;
  protected basicLearning: AgentLearningSystem;
  
  constructor(organizationId: string, config: any) {
    super(organizationId, config);
    this.advancedLearning = new AdvancedLearningSystem();
    this.basicLearning = new AgentLearningSystem();
  }
  
  /**
   * Execute task with learning enhancements
   */
  async executeTaskWithLearning(task: AgentTask): Promise<AgentResult> {
    const startTime = Date.now();
    
    // 1. Get relevant knowledge from past experiences
    const relevantKnowledge = await this.basicLearning.getRelevantKnowledge(
      this.agentId,
      this.organizationId,
      task.type,
      task.data
    );
    
    // 2. Get optimal action from Q-learning
    const { action: suggestedAction, confidence } = await this.advancedLearning.getOptimalAction(
      this.agentId,
      this.organizationId,
      task.data
    );
    
    // 3. Enhance task with learned insights
    const enhancedTask = {
      ...task,
      data: {
        ...task.data,
        learnedInsights: relevantKnowledge,
        suggestedAction,
        actionConfidence: confidence
      }
    };
    
    // 4. Execute the task
    const result = await this.executeTask(enhancedTask);
    
    // 5. Record outcome for learning
    const executionTime = Date.now() - startTime;
    await this.basicLearning.recordOutcome(
      this.agentId,
      this.organizationId,
      task,
      result,
      executionTime
    );
    
    // 6. Update Q-learning if result includes reward
    if (result.metadata?.reward !== undefined) {
      await this.advancedLearning.updateQLearning(
        this.agentId,
        this.organizationId,
        task.data,
        suggestedAction,
        result.metadata.reward,
        result.metadata.nextState || task.data
      );
    }
    
    // 7. Learn neural patterns from inputs/outputs
    if (result.success && result.metadata?.outputs) {
      await this.advancedLearning.learnNeuralPattern(
        this.agentId,
        this.organizationId,
        task.data,
        result.metadata.outputs
      );
    }
    
    // 8. Share valuable insights via federated learning
    if (result.insights.length > 0 && confidence > 0.8) {
      const pattern = {
        pattern: `${task.type} produces insights when ${this.describeContext(task.data)}`,
        confidence,
        applicableTo: [task.type],
        context: task.data,
        outcomes: [{
          taskType: task.type,
          success: result.success,
          executionTime,
          impact: result.metadata?.impact || {},
          context: task.data,
          timestamp: new Date()
        }],
        useCount: 1,
        createdAt: new Date(),
        lastUsed: new Date()
      };
      
      await this.advancedLearning.federatedLearning(this.agentId, pattern);
    }
    
    return result;
  }
  
  /**
   * Learn from sequences of actions (temporal learning)
   */
  async learnFromSequence(
    sequence: Array<{ state: any; action: string; reward: number }>
  ): Promise<void> {
    await this.advancedLearning.temporalDifferenceLearning(
      this.agentId,
      this.organizationId,
      sequence
    );
  }
  
  /**
   * Transfer knowledge from another agent
   */
  async receiveTransferredKnowledge(
    sourceAgentId: string,
    knowledgeType: 'pattern' | 'strategy' | 'optimization'
  ): Promise<void> {
    const transferred = await this.advancedLearning.transferKnowledge(
      sourceAgentId,
      this.agentId,
      this.organizationId,
      knowledgeType
    );
    
    console.log(`📚 ${this.agentId} received ${transferred.length} knowledge items from ${sourceAgentId}`);
  }
  
  /**
   * Participate in collective decision making
   */
  async contributeToCollectiveDecision(problem: any): Promise<any> {
    // Get this agent's perspective
    const relevantPatterns = await this.basicLearning.getRelevantKnowledge(
      this.agentId,
      this.organizationId,
      'problem_solving',
      problem
    );
    
    // Generate solution based on learned patterns
    const solution = {
      approach: this.generateSolutionApproach(relevantPatterns),
      confidence: this.calculateSolutionConfidence(relevantPatterns),
      rationale: this.explainRationale(relevantPatterns)
    };
    
    return solution;
  }
  
  /**
   * Improve decision making for specific task type
   */
  async improveTaskPerformance(taskType: string): Promise<void> {
    const improvements = await this.basicLearning.improveDecisionMaking(
      this.agentId,
      this.organizationId,
      taskType
    );
    
    console.log(`🎯 ${this.agentId} improved ${taskType} performance:`, improvements);
  }
  
  /**
   * Get learning statistics
   */
  async getLearningStats(): Promise<any> {
    const stats = {
      agentId: this.agentId,
      organizationId: this.organizationId,
      neuralPatterns: await this.countNeuralPatterns(),
      qLearningStates: await this.countQLearningStates(),
      transferredKnowledge: await this.countTransferredKnowledge(),
      federatedContributions: await this.countFederatedContributions(),
      overallImprovement: await this.calculateOverallImprovement()
    };
    
    return stats;
  }
  
  // Helper methods
  
  private describeContext(context: any): string {
    const descriptions: string[] = [];
    
    for (const [key, value] of Object.entries(context)) {
      if (typeof value === 'string' || typeof value === 'number') {
        descriptions.push(`${key} is ${value}`);
      }
    }
    
    return descriptions.join(' and ') || 'standard conditions';
  }
  
  private generateSolutionApproach(patterns: Learning[]): string {
    if (patterns.length === 0) return 'Standard approach';
    
    // Use the highest confidence pattern
    const bestPattern = patterns.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );
    
    return bestPattern.pattern;
  }
  
  private calculateSolutionConfidence(patterns: Learning[]): number {
    if (patterns.length === 0) return 0.5;
    
    const avgConfidence = patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length;
    const diversityBonus = Math.min(patterns.length / 10, 0.2);
    
    return Math.min(0.95, avgConfidence + diversityBonus);
  }
  
  private explainRationale(patterns: Learning[]): string {
    if (patterns.length === 0) {
      return 'Based on general agent capabilities';
    }
    
    return `Based on ${patterns.length} learned patterns with average confidence ${
      (patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length * 100).toFixed(0)
    }%`;
  }
  
  private async countNeuralPatterns(): Promise<number> {
    const { count } = await this.supabase
      .from('agent_neural_patterns')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', this.agentId)
      .eq('organization_id', this.organizationId);
    
    return count || 0;
  }
  
  private async countQLearningStates(): Promise<number> {
    const { count } = await this.supabase
      .from('agent_q_values')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', this.agentId)
      .eq('organization_id', this.organizationId);
    
    return count || 0;
  }
  
  private async countTransferredKnowledge(): Promise<number> {
    const { count } = await this.supabase
      .from('agent_transferred_knowledge')
      .select('*', { count: 'exact', head: true })
      .eq('target_agent', this.agentId)
      .eq('organization_id', this.organizationId);
    
    return count || 0;
  }
  
  private async countFederatedContributions(): Promise<number> {
    const { count } = await this.supabase
      .from('federated_patterns')
      .select('*', { count: 'exact', head: true })
      .eq('agent_type', this.agentId);
    
    return count || 0;
  }
  
  private async calculateOverallImprovement(): Promise<number> {
    // Compare recent performance to baseline
    const { data: recentOutcomes } = await this.supabase
      .from('agent_outcomes')
      .select('success')
      .eq('agent_id', this.agentId)
      .eq('organization_id', this.organizationId)
      .order('created_at', { ascending: false })
      .limit(100);
    
    const { data: baselineOutcomes } = await this.supabase
      .from('agent_outcomes')
      .select('success')
      .eq('agent_id', this.agentId)
      .eq('organization_id', this.organizationId)
      .order('created_at', { ascending: true })
      .limit(100);
    
    if (!recentOutcomes || !baselineOutcomes) return 0;
    
    const recentSuccessRate = recentOutcomes.filter(o => o.success).length / recentOutcomes.length;
    const baselineSuccessRate = baselineOutcomes.filter(o => o.success).length / baselineOutcomes.length;
    
    return (recentSuccessRate - baselineSuccessRate) / (baselineSuccessRate || 1);
  }
}

/**
 * Create learning-enabled versions of all agents
 */
export function createLearningEnabledAgents(organizationId: string) {
  const agents = {
    carbonHunter: new LearningEnabledAgent(organizationId, {
      agentId: 'carbon-hunter',
      capabilities: [
        {
          name: 'detect_anomalies',
          description: 'Detect emission anomalies using ML',
          requiredPermissions: ['read:emissions'],
          maxAutonomyLevel: 5
        },
        {
          name: 'find_opportunities',
          description: 'Find optimization opportunities with learning',
          requiredPermissions: ['read:all', 'write:recommendations'],
          maxAutonomyLevel: 4
        }
      ]
    }),
    
    complianceGuardian: new LearningEnabledAgent(organizationId, {
      agentId: 'compliance-guardian',
      capabilities: [
        {
          name: 'monitor_compliance',
          description: 'Monitor compliance with predictive analytics',
          requiredPermissions: ['read:all'],
          maxAutonomyLevel: 5
        },
        {
          name: 'predict_deadlines',
          description: 'Predict compliance deadlines using patterns',
          requiredPermissions: ['read:reports', 'write:alerts'],
          maxAutonomyLevel: 4
        }
      ]
    }),
    
    supplyChainInvestigator: new LearningEnabledAgent(organizationId, {
      agentId: 'supply-chain-investigator',
      capabilities: [
        {
          name: 'assess_suppliers',
          description: 'Assess suppliers with learned criteria',
          requiredPermissions: ['read:suppliers', 'read:emissions'],
          maxAutonomyLevel: 4
        },
        {
          name: 'predict_risks',
          description: 'Predict supply chain risks using ML',
          requiredPermissions: ['read:all', 'write:alerts'],
          maxAutonomyLevel: 3
        }
      ]
    }),
    
    esgChiefOfStaff: new LearningEnabledAgent(organizationId, {
      agentId: 'esg-chief-of-staff',
      capabilities: [
        {
          name: 'analyze_performance',
          description: 'Analyze ESG performance with insights',
          requiredPermissions: ['read:all'],
          maxAutonomyLevel: 5
        },
        {
          name: 'strategic_planning',
          description: 'Strategic planning with collective intelligence',
          requiredPermissions: ['read:all', 'write:reports'],
          maxAutonomyLevel: 3
        }
      ]
    })
  };
  
  return agents;
}