-- ============================================================================
-- SBTI (SCIENCE BASED TARGETS INITIATIVE) SYSTEM
-- ============================================================================
-- This migration creates the SBTi target setting and tracking system
-- Supports both near-term (5-10 years) and long-term (net-zero ≤2050) targets
-- Based on SBTi Corporate Near-Term Criteria V5.3 and Net-Zero Standard V1.3
-- ============================================================================

-- Create enum types
CREATE TYPE sbti_target_type AS ENUM (
  'near_term',    -- 5-10 year targets
  'long_term'     -- Net-zero targets (≤2050)
);

CREATE TYPE sbti_target_scope AS ENUM (
  'scope1',
  'scope1_2',
  'scope3',
  'scope1_2_3'
);

CREATE TYPE sbti_target_method AS ENUM (
  'absolute_contraction',
  'sda',                      -- Sectoral Decarbonization Approach
  're_procurement',           -- Renewable Energy procurement
  'physical_intensity',
  'economic_intensity'
);

CREATE TYPE sbti_ambition_level AS ENUM (
  '1.5C',
  'well_below_2C',
  '2C'
);

CREATE TYPE sbti_validation_status AS ENUM (
  'draft',
  'submitted',
  'validated',
  'rejected',
  'needs_recalculation'
);

CREATE TYPE sbti_sector AS ENUM (
  'cross_sector',
  'buildings',
  'flag',                     -- Forest, Land and Agriculture
  'power_generation',
  'cement',
  'iron_steel',
  'aluminum',
  'pulp_paper',
  'transport',
  'financial_institutions',
  'oil_gas'
);

-- ============================================================================
-- SBTI PATHWAYS TABLE (Reference data from IEA scenarios)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sbti_pathways (
  id SERIAL PRIMARY KEY,
  scenario VARCHAR(20) NOT NULL,          -- 'SBTi_1.5C', 'ETP_B2DS', 'NZE2021'
  sector sbti_sector NOT NULL,
  region VARCHAR(50) DEFAULT 'World',
  metric_type VARCHAR(20) NOT NULL,       -- 'Emissions', 'Activity', 'Intensity'
  unit VARCHAR(20) NOT NULL,              -- 'MtCO2', 'tCO2e/t', 'tCO2e/MWh'
  year INTEGER NOT NULL CHECK (year >= 2014 AND year <= 2050),
  value NUMERIC NOT NULL,

  -- Metadata
  data_source VARCHAR(100),               -- 'IEA ETP 2020', 'IEA NZE 2021'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(scenario, sector, region, metric_type, unit, year)
);

-- Indexes for fast pathway lookups
CREATE INDEX idx_pathways_lookup ON sbti_pathways(scenario, sector, year);
CREATE INDEX idx_pathways_sector_year ON sbti_pathways(sector, year);

-- ============================================================================
-- SBTI CRITERIA TABLE (Versioned validation rules)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sbti_criteria (
  id SERIAL PRIMARY KEY,
  version VARCHAR(10) NOT NULL,           -- '5.3', '1.3'
  criteria_type sbti_target_type NOT NULL,
  criterion_code VARCHAR(10) NOT NULL,    -- 'C1', 'C2', ..., 'C28'
  criterion_name VARCHAR(200),
  criterion_description TEXT,
  validation_rule JSONB,                  -- Structured validation logic
  is_mandatory BOOLEAN DEFAULT true,

  -- Versioning
  effective_date DATE,
  deprecated_date DATE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(version, criteria_type, criterion_code)
);

CREATE INDEX idx_criteria_version ON sbti_criteria(version, criteria_type);

-- ============================================================================
-- SBTI SECTOR THRESHOLDS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS sbti_sector_thresholds (
  id SERIAL PRIMARY KEY,
  sector sbti_sector NOT NULL,
  threshold_type VARCHAR(50) NOT NULL,    -- 'emissions_percentage', 'revenue_percentage'
  threshold_value NUMERIC NOT NULL,
  threshold_unit VARCHAR(20),             -- '%', 'absolute'
  requirement_description TEXT,
  applies_to VARCHAR(20),                 -- 'near_term', 'long_term', 'both'

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(sector, threshold_type)
);

