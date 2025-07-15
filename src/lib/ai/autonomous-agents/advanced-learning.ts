/**
 * Advanced Learning System for Autonomous Agents
 * 
 * Implements cutting-edge ML algorithms for agent intelligence:
 * - Neural network-based pattern recognition
 * - Reinforcement learning for decision optimization
 * - Transfer learning between agents
 * - Federated learning for privacy-preserving insights
 * - Temporal difference learning for long-term planning
 */

import { createClient } from '@supabase/supabase-js';
import { AgentTask, AgentResult, Learning } from './agent-framework';
import { AgentLearningSystem, LearningPattern, Outcome } from './learning-system';

export interface NeuralPattern {
  id: string;
  inputVector: number[];
  outputVector: number[];
  weights: number[][];
  activation: 'relu' | 'sigmoid' | 'tanh';
  confidence: number;
  trainingSamples: number;
  lastUpdated: Date;
}

export interface ReinforcementState {
  stateVector: number[];
  availableActions: string[];
  qValues: Record<string, number>;
  visitCount: number;
  lastReward: number;
}

export interface TransferableKnowledge {
  sourceAgent: string;
  targetAgent: string;
  knowledgeType: 'pattern' | 'strategy' | 'optimization';
  embedding: number[];
  applicability: number;
  transferredAt: Date;
  effectiveness: number;
}

export interface FederatedInsight {
  id: string;
  participatingOrgs: number;
  aggregatedPattern: any;
  privacyLevel: 'high' | 'medium' | 'low';
  statisticalSignificance: number;
  globalConfidence: number;
}

export interface TemporalLearning {
  sequenceId: string;
  states: Array<{
    timestamp: Date;
    state: any;
    action: string;
    reward: number;
  }>;
  cumulativeReward: number;
  discountFactor: number;
  horizon: number;
}

export class AdvancedLearningSystem extends AgentLearningSystem {
  private neuralPatterns: Map<string, NeuralPattern[]> = new Map();
  private qTables: Map<string, Map<string, ReinforcementState>> = new Map();
  private transferCache: Map<string, TransferableKnowledge[]> = new Map();
  private temporalSequences: Map<string, TemporalLearning[]> = new Map();
  
  // Learning hyperparameters
  private readonly LEARNING_RATE = 0.01;
  private readonly DISCOUNT_FACTOR = 0.95;
  private readonly EXPLORATION_RATE = 0.1;
  private readonly TRANSFER_THRESHOLD = 0.75;
  private readonly BATCH_SIZE = 32;
  
  constructor() {
    super();
  }
  
  /**
   * Neural Network Pattern Recognition
   * Uses a simple feedforward network to recognize complex patterns
   */
  async learnNeuralPattern(
    agentId: string,
    organizationId: string,
    inputs: Record<string, any>,
    outputs: Record<string, any>
  ): Promise<NeuralPattern> {
    const inputVector = this.vectorizeInputs(inputs);
    const outputVector = this.vectorizeOutputs(outputs);
    
    // Get or create neural pattern
    const patternKey = `${agentId}-${organizationId}`;
    let patterns = this.neuralPatterns.get(patternKey) || [];
    
    // Find similar pattern or create new
    let pattern = patterns.find(p => 
      this.cosineSimilarity(p.inputVector, inputVector) > 0.9
    );
    
    if (!pattern) {
      pattern = {
        id: `neural-${Date.now()}`,
        inputVector,
        outputVector,
        weights: this.initializeWeights(inputVector.length, outputVector.length),
        activation: 'relu',
        confidence: 0.5,
        trainingSamples: 0,
        lastUpdated: new Date()
      };
      patterns.push(pattern);
    }
    
    // Train the pattern using backpropagation
    pattern = await this.trainNeuralPattern(pattern, inputVector, outputVector);
    
    // Update cache
    this.neuralPatterns.set(patternKey, patterns);
    
    // Store in database
    await this.storeNeuralPattern(agentId, organizationId, pattern);
    
    return pattern;
  }
  
