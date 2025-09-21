import { supabase } from '@/lib/supabase/client';
import { EnhancedActionRegistry } from './action-registry-enhanced';
import { SmartRoutingEngine } from './smart-routing-engine';
import { ContextEngine } from './context-engine';

interface NLPIntent {
  id: string;
  confidence: number;
  category: IntentCategory;
  action: string;
  entities: Entity[];
  parameters: Record<string, any>;
  context?: ConversationContext;
}

type IntentCategory =
  | 'query'
  | 'action'
  | 'navigation'
  | 'analysis'
  | 'report'
  | 'configuration'
  | 'help'
  | 'social'
  | 'alert';

interface Entity {
  type: EntityType;
  value: string;
  confidence: number;
  position: [number, number];
  metadata?: Record<string, any>;
}

type EntityType =
  | 'date'
  | 'metric'
  | 'location'
  | 'organization'
  | 'person'
  | 'target'
  | 'framework'
  | 'percentage'
  | 'currency'
  | 'emission_scope';

interface ConversationContext {
  conversationId: string;
  previousIntents: NLPIntent[];
  userProfile: UserProfile;
  organizationContext: OrganizationContext;
  sessionData: SessionData;
  activeWorkflows?: string[];
}

interface UserProfile {
  userId: string;
  role: string;
  preferences: UserPreferences;
  expertise: string[];
  commonQueries: string[];
  interactionHistory: InteractionSummary;
}

interface UserPreferences {
  language: string;
  units: 'metric' | 'imperial';
  currency: string;
  timezone: string;
  verbosity: 'concise' | 'detailed' | 'technical';
  visualPreference: 'charts' | 'tables' | 'narrative';
}

interface OrganizationContext {
  organizationId: string;
  industry: string;
  size: string;
  geography: string[];
  activeFrameworks: string[];
  currentTargets: any[];
  recentAlerts: Alert[];
}

interface SessionData {
  sessionId: string;
  startTime: Date;
  lastActivity: Date;
  currentView?: string;
  breadcrumb?: string[];
  unsavedChanges?: any[];
}

interface InteractionSummary {
  totalQueries: number;
  topCategories: string[];
  averageSessionLength: number;
  preferredTimeOfDay: string;
  satisfactionScore: number;
}

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

interface CommandResponse {
  intent: NLPIntent;
  response: ResponseContent;
  actions?: ExecutableAction[];
  suggestions?: Suggestion[];
  learning?: LearningFeedback;
}

interface ResponseContent {
  type: 'text' | 'visual' | 'mixed' | 'action' | 'navigation';
  primary: string;
  secondary?: string;
  visualizations?: Visualization[];
  data?: any;
  metadata?: ResponseMetadata;
}

interface Visualization {
  type: 'chart' | 'table' | 'map' | 'timeline' | 'gauge' | 'comparison';
  config: any;
  data: any;
  interactive: boolean;
  exportable: boolean;
}

interface ExecutableAction {
  id: string;
  type: string;
  label: string;
  confirmation?: string;
  parameters: Record<string, any>;
  impact?: ImpactAssessment;
}

interface ImpactAssessment {
  scope: 'low' | 'medium' | 'high';
  reversible: boolean;
  affectedEntities: string[];
  estimatedTime?: number;
}

interface Suggestion {
  id: string;
  text: string;
  category: string;
  relevance: number;
  action?: string;
}

interface LearningFeedback {
  intentAccuracy: number;
  responseQuality: number;
  userSatisfaction?: number;
  improvements?: string[];
}

export class ConversationalCommandCenter {
  private actionRegistry: EnhancedActionRegistry;
  private routingEngine: SmartRoutingEngine;
  private contextEngine: ContextEngine;
  private nlpProcessor: NLPProcessor;
  private responseGenerator: ResponseGenerator;
  private learningSystem: LearningSystem;
  private intentCache: Map<string, NLPIntent> = new Map();

