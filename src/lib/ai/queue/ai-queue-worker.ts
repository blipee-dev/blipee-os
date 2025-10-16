/**
 * AI Queue Worker Service
 * Phase 3, Task 3.1: Background worker for processing AI requests
 */

import { createAIRequestQueue, AIRequest } from './ai-request-queue';
import { createAIService } from '@/lib/ai/service';
import { createSemanticCache } from '@/lib/ai/cache/semantic-cache';
import { createCostOptimizer } from '@/lib/ai/cost/cost-optimizer';

export interface WorkerConfig {
  concurrency: number;
  maxProcessingTime: number;
  healthCheckInterval: number;
  retryDelay: number;
}

export interface WorkerStats {
  workerId: string;
  startTime: number;
  requestsProcessed: number;
  requestsSucceeded: number;
  requestsFailed: number;
  averageProcessingTime: number;
  lastActivityTime: number;
  status: 'idle' | 'processing' | 'stopping' | 'error';
}

/**
 * AI Queue Worker
 * Processes AI requests from the queue using actual AI services
 */
export class AIQueueWorker {
  private queue = createAIRequestQueue();
  private aiService = createAIService();
  private semanticCache = createSemanticCache();
  private costOptimizer = createCostOptimizer();
  private isRunning = false;
  private workerId: string;
  private stats: WorkerStats;
  private config: WorkerConfig;

