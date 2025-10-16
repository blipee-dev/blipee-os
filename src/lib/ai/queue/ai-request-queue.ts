/**
 * AI Request Queue System
 * Phase 3, Task 3.1: Upstash Redis-based queuing for AI requests
 */

import { Redis } from '@upstash/redis';
import { v4 as uuidv4 } from 'uuid';

export interface AIRequest {
  id: string;
  provider: 'deepseek' | 'openai' | 'anthropic';
  model: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  options?: {
    temperature?: number;
    maxTokens?: number;
    streaming?: boolean;
  };
  priority: 'low' | 'normal' | 'high' | 'critical';
  userId?: string;
  organizationId?: string;
  conversationId?: string;
  createdAt: number;
  retryCount: number;
  maxRetries: number;
  timeout: number; // milliseconds
}

export interface AIResponse {
  requestId: string;
  success: boolean;
  response?: {
    content: string;
    model: string;
    usage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    finishReason: string;
  };
  error?: {
    type: string;
    message: string;
    code?: string;
  };
  processingTime: number;
  provider: string;
  completedAt: number;
}

export interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  avgProcessingTime: number;
  avgWaitTime: number;
  throughputPerMinute: number;
  errorRate: number;
}

/**
 * AI Request Queue Manager
 * High-performance Upstash Redis-based queue for AI requests with priority handling
 */
export class AIRequestQueue {
  private redis: Redis;
  private isProcessing = false;
  private processedCount = 0;
  private errorCount = 0;
  private startTime = Date.now();
  
  private readonly QUEUE_KEY = 'ai:requests';
  private readonly PROCESSING_KEY = 'ai:processing';
  private readonly COMPLETED_KEY = 'ai:completed';
  private readonly FAILED_KEY = 'ai:failed';
  private readonly STATS_KEY = 'ai:stats';
  private readonly RATE_LIMIT_KEY = 'ai:rate_limits';

  constructor() {
    // Initialize Upstash Redis client
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    this.initializeQueue();
  }

  /**
   * Initialize queue system
   */
  private initializeQueue(): void {
    try {
      // Upstash Redis is connectionless - no need to connect
    } catch (error) {
      console.error('❌ Failed to initialize AI Request Queue:', error);
      throw error;
    }
  }

  /**
   * Add AI request to queue with priority handling
   */
  async enqueue(
    provider: AIRequest['provider'],
    model: string,
    messages: AIRequest['messages'],
    options: {
      priority?: AIRequest['priority'];
      userId?: string;
      organizationId?: string;
      conversationId?: string;
      maxRetries?: number;
      timeout?: number;
      temperature?: number;
      maxTokens?: number;
      streaming?: boolean;
    } = {}
  ): Promise<string> {
    const requestId = uuidv4();
    
    const request: AIRequest = {
      id: requestId,
      provider,
      model,
      messages,
      options: {
        temperature: options.temperature,
        maxTokens: options.maxTokens,
        streaming: options.streaming
      },
      priority: options.priority || 'normal',
      userId: options.userId,
      organizationId: options.organizationId,
      conversationId: options.conversationId,
      createdAt: Date.now(),
      retryCount: 0,
      maxRetries: options.maxRetries || 3,
      timeout: options.timeout || 30000 // 30 seconds default
    };

    // Calculate priority score for queue ordering
    const priorityScore = this.calculatePriorityScore(request);

    try {
      // Add to priority queue (sorted set with score)
      await this.redis.zadd(this.QUEUE_KEY, { score: priorityScore, member: JSON.stringify(request) });
      
      // Update queue stats
      await this.updateQueueStats('pending', 1);

      return requestId;

    } catch (error) {
      console.error(`❌ Failed to enqueue request ${requestId}:`, error);
      throw error;
    }
  }

  /**
   * Dequeue highest priority request for processing
   */
  async dequeue(): Promise<AIRequest | null> {
    try {
      // Get highest priority request (highest score)
      const result = await this.redis.zpopmax(this.QUEUE_KEY, 1) as any;
      
      if (!result || result.length === 0) {
        return null;
      }

      // Upstash returns [parsedObject, score] pairs - no need to JSON.parse
      const request: AIRequest = result[0] as AIRequest;

      // Move to processing set
      await this.redis.hset(this.PROCESSING_KEY, {
        [request.id]: JSON.stringify({
          ...request,
          processingStarted: Date.now()
        })
      });

      // Update stats
      await this.updateQueueStats('pending', -1);
      await this.updateQueueStats('processing', 1);

      return request;

    } catch (error) {
      console.error('❌ Failed to dequeue request:', error);
      return null;
    }
  }

