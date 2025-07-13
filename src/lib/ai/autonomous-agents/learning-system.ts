import { createClient } from '@supabase/supabase-js';
import { Learning, AgentTask, AgentResult } from './agent-framework';

export interface LearningPattern {
  id: string;
  pattern: string;
  context: Record<string, any>;
  outcomes: Outcome[];
  confidence: number;
  applicableTo: string[];
  createdAt: Date;
  lastUsed: Date;
  useCount: number;
}

export interface Outcome {
  taskType: string;
  success: boolean;
  executionTime: number;
  impact: Record<string, any>;
  context: Record<string, any>;
  timestamp: Date;
}

export interface KnowledgeEntry {
  id: string;
  agentId: string;
  organizationId: string;
  category: string;
  knowledge: any;
  confidence: number;
  source: string;
  validatedAt?: Date;
  expiresAt?: Date;
}

export class AgentLearningSystem {
  private supabase: ReturnType<typeof createClient>;
  private learningCache: Map<string, LearningPattern[]> = new Map();
  
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
  }
  
  // Record the outcome of a task execution
  async recordOutcome(
    agentId: string,
    organizationId: string,
    task: AgentTask,
    result: AgentResult,
    executionTime: number
  ): Promise<void> {
    const outcome: Outcome = {
      taskType: task.type,
      success: result.success,
      executionTime,
      impact: this.extractImpact(result),
      context: {
        priority: task.priority,
        dataKeys: Object.keys(task.data || {}),
        actionTypes: result.actions.map(a => a.type),
        insightCount: result.insights.length
      },
      timestamp: new Date()
    };
    
    // Store raw outcome
    await this.storeOutcome(agentId, organizationId, outcome);
    
    // Extract and store patterns
    const patterns = await this.extractPatterns(agentId, organizationId, task, result, outcome);
    
    // Update confidence scores
    await this.updateConfidenceScores(agentId, organizationId, patterns);
    
    // Store new learnings
    for (const learning of result.learnings) {
      await this.storeLearning(agentId, organizationId, learning);
    }
  }
  
  // Get relevant knowledge for a task
  async getRelevantKnowledge(
    agentId: string,
    organizationId: string,
    taskType: string,
    context: Record<string, any>
  ): Promise<Learning[]> {
    // Get cached patterns
    const cacheKey = `${agentId}-${organizationId}`;
    let patterns = this.learningCache.get(cacheKey);
    
    if (!patterns) {
      patterns = await this.loadPatterns(agentId, organizationId);
      this.learningCache.set(cacheKey, patterns);
      
      // Expire cache after 10 minutes
      setTimeout(() => this.learningCache.delete(cacheKey), 10 * 60 * 1000);
    }
    
    // Filter relevant patterns
    const relevant = patterns.filter(pattern => {
      // Check if pattern applies to this task type
      if (!pattern.applicableTo.includes(taskType) && 
          !pattern.applicableTo.includes('*')) {
        return false;
      }
      
      // Check confidence threshold
      if (pattern.confidence < 0.6) {
        return false;
      }
      
      // Check context similarity
      const similarity = this.calculateContextSimilarity(pattern.context, context);
      return similarity > 0.7;
    });
    
    // Sort by confidence and recency
    relevant.sort((a, b) => {
      const confidenceDiff = b.confidence - a.confidence;
      if (Math.abs(confidenceDiff) > 0.1) return confidenceDiff;
      
      return b.lastUsed.getTime() - a.lastUsed.getTime();
    });
    
    // Convert to learnings
    return relevant.slice(0, 5).map(pattern => ({
      pattern: pattern.pattern,
      confidence: pattern.confidence,
      applicableTo: pattern.applicableTo
    }));
  }
  
  // Improve decision making based on outcomes
  async improveDecisionMaking(
    agentId: string,
    organizationId: string,
    taskType: string
  ): Promise<Record<string, any>> {
    // Get historical outcomes
    const { data: outcomes } = await this.supabase
      .from('agent_outcomes')
      .select('*')
      .eq('agent_id', agentId)
      .eq('organization_id', organizationId)
      .eq('task_type', taskType)
      .order('created_at', { ascending: false })
      .limit(100);
      
    if (!outcomes || outcomes.length < 10) {
      return {}; // Not enough data
    }
    
    // Analyze success patterns
    const successfulOutcomes = outcomes.filter(o => o.success);
    const failedOutcomes = outcomes.filter(o => !o.success);
    
    // Extract common factors in successful outcomes
    const successFactors = this.extractCommonFactors(successfulOutcomes);
    const failureFactors = this.extractCommonFactors(failedOutcomes);
    
    // Calculate optimal parameters
    const improvements = {
      optimalTiming: this.findOptimalTiming(successfulOutcomes),
      avoidConditions: this.findAvoidancePatterns(failureFactors),
      recommendedApproach: this.determineOptimalApproach(successFactors),
      confidenceLevel: successfulOutcomes.length / outcomes.length
    };
    
    // Store improvements as knowledge
    await this.storeKnowledge(agentId, organizationId, {
      category: 'decision_improvements',
      knowledge: improvements,
      confidence: improvements.confidenceLevel,
      source: `analysis_of_${outcomes.length}_outcomes`
    });
    
    return improvements;
  }
  
  // Extract patterns from task execution
  private async extractPatterns(
    agentId: string,
    organizationId: string,
    task: AgentTask,
    result: AgentResult,
    outcome: Outcome
  ): Promise<LearningPattern[]> {
    const patterns: LearningPattern[] = [];
    
    // Pattern 1: Task success patterns
    if (result.success) {
      patterns.push({
        id: `success-${task.type}-${Date.now()}`,
        pattern: `${task.type} tasks succeed when ${this.describeContext(outcome.context)}`,
        context: outcome.context,
        outcomes: [outcome],
        confidence: 0.7,
        applicableTo: [task.type],
        createdAt: new Date(),
        lastUsed: new Date(),
        useCount: 1
      });
    }
    
    // Pattern 2: Action effectiveness
    for (const action of result.actions) {
      if (action.impact && Object.keys(action.impact).length > 0) {
        patterns.push({
          id: `action-${action.type}-${Date.now()}`,
          pattern: `${action.type} action has impact on ${Object.keys(action.impact).join(', ')}`,
          context: { actionType: action.type, taskType: task.type },
          outcomes: [outcome],
          confidence: 0.8,
          applicableTo: [task.type, action.type],
          createdAt: new Date(),
          lastUsed: new Date(),
          useCount: 1
        });
      }
    }
    
    // Pattern 3: Time-based patterns
    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();
    patterns.push({
      id: `timing-${task.type}-${Date.now()}`,
      pattern: `${task.type} tasks performed at hour ${hour} on day ${dayOfWeek}`,
      context: { hour, dayOfWeek, taskType: task.type },
      outcomes: [outcome],
      confidence: 0.5,
      applicableTo: [task.type],
      createdAt: new Date(),
      lastUsed: new Date(),
      useCount: 1
    });
    
    return patterns;
  }
  
  // Store outcome in database
  private async storeOutcome(
    agentId: string,
    organizationId: string,
    outcome: Outcome
  ): Promise<void> {
    await this.supabase
      .from('agent_outcomes')
      .insert({
        agent_id: agentId,
        organization_id: organizationId,
        task_type: outcome.taskType,
        success: outcome.success,
        execution_time: outcome.executionTime,
        impact: outcome.impact,
        context: outcome.context,
        created_at: outcome.timestamp.toISOString()
      });
  }
  
  // Store learning in knowledge base
  private async storeLearning(
    agentId: string,
    organizationId: string,
    learning: Learning
  ): Promise<void> {
    await this.supabase
      .from('agent_knowledge')
      .insert({
        agent_id: agentId,
        organization_id: organizationId,
        learning: learning,
        created_at: new Date().toISOString()
      });
  }
  
  // Store knowledge entry
  private async storeKnowledge(
    agentId: string,
    organizationId: string,
    knowledge: Omit<KnowledgeEntry, 'id' | 'agentId' | 'organizationId'>
  ): Promise<void> {
    await this.supabase
      .from('agent_knowledge_base')
      .insert({
        agent_id: agentId,
        organization_id: organizationId,
        ...knowledge,
        created_at: new Date().toISOString()
      });
  }
  
  // Load patterns from database
  private async loadPatterns(
    agentId: string,
    organizationId: string
  ): Promise<LearningPattern[]> {
    const { data } = await this.supabase
      .from('agent_patterns')
      .select('*')
      .eq('agent_id', agentId)
      .eq('organization_id', organizationId)
      .gte('confidence', 0.5)
      .order('confidence', { ascending: false })
      .limit(100);
      
    if (!data) return [];
    
    return data.map((p: any) => ({
      id: p.id as string,
      pattern: p.pattern as string,
      context: p.context,
      outcomes: p.outcomes,
      confidence: p.confidence as number,
      applicableTo: p.applicable_to as string[],
      createdAt: new Date(p.created_at),
      lastUsed: new Date(p.last_used),
      useCount: p.use_count as number
    }));
  }
  
  // Update confidence scores based on new outcomes
  private async updateConfidenceScores(
    agentId: string,
    organizationId: string,
    patterns: LearningPattern[]
  ): Promise<void> {
    for (const pattern of Array.from(patterns)) {
      // Check if pattern already exists
      const { data: existing } = await this.supabase
        .from('agent_patterns')
        .select('*')
        .eq('agent_id', agentId)
        .eq('organization_id', organizationId)
        .eq('pattern', pattern.pattern)
        .single();
        
      if (existing) {
        // Update existing pattern
        const newConfidence = this.calculateNewConfidence(
          existing.confidence as number,
          existing.use_count as number,
          pattern.outcomes[0].success
        );
        
        await this.supabase
          .from('agent_patterns')
          .update({
            confidence: newConfidence,
            use_count: (existing.use_count as number) + 1,
            last_used: new Date().toISOString(),
            outcomes: [...(existing.outcomes as any[]), pattern.outcomes[0]]
          })
          .eq('id', existing.id as string);
      } else {
        // Create new pattern
        await this.supabase
          .from('agent_patterns')
          .insert({
            agent_id: agentId,
            organization_id: organizationId,
            pattern: pattern.pattern,
            context: pattern.context,
            outcomes: pattern.outcomes,
            confidence: pattern.confidence,
            applicable_to: pattern.applicableTo,
            use_count: 1,
            last_used: new Date().toISOString(),
            created_at: new Date().toISOString()
          });
      }
    }
  }
  
  // Calculate new confidence based on outcomes
  private calculateNewConfidence(
    currentConfidence: number,
    useCount: number,
    success: boolean
  ): number {
    // Bayesian update
    const prior = currentConfidence;
    const likelihood = success ? 0.9 : 0.1;
    const evidence = (prior * likelihood) + ((1 - prior) * (1 - likelihood));
    const posterior = (prior * likelihood) / evidence;
    
    // Weight by use count (more uses = slower changes)
    const weight = Math.min(useCount / 10, 0.9);
    return currentConfidence * weight + posterior * (1 - weight);
  }
  
  // Calculate context similarity
  private calculateContextSimilarity(
    context1: Record<string, any>,
    context2: Record<string, any>
  ): number {
    const keys1 = Object.keys(context1);
    const keys2 = Object.keys(context2);
    const allKeys = new Set([...keys1, ...keys2]);
    
    let matches = 0;
    let total = 0;
    
    for (const key of Array.from(allKeys)) {
      total++;
      if (context1[key] === context2[key]) {
        matches++;
      } else if (typeof context1[key] === typeof context2[key]) {
        matches += 0.5;
      }
    }
    
    return total > 0 ? matches / total : 0;
  }
  
  // Extract impact from result
  private extractImpact(result: AgentResult): Record<string, any> {
    const impact: Record<string, any> = {};
    
    // Aggregate impacts from actions
    for (const action of result.actions) {
      if (action.impact) {
        Object.assign(impact, action.impact);
      }
    }
    
    // Add insight count as impact
    impact.insightsGenerated = result.insights.length;
    impact.nextStepsIdentified = result.nextSteps.length;
    
    return impact;
  }
  
  // Describe context in human-readable form
  private describeContext(context: Record<string, any>): string {
    const descriptions: string[] = [];
    
    if (context.priority) {
      descriptions.push(`priority is ${context.priority}`);
    }
    if (context.hour !== undefined) {
      descriptions.push(`executed at hour ${context.hour}`);
    }
    if (context.actionTypes && context.actionTypes.length > 0) {
      descriptions.push(`using ${context.actionTypes.join(', ')} actions`);
    }
    
    return descriptions.join(' and ') || 'standard conditions';
  }
  
  // Extract common factors from outcomes
  private extractCommonFactors(outcomes: any[]): Record<string, any> {
    const factors: Record<string, any> = {};
    
    // Find common context values
    if (outcomes.length === 0) return factors;
    
    const firstContext = outcomes[0].context;
    for (const key of Object.keys(firstContext)) {
      const values = outcomes.map(o => o.context[key]);
      const uniqueValues = Array.from(new Set(values));
      
      if (uniqueValues.length === 1) {
        factors[key] = uniqueValues[0];
      } else if (uniqueValues.length < outcomes.length / 2) {
        // Most common value
        const counts = values.reduce((acc, val) => {
          acc[val] = (acc[val] || 0) + 1;
          return acc;
        }, {});
        
        const mostCommon = Object.entries(counts)
          .sort(([, a], [, b]) => (b as number) - (a as number))[0];
          
        factors[key] = mostCommon[0];
      }
    }
    
    return factors;
  }
  
  // Find optimal timing from successful outcomes
  private findOptimalTiming(outcomes: any[]): Record<string, any> {
    if (outcomes.length === 0) return {};
    
    const hours = outcomes.map(o => o.context.hour).filter(h => h !== undefined);
    const days = outcomes.map(o => o.context.dayOfWeek).filter(d => d !== undefined);
    
    return {
      preferredHours: this.findMostFrequent(hours),
      preferredDays: this.findMostFrequent(days),
      averageExecutionTime: outcomes.reduce((sum, o) => sum + o.execution_time, 0) / outcomes.length
    };
  }
  
  // Find patterns to avoid
  private findAvoidancePatterns(factors: Record<string, any>): string[] {
    const patterns: string[] = [];
    
    for (const [key, value] of Object.entries(factors)) {
      patterns.push(`Avoid when ${key} is ${value}`);
    }
    
    return patterns;
  }
  
  // Determine optimal approach
  private determineOptimalApproach(factors: Record<string, any>): string {
    const approaches: string[] = [];
    
    if (factors.priority) {
      approaches.push(`Use ${factors.priority} priority`);
    }
    if (factors.actionTypes) {
      approaches.push(`Execute ${factors.actionTypes} actions`);
    }
    
    return approaches.join(', ') || 'Standard approach';
  }
  
  // Find most frequent values
  private findMostFrequent(values: any[]): any[] {
    if (values.length === 0) return [];
    
    const counts = values.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {});
    
    const sorted = Object.entries(counts)
      .sort(([, a], [, b]) => (b as number) - (a as number));
      
    const maxCount = sorted[0][1] as number;
    return sorted
      .filter(([, count]) => count === maxCount)
      .map(([value]) => value);
  }
}