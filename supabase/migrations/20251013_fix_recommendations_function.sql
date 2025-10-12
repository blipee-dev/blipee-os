-- Fix type mismatch in generate_recommendations_for_org function
-- Issue: mc.unit is TEXT but function expects VARCHAR

DROP FUNCTION IF EXISTS generate_recommendations_for_org(UUID, VARCHAR, VARCHAR, VARCHAR);

CREATE OR REPLACE FUNCTION generate_recommendations_for_org(
  p_organization_id UUID,
  p_industry VARCHAR DEFAULT 'general',
  p_region VARCHAR DEFAULT 'EU',
  p_size_category VARCHAR DEFAULT '100-300'
)
RETURNS TABLE (
  metric_catalog_id UUID,
  metric_name TEXT,
  metric_code TEXT,
  category TEXT,
  scope TEXT,
  priority VARCHAR,
  recommendation_reason TEXT,
  peer_adoption_percent DECIMAL,
  estimated_baseline_value DECIMAL,
  estimated_baseline_unit TEXT,  -- Changed from VARCHAR to TEXT
  estimation_confidence VARCHAR,
  required_for_frameworks JSONB,
  gri_disclosure VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  WITH
  -- Get metrics already tracked by this org
  tracked_metrics AS (
    SELECT DISTINCT metric_id
    FROM metrics_data
    WHERE organization_id = p_organization_id
      AND (value > 0 OR co2e_emissions > 0)
  ),
  -- Get material metrics for this industry
  material_metrics AS (
    SELECT
      im.metric_catalog_id,
      im.materiality_level,
      im.materiality_reason,
      im.required_for_frameworks,
      im.gri_disclosure
    FROM industry_materiality im
    WHERE im.industry = p_industry
      AND im.metric_catalog_id NOT IN (SELECT metric_id FROM tracked_metrics)
  ),
  -- Get peer adoption rates
  peer_adoption AS (
    SELECT
      pbd.metric_catalog_id,
      pbd.adoption_percent,
      pbd.p50_intensity AS estimated_value
    FROM peer_benchmark_data pbd
    WHERE pbd.industry = p_industry
      AND pbd.region = p_region
      AND pbd.size_category = p_size_category
      AND pbd.data_as_of = (
        SELECT MAX(data_as_of)
        FROM peer_benchmark_data
        WHERE industry = p_industry
      )
  )
  SELECT
    mc.id AS metric_catalog_id,
    mc.name AS metric_name,
    mc.code AS metric_code,
    mc.category,
    mc.scope,
    -- Priority calculation
    CASE
      WHEN mm.materiality_level = 'high' OR pa.adoption_percent > 80 THEN 'high'::VARCHAR
      WHEN mm.materiality_level = 'medium' OR pa.adoption_percent > 50 THEN 'medium'::VARCHAR
      ELSE 'low'::VARCHAR
    END AS priority,
    -- Recommendation reason
    CONCAT(
      CASE
        WHEN mm.materiality_level = 'high' THEN 'High materiality for your industry. '
        WHEN mm.materiality_level = 'medium' THEN 'Medium materiality. '
        ELSE ''
      END,
      CASE
        WHEN pa.adoption_percent IS NOT NULL THEN
          'Tracked by ' || ROUND(pa.adoption_percent, 0)::TEXT || '% of peers. '
        ELSE ''
      END,
      COALESCE(mm.materiality_reason, '')
    ) AS recommendation_reason,
    pa.adoption_percent AS peer_adoption_percent,
    pa.estimated_value AS estimated_baseline_value,
    mc.unit AS estimated_baseline_unit,
    CASE
      WHEN pa.estimated_value IS NOT NULL THEN 'medium'::VARCHAR
      ELSE 'low'::VARCHAR
    END AS estimation_confidence,
    mm.required_for_frameworks,
    mm.gri_disclosure
  FROM metrics_catalog mc
  LEFT JOIN material_metrics mm ON mc.id = mm.metric_catalog_id
  LEFT JOIN peer_adoption pa ON mc.id = pa.metric_catalog_id
  WHERE mc.id NOT IN (SELECT metric_id FROM tracked_metrics)
    AND (mm.metric_catalog_id IS NOT NULL OR pa.metric_catalog_id IS NOT NULL)
  ORDER BY
    CASE
      WHEN mm.materiality_level = 'high' OR pa.adoption_percent > 80 THEN 1
      WHEN mm.materiality_level = 'medium' OR pa.adoption_percent > 50 THEN 2
      ELSE 3
    END,
    pa.adoption_percent DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_recommendations_for_org IS 'Generates intelligent metric recommendations based on industry materiality and peer benchmarks (FIXED: type mismatch)';
