-- Add support for derived/calculated metrics in the catalog
-- This allows us to mark metrics that are automatically calculated from other metrics
-- For example: GRI 305-2 emissions are calculated from electricity consumption

-- Add new columns to metrics_catalog
ALTER TABLE metrics_catalog
ADD COLUMN IF NOT EXISTS parent_metric_id UUID REFERENCES metrics_catalog(id),
ADD COLUMN IF NOT EXISTS is_calculated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS calculation_type TEXT;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_metrics_catalog_parent_metric_id
ON metrics_catalog(parent_metric_id)
WHERE parent_metric_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN metrics_catalog.parent_metric_id IS 'Reference to the parent metric if this metric is calculated/derived from another metric';
COMMENT ON COLUMN metrics_catalog.is_calculated IS 'True if this metric is automatically calculated from other metrics (e.g., emissions from consumption)';
COMMENT ON COLUMN metrics_catalog.calculation_type IS 'Type of calculation: emission_factor, aggregation, formula, etc.';

-- Update GRI emissions metrics to be marked as calculated from their consumption metrics
-- We'll do this in a separate data migration script to keep schema and data separate