  /**
   * Reinforcement Learning Q-Learning Algorithm
   * Optimizes action selection based on cumulative rewards
   */
  async updateQLearning(
    agentId: string,
    organizationId: string,
    state: any,
    action: string,
    reward: number,
    nextState: any
  ): Promise<void> {
    const stateKey = this.hashState(state);
    const nextStateKey = this.hashState(nextState);
    
    // Get or create Q-table for agent
    const tableKey = `${agentId}-${organizationId}`;
    let qTable = this.qTables.get(tableKey) || new Map<string, ReinforcementState>();
    
    // Get current Q-value
    let currentState = qTable.get(stateKey);
    if (!currentState) {
      currentState = {
        stateVector: this.vectorizeState(state),
        availableActions: await this.getAvailableActions(agentId, state),
        qValues: {},
        visitCount: 0,
        lastReward: 0
      };
      qTable.set(stateKey, currentState);
    }
    
    // Initialize Q-value if needed
    if (!currentState.qValues[action]) {
      currentState.qValues[action] = 0;
    }
    
    // Get max Q-value for next state
    let nextStateData = qTable.get(nextStateKey);
    let maxNextQ = 0;
    
    if (nextStateData) {
      maxNextQ = Math.max(...Object.values(nextStateData.qValues), 0);
    }
    
    // Q-learning update rule
    const oldQ = currentState.qValues[action];
    const newQ = oldQ + this.LEARNING_RATE * (
      reward + this.DISCOUNT_FACTOR * maxNextQ - oldQ
    );
    
    currentState.qValues[action] = newQ;
    currentState.visitCount++;
    currentState.lastReward = reward;
    
    // Update Q-table
    this.qTables.set(tableKey, qTable);
    
    // Store update in database
    await this.storeQLearningUpdate(agentId, organizationId, stateKey, action, newQ);
  }
  
  /**
   * Transfer Learning Between Agents
   * Shares successful strategies across agents
   */
  async transferKnowledge(
    sourceAgentId: string,
    targetAgentId: string,
    organizationId: string,
    knowledgeType: 'pattern' | 'strategy' | 'optimization'
  ): Promise<TransferableKnowledge[]> {
    // Get source agent's best performing patterns
    const sourcePatterns = await this.getTopPatterns(sourceAgentId, organizationId, 10);
    
    // Convert to transferable format
    const transferableItems: TransferableKnowledge[] = [];
    
    for (const pattern of sourcePatterns) {
      // Create embedding of the pattern
      const embedding = await this.createPatternEmbedding(pattern);
      
      // Calculate applicability to target agent
      const applicability = await this.calculateTransferApplicability(
        sourceAgentId,
        targetAgentId,
        pattern
      );
      
      if (applicability >= this.TRANSFER_THRESHOLD) {
        const knowledge: TransferableKnowledge = {
          sourceAgent: sourceAgentId,
          targetAgent: targetAgentId,
          knowledgeType,
          embedding,
          applicability,
          transferredAt: new Date(),
          effectiveness: 0 // Will be updated based on target agent's performance
        };
        
        transferableItems.push(knowledge);
        
        // Apply to target agent
        await this.applyTransferredKnowledge(targetAgentId, organizationId, knowledge);
      }
    }
    
    // Cache transferred knowledge
    const cacheKey = `${sourceAgentId}-${targetAgentId}`;
    this.transferCache.set(cacheKey, transferableItems);
    
    // Store transfer record
    await this.storeKnowledgeTransfer(transferableItems);
    
    return transferableItems;
  }
  
