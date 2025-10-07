-- Auto-populate grid mix metadata for electricity records
-- This trigger automatically adds renewable percentage metadata when electricity data is inserted/updated

-- Function to get EDP renewable percentage for a given date
CREATE OR REPLACE FUNCTION get_edp_renewable_percentage(period_date DATE)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  year_val INTEGER;
  month_val TEXT;
  renewable_pct DECIMAL(5,2);
BEGIN
  year_val := EXTRACT(YEAR FROM period_date);
  month_val := TO_CHAR(period_date, 'YYYY-MM');

  -- EDP Portugal renewable percentages
  -- Try monthly data first, then fall back to annual average
  renewable_pct := CASE
    -- Add monthly data here when available:
    -- WHEN month_val = '2024-10' THEN 65.5
    -- WHEN month_val = '2024-11' THEN 58.2

    -- Annual averages (applied to all months in that year)
    WHEN year_val = 2022 THEN 28.15
    WHEN year_val = 2023 THEN 33.30
    WHEN year_val = 2024 THEN 62.23
    WHEN year_val = 2025 THEN 56.99
    ELSE NULL
  END;

  RETURN renewable_pct;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to automatically add grid_mix metadata to electricity records
CREATE OR REPLACE FUNCTION auto_add_grid_mix_metadata()
RETURNS TRIGGER AS $$
DECLARE
  metric_code TEXT;
  renewable_pct DECIMAL(5,2);
  total_kwh DECIMAL;
  renewable_kwh DECIMAL;
  non_renewable_kwh DECIMAL;
BEGIN
  -- Get the metric code
  SELECT code INTO metric_code
  FROM metrics_catalog
  WHERE id = NEW.metric_id;

  -- Only process electricity-related metrics
  IF metric_code IS NOT NULL AND (
    metric_code ILIKE '%electricity%' OR
    metric_code ILIKE '%grid%' OR
    metric_code ILIKE '%ev%'
  ) THEN
    -- Get renewable percentage for this period
    renewable_pct := get_edp_renewable_percentage(NEW.period_start);

    IF renewable_pct IS NOT NULL THEN
      -- Calculate splits
      total_kwh := NEW.value::DECIMAL;
      renewable_kwh := total_kwh * (renewable_pct / 100);
      non_renewable_kwh := total_kwh * ((100 - renewable_pct) / 100);

      -- Add grid_mix metadata (emissions are calculated separately using IEA factor)
      NEW.metadata := COALESCE(NEW.metadata, '{}'::jsonb) || jsonb_build_object(
        'grid_mix', jsonb_build_object(
          'provider', 'EDP',
          'country', 'PT',
          'year', EXTRACT(YEAR FROM NEW.period_start),
          'month', EXTRACT(MONTH FROM NEW.period_start),
          'period', TO_CHAR(NEW.period_start, 'YYYY-MM'),
          'renewable_percentage', renewable_pct,
          'non_renewable_percentage', 100 - renewable_pct,
          'renewable_kwh', renewable_kwh,
          'non_renewable_kwh', non_renewable_kwh,
          'source', 'https://www.edp.com',
          'updated_at', NOW()
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run before insert or update
DROP TRIGGER IF EXISTS trigger_auto_add_grid_mix_metadata ON metrics_data;
CREATE TRIGGER trigger_auto_add_grid_mix_metadata
  BEFORE INSERT OR UPDATE ON metrics_data
  FOR EACH ROW
  EXECUTE FUNCTION auto_add_grid_mix_metadata();

COMMENT ON FUNCTION get_edp_renewable_percentage IS 'Returns EDP Portugal renewable energy percentage for a given date. Supports monthly and annual data.';
COMMENT ON FUNCTION auto_add_grid_mix_metadata IS 'Automatically adds grid_mix metadata to electricity metrics with renewable/non-renewable split based on EDP Portugal data.';