  /**
   * Mark request as completed with response
   */
  async complete(requestId: string, response: Omit<AIResponse, 'requestId'>): Promise<void> {
    try {
      // Remove from processing - Upstash returns objects directly
      const processingData = await this.redis.hget(this.PROCESSING_KEY, requestId) as (AIRequest & { processingStarted: number }) | null;
      if (!processingData) {
        throw new Error(`Request ${requestId} not found in processing queue`);
      }

      await this.redis.hdel(this.PROCESSING_KEY, requestId);

      // Add to completed with TTL
      const completedResponse: AIResponse = {
        requestId,
        ...response
      };

      await this.redis.setex(
        `${this.COMPLETED_KEY}:${requestId}`,
        3600, // 1 hour TTL
        JSON.stringify(completedResponse)
      );

      // Update stats
      await this.updateQueueStats('processing', -1);
      await this.updateQueueStats('completed', 1);
      
      if (response.success) {
        this.processedCount++;
      } else {
        this.errorCount++;
      }

      // Note: Event publishing can be added later if needed


    } catch (error) {
      console.error(`❌ Failed to complete request ${requestId}:`, error);
      throw error;
    }
  }

  /**
   * Mark request as failed and handle retry logic
   */
  async fail(requestId: string, error: AIResponse['error']): Promise<boolean> {
    try {
      const processingData = await this.redis.hget(this.PROCESSING_KEY, requestId) as (AIRequest & { processingStarted: number }) | null;
      if (!processingData) {
        throw new Error(`Request ${requestId} not found in processing queue`);
      }

      const request: AIRequest & { processingStarted: number } = processingData;
      
      // Check if we should retry
      if (request.retryCount < request.maxRetries) {
        request.retryCount++;
        
        // Re-queue with lower priority (reduce score)
        const priorityScore = this.calculatePriorityScore(request) - 1000;
        
        await this.redis.zadd(this.QUEUE_KEY, { score: priorityScore, member: JSON.stringify(request) });
        await this.redis.hdel(this.PROCESSING_KEY, requestId);
        
        return true; // Will retry
      }

      // Max retries reached - mark as permanently failed
      await this.redis.hdel(this.PROCESSING_KEY, requestId);
      
      const failedResponse: AIResponse = {
        requestId,
        success: false,
        error,
        processingTime: Date.now() - request.processingStarted,
        provider: request.provider,
        completedAt: Date.now()
      };

      await this.redis.setex(
        `${this.FAILED_KEY}:${requestId}`,
        86400, // 24 hour TTL for failed requests
        JSON.stringify(failedResponse)
      );

      // Update stats
      await this.updateQueueStats('processing', -1);
      await this.updateQueueStats('failed', 1);
      this.errorCount++;

      return false; // Won't retry

    } catch (error) {
      console.error(`❌ Failed to handle request failure ${requestId}:`, error);
      throw error;
    }
  }

  /**
   * Get request status and response
   */
  async getRequestStatus(requestId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'not_found';
    response?: AIResponse;
    position?: number;
  }> {
    try {
      // Check completed requests - Upstash returns objects directly
      const completed = await this.redis.get(`${this.COMPLETED_KEY}:${requestId}`) as AIResponse | null;
      if (completed) {
        return {
          status: 'completed',
          response: completed
        };
      }

      // Check failed requests - Upstash returns objects directly
      const failed = await this.redis.get(`${this.FAILED_KEY}:${requestId}`) as AIResponse | null;
      if (failed) {
        return {
          status: 'failed',
          response: failed
        };
      }

      // Check processing requests - Upstash returns objects directly
      const processing = await this.redis.hget(this.PROCESSING_KEY, requestId) as (AIRequest & { processingStarted: number }) | null;
      if (processing) {
        return { status: 'processing' };
      }

      // Check pending queue - Upstash returns objects directly
      const queueItems = await this.redis.zrange(this.QUEUE_KEY, 0, -1, { rev: true }) as AIRequest[];
      for (let i = 0; i < queueItems.length; i++) {
        const request = queueItems[i];
        if (request && request.id === requestId) {
          return {
            status: 'pending',
            position: i + 1
          };
        }
      }

      return { status: 'not_found' };

    } catch (error) {
      console.error(`❌ Failed to get request status ${requestId}:`, error);
      return { status: 'not_found' };
    }
  }

  /**
   * Get comprehensive queue statistics
   */
  async getQueueStats(): Promise<QueueStats> {
    try {
      const [pending, processing, completed, failed] = await Promise.all([
        this.redis.zcard(this.QUEUE_KEY),
        this.redis.hlen(this.PROCESSING_KEY),
        this.redis.get(`${this.STATS_KEY}:completed`),
        this.redis.get(`${this.STATS_KEY}:failed`)
      ]);

      const runtime = (Date.now() - this.startTime) / 1000 / 60; // minutes
      const throughputPerMinute = runtime > 0 ? this.processedCount / runtime : 0;
      const errorRate = this.processedCount > 0 ? (this.errorCount / this.processedCount) * 100 : 0;

      return {
        pending: pending as number || 0,
        processing: processing as number || 0,
        completed: parseInt(String(completed || '0')),
        failed: parseInt(String(failed || '0')),
        avgProcessingTime: 2500, // TODO: Calculate from actual data
        avgWaitTime: 1200, // TODO: Calculate from actual data
        throughputPerMinute: Math.round(throughputPerMinute * 100) / 100,
        errorRate: Math.round(errorRate * 100) / 100
      };

    } catch (error) {
      console.error('❌ Failed to get queue stats:', error);
      throw error;
    }
  }