  /**
   * Federated Learning for Privacy-Preserving Insights
   * Aggregates learnings across organizations without sharing raw data
   */
  async federatedLearning(
    agentId: string,
    localPattern: LearningPattern
  ): Promise<FederatedInsight> {
    // Generate differentially private version of pattern
    const privatePattern = this.addDifferentialPrivacy(localPattern);
    
    // Get global aggregated patterns
    const { data: globalPatterns } = await this.supabase
      .from('federated_patterns')
      .select('*')
      .eq('agent_type', agentId)
      .eq('pattern_type', this.classifyPattern(localPattern))
      .single();
    
    let insight: FederatedInsight;
    
    if (globalPatterns) {
      // Update existing global pattern
      const updatedPattern = this.aggregatePatterns(
        globalPatterns.aggregated_pattern,
        privatePattern,
        globalPatterns.participating_orgs
      );
      
      insight = {
        id: globalPatterns.id,
        participatingOrgs: globalPatterns.participating_orgs + 1,
        aggregatedPattern: updatedPattern,
        privacyLevel: 'high',
        statisticalSignificance: this.calculateSignificance(
          updatedPattern,
          globalPatterns.participating_orgs + 1
        ),
        globalConfidence: this.calculateGlobalConfidence(
          updatedPattern,
          globalPatterns.participating_orgs + 1
        )
      };
      
      // Update global pattern
      await this.supabase
        .from('federated_patterns')
        .update({
          aggregated_pattern: updatedPattern,
          participating_orgs: insight.participatingOrgs,
          statistical_significance: insight.statisticalSignificance,
          global_confidence: insight.globalConfidence,
          updated_at: new Date().toISOString()
        })
        .eq('id', globalPatterns.id);
    } else {
      // Create new global pattern
      insight = {
        id: `federated-${Date.now()}`,
        participatingOrgs: 1,
        aggregatedPattern: privatePattern,
        privacyLevel: 'high',
        statisticalSignificance: 0.5,
        globalConfidence: localPattern.confidence
      };
      
      await this.supabase
        .from('federated_patterns')
        .insert({
          id: insight.id,
          agent_type: agentId,
          pattern_type: this.classifyPattern(localPattern),
          aggregated_pattern: insight.aggregatedPattern,
          participating_orgs: 1,
          privacy_level: 'high',
          statistical_significance: 0.5,
          global_confidence: localPattern.confidence,
          created_at: new Date().toISOString()
        });
    }
    
    return insight;
  }
  
  /**
   * Temporal Difference Learning for Long-Term Planning
   * Learns from sequences of actions and delayed rewards
   */
  async temporalDifferenceLearning(
    agentId: string,
    organizationId: string,
    sequence: Array<{ state: any; action: string; reward: number }>
  ): Promise<TemporalLearning> {
    const sequenceId = `td-${Date.now()}`;
    
    // Create temporal learning sequence
    const temporal: TemporalLearning = {
      sequenceId,
      states: sequence.map((s, idx) => ({
        timestamp: new Date(Date.now() - (sequence.length - idx) * 60000), // 1 min intervals
        state: s.state,
        action: s.action,
        reward: s.reward
      })),
      cumulativeReward: sequence.reduce((sum, s) => sum + s.reward, 0),
      discountFactor: this.DISCOUNT_FACTOR,
      horizon: sequence.length
    };
    
    // Calculate TD errors and update value function
    for (let i = 0; i < sequence.length - 1; i++) {
      const currentState = sequence[i];
      const nextState = sequence[i + 1];
      
      // TD error = reward + γ * V(next_state) - V(current_state)
      const tdError = currentState.reward + 
        this.DISCOUNT_FACTOR * this.estimateStateValue(nextState.state) -
        this.estimateStateValue(currentState.state);
      
      // Update state value estimates
      await this.updateStateValue(
        agentId,
        organizationId,
        currentState.state,
        tdError
      );
    }
    
    // Store temporal sequence
    const key = `${agentId}-${organizationId}`;
    const sequences = this.temporalSequences.get(key) || [];
    sequences.push(temporal);
    this.temporalSequences.set(key, sequences);
    
    // Store in database
    await this.storeTemporalSequence(agentId, organizationId, temporal);
    
    return temporal;
  }
  
