-- Fix waste data: Convert tonnes to kg by multiplying by 1000
-- This affects all waste-related metrics in metrics_data table

UPDATE metrics_data
SET value = value * 1000
WHERE metric_id IN (
  SELECT id
  FROM metrics_catalog
  WHERE code LIKE '%waste%'
    OR code LIKE 'gri_306%'
)
AND value IS NOT NULL;

-- Add a comment to track this fix
COMMENT ON COLUMN metrics_data.value IS 'Metric value in the unit specified in the metrics_catalog. Waste metrics are stored in kg.';
