# Read Replica Setup Guide

## Overview

Read replicas allow you to scale read operations by distributing queries across multiple database instances. This improves performance, reduces load on the primary database, and provides geographic distribution for lower latency.

## Architecture

```
                     ┌─────────────────┐
                     │   Application   │
                     └────────┬────────┘
                              │
                     ┌────────▼────────┐
                     │  Query Router   │
                     └────────┬────────┘
                              │
           ┌──────────────────┴──────────────────┐
           │                                      │
     ┌─────▼─────┐                         ┌─────▼─────┐
     │  Primary  │                         │   Load    │
     │ Database  │                         │ Balancer  │
     └───────────┘                         └─────┬─────┘
         (Writes)                                 │
                                    ┌─────────────┼─────────────┐
                                    │             │             │
                              ┌─────▼─────┐ ┌─────▼─────┐ ┌─────▼─────┐
                              │ Replica 1 │ │ Replica 2 │ │ Replica 3 │
                              │   (US)    │ │   (EU)    │ │   (ASIA)  │
                              └───────────┘ └───────────┘ └───────────┘
```

## Configuration

### Environment Variables

```env
# Read Replica URLs (comma-separated)
SUPABASE_READ_REPLICA_URLS=postgresql://user:pass@replica1.supabase.co:5432/postgres,postgresql://user:pass@replica2.supabase.co:5432/postgres

# Read Replica Regions (optional, comma-separated)
SUPABASE_READ_REPLICA_REGIONS=us-east-1,eu-west-1,ap-southeast-1

# Read Replica Weights (optional, comma-separated)
# Higher weight = more traffic
SUPABASE_READ_REPLICA_WEIGHTS=2,1,1

# Load Balancing Strategy
READ_REPLICA_STRATEGY=adaptive # Options: round-robin, least-connections, geographic, adaptive
```

### Supabase Setup

1. **Enable Read Replicas in Supabase Dashboard**
   - Go to Database → Replication
   - Enable "Read Replicas"
   - Choose regions for replicas
   - Wait for replica provisioning (10-15 minutes)

2. **Get Replica Connection Strings**
   - Each replica has its own connection string
   - Found under Database → Connection Strings → Read Replicas

3. **Configure Network Access**
   - Add your application IPs to allowed list
   - Enable SSL for secure connections

## Implementation

### Basic Usage

```typescript
import { smartQuery } from '@/lib/database/query-router';

// Automatically routes to read replica
const users = await smartQuery.select(
  'SELECT * FROM users WHERE active = $1',
  [true]
);

// Forces primary database
const newUser = await smartQuery.mutate(
  'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
  ['John Doe', 'john@example.com']
);
```

### Supabase Client with Read Replicas

```typescript
import { createSmartSupabaseClient } from '@/lib/database/query-router';

const supabase = createSmartSupabaseClient();

// SELECT queries automatically use replicas
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('category', 'electronics');

// Writes always go to primary
const { data: newProduct } = await supabase
  .from('products')
  .insert({ name: 'New Product', price: 99.99 });
```

### Regional Routing

```typescript
// Route to specific region for lower latency
const results = await smartQuery.select(
  'SELECT * FROM products WHERE region = $1',
  ['eu'],
  { preferredRegion: 'eu-west-1' }
);
```

### Consistency Options

```typescript
// Strong consistency - uses primary
const balance = await smartQuery.select(
  'SELECT balance FROM accounts WHERE id = $1',
  [accountId],
  { consistency: 'strong' }
);

// Eventual consistency with max staleness
const products = await smartQuery.select(
  'SELECT * FROM products',
  [],
  { 
    consistency: 'eventual',
    maxStaleness: 5000 // 5 seconds
  }
);
```

## Load Balancing Strategies

### 1. Round Robin
Distributes queries evenly across all replicas.

```typescript
READ_REPLICA_STRATEGY=round-robin
```

### 2. Least Connections
Routes to replica with fewest active connections.

```typescript
READ_REPLICA_STRATEGY=least-connections
```

### 3. Geographic
Routes based on user location for lowest latency.

```typescript
READ_REPLICA_STRATEGY=geographic
```

### 4. Adaptive (Recommended)
Automatically switches strategies based on conditions.

