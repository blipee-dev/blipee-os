-- Update grid_mix metadata with correct renewable percentages from reference table
-- This fixes historical data that has incorrect 55% values

DO $$
DECLARE
  rec RECORD;
  ref_data RECORD;
  new_renewable_kwh NUMERIC;
  new_non_renewable_kwh NUMERIC;
  new_metadata JSONB;
BEGIN
  -- Loop through all electricity metrics with grid_mix metadata
  FOR rec IN
    SELECT
      md.id,
      md.value,
      md.period_start,
      md.metadata,
      m.code
    FROM metrics_data md
    JOIN metrics_catalog m ON md.metric_id = m.id
    WHERE m.code = 'scope2_electricity_grid'
      AND md.metadata ? 'grid_mix'
  LOOP
    -- Get reference data for this period
    SELECT renewable_percentage, carbon_intensity
    INTO ref_data
    FROM portugal_grid_mix_reference
    WHERE year = EXTRACT(YEAR FROM rec.period_start)
      AND month = EXTRACT(MONTH FROM rec.period_start)
      AND quarter IS NULL
    LIMIT 1;

    -- If we found reference data, update the metadata
    IF FOUND THEN
      -- Calculate new renewable and non-renewable kWh
      new_renewable_kwh := (rec.value * ref_data.renewable_percentage) / 100;
      new_non_renewable_kwh := (rec.value * (100 - ref_data.renewable_percentage)) / 100;

      -- Build new metadata with updated grid_mix
      new_metadata := rec.metadata;
      new_metadata := jsonb_set(new_metadata, '{grid_mix,renewable_percentage}', to_jsonb(ref_data.renewable_percentage::numeric));
      new_metadata := jsonb_set(new_metadata, '{grid_mix,renewable_kwh}', to_jsonb(new_renewable_kwh::numeric));
      new_metadata := jsonb_set(new_metadata, '{grid_mix,non_renewable_kwh}', to_jsonb(new_non_renewable_kwh::numeric));
      new_metadata := jsonb_set(new_metadata, '{grid_mix,carbon_intensity}', to_jsonb(ref_data.carbon_intensity::numeric));
      new_metadata := jsonb_set(new_metadata, '{grid_mix,updated_at}', to_jsonb(NOW()::timestamptz));
      new_metadata := jsonb_set(new_metadata, '{grid_mix,source}', to_jsonb('portugal_grid_mix_reference'::text));

      -- Update the record
      UPDATE metrics_data
      SET metadata = new_metadata
      WHERE id = rec.id;

      -- RAISE NOTICE format('Updated metric %s for %s with %s%% renewable', rec.id, rec.period_start, ref_data.renewable_percentage);
    END IF;
  END LOOP;
END $$;
