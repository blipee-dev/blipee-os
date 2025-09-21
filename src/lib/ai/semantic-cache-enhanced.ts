import { Redis } from 'ioredis';
import { createHash } from 'crypto';

interface CacheEntry {
  key: string;
  value: any;
  embedding?: number[];
  metadata: CacheMetadata;
  accessPattern: AccessPattern;
  ttl?: number;
}

interface CacheMetadata {
  created: Date;
  accessed: Date;
  hits: number;
  contextHash: string;
  semanticHash: string;
  tags: string[];
  dependencies?: string[];
  invalidationRules?: InvalidationRule[];
}

interface AccessPattern {
  frequency: number;
  recency: Date;
  seasonality?: SeasonalityPattern;
  userSegments: string[];
  queryPatterns: QueryPattern[];
}

interface SeasonalityPattern {
  hourly?: number[];
  daily?: number[];
  weekly?: number[];
  monthly?: number[];
}

interface QueryPattern {
  template: string;
  variables: string[];
  frequency: number;
  avgResponseTime: number;
}

interface InvalidationRule {
  type: 'time' | 'event' | 'dependency' | 'condition';
  expression: string;
  priority: number;
}

interface CacheStrategy {
  type: 'semantic' | 'exact' | 'fuzzy' | 'pattern' | 'hierarchical';
  threshold: number;
  fallback?: CacheStrategy;
}

interface CacheMetrics {
  hitRate: number;
  missRate: number;
  avgLatency: number;
  totalRequests: number;
  cacheSize: number;
  evictionRate: number;
  semanticMatchRate: number;
}

interface PredictivePreload {
  query: string;
  probability: number;
  timeWindow: number;
  priority: number;
}

export class EnhancedSemanticCache {
  private redis: Redis;
  private embeddingCache: Map<string, number[]> = new Map();
  private metricsCollector: MetricsCollector;
  private predictor: CachePredictor;
  private optimizer: CacheOptimizer;
  private semanticIndex: SemanticIndex;

