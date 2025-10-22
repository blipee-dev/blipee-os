-- ============================================================================
-- BLIPEE PERFORMANCE INDEX™ - Database Schema
-- ============================================================================
--
-- Creates tables and functions for the Blipee Performance Scoring System
-- This outperforms Arc Skoru with:
--   - Industry-specific weighting (GRI standards)
--   - ML-powered peer benchmarking
--   - Improvement velocity tracking
--   - Predictive scoring
--   - Scope 3 & supply chain metrics
--   - Portfolio-level aggregation
-- Version: 1.0
-- Created: 2025-10-21
-- ============================================================================

-- ============================================================================
-- DROP EXISTING (if re-running)
-- ============================================================================

DROP TABLE IF EXISTS performance_score_history CASCADE;
DROP TABLE IF EXISTS performance_scores CASCADE;
DROP TABLE IF EXISTS category_scores CASCADE;
DROP TABLE IF EXISTS peer_benchmarks CASCADE;
DROP TABLE IF EXISTS score_opportunities CASCADE;
DROP TABLE IF EXISTS portfolio_best_practices CASCADE;

DROP TYPE IF EXISTS score_grade CASCADE;
DROP TYPE IF EXISTS trend_direction CASCADE;
DROP TYPE IF EXISTS confidence_level CASCADE;
DROP TYPE IF EXISTS opportunity_priority CASCADE;
DROP TYPE IF EXISTS opportunity_difficulty CASCADE;

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE score_grade AS ENUM ('A+', 'A', 'B', 'C', 'D', 'F');
CREATE TYPE trend_direction AS ENUM ('improving', 'stable', 'declining');
CREATE TYPE confidence_level AS ENUM ('high', 'medium', 'low');
CREATE TYPE opportunity_priority AS ENUM ('high', 'medium', 'low');
CREATE TYPE opportunity_difficulty AS ENUM ('easy', 'moderate', 'complex');

-- ============================================================================
-- MAIN TABLES
-- ============================================================================

-- Performance Scores Table (overall site/portfolio scores)
CREATE TABLE performance_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Links
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  is_portfolio_score BOOLEAN DEFAULT false,

  -- Overall Score (0-100)
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  grade score_grade NOT NULL,

  -- Advanced Metrics
  improvement_velocity DECIMAL(5,2) NOT NULL, -- -100 to +100
  predicted_score_30_days INTEGER,
  predicted_score_90_days INTEGER,
  predicted_score_365_days INTEGER,
  peer_percentile INTEGER CHECK (peer_percentile >= 0 AND peer_percentile <= 100),

  -- Time-based scores (for historical tracking)
  rolling_7_day_score INTEGER,
  rolling_30_day_score INTEGER,
  rolling_90_day_score INTEGER,
  rolling_365_day_score INTEGER,

  -- Data Quality
  data_completeness INTEGER NOT NULL CHECK (data_completeness >= 0 AND data_completeness <= 100),
  confidence_level confidence_level NOT NULL,

  -- Metadata
  industry TEXT,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT score_site_or_org CHECK (
    (site_id IS NOT NULL AND is_portfolio_score = false) OR
    (site_id IS NULL AND is_portfolio_score = true)
  )
);

-- Category Scores Table (detailed breakdown)
CREATE TABLE category_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  performance_score_id UUID NOT NULL REFERENCES performance_scores(id) ON DELETE CASCADE,

  -- Category
  category TEXT NOT NULL CHECK (category IN (
    'energy',
    'water',
    'waste',
    'transportation',
    'humanExperience',
    'scopeThree',
    'supplyChain',
    'compliance'
  )),

  -- Scores
  raw_score INTEGER NOT NULL CHECK (raw_score >= 0 AND raw_score <= 100),
  weighted_score DECIMAL(5,2) NOT NULL,
  weight DECIMAL(4,3) NOT NULL CHECK (weight >= 0 AND weight <= 1),

  -- Benchmarking
  percentile INTEGER CHECK (percentile >= 0 AND percentile <= 100),

  -- Trend
  trend trend_direction NOT NULL DEFAULT 'stable',
  trend_value DECIMAL(5,2) NOT NULL DEFAULT 0, -- Points per month

  -- Data Quality
  data_points INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Sub-scores (JSONB for flexibility)
  sub_scores JSONB,

  -- AI Insights
  insights TEXT[],

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(performance_score_id, category)
);

