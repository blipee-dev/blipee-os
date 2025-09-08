/**
 * Unit tests for Conversation Memory Manager
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ConversationMemoryManager, ConversationMemory } from '../../conversation-memory';

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ 
            data: {
              id: 'test-memory-id',
              conversation_id: 'test-conversation',
              context: {},
              summary: 'Test summary'
            }, 
            error: null 
          }))
        }))
      })),
      upsert: jest.fn(() => Promise.resolve({ error: null })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  }))
}));

describe('Conversation Memory Manager', () => {
  let memoryManager: ConversationMemoryManager;

  beforeEach(() => {
    jest.clearAllMocks();
    memoryManager = new ConversationMemoryManager();
  });

  describe('Memory Storage', () => {
    it('should store conversation memory', async () => {
      const memory: ConversationMemory = {
        conversationId: 'test-conversation',
        context: {
          topic: 'sustainability',
          goals: ['reduce emissions'],
          entities: ['Company A', 'Scope 1']
        },
        summary: 'Discussion about reducing Scope 1 emissions',
        keyInsights: ['Current emissions: 1000 tons', 'Target: 500 tons'],
        preferences: {
          communicationStyle: 'formal',
          responseLength: 'detailed'
        },
        lastUpdated: new Date()
      };

      await expect(
        memoryManager.saveMemory(memory)
      ).resolves.not.toThrow();
    });

    it('should retrieve conversation memory', async () => {
      const memory = await memoryManager.getConversationMemory('test-conversation');
      
      expect(memory).toBeDefined();
      expect(memory.conversationId).toBe('test-conversation');
      expect(memory.summary).toBe('Test summary');
    });

    it('should handle non-existent conversations', async () => {
      const mockClient = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ 
                data: null, 
                error: { code: 'PGRST116' } 
              }))
            }))
          }))
        }))
      };

      jest.mocked(await import('@/lib/supabase/server')).createClient
        .mockReturnValueOnce(mockClient as any);

      const memory = await memoryManager.getConversationMemory('non-existent');
      expect(memory).toBeNull();
    });
  });

  describe('Context Management', () => {
    it('should update conversation context', async () => {
      const context = {
        currentTopic: 'energy efficiency',
        discussedMetrics: ['kWh', 'cost savings'],
        userGoals: ['20% reduction by 2025']
      };

      await memoryManager.updateContext('test-conversation', context);
      
      const memory = await memoryManager.getConversationMemory('test-conversation');
      expect(memory?.context).toMatchObject(context);
    });

    it('should merge context updates', async () => {
      // First update
      await memoryManager.updateContext('test-conversation', {
        topic: 'emissions',
        scope: 'scope 1'
      });

      // Second update
      await memoryManager.updateContext('test-conversation', {
        target: 'net zero',
        scope: 'scope 1 and 2' // This should override
      });

      const memory = await memoryManager.getConversationMemory('test-conversation');
      expect(memory?.context).toEqual({
        topic: 'emissions',
        scope: 'scope 1 and 2',
        target: 'net zero'
      });
    });
  });

  describe('Summary Generation', () => {
    it('should summarize conversation', async () => {
      const messages = [
        { content: 'What is my carbon footprint?', role: 'user' },
        { content: 'Your carbon footprint is 1000 tons CO2e', role: 'assistant' },
        { content: 'How can I reduce it?', role: 'user' },
        { content: 'Focus on renewable energy and efficiency', role: 'assistant' }
      ];

      const summary = await memoryManager.summarizeConversation('test-conversation', messages);
      
      expect(summary).toBeDefined();
      expect(summary.length).toBeGreaterThan(0);
      expect(summary).toContain('carbon footprint');
    });

    it('should extract key insights', async () => {
      const messages = [
        { content: 'My emissions are 1000 tons', role: 'user' },
        { content: 'That\'s above industry average of 800 tons', role: 'assistant' },
        { content: 'What\'s my biggest source?', role: 'user' },
        { content: 'Transportation accounts for 60%', role: 'assistant' }
      ];

      const insights = await memoryManager.extractKeyInsights(messages);
      
      expect(insights).toBeInstanceOf(Array);
      expect(insights.length).toBeGreaterThan(0);
      expect(insights.some(i => i.includes('1000 tons'))).toBe(true);
      expect(insights.some(i => i.includes('60%'))).toBe(true);
    });
  });

  describe('User Preference Learning', () => {
    it('should learn from user interactions', async () => {
      const userMessage = {
        message: 'Can you be more brief? I prefer short answers.',
        timestamp: new Date().toISOString()
      };

      const assistantResponse = {
        message: 'Of course! I\'ll keep my responses concise.',
        timestamp: new Date().toISOString()
      };

      await memoryManager.learnFromInteraction(
        'test-user',
        'test-conversation',
        userMessage,
        assistantResponse
      );

      const preferences = await memoryManager.getUserPreferences('test-user');
      expect(preferences?.responseLength).toBe('brief');
    });

    it('should identify communication style preferences', async () => {
      const interactions = [
        {
          user: { message: 'Please explain in technical terms', timestamp: new Date().toISOString() },
          assistant: { message: 'Here\'s a technical breakdown...', timestamp: new Date().toISOString() }
        },
        {
          user: { message: 'I need detailed technical specifications', timestamp: new Date().toISOString() },
          assistant: { message: 'Technical specifications are...', timestamp: new Date().toISOString() }
        }
      ];

      for (const interaction of interactions) {
        await memoryManager.learnFromInteraction(
          'test-user',
          'test-conversation',
          interaction.user,
          interaction.assistant
        );
      }

      const preferences = await memoryManager.getUserPreferences('test-user');
      expect(preferences?.communicationStyle).toBe('technical');
    });

    it('should track domain interests', async () => {
      const topics = [
        'renewable energy',
        'solar panels',
        'wind turbines',
        'energy storage'
      ];

      for (const topic of topics) {
        await memoryManager.learnFromInteraction(
          'test-user',
          'test-conversation',
          { message: `Tell me about ${topic}`, timestamp: new Date().toISOString() },
          { message: `Information about ${topic}...`, timestamp: new Date().toISOString() }
        );
      }

      const preferences = await memoryManager.getUserPreferences('test-user');
      expect(preferences?.domainFocus).toContain('renewable energy');
    });
  });

  describe('Memory Cleanup', () => {
    it('should clear conversation memory', async () => {
      // Store some memory
      await memoryManager.saveMemory({
        conversationId: 'test-conversation',
        context: { test: true },
        summary: 'Test',
        lastUpdated: new Date()
      });

      // Clear it
      await memoryManager.clearMemory('test-conversation');

      // Mock the cleared response
      jest.mocked(await import('@/lib/supabase/server')).createClient
        .mockReturnValueOnce({
          from: jest.fn(() => ({
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => Promise.resolve({ data: null, error: null }))
              }))
            }))
          }))
        } as any);

      const memory = await memoryManager.getConversationMemory('test-conversation');
      expect(memory).toBeNull();
    });

    it('should handle cleanup errors gracefully', async () => {
      const mockClient = {
        from: jest.fn(() => ({
          delete: jest.fn(() => ({
            eq: jest.fn(() => Promise.resolve({ 
              error: { message: 'Database error' } 
            }))
          }))
        }))
      };

      jest.mocked(await import('@/lib/supabase/server')).createClient
        .mockReturnValueOnce(mockClient as any);

      await expect(
        memoryManager.clearMemory('test-conversation')
      ).rejects.toThrow('Database error');
    });
  });

  describe('Memory Retrieval Strategies', () => {
    it('should get recent memories', async () => {
      const recentMemories = await memoryManager.getRecentMemories('test-user', 5);
      
      expect(recentMemories).toBeInstanceOf(Array);
      expect(recentMemories.length).toBeLessThanOrEqual(5);
    });

    it('should search memories by topic', async () => {
      const topicMemories = await memoryManager.searchMemoriesByTopic(
        'test-user',
        'sustainability'
      );
      
      expect(topicMemories).toBeInstanceOf(Array);
      // All returned memories should relate to the topic
      topicMemories.forEach(memory => {
        const hasTopicInContext = JSON.stringify(memory.context).includes('sustainability');
        const hasTopicInSummary = memory.summary?.includes('sustainability');
        expect(hasTopicInContext || hasTopicInSummary).toBe(true);
      });
    });
  });
});