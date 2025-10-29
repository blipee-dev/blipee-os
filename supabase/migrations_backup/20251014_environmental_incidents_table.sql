-- =====================================================
-- GRI 307: Environmental Compliance
-- Complete table creation with RLS, triggers, and indexes
-- =====================================================

-- Create environmental_incidents table
CREATE TABLE IF NOT EXISTS environmental_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,

  -- Incident details
  incident_date DATE NOT NULL,
  incident_type VARCHAR(100) NOT NULL,
  severity VARCHAR(50),

  -- Financial impact
  fine_amount DECIMAL(15, 2),
  currency VARCHAR(3) DEFAULT 'EUR',

  -- Regulatory details
  regulation_violated TEXT,
  regulatory_body VARCHAR(255),

  -- Status and resolution
  status VARCHAR(50) NOT NULL DEFAULT 'open',
  resolution_date DATE,
  resolution_description TEXT,
  corrective_actions TEXT,

  -- Documentation
  incident_description TEXT NOT NULL,
  environmental_impact TEXT,
  notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- Constraints
  CONSTRAINT valid_incident_type CHECK (incident_type IN ('fine', 'sanction', 'violation', 'dispute', 'warning', 'notice')),
  CONSTRAINT valid_severity CHECK (severity IN ('minor', 'moderate', 'significant', 'major')),
  CONSTRAINT valid_status CHECK (status IN ('open', 'under_review', 'resolved', 'appealed', 'dismissed'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_env_incidents_org ON environmental_incidents(organization_id);
CREATE INDEX IF NOT EXISTS idx_env_incidents_date ON environmental_incidents(incident_date);
CREATE INDEX IF NOT EXISTS idx_env_incidents_type ON environmental_incidents(incident_type);
CREATE INDEX IF NOT EXISTS idx_env_incidents_status ON environmental_incidents(status);
CREATE INDEX IF NOT EXISTS idx_env_incidents_severity ON environmental_incidents(severity);

-- Enable Row Level Security
ALTER TABLE environmental_incidents ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view incidents in their organization
DROP POLICY IF EXISTS "Users can view incidents in their organization" ON environmental_incidents;
CREATE POLICY "Users can view incidents in their organization"
  ON environmental_incidents FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Managers can insert incidents
DROP POLICY IF EXISTS "Managers can insert incidents" ON environmental_incidents;
CREATE POLICY "Managers can insert incidents"
  ON environmental_incidents FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
      AND role IN ('account_owner', 'sustainability_manager', 'facility_manager')
    )
  );

-- RLS Policy: Managers can update incidents
DROP POLICY IF EXISTS "Managers can update incidents" ON environmental_incidents;
CREATE POLICY "Managers can update incidents"
  ON environmental_incidents FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
      AND role IN ('account_owner', 'sustainability_manager', 'facility_manager')
    )
  );

-- RLS Policy: Managers can delete incidents
DROP POLICY IF EXISTS "Managers can delete incidents" ON environmental_incidents;
CREATE POLICY "Managers can delete incidents"
  ON environmental_incidents FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
      AND role IN ('account_owner', 'sustainability_manager')
    )
  );

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_environmental_incidents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_environmental_incidents_updated_at ON environmental_incidents;
CREATE TRIGGER update_environmental_incidents_updated_at
  BEFORE UPDATE ON environmental_incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_environmental_incidents_updated_at();

-- Add table comment
COMMENT ON TABLE environmental_incidents IS 'GRI 307: Tracks environmental non-compliance incidents, fines, and sanctions';

-- Add column comments
COMMENT ON COLUMN environmental_incidents.incident_type IS 'Type of incident: fine, sanction, violation, dispute, warning, notice';
COMMENT ON COLUMN environmental_incidents.severity IS 'Severity level: minor, moderate, significant, major';
COMMENT ON COLUMN environmental_incidents.status IS 'Current status: open, under_review, resolved, appealed, dismissed';
COMMENT ON COLUMN environmental_incidents.fine_amount IS 'Monetary value of fine or penalty';
COMMENT ON COLUMN environmental_incidents.regulation_violated IS 'Specific regulation or law that was violated';
COMMENT ON COLUMN environmental_incidents.corrective_actions IS 'Actions taken to address the incident and prevent recurrence';
