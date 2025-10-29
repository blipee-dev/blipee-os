-- Tool Approvals Table
-- Track all tool approvals/denials for audit trail and compliance

CREATE TABLE IF NOT EXISTS tool_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tool details
  tool_name TEXT NOT NULL,
  tool_call_id TEXT NOT NULL,

  -- Input/output
  tool_input JSONB NOT NULL,
  tool_output JSONB,

  -- Approval details
  approved BOOLEAN NOT NULL,
  denial_reason TEXT,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Context
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  message_id TEXT,

  -- Model context
  model TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tool_approvals_org
  ON tool_approvals(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tool_approvals_conversation
  ON tool_approvals(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tool_approvals_tool
  ON tool_approvals(tool_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tool_approvals_user
  ON tool_approvals(approved_by, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tool_approvals_status
  ON tool_approvals(approved, created_at DESC);

-- Row Level Security
ALTER TABLE tool_approvals ENABLE ROW LEVEL SECURITY;

-- Users can see their own approvals
CREATE POLICY "Users can view their own approvals"
  ON tool_approvals
  FOR SELECT
  USING (approved_by = auth.uid());

-- Organization admins can see all approvals for their organization
CREATE POLICY "Organization admins can view all approvals"
  ON tool_approvals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = tool_approvals.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('admin', 'owner')
    )
  );

-- Authenticated users can insert approvals
CREATE POLICY "Users can insert approvals"
  ON tool_approvals
  FOR INSERT
  WITH CHECK (auth.uid() = approved_by);

-- Comments
COMMENT ON TABLE tool_approvals IS 'Tracks tool approvals and denials for audit trail and compliance';
COMMENT ON COLUMN tool_approvals.tool_name IS 'Name of the tool that required approval';
COMMENT ON COLUMN tool_approvals.tool_call_id IS 'Unique identifier for the tool call';
COMMENT ON COLUMN tool_approvals.approved IS 'Whether the tool execution was approved (true) or denied (false)';
COMMENT ON COLUMN tool_approvals.denial_reason IS 'Optional reason provided when denying a tool execution';
