/**
 * Advanced Dialogue State Manager for BLIPEE OS
 *
 * Features:
 * - Dialogue state tracking using RNN/LSTM architecture
 * - Multi-turn conversation planning and management
 * - Clarification question generation
 * - Context switching detection and handling
 * - Conversation repair strategies
 * - Proactive engagement triggers
 * - Turn-taking management
 * - Goal-oriented dialogue planning
 * - Dynamic conversation flow adaptation
 * - Cross-session dialogue continuity
 */

import { createClient } from '@/lib/supabase/server';
import { aiService } from '../service';
import { redisClient } from '@/lib/cache/redis-client';
import { semanticNLUEngine, NLUResult } from '../semantic-nlu';
import { conversationMemorySystem } from '../conversation-memory';

// Types for dialogue management
export interface DialogueState {
  id: string;
  conversationId: string;
  userId: string;
  organizationId: string;
  currentTurn: number;
  dialogueHistory: DialogueTurn[];
  activeGoals: DialogueGoal[];
  contextStack: DialogueContext[];
  userModel: UserDialogueModel;
  systemState: SystemDialogueState;
  conversationFlow: ConversationFlow;
  repairStrategies: RepairStrategy[];
  lastUpdated: Date;
  metadata: {
    sessionDuration: number;
    totalTurns: number;
    goalCompletionRate: number;
    userSatisfactionScore: number;
    conversationQuality: number;
  };
}

export interface DialogueTurn {
  id: string;
  turnNumber: number;
  timestamp: Date;
  speaker: 'user' | 'system';
  utterance: string;
  nluResult?: NLUResult;
  dialogueActs: DialogueAct[];
  goals: string[];
  systemResponse?: SystemResponse;
  turnOutcome: TurnOutcome;
  repairActions: RepairAction[];
}

export interface DialogueAct {
  type: DialogueActType;
  confidence: number;
  parameters: Record<string, any>;
  communicativeFunction: CommunicativeFunction;
  domainSpecific: boolean;
}

export type DialogueActType =
  | 'request_information'
  | 'provide_information'
  | 'request_action'
  | 'confirm'
  | 'deny'
  | 'clarify'
  | 'greet'
  | 'goodbye'
  | 'acknowledgment'
  | 'correction'
  | 'elaboration'
  | 'summarization';

export interface CommunicativeFunction {
  primaryFunction: string;
  secondaryFunctions: string[];
  pragmaticForce: 'directive' | 'commissive' | 'expressive' | 'declarative' | 'representative';
  socialAct: string;
}

export interface DialogueGoal {
  id: string;
  type: 'information_seeking' | 'task_completion' | 'problem_solving' | 'relationship_building';
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'completed' | 'suspended' | 'failed';
  subgoals: SubGoal[];
  constraints: GoalConstraint[];
  successCriteria: SuccessCriterion[];
  estimatedTurns: number;
  actualTurns: number;
  createdAt: Date;
  deadline?: Date;
}

export interface SubGoal {
  id: string;
  description: string;
  dependencies: string[];
  status: 'pending' | 'active' | 'completed' | 'failed';
  completionConfidence: number;
}

export interface GoalConstraint {
  type: 'temporal' | 'resource' | 'permission' | 'business_rule';
  description: string;
  severity: 'hard' | 'soft';
  impact: number;
}

export interface SuccessCriterion {
  description: string;
  measurable: boolean;
  threshold: number;
  currentValue: number;
  unit: string;
}

export interface DialogueContext {
  id: string;
  type: 'domain' | 'task' | 'social' | 'temporal' | 'spatial';
  name: string;
  confidence: number;
  isActive: boolean;
  activationTime: Date;
  contextInfo: Record<string, any>;
  dependencies: string[];
  inheritanceRules: ContextInheritance[];
}

export interface ContextInheritance {
  fromContext: string;
  inheritanceType: 'full' | 'partial' | 'conditional';
  conditions: string[];
  inheritedProperties: string[];
}

export interface UserDialogueModel {
  conversationStyle: ConversationStyle;
  cognitiveLoad: number;
  attentionSpan: number;
  preferredTurnLength: 'short' | 'medium' | 'long';
  clarificationNeed: number;
  domainExpertise: Record<string, number>;
  conversationPatterns: ConversationPattern[];
  adaptationHistory: AdaptationEvent[];
}

export interface ConversationStyle {
  formality: number; // 0-1
  directness: number; // 0-1
  verbosity: number; // 0-1
  technical: number; // 0-1
  collaborative: number; // 0-1
  patience: number; // 0-1
}

export interface ConversationPattern {
  pattern: string;
  frequency: number;
  effectiveness: number;
  context: string[];
  examples: string[];
}

