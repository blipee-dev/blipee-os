-- ============================================================================
-- Initiative Participants Table
-- ============================================================================
-- Manages participants (both registered users and external collaborators)
-- for initiatives. Supports email invitations and access tokens.

CREATE TABLE IF NOT EXISTS initiative_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  initiative_id UUID NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for external participants

  -- Participant Info
  email TEXT NOT NULL,
  name TEXT, -- Can be provided for external participants
  role TEXT NOT NULL CHECK (role IN ('owner', 'member', 'viewer')),

  -- Permissions
  can_edit BOOLEAN NOT NULL DEFAULT false,
  can_view_metrics BOOLEAN NOT NULL DEFAULT true,
  can_add_comments BOOLEAN NOT NULL DEFAULT true,

  -- Invitation & Status
  invitation_status TEXT NOT NULL DEFAULT 'pending' CHECK (invitation_status IN ('pending', 'accepted', 'rejected')),
  access_token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(), -- For non-user access

  -- Timestamps
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  invited_by UUID REFERENCES auth.users(id),
  responded_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  UNIQUE(initiative_id, email)
);

-- Indexes
CREATE INDEX idx_initiative_participants_initiative ON initiative_participants(initiative_id);
CREATE INDEX idx_initiative_participants_user ON initiative_participants(user_id);
CREATE INDEX idx_initiative_participants_email ON initiative_participants(email);
CREATE INDEX idx_initiative_participants_token ON initiative_participants(access_token);
CREATE INDEX idx_initiative_participants_status ON initiative_participants(invitation_status);

-- RLS Policies
ALTER TABLE initiative_participants ENABLE ROW LEVEL SECURITY;

-- Users can see participants of initiatives in their organization
CREATE POLICY "Users can view initiative participants in their org"
  ON initiative_participants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM initiatives i
      INNER JOIN organization_members om ON om.organization_id = i.organization_id
      WHERE i.id = initiative_participants.initiative_id
      AND om.user_id = auth.uid()
      AND om.deleted_at IS NULL
    )
  );

-- Users can add participants to initiatives they have access to
CREATE POLICY "Users can add participants to initiatives"
  ON initiative_participants
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM initiatives i
      INNER JOIN organization_members om ON om.organization_id = i.organization_id
      WHERE i.id = initiative_participants.initiative_id
      AND om.user_id = auth.uid()
      AND om.role IN ('account_owner', 'admin', 'sustainability_manager', 'sustainability_lead')
      AND om.deleted_at IS NULL
    )
  );

-- Users can update participant status
CREATE POLICY "Users can update participant status"
  ON initiative_participants
  FOR UPDATE
  USING (
    -- Either the participant themselves (if they are a user)
    user_id = auth.uid()
    OR
    -- Or someone with permission in the organization
    EXISTS (
      SELECT 1 FROM initiatives i
      INNER JOIN organization_members om ON om.organization_id = i.organization_id
      WHERE i.id = initiative_participants.initiative_id
      AND om.user_id = auth.uid()
      AND om.role IN ('account_owner', 'admin', 'sustainability_manager', 'sustainability_lead')
      AND om.deleted_at IS NULL
    )
  );

-- Users can remove participants
CREATE POLICY "Users can remove participants"
  ON initiative_participants
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM initiatives i
      INNER JOIN organization_members om ON om.organization_id = i.organization_id
      WHERE i.id = initiative_participants.initiative_id
      AND om.user_id = auth.uid()
      AND om.role IN ('account_owner', 'admin', 'sustainability_manager', 'sustainability_lead')
      AND om.deleted_at IS NULL
    )
  );

-- Trigger to update updated_at
CREATE TRIGGER update_initiative_participants_updated_at
  BEFORE UPDATE ON initiative_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE initiative_participants IS 'Manages participants for initiatives, supporting both registered users and external collaborators';
COMMENT ON COLUMN initiative_participants.access_token IS 'Unique token for non-authenticated access to initiative';
COMMENT ON COLUMN initiative_participants.user_id IS 'NULL for external participants who are not registered users';
COMMENT ON COLUMN initiative_participants.role IS 'Participant role: owner (can manage), member (can contribute), viewer (read-only)';
