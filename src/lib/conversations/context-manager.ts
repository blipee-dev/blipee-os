/**
 * Conversation Context Manager
 *
 * Manages persistent context between messages in a conversation.
 * Part of FASE 2 - Conversation Intelligence
 *
 * Features:
 * - Load/save conversation context
 * - Extract entities, topics, intents from messages
 * - Calculate relevance scores
 * - Automatic context expiration
 * - Token estimation for context size
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface ConversationContext {
  id?: string;
  conversation_id: string;
  organization_id: string;
  user_id: string;
  context_data: {
    current_topic?: string;
    mentioned_entities?: Array<{
      type: string;
      name: string;
      mentions: number;
    }>;
    user_intent?: string;
    recent_actions?: string[];
    key_facts?: string[];
    conversation_stage?: 'greeting' | 'information_gathering' | 'problem_solving' | 'conclusion';
    last_agent_used?: string;
    metadata?: Record<string, any>;
  };
  relevance_score?: number;
  token_estimate?: number;
  expires_at?: string;
  created_at?: string;
  updated_at?: string;
}

export class ConversationContextManager {
  private supabase: SupabaseClient;

  constructor(supabaseUrl?: string, supabaseKey?: string) {
    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    } else {
      // Use environment variables
      this.supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
    }
  }

  /**
   * Get active context for a conversation
   */
  async getContext(conversationId: string): Promise<ConversationContext | null> {
    try {
      const { data, error } = await this.supabase
        .from('conversation_contexts')
        .select('*')
        .eq('conversation_id', conversationId)
        .gt('expires_at', new Date().toISOString())
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching conversation context:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getContext:', error);
      return null;
    }
  }

  /**
   * Update conversation context with new information
   */
  async updateContext(
    conversationId: string,
    userId: string,
    organizationId: string,
    updates: Partial<ConversationContext['context_data']>
  ): Promise<ConversationContext | null> {
    try {
      // Get existing context
      const existingContext = await this.getContext(conversationId);

      let contextData: ConversationContext['context_data'];
      let relevanceScore: number;

      if (existingContext) {
        // Merge with existing context
        contextData = {
          ...existingContext.context_data,
          ...updates,
          mentioned_entities: this.mergeEntities(
            existingContext.context_data.mentioned_entities || [],
            updates.mentioned_entities || []
          ),
          recent_actions: [
            ...(updates.recent_actions || []),
            ...(existingContext.context_data.recent_actions || [])
          ].slice(0, 10), // Keep last 10 actions
          key_facts: [
            ...(existingContext.context_data.key_facts || []),
            ...(updates.key_facts || [])
          ].slice(0, 20), // Keep last 20 facts
        };

        relevanceScore = this.calculateRelevanceScore(contextData);
        const tokenEstimate = this.estimateTokens(contextData);

        // Update existing context
        const { data, error } = await this.supabase
          .from('conversation_contexts')
          .update({
            context_data: contextData,
            relevance_score: relevanceScore,
            token_estimate: tokenEstimate,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Extend by 24 hours
            updated_at: new Date().toISOString()
          })
          .eq('id', existingContext.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating conversation context:', error);
          return null;
        }

        return data;
      } else {
        // Create new context
        contextData = {
          current_topic: updates.current_topic,
          mentioned_entities: updates.mentioned_entities || [],
          user_intent: updates.user_intent,
          recent_actions: updates.recent_actions || [],
          key_facts: updates.key_facts || [],
          conversation_stage: updates.conversation_stage || 'greeting',
          last_agent_used: updates.last_agent_used,
          metadata: updates.metadata || {}
        };

        relevanceScore = this.calculateRelevanceScore(contextData);
        const tokenEstimate = this.estimateTokens(contextData);

        const { data, error } = await this.supabase
          .from('conversation_contexts')
          .insert({
            conversation_id: conversationId,
            user_id: userId,
            organization_id: organizationId,
            context_data: contextData,
            relevance_score: relevanceScore,
            token_estimate: tokenEstimate,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating conversation context:', error);
          return null;
        }

        return data;
      }
    } catch (error) {
      console.error('Error in updateContext:', error);
      return null;
    }
  }

  /**
   * Extract context from a new message
   */
  extractContextFromMessage(message: string): Partial<ConversationContext['context_data']> {
    const context: Partial<ConversationContext['context_data']> = {};

    // Extract entities (simple regex-based extraction)
    const entities: Array<{ type: string; name: string; mentions: number }> = [];

    // Detect mentions of people (capitalized names)
    const peopleMatches = message.match(/\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b/g);
    if (peopleMatches) {
      peopleMatches.forEach(name => {
        if (name.length > 2 && !this.isCommonWord(name)) {
          entities.push({ type: 'person', name, mentions: 1 });
        }
      });
    }

    // Detect common entity types
    if (message.match(/\b(?:company|corporation|inc|ltd|llc)\b/i)) {
      const companyMatch = message.match(/\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\s+(?:company|corporation|inc|ltd|llc)\b/i);
      if (companyMatch) {
        entities.push({ type: 'company', name: companyMatch[1], mentions: 1 });
      }
    }

    if (entities.length > 0) {
      context.mentioned_entities = entities;
    }

    // Detect conversation stage
    if (message.match(/\b(?:hello|hi|hey|good morning|good afternoon)\b/i)) {
      context.conversation_stage = 'greeting';
    } else if (message.match(/\b(?:thank|thanks|appreciate|bye|goodbye)\b/i)) {
      context.conversation_stage = 'conclusion';
    } else if (message.match(/\b(?:how|what|why|when|where|can you|could you)\b/i)) {
      context.conversation_stage = 'information_gathering';
    } else {
      context.conversation_stage = 'problem_solving';
    }

    // Detect user intent
    if (message.match(/\b(?:help|assist|support|need)\b/i)) {
      context.user_intent = 'seeking_help';
    } else if (message.match(/\b(?:report|analytics|data|metrics)\b/i)) {
      context.user_intent = 'requesting_data';
    } else if (message.match(/\b(?:configure|setup|change|update)\b/i)) {
      context.user_intent = 'configuration';
    } else if (message.match(/\b(?:question|wondering|curious)\b/i)) {
      context.user_intent = 'asking_question';
    }

    return context;
  }

  /**
   * Clear expired contexts (cleanup job)
   */
  async clearExpiredContexts(): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .from('conversation_contexts')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select();

      if (error) {
        console.error('Error clearing expired contexts:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Error in clearExpiredContexts:', error);
      return 0;
    }
  }

  /**
   * Get context summary for AI prompt
   */
  getContextSummary(context: ConversationContext | null): string {
    if (!context || !context.context_data) {
      return '';
    }

    const parts: string[] = [];
    const data = context.context_data;

    if (data.current_topic) {
      parts.push(`Current topic: ${data.current_topic}`);
    }

    if (data.user_intent) {
      parts.push(`User intent: ${data.user_intent}`);
    }

    if (data.mentioned_entities && data.mentioned_entities.length > 0) {
      const entitySummary = data.mentioned_entities
        .slice(0, 5)
        .map(e => `${e.name} (${e.type})`)
        .join(', ');
      parts.push(`Mentioned: ${entitySummary}`);
    }

    if (data.key_facts && data.key_facts.length > 0) {
      parts.push(`Key facts: ${data.key_facts.slice(0, 3).join('; ')}`);
    }

    if (data.conversation_stage) {
      parts.push(`Stage: ${data.conversation_stage}`);
    }

    return parts.join('\n');
  }

  /**
   * Merge entity lists, updating mention counts
   */
  private mergeEntities(
    existing: Array<{ type: string; name: string; mentions: number }>,
    newEntities: Array<{ type: string; name: string; mentions: number }>
  ): Array<{ type: string; name: string; mentions: number }> {
    const entityMap = new Map<string, { type: string; name: string; mentions: number }>();

    // Add existing entities
    existing.forEach(entity => {
      const key = `${entity.type}:${entity.name.toLowerCase()}`;
      entityMap.set(key, entity);
    });

    // Merge new entities
    newEntities.forEach(entity => {
      const key = `${entity.type}:${entity.name.toLowerCase()}`;
      const existingEntity = entityMap.get(key);
      if (existingEntity) {
        existingEntity.mentions += entity.mentions;
      } else {
        entityMap.set(key, entity);
      }
    });

    // Return sorted by mention count
    return Array.from(entityMap.values())
      .sort((a, b) => b.mentions - a.mentions)
      .slice(0, 20); // Keep top 20
  }

  /**
   * Calculate relevance score based on context data
   */
  private calculateRelevanceScore(context: ConversationContext['context_data']): number {
    let score = 0.5; // Base score

    if (context.current_topic) score += 0.1;
    if (context.user_intent) score += 0.1;
    if (context.mentioned_entities && context.mentioned_entities.length > 0) {
      score += Math.min(0.2, context.mentioned_entities.length * 0.05);
    }
    if (context.key_facts && context.key_facts.length > 0) {
      score += Math.min(0.1, context.key_facts.length * 0.02);
    }

    return Math.min(1.0, score);
  }

  /**
   * Estimate token count for context (rough approximation)
   */
  private estimateTokens(context: ConversationContext['context_data']): number {
    const jsonString = JSON.stringify(context);
    // Rough approximation: 1 token ≈ 4 characters
    return Math.ceil(jsonString.length / 4);
  }

  /**
   * Check if a word is a common word (not an entity)
   */
  private isCommonWord(word: string): boolean {
    const commonWords = ['The', 'This', 'That', 'These', 'Those', 'What', 'Which', 'Who', 'When', 'Where', 'Why', 'How'];
    return commonWords.includes(word);
  }
}

// Export singleton instance
export const contextManager = new ConversationContextManager();
