/**
 * AI Operations Logger
 * Phase 4, Task 4.1: Structured logging for AI/ML operations
 */

import { logger } from './structured-logger';

export interface AILogContext {
  provider?: string;
  model?: string;
  operation?: string;
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
  cost?: {
    amount: number;
    currency: string;
  };
  cache?: {
    hit: boolean;
    similarity?: number;
    cacheId?: string;
  };
  queue?: {
    requestId: string;
    priority: string;
    position?: number;
  };
  performance?: {
    latency: number;
    throughput?: number;
  };
  error?: {
    type: string;
    retryable: boolean;
    attempts?: number;
  };
}

/**
 * AI-specific logger with enhanced context
 */
export class AILogger {
  private aiLogger: any;

  constructor() {
    this.aiLogger = logger.child({
      component: 'ai',
      service: 'ai-operations'
    });
  }

  /**
   * Log AI request
   */
  logRequest(
    operation: string,
    provider: string,
    model: string,
    metadata?: Partial<AILogContext>
  ): void {
    this.aiLogger.info(`AI request: ${operation}`, {
      provider,
      model,
      ...metadata
    });
  }

  /**
   * Log AI response
   */
  logResponse(
    operation: string,
    provider: string,
    model: string,
    success: boolean,
    metadata?: Partial<AILogContext>
  ): void {
    const level = success ? 'info' : 'error';
    this.aiLogger[level](`AI response: ${operation}`, {
      provider,
      model,
      success,
      ...metadata
    });
  }

  /**
   * Log cache operation
   */
  logCacheOperation(
    operation: 'lookup' | 'store' | 'invalidate',
    hit: boolean,
    metadata?: {
      cacheId?: string;
      similarity?: number;
      organizationId?: string;
      tags?: string[];
    }
  ): void {
    this.aiLogger.debug(`Cache ${operation}: ${hit ? 'HIT' : 'MISS'}`, {
      cache: {
        hit,
        ...metadata
      }
    });
  }

  /**
   * Log queue operation
   */
  logQueueOperation(
    operation: 'enqueue' | 'dequeue' | 'process' | 'complete' | 'fail',
    requestId: string,
    metadata?: {
      priority?: string;
      position?: number;
      provider?: string;
      model?: string;
      duration?: number;
      error?: Error;
    }
  ): void {
    const level = operation === 'fail' ? 'error' : 'info';
    this.aiLogger[level](`Queue ${operation}: ${requestId}`, {
      queue: {
        requestId,
        operation,
        ...metadata
      }
    });
  }

  /**
   * Log cost tracking
   */
  logCostTracking(
    provider: string,
    model: string,
    tokens: AILogContext['tokens'],
    cost: number,
    metadata?: {
      organizationId?: string;
      cached?: boolean;
      budgetRemaining?: number;
      budgetLimit?: number;
    }
  ): void {
    this.aiLogger.info('AI cost tracked', {
      provider,
      model,
      tokens,
      cost: {
        amount: cost,
        currency: 'USD'
      },
      ...metadata
    });

    // Warn if approaching budget limit
    if (metadata?.budgetRemaining && metadata?.budgetLimit) {
      const percentageUsed = 
        ((metadata.budgetLimit - metadata.budgetRemaining) / metadata.budgetLimit) * 100;
      
      if (percentageUsed >= 90) {
        this.aiLogger.warn('AI budget critical', {
          organizationId: metadata.organizationId,
          percentageUsed,
          remaining: metadata.budgetRemaining,
          limit: metadata.budgetLimit
        });
      } else if (percentageUsed >= 75) {
        this.aiLogger.warn('AI budget warning', {
          organizationId: metadata.organizationId,
          percentageUsed,
          remaining: metadata.budgetRemaining,
          limit: metadata.budgetLimit
        });
      }
    }
  }

  /**
   * Log model performance
   */
  logModelPerformance(
    model: string,
    operation: string,
    metrics: {
      latency: number;
      throughput?: number;
      accuracy?: number;
      tokenPerSecond?: number;
    }
  ): void {
    this.aiLogger.info(`Model performance: ${model}`, {
      operation,
      performance: metrics
    });

    // Warn on poor performance
    if (metrics.latency > 5000) {
      this.aiLogger.warn(`Slow AI response: ${model}`, {
        operation,
        latency: metrics.latency,
        threshold: 5000
      });
    }
  }

  /**
   * Log ML pipeline operations
   */
  logMLPipeline(
    pipeline: string,
    stage: 'start' | 'preprocessing' | 'training' | 'evaluation' | 'complete' | 'error',
    metadata?: {
      datasetSize?: number;
      features?: number;
      modelType?: string;
      hyperparameters?: Record<string, any>;
      metrics?: Record<string, number>;
      duration?: number;
      error?: Error;
    }
  ): void {
    const level = stage === 'error' ? 'error' : 'info';
    this.aiLogger[level](`ML Pipeline ${stage}: ${pipeline}`, {
      ml: {
        pipeline,
        stage,
        ...metadata
      }
    });
  }

  /**
   * Log autonomous agent operations
   */
  logAgentOperation(
    agentId: string,
    agentType: string,
    action: string,
    metadata?: {
      decision?: any;
      confidence?: number;
      impact?: string;
      requiresApproval?: boolean;
      approved?: boolean;
      executionTime?: number;
      error?: Error;
    }
  ): void {
    this.aiLogger.info(`Agent action: ${agentType}`, {
      agent: {
        id: agentId,
        type: agentType,
        action,
        ...metadata
      }
    });
  }

  /**
   * Log embedding operations
   */
  logEmbeddingOperation(
    operation: 'generate' | 'compare' | 'store',
    metadata?: {
      provider?: string;
      model?: string;
      dimensions?: number;
      count?: number;
      similarity?: number;
      duration?: number;
    }
  ): void {
    this.aiLogger.debug(`Embedding ${operation}`, {
      embedding: {
        operation,
        ...metadata
      }
    });
  }

  /**
   * Log AI error with context
   */
  logError(
    operation: string,
    error: Error,
    metadata?: {
      provider?: string;
      model?: string;
      retryable?: boolean;
      attempts?: number;
      willRetry?: boolean;
    }
  ): void {
    this.aiLogger.error(`AI operation failed: ${operation}`, error, {
      ai_error: {
        operation,
        type: error.name,
        ...metadata
      }
    });
  }

  /**
   * Create a timer for AI operations
   */
  startTimer(operation: string): () => void {
    const startTime = Date.now();
    return () => {
      const duration = Date.now() - startTime;
      this.aiLogger.debug(`AI operation timing: ${operation}`, {
        performance: {
          operation,
          duration
        }
      });
      return duration;
    };
  }
}

// Global AI logger instance
export const aiLogger = new AILogger();

/**
 * Decorator for logging AI service methods
 */
export function LogAIOperation(operation?: string): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    const operationName = operation || String(propertyKey);

    descriptor.value = async function (...args: any[]) {
      const timer = aiLogger.startTimer(operationName);
      
      try {
        aiLogger.logRequest(operationName, 'unknown', 'unknown', {
          operation: operationName,
          class: target.constructor.name,
          method: String(propertyKey)
        });

        const result = await originalMethod.apply(this, args);
        const duration = timer();

        aiLogger.logResponse(operationName, 'unknown', 'unknown', true, {
          performance: { latency: duration }
        });

        return result;
      } catch (error) {
        const duration = timer();

        aiLogger.logError(operationName, error as Error, {
          performance: { latency: duration }
        });

        throw error;
      }
    };

    return descriptor;
  };
}