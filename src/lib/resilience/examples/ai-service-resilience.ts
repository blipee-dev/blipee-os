/**
 * Example: AI Service with Resilience Patterns
 * Phase 4, Task 4.3: Resilient AI operations
 */

import { 
  WithResilience,
  ResiliencePolicies,
  WithCircuitBreaker,
  WithRetry,
  WithTimeout,
  RetryPolicies,
  makeResilient
} from '@/lib/resilience';
import { logger } from '@/lib/logging';
import { traceAIChatCompletion } from '@/lib/tracing/ai-tracing';

/**
 * Resilient AI Service Example
 */
export class ResilientAIService {
  /**
   * Chat completion with full resilience stack
   */
  @WithResilience('ai.chat_completion', ResiliencePolicies.ai())
  async generateChatCompletion(
    messages: any[],
    options: {
      provider: string;
      model: string;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<any> {
    return traceAIChatCompletion(
      options.provider,
      options.model,
      async () => {
        // Simulate AI API call
        logger.info('Calling AI provider', {
          provider: options.provider,
          model: options.model
        });

        // Simulate various failure scenarios
        const random = Math.random();
        if (random < 0.1) {
          // 10% rate limit errors
          const error = new Error('Rate limit exceeded');
          (error as any).code = 'RATE_LIMIT';
          throw error;
        } else if (random < 0.15) {
          // 5% timeout
          await new Promise(resolve => setTimeout(resolve, 130000)); // Will timeout
        } else if (random < 0.2) {
          // 5% server errors
          const error = new Error('Internal server error');
          (error as any).code = '500';
          throw error;
        }

        // Simulate successful response
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return {
          id: 'chatcmpl-' + crypto.randomUUID(),
          object: 'chat.completion',
          created: Date.now(),
          model: options.model,
          usage: {
            prompt_tokens: 100,
            completion_tokens: 200,
            total_tokens: 300
          },
          choices: [{
            index: 0,
            message: {
              role: 'assistant',
              content: 'This is a resilient response.'
            },
            finish_reason: 'stop'
          }]
        };
      },
      {
        messages: messages.length,
        maxTokens: options.maxTokens,
        temperature: options.temperature
      }
    );
  }

  /**
   * Embedding generation with custom resilience
   */
  @WithCircuitBreaker('ai.embeddings', {
    failureThreshold: 3,
    resetTimeout: 30000
  })
  @WithRetry(RetryPolicies.apiRateLimit())
  @WithTimeout(60000) // 1 minute timeout
  async generateEmbeddings(
    texts: string[],
    provider: string,
    model: string
  ): Promise<any> {
    logger.info('Generating embeddings', {
      provider,
      model,
      textCount: texts.length
    });

    // Simulate embedding generation
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return texts.map((text, index) => ({
      object: 'embedding',
      index,
      embedding: Array(1536).fill(0).map(() => Math.random())
    }));
  }

  /**
   * Fallback example for critical operations
   */
  @WithResilience('ai.critical_analysis', {
    circuitBreaker: false, // No circuit breaker for critical ops
    retry: RetryPolicies.exponential(5, 1000),
    timeout: 300000, // 5 minutes
    fallback: () => ({
      analysis: 'Fallback analysis based on cached data',
      confidence: 0.7,
      source: 'cache'
    })
  })
  async performCriticalAnalysis(data: any): Promise<any> {
    logger.info('Performing critical analysis');

    // This could fail but has a fallback
    if (Math.random() < 0.3) {
      throw new Error('Analysis service unavailable');
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      analysis: 'Detailed sustainability analysis',
      confidence: 0.95,
      source: 'live',
      insights: [
        'Carbon emissions reduced by 15%',
        'Energy efficiency improved by 20%',
        'Water usage optimized by 10%'
      ]
    };
  }

  /**
   * Bulk processing with bulkhead isolation
   */
  @WithResilience('ai.bulk_processing', {
    bulkhead: {
      maxConcurrent: 5,
      maxQueueSize: 20
    },
    retry: RetryPolicies.fixed(2, 1000),
    timeout: 60000
  })
  async processBulkDocuments(documents: any[]): Promise<any[]> {
    logger.info('Processing bulk documents', {
      count: documents.length
    });

    // Process each document
    const results = await Promise.all(
      documents.map(doc => this.processDocument(doc))
    );

    return results;
  }

  /**
   * Individual document processing
   */
  private async processDocument(document: any): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000));
    
    return {
      documentId: document.id,
      processed: true,
      extractedData: {
        emissions: Math.random() * 1000,
        energy: Math.random() * 500,
        waste: Math.random() * 100
      }
    };
  }
}

/**
 * Create resilient functions without decorators
 */
export const resilientAIFunctions = {
  /**
   * Summarize text with resilience
   */
  summarizeText: makeResilient(
    async (text: string, maxLength = 500): Promise<string> => {
      logger.info('Summarizing text', { length: text.length, maxLength });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (Math.random() < 0.2) {
        throw new Error('Summarization service temporarily unavailable');
      }
      
      return text.substring(0, maxLength) + '...';
    },
    'ai.summarize',
    {
      circuitBreaker: {
        failureThreshold: 3,
        resetTimeout: 60000
      },
      retry: RetryPolicies.exponential(3, 1000),
      timeout: 30000,
      fallback: () => 'Summary generation temporarily unavailable'
    }
  ),

  /**
   * Extract entities with resilience
   */
  extractEntities: makeResilient(
    async (text: string): Promise<any[]> => {
      logger.info('Extracting entities', { length: text.length });
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return [
        { type: 'ORGANIZATION', value: 'Example Corp', confidence: 0.95 },
        { type: 'LOCATION', value: 'San Francisco', confidence: 0.88 },
        { type: 'DATE', value: '2024-01-15', confidence: 0.92 }
      ];
    },
    'ai.extract_entities',
    ResiliencePolicies.ai()
  )
};

/**
 * Example usage demonstrating resilience behavior
 */
export async function demonstrateResilience() {
  const service = new ResilientAIService();

  // Example 1: Chat completion with automatic retry and circuit breaker
  try {
    const chatResponse = await service.generateChatCompletion(
      [{ role: 'user', content: 'How can I reduce carbon emissions?' }],
      {
        provider: 'openai',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 500
      }
    );
    logger.info('Chat completion succeeded', { id: chatResponse.id });
  } catch (error) {
    logger.error('Chat completion failed after all retries', error as Error);
  }

  // Example 2: Critical analysis with fallback
  try {
    const analysis = await service.performCriticalAnalysis({
      buildingId: 'building-123',
      period: 'Q4-2023'
    });
    logger.info('Analysis completed', { 
      source: analysis.source,
      confidence: analysis.confidence 
    });
  } catch (error) {
    // This should not happen due to fallback
    logger.error('Critical analysis failed', error as Error);
  }

  // Example 3: Bulk processing with bulkhead protection
  const documents = Array(10).fill(null).map((_, i) => ({
    id: `doc-${i}`,
    content: `Document content ${i}`
  }));

  try {
    const results = await service.processBulkDocuments(documents);
    logger.info('Bulk processing completed', { 
      processed: results.filter(r => r.processed).length,
      total: documents.length
    });
  } catch (error) {
    logger.error('Bulk processing failed', error as Error);
  }

  // Example 4: Using resilient functions
  try {
    const summary = await resilientAIFunctions.summarizeText(
      'This is a long text that needs to be summarized...',
      100
    );
    logger.info('Summary generated', { summary });
  } catch (error) {
    logger.error('Summarization failed', error as Error);
  }
}