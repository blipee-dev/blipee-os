import { AuditEvent, AuditEventType, AuditEventSeverity, AuditLogQuery, AuditLogSummary } from './types';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

// Dynamic imports for server-side only
type RedisInstance = any;
type ElasticsearchClient = any;

export interface AuditServiceConfig {
  storage: 'supabase' | 'redis' | 'elasticsearch';
  redis?: {
    host: string;
    port: number;
    password?: string;
  };
  elasticsearch?: {
    node: string;
    apiKey?: string;
  };
  retention: {
    days: number;
    archiveAfterDays?: number;
  };
  realtime?: boolean;
  encryption?: boolean;
}

/**
 * Enterprise-grade audit logging service
 */
export class AuditService {
  private config: AuditServiceConfig;
  private redis: RedisInstance | null = null;
  private elasticsearch: ElasticsearchClient | null = null;
  private batchQueue: AuditEvent[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 100;
  private readonly BATCH_INTERVAL = 5000; // 5 seconds

  constructor(config: Partial<AuditServiceConfig> = {}) {
    this.config = {
      storage: config.storage || 'supabase',
      retention: {
        days: config.retention?.days || 90,
        archiveAfterDays: config.retention?.archiveAfterDays || 365,
      },
      realtime: config.realtime !== false,
      encryption: config.encryption !== false,
      ...config,
    };

    if (typeof window === 'undefined') {
      this.initializeStorageBackends();
    }
  }

  private async initializeStorageBackends() {
    // Initialize Redis if configured
    if (this.config.storage === 'redis' && this.config.redis) {
      try {
        const ioredis = await import('ioredis');
        this.redis = new ioredis.default(this.config.redis);
        console.log('Audit log Redis backend initialized');
      } catch (error) {
        console.error('Failed to initialize Redis for audit logs:', error);
      }
    }

    // Initialize Elasticsearch if configured
    if (this.config.storage === 'elasticsearch' && this.config.elasticsearch) {
      console.warn('Elasticsearch not available in this build, falling back to Supabase');
      this.config.storage = 'supabase';
    }
  }

  /**
   * Log an audit event
   */
  async log(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<void> {
    const auditEvent: AuditEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };

    // Add to batch queue
    this.batchQueue.push(auditEvent);

    // Process immediately if critical
    if (event.severity === AuditEventSeverity.CRITICAL) {
      await this.processBatch();
    } else {
      // Start batch timer if not already running
      if (!this.batchTimer) {
        this.batchTimer = setTimeout(() => this.processBatch(), this.BATCH_INTERVAL);
      }

      // Process if batch is full
      if (this.batchQueue.length >= this.BATCH_SIZE) {
        await this.processBatch();
      }
    }

    // Emit realtime event if enabled
    if (this.config.realtime) {
      this.emitRealtimeEvent(auditEvent);
    }
  }

  /**
   * Process batch of audit events
   */
  private async processBatch(): Promise<void> {
    if (this.batchQueue.length === 0) return;

    const events = [...this.batchQueue];
    this.batchQueue = [];

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    try {
      switch (this.config.storage) {
        case 'supabase':
          await this.storeInSupabase(events);
          break;
        case 'redis':
          await this.storeInRedis(events);
          break;
        case 'elasticsearch':
          await this.storeInElasticsearch(events);
          break;
      }
    } catch (error) {
      console.error('Failed to store audit events:', error);
      // Re-queue events for retry
      this.batchQueue.unshift(...events);
    }
  }

  /**
   * Store events in Supabase
   */
  private async storeInSupabase(events: AuditEvent[]): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from('audit_logs')
      .insert(events.map(event => ({
        id: event.id,
        timestamp: event.timestamp.toISOString(),
        type: event.type,
        severity: event.severity,
        actor_type: event.actor.type,
        actor_id: event.actor.id,
        actor_email: event.actor.email,
        actor_ip: event.actor.ip,
        actor_user_agent: event.actor.userAgent,
        target_type: event.target?.type,
        target_id: event.target?.id,
        target_name: event.target?.name,
        organization_id: event.context.organizationId,
        building_id: event.context.buildingId,
        session_id: event.context.sessionId,
        request_id: event.context.requestId,
        api_key_id: event.context.apiKeyId,
        metadata: event.metadata,
        changes: event.changes,
        result: event.result,
        error_code: event.errorDetails?.code,
        error_message: event.errorDetails?.message,
        error_stack_trace: event.errorDetails?.stackTrace,
      })));

    if (error) {
      throw error;
    }
  }

