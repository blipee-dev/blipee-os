-- Fix emission_factors table conflict
-- The emission_factors table already exists with different columns
-- We'll ALTER it to add the missing columns we need for the metrics system

-- First, add the missing columns to the existing emission_factors table if they don't exist
DO $$
BEGIN
  -- Add metric_code column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'emission_factors'
                 AND column_name = 'metric_code') THEN
    ALTER TABLE emission_factors ADD COLUMN metric_code TEXT;
  END IF;

  -- Add factor column if it doesn't exist (maps to factor_value)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'emission_factors'
                 AND column_name = 'factor') THEN
    ALTER TABLE emission_factors ADD COLUMN factor DECIMAL;
    -- Copy existing factor_value to factor if it exists
    UPDATE emission_factors SET factor = factor_value WHERE factor_value IS NOT NULL;
  END IF;

  -- Add unit column if it doesn't exist (maps to factor_unit)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'emission_factors'
                 AND column_name = 'unit') THEN
    ALTER TABLE emission_factors ADD COLUMN unit TEXT;
    -- Copy existing factor_unit to unit if it exists
    UPDATE emission_factors SET unit = factor_unit WHERE factor_unit IS NOT NULL;
  END IF;

  -- Add region column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'emission_factors'
                 AND column_name = 'region') THEN
    ALTER TABLE emission_factors ADD COLUMN region TEXT;
    -- Set default region to GLOBAL for existing records
    UPDATE emission_factors SET region = 'GLOBAL' WHERE region IS NULL;
  END IF;

  -- Add year column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'emission_factors'
                 AND column_name = 'year') THEN
    ALTER TABLE emission_factors ADD COLUMN year INTEGER;
    -- Set default year to 2024 for existing records
    UPDATE emission_factors SET year = 2024 WHERE year IS NULL;
  END IF;

  -- Add source column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'emission_factors'
                 AND column_name = 'source') THEN
    ALTER TABLE emission_factors ADD COLUMN source TEXT;
    -- Use source_organization as source if available
    UPDATE emission_factors SET source = source_organization WHERE source_organization IS NOT NULL AND source IS NULL;
  END IF;
END $$;

-- Now add the foreign key constraint to metrics_catalog if it doesn't exist
DO $$
BEGIN
  -- First, update metric_code to match existing codes in metrics_catalog
  UPDATE emission_factors ef
  SET metric_code = mc.code
  FROM metrics_catalog mc
  WHERE ef.code = mc.code
  AND ef.metric_code IS NULL;

  -- Add the foreign key if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'emission_factors_metric_code_fkey'
  ) THEN
    ALTER TABLE emission_factors
    ADD CONSTRAINT emission_factors_metric_code_fkey
    FOREIGN KEY (metric_code) REFERENCES metrics_catalog(code);
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_emission_factors_metric_code ON emission_factors(metric_code);
CREATE INDEX IF NOT EXISTS idx_emission_factors_region ON emission_factors(region);
CREATE INDEX IF NOT EXISTS idx_emission_factors_year ON emission_factors(year);

-- Update the calculate_co2e_emissions function to work with the updated table
CREATE OR REPLACE FUNCTION calculate_co2e_emissions()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the emission factor for this metric
  SELECT
    NEW.value * COALESCE(
      -- Try to get region and year specific factor
      (SELECT factor FROM emission_factors
       WHERE metric_code = (SELECT code FROM metrics_catalog WHERE id = NEW.metric_id)
       AND region = COALESCE(
         (SELECT country FROM sites WHERE id = NEW.site_id),
         'GLOBAL'
       )
       AND year = EXTRACT(YEAR FROM NEW.period_start)
       AND is_active = true
       LIMIT 1),
      -- Fall back to catalog default
      (SELECT emission_factor FROM metrics_catalog WHERE id = NEW.metric_id),
      0
    )
  INTO NEW.co2e_emissions;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS calculate_emissions_trigger ON metrics_data;
CREATE TRIGGER calculate_emissions_trigger
  BEFORE INSERT OR UPDATE ON metrics_data
  FOR EACH ROW
  EXECUTE FUNCTION calculate_co2e_emissions();

-- Insert some basic emission factors if the table is empty
-- Include all required columns including 'name' and 'scope'
-- Using the correct metric codes from metrics_catalog
INSERT INTO emission_factors (name, code, scope, category, metric_code, region, year, factor, factor_value, unit, factor_unit, source, source_organization)
SELECT
  'Electricity Grid - US', 'scope2_electricity_grid', 'scope_2', 'Purchased Electricity', 'scope2_electricity_grid', 'US', 2024, 0.385, 0.385, 'kgCO2e/kWh', 'kgCO2e/kWh', 'EPA eGRID 2024', 'EPA'
WHERE NOT EXISTS (
  SELECT 1 FROM emission_factors
  WHERE metric_code = 'scope2_electricity_grid'
  AND region = 'US'
  AND year = 2024
)
UNION ALL
SELECT
  'Electricity Grid - EU', 'scope2_electricity_grid', 'scope_2', 'Purchased Electricity', 'scope2_electricity_grid', 'EU', 2024, 0.295, 0.295, 'kgCO2e/kWh', 'kgCO2e/kWh', 'European Environment Agency', 'EEA'
WHERE NOT EXISTS (
  SELECT 1 FROM emission_factors
  WHERE metric_code = 'scope2_electricity_grid'
  AND region = 'EU'
  AND year = 2024
)
UNION ALL
SELECT
  'Electricity Grid - Global', 'scope2_electricity_grid', 'scope_2', 'Purchased Electricity', 'scope2_electricity_grid', 'GLOBAL', 2024, 0.475, 0.475, 'kgCO2e/kWh', 'kgCO2e/kWh', 'IEA Global Average', 'IEA'
WHERE NOT EXISTS (
  SELECT 1 FROM emission_factors
  WHERE metric_code = 'scope2_electricity_grid'
  AND region = 'GLOBAL'
  AND year = 2024
);

-- Add comment explaining the dual use
COMMENT ON TABLE emission_factors IS 'Emission factors table used by both the original emissions system and the new metrics system. Contains region and time-specific emission factors.';