/**
 * Advanced Conversation Context Management Engine
 * 
 * Features:
 * - Intelligent context building from multiple data sources
 * - Conversation memory with relevance scoring
 * - Dynamic context window management
 * - Multi-modal context integration (text, data, documents)
 */

import { createClient } from '@/lib/supabase/server';
import { aiCache } from '@/lib/cache';
import { ConversationMessage } from './enhanced-service';

export interface ContextRequest {
  conversationId: string;
  organizationId: string;
  buildingId?: string;
  messageHistory: ConversationMessage[];
  currentQuery: string;
  maxTokens?: number;
}

export interface ContextData {
  conversational: {
    recentMessages: ConversationMessage[];
    conversationSummary: string;
    topicProgression: string[];
    userIntents: string[];
  };
  organizational: {
    profile: any;
    settings: any;
    permissions: string[];
    activeProjects: any[];
  };
  building?: {
    profile: any;
    metrics: any;
    alerts: any[];
  };
  sustainability: {
    emissionsData: any[];
    targets: any[];
    compliance: any;
    benchmarks: any;
  };
  external: {
    weatherData?: any;
    regulatoryUpdates?: any[];
    industryBenchmarks?: any;
  };
  metadata: {
    contextVersion: string;
    buildTime: number;
    tokenEstimate: number;
    relevanceScore: number;
  };
}

export class ContextEngineEnhanced {
  private readonly maxContextTokens = 8000; // Adjust based on model limits
  private readonly cacheKeyPrefix = 'context-engine-enhanced';

  /**
   * Build comprehensive context for AI interactions
   */
  async buildContext(request: ContextRequest): Promise<ContextData> {
    const startTime = Date.now();
    const cacheKey = `${this.cacheKeyPrefix}:${request.conversationId}:${request.currentQuery.substring(0, 50)}`;
    
    // Check cache first
    const cached = await aiCache.get<ContextData>(cacheKey);
    if (cached && Date.now() - new Date(cached.metadata.buildTime).getTime() < 300000) { // 5 minute cache
      return cached;
    }
    
    // Build context from multiple sources
    const context: ContextData = {
      conversational: await this.buildConversationalContext(_request),
      organizational: await this.buildOrganizationalContext(request.organizationId),
      sustainability: await this.buildSustainabilityContext(request.organizationId, request.buildingId),
      external: await this.buildExternalContext(request.organizationId),
      metadata: {
        contextVersion: '1.0',
        buildTime: Date.now(),
        tokenEstimate: 0,
        relevanceScore: 0
      }
    };
    
    // Add building context if specified
    if (request.buildingId) {
      context.building = await this.buildBuildingContext(request.buildingId);
    }
    
    // Calculate context relevance and optimize
    context.metadata.relevanceScore = this.calculateRelevanceScore(context, request.currentQuery);
    context.metadata.tokenEstimate = this.estimateTokenCount(context);
    
    // Optimize context if too large
    if (context.metadata.tokenEstimate > this.maxContextTokens) {
      await this.optimizeContext(context, request);
    }
    
    context.metadata.buildTime = Date.now() - startTime;
    
    // Cache the result
    await aiCache.set(cacheKey, context, { ttl: 300 }); // 5 minute cache
    
    return context;
  }

  /**
   * Build conversational context from message history
   */
  private async buildConversationalContext(request: ContextRequest): Promise<ContextData['conversational']> {
    const messages = request.messageHistory.slice(-20); // Last 20 messages
    
    // Summarize older conversation if exists
    let conversationSummary = '';
    if (request.messageHistory.length > 20) {
      const olderMessages = request.messageHistory.slice(0, -20);
      conversationSummary = await this.summarizeConversation(olderMessages);
    }
    
    // Extract topic progression
    const topicProgression = this.extractTopics(messages);
    
    // Identify user intents
    const userIntents = this.extractUserIntents(messages, request.currentQuery);
    
    return {
      recentMessages: messages,
      conversationSummary,
      topicProgression,
      userIntents
    };
  }

