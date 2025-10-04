-- GHG Protocol Inventory Settings
-- Stores organizational and operational boundary definitions, base year, reporting period, etc.

CREATE TABLE IF NOT EXISTS ghg_inventory_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  reporting_year INTEGER NOT NULL,

  -- Organizational Boundary
  consolidation_approach TEXT DEFAULT 'operational_control', -- operational_control, financial_control, equity_share
  reporting_entity TEXT,

  -- Operational Boundary
  gases_covered TEXT[] DEFAULT ARRAY['CO2', 'CH4', 'N2O', 'HFCs', 'PFCs', 'SF6', 'NF3'],
  gwp_standard TEXT DEFAULT 'IPCC AR6', -- IPCC AR5, AR6, SAR

  -- Base Year
  base_year INTEGER,
  base_year_rationale TEXT,
  recalculation_threshold NUMERIC DEFAULT 5.0, -- Percentage threshold

  -- Reporting Period
  period_start DATE,
  period_end DATE,

  -- Assurance
  assurance_level TEXT DEFAULT 'not_verified', -- not_verified, limited, reasonable
  assurance_provider TEXT,
  assurance_statement_url TEXT,

  -- Compliance Statement
  compliance_statement TEXT,
  methodology_description TEXT,

  -- Scope 3 Screening
  scope3_categories_included INTEGER[], -- Array of category numbers 1-15
  scope3_screening_rationale TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, reporting_year)
);

-- Enable RLS
ALTER TABLE ghg_inventory_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view GHG settings for their organization"
  ON ghg_inventory_settings FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM app_users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert GHG settings for their organization"
  ON ghg_inventory_settings FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM app_users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update GHG settings for their organization"
  ON ghg_inventory_settings FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM app_users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete GHG settings for their organization"
  ON ghg_inventory_settings FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM app_users WHERE auth_user_id = auth.uid()
    )
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_ghg_inventory_settings_org_year
  ON ghg_inventory_settings(organization_id, reporting_year);

-- Add comment to table
COMMENT ON TABLE ghg_inventory_settings IS 'GHG Protocol Corporate Standard inventory settings including organizational boundary, operational boundary, base year, and reporting period';
