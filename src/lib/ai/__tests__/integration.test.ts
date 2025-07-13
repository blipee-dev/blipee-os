/**
 * AI Services Integration Tests
 * Tests the integration between AI services, providers, and external APIs
 */

import { AIService } from '../service';
import { ContextEngine } from '../context-engine';
import { MultiBrainOrchestrator } from '../multi-brain-orchestrator';
import { DocumentHandler } from '../document-handler';
import { createClient } from '@supabase/supabase-js';
import { mockDeepSeekProvider, mockOpenAIProvider, mockAnthropicProvider } from '@/test/mocks/ai-providers';
import { jest } from '@jest/globals';

describe('AI Services Integration Tests', () => {
  let aiService: AIService;
  let contextEngine: ContextEngine;
  let orchestrator: MultiBrainOrchestrator;
  let documentHandler: DocumentHandler;
  let supabase: any;

  beforeAll(() => {
    // Initialize services
    supabase = createClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    contextEngine = new ContextEngine(supabase);
    orchestrator = new MultiBrainOrchestrator();
    documentHandler = new DocumentHandler();
    aiService = new AIService({
      contextEngine,
      orchestrator,
      documentHandler,
      supabase,
    });
  });

  describe('Provider Failover Integration', () => {
    it('should failover from DeepSeek to OpenAI seamlessly', async () => {
      // Mock DeepSeek to fail
      mockDeepSeekProvider.chat.mockRejectedValueOnce(new Error('API rate limit'));
      
      // Mock OpenAI to succeed
      mockOpenAIProvider.chat.mockResolvedValueOnce({
        content: 'Response from OpenAI',
        model: 'gpt-4',
      });

      const response = await aiService.chat({
        message: 'Test failover',
        userId: 'user-123',
        conversationId: 'conv-123',
      });

      expect(response.content).toBe('Response from OpenAI');
      expect(response.provider).toBe('openai');
      expect(mockDeepSeekProvider.chat).toHaveBeenCalledTimes(1);
      expect(mockOpenAIProvider.chat).toHaveBeenCalledTimes(1);
    });

    it('should try all providers before failing', async () => {
      // Mock all providers to fail
      mockDeepSeekProvider.chat.mockRejectedValueOnce(new Error('DeepSeek error'));
      mockOpenAIProvider.chat.mockRejectedValueOnce(new Error('OpenAI error'));
      mockAnthropicProvider.chat.mockRejectedValueOnce(new Error('Anthropic error'));

      await expect(
        aiService.chat({
          message: 'Test all failures',
          userId: 'user-123',
        })
      ).rejects.toThrow('All AI providers failed');

      expect(mockDeepSeekProvider.chat).toHaveBeenCalledTimes(1);
      expect(mockOpenAIProvider.chat).toHaveBeenCalledTimes(1);
      expect(mockAnthropicProvider.chat).toHaveBeenCalledTimes(1);
    });

    it('should maintain context across provider switches', async () => {
      const context = {
        organizationId: 'org-123',
        conversationHistory: [
          { role: 'user', content: 'Previous message' },
          { role: 'assistant', content: 'Previous response' },
        ],
      };

      // First call with DeepSeek
      mockDeepSeekProvider.chat.mockResolvedValueOnce({
        content: 'DeepSeek response',
        model: 'deepseek-chat',
      });

      await aiService.chat({
        message: 'First message',
        userId: 'user-123',
        conversationId: 'conv-123',
        context,
      });

      // Second call fails over to OpenAI
      mockDeepSeekProvider.chat.mockRejectedValueOnce(new Error('Rate limit'));
      mockOpenAIProvider.chat.mockResolvedValueOnce({
        content: 'OpenAI response with context',
        model: 'gpt-4',
      });

      const response = await aiService.chat({
        message: 'Second message',
        userId: 'user-123',
        conversationId: 'conv-123',
        context,
      });

      // Verify context was passed to OpenAI
      expect(mockOpenAIProvider.chat).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ content: 'Previous message' }),
            expect.objectContaining({ content: 'Previous response' }),
          ]),
        })
      );
    });
  });

  describe('Context Engine Integration', () => {
    it('should build comprehensive context from multiple sources', async () => {
      // Mock database queries
      const mockOrganizationData = {
        id: 'org-123',
        name: 'Test Corp',
        industry: 'Manufacturing',
        emissions_target: 1000,
      };

      const mockConversationHistory = [
        { role: 'user', content: 'What are our emissions?' },
        { role: 'assistant', content: 'Your current emissions are 1200 tons CO2e' },
      ];

      const mockDocuments = [
        { id: 'doc-1', title: 'Q1 Report', content: 'Emissions data...' },
        { id: 'doc-2', title: 'Energy Usage', content: 'kWh consumption...' },
      ];

      jest.spyOn(contextEngine, 'getOrganizationData').mockResolvedValueOnce(mockOrganizationData);
      jest.spyOn(contextEngine, 'getConversationHistory').mockResolvedValueOnce(mockConversationHistory);
      jest.spyOn(contextEngine, 'getRelevantDocuments').mockResolvedValueOnce(mockDocuments);

      const context = await contextEngine.buildContext({
        userId: 'user-123',
        organizationId: 'org-123',
        conversationId: 'conv-123',
        message: 'How can we reduce emissions?',
      });

      expect(context).toMatchObject({
        organizationData: mockOrganizationData,
        conversationHistory: mockConversationHistory,
        relevantDocuments: mockDocuments,
        metadata: {
          timestamp: expect.any(String),
          requestId: expect.any(String),
        },
      });
    });

    it('should handle partial context gracefully', async () => {
      // Mock some queries to fail
      jest.spyOn(contextEngine, 'getOrganizationData').mockRejectedValueOnce(new Error('DB error'));
      jest.spyOn(contextEngine, 'getConversationHistory').mockResolvedValueOnce([]);
      jest.spyOn(contextEngine, 'getRelevantDocuments').mockResolvedValueOnce([]);

      const context = await contextEngine.buildContext({
        userId: 'user-123',
        message: 'Simple query',
      });

      // Should still return valid context
      expect(context).toBeDefined();
      expect(context.organizationData).toBeNull();
      expect(context.conversationHistory).toEqual([]);
      expect(context.relevantDocuments).toEqual([]);
    });
  });

  describe('Document Processing Integration', () => {
    it('should process and extract data from uploaded documents', async () => {
      const mockFile = {
        name: 'emissions-report.pdf',
        type: 'application/pdf',
        size: 1024 * 1024, // 1MB
        content: Buffer.from('Mock PDF content'),
      };

      // Mock document processing
      jest.spyOn(documentHandler, 'extractText').mockResolvedValueOnce({
        text: 'Total emissions: 1,234 tons CO2e\nElectricity: 500 tons\nTransport: 734 tons',
        metadata: { pages: 10, language: 'en' },
      });

      jest.spyOn(documentHandler, 'extractStructuredData').mockResolvedValueOnce({
        emissions: {
          total: 1234,
          electricity: 500,
          transport: 734,
          unit: 'tons CO2e',
        },
        period: '2024 Q1',
      });

      const result = await documentHandler.processDocument(mockFile);

      expect(result).toMatchObject({
        text: expect.stringContaining('Total emissions'),
        structuredData: {
          emissions: {
            total: 1234,
            electricity: 500,
            transport: 734,
          },
        },
        summary: expect.any(String),
      });
    });

    it('should handle document processing errors gracefully', async () => {
      const mockCorruptFile = {
        name: 'corrupt.pdf',
        type: 'application/pdf',
        size: 100,
        content: Buffer.from('Invalid PDF'),
      };

      jest.spyOn(documentHandler, 'extractText').mockRejectedValueOnce(
        new Error('Invalid PDF structure')
      );

      const result = await documentHandler.processDocument(mockCorruptFile);

      expect(result.error).toBeDefined();
      expect(result.error).toContain('Failed to process document');
      expect(result.text).toBe('');
      expect(result.structuredData).toBeNull();
    });

    it('should integrate document data with AI responses', async () => {
      // Upload and process document
      const documentData = {
        id: 'doc-123',
        extractedData: {
          emissions: { total: 1234, unit: 'tons CO2e' },
        },
      };

      // Mock context to include document
      jest.spyOn(contextEngine, 'buildContext').mockResolvedValueOnce({
        relevantDocuments: [documentData],
        organizationData: { id: 'org-123' },
        conversationHistory: [],
      });

      mockDeepSeekProvider.chat.mockResolvedValueOnce({
        content: 'Based on your uploaded document, your total emissions are 1,234 tons CO2e.',
        model: 'deepseek-chat',
      });

      const response = await aiService.chat({
        message: 'What do the uploaded documents say about our emissions?',
        userId: 'user-123',
        attachments: ['doc-123'],
      });

      expect(response.content).toContain('1,234 tons CO2e');
      expect(mockDeepSeekProvider.chat).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining('emissions'),
            }),
          ]),
        })
      );
    });
  });

  describe('External API Integration', () => {
    it('should fetch and integrate weather data', async () => {
      // Mock weather API
      const mockWeatherData = {
        temperature: 22,
        humidity: 65,
        conditions: 'partly cloudy',
      };

      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockWeatherData,
      } as Response);

      const weatherContext = await contextEngine.getWeatherContext('New York');

      expect(weatherContext).toMatchObject(mockWeatherData);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('openweathermap.org')
      );
    });

    it('should fetch and integrate carbon intensity data', async () => {
      // Mock Electricity Maps API
      const mockCarbonData = {
        carbonIntensity: 125,
        unit: 'gCO2eq/kWh',
        fossilFuelPercentage: 35,
      };

      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockCarbonData,
      } as Response);

      const carbonContext = await contextEngine.getCarbonIntensityData('US-NY');

      expect(carbonContext).toMatchObject(mockCarbonData);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('api.electricitymap.org')
      );
    });

    it('should handle external API failures gracefully', async () => {
      // Mock API failure
      jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));

      const context = await contextEngine.buildContext({
        userId: 'user-123',
        message: 'What is the current carbon intensity?',
        includeExternalData: true,
      });

      // Should still return context without external data
      expect(context).toBeDefined();
      expect(context.externalData).toEqual({
        weather: null,
        carbonIntensity: null,
        error: 'Failed to fetch external data',
      });
    });
  });

  describe('Multi-Brain Orchestration', () => {
    it('should route requests to appropriate specialized models', async () => {
      const testCases = [
        {
          message: 'Calculate my Scope 1 emissions',
          expectedBrain: 'analytical',
          expectedModel: 'gpt-4',
        },
        {
          message: 'Write a sustainability report introduction',
          expectedBrain: 'creative',
          expectedModel: 'claude-3-opus',
        },
        {
          message: 'What is CO2e?',
          expectedBrain: 'factual',
          expectedModel: 'deepseek-chat',
        },
      ];

      for (const testCase of testCases) {
        const brain = orchestrator.selectBrain(testCase.message);
        expect(brain.type).toBe(testCase.expectedBrain);
        expect(brain.preferredModel).toBe(testCase.expectedModel);
      }
    });

    it('should combine outputs from multiple brains for complex queries', async () => {
      const complexQuery = 'Analyze our emissions data and create a reduction strategy with specific targets';

      // Mock responses from different brains
      const analyticalResponse = {
        content: 'Current emissions: 1000 tons. Reduction potential: 30%',
        brain: 'analytical',
      };

      const strategicResponse = {
        content: 'Recommended targets: 20% by 2025, 50% by 2030',
        brain: 'strategic',
      };

      jest.spyOn(orchestrator, 'processWithMultipleBrains').mockResolvedValueOnce({
        combinedResponse: `${analyticalResponse.content}\n\n${strategicResponse.content}`,
        brainOutputs: [analyticalResponse, strategicResponse],
      });

      const response = await orchestrator.processComplexQuery(complexQuery);

      expect(response.combinedResponse).toContain('Current emissions');
      expect(response.combinedResponse).toContain('Recommended targets');
      expect(response.brainOutputs).toHaveLength(2);
    });
  });

  describe('Streaming Response Integration', () => {
    it('should stream responses with proper formatting', async () => {
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue('data: {"type":"content","content":"Analyzing"}\n\n');
          controller.enqueue('data: {"type":"content","content":" your"}\n\n');
          controller.enqueue('data: {"type":"content","content":" data..."}\n\n');
          controller.enqueue('data: {"type":"component","component":{"type":"chart","data":{}}}\n\n');
          controller.enqueue('data: {"type":"done"}\n\n');
          controller.close();
        },
      });

      mockDeepSeekProvider.streamChat.mockResolvedValueOnce(mockStream);

      const stream = await aiService.streamChat({
        message: 'Analyze my data',
        userId: 'user-123',
      });

      // Collect stream chunks
      const chunks = [];
      const reader = stream.getReader();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(new TextDecoder().decode(value));
      }

      expect(chunks.join('')).toContain('Analyzing your data...');
      expect(chunks.join('')).toContain('"type":"component"');
      expect(chunks.join('')).toContain('"type":"done"');
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should recover from temporary provider outages', async () => {
      let attemptCount = 0;
      
      // Mock provider to fail twice then succeed
      mockDeepSeekProvider.chat.mockImplementation(async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Temporary outage');
        }
        return { content: 'Success after retry', model: 'deepseek-chat' };
      });

      const response = await aiService.chat({
        message: 'Test retry logic',
        userId: 'user-123',
        retryOptions: { maxRetries: 3, retryDelay: 100 },
      });

      expect(response.content).toBe('Success after retry');
      expect(attemptCount).toBe(3);
    });

    it('should maintain conversation continuity despite errors', async () => {
      // First message succeeds
      mockDeepSeekProvider.chat.mockResolvedValueOnce({
        content: 'First response',
        model: 'deepseek-chat',
      });

      await aiService.chat({
        message: 'First message',
        userId: 'user-123',
        conversationId: 'conv-123',
      });

      // Second message fails
      mockDeepSeekProvider.chat.mockRejectedValueOnce(new Error('API error'));
      mockOpenAIProvider.chat.mockResolvedValueOnce({
        content: 'Second response from backup',
        model: 'gpt-4',
      });

      const response = await aiService.chat({
        message: 'Second message',
        userId: 'user-123',
        conversationId: 'conv-123',
      });

      // Verify conversation history is maintained
      expect(mockOpenAIProvider.chat).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ content: 'First message' }),
            expect.objectContaining({ content: 'First response' }),
            expect.objectContaining({ content: 'Second message' }),
          ]),
        })
      );
    });
  });
});