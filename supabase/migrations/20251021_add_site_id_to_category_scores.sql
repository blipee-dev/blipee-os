-- ============================================================================
-- Add site_id to category_scores for historical trend calculations
-- ============================================================================
--
-- This migration:
-- 1. Adds site_id column to category_scores table
-- 2. Backfills site_id for existing records
-- 3. Adds index for trend query performance
--
-- Created: 2025-10-21
-- ============================================================================

-- Add site_id column to category_scores
ALTER TABLE category_scores
ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES sites(id) ON DELETE CASCADE;

-- Backfill site_id for existing records by joining through performance_scores
UPDATE category_scores
SET site_id = ps.site_id
FROM performance_scores ps
WHERE category_scores.performance_score_id = ps.id
  AND category_scores.site_id IS NULL
  AND ps.site_id IS NOT NULL;

-- Create index for efficient trend queries (filtering by site_id and category)
CREATE INDEX IF NOT EXISTS idx_category_scores_site_category_created
ON category_scores(site_id, category, created_at DESC);

-- Add comment explaining the column
COMMENT ON COLUMN category_scores.site_id IS 'Direct reference to site for efficient trend calculations over historical data';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
