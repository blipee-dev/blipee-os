-- Add site_id support to ML tables for site-level model training and predictions
-- This enables separate models per site with organization-level aggregation

-- 1. Add site_id to ml_models
ALTER TABLE public.ml_models
ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE;

-- Create index for site-level queries
CREATE INDEX IF NOT EXISTS idx_ml_models_site_id
ON public.ml_models(site_id)
WHERE site_id IS NOT NULL;

-- 2. Add site_id to ml_model_storage
ALTER TABLE public.ml_model_storage
ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE;

-- Create index for site-level storage queries
CREATE INDEX IF NOT EXISTS idx_ml_model_storage_site_id
ON public.ml_model_storage(site_id)
WHERE site_id IS NOT NULL;

-- Update unique constraint for ml_model_storage to include site_id
-- Drop existing constraint
ALTER TABLE public.ml_model_storage
DROP CONSTRAINT IF EXISTS ml_model_storage_organization_id_model_type_metric_id_key;

-- Create new unique constraint with site_id support
-- NULL site_id means organization-level model
CREATE UNIQUE INDEX unique_ml_model_storage_per_site
ON public.ml_model_storage(organization_id, COALESCE(site_id::text, 'org'), model_type, metric_id);

-- 3. Add site_id and metadata to ml_predictions
ALTER TABLE public.ml_predictions
ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE;

ALTER TABLE public.ml_predictions
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create index for site-level prediction queries
CREATE INDEX IF NOT EXISTS idx_ml_predictions_site_id
ON public.ml_predictions(site_id)
WHERE site_id IS NOT NULL;

-- Create index for metadata queries (used for metric_id lookups)
CREATE INDEX IF NOT EXISTS idx_ml_predictions_metadata
ON public.ml_predictions USING gin(metadata);

-- Add comments
COMMENT ON COLUMN public.ml_models.site_id IS 'Site ID for site-level models. NULL indicates organization-level aggregate model.';
COMMENT ON COLUMN public.ml_model_storage.site_id IS 'Site ID for site-level model storage. NULL indicates organization-level aggregate model.';
COMMENT ON COLUMN public.ml_predictions.site_id IS 'Site ID for site-level predictions. NULL indicates organization-level aggregate prediction.';
COMMENT ON COLUMN public.ml_predictions.metadata IS 'Additional metadata like metric_id, site_name, forecast_period, etc.';
