-- Database query monitoring and slow query logging system
-- This migration creates tables and functions for comprehensive query monitoring

-- Create table for storing slow query logs
CREATE TABLE IF NOT EXISTS public.slow_query_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  query_text TEXT NOT NULL,
  execution_time_ms NUMERIC NOT NULL,
  total_calls BIGINT DEFAULT 1,
  mean_time_ms NUMERIC,
  max_time_ms NUMERIC,
  rows_affected BIGINT,
  database_name TEXT,
  user_id UUID,
  query_fingerprint TEXT GENERATED ALWAYS AS (md5(regexp_replace(query_text, '\\s+', ' ', 'g'))) STORED,
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table for query performance metrics
CREATE TABLE IF NOT EXISTS public.query_performance_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('execution_time', 'lock_wait', 'io_time', 'cpu_time')),
  table_name TEXT,
  operation TEXT CHECK (operation IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE', 'OTHER')),
  value NUMERIC NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Create table for database health metrics
CREATE TABLE IF NOT EXISTS public.database_health_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  unit TEXT,
  threshold_warning NUMERIC,
  threshold_critical NUMERIC,
  is_healthy BOOLEAN DEFAULT TRUE,
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_slow_queries_fingerprint ON public.slow_query_logs(query_fingerprint);
CREATE INDEX idx_slow_queries_execution_time ON public.slow_query_logs(execution_time_ms DESC);
CREATE INDEX idx_slow_queries_last_seen ON public.slow_query_logs(last_seen DESC);
CREATE INDEX idx_query_metrics_timestamp ON public.query_performance_metrics(timestamp DESC);
CREATE INDEX idx_health_metrics_checked ON public.database_health_metrics(checked_at DESC);

-- Function to log slow queries
CREATE OR REPLACE FUNCTION log_slow_query(
  p_query_text TEXT,
  p_execution_time_ms NUMERIC,
  p_rows_affected BIGINT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_query_fingerprint TEXT;
  v_existing_id UUID;
  v_log_id UUID;
BEGIN
  -- Generate fingerprint
  v_query_fingerprint := md5(regexp_replace(p_query_text, '\\s+', ' ', 'g'));
  
  -- Check if this query already exists
  SELECT id INTO v_existing_id
  FROM slow_query_logs
  WHERE query_fingerprint = v_query_fingerprint
  LIMIT 1;
  
  IF v_existing_id IS NOT NULL THEN
    -- Update existing record
    UPDATE slow_query_logs
    SET 
      total_calls = total_calls + 1,
      mean_time_ms = ((mean_time_ms * total_calls) + p_execution_time_ms) / (total_calls + 1),
      max_time_ms = GREATEST(max_time_ms, p_execution_time_ms),
      last_seen = NOW()
    WHERE id = v_existing_id
    RETURNING id INTO v_log_id;
  ELSE
    -- Insert new record
    INSERT INTO slow_query_logs (
      query_text, 
      execution_time_ms, 
      mean_time_ms, 
      max_time_ms,
      rows_affected, 
      user_id
    ) VALUES (
      p_query_text, 
      p_execution_time_ms, 
      p_execution_time_ms, 
      p_execution_time_ms,
      p_rows_affected, 
      p_user_id
    )
    RETURNING id INTO v_log_id;
  END IF;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to monitor query performance
CREATE OR REPLACE FUNCTION monitor_query_performance(
  threshold_ms INTEGER DEFAULT 100
)
RETURNS TABLE (
  query_text TEXT,
  calls BIGINT,
  total_time NUMERIC,
  mean_time NUMERIC,
  max_time NUMERIC,
  rows BIGINT,
  query_type TEXT
) AS $$
BEGIN
  -- Check if pg_stat_statements is available
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements') THEN
    RETURN QUERY
    WITH query_stats AS (
      SELECT 
        regexp_replace(query, '[\\n\\r\\s]+', ' ', 'g') as clean_query,
        calls,
        total_exec_time,
        mean_exec_time,
        max_exec_time,
        rows,
        CASE 
          WHEN query ~* '^\\s*SELECT' THEN 'SELECT'
          WHEN query ~* '^\\s*INSERT' THEN 'INSERT'
          WHEN query ~* '^\\s*UPDATE' THEN 'UPDATE'
          WHEN query ~* '^\\s*DELETE' THEN 'DELETE'
          ELSE 'OTHER'
        END as query_operation
      FROM pg_stat_statements
      WHERE mean_exec_time > threshold_ms
        AND query NOT LIKE '%pg_stat_statements%'
        AND query NOT LIKE '%ANALYZE%'
    )
    SELECT 
      clean_query::TEXT,
      calls,
      round(total_exec_time::numeric, 2),
      round(mean_exec_time::numeric, 2),
      round(max_exec_time::numeric, 2),
      rows,
      query_operation::TEXT
    FROM query_stats
    ORDER BY mean_exec_time DESC
    LIMIT 50;
  ELSE
    -- Return empty if extension not available
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check database health
CREATE OR REPLACE FUNCTION check_database_health()
RETURNS VOID AS $$
DECLARE
  v_metric_value NUMERIC;
  v_is_healthy BOOLEAN;
BEGIN
  -- Check connection count
  SELECT count(*) INTO v_metric_value
  FROM pg_stat_activity;
  
  v_is_healthy := v_metric_value < 80; -- Warning at 80 connections
  
  INSERT INTO database_health_metrics (
    metric_name, metric_value, unit, 
    threshold_warning, threshold_critical, is_healthy
  ) VALUES (
    'active_connections', v_metric_value, 'count',
    80, 95, v_is_healthy
  );
  
  -- Check database size
  SELECT pg_database_size(current_database())::numeric / 1024 / 1024 INTO v_metric_value;
  
  INSERT INTO database_health_metrics (
    metric_name, metric_value, unit,
    threshold_warning, threshold_critical, is_healthy
  ) VALUES (
    'database_size', v_metric_value, 'MB',
    8000, 10000, true -- Adjust based on your limits
  );
  
  -- Check cache hit ratio
  SELECT 
    CASE 
      WHEN sum(blks_hit + blks_read) = 0 THEN 0
      ELSE round(100.0 * sum(blks_hit) / sum(blks_hit + blks_read), 2)
    END INTO v_metric_value
  FROM pg_stat_database
  WHERE datname = current_database();
  
  v_is_healthy := v_metric_value > 90; -- Should be above 90%
  
  INSERT INTO database_health_metrics (
    metric_name, metric_value, unit,
    threshold_warning, threshold_critical, is_healthy
  ) VALUES (
    'cache_hit_ratio', v_metric_value, 'percent',
    90, 85, v_is_healthy
  );
  
  -- Check longest running query
  SELECT EXTRACT(EPOCH FROM (now() - query_start))::numeric INTO v_metric_value
  FROM pg_stat_activity
  WHERE state = 'active'
    AND query NOT LIKE '%pg_stat_activity%'
  ORDER BY query_start
  LIMIT 1;
  
  IF v_metric_value IS NOT NULL THEN
    v_is_healthy := v_metric_value < 300; -- Warning at 5 minutes
    
    INSERT INTO database_health_metrics (
      metric_name, metric_value, unit,
      threshold_warning, threshold_critical, is_healthy
    ) VALUES (
      'longest_running_query', v_metric_value, 'seconds',
      300, 600, v_is_healthy
    );
  END IF;
  
  -- Clean up old metrics (keep 7 days)
  DELETE FROM database_health_metrics
  WHERE checked_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get query insights
CREATE OR REPLACE FUNCTION get_query_insights(
  p_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
  insight_type TEXT,
  description TEXT,
  impact TEXT,
  recommendation TEXT,
  query_example TEXT
) AS $$
BEGIN
  -- Queries without indexes
  RETURN QUERY
  SELECT 
    'missing_index'::TEXT,
    'Queries performing sequential scans'::TEXT,
    'High CPU and I/O usage'::TEXT,
    'Consider adding indexes on frequently filtered columns'::TEXT,
    query_text::TEXT
  FROM slow_query_logs
  WHERE query_text LIKE '%Seq Scan%'
    AND last_seen > NOW() - INTERVAL '1 hour' * p_hours
  LIMIT 5;
  
  -- Queries with high execution time variance
  RETURN QUERY
  SELECT 
    'high_variance'::TEXT,
    format('Query with %s%% execution time variance', 
      round(((max_time_ms - mean_time_ms) / mean_time_ms * 100)::numeric, 0))::TEXT,
    'Unpredictable performance'::TEXT,
    'Investigate data distribution and query plan stability'::TEXT,
    query_text::TEXT
  FROM slow_query_logs
  WHERE max_time_ms > mean_time_ms * 2
    AND total_calls > 10
    AND last_seen > NOW() - INTERVAL '1 hour' * p_hours
  ORDER BY (max_time_ms - mean_time_ms) DESC
  LIMIT 5;
  
  -- Frequently executed slow queries
  RETURN QUERY
  SELECT 
    'frequent_slow'::TEXT,
    format('Executed %s times with avg %sms', total_calls, round(mean_time_ms::numeric, 0))::TEXT,
    'High cumulative impact'::TEXT,
    'Priority optimization candidate'::TEXT,
    query_text::TEXT
  FROM slow_query_logs
  WHERE total_calls > 100
    AND mean_time_ms > 50
    AND last_seen > NOW() - INTERVAL '1 hour' * p_hours
  ORDER BY total_calls * mean_time_ms DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to analyze query patterns
CREATE OR REPLACE FUNCTION analyze_query_patterns(
  p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
  pattern_name TEXT,
  occurrence_count BIGINT,
  avg_execution_time NUMERIC,
  total_time NUMERIC,
  example_query TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH query_patterns AS (
    SELECT 
      CASE 
        WHEN query_text ~* 'JOIN.*JOIN.*JOIN' THEN 'Multiple Joins'
        WHEN query_text ~* 'SELECT.*FROM.*SELECT' THEN 'Nested Subqueries'
        WHEN query_text ~* 'DISTINCT' THEN 'Distinct Operations'
        WHEN query_text ~* 'GROUP BY' THEN 'Aggregations'
        WHEN query_text ~* 'ORDER BY.*LIMIT' THEN 'Sorted Pagination'
        WHEN query_text ~* 'LIKE.*%' THEN 'Pattern Matching'
        ELSE 'Other'
      END as pattern,
      query_text,
      total_calls,
      mean_time_ms,
      total_calls * mean_time_ms as cumulative_time
    FROM slow_query_logs
    WHERE last_seen > NOW() - INTERVAL '1 day' * p_days
  )
  SELECT 
    pattern::TEXT,
    SUM(total_calls)::BIGINT,
    round(AVG(mean_time_ms)::numeric, 2),
    round(SUM(cumulative_time)::numeric, 2),
    (SELECT query_text FROM query_patterns qp2 
     WHERE qp2.pattern = qp.pattern 
     ORDER BY mean_time_ms DESC LIMIT 1)::TEXT
  FROM query_patterns qp
  GROUP BY pattern
  ORDER BY SUM(cumulative_time) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create scheduled job to monitor queries (requires pg_cron)
-- SELECT cron.schedule('monitor-slow-queries', '*/5 * * * *', $$
--   INSERT INTO query_performance_metrics (metric_type, table_name, operation, value)
--   SELECT 
--     'execution_time',
--     split_part(query, ' FROM ', 2),
--     CASE 
--       WHEN query ~* '^SELECT' THEN 'SELECT'
--       WHEN query ~* '^INSERT' THEN 'INSERT'
--       WHEN query ~* '^UPDATE' THEN 'UPDATE'
--       WHEN query ~* '^DELETE' THEN 'DELETE'
--       ELSE 'OTHER'
--     END,
--     mean_exec_time
--   FROM monitor_query_performance(50);
-- $$);

-- Grant permissions
GRANT SELECT ON public.slow_query_logs TO authenticated;
GRANT SELECT ON public.query_performance_metrics TO authenticated;
GRANT SELECT ON public.database_health_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION log_slow_query TO service_role;
GRANT EXECUTE ON FUNCTION monitor_query_performance TO authenticated;
GRANT EXECUTE ON FUNCTION check_database_health TO authenticated;
GRANT EXECUTE ON FUNCTION get_query_insights TO authenticated;
GRANT EXECUTE ON FUNCTION analyze_query_patterns TO authenticated;

-- Add RLS policies
ALTER TABLE public.slow_query_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.query_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.database_health_metrics ENABLE ROW LEVEL SECURITY;

-- Only admins can view query logs
CREATE POLICY "Admins can view slow query logs" ON public.slow_query_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE user_id = auth.uid() 
      AND role = 'account_owner'
    )
  );

CREATE POLICY "Admins can view query metrics" ON public.query_performance_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE user_id = auth.uid() 
      AND role = 'account_owner'
    )
  );

CREATE POLICY "Admins can view health metrics" ON public.database_health_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE user_id = auth.uid() 
      AND role = 'account_owner'
    )
  );

-- Add comments
COMMENT ON TABLE public.slow_query_logs IS 'Stores slow query execution history for performance analysis';
COMMENT ON TABLE public.query_performance_metrics IS 'Stores query performance metrics over time';
COMMENT ON TABLE public.database_health_metrics IS 'Stores database health check results';
COMMENT ON FUNCTION log_slow_query IS 'Log a slow query execution for analysis';
COMMENT ON FUNCTION monitor_query_performance IS 'Monitor current query performance using pg_stat_statements';
COMMENT ON FUNCTION check_database_health IS 'Perform database health checks and store results';
COMMENT ON FUNCTION get_query_insights IS 'Get actionable insights from query performance data';
COMMENT ON FUNCTION analyze_query_patterns IS 'Analyze common query patterns and their performance impact';