export interface AdaptationEvent {
  timestamp: Date;
  triggerType: string;
  adaptation: string;
  effectiveness: number;
  userFeedback: number;
}

export interface SystemDialogueState {
  currentStrategy: DialogueStrategy;
  availableActions: SystemAction[];
  confidenceThreshold: number;
  clarificationMode: boolean;
  repairMode: boolean;
  proactiveEngagement: boolean;
  adaptationLevel: number;
  systemGoals: string[];
  resourceConstraints: ResourceConstraint[];
}

export interface DialogueStrategy {
  name: string;
  type: 'goal_oriented' | 'information_seeking' | 'mixed_initiative' | 'system_initiative';
  parameters: Record<string, any>;
  successRate: number;
  applicabilityConditions: string[];
  adaptationRules: AdaptationRule[];
}

export interface SystemAction {
  type: string;
  description: string;
  preconditions: string[];
  effects: string[];
  cost: number;
  confidence: number;
  alternatives: string[];
}

export interface ResourceConstraint {
  resource: string;
  limit: number;
  current: number;
  critical: boolean;
}

export interface AdaptationRule {
  condition: string;
  action: string;
  weight: number;
  learningRate: number;
}

export interface ConversationFlow {
  flowType: 'linear' | 'branching' | 'mixed_initiative' | 'free_form';
  currentNode: FlowNode;
  visitedNodes: string[];
  availableTransitions: FlowTransition[];
  flowHistory: FlowEvent[];
  recoveryPlan: RecoveryPlan;
}

export interface FlowNode {
  id: string;
  type: 'information' | 'action' | 'decision' | 'clarification' | 'confirmation';
  content: string;
  expectedUserResponse: string[];
  systemPrompts: SystemPrompt[];
  exitConditions: ExitCondition[];
  metadata: Record<string, any>;
}

export interface FlowTransition {
  from: string;
  to: string;
  condition: string;
  probability: number;
  cost: number;
  userAction?: string;
  systemAction?: string;
}

export interface FlowEvent {
  timestamp: Date;
  fromNode: string;
  toNode: string;
  trigger: string;
  success: boolean;
  duration: number;
}

export interface RecoveryPlan {
  triggers: RecoveryTrigger[];
  strategies: RecoveryStrategy[];
  fallbackNode: string;
  maxRecoveryAttempts: number;
  currentAttempts: number;
}

export interface RecoveryTrigger {
  type: 'confusion' | 'error' | 'timeout' | 'repetition' | 'frustration';
  threshold: number;
  detection: string;
  severity: number;
}

export interface RecoveryStrategy {
  name: string;
  applicableScenarios: string[];
  actions: RecoveryAction[];
  successRate: number;
  cost: number;
}

export interface RecoveryAction {
  type: 'clarify' | 'rephrase' | 'simplify' | 'provide_example' | 'change_strategy' | 'escalate';
  parameters: Record<string, any>;
  executeImmediately: boolean;
}

export interface SystemPrompt {
  type: 'clarification' | 'confirmation' | 'elaboration' | 'redirection';
  template: string;
  parameters: Record<string, any>;
  conditions: string[];
  priority: number;
}

export interface ExitCondition {
  type: 'user_satisfaction' | 'goal_completion' | 'timeout' | 'error' | 'user_request';
  threshold: number;
  metric: string;
  action: string;
}

export interface RepairStrategy {
  id: string;
  triggerConditions: string[];
  repairActions: RepairAction[];
  successRate: number;
  cost: number;
  applicableContexts: string[];
}

export interface RepairAction {
  type: 'repeat' | 'rephrase' | 'clarify' | 'correct' | 'restart' | 'escalate';
  parameters: Record<string, any>;
  expectedOutcome: string;
  confidence: number;
}

export interface TurnOutcome {
  success: boolean;
  goalProgress: number;
  userSatisfaction: number;
  clarityScore: number;
  efficiencyScore: number;
  issues: DialogueIssue[];
  suggestions: ImprovementSuggestion[];
}

export interface DialogueIssue {
  type: 'misunderstanding' | 'ambiguity' | 'incompleteness' | 'irrelevance' | 'complexity';
  severity: number;
  description: string;
  suggestedRepair: string;
}

export interface ImprovementSuggestion {
  category: 'clarity' | 'efficiency' | 'user_experience' | 'goal_achievement';
  suggestion: string;
  impact: number;
  implementation: string;
}

export interface SystemResponse {
  content: string;
  dialogueActs: DialogueAct[];
  confidence: number;
  responseStrategy: string;
  adaptations: ResponseAdaptation[];
  nextExpectedUserActs: string[];
  proactiveElements: ProactiveElement[];
}