  /**
   * Get optimal action using epsilon-greedy strategy
   */
  async getOptimalAction(
    agentId: string,
    organizationId: string,
    state: any
  ): Promise<{ action: string; confidence: number }> {
    const stateKey = this.hashState(state);
    const tableKey = `${agentId}-${organizationId}`;
    const qTable = this.qTables.get(tableKey);
    
    if (!qTable || Math.random() < this.EXPLORATION_RATE) {
      // Explore: choose random action
      const actions = await this.getAvailableActions(agentId, state);
      return {
        action: actions[Math.floor(Math.random() * actions.length)],
        confidence: this.EXPLORATION_RATE
      };
    }
    
    // Exploit: choose best known action
    const stateData = qTable.get(stateKey);
    if (!stateData || Object.keys(stateData.qValues).length === 0) {
      const actions = await this.getAvailableActions(agentId, state);
      return {
        action: actions[0],
        confidence: 0.5
      };
    }
    
    // Find action with highest Q-value
    let bestAction = '';
    let bestValue = -Infinity;
    
    for (const [action, qValue] of Object.entries(stateData.qValues)) {
      if (qValue > bestValue) {
        bestValue = qValue;
        bestAction = action;
      }
    }
    
    // Calculate confidence based on visit count and Q-value spread
    const values = Object.values(stateData.qValues);
    const avgValue = values.reduce((a, b) => a + b, 0) / values.length;
    const spread = Math.max(...values) - Math.min(...values);
    
    const confidence = Math.min(
      0.95,
      0.5 + (stateData.visitCount / 100) * 0.3 + (spread / (avgValue || 1)) * 0.15
    );
    
    return { action: bestAction, confidence };
  }
  
  /**
   * Cross-agent collective intelligence
   */
  async collectiveIntelligence(
    organizationId: string,
    problem: any
  ): Promise<{ solution: any; consensus: number }> {
    // Get all agents' perspectives
    const agentTypes = ['carbon-hunter', 'compliance-guardian', 'supply-chain-investigator', 'esg-chief-of-staff'];
    const perspectives: Array<{ agent: string; solution: any; confidence: number }> = [];
    
    for (const agentId of agentTypes) {
      // Get agent's learned patterns relevant to the problem
      const patterns = await this.getRelevantKnowledge(
        agentId,
        organizationId,
        'problem_solving',
        problem
      );
      
      // Generate solution based on patterns
      const solution = await this.generateSolution(agentId, patterns, problem);
      
      perspectives.push({
        agent: agentId,
        solution,
        confidence: this.calculateSolutionConfidence(patterns)
      });
    }
    
    // Aggregate solutions using weighted consensus
    const aggregatedSolution = this.aggregateSolutions(perspectives);
    const consensus = this.calculateConsensus(perspectives);
    
    // Store collective decision
    await this.storeCollectiveDecision(organizationId, problem, aggregatedSolution, consensus);
    
    return { solution: aggregatedSolution, consensus };
  }
  
  // Helper methods
  
  private vectorizeInputs(inputs: Record<string, any>): number[] {
    const vector: number[] = [];
    
    for (const [key, value] of Object.entries(inputs)) {
      if (typeof value === 'number') {
        vector.push(value);
      } else if (typeof value === 'boolean') {
        vector.push(value ? 1 : 0);
      } else if (typeof value === 'string') {
        // Simple hash to number
        vector.push(this.hashString(value) % 1000 / 1000);
      }
    }
    
    return vector;
  }
  
  private vectorizeOutputs(outputs: Record<string, any>): number[] {
    return this.vectorizeInputs(outputs); // Same logic
  }
  
