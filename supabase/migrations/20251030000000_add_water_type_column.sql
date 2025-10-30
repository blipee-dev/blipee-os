-- Migration: Add water_type column to metrics_catalog
-- Purpose: Replace hardcoded string matching with database-driven classification
-- Date: 2025-10-30

-- Add water_type column
ALTER TABLE metrics_catalog
ADD COLUMN IF NOT EXISTS water_type TEXT
CHECK (water_type IN ('withdrawal', 'discharge', 'recycled', NULL));

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_metrics_catalog_water_type ON metrics_catalog(water_type)
WHERE water_type IS NOT NULL;

-- Populate water_type based on existing metric names
-- This eliminates hardcoded string matching in the code
UPDATE metrics_catalog
SET water_type =
  CASE
    -- Discharge/Wastewater
    WHEN name ILIKE '%wastewater%' OR name ILIKE '%discharge%' THEN 'discharge'

    -- Recycled water
    WHEN name ILIKE '%recycled%' OR name ILIKE '%reuse%' THEN 'recycled'

    -- Regular water (withdrawal/consumption)
    WHEN subcategory = 'Water' AND water_type IS NULL THEN 'withdrawal'

    ELSE NULL
  END
WHERE subcategory = 'Water' AND water_type IS NULL;

-- Add comment
COMMENT ON COLUMN metrics_catalog.water_type IS
'Type of water metric: withdrawal (regular water use), discharge (wastewater), or recycled (reused water). Replaces hardcoded string matching.';
