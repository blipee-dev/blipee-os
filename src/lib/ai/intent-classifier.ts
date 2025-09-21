import { aiService } from './service';
import { actionRegistry } from './action-registry';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

// Intent Classification Types
export interface Intent {
  category: IntentCategory;
  action?: string;
  confidence: number;
  entities: Entity[];
  context: IntentContext;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  suggestedActions: string[];
  requiresApproval: boolean;
}

export interface IntentCategory {
  name: string;
  type: IntentType;
  description: string;
  keywords: string[];
  patterns: RegExp[];
  priority: number;
}

export type IntentType =
  | 'emissions_calculation'
  | 'compliance_reporting'
  | 'energy_optimization'
  | 'data_collection'
  | 'target_management'
  | 'supplier_engagement'
  | 'audit_verification'
  | 'forecasting_analytics'
  | 'general_inquiry'
  | 'navigation'
  | 'troubleshooting'
  | 'data_export'
  | 'automation_setup'
  | 'alert_management';

export interface Entity {
  type: EntityType;
  value: string;
  confidence: number;
  startIndex: number;
  endIndex: number;
  resolved?: any;
}

export type EntityType =
  | 'date_range'
  | 'facility'
  | 'emission_scope'
  | 'energy_type'
  | 'report_type'
  | 'metric'
  | 'target'
  | 'supplier'
  | 'compliance_standard'
  | 'optimization_parameter'
  | 'location'
  | 'percentage'
  | 'currency_amount';

export interface IntentContext {
  userRole: string;
  recentActions: string[];
  currentPage?: string;
  activeFilters?: Record<string, any>;
  sessionHistory: ConversationTurn[];
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  businessContext: BusinessContext;
}

export interface ConversationTurn {
  userMessage: string;
  detectedIntent: string;
  timestamp: Date;
  confidence: number;
}

export interface BusinessContext {
  organizationSize: 'small' | 'medium' | 'large' | 'enterprise';
  industry: string;
  complianceRequirements: string[];
  currentPriorities: string[];
  seasonality: string;
}

export interface ClassificationResult {
  intent: Intent;
  alternatives: Intent[];
  processingTime: number;
  modelVersion: string;
  debugInfo?: any;
}

/**
 * Advanced Intent Classifier with 94% accuracy targeting
 * Uses hybrid approach: rule-based + ML + LLM for maximum precision
 */
export class IntentClassifier {
  private supabase: ReturnType<typeof createClient<Database>>;
  private intentCategories: Map<string, IntentCategory> = new Map();
  private entityExtractors: Map<EntityType, EntityExtractor> = new Map();
  private confidenceThreshold = 0.85; // Minimum confidence for high-accuracy classification
  private modelVersion = '1.0.0';

  constructor() {
    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    this.initializeIntentCategories();
    this.initializeEntityExtractors();
  }