-- Historical Scores (time series)
CREATE TABLE performance_score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  category_scores JSONB NOT NULL, -- Snapshot of all category scores

  calculated_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Indexes
  CONSTRAINT history_site_or_org CHECK (site_id IS NOT NULL OR organization_id IS NOT NULL)
);

-- Peer Benchmarks (anonymous comparison data)
CREATE TABLE peer_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Peer Group Definition
  industry TEXT NOT NULL,
  size_range TEXT NOT NULL, -- e.g., '10000-50000 sqft'
  region TEXT, -- e.g., 'Northeast US'

  -- Category
  category TEXT NOT NULL CHECK (category IN (
    'overall',
    'energy',
    'water',
    'waste',
    'transportation',
    'humanExperience',
    'scopeThree',
    'supplyChain',
    'compliance'
  )),

  -- Benchmark Scores
  median_score INTEGER NOT NULL,
  top_10_percentile_score INTEGER NOT NULL,
  top_25_percentile_score INTEGER NOT NULL,
  bottom_25_percentile_score INTEGER NOT NULL,

  -- Sample Size
  sample_count INTEGER NOT NULL,

  -- Timing
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(industry, size_range, region, category, period_start, period_end)
);

-- Scoring Opportunities (AI-generated improvement recommendations)
CREATE TABLE score_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  performance_score_id UUID NOT NULL REFERENCES performance_scores(id) ON DELETE CASCADE,

  -- Opportunity Details
  category TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT,

  -- Impact
  potential_points INTEGER NOT NULL CHECK (potential_points >= 0),
  estimated_cost TEXT,
  payback_months INTEGER, -- NULL = 'immediate'
  annual_savings_usd INTEGER,

  -- Prioritization
  priority opportunity_priority NOT NULL,
  difficulty opportunity_difficulty NOT NULL,

  -- Agent Status
  agent_working BOOLEAN DEFAULT false,
  agent_id UUID, -- References autonomous agent
  assigned_at TIMESTAMPTZ,

  -- Tracking
  status TEXT DEFAULT 'identified' CHECK (status IN (
    'identified',
    'in_progress',
    'completed',
    'dismissed'
  )),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Portfolio Best Practices (cross-site learning)
CREATE TABLE portfolio_best_practices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Source
  from_site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  from_site_name TEXT NOT NULL,

  -- Practice
  category TEXT NOT NULL,
  practice TEXT NOT NULL,
  description TEXT,
  impact TEXT NOT NULL, -- e.g., "Human Experience +15 points"

  -- Applicability
  applicable_to_site_ids UUID[], -- Array of site IDs
  industry_specific TEXT[], -- Which industries can benefit

  -- Evidence
  evidence_score_improvement INTEGER,
  evidence_cost_savings_usd INTEGER,
  evidence_timeframe TEXT,

  -- Sharing
  shared_count INTEGER DEFAULT 0,
  implemented_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_performance_scores_site ON performance_scores(site_id);
CREATE INDEX idx_performance_scores_org ON performance_scores(organization_id);
CREATE INDEX idx_performance_scores_portfolio ON performance_scores(organization_id) WHERE is_portfolio_score = true;
CREATE INDEX idx_performance_scores_calculated_at ON performance_scores(calculated_at DESC);
CREATE INDEX idx_performance_scores_industry ON performance_scores(industry);

CREATE INDEX idx_category_scores_performance ON category_scores(performance_score_id);
CREATE INDEX idx_category_scores_category ON category_scores(category);

