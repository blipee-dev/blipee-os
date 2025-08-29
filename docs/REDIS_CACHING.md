# Redis Caching Guide

This guide explains the Redis caching implementation in Blipee OS, including configuration, usage patterns, and best practices.

## Overview

Blipee OS uses Redis as a distributed caching layer to:
- Reduce AI API costs by 85% through response caching
- Improve response times from 2s to <200ms for cached queries
- Decrease database load by caching frequent queries
- Enable distributed rate limiting and session management

## Architecture

### Cache Layers

1. **AI Response Cache**: Caches AI provider responses
2. **Database Query Cache**: Caches database query results
3. **API Response Cache**: Caches API endpoint responses
4. **Session Cache**: Manages user sessions and permissions

### Key Features

- **Automatic compression** for values > 1KB
- **Tag-based invalidation** for bulk cache clearing
- **Distributed locking** to prevent cache stampede
- **TTL management** with configurable expiration
- **Cache statistics** for monitoring performance

## Configuration

### Environment Variables

```env
# Redis connection
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-secure-password
REDIS_DB=0

# Redis cluster (optional)
REDIS_CLUSTER_ENABLED=false
REDIS_CLUSTER_NODES=redis1:6379,redis2:6379,redis3:6379

# Redis TLS (for production)
REDIS_TLS_ENABLED=true

# Cache settings
CACHE_WARMUP=true
```

### TTL Configuration

Default TTL values (in seconds):

```typescript
ttl: {
  aiResponse: 86400,      // 24 hours
  aiContext: 3600,        // 1 hour
  dbQuery: 300,           // 5 minutes
  dbAggregate: 900,       // 15 minutes
  apiResponse: 120,       // 2 minutes
  session: 86400,         // 24 hours
  userProfile: 1800,      // 30 minutes
  analytics: 3600,        // 1 hour
  staticAsset: 604800,    // 7 days
}
```

## Usage

### Basic Cache Operations

```typescript
import { cache } from '@/lib/cache';

// Set a value
await cache.set('key', { data: 'value' }, {
  ttl: 3600, // 1 hour
  compress: true,
  tags: ['user-data', 'org:123']
});

// Get a value
const value = await cache.get('key');

// Get or set (cache-aside pattern)
const data = await cache.getOrSet('expensive-key', async () => {
  // Expensive operation
  return await fetchExpensiveData();
}, { ttl: 3600 });

// Delete
await cache.delete('key');

// Delete by pattern
await cache.deletePattern('user:*');

// Invalidate by tags
await cache.invalidateByTags(['org:123']);
```

### AI Response Caching

```typescript
import { aiCache } from '@/lib/cache';

// Cache AI response
const response = await aiCache.getOrGenerateResponse(
  prompt,
  async () => {
    // Call AI provider
    return await aiProvider.complete(prompt);
  },
  'openai',
  { temperature: 0.7 }
);

// Cache conversation context
await aiCache.cacheContext(conversationId, {
  messages: [...],
  organizationId: 'org-123'
});

// Get cached context
const context = await aiCache.getContext(conversationId);
```

### Database Query Caching

```typescript
import { dbCache } from '@/lib/cache';

// Cache query results
const results = await dbCache.queryWithCache(
  'SELECT * FROM emissions WHERE org_id = $1',
  [orgId],
  async () => {
    // Execute query
    return await db.query(sql, params);
  },
  300 // 5 minute TTL
);

// Cache entity
await dbCache.cacheEntity('users', userId, userProfile);

// Get cached entity
const user = await dbCache.getCachedEntity('users', userId);

// Invalidate on write
await dbCache.invalidateOnWrite('emissions', 'insert');
```

### API Response Caching

```typescript
import { withCache } from '@/lib/middleware/cache';

// In API route
export async function GET(request: NextRequest) {
  return withCache({ ttl: 300 })(request, async () => {
    // Handler logic
    const data = await fetchData();
    return NextResponse.json(data);
  });
}
```

### Session Management

```typescript
import { sessionCache } from '@/lib/cache';

// Store session
await sessionCache.setSession(userId, {
  userId,
  email,
  organizationId,
  role,
  permissions,
  lastActivity: new Date().toISOString()
});

// Check if valid
const isValid = await sessionCache.isSessionValid(userId);

// Update activity
await sessionCache.touchSession(userId);

// Store user profile
await sessionCache.setUserProfile(userId, profile);

// Get cached permissions
const permissions = await sessionCache.getUserPermissions(userId);
```

## Cache Patterns

