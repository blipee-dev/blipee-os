-- Reduction Initiatives Table
-- Tracks emission reduction projects and their impact

CREATE TABLE IF NOT EXISTS reduction_initiatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Initiative Details
  initiative_name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- e.g., 'Energy Efficiency', 'Renewable Energy', 'Process Optimization', 'Transport', 'Waste'

  -- Impact
  reduction_tco2e NUMERIC NOT NULL, -- Annual reduction in tCO₂e
  cost_eur NUMERIC, -- Implementation cost in EUR
  cost_savings_eur NUMERIC, -- Annual cost savings in EUR

  -- Timeline
  implementation_year INTEGER NOT NULL,
  start_date DATE,
  completion_date DATE,

  -- Status
  status TEXT DEFAULT 'planned', -- planned, in_progress, completed, cancelled

  -- Scope Coverage
  scopes TEXT[], -- Array of scopes affected: ['scope_1', 'scope_2', 'scope_3']

  -- Verification
  verified BOOLEAN DEFAULT false,
  verification_method TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE reduction_initiatives ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view reduction initiatives for their organization"
  ON reduction_initiatives FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM app_users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert reduction initiatives for their organization"
  ON reduction_initiatives FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM app_users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update reduction initiatives for their organization"
  ON reduction_initiatives FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM app_users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete reduction initiatives for their organization"
  ON reduction_initiatives FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM app_users WHERE auth_user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reduction_initiatives_org
  ON reduction_initiatives(organization_id);

CREATE INDEX IF NOT EXISTS idx_reduction_initiatives_year
  ON reduction_initiatives(implementation_year);

-- Add comment
COMMENT ON TABLE reduction_initiatives IS 'Tracks GHG emission reduction projects and initiatives with their impact, costs, and status';
