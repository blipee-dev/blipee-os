-- Content Safety Violations Table
-- Track all content safety violations for auditing and compliance

CREATE TABLE IF NOT EXISTS content_safety_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Violation details
  violation_type TEXT NOT NULL CHECK (violation_type IN ('inappropriate', 'sensitive', 'unprofessional', 'custom')),
  reason TEXT NOT NULL,
  detected_content TEXT, -- Truncated/redacted content that triggered violation

  -- Context
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Model context
  model TEXT,
  message_role TEXT CHECK (message_role IN ('user', 'assistant', 'system')),

  -- Action taken
  action_taken TEXT NOT NULL CHECK (action_taken IN ('blocked', 'redacted', 'logged')),

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_content_safety_violations_org
  ON content_safety_violations(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_content_safety_violations_conversation
  ON content_safety_violations(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_content_safety_violations_type
  ON content_safety_violations(violation_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_content_safety_violations_user
  ON content_safety_violations(user_id, created_at DESC);

-- Row Level Security
ALTER TABLE content_safety_violations ENABLE ROW LEVEL SECURITY;

-- Admins can see all violations for their organization
CREATE POLICY "Organization admins can view violations"
  ON content_safety_violations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = content_safety_violations.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('admin', 'owner')
    )
  );

-- System can insert violations (via service role)
CREATE POLICY "System can insert violations"
  ON content_safety_violations
  FOR INSERT
  WITH CHECK (true);

-- Comment
COMMENT ON TABLE content_safety_violations IS 'Tracks content safety violations for compliance and auditing';
COMMENT ON COLUMN content_safety_violations.violation_type IS 'Type of violation: inappropriate, sensitive, unprofessional, custom';
COMMENT ON COLUMN content_safety_violations.action_taken IS 'Action taken: blocked (stopped stream), redacted (filtered content), logged (warning only)';
