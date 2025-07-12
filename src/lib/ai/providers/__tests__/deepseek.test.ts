import { DeepSeekProvider } from '../deepseek';
import OpenAI from 'openai';
import { CompletionOptions, StreamOptions } from '../../types';

// Mock the OpenAI module
jest.mock('openai');

describe('DeepSeekProvider', () => {
  let provider: DeepSeekProvider;
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    };

    (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => mockClient);
    provider = new DeepSeekProvider('test-api-key');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with API key and correct base URL', () => {
      expect(OpenAI).toHaveBeenCalledWith({
        apiKey: 'test-api-key',
        baseURL: 'https://api.deepseek.com/v1',
      });
      expect(provider.name).toBe('DeepSeek');
    });
  });

  describe('complete', () => {
    it('should call DeepSeek API with correct parameters', async () => {
      const mockResponse = {
        choices: [{
          message: { content: 'DeepSeek response' },
        }],
        usage: {
          prompt_tokens: 15,
          completion_tokens: 25,
          total_tokens: 40,
        },
        model: 'deepseek-chat',
      };

      mockClient.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await provider.complete('Test prompt');

      expect(mockClient.chat.completions.create).toHaveBeenCalledWith({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: 'Test prompt' }],
        temperature: 0.7,
        max_tokens: 1000,
      });

      expect(result).toEqual({
        content: 'DeepSeek response',
        usage: {
          promptTokens: 15,
          completionTokens: 25,
          totalTokens: 40,
        },
        model: 'deepseek-chat',
      });
    });

    it('should include system prompt when provided', async () => {
      const options: CompletionOptions = {
        systemPrompt: 'You are a sustainability expert',
        temperature: 0.8,
        maxTokens: 1500,
      };

      mockClient.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: 'Expert response' } }],
        model: 'deepseek-chat',
      });

      await provider.complete('Analyze emissions', options);

      expect(mockClient.chat.completions.create).toHaveBeenCalledWith({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are a sustainability expert' },
          { role: 'user', content: 'Analyze emissions' },
        ],
        temperature: 0.8,
        max_tokens: 1500,
      });
    });

    it('should handle empty response content', async () => {
      mockClient.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: null } }],
        model: 'deepseek-chat',
      });

      const result = await provider.complete('Test prompt');

      expect(result.content).toBe('');
    });

    it('should handle missing usage data', async () => {
      mockClient.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: 'Response' } }],
        model: 'deepseek-chat',
        usage: null,
      });

      const result = await provider.complete('Test prompt');

      expect(result.usage).toBeUndefined();
    });

    it('should throw error on API failure', async () => {
      mockClient.chat.completions.create.mockRejectedValue(
        new Error('DeepSeek API Error')
      );

      await expect(provider.complete('Test prompt')).rejects.toThrow('DeepSeek API Error');
    });

    it('should use default values when options not provided', async () => {
      mockClient.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: 'Default response' } }],
        model: 'deepseek-chat',
      });

      await provider.complete('Test prompt');

      expect(mockClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.7,
          max_tokens: 1000,
        })
      );
    });
  });

  describe('stream', () => {
    it('should stream tokens correctly', async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield { choices: [{ delta: { content: 'Deep' } }] };
          yield { choices: [{ delta: { content: 'Seek' } }] };
          yield { choices: [{ delta: { content: ' streaming' } }] };
        },
      };

      mockClient.chat.completions.create.mockResolvedValue(mockStream);

      const tokens: string[] = [];
      for await (const token of provider.stream('Test prompt')) {
        if (!token.isComplete) {
          tokens.push(token.content);
        }
      }

      expect(tokens).toEqual(['Deep', 'Seek', ' streaming']);
      expect(mockClient.chat.completions.create).toHaveBeenCalledWith({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: 'Test prompt' }],
        temperature: 0.7,
        max_tokens: 1000,
        stream: true,
      });
    });

    it('should call onToken callback when provided', async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield { choices: [{ delta: { content: 'First' } }] };
          yield { choices: [{ delta: { content: ' token' } }] };
        },
      };

      mockClient.chat.completions.create.mockResolvedValue(mockStream);

      const onToken = jest.fn();
      const options: StreamOptions = { onToken };

      const tokens: string[] = [];
      for await (const token of provider.stream('Test prompt', options)) {
        if (!token.isComplete) {
          tokens.push(token.content);
        }
      }

      expect(onToken).toHaveBeenCalledTimes(2);
      expect(onToken).toHaveBeenCalledWith('First');
      expect(onToken).toHaveBeenCalledWith(' token');
    });

    it('should include system prompt in streaming', async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield { choices: [{ delta: { content: 'Streamed' } }] };
        },
      };

      mockClient.chat.completions.create.mockResolvedValue(mockStream);

      const options: StreamOptions = {
        systemPrompt: 'Stream with context',
        temperature: 0.6,
        maxTokens: 800,
      };

      const generator = provider.stream('Test prompt', options);
      await generator.next();

      expect(mockClient.chat.completions.create).toHaveBeenCalledWith({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'Stream with context' },
          { role: 'user', content: 'Test prompt' },
        ],
        temperature: 0.6,
        max_tokens: 800,
        stream: true,
      });
    });

    it('should handle empty content in stream chunks', async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield { choices: [{ delta: { content: 'Start' } }] };
          yield { choices: [{ delta: { content: '' } }] };
          yield { choices: [{ delta: { content: null } }] };
          yield { choices: [{ delta: {} }] };
          yield { choices: [{ delta: { content: 'End' } }] };
        },
      };

      mockClient.chat.completions.create.mockResolvedValue(mockStream);

      const tokens: string[] = [];
      for await (const token of provider.stream('Test prompt')) {
        if (!token.isComplete && token.content) {
          tokens.push(token.content);
        }
      }

      expect(tokens).toEqual(['Start', 'End']);
    });

    it('should yield completion token at the end', async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield { choices: [{ delta: { content: 'Content' } }] };
        },
      };

      mockClient.chat.completions.create.mockResolvedValue(mockStream);

      const tokens = [];
      for await (const token of provider.stream('Test prompt')) {
        tokens.push(token);
      }

      expect(tokens).toHaveLength(2);
      expect(tokens[0]).toEqual({ content: 'Content', isComplete: false });
      expect(tokens[1]).toEqual({ content: '', isComplete: true });
    });

    it('should handle stream errors', async () => {
      mockClient.chat.completions.create.mockRejectedValue(
        new Error('Stream error')
      );

      const generator = provider.stream('Test prompt');
      await expect(generator.next()).rejects.toThrow('Stream error');
    });

    it('should handle errors during streaming', async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield { choices: [{ delta: { content: 'Before error' } }] };
          throw new Error('Streaming interrupted');
        },
      };

      mockClient.chat.completions.create.mockResolvedValue(mockStream);

      const generator = provider.stream('Test prompt');

      // First token should work
      const firstToken = await generator.next();
      expect(firstToken.value).toEqual({ content: 'Before error', isComplete: false });

      // Next iteration should throw
      await expect(generator.next()).rejects.toThrow('Streaming interrupted');
    });

    it('should not call onToken for empty content', async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield { choices: [{ delta: { content: 'Valid' } }] };
          yield { choices: [{ delta: { content: '' } }] };
          yield { choices: [{ delta: { content: null } }] };
        },
      };

      mockClient.chat.completions.create.mockResolvedValue(mockStream);

      const onToken = jest.fn();
      const options: StreamOptions = { onToken };

      for await (const token of provider.stream('Test prompt', options)) {
        // Just consume the stream
      }

      expect(onToken).toHaveBeenCalledTimes(1);
      expect(onToken).toHaveBeenCalledWith('Valid');
    });
  });

  describe('edge cases', () => {
    it('should handle malformed API responses', async () => {
      mockClient.chat.completions.create.mockResolvedValue({
        choices: [],
        model: 'deepseek-chat',
      });

      await expect(provider.complete('Test prompt')).rejects.toThrow();
    });

    it('should handle network timeouts', async () => {
      const timeoutError = new Error('Request timeout');
      (timeoutError as any).code = 'ETIMEDOUT';
      mockClient.chat.completions.create.mockRejectedValue(timeoutError);

      await expect(provider.complete('Test prompt')).rejects.toThrow('Request timeout');
    });

    it('should handle API rate limits', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      (rateLimitError as any).status = 429;
      mockClient.chat.completions.create.mockRejectedValue(rateLimitError);

      await expect(provider.complete('Test prompt')).rejects.toThrow('Rate limit exceeded');
    });

    it('should handle invalid API key', async () => {
      const authError = new Error('Unauthorized');
      (authError as any).status = 401;
      mockClient.chat.completions.create.mockRejectedValue(authError);

      await expect(provider.complete('Test prompt')).rejects.toThrow('Unauthorized');
    });
  });

  describe('DeepSeek-specific features', () => {
    it('should use DeepSeek model name', async () => {
      mockClient.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: 'Response' } }],
        model: 'deepseek-chat',
      });

      const result = await provider.complete('Test prompt');

      expect(result.model).toBe('deepseek-chat');
    });

    it('should connect to DeepSeek API endpoint', () => {
      // This is verified in the constructor test
      expect(OpenAI).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://api.deepseek.com/v1',
        })
      );
    });
  });
});