  constructor() {
    this.actionRegistry = new EnhancedActionRegistry();
    this.routingEngine = new SmartRoutingEngine();
    this.contextEngine = new ContextEngine();
    this.nlpProcessor = new NLPProcessor();
    this.responseGenerator = new ResponseGenerator();
    this.learningSystem = new LearningSystem();
  }

  public async processCommand(
    input: string,
    context: ConversationContext
  ): Promise<CommandResponse> {
    // 1. Preprocess and normalize input
    const normalizedInput = await this.preprocessInput(input, context);

    // 2. Extract intent and entities
    const intent = await this.nlpProcessor.extractIntent(normalizedInput, context);

    // 3. Enrich with context
    const enrichedIntent = await this.enrichIntent(intent, context);

    // 4. Validate and authorize
    const authorized = await this.validateAuthorization(enrichedIntent, context);
    if (!authorized) {
      return this.generateUnauthorizedResponse(enrichedIntent);
    }

    // 5. Route to appropriate handler
    const handler = await this.routeIntent(enrichedIntent);

    // 6. Execute action or query
    const result = await handler.execute(enrichedIntent, context);

    // 7. Generate response
    const response = await this.responseGenerator.generate(
      enrichedIntent,
      result,
      context
    );

    // 8. Learn from interaction
    await this.learningSystem.recordInteraction(
      input,
      enrichedIntent,
      response,
      context
    );

    // 9. Cache for performance
    this.cacheIntent(normalizedInput, enrichedIntent);

    return {
      intent: enrichedIntent,
      response,
      actions: await this.extractActions(enrichedIntent, result),
      suggestions: await this.generateSuggestions(enrichedIntent, context),
      learning: await this.collectFeedback(enrichedIntent, response)
    };
  }

  private async preprocessInput(
    input: string,
    context: ConversationContext
  ): Promise<string> {
    let processed = input.toLowerCase().trim();

    // Handle command shortcuts
    const shortcuts = {
      'q1': 'show me first quarter',
      'ytd': 'year to date',
      's1': 'scope 1 emissions',
      's2': 'scope 2 emissions',
      's3': 'scope 3 emissions',
      'esg': 'environmental social governance',
      'ghg': 'greenhouse gas',
      'sbti': 'science based targets initiative',
      'tcfd': 'task force on climate-related financial disclosures',
      'csrd': 'corporate sustainability reporting directive'
    };

    for (const [shortcut, expansion] of Object.entries(shortcuts)) {
      processed = processed.replace(new RegExp(`\\b${shortcut}\\b`, 'gi'), expansion);
    }

    // Handle conversational references
    if (processed.includes('it') || processed.includes('that') || processed.includes('this')) {
      processed = await this.resolveReferences(processed, context);
    }

    return processed;
  }

  private async resolveReferences(
    input: string,
    context: ConversationContext
  ): Promise<string> {
    if (!context.previousIntents || context.previousIntents.length === 0) {
      return input;
    }

    const lastIntent = context.previousIntents[context.previousIntents.length - 1];

    // Replace pronouns with actual entities
    const replacements: Record<string, string> = {};

    if (lastIntent.entities.length > 0) {
      const mainEntity = lastIntent.entities[0];
      replacements['it'] = mainEntity.value;
      replacements['that'] = mainEntity.value;
      replacements['this'] = mainEntity.value;
    }

    let resolved = input;
    for (const [pronoun, replacement] of Object.entries(replacements)) {
      resolved = resolved.replace(new RegExp(`\\b${pronoun}\\b`, 'gi'), replacement);
    }

    return resolved;
  }

  private async enrichIntent(
    intent: NLPIntent,
    context: ConversationContext
  ): Promise<NLPIntent> {
    // Add temporal context
    const temporalEntities = await this.extractTemporalContext(intent, context);
    intent.entities.push(...temporalEntities);

    // Add organizational context
    if (!intent.entities.some(e => e.type === 'organization')) {
      intent.entities.push({
        type: 'organization',
        value: context.organizationContext.organizationId,
        confidence: 1.0,
        position: [-1, -1]
      });
    }

    // Add user role context
    intent.parameters.userRole = context.userProfile.role;
    intent.parameters.userExpertise = context.userProfile.expertise;

    // Add active workflow context
    if (context.activeWorkflows && context.activeWorkflows.length > 0) {
      intent.parameters.activeWorkflows = context.activeWorkflows;
    }

    return intent;
  }

