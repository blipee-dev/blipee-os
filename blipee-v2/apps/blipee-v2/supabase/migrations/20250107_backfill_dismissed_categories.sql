-- Backfill existing dismissed metrics with categorization
-- This migration updates existing data to work with the new categorized dismissal system

-- Step 1: Update existing dismissed metrics with default category
-- For now, we'll mark them as 'other' since we don't have the original reason
UPDATE metric_recommendations
SET
  dismissed_category = 'other',
  dismissed_notes = 'Migrated from legacy dismissal (reason not recorded)',
  is_reactivatable = true,
  affects_materiality = false
WHERE status = 'dismissed'
  AND dismissed_category IS NULL;

-- Step 2: Update accepted/tracking metrics
-- These are metrics that users are already tracking
-- Mark them differently so they don't appear in materiality assessment as "not tracked"
UPDATE metric_recommendations
SET
  dismissed_category = NULL,  -- Not dismissed
  is_reactivatable = false,
  affects_materiality = false
WHERE status IN ('accepted', 'tracking')
  AND dismissed_category IS NULL;

-- Step 3: Update pending metrics
-- These are still under consideration
UPDATE metric_recommendations
SET
  dismissed_category = NULL,
  is_reactivatable = true,
  affects_materiality = false
WHERE status = 'pending'
  AND dismissed_category IS NULL;

-- Create a summary view for migration verification
CREATE OR REPLACE VIEW migration_summary AS
SELECT
  organization_id,
  status,
  dismissed_category,
  COUNT(*) as count,
  ARRAY_AGG(DISTINCT mc.name) FILTER (WHERE mc.name IS NOT NULL) as sample_metrics
FROM metric_recommendations mr
LEFT JOIN metrics_catalog mc ON mr.metric_catalog_id = mc.id
GROUP BY organization_id, status, dismissed_category
ORDER BY organization_id, status, dismissed_category;

COMMENT ON VIEW migration_summary IS 'Summary view to verify categorized dismissal migration';

-- Output migration summary
DO $$
DECLARE
  total_dismissed INT;
  total_accepted INT;
  total_pending INT;
  total_backfilled INT;
BEGIN
  SELECT COUNT(*) INTO total_dismissed FROM metric_recommendations WHERE status = 'dismissed';
  SELECT COUNT(*) INTO total_accepted FROM metric_recommendations WHERE status IN ('accepted', 'tracking');
  SELECT COUNT(*) INTO total_pending FROM metric_recommendations WHERE status = 'pending';
  SELECT COUNT(*) INTO total_backfilled FROM metric_recommendations WHERE dismissed_category = 'other' AND dismissed_notes LIKE 'Migrated%';

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Categorized Dismissals Migration Summary';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total dismissed metrics: %', total_dismissed;
  RAISE NOTICE 'Total accepted/tracking metrics: %', total_accepted;
  RAISE NOTICE 'Total pending metrics: %', total_pending;
  RAISE NOTICE 'Backfilled with "other" category: %', total_backfilled;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Review migration_summary view';
  RAISE NOTICE '2. Users can now recategorize migrated dismissals';
  RAISE NOTICE '3. New dismissals will use the categorized modal';
  RAISE NOTICE '========================================';
END $$;
