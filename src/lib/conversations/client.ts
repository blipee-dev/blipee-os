/**
 * Client-side conversation service
 * Uses API routes instead of direct database access
 */

import { Message } from '@/types/conversation';

export class ConversationClient {
  private static async fetchWithAuth(url: string, options?: RequestInit) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
    const userId = typeof window !== 'undefined' ? localStorage.getItem('user-id') : null;

    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token || '',
        'x-user-id': userId || '',
        ...options?.headers,
      },
      credentials: 'include',
    });
  }

  static async getUserConversations() {
    const response = await this.fetchWithAuth('/api/conversations');
    if (!response.ok) throw new Error('Failed to fetch conversations');
    const data = await response.json();
    return data.conversations;
  }

  static async createConversation(buildingId?: string) {
    const response = await this.fetchWithAuth('/api/conversations', {
      method: 'POST',
      body: JSON.stringify({ buildingId }),
    });
    if (!response.ok) throw new Error('Failed to create conversation');
    const data = await response.json();
    return data.conversation;
  }

  static async updateMessages(conversationId: string, messages: Message[]) {
    const response = await this.fetchWithAuth(`/api/conversations/${conversationId}`, {
      method: 'PATCH',
      body: JSON.stringify({ messages }),
    });
    if (!response.ok) throw new Error('Failed to update messages');
    const data = await response.json();
    return data.conversation;
  }

  static async updateContext(conversationId: string, context: Record<string, any>) {
    const response = await this.fetchWithAuth(`/api/conversations/${conversationId}`, {
      method: 'PATCH',
      body: JSON.stringify({ context }),
    });
    if (!response.ok) throw new Error('Failed to update context');
    const data = await response.json();
    return data.conversation;
  }

  static async deleteConversation(conversationId: string) {
    const response = await this.fetchWithAuth(`/api/conversations/${conversationId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete conversation');
    return true;
  }
}