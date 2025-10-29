-- Semantic Cache & Schema Introspection for AI-Powered Data Exploration
-- This migration adds intelligent caching and schema awareness to our exploratory SQL system

-- ============================================================================
-- 1. QUERY CACHE TABLE (Semantic Similarity with pgvector)
-- ============================================================================

CREATE TABLE IF NOT EXISTS query_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  question_embedding vector(1536), -- OpenAI text-embedding-3-small dimensions
  sql_query text NOT NULL,
  response jsonb NOT NULL,
  hit_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  last_used_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Indexes for performance
CREATE INDEX idx_query_cache_org ON query_cache(organization_id);
CREATE INDEX idx_query_cache_embedding ON query_cache USING ivfflat (question_embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_query_cache_created_at ON query_cache(created_at DESC);

-- Enable Row Level Security
ALTER TABLE query_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access cache entries from their organization
CREATE POLICY "Users can view their organization's query cache"
  ON query_cache
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert cache entries for their organization"
  ON query_cache
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their organization's cache stats"
  ON query_cache
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Comment
COMMENT ON TABLE query_cache IS
'Semantic cache for AI query responses. Stores question embeddings for similarity matching to reduce LLM costs.';

-- ============================================================================
-- 2. SEMANTIC SIMILARITY SEARCH
-- ============================================================================

CREATE OR REPLACE FUNCTION match_similar_questions(
  query_embedding vector(1536),
  org_id uuid,
  similarity_threshold float DEFAULT 0.85,
  match_count int DEFAULT 1
)
RETURNS TABLE (
  id uuid,
  question_text text,
  sql_query text,
  response jsonb,
  similarity float,
  hit_count integer,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    qc.id,
    qc.question_text,
    qc.sql_query,
    qc.response,
    1 - (qc.question_embedding <=> query_embedding) as similarity,
    qc.hit_count,
    qc.created_at
  FROM query_cache qc
  WHERE qc.organization_id = org_id
    AND qc.question_embedding IS NOT NULL
    AND 1 - (qc.question_embedding <=> query_embedding) >= similarity_threshold
  ORDER BY qc.question_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION match_similar_questions(vector, uuid, float, int) TO authenticated;

COMMENT ON FUNCTION match_similar_questions IS
'Finds cached query responses with similar semantic meaning using vector similarity search.';

-- ============================================================================
-- 3. CACHE STATS UPDATE
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_cache_hit(
  cache_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE query_cache
  SET
    hit_count = hit_count + 1,
    last_used_at = now()
  WHERE id = cache_id;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_cache_hit(uuid) TO authenticated;

COMMENT ON FUNCTION increment_cache_hit IS
'Increments the hit count and updates last_used_at for a cached query.';

-- ============================================================================
-- 4. SCHEMA INTROSPECTION FOR AI CONTEXT
-- ============================================================================

CREATE OR REPLACE FUNCTION get_sustainability_schema()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  schema_info jsonb;
BEGIN
  SELECT jsonb_build_object(
    'database', 'blipee_sustainability',
    'description', 'Sustainability and ESG data management platform',
    'tables', jsonb_agg(
      jsonb_build_object(
        'name', table_name,
        'description', table_description,
        'row_count_estimate', pg_class.reltuples::bigint,
        'columns', table_columns
      )
    )
  ) INTO schema_info
  FROM (
    SELECT
      t.table_name,
      CASE t.table_name
        WHEN 'metrics_data' THEN 'Core sustainability measurements: energy usage (kWh, MWh), water consumption (m³, liters), emissions (tCO2e), waste, and fuel consumption. Includes Scope 1, 2, and 3 emissions with emission factors.'
        WHEN 'metrics_catalog' THEN 'Metric definitions with units, categories, emission factors, and GRI standard mappings. Defines how to calculate CO2e emissions from raw measurements.'
        WHEN 'sites' THEN 'Organization facilities and locations: office buildings, manufacturing plants, warehouses. Includes area (sqm), country, city, and operational status.'
        WHEN 'organizations' THEN 'Company-level information: name, industry sector, sustainability targets, and reporting preferences.'
        WHEN 'sustainability_reports' THEN 'Published sustainability reports with CSRD, GRI, and TCFD compliance status.'
        WHEN 'supply_chain_emissions' THEN 'Scope 3 emissions from suppliers, products, and business travel.'
        WHEN 'renewable_energy' THEN 'Renewable energy generation and procurement: solar, wind, RECs (Renewable Energy Certificates).'
        WHEN 'sustainability_targets' THEN 'Carbon reduction goals, net-zero commitments, and renewable energy targets with deadlines.'
        ELSE 'Database table for ' || t.table_name
      END as table_description,
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'name', c.column_name,
            'type', c.data_type,
            'nullable', CASE WHEN c.is_nullable = 'YES' THEN true ELSE false END,
            'description', CASE c.column_name
              -- Common columns
              WHEN 'organization_id' THEN 'Foreign key to organizations table (multi-tenant isolation)'
              WHEN 'site_id' THEN 'Foreign key to sites table (facility/location)'
              WHEN 'created_at' THEN 'Timestamp when record was created'
              WHEN 'updated_at' THEN 'Timestamp when record was last updated'

              -- metrics_data specific
              WHEN 'metric_id' THEN 'Foreign key to metrics_catalog (what is being measured)'
              WHEN 'value' THEN 'Numeric measurement value (e.g., 1500 for 1500 kWh)'
              WHEN 'co2e_emissions' THEN 'Calculated CO2 equivalent emissions in tonnes (tCO2e)'
              WHEN 'period_start' THEN 'Start date of measurement period (e.g., 2024-01-01)'
              WHEN 'period_end' THEN 'End date of measurement period (e.g., 2024-01-31)'
              WHEN 'scope' THEN 'GHG Protocol scope: 1 (direct), 2 (electricity), or 3 (supply chain)'

              -- metrics_catalog specific
              WHEN 'category' THEN 'Metric category: Energy, Water, Waste, Emissions, Fuel, etc.'
              WHEN 'unit' THEN 'Unit of measurement: kWh, MWh, m³, liters, tCO2e, kg, etc.'
              WHEN 'emission_factor' THEN 'CO2e emission factor (kg CO2e per unit)'
              WHEN 'gri_standard' THEN 'GRI disclosure number (e.g., GRI 302-1 for energy consumption)'

              -- sites specific
              WHEN 'name' THEN 'Site name (e.g., "Headquarters - Lisbon" or "Manufacturing Plant 01")'
              WHEN 'address' THEN 'Street address of facility'
              WHEN 'city' THEN 'City where facility is located'
              WHEN 'country' THEN 'ISO country code (e.g., PT for Portugal, US for United States)'
              WHEN 'area_sqm' THEN 'Total floor area in square meters'
              WHEN 'type' THEN 'Site type: office, manufacturing, warehouse, data_center, retail, etc.'

              ELSE NULL
            END
          )
        )
        FROM information_schema.columns c
        WHERE c.table_schema = 'public'
          AND c.table_name = t.table_name
        ORDER BY c.ordinal_position
      ) as table_columns
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
      AND t.table_name IN (
        'metrics_data',
        'metrics_catalog',
        'sites',
        'organizations',
        'sustainability_reports',
        'supply_chain_emissions',
        'renewable_energy',
        'sustainability_targets'
      )
  ) tables_with_cols
  LEFT JOIN pg_class ON pg_class.relname = tables_with_cols.table_name;

  -- Add sustainability domain knowledge
  schema_info := schema_info || jsonb_build_object(
    'domain_knowledge', jsonb_build_object(
      'scopes', jsonb_build_object(
        'scope_1', 'Direct GHG emissions from sources owned/controlled by the organization (combustion, company vehicles, fugitive emissions)',
        'scope_2', 'Indirect emissions from purchased electricity, heating, cooling, and steam',
        'scope_3', 'All other indirect emissions in the value chain (business travel, employee commuting, purchased goods, waste disposal, product use)'
      ),
      'gri_standards', jsonb_build_array(
        'GRI 302: Energy consumption and renewable energy percentage',
        'GRI 303: Water withdrawal and discharge',
        'GRI 305: Direct (Scope 1), indirect (Scope 2), and other indirect (Scope 3) GHG emissions',
        'GRI 306: Waste generation and diversion from disposal'
      ),
      'common_units', jsonb_build_object(
        'energy', jsonb_build_array('kWh (kilowatt-hour)', 'MWh (megawatt-hour)', 'GJ (gigajoule)'),
        'emissions', jsonb_build_array('tCO2e (tonnes CO2 equivalent)', 'kgCO2e (kilograms CO2 equivalent)'),
        'water', jsonb_build_array('m³ (cubic meters)', 'liters', 'gallons'),
        'waste', jsonb_build_array('kg (kilograms)', 'tonnes', 'cubic meters')
      ),
      'key_metrics', jsonb_build_array(
        'Carbon intensity: emissions per unit of revenue or production',
        'Energy intensity: energy consumption per square meter or per employee',
        'Renewable energy percentage: % of total energy from renewable sources',
        'Water intensity: water consumption per unit of production'
      )
    )
  );

  RETURN schema_info;