  /**
   * Store events in Redis
   */
  private async storeInRedis(events: AuditEvent[]): Promise<void> {
    if (!this.redis) {
      throw new Error('Redis not initialized');
    }

    const pipeline = this.redis.pipeline();

    for (const event of events) {
      const key = `audit:${event.timestamp.getTime()}:${event.id}`;
      const ttl = this.config.retention.days * 24 * 60 * 60; // Convert days to seconds
      
      pipeline.setex(key, ttl, JSON.stringify(event));
      
      // Add to sorted set for efficient querying
      pipeline.zadd('audit:timeline', event.timestamp.getTime(), key);
      
      // Add to type index
      pipeline.zadd(`audit:type:${event.type}`, event.timestamp.getTime(), key);
      
      // Add to severity index
      pipeline.zadd(`audit:severity:${event.severity}`, event.timestamp.getTime(), key);
      
      // Add to actor index if present
      if (event.actor.id) {
        pipeline.zadd(`audit:actor:${event.actor.id}`, event.timestamp.getTime(), key);
      }
    }

    await pipeline.exec();
  }

  /**
   * Store events in Elasticsearch
   */
  private async storeInElasticsearch(events: AuditEvent[]): Promise<void> {
    if (!this.elasticsearch) {
      throw new Error('Elasticsearch not initialized');
    }

    const body = events.flatMap(event => [
      { index: { _index: 'audit-logs', _id: event.id } },
      event,
    ]);

    await this.elasticsearch.bulk({ body });
  }

  /**
   * Query audit logs
   */
  async query(query: AuditLogQuery): Promise<AuditEvent[]> {
    switch (this.config.storage) {
      case 'supabase':
        return this.querySupabase(query);
      case 'redis':
        return this.queryRedis(query);
      case 'elasticsearch':
        return this.queryElasticsearch(query);
      default:
        return [];
    }
  }

  /**
   * Query Supabase
   */
  private async querySupabase(query: AuditLogQuery): Promise<AuditEvent[]> {
    const supabase = await createClient();
    let supabaseQuery = supabase
      .from('audit_logs')
      .select('*');

    // Apply filters
    if (query.startDate) {
      supabaseQuery = supabaseQuery.gte('timestamp', query.startDate.toISOString());
    }
    if (query.endDate) {
      supabaseQuery = supabaseQuery.lte('timestamp', query.endDate.toISOString());
    }
    if (query.types?.length) {
      supabaseQuery = supabaseQuery.in('type', query.types);
    }
    if (query.severities?.length) {
      supabaseQuery = supabaseQuery.in('severity', query.severities);
    }
    if (query.actorId) {
      supabaseQuery = supabaseQuery.eq('actor_id', query.actorId);
    }
    if (query.targetId) {
      supabaseQuery = supabaseQuery.eq('target_id', query.targetId);
    }
    if (query.organizationId) {
      supabaseQuery = supabaseQuery.eq('organization_id', query.organizationId);
    }
    if (query.result) {
      supabaseQuery = supabaseQuery.eq('result', query.result);
    }
    if (query.search) {
      supabaseQuery = supabaseQuery.or(`
        actor_email.ilike.%${query.search}%,
        target_name.ilike.%${query.search}%,
        error_message.ilike.%${query.search}%
      `);
    }

    // Apply sorting
    const sortBy = query.sortBy || 'timestamp';
    const sortOrder = query.sortOrder || 'desc';
    supabaseQuery = supabaseQuery.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    if (query.limit) {
      supabaseQuery = supabaseQuery.limit(query.limit);
    }
    if (query.offset) {
      supabaseQuery = supabaseQuery.range(query.offset, query.offset + (query.limit || 50) - 1);
    }

    const { data, error } = await supabaseQuery;

    if (error) {
      throw error;
    }

    return (data || []).map(row => this.mapRowToEvent(row));
  }

