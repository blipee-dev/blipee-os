-- Update calculate_co2e_emissions trigger to use grid_mix metadata when available
--
-- For electricity records with grid_mix metadata, use the calculated emissions from metadata
-- Otherwise, fall back to the emission_factors table

DROP FUNCTION IF EXISTS calculate_co2e_emissions() CASCADE;

CREATE OR REPLACE FUNCTION calculate_co2e_emissions()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is an electricity record with grid_mix metadata
  IF NEW.metadata IS NOT NULL AND
     NEW.metadata->'grid_mix' IS NOT NULL AND
     NEW.metadata->'grid_mix'->>'calculated_emissions_total_kgco2e' IS NOT NULL THEN
    -- Use the accurate emission calculation from grid_mix metadata
    NEW.co2e_emissions := (NEW.metadata->'grid_mix'->>'calculated_emissions_total_kgco2e')::numeric;
  ELSE
    -- Fall back to traditional emission factor lookup for non-electricity metrics
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
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
DROP TRIGGER IF EXISTS trigger_calculate_co2e_emissions ON metrics_data;

CREATE TRIGGER trigger_calculate_co2e_emissions
  BEFORE INSERT OR UPDATE ON metrics_data
  FOR EACH ROW
  EXECUTE FUNCTION calculate_co2e_emissions();

-- Now update all existing electricity records to use their metadata emissions
UPDATE metrics_data
SET co2e_emissions = (metadata->'grid_mix'->>'calculated_emissions_total_kgco2e')::numeric
WHERE metadata->'grid_mix'->>'calculated_emissions_total_kgco2e' IS NOT NULL;
