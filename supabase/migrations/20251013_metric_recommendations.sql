-- Metric Recommendations System
-- Provides intelligent suggestions for metrics to track based on industry benchmarks

-- Table: metric_recommendations
CREATE TABLE IF NOT EXISTS metric_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  metric_catalog_id UUID NOT NULL REFERENCES metrics_catalog(id) ON DELETE CASCADE,

  -- Recommendation metadata
  priority VARCHAR(20) NOT NULL DEFAULT 'medium', -- high, medium, low
  recommendation_reason TEXT NOT NULL,
  peer_adoption_percent DECIMAL(5,2), -- % of peers tracking this

  -- Estimation if user wants to auto-baseline
  estimated_baseline_value DECIMAL(12,2),
  estimated_baseline_unit VARCHAR(50),
  estimation_method TEXT,
  estimation_confidence VARCHAR(20), -- high, medium, low

  -- ROI data
  estimated_cost_to_implement DECIMAL(10,2),
  estimated_annual_savings DECIMAL(10,2),
  estimated_roi_multiplier DECIMAL(5,2),
  time_to_implement_hours INTEGER,

  -- Compliance linkage
  required_for_frameworks JSONB, -- ["ESRS_E3", "GRI_303", "CDP_Water"]
  gri_disclosure VARCHAR(50),

  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, dismissed, tracking
  dismissed_reason TEXT,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,

  -- Audit
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(organization_id, metric_catalog_id)
);

-- Index for fast lookups
CREATE INDEX idx_metric_recommendations_org_status ON metric_recommendations(organization_id, status);
CREATE INDEX idx_metric_recommendations_priority ON metric_recommendations(priority) WHERE status = 'pending';

-- Table: peer_benchmark_data (aggregated, anonymous)
CREATE TABLE IF NOT EXISTS peer_benchmark_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Peer group definition
  industry VARCHAR(100) NOT NULL,
  region VARCHAR(50) NOT NULL,
  size_category VARCHAR(50) NOT NULL, -- e.g., "100-300", "300-1000"
  business_type VARCHAR(50), -- e.g., "B2B SaaS", "Retail", "Manufacturing"

  -- Metric being benchmarked
  metric_catalog_id UUID REFERENCES metrics_catalog(id) ON DELETE CASCADE,
  metric_type VARCHAR(50) NOT NULL, -- e.g., "emissions", "water", "waste"

  -- Statistical data (anonymized, minimum 10 orgs required)
  peer_count INTEGER NOT NULL CHECK (peer_count >= 10), -- privacy threshold
  adoption_percent DECIMAL(5,2) NOT NULL, -- % tracking this metric

  -- Intensity benchmarks (per employee, per revenue, per sqm)
  intensity_metric VARCHAR(50), -- e.g., "per_employee", "per_revenue", "per_sqm"
  p25_intensity DECIMAL(12,4),
  p50_intensity DECIMAL(12,4), -- median
  p75_intensity DECIMAL(12,4),
  p90_intensity DECIMAL(12,4),

  -- Absolute values (optional, aggregated)
  avg_absolute_value DECIMAL(12,2),

  -- Metadata
  data_as_of DATE NOT NULL,
  calculation_method TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint: one benchmark per peer group + metric + data date
  UNIQUE(industry, region, size_category, metric_catalog_id, data_as_of)
);

-- Index for fast peer group lookups
CREATE INDEX idx_peer_benchmark_group ON peer_benchmark_data(industry, region, size_category);
CREATE INDEX idx_peer_benchmark_metric ON peer_benchmark_data(metric_catalog_id);

-- Table: industry_materiality (GRI sector standards mapping)
CREATE TABLE IF NOT EXISTS industry_materiality (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Industry classification
  industry VARCHAR(100) NOT NULL,
  gri_sector_code VARCHAR(20), -- e.g., "GRI_11" (Services), "GRI_12" (Oil & Gas)
  sub_sector VARCHAR(100), -- e.g., "B2B SaaS", "Retail Banking"

  -- Metric linkage
  metric_catalog_id UUID REFERENCES metrics_catalog(id) ON DELETE CASCADE,
  gri_disclosure VARCHAR(50), -- e.g., "GRI 303-3", "GRI 305-1"

  -- Materiality assessment (double materiality per ESRS)
  materiality_level VARCHAR(20) NOT NULL DEFAULT 'medium', -- high, medium, low
  impact_materiality BOOLEAN DEFAULT false, -- Does it impact environment/society?
  financial_materiality BOOLEAN DEFAULT false, -- Does it impact financial performance?
  materiality_reason TEXT,

  -- Compliance linkage
  required_for_frameworks JSONB, -- ["ESRS_E3", "GRI_303", "CDP_Water", "TCFD"]
  mandatory BOOLEAN DEFAULT false, -- Is this legally required?

  -- Metadata
  source VARCHAR(100), -- e.g., "GRI Sector Standard", "SASB", "ESRS"
  last_reviewed DATE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(industry, gri_sector_code, metric_catalog_id)
);