  /**
   * Classify user intent with high accuracy targeting
   */
  async classifyIntent(
    userMessage: string,
    context: Partial<IntentContext> = {}
  ): Promise<ClassificationResult> {
    const startTime = Date.now();

    try {
      // Step 1: Preprocess message
      const preprocessed = this.preprocessMessage(userMessage);

      // Step 2: Rule-based quick classification
      const ruleBasedResult = this.ruleBasedClassification(preprocessed, context);

      // Step 3: Entity extraction
      const entities = await this.extractEntities(preprocessed);

      // Step 4: ML-enhanced classification
      const mlResult = await this.mlClassification(preprocessed, entities, context);

      // Step 5: LLM validation for complex cases
      let finalResult: Intent;
      const needsLLMValidation = Math.max(
        ruleBasedResult.confidence,
        mlResult.confidence
      ) < this.confidenceThreshold;

      if (needsLLMValidation) {
        const llmResult = await this.llmClassification(preprocessed, entities, context);
        finalResult = this.selectBestIntent([ruleBasedResult, mlResult, llmResult]);
      } else {
        finalResult = ruleBasedResult.confidence > mlResult.confidence ? ruleBasedResult : mlResult;
      }

      // Step 6: Post-processing and enrichment
      finalResult.entities = entities;
      finalResult.suggestedActions = await this.generateSuggestedActions(finalResult);
      finalResult.requiresApproval = this.assessApprovalRequirement(finalResult);

      // Step 7: Generate alternatives
      const alternatives = await this.generateAlternatives(finalResult, [ruleBasedResult, mlResult]);

      // Step 8: Log for continuous learning
      await this.logClassification(userMessage, finalResult, context);

      const processingTime = Date.now() - startTime;

      return {
        intent: finalResult,
        alternatives,
        processingTime,
        modelVersion: this.modelVersion,
        debugInfo: process.env.NODE_ENV === 'development' ? {
          ruleBasedConfidence: ruleBasedResult.confidence,
          mlConfidence: mlResult.confidence,
          usedLLM: needsLLMValidation
        } : undefined
      };

    } catch (error) {
      // Fallback to general inquiry with low confidence
      return {
        intent: {
          category: this.intentCategories.get('general_inquiry')!,
          confidence: 0.3,
          entities: [],
          context: context as IntentContext,
          urgency: 'low',
          suggestedActions: ['provide_general_help'],
          requiresApproval: false
        },
        alternatives: [],
        processingTime: Date.now() - startTime,
        modelVersion: this.modelVersion
      };
    }
  }

  /**
   * Initialize intent categories with high-precision patterns
   */
  private initializeIntentCategories() {
    const categories: IntentCategory[] = [
      {
        name: 'emissions_calculation',
        type: 'emissions_calculation',
        description: 'Calculate emissions for any scope',
        keywords: [
          'calculate', 'emissions', 'carbon', 'footprint', 'scope 1', 'scope 2', 'scope 3',
          'co2', 'greenhouse gas', 'ghg', 'tco2e', 'carbon dioxide'
        ],
        patterns: [
          /calculate\s+(?:scope\s*[123]|carbon|emissions?|footprint)/i,
          /(?:what|how much).+(?:emissions?|carbon|co2|ghg)/i,
          /scope\s*[123]\s*(?:emissions?|calculation)/i
        ],
        priority: 1
      },
      {
        name: 'compliance_reporting',
        type: 'compliance_reporting',
        description: 'Generate compliance reports and disclosures',
        keywords: [
          'report', 'disclosure', 'compliance', 'cdp', 'gri', 'sasb', 'tcfd',
          'sustainability report', 'esg report', 'annual report', 'submit'
        ],
        patterns: [
          /(?:generate|create|prepare)\s+(?:report|disclosure)/i,
          /(?:cdp|gri|sasb|tcfd)\s*(?:report|disclosure|submission)/i,
          /sustainability\s+report/i,
          /compliance\s+report/i
        ],
        priority: 1
      },
      {
        name: 'energy_optimization',
        type: 'energy_optimization',
        description: 'Optimize energy consumption and efficiency',
        keywords: [
          'optimize', 'energy', 'efficiency', 'hvac', 'lighting', 'reduce consumption',
          'energy savings', 'demand response', 'peak demand'
        ],
        patterns: [
          /optimize\s+(?:energy|hvac|lighting|consumption)/i,
          /(?:reduce|lower|save)\s+(?:energy|consumption|costs?)/i,
          /energy\s+(?:efficiency|optimization|savings?)/i,
          /(?:hvac|lighting)\s+(?:optimization|automation)/i
        ],
        priority: 2
      },
      {
        name: 'target_management',
        type: 'target_management',
        description: 'Set, track, and manage sustainability targets',
        keywords: [
          'target', 'goal', 'objective', 'science based', 'sbti', 'net zero',
          'track progress', 'target achievement', 'milestone'
        ],
        patterns: [
          /(?:set|create|establish)\s+(?:target|goal)/i,
          /(?:track|monitor)\s+(?:progress|target|goal)/i,
          /science\s*based\s*target/i,
          /net\s*zero\s*(?:target|goal)/i
        ],
        priority: 1
      },
      {
        name: 'data_collection',
        type: 'data_collection',
        description: 'Collect and process sustainability data',
        keywords: [
          'collect', 'import', 'upload', 'data', 'utility', 'invoice',
          'meter reading', 'consumption data', 'extract data'
        ],
        patterns: [
          /(?:collect|import|upload)\s+(?:data|utility|consumption)/i,
          /(?:extract|process)\s+(?:invoice|document|bill)/i,
          /utility\s+(?:data|consumption|bills?)/i
        ],
        priority: 2
      },
      {
        name: 'forecasting_analytics',
        type: 'forecasting_analytics',
        description: 'Forecast emissions and analyze trends',
        keywords: [
          'forecast', 'predict', 'projection', 'trend', 'analytics',
          'future emissions', 'trajectory', 'scenario analysis'
        ],
        patterns: [
          /(?:forecast|predict|project)\s+(?:emissions?|consumption|trajectory)/i,
          /(?:what will|how much will).+(?:in the future|next year|by 2030)/i,
          /scenario\s+analysis/i,
          /emissions?\s+trajectory/i
        ],
        priority: 2
      },
      {
        name: 'navigation',
        type: 'navigation',
        description: 'Navigate to different sections of the application',
        keywords: [
          'show', 'go to', 'navigate', 'open', 'dashboard', 'page',
          'take me to', 'view', 'display'
        ],
        patterns: [
          /(?:show|display|view)\s+(?:dashboard|page|section|report)/i,
          /(?:go to|navigate to|take me to|open)\s+/i,
          /(?:where is|how do i find|where can i see)/i
        ],
        priority: 3
      },
      {
        name: 'general_inquiry',
        type: 'general_inquiry',
        description: 'General questions about sustainability or the platform',
        keywords: [
          'what', 'how', 'why', 'explain', 'tell me', 'help',
          'definition', 'meaning', 'understand'
        ],
        patterns: [
          /(?:what is|what are|what does)/i,
          /(?:how do|how does|how can)/i,
          /(?:explain|tell me about|help me understand)/i,
          /(?:why|why is|why does)/i
        ],
        priority: 5
      }
    ];

    categories.forEach(category => {
      this.intentCategories.set(category.name, category);
    });
  }