  private readonly TARGET_HIT_RATE = 0.95;
  private readonly EMBEDDING_DIMENSION = 1536;
  private readonly SIMILARITY_THRESHOLD = 0.85;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      maxRetriesPerRequest: 3,
      enableOfflineQueue: true,
      lazyConnect: true
    });

    this.metricsCollector = new MetricsCollector();
    this.predictor = new CachePredictor();
    this.optimizer = new CacheOptimizer();
    this.semanticIndex = new SemanticIndex();

    this.initializeCache();
  }

  private async initializeCache() {
    try {
      await this.redis.connect();
      await this.loadEmbeddingIndex();
      await this.startOptimizationLoop();
      await this.startPredictivePreloading();
    } catch (error) {
      console.warn('Redis connection failed, using in-memory fallback');
    }
  }

  public async get(
    query: string,
    context?: any,
    strategy: CacheStrategy = { type: 'semantic', threshold: 0.85 }
  ): Promise<{ hit: boolean; value: any; confidence: number }> {
    const startTime = Date.now();

    // 1. Try exact match first
    const exactKey = this.generateKey(query, context);
    const exactMatch = await this.getExact(exactKey);

    if (exactMatch) {
      await this.recordHit(exactKey, Date.now() - startTime);
      return { hit: true, value: exactMatch, confidence: 1.0 };
    }

    // 2. Try semantic match
    if (strategy.type === 'semantic') {
      const semanticMatch = await this.getSemanticMatch(query, context, strategy.threshold);

      if (semanticMatch && semanticMatch.confidence >= strategy.threshold) {
        await this.recordSemanticHit(query, semanticMatch, Date.now() - startTime);
        return {
          hit: true,
          value: semanticMatch.value,
          confidence: semanticMatch.confidence
        };
      }
    }

    // 3. Try pattern match
    if (strategy.type === 'pattern' || strategy.type === 'fuzzy') {
      const patternMatch = await this.getPatternMatch(query, context);

      if (patternMatch) {
        await this.recordPatternHit(query, patternMatch, Date.now() - startTime);
        return {
          hit: true,
          value: patternMatch.value,
          confidence: patternMatch.confidence
        };
      }
    }

    // 4. Try hierarchical match (for nested queries)
    if (strategy.type === 'hierarchical') {
      const hierarchicalMatch = await this.getHierarchicalMatch(query, context);

      if (hierarchicalMatch) {
        return {
          hit: true,
          value: hierarchicalMatch.value,
          confidence: hierarchicalMatch.confidence
        };
      }
    }

    // 5. Record miss and trigger predictive loading
    await this.recordMiss(query, Date.now() - startTime);
    this.triggerPredictiveLoad(query, context);

    return { hit: false, value: null, confidence: 0 };
  }

  public async set(
    query: string,
    value: any,
    context?: any,
    options?: CacheOptions
  ): Promise<void> {
    const key = this.generateKey(query, context);
    const embedding = await this.generateEmbedding(query);

    const entry: CacheEntry = {
      key,
      value,
      embedding,
      metadata: {
        created: new Date(),
        accessed: new Date(),
        hits: 0,
        contextHash: this.hashContext(context),
        semanticHash: this.hashEmbedding(embedding),
        tags: options?.tags || [],
        dependencies: options?.dependencies,
        invalidationRules: options?.invalidationRules
      },
      accessPattern: {
        frequency: 1,
        recency: new Date(),
        userSegments: [],
        queryPatterns: []
      },
      ttl: options?.ttl || 3600000 // 1 hour default
    };

    // Store in Redis with TTL
    await this.redis.setex(
      key,
      Math.floor(entry.ttl! / 1000),
      JSON.stringify(entry)
    );

    // Update semantic index
    await this.semanticIndex.index(key, embedding, entry.metadata);

    // Update embedding cache
    this.embeddingCache.set(key, embedding);

    // Trigger optimization if needed
    if (await this.shouldOptimize()) {
      await this.optimizer.optimize(this);
    }
  }

  private async getExact(key: string): Promise<any | null> {
    try {
      const data = await this.redis.get(key);
      if (!data) return null;

      const entry: CacheEntry = JSON.parse(data);
      await this.updateAccessPattern(key, entry);

      return entry.value;
    } catch {
      return null;
    }
  }

  private async getSemanticMatch(
    query: string,
    context: any,
    threshold: number
  ): Promise<{ value: any; confidence: number } | null> {
    const queryEmbedding = await this.generateEmbedding(query);

    // Search semantic index for similar queries
    const similarQueries = await this.semanticIndex.search(
      queryEmbedding,
      10, // top 10 candidates
      threshold
    );

    if (similarQueries.length === 0) return null;

    // Filter by context similarity if provided
    const contextHash = this.hashContext(context);
    const bestMatch = similarQueries.find(match => {
      return !context || match.metadata.contextHash === contextHash;
    }) || similarQueries[0];

    if (bestMatch.similarity < threshold) return null;

    // Retrieve the cached value
    const entry = await this.getExact(bestMatch.key);

    if (!entry) return null;

    return {
      value: entry,
      confidence: bestMatch.similarity
    };
  }

  private async getPatternMatch(
    query: string,
    context: any
  ): Promise<{ value: any; confidence: number } | null> {
    // Extract query pattern
    const pattern = this.extractQueryPattern(query);

    // Search for similar patterns
    const patternKey = `pattern:${pattern.template}`;
    const cachedPattern = await this.redis.get(patternKey);

    if (!cachedPattern) return null;

    const patternData = JSON.parse(cachedPattern);

    // Apply variables to pattern
    const resolvedValue = this.applyPatternVariables(
      patternData.value,
      pattern.variables,
      query
    );

    return {
      value: resolvedValue,
      confidence: 0.8 // Pattern matches are less confident than semantic
    };
  }

  private async getHierarchicalMatch(
    query: string,
    context: any
  ): Promise<{ value: any; confidence: number } | null> {
    // Break query into hierarchical components
    const components = this.decomposeQuery(query);

    // Try to compose result from cached components
    const componentResults: any[] = [];
    let totalConfidence = 1.0;

    for (const component of components) {
      const result = await this.get(component, context, { type: 'exact', threshold: 1.0 });

      if (!result.hit) {
        return null; // All components must be cached
      }

      componentResults.push(result.value);
      totalConfidence *= result.confidence;
    }

    // Compose final result
    const composedValue = this.composeResults(componentResults, query);

    return {
      value: composedValue,
      confidence: totalConfidence
    };
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    // Check embedding cache first
    const cached = this.embeddingCache.get(text);
    if (cached) return cached;

    // Generate embedding using AI model
    // This would call OpenAI, HuggingFace, or local model
    const embedding = await this.callEmbeddingAPI(text);

    // Cache the embedding
    this.embeddingCache.set(text, embedding);

    return embedding;
  }

  private async callEmbeddingAPI(text: string): Promise<number[]> {
    // Placeholder - would integrate with actual embedding service
    // For now, generate random embedding for testing
    const embedding = new Array(this.EMBEDDING_DIMENSION);
    for (let i = 0; i < this.EMBEDDING_DIMENSION; i++) {
      embedding[i] = Math.random() * 2 - 1;
    }
    return embedding;
  }

  private generateKey(query: string, context?: any): string {
    const queryHash = createHash('sha256').update(query).digest('hex');
    const contextHash = context ? this.hashContext(context) : 'no-context';
    return `cache:${queryHash}:${contextHash}`;
  }

  private hashContext(context: any): string {
    if (!context) return 'no-context';
    const normalized = JSON.stringify(context, Object.keys(context).sort());
    return createHash('md5').update(normalized).digest('hex');
  }

  private hashEmbedding(embedding: number[]): string {
    const str = embedding.slice(0, 10).join(','); // Use first 10 dimensions
    return createHash('md5').update(str).digest('hex');
  }

  private extractQueryPattern(query: string): { template: string; variables: any } {
    // Extract variables from query (e.g., dates, metrics, entities)
    const variables: any = {};
    let template = query;

    // Date extraction
    const datePattern = /\d{4}-\d{2}-\d{2}/g;
    const dates = query.match(datePattern);
    if (dates) {
      dates.forEach((date, i) => {
        variables[`date_${i}`] = date;
        template = template.replace(date, `{{date_${i}}}`);
      });
    }

    // Number extraction
    const numberPattern = /\b\d+(\.\d+)?\b/g;
    const numbers = query.match(numberPattern);
    if (numbers) {
      numbers.forEach((num, i) => {
        variables[`num_${i}`] = num;
        template = template.replace(num, `{{num_${i}}}`);
      });
    }

    return { template, variables };
  }

  private applyPatternVariables(
    templateValue: any,
    variables: any,
    query: string
  ): any {
    // Apply extracted variables to cached template result
    let result = JSON.stringify(templateValue);

    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }

    return JSON.parse(result);
  }

  private decomposeQuery(query: string): string[] {
    // Break complex query into sub-queries
    const components: string[] = [];

    // Split by logical operators
    const parts = query.split(/\s+(AND|OR|THEN)\s+/i);

    for (const part of parts) {
      if (!['AND', 'OR', 'THEN'].includes(part.toUpperCase())) {
        components.push(part.trim());
      }
    }

    return components;
  }

  private composeResults(results: any[], originalQuery: string): any {
    // Compose multiple cached results into final result
    if (results.length === 1) return results[0];

    // Merge results based on query structure
    return {
      combined: true,
      results,
      query: originalQuery
    };
  }

  private async updateAccessPattern(key: string, entry: CacheEntry): Promise<void> {
    entry.accessPattern.frequency++;
    entry.accessPattern.recency = new Date();
    entry.metadata.accessed = new Date();
    entry.metadata.hits++;

    // Update in Redis
    await this.redis.setex(
      key,
      Math.floor(entry.ttl! / 1000),
      JSON.stringify(entry)
    );
  }

  private async recordHit(key: string, latency: number): Promise<void> {
    await this.metricsCollector.recordHit(key, latency, 'exact');
  }

  private async recordSemanticHit(
    query: string,
    match: any,
    latency: number
  ): Promise<void> {
    await this.metricsCollector.recordHit(query, latency, 'semantic');
  }

  private async recordPatternHit(
    query: string,
    match: any,
    latency: number
  ): Promise<void> {
    await this.metricsCollector.recordHit(query, latency, 'pattern');
  }

  private async recordMiss(query: string, latency: number): Promise<void> {
    await this.metricsCollector.recordMiss(query, latency);
  }

  private async shouldOptimize(): Promise<boolean> {
    const metrics = await this.metricsCollector.getMetrics();
    return metrics.hitRate < this.TARGET_HIT_RATE;
  }

  private triggerPredictiveLoad(query: string, context: any): void {
    // Asynchronously predict and preload related queries
    setImmediate(async () => {
      const predictions = await this.predictor.predict(query, context);

      for (const prediction of predictions) {
        if (prediction.probability > 0.7) {
          // Preload predicted query
          this.preloadQuery(prediction.query, context);
        }
      }
    });
  }

  private async preloadQuery(query: string, context: any): Promise<void> {
    // Execute query and cache result
    // This would call the actual query handler
  }

  private async loadEmbeddingIndex(): Promise<void> {
    // Load existing embeddings into memory for fast similarity search
    const keys = await this.redis.keys('cache:*');

    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        const entry: CacheEntry = JSON.parse(data);
        if (entry.embedding) {
          this.embeddingCache.set(key, entry.embedding);
        }
      }
    }
  }

  private async startOptimizationLoop(): Promise<void> {
    setInterval(async () => {
      const metrics = await this.metricsCollector.getMetrics();

      if (metrics.hitRate < this.TARGET_HIT_RATE) {
        await this.optimizer.optimize(this);
      }

      // Evict stale entries
      await this.evictStaleEntries();

      // Update predictive models
      await this.predictor.updateModels(metrics);

    }, 60000); // Run every minute
  }

  private async startPredictivePreloading(): Promise<void> {
    setInterval(async () => {
      const predictions = await this.predictor.getUpcomingQueries();

      for (const prediction of predictions) {
        if (prediction.probability > 0.8) {
          await this.preloadQuery(prediction.query, {});
        }
      }
    }, 30000); // Run every 30 seconds
  }

  private async evictStaleEntries(): Promise<void> {
    const keys = await this.redis.keys('cache:*');
    const now = Date.now();

    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        const entry: CacheEntry = JSON.parse(data);

        // Check if entry is stale
        const age = now - entry.metadata.created.getTime();
        const lastAccess = now - entry.metadata.accessed.getTime();

        if (lastAccess > 86400000 && entry.metadata.hits < 5) {
          // Not accessed in 24 hours and low hit count
          await this.redis.del(key);
          this.embeddingCache.delete(key);
        }
      }
    }
  }

  public async getMetrics(): Promise<CacheMetrics> {
    return this.metricsCollector.getMetrics();
  }

  public async invalidate(pattern?: string, tags?: string[]): Promise<void> {
    if (pattern) {
      const keys = await this.redis.keys(pattern);
      for (const key of keys) {
        await this.redis.del(key);
        this.embeddingCache.delete(key);
      }
    }

    if (tags && tags.length > 0) {
      // Invalidate by tags
      const keys = await this.redis.keys('cache:*');

      for (const key of keys) {
        const data = await this.redis.get(key);
        if (data) {
          const entry: CacheEntry = JSON.parse(data);

          if (tags.some(tag => entry.metadata.tags.includes(tag))) {
            await this.redis.del(key);
            this.embeddingCache.delete(key);
          }
        }
      }
    }
  }

  public async warmup(queries: string[], context?: any): Promise<void> {
    // Pre-populate cache with common queries
    for (const query of queries) {
      await this.preloadQuery(query, context);
    }
  }
}

