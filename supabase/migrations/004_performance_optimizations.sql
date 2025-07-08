-- Performance Optimizations for Blipee OS Database
-- This migration adds performance enhancements to the consolidated schema

-- =====================================================
-- PARTITIONING FOR LARGE TABLES
-- =====================================================

-- Partition emissions table by year for better performance
-- Note: This requires recreating the table, so only do this in new deployments
-- For existing data, use the migration strategy document

-- Create parent table for emissions partitioning
CREATE TABLE IF NOT EXISTS emissions_partitioned (
  LIKE emissions INCLUDING ALL
) PARTITION BY RANGE (emission_date);

-- Create partitions for recent years and future
CREATE TABLE IF NOT EXISTS emissions_y2023 PARTITION OF emissions_partitioned
  FOR VALUES FROM ('2023-01-01') TO ('2024-01-01');

CREATE TABLE IF NOT EXISTS emissions_y2024 PARTITION OF emissions_partitioned
  FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE IF NOT EXISTS emissions_y2025 PARTITION OF emissions_partitioned
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

CREATE TABLE IF NOT EXISTS emissions_y2026 PARTITION OF emissions_partitioned
  FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

-- Create a default partition for other dates
CREATE TABLE IF NOT EXISTS emissions_default PARTITION OF emissions_partitioned DEFAULT;

-- Partition building_metrics table by month
CREATE TABLE IF NOT EXISTS building_metrics_partitioned (
  LIKE building_metrics INCLUDING ALL
) PARTITION BY RANGE (recorded_at);

-- Create monthly partitions for the current year
DO $$
DECLARE
  start_date date := date_trunc('year', CURRENT_DATE);
  end_date date := start_date + interval '1 year';
  partition_date date;
  partition_name text;
BEGIN
  partition_date := start_date;
  WHILE partition_date < end_date LOOP
    partition_name := 'building_metrics_y' || to_char(partition_date, 'YYYY') || 'm' || to_char(partition_date, 'MM');
    EXECUTE format(
      'CREATE TABLE IF NOT EXISTS %I PARTITION OF building_metrics_partitioned
       FOR VALUES FROM (%L) TO (%L)',
      partition_name,
      partition_date,
      partition_date + interval '1 month'
    );
    partition_date := partition_date + interval '1 month';
  END LOOP;
END $$;

-- Partition audit_logs by month
CREATE TABLE IF NOT EXISTS audit_logs_partitioned (
  LIKE audit_logs INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Create function to automatically create monthly partitions
CREATE OR REPLACE FUNCTION create_monthly_partitions(
  parent_table text,
  date_column text,
  months_ahead int DEFAULT 3
) RETURNS void AS $$
DECLARE
  start_date date;
  end_date date;
  partition_date date;
  partition_name text;
BEGIN
  start_date := date_trunc('month', CURRENT_DATE);
  end_date := start_date + (months_ahead || ' months')::interval;
  
  partition_date := start_date;
  WHILE partition_date < end_date LOOP
    partition_name := parent_table || '_y' || to_char(partition_date, 'YYYY') || 'm' || to_char(partition_date, 'MM');
    
    -- Check if partition already exists
    IF NOT EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname = partition_name AND n.nspname = 'public'
    ) THEN
      EXECUTE format(
        'CREATE TABLE %I PARTITION OF %I
         FOR VALUES FROM (%L) TO (%L)',
        partition_name,
        parent_table,
        partition_date,
        partition_date + interval '1 month'
      );
      RAISE NOTICE 'Created partition %', partition_name;
    END IF;
    
    partition_date := partition_date + interval '1 month';
  END LOOP;
END $$ LANGUAGE plpgsql;

-- Schedule monthly partition creation (requires pg_cron extension)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('create-partitions', '0 0 1 * *', 
--   $$SELECT create_monthly_partitions('building_metrics_partitioned', 'recorded_at', 3);
--     SELECT create_monthly_partitions('audit_logs_partitioned', 'created_at', 3);$$
-- );

-- =====================================================
-- MATERIALIZED VIEWS FOR COMPLEX QUERIES
-- =====================================================

