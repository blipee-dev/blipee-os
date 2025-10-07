-- Fix all incorrect unit values in metrics_data table and add enforcement
-- Issue: 35% of records had unit field not matching metrics_catalog.unit
-- Root cause: Data import scripts not copying unit from catalog

-- Step 1: Fix all existing records
UPDATE metrics_data
SET unit = metrics_catalog.unit
FROM metrics_catalog
WHERE metrics_data.metric_id = metrics_catalog.id
  AND metrics_data.unit != metrics_catalog.unit;

-- Step 2: Create a function to ensure unit matches catalog
CREATE OR REPLACE FUNCTION ensure_metrics_data_unit()
RETURNS TRIGGER AS $$
BEGIN
  -- Always set unit from metrics_catalog
  SELECT unit INTO NEW.unit
  FROM metrics_catalog
  WHERE id = NEW.metric_id;

  -- If metric not found, keep the provided unit (shouldn't happen with FK constraint)
  IF NEW.unit IS NULL THEN
    RAISE WARNING 'Metric ID % not found in catalog, keeping provided unit: %', NEW.metric_id, NEW.unit;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create trigger to enforce unit consistency on INSERT and UPDATE
DROP TRIGGER IF EXISTS ensure_metrics_data_unit_trigger ON metrics_data;
CREATE TRIGGER ensure_metrics_data_unit_trigger
  BEFORE INSERT OR UPDATE OF metric_id ON metrics_data
  FOR EACH ROW
  EXECUTE FUNCTION ensure_metrics_data_unit();

-- Step 4: Add comment explaining the enforcement
COMMENT ON COLUMN metrics_data.unit IS 'Unit of measurement - automatically set from metrics_catalog.unit via trigger';
COMMENT ON FUNCTION ensure_metrics_data_unit() IS 'Ensures metrics_data.unit always matches metrics_catalog.unit';

-- Log the results
DO $$
DECLARE
  fixed_count INTEGER;
  total_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM metrics_data;
  SELECT COUNT(*) INTO fixed_count
  FROM metrics_data md
  JOIN metrics_catalog mc ON md.metric_id = mc.id
  WHERE md.unit = mc.unit;

  RAISE NOTICE 'Migration complete: % of % records have correct units', fixed_count, total_count;
END $$;