class MetricsCollector {
  private hits = 0;
  private misses = 0;
  private semanticHits = 0;
  private totalLatency = 0;
  private requestCount = 0;

  async recordHit(key: string, latency: number, type: string): Promise<void> {
    this.hits++;
    if (type === 'semantic') this.semanticHits++;
    this.totalLatency += latency;
    this.requestCount++;
  }

  async recordMiss(key: string, latency: number): Promise<void> {
    this.misses++;
    this.totalLatency += latency;
    this.requestCount++;
  }

  async getMetrics(): Promise<CacheMetrics> {
    const total = this.hits + this.misses;

    return {
      hitRate: total > 0 ? this.hits / total : 0,
      missRate: total > 0 ? this.misses / total : 0,
      avgLatency: this.requestCount > 0 ? this.totalLatency / this.requestCount : 0,
      totalRequests: this.requestCount,
      cacheSize: 0, // Would calculate actual size
      evictionRate: 0, // Would track evictions
      semanticMatchRate: this.hits > 0 ? this.semanticHits / this.hits : 0
    };
  }
}

class CachePredictor {
  private patterns: Map<string, QueryPattern[]> = new Map();
  private predictions: PredictivePreload[] = [];

  async predict(query: string, context: any): Promise<PredictivePreload[]> {
    // Predict next likely queries based on patterns
    const relatedQueries: PredictivePreload[] = [];

    // Temporal predictions (what usually comes next)
    const temporalPredictions = this.predictTemporal(query);
    relatedQueries.push(...temporalPredictions);

    // Semantic predictions (related queries)
    const semanticPredictions = this.predictSemantic(query);
    relatedQueries.push(...semanticPredictions);

    // User behavior predictions
    const behaviorPredictions = this.predictBehavior(context);
    relatedQueries.push(...behaviorPredictions);

    return relatedQueries.sort((a, b) => b.probability - a.probability);
  }

