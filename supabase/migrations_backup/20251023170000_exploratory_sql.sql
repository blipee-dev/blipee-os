-- Exploratory SQL Function (Read-Only, Secure)
-- This function allows the LLM to explore sustainability data using SQL
-- Security: Only SELECT queries allowed, no data modification

CREATE OR REPLACE FUNCTION explore_sustainability_data(
  query_text text,
  org_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  row_count integer;
BEGIN
  -- Security: Only allow SELECT queries
  IF query_text !~* '^\s*SELECT' THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed for data exploration';
  END IF;

  -- Security: Block dangerous keywords
  IF query_text ~* '(DROP|DELETE|UPDATE|INSERT|ALTER|CREATE|GRANT|REVOKE|TRUNCATE)' THEN
    RAISE EXCEPTION 'Modification keywords are not allowed';
  END IF;

  -- Security: Limit result size to prevent memory issues
  IF query_text !~* 'LIMIT\s+\d+' THEN
    query_text := query_text || ' LIMIT 1000';
  END IF;

  -- Execute the query and convert to JSON
  EXECUTE format('
    SELECT jsonb_agg(row_to_json(t))
    FROM (%s) t
  ', query_text) INTO result;

  -- Return results with metadata
  GET DIAGNOSTICS row_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'data', COALESCE(result, '[]'::jsonb),
    'row_count', row_count,
    'query', query_text,
    'organization_id', org_id,
    'executed_at', now()
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', SQLERRM,
      'query', query_text,
      'executed_at', now()
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION explore_sustainability_data(text, uuid) TO authenticated;

-- Add comment explaining the function
COMMENT ON FUNCTION explore_sustainability_data IS
'Secure read-only SQL execution for AI-powered data exploration. Only SELECT queries allowed.';
