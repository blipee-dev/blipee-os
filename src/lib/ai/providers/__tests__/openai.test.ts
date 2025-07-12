import { OpenAIProvider } from '../openai';
import OpenAI from 'openai';
import { CompletionOptions, StreamOptions } from '../../types';

// Mock the OpenAI module
jest.mock('openai');

describe('OpenAIProvider', () => {
  let provider: OpenAIProvider;
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
    provider = new OpenAIProvider('test-api-key');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with API key', () => {
      expect(OpenAI).toHaveBeenCalledWith({ apiKey: 'test-api-key' });
      expect(provider.name).toBe('OpenAI');
    });
  });

  describe('complete', () => {
    it('should call OpenAI API with correct parameters', async () => {
      const mockResponse = {
        choices: [{
          message: { content: 'Test response' },
        }],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
        model: 'gpt-4-turbo-preview',
      };

      mockClient.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await provider.complete('Test prompt');

      expect(mockClient.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: 'Test prompt' }],
        temperature: 0.7,
        max_tokens: 1000,
      });

      expect(result).toEqual({
        content: 'Test response',
        usage: {
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
        },
        model: 'gpt-4-turbo-preview',
      });
    });

    it('should include system prompt when provided', async () => {
      const options: CompletionOptions = {
        systemPrompt: 'You are a helpful assistant',
        temperature: 0.5,
        maxTokens: 500,
      };

      mockClient.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: 'Response' } }],
        model: 'gpt-4-turbo-preview',
      });

      await provider.complete('Test prompt', options);

      expect(mockClient.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: 'You are a helpful assistant' },
          { role: 'user', content: 'Test prompt' },
        ],
        temperature: 0.5,
        max_tokens: 500,
      });
    });

    it('should enable JSON mode when specified', async () => {
      const options: CompletionOptions = {
        jsonMode: true,
      };

      mockClient.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: '{"result": "test"}' } }],
        model: 'gpt-4-turbo-preview',
      });

      await provider.complete('Test prompt', options);

      expect(mockClient.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: 'Test prompt' }],
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: 'json_object' },
      });
    });

    it('should handle empty response content', async () => {
      mockClient.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: null } }],
        model: 'gpt-4-turbo-preview',
      });

      const result = await provider.complete('Test prompt');

      expect(result.content).toBe('');
    });

    it('should handle missing usage data', async () => {
      mockClient.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: 'Response' } }],
        model: 'gpt-4-turbo-preview',
        usage: null,
      });

      const result = await provider.complete('Test prompt');

      expect(result.usage).toBeUndefined();
    });

    it('should throw error on API failure', async () => {
      mockClient.chat.completions.create.mockRejectedValue(
        new Error('API Error')
      );

      await expect(provider.complete('Test prompt')).rejects.toThrow('API Error');
    });
  });

  describe('stream', () => {
    it('should stream tokens correctly', async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield { choices: [{ delta: { content: 'Hello' } }] };
          yield { choices: [{ delta: { content: ' world' } }] };
          yield { choices: [{ delta: { content: '!' } }] };
        },
      };

      mockClient.chat.completions.create.mockResolvedValue(mockStream);

      const tokens: string[] = [];
      for await (const token of provider.stream('Test prompt')) {
        if (!token.isComplete) {
          tokens.push(token.content);
        }
      }

      expect(tokens).toEqual(['Hello', ' world', '!']);
      expect(mockClient.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: 'Test prompt' }],
        temperature: 0.7,
        max_tokens: 1000,
        stream: true,
      });
    });

    it('should call onToken callback when provided', async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield { choices: [{ delta: { content: 'Test' } }] };
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
      expect(onToken).toHaveBeenCalledWith('Test');
      expect(onToken).toHaveBeenCalledWith(' token');
    });

    it('should include system prompt in streaming', async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield { choices: [{ delta: { content: 'Response' } }] };
        },
      };

      mockClient.chat.completions.create.mockResolvedValue(mockStream);

      const options: StreamOptions = {
        systemPrompt: 'Be concise',
        temperature: 0.3,
        maxTokens: 100,
      };

      const generator = provider.stream('Test prompt', options);
      await generator.next();

      expect(mockClient.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: 'Be concise' },
          { role: 'user', content: 'Test prompt' },
        ],
        temperature: 0.3,
        max_tokens: 100,
        stream: true,
      });
    });

    it('should handle empty content in stream chunks', async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield { choices: [{ delta: { content: 'Hello' } }] };
          yield { choices: [{ delta: { content: '' } }] };
          yield { choices: [{ delta: { content: null } }] };
          yield { choices: [{ delta: {} }] };
          yield { choices: [{ delta: { content: 'World' } }] };
        },
      };

      mockClient.chat.completions.create.mockResolvedValue(mockStream);

      const tokens: string[] = [];
      for await (const token of provider.stream('Test prompt')) {
        if (!token.isComplete && token.content) {
          tokens.push(token.content);
        }
      }

      expect(tokens).toEqual(['Hello', 'World']);
    });

    it('should yield completion token at the end', async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield { choices: [{ delta: { content: 'Test' } }] };
        },
      };

      mockClient.chat.completions.create.mockResolvedValue(mockStream);

      const tokens = [];
      for await (const token of provider.stream('Test prompt')) {
        tokens.push(token);
      }

      expect(tokens).toHaveLength(2);
      expect(tokens[0]).toEqual({ content: 'Test', isComplete: false });
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
          yield { choices: [{ delta: { content: 'Start' } }] };
          throw new Error('Mid-stream error');
        },
      };

      mockClient.chat.completions.create.mockResolvedValue(mockStream);

      const tokens: string[] = [];
      const generator = provider.stream('Test prompt');

      // First token should work
      const firstToken = await generator.next();
      expect(firstToken.value).toEqual({ content: 'Start', isComplete: false });

      // Next iteration should throw
      await expect(generator.next()).rejects.toThrow('Mid-stream error');
    });
  });

  describe('edge cases', () => {
    it('should handle malformed API responses', async () => {
      mockClient.chat.completions.create.mockResolvedValue({
        choices: [],
        model: 'gpt-4-turbo-preview',
      });

      await expect(provider.complete('Test prompt')).rejects.toThrow();
    });

    it('should handle rate limiting errors', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      (rateLimitError as any).status = 429;
      mockClient.chat.completions.create.mockRejectedValue(rateLimitError);

      await expect(provider.complete('Test prompt')).rejects.toThrow('Rate limit exceeded');
    });

    it('should handle authentication errors', async () => {
      const authError = new Error('Invalid API key');
      (authError as any).status = 401;
      mockClient.chat.completions.create.mockRejectedValue(authError);

      await expect(provider.complete('Test prompt')).rejects.toThrow('Invalid API key');
    });
  });
});
