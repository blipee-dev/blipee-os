/**
 * Blipee Assistant Conversation Manager
 * Manages conversation state, history, and context persistence
 */

import { ConversationState, AssistantResponse, CompleteContext } from './types';
import { createClient } from '@/lib/supabase/server';

// Helper function to generate unique IDs
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export class ConversationManager {
  private conversationId: string;
  private userId: string;
  private organizationId: string;

  constructor(conversationId: string, userId: string, organizationId: string) {
    this.conversationId = conversationId;
    this.userId = userId;
    this.organizationId = organizationId;
  }

  /**
   * Initialize or load conversation state
   */
  async initializeConversation(context: CompleteContext): Promise<ConversationState> {
    // Try to load existing conversation
    let state = await this.loadConversationState();

    if (!state) {
      // Create new conversation state
      state = {
        id: this.conversationId,
        topic: undefined,
        depth: 0,
        clarificationsNeeded: [],
        suggestedActions: [],
        userSatisfaction: undefined,
        context,
        history: []
      };

      await this.saveConversationState(state);
    }

    return state;
  }

  /**
   * Load conversation state from cache or database
   */
  async loadConversationState(): Promise<ConversationState | null> {
    try {
      // Skip cache for now - Redis not configured
      // const cached = await cache.get(`conversation:${this.conversationId}`);
      // if (cached) {
      //   return JSON.parse(cached);
      // }

      // Load from database
      const supabase = createClient();
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', this.conversationId)
        .single();

      if (error || !data) return null;

      const state: ConversationState = {
        id: data.id,
        topic: data.metadata?.topic,
        depth: data.metadata?.depth || 0,
        clarificationsNeeded: data.metadata?.clarificationsNeeded || [],
        suggestedActions: data.metadata?.suggestedActions || [],
        userSatisfaction: data.metadata?.userSatisfaction,
        context: data.metadata?.context,
        history: data.messages || []
      };

      // Cache for quick access
      await this.cacheConversationState(state);

      return state;
    } catch (error) {
      console.error('Error loading conversation state:', error);
      return null;
    }
  }

  /**
   * Save conversation state
   */
  async saveConversationState(state: ConversationState): Promise<void> {
    try {
      // Save to cache
      await this.cacheConversationState(state);

      // Save to database
      const supabase = createClient();
      await supabase
        .from('conversations')
        .upsert({
          id: state.id,
          user_id: this.userId,
          organization_id: this.organizationId,
          messages: state.history,
          metadata: {
            topic: state.topic,
            depth: state.depth,
            clarificationsNeeded: state.clarificationsNeeded,
            suggestedActions: state.suggestedActions,
            userSatisfaction: state.userSatisfaction,
            context: state.context
          },
          updated_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error saving conversation state:', error);
    }
  }

  /**
   * Cache conversation state
   */
  private async cacheConversationState(state: ConversationState): Promise<void> {
    // Skip cache for now - Redis not configured
    // await cache.set(
    //   `conversation:${this.conversationId}`,
    //   JSON.stringify(state),
    //   300 // 5 minutes TTL
    // );
  }

  /**
   * Add message to conversation history
   */
  async addToHistory(
    message: string,
    response: AssistantResponse,
    context: CompleteContext
  ): Promise<ConversationState> {
    const state = await this.loadConversationState() || await this.initializeConversation(context);

    // Update state
    state.depth += 1;
    state.history.push(response);
    state.context = context;
    state.suggestedActions = response.actions || [];

    // Infer topic if not set
    if (!state.topic && state.depth === 1) {
      state.topic = this.inferTopic(message, response);
    }

    // Update clarifications
    state.clarificationsNeeded = this.extractClarifications(response);

    // Save updated state
    await this.saveConversationState(state);

    // Update user activity tracking
    await this.updateUserActivity(message, response);

    return state;
  }

  /**
   * Infer conversation topic
   */
  private inferTopic(message: string, response: AssistantResponse): string {
    const intent = response.metadata.intent.primary;

    const topicMap: Record<string, string> = {
      data_entry: 'Data Entry and Validation',
      compliance_check: 'Compliance and Standards',
      analysis: 'Performance Analysis',
      optimization: 'Optimization Opportunities',
      reporting: 'Report Generation',
      learning: 'Learning and Education',
      configuration: 'System Configuration',
      troubleshooting: 'Troubleshooting'
    };

    return topicMap[intent] || 'General Inquiry';
  }

  /**
   * Extract clarifications needed from response
   */
  private extractClarifications(response: AssistantResponse): string[] {
    const clarifications: string[] = [];

    // Check for low confidence
    if (response.metadata.confidence < 0.7) {
      clarifications.push('Please provide more details for accurate assistance');
    }

    // Check for missing entities
    if (response.metadata.intent.entities.length === 0) {
      switch (response.metadata.intent.primary) {
        case 'analysis':
          clarifications.push('Which metrics would you like to analyze?');
          break;
        case 'reporting':
          clarifications.push('What type of report do you need?');
          break;
        case 'optimization':
          clarifications.push('Which area would you like to optimize?');
          break;
      }
    }

    return clarifications;
  }

  /**
   * Update user activity tracking
   */
  private async updateUserActivity(message: string, response: AssistantResponse): Promise<void> {
    // Skip cache for now - Redis not configured
    // User activity tracking will be done in the database in future
    try {
      // TODO: Implement user activity tracking via database
    } catch (error) {
      console.error('Error updating user activity:', error);
    }
  }

  /**
   * Get conversation summary
   */
  async getConversationSummary(): Promise<string> {
    const state = await this.loadConversationState();
    if (!state) return 'No conversation history';

    const summary = `
Topic: ${state.topic || 'General Discussion'}
Messages: ${state.depth}
Satisfaction: ${state.userSatisfaction ? `${state.userSatisfaction}/5` : 'Not rated'}
Last Intent: ${state.history[state.history.length - 1]?.metadata.intent.primary || 'Unknown'}
Agents Used: ${state.history.flatMap(h => h.metadata.agentsUsed).join(', ')}
    `.trim();

    return summary;
  }

  /**
   * Record user feedback
   */
  async recordFeedback(satisfaction: number, feedback?: string): Promise<void> {
    const state = await this.loadConversationState();
    if (!state) return;

    state.userSatisfaction = satisfaction;

    // Save feedback to database
    const supabase = createClient();
    await supabase
      .from('feedback')
      .insert({
        id: generateId(),
        conversation_id: this.conversationId,
        user_id: this.userId,
        organization_id: this.organizationId,
        satisfaction,
        feedback,
        created_at: new Date().toISOString()
      });

    await this.saveConversationState(state);
  }

  /**
   * Get suggested follow-up questions
   */
  async getSuggestedQuestions(state: ConversationState): Promise<string[]> {
    const suggestions: string[] = [];

    // Based on last intent
    const lastIntent = state.history[state.history.length - 1]?.metadata.intent.primary;

    const followUpMap: Record<string, string[]> = {
      analysis: [
        'Can you compare this to last month?',
        'What are the main drivers of this trend?',
        'Show me the breakdown by site'
      ],
      optimization: [
        'What would be the ROI of these changes?',
        'How quickly can we implement this?',
        'Are there any risks to consider?'
      ],
      compliance: [
        'Which standards are we not meeting?',
        'What documents do we need?',
        'When is the next audit?'
      ],
      reporting: [
        'Can you add more metrics to this report?',
        'Schedule this report monthly',
        'Who should receive this report?'
      ]
    };

    if (lastIntent && followUpMap[lastIntent]) {
      suggestions.push(...followUpMap[lastIntent].slice(0, 3));
    }

    // Add clarifications if needed
    if (state.clarificationsNeeded.length > 0) {
      suggestions.unshift(...state.clarificationsNeeded.slice(0, 2));
    }

    return suggestions.slice(0, 4);
  }

  /**
   * Check if conversation needs human handoff
   */
  shouldEscalate(state: ConversationState): boolean {
    // Escalate if:
    // 1. User satisfaction is very low
    if (state.userSatisfaction && state.userSatisfaction < 2) return true;

    // 2. Too many clarifications needed
    if (state.clarificationsNeeded.length > 3) return true;

    // 3. Conversation depth exceeds threshold without resolution
    if (state.depth > 10 && !state.userSatisfaction) return true;

    // 4. Low confidence responses
    const avgConfidence = state.history.reduce(
      (sum, h) => sum + h.metadata.confidence,
      0
    ) / (state.history.length || 1);

    if (avgConfidence < 0.5) return true;

    return false;
  }

  /**
   * Clear conversation
   */
  async clearConversation(): Promise<void> {
    // Skip cache for now - Redis not configured
    // await cache.del(`conversation:${this.conversationId}`);

    const supabase = createClient();
    await supabase
      .from('conversations')
      .delete()
      .eq('id', this.conversationId);
  }

  /**
   * Export conversation
   */
  async exportConversation(): Promise<any> {
    const state = await this.loadConversationState();
    if (!state) return null;

    return {
      id: state.id,
      topic: state.topic,
      depth: state.depth,
      satisfaction: state.userSatisfaction,
      messages: state.history.map(h => ({
        message: h.message,
        intent: h.metadata.intent.primary,
        confidence: h.metadata.confidence,
        agents: h.metadata.agentsUsed,
        timestamp: new Date().toISOString()
      })),
      summary: await this.getConversationSummary()
    };
  }
}