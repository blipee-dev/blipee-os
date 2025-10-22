-- Agent Learnings Table
-- Stores feedback and learned patterns from autonomous AI agents
-- Enables agents to avoid repeating irrelevant recommendations

CREATE TABLE IF NOT EXISTS agent_learnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL, -- 'carbon-hunter', 'compliance-guardian', 'esg-chief', etc.

  -- Learning metadata
  learning_type TEXT NOT NULL, -- 'recommendation_rejected', 'infrastructure_exists', 'user_preference', 'action_completed'
  recommendation_type TEXT, -- 'led_retrofit', 'hvac_optimization', 'energy_audit', 'compliance_check', etc.

  -- Context and feedback
  context JSONB DEFAULT '{}', -- Store relevant context (site_id, metric_id, etc.)
  feedback TEXT, -- 'already_installed', 'not_relevant', 'completed', 'planned', 'helpful', 'not_helpful'
  feedback_reason TEXT, -- Optional user-provided reason

  -- Confidence and expiration
  confidence DECIMAL DEFAULT 1.0, -- How confident is this learning (0.0 to 1.0)
  expires_at TIMESTAMPTZ, -- Optional: learnings can expire (e.g., equipment upgrades after 5 years)

  -- Tracking
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- Performance indexes
  CONSTRAINT valid_confidence CHECK (confidence >= 0 AND confidence <= 1)
);

-- Indexes for fast lookup
CREATE INDEX idx_agent_learnings_org ON agent_learnings(organization_id);
CREATE INDEX idx_agent_learnings_agent ON agent_learnings(agent_id, organization_id);
CREATE INDEX idx_agent_learnings_recommendation ON agent_learnings(recommendation_type, organization_id);
CREATE INDEX idx_agent_learnings_type ON agent_learnings(learning_type, organization_id);
CREATE INDEX idx_agent_learnings_expires ON agent_learnings(expires_at) WHERE expires_at IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE agent_learnings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see learnings for their organization
CREATE POLICY "Users can view organization learnings"
  ON agent_learnings
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM user_access
      WHERE user_id = auth.uid()
    )
  );

-- Users can insert learnings for their organization
CREATE POLICY "Users can create organization learnings"
  ON agent_learnings
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM user_access
      WHERE user_id = auth.uid()
    )
  );

-- Users can update learnings for their organization
CREATE POLICY "Users can update organization learnings"
  ON agent_learnings
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM user_access
      WHERE user_id = auth.uid()
    )
  );

-- Users can delete learnings for their organization (with appropriate role)
CREATE POLICY "Managers can delete organization learnings"
  ON agent_learnings
  FOR DELETE
  USING (
    organization_id IN (
      SELECT ua.organization_id
      FROM user_access ua
      WHERE ua.user_id = auth.uid()
      AND ua.role IN ('account_owner', 'sustainability_manager')
    )
  );

-- Function to clean up expired learnings (can be called via pg_cron or manually)
CREATE OR REPLACE FUNCTION cleanup_expired_learnings()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM agent_learnings
  WHERE expires_at IS NOT NULL
    AND expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_agent_learnings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agent_learnings_updated_at
  BEFORE UPDATE ON agent_learnings
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_learnings_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON agent_learnings TO authenticated;
GRANT DELETE ON agent_learnings TO authenticated; -- Controlled by RLS policy

-- Add comment
COMMENT ON TABLE agent_learnings IS 'Stores learned patterns and feedback from autonomous AI agents to improve recommendation relevance';
COMMENT ON COLUMN agent_learnings.learning_type IS 'Type of learning: recommendation_rejected, infrastructure_exists, user_preference, action_completed';
COMMENT ON COLUMN agent_learnings.confidence IS 'Confidence score (0.0 to 1.0) - higher means more certain the learning is valid';
COMMENT ON COLUMN agent_learnings.expires_at IS 'Optional expiration date - learnings can become stale (e.g., equipment upgraded after 5 years)';