  /**
   * Initialize entity extractors for different types
   */
  private initializeEntityExtractors() {
    this.entityExtractors.set('date_range', new DateRangeExtractor());
    this.entityExtractors.set('facility', new FacilityExtractor());
    this.entityExtractors.set('emission_scope', new EmissionScopeExtractor());
    this.entityExtractors.set('energy_type', new EnergyTypeExtractor());
    this.entityExtractors.set('metric', new MetricExtractor());
    this.entityExtractors.set('percentage', new PercentageExtractor());
    this.entityExtractors.set('currency_amount', new CurrencyAmountExtractor());
  }

  /**
   * Preprocess user message for better classification
   */
  private preprocessMessage(message: string): string {
    return message
      .toLowerCase()
      .trim()
      .replace(/[^\w\s\d%$.,]/g, '') // Remove special chars except common ones
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  /**
   * Rule-based classification for high-confidence patterns
   */
  private ruleBasedClassification(message: string, context: Partial<IntentContext>): Intent {
    let bestMatch: { category: IntentCategory; confidence: number } | null = null;

    for (const category of this.intentCategories.values()) {
      let confidence = 0;

      // Pattern matching
      for (const pattern of category.patterns) {
        if (pattern.test(message)) {
          confidence += 0.3;
        }
      }

      // Keyword matching with TF-IDF style scoring
      const messageWords = message.split(' ');
      const matchedKeywords = category.keywords.filter(keyword =>
        messageWords.some(word => word.includes(keyword) || keyword.includes(word))
      );

      if (matchedKeywords.length > 0) {
        confidence += (matchedKeywords.length / category.keywords.length) * 0.4;
      }

      // Context boost
      if (context.recentActions?.some(action =>
        actionRegistry.getAction(action)?.category.name === category.name
      )) {
        confidence += 0.1;
      }

      // Priority adjustment
      confidence *= (6 - category.priority) / 5;

      if (confidence > (bestMatch?.confidence || 0)) {
        bestMatch = { category, confidence: Math.min(confidence, 0.95) };
      }
    }

    return {
      category: bestMatch?.category || this.intentCategories.get('general_inquiry')!,
      confidence: bestMatch?.confidence || 0.3,
      entities: [],
      context: context as IntentContext,
      urgency: this.assessUrgency(message),
      suggestedActions: [],
      requiresApproval: false
    };
  }

  /**
   * ML-enhanced classification using embeddings and similarity
   */
  private async mlClassification(
    message: string,
    entities: Entity[],
    context: Partial<IntentContext>
  ): Promise<Intent> {
    try {
      // Use AI service to get embeddings and classification
      const prompt = `
Classify this sustainability message into one of these categories:
${Array.from(this.intentCategories.values()).map(cat =>
  `- ${cat.name}: ${cat.description}`
).join('\n')}

Message: "${message}"
Context: User role: ${context.userRole || 'unknown'}, Recent actions: ${context.recentActions?.join(', ') || 'none'}
Entities found: ${entities.map(e => `${e.type}:${e.value}`).join(', ') || 'none'}

Respond with ONLY the category name and confidence (0.0-1.0) in format: category_name:confidence
`;

      const response = await aiService.complete(prompt, {
        temperature: 0.1,
        maxTokens: 50
      });

      const responseText = typeof response === 'string' ? response : response.content || '';
      const [categoryName, confidenceStr] = responseText.trim().split(':');

      const category = this.intentCategories.get(categoryName) || this.intentCategories.get('general_inquiry')!;
      const confidence = Math.min(Math.max(parseFloat(confidenceStr) || 0.5, 0), 1);

      return {
        category,
        confidence,
        entities: [],
        context: context as IntentContext,
        urgency: this.assessUrgency(message),
        suggestedActions: [],
        requiresApproval: false
      };

    } catch (error) {
      // Fallback to rule-based if ML fails
      return this.ruleBasedClassification(message, context);
    }
  }

  /**
   * LLM classification for complex cases requiring deep understanding
   */
  private async llmClassification(
    message: string,
    entities: Entity[],
    context: Partial<IntentContext>
  ): Promise<Intent> {
    try {
      const prompt = `
You are an expert sustainability AI assistant. Analyze this user message and classify the intent with high precision.

Available intent categories:
${Array.from(this.intentCategories.values()).map(cat =>
  `${cat.name}: ${cat.description} (keywords: ${cat.keywords.slice(0, 5).join(', ')})`
).join('\n')}

User message: "${message}"
User role: ${context.userRole || 'unknown'}
Recent actions: ${context.recentActions?.join(', ') || 'none'}
Extracted entities: ${entities.map(e => `${e.type}: "${e.value}"`).join(', ') || 'none'}
Time of day: ${context.timeOfDay || 'unknown'}

Instructions:
1. Analyze the semantic meaning, not just keywords
2. Consider the business context and user role
3. Factor in recent actions and conversation flow
4. Assess urgency based on language and business impact
5. Provide confidence score reflecting your certainty

Response format (JSON):
{
  "category": "category_name",
  "confidence": 0.95,
  "urgency": "high",
  "reasoning": "Explanation of classification decision",
  "action_hints": ["suggested_action_1", "suggested_action_2"]
}
`;

      const response = await aiService.complete(prompt, {
        temperature: 0.2,
        maxTokens: 200
      });

      const responseText = typeof response === 'string' ? response : response.content || '';

      try {
        const parsed = JSON.parse(responseText);
        const category = this.intentCategories.get(parsed.category) || this.intentCategories.get('general_inquiry')!;

        return {
          category,
          confidence: Math.min(Math.max(parsed.confidence || 0.6, 0), 1),
          entities: [],
          context: context as IntentContext,
          urgency: parsed.urgency || 'medium',
          suggestedActions: parsed.action_hints || [],
          requiresApproval: false
        };
      } catch (parseError) {
        // Fallback if JSON parsing fails
        return this.ruleBasedClassification(message, context);
      }

    } catch (error) {
      // Fallback to rule-based if LLM fails
      return this.ruleBasedClassification(message, context);
    }
  }

  /**
   * Extract entities from the message
   */
  private async extractEntities(message: string): Promise<Entity[]> {
    const entities: Entity[] = [];

    for (const [type, extractor] of this.entityExtractors.entries()) {
      const extracted = await extractor.extract(message);
      entities.push(...extracted);
    }

    return entities;
  }

  /**
   * Generate suggested actions based on intent
   */
  private async generateSuggestedActions(intent: Intent): Promise<string[]> {
    const actions = actionRegistry.getActionsByCategory(intent.category.name);
    return actions.slice(0, 3).map(action => action.id);
  }

  /**
   * Assess if the intent requires approval
   */
  private assessApprovalRequirement(intent: Intent): boolean {
    const highRiskCategories = ['energy_optimization', 'audit_verification'];
    return highRiskCategories.includes(intent.category.name) && intent.urgency === 'high';
  }

  /**
   * Assess urgency based on message content
   */
  private assessUrgency(message: string): 'low' | 'medium' | 'high' | 'critical' {
    const urgentWords = ['urgent', 'immediately', 'asap', 'critical', 'emergency', 'deadline'];
    const highWords = ['soon', 'quickly', 'priority', 'important'];

    if (urgentWords.some(word => message.includes(word))) return 'critical';
    if (highWords.some(word => message.includes(word))) return 'high';
    if (message.includes('today') || message.includes('now')) return 'high';
    return 'medium';
  }

  /**
   * Select the best intent from multiple results
   */
  private selectBestIntent(intents: Intent[]): Intent {
    return intents.reduce((best, current) =>
      current.confidence > best.confidence ? current : best
    );
  }

  /**
   * Generate alternative intents
   */
  private async generateAlternatives(primary: Intent, candidates: Intent[]): Promise<Intent[]> {
    return candidates
      .filter(intent => intent.category.name !== primary.category.name)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 2);
  }

