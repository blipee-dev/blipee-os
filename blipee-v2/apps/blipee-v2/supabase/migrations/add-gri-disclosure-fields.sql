-- Migration: Add GRI disclosure grouping fields
-- This allows us to group multiple metrics under a single GRI disclosure
-- Example: GRI 302-1 "Energy consumption" groups 7+ specific energy metrics

ALTER TABLE metrics_catalog
ADD COLUMN IF NOT EXISTS gri_disclosure TEXT,
ADD COLUMN IF NOT EXISTS gri_disclosure_title TEXT,
ADD COLUMN IF NOT EXISTS gri_disclosure_description TEXT;

-- Create index for faster grouping queries
CREATE INDEX IF NOT EXISTS idx_metrics_catalog_gri_disclosure
ON metrics_catalog(gri_disclosure)
WHERE gri_disclosure IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN metrics_catalog.gri_disclosure IS 'GRI disclosure code (e.g., "302-1", "305-2") - groups multiple related metrics';
COMMENT ON COLUMN metrics_catalog.gri_disclosure_title IS 'Official GRI disclosure title (e.g., "Energy consumption within the organization")';
COMMENT ON COLUMN metrics_catalog.gri_disclosure_description IS 'Detailed description of what this disclosure requires';
