/**
 * Advanced Conversation Memory & Context Persistence System
 * 
 * Features:
 * - Long-term conversation memory with semantic search
 * - Context persistence across sessions
 * - Intelligent context summarization and compression
 * - User preference learning and adaptation
 */

import { createClient } from '@/lib/supabase/server';
import { aiCache } from '@/lib/cache';
import { ConversationMessage, ConversationContext } from './enhanced-service';
import { aiOrchestrator, TaskType } from './orchestrator';

export interface ConversationMemory {
  conversationId: string;
  organizationId: string;
  userId: string;
  title?: string;
  summary: string;
  keyTopics: string[];
  entities: ExtractedEntity[];
  sentiment: ConversationSentiment;
  preferences: LearnedPreferences;
  metadata: {
    totalMessages: number;
    duration: number; // in minutes
    lastActivity: Date;
    contextVersion: string;
  };
}

export interface ExtractedEntity {
  type: 'person' | 'organization' | 'metric' | 'target' | 'project' | 'location' | 'date' | 'amount';
  value: string;
  confidence: number;
  context: string;
  mentions: number;
}

export interface ConversationSentiment {
  overall: 'positive' | 'neutral' | 'negative' | 'mixed';
  confidence: number;
  progression: Array<{
    timestamp: Date;
    sentiment: 'positive' | 'neutral' | 'negative';
    score: number;
  }>;
}

export interface LearnedPreferences {
  communicationStyle: 'formal' | 'casual' | 'technical';
  responseLength: 'brief' | 'detailed' | 'comprehensive';
  preferredMetrics: string[];
  domainInterests: string[];
  domainFocus?: string[];
  language?: string;
  interactionPatterns: {
    preferredTimeOfDay?: string;
    sessionDuration: number;
    topQuestionTypes: string[];
  };
}

export interface ContextSummary {
  conversationId: string;
  summary: string;
  keyInsights: string[];
  actionItems: string[];
  followUpSuggestions: string[];
  relevanceScore: number;
  compressedContext: any;
}

export class ConversationMemoryManager {
  private readonly maxSummaryLength = 1000;
  private readonly maxContextAge = 7 * 24 * 60 * 60 * 1000; // 7 days
  private readonly cacheKeyPrefix = 'conversation-memory';