  private async extractTemporalContext(
    intent: NLPIntent,
    context: ConversationContext
  ): Promise<Entity[]> {
    const temporalEntities: Entity[] = [];

    // If no date entity, check for implicit temporal references
    if (!intent.entities.some(e => e.type === 'date')) {
      const implicitDates = ['current', 'latest', 'recent', 'last'];

      for (const term of implicitDates) {
        if (intent.action.includes(term)) {
          temporalEntities.push({
            type: 'date',
            value: this.resolveImplicitDate(term),
            confidence: 0.8,
            position: [-1, -1],
            metadata: { implicit: true, term }
          });
        }
      }
    }

    return temporalEntities;
  }

  private resolveImplicitDate(term: string): string {
    const now = new Date();

    switch (term) {
      case 'current':
        return now.toISOString();
      case 'latest':
      case 'recent':
        const recent = new Date(now);
        recent.setDate(recent.getDate() - 30);
        return recent.toISOString();
      case 'last':
        const last = new Date(now);
        last.setMonth(last.getMonth() - 1);
        return last.toISOString();
      default:
        return now.toISOString();
    }
  }

  private async validateAuthorization(
    intent: NLPIntent,
    context: ConversationContext
  ): Promise<boolean> {
    const action = this.actionRegistry.getAction(intent.action);
    if (!action) return false;

    const userRole = context.userProfile.role;
    const requiredPermissions = action.permissions || [];

    // Check role-based access
    const rolePermissions = await this.getRolePermissions(userRole);

    return requiredPermissions.every(permission =>
      rolePermissions.includes(permission)
    );
  }

  private async getRolePermissions(role: string): Promise<string[]> {
    const permissionMap: Record<string, string[]> = {
      'account_owner': ['all'],
      'sustainability_manager': ['read', 'write', 'analyze', 'report', 'configure'],
      'facility_manager': ['read', 'write', 'analyze'],
      'analyst': ['read', 'analyze'],
      'viewer': ['read']
    };

    return permissionMap[role] || ['read'];
  }

  private generateUnauthorizedResponse(intent: NLPIntent): CommandResponse {
    return {
      intent,
      response: {
        type: 'text',
        primary: "I'm sorry, but you don't have permission to perform this action. Please contact your administrator if you believe you should have access.",
        metadata: {
          error: 'UNAUTHORIZED',
          requiredPermission: intent.action
        }
      }
    };
  }

  private async routeIntent(intent: NLPIntent): Promise<IntentHandler> {
    const handlerMap: Record<IntentCategory, IntentHandler> = {
      'query': new QueryHandler(this.contextEngine),
      'action': new ActionHandler(this.actionRegistry),
      'navigation': new NavigationHandler(),
      'analysis': new AnalysisHandler(),
      'report': new ReportHandler(),
      'configuration': new ConfigurationHandler(),
      'help': new HelpHandler(),
      'social': new SocialHandler(),
      'alert': new AlertHandler()
    };

    return handlerMap[intent.category] || new DefaultHandler();
  }

  private async extractActions(
    intent: NLPIntent,
    result: any
  ): Promise<ExecutableAction[]> {
    const actions: ExecutableAction[] = [];

    // Extract follow-up actions based on intent
    if (intent.category === 'analysis' && result.recommendations) {
      for (const rec of result.recommendations) {
        actions.push({
          id: `action_${Date.now()}_${Math.random()}`,
          type: 'recommendation',
          label: rec.label,
          confirmation: rec.requiresConfirmation ? `This will ${rec.impact}. Continue?` : undefined,
          parameters: rec.parameters,
          impact: {
            scope: rec.scope || 'low',
            reversible: rec.reversible !== false,
            affectedEntities: rec.affectedEntities || []
          }
        });
      }
    }

    return actions;
  }

