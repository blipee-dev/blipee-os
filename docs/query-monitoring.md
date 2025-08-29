# Query Monitoring System

## Overview

The query monitoring system provides comprehensive database performance tracking, slow query logging, and health monitoring for the Blipee OS platform.

## Features

- **Slow Query Logging**: Automatically tracks queries exceeding performance thresholds
- **Query Pattern Analysis**: Identifies common patterns and optimization opportunities
- **Database Health Metrics**: Monitors connection counts, cache hit ratios, and more
- **Performance Insights**: Provides actionable recommendations for query optimization
- **Export Capabilities**: Generate reports in JSON or CSV format

## Setup

1. **Apply the database migration**:
   ```bash
   # Link to your Supabase project (if not already linked)
   npx supabase link --project-ref your-project-ref
   
   # Apply the migration
   npx supabase db push
   ```

2. **Configure environment variables** (if needed):
   - The system uses existing Supabase credentials
   - No additional configuration required

## API Endpoints

### GET /api/monitoring/queries

Retrieve monitoring data based on type:

- `?type=stats` - Database statistics and overview
- `?type=slow_queries&threshold_ms=100` - Slow query log
- `?type=insights&hours=24` - Query performance insights
- `?type=patterns&days=7` - Query pattern analysis
- `?type=health` - Database health metrics
- `?type=report&format=json|csv` - Export full report

### POST /api/monitoring/queries

Control automatic monitoring:

```json
{
  "action": "start|stop",
  "interval_minutes": 5
}
```

## Usage

### In Application Code

```typescript
import { queryMonitor } from '@/lib/database/query-monitor';

// Get slow queries
const slowQueries = await queryMonitor.getSlowQueries(100);

// Get query insights
const insights = await queryMonitor.getQueryInsights(24);

// Check database health
const health = await queryMonitor.checkDatabaseHealth();

// Start automatic monitoring
await queryMonitor.startMonitoring(5); // 5-minute intervals
```

### Admin Dashboard Component

```tsx
import { QueryMonitorDashboard } from '@/components/admin/query-monitor-dashboard';

export function AdminPage() {
  return (
    <QueryMonitorDashboard 
      onExport={(format) => console.log(`Exported as ${format}`)}
    />
  );
}
```

## Database Tables

### slow_query_logs
- Stores historical slow query executions
- Tracks execution times, call counts, and patterns
- Automatically aggregates repeated queries

### query_performance_metrics
- Time-series data for query performance
- Tracks execution time, lock wait time, I/O time
- Used for trend analysis

### database_health_metrics
- Regular health check results
- Monitors connections, cache ratios, database size
- Configurable warning and critical thresholds

## Security

- All monitoring endpoints require admin (account_owner) role
- Row Level Security (RLS) policies restrict data access
- Query execution is limited to index operations only

## Performance Considerations

- Query logs are automatically aggregated to reduce storage
- Old metrics are cleaned up after 7 days
- Caching is implemented for all read operations
- Monitoring runs asynchronously to avoid impacting performance

## Testing

Run the test script to validate the monitoring system:

```bash
npm run test:query-monitoring
```

This will:
1. Test all API endpoints
2. Verify data collection
3. Check export functionality
4. Validate health metrics

## Troubleshooting

### pg_stat_statements not available
The system gracefully handles missing extensions. To enable full functionality:

```sql
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```

### No slow queries detected
- Check the threshold setting (default: 100ms)
- Ensure queries are actually running slow
- Verify the monitoring service is running

### Health metrics show warnings
Review the thresholds in the `check_database_health()` function and adjust based on your infrastructure limits.