  constructor(workerId?: string, config?: Partial<WorkerConfig>) {
    this.workerId = workerId || `worker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    this.config = {
      concurrency: 3,
      maxProcessingTime: 60000, // 60 seconds
      healthCheckInterval: 30000, // 30 seconds
      retryDelay: 5000, // 5 seconds
      ...config
    };

    this.stats = {
      workerId: this.workerId,
      startTime: Date.now(),
      requestsProcessed: 0,
      requestsSucceeded: 0,
      requestsFailed: 0,
      averageProcessingTime: 0,
      lastActivityTime: Date.now(),
      status: 'idle'
    };

  }

  /**
   * Start the worker
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.stats.status = 'idle';
    this.stats.startTime = Date.now();


    // Start worker processes
    const workers = Array.from({ length: this.config.concurrency }, (_, i) =>
      this.runWorkerProcess(i + 1)
    );

    // Start health check
    const healthCheck = this.runHealthCheck();

    try {
      await Promise.race([
        Promise.all(workers),
        healthCheck
      ]);
    } catch (error) {
      console.error(`❌ Worker ${this.workerId} encountered error:`, error);
      this.stats.status = 'error';
    } finally {
      await this.stop();
    }
  }

  /**
   * Stop the worker gracefully
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    this.stats.status = 'stopping';

    // Give some time for current requests to finish
    await new Promise(resolve => setTimeout(resolve, 2000));

    await this.queue.disconnect();
  }

  /**
   * Get worker statistics
   */
  getStats(): WorkerStats {
    const runtime = Date.now() - this.stats.startTime;
    return {
      ...this.stats,
      averageProcessingTime: this.stats.requestsProcessed > 0 
        ? this.stats.averageProcessingTime / this.stats.requestsProcessed
        : 0
    };
  }

  /**
   * Individual worker process
   */
  private async runWorkerProcess(processId: number): Promise<void> {

    while (this.isRunning) {
      try {
        // Dequeue next request
        const request = await this.queue.dequeue();
        
        if (!request) {
          // No requests available, wait
          await this.sleep(1000);
          continue;
        }

        // Process the request
        this.stats.status = 'processing';
        this.stats.lastActivityTime = Date.now();
        
        await this.processRequest(request, processId);
        
        this.stats.status = 'idle';

      } catch (error) {
        console.error(`❌ Worker process ${processId} error:`, error);
        await this.sleep(this.config.retryDelay);
      }
    }

  }

  /**
   * Process individual AI request
   */
  private async processRequest(request: AIRequest, processId: number): Promise<void> {
    const startTime = Date.now();
    
    try {
      
      // Check for timeout
      const requestAge = Date.now() - request.createdAt;
      if (requestAge > request.timeout) {
        throw new Error(`Request timeout: ${requestAge}ms > ${request.timeout}ms`);
      }

      // Process with actual AI service
      const response = await this.callAIService(request);
      
      const processingTime = Date.now() - startTime;
      
      // Complete the request
      await this.queue.complete(request.id, {
        success: true,
        response,
        processingTime,
        provider: request.provider,
        completedAt: Date.now()
      });

      // Store successful response in semantic cache
      try {
        const cacheResponse = {
          content: response.content,
          model: response.model,
          usage: response.usage,
          finishReason: response.finishReason,
          provider: request.provider
        };

        await this.semanticCache.set(request.messages, cacheResponse, {
          organizationId: request.organizationId,
          userId: request.userId,
          conversationId: request.conversationId,
          tags: ['worker_cached', request.provider, request.priority, 'processed']
        });

        
      } catch (cacheError) {
        console.error(`⚠️ Failed to cache response for ${request.id.slice(-8)}:`, cacheError);
        // Don't fail the request if caching fails
      }

      // Track cost metrics for optimization
      try {
        if (request.organizationId) {
          await this.costOptimizer.trackRequest(
            request.organizationId,
            request.provider,
            response.model,
            response.usage,
            {
              latency: processingTime,
              cached: false,
              userId: request.userId,
              priority: request.priority,
              success: true
            }
          );
        }
      } catch (costError) {
        console.error(`⚠️ Failed to track cost for ${request.id.slice(-8)}:`, costError);
        // Don't fail the request if cost tracking fails
      }

      // Update stats
      this.stats.requestsProcessed++;
      this.stats.requestsSucceeded++;
      this.stats.averageProcessingTime += processingTime;


    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      console.error(`❌ Process ${processId} failed to process ${request.id.slice(-8)}:`, error);

      // Fail the request (will handle retries)
      const willRetry = await this.queue.fail(request.id, {
        type: 'processing_error',
        message: error instanceof Error ? error.message : 'Unknown processing error',
        code: error instanceof Error && 'code' in error ? String(error.code) : 'PROCESSING_ERROR'
      });

      // Update stats
      this.stats.requestsProcessed++;
      if (!willRetry) {
        this.stats.requestsFailed++;
      }
      this.stats.averageProcessingTime += processingTime;

    }
  }

  /**
   * Call actual AI service based on request
   */
  private async callAIService(request: AIRequest): Promise<{
    content: string;
    model: string;
    usage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    finishReason: string;
  }> {
    try {
      // Convert queue request format to AI service format
      const aiRequest = {
        messages: request.messages,
        model: request.model,
        temperature: request.options?.temperature,
        maxTokens: request.options?.maxTokens,
        streaming: false, // Queue always uses non-streaming
        userId: request.userId,
        organizationId: request.organizationId,
        conversationId: request.conversationId
      };

      // Call the appropriate AI service
      const response = await this.aiService.generateResponse(
        aiRequest,
        request.provider,
        {
          timeout: Math.min(request.timeout, this.config.maxProcessingTime),
          retries: 0 // Queue handles retries
        }
      );

      return {
        content: response.content,
        model: response.model || request.model,
        usage: {
          promptTokens: response.usage?.promptTokens || 0,
          completionTokens: response.usage?.completionTokens || 0,
          totalTokens: response.usage?.totalTokens || 0
        },
        finishReason: response.finishReason || 'stop'
      };

    } catch (error) {
      // Re-throw with more context
      throw new Error(`AI Service Error (${request.provider}): ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Health check process
   */
  private async runHealthCheck(): Promise<void> {
    
    while (this.isRunning) {
      try {
        // Check if worker has been idle too long
        const idleTime = Date.now() - this.stats.lastActivityTime;
        
        if (idleTime > this.config.healthCheckInterval * 2) {
        }

        // Check queue health
        const queueStats = await this.queue.getQueueStats();
        
        if (queueStats.pending > 100) {
        }

        // Log worker stats periodically
        const stats = this.getStats();

      } catch (error) {
        console.error(`❌ Health check error for worker ${this.workerId}:`, error);
      }

      await this.sleep(this.config.healthCheckInterval);
    }

  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Create and start AI queue worker
 */
export function createAIQueueWorker(workerId?: string, config?: Partial<WorkerConfig>): AIQueueWorker {
  return new AIQueueWorker(workerId, config);
}

/**
 * Start multiple AI queue workers
 */
export async function startAIQueueWorkers(
  workerCount: number = 3,
  config?: Partial<WorkerConfig>
): Promise<AIQueueWorker[]> {
  
  const workers: AIQueueWorker[] = [];
  
  for (let i = 0; i < workerCount; i++) {
    const worker = createAIQueueWorker(`worker-${i + 1}`, config);
    workers.push(worker);
    
    // Start worker (don't await - start in parallel)
    worker.start().catch(error => {
      console.error(`❌ Worker ${i + 1} failed:`, error);
    });
    
    // Small delay between worker starts
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return workers;
}