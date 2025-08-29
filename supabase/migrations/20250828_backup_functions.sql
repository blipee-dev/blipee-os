-- Database backup helper functions
-- These functions support the backup and restore functionality

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
  WHERE schemaname = 'public'
    AND tablename NOT LIKE 'pg_%'
    AND tablename NOT LIKE 'sql_%'
  ORDER BY tablename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get table columns with details
CREATE OR REPLACE FUNCTION get_table_columns(table_name TEXT)
RETURNS TABLE (
  column_name TEXT,
  data_type TEXT,
  is_nullable TEXT,
  column_default TEXT,
  character_maximum_length INTEGER,
  numeric_precision INTEGER,
  numeric_scale INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.column_name::TEXT,
    CASE 
      WHEN c.data_type = 'USER-DEFINED' THEN c.udt_name::TEXT
      ELSE c.data_type::TEXT
    END,
    c.is_nullable::TEXT,
    c.column_default::TEXT,
    c.character_maximum_length::INTEGER,
    c.numeric_precision::INTEGER,
    c.numeric_scale::INTEGER
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = $1
  ORDER BY c.ordinal_position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to safely execute SQL (restricted for security)
CREATE OR REPLACE FUNCTION execute_backup_sql(sql_query TEXT)
RETURNS VOID AS $$
BEGIN
  -- Security checks
  IF sql_query ~* '(DROP\s+DATABASE|CREATE\s+DATABASE|ALTER\s+SYSTEM)' THEN
    RAISE EXCEPTION 'Database-level operations are not allowed';
  END IF;
  
  IF sql_query !~* '^(CREATE|DROP|TRUNCATE|INSERT|UPDATE|DELETE|ALTER)\s+(TABLE|INDEX|VIEW)' THEN
    RAISE EXCEPTION 'Only table operations are allowed for backup/restore';
  END IF;
  
  -- Additional safety check for data modification
  IF sql_query ~* '(UPDATE|DELETE)\s+.*\s+WHERE' = FALSE AND 
     sql_query ~* '^(UPDATE|DELETE)' THEN
    RAISE EXCEPTION 'UPDATE and DELETE must include WHERE clause for safety';
  END IF;
  
  EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get foreign key constraints
CREATE OR REPLACE FUNCTION get_table_constraints(table_name TEXT)
RETURNS TABLE (
  constraint_name TEXT,
  constraint_type TEXT,
  constraint_definition TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    con.conname::TEXT,
    CASE con.contype
      WHEN 'p' THEN 'PRIMARY KEY'
      WHEN 'f' THEN 'FOREIGN KEY'
      WHEN 'u' THEN 'UNIQUE'
      WHEN 'c' THEN 'CHECK'
      ELSE 'OTHER'
    END::TEXT,
    pg_get_constraintdef(con.oid)::TEXT
  FROM pg_constraint con
  JOIN pg_class c ON c.oid = con.conrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = $1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get table indexes
CREATE OR REPLACE FUNCTION get_table_indexes(table_name TEXT)
RETURNS TABLE (
  index_name TEXT,
  index_definition TEXT,
  is_unique BOOLEAN,
  is_primary BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.relname::TEXT,
    pg_get_indexdef(i.oid)::TEXT,
    idx.indisunique,
    idx.indisprimary
  FROM pg_index idx
  JOIN pg_class c ON c.oid = idx.indrelid
  JOIN pg_class i ON i.oid = idx.indexrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = $1
    AND NOT idx.indisprimary; -- Exclude primary key indexes as they're handled with constraints
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to estimate backup size
CREATE OR REPLACE FUNCTION estimate_backup_size(tables TEXT[] DEFAULT NULL)
RETURNS TABLE (
  total_size_bytes BIGINT,
  total_size_pretty TEXT,
  table_count INTEGER,
  row_count BIGINT
) AS $$
DECLARE
  v_total_size BIGINT := 0;
  v_total_rows BIGINT := 0;
  v_table_count INTEGER := 0;
  v_tables TEXT[];
BEGIN
  -- Get tables to estimate
  IF tables IS NULL OR array_length(tables, 1) IS NULL THEN
    SELECT array_agg(tablename) INTO v_tables
    FROM pg_tables
    WHERE schemaname = 'public';
  ELSE
    v_tables := tables;
  END IF;
  
  -- Calculate sizes
  FOR i IN 1..array_length(v_tables, 1) LOOP
    v_total_size := v_total_size + pg_relation_size(('public.' || v_tables[i])::regclass);
    
    EXECUTE format('SELECT COUNT(*) FROM public.%I', v_tables[i]) INTO v_total_rows;
    v_table_count := v_table_count + 1;
  END LOOP;
  
  RETURN QUERY
  SELECT 
    v_total_size,
    pg_size_pretty(v_total_size),
    v_table_count,
    v_total_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Table to store backup history (optional)
CREATE TABLE IF NOT EXISTS public.backup_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  backup_id TEXT NOT NULL UNIQUE,
  backup_type TEXT NOT NULL CHECK (backup_type IN ('full', 'partial', 'schema_only')),
  format TEXT NOT NULL CHECK (format IN ('sql', 'json', 'csv')),
  tables TEXT[],
  size_bytes BIGINT,
  compressed BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'completed' CHECK (status IN ('in_progress', 'completed', 'failed')),
  error_message TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Create index for backup history
CREATE INDEX idx_backup_history_created ON public.backup_history(created_at DESC);
CREATE INDEX idx_backup_history_status ON public.backup_history(status);

-- Enable RLS on backup history
ALTER TABLE public.backup_history ENABLE ROW LEVEL SECURITY;

-- Only admins can view/manage backups
CREATE POLICY "Admins can manage backups" ON public.backup_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE user_id = auth.uid() 
      AND role = 'account_owner'
    )
  );

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_all_tables TO service_role;
GRANT EXECUTE ON FUNCTION get_table_columns TO service_role;
GRANT EXECUTE ON FUNCTION execute_backup_sql TO service_role;
GRANT EXECUTE ON FUNCTION get_table_constraints TO service_role;
GRANT EXECUTE ON FUNCTION get_table_indexes TO service_role;
GRANT EXECUTE ON FUNCTION estimate_backup_size TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.backup_history TO authenticated;

-- Comments
COMMENT ON FUNCTION get_all_tables IS 'Get list of all user tables in the public schema';
COMMENT ON FUNCTION get_table_columns IS 'Get detailed column information for a specific table';
COMMENT ON FUNCTION execute_backup_sql IS 'Safely execute SQL statements for backup/restore operations';
COMMENT ON FUNCTION get_table_constraints IS 'Get all constraints for a specific table';
COMMENT ON FUNCTION get_table_indexes IS 'Get all indexes for a specific table';
COMMENT ON FUNCTION estimate_backup_size IS 'Estimate the size of a backup for specified tables';
COMMENT ON TABLE public.backup_history IS 'Track database backup history and metadata';