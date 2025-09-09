-- Database optimization functions for query analysis and index management

-- Function to analyze a query (requires superuser or pg_read_all_stats)
CREATE OR REPLACE FUNCTION analyze_query(query_text TEXT, query_params TEXT[] DEFAULT '{}')
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Execute EXPLAIN ANALYZE and return as JSON
  EXECUTE format('EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) %s', query_text) INTO result;
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get table statistics
CREATE OR REPLACE FUNCTION get_table_stats(target_table_name TEXT)
RETURNS TABLE (
  row_count BIGINT,
  table_size TEXT,
  index_size TEXT,
  total_size TEXT,
  bloat_ratio NUMERIC,
  last_vacuum TIMESTAMPTZ,
  last_analyze TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pg_class.reltuples::BIGINT as row_count,
    pg_size_pretty(pg_relation_size(pg_class.oid)) as table_size,
    pg_size_pretty(pg_indexes_size(pg_class.oid)) as index_size,
    pg_size_pretty(pg_total_relation_size(pg_class.oid)) as total_size,
    CASE 
      WHEN pg_class.reltuples > 0 THEN
        (pg_relation_size(pg_class.oid)::NUMERIC / (pg_class.reltuples * 
          (SELECT avg_width FROM pg_stats WHERE tablename = target_table_name)::NUMERIC))
      ELSE 0
    END as bloat_ratio,
    pg_stat_user_tables.last_vacuum,
    pg_stat_user_tables.last_analyze
  FROM pg_class
  JOIN pg_stat_user_tables ON pg_class.relname = pg_stat_user_tables.relname
  WHERE pg_class.relname = target_table_name
    AND pg_class.relkind = 'r';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unused indexes
CREATE OR REPLACE FUNCTION get_unused_indexes(
  target_table_name TEXT DEFAULT NULL,
  days_threshold INTEGER DEFAULT 30
)
RETURNS TABLE (
  index_name TEXT,
  table_name TEXT,
  index_size TEXT,
  index_scans BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    indexrelname::TEXT as index_name,
    tablename::TEXT as table_name,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    idx_scan as index_scans
  FROM pg_stat_user_indexes
  WHERE idx_scan = 0
    AND indexrelname !~ '^pg_'
    AND (target_table_name IS NULL OR tablename = target_table_name)
    AND pg_relation_size(indexrelid) > 1024 * 1024 -- Only indexes > 1MB
  ORDER BY pg_relation_size(indexrelid) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get index statistics
CREATE OR REPLACE FUNCTION get_index_stats(target_index_name TEXT DEFAULT NULL)
RETURNS TABLE (
  index_name TEXT,
  table_name TEXT,
  index_size TEXT,
  idx_scan BIGINT,
  idx_tup_read BIGINT,
  idx_tup_fetch BIGINT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.indexrelname::TEXT,
    i.tablename::TEXT,
    pg_size_pretty(pg_relation_size(i.indexrelid)),
    i.idx_scan,
    i.idx_tup_read,
    i.idx_tup_fetch,
    (SELECT creation_time FROM pg_stat_activity WHERE query LIKE '%CREATE%INDEX%' || i.indexrelname || '%' LIMIT 1) as created_at
  FROM pg_stat_user_indexes i
  WHERE (target_index_name IS NULL OR i.indexrelname = target_index_name)
  ORDER BY i.idx_scan DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to execute SQL (restricted to index operations)
CREATE OR REPLACE FUNCTION execute_sql(sql_query TEXT)
RETURNS VOID AS $$
BEGIN
  -- Security check: only allow specific operations
  IF sql_query !~* '^(CREATE|DROP|REINDEX|COMMENT ON) (UNIQUE )?INDEX' THEN
    RAISE EXCEPTION 'Only index operations are allowed';
  END IF;
  
  -- Additional safety checks
  IF sql_query ~* '(DELETE|UPDATE|INSERT|TRUNCATE|DROP TABLE|DROP DATABASE)' THEN
    RAISE EXCEPTION 'Data modification operations are not allowed';
  END IF;
  
  EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all user tables
CREATE OR REPLACE FUNCTION get_all_tables()
RETURNS TABLE (
  table_name TEXT,
  schema_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tablename::TEXT,
    schemaname::TEXT
  FROM pg_tables
  WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
  ORDER BY tablename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to identify slow queries
CREATE OR REPLACE FUNCTION get_slow_queries(
  duration_threshold_ms INTEGER DEFAULT 100,
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
  query TEXT,
  calls BIGINT,
  total_time NUMERIC,
  mean_time NUMERIC,
  max_time NUMERIC,
  rows BIGINT
) AS $$
BEGIN
  -- Check if pg_stat_statements is available
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements') THEN
    RETURN QUERY
    SELECT 
      regexp_replace(query, '[\n\r\s]+', ' ', 'g')::TEXT as query,
      calls,
      total_exec_time as total_time,
      mean_exec_time as mean_time,
      max_exec_time as max_time,
      rows
    FROM pg_stat_statements
    WHERE mean_exec_time > duration_threshold_ms
      AND query NOT LIKE '%pg_stat_statements%'
    ORDER BY mean_exec_time DESC
    LIMIT limit_count;
  ELSE
    -- Return empty result if extension not available
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to analyze query patterns and suggest indexes
CREATE OR REPLACE FUNCTION suggest_indexes(target_table_name TEXT)
RETURNS TABLE (
  suggestion TEXT,
  reason TEXT,
  estimated_improvement TEXT,
  create_statement TEXT
) AS $$
DECLARE
  rec RECORD;
BEGIN
  -- Check for missing foreign key indexes
  FOR rec IN
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = target_table_name
      AND NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = tc.table_name
          AND indexdef LIKE '%' || kcu.column_name || '%'
      )
  LOOP
    RETURN QUERY
    SELECT
      'Missing index on foreign key'::TEXT,
      format('Foreign key %s.%s references %s', rec.table_name, rec.column_name, rec.foreign_table_name)::TEXT,
      '50-80% faster joins'::TEXT,
      format('CREATE INDEX idx_%s_%s ON %s(%s)', rec.table_name, rec.column_name, rec.table_name, rec.column_name)::TEXT;
  END LOOP;
  
  -- Check for columns used in WHERE clauses without indexes
  -- This would require pg_stat_statements data
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing materialized view and index if they exist
DROP MATERIALIZED VIEW IF EXISTS mv_org_dashboard_metrics CASCADE;

-- Create materialized view for organization dashboard metrics
-- Updated to use emissions_data table with building_id instead of facility_id
CREATE MATERIALIZED VIEW mv_org_dashboard_metrics AS
SELECT 
  e.organization_id,
  DATE_TRUNC('month', e.period_start) as month,
  COUNT(DISTINCT e.category) as emission_categories,
  SUM(e.co2e_kg / 1000.0) as total_emissions_tonnes,
  AVG(e.co2e_kg / 1000.0) as avg_emissions_tonnes,
  COUNT(DISTINCT e.building_id) as reporting_buildings,
  SUM(CASE WHEN e.scope = '1' THEN e.co2e_kg / 1000.0 ELSE 0 END) as scope1_emissions,
  SUM(CASE WHEN e.scope = '2' THEN e.co2e_kg / 1000.0 ELSE 0 END) as scope2_emissions,
  SUM(CASE WHEN e.scope = '3' THEN e.co2e_kg / 1000.0 ELSE 0 END) as scope3_emissions,
  COUNT(DISTINCT DATE_TRUNC('day', e.period_start)) as reporting_days
FROM emissions_data e
WHERE e.period_start >= NOW() - INTERVAL '2 years'
GROUP BY e.organization_id, DATE_TRUNC('month', e.period_start);

-- Create index on materialized view
CREATE INDEX idx_mv_org_metrics_org_month ON mv_org_dashboard_metrics(organization_id, month DESC);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_dashboard_metrics()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_org_dashboard_metrics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule periodic refresh (requires pg_cron)
-- SELECT cron.schedule('refresh-dashboard-metrics', '0 * * * *', 'SELECT refresh_dashboard_metrics()');

-- Grant appropriate permissions
GRANT EXECUTE ON FUNCTION analyze_query TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_unused_indexes TO authenticated;
GRANT EXECUTE ON FUNCTION get_index_stats TO authenticated;
GRANT EXECUTE ON FUNCTION execute_sql TO service_role; -- Only service role can create/drop indexes
GRANT EXECUTE ON FUNCTION get_all_tables TO authenticated;
GRANT EXECUTE ON FUNCTION get_slow_queries TO authenticated;
GRANT EXECUTE ON FUNCTION suggest_indexes TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_dashboard_metrics TO service_role;

-- Grant SELECT on materialized view if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_org_dashboard_metrics') THEN
    GRANT SELECT ON mv_org_dashboard_metrics TO authenticated;
  END IF;
END $$;

-- Add comments
COMMENT ON FUNCTION analyze_query IS 'Analyze query execution plan and performance';
COMMENT ON FUNCTION get_table_stats IS 'Get comprehensive table statistics including size and bloat';
COMMENT ON FUNCTION get_unused_indexes IS 'Identify indexes that have not been used recently';
COMMENT ON FUNCTION get_index_stats IS 'Get detailed statistics for indexes';
COMMENT ON FUNCTION execute_sql IS 'Safely execute index-related SQL commands';
COMMENT ON FUNCTION suggest_indexes IS 'Suggest missing indexes based on table structure';

-- Add comment on materialized view if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_org_dashboard_metrics') THEN
    COMMENT ON MATERIALIZED VIEW mv_org_dashboard_metrics IS 'Pre-aggregated metrics for organization dashboards';
  END IF;
END $$;