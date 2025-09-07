/**
 * AI-specific Tracing
 * Phase 4, Task 4.2: Specialized tracing for AI operations
 */

import { SpanKind, SpanStatusCode } from '@opentelemetry/api';
import { tracer } from './tracer';
import type { Span } from '@opentelemetry/api';

/**
 * Trace AI chat completion
 */
export async function traceAIChatCompletion<T>(
  provider: string,
  model: string,
  fn: () => Promise<T>,
  options?: {
    messages?: number;
    maxTokens?: number;
    temperature?: number;
    stream?: boolean;
    userId?: string;
    organizationId?: string;
  }
): Promise<T> {
  return tracer.startActiveSpan(
    'ai.chat_completion',
    async (span) => {
      // Set standard AI attributes
      span.setAttribute('ai.provider', provider);
      span.setAttribute('ai.model', model);
      span.setAttribute('ai.operation.type', 'chat_completion');
      
      // Set optional attributes
      if (options?.messages !== undefined) {
        span.setAttribute('ai.request.messages.count', options.messages);
      }
      if (options?.maxTokens !== undefined) {
        span.setAttribute('ai.request.max_tokens', options.maxTokens);
      }
      if (options?.temperature !== undefined) {
        span.setAttribute('ai.request.temperature', options.temperature);
      }
      if (options?.stream !== undefined) {
        span.setAttribute('ai.request.stream', options.stream);
      }
      if (options?.userId) {
        span.setAttribute('user.id', options.userId);
      }
      if (options?.organizationId) {
        span.setAttribute('organization.id', options.organizationId);
      }

      const startTime = Date.now();

      try {
        const result = await fn();
        
        // Record success metrics
        const duration = Date.now() - startTime;
        span.setAttribute('ai.response.duration_ms', duration);
        
        // Extract token usage if available
        if (result && typeof result === 'object' && 'usage' in result) {
          const usage = (result as any).usage;
          if (usage) {
            span.setAttribute('ai.usage.prompt_tokens', usage.prompt_tokens || 0);
            span.setAttribute('ai.usage.completion_tokens', usage.completion_tokens || 0);
            span.setAttribute('ai.usage.total_tokens', usage.total_tokens || 0);
          }
        }

        return result;
      } catch (error) {
        // Record error details
        recordAIError(span, error as Error, provider, model);
        throw error;
      }
    },
    { kind: SpanKind.CLIENT }
  );
}

/**
 * Trace AI embedding generation
 */
export async function traceAIEmbedding<T>(
  provider: string,
  model: string,
  inputCount: number,
  fn: () => Promise<T>
): Promise<T> {
  return tracer.startActiveSpan(
    'ai.embedding',
    async (span) => {
      span.setAttribute('ai.provider', provider);
      span.setAttribute('ai.model', model);
      span.setAttribute('ai.operation.type', 'embedding');
      span.setAttribute('ai.request.input_count', inputCount);

      try {
        const result = await fn();
        
        // Extract embedding dimensions if available
        if (result && Array.isArray(result) && result.length > 0) {
          const firstEmbedding = result[0];
          if (firstEmbedding && 'embedding' in firstEmbedding) {
            span.setAttribute('ai.response.embedding_dimensions', 
              (firstEmbedding as any).embedding.length);
          }
        }

        return result;
      } catch (error) {
        recordAIError(span, error as Error, provider, model);
        throw error;
      }
    },
    { kind: SpanKind.CLIENT }
  );
}

/**
 * Trace semantic cache operations
 */
export async function traceSemanticCache<T>(
  operation: 'lookup' | 'store' | 'invalidate',
  cacheKey: string,
  fn: () => Promise<T>
): Promise<T> {
  return tracer.startActiveSpan(
    `ai.cache.${operation}`,
    async (span) => {
      span.setAttribute('cache.operation', operation);
      span.setAttribute('cache.key', cacheKey);
      span.setAttribute('cache.type', 'semantic');

      const startTime = Date.now();

      try {
        const result = await fn();
        
        const duration = Date.now() - startTime;
        span.setAttribute('cache.duration_ms', duration);

        // Record cache hit/miss for lookups
        if (operation === 'lookup' && result !== null && result !== undefined) {
          span.setAttribute('cache.hit', true);
          span.addEvent('cache_hit', { key: cacheKey });
        } else if (operation === 'lookup') {
          span.setAttribute('cache.hit', false);
          span.addEvent('cache_miss', { key: cacheKey });
        }

        return result;
      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: `Cache ${operation} failed`
        });
        throw error;
      }
    },
    { kind: SpanKind.CLIENT }
  );
}

/**
 * Trace AI queue operations
 */