### 1. Cache-Aside Pattern

```typescript
const data = await cache.getOrSet(key, async () => {
  return await expensiveOperation();
}, { ttl: 3600 });
```

### 2. Write-Through Cache

```typescript
async function updateEmission(id: string, data: any) {
  // Update database
  const result = await db.update('emissions', id, data);
  
  // Update cache
  await dbCache.cacheEntity('emissions', id, result);
  
  // Invalidate related caches
  await dbCache.invalidateTable('emissions');
  
  return result;
}
```

### 3. Refresh-Ahead Cache

```typescript
async function getMetrics(orgId: string) {
  const cached = await cache.get(key);
  
  // Refresh if close to expiry
  if (cached && isNearExpiry(cached)) {
    // Async refresh
    refreshInBackground(key);
  }
  
  return cached || await generateMetrics(orgId);
}
```

## Cache Invalidation Strategies

### Tag-Based Invalidation

```typescript
// Tag data when caching
await cache.set(key, data, {
  tags: ['org:123', 'emissions', 'monthly']
});

// Invalidate all org data
await cache.invalidateByTags(['org:123']);
```

### Pattern-Based Invalidation

```typescript
// Clear all user cache
await cache.deletePattern('user:*');

// Clear specific API responses
await cache.deletePattern('api:*/emissions*');
```

### Write-Based Invalidation

```typescript
// Automatic invalidation on writes
const invalidationPatterns = {
  emissions: ['emissions:*', 'analytics:*', 'api:emissions:*'],
  organizations: ['org:*', 'analytics:*'],
  users: ['user:*', 'session:*']
};
```

## Monitoring & Maintenance

### Cache Statistics

```typescript
// Get cache stats
const stats = cache.getStats();
console.log(`Hit rate: ${(stats.hitRate * 100).toFixed(2)}%`);
console.log(`Avg response time: ${stats.avgResponseTime}ms`);

// AI-specific stats
const aiStats = await aiCache.getStats();
console.log(`AI cache hit rate: ${(aiStats.cacheHitRate * 100).toFixed(2)}%`);
```

### Cache Status API

```bash
# Get cache status
GET /api/cache/status

# Clear cache (admin only)
POST /api/cache/status
{
  "action": "clear-all" | "clear-ai" | "clear-db" | "reset-stats" | "warm-up"
}
```

### Performance Optimization

1. **Use compression** for large values:
```typescript
await cache.set(key, largeData, { compress: true });
```

2. **Batch operations** to reduce round trips:
```typescript
const pipeline = redis.pipeline();
keys.forEach(key => pipeline.get(key));
const results = await pipeline.exec();
```

3. **Set appropriate TTLs** based on data volatility:
- Static data: 7 days
- User profiles: 30 minutes
- API responses: 2 minutes
- AI responses: 24 hours

## Troubleshooting

### Cache Misses

1. Check Redis connection:
```typescript
const isConnected = redisClient.isReady();
```

2. Verify key generation:
```typescript
console.log(cacheKeys.api.response('GET', '/api/users', params));
```

3. Check TTL expiration

### High Memory Usage

1. Review TTL settings
2. Enable compression for large values
3. Implement cache eviction policies
4. Monitor key patterns

### Connection Issues

1. Verify Redis is running
2. Check network connectivity
3. Validate credentials
4. Review connection pool settings

## Best Practices

1. **Always handle cache failures gracefully** - the app should work without cache
2. **Use appropriate TTLs** - balance freshness vs performance
3. **Implement cache warming** for critical data
4. **Monitor cache metrics** regularly
5. **Tag data appropriately** for efficient invalidation
6. **Compress large values** to save memory
7. **Use distributed locks** for expensive operations
8. **Document cache dependencies** in code

## Example: Complete Caching Flow

```typescript
// API endpoint with full caching
export async function GET(request: NextRequest) {
  return withCache({ 
    ttl: 300,
    revalidate: ['/api/dashboard']
  })(request, async () => {
    const { userId } = await authenticate(request);
    
    // Check session cache
    const cachedProfile = await sessionCache.getUserProfile(userId);
    if (cachedProfile) {
      return NextResponse.json(cachedProfile);
    }
    
    // Get from database with caching
    const profile = await dbCache.queryWithCache(
      'SELECT * FROM user_profiles WHERE id = $1',
      [userId],
      async () => {
        const { data } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single();
        return data;
      }
    );
    
    // Cache in session
    await sessionCache.setUserProfile(userId, profile);
    
    return NextResponse.json(profile);
  });
}
```