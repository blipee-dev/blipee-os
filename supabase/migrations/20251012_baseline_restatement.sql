-- Baseline Restatement System
-- Tracks when new metrics are added mid-journey and allows restating the baseline

-- Table to track baseline restatements
CREATE TABLE IF NOT EXISTS baseline_restatements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES sustainability_targets(id) ON DELETE CASCADE,

  -- Restatement metadata
  restatement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  restatement_reason TEXT NOT NULL, -- e.g., "Added Water and Waste metrics"
  restatement_type VARCHAR(50) NOT NULL DEFAULT 'scope_expansion', -- scope_expansion, error_correction, methodology_change

  -- Original baseline (before restatement)
  original_baseline_year INTEGER NOT NULL,
  original_baseline_emissions DECIMAL(10,2) NOT NULL,

  -- Restated baseline (after restatement)
  restated_baseline_emissions DECIMAL(10,2) NOT NULL,
  restatement_delta DECIMAL(10,2) GENERATED ALWAYS AS (restated_baseline_emissions - original_baseline_emissions) STORED,
  restatement_percent DECIMAL(5,2) GENERATED ALWAYS AS ((restated_baseline_emissions - original_baseline_emissions) / original_baseline_emissions * 100) STORED,

  -- New metrics added (JSON array of metric IDs)
  new_metrics_added JSONB,

  -- Historical estimates for new metrics (JSON with metric_id -> estimated emissions for baseline year)
  historical_estimates JSONB,

  -- Approval and audit
  status VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft, approved, applied, rejected
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  applied_at TIMESTAMP WITH TIME ZONE,

  -- Notes and documentation
  methodology_notes TEXT, -- How historical emissions were estimated
  supporting_documents JSONB, -- Array of document URLs/references

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Index for querying restatements
CREATE INDEX idx_baseline_restatements_org_target ON baseline_restatements(organization_id, target_id);
CREATE INDEX idx_baseline_restatements_status ON baseline_restatements(status);
CREATE INDEX idx_baseline_restatements_date ON baseline_restatements(restatement_date);

-- Table to track metric tracking history (when did we start tracking each metric?)
CREATE TABLE IF NOT EXISTS metric_tracking_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  metric_id UUID NOT NULL REFERENCES metrics_catalog(id) ON DELETE CASCADE,

  -- Tracking metadata
  started_tracking_date DATE NOT NULL, -- When did we start tracking this metric?
  first_data_entry_date DATE, -- When was the first actual data point?

  -- Baseline period (did this metric exist in the baseline year?)
  in_original_baseline BOOLEAN NOT NULL DEFAULT false,
  baseline_year INTEGER, -- Which baseline year does this apply to?

  -- Historical estimation (for baseline restatement)
  estimated_baseline_emissions DECIMAL(10,2), -- Estimated emissions for baseline year
  estimation_method VARCHAR(100), -- industry_average, extrapolation, proxy_data, direct_calculation
  estimation_confidence VARCHAR(20), -- high, medium, low
  estimation_notes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint: one tracking history per org-metric combo
  UNIQUE(organization_id, metric_id)
);

-- Index for querying tracking history
CREATE INDEX idx_metric_tracking_org ON metric_tracking_history(organization_id);
CREATE INDEX idx_metric_tracking_baseline ON metric_tracking_history(organization_id, in_original_baseline);
CREATE INDEX idx_metric_tracking_started ON metric_tracking_history(started_tracking_date);

-- Function to automatically detect new metrics (not in baseline year)
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
    AND EXTRACT(YEAR FROM md.period_start) > p_baseline_year -- Started tracking AFTER baseline year
    AND (md.value > 0 OR md.co2e_emissions > 0) -- Has actual data
    AND NOT EXISTS (
      -- Not already in tracking history
      SELECT 1 FROM metric_tracking_history mth
      WHERE mth.organization_id = p_organization_id
        AND mth.metric_id = mc.id
    )
  GROUP BY mc.id, mc.name, mc.code, mc.category, mc.scope
  ORDER BY MIN(md.period_start);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate restated baseline
CREATE OR REPLACE FUNCTION calculate_restated_baseline(
  p_organization_id UUID,
  p_target_id UUID,
  p_new_metrics JSONB -- Array of {metric_id, estimated_baseline_emissions}
)
RETURNS DECIMAL AS $$
DECLARE
  v_original_baseline DECIMAL;
  v_additional_emissions DECIMAL := 0;
  v_metric JSONB;
BEGIN
  -- Get original baseline
  SELECT baseline_emissions INTO v_original_baseline
  FROM sustainability_targets
  WHERE id = p_target_id AND organization_id = p_organization_id;

  -- Sum up additional emissions from new metrics
  FOR v_metric IN SELECT * FROM jsonb_array_elements(p_new_metrics)
  LOOP
    v_additional_emissions := v_additional_emissions + (v_metric->>'estimated_emissions')::DECIMAL;
  END LOOP;

  RETURN v_original_baseline + v_additional_emissions;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE baseline_restatements ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_tracking_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for baseline_restatements
CREATE POLICY "Users can view restatements for their organization"
  ON baseline_restatements FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Sustainability managers can create restatements"
  ON baseline_restatements FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
        AND role IN ('account_owner', 'sustainability_manager')
    )
  );

CREATE POLICY "Sustainability managers can update restatements"
  ON baseline_restatements FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
        AND role IN ('account_owner', 'sustainability_manager')
    )
  );

-- RLS Policies for metric_tracking_history
CREATE POLICY "Users can view tracking history for their organization"
  ON metric_tracking_history FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Sustainability managers can manage tracking history"
  ON metric_tracking_history FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
        AND role IN ('account_owner', 'sustainability_manager')
    )
  );

-- Comments
COMMENT ON TABLE baseline_restatements IS 'Tracks baseline restatements when scope expands or methodology changes (SBTi compliant)';
COMMENT ON TABLE metric_tracking_history IS 'Records when each metric started being tracked to identify scope expansion';
COMMENT ON FUNCTION detect_new_metrics IS 'Detects metrics that started being tracked after the baseline year';
COMMENT ON FUNCTION calculate_restated_baseline IS 'Calculates new baseline including historical estimates for new metrics';
