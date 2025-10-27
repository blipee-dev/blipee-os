-- AI Security Events Table
-- Tracks security-related events from AI system
-- Migration: 20251026050000

-- Create ai_security_events table
CREATE TABLE IF NOT EXISTS ai_security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  actor_type TEXT NOT NULL CHECK (actor_type IN ('user', 'agent', 'system')),
  actor_id TEXT,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_ai_security_events_created_at ON ai_security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_security_events_severity ON ai_security_events(severity);
CREATE INDEX IF NOT EXISTS idx_ai_security_events_organization ON ai_security_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_security_events_actor_type ON ai_security_events(actor_type);
CREATE INDEX IF NOT EXISTS idx_ai_security_events_event_type ON ai_security_events(event_type);

-- Enable Row Level Security
ALTER TABLE ai_security_events ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only admins can view security events for their organization
CREATE POLICY "Admins can view security events"
  ON ai_security_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = ai_security_events.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('account_owner', 'admin')
    )
  );

-- RLS Policy: System (service role) can insert events
CREATE POLICY "System can insert security events"
  ON ai_security_events
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- RLS Policy: Allow authenticated users to insert their own security events
CREATE POLICY "Users can insert security events"
  ON ai_security_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = ai_security_events.organization_id
      AND om.user_id = auth.uid()
    )
  );

-- Comments for documentation
COMMENT ON TABLE ai_security_events IS 'Tracks security-related events from AI agents and user interactions';
COMMENT ON COLUMN ai_security_events.event_type IS 'Type of security event (e.g., agent_pii_detected, prompt_injection_attempt, unauthorized_action)';
COMMENT ON COLUMN ai_security_events.severity IS 'Severity level: low, medium, high, critical';
COMMENT ON COLUMN ai_security_events.actor_type IS 'Who triggered the event: user, agent, or system';
COMMENT ON COLUMN ai_security_events.actor_id IS 'Identifier for the actor (user_id, agent_id, or system component)';
COMMENT ON COLUMN ai_security_events.organization_id IS 'Organization this event belongs to';
COMMENT ON COLUMN ai_security_events.details IS 'Additional event-specific details in JSON format';

-- Function to get recent security events for an organization
CREATE OR REPLACE FUNCTION get_recent_security_events(
  org_id UUID,
  event_limit INT DEFAULT 50,
  min_severity TEXT DEFAULT 'low'
)
RETURNS TABLE (
  id UUID,
  event_type TEXT,
  severity TEXT,
  actor_type TEXT,
  actor_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.event_type,
    e.severity,
    e.actor_type,
    e.actor_id,
    e.details,
    e.created_at
  FROM ai_security_events e
  WHERE e.organization_id = org_id
  AND (
    CASE min_severity
      WHEN 'critical' THEN e.severity = 'critical'
      WHEN 'high' THEN e.severity IN ('critical', 'high')
      WHEN 'medium' THEN e.severity IN ('critical', 'high', 'medium')
      ELSE true
    END
  )
  ORDER BY e.created_at DESC
  LIMIT event_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_recent_security_events(UUID, INT, TEXT) TO authenticated;

COMMENT ON FUNCTION get_recent_security_events IS 'Retrieve recent security events for an organization with optional severity filtering';
