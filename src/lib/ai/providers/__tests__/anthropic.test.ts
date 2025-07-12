import { AnthropicProvider } from '../anthropic';
import { CompletionOptions, StreamOptions } from '../../types';

// Create a simple mock implementation for testing
class MockAnthropicClient {
  private mockResponses: any = {};
  private mockStreamResponses: any = {};

  constructor(public config: any) {}

  messages = {
    create: (params: any) => {
      if (params.stream) {
        return this.createMockStream(params);
      }
      return Promise.resolve(this.getMockResponse(params));
    }
  };

  setMockResponse(params: any, response: any) {
    this.mockResponses[JSON.stringify(params)] = response;
  }

  setMockStreamResponse(params: any, response: any) {
    this.mockStreamResponses[JSON.stringify(params)] = response;
  }

  private getMockResponse(params: any) {
    const key = JSON.stringify(params);
    return this.mockResponses[key] || {
      content: [{ type: 'text', text: 'Mock response' }],
      model: 'claude-3-opus-20240229',
      usage: { input_tokens: 10, output_tokens: 20 }
    };
  }

  private async *createMockStream(params: any) {
    yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Mock' } };
    yield { type: 'content_block_delta', delta: { type: 'text_delta', text: ' stream' } };
  }
}

describe('AnthropicProvider', () => {
  let provider: AnthropicProvider;
  let mockClient: MockAnthropicClient;

  beforeEach(() => {
    // Create provider with mock
    provider = new AnthropicProvider('test-api-key');
    mockClient = new MockAnthropicClient({ apiKey: 'test-api-key' });
    // Replace the internal client with our mock
    (provider as any).client = mockClient;
  });

  describe('constructor', () => {
    it('should initialize with API key', () => {
      expect(provider.name).toBe('Anthropic');
      expect(mockClient.config.apiKey).toBe('test-api-key');
    });
  });

  describe('complete', () => {
    it('should call Anthropic API with correct parameters', async () => {
      const mockResponse = {
        content: [{
          type: 'text',
          text: 'Claude response',
        }],
        usage: {
          input_tokens: 12,
          output_tokens: 18,
        },
        model: 'claude-3-opus-20240229',
      };

      mockClient.setMockResponse({
        model: 'claude-3-opus-20240229',
        messages: [{ role: 'user', content: 'Test prompt' }],
        system: undefined,
        temperature: 0.7,
        max_tokens: 1000,
      }, mockResponse);

      const result = await provider.complete('Test prompt');

      expect(result).toEqual({
        content: 'Claude response',
        usage: {
          promptTokens: 12,
          completionTokens: 18,
          totalTokens: 30,
        },
        model: 'claude-3-opus-20240229',
      });
    });

    it('should include system prompt when provided', async () => {
      const options: CompletionOptions = {
        systemPrompt: 'You are a sustainability expert',
        temperature: 0.9,
        maxTokens: 2000,
      };

      mockClient.messages.create.mockResolvedValue({
        content: [{ type: 'text', text: 'Expert response' }],
        model: 'claude-3-opus-20240229',
      });

      await provider.complete('Analyze emissions', options);

      expect(mockClient.messages.create).toHaveBeenCalledWith({
        model: 'claude-3-opus-20240229',
        messages: [{ role: 'user', content: 'Analyze emissions' }],
        system: 'You are a sustainability expert',
        temperature: 0.9,
        max_tokens: 2000,
      });
    });

    it('should handle non-text content blocks', async () => {
      mockClient.messages.create.mockResolvedValue({
        content: [{ type: 'image', source: 'base64-data' }],
        model: 'claude-3-opus-20240229',
      });

      const result = await provider.complete('Test prompt');

      expect(result.content).toBe('');
    });

    it('should handle empty content array', async () => {
      mockClient.messages.create.mockResolvedValue({
        content: [],
        model: 'claude-3-opus-20240229',
      });

      const result = await provider.complete('Test prompt');

      expect(result.content).toBe('');
    });

    it('should handle missing usage data', async () => {
      mockClient.messages.create.mockResolvedValue({
        content: [{ type: 'text', text: 'Response' }],
        model: 'claude-3-opus-20240229',
        usage: null,
      });

      const result = await provider.complete('Test prompt');

      expect(result.usage).toBeUndefined();
    });

    it('should throw error on API failure', async () => {
      mockClient.messages.create.mockRejectedValue(
        new Error('Anthropic API Error')
      );

      await expect(provider.complete('Test prompt')).rejects.toThrow('Anthropic API Error');
    });

    it('should use default values when options not provided', async () => {
      mockClient.messages.create.mockResolvedValue({
        content: [{ type: 'text', text: 'Default response' }],
        model: 'claude-3-opus-20240229',
      });

      await provider.complete('Test prompt');

      expect(mockClient.messages.create).toHaveBeenCalledWith(
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
          yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Hello' } };
          yield { type: 'content_block_delta', delta: { type: 'text_delta', text: ' Claude' } };
          yield { type: 'content_block_delta', delta: { type: 'text_delta', text: '!' } };
          yield { type: 'message_stop' };
        },
      };

      mockClient.messages.create.mockResolvedValue(mockStream);

      const tokens: string[] = [];
      for await (const token of provider.stream('Test prompt')) {
        if (!token.isComplete) {
          tokens.push(token.content);
        }
      }

      expect(tokens).toEqual(['Hello', ' Claude', '!']);
      expect(mockClient.messages.create).toHaveBeenCalledWith({
        model: 'claude-3-opus-20240229',
        messages: [{ role: 'user', content: 'Test prompt' }],
        system: undefined,
        temperature: 0.7,
        max_tokens: 1000,
        stream: true,
      });
    });

    it('should call onToken callback when provided', async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'First' } };
          yield { type: 'content_block_delta', delta: { type: 'text_delta', text: ' token' } };
        },
      };

      mockClient.messages.create.mockResolvedValue(mockStream);

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
          yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Response' } };
        },
      };

      mockClient.messages.create.mockResolvedValue(mockStream);

      const options: StreamOptions = {
        systemPrompt: 'Be helpful',
        temperature: 0.5,
        maxTokens: 500,
      };

      const generator = provider.stream('Test prompt', options);
      await generator.next();

      expect(mockClient.messages.create).toHaveBeenCalledWith({
        model: 'claude-3-opus-20240229',
        messages: [{ role: 'user', content: 'Test prompt' }],
        system: 'Be helpful',
        temperature: 0.5,
        max_tokens: 500,
        stream: true,
      });
    });

    it('should handle non-text delta types', async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Valid' } };
          yield { type: 'content_block_delta', delta: { type: 'image_delta', data: 'base64' } };
          yield { type: 'content_block_start', content_block: { type: 'text' } };
          yield { type: 'content_block_delta', delta: { type: 'text_delta', text: ' text' } };
        },
      };

      mockClient.messages.create.mockResolvedValue(mockStream);

      const tokens: string[] = [];
      for await (const token of provider.stream('Test prompt')) {
        if (!token.isComplete && token.content) {
          tokens.push(token.content);
        }
      }

      expect(tokens).toEqual(['Valid', ' text']);
    });

    it('should handle empty content in stream chunks', async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Start' } };
          yield { type: 'content_block_delta', delta: { type: 'text_delta', text: '' } };
          yield { type: 'content_block_delta', delta: { type: 'text_delta', text: null } };
          yield { type: 'content_block_delta', delta: { type: 'text_delta' } };
          yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'End' } };
        },
      };

      mockClient.messages.create.mockResolvedValue(mockStream);

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
          yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Content' } };
          yield { type: 'message_stop' };
        },
      };

      mockClient.messages.create.mockResolvedValue(mockStream);

      const tokens = [];
      for await (const token of provider.stream('Test prompt')) {
        tokens.push(token);
      }

      expect(tokens).toHaveLength(2);
      expect(tokens[0]).toEqual({ content: 'Content', isComplete: false });
      expect(tokens[1]).toEqual({ content: '', isComplete: true });
    });

    it('should handle stream errors', async () => {
      mockClient.messages.create.mockRejectedValue(
        new Error('Stream error')
      );

      const generator = provider.stream('Test prompt');
      await expect(generator.next()).rejects.toThrow('Stream error');
    });

    it('should handle errors during streaming', async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Before error' } };
          throw new Error('Streaming interrupted');
        },
      };

      mockClient.messages.create.mockResolvedValue(mockStream);

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
          yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Valid' } };
          yield { type: 'content_block_delta', delta: { type: 'text_delta', text: '' } };
          yield { type: 'content_block_delta', delta: { type: 'text_delta', text: null } };
        },
      };

      mockClient.messages.create.mockResolvedValue(mockStream);

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
      mockClient.messages.create.mockResolvedValue({
        content: null,
        model: 'claude-3-opus-20240229',
      });

      await expect(provider.complete('Test prompt')).rejects.toThrow();
    });

    it('should handle network timeouts', async () => {
      const timeoutError = new Error('Request timeout');
      (timeoutError as any).code = 'ETIMEDOUT';
      mockClient.messages.create.mockRejectedValue(timeoutError);

      await expect(provider.complete('Test prompt')).rejects.toThrow('Request timeout');
    });

    it('should handle API rate limits', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      (rateLimitError as any).status = 429;
      mockClient.messages.create.mockRejectedValue(rateLimitError);

      await expect(provider.complete('Test prompt')).rejects.toThrow('Rate limit exceeded');
    });

    it('should handle invalid API key', async () => {
      const authError = new Error('Invalid API key');
      (authError as any).status = 401;
      mockClient.messages.create.mockRejectedValue(authError);

      await expect(provider.complete('Test prompt')).rejects.toThrow('Invalid API key');
    });
  });

  describe('Anthropic-specific features', () => {
    it('should use Claude 3 Opus model', async () => {
      mockClient.messages.create.mockResolvedValue({
        content: [{ type: 'text', text: 'Response' }],
        model: 'claude-3-opus-20240229',
      });

      const result = await provider.complete('Test prompt');

      expect(result.model).toBe('claude-3-opus-20240229');
    });

    it('should use system parameter for system prompts', async () => {
      mockClient.messages.create.mockResolvedValue({
        content: [{ type: 'text', text: 'Response' }],
        model: 'claude-3-opus-20240229',
      });

      await provider.complete('Test prompt', { systemPrompt: 'System message' });

      expect(mockClient.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          system: 'System message',
          messages: [{ role: 'user', content: 'Test prompt' }],
        })
      );
    });

    it('should handle message content array structure', async () => {
      const mockResponse = {
        content: [
          { type: 'text', text: 'First part' },
          { type: 'text', text: 'Second part' },
        ],
        model: 'claude-3-opus-20240229',
      };

      mockClient.messages.create.mockResolvedValue(mockResponse);

      const result = await provider.complete('Test prompt');

      // Should only use the first text content block
      expect(result.content).toBe('First part');
    });
  });
});
