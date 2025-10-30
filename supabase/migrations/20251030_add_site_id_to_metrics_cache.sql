-- Add site_id support to metrics_cache for site-level forecasting
-- This enables storing and retrieving forecasts per site, with organization totals as aggregates

-- Add site_id column (nullable to support both site-level and org-level caches)
ALTER TABLE public.metrics_cache
ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE;

-- Create index for site-level queries
CREATE INDEX IF NOT EXISTS idx_metrics_cache_site_id
ON public.metrics_cache(site_id)
WHERE site_id IS NOT NULL;

-- Drop existing unique constraints
ALTER TABLE public.metrics_cache
DROP CONSTRAINT IF EXISTS unique_baseline_cache;

ALTER TABLE public.metrics_cache
DROP CONSTRAINT IF EXISTS unique_forecast_cache;

-- Recreate unique constraints with site_id support
-- For baselines: unique per (org, site, cache_type, domain, period_year)
-- NULL site_id means organization-level aggregate
CREATE UNIQUE INDEX unique_baseline_cache
ON public.metrics_cache(organization_id, COALESCE(site_id::text, 'org'), cache_type, domain, period_year)
WHERE cache_type = 'baseline';

-- For forecasts: unique per (org, site, cache_type, domain, period_start)
-- NULL site_id means organization-level aggregate
CREATE UNIQUE INDEX unique_forecast_cache
ON public.metrics_cache(organization_id, COALESCE(site_id::text, 'org'), cache_type, domain, period_start)
WHERE cache_type = 'forecast';

-- Add comment
COMMENT ON COLUMN public.metrics_cache.site_id IS 'Site ID for site-level caches. NULL indicates organization-level aggregate cache.';

-- Update data_version for tracking schema changes
UPDATE public.metrics_cache SET data_version = 2 WHERE data_version = 1;