  /**
   * Log classification for continuous learning
   */
  private async logClassification(
    message: string,
    intent: Intent,
    context: Partial<IntentContext>
  ): Promise<void> {
    try {
      await this.supabase.from('intent_classification_log').insert({
        user_message: message,
        classified_intent: intent.category.name,
        confidence: intent.confidence,
        urgency: intent.urgency,
        user_role: context.userRole,
        model_version: this.modelVersion,
        entities_count: intent.entities.length,
        classified_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log intent classification:', error);
    }
  }

  /**
   * Get classification statistics for monitoring accuracy
   */
  async getClassificationStats(timeRange: string = '24h'): Promise<any> {
    try {
      const startDate = new Date();
      startDate.setHours(startDate.getHours() - (timeRange === '24h' ? 24 : 168));

      const { data, error } = await this.supabase
        .from('intent_classification_log')
        .select('*')
        .gte('classified_at', startDate.toISOString());

      if (error) throw error;

      const totalClassifications = data?.length || 0;
      const highConfidenceCount = data?.filter(log => log.confidence >= this.confidenceThreshold).length || 0;

      return {
        totalClassifications,
        highConfidenceRate: totalClassifications > 0 ? highConfidenceCount / totalClassifications : 0,
        averageConfidence: totalClassifications > 0 ?
          data!.reduce((sum, log) => sum + log.confidence, 0) / totalClassifications : 0,
        categoryDistribution: this.getIntentDistribution(data || [])
      };
    } catch (error) {
      console.error('Failed to get classification stats:', error);
      return null;
    }
  }

  private getIntentDistribution(logs: any[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    logs.forEach(log => {
      distribution[log.classified_intent] = (distribution[log.classified_intent] || 0) + 1;
    });
    return distribution;
  }
}

// Entity Extractors
abstract class EntityExtractor {
  abstract extract(message: string): Promise<Entity[]>;
}

class DateRangeExtractor extends EntityExtractor {
  async extract(message: string): Promise<Entity[]> {
    const entities: Entity[] = [];
    const patterns = [
      /(?:last|past|previous)\s+(\d+)\s+(day|week|month|year)s?/gi,
      /(?:this|current)\s+(week|month|quarter|year)/gi,
      /(\d{4})/g, // Years
      /(january|february|march|april|may|june|july|august|september|october|november|december)/gi
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(message)) !== null) {
        entities.push({
          type: 'date_range',
          value: match[0],
          confidence: 0.9,
          startIndex: match.index,
          endIndex: match.index + match[0].length
        });
      }
    });

    return entities;
  }
}