  /**
   * Build organizational context
   */
  private async buildOrganizationalContext(organizationId: string): Promise<ContextData['organizational']> {
    const supabase = createClient();
    
    try {
      // Get organization profile
      const { data: orgProfile } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single();
      
      // Get organization settings
      const { data: settings } = await supabase
        .from('organization_settings')
        .select('*')
        .eq('organization_id', organizationId);
      
      // Get active projects/initiatives
      const { data: projects } = await supabase
        .from('sustainability_projects')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .limit(10);
      
      return {
        profile: orgProfile,
        settings: settings?.[0] || {},
        permissions: [], // Would be populated based on user context
        activeProjects: projects || []
      };
    } catch (error) {
      console.error('Error building organizational context:', error);
      return {
        profile: null,
        settings: {},
        permissions: [],
        activeProjects: []
      };
    }
  }

  /**
   * Build building-specific context
   */
  private async buildBuildingContext(buildingId: string): Promise<ContextData['building']> {
    const supabase = createClient();
    
    try {
      // Get building profile
      const { data: building } = await supabase
        .from('buildings')
        .select('*')
        .eq('id', buildingId)
        .single();
      
      // Get recent metrics
      const { data: metrics } = await supabase
        .from('building_metrics')
        .select('*')
        .eq('building_id', buildingId)
        .order('timestamp', { ascending: false })
        .limit(5);
      
      // Get active alerts
      const { data: alerts } = await supabase
        .from('building_alerts')
        .select('*')
        .eq('building_id', buildingId)
        .eq('status', 'active')
        .limit(10);
      
      return {
        profile: building,
        metrics: metrics || [],
        alerts: alerts || []
      };
    } catch (error) {
      console.error('Error building building context:', error);
      return {
        profile: null,
        metrics: [],
        alerts: []
      };
    }
  }

  /**
   * Build sustainability-specific context
   */
  private async buildSustainabilityContext(
    organizationId: string,
    buildingId?: string
  ): Promise<ContextData['sustainability']> {
    const supabase = createClient();
    
    try {
      const queries = [];
      
      // Emissions data
      let emissionsQuery = supabase
        .from('emissions_data')
        .select('*')
        .eq('organization_id', organizationId)
        .order('period_start', { ascending: false })
        .limit(12); // Last year of data
      
      if (buildingId) {
        emissionsQuery = emissionsQuery.eq('building_id', buildingId);
      }
      
      queries.push(emissionsQuery);
      
      // Sustainability targets
      queries.push(
        supabase
          .from('sustainability_targets')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('status', 'active')
      );
      
      // Compliance data
      queries.push(
        supabase
          .from('compliance_assessments')
          .select('*')
          .eq('organization_id', organizationId)
          .order('assessment_date', { ascending: false })
          .limit(5)
      );
      
      const [emissionsResult, targetsResult, complianceResult] = await Promise.all(queries);
      
      return {
        emissionsData: emissionsResult.data || [],
        targets: targetsResult.data || [],
        compliance: complianceResult.data?.[0] || null,
        benchmarks: await this.getBenchmarkData(organizationId)
      };
    } catch (error) {
      console.error('Error building sustainability context:', error);
      return {
        emissionsData: [],
        targets: [],
        compliance: null,
        benchmarks: null
      };
    }
  }

  /**
   * Build external context (weather, regulatory, etc.)
   */
  private async buildExternalContext(organizationId: string): Promise<ContextData['external']> {
    // This would integrate with external APIs
    return {
      weatherData: null, // Would fetch from OpenWeatherMap
      regulatoryUpdates: [], // Would fetch from regulatory APIs
      industryBenchmarks: null // Would fetch from industry data sources
    };
  }

  /**
   * Summarize conversation history
   */
  private async summarizeConversation(messages: ConversationMessage[]): Promise<string> {
    if (messages.length === 0) return '';
    
    const conversationText = messages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');
    
    // This would use AI to summarize - for now return a simple summary
    return `Previous conversation covered topics related to sustainability management and emissions tracking. ${messages.length} messages exchanged.`;
  }

