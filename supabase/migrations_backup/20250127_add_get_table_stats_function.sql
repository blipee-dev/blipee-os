-- Add get_table_stats function for database optimization service
-- This function returns table size statistics for monitoring and optimization

CREATE OR REPLACE FUNCTION public.get_table_stats()
RETURNS TABLE (
  table_name text,
  row_count bigint,
  total_bytes bigint,
  table_bytes bigint,
  index_bytes bigint,
  toast_bytes bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    schemaname || '.' || relname AS table_name,
    n_live_tup AS row_count,
    pg_total_relation_size(schemaname || '.' || relname)::bigint AS total_bytes,
    pg_relation_size(schemaname || '.' || relname)::bigint AS table_bytes,
    pg_indexes_size(schemaname || '.' || relname)::bigint AS index_bytes,
    pg_total_relation_size(schemaname || '.' || relname)::bigint -
      pg_relation_size(schemaname || '.' || relname)::bigint -
      pg_indexes_size(schemaname || '.' || relname)::bigint AS toast_bytes
  FROM pg_stat_user_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname || '.' || relname) DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_table_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_table_stats() TO service_role;

-- Add comment
COMMENT ON FUNCTION public.get_table_stats() IS 'Returns table size statistics for all public schema tables';
