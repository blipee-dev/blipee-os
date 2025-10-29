-- Create metrics_cache table for pre-computed sustainability metrics
-- This table stores daily pre-computed baselines and forecasts to achieve 80% faster dashboard loads

CREATE TABLE IF NOT EXISTS public.metrics_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Cache type and domain
  cache_type TEXT NOT NULL CHECK (cache_type IN ('baseline', 'forecast', 'aggregation', 'trend')),
  domain TEXT NOT NULL CHECK (domain IN ('emissions', 'energy', 'water', 'waste', 'all')),

  -- Time period for the cached data
  period_year INTEGER,
  period_start DATE,
  period_end DATE,

  -- Cached data (JSONB for flexibility)
  data JSONB NOT NULL,

  -- Metadata
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- NULL = never expires, otherwise auto-cleanup
  data_version INTEGER DEFAULT 1, -- Increment when underlying data changes
  computation_time_ms INTEGER, -- How long it took to compute

  -- Indexes for fast lookup
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraints for upsert operations
  CONSTRAINT unique_baseline_cache UNIQUE (organization_id, cache_type, domain, period_year),
  CONSTRAINT unique_forecast_cache UNIQUE (organization_id, cache_type, domain, period_start)
);

-- Indexes for fast cache retrieval
CREATE INDEX IF NOT EXISTS idx_metrics_cache_lookup
  ON public.metrics_cache(organization_id, cache_type, domain);

CREATE INDEX IF NOT EXISTS idx_metrics_cache_period
  ON public.metrics_cache(organization_id, domain, period_year);

CREATE INDEX IF NOT EXISTS idx_metrics_cache_expires
  ON public.metrics_cache(expires_at)
  WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_metrics_cache_computed
  ON public.metrics_cache(computed_at DESC);

-- Add missing critical indexes on metrics_data table
CREATE INDEX IF NOT EXISTS idx_metrics_data_org_period
  ON public.metrics_data(organization_id, period_start DESC);

CREATE INDEX IF NOT EXISTS idx_metrics_data_org_metric
  ON public.metrics_data(organization_id, metric_id);

CREATE INDEX IF NOT EXISTS idx_metrics_data_composite
  ON public.metrics_data(organization_id, metric_id, period_start DESC);

-- RLS policies for metrics_cache
ALTER TABLE public.metrics_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's cached metrics"
  ON public.metrics_cache
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage all cached metrics"
  ON public.metrics_cache
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION public.cleanup_expired_metrics_cache()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.metrics_cache
  WHERE expires_at IS NOT NULL
    AND expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Grant permissions
GRANT SELECT ON public.metrics_cache TO authenticated;
GRANT ALL ON public.metrics_cache TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_metrics_cache() TO service_role;

-- Add comments
COMMENT ON TABLE public.metrics_cache IS 'Pre-computed sustainability metrics for fast dashboard loads (target: 80% faster)';
COMMENT ON COLUMN public.metrics_cache.cache_type IS 'Type of cached computation: baseline, forecast, aggregation, or trend';
COMMENT ON COLUMN public.metrics_cache.domain IS 'Sustainability domain: emissions, energy, water, waste, or all';
COMMENT ON COLUMN public.metrics_cache.data IS 'JSONB containing the pre-computed metric data';
COMMENT ON COLUMN public.metrics_cache.expires_at IS 'When this cache entry should be invalidated (NULL = never)';
COMMENT ON FUNCTION public.cleanup_expired_metrics_cache() IS 'Removes expired cache entries. Run daily via data cleanup service.';