-- Materialized view for organization emissions summary
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_organization_emissions_summary AS
SELECT 
  o.id as organization_id,
  o.name as organization_name,
  e.scope,
  e.source,
  DATE_TRUNC('month', e.emission_date) as month,
  COUNT(*) as entry_count,
  SUM(e.co2e_kg) as total_co2e_kg,
  AVG(e.co2e_kg) as avg_co2e_kg,
  MIN(e.emission_date) as first_entry,
  MAX(e.emission_date) as last_entry
FROM organizations o
JOIN emissions e ON e.organization_id = o.id
GROUP BY o.id, o.name, e.scope, e.source, DATE_TRUNC('month', e.emission_date);

-- Create indexes on materialized view
CREATE INDEX idx_mv_org_emissions_org_id ON mv_organization_emissions_summary(organization_id);
CREATE INDEX idx_mv_org_emissions_month ON mv_organization_emissions_summary(month DESC);
CREATE INDEX idx_mv_org_emissions_scope_source ON mv_organization_emissions_summary(scope, source);

-- Materialized view for building performance metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_building_performance AS
SELECT 
  b.id as building_id,
  b.name as building_name,
  b.organization_id,
  b.type as building_type,
  b.size_sqft,
  DATE_TRUNC('day', bm.recorded_at) as date,
  bm.metric_type,
  AVG(bm.metric_value) as avg_value,
  MIN(bm.metric_value) as min_value,
  MAX(bm.metric_value) as max_value,
  COUNT(*) as reading_count
FROM buildings b
JOIN building_metrics bm ON bm.building_id = b.id
WHERE bm.recorded_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY b.id, b.name, b.organization_id, b.type, b.size_sqft, 
         DATE_TRUNC('day', bm.recorded_at), bm.metric_type;

-- Create indexes
CREATE INDEX idx_mv_building_perf_building ON mv_building_performance(building_id);
CREATE INDEX idx_mv_building_perf_date ON mv_building_performance(date DESC);
CREATE INDEX idx_mv_building_perf_type ON mv_building_performance(metric_type);

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_materialized_views() RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_organization_emissions_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_building_performance;
END $$ LANGUAGE plpgsql;

-- Schedule hourly refresh (requires pg_cron)
-- SELECT cron.schedule('refresh-materialized-views', '0 * * * *', 
--   'SELECT refresh_materialized_views();'
-- );

-- =====================================================
-- QUERY OPTIMIZATION FUNCTIONS
-- =====================================================