class FacilityExtractor extends EntityExtractor {
  async extract(message: string): Promise<Entity[]> {
    const entities: Entity[] = [];
    const patterns = [
      /(?:building|facility|site|location|office|warehouse|plant)\s+([a-z0-9\-]+)/gi,
      /([a-z\s]+(?:building|facility|site|office|warehouse|plant))/gi
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(message)) !== null) {
        entities.push({
          type: 'facility',
          value: match[1] || match[0],
          confidence: 0.8,
          startIndex: match.index,
          endIndex: match.index + match[0].length
        });
      }
    });

    return entities;
  }
}

class EmissionScopeExtractor extends EntityExtractor {
  async extract(message: string): Promise<Entity[]> {
    const entities: Entity[] = [];
    const pattern = /scope\s*([123])/gi;

    let match;
    while ((match = pattern.exec(message)) !== null) {
      entities.push({
        type: 'emission_scope',
        value: `scope_${match[1]}`,
        confidence: 0.95,
        startIndex: match.index,
        endIndex: match.index + match[0].length
      });
    }

    return entities;
  }
}

class EnergyTypeExtractor extends EntityExtractor {
  async extract(message: string): Promise<Entity[]> {
    const entities: Entity[] = [];
    const energyTypes = ['electricity', 'natural gas', 'diesel', 'gasoline', 'coal', 'steam', 'chilled water'];

    energyTypes.forEach(type => {
      const index = message.toLowerCase().indexOf(type);
      if (index !== -1) {
        entities.push({
          type: 'energy_type',
          value: type,
          confidence: 0.9,
          startIndex: index,
          endIndex: index + type.length
        });
      }
    });

    return entities;
  }
}