  /**
   * Clean up old completed and failed requests
   */
  async cleanup(): Promise<void> {
    try {
      const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
      
      // Clean up old completed requests - Upstash returns objects directly
      const completedKeys = await this.redis.keys(`${this.COMPLETED_KEY}:*`);
      for (const key of completedKeys) {
        const data = await this.redis.get(key) as AIResponse | null;
        if (data && data.completedAt < cutoff) {
          await this.redis.del(key);
        }
      }

      // Clean up old failed requests (keep longer for debugging)
      const failedCutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago
      const failedKeys = await this.redis.keys(`${this.FAILED_KEY}:*`);
      for (const key of failedKeys) {
        const data = await this.redis.get(key) as AIResponse | null;
        if (data && data.completedAt < failedCutoff) {
          await this.redis.del(key);
        }
      }


    } catch (error) {
      console.error('❌ Failed to cleanup queue:', error);
    }
  }

  /**
   * Calculate priority score for queue ordering
   */
  private calculatePriorityScore(request: AIRequest): number {
    const priorityWeights = {
      critical: 1000000,
      high: 100000,
      normal: 10000,
      low: 1000
    };

    const baseScore = priorityWeights[request.priority];
    const timeScore = Date.now() - request.createdAt; // Older requests get higher priority
    const retryPenalty = request.retryCount * 5000; // Retries get lower priority

    return baseScore + timeScore - retryPenalty;
  }

  /**
   * Update queue statistics
   */
  private async updateQueueStats(metric: string, delta: number): Promise<void> {
    try {
      await this.redis.incrby(`${this.STATS_KEY}:${metric}`, delta);
    } catch (error) {
      console.error(`Failed to update ${metric} stats:`, error);
    }
  }


  /**
   * Start processing queue (should be called by worker processes)
   */
  async startProcessing(concurrency: number = 3): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    // Start multiple workers
    const workers = Array.from({ length: concurrency }, (_, i) => 
      this.processWorker(i + 1)
    );

    await Promise.all(workers);
  }

  /**
   * Stop queue processing
   */
  async stopProcessing(): Promise<void> {
    this.isProcessing = false;
  }

  /**
   * Worker process to handle queued requests
   */
  private async processWorker(workerId: number): Promise<void> {

    while (this.isProcessing) {
      try {
        const request = await this.dequeue();
        
        if (!request) {
          // No requests available, wait a bit
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }

        // Process the request
        await this.processAIRequest(request, workerId);

      } catch (error) {
        console.error(`Worker ${workerId} error:`, error);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait before retry
      }
    }

  }

  /**
   * Process individual AI request
   */
  private async processAIRequest(request: AIRequest, workerId: number): Promise<void> {
    const startTime = Date.now();
    
    try {
      
      // TODO: This will be replaced with actual AI service calls
      // For now, simulate processing
      await this.simulateAICall(request);
      
      const processingTime = Date.now() - startTime;
      
      // Simulate successful response
      await this.complete(request.id, {
        success: true,
        response: {
          content: `Simulated response for ${request.messages[request.messages.length - 1]?.content}`,
          model: request.model,
          usage: {
            promptTokens: 100,
            completionTokens: 50,
            totalTokens: 150
          },
          finishReason: 'stop'
        },
        processingTime,
        provider: request.provider,
        completedAt: Date.now()
      });

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      await this.fail(request.id, {
        type: 'processing_error',
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'WORKER_ERROR'
      });
    }
  }

  /**
   * Simulate AI API call (placeholder for actual implementation)
   */
  private async simulateAICall(request: AIRequest): Promise<void> {
    // Simulate processing time based on message length
    const messageLength = request.messages.reduce((sum, msg) => sum + msg.content.length, 0);
    const processingTime = Math.min(messageLength * 10, 5000); // Max 5 seconds
    
    await new Promise(resolve => setTimeout(resolve, processingTime));
    
    // Simulate occasional failures for testing
    if (Math.random() < 0.05) { // 5% failure rate
      throw new Error('Simulated AI service error');
    }
  }

  /**
   * Cleanup resources
   */
  async disconnect(): Promise<void> {
    await this.stopProcessing();
    // Upstash Redis is connectionless - no need to disconnect
  }
}

/**
 * Create AI request queue instance
 */
export function createAIRequestQueue(): AIRequestQueue {
  return new AIRequestQueue();
}