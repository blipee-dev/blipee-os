import { AIService } from '../service';
import { OpenAIProvider } from '../providers/openai';
import { AnthropicProvider } from '../providers/anthropic';
import { DeepSeekProvider } from '../providers/deepseek';
import { AIProvider, CompletionOptions, StreamOptions } from '../types';

jest.mock('../providers/openai');
jest.mock('../providers/anthropic');
jest.mock('../providers/deepseek');

describe('AIService', () => {
  let originalEnv: NodeJS.ProcessEnv;
  
  beforeEach(() => {
    originalEnv = process.env;
    process.env = { ...originalEnv };
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize DeepSeek provider when API key is available', () => {
      process.env.DEEPSEEK_API_KEY = 'test-deepseek-key';
      
      new AIService();
      
      expect(DeepSeekProvider).toHaveBeenCalledWith('test-deepseek-key');
    });

    it('should initialize OpenAI provider when API key is available', () => {
      process.env.OPENAI_API_KEY = 'test-openai-key';
      
      new AIService();
      
      expect(OpenAIProvider).toHaveBeenCalledWith('test-openai-key');
    });

    it('should initialize Anthropic provider when API key is available', () => {
      process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
      
      new AIService();
      
      expect(AnthropicProvider).toHaveBeenCalledWith('test-anthropic-key');
    });

    it('should initialize multiple providers when multiple API keys are available', () => {
      process.env.DEEPSEEK_API_KEY = 'test-deepseek-key';
      process.env.OPENAI_API_KEY = 'test-openai-key';
      process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
      
      new AIService();
      
      expect(DeepSeekProvider).toHaveBeenCalledTimes(1);
      expect(OpenAIProvider).toHaveBeenCalledTimes(1);
      expect(AnthropicProvider).toHaveBeenCalledTimes(1);
    });

    it('should warn when no providers are configured', () => {
      delete process.env.DEEPSEEK_API_KEY;
      delete process.env.OPENAI_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;
      
      new AIService();
      
      expect(console.warn).toHaveBeenCalledWith(
        'No AI providers configured. Please set API keys.'
      );
    });
  });

  describe('complete', () => {
    let mockDeepSeekProvider: jest.Mocked<AIProvider>;
    let mockOpenAIProvider: jest.Mocked<AIProvider>;
    let mockAnthropicProvider: jest.Mocked<AIProvider>;

    beforeEach(() => {
      mockDeepSeekProvider = {
        name: 'DeepSeek',
        complete: jest.fn(),
        stream: jest.fn(),
      };
      
      mockOpenAIProvider = {
        name: 'OpenAI',
        complete: jest.fn(),
        stream: jest.fn(),
      };
      
      mockAnthropicProvider = {
        name: 'Anthropic',
        complete: jest.fn(),
        stream: jest.fn(),
      };

      (DeepSeekProvider as jest.MockedClass<typeof DeepSeekProvider>)
        .mockImplementation(() => mockDeepSeekProvider as any);
      (OpenAIProvider as jest.MockedClass<typeof OpenAIProvider>)
        .mockImplementation(() => mockOpenAIProvider as any);
      (AnthropicProvider as jest.MockedClass<typeof AnthropicProvider>)
        .mockImplementation(() => mockAnthropicProvider as any);
    });

    it('should throw error when no providers are available', async () => {
      const service = new AIService();
      
      await expect(service.complete('test prompt')).rejects.toThrow(
        'No AI providers available'
      );
    });

    it('should successfully complete with first provider', async () => {
      process.env.DEEPSEEK_API_KEY = 'test-key';
      const service = new AIService();
      
      mockDeepSeekProvider.complete.mockResolvedValue('DeepSeek response');
      
      const result = await service.complete('test prompt');
      
      expect(result).toBe('DeepSeek response');
      expect(mockDeepSeekProvider.complete).toHaveBeenCalledWith('test prompt', undefined);
    });

    it('should pass options to provider', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      const service = new AIService();
      
      const options: CompletionOptions = {
        temperature: 0.7,
        maxTokens: 1000,
        systemPrompt: 'You are a helpful assistant'
      };
      
      mockOpenAIProvider.complete.mockResolvedValue('OpenAI response');
      
      await service.complete('test prompt', options);
      
      expect(mockOpenAIProvider.complete).toHaveBeenCalledWith('test prompt', options);
    });

    it('should fallback to next provider on failure', async () => {
      process.env.DEEPSEEK_API_KEY = 'test-key';
      process.env.OPENAI_API_KEY = 'test-key';
      const service = new AIService();
      
      mockDeepSeekProvider.complete.mockRejectedValue(new Error('DeepSeek error'));
      mockOpenAIProvider.complete.mockResolvedValue('OpenAI response');
      
      const result = await service.complete('test prompt');
      
      expect(result).toBe('OpenAI response');
      expect(mockDeepSeekProvider.complete).toHaveBeenCalled();
      expect(mockOpenAIProvider.complete).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith('DeepSeek failed:', expect.any(Error));
    });

    it('should try all providers before failing', async () => {
      process.env.DEEPSEEK_API_KEY = 'test-key';
      process.env.OPENAI_API_KEY = 'test-key';
      process.env.ANTHROPIC_API_KEY = 'test-key';
      const service = new AIService();
      
      mockDeepSeekProvider.complete.mockRejectedValue(new Error('DeepSeek error'));
      mockOpenAIProvider.complete.mockRejectedValue(new Error('OpenAI error'));
      mockAnthropicProvider.complete.mockRejectedValue(new Error('Anthropic error'));
      
      await expect(service.complete('test prompt')).rejects.toThrow('Anthropic error');
      
      expect(mockDeepSeekProvider.complete).toHaveBeenCalled();
      expect(mockOpenAIProvider.complete).toHaveBeenCalled();
      expect(mockAnthropicProvider.complete).toHaveBeenCalled();
    });

    it('should rotate providers for load balancing', async () => {
      process.env.DEEPSEEK_API_KEY = 'test-key';
      process.env.OPENAI_API_KEY = 'test-key';
      const service = new AIService();
      
      mockDeepSeekProvider.complete.mockResolvedValue('DeepSeek response');
      mockOpenAIProvider.complete.mockResolvedValue('OpenAI response');
      
      // First call should use DeepSeek
      await service.complete('prompt 1');
      expect(mockDeepSeekProvider.complete).toHaveBeenCalledTimes(1);
      
      // Second call should use OpenAI (rotation)
      await service.complete('prompt 2');
      expect(mockOpenAIProvider.complete).toHaveBeenCalledTimes(1);
      
      // Third call should use DeepSeek again
      mockDeepSeekProvider.complete.mockClear();
      await service.complete('prompt 3');
      expect(mockDeepSeekProvider.complete).toHaveBeenCalledTimes(1);
    });
  });

  describe('stream', () => {
    let mockDeepSeekProvider: jest.Mocked<AIProvider>;
    let mockOpenAIProvider: jest.Mocked<AIProvider>;

    beforeEach(() => {
      mockDeepSeekProvider = {
        name: 'DeepSeek',
        complete: jest.fn(),
        stream: jest.fn(),
      };
      
      mockOpenAIProvider = {
        name: 'OpenAI',
        complete: jest.fn(),
        stream: jest.fn(),
      };

      (DeepSeekProvider as jest.MockedClass<typeof DeepSeekProvider>)
        .mockImplementation(() => mockDeepSeekProvider as any);
      (OpenAIProvider as jest.MockedClass<typeof OpenAIProvider>)
        .mockImplementation(() => mockOpenAIProvider as any);
    });

    it('should throw error when no providers are available', async () => {
      const service = new AIService();
      
      const generator = service.stream('test prompt');
      await expect(generator.next()).rejects.toThrow('No AI providers available');
    });

    it('should successfully stream with first provider', async () => {
      process.env.DEEPSEEK_API_KEY = 'test-key';
      const service = new AIService();
      
      const mockStream = (async function* () {
        yield 'chunk1';
        yield 'chunk2';
        yield 'chunk3';
      })();
      
      mockDeepSeekProvider.stream.mockReturnValue(mockStream);
      
      const chunks: string[] = [];
      for await (const chunk of service.stream('test prompt')) {
        chunks.push(chunk as string);
      }
      
      expect(chunks).toEqual(['chunk1', 'chunk2', 'chunk3']);
      expect(mockDeepSeekProvider.stream).toHaveBeenCalledWith('test prompt', undefined);
    });

    it('should pass options to provider stream', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      const service = new AIService();
      
      const options: StreamOptions = {
        temperature: 0.5,
        maxTokens: 500,
        systemPrompt: 'Be concise'
      };
      
      const mockStream = (async function* () {
        yield 'response';
      })();
      
      mockOpenAIProvider.stream.mockReturnValue(mockStream);
      
      const generator = service.stream('test prompt', options);
      await generator.next();
      
      expect(mockOpenAIProvider.stream).toHaveBeenCalledWith('test prompt', options);
    });

    it('should fallback to next provider on stream failure', async () => {
      process.env.DEEPSEEK_API_KEY = 'test-key';
      process.env.OPENAI_API_KEY = 'test-key';
      const service = new AIService();
      
      mockDeepSeekProvider.stream.mockImplementation(() => {
        throw new Error('DeepSeek stream error');
      });
      
      const mockStream = (async function* () {
        yield 'OpenAI chunk';
      })();
      
      mockOpenAIProvider.stream.mockReturnValue(mockStream);
      
      const chunks: string[] = [];
      for await (const chunk of service.stream('test prompt')) {
        chunks.push(chunk as string);
      }
      
      expect(chunks).toEqual(['OpenAI chunk']);
      expect(console.error).toHaveBeenCalledWith(
        'DeepSeek streaming failed:',
        expect.any(Error)
      );
    });

    it('should rotate providers for load balancing in streaming', async () => {
      process.env.DEEPSEEK_API_KEY = 'test-key';
      process.env.OPENAI_API_KEY = 'test-key';
      const service = new AIService();
      
      const mockDeepSeekStream = (async function* () {
        yield 'DeepSeek';
      })();
      
      const mockOpenAIStream = (async function* () {
        yield 'OpenAI';
      })();
      
      mockDeepSeekProvider.stream.mockReturnValue(mockDeepSeekStream);
      mockOpenAIProvider.stream.mockReturnValue(mockOpenAIStream);
      
      // First stream should use DeepSeek
      const chunks1: string[] = [];
      for await (const chunk of service.stream('prompt 1')) {
        chunks1.push(chunk as string);
      }
      expect(chunks1).toEqual(['DeepSeek']);
      
      // Second stream should use OpenAI (rotation)
      const chunks2: string[] = [];
      for await (const chunk of service.stream('prompt 2')) {
        chunks2.push(chunk as string);
      }
      expect(chunks2).toEqual(['OpenAI']);
    });
  });

  describe('getAvailableProviders', () => {
    it('should return empty array when no providers are configured', () => {
      const service = new AIService();
      
      expect(service.getAvailableProviders()).toEqual([]);
    });

    it('should return names of configured providers', () => {
      process.env.DEEPSEEK_API_KEY = 'test-key';
      process.env.OPENAI_API_KEY = 'test-key';
      process.env.ANTHROPIC_API_KEY = 'test-key';
      
      const mockDeepSeek = { name: 'DeepSeek', complete: jest.fn(), stream: jest.fn() };
      const mockOpenAI = { name: 'OpenAI', complete: jest.fn(), stream: jest.fn() };
      const mockAnthropic = { name: 'Anthropic', complete: jest.fn(), stream: jest.fn() };
      
      (DeepSeekProvider as jest.MockedClass<typeof DeepSeekProvider>)
        .mockImplementation(() => mockDeepSeek as any);
      (OpenAIProvider as jest.MockedClass<typeof OpenAIProvider>)
        .mockImplementation(() => mockOpenAI as any);
      (AnthropicProvider as jest.MockedClass<typeof AnthropicProvider>)
        .mockImplementation(() => mockAnthropic as any);
      
      const service = new AIService();
      
      expect(service.getAvailableProviders()).toEqual(['DeepSeek', 'OpenAI', 'Anthropic']);
    });

    it('should return partial list when only some providers are configured', () => {
      process.env.OPENAI_API_KEY = 'test-key';
      
      const mockOpenAI = { name: 'OpenAI', complete: jest.fn(), stream: jest.fn() };
      
      (OpenAIProvider as jest.MockedClass<typeof OpenAIProvider>)
        .mockImplementation(() => mockOpenAI as any);
      
      const service = new AIService();
      
      expect(service.getAvailableProviders()).toEqual(['OpenAI']);
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton instance', async () => {
      const { aiService } = await import('../service');
      
      expect(aiService).toBeDefined();
      expect(aiService).toBeInstanceOf(AIService);
    });
  });
});
