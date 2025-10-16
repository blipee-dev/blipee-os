import { AnthropicProvider } from '../anthropic';
import { CompletionOptions, StreamOptions } from '../../types';

describe('AnthropicProvider', () => {
  let provider: AnthropicProvider;

  beforeEach(() => {
    provider = new AnthropicProvider('test-api-key');
  });

  describe('constructor', () => {
    it('should initialize with correct name', () => {
      expect(provider.name).toBe('Anthropic');
    });

    it('should be an instance of AnthropicProvider', () => {
      expect(provider).toBeInstanceOf(AnthropicProvider);
    });
  });

  describe('complete method', () => {
    it('should be defined', () => {
      expect(typeof provider.complete).toBe('function');
    });

    it('should return a promise', () => {
      const result = provider.complete('test');
      expect(result).toBeInstanceOf(Promise);
      // Clean up the promise to avoid unhandled rejections
      result.catch(() => {});
    });
  });

  describe('stream method', () => {
    it('should be defined', () => {
      expect(typeof provider.stream).toBe('function');
    });

    it('should return an async generator', () => {
      const result = provider.stream('test');
      expect(typeof result.next).toBe('function');
      expect(typeof result[Symbol.asyncIterator]).toBe('function');
    });
  });

  describe('interface compliance', () => {
    it('should implement AIProvider interface', () => {
      expect(provider).toHaveProperty('name');
      expect(provider).toHaveProperty('complete');
      expect(provider).toHaveProperty('stream');
    });

    it('should have correct method signatures', () => {
      expect(provider.complete.length).toBe(2); // prompt and options
      expect(provider.stream.length).toBe(2); // prompt and options
    });
  });

  describe('type safety', () => {
    it('should accept completion options', () => {
      const options: CompletionOptions = {
        temperature: 0.5,
        maxTokens: 500,
        systemPrompt: 'Test system prompt',
      };

      // Should not throw when calling with options
      expect(() => {
        const promise = provider.complete('test', options);
        promise.catch(() => {}); // Handle potential rejection
      }).not.toThrow();
    });

    it('should accept stream options', () => {
      const options: StreamOptions = {
        temperature: 0.8,
        maxTokens: 1000,
        onToken: (token: string) =>,
      };

      // Should not throw when calling with options
      expect(() => {
        provider.stream('test', options);
      }).not.toThrow();
    });
  });
});