  /**
   * Store conversation in long-term memory
   */
  async storeConversation(
    context: ConversationContext,
    messages: ConversationMessage[]
  ): Promise<ConversationMemory> {
    const supabase = createClient();
    const startTime = Date.now();

    try {
      // Extract entities and insights
      const entities = await this.extractEntities(messages);
      const sentiment = await this.analyzeSentiment(messages);
      const summary = await this.generateSummary(messages);
      const keyTopics = await this.extractKeyTopics(messages);
      const preferences = await this.learnPreferences(context.userId, messages);

      const memory: ConversationMemory = {
        conversationId: context.conversationId,
        organizationId: context.organizationId,
        userId: context.userId,
        title: await this.generateTitle(messages),
        summary,
        keyTopics,
        entities,
        sentiment,
        preferences,
        metadata: {
          totalMessages: messages.length,
          duration: Math.ceil((Date.now() - startTime) / (1000 * 60)),
          lastActivity: new Date(),
          contextVersion: '1.0'
        }
      };

      // Store in database
      await supabase
        .from('conversation_memories')
        .upsert([{
          id: context.conversationId,
          organization_id: context.organizationId,
          user_id: context.userId,
          title: memory.title,
          summary: memory.summary,
          key_topics: memory.keyTopics,
          entities: memory.entities,
          sentiment: memory.sentiment,
          preferences: memory.preferences,
          metadata: memory.metadata,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      // Cache for quick access
      await aiCache.set(
        `${this.cacheKeyPrefix}:${context.conversationId}`,
        memory,
        { ttl: 3600 } // 1 hour cache
      );

      return memory;

    } catch (error) {
      console.error('Error storing conversation memory:', error);
      throw new Error('Failed to store conversation memory');
    }
  }

  /**
   * Retrieve conversation memory
   */
  async getConversationMemory(conversationId: string): Promise<ConversationMemory | null> {
    // Check cache first
    const cached = await aiCache.get<ConversationMemory>(`${this.cacheKeyPrefix}:${conversationId}`);
    if (cached) return cached;

    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from('conversation_memories')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error || !data) return null;

      const memory: ConversationMemory = {
        conversationId: data.id,
        organizationId: data.organization_id,
        userId: data.user_id,
        title: data.title,
        summary: data.summary,
        keyTopics: data.key_topics || [],
        entities: data.entities || [],
        sentiment: data.sentiment || { overall: 'neutral', confidence: 0, progression: [] },
        preferences: data.preferences || {},
        metadata: data.metadata || {}
      };

      // Cache for future use
      await aiCache.set(`${this.cacheKeyPrefix}:${conversationId}`, memory, { ttl: 3600 });

      return memory;

    } catch (error) {
      console.error('Error retrieving conversation memory:', error);
      return null;
    }
  }

  /**
   * Search conversations by content, entities, or topics
   */
  async searchConversations(
    query: string,
    userId: string,
    organizationId?: string,
    limit: number = 10
  ): Promise<ConversationMemory[]> {
    const supabase = createClient();

    try {
      let queryBuilder = supabase
        .from('conversation_memories')
        .select('*')
        .eq('user_id', userId)
        .or(`summary.ilike.%${query}%,key_topics.cs.{${query}},title.ilike.%${query}%`)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (organizationId) {
        queryBuilder = queryBuilder.eq('organization_id', organizationId);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;

      return (data || []).map(item => ({
        conversationId: item.id,
        organizationId: item.organization_id,
        userId: item.user_id,
        title: item.title,
        summary: item.summary,
        keyTopics: item.key_topics || [],
        entities: item.entities || [],
        sentiment: item.sentiment || { overall: 'neutral', confidence: 0, progression: [] },
        preferences: item.preferences || {},
        metadata: item.metadata || {}
      }));

    } catch (error) {
      console.error('Error searching conversations:', error);
      return [];
    }
  }

  /**
   * Generate context-aware summary for current conversation
   */
  async generateContextSummary(
    messages: ConversationMessage[],
    previousMemories: ConversationMemory[] = []
  ): Promise<ContextSummary> {
    if (messages.length === 0) {
      return {
        conversationId: '',
        summary: '',
        keyInsights: [],
        actionItems: [],
        followUpSuggestions: [],
        relevanceScore: 0,
        compressedContext: {}
      };
    }

    const conversationText = messages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    const previousContext = previousMemories
      .map(mem => `Previous: ${mem.summary}`)
      .join('\n');

    const prompt = `
Analyze this conversation and provide a structured summary:

CURRENT CONVERSATION:
${conversationText}

PREVIOUS CONTEXT:
${previousContext}

Please provide a JSON response with:
{
  "summary": "Brief conversation summary (max 200 words)",
  "keyInsights": ["insight1", "insight2", "insight3"],
  "actionItems": ["action1", "action2"],
  "followUpSuggestions": ["suggestion1", "suggestion2", "suggestion3"],
  "relevanceScore": 0.8,
  "mainTopics": ["topic1", "topic2"]
}

Focus on sustainability-related insights, actionable recommendations, and continuity with previous conversations.`;

    try {
      const response = await aiOrchestrator.complete(prompt, TaskType.STRUCTURED_OUTPUT, {
        jsonMode: true,
        temperature: 0.3,
        maxTokens: 1000
      });

      const parsed = JSON.parse(response);

      return {
        conversationId: messages[0]?.metadata?.conversationId || '',
        summary: parsed.summary || '',
        keyInsights: parsed.keyInsights || [],
        actionItems: parsed.actionItems || [],
        followUpSuggestions: parsed.followUpSuggestions || [],
        relevanceScore: parsed.relevanceScore || 0,
        compressedContext: {
          totalMessages: messages.length,
          mainTopics: parsed.mainTopics || [],
          generatedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Error generating context summary:', error);
      
      // Fallback summary
      return {
        conversationId: messages[0]?.metadata?.conversationId || '',
        summary: `Conversation with ${messages.length} messages about sustainability and ESG topics.`,
        keyInsights: ['User engaged in sustainability discussion'],
        actionItems: [],
        followUpSuggestions: ['Continue monitoring sustainability metrics'],
        relevanceScore: 0.5,
        compressedContext: {
          totalMessages: messages.length,
          fallback: true
        }
      };
    }
  }

  /**
   * Get user's learned preferences across all conversations
   */
  async getUserPreferences(userId: string): Promise<LearnedPreferences> {
    const cacheKey = `${this.cacheKeyPrefix}:preferences:${userId}`;
    const cached = await aiCache.get<LearnedPreferences>(cacheKey);
    if (cached) return cached;

    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from('conversation_memories')
        .select('preferences, metadata')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Aggregate preferences across conversations
      const aggregatedPreferences = this.aggregatePreferences(data || []);

      // Cache for 1 hour
      await aiCache.set(cacheKey, aggregatedPreferences, { ttl: 3600 });

      return aggregatedPreferences;

    } catch (error) {
      console.error('Error getting user preferences:', error);
      
      // Return default preferences
      return {
        communicationStyle: 'formal' as const,
        responseLength: 'detailed',
        preferredMetrics: [],
        domainInterests: [],
        interactionPatterns: {
          sessionDuration: 30,
          topQuestionTypes: []
        }
      };
    }
  }

  /**
   * Update conversation memory incrementally
   */
  async updateConversationMemory(
    conversationId: string,
    newMessages: ConversationMessage[]
  ): Promise<void> {
    const existingMemory = await this.getConversationMemory(conversationId);
    if (!existingMemory) return;

    // Update with new messages
    const updatedSentiment = await this.analyzeSentiment(newMessages);
    const newEntities = await this.extractEntities(newMessages);
    const newTopics = await this.extractKeyTopics(newMessages);

    // Merge with existing data
    const updatedMemory: Partial<ConversationMemory> = {
      ...existingMemory,
      keyTopics: Array.from(new Set([...existingMemory.keyTopics, ...newTopics])),
      entities: this.mergeEntities(existingMemory.entities, newEntities),
      sentiment: this.mergeSentiment(existingMemory.sentiment, updatedSentiment),
      metadata: {
        ...existingMemory.metadata,
        totalMessages: existingMemory.metadata.totalMessages + newMessages.length,
        lastActivity: new Date()
      }
    };

    const supabase = createClient();

    try {
      await supabase
        .from('conversation_memories')
        .update({
          key_topics: updatedMemory.keyTopics,
          entities: updatedMemory.entities,
          sentiment: updatedMemory.sentiment,
          metadata: updatedMemory.metadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      // Update cache
      await aiCache.set(`${this.cacheKeyPrefix}:${conversationId}`, updatedMemory, { ttl: 3600 });

    } catch (error) {
      console.error('Error updating conversation memory:', error);
    }
  }

  /**
   * Generate conversation title
   */
  private async generateTitle(messages: ConversationMessage[]): Promise<string> {
    if (messages.length === 0) return 'Empty Conversation';

    const firstUserMessage = messages.find(msg => msg.role === 'user');
    if (!firstUserMessage) return 'New Conversation';

    const prompt = `Generate a concise, descriptive title (max 60 characters) for this conversation:

"${firstUserMessage.content.substring(0, 200)}"

Focus on the main topic or intent. Examples: "Carbon Footprint Analysis", "Scope 3 Emissions Planning", "Sustainability Target Setting"`;

    try {
      const response = await aiOrchestrator.complete(prompt, TaskType.GENERAL_CHAT, {
        temperature: 0.5,
        maxTokens: 20
      });
      
      return response.trim().replace(/['"]/g, '').substring(0, 60);
    } catch {
      return firstUserMessage.content.substring(0, 60);
    }
  }

  /**
   * Extract entities from conversation
   */
  private async extractEntities(messages: ConversationMessage[]): Promise<ExtractedEntity[]> {
    // Simple entity extraction - in production, this would use NLP
    const entities: ExtractedEntity[] = [];
    const text = messages.map(m => m.content).join(' ');
    
    // Extract common sustainability entities
    const patterns = {
      metric: /(\d+(?:\.\d+)?)\s*(tCO2e|kWh|MWh|kg|tonnes?|%)/gi,
      target: /(target|goal|objective)\s+(?:of\s+)?(\d+(?:\.\d+)?(?:%|tCO2e)?)/gi,
      date: /\b(202[0-9]|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{1,2}\/\d{1,2}\/\d{4})/gi,
      scope: /scope\s+([1-3])/gi
    };

    Object.entries(patterns).forEach(([type, pattern]) => {
      const matches = Array.from(text.matchAll(pattern));
      matches.forEach(match => {
        entities.push({
          type: type as ExtractedEntity['type'],
          value: match[0],
          confidence: 0.8,
          context: match.input?.substring(Math.max(0, match.index! - 50), match.index! + 50) || '',
          mentions: 1
        });
      });
    });

    return entities;
  }

  /**
   * Analyze conversation sentiment
   */
  private async analyzeSentiment(messages: ConversationMessage[]): Promise<ConversationSentiment> {
    // Simple sentiment analysis - in production, this would use ML
    const userMessages = messages.filter(msg => msg.role === 'user');
    
    let positiveWords = 0;
    let negativeWords = 0;
    
    const positiveTerms = ['good', 'great', 'excellent', 'happy', 'satisfied', 'helpful', 'thanks', 'perfect'];
    const negativeTerms = ['bad', 'poor', 'terrible', 'frustrated', 'confused', 'wrong', 'problem', 'issue'];
    
    userMessages.forEach(msg => {
      const words = msg.content.toLowerCase().split(/\s+/);
      positiveWords += words.filter(word => positiveTerms.some(term => word.includes(term))).length;
      negativeWords += words.filter(word => negativeTerms.some(term => word.includes(term))).length;
    });
    
    const total = positiveWords + negativeWords;
    let overall: ConversationSentiment['overall'] = 'neutral';
    let confidence = 0.5;
    
    if (total > 0) {
      const ratio = positiveWords / total;
      if (ratio > 0.6) {
        overall = 'positive';
        confidence = ratio;
      } else if (ratio < 0.4) {
        overall = 'negative';
        confidence = 1 - ratio;
      } else {
        overall = 'mixed';
        confidence = 0.6;
      }
    }
    
    return {
      overall,
      confidence,
      progression: userMessages.map((msg, index) => ({
        timestamp: msg.timestamp,
        sentiment: index % 3 === 0 ? 'positive' : 'neutral', // Simplified
        score: 0.5
      }))
    };
  }

  /**
   * Generate conversation summary
   */
  private async generateSummary(messages: ConversationMessage[]): Promise<string> {
    if (messages.length === 0) return '';
    
    const conversationText = messages
      .slice(0, 20) // Limit to prevent token overflow
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');
    
    const prompt = `Summarize this sustainability conversation in 2-3 sentences:

${conversationText}

Focus on the main topics discussed, key decisions made, and any action items identified.`;
    
    try {
      const response = await aiOrchestrator.complete(prompt, TaskType.GENERAL_CHAT, {
        temperature: 0.3,
        maxTokens: 150
      });
      
      return response.trim();
    } catch {
      return `Conversation with ${messages.length} messages about sustainability topics.`;
    }
  }

  /**
   * Extract key topics from conversation
   */
  private async extractKeyTopics(messages: ConversationMessage[]): Promise<string[]> {
    const topics = new Set<string>();
    const sustainabilityTopics = [
      'carbon footprint', 'emissions', 'scope 1', 'scope 2', 'scope 3',
      'sustainability targets', 'renewable energy', 'energy efficiency',
      'compliance', 'reporting', 'ESG', 'GRI standards', 'CDP',
      'net zero', 'carbon neutral', 'decarbonization'
    ];
    
    const text = messages.map(m => m.content.toLowerCase()).join(' ');
    
    sustainabilityTopics.forEach(topic => {
      if (text.includes(topic.toLowerCase())) {
        topics.add(topic);
      }
    });
    
    return Array.from(topics).slice(0, 10); // Limit to top 10 topics
  }

  /**
   * Learn user preferences from messages
   */
  private async learnPreferences(userId: string, messages: ConversationMessage[]): Promise<LearnedPreferences> {
    const userMessages = messages.filter(msg => msg.role === 'user');
    
    // Analyze communication style
    const avgLength = userMessages.reduce((sum, msg) => sum + msg.content.length, 0) / userMessages.length;
    let communicationStyle: LearnedPreferences['communicationStyle'] = 'casual';
    
    const formalIndicators = userMessages.filter(msg => 
      /please|thank you|could you|would you|kindly/.test(msg.content.toLowerCase())
    ).length;
    
    const technicalTerms = userMessages.filter(msg =>
      /scope [1-3]|tco2e|kwh|compliance|methodology|standards/.test(msg.content.toLowerCase())
    ).length;
    
    if (formalIndicators > userMessages.length * 0.3) {
      communicationStyle = 'formal';
    } else if (technicalTerms > userMessages.length * 0.3) {
      communicationStyle = 'technical';
    }
    
    // Determine preferred response length
    let responseLength: LearnedPreferences['responseLength'] = 'detailed';
    if (avgLength < 100) {
      responseLength = 'brief';
    } else if (avgLength > 300) {
      responseLength = 'comprehensive';
    }
    
    return {
      communicationStyle,
      responseLength,
      preferredMetrics: ['CO2e', 'energy consumption'], // Would analyze from content
      domainInterests: ['emissions tracking', 'compliance'], // Would extract from topics
      interactionPatterns: {
        sessionDuration: Math.ceil(messages.length * 2), // Rough estimate
        topQuestionTypes: ['analysis', 'reporting'] // Would categorize questions
      }
    };
  }

  /**
   * Aggregate preferences from multiple conversations
   */
  private aggregatePreferences(conversations: any[]): LearnedPreferences {
    if (conversations.length === 0) {
      return {
        communicationStyle: 'formal' as const,
        responseLength: 'detailed',
        preferredMetrics: [],
        domainInterests: [],
        interactionPatterns: {
          sessionDuration: 30,
          topQuestionTypes: []
        }
      };
    }
    
    // Simple aggregation - would be more sophisticated in production
    const styles = conversations.map(c => c.preferences?.communicationStyle).filter(Boolean);
    const lengths = conversations.map(c => c.preferences?.responseLength).filter(Boolean);
    
    const mostCommonStyle = this.getMostCommon(styles) || 'professional';
    const mostCommonLength = this.getMostCommon(lengths) || 'detailed';
    
    return {
      communicationStyle: mostCommonStyle,
      responseLength: mostCommonLength,
      preferredMetrics: ['emissions', 'energy'], // Would aggregate from all conversations
      domainInterests: ['sustainability', 'compliance'],
      interactionPatterns: {
        sessionDuration: conversations.reduce((sum, c) => sum + (c.metadata?.duration || 30), 0) / conversations.length,
        topQuestionTypes: ['analysis', 'reporting']
      }
    };
  }

  /**
   * Merge entities from multiple sources
   */
  private mergeEntities(existing: ExtractedEntity[], newEntities: ExtractedEntity[]): ExtractedEntity[] {
    const merged = [...existing];
    
    newEntities.forEach(newEntity => {
      const existingIndex = merged.findIndex(e => e.value === newEntity.value && e.type === newEntity.type);
      if (existingIndex >= 0) {
        merged[existingIndex].mentions += 1;
        merged[existingIndex].confidence = Math.max(merged[existingIndex].confidence, newEntity.confidence);
      } else {
        merged.push(newEntity);
      }
    });
    
    return merged;
  }

  /**
   * Merge sentiment analysis
   */
  private mergeSentiment(existing: ConversationSentiment, newSentiment: ConversationSentiment): ConversationSentiment {
    return {
      overall: newSentiment.overall, // Use latest overall sentiment
      confidence: (existing.confidence + newSentiment.confidence) / 2,
      progression: [...existing.progression, ...newSentiment.progression]
    };
  }

  /**
   * Get most common value from array
   */
  private getMostCommon<T>(items: T[]): T | null {
    if (items.length === 0) return null;
    
    const counts = items.reduce((acc, item) => {
      acc[item as string] = (acc[item as string] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b) as T;
  }

  /**
   * Retrieve memory for a conversation (alias for getConversationMemory)
   */
  async retrieveMemory(conversationId: string): Promise<ConversationMemory | null> {
    return this.getConversationMemory(conversationId);
  }

  /**
   * Clear memory for a conversation
   */
  async clearMemory(conversationId: string): Promise<boolean> {
    const supabase = createClient();
    
    try {
      const { error } = await supabase
        .from('conversation_memories')
        .delete()
        .eq('id', conversationId);
      
      if (error) throw error;
      
      // Clear cache
      await aiCache.delete(`${this.cacheKeyPrefix}:${conversationId}`);
      
      return true;
    } catch (error) {
      console.error('Error clearing memory:', error);
      return false;
    }
  }

  /**
   * Update user preferences
   */
  async updatePreferences(userId: string, preferences: Partial<LearnedPreferences>): Promise<LearnedPreferences> {
    const supabase = createClient();
    const cacheKey = `${this.cacheKeyPrefix}:preferences:${userId}`;
    
    try {
      // Get existing preferences
      const existing = await this.getUserPreferences(userId);
      
      // Merge with new preferences
      const updated: LearnedPreferences = {
        ...existing,
        ...preferences,
        interactionPatterns: {
          ...existing.interactionPatterns,
          ...(preferences.interactionPatterns || {})
        }
      };
      
      // Update all conversations for this user
      const { error } = await supabase
        .from('conversation_memories')
        .update({ preferences: updated })
        .eq('user_id', userId);
      
      if (error) throw error;
      
      // Update cache
      await aiCache.set(cacheKey, updated, { ttl: 86400 });
      
      return updated;
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw new Error('Failed to update preferences');
    }
  }

  /**
   * Clean up old conversation memories
   */
  async cleanupOldMemories(): Promise<number> {
    const supabase = createClient();
    const cutoffDate = new Date(Date.now() - this.maxContextAge);
    
    try {
      const { data, error } = await supabase
        .from('conversation_memories')
        .delete()
        .lt('updated_at', cutoffDate.toISOString());
      
      if (error) throw error;
      
      return data?.length || 0;
    } catch (error) {
      console.error('Error cleaning up old memories:', error);
      return 0;
    }
  }

  /**
   * Get memory statistics
   */
  async getMemoryStats(userId?: string): Promise<{
    totalConversations: number;
    avgConversationLength: number;
    topTopics: string[];
    memoryUsage: number;
  }> {
    const supabase = createClient();
    
    try {
      let query = supabase
        .from('conversation_memories')
        .select('metadata, key_topics');
      
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const conversations = data || [];
      const avgLength = conversations.reduce((sum, conv) => 
        sum + (conv.metadata?.totalMessages || 0), 0) / conversations.length;
      
      const allTopics = conversations.flatMap(conv => conv.key_topics || []);
      const topicCounts = allTopics.reduce((acc, topic) => {
        acc[topic] = (acc[topic] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const topTopics = Object.entries(topicCounts)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 10)
        .map(([topic]) => topic);
      
      return {
        totalConversations: conversations.length,
        avgConversationLength: Math.round(avgLength),
        topTopics,
        memoryUsage: JSON.stringify(conversations).length // Rough estimate
      };
      
    } catch (error) {
      console.error('Error getting memory stats:', error);
      return {
        totalConversations: 0,
        avgConversationLength: 0,
        topTopics: [],
        memoryUsage: 0
      };
    }
  }
}

// Export singleton instance
export const conversationMemoryManager = new ConversationMemoryManager();