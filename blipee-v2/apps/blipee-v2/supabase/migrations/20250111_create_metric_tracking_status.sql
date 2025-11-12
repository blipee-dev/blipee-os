-- Create metric_tracking_status table to store organization decisions about metrics
-- This allows organizations to classify metrics as:
-- - 'add_to_tracking': Metrics they want to track
-- - 'not_priority': Metrics that exist but are not currently a priority
-- - 'not_applicable': Metrics that don't apply to their business

CREATE TABLE IF NOT EXISTS metric_tracking_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  metric_code VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('add_to_tracking', 'not_priority', 'not_applicable')),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,

  -- Notes/reasoning (optional)
  notes TEXT,

  -- Ensure one status per metric per organization
  UNIQUE(organization_id, metric_code)
);

-- Create indexes for performance
CREATE INDEX idx_metric_tracking_status_org ON metric_tracking_status(organization_id);
CREATE INDEX idx_metric_tracking_status_metric ON metric_tracking_status(metric_code);
CREATE INDEX idx_metric_tracking_status_status ON metric_tracking_status(status);
CREATE INDEX idx_metric_tracking_status_org_status ON metric_tracking_status(organization_id, status);

-- Enable RLS
ALTER TABLE metric_tracking_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see/modify tracking status for their organization
CREATE POLICY "Users can view metric tracking status for their organization"
  ON metric_tracking_status
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
      AND deleted_at IS NULL
    )
  );

CREATE POLICY "Users can insert metric tracking status for their organization"
  ON metric_tracking_status
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
      AND deleted_at IS NULL
      AND role IN ('account_owner', 'admin', 'sustainability_manager', 'sustainability_lead')
    )
  );

CREATE POLICY "Users can update metric tracking status for their organization"
  ON metric_tracking_status
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
      AND deleted_at IS NULL
      AND role IN ('account_owner', 'admin', 'sustainability_manager', 'sustainability_lead')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
      AND deleted_at IS NULL
      AND role IN ('account_owner', 'admin', 'sustainability_manager', 'sustainability_lead')
    )
  );

CREATE POLICY "Users can delete metric tracking status for their organization"
  ON metric_tracking_status
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
      AND deleted_at IS NULL
      AND role IN ('account_owner', 'admin', 'sustainability_manager', 'sustainability_lead')
    )
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_metric_tracking_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function
CREATE TRIGGER trigger_update_metric_tracking_status_updated_at
  BEFORE UPDATE ON metric_tracking_status
  FOR EACH ROW
  EXECUTE FUNCTION update_metric_tracking_status_updated_at();

-- Comments for documentation
COMMENT ON TABLE metric_tracking_status IS 'Stores organization decisions about which metrics to track, which are not priority, and which are not applicable';
COMMENT ON COLUMN metric_tracking_status.metric_code IS 'Reference to the metric code from metric_definitions table';
COMMENT ON COLUMN metric_tracking_status.status IS 'Status: add_to_tracking, not_priority, or not_applicable';
COMMENT ON COLUMN metric_tracking_status.notes IS 'Optional notes explaining why this status was chosen';
