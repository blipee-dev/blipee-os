-- Compliance Framework Extensions
-- Implements ESRS E1, TCFD, GRI interoperability, and enhanced GHG Protocol compliance

-- 1. Organization Inventory Settings (ESRS 2 / GHG Protocol requirements)
CREATE TABLE IF NOT EXISTS organization_inventory_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Organizational Boundaries (GHG Protocol)
  consolidation_approach TEXT NOT NULL CHECK (consolidation_approach IN ('equity_share', 'financial_control', 'operational_control')),
  consolidation_percentage DECIMAL, -- For equity share approach

  -- Gases Covered (GHG Protocol)
  gases_covered TEXT[] DEFAULT ARRAY['CO2', 'CH4', 'N2O', 'HFCs', 'PFCs', 'SF6', 'NF3'],

  -- Base Year
  base_year INTEGER NOT NULL,
  base_year_rationale TEXT,
  base_year_recalculation_policy TEXT,
  base_year_significance_threshold DECIMAL DEFAULT 5.0, -- % change threshold for recalculation

  -- Reporting Period
  reporting_period_start DATE NOT NULL,
  reporting_period_end DATE NOT NULL,

  -- Assurance
  assurance_level TEXT CHECK (assurance_level IN ('none', 'limited', 'reasonable')),
  assurance_provider TEXT,
  assurance_date DATE,
  assurance_scope TEXT[],

  -- Methodology
  gwp_version TEXT DEFAULT 'AR6', -- IPCC Assessment Report version
  calculation_tools TEXT[],

  -- Double Materiality (ESRS 2)
  materiality_assessment_date DATE,
  material_topics JSONB DEFAULT '[]',
  stakeholder_engagement JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id)
);

-- 2. Scope 2 Instruments (for dual reporting)
CREATE TABLE IF NOT EXISTS scope2_instruments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  metrics_data_id UUID REFERENCES metrics_data(id) ON DELETE CASCADE,

  -- Instrument Details
  instrument_type TEXT NOT NULL CHECK (instrument_type IN ('go', 'rec', 'ppa', 'contract', 'supplier_specific')),
  instrument_name TEXT,
  certificate_id TEXT,
  vintage_year INTEGER,

  -- Quality Assessment (GHG Protocol Scope 2 Guidance criteria)
  quality_criteria JSONB DEFAULT '{}', -- Track all 5 quality criteria
  quality_score DECIMAL, -- 0-1 scale
  quality_grade TEXT CHECK (quality_grade IN ('A', 'B', 'C', 'D')),

  -- Quantities
  mwh_covered DECIMAL NOT NULL,
  emission_factor DECIMAL, -- kgCO2e/kWh for this specific instrument

  -- Validity
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,

  -- Documentation
  evidence_url TEXT,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Emissions Adjustments (for gross vs net separation - ESRS requirement)
CREATE TABLE IF NOT EXISTS emissions_adjustments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Adjustment Type
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('removal', 'offset', 'credit', 'sequestration')),
  scope TEXT CHECK (scope IN ('scope_1', 'scope_2', 'scope_3')),

  -- Quantities (in tCO2e)
  co2e_amount DECIMAL NOT NULL,

  -- Details
  project_name TEXT,
  project_id TEXT,
  certification_standard TEXT, -- e.g., 'VCS', 'Gold Standard', 'CDM'
  vintage_year INTEGER,
  retirement_date DATE,

  -- Classification
  nature_based BOOLEAN DEFAULT false,
  technological BOOLEAN DEFAULT false,
  permanent BOOLEAN DEFAULT false,

  -- Evidence
  evidence_url TEXT,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ESRS E1 Disclosures
CREATE TABLE IF NOT EXISTS esrs_e1_disclosures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  reporting_year INTEGER NOT NULL,

  -- E1-1: Transition Plan
  transition_plan JSONB,
  transition_plan_updated_at DATE,

  -- E1-2: Policies
  climate_policies JSONB,

  -- E1-3: Actions and Resources
  mitigation_actions JSONB,
  adaptation_actions JSONB,
  capex_green DECIMAL,
  opex_green DECIMAL,

  -- E1-4: Targets
  targets JSONB,

  -- E1-5: Energy Consumption
  energy_consumption JSONB,

  -- E1-6: Gross Scopes 1, 2, 3 and Total GHG emissions
  scope_1_gross DECIMAL,
  scope_2_gross_lb DECIMAL,
  scope_2_gross_mb DECIMAL,
  scope_3_gross DECIMAL,
  total_gross DECIMAL,

  -- E1-7: GHG Removals and Carbon Credits
  removals_total DECIMAL,
  credits_total DECIMAL,

  -- E1-8: Internal Carbon Pricing
  carbon_price_used DECIMAL,
  carbon_price_currency TEXT,

  -- E1-9: Anticipated Financial Effects
  financial_effects_mitigation JSONB,
  financial_effects_adaptation JSONB,
  opportunities JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, reporting_year)
);

-- 5. TCFD Disclosures
CREATE TABLE IF NOT EXISTS tcfd_disclosures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  reporting_year INTEGER NOT NULL,

  -- Governance
  board_oversight JSONB,
  management_role JSONB,

  -- Strategy
  climate_risks JSONB, -- Physical and transition risks
  climate_opportunities JSONB,
  scenario_analysis JSONB, -- 1.5°C, 2°C, etc.
  business_strategy_impact JSONB,

  -- Risk Management
  risk_identification_process JSONB,
  risk_management_process JSONB,
  integration_with_erm JSONB,

  -- Metrics and Targets
  metrics JSONB,
  targets JSONB,
  executive_remuneration_link JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, reporting_year)
);

-- 6. Framework Interoperability Mapping
CREATE TABLE IF NOT EXISTS framework_mappings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Source
  metric_id UUID REFERENCES metrics_catalog(id),
  datapoint_code TEXT, -- e.g., "E1-6.1", "GRI 305-1"

  -- Framework Cross-References
  gri_codes TEXT[], -- e.g., ["305-1", "305-2"]
  esrs_codes TEXT[], -- e.g., ["E1-6"]
  tcfd_references TEXT[], -- e.g., ["Strategy c", "Metrics a"]
  ifrs_s2_codes TEXT[], -- e.g., ["29", "30"]

  -- Metadata
  description TEXT,
  calculation_method TEXT,
  unit TEXT,
  data_quality_requirements TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Scenario Analysis (TCFD/ESRS requirement)
CREATE TABLE IF NOT EXISTS climate_scenarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Scenario Definition
  scenario_name TEXT NOT NULL, -- e.g., "IEA NZE 2050", "IPCC SSP1-1.9"
  scenario_type TEXT CHECK (scenario_type IN ('physical', 'transition', 'combined')),
  temperature_pathway DECIMAL, -- e.g., 1.5, 2.0
  time_horizon INTEGER, -- years

  -- Impacts
  physical_impacts JSONB,
  transition_impacts JSONB,
  financial_impact_low DECIMAL,
  financial_impact_high DECIMAL,
  impact_currency TEXT,

  -- Resilience Assessment
  resilience_measures JSONB,
  adaptation_costs DECIMAL,

  analysis_date DATE,
  next_review_date DATE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Enhanced Emission Factors with Full Transparency
ALTER TABLE emission_factors ADD COLUMN IF NOT EXISTS version TEXT;
ALTER TABLE emission_factors ADD COLUMN IF NOT EXISTS published_date DATE;
ALTER TABLE emission_factors ADD COLUMN IF NOT EXISTS methodology TEXT;
ALTER TABLE emission_factors ADD COLUMN IF NOT EXISTS uncertainty_range DECIMAL;
ALTER TABLE emission_factors ADD COLUMN IF NOT EXISTS geographic_scope TEXT;

-- 9. Add Scope 2 method tracking to metrics_data
ALTER TABLE metrics_data ADD COLUMN IF NOT EXISTS scope2_method TEXT CHECK (scope2_method IN ('location_based', 'market_based'));
ALTER TABLE metrics_data ADD COLUMN IF NOT EXISTS calculation_method TEXT;
ALTER TABLE metrics_data ADD COLUMN IF NOT EXISTS data_source_type TEXT CHECK (data_source_type IN ('primary', 'secondary', 'modeled', 'proxy', 'industry_average'));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_scope2_instruments_org ON scope2_instruments(organization_id);
CREATE INDEX IF NOT EXISTS idx_emissions_adjustments_org ON emissions_adjustments(organization_id);
CREATE INDEX IF NOT EXISTS idx_esrs_disclosures_org_year ON esrs_e1_disclosures(organization_id, reporting_year);
CREATE INDEX IF NOT EXISTS idx_tcfd_disclosures_org_year ON tcfd_disclosures(organization_id, reporting_year);
CREATE INDEX IF NOT EXISTS idx_framework_mappings_metric ON framework_mappings(metric_id);

-- Enable RLS
ALTER TABLE organization_inventory_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE scope2_instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE emissions_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE esrs_e1_disclosures ENABLE ROW LEVEL SECURITY;
ALTER TABLE tcfd_disclosures ENABLE ROW LEVEL SECURITY;
ALTER TABLE climate_scenarios ENABLE ROW LEVEL SECURITY;

-- RLS Policies (same pattern as existing tables)
CREATE POLICY "Users can view their organization's inventory settings" ON organization_inventory_settings
  FOR SELECT USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can manage inventory settings" ON organization_inventory_settings
  FOR ALL USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = auth.uid() AND om.role IN ('account_owner', 'sustainability_manager')
    )
  );

CREATE POLICY "Users can view their organization's scope2 instruments" ON scope2_instruments
  FOR SELECT USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their organization's adjustments" ON emissions_adjustments
  FOR SELECT USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their organization's ESRS disclosures" ON esrs_e1_disclosures
  FOR SELECT USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their organization's TCFD disclosures" ON tcfd_disclosures
  FOR SELECT USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their organization's scenarios" ON climate_scenarios
  FOR SELECT USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om WHERE om.user_id = auth.uid()
    )
  );

-- Update timestamp triggers
CREATE TRIGGER update_inventory_settings_timestamp
  BEFORE UPDATE ON organization_inventory_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scope2_instruments_timestamp
  BEFORE UPDATE ON scope2_instruments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emissions_adjustments_timestamp
  BEFORE UPDATE ON emissions_adjustments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_esrs_disclosures_timestamp
  BEFORE UPDATE ON esrs_e1_disclosures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tcfd_disclosures_timestamp
  BEFORE UPDATE ON tcfd_disclosures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_climate_scenarios_timestamp
  BEFORE UPDATE ON climate_scenarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed default inventory settings for existing organizations
INSERT INTO organization_inventory_settings (
  organization_id,
  consolidation_approach,
  base_year,
  base_year_rationale,
  reporting_period_start,
  reporting_period_end,
  assurance_level
)
SELECT
  id,
  'operational_control',
  2024,
  'First complete year of data collection',
  '2024-01-01',
  '2024-12-31',
  'none'
FROM organizations
WHERE NOT EXISTS (
  SELECT 1 FROM organization_inventory_settings WHERE organization_id = organizations.id
);