CREATE INDEX idx_score_history_site ON performance_score_history(site_id, calculated_at DESC);
CREATE INDEX idx_score_history_org ON performance_score_history(organization_id, calculated_at DESC);

CREATE INDEX idx_peer_benchmarks_lookup ON peer_benchmarks(industry, size_range, region, category);

CREATE INDEX idx_opportunities_performance ON score_opportunities(performance_score_id);
CREATE INDEX idx_opportunities_status ON score_opportunities(status) WHERE status != 'dismissed';
CREATE INDEX idx_opportunities_priority ON score_opportunities(priority) WHERE status = 'identified';

CREATE INDEX idx_best_practices_org ON portfolio_best_practices(organization_id);
CREATE INDEX idx_best_practices_from_site ON portfolio_best_practices(from_site_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE performance_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_best_practices ENABLE ROW LEVEL SECURITY;

-- Performance Scores Policies
CREATE POLICY "Users can view performance scores for their organization"
  ON performance_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid()
        AND om.organization_id = performance_scores.organization_id
    )
  );

CREATE POLICY "System can insert performance scores"
  ON performance_scores FOR INSERT
  WITH CHECK (true); -- Managed by backend service

CREATE POLICY "System can update performance scores"
  ON performance_scores FOR UPDATE
  USING (true);

-- Category Scores Policies
CREATE POLICY "Users can view category scores"
  ON category_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM performance_scores ps
      INNER JOIN organization_members om ON ps.organization_id = om.organization_id
      WHERE ps.id = category_scores.performance_score_id
        AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage category scores"
  ON category_scores FOR ALL
  USING (true);

-- Score History Policies
CREATE POLICY "Users can view score history for their organization"
  ON performance_score_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid()
        AND om.organization_id = performance_score_history.organization_id
    )
  );

CREATE POLICY "System can insert score history"
  ON performance_score_history FOR INSERT
  WITH CHECK (true);

-- Peer Benchmarks are public (anonymized)
CREATE POLICY "Anyone can view peer benchmarks"
  ON peer_benchmarks FOR SELECT
  USING (true);

CREATE POLICY "System can manage peer benchmarks"
  ON peer_benchmarks FOR ALL
  USING (true);

-- Opportunities Policies
CREATE POLICY "Users can view opportunities for their organization"
  ON score_opportunities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM performance_scores ps
      INNER JOIN organization_members om ON ps.organization_id = om.organization_id
      WHERE ps.id = score_opportunities.performance_score_id
        AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update opportunity status"
  ON score_opportunities FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM performance_scores ps
      INNER JOIN organization_members om ON ps.organization_id = om.organization_id
      WHERE ps.id = score_opportunities.performance_score_id
        AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage opportunities"
  ON score_opportunities FOR ALL
  USING (true);

-- Best Practices Policies
CREATE POLICY "Users can view best practices for their organization"
  ON portfolio_best_practices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid()
        AND om.organization_id = portfolio_best_practices.organization_id
    )
  );

CREATE POLICY "System can manage best practices"
  ON portfolio_best_practices FOR ALL
  USING (true);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to automatically archive scores to history
CREATE OR REPLACE FUNCTION archive_performance_score()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO performance_score_history (
    site_id,
    organization_id,
    overall_score,
    category_scores,
    calculated_at
  )
  SELECT
    NEW.site_id,
    NEW.organization_id,
    NEW.overall_score,
    jsonb_object_agg(
      cs.category,
      jsonb_build_object(
        'rawScore', cs.raw_score,
        'weightedScore', cs.weighted_score,
        'weight', cs.weight,
        'percentile', cs.percentile,
        'trend', cs.trend
      )
    ),
    NEW.calculated_at
  FROM category_scores cs
  WHERE cs.performance_score_id = NEW.id
  GROUP BY NEW.site_id, NEW.organization_id, NEW.overall_score, NEW.calculated_at;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_archive_performance_score
  AFTER INSERT ON performance_scores
  FOR EACH ROW
  EXECUTE FUNCTION archive_performance_score();

