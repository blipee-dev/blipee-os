/**
 * Database persistence for conversations
 * Replaces localStorage with proper Supabase storage
 */

import { createClient } from '@supabase/supabase-js';
import { Message } from '@/types/conversation';
import { Database } from '@/types/supabase';

// Initialize Supabase client
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface ConversationData {
  id: string;
  user_id: string;
  building_id?: string;
  messages: Message[];
  context: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export class ConversationDatabase {
  /**
   * Create a new conversation
   */
  static async create(userId: string, buildingId?: string): Promise<ConversationData> {
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        building_id: buildingId,
        messages: [],
        context: {}
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get all conversations for a user
   */
  static async getUserConversations(userId: string): Promise<ConversationData[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get a specific conversation
   */
  static async getConversation(conversationId: string): Promise<ConversationData | null> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (error) {
      console.error('Error fetching conversation:', error);
      return null;
    }
    return data;
  }

  /**
   * Update conversation messages
   */
  static async updateMessages(
    conversationId: string,
    messages: Message[]
  ): Promise<ConversationData> {
    const { data, error } = await supabase
      .from('conversations')
      .update({
        messages,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update conversation context (for AI memory)
   */
  static async updateContext(
    conversationId: string,
    context: Record<string, any>
  ): Promise<ConversationData> {
    const { data, error } = await supabase
      .from('conversations')
      .update({
        context,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a conversation
   */
  static async delete(conversationId: string): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId);

    if (error) throw error;
  }

  /**
   * Save conversation memory for AI context
   */
  static async saveMemory(
    organizationId: string,
    userId: string,
    summary: string,
    keyTopics: string[],
    preferences?: Record<string, any>
  ): Promise<void> {
    const { error } = await supabase
      .from('conversation_memories')
      .upsert({
        organization_id: organizationId,
        user_id: userId,
        summary,
        key_topics: keyTopics,
        preferences: preferences || {},
        updated_at: new Date().toISOString()
      });

    if (error) console.error('Error saving conversation memory:', error);
  }

  /**
   * Get conversation memory for context building
   */
  static async getMemory(organizationId: string, userId: string) {
    const { data } = await supabase
      .from('conversation_memories')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    return data;
  }

  /**
   * Real-time subscription to conversation updates
   */
  static subscribeToConversation(
    conversationId: string,
    callback: (payload: any) => void
  ) {
    return supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `id=eq.${conversationId}`
        },
        callback
      )
      .subscribe();
  }
}