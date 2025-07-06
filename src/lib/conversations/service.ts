import { createClient } from '@/lib/supabase/client'
import { Message } from '@/types/conversation'
import type { Database } from '@/types/supabase'
import { messagesToJson } from './utils'

export type ConversationRow = Database['public']['Tables']['conversations']['Row']
export type ConversationInsert = Database['public']['Tables']['conversations']['Insert']
export type ConversationUpdate = Database['public']['Tables']['conversations']['Update']

export class ConversationService {
  private supabase = createClient()

  /**
   * Create a new conversation
   */
  async createConversation(buildingId?: string): Promise<string | null> {
    const { data: userData } = await this.supabase.auth.getUser()
    
    const { data, error } = await this.supabase
      .from('conversations')
      .insert({
        user_id: userData?.user?.id,
        building_id: buildingId,
        messages: [],
        context: {}
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error creating conversation:', error)
      return null
    }

    return data.id
  }

  /**
   * Get conversation by ID
   */
  async getConversation(conversationId: string): Promise<ConversationRow | null> {
    const { data, error } = await this.supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single()

    if (error) {
      console.error('Error fetching conversation:', error)
      return null
    }

    return data
  }

  /**
   * Get all conversations for the current user
   */
  async getUserConversations(): Promise<ConversationRow[]> {
    const { data: userData } = await this.supabase.auth.getUser()
    
    if (!userData?.user) {
      return []
    }

    const { data, error } = await this.supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userData.user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching conversations:', error)
      return []
    }

    return data || []
  }

  /**
   * Add messages to conversation
   */
  async addMessages(conversationId: string, messages: Message[]): Promise<boolean> {
    const conversation = await this.getConversation(conversationId)
    if (!conversation) return false

    // Parse existing messages safely
    const existingMessages = Array.isArray(conversation.messages) 
      ? (conversation.messages as any[])
      : []
    
    // Convert new messages to JSON format
    const newMessagesJson = messagesToJson(messages)
    
    const updatedMessages = [...existingMessages, ...(newMessagesJson as any[])]

    const { error } = await this.supabase
      .from('conversations')
      .update({
        messages: updatedMessages,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId)

    if (error) {
      console.error('Error updating conversation:', error)
      return false
    }

    return true
  }

  /**
   * Update conversation context
   */
  async updateContext(conversationId: string, context: Record<string, any>): Promise<boolean> {
    const { error } = await this.supabase
      .from('conversations')
      .update({
        context,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId)

    if (error) {
      console.error('Error updating context:', error)
      return false
    }

    return true
  }

  /**
   * Get or create a demo conversation
   */
  async getOrCreateDemoConversation(): Promise<string | null> {
    // For demo, we'll use localStorage to persist the conversation ID
    if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem('demo_conversation_id')
      
      if (storedId) {
        // Verify it still exists
        const conversation = await this.getConversation(storedId)
        if (conversation) {
          return storedId
        }
      }

      // Create new demo conversation
      const newId = await this.createConversation('demo-building')
      if (newId) {
        localStorage.setItem('demo_conversation_id', newId)
      }
      return newId
    }

    return null
  }

  /**
   * Subscribe to conversation updates (real-time)
   */
  subscribeToConversation(
    conversationId: string,
    callback: (payload: any) => void
  ) {
    return this.supabase
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
      .subscribe()
  }
}

// Export singleton instance
export const conversationService = new ConversationService()