-- First, let's inspect the emission_factors table structure and understand the enum
DO $$
DECLARE
  v_category TEXT;
  v_enum_values TEXT[];
  v_sample_category emission_source_category;
BEGIN
  -- Output the enum values
  RAISE NOTICE 'Getting enum values for emission_source_category...';

  SELECT array_agg(enumlabel::TEXT ORDER BY enumsortorder)
  INTO v_enum_values
  FROM pg_enum e
  JOIN pg_type t ON e.enumtypid = t.oid
  WHERE t.typname = 'emission_source_category';

  RAISE NOTICE 'Valid enum values: %', v_enum_values;

  -- Get a sample category from existing data
  SELECT category::TEXT INTO v_category FROM emission_factors WHERE category IS NOT NULL LIMIT 1;
  RAISE NOTICE 'Sample existing category: %', v_category;

  -- Show existing electricity-related records
  FOR v_category IN
    SELECT DISTINCT category::TEXT
    FROM emission_factors
    WHERE code LIKE '%electricity%' OR name ILIKE '%electricity%'
  LOOP
    RAISE NOTICE 'Electricity-related category found: %', v_category;
  END LOOP;
END $$;

-- Now fix the trigger function to use the correct column names
DROP FUNCTION IF EXISTS calculate_co2e_emissions() CASCADE;

CREATE OR REPLACE FUNCTION calculate_co2e_emissions()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the emission factor for this metric
  SELECT
    NEW.value * COALESCE(
      -- Try to get factor from emission_factors table using factor_value column
      (SELECT factor_value
       FROM emission_factors
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

-- Now insert Portuguese emission factors using the correct category
-- First, get a valid category value
DO $$
DECLARE
  v_category emission_source_category;
  v_existing_record RECORD;
BEGIN
  -- Get an existing record to understand the structure
  SELECT * INTO v_existing_record
  FROM emission_factors
  WHERE code LIKE '%electricity%'
  LIMIT 1;

  IF v_existing_record IS NOT NULL THEN
    RAISE NOTICE 'Found existing electricity record with category: %', v_existing_record.category;
    v_category := v_existing_record.category;
  ELSE
    -- Try to find any valid category
    SELECT category INTO v_category FROM emission_factors WHERE category IS NOT NULL LIMIT 1;
  END IF;

  -- Insert Portuguese emission factors using the same category as existing electricity records
  IF v_category IS NOT NULL THEN
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
      ('Portugal Electricity Grid 2024', 'scope2_electricity_pt_2024', 'scope_2', v_category, 0.195, 'kgCO2e/kWh', 'DGEG'),
      ('Portugal Electricity Grid 2023', 'scope2_electricity_pt_2023', 'scope_2', v_category, 0.208, 'kgCO2e/kWh', 'DGEG'),
      ('Portugal Electricity Grid 2022', 'scope2_electricity_pt_2022', 'scope_2', v_category, 0.231, 'kgCO2e/kWh', 'DGEG')
    ON CONFLICT (code) DO UPDATE
    SET factor_value = EXCLUDED.factor_value,
        source_organization = EXCLUDED.source_organization;

    RAISE NOTICE 'Successfully inserted Portuguese emission factors with category: %', v_category;
  ELSE
    RAISE NOTICE 'Could not determine valid category for emission factors';
  END IF;
END $$;

-- Output what we have now
SELECT 'Emission factors for electricity:' as info;
SELECT code, name, category::TEXT, factor_value, factor_unit
FROM emission_factors
WHERE code LIKE '%electricity%' OR name ILIKE '%electricity%'
ORDER BY code;