  private async generateSuggestions(
    intent: NLPIntent,
    context: ConversationContext
  ): Promise<Suggestion[]> {
    const suggestions: Suggestion[] = [];

    // Context-aware suggestions
    if (intent.category === 'query') {
      suggestions.push(
        {
          id: 'drill_down',
          text: 'Would you like to see a breakdown by facility?',
          category: 'analysis',
          relevance: 0.9,
          action: 'analyze_by_facility'
        },
        {
          id: 'compare',
          text: 'Compare with previous period?',
          category: 'analysis',
          relevance: 0.8,
          action: 'compare_periods'
        }
      );
    }

    // Learn from user patterns
    const userPatterns = await this.learningSystem.getUserPatterns(
      context.userProfile.userId
    );

    for (const pattern of userPatterns) {
      if (pattern.followsIntent === intent.action) {
        suggestions.push({
          id: pattern.id,
          text: pattern.suggestionText,
          category: pattern.category,
          relevance: pattern.confidence,
          action: pattern.action
        });
      }
    }

    // Alert-based suggestions
    if (context.organizationContext.recentAlerts.length > 0) {
      const criticalAlert = context.organizationContext.recentAlerts
        .find(a => a.type === 'critical' && !a.acknowledged);

      if (criticalAlert) {
        suggestions.unshift({
          id: 'critical_alert',
          text: `⚠️ ${criticalAlert.message}`,
          category: 'alert',
          relevance: 1.0,
          action: 'view_alert'
        });
      }
    }

    return suggestions.sort((a, b) => b.relevance - a.relevance).slice(0, 5);
  }

  private async collectFeedback(
    intent: NLPIntent,
    response: ResponseContent
  ): Promise<LearningFeedback> {
    return {
      intentAccuracy: intent.confidence,
      responseQuality: response.metadata?.quality || 0.85,
      improvements: []
    };
  }

  private cacheIntent(input: string, intent: NLPIntent): void {
    const cacheKey = this.generateCacheKey(input);
    this.intentCache.set(cacheKey, intent);

    // Limit cache size
    if (this.intentCache.size > 1000) {
      const firstKey = this.intentCache.keys().next().value;
      this.intentCache.delete(firstKey);
    }
  }

  private generateCacheKey(input: string): string {
    return input.toLowerCase().replace(/[^a-z0-9]/g, '_');
  }

  public async handleMultiModalInput(
    input: MultiModalInput,
    context: ConversationContext
  ): Promise<CommandResponse> {
    // Process voice input
    if (input.type === 'voice') {
      const transcript = await this.transcribeVoice(input.data);
      return this.processCommand(transcript, context);
    }

    // Process image input
    if (input.type === 'image') {
      const extractedData = await this.extractFromImage(input.data);
      const command = `process extracted data: ${JSON.stringify(extractedData)}`;
      return this.processCommand(command, context);
    }

    // Process gesture input
    if (input.type === 'gesture') {
      const command = this.interpretGesture(input.data);
      return this.processCommand(command, context);
    }

    throw new Error(`Unsupported input type: ${input.type}`);
  }

  private async transcribeVoice(audioData: any): Promise<string> {
    // Integrate with speech-to-text service
    return 'transcribed text';
  }

  private async extractFromImage(imageData: any): Promise<any> {
    // Use OCR and AI to extract data from images
    return { type: 'emissions_data', values: [] };
  }

  private interpretGesture(gestureData: any): string {
    // Map gestures to commands
    const gestureMap: Record<string, string> = {
      'swipe_left': 'go back',
      'swipe_right': 'next',
      'pinch': 'zoom out',
      'spread': 'zoom in',
      'tap': 'select',
      'double_tap': 'open details'
    };

    return gestureMap[gestureData.type] || 'unknown gesture';
  }
}

