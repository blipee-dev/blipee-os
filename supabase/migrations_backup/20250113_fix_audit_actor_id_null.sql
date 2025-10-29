-- =====================================================
-- FIX AUDIT EVENTS ACTOR ID NULL HANDLING
-- Addresses the issue where 'anonymous' and 'system'
-- strings cannot be cast to UUID
-- =====================================================

-- Drop the existing actor_id column and recreate with proper null handling
ALTER TABLE audit_events DROP COLUMN IF EXISTS actor_id;

-- Recreate actor_id column with proper null handling
ALTER TABLE audit_events ADD COLUMN actor_id UUID GENERATED ALWAYS AS (
  CASE
    WHEN event->'actor'->>'id' IS NULL THEN NULL
    WHEN event->'actor'->>'id' = '' THEN NULL
    -- Only try to cast to UUID if it's a valid UUID format
    WHEN event->'actor'->>'id' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN (event->'actor'->>'id')::uuid
    ELSE NULL
  END
) STORED;

-- Recreate the index for actor queries
DROP INDEX IF EXISTS idx_audit_events_actor;
CREATE INDEX idx_audit_events_actor ON audit_events(actor_id, created_at DESC)
  WHERE actor_id IS NOT NULL;

-- Update RLS policies to handle null actor_id
DROP POLICY IF EXISTS "Users can create audit events" ON audit_events;
CREATE POLICY "Users can create audit events" ON audit_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow if actor_id matches the authenticated user
    (event->'actor'->>'id')::uuid = auth.uid()
    OR
    -- Allow if actor_id is null (for anonymous/system events)
    event->'actor'->>'id' IS NULL
  );

-- Update the view policy to handle null actor_id
DROP POLICY IF EXISTS "Users can view audit events" ON audit_events;
CREATE POLICY "Users can view audit events" ON audit_events
  FOR SELECT
  TO authenticated
  USING (
    -- Super admins see everything
    EXISTS (
      SELECT 1 FROM super_admins WHERE user_id = auth.uid()
    )
    OR
    -- Organization owners/admins see their org events
    EXISTS (
      SELECT 1 FROM user_organization_roles
      WHERE user_id = auth.uid()
        AND organization_id = audit_events.organization_id
        AND role IN ('account_owner', 'admin', 'sustainability_manager')
    )
    OR
    -- Users see their own events (where actor_id is not null)
    (actor_id IS NOT NULL AND actor_id = auth.uid())
    OR
    -- Users can see anonymous/system events related to their organization
    (actor_id IS NULL AND organization_id IN (
      SELECT organization_id FROM user_organization_roles WHERE user_id = auth.uid()
    ))
  );

-- Add comment explaining the change
COMMENT ON COLUMN audit_events.actor_id IS 'Actor UUID extracted from event JSON, null for anonymous/system actors';