  /**
   * Extract topics from conversation
   */
  private extractTopics(messages: ConversationMessage[]): string[] {
    const topics = new Set<string>();
    const sustainabilityKeywords = [
      'emissions', 'carbon', 'sustainability', 'energy', 'scope', 'target',
      'compliance', 'reporting', 'renewable', 'efficiency', 'footprint'
    ];
    
    messages.forEach(message => {
      const words = message.content.toLowerCase().split(/\s+/);
      sustainabilityKeywords.forEach(keyword => {
        if (words.some(word => word.includes(keyword))) {
          topics.add(keyword);
        }
      });
    });
    
    return Array.from(topics);
  }

  /**
   * Extract user intents from conversation
   */
  private extractUserIntents(messages: ConversationMessage[], currentQuery: string): string[] {
    const intents = new Set<string>();
    const intentKeywords = {
      'data_analysis': ['analyze', 'calculate', 'metrics', 'data'],
      'target_setting': ['target', 'goal', 'objective', 'set'],
      'reporting': ['report', 'document', 'compliance', 'disclosure'],
      'optimization': ['improve', 'optimize', 'reduce', 'efficiency'],
      'monitoring': ['track', 'monitor', 'alert', 'watch']
    };
    
    const allText = (messages.map(m => m.content).join(' ') + ' ' + currentQuery).toLowerCase();
    
    Object.entries(intentKeywords).forEach(([intent, keywords]) => {
      if (keywords.some(keyword => allText.includes(keyword))) {
        intents.add(intent);
      }
    });
    
    return Array.from(intents);
  }

  /**
   * Calculate relevance score for context
   */
  private calculateRelevanceScore(context: ContextData, query: string): number {
    let score = 0;
    const queryLower = query.toLowerCase();
    
    // Conversational relevance (30%)
    const topicMatch = context.conversational.topicProgression.some(topic =>
      queryLower.includes(topic)
    );
    if (topicMatch) score += 0.3;
    
    // Data availability (40%)
    if (context.sustainability.emissionsData.length > 0) score += 0.2;
    if (context.sustainability.targets.length > 0) score += 0.1;
    if (context.building?.metrics.length > 0) score += 0.1;
    
    // Organization context (30%)
    if (context.organizational.profile) score += 0.15;
    if (context.organizational.activeProjects.length > 0) score += 0.15;
    
    return Math.min(score, 1.0);
  }

  /**
   * Estimate token count for context
   */
  private estimateTokenCount(context: ContextData): number {
    const jsonString = JSON.stringify(context);
    return Math.ceil(jsonString.length / 4); // Rough estimate: 1 token H 4 characters
  }

  /**
   * Optimize context to fit within token limits
   */
  private async optimizeContext(context: ContextData, request: ContextRequest): Promise<void> {
    // Prioritize context elements by relevance to current query
    const queryLower = request.currentQuery.toLowerCase();
    
    // Reduce message history if needed
    if (context.conversational.recentMessages.length > 10) {
      context.conversational.recentMessages = context.conversational.recentMessages.slice(-10);
    }
    
    // Limit emissions data based on query relevance
    if (!queryLower.includes('emission') && !queryLower.includes('carbon')) {
      context.sustainability.emissionsData = context.sustainability.emissionsData.slice(0, 3);
    }
    
    // Remove external context if not specifically mentioned
    if (!queryLower.includes('weather') && !queryLower.includes('regulatory')) {
      context.external = {
        weatherData: null,
        regulatoryUpdates: [],
        industryBenchmarks: null
      };
    }
    
    // Update token estimate
    context.metadata.tokenEstimate = this.estimateTokenCount(context);
  }

  /**
   * Get benchmark data for organization
   */
  private async getBenchmarkData(organizationId: string): Promise<any> {
    // This would fetch industry benchmarks
    return null;
  }

  /**
   * Clear context cache for conversation
   */
  async clearConversationContext(conversationId: string): Promise<void> {
    await aiCache.deletePattern(`${this.cacheKeyPrefix}:${conversationId}:*`);
  }

  /**
   * Get context statistics
   */
  getContextStats() {
    return {
      maxContextTokens: this.maxContextTokens,
      cachePrefix: this.cacheKeyPrefix,
      uptime: process.uptime()
    };
  }
}

// Export singleton instance
export const contextEngineEnhanced = new ContextEngineEnhanced();