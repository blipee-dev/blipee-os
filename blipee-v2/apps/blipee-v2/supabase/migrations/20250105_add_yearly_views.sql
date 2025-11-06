-- ============================================================================
-- YEARLY DATA VIEWS - Facilitate multi-year analysis
-- ============================================================================

BEGIN;

-- ============================================================================
-- VIEW: yearly_metrics_summary
-- Aggregates all metrics by year for easy trend analysis
-- ============================================================================

CREATE OR REPLACE VIEW yearly_metrics_summary AS
SELECT
  md.organization_id,
  md.site_id,
  mc.id AS metric_id,
  mc.code AS metric_code,
  mc.name AS metric_name,
  mc.category,
  mc.scope,
  EXTRACT(YEAR FROM md.period_start)::INTEGER AS year,

  -- Aggregations
  SUM(md.value) AS total_value,
  AVG(md.value) AS avg_value,
  MIN(md.value) AS min_value,
  MAX(md.value) AS max_value,
  COUNT(*) AS data_points,

  -- Emissions
  SUM(md.co2e_emissions) AS total_co2e,
  AVG(md.co2e_emissions) AS avg_co2e,

  -- Data quality
  MODE() WITHIN GROUP (ORDER BY md.data_quality) AS predominant_quality,
  SUM(CASE WHEN md.verification_status = 'verified' THEN 1 ELSE 0 END)::NUMERIC / COUNT(*) * 100 AS verification_rate_pct,

  -- Unit (assumes consistent unit per metric)
  MIN(md.unit) AS unit,

  -- Time range
  MIN(md.period_start) AS year_start,
  MAX(md.period_end) AS year_end

FROM metrics_data md
JOIN metrics_catalog mc ON mc.id = md.metric_id
WHERE mc.is_active = true
GROUP BY
  md.organization_id,
  md.site_id,
  mc.id,
  mc.code,
  mc.name,
  mc.category,
  mc.scope,
  EXTRACT(YEAR FROM md.period_start);

COMMENT ON VIEW yearly_metrics_summary IS 'Aggregated metrics by year for trend analysis and YoY comparisons';

-- ============================================================================
-- VIEW: gri_yearly_completeness
-- Track GRI completeness by year
-- ============================================================================

CREATE OR REPLACE VIEW gri_yearly_completeness AS
WITH gri_metrics AS (
  SELECT
    id,
    code,
    SUBSTRING(code FROM 'gri_(\d+)_') AS gri_standard
  FROM metrics_catalog
  WHERE code LIKE 'gri_%'
    AND is_active = true
),
yearly_data AS (
  SELECT
    md.organization_id,
    EXTRACT(YEAR FROM md.period_start)::INTEGER AS year,
    gm.gri_standard,
    COUNT(DISTINCT md.metric_id) AS metrics_reported,
    COUNT(DISTINCT gm.id) AS total_metrics_in_standard
  FROM metrics_data md
  RIGHT JOIN gri_metrics gm ON gm.id = md.metric_id
  GROUP BY
    md.organization_id,
    EXTRACT(YEAR FROM md.period_start),
    gm.gri_standard
)
SELECT
  organization_id,
  year,
  'GRI ' || gri_standard AS gri_standard,
  metrics_reported,
  total_metrics_in_standard,
  ROUND(
    metrics_reported::NUMERIC / NULLIF(total_metrics_in_standard, 0) * 100,
    2
  ) AS completeness_pct
FROM yearly_data
WHERE organization_id IS NOT NULL
ORDER BY organization_id, year DESC, gri_standard;

COMMENT ON VIEW gri_yearly_completeness IS 'GRI reporting completeness by standard and year';

-- ============================================================================
-- VIEW: yearly_yoy_comparison
-- Year-over-year comparison for all metrics
-- ============================================================================

CREATE OR REPLACE VIEW yearly_yoy_comparison AS
WITH yearly_totals AS (
  SELECT
    organization_id,
    metric_id,
    EXTRACT(YEAR FROM period_start)::INTEGER AS year,
    SUM(value) AS total_value,
    SUM(co2e_emissions) AS total_co2e
  FROM metrics_data
  GROUP BY organization_id, metric_id, EXTRACT(YEAR FROM period_start)
)
SELECT
  current.organization_id,
  current.metric_id,
  mc.code AS metric_code,
  mc.name AS metric_name,
  mc.unit,
  current.year AS current_year,
  current.total_value AS current_value,
  current.total_co2e AS current_co2e,

  previous.year AS previous_year,
  previous.total_value AS previous_value,
  previous.total_co2e AS previous_co2e,

  -- Value change
  current.total_value - previous.total_value AS value_change,
  ROUND(
    (current.total_value - previous.total_value) / NULLIF(previous.total_value, 0) * 100,
    2
  ) AS value_change_pct,

  -- Emissions change
  current.total_co2e - previous.total_co2e AS co2e_change,
  ROUND(
    (current.total_co2e - previous.total_co2e) / NULLIF(previous.total_co2e, 0) * 100,
    2
  ) AS co2e_change_pct

FROM yearly_totals current
JOIN yearly_totals previous
  ON current.organization_id = previous.organization_id
  AND current.metric_id = previous.metric_id
  AND current.year = previous.year + 1
JOIN metrics_catalog mc ON mc.id = current.metric_id
ORDER BY current.organization_id, current.year DESC, mc.code;

COMMENT ON VIEW yearly_yoy_comparison IS 'Year-over-year comparison showing absolute and percentage changes';

-- ============================================================================
-- VIEW: emission_factor_history
-- Track how emission factors change over time
-- ============================================================================