-- Function to get emissions data with performance optimization
CREATE OR REPLACE FUNCTION get_emissions_summary(
  p_organization_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_scope emission_scope DEFAULT NULL,
  p_source emission_source DEFAULT NULL
) RETURNS TABLE (
  emission_date DATE,
  scope emission_scope,
  source emission_source,
  total_co2e_kg DECIMAL,
  entry_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.emission_date,
    e.scope,
    e.source,
    SUM(e.co2e_kg) as total_co2e_kg,
    COUNT(*) as entry_count
  FROM emissions e
  WHERE e.organization_id = p_organization_id
    AND e.emission_date BETWEEN p_start_date AND p_end_date
    AND (p_scope IS NULL OR e.scope = p_scope)
    AND (p_source IS NULL OR e.source = p_source)
  GROUP BY e.emission_date, e.scope, e.source
  ORDER BY e.emission_date DESC;
END $$ LANGUAGE plpgsql STABLE;

-- Function to get building metrics with caching
CREATE OR REPLACE FUNCTION get_building_metrics_cached(
  p_building_id UUID,
  p_metric_type VARCHAR,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ,
  p_interval VARCHAR DEFAULT 'hour'
) RETURNS TABLE (
  time_bucket TIMESTAMPTZ,
  avg_value DECIMAL,
  min_value DECIMAL,
  max_value DECIMAL,
  sample_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    date_trunc(p_interval, bm.recorded_at) as time_bucket,
    AVG(bm.metric_value) as avg_value,
    MIN(bm.metric_value) as min_value,
    MAX(bm.metric_value) as max_value,
    COUNT(*) as sample_count
  FROM building_metrics bm
  WHERE bm.building_id = p_building_id
    AND bm.metric_type = p_metric_type
    AND bm.recorded_at BETWEEN p_start_time AND p_end_time
  GROUP BY date_trunc(p_interval, bm.recorded_at)
  ORDER BY time_bucket DESC;
END $$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- PERFORMANCE MONITORING
-- =====================================================

-- Create table for query performance tracking
CREATE TABLE IF NOT EXISTS query_performance_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query_hash TEXT NOT NULL,
  query_text TEXT,
  execution_time INTERVAL NOT NULL,
  rows_returned BIGINT,
  user_id UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_query_perf_hash ON query_performance_log(query_hash);
CREATE INDEX idx_query_perf_time ON query_performance_log(execution_time DESC);
CREATE INDEX idx_query_perf_created ON query_performance_log(created_at DESC);

-- Function to log slow queries
CREATE OR REPLACE FUNCTION log_slow_query(
  p_query_text TEXT,
  p_execution_time INTERVAL,
  p_rows_returned BIGINT,
  p_user_id UUID DEFAULT NULL
) RETURNS void AS $$
BEGIN
  -- Only log queries slower than 1 second
  IF p_execution_time > INTERVAL '1 second' THEN
    INSERT INTO query_performance_log (
      query_hash,
      query_text,
      execution_time,
      rows_returned,
      user_id
    ) VALUES (
      MD5(p_query_text),
      LEFT(p_query_text, 5000), -- Truncate very long queries
      p_execution_time,
      p_rows_returned,
      p_user_id
    );
  END IF;
END $$ LANGUAGE plpgsql;

-- =====================================================
-- CONNECTION POOLING OPTIMIZATION
-- =====================================================

-- Function to check connection usage
CREATE OR REPLACE FUNCTION check_connection_usage()
RETURNS TABLE (
  total_connections BIGINT,
  active_connections BIGINT,
  idle_connections BIGINT,
  idle_in_transaction BIGINT,
  waiting_connections BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_connections,
    COUNT(*) FILTER (WHERE state = 'active') as active_connections,
    COUNT(*) FILTER (WHERE state = 'idle') as idle_connections,
    COUNT(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction,
    COUNT(*) FILTER (WHERE wait_event_type IS NOT NULL) as waiting_connections
  FROM pg_stat_activity
  WHERE datname = current_database();
END $$ LANGUAGE plpgsql;

-- =====================================================
-- VACUUM AND ANALYZE CONFIGURATION
-- =====================================================

-- Set aggressive autovacuum for high-traffic tables
ALTER TABLE emissions SET (
  autovacuum_vacuum_scale_factor = 0.01,
  autovacuum_analyze_scale_factor = 0.01
);

ALTER TABLE building_metrics SET (
  autovacuum_vacuum_scale_factor = 0.01,
  autovacuum_analyze_scale_factor = 0.01
);

ALTER TABLE messages SET (
  autovacuum_vacuum_scale_factor = 0.02,
  autovacuum_analyze_scale_factor = 0.02
);

ALTER TABLE audit_logs SET (
  autovacuum_vacuum_scale_factor = 0.02,
  autovacuum_analyze_scale_factor = 0.02
);

-- =====================================================
-- QUERY HINTS AND OPTIMIZATION
-- =====================================================

-- Create statistics for correlated columns
CREATE STATISTICS stat_emissions_org_date ON organization_id, emission_date FROM emissions;
CREATE STATISTICS stat_emissions_scope_source ON scope, source FROM emissions;
CREATE STATISTICS stat_buildings_org_type ON organization_id, type FROM buildings;
CREATE STATISTICS stat_metrics_building_type ON building_id, metric_type FROM building_metrics;

-- =====================================================
-- PERFORMANCE VIEWS
-- =====================================================

-- View for monitoring table sizes
CREATE OR REPLACE VIEW v_table_sizes AS
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size,
  n_live_tup as row_count,
  n_dead_tup as dead_rows,
  last_vacuum,
  last_autovacuum
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- View for monitoring index usage
CREATE OR REPLACE VIEW v_index_usage AS
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
  CASE 
    WHEN idx_scan = 0 THEN 'UNUSED'
    WHEN idx_scan < 100 THEN 'RARELY USED'
    ELSE 'ACTIVE'
  END as usage_status
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- View for identifying missing indexes
CREATE OR REPLACE VIEW v_missing_indexes AS
SELECT 
  schemaname,
  tablename,
  attname as column_name,
  n_distinct,
  correlation,
  'CREATE INDEX idx_' || tablename || '_' || attname || ' ON ' || 
  schemaname || '.' || tablename || '(' || attname || ');' as suggested_index
FROM pg_stats
WHERE schemaname = 'public'
  AND n_distinct > 100
  AND correlation < 0.1
  AND attname LIKE '%_id'
  AND NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE pg_indexes.tablename = pg_stats.tablename
      AND pg_indexes.indexdef LIKE '%' || pg_stats.attname || '%'
  );

-- =====================================================
-- PERFORMANCE RECOMMENDATIONS FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION generate_performance_report()
RETURNS TABLE (
  category VARCHAR,
  severity VARCHAR,
  recommendation TEXT,
  details JSONB
) AS $$
BEGIN
  -- Check for tables needing vacuum
  RETURN QUERY
  SELECT 
    'maintenance'::varchar as category,
    'high'::varchar as severity,
    'Table needs VACUUM: ' || schemaname || '.' || tablename as recommendation,
    jsonb_build_object(
      'dead_rows', n_dead_tup,
      'live_rows', n_live_tup,
      'last_vacuum', last_vacuum
    ) as details
  FROM pg_stat_user_tables
  WHERE n_dead_tup > n_live_tup * 0.2
    AND n_live_tup > 1000;

  -- Check for unused indexes
  RETURN QUERY
  SELECT 
    'index'::varchar as category,
    'medium'::varchar as severity,
    'Unused index: ' || indexname || ' on ' || tablename as recommendation,
    jsonb_build_object(
      'index_size', pg_size_pretty(pg_relation_size(indexrelid)),
      'table', schemaname || '.' || tablename
    ) as details
  FROM pg_stat_user_indexes
  WHERE idx_scan = 0
    AND indexrelid != 0
    AND schemaname = 'public';

  -- Check for tables missing statistics
  RETURN QUERY
  SELECT 
    'statistics'::varchar as category,
    'medium'::varchar as severity,
    'Table needs ANALYZE: ' || schemaname || '.' || tablename as recommendation,
    jsonb_build_object(
      'last_analyze', last_analyze,
      'row_count', n_live_tup
    ) as details
  FROM pg_stat_user_tables
  WHERE last_analyze IS NULL
     OR last_analyze < CURRENT_TIMESTAMP - INTERVAL '7 days';

  -- Check for slow queries
  RETURN QUERY
  SELECT 
    'query'::varchar as category,
    'high'::varchar as severity,
    'Slow query detected' as recommendation,
    jsonb_build_object(
      'query_hash', query_hash,
      'avg_time', AVG(execution_time),
      'executions', COUNT(*),
      'total_time', SUM(execution_time)
    ) as details
  FROM query_performance_log
  WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
  GROUP BY query_hash
  HAVING AVG(execution_time) > INTERVAL '5 seconds'
  ORDER BY SUM(execution_time) DESC
  LIMIT 10;

  -- Check connection pool usage
  RETURN QUERY
  WITH conn_stats AS (
    SELECT * FROM check_connection_usage()
  )
  SELECT 
    'connection'::varchar as category,
    CASE 
      WHEN active_connections > 80 THEN 'high'::varchar
      WHEN active_connections > 50 THEN 'medium'::varchar
      ELSE 'low'::varchar
    END as severity,
    'High connection usage' as recommendation,
    jsonb_build_object(
      'active', active_connections,
      'idle', idle_connections,
      'total', total_connections
    ) as details
  FROM conn_stats
  WHERE active_connections > 50;

END $$ LANGUAGE plpgsql;

-- =====================================================
-- AUTOMATIC PERFORMANCE OPTIMIZATION
-- =====================================================

-- Function to automatically create missing indexes
CREATE OR REPLACE FUNCTION auto_create_missing_indexes()
RETURNS void AS $$
DECLARE
  index_sql TEXT;
BEGIN
  FOR index_sql IN 
    SELECT suggested_index 
    FROM v_missing_indexes
    WHERE n_distinct > 1000
  LOOP
    BEGIN
      EXECUTE index_sql;
      RAISE NOTICE 'Created index: %', index_sql;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to create index: % - %', index_sql, SQLERRM;
    END;
  END LOOP;
END $$ LANGUAGE plpgsql;

-- Schedule automatic optimization (requires pg_cron)
-- SELECT cron.schedule('auto-optimize', '0 3 * * 0', 
--   $$SELECT auto_create_missing_indexes();
--     VACUUM ANALYZE;$$
-- );

COMMENT ON SCHEMA public IS 'Blipee OS consolidated schema with performance optimizations - Version 1.1';