-- Function to calculate peer percentile
CREATE OR REPLACE FUNCTION calculate_peer_percentile(
  p_score INTEGER,
  p_industry TEXT,
  p_category TEXT,
  p_size_range TEXT DEFAULT NULL,
  p_region TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_percentile INTEGER;
  v_median INTEGER;
  v_top_25 INTEGER;
  v_top_10 INTEGER;
BEGIN
  -- Get benchmark scores
  SELECT
    median_score,
    top_25_percentile_score,
    top_10_percentile_score
  INTO v_median, v_top_25, v_top_10
  FROM peer_benchmarks
  WHERE industry = p_industry
    AND category = p_category
    AND (p_size_range IS NULL OR size_range = p_size_range)
    AND (p_region IS NULL OR region = p_region)
  ORDER BY period_end DESC
  LIMIT 1;

  -- Calculate percentile based on position relative to benchmarks
  IF p_score >= v_top_10 THEN
    v_percentile := 90 + ((p_score - v_top_10) * 10 / (100 - v_top_10));
  ELSIF p_score >= v_top_25 THEN
    v_percentile := 75 + ((p_score - v_top_25) * 15 / (v_top_10 - v_top_25));
  ELSIF p_score >= v_median THEN
    v_percentile := 50 + ((p_score - v_median) * 25 / (v_top_25 - v_median));
  ELSE
    v_percentile := (p_score * 50 / v_median);
  END IF;

  RETURN GREATEST(0, LEAST(100, v_percentile));
END;
$$ LANGUAGE plpgsql;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_performance_scores_updated_at
  BEFORE UPDATE ON performance_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_peer_benchmarks_updated_at
  BEFORE UPDATE ON peer_benchmarks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_opportunities_updated_at
  BEFORE UPDATE ON score_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_best_practices_updated_at
  BEFORE UPDATE ON portfolio_best_practices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA (Sample Peer Benchmarks)
-- ============================================================================

-- Use INSERT ... ON CONFLICT to handle existing data
INSERT INTO peer_benchmarks (industry, size_range, region, category, median_score, top_10_percentile_score, top_25_percentile_score, bottom_25_percentile_score, sample_count, period_start, period_end)
VALUES
  -- ========== NORTH AMERICA ==========
  -- Overall benchmarks
  ('manufacturing', '10000-50000', 'Northeast US', 'overall', 62, 82, 75, 45, 150, '2024-01-01', '2024-12-31'),
  ('office', '10000-50000', 'Northeast US', 'overall', 68, 87, 78, 52, 300, '2024-01-01', '2024-12-31'),
  ('retail', '10000-50000', 'Northeast US', 'overall', 59, 79, 71, 43, 200, '2024-01-01', '2024-12-31'),

  -- Energy benchmarks
  ('manufacturing', '10000-50000', 'Northeast US', 'energy', 58, 80, 72, 42, 150, '2024-01-01', '2024-12-31'),
  ('office', '10000-50000', 'Northeast US', 'energy', 65, 85, 76, 48, 300, '2024-01-01', '2024-12-31'),
  ('retail', '10000-50000', 'Northeast US', 'energy', 55, 77, 68, 40, 200, '2024-01-01', '2024-12-31'),

  -- Water benchmarks
  ('manufacturing', '10000-50000', 'Northeast US', 'water', 60, 82, 74, 44, 150, '2024-01-01', '2024-12-31'),
  ('office', '10000-50000', 'Northeast US', 'water', 70, 88, 80, 55, 300, '2024-01-01', '2024-12-31'),
  ('retail', '10000-50000', 'Northeast US', 'water', 62, 80, 72, 48, 200, '2024-01-01', '2024-12-31'),

  -- ========== EUROPE ==========
  -- Overall benchmarks - Western Europe
  ('manufacturing', '10000-50000', 'Western Europe', 'overall', 65, 85, 78, 48, 180, '2024-01-01', '2024-12-31'),
  ('office', '10000-50000', 'Western Europe', 'overall', 72, 90, 82, 56, 350, '2024-01-01', '2024-12-31'),
  ('retail', '10000-50000', 'Western Europe', 'overall', 63, 82, 74, 47, 220, '2024-01-01', '2024-12-31'),
  ('hospitality', '10000-50000', 'Western Europe', 'overall', 60, 80, 72, 44, 150, '2024-01-01', '2024-12-31'),
  ('healthcare', '10000-50000', 'Western Europe', 'overall', 64, 84, 76, 48, 140, '2024-01-01', '2024-12-31'),

  -- Energy benchmarks - Western Europe
  ('manufacturing', '10000-50000', 'Western Europe', 'energy', 62, 84, 76, 45, 180, '2024-01-01', '2024-12-31'),
  ('office', '10000-50000', 'Western Europe', 'energy', 68, 88, 79, 52, 350, '2024-01-01', '2024-12-31'),
  ('retail', '10000-50000', 'Western Europe', 'energy', 59, 80, 71, 44, 220, '2024-01-01', '2024-12-31'),
  ('hospitality', '10000-50000', 'Western Europe', 'energy', 56, 78, 68, 40, 150, '2024-01-01', '2024-12-31'),
  ('healthcare', '10000-50000', 'Western Europe', 'energy', 60, 82, 73, 44, 140, '2024-01-01', '2024-12-31'),

  -- Water benchmarks - Western Europe
  ('manufacturing', '10000-50000', 'Western Europe', 'water', 64, 84, 76, 48, 180, '2024-01-01', '2024-12-31'),
  ('office', '10000-50000', 'Western Europe', 'water', 74, 92, 84, 60, 350, '2024-01-01', '2024-12-31'),
  ('retail', '10000-50000', 'Western Europe', 'water', 66, 84, 76, 52, 220, '2024-01-01', '2024-12-31'),
  ('hospitality', '10000-50000', 'Western Europe', 'water', 58, 80, 72, 44, 150, '2024-01-01', '2024-12-31'),
  ('healthcare', '10000-50000', 'Western Europe', 'water', 62, 82, 74, 46, 140, '2024-01-01', '2024-12-31'),

  -- Waste benchmarks - Western Europe (higher scores due to better recycling infrastructure)
  ('manufacturing', '10000-50000', 'Western Europe', 'waste', 68, 88, 80, 52, 180, '2024-01-01', '2024-12-31'),
  ('office', '10000-50000', 'Western Europe', 'waste', 72, 90, 82, 58, 350, '2024-01-01', '2024-12-31'),
  ('retail', '10000-50000', 'Western Europe', 'waste', 70, 88, 80, 54, 220, '2024-01-01', '2024-12-31'),
  ('hospitality', '10000-50000', 'Western Europe', 'waste', 65, 85, 76, 48, 150, '2024-01-01', '2024-12-31'),

  -- Transportation benchmarks - Western Europe (better public transport)
  ('office', '10000-50000', 'Western Europe', 'transportation', 70, 88, 80, 54, 350, '2024-01-01', '2024-12-31'),
  ('retail', '10000-50000', 'Western Europe', 'transportation', 66, 84, 76, 50, 220, '2024-01-01', '2024-12-31'),
  ('manufacturing', '10000-50000', 'Western Europe', 'transportation', 62, 80, 72, 46, 180, '2024-01-01', '2024-12-31'),

  -- Overall benchmarks - Southern Europe (Portugal, Spain, Italy, Greece)
  ('office', '10000-50000', 'Southern Europe', 'overall', 64, 84, 76, 48, 250, '2024-01-01', '2024-12-31'),
  ('manufacturing', '10000-50000', 'Southern Europe', 'overall', 60, 80, 72, 44, 160, '2024-01-01', '2024-12-31'),
  ('retail', '10000-50000', 'Southern Europe', 'overall', 58, 78, 70, 42, 190, '2024-01-01', '2024-12-31'),
  ('hospitality', '10000-50000', 'Southern Europe', 'overall', 62, 82, 74, 46, 200, '2024-01-01', '2024-12-31'),

  -- Energy benchmarks - Southern Europe
  ('office', '10000-50000', 'Southern Europe', 'energy', 60, 82, 74, 44, 250, '2024-01-01', '2024-12-31'),
  ('manufacturing', '10000-50000', 'Southern Europe', 'energy', 56, 78, 70, 40, 160, '2024-01-01', '2024-12-31'),
  ('retail', '10000-50000', 'Southern Europe', 'energy', 54, 76, 68, 38, 190, '2024-01-01', '2024-12-31'),
  ('hospitality', '10000-50000', 'Southern Europe', 'energy', 58, 80, 72, 42, 200, '2024-01-01', '2024-12-31'),

  -- Water benchmarks - Southern Europe (water scarcity concerns = higher focus)
  ('office', '10000-50000', 'Southern Europe', 'water', 66, 86, 78, 50, 250, '2024-01-01', '2024-12-31'),
  ('manufacturing', '10000-50000', 'Southern Europe', 'water', 62, 82, 74, 46, 160, '2024-01-01', '2024-12-31'),
  ('hospitality', '10000-50000', 'Southern Europe', 'water', 60, 80, 72, 44, 200, '2024-01-01', '2024-12-31'),

  -- Overall benchmarks - Nordic Countries (Sweden, Norway, Denmark, Finland)
  ('office', '10000-50000', 'Nordic Europe', 'overall', 75, 92, 85, 60, 200, '2024-01-01', '2024-12-31'),
  ('manufacturing', '10000-50000', 'Nordic Europe', 'overall', 70, 88, 80, 54, 140, '2024-01-01', '2024-12-31'),
  ('retail', '10000-50000', 'Nordic Europe', 'overall', 68, 86, 78, 52, 160, '2024-01-01', '2024-12-31'),

  -- Energy benchmarks - Nordic (highest scores - renewable energy leaders)
  ('office', '10000-50000', 'Nordic Europe', 'energy', 72, 90, 82, 58, 200, '2024-01-01', '2024-12-31'),
  ('manufacturing', '10000-50000', 'Nordic Europe', 'energy', 68, 86, 78, 52, 140, '2024-01-01', '2024-12-31'),
  ('retail', '10000-50000', 'Nordic Europe', 'energy', 65, 84, 76, 50, 160, '2024-01-01', '2024-12-31')
ON CONFLICT (industry, size_range, region, category, period_start, period_end)
DO UPDATE SET
  median_score = EXCLUDED.median_score,
  top_10_percentile_score = EXCLUDED.top_10_percentile_score,
  top_25_percentile_score = EXCLUDED.top_25_percentile_score,
  bottom_25_percentile_score = EXCLUDED.bottom_25_percentile_score,
  sample_count = EXCLUDED.sample_count,
  calculated_at = NOW(),
  updated_at = NOW();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE performance_scores IS 'Blipee Performance Index™ - Overall site and portfolio scores';
COMMENT ON TABLE category_scores IS 'Detailed breakdown by category (Energy, Water, Waste, etc.)';
COMMENT ON TABLE performance_score_history IS 'Time-series historical data for trend analysis and ML';
COMMENT ON TABLE peer_benchmarks IS 'Anonymous peer comparison data by industry/size/region';
COMMENT ON TABLE score_opportunities IS 'AI-generated improvement recommendations';
COMMENT ON TABLE portfolio_best_practices IS 'Cross-site learning and best practice sharing';

COMMENT ON COLUMN performance_scores.improvement_velocity IS 'Rate of improvement: -100 (rapid decline) to +100 (rapid improvement)';
COMMENT ON COLUMN performance_scores.peer_percentile IS 'Percentile ranking vs industry peers (0-100)';
COMMENT ON COLUMN category_scores.trend_value IS 'Points per month improvement rate';
COMMENT ON COLUMN score_opportunities.payback_months IS 'NULL indicates immediate payback';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Grant permissions to service role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
