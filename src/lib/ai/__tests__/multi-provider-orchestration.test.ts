import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { AIService } from '../service';
import { DeepSeekProvider } from '../providers/deepseek';
import { OpenAIProvider } from '../providers/openai';
import { AnthropicProvider } from '../providers/anthropic';

jest.mock('../providers/deepseek');
jest.mock('../providers/openai');
jest.mock('../providers/anthropic');

describe('Multi-Provider AI Orchestration', () => {
  let aiService: AIService;
  let mockDeepSeek: jest.Mocked<DeepSeekProvider>;
  let mockOpenAI: jest.Mocked<OpenAIProvider>;
  let mockAnthropic: jest.Mocked<AnthropicProvider>;

  beforeEach(() => {
    aiService = new AIService();
    mockDeepSeek = new DeepSeekProvider() as jest.Mocked<DeepSeekProvider>;
    mockOpenAI = new OpenAIProvider() as jest.Mocked<OpenAIProvider>;
    mockAnthropic = new AnthropicProvider() as jest.Mocked<AnthropicProvider>;
  });

  describe('Provider Fallback', () => {
    it('should fallback to OpenAI when DeepSeek fails', async () => {
      mockDeepSeek.chat.mockRejectedValue(new Error('DeepSeek unavailable'));
      mockOpenAI.chat.mockResolvedValue({
        content: 'Response from OpenAI',
        model: 'gpt-4'
      });

      const response = await aiService.chat({
        messages: [{ role: 'user', content: 'Hello' }]
      });

      expect(response.content).toBe('Response from OpenAI');
      expect(mockDeepSeek.chat).toHaveBeenCalled();
      expect(mockOpenAI.chat).toHaveBeenCalled();
      expect(mockAnthropic.chat).not.toHaveBeenCalled();
    });

    it('should fallback to Anthropic when both DeepSeek and OpenAI fail', async () => {
      mockDeepSeek.chat.mockRejectedValue(new Error('DeepSeek unavailable'));
      mockOpenAI.chat.mockRejectedValue(new Error('OpenAI unavailable'));
      mockAnthropic.chat.mockResolvedValue({
        content: 'Response from Anthropic',
        model: 'claude-3'
      });

      const response = await aiService.chat({
        messages: [{ role: 'user', content: 'Hello' }]
      });

      expect(response.content).toBe('Response from Anthropic');
      expect(mockAnthropic.chat).toHaveBeenCalled();
    });

    it('should throw error when all providers fail', async () => {
      mockDeepSeek.chat.mockRejectedValue(new Error('Failed'));
      mockOpenAI.chat.mockRejectedValue(new Error('Failed'));
      mockAnthropic.chat.mockRejectedValue(new Error('Failed'));

      await expect(aiService.chat({
        messages: [{ role: 'user', content: 'Hello' }]
      })).rejects.toThrow('All AI providers failed');
    });
  });

  describe('Provider Selection', () => {
    it('should select provider based on task type', async () => {
      // Code generation should prefer DeepSeek
      await aiService.chat({
        messages: [{ role: 'user', content: 'Write a Python function' }],
        metadata: { taskType: 'code_generation' }
      });

      expect(mockDeepSeek.chat).toHaveBeenCalled();

      // Creative writing should prefer Anthropic
      await aiService.chat({
        messages: [{ role: 'user', content: 'Write a story' }],
        metadata: { taskType: 'creative_writing' }
      });

      expect(mockAnthropic.chat).toHaveBeenCalled();
    });

    it('should handle streaming responses', async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield { delta: 'Hello' };
          yield { delta: ' world' };
        }
      };

      mockDeepSeek.streamChat.mockResolvedValue(mockStream);

      const stream = await aiService.streamChat({
        messages: [{ role: 'user', content: 'Hello' }]
      });

      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(chunk.delta);
      }

      expect(chunks).toEqual(['Hello', ' world']);
    });
  });

  describe('Cost Optimization', () => {
    it('should track token usage across providers', async () => {
      mockDeepSeek.chat.mockResolvedValue({
        content: 'Response',
        usage: { prompt_tokens: 10, completion_tokens: 20 }
      });

      await aiService.chat({
        messages: [{ role: 'user', content: 'Hello' }]
      });

      const usage = aiService.getTokenUsage();
      expect(usage.deepseek.total).toBe(30);
      expect(usage.totalCost).toBeGreaterThan(0);
    });

    it('should switch providers based on rate limits', async () => {
      // Simulate rate limit on DeepSeek
      aiService.setRateLimit('deepseek', { remaining: 0 });

      await aiService.chat({
        messages: [{ role: 'user', content: 'Hello' }]
      });

      expect(mockDeepSeek.chat).not.toHaveBeenCalled();
      expect(mockOpenAI.chat).toHaveBeenCalled();
    });
  });
});