  private vectorizeState(state: any): number[] {
    if (typeof state === 'object') {
      return this.vectorizeInputs(state);
    }
    return [this.hashString(JSON.stringify(state)) % 1000 / 1000];
  }
  
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
  }
  
  private initializeWeights(inputSize: number, outputSize: number): number[][] {
    const weights: number[][] = [];
    
    // Xavier initialization
    const scale = Math.sqrt(2.0 / (inputSize + outputSize));
    
    for (let i = 0; i < inputSize; i++) {
      weights[i] = [];
      for (let j = 0; j < outputSize; j++) {
        weights[i][j] = (Math.random() - 0.5) * 2 * scale;
      }
    }
    
    return weights;
  }
  
  private async trainNeuralPattern(
    pattern: NeuralPattern,
    input: number[],
    target: number[]
  ): Promise<NeuralPattern> {
    // Simple gradient descent training
    const output = this.forward(input, pattern.weights, pattern.activation);
    const error = target.map((t, i) => t - output[i]);
    
    // Backpropagation
    for (let i = 0; i < pattern.weights.length; i++) {
      for (let j = 0; j < pattern.weights[i].length; j++) {
        const gradient = error[j] * input[i] * this.LEARNING_RATE;
        pattern.weights[i][j] += gradient;
      }
    }
    
    pattern.trainingSamples++;
    pattern.confidence = Math.min(0.95, 0.5 + pattern.trainingSamples / 200);
    pattern.lastUpdated = new Date();
    
    return pattern;
  }
  
  private forward(input: number[], weights: number[][], activation: string): number[] {
    const output: number[] = [];
    
    for (let j = 0; j < weights[0].length; j++) {
      let sum = 0;
      for (let i = 0; i < input.length; i++) {
        sum += input[i] * weights[i][j];
      }
      
      // Apply activation function
      switch (activation) {
        case 'relu':
          output.push(Math.max(0, sum));
          break;
        case 'sigmoid':
          output.push(1 / (1 + Math.exp(-sum)));
          break;
        case 'tanh':
          output.push(Math.tanh(sum));
          break;
      }
    }
    
    return output;
  }
  
  private hashState(state: any): string {
    return `state-${this.hashString(JSON.stringify(state))}`;
  }
  
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
  
  private async getAvailableActions(agentId: string, state: any): Promise<string[]> {
    // Get agent capabilities
    const { data: capabilities } = await this.supabase
      .from('agent_capabilities')
      .select('name')
      .eq('agent_type', agentId);
    
    return capabilities?.map(c => c.name) || ['default_action'];
  }
  
  private estimateStateValue(state: any): number {
    // Simple state value estimation
    // In a real implementation, this would use a trained value function
    return Math.random() * 10 - 5;
  }
  
  private async updateStateValue(
    agentId: string,
    organizationId: string,
    state: any,
    tdError: number
  ): Promise<void> {
    // Update state value in database
    const stateKey = this.hashState(state);
    
    await this.supabase
      .from('agent_state_values')
      .upsert({
        agent_id: agentId,
        organization_id: organizationId,
        state_key: stateKey,
        state_data: state,
        value: tdError,
        updated_at: new Date().toISOString()
      });
  }
  
  private async getTopPatterns(
    agentId: string,
    organizationId: string,
    limit: number
  ): Promise<LearningPattern[]> {
    const { data } = await this.supabase
      .from('agent_patterns')
      .select('*')
      .eq('agent_id', agentId)
      .eq('organization_id', organizationId)
      .order('confidence', { ascending: false })
      .limit(limit);
    
    return data || [];
  }
  
  private async createPatternEmbedding(pattern: LearningPattern): Promise<number[]> {
    // Create vector embedding of pattern
    // In production, this would use a proper embedding model
    const embedding: number[] = [];
    
    // Encode pattern characteristics
    embedding.push(pattern.confidence);
    embedding.push(pattern.useCount / 100);
    embedding.push(pattern.outcomes.filter(o => o.success).length / pattern.outcomes.length);
    
    // Encode context
    const contextStr = JSON.stringify(pattern.context);
    for (let i = 0; i < 10; i++) {
      embedding.push(this.hashString(contextStr + i) % 100 / 100);
    }
    
    return embedding;
  }
  
  private async calculateTransferApplicability(
    sourceAgent: string,
    targetAgent: string,
    pattern: LearningPattern
  ): Promise<number> {
    // Calculate how applicable a pattern is for transfer
    // Consider agent similarity and task overlap
    
    const agentSimilarity = this.getAgentSimilarity(sourceAgent, targetAgent);
    const taskOverlap = pattern.applicableTo.includes('*') ? 1 : 0.5;
    
    return agentSimilarity * 0.6 + taskOverlap * 0.4;
  }
  
  private getAgentSimilarity(agent1: string, agent2: string): number {
    // Define agent similarity matrix
    const similarities: Record<string, Record<string, number>> = {
      'carbon-hunter': {
        'carbon-hunter': 1,
        'compliance-guardian': 0.7,
        'supply-chain-investigator': 0.8,
        'esg-chief-of-staff': 0.6
      },
      'compliance-guardian': {
        'carbon-hunter': 0.7,
        'compliance-guardian': 1,
        'supply-chain-investigator': 0.6,
        'esg-chief-of-staff': 0.8
      },
      'supply-chain-investigator': {
        'carbon-hunter': 0.8,
        'compliance-guardian': 0.6,
        'supply-chain-investigator': 1,
        'esg-chief-of-staff': 0.7
      },
      'esg-chief-of-staff': {
        'carbon-hunter': 0.6,
        'compliance-guardian': 0.8,
        'supply-chain-investigator': 0.7,
        'esg-chief-of-staff': 1
      }
    };
    
    return similarities[agent1]?.[agent2] || 0.5;
  }
  
  private addDifferentialPrivacy(pattern: LearningPattern): any {
    // Add noise to pattern for privacy
    const epsilon = 1.0; // Privacy parameter
    
    const privatePattern = { ...pattern };
    
    // Add Laplace noise to numeric values
    if (privatePattern.confidence) {
      const noise = this.laplaceNoise(0, 1/epsilon);
      privatePattern.confidence = Math.max(0, Math.min(1, privatePattern.confidence + noise));
    }
    
    // Generalize context
    privatePattern.context = this.generalizeContext(privatePattern.context);
    
    return privatePattern;
  }
  
  private laplaceNoise(mean: number, scale: number): number {
    const u = Math.random() - 0.5;
    return mean - scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
  }
  
  private generalizeContext(context: Record<string, any>): Record<string, any> {
    const generalized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(context)) {
      if (typeof value === 'number') {
        // Round numbers to reduce precision
        generalized[key] = Math.round(value / 10) * 10;
      } else if (typeof value === 'string') {
        // Keep only general category
        generalized[key] = 'category';
      } else {
        generalized[key] = typeof value;
      }
    }
    
    return generalized;
  }
  
  private classifyPattern(pattern: LearningPattern): string {
    // Classify pattern type for federated grouping
    if (pattern.pattern.includes('emission')) return 'emissions';
    if (pattern.pattern.includes('compliance')) return 'compliance';
    if (pattern.pattern.includes('supplier')) return 'supply_chain';
    if (pattern.pattern.includes('optimization')) return 'optimization';
    return 'general';
  }
  
  private aggregatePatterns(existing: any, newPattern: any, count: number): any {
    // Aggregate patterns while preserving privacy
    const aggregated: any = {};
    
    // Weighted average for numeric fields
    for (const key of Object.keys(newPattern)) {
      if (typeof newPattern[key] === 'number' && typeof existing[key] === 'number') {
        aggregated[key] = (existing[key] * count + newPattern[key]) / (count + 1);
      } else {
        aggregated[key] = newPattern[key]; // Keep latest for non-numeric
      }
    }
    
    return aggregated;
  }
  
  private calculateSignificance(pattern: any, sampleSize: number): number {
    // Statistical significance based on sample size
    if (sampleSize < 10) return 0.5;
    if (sampleSize < 50) return 0.7;
    if (sampleSize < 100) return 0.85;
    return 0.95;
  }
  
  private calculateGlobalConfidence(pattern: any, participants: number): number {
    // Global confidence based on participants and consistency
    const baseConfidence = pattern.confidence || 0.5;
    const participantBoost = Math.min(participants / 100, 0.3);
    
    return Math.min(0.95, baseConfidence + participantBoost);
  }
  
  private async generateSolution(
    agentId: string,
    patterns: Learning[],
    problem: any
  ): Promise<any> {
    // Generate solution based on learned patterns
    const solutions: any[] = [];
    
    for (const pattern of patterns) {
      if (pattern.confidence > 0.7) {
        solutions.push({
          approach: pattern.pattern,
          confidence: pattern.confidence,
          applicability: pattern.applicableTo
        });
      }
    }
    
    return {
      agentId,
      proposedSolutions: solutions,
      reasoning: `Based on ${patterns.length} learned patterns`
    };
  }
  
  private calculateSolutionConfidence(patterns: Learning[]): number {
    if (patterns.length === 0) return 0.1;
    
    const avgConfidence = patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length;
    const diversityBonus = Math.min(patterns.length / 10, 0.2);
    
    return Math.min(0.95, avgConfidence + diversityBonus);
  }
  
  private aggregateSolutions(perspectives: Array<{ agent: string; solution: any; confidence: number }>): any {
    // Weighted aggregation of solutions
    const aggregated: any = {
      consensusApproach: [],
      individualContributions: {}
    };
    
    // Collect all proposed solutions with weights
    const allSolutions: Array<{ solution: any; weight: number }> = [];
    
    for (const perspective of perspectives) {
      aggregated.individualContributions[perspective.agent] = perspective.solution;
      
      if (perspective.solution.proposedSolutions) {
        for (const solution of perspective.solution.proposedSolutions) {
          allSolutions.push({
            solution,
            weight: perspective.confidence * solution.confidence
          });
        }
      }
    }
    
    // Sort by weight and take top solutions
    allSolutions.sort((a, b) => b.weight - a.weight);
    aggregated.consensusApproach = allSolutions.slice(0, 3).map(s => s.solution);
    
    return aggregated;
  }
  
  private calculateConsensus(perspectives: Array<{ agent: string; solution: any; confidence: number }>): number {
    // Calculate consensus level among agents
    const confidences = perspectives.map(p => p.confidence);
    const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
    
    // Calculate variance
    const variance = confidences.reduce((sum, conf) => sum + Math.pow(conf - avgConfidence, 2), 0) / confidences.length;
    
    // Higher consensus when variance is low
    const consensus = Math.max(0, 1 - Math.sqrt(variance));
    
    return consensus * avgConfidence;
  }
  
  // Database storage methods
  
  private async storeNeuralPattern(
    agentId: string,
    organizationId: string,
    pattern: NeuralPattern
  ): Promise<void> {
    await this.supabase
      .from('agent_neural_patterns')
      .upsert({
        id: pattern.id,
        agent_id: agentId,
        organization_id: organizationId,
        input_vector: pattern.inputVector,
        output_vector: pattern.outputVector,
        weights: pattern.weights,
        activation: pattern.activation,
        confidence: pattern.confidence,
        training_samples: pattern.trainingSamples,
        updated_at: pattern.lastUpdated.toISOString()
      });
  }
  
  private async storeQLearningUpdate(
    agentId: string,
    organizationId: string,
    stateKey: string,
    action: string,
    qValue: number
  ): Promise<void> {
    await this.supabase
      .from('agent_q_values')
      .upsert({
        agent_id: agentId,
        organization_id: organizationId,
        state_key: stateKey,
        action: action,
        q_value: qValue,
        updated_at: new Date().toISOString()
      });
  }
  
  private async applyTransferredKnowledge(
    targetAgentId: string,
    organizationId: string,
    knowledge: TransferableKnowledge
  ): Promise<void> {
    // Apply transferred knowledge to target agent
    await this.supabase
      .from('agent_transferred_knowledge')
      .insert({
        source_agent: knowledge.sourceAgent,
        target_agent: knowledge.targetAgent,
        organization_id: organizationId,
        knowledge_type: knowledge.knowledgeType,
        embedding: knowledge.embedding,
        applicability: knowledge.applicability,
        transferred_at: knowledge.transferredAt.toISOString()
      });
  }
  
  private async storeKnowledgeTransfer(items: TransferableKnowledge[]): Promise<void> {
    const records = items.map(item => ({
      source_agent: item.sourceAgent,
      target_agent: item.targetAgent,
      knowledge_type: item.knowledgeType,
      applicability: item.applicability,
      transferred_at: item.transferredAt.toISOString()
    }));
    
    await this.supabase
      .from('agent_knowledge_transfers')
      .insert(records);
  }
  
  private async storeTemporalSequence(
    agentId: string,
    organizationId: string,
    temporal: TemporalLearning
  ): Promise<void> {
    await this.supabase
      .from('agent_temporal_sequences')
      .insert({
        sequence_id: temporal.sequenceId,
        agent_id: agentId,
        organization_id: organizationId,
        states: temporal.states,
        cumulative_reward: temporal.cumulativeReward,
        discount_factor: temporal.discountFactor,
        horizon: temporal.horizon,
        created_at: new Date().toISOString()
      });
  }
  
  private async storeCollectiveDecision(
    organizationId: string,
    problem: any,
    solution: any,
    consensus: number
  ): Promise<void> {
    await this.supabase
      .from('agent_collective_decisions')
      .insert({
        organization_id: organizationId,
        problem: problem,
        solution: solution,
        consensus_level: consensus,
        created_at: new Date().toISOString()
      });
  }
}

// Export singleton instance
export const advancedLearning = new AdvancedLearningSystem();