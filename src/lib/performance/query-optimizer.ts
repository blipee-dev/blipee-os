/**
 * Query Optimizer Service
 *
 * Provides query optimization utilities and caching for high-performance database operations
 * Part of FASE 3 - Week 2: Performance & Optimization
 */

import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Query cache configuration
 */
interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  key: string;
}

/**
 * Cache entry
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Query optimization utilities
 */
export class QueryOptimizer {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private cacheHits = 0;
  private cacheMisses = 0;

  /**
   * Execute a query with caching
   */
  async executeWithCache<T>(
    cacheConfig: CacheConfig,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const cached = this.getFromCache<T>(cacheConfig.key);
    if (cached !== null) {
      this.cacheHits++;
      return cached;
    }

    this.cacheMisses++;
    const result = await queryFn();
    this.setCache(cacheConfig.key, result, cacheConfig.ttl);
    return result;
  }

  /**
   * Get data from cache
   */
  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set data in cache
   */
  private setCache<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });

    // Prevent memory leaks - limit cache size to 1000 entries
    if (this.cache.size > 1000) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
  }

  /**
   * Clear cache for a specific key or all keys
   */
  clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const total = this.cacheHits + this.cacheMisses;
    const hitRate = total > 0 ? (this.cacheHits / total) * 100 : 0;

    return {
      size: this.cache.size,
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate: hitRate.toFixed(2) + '%',
    };
  }

  /**
   * Optimize conversation query with proper joins
   */
  async getConversationsOptimized(
    supabase: SupabaseClient,
    organizationId: string,
    options: {
      type?: 'user_chat' | 'agent_proactive' | 'system';
      limit?: number;
      startDate?: Date;
      endDate?: Date;
      includeAnalytics?: boolean;
    } = {}
  ) {
    const cacheKey = `conversations:${organizationId}:${JSON.stringify(options)}`;

    return this.executeWithCache(
      { key: cacheKey, ttl: 5 * 60 * 1000 }, // 5 minutes cache
      async () => {
        let query = supabase
          .from('conversations')
          .select(
            options.includeAnalytics
              ? `
                *,
                ai_conversation_analytics (
                  conversation_metadata,
                  user_satisfaction_score,
                  topics_discussed
                )
              `
              : '*'
          )
          .eq('organization_id', organizationId);

        if (options.type) {
          query = query.eq('type', options.type);
        }

        if (options.startDate) {
          query = query.gte('created_at', options.startDate.toISOString());
        }

        if (options.endDate) {
          query = query.lte('created_at', options.endDate.toISOString());
        }

        if (options.limit) {
          query = query.limit(options.limit);
        }

        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;
        if (error) throw error;
        return data;
      }
    );
  }

  /**
   * Optimize agent execution query
   */
  async getAgentExecutionsOptimized(
    supabase: SupabaseClient,
    organizationId: string,
    options: {
      status?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    } = {}
  ) {
    const cacheKey = `agent_executions:${organizationId}:${JSON.stringify(options)}`;

    return this.executeWithCache(
      { key: cacheKey, ttl: 2 * 60 * 1000 }, // 2 minutes cache
      async () => {
        // Get agent instances for this organization first
        const { data: instances } = await supabase
          .from('agent_instances')
          .select('id')
          .eq('organization_id', organizationId);

        if (!instances || instances.length === 0) {
          return [];
        }

        const instanceIds = instances.map((i) => i.id);

        let query = supabase
          .from('agent_task_executions')
          .select('*')
          .in('agent_instance_id', instanceIds);

        if (options.status) {
          query = query.eq('status', options.status);
        }

        if (options.startDate) {
          query = query.gte('created_at', options.startDate.toISOString());
        }

        if (options.endDate) {
          query = query.lte('created_at', options.endDate.toISOString());
        }

        if (options.limit) {
          query = query.limit(options.limit);
        }

        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;
        if (error) throw error;
        return data;
      }
    );
  }

  /**
   * Optimize ML predictions query
   */
  async getMLPredictionsOptimized(
    supabase: SupabaseClient,
    organizationId: string,
    options: {
      modelId?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    } = {}
  ) {
    const cacheKey = `ml_predictions:${organizationId}:${JSON.stringify(options)}`;

    return this.executeWithCache(
      { key: cacheKey, ttl: 10 * 60 * 1000 }, // 10 minutes cache (predictions change slowly)
      async () => {
        let query = supabase
          .from('ml_predictions')
          .select('*')
          .eq('organization_id', organizationId);

        if (options.modelId) {
          query = query.eq('model_id', options.modelId);
        }

        if (options.startDate) {
          query = query.gte('created_at', options.startDate.toISOString());
        }

        if (options.endDate) {
          query = query.lte('created_at', options.endDate.toISOString());
        }

        if (options.limit) {
          query = query.limit(options.limit);
        }

        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;
        if (error) throw error;
        return data;
      }
    );
  }

  /**
   * Get aggregated metrics with caching
   */
  async getAggregatedMetrics(
    supabase: SupabaseClient,
    organizationId: string,
    startDate: Date,
    endDate: Date
  ) {
    const cacheKey = `aggregated_metrics:${organizationId}:${startDate.toISOString()}:${endDate.toISOString()}`;

    return this.executeWithCache(
      { key: cacheKey, ttl: 5 * 60 * 1000 }, // 5 minutes cache
      async () => {
        // Execute all queries in parallel for maximum performance
        const [conversations, agentExecutions, mlPredictions] = await Promise.all([
          this.getConversationsOptimized(supabase, organizationId, {
            startDate,
            endDate,
            includeAnalytics: true,
          }),
          this.getAgentExecutionsOptimized(supabase, organizationId, {
            startDate,
            endDate,
          }),
          this.getMLPredictionsOptimized(supabase, organizationId, {
            startDate,
            endDate,
          }),
        ]);

        return {
          conversations,
          agentExecutions,
          mlPredictions,
          metadata: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            generatedAt: new Date().toISOString(),
          },
        };
      }
    );
  }

  /**
   * Batch query utility - execute multiple queries in parallel
   */
  async batchQuery<T extends Record<string, () => Promise<any>>>(
    queries: T
  ): Promise<{ [K in keyof T]: Awaited<ReturnType<T[K]>> }> {
    const keys = Object.keys(queries) as (keyof T)[];
    const queryFunctions = keys.map((key) => queries[key]);

    const results = await Promise.all(queryFunctions.map((fn) => fn()));

    const resultMap = {} as { [K in keyof T]: Awaited<ReturnType<T[K]>> };
    keys.forEach((key, index) => {
      resultMap[key] = results[index];
    });

    return resultMap;
  }

  /**
   * Query with retry logic for transient failures
   */
  async queryWithRetry<T>(
    queryFn: () => Promise<T>,
    maxRetries = 3,
    delayMs = 1000
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await queryFn();
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
        }
      }
    }

    throw lastError || new Error('Query failed after retries');
  }

  /**
   * Paginated query utility
   */
  async paginatedQuery<T>(
    supabase: SupabaseClient,
    tableName: string,
    options: {
      select?: string;
      filters?: Record<string, any>;
      orderBy?: { column: string; ascending?: boolean };
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<{
    data: T[];
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  }> {
    const page = options.page || 1;
    const pageSize = options.pageSize || 50;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from(tableName).select(options.select || '*', { count: 'exact' });

    // Apply filters
    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    // Apply ordering
    if (options.orderBy) {
      query = query.order(options.orderBy.column, {
        ascending: options.orderBy.ascending ?? true,
      });
    }

    // Apply pagination
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    const total = count || 0;
    const hasMore = to < total - 1;

    return {
      data: (data || []) as T[],
      page,
      pageSize,
      total,
      hasMore,
    };
  }
}

/**
 * Global query optimizer instance
 */
export const queryOptimizer = new QueryOptimizer();

/**
 * Cache key generators for consistent caching
 */
export const CacheKeys = {
  conversations: (orgId: string, options?: any) =>
    `conversations:${orgId}:${JSON.stringify(options || {})}`,
  agentExecutions: (orgId: string, options?: any) =>
    `agent_executions:${orgId}:${JSON.stringify(options || {})}`,
  mlPredictions: (orgId: string, options?: any) =>
    `ml_predictions:${orgId}:${JSON.stringify(options || {})}`,
  unifiedMetrics: (orgId: string, startDate: string, endDate: string) =>
    `unified_metrics:${orgId}:${startDate}:${endDate}`,
  dashboardData: (orgId: string, dashboardType: string) =>
    `dashboard:${orgId}:${dashboardType}`,
};