  private predictTemporal(query: string): PredictivePreload[] {
    // Predict based on temporal patterns
    return [];
  }

  private predictSemantic(query: string): PredictivePreload[] {
    // Predict semantically related queries
    return [];
  }

  private predictBehavior(context: any): PredictivePreload[] {
    // Predict based on user behavior
    return [];
  }

  async getUpcomingQueries(): Promise<PredictivePreload[]> {
    return this.predictions;
  }

  async updateModels(metrics: CacheMetrics): Promise<void> {
    // Update prediction models based on metrics
  }
}

class CacheOptimizer {
  async optimize(cache: EnhancedSemanticCache): Promise<void> {
    // Analyze cache performance and optimize
    const metrics = await cache.getMetrics();

    if (metrics.hitRate < 0.95) {
      // Adjust similarity thresholds
      // Increase cache size
      // Update eviction policies
      // Optimize embedding dimensions
    }
  }
}

class SemanticIndex {
  private index: Map<string, { embedding: number[]; metadata: any }> = new Map();

  async index(key: string, embedding: number[], metadata: any): Promise<void> {
    this.index.set(key, { embedding, metadata });
  }

  async search(
    queryEmbedding: number[],
    topK: number,
    threshold: number
  ): Promise<Array<{ key: string; similarity: number; metadata: any }>> {
    const results: Array<{ key: string; similarity: number; metadata: any }> = [];

    for (const [key, data] of this.index) {
      const similarity = this.cosineSimilarity(queryEmbedding, data.embedding);

      if (similarity >= threshold) {
        results.push({
          key,
          similarity,
          metadata: data.metadata
        });
      }
    }

    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }
}

interface CacheOptions {
  ttl?: number;
  tags?: string[];
  dependencies?: string[];
  invalidationRules?: InvalidationRule[];
}

export type { CacheMetrics, CacheStrategy, CacheEntry };