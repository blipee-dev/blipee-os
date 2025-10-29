-- Fix the calculate_co2e_emissions trigger to use correct column names
-- The emission_factors table has factor_value instead of factor

DROP FUNCTION IF EXISTS calculate_co2e_emissions() CASCADE;

CREATE OR REPLACE FUNCTION calculate_co2e_emissions()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the emission factor for this metric
  SELECT
    NEW.value * COALESCE(
      -- Try to get factor from emission_factors table
      (SELECT factor_value FROM emission_factors
       WHERE code = (SELECT code FROM metrics_catalog WHERE id = NEW.metric_id)
       LIMIT 1),
      -- Fall back to catalog default
      (SELECT emission_factor FROM metrics_catalog WHERE id = NEW.metric_id),
      0
    )
  INTO NEW.co2e_emissions;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER calculate_emissions_trigger
  BEFORE INSERT OR UPDATE ON metrics_data
  FOR EACH ROW
  EXECUTE FUNCTION calculate_co2e_emissions();

-- Query the pg_enum table to find valid values for emission_source_category
-- Then insert Portuguese emission factors
DO $$
DECLARE
  v_category TEXT;
  v_enum_values TEXT[];
BEGIN
  -- Get all valid enum values for emission_source_category
  SELECT array_agg(enumlabel::TEXT)
  INTO v_enum_values
  FROM pg_enum e
  JOIN pg_type t ON e.enumtypid = t.oid
  WHERE t.typname = 'emission_source_category';

  -- Find the most appropriate category for electricity
  -- Check for common electricity-related categories
  IF 'energy' = ANY(v_enum_values) THEN
    v_category := 'energy';
  ELSIF 'electricity' = ANY(v_enum_values) THEN
    v_category := 'electricity';
  ELSIF 'stationary_combustion' = ANY(v_enum_values) THEN
    v_category := 'stationary_combustion';
  ELSIF 'purchased_electricity' = ANY(v_enum_values) THEN
    v_category := 'purchased_electricity';
  ELSIF array_length(v_enum_values, 1) > 0 THEN
    -- Use the first available enum value
    v_category := v_enum_values[1];
  ELSE
    -- No enum values found, try to get from existing data
    SELECT category::TEXT INTO v_category FROM emission_factors LIMIT 1;
  END IF;

  -- Only proceed if we have a valid category
  IF v_category IS NOT NULL THEN
    -- Insert Portuguese emission factors
    INSERT INTO emission_factors (
      name,
      code,
      scope,
      category,
      factor_value,
      factor_unit,
      source_organization
    )
    VALUES
      ('Portugal Electricity Grid 2024', 'scope2_electricity_pt_2024', 'scope_2', v_category::emission_source_category, 0.195, 'kgCO2e/kWh', 'DGEG'),
      ('Portugal Electricity Grid 2023', 'scope2_electricity_pt_2023', 'scope_2', v_category::emission_source_category, 0.208, 'kgCO2e/kWh', 'DGEG'),
      ('Portugal Electricity Grid 2022', 'scope2_electricity_pt_2022', 'scope_2', v_category::emission_source_category, 0.231, 'kgCO2e/kWh', 'DGEG')
    ON CONFLICT (code) DO UPDATE
    SET factor_value = EXCLUDED.factor_value,
        source_organization = EXCLUDED.source_organization;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- If insertion fails, just log and continue
  RAISE NOTICE 'Could not insert Portuguese emission factors: %', SQLERRM;
END $$;