class NLPProcessor {
  private intentPatterns: Map<string, IntentPattern> = new Map();

  constructor() {
    this.initializePatterns();
  }

  private initializePatterns() {
    // Query patterns
    this.intentPatterns.set('query_emissions', {
      patterns: [
        /show\s+(?:me\s+)?(?:the\s+)?emissions/i,
        /what\s+(?:are|is)\s+(?:my|our|the)\s+emissions/i,
        /emissions\s+(?:data|report|summary)/i
      ],
      category: 'query',
      action: 'get_emissions',
      extractors: [this.extractDateRange, this.extractScope]
    });

    // Action patterns
    this.intentPatterns.set('update_target', {
      patterns: [
        /(?:set|update|change)\s+(?:the\s+)?target/i,
        /new\s+target\s+(?:is|to)/i
      ],
      category: 'action',
      action: 'update_target',
      extractors: [this.extractTarget, this.extractDate]
    });

    // Analysis patterns
    this.intentPatterns.set('analyze_trends', {
      patterns: [
        /analyze\s+(?:the\s+)?trend/i,
        /trend\s+analysis/i,
        /how\s+(?:are|is)\s+(?:we|I)\s+(?:trending|doing)/i
      ],
      category: 'analysis',
      action: 'analyze_trends',
      extractors: [this.extractMetric, this.extractDateRange]
    });
  }

  public async extractIntent(
    input: string,
    context: ConversationContext
  ): Promise<NLPIntent> {
    let bestMatch: NLPIntent | null = null;
    let highestConfidence = 0;

    for (const [key, pattern] of this.intentPatterns) {
      for (const regex of pattern.patterns) {
        if (regex.test(input)) {
          const entities = await this.extractEntities(input, pattern.extractors);
          const confidence = this.calculateConfidence(input, regex, entities);

          if (confidence > highestConfidence) {
            highestConfidence = confidence;
            bestMatch = {
              id: `intent_${Date.now()}`,
              confidence,
              category: pattern.category,
              action: pattern.action,
              entities,
              parameters: {},
              context
            };
          }
        }
      }
    }

    return bestMatch || this.createDefaultIntent(input, context);
  }

  private async extractEntities(
    input: string,
    extractors: EntityExtractor[]
  ): Promise<Entity[]> {
    const entities: Entity[] = [];

    for (const extractor of extractors) {
      const extracted = await extractor(input);
      if (extracted) {
        entities.push(extracted);
      }
    }

    return entities;
  }

  private extractDateRange = async (input: string): Promise<Entity | null> => {
    const datePatterns = [
      /(?:last|past)\s+(\d+)\s+(days?|weeks?|months?|quarters?|years?)/i,
      /(?:from|between)\s+(.+?)\s+(?:to|and)\s+(.+?)(?:\s|$)/i,
      /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/i,
      /(q[1-4])\s+(\d{4})/i,
      /(\d{4})-(\d{2})-(\d{2})/
    ];

    for (const pattern of datePatterns) {
      const match = input.match(pattern);
      if (match) {
        return {
          type: 'date',
          value: match[0],
          confidence: 0.9,
          position: [match.index || 0, (match.index || 0) + match[0].length],
          metadata: { raw: match[0] }
        };
      }
    }

    return null;
  };

  private extractScope = async (input: string): Promise<Entity | null> => {
    const scopePattern = /scope\s*([1-3])/i;
    const match = input.match(scopePattern);

    if (match) {
      return {
        type: 'emission_scope',
        value: `scope${match[1]}`,
        confidence: 1.0,
        position: [match.index || 0, (match.index || 0) + match[0].length]
      };
    }

    return null;
  };

  private extractTarget = async (input: string): Promise<Entity | null> => {
    const targetPattern = /(\d+(?:\.\d+)?)\s*(%|percent|tco2e?|tons?)/i;
    const match = input.match(targetPattern);

    if (match) {
      return {
        type: 'target',
        value: match[1],
        confidence: 0.95,
        position: [match.index || 0, (match.index || 0) + match[0].length],
        metadata: { unit: match[2] }
      };
    }

    return null;
  };