-- ============================================================================
-- SBTI TARGETS TABLE (Organization's targets)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sbti_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Target configuration
  target_type sbti_target_type NOT NULL,
  scope sbti_target_scope NOT NULL,
  method sbti_target_method NOT NULL,

  -- Timeline
  base_year INTEGER NOT NULL CHECK (base_year >= 2015 AND base_year <= 2030),
  target_year INTEGER NOT NULL,
  submission_date DATE,
  validation_date DATE,
  validation_status sbti_validation_status DEFAULT 'draft',

  -- Ambition
  ambition_level sbti_ambition_level NOT NULL,

  -- Coverage (percentage of emissions included in target)
  coverage_scope1_2_pct NUMERIC CHECK (coverage_scope1_2_pct >= 0 AND coverage_scope1_2_pct <= 100),
  coverage_scope3_pct NUMERIC CHECK (coverage_scope3_pct >= 0 AND coverage_scope3_pct <= 100),

  -- Base year emissions (tCO2e)
  base_year_scope1 NUMERIC,
  base_year_scope2_location NUMERIC,
  base_year_scope2_market NUMERIC,
  base_year_scope3 NUMERIC,
  base_year_biogenic_net NUMERIC,         -- C10: Net biogenic CO2 (releases - removals)
  base_year_total NUMERIC,

  -- Target year emissions (tCO2e)
  target_year_scope1 NUMERIC,
  target_year_scope2 NUMERIC,
  target_year_scope3 NUMERIC,
  target_year_total NUMERIC,

  -- Reduction metrics
  reduction_percentage NUMERIC,           -- Total reduction %
  annual_reduction_rate NUMERIC,          -- tCO2e per year or % per year
  reduction_method VARCHAR(20),           -- 'linear', 'exponential'

  -- Activity metrics (for intensity methods)
  activity_metric VARCHAR(50),            -- 'revenue', 'production', 'floor_area', 'mwh'
  activity_unit VARCHAR(50),              -- 'USD', 'tonnes', 'm2', 'MWh'
  base_year_activity NUMERIC,
  target_year_activity NUMERIC,
  base_year_intensity NUMERIC,            -- tCO2e per activity unit
  target_year_intensity NUMERIC,

  -- Sector-specific
  sector_pathway sbti_sector DEFAULT 'cross_sector',
  sector_requirements JSONB DEFAULT '{}', -- {flag_disaggregated: true, ...}

  -- Scope 3 category breakdown (for 67%/90% coverage validation)
  scope3_categories JSONB DEFAULT '{}',   -- {category_1: 30000, category_2: 5000, ...}

  -- Neutralization (for net-zero targets - C28)
  residual_emissions NUMERIC,             -- Expected residual at target year
  neutralization_method VARCHAR(50),      -- 'DACCS', 'BECCS', 'enhanced_weathering'
  neutralization_volume NUMERIC,          -- tCO2e per year to neutralize
  neutralization_permanence VARCHAR(20),  -- '>100_years'
  neutralization_plan TEXT,

  -- Validation results
  validation_results JSONB DEFAULT '{}',  -- {C1: 'pass', C2: 'pass', C6: 'fail', ...}
  validation_errors TEXT[],
  validation_warnings TEXT[],

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Constraints
  CONSTRAINT target_year_after_base CHECK (target_year > base_year),
  CONSTRAINT near_term_timeframe CHECK (
    (target_type = 'near_term' AND target_year - base_year BETWEEN 5 AND 10)
    OR target_type = 'long_term'
  ),
  CONSTRAINT long_term_deadline CHECK (
    (target_type = 'long_term' AND target_year <= 2050)
    OR target_type = 'near_term'
  ),
  CONSTRAINT coverage_s1_2 CHECK (
    (scope IN ('scope1', 'scope1_2', 'scope1_2_3') AND coverage_scope1_2_pct >= 95)
    OR scope = 'scope3'
  ),
  CONSTRAINT coverage_s3_near_term CHECK (
    (target_type = 'near_term' AND scope IN ('scope3', 'scope1_2_3') AND coverage_scope3_pct >= 67)
    OR (target_type = 'long_term' AND scope IN ('scope3', 'scope1_2_3') AND coverage_scope3_pct >= 90)
    OR scope IN ('scope1', 'scope1_2')
  ),
  CONSTRAINT s12_ambition_15c CHECK (
    (scope IN ('scope1', 'scope1_2', 'scope1_2_3') AND ambition_level = '1.5C')
    OR scope = 'scope3'
  )
);

-- Indexes
CREATE INDEX idx_sbti_targets_organization ON sbti_targets(organization_id);
CREATE INDEX idx_sbti_targets_status ON sbti_targets(validation_status);
CREATE INDEX idx_sbti_targets_type ON sbti_targets(target_type);
CREATE INDEX idx_sbti_targets_base_year ON sbti_targets(base_year);
CREATE INDEX idx_sbti_targets_target_year ON sbti_targets(target_year);

-- ============================================================================
-- SBTI PROGRESS TRACKING TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS sbti_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id UUID NOT NULL REFERENCES sbti_targets(id) ON DELETE CASCADE,
  reporting_year INTEGER NOT NULL,

  -- Actual emissions (tCO2e)
  actual_scope1 NUMERIC,
  actual_scope2 NUMERIC,
  actual_scope3 NUMERIC,
  actual_total NUMERIC,
  actual_biogenic_net NUMERIC,

  -- Target trajectory (expected emissions for this year)
  target_trajectory NUMERIC,

  -- Variance analysis
  variance NUMERIC,                       -- actual - trajectory (negative is good)
  variance_percentage NUMERIC,            -- (actual - trajectory) / trajectory * 100
  on_track BOOLEAN,                       -- TRUE if variance within acceptable range (±5%)

  -- Progress percentage (0-100%)
  progress_percentage NUMERIC CHECK (progress_percentage >= 0 AND progress_percentage <= 100),

  -- Notes and explanations
  notes TEXT,
  explanations JSONB DEFAULT '{}',        -- Structured explanations for variances

  -- Metadata
  reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  UNIQUE(target_id, reporting_year)
);

-- Indexes
CREATE INDEX idx_sbti_progress_target ON sbti_progress(target_id);
CREATE INDEX idx_sbti_progress_year ON sbti_progress(reporting_year);
CREATE INDEX idx_sbti_progress_on_track ON sbti_progress(on_track);

-- ============================================================================
-- SBTI RECALCULATIONS TABLE (C26 - tracks base year recalculations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sbti_recalculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id UUID NOT NULL REFERENCES sbti_targets(id) ON DELETE CASCADE,

  -- Recalculation reason
  recalculation_reason VARCHAR(50) NOT NULL, -- 'merger', 'acquisition', 'divestiture', 'methodology_change', 'error_correction'
  reason_description TEXT,

  -- Change magnitude
  change_percentage NUMERIC,              -- Must be >5% to trigger C26 mandatory recalculation
  triggers_resubmission BOOLEAN,          -- TRUE if change >5%

  -- Old values
  old_base_year INTEGER,
  old_base_emissions NUMERIC,
  old_target_emissions NUMERIC,

  -- New values
  new_base_year INTEGER,
  new_base_emissions NUMERIC,
  new_target_emissions NUMERIC,

  -- Justification (required by SBTi)
  justification TEXT NOT NULL,
  supporting_documents TEXT[],            -- URLs or file paths

  -- Metadata
  recalculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  recalculated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_sbti_recalculations_target ON sbti_recalculations(target_id);
CREATE INDEX idx_sbti_recalculations_reason ON sbti_recalculations(recalculation_reason);

-- ============================================================================
-- SBTI NEUTRALIZATION COMMITMENTS TABLE (for net-zero targets)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sbti_neutralization_commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id UUID NOT NULL REFERENCES sbti_targets(id) ON DELETE CASCADE,

  -- Commitment details
  commitment_year INTEGER NOT NULL,
  cdr_volume NUMERIC NOT NULL,            -- tCO2e to remove via Carbon Dioxide Removal
  cdr_method VARCHAR(50) NOT NULL,        -- 'DACCS', 'BECCS', 'enhanced_weathering', 'biochar'
  permanence VARCHAR(20) NOT NULL,        -- '>100_years', 'geological_storage', 'mineralization'

  -- Financial planning
  cost_per_tonne NUMERIC,                 -- Estimated $/tCO2e
  total_cost NUMERIC,                     -- cdr_volume * cost_per_tonne
  budget_allocated NUMERIC,

  -- Status
  status VARCHAR(20) DEFAULT 'planned',   -- 'planned', 'contracted', 'delivered', 'verified'
  contract_details TEXT,
  verification_standard VARCHAR(100),     -- 'Gold Standard', 'Verra VCS', etc.

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  UNIQUE(target_id, commitment_year)
);

-- Index
CREATE INDEX idx_sbti_neutralization_target ON sbti_neutralization_commitments(target_id);
CREATE INDEX idx_sbti_neutralization_year ON sbti_neutralization_commitments(commitment_year);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE sbti_pathways ENABLE ROW LEVEL SECURITY;
ALTER TABLE sbti_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE sbti_sector_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE sbti_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE sbti_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE sbti_recalculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sbti_neutralization_commitments ENABLE ROW LEVEL SECURITY;

-- Pathways: Public read access (reference data)
CREATE POLICY "Anyone can view SBTi pathways"
  ON sbti_pathways FOR SELECT
  USING (true);

-- Criteria: Public read access (reference data)
CREATE POLICY "Anyone can view SBTi criteria"
  ON sbti_criteria FOR SELECT
  USING (true);

-- Sector thresholds: Public read access (reference data)
CREATE POLICY "Anyone can view sector thresholds"
  ON sbti_sector_thresholds FOR SELECT
  USING (true);

-- Targets: Organization members can view
CREATE POLICY "Users can view targets for their organization"
  ON sbti_targets FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
  );

-- Targets: Authorized users can create
CREATE POLICY "Authorized users can create targets"
  ON sbti_targets FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
        AND deleted_at IS NULL
        AND role IN ('account_owner', 'admin', 'sustainability_manager', 'sustainability_lead')
    )
  );

-- Targets: Authorized users can update
CREATE POLICY "Authorized users can update targets"
  ON sbti_targets FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
        AND deleted_at IS NULL
        AND role IN ('account_owner', 'admin', 'sustainability_manager', 'sustainability_lead')
    )
  );

-- Targets: Authorized users can delete drafts
CREATE POLICY "Authorized users can delete draft targets"
  ON sbti_targets FOR DELETE
  USING (
    validation_status = 'draft'
    AND organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
        AND deleted_at IS NULL
        AND role IN ('account_owner', 'admin', 'sustainability_manager', 'sustainability_lead')
    )
  );

-- Progress: Similar policies for progress tracking
CREATE POLICY "Users can view progress for their organization"
  ON sbti_progress FOR SELECT
  USING (
    target_id IN (
      SELECT id FROM sbti_targets
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND deleted_at IS NULL
      )
    )
  );

CREATE POLICY "Authorized users can manage progress"
  ON sbti_progress FOR ALL
  USING (
    target_id IN (
      SELECT id FROM sbti_targets
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
          AND deleted_at IS NULL
          AND role IN ('account_owner', 'admin', 'sustainability_manager', 'sustainability_lead', 'data_entry')
      )
    )
  );

-- Recalculations: Similar policies
CREATE POLICY "Users can view recalculations for their organization"
  ON sbti_recalculations FOR SELECT
  USING (
    target_id IN (
      SELECT id FROM sbti_targets
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND deleted_at IS NULL
      )
    )
  );

CREATE POLICY "Authorized users can manage recalculations"
  ON sbti_recalculations FOR ALL
  USING (
    target_id IN (
      SELECT id FROM sbti_targets
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
          AND deleted_at IS NULL
          AND role IN ('account_owner', 'admin', 'sustainability_manager', 'sustainability_lead')
      )
    )
  );

-- Neutralization: Similar policies
CREATE POLICY "Users can view neutralization for their organization"
  ON sbti_neutralization_commitments FOR SELECT
  USING (
    target_id IN (
      SELECT id FROM sbti_targets
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND deleted_at IS NULL
      )
    )
  );

CREATE POLICY "Authorized users can manage neutralization"
  ON sbti_neutralization_commitments FOR ALL
  USING (
    target_id IN (
      SELECT id FROM sbti_targets
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
          AND deleted_at IS NULL
          AND role IN ('account_owner', 'admin', 'sustainability_manager', 'sustainability_lead')
      )
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE TRIGGER update_sbti_pathways_updated_at
  BEFORE UPDATE ON sbti_pathways
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sbti_targets_updated_at
  BEFORE UPDATE ON sbti_targets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sbti_neutralization_updated_at
  BEFORE UPDATE ON sbti_neutralization_commitments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-calculate total emissions before insert/update
CREATE OR REPLACE FUNCTION calculate_sbti_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate base year total
  NEW.base_year_total := COALESCE(NEW.base_year_scope1, 0) +
                          COALESCE(NEW.base_year_scope2_market, NEW.base_year_scope2_location, 0) +
                          COALESCE(NEW.base_year_scope3, 0);

  -- Calculate target year total
  NEW.target_year_total := COALESCE(NEW.target_year_scope1, 0) +
                            COALESCE(NEW.target_year_scope2, 0) +
                            COALESCE(NEW.target_year_scope3, 0);

  -- Calculate reduction percentage
  IF NEW.base_year_total > 0 THEN
    NEW.reduction_percentage := ((NEW.base_year_total - NEW.target_year_total) / NEW.base_year_total) * 100;
  END IF;

  -- Calculate annual reduction rate
  IF NEW.target_year > NEW.base_year THEN
    NEW.annual_reduction_rate := (NEW.base_year_total - NEW.target_year_total) / (NEW.target_year - NEW.base_year);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sbti_targets_calculate_totals
  BEFORE INSERT OR UPDATE ON sbti_targets
  FOR EACH ROW
  EXECUTE FUNCTION calculate_sbti_totals();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get SBTi targets summary for an organization
CREATE OR REPLACE FUNCTION get_sbti_summary(p_organization_id UUID)
RETURNS TABLE (
  total_targets BIGINT,
  validated_targets BIGINT,
  draft_targets BIGINT,
  near_term_targets BIGINT,
  long_term_targets BIGINT,
  total_base_emissions NUMERIC,
  total_target_emissions NUMERIC,
  average_reduction_pct NUMERIC,
  on_track_count BIGINT,
  at_risk_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT t.id) AS total_targets,
    COUNT(DISTINCT t.id) FILTER (WHERE t.validation_status = 'validated') AS validated_targets,
    COUNT(DISTINCT t.id) FILTER (WHERE t.validation_status = 'draft') AS draft_targets,
    COUNT(DISTINCT t.id) FILTER (WHERE t.target_type = 'near_term') AS near_term_targets,
    COUNT(DISTINCT t.id) FILTER (WHERE t.target_type = 'long_term') AS long_term_targets,
    SUM(t.base_year_total) AS total_base_emissions,
    SUM(t.target_year_total) AS total_target_emissions,
    AVG(t.reduction_percentage) AS average_reduction_pct,
    COUNT(DISTINCT p.target_id) FILTER (WHERE p.on_track = TRUE) AS on_track_count,
    COUNT(DISTINCT p.target_id) FILTER (WHERE p.on_track = FALSE) AS at_risk_count
  FROM sbti_targets t
  LEFT JOIN sbti_progress p ON p.target_id = t.id
  WHERE t.organization_id = p_organization_id;
END;
$$ LANGUAGE plpgsql;

-- Calculate if org meets sector threshold
CREATE OR REPLACE FUNCTION check_sector_threshold(
  p_organization_id UUID,
  p_sector sbti_sector,
  p_sector_emissions NUMERIC,
  p_total_emissions NUMERIC
)
RETURNS BOOLEAN AS $$
DECLARE
  v_threshold NUMERIC;
  v_percentage NUMERIC;
BEGIN
  -- Get threshold for sector
  SELECT threshold_value INTO v_threshold
  FROM sbti_sector_thresholds
  WHERE sector = p_sector AND threshold_type = 'emissions_percentage'
  LIMIT 1;

  IF v_threshold IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Calculate percentage
  IF p_total_emissions > 0 THEN
    v_percentage := (p_sector_emissions / p_total_emissions) * 100;
    RETURN v_percentage >= v_threshold;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Get pathway value for a specific year (with interpolation)
CREATE OR REPLACE FUNCTION get_pathway_value(
  p_scenario VARCHAR(20),
  p_sector sbti_sector,
  p_year INTEGER
)
RETURNS NUMERIC AS $$
DECLARE
  v_value NUMERIC;
  v_lower_year INTEGER;
  v_upper_year INTEGER;
  v_lower_value NUMERIC;
  v_upper_value NUMERIC;
  v_weight NUMERIC;
BEGIN
  -- Try direct lookup first
  SELECT value INTO v_value
  FROM sbti_pathways
  WHERE scenario = p_scenario
    AND sector = p_sector
    AND year = p_year
    AND metric_type = 'Emissions'
  LIMIT 1;

  IF v_value IS NOT NULL THEN
    RETURN v_value;
  END IF;

  -- Interpolate if not found
  SELECT year, value INTO v_lower_year, v_lower_value
  FROM sbti_pathways
  WHERE scenario = p_scenario
    AND sector = p_sector
    AND year < p_year
    AND metric_type = 'Emissions'
  ORDER BY year DESC
  LIMIT 1;

  SELECT year, value INTO v_upper_year, v_upper_value
  FROM sbti_pathways
  WHERE scenario = p_scenario
    AND sector = p_sector
    AND year > p_year
    AND metric_type = 'Emissions'
  ORDER BY year ASC
  LIMIT 1;

  IF v_lower_value IS NOT NULL AND v_upper_value IS NOT NULL THEN
    v_weight := (p_year - v_lower_year)::NUMERIC / (v_upper_year - v_lower_year)::NUMERIC;
    RETURN v_lower_value + (v_upper_value - v_lower_value) * v_weight;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
