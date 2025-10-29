-- Fix incorrect unit values in metrics_data table
-- Issue: Some records have unit='unit' instead of the correct unit from metrics_catalog
-- This migration syncs the unit field from metrics_catalog to metrics_data

-- Update all records where unit doesn't match the catalog
UPDATE metrics_data
SET unit = metrics_catalog.unit
FROM metrics_catalog
WHERE metrics_data.metric_id = metrics_catalog.id
  AND metrics_data.unit != metrics_catalog.unit;

-- Log the fix
DO $$
DECLARE
  fixed_count INTEGER;
BEGIN
  GET DIAGNOSTICS fixed_count = ROW_COUNT;
  RAISE NOTICE 'Fixed % records with incorrect unit values', fixed_count;
END $$;

-- Add a comment explaining the fix
COMMENT ON COLUMN metrics_data.unit IS 'Unit of measurement - should always match metrics_catalog.unit. Updated by migration 20251005000000_fix_metrics_data_units.sql';