export async function traceAIQueue<T>(
  operation: 'enqueue' | 'dequeue' | 'process',
  requestId: string,
  fn: () => Promise<T>,
  options?: {
    priority?: string;
    position?: number;
    provider?: string;
    model?: string;
  }
): Promise<T> {
  return tracer.startActiveSpan(
    `ai.queue.${operation}`,
    async (span) => {
      span.setAttribute('queue.operation', operation);
      span.setAttribute('queue.request_id', requestId);
      
      if (options?.priority) {
        span.setAttribute('queue.priority', options.priority);
      }
      if (options?.position !== undefined) {
        span.setAttribute('queue.position', options.position);
      }
      if (options?.provider) {
        span.setAttribute('ai.provider', options.provider);
      }
      if (options?.model) {
        span.setAttribute('ai.model', options.model);
      }

      const startTime = Date.now();

      try {
        const result = await fn();
        
        const duration = Date.now() - startTime;
        span.setAttribute('queue.duration_ms', duration);

        if (operation === 'process') {
          span.addEvent('request_processed', {
            request_id: requestId,
            duration
          });
        }

        return result;
      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: `Queue ${operation} failed`
        });
        throw error;
      }
    },
    { kind: SpanKind.INTERNAL }
  );
}

/**
 * Trace ML model operations
 */
export async function traceMLOperation<T>(
  operation: 'train' | 'predict' | 'evaluate',
  modelType: string,
  fn: () => Promise<T>,
  options?: {
    datasetSize?: number;
    features?: number;
    batchSize?: number;
    epochs?: number;
  }
): Promise<T> {
  return tracer.startActiveSpan(
    `ml.${operation}`,
    async (span) => {
      span.setAttribute('ml.operation', operation);
      span.setAttribute('ml.model_type', modelType);
      
      if (options?.datasetSize !== undefined) {
        span.setAttribute('ml.dataset_size', options.datasetSize);
      }
      if (options?.features !== undefined) {
        span.setAttribute('ml.features', options.features);
      }
      if (options?.batchSize !== undefined) {
        span.setAttribute('ml.batch_size', options.batchSize);
      }
      if (options?.epochs !== undefined) {
        span.setAttribute('ml.epochs', options.epochs);
      }

      const startTime = Date.now();

      try {
        const result = await fn();
        
        const duration = Date.now() - startTime;
        span.setAttribute('ml.duration_ms', duration);

        // Record operation-specific events
        if (operation === 'train') {
          span.addEvent('training_completed', {
            duration,
            model_type: modelType
          });
        } else if (operation === 'predict') {
          span.addEvent('prediction_completed', {
            duration,
            model_type: modelType
          });
        }

        return result;
      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: `ML ${operation} failed`
        });
        throw error;
      }
    },
    { kind: SpanKind.INTERNAL }
  );
}

/**
 * Trace autonomous agent operations
 */
export async function traceAgentOperation<T>(
  agentId: string,
  agentType: string,
  operation: string,
  fn: () => Promise<T>,
  options?: {
    decision?: string;
    confidence?: number;
    impact?: string;
    requiresApproval?: boolean;
  }
): Promise<T> {
  return tracer.startActiveSpan(
    `agent.${operation}`,
    async (span) => {
      span.setAttribute('agent.id', agentId);
      span.setAttribute('agent.type', agentType);
      span.setAttribute('agent.operation', operation);
      
      if (options?.decision) {
        span.setAttribute('agent.decision', options.decision);
      }
      if (options?.confidence !== undefined) {
        span.setAttribute('agent.confidence', options.confidence);
      }
      if (options?.impact) {
        span.setAttribute('agent.impact', options.impact);
      }
      if (options?.requiresApproval !== undefined) {
        span.setAttribute('agent.requires_approval', options.requiresApproval);
      }

      try {
        const result = await fn();
        
        span.addEvent('agent_action_completed', {
          agent_id: agentId,
          operation,
          success: true
        });

        return result;
      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: `Agent ${operation} failed`
        });
        span.addEvent('agent_action_failed', {
          agent_id: agentId,
          operation,
          error: (error as Error).message
        });
        throw error;
      }
    },
    { kind: SpanKind.INTERNAL }
  );
}

/**
 * Record AI-specific errors
 */
function recordAIError(span: Span, error: Error, provider: string, model: string): void {
  span.recordException(error);
  
  // Determine error type
  let errorType = 'unknown';
  let isRetryable = false;
  
  const errorMessage = error.message.toLowerCase();
  if (errorMessage.includes('rate limit')) {
    errorType = 'rate_limit';
    isRetryable = true;
  } else if (errorMessage.includes('timeout')) {
    errorType = 'timeout';
    isRetryable = true;
  } else if (errorMessage.includes('api key') || errorMessage.includes('authentication')) {
    errorType = 'authentication';
    isRetryable = false;
  } else if (errorMessage.includes('model not found')) {
    errorType = 'model_not_found';
    isRetryable = false;
  } else if (errorMessage.includes('context length') || errorMessage.includes('token limit')) {
    errorType = 'context_length_exceeded';
    isRetryable = false;
  }

  span.setAttribute('ai.error.type', errorType);
  span.setAttribute('ai.error.retryable', isRetryable);
  span.setAttribute('ai.error.provider', provider);
  span.setAttribute('ai.error.model', model);
  
  span.setStatus({
    code: SpanStatusCode.ERROR,
    message: error.message
  });

  span.addEvent('ai_error', {
    error_type: errorType,
    provider,
    model,
    retryable: isRetryable,
    message: error.message
  });
}