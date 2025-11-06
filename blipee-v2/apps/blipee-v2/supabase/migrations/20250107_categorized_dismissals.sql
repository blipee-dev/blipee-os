-- Add categorized dismissals and materiality tracking
-- This migration extends the metric recommendations system with intelligent dismiss reasons

-- Add new columns to metric_recommendations table
ALTER TABLE metric_recommendations
ADD COLUMN IF NOT EXISTS dismissed_category VARCHAR(50),
ADD COLUMN IF NOT EXISTS dismissed_notes TEXT,
ADD COLUMN IF NOT EXISTS is_reactivatable BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS affects_materiality BOOLEAN DEFAULT false;

-- Create index for materiality queries
CREATE INDEX IF NOT EXISTS idx_metric_recommendations_materiality
ON metric_recommendations(organization_id, dismissed_category, affects_materiality);

-- Table to track metric reactivations
CREATE TABLE IF NOT EXISTS metric_reactivations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id UUID NOT NULL REFERENCES metric_recommendations(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Reactivation metadata
  reactivated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reactivated_by UUID REFERENCES auth.users(id),
  reactivation_reason TEXT,

  -- Original dismissal info (for audit trail)
  original_dismiss_category VARCHAR(50),
  original_dismiss_reason TEXT,
  original_dismiss_date TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_metric_reactivations_org ON metric_reactivations(organization_id);
CREATE INDEX IF NOT EXISTS idx_metric_reactivations_recommendation ON metric_reactivations(recommendation_id);

-- Function to calculate GRI materiality from dismissals
CREATE OR REPLACE FUNCTION calculate_gri_materiality(
  p_organization_id UUID
)
RETURNS TABLE (
  gri_standard TEXT,
  standard_name TEXT,
  is_material BOOLEAN,
  total_metrics INT,
  material_metrics INT,
  not_material_metrics INT,
  pending_assessment INT,
  materiality_percentage DECIMAL,
  material_disclosures TEXT[],
  peer_adoption_avg DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH standard_analysis AS (
    SELECT
      CASE
        WHEN mc.code ~ '^gri_30[1-8]' THEN SUBSTRING(mc.code FROM 'gri_(30[1-8])')
        WHEN mc.code ~ '^scope[123]' THEN '305'  -- Map scope emissions to GRI 305
        ELSE NULL
      END as standard_code,
      mr.status,
      mr.dismissed_category,
      mr.affects_materiality,
      mr.peer_adoption_percent,
      im.gri_disclosure
    FROM metrics_catalog mc
    LEFT JOIN metric_recommendations mr
      ON mc.id = mr.metric_catalog_id
      AND mr.organization_id = p_organization_id
    LEFT JOIN industry_materiality im
      ON mc.id = im.metric_catalog_id
    WHERE mc.code ~ '^(gri_30[1-8]|scope[123])'
  )
  SELECT
    sa.standard_code::TEXT,
    CASE sa.standard_code
      WHEN '301' THEN 'Materials'::TEXT
      WHEN '302' THEN 'Energy'::TEXT
      WHEN '303' THEN 'Water and Effluents'::TEXT
      WHEN '304' THEN 'Biodiversity'::TEXT
      WHEN '305' THEN 'Emissions'::TEXT
      WHEN '306' THEN 'Waste'::TEXT
      WHEN '307' THEN 'Environmental Compliance'::TEXT
      WHEN '308' THEN 'Supplier Environmental Assessment'::TEXT
    END as standard_name,

    -- Material if:
    -- 1. ANY metric is accepted/tracking OR
    -- 2. NOT all metrics are dismissed as not_material
    (
      COUNT(*) FILTER (WHERE sa.status IN ('accepted', 'tracking')) > 0
      OR
      COUNT(*) FILTER (WHERE sa.dismissed_category = 'not_material' AND sa.affects_materiality = true) < COUNT(*)
    ) as is_material,

    -- Counts
    COUNT(*)::INT as total_metrics,
    COUNT(*) FILTER (WHERE sa.status IN ('accepted', 'tracking') OR (sa.dismissed_category IS NULL))::INT as material_metrics,
    COUNT(*) FILTER (WHERE sa.dismissed_category = 'not_material' AND sa.affects_materiality = true)::INT as not_material_metrics,
    COUNT(*) FILTER (WHERE sa.status IS NULL OR sa.status = 'pending')::INT as pending_assessment,

    -- Materiality percentage
    ROUND(
      (COUNT(*) FILTER (WHERE sa.status IN ('accepted', 'tracking') OR sa.dismissed_category IS NULL)::DECIMAL
       / NULLIF(COUNT(*), 0) * 100),
      1
    ) as materiality_percentage,

    -- List of GRI disclosures that are material (cast to TEXT[])
    ARRAY(
      SELECT DISTINCT gd::TEXT
      FROM unnest(ARRAY_AGG(DISTINCT sa.gri_disclosure) FILTER (WHERE sa.status IN ('accepted', 'tracking'))) AS gd
    ) as material_disclosures,

    -- Average peer adoption
    ROUND(AVG(sa.peer_adoption_percent) FILTER (WHERE sa.peer_adoption_percent IS NOT NULL), 1) as peer_adoption_avg

  FROM standard_analysis sa
  WHERE sa.standard_code IS NOT NULL
  GROUP BY sa.standard_code
  ORDER BY sa.standard_code;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_gri_materiality IS 'Calculates GRI materiality assessment based on accepted and dismissed metrics';

-- Function to get dismissed metrics with category breakdown
CREATE OR REPLACE FUNCTION get_dismissed_metrics_breakdown(
  p_organization_id UUID
)
RETURNS TABLE (
  category VARCHAR,
  category_label TEXT,
  metric_count INT,
  is_reactivatable BOOLEAN,
  affects_materiality BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    mr.dismissed_category,
    CASE mr.dismissed_category
      WHEN 'not_material' THEN 'Not Material'
      WHEN 'not_priority' THEN 'Not a Priority Now'
      WHEN 'already_tracking' THEN 'Already Tracking'
      WHEN 'data_not_available' THEN 'Data Not Available'
      WHEN 'cost_prohibitive' THEN 'Too Expensive'
      WHEN 'other' THEN 'Other Reason'
      ELSE 'Unknown'
    END as category_label,
    COUNT(*)::INT as metric_count,
    BOOL_OR(mr.is_reactivatable) as is_reactivatable,
    BOOL_OR(mr.affects_materiality) as affects_materiality
  FROM metric_recommendations mr
  WHERE mr.organization_id = p_organization_id
    AND mr.status = 'dismissed'
    AND mr.dismissed_category IS NOT NULL
  GROUP BY mr.dismissed_category
  ORDER BY
    CASE mr.dismissed_category
      WHEN 'not_material' THEN 1
      WHEN 'not_priority' THEN 2
      WHEN 'data_not_available' THEN 3
      WHEN 'cost_prohibitive' THEN 4
      WHEN 'already_tracking' THEN 5
      WHEN 'other' THEN 6
    END;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_dismissed_metrics_breakdown IS 'Gets breakdown of dismissed metrics by category';

-- RLS for reactivations table
ALTER TABLE metric_reactivations ENABLE ROW LEVEL SECURITY;

CREATE POLICY metric_reactivations_view_policy ON metric_reactivations
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY metric_reactivations_insert_policy ON metric_reactivations
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- Grant permissions
GRANT SELECT ON metric_reactivations TO authenticated;
GRANT INSERT ON metric_reactivations TO authenticated;

-- Update comment on metric_recommendations table
COMMENT ON TABLE metric_recommendations IS 'Metric recommendations with categorized dismiss reasons for materiality assessment';
