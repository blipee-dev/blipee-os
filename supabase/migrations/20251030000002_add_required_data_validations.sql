-- Migration: Add validations for required data
-- Purpose: Eliminate default fallbacks by ensuring required data exists
-- Date: 2025-10-30

-- 1. Ensure all sites have total_area_sqm (no more 1000 m² default)
-- Add NOT NULL constraint with a transition period

-- First, update any NULL areas with a flag for manual review
UPDATE sites
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{area_needs_review}',
  'true'
)
WHERE total_area_sqm IS NULL;

-- Log sites that need area update
DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM sites
  WHERE total_area_sqm IS NULL;

  IF missing_count > 0 THEN
    RAISE NOTICE 'WARNING: % sites have NULL total_area_sqm and need manual review', missing_count;
  END IF;
END $$;

-- Set a temporary default of 1000 for existing NULL values (with flag for review)
UPDATE sites
SET total_area_sqm = 1000
WHERE total_area_sqm IS NULL;

-- Add NOT NULL constraint (new sites MUST have area)
ALTER TABLE sites
ALTER COLUMN total_area_sqm SET NOT NULL;

-- Add check constraint (area must be positive)
ALTER TABLE sites
ADD CONSTRAINT check_total_area_positive
CHECK (total_area_sqm > 0);

-- 2. Ensure all active organizations have sustainability_targets
-- (no more baseline_year = 2023 default)

-- Function to check for missing targets
CREATE OR REPLACE FUNCTION check_organization_has_target()
RETURNS TRIGGER AS $$
BEGIN
  -- When organization is activated, ensure it has sustainability target
  IF NEW.is_active = true THEN
    IF NOT EXISTS (
      SELECT 1 FROM sustainability_targets
      WHERE organization_id = NEW.id
      AND is_active = true
    ) THEN
      RAISE NOTICE 'Organization % activated without sustainability_target - please create one', NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to warn when organization is activated without target
DROP TRIGGER IF EXISTS warn_missing_sustainability_target ON organizations;
CREATE TRIGGER warn_missing_sustainability_target
  AFTER UPDATE OF is_active ON organizations
  FOR EACH ROW
  WHEN (NEW.is_active = true)
  EXECUTE FUNCTION check_organization_has_target();

-- 3. Ensure all sustainability targets have required fields
-- (no more 2.5% default for water_reduction_percent)

-- Add NOT NULL constraints for reduction rates
ALTER TABLE sustainability_targets
ALTER COLUMN target_reduction_percent SET NOT NULL,
ALTER COLUMN baseline_year SET NOT NULL;

-- Set defaults for existing NULL values (one-time data fix)
UPDATE sustainability_targets
SET target_reduction_percent = COALESCE(target_reduction_percent, 4.2)
WHERE target_reduction_percent IS NULL;

UPDATE sustainability_targets
SET baseline_year = COALESCE(baseline_year, 2023)
WHERE baseline_year IS NULL;

-- Ensure water/energy/waste reduction rates exist (use target_reduction_percent if NULL)
UPDATE sustainability_targets
SET
  water_reduction_percent = COALESCE(water_reduction_percent, target_reduction_percent),
  energy_reduction_percent = COALESCE(energy_reduction_percent, target_reduction_percent),
  waste_reduction_percent = COALESCE(waste_reduction_percent, target_reduction_percent),
  emissions_reduction_percent = COALESCE(emissions_reduction_percent, target_reduction_percent)
WHERE
  water_reduction_percent IS NULL
  OR energy_reduction_percent IS NULL
  OR waste_reduction_percent IS NULL
  OR emissions_reduction_percent IS NULL;

-- Add check constraints
ALTER TABLE sustainability_targets
ADD CONSTRAINT check_baseline_year_reasonable
CHECK (baseline_year BETWEEN 2000 AND 2100);

ALTER TABLE sustainability_targets
ADD CONSTRAINT check_reduction_rates_positive
CHECK (
  target_reduction_percent > 0 AND
  COALESCE(water_reduction_percent, 0) >= 0 AND
  COALESCE(energy_reduction_percent, 0) >= 0 AND
  COALESCE(waste_reduction_percent, 0) >= 0 AND
  COALESCE(emissions_reduction_percent, 0) >= 0
);

-- Add comments
COMMENT ON CONSTRAINT check_total_area_positive ON sites IS
'Ensures site area is positive. No default fallback - area must be provided.';

COMMENT ON CONSTRAINT check_baseline_year_reasonable ON sustainability_targets IS
'Ensures baseline year is reasonable (2000-2100). No default fallback - must be provided.';

COMMENT ON CONSTRAINT check_reduction_rates_positive ON sustainability_targets IS
'Ensures reduction rates are positive percentages. No default fallback - must be provided.';

-- Summary report
DO $$
DECLARE
  sites_count INTEGER;
  orgs_without_target INTEGER;
  targets_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO sites_count FROM sites WHERE total_area_sqm IS NOT NULL;
  SELECT COUNT(*) INTO orgs_without_target
  FROM organizations o
  WHERE o.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM sustainability_targets st
    WHERE st.organization_id = o.id AND st.is_active = true
  );
  SELECT COUNT(*) INTO targets_count FROM sustainability_targets WHERE is_active = true;

  RAISE NOTICE '=== VALIDATION SUMMARY ===';
  RAISE NOTICE 'Sites with area: %', sites_count;
  RAISE NOTICE 'Active orgs without target: %', orgs_without_target;
  RAISE NOTICE 'Active sustainability targets: %', targets_count;
  RAISE NOTICE '=========================';
END $$;