END;
$$;

GRANT EXECUTE ON FUNCTION get_sustainability_schema() TO authenticated;

COMMENT ON FUNCTION get_sustainability_schema IS
'Returns comprehensive schema information with sustainability domain knowledge for LLM context.';

-- ============================================================================
-- 5. COMMON SQL PATTERNS FOR AI (Helper View)
-- ============================================================================

COMMENT ON TABLE metrics_data IS
'Common queries:
- Emissions by scope: SELECT scope, SUM(co2e_emissions) FROM metrics_data WHERE organization_id = ? GROUP BY scope
- Energy trends: SELECT DATE_TRUNC(''month'', period_start) as month, SUM(value) FROM metrics_data WHERE metric_id IN (SELECT id FROM metrics_catalog WHERE category = ''Energy'') GROUP BY month
- Site comparison: SELECT s.name, SUM(md.co2e_emissions) FROM metrics_data md JOIN sites s ON md.site_id = s.id GROUP BY s.name';

-- ============================================================================
-- 6. CACHE PERFORMANCE MONITORING
-- ============================================================================

CREATE OR REPLACE FUNCTION get_cache_stats(
  org_id uuid,
  days_back integer DEFAULT 30
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stats jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_cached_queries', COUNT(*),
    'total_cache_hits', SUM(hit_count),
    'avg_hits_per_query', AVG(hit_count),
    'cache_hit_rate_estimate', CASE
      WHEN SUM(hit_count) > 0
      THEN ROUND((SUM(hit_count)::numeric / (COUNT(*) + SUM(hit_count))) * 100, 2)
      ELSE 0
    END,
    'most_popular_queries', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'question', question_text,
          'hits', hit_count,
          'last_used', last_used_at
        )
      )
      FROM (
        SELECT question_text, hit_count, last_used_at
        FROM query_cache
        WHERE organization_id = org_id
          AND created_at >= now() - (days_back || ' days')::interval
        ORDER BY hit_count DESC
        LIMIT 10
      ) top_queries
    ),
    'cache_size_mb', ROUND(pg_total_relation_size('query_cache')::numeric / 1024 / 1024, 2),
    'period_days', days_back
  ) INTO stats
  FROM query_cache
  WHERE organization_id = org_id
    AND created_at >= now() - (days_back || ' days')::interval;

  RETURN COALESCE(stats, jsonb_build_object('error', 'No cache data found'));
END;
$$;

GRANT EXECUTE ON FUNCTION get_cache_stats(uuid, integer) TO authenticated;

COMMENT ON FUNCTION get_cache_stats IS
'Returns cache performance statistics for monitoring cost savings and hit rates.';

-- ============================================================================
-- 7. CLEANUP OLD CACHE ENTRIES (Optional maintenance)
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_cache_entries(
  days_to_keep integer DEFAULT 90,
  min_hits integer DEFAULT 0
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM query_cache
  WHERE created_at < now() - (days_to_keep || ' days')::interval
    AND hit_count <= min_hits;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION cleanup_old_cache_entries(integer, integer) TO authenticated;

COMMENT ON FUNCTION cleanup_old_cache_entries IS
'Removes old, rarely-used cache entries to maintain performance. Default: keep entries with 1+ hits for 90 days.';