-- Index for industry lookups
CREATE INDEX idx_industry_materiality_industry ON industry_materiality(industry);
CREATE INDEX idx_industry_materiality_gri ON industry_materiality(gri_sector_code);
CREATE INDEX idx_industry_materiality_level ON industry_materiality(materiality_level) WHERE materiality_level = 'high';

-- Table: recommendation_actions (audit trail for recommendations)
CREATE TABLE IF NOT EXISTS recommendation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id UUID NOT NULL REFERENCES metric_recommendations(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  action_type VARCHAR(50) NOT NULL, -- accepted, dismissed, viewed, estimated
  action_details JSONB, -- Additional context

  performed_by UUID REFERENCES auth.users(id),
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_recommendation_actions_recommendation ON recommendation_actions(recommendation_id);

-- Function: generate_recommendations_for_org
-- Generates intelligent metric recommendations based on industry, compliance gaps, and peer data
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
  estimated_baseline_unit VARCHAR,
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

COMMENT ON FUNCTION generate_recommendations_for_org IS 'Generates intelligent metric recommendations based on industry materiality and peer benchmarks';

-- Function: accept_recommendation
-- Accepts a recommendation and optionally creates metric_target with baseline estimation
CREATE OR REPLACE FUNCTION accept_recommendation(
  p_recommendation_id UUID,
  p_user_id UUID,
  p_use_estimate BOOLEAN DEFAULT true,
  p_restate_baseline BOOLEAN DEFAULT false
)
RETURNS JSONB AS $$
DECLARE
  v_recommendation RECORD;
  v_target_id UUID;
  v_result JSONB;
BEGIN
  -- Get recommendation details
  SELECT * INTO v_recommendation
  FROM metric_recommendations
  WHERE id = p_recommendation_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Recommendation not found';
  END IF;

  -- Update recommendation status
  UPDATE metric_recommendations
  SET
    status = 'accepted',
    accepted_at = NOW()
  WHERE id = p_recommendation_id;

  -- Log action
  INSERT INTO recommendation_actions (
    recommendation_id,
    organization_id,
    action_type,
    action_details,
    performed_by
  ) VALUES (
    p_recommendation_id,
    v_recommendation.organization_id,
    'accepted',
    jsonb_build_object(
      'use_estimate', p_use_estimate,
      'restate_baseline', p_restate_baseline
    ),
    p_user_id
  );

  -- If using estimate, create metric_target with baseline
  IF p_use_estimate AND v_recommendation.estimated_baseline_value IS NOT NULL THEN
    -- Create metric target (simplified - would link to sustainability_targets in production)
    INSERT INTO metric_tracking_history (
      organization_id,
      metric_id,
      first_tracked_date,
      baseline_year,
      baseline_value,
      estimation_method,
      notes
    ) VALUES (
      v_recommendation.organization_id,
      v_recommendation.metric_catalog_id,
      CURRENT_DATE,
      EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER - 1,
      v_recommendation.estimated_baseline_value,
      v_recommendation.estimation_method,
      'Auto-estimated from peer benchmarks'
    );
  END IF;

  v_result := jsonb_build_object(
    'success', true,
    'recommendation_id', p_recommendation_id,
    'metric_id', v_recommendation.metric_catalog_id,
    'message', 'Recommendation accepted successfully'
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION accept_recommendation IS 'Accepts a metric recommendation and optionally creates baseline estimate';

-- RLS Policies
ALTER TABLE metric_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_benchmark_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE industry_materiality ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_actions ENABLE ROW LEVEL SECURITY;

-- Users can view recommendations for their organization
CREATE POLICY metric_recommendations_view_policy ON metric_recommendations
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- Users can update recommendations for their organization
CREATE POLICY metric_recommendations_update_policy ON metric_recommendations
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- Peer benchmark data is public (anonymized)
CREATE POLICY peer_benchmark_view_policy ON peer_benchmark_data
  FOR SELECT
  USING (true);

-- Industry materiality is public
CREATE POLICY industry_materiality_view_policy ON industry_materiality
  FOR SELECT
  USING (true);

-- Users can view their recommendation actions
CREATE POLICY recommendation_actions_view_policy ON recommendation_actions
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- Grant permissions
GRANT SELECT ON metric_recommendations TO authenticated;
GRANT UPDATE ON metric_recommendations TO authenticated;
GRANT SELECT ON peer_benchmark_data TO authenticated;
GRANT SELECT ON industry_materiality TO authenticated;
GRANT SELECT ON recommendation_actions TO authenticated;
GRANT INSERT ON recommendation_actions TO authenticated;
