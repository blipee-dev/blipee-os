-- Update the auto_add_grid_mix_metadata function to include detailed sources from energy_mix_metadata table

CREATE OR REPLACE FUNCTION auto_add_grid_mix_metadata()
RETURNS TRIGGER AS $$
DECLARE
  metric_code TEXT;
  metric_energy_type TEXT;
  renewable_pct DECIMAL(5,2);
  total_kwh DECIMAL;
  renewable_kwh DECIMAL;
  non_renewable_kwh DECIMAL;
  mix_sources JSONB;
  provider_name TEXT;
  mix_year INTEGER;
BEGIN
  -- Get the metric code and energy type
  SELECT code, energy_type INTO metric_code, metric_energy_type
  FROM metrics_catalog
  WHERE id = NEW.metric_id;

  -- Only process energy metrics (not water, waste, etc.)
  IF metric_code IS NOT NULL AND metric_energy_type IS NOT NULL THEN

    mix_year := EXTRACT(YEAR FROM NEW.period_start);

    -- Try to get energy mix from energy_mix_metadata table
    SELECT
      emm.renewable_percentage,
      emm.provider_name,
      emm.sources
    INTO
      renewable_pct,
      provider_name,
      mix_sources
    FROM energy_mix_metadata emm
    WHERE emm.energy_type = metric_energy_type
      AND emm.country_code = 'PT' -- TODO: Make this dynamic based on site location
      AND emm.year = mix_year
      AND (emm.month IS NULL OR emm.month = EXTRACT(MONTH FROM NEW.period_start))
    ORDER BY
      -- Prefer monthly data over annual
      emm.month DESC NULLS LAST
    LIMIT 1;

    -- If no energy mix found, try legacy function for electricity
    IF renewable_pct IS NULL AND metric_energy_type = 'electricity' THEN
      renewable_pct := get_edp_renewable_percentage(NEW.period_start);
      provider_name := 'EDP';
      mix_sources := '[]'::jsonb;
    END IF;

    IF renewable_pct IS NOT NULL THEN
      -- Calculate splits
      total_kwh := NEW.value::DECIMAL;
      renewable_kwh := total_kwh * (renewable_pct / 100);
      non_renewable_kwh := total_kwh * ((100 - renewable_pct) / 100);

      -- Determine metadata key based on energy type
      DECLARE
        metadata_key TEXT;
      BEGIN
        metadata_key := CASE metric_energy_type
          WHEN 'electricity' THEN 'grid_mix'
          WHEN 'district_heating' THEN 'supplier_mix'
          WHEN 'district_cooling' THEN 'supplier_mix'
          WHEN 'steam' THEN 'supplier_mix'
          ELSE 'energy_mix'
        END;

        -- Add energy mix metadata
        NEW.metadata := COALESCE(NEW.metadata, '{}'::jsonb) || jsonb_build_object(
          metadata_key, jsonb_build_object(
            'provider', COALESCE(provider_name, 'Unknown'),
            'country', 'PT',
            'year', EXTRACT(YEAR FROM NEW.period_start),
            'month', EXTRACT(MONTH FROM NEW.period_start),
            'period', TO_CHAR(NEW.period_start, 'YYYY-MM'),
            'renewable_percentage', renewable_pct,
            'non_renewable_percentage', 100 - renewable_pct,
            'renewable_kwh', renewable_kwh,
            'non_renewable_kwh', non_renewable_kwh,
            'sources', COALESCE(mix_sources, '[]'::jsonb),
            'energy_type', metric_energy_type,
            'source', 'energy_mix_metadata',
            'updated_at', NOW()
          )
        );
      END;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION auto_add_grid_mix_metadata IS 'Automatically adds energy mix metadata (grid_mix or supplier_mix) to all energy metrics with renewable/non-renewable split and detailed source breakdown from energy_mix_metadata table';