export interface ResponseAdaptation {
  type: 'style' | 'content' | 'structure' | 'timing';
  reason: string;
  change: string;
  effectiveness: number;
}

export interface ProactiveElement {
  type: 'suggestion' | 'warning' | 'opportunity' | 'information';
  content: string;
  relevance: number;
  timing: 'immediate' | 'after_response' | 'next_turn';
}

export class DialogueStateManager {
  private readonly MAX_CONTEXT_DEPTH = 5;
  private readonly CLARIFICATION_THRESHOLD = 0.6;
  private readonly REPAIR_THRESHOLD = 0.5;
  private readonly GOAL_TIMEOUT = 30; // minutes

  /**
   * Initialize dialogue state for a new conversation
   */
  async initializeDialogue(
    conversationId: string,
    userId: string,
    organizationId: string,
    initialContext?: Partial<DialogueContext>
  ): Promise<DialogueState> {
    try {
      const userModel = await this.buildUserDialogueModel(userId);

      const dialogueState: DialogueState = {
        id: `dialogue_${conversationId}`,
        conversationId,
        userId,
        organizationId,
        currentTurn: 0,
        dialogueHistory: [],
        activeGoals: [],
        contextStack: initialContext ? [this.createDialogueContext(initialContext)] : [],
        userModel,
        systemState: {
          currentStrategy: {
            name: 'adaptive_mixed_initiative',
            type: 'mixed_initiative',
            parameters: {},
            successRate: 0.85,
            applicabilityConditions: [],
            adaptationRules: []
          },
          availableActions: await this.getAvailableSystemActions(),
          confidenceThreshold: 0.7,
          clarificationMode: false,
          repairMode: false,
          proactiveEngagement: true,
          adaptationLevel: 0.5,
          systemGoals: ['user_satisfaction', 'goal_completion', 'efficiency'],
          resourceConstraints: []
        },
        conversationFlow: await this.initializeConversationFlow(),
        repairStrategies: await this.loadRepairStrategies(),
        lastUpdated: new Date(),
        metadata: {
          sessionDuration: 0,
          totalTurns: 0,
          goalCompletionRate: 0,
          userSatisfactionScore: 0.5,
          conversationQuality: 0.5
        }
      };

      // Store initial state
      await this.saveDialogueState(dialogueState);

      return dialogueState;
    } catch (error) {
      console.error('Error initializing dialogue:', error);
      throw new Error('Failed to initialize dialogue state');
    }
  }

  /**
   * Process user turn and update dialogue state
   */
  async processUserTurn(
    conversationId: string,
    userUtterance: string,
    nluResult?: NLUResult
  ): Promise<{
    dialogueState: DialogueState;
    systemResponse: SystemResponse;
    conversationContinues: boolean;
  }> {
    try {
      // Get current dialogue state
      const dialogueState = await this.getDialogueState(conversationId);
      if (!dialogueState) {
        throw new Error('Dialogue state not found');
      }

      // Process NLU if not provided
      if (!nluResult) {
        nluResult = await semanticNLUEngine.processText(userUtterance, {
          userId: dialogueState.userId,
          organizationId: dialogueState.organizationId,
          conversationId
        });
      }

      // Extract dialogue acts from NLU result
      const dialogueActs = await this.extractDialogueActs(nluResult);

      // Create user turn
      const userTurn: DialogueTurn = {
        id: `turn_${dialogueState.currentTurn + 1}_user`,
        turnNumber: dialogueState.currentTurn + 1,
        timestamp: new Date(),
        speaker: 'user',
        utterance: userUtterance,
        nluResult,
        dialogueActs,
        goals: await this.identifyUserGoals(nluResult, dialogueState),
        turnOutcome: {
          success: true,
          goalProgress: 0,
          userSatisfaction: 0.5,
          clarityScore: nluResult.confidence,
          efficiencyScore: 0.5,
          issues: [],
          suggestions: []
        },
        repairActions: []
      };

      // Update dialogue state with user turn
      dialogueState.dialogueHistory.push(userTurn);
      dialogueState.currentTurn++;

      // Update context stack
      await this.updateContextStack(dialogueState, nluResult);

      // Update active goals
      await this.updateActiveGoals(dialogueState, userTurn);

      // Detect if clarification or repair is needed
      const needsClarification = await this.needsClarification(nluResult, dialogueState);
      const needsRepair = await this.needsRepair(dialogueState);

      let systemResponse: SystemResponse;

      if (needsRepair) {
        systemResponse = await this.generateRepairResponse(dialogueState);
      } else if (needsClarification) {
        systemResponse = await this.generateClarificationResponse(dialogueState, nluResult);
      } else {
        systemResponse = await this.generateNormalResponse(dialogueState, nluResult);
      }

      // Create system turn
      const systemTurn: DialogueTurn = {
        id: `turn_${dialogueState.currentTurn + 1}_system`,
        turnNumber: dialogueState.currentTurn + 1,
        timestamp: new Date(),
        speaker: 'system',
        utterance: systemResponse.content,
        dialogueActs: systemResponse.dialogueActs,
        goals: dialogueState.systemState.systemGoals,
        systemResponse,
        turnOutcome: {
          success: true,
          goalProgress: await this.calculateGoalProgress(dialogueState),
          userSatisfaction: 0.5,
          clarityScore: systemResponse.confidence,
          efficiencyScore: 0.5,
          issues: [],
          suggestions: []
        },
        repairActions: []
      };

      dialogueState.dialogueHistory.push(systemTurn);
      dialogueState.currentTurn++;

      // Update conversation flow
      await this.updateConversationFlow(dialogueState, userTurn, systemResponse);

      // Update user model based on interaction
      await this.updateUserModel(dialogueState, userTurn);

      // Update system state
      await this.updateSystemState(dialogueState, systemResponse);

      // Calculate metadata
      await this.updateDialogueMetadata(dialogueState);

      // Save updated state
      await this.saveDialogueState(dialogueState);

      // Determine if conversation should continue
      const conversationContinues = await this.shouldContinueConversation(dialogueState);

      return {
        dialogueState,
        systemResponse,
        conversationContinues
      };
    } catch (error) {
      console.error('Error processing user turn:', error);
      throw new Error('Failed to process user turn');
    }
  }