CREATE OR REPLACE VIEW emission_factor_history AS
SELECT
  activity_name,
  region_code,
  source_year,
  factor_value,
  factor_unit,
  source_dataset,

  -- Compare to previous year
  LAG(factor_value) OVER (
    PARTITION BY activity_name, region_code
    ORDER BY source_year
  ) AS previous_year_factor,

  ROUND(
    (factor_value - LAG(factor_value) OVER (
      PARTITION BY activity_name, region_code
      ORDER BY source_year
    )) / NULLIF(LAG(factor_value) OVER (
      PARTITION BY activity_name, region_code
      ORDER BY source_year
    ), 0) * 100,
    2
  ) AS factor_change_pct,

  last_validated_at,
  api_calls_saved

FROM emission_factors_cache
ORDER BY activity_name, region_code, source_year DESC;

COMMENT ON VIEW emission_factor_history IS 'Historical emission factors showing how they evolve over time';

-- ============================================================================
-- FUNCTION: get_metric_trend
-- Get trend data for a specific metric across multiple years
-- ============================================================================

CREATE OR REPLACE FUNCTION get_metric_trend(
  p_organization_id UUID,
  p_metric_code TEXT,
  p_start_year INTEGER DEFAULT 2020,
  p_end_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
) RETURNS TABLE (
  year INTEGER,
  total_value NUMERIC,
  total_co2e NUMERIC,
  data_points BIGINT,
  unit TEXT,
  yoy_change_pct NUMERIC,
  trend TEXT  -- 'increasing', 'decreasing', 'stable'
) AS $$
BEGIN
  RETURN QUERY
  WITH yearly_data AS (
    SELECT
      EXTRACT(YEAR FROM md.period_start)::INTEGER AS y,
      SUM(md.value) AS val,
      SUM(md.co2e_emissions) AS co2,
      COUNT(*) AS points,
      MIN(md.unit) AS u
    FROM metrics_data md
    JOIN metrics_catalog mc ON mc.id = md.metric_id
    WHERE md.organization_id = p_organization_id
      AND mc.code = p_metric_code
      AND EXTRACT(YEAR FROM md.period_start) BETWEEN p_start_year AND p_end_year
    GROUP BY EXTRACT(YEAR FROM md.period_start)
  ),
  with_change AS (
    SELECT
      y,
      val,
      co2,
      points,
      u,
      ROUND(
        (val - LAG(val) OVER (ORDER BY y)) / NULLIF(LAG(val) OVER (ORDER BY y), 0) * 100,
        2
      ) AS change_pct
    FROM yearly_data
  )
  SELECT
    y::INTEGER,
    val,
    co2,
    points,
    u,
    change_pct,
    CASE
      WHEN change_pct > 5 THEN 'increasing'
      WHEN change_pct < -5 THEN 'decreasing'
      ELSE 'stable'
    END
  FROM with_change
  ORDER BY y DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_metric_trend IS 'Get multi-year trend for a specific metric with YoY changes';

-- ============================================================================
-- FUNCTION: get_correct_emission_factor
-- Get the correct emission factor for a specific year
-- ============================================================================

CREATE OR REPLACE FUNCTION get_correct_emission_factor(
  p_activity_name TEXT,
  p_region_code TEXT,
  p_year INTEGER
) RETURNS TABLE (
  factor_id UUID,
  factor_value NUMERIC,
  factor_unit TEXT,
  source_year INTEGER,
  source_dataset TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    id,
    emission_factors_cache.factor_value,
    emission_factors_cache.factor_unit,
    emission_factors_cache.source_year,
    emission_factors_cache.source_dataset
  FROM emission_factors_cache
  WHERE emission_factors_cache.activity_name = p_activity_name
    AND emission_factors_cache.region_code = p_region_code
    AND emission_factors_cache.source_year <= p_year  -- Use most recent available
  ORDER BY emission_factors_cache.source_year DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_correct_emission_factor IS 'Get the appropriate emission factor for a specific year (uses most recent available factor for that year or earlier)';

-- ============================================================================
-- INDEXES for performance
-- ============================================================================

-- Index on period_start for yearly queries
CREATE INDEX IF NOT EXISTS idx_metrics_data_year ON metrics_data(
  organization_id,
  EXTRACT(YEAR FROM period_start)
);

-- Index on emission factors by year
CREATE INDEX IF NOT EXISTS idx_emission_factors_year ON emission_factors_cache(
  activity_name,
  region_code,
  source_year DESC
);

COMMIT;

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================

/*
-- Example 1: Get GRI 305 trend for last 5 years
SELECT * FROM get_metric_trend(
  'org-uuid',
  'gri_305_1_direct_emissions',
  2020,
  2024
);

-- Example 2: Check GRI completeness by year
SELECT * FROM gri_yearly_completeness
WHERE organization_id = 'org-uuid'
  AND year >= 2020
ORDER BY year DESC, gri_standard;

-- Example 3: Year-over-year comparison for all metrics
SELECT * FROM yearly_yoy_comparison
WHERE organization_id = 'org-uuid'
  AND current_year = 2024
ORDER BY ABS(co2e_change_pct) DESC
LIMIT 10;

-- Example 4: Get correct emission factor for 2022
SELECT * FROM get_correct_emission_factor(
  'electricity grid',
  'PT',
  2022
);

-- Example 5: Track how grid carbon intensity improved over time
SELECT * FROM emission_factor_history
WHERE activity_name = 'electricity grid'
  AND region_code = 'PT'
ORDER BY source_year DESC;
*/