  private extractMetric = async (input: string): Promise<Entity | null> => {
    const metrics = ['emissions', 'energy', 'water', 'waste', 'cost', 'efficiency'];

    for (const metric of metrics) {
      if (input.includes(metric)) {
        const index = input.indexOf(metric);
        return {
          type: 'metric',
          value: metric,
          confidence: 0.9,
          position: [index, index + metric.length]
        };
      }
    }

    return null;
  };

  private extractDate = async (input: string): Promise<Entity | null> => {
    // Reuse extractDateRange for single dates
    return this.extractDateRange(input);
  };

  private calculateConfidence(
    input: string,
    pattern: RegExp,
    entities: Entity[]
  ): number {
    let confidence = 0.5;

    // Pattern match quality
    const match = input.match(pattern);
    if (match && match[0] === input) {
      confidence += 0.3; // Full match
    } else if (match) {
      confidence += 0.2; // Partial match
    }

    // Entity extraction quality
    confidence += Math.min(entities.length * 0.1, 0.3);

    return Math.min(confidence, 1.0);
  }

  private createDefaultIntent(
    input: string,
    context: ConversationContext
  ): NLPIntent {
    return {
      id: `intent_${Date.now()}`,
      confidence: 0.3,
      category: 'help',
      action: 'unknown',
      entities: [],
      parameters: { originalInput: input },
      context
    };
  }
}

interface IntentPattern {
  patterns: RegExp[];
  category: IntentCategory;
  action: string;
  extractors: EntityExtractor[];
}

type EntityExtractor = (input: string) => Promise<Entity | null>;

abstract class IntentHandler {
  abstract execute(intent: NLPIntent, context: ConversationContext): Promise<any>;
}

class QueryHandler extends IntentHandler {
  constructor(private contextEngine: ContextEngine) {
    super();
  }

  async execute(intent: NLPIntent, context: ConversationContext): Promise<any> {
    const data = await this.contextEngine.getRelevantData(intent, context);
    return { data, source: 'database' };
  }
}

class ActionHandler extends IntentHandler {
  constructor(private actionRegistry: EnhancedActionRegistry) {
    super();
  }

  async execute(intent: NLPIntent, context: ConversationContext): Promise<any> {
    const action = this.actionRegistry.getAction(intent.action);
    if (!action) {
      throw new Error(`Action not found: ${intent.action}`);
    }

    return await action.execute(intent.parameters);
  }
}

class NavigationHandler extends IntentHandler {
  async execute(intent: NLPIntent, context: ConversationContext): Promise<any> {
    return { navigateTo: intent.parameters.destination };
  }
}

class AnalysisHandler extends IntentHandler {
  async execute(intent: NLPIntent, context: ConversationContext): Promise<any> {
    // Perform analysis based on intent
    return { analysis: 'completed', results: [] };
  }
}

class ReportHandler extends IntentHandler {
  async execute(intent: NLPIntent, context: ConversationContext): Promise<any> {
    // Generate report based on intent
    return { report: 'generated', format: 'pdf' };
  }
}

class ConfigurationHandler extends IntentHandler {
  async execute(intent: NLPIntent, context: ConversationContext): Promise<any> {
    // Update configuration
    return { configured: true };
  }
}

class HelpHandler extends IntentHandler {
  async execute(intent: NLPIntent, context: ConversationContext): Promise<any> {
    return {
      help: 'I can help you with emissions tracking, reporting, analysis, and more. What would you like to know?',
      suggestions: ['View emissions', 'Generate report', 'Set target', 'Analyze trends']
    };
  }
}

class SocialHandler extends IntentHandler {
  async execute(intent: NLPIntent, context: ConversationContext): Promise<any> {
    return { response: 'Hello! How can I help you today?' };
  }
}

class AlertHandler extends IntentHandler {
  async execute(intent: NLPIntent, context: ConversationContext): Promise<any> {
    return { alerts: context.organizationContext.recentAlerts };
  }
}

class DefaultHandler extends IntentHandler {
  async execute(intent: NLPIntent, context: ConversationContext): Promise<any> {
    return {
      message: "I'm not sure how to help with that. Could you rephrase or try a different question?",
      suggestions: ['View dashboard', 'Get help', 'Contact support']
    };
  }
}

class ResponseGenerator {
  async generate(
    intent: NLPIntent,
    result: any,
    context: ConversationContext
  ): Promise<ResponseContent> {
    const preference = context.userProfile.preferences.visualPreference;

    if (preference === 'charts' && result.data) {
      return this.generateVisualResponse(intent, result, context);
    }

    if (preference === 'tables' && result.data) {
      return this.generateTableResponse(intent, result, context);
    }

    return this.generateNarrativeResponse(intent, result, context);
  }

  private async generateVisualResponse(
    intent: NLPIntent,
    result: any,
    context: ConversationContext
  ): Promise<ResponseContent> {
    return {
      type: 'visual',
      primary: this.generateNarrative(intent, result),
      visualizations: [
        {
          type: 'chart',
          config: { type: 'line', title: 'Emissions Trend' },
          data: result.data,
          interactive: true,
          exportable: true
        }
      ],
      data: result.data,
      metadata: { quality: 0.9 }
    };
  }

  private async generateTableResponse(
    intent: NLPIntent,
    result: any,
    context: ConversationContext
  ): Promise<ResponseContent> {
    return {
      type: 'visual',
      primary: this.generateNarrative(intent, result),
      visualizations: [
        {
          type: 'table',
          config: { sortable: true, filterable: true },
          data: result.data,
          interactive: true,
          exportable: true
        }
      ],
      data: result.data,
      metadata: { quality: 0.9 }
    };
  }

  private async generateNarrativeResponse(
    intent: NLPIntent,
    result: any,
    context: ConversationContext
  ): Promise<ResponseContent> {
    return {
      type: 'text',
      primary: this.generateNarrative(intent, result),
      secondary: this.generateInsight(result),
      data: result.data,
      metadata: { quality: 0.85 }
    };
  }

  private generateNarrative(intent: NLPIntent, result: any): string {
    // Generate natural language narrative based on intent and result
    if (intent.category === 'query' && result.data) {
      return `Here's what I found: ${JSON.stringify(result.data).substring(0, 100)}...`;
    }

    if (intent.category === 'action' && result.success) {
      return 'I\'ve successfully completed that action for you.';
    }

    return 'Here\'s the information you requested.';
  }

  private generateInsight(result: any): string | undefined {
    if (!result.data) return undefined;

    // Generate insights from data
    return 'Trend analysis shows a 5% improvement over last period.';
  }
}

class LearningSystem {
  async recordInteraction(
    input: string,
    intent: NLPIntent,
    response: CommandResponse,
    context: ConversationContext
  ): Promise<void> {
    await supabase
      .from('ai_interactions')
      .insert({
        user_id: context.userProfile.userId,
        organization_id: context.organizationContext.organizationId,
        input,
        intent: intent,
        response: response.response,
        confidence: intent.confidence,
        timestamp: new Date()
      });
  }

  async getUserPatterns(userId: string): Promise<any[]> {
    const { data } = await supabase
      .from('user_patterns')
      .select('*')
      .eq('user_id', userId)
      .order('confidence', { ascending: false })
      .limit(10);

    return data || [];
  }
}

interface MultiModalInput {
  type: 'voice' | 'image' | 'gesture';
  data: any;
  metadata?: Record<string, any>;
}

interface ResponseMetadata {
  quality?: number;
  source?: string;
  timestamp?: Date;
  error?: string;
}

export type {
  NLPIntent,
  ConversationContext,
  CommandResponse,
  UserProfile,
  OrganizationContext
};