```typescript
READ_REPLICA_STRATEGY=adaptive
```

## Monitoring

### Health Check Endpoint

```bash
GET /api/monitoring/read-replicas

Response:
{
  "status": "operational",
  "summary": {
    "totalReplicas": 3,
    "healthyReplicas": 3,
    "healthScore": "95%"
  },
  "replicas": [
    {
      "region": "us-east-1",
      "status": "healthy",
      "metrics": {
        "requestCount": 1523,
        "errorRate": "0.2%",
        "averageLatencyMs": 25
      }
    }
  ],
  "performance": {
    "primaryLatencyMs": 45,
    "latencyImprovement": "44%"
  }
}
```

### Metrics to Monitor

1. **Replica Health**
   - Connection success rate
   - Health check latency
   - Error rates

2. **Performance**
   - Query latency per replica
   - Load distribution
   - Cache hit rates

3. **Replication Lag**
   - Monitor via Supabase dashboard
   - Alert on lag > 1 second

## Best Practices

### 1. Query Routing

- **Read-only queries** → Read replicas
- **Writes** → Primary database
- **Transactions** → Primary database
- **Real-time subscriptions** → Primary database

### 2. Handling Replication Lag

```typescript
// For critical reads after writes
await smartQuery.mutate('INSERT INTO orders ...', [...]);

// Force next read to primary for consistency
const order = await smartQuery.select(
  'SELECT * FROM orders WHERE id = $1',
  [orderId],
  { forcePrimary: true }
);
```

### 3. Failover Strategy

```typescript
// Automatic failover to primary
const data = await queryReadReplica(sql, params, {
  fallbackToPrimary: true
});
```

### 4. Connection Pooling

- Each replica has its own connection pool
- Default: 10 connections per replica
- Adjust based on load

## Troubleshooting

### Common Issues

1. **"No healthy replicas available"**
   - Check replica URLs in environment
   - Verify network connectivity
   - Check database credentials

2. **High replication lag**
   - Monitor write volume on primary
   - Consider adding more replicas
   - Check network latency

3. **Uneven load distribution**
   - Review load balancing strategy
   - Adjust replica weights
   - Check for hot queries

### Debug Mode

```typescript
// Enable debug logging
process.env.READ_REPLICA_DEBUG = 'true';

// Logs will show:
// - Query routing decisions
// - Replica selection
// - Performance metrics
```

## Performance Tips

1. **Cache Frequently Accessed Data**
   ```typescript
   // Combine with Redis caching
   const cached = await redis.get(key);
   if (cached) return cached;
   
   const data = await smartQuery.select(...);
   await redis.set(key, data, 'EX', 300);
   ```

2. **Batch Read Operations**
   ```typescript
   // Use read replicas for batch operations
   const results = await Promise.all([
     smartQuery.select('SELECT * FROM users WHERE ...'),
     smartQuery.select('SELECT * FROM products WHERE ...'),
     smartQuery.select('SELECT * FROM orders WHERE ...')
   ]);
   ```

3. **Monitor Query Patterns**
   - Identify queries that can use replicas
   - Find queries that must use primary
   - Optimize based on access patterns

## Security Considerations

1. **Connection Security**
   - Always use SSL/TLS
   - Rotate credentials regularly
   - Use connection pooling

2. **Access Control**
   - Replicas should be read-only
   - Use separate credentials
   - Monitor for suspicious queries

3. **Data Sensitivity**
   - Ensure replicas have same security as primary
   - Consider encryption at rest
   - Audit replica access

## Cost Optimization

1. **Right-size Replicas**
   - Monitor utilization
   - Scale based on actual load
   - Use smaller replicas for dev/staging

2. **Regional Distribution**
   - Place replicas near users
   - Reduces data transfer costs
   - Improves performance

3. **Scheduled Scaling**
   - Add replicas during peak hours
   - Remove during off-peak
   - Automate with monitoring

## Migration Checklist

- [ ] Configure replica URLs in environment
- [ ] Test replica connectivity
- [ ] Update queries to use smart routing
- [ ] Monitor performance metrics
- [ ] Set up alerts for replica health
- [ ] Document query patterns
- [ ] Train team on best practices