class MetricExtractor extends EntityExtractor {
  async extract(message: string): Promise<Entity[]> {
    const entities: Entity[] = [];
    const metrics = ['kwh', 'mwh', 'btu', 'therm', 'gallon', 'liter', 'cubic foot', 'tco2e', 'kg co2e'];

    metrics.forEach(metric => {
      const pattern = new RegExp(`\\b${metric}\\b`, 'gi');
      let match;
      while ((match = pattern.exec(message)) !== null) {
        entities.push({
          type: 'metric',
          value: metric,
          confidence: 0.9,
          startIndex: match.index,
          endIndex: match.index + match[0].length
        });
      }
    });

    return entities;
  }
}

class PercentageExtractor extends EntityExtractor {
  async extract(message: string): Promise<Entity[]> {
    const entities: Entity[] = [];
    const pattern = /(\d+(?:\.\d+)?)\s*%/g;

    let match;
    while ((match = pattern.exec(message)) !== null) {
      entities.push({
        type: 'percentage',
        value: match[1],
        confidence: 0.95,
        startIndex: match.index,
        endIndex: match.index + match[0].length
      });
    }

    return entities;
  }
}

class CurrencyAmountExtractor extends EntityExtractor {
  async extract(message: string): Promise<Entity[]> {
    const entities: Entity[] = [];
    const pattern = /\$(\d+(?:,\d{3})*(?:\.\d{2})?)/g;

    let match;
    while ((match = pattern.exec(message)) !== null) {
      entities.push({
        type: 'currency_amount',
        value: match[1],
        confidence: 0.95,
        startIndex: match.index,
        endIndex: match.index + match[0].length
      });
    }

    return entities;
  }
}

// Export singleton instance
export const intentClassifier = new IntentClassifier();