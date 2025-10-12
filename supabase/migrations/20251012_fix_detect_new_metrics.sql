-- Fix the detect_new_metrics function to properly detect metrics with NO data in baseline year

CREATE OR REPLACE FUNCTION detect_new_metrics(
  p_organization_id UUID,
  p_baseline_year INTEGER
)
RETURNS TABLE (
  metric_id UUID,
  metric_name TEXT,
  metric_code TEXT,
  category TEXT,
  scope TEXT,
  first_data_date DATE,
  data_points_count BIGINT,
  total_emissions DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    mc.id AS metric_id,
    mc.name AS metric_name,
    mc.code AS metric_code,
    mc.category,
    mc.scope,
    MIN(md.period_start::DATE) AS first_data_date,
    COUNT(md.id) AS data_points_count,
    SUM(md.co2e_emissions) AS total_emissions
  FROM metrics_catalog mc
  JOIN metrics_data md ON mc.id = md.metric_id
  WHERE md.organization_id = p_organization_id
    AND (md.value > 0 OR md.co2e_emissions > 0) -- Has actual data
    -- Metric has data AFTER baseline year
    AND EXISTS (
      SELECT 1 FROM metrics_data md2
      WHERE md2.metric_id = mc.id
        AND md2.organization_id = p_organization_id
        AND EXTRACT(YEAR FROM md2.period_start) > p_baseline_year
        AND (md2.value > 0 OR md2.co2e_emissions > 0)
    )
    -- But NO data IN baseline year
    AND NOT EXISTS (
      SELECT 1 FROM metrics_data md3
      WHERE md3.metric_id = mc.id
        AND md3.organization_id = p_organization_id
        AND EXTRACT(YEAR FROM md3.period_start) = p_baseline_year
        AND (md3.value > 0 OR md3.co2e_emissions > 0)
    )
    -- Not already in tracking history
    AND NOT EXISTS (
      SELECT 1 FROM metric_tracking_history mth
      WHERE mth.organization_id = p_organization_id
        AND mth.metric_id = mc.id
    )
  GROUP BY mc.id, mc.name, mc.code, mc.category, mc.scope
  ORDER BY MIN(md.period_start);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION detect_new_metrics IS 'Detects metrics that have data AFTER baseline year but NO data IN baseline year';