  /**
   * Query Redis
   */
  private async queryRedis(query: AuditLogQuery): Promise<AuditEvent[]> {
    if (!this.redis) {
      throw new Error('Redis not initialized');
    }

    // Determine which index to use
    let indexKey = 'audit:timeline';
    if (query.types?.length === 1) {
      indexKey = `audit:type:${query.types[0]}`;
    } else if (query.severities?.length === 1) {
      indexKey = `audit:severity:${query.severities[0]}`;
    } else if (query.actorId) {
      indexKey = `audit:actor:${query.actorId}`;
    }

    // Get keys from sorted set
    const startScore = query.startDate ? query.startDate.getTime() : '-inf';
    const endScore = query.endDate ? query.endDate.getTime() : '+inf';
    const keys = await this.redis.zrevrangebyscore(
      indexKey,
      endScore,
      startScore,
      'LIMIT',
      query.offset || 0,
      query.limit || 50
    );

    // Get events
    const events: AuditEvent[] = [];
    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        const event = JSON.parse(data);
        
        // Apply additional filters
        if (this.matchesQuery(event, query)) {
          events.push(event);
        }
      }
    }

    return events;
  }

  /**
   * Query Elasticsearch
   */
  private async queryElasticsearch(query: AuditLogQuery): Promise<AuditEvent[]> {
    if (!this.elasticsearch) {
      throw new Error('Elasticsearch not initialized');
    }

    const must: any[] = [];

    // Build query
    if (query.startDate || query.endDate) {
      must.push({
        range: {
          timestamp: {
            gte: query.startDate?.toISOString(),
            lte: query.endDate?.toISOString(),
          },
        },
      });
    }

    if (query.types?.length) {
      must.push({ terms: { type: query.types } });
    }
    if (query.severities?.length) {
      must.push({ terms: { severity: query.severities } });
    }
    if (query.actorId) {
      must.push({ term: { 'actor.id': query.actorId } });
    }
    if (query.search) {
      must.push({
        multi_match: {
          query: query.search,
          fields: ['actor.email', 'target.name', 'errorDetails.message'],
        },
      });
    }

    const response = await this.elasticsearch.search({
      index: 'audit-logs',
      body: {
        query: must.length > 0 ? { bool: { must } } : { match_all: {} },
        sort: [{ [query.sortBy || 'timestamp']: query.sortOrder || 'desc' }],
        from: query.offset || 0,
        size: query.limit || 50,
      },
    });

    return response.body.hits.hits.map((hit: any) => hit._source);
  }

  /**
   * Get audit log summary
   */
  async getSummary(
    organizationId?: string,
    timeRange: { start: Date; end: Date } = {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000),
      end: new Date(),
    }
  ): Promise<AuditLogSummary> {
    const events = await this.query({
      organizationId,
      startDate: timeRange.start,
      endDate: timeRange.end,
      limit: 1000,
    });

    const summary: AuditLogSummary = {
      totalEvents: events.length,
      eventsByType: {},
      eventsBySeverity: {
        [AuditEventSeverity.INFO]: 0,
        [AuditEventSeverity.WARNING]: 0,
        [AuditEventSeverity.ERROR]: 0,
        [AuditEventSeverity.CRITICAL]: 0,
      },
      eventsByResult: {
        success: 0,
        failure: 0,
      },
      topActors: [],
      recentSecurityEvents: [],
    };

    const actorCounts = new Map<string, { email?: string; count: number }>();

    for (const event of events) {
      // Count by type
      summary.eventsByType[event.type] = (summary.eventsByType[event.type] || 0) + 1;

      // Count by severity
      summary.eventsBySeverity[event.severity]++;

      // Count by result
      summary.eventsByResult[event.result]++;

      // Count by actor
      if (event.actor.id) {
        const current = actorCounts.get(event.actor.id) || { email: event.actor.email, count: 0 };
        current.count++;
        actorCounts.set(event.actor.id, current);
      }

      // Collect security events
      if (event.type.startsWith('security.') && event.severity !== AuditEventSeverity.INFO) {
        summary.recentSecurityEvents.push(event);
      }
    }

    // Get top actors
    summary.topActors = Array.from(actorCounts.entries())
      .map(([actorId, data]) => ({
        actorId,
        actorEmail: data.email,
        eventCount: data.count,
      }))
      .sort((a, b) => b.eventCount - a.eventCount)
      .slice(0, 10);

    // Limit security events
    summary.recentSecurityEvents = summary.recentSecurityEvents
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    return summary;
  }

  /**
   * Export audit logs
   */
  async export(query: AuditLogQuery, format: 'json' | 'csv' = 'json'): Promise<string> {
    const events = await this.query({ ...query, limit: 10000 });

    if (format === 'json') {
      return JSON.stringify(events, null, 2);
    }

    // CSV export
    const headers = [
      'ID', 'Timestamp', 'Type', 'Severity', 'Actor Type', 'Actor ID', 'Actor Email',
      'Actor IP', 'Target Type', 'Target ID', 'Target Name', 'Organization ID',
      'Result', 'Error Code', 'Error Message'
    ];

    const rows = events.map(event => [
      event.id,
      event.timestamp.toISOString(),
      event.type,
      event.severity,
      event.actor.type,
      event.actor.id || '',
      event.actor.email || '',
      event.actor.ip || '',
      event.target?.type || '',
      event.target?.id || '',
      event.target?.name || '',
      event.context.organizationId || '',
      event.result,
      event.errorDetails?.code || '',
      event.errorDetails?.message || '',
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
  }

  /**
   * Clean up old audit logs
   */
  async cleanup(): Promise<number> {
    const cutoffDate = new Date(Date.now() - this.config.retention.days * 24 * 60 * 60 * 1000);
    
    switch (this.config.storage) {
      case 'supabase':
        const supabase = await createClient();
        const { count } = await supabase
          .from('audit_logs')
          .delete()
          .lt('timestamp', cutoffDate.toISOString());
        return count || 0;
        
      case 'redis':
        if (!this.redis) return 0;
        // Redis handles TTL automatically
        return 0;
        
      case 'elasticsearch':
        if (!this.elasticsearch) return 0;
        const response = await this.elasticsearch.deleteByQuery({
          index: 'audit-logs',
          body: {
            query: {
              range: {
                timestamp: {
                  lt: cutoffDate.toISOString(),
                },
              },
            },
          },
        });
        return response.body.deleted || 0;
        
      default:
        return 0;
    }
  }

  // Helper methods

  private mapRowToEvent(row: any): AuditEvent {
    return {
      id: row.id,
      timestamp: new Date(row.timestamp),
      type: row.type,
      severity: row.severity,
      actor: {
        type: row.actor_type,
        id: row.actor_id,
        email: row.actor_email,
        ip: row.actor_ip,
        userAgent: row.actor_user_agent,
      },
      target: row.target_id ? {
        type: row.target_type,
        id: row.target_id,
        name: row.target_name,
      } : undefined,
      context: {
        organizationId: row.organization_id,
        buildingId: row.building_id,
        sessionId: row.session_id,
        requestId: row.request_id,
        apiKeyId: row.api_key_id,
      },
      metadata: row.metadata || {},
      changes: row.changes,
      result: row.result,
      errorDetails: row.error_code ? {
        code: row.error_code,
        message: row.error_message,
        stackTrace: row.error_stack_trace,
      } : undefined,
    };
  }

  private matchesQuery(event: AuditEvent, query: AuditLogQuery): boolean {
    if (query.types?.length && !query.types.includes(event.type)) return false;
    if (query.severities?.length && !query.severities.includes(event.severity)) return false;
    if (query.actorType && event.actor.type !== query.actorType) return false;
    if (query.targetType && event.target?.type !== query.targetType) return false;
    if (query.organizationId && event.context.organizationId !== query.organizationId) return false;
    if (query.result && event.result !== query.result) return false;
    
    return true;
  }

  private emitRealtimeEvent(event: AuditEvent): void {
    // Emit to Supabase realtime if available
    // This could also emit to websockets, SSE, etc.
    if (typeof window === 'undefined') {
      // Server-side: could emit to Redis pub/sub, etc.
    }
  }

  private async ensureElasticsearchIndex(): Promise<void> {
    if (!this.elasticsearch) return;

    const indexExists = await this.elasticsearch.indices.exists({ index: 'audit-logs' });
    
    if (!indexExists.body) {
      await this.elasticsearch.indices.create({
        index: 'audit-logs',
        body: {
          mappings: {
            properties: {
              timestamp: { type: 'date' },
              type: { type: 'keyword' },
              severity: { type: 'keyword' },
              'actor.type': { type: 'keyword' },
              'actor.id': { type: 'keyword' },
              'actor.email': { type: 'keyword' },
              'actor.ip': { type: 'ip' },
              'target.type': { type: 'keyword' },
              'target.id': { type: 'keyword' },
              'target.name': { type: 'text' },
              result: { type: 'keyword' },
              'context.organizationId': { type: 'keyword' },
              'context.buildingId': { type: 'keyword' },
            },
          },
        },
      });
    }
  }
}

// Singleton instance
let auditServiceInstance: AuditService | null = null;

export function getAuditService(config?: Partial<AuditServiceConfig>): AuditService {
  if (!auditServiceInstance) {
    auditServiceInstance = new AuditService(config);
  }
  return auditServiceInstance;
}

// Default export for convenience
export const auditService = getAuditService();