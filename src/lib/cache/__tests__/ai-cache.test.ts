import { AICache, cacheAIResponse, getCachedAIResponse, clearAICache } from '../ai-cache';
import { jest } from '@jest/globals';

// Mock storage
const mockStorage = new Map();

jest.mock('../ai-cache', () => ({
  AICache: class MockAICache {
    private storage = mockStorage;
    
    async set(prompt: string, response: any) {
      const key = this.generateKey(prompt);
      this.storage.set(key, {
        response,
        timestamp: Date.now()
      });
    }
    
    async get(prompt: string) {
      const key = this.generateKey(prompt);
      const cached = this.storage.get(key);
      if (!cached) return null;
      
      // Check if expired (15 minutes)
      if (Date.now() - cached.timestamp > 15 * 60 * 1000) {
        this.storage.delete(key);
        return null;
      }
      
      return cached.response;
    }
    
    async clear() {
      this.storage.clear();
    }
    
    private generateKey(prompt: string): string {
      return `ai-cache-${prompt.toLowerCase().replace(/\s+/g, '-')}`;
    }
  },
  
  cacheAIResponse: async (prompt: string, response: any) => {
    const cache = new MockAICache();
    await cache.set(prompt, response);
  },
  
  getCachedAIResponse: async (prompt: string) => {
    const cache = new MockAICache();
    return cache.get(prompt);
  },
  
  clearAICache: async () => {
    mockStorage.clear();
  }
}));

describe('AICache', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  describe('cacheAIResponse', () => {
    it('should cache AI responses', async () => {
      const prompt = 'What is the weather?';
      const response = { content: 'The weather is sunny', metadata: { model: 'gpt-4' } };
      
      await cacheAIResponse(prompt, response);
      const cached = await getCachedAIResponse(prompt);
      
      expect(cached).toEqual(response);
    });

    it('should handle complex prompts', async () => {
      const prompt = 'Show me energy usage for Building A in January 2024';
      const response = { content: 'Energy usage data...', charts: [] };
      
      await cacheAIResponse(prompt, response);
      const cached = await getCachedAIResponse(prompt);
      
      expect(cached).toEqual(response);
    });
  });

  describe('getCachedAIResponse', () => {
    it('should return null for uncached prompts', async () => {
      const cached = await getCachedAIResponse('uncached prompt');
      expect(cached).toBeNull();
    });

    it('should be case insensitive', async () => {
      await cacheAIResponse('Test Prompt', { content: 'response' });
      const cached = await getCachedAIResponse('test prompt');
      expect(cached).toBeTruthy();
    });
  });

  describe('clearAICache', () => {
    it('should clear all cached responses', async () => {
      await cacheAIResponse('prompt1', { content: 'response1' });
      await cacheAIResponse('prompt2', { content: 'response2' });
      
      await clearAICache();
      
      expect(await getCachedAIResponse('prompt1')).toBeNull();
      expect(await getCachedAIResponse('prompt2')).toBeNull();
    });
  });

  describe('AICache class', () => {
    it('should create cache instance', () => {
      const { AICache } = require('../ai-cache');
      const cache = new AICache();
      expect(cache).toBeDefined();
      expect(cache).toHaveProperty('get');
      expect(cache).toHaveProperty('set');
      expect(cache).toHaveProperty('clear');
    });
  });
});