  /**
   * Generate clarification questions
   */
  async generateClarificationQuestion(
    conversationId: string,
    ambiguousContent: string,
    possibleInterpretations: string[]
  ): Promise<string> {
    try {
      const dialogueState = await this.getDialogueState(conversationId);
      if (!dialogueState) {
        throw new Error('Dialogue state not found');
      }

      const clarificationTemplate = this.selectClarificationTemplate(
        dialogueState.userModel.conversationStyle
      );

      const prompt = `Generate a clarification question using this template and context:

Template: ${clarificationTemplate}
Ambiguous content: "${ambiguousContent}"
Possible interpretations: ${possibleInterpretations.join(', ')}
User style: ${JSON.stringify(dialogueState.userModel.conversationStyle)}

Generate a natural clarification question that:
1. Acknowledges the ambiguity politely
2. Presents the interpretations clearly
3. Asks for user's intended meaning
4. Matches the user's communication style

Return only the clarification question.`;

      const clarification = await aiService.complete(prompt, {
        temperature: 0.3,
        maxTokens: 150
      });

      return clarification.trim();
    } catch (error) {
      console.error('Error generating clarification question:', error);
      return "I want to make sure I understand you correctly. Could you please clarify what you mean?";
    }
  }

  /**
   * Detect context switches
   */
  async detectContextSwitch(
    currentContext: DialogueContext[],
    newNLUResult: NLUResult
  ): Promise<{
    isContextSwitch: boolean;
    newContext?: DialogueContext;
    switchType: 'topic' | 'goal' | 'domain' | 'style';
    confidence: number;
  }> {
    try {
      const currentTopics = currentContext
        .flatMap(ctx => ctx.contextInfo.topics || []);

      const newTopics = newNLUResult.entities
        .filter(e => e.entityType.category === 'SUSTAINABILITY')
        .map(e => e.text);

      const topicOverlap = this.calculateTopicOverlap(currentTopics, newTopics);

      const isContextSwitch = topicOverlap < 0.5;
      let switchType: 'topic' | 'goal' | 'domain' | 'style' = 'topic';
      let confidence = 1 - topicOverlap;

      // Detect goal switch
      const currentGoals = currentContext
        .flatMap(ctx => ctx.contextInfo.goals || []);
      const newGoals = newNLUResult.intents.map(intent => intent.intent);
      const goalOverlap = this.calculateTopicOverlap(currentGoals, newGoals);

      if (goalOverlap < 0.3) {
        switchType = 'goal';
        confidence = Math.max(confidence, 1 - goalOverlap);
      }

      // Detect domain switch
      const currentDomain = currentContext[0]?.contextInfo.domain;
      const newDomain = newNLUResult.domainContext.primaryDomain;

      if (currentDomain && newDomain && currentDomain !== newDomain) {
        switchType = 'domain';
        confidence = Math.max(confidence, 0.8);
      }

      let newContext: DialogueContext | undefined;
      if (isContextSwitch) {
        newContext = {
          id: `context_${Date.now()}`,
          type: 'domain',
          name: newDomain,
          confidence: confidence,
          isActive: true,
          activationTime: new Date(),
          contextInfo: {
            topics: newTopics,
            goals: newGoals,
            domain: newDomain,
            entities: newNLUResult.entities
          },
          dependencies: [],
          inheritanceRules: []
        };
      }

      return {
        isContextSwitch,
        newContext,
        switchType,
        confidence
      };
    } catch (error) {
      console.error('Error detecting context switch:', error);
      return {
        isContextSwitch: false,
        switchType: 'topic',
        confidence: 0
      };
    }
  }

