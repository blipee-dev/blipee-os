# Database Optimization Guide

This guide provides best practices and tools for optimizing database performance in Blipee OS.

## Table of Contents

- [Overview](#overview)
- [Core Indexes](#core-indexes)
- [Query Optimization](#query-optimization)
- [Using the Optimization Tools](#using-the-optimization-tools)
- [Best Practices](#best-practices)
- [Monitoring Performance](#monitoring-performance)

## Overview

Blipee OS includes comprehensive database optimization tools to ensure optimal performance at scale:

- **Query Analyzer**: Analyzes query execution plans and identifies bottlenecks
- **Index Optimizer**: Manages database indexes intelligently
- **Connection Pooling**: Efficient connection management with PgBouncer
- **Read Replicas**: Distributes read load across multiple replicas
- **Query Router**: Intelligent routing of queries to appropriate databases

## Core Indexes

The system automatically creates and manages these core indexes:

### Emissions Table
- `idx_emissions_org_period`: Optimizes organization emission queries by date range
- `idx_emissions_source_period`: Optimizes emission source timeline queries  
- `idx_emissions_verification`: Optimizes verified emissions queries
- `idx_emissions_covering`: Covering index for emission summary queries

### API Usage Table
- `idx_api_usage_org_created`: Optimizes API usage analytics queries
- `idx_api_usage_key_created`: Optimizes per-key usage queries
- `idx_api_usage_status`: Optimizes error rate calculations

### Organization Members Table
- `idx_org_members_composite`: Optimizes member lookup queries
- `idx_org_members_role`: Optimizes role-based access queries

### Other Tables
- Buildings, Facilities, Messages, Security Logs all have optimized indexes
- JSONB columns use GIN indexes for fast metadata searches
- Partial indexes for status-based queries

## Query Optimization

### Running the Optimization Tool

```bash
# Analyze current database state
npm run db:optimize analyze

# Run optimization (dry run)
npm run db:optimize optimize

# Execute optimization changes
npm run db:optimize optimize -- --execute

# Create core indexes
npm run db:optimize create-core

# Monitor real-time performance
npm run db:optimize monitor
```

### API Endpoints

The optimization API is available at `/api/database/optimize`:

```typescript
// Analyze database
GET /api/database/optimize?action=analyze

// Run optimization
GET /api/database/optimize?action=optimize&dryRun=false

// Create core indexes
GET /api/database/optimize?action=create-core

// Get index statistics
GET /api/database/optimize?action=index-stats&name=idx_emissions_org_period

// Get table statistics  
GET /api/database/optimize?action=table-stats&table=emissions
```

### Programmatic Usage

```typescript
import { queryAnalyzer } from '@/lib/database/query-analyzer';
import { indexOptimizer } from '@/lib/database/index-optimizer';

// Analyze a specific query
const analysis = await queryAnalyzer.analyzeQuery(
  'SELECT * FROM emissions WHERE organization_id = $1',
  ['org-123']
);

// Get optimization recommendations
const report = await queryAnalyzer.generateOptimizationReport();

// Create missing indexes
const result = await indexOptimizer.createCoreIndexes();

// Optimize indexes (remove unused, create missing)
const optimization = await indexOptimizer.optimizeIndexes();
```

## Best Practices

### 1. Index Design

**DO:**
- Create indexes on columns used in WHERE, JOIN, and ORDER BY clauses
- Use covering indexes for frequently accessed column combinations
- Create partial indexes for queries with consistent WHERE conditions
- Use appropriate index types (B-tree for equality, GIN for JSONB)

**DON'T:**
- Over-index tables (each index adds write overhead)
- Create redundant indexes (PostgreSQL can use index prefixes)
- Index low-cardinality columns alone
- Forget to maintain indexes (rebuild bloated indexes)

### 2. Query Patterns

**Efficient Patterns:**
```sql
-- Use specific columns
SELECT id, name, email FROM users WHERE organization_id = $1;

-- Use LIMIT for pagination
SELECT * FROM emissions ORDER BY created_at DESC LIMIT 20 OFFSET 40;

-- Use EXISTS instead of COUNT for existence checks
SELECT EXISTS(SELECT 1 FROM emissions WHERE source_id = $1);

-- Batch operations
INSERT INTO emissions (source_id, co2e_tonnes, period_start) 
VALUES ($1, $2, $3), ($4, $5, $6), ($7, $8, $9);
```

**Avoid:**
```sql
-- SELECT * (unless needed)
SELECT * FROM large_table;

-- OR conditions (use UNION instead)
SELECT * FROM users WHERE email = $1 OR username = $2;

-- NOT IN with subqueries (use NOT EXISTS)
SELECT * FROM users WHERE id NOT IN (SELECT user_id FROM deleted_users);

-- Functions on indexed columns
SELECT * FROM emissions WHERE DATE(created_at) = '2024-01-01';
```

### 3. Connection Management

Use the appropriate client based on operation type:

```typescript
import { getPooledClient } from '@/lib/database/pooled-client';
import { queryReadReplica } from '@/lib/database/read-replica';
import { smartQuery } from '@/lib/database/query-router';

// For writes - always use primary
const result = await smartQuery.mutate(
  'UPDATE emissions SET verified = true WHERE id = $1',
  [emissionId]
);

// For reads - automatically uses replicas
const data = await smartQuery.select(
  'SELECT * FROM emissions WHERE organization_id = $1',
  [orgId]
);

// For transactions
await smartQuery.transaction(async (client) => {
  await client.query('INSERT INTO emissions ...');
  await client.query('UPDATE emission_sources ...');
});
```

### 4. Materialized Views

For expensive aggregations, use materialized views:

```sql
-- Dashboard metrics are pre-aggregated
SELECT * FROM mv_org_dashboard_metrics 
WHERE organization_id = $1 AND month >= $2;

-- Refresh periodically
SELECT refresh_dashboard_metrics();
```

## Monitoring Performance

### 1. Slow Query Detection

The system automatically tracks slow queries. View them with:

```bash
npm run db:optimize stats
```

Or programmatically:

```typescript
import { dbMonitor } from '@/lib/database/monitoring';

const slowQueries = dbMonitor.getSlowQueries(10);
const queryStats = dbMonitor.getQueryStatistics();
```

### 2. Connection Pool Monitoring

Monitor connection pool health:

```typescript
const poolStats = dbMonitor.getConnectionPoolStats();
console.log(`Active connections: ${poolStats.active}/${poolStats.total}`);
```

### 3. Index Usage

Track index effectiveness:

```typescript
const indexStats = await indexOptimizer.getIndexStats();
const unusedIndexes = indexStats.filter(idx => idx.scansCount === 0);
```

### 4. Real-time Monitoring

Use the built-in monitor:

```bash
npm run db:optimize monitor
```

This displays:
- Active database connections
- Recent slow queries
- Connection pool status
- Query patterns

## Troubleshooting

### High Query Times

1. Run query analysis:
```typescript
const analysis = await queryAnalyzer.analyzeQuery(slowQuery);
console.log(analysis.suggestions);
```

2. Check for missing indexes:
```bash
npm run db:optimize analyze
```

3. Review query plan for sequential scans

### Connection Pool Exhaustion

1. Check for connection leaks
2. Increase pool size in configuration
3. Optimize long-running queries
4. Use read replicas for read-heavy operations

### Index Bloat

1. Identify bloated indexes:
```typescript
const stats = await queryAnalyzer.getTableStatistics('emissions');
console.log(`Bloat ratio: ${stats.bloatRatio}`);
```

2. Rebuild bloated indexes:
```typescript
await indexOptimizer.rebuildIndex('idx_emissions_org_period');
```

## Security Considerations

- Database optimization requires elevated permissions
- Only `account_owner` and `sustainability_manager` roles can run optimizations
- All optimization actions are logged in security audit logs
- Index operations are restricted to prevent malicious SQL execution

## Performance Targets

Blipee OS targets these performance metrics:

- **Query Response Time**: < 50ms for indexed queries
- **API Response Time**: < 200ms for 95th percentile
- **Connection Pool**: < 80% utilization under normal load
- **Read Replica Lag**: < 100ms replication delay
- **Index Effectiveness**: > 100 tuples read per scan

Regular optimization ensures these targets are met as data grows.