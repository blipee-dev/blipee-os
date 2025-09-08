/**
 * Cache configuration for Redis and caching strategies
 */
export const cacheConfig = {
  redis: {
    host: process.env['REDIS_HOST'] || 'localhost',
    port: parseInt(process.env['REDIS_PORT'] || '6379'),
    password: process.env['REDIS_PASSWORD'],
    db: parseInt(process.env['REDIS_DB'] || '0'),
    cluster: {
      enabled: process.env['REDIS_CLUSTER_ENABLED'] === 'true',
      nodes: process.env['REDIS_CLUSTER_NODES']?.split(',').map(node => {
        const [host, port] = node.split(':');
        return { host, port: parseInt(port) };
      }) || [],
      maxRetries: 3,
    },
    tls: {
      enabled: process.env['REDIS_TLS_ENABLED'] === 'true',
    },
  },

  // TTL settings (in seconds)
  ttl: {
    // AI responses
    aiResponse: 60 * 60 * 24, // 24 hours
    aiContext: 60 * 60, // 1 hour
    
    // Database queries
    dbQuery: 60 * 5, // 5 minutes
    dbAggregate: 60 * 15, // 15 minutes
    
    // API responses
    apiResponse: 60 * 2, // 2 minutes
    apiRateLimit: 60, // 1 minute
    
    // Session data
    session: 60 * 60 * 24, // 24 hours
    userProfile: 60 * 30, // 30 minutes
    
    // Analytics
    analytics: 60 * 60, // 1 hour
    metrics: 60 * 5, // 5 minutes
    
    // Static data
    staticAsset: 60 * 60 * 24 * 7, // 7 days
    configuration: 60 * 60 * 24, // 24 hours
  },

  // Cache key prefixes
  prefix: {
    ai: 'ai:',
    db: 'db:',
    api: 'api:',
    session: 'session:',
    user: 'user:',
    analytics: 'analytics:',
    static: 'static:',
    rate: 'rate:',
    lock: 'lock:',
  },

  // Cache invalidation patterns
  invalidation: {
    onWrite: true, // Invalidate cache on write operations
    patterns: {
      user: ['user:*', 'session:*'],
      organization: ['org:*', 'analytics:*'],
      emissions: ['emissions:*', 'analytics:*', 'api:emissions:*'],
      building: ['building:*', 'analytics:*'],
    },
  },

  // Performance settings
  performance: {
    maxMemory: process.env['REDIS_MAX_MEMORY'] || '2gb',
    evictionPolicy: 'allkeys-lru', // Least Recently Used
    compressionThreshold: 1024, // Compress values > 1KB
  },
};

/**
 * Cache key generators
 */
export const cacheKeys = {
  // AI cache keys
  ai: {
    response: (prompt: string, provider?: string) => 
      `${cacheConfig.prefix.ai}response:${provider || 'default'}:${hashString(prompt)}`,
    context: (conversationId: string) => 
      `${cacheConfig.prefix.ai}context:${conversationId}`,
    embedding: (text: string) => 
      `${cacheConfig.prefix.ai}embedding:${hashString(text)}`,
  },

  // Database cache keys
  db: {
    query: (sql: string, params?: any[]) => 
      `${cacheConfig.prefix.db}query:${hashString(sql + JSON.stringify(params || []))}`,
    table: (tableName: string, id: string) => 
      `${cacheConfig.prefix.db}table:${tableName}:${id}`,
    aggregate: (name: string, params?: Record<string, any>) => 
      `${cacheConfig.prefix.db}aggregate:${name}:${hashString(JSON.stringify(params || {}))}`,
  },

  // API cache keys
  api: {
    response: (method: string, path: string, params?: Record<string, any>) => 
      `${cacheConfig.prefix.api}response:${method}:${path}:${hashString(JSON.stringify(params || {}))}`,
    rateLimit: (userId: string, endpoint: string) => 
      `${cacheConfig.prefix.rate}${userId}:${endpoint}`,
  },

  // Session cache keys
  session: {
    user: (userId: string) => 
      `${cacheConfig.prefix.session}${userId}`,
    device: (userId: string, deviceId: string) => 
      `${cacheConfig.prefix.session}device:${userId}:${deviceId}`,
  },

  // User cache keys
  user: {
    profile: (userId: string) => 
      `${cacheConfig.prefix.user}profile:${userId}`,
    permissions: (userId: string) => 
      `${cacheConfig.prefix.user}permissions:${userId}`,
    organizations: (userId: string) => 
      `${cacheConfig.prefix.user}organizations:${userId}`,
  },

  // Analytics cache keys
  analytics: {
    metrics: (type: string, period: string, organizationId?: string) => 
      `${cacheConfig.prefix.analytics}metrics:${type}:${period}:${organizationId || 'global'}`,
    report: (reportId: string) => 
      `${cacheConfig.prefix.analytics}report:${reportId}`,
  },

  // Lock keys for distributed locking
  lock: {
    resource: (resource: string) => 
      `${cacheConfig.prefix.lock}${resource}`,
  },
};

/**
 * Simple hash function for consistent cache keys
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}