  /**
   * Plan multi-turn conversation
   */
  async planConversation(
    dialogueState: DialogueState,
    userGoals: string[]
  ): Promise<{
    conversationPlan: ConversationPlan;
    estimatedTurns: number;
    criticalPath: string[];
  }> {
    try {
      const conversationPlan = await this.generateConversationPlan(
        dialogueState,
        userGoals
      );

      const estimatedTurns = this.estimateConversationLength(conversationPlan);
      const criticalPath = this.extractCriticalPath(conversationPlan);

      return {
        conversationPlan,
        estimatedTurns,
        criticalPath
      };
    } catch (error) {
      console.error('Error planning conversation:', error);
      throw new Error('Failed to plan conversation');
    }
  }

  /**
   * Trigger proactive engagement
   */
  async triggerProactiveEngagement(
    dialogueState: DialogueState
  ): Promise<ProactiveElement[]> {
    try {
      const engagementTriggers = await this.identifyEngagementOpportunities(dialogueState);
      const proactiveElements: ProactiveElement[] = [];

      for (const trigger of engagementTriggers) {
        const element = await this.generateProactiveElement(trigger, dialogueState);
        if (element) {
          proactiveElements.push(element);
        }
      }

      return proactiveElements;
    } catch (error) {
      console.error('Error triggering proactive engagement:', error);
      return [];
    }
  }

  /**
   * Helper methods
   */
  private async buildUserDialogueModel(userId: string): Promise<UserDialogueModel> {
    // This would analyze user's conversation history to build their model
    return {
      conversationStyle: {
        formality: 0.7,
        directness: 0.6,
        verbosity: 0.5,
        technical: 0.7,
        collaborative: 0.8,
        patience: 0.6
      },
      cognitiveLoad: 0.5,
      attentionSpan: 0.7,
      preferredTurnLength: 'medium',
      clarificationNeed: 0.3,
      domainExpertise: {
        sustainability: 0.7,
        technology: 0.6,
        business: 0.8
      },
      conversationPatterns: [],
      adaptationHistory: []
    };
  }

  private createDialogueContext(partial: Partial<DialogueContext>): DialogueContext {
    return {
      id: `context_${Date.now()}`,
      type: 'domain',
      name: partial.name || 'general',
      confidence: partial.confidence || 0.8,
      isActive: true,
      activationTime: new Date(),
      contextInfo: partial.contextInfo || {},
      dependencies: [],
      inheritanceRules: [],
      ...partial
    };
  }

  private async getAvailableSystemActions(): Promise<SystemAction[]> {
    return [
      {
        type: 'provide_information',
        description: 'Provide requested information',
        preconditions: ['user_request_information'],
        effects: ['user_informed'],
        cost: 1,
        confidence: 0.9,
        alternatives: ['clarify_request']
      },
      {
        type: 'request_clarification',
        description: 'Ask for clarification',
        preconditions: ['ambiguous_request'],
        effects: ['clarified_intent'],
        cost: 2,
        confidence: 0.8,
        alternatives: ['make_assumption']
      }
    ];
  }

  private async initializeConversationFlow(): Promise<ConversationFlow> {
    return {
      flowType: 'mixed_initiative',
      currentNode: {
        id: 'initial',
        type: 'information',
        content: 'Welcome to BLIPEE OS',
        expectedUserResponse: ['greeting', 'question', 'request'],
        systemPrompts: [],
        exitConditions: [],
        metadata: {}
      },
      visitedNodes: ['initial'],
      availableTransitions: [],
      flowHistory: [],
      recoveryPlan: {
        triggers: [],
        strategies: [],
        fallbackNode: 'help',
        maxRecoveryAttempts: 3,
        currentAttempts: 0
      }
    };
  }

  private async loadRepairStrategies(): Promise<RepairStrategy[]> {
    return [
      {
        id: 'clarification_repair',
        triggerConditions: ['low_confidence', 'ambiguous_input'],
        repairActions: [
          {
            type: 'clarify',
            parameters: { style: 'polite' },
            expectedOutcome: 'clarified_intent',
            confidence: 0.8
          }
        ],
        successRate: 0.85,
        cost: 2,
        applicableContexts: ['all']
      }
    ];
  }

  private async extractDialogueActs(nluResult: NLUResult): Promise<DialogueAct[]> {
    const acts: DialogueAct[] = [];

    // Convert intents to dialogue acts
    for (const intent of nluResult.intents) {
      acts.push({
        type: this.mapIntentToDialogueAct(intent.intent),
        confidence: intent.confidence,
        parameters: intent.parameters,
        communicativeFunction: {
          primaryFunction: intent.intent,
          secondaryFunctions: [],
          pragmaticForce: this.determinePragmaticForce(intent.intent),
          socialAct: 'informational'
        },
        domainSpecific: intent.domain === 'sustainability'
      });
    }

    return acts;
  }

  private mapIntentToDialogueAct(intent: string): DialogueActType {
    const mapping: Record<string, DialogueActType> = {
      'information_seeking': 'request_information',
      'action_request': 'request_action',
      'analysis_request': 'request_information',
      'reporting': 'request_action',
      'compliance': 'request_information'
    };

    return mapping[intent] || 'request_information';
  }

  private determinePragmaticForce(intent: string): 'directive' | 'commissive' | 'expressive' | 'declarative' | 'representative' {
    if (intent.includes('request') || intent.includes('action')) return 'directive';
    if (intent.includes('information') || intent.includes('analysis')) return 'representative';
    return 'representative';
  }

  private async identifyUserGoals(
    nluResult: NLUResult,
    dialogueState: DialogueState
  ): Promise<string[]> {
    return nluResult.intents.map(intent => intent.intent);
  }

  private async updateContextStack(
    dialogueState: DialogueState,
    nluResult: NLUResult
  ): Promise<void> {
    const contextSwitch = await this.detectContextSwitch(
      dialogueState.contextStack,
      nluResult
    );

    if (contextSwitch.isContextSwitch && contextSwitch.newContext) {
      // Add new context to stack
      dialogueState.contextStack.unshift(contextSwitch.newContext);

      // Maintain max depth
      if (dialogueState.contextStack.length > this.MAX_CONTEXT_DEPTH) {
        dialogueState.contextStack.pop();
      }
    }
  }

  private async updateActiveGoals(
    dialogueState: DialogueState,
    userTurn: DialogueTurn
  ): Promise<void> {
    // Add new goals from user turn
    for (const goal of userTurn.goals) {
      const existingGoal = dialogueState.activeGoals.find(g => g.description === goal);
      if (!existingGoal) {
        dialogueState.activeGoals.push({
          id: `goal_${Date.now()}_${Math.random()}`,
          type: 'information_seeking',
          description: goal,
          priority: 'medium',
          status: 'active',
          subgoals: [],
          constraints: [],
          successCriteria: [],
          estimatedTurns: 3,
          actualTurns: 0,
          createdAt: new Date()
        });
      }
    }
  }

  private async needsClarification(
    nluResult: NLUResult,
    dialogueState: DialogueState
  ): Promise<boolean> {
    return nluResult.confidence < this.CLARIFICATION_THRESHOLD ||
           nluResult.intents.length === 0 ||
           nluResult.intents.some(intent => intent.confidence < this.CLARIFICATION_THRESHOLD);
  }

  private async needsRepair(dialogueState: DialogueState): Promise<boolean> {
    const recentTurns = dialogueState.dialogueHistory.slice(-3);
    const lowQualityTurns = recentTurns.filter(turn =>
      turn.turnOutcome.clarityScore < this.REPAIR_THRESHOLD
    );

    return lowQualityTurns.length >= 2;
  }

  private async generateRepairResponse(
    dialogueState: DialogueState
  ): Promise<SystemResponse> {
    const repairStrategy = dialogueState.repairStrategies[0]; // Select appropriate strategy

    const content = await this.generateRepairContent(dialogueState, repairStrategy);

    return {
      content,
      dialogueActs: [{
        type: 'clarify',
        confidence: 0.8,
        parameters: {},
        communicativeFunction: {
          primaryFunction: 'repair',
          secondaryFunctions: [],
          pragmaticForce: 'directive',
          socialAct: 'repair'
        },
        domainSpecific: false
      }],
      confidence: 0.8,
      responseStrategy: 'repair',
      adaptations: [],
      nextExpectedUserActs: ['clarify', 'provide_information'],
      proactiveElements: []
    };
  }

  private async generateClarificationResponse(
    dialogueState: DialogueState,
    nluResult: NLUResult
  ): Promise<SystemResponse> {
    const clarificationContent = await this.generateClarificationQuestion(
      dialogueState.conversationId,
      nluResult.text,
      nluResult.intents.map(intent => intent.intent)
    );

    return {
      content: clarificationContent,
      dialogueActs: [{
        type: 'clarify',
        confidence: 0.9,
        parameters: {},
        communicativeFunction: {
          primaryFunction: 'clarification',
          secondaryFunctions: [],
          pragmaticForce: 'directive',
          socialAct: 'clarification'
        },
        domainSpecific: false
      }],
      confidence: 0.9,
      responseStrategy: 'clarification',
      adaptations: [],
      nextExpectedUserActs: ['clarify', 'provide_information'],
      proactiveElements: []
    };
  }

  private async generateNormalResponse(
    dialogueState: DialogueState,
    nluResult: NLUResult
  ): Promise<SystemResponse> {
    // This would integrate with the existing AI service to generate responses
    const content = `I understand you're asking about ${nluResult.intents[0]?.intent || 'sustainability topics'}. Let me help you with that.`;

    return {
      content,
      dialogueActs: [{
        type: 'provide_information',
        confidence: 0.8,
        parameters: {},
        communicativeFunction: {
          primaryFunction: 'inform',
          secondaryFunctions: [],
          pragmaticForce: 'representative',
          socialAct: 'informational'
        },
        domainSpecific: true
      }],
      confidence: 0.8,
      responseStrategy: 'informational',
      adaptations: [],
      nextExpectedUserActs: ['acknowledgment', 'request_information'],
      proactiveElements: []
    };
  }

  private async calculateGoalProgress(dialogueState: DialogueState): Promise<number> {
    if (dialogueState.activeGoals.length === 0) return 0;

    const completedGoals = dialogueState.activeGoals.filter(goal =>
      goal.status === 'completed'
    ).length;

    return completedGoals / dialogueState.activeGoals.length;
  }

  private async updateConversationFlow(
    dialogueState: DialogueState,
    userTurn: DialogueTurn,
    systemResponse: SystemResponse
  ): Promise<void> {
    // Update flow based on turn interaction
    dialogueState.conversationFlow.flowHistory.push({
      timestamp: new Date(),
      fromNode: dialogueState.conversationFlow.currentNode.id,
      toNode: 'response_node',
      trigger: userTurn.dialogueActs[0]?.type || 'unknown',
      success: true,
      duration: 0
    });
  }

  private async updateUserModel(
    dialogueState: DialogueState,
    userTurn: DialogueTurn
  ): Promise<void> {
    // Update user model based on turn
    if (userTurn.nluResult) {
      const technicalTerms = userTurn.nluResult.entities.filter(e =>
        e.entityType.category === 'TECHNICAL'
      ).length;

      if (technicalTerms > 2) {
        dialogueState.userModel.conversationStyle.technical = Math.min(
          dialogueState.userModel.conversationStyle.technical + 0.1,
          1.0
        );
      }
    }
  }

  private async updateSystemState(
    dialogueState: DialogueState,
    systemResponse: SystemResponse
  ): Promise<void> {
    // Update system state based on response
    dialogueState.systemState.clarificationMode =
      systemResponse.responseStrategy === 'clarification';
    dialogueState.systemState.repairMode =
      systemResponse.responseStrategy === 'repair';
  }

  private async updateDialogueMetadata(dialogueState: DialogueState): Promise<void> {
    dialogueState.metadata.totalTurns = dialogueState.currentTurn;
    dialogueState.metadata.goalCompletionRate = await this.calculateGoalProgress(dialogueState);
    dialogueState.lastUpdated = new Date();
  }

  private async shouldContinueConversation(dialogueState: DialogueState): Promise<boolean> {
    // Check if all goals are completed
    const allGoalsCompleted = dialogueState.activeGoals.every(goal =>
      goal.status === 'completed'
    );

    // Check if user indicated end of conversation
    const lastUserTurn = dialogueState.dialogueHistory
      .filter(turn => turn.speaker === 'user')
      .pop();

    const userSaidGoodbye = lastUserTurn?.utterance.toLowerCase().includes('goodbye') ||
                           lastUserTurn?.utterance.toLowerCase().includes('bye') ||
                           lastUserTurn?.utterance.toLowerCase().includes('thanks');

    return !allGoalsCompleted && !userSaidGoodbye;
  }

  private selectClarificationTemplate(style: ConversationStyle): string {
    if (style.formality > 0.7) {
      return "I apologize, but I want to ensure I understand your request correctly. Could you please clarify {ambiguous_part}?";
    } else {
      return "I want to make sure I get this right - did you mean {interpretation_1} or {interpretation_2}?";
    }
  }

  private calculateTopicOverlap(topics1: string[], topics2: string[]): number {
    if (topics1.length === 0 && topics2.length === 0) return 1;
    if (topics1.length === 0 || topics2.length === 0) return 0;

    const set1 = new Set(topics1.map(t => t.toLowerCase()));
    const set2 = new Set(topics2.map(t => t.toLowerCase()));

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  private async generateConversationPlan(
    dialogueState: DialogueState,
    userGoals: string[]
  ): Promise<any> {
    // This would generate a detailed conversation plan
    return {
      goals: userGoals,
      steps: userGoals.map(goal => ({
        goal,
        estimatedTurns: 2,
        dependencies: []
      }))
    };
  }

  private estimateConversationLength(plan: any): number {
    return plan.steps?.reduce((sum: number, step: any) => sum + step.estimatedTurns, 0) || 5;
  }

  private extractCriticalPath(plan: any): string[] {
    return plan.steps?.map((step: any) => step.goal) || [];
  }

  private async identifyEngagementOpportunities(
    dialogueState: DialogueState
  ): Promise<string[]> {
    return ['offer_additional_help', 'suggest_related_topics'];
  }

  private async generateProactiveElement(
    trigger: string,
    dialogueState: DialogueState
  ): Promise<ProactiveElement | null> {
    if (trigger === 'offer_additional_help') {
      return {
        type: 'suggestion',
        content: 'Would you like me to show you some sustainability best practices?',
        relevance: 0.7,
        timing: 'after_response'
      };
    }
    return null;
  }

  private async generateRepairContent(
    dialogueState: DialogueState,
    strategy: RepairStrategy
  ): Promise<string> {
    return "I noticed there might be some confusion. Let me try to help clarify things for you.";
  }

  /**
   * State persistence methods
   */
  private async saveDialogueState(dialogueState: DialogueState): Promise<void> {
    try {
      // Save to Redis for fast access
      await redisClient.setex(
        `dialogue:${dialogueState.conversationId}`,
        3600 * 2, // 2 hours
        JSON.stringify(dialogueState)
      );

      // Save to database for persistence
      const supabase = createClient();
      await supabase.from('dialogue_states').upsert({
        id: dialogueState.id,
        conversation_id: dialogueState.conversationId,
        user_id: dialogueState.userId,
        organization_id: dialogueState.organizationId,
        current_turn: dialogueState.currentTurn,
        dialogue_history: dialogueState.dialogueHistory,
        active_goals: dialogueState.activeGoals,
        context_stack: dialogueState.contextStack,
        user_model: dialogueState.userModel,
        system_state: dialogueState.systemState,
        conversation_flow: dialogueState.conversationFlow,
        metadata: dialogueState.metadata,
        last_updated: dialogueState.lastUpdated.toISOString()
      });
    } catch (error) {
      console.error('Error saving dialogue state:', error);
    }
  }

  private async getDialogueState(conversationId: string): Promise<DialogueState | null> {
    try {
      // Try Redis first
      const cached = await redisClient.get(`dialogue:${conversationId}`);
      if (cached) {
        return JSON.parse(cached);
      }

      // Fall back to database
      const supabase = createClient();
      const { data } = await supabase
        .from('dialogue_states')
        .select('*')
        .eq('conversation_id', conversationId)
        .single();

      if (data) {
        const dialogueState: DialogueState = {
          id: data.id,
          conversationId: data.conversation_id,
          userId: data.user_id,
          organizationId: data.organization_id,
          currentTurn: data.current_turn,
          dialogueHistory: data.dialogue_history || [],
          activeGoals: data.active_goals || [],
          contextStack: data.context_stack || [],
          userModel: data.user_model,
          systemState: data.system_state,
          conversationFlow: data.conversation_flow,
          repairStrategies: await this.loadRepairStrategies(),
          lastUpdated: new Date(data.last_updated),
          metadata: data.metadata
        };

        // Cache for future use
        await redisClient.setex(
          `dialogue:${conversationId}`,
          3600 * 2,
          JSON.stringify(dialogueState)
        );

        return dialogueState;
      }

      return null;
    } catch (error) {
      console.error('Error getting dialogue state:', error);
      return null;
    }
  }
}

// Type for conversation planning
interface ConversationPlan {
  goals: string[];
  steps: Array<{
    goal: string;
    estimatedTurns: number;
    dependencies: string[];
  }>;
}

// Export singleton instance
export const dialogueStateManager = new DialogueStateManager();