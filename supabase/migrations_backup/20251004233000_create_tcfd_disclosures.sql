-- TCFD Disclosures Table
-- Task Force on Climate-related Financial Disclosures
-- 4 Pillars: Governance, Strategy, Risk Management, Metrics & Targets

CREATE TABLE IF NOT EXISTS tcfd_disclosures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  reporting_year INTEGER NOT NULL,

  -- Pillar 1: Governance
  governance_oversight JSONB, -- Board oversight structure
  governance_management JSONB, -- Management role in climate risks/opportunities

  -- Pillar 2: Strategy
  strategy_risks JSONB, -- Climate-related risks (physical, transition)
  strategy_opportunities JSONB, -- Climate-related opportunities
  strategy_scenarios JSONB, -- Scenario analysis (1.5°C, 2°C, business as usual)
  strategy_resilience TEXT, -- Resilience narrative

  -- Pillar 3: Risk Management
  risk_identification TEXT, -- How climate risks are identified
  risk_assessment TEXT, -- How risks are assessed
  risk_management_process TEXT, -- How risks are managed
  risk_integration TEXT, -- Integration into overall risk management

  -- Pillar 4: Metrics & Targets
  -- Note: We'll pull actual metrics from metrics_data and targets from sustainability_targets
  metrics_description TEXT, -- Description of metrics used
  metrics_scope123_methodology TEXT, -- How Scope 1, 2, 3 are calculated

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, reporting_year)
);

-- Enable RLS
ALTER TABLE tcfd_disclosures ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view TCFD disclosures for their organization"
  ON tcfd_disclosures FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM app_users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert TCFD disclosures for their organization"
  ON tcfd_disclosures FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM app_users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update TCFD disclosures for their organization"
  ON tcfd_disclosures FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM app_users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete TCFD disclosures for their organization"
  ON tcfd_disclosures FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM app_users WHERE auth_user_id = auth.uid()
    )
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_tcfd_disclosures_org_year
  ON tcfd_disclosures(organization_id, reporting_year);

-- Add comment to table
COMMENT ON TABLE tcfd_disclosures IS 'TCFD (Task Force on Climate-related Financial Disclosures) compliance data organized by 4 pillars: Governance, Strategy, Risk Management, Metrics & Targets';
