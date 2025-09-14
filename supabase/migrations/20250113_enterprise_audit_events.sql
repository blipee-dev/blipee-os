-- =====================================================
-- ENTERPRISE AUDIT EVENTS SYSTEM
-- Event-driven architecture following best practices from
-- Salesforce, AWS CloudTrail, and Datadog
-- =====================================================

-- Drop existing audit tables if we're consolidating
-- (Comment these out if you want to keep existing tables)
-- DROP TABLE IF EXISTS audit_logs CASCADE;
-- DROP TABLE IF EXISTS access_audit_log CASCADE;

-- =====================================================
-- CORE AUDIT EVENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_events (
  -- Immutable event ID
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event timestamp (immutable)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Core event data (JSONB for flexibility)
  event JSONB NOT NULL,

  -- Extracted fields for fast querying (computed from event JSONB)
  actor_id UUID GENERATED ALWAYS AS ((event->'actor'->>'id')::uuid) STORED,
  actor_type TEXT GENERATED ALWAYS AS (event->'actor'->>'type') STORED,
  actor_email TEXT GENERATED ALWAYS AS (event->'actor'->>'email') STORED,

  action_type TEXT GENERATED ALWAYS AS (event->'action'->>'type') STORED,
  action_category TEXT GENERATED ALWAYS AS (event->'action'->>'category') STORED,

  resource_type TEXT GENERATED ALWAYS AS (event->'resource'->>'type') STORED,
  resource_id TEXT GENERATED ALWAYS AS (event->'resource'->>'id') STORED,
  organization_id UUID GENERATED ALWAYS AS ((event->'context'->>'organization_id')::uuid) STORED,

  outcome_status TEXT GENERATED ALWAYS AS (event->'outcome'->>'status') STORED,

  -- IP and location data (handle null/invalid IPs gracefully)
  ip_address INET GENERATED ALWAYS AS (
    CASE
      WHEN event->'context'->>'ip' IS NULL THEN NULL
      WHEN event->'context'->>'ip' = '' THEN NULL
      WHEN event->'context'->>'ip' = 'localhost' THEN '127.0.0.1'::inet
      ELSE (event->'context'->>'ip')::inet
    END
  ) STORED,
  user_agent TEXT GENERATED ALWAYS AS (event->'context'->>'user_agent') STORED,

  -- Correlation for distributed tracing
  correlation_id TEXT GENERATED ALWAYS AS (event->'context'->>'correlation_id') STORED,
  session_id TEXT GENERATED ALWAYS AS (event->'context'->>'session_id') STORED,

  -- Severity for security events
  severity TEXT GENERATED ALWAYS AS (COALESCE(event->'metadata'->>'severity', 'info')) STORED,

  -- Search vector for full-text search
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english',
      COALESCE(event->'action'->>'type', '') || ' ' ||
      COALESCE(event->'resource'->>'type', '') || ' ' ||
      COALESCE(event->'resource'->>'name', '') || ' ' ||
      COALESCE(event->'metadata'->>'description', '')
    )
  ) STORED
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Time-based queries (most common)
CREATE INDEX idx_audit_events_created_at ON audit_events(created_at DESC);

-- Actor queries
CREATE INDEX idx_audit_events_actor ON audit_events(actor_id, created_at DESC);
CREATE INDEX idx_audit_events_actor_type ON audit_events(actor_type, created_at DESC);

-- Action queries
CREATE INDEX idx_audit_events_action ON audit_events(action_category, action_type, created_at DESC);

-- Resource queries
CREATE INDEX idx_audit_events_resource ON audit_events(resource_type, resource_id, created_at DESC);

-- Organization scoping
CREATE INDEX idx_audit_events_org ON audit_events(organization_id, created_at DESC);

-- Session tracking
CREATE INDEX idx_audit_events_session ON audit_events(session_id, created_at DESC);

-- Correlation tracking
CREATE INDEX idx_audit_events_correlation ON audit_events(correlation_id);

-- Full-text search
CREATE INDEX idx_audit_events_search ON audit_events USING gin(search_vector);

-- Security monitoring
CREATE INDEX idx_audit_events_security ON audit_events(severity, outcome_status, created_at DESC)
  WHERE severity IN ('warning', 'error', 'critical');

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- Service role can insert (for system events)
CREATE POLICY "Service role can insert audit events" ON audit_events
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Authenticated users can insert their own events
CREATE POLICY "Users can create audit events" ON audit_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (event->'actor'->>'id')::uuid = auth.uid()
  );

-- Users can view events based on their role
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
    -- Users see their own events
    actor_id = auth.uid()
  );

-- =====================================================
-- AUDIT EVENT FUNCTIONS
-- =====================================================

-- Function to create an audit event
CREATE OR REPLACE FUNCTION create_audit_event(
  p_action_type TEXT,
  p_action_category TEXT,
  p_resource_type TEXT,
  p_resource_id TEXT,
  p_resource_name TEXT DEFAULT NULL,
  p_changes JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL,
  p_outcome_status TEXT DEFAULT 'success',
  p_outcome_error TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
  v_user_email TEXT;
  v_user_role TEXT;
  v_org_id UUID;
BEGIN
  -- Get user context
  SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();

  -- Get user's primary organization and role
  SELECT organization_id, role INTO v_org_id, v_user_role
  FROM user_organization_roles
  WHERE user_id = auth.uid()
  ORDER BY created_at
  LIMIT 1;

  INSERT INTO audit_events (event) VALUES (
    jsonb_build_object(
      'actor', jsonb_build_object(
        'id', auth.uid(),
        'type', 'user',
        'email', v_user_email,
        'role', v_user_role
      ),
      'action', jsonb_build_object(
        'type', p_action_type,
        'category', p_action_category,
        'timestamp', NOW()
      ),
      'resource', jsonb_build_object(
        'type', p_resource_type,
        'id', p_resource_id,
        'name', p_resource_name
      ),
      'context', jsonb_build_object(
        'organization_id', v_org_id,
        'ip', current_setting('request.headers', true)::json->>'x-forwarded-for',
        'user_agent', current_setting('request.headers', true)::json->>'user-agent',
        'session_id', current_setting('request.jwt.claims', true)::json->>'session_id',
        'correlation_id', gen_random_uuid()
      ),
      'outcome', jsonb_build_object(
        'status', p_outcome_status,
        'error', p_outcome_error
      ),
      'changes', p_changes,
      'metadata', p_metadata
    )
  ) RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- AUTOMATIC AUDIT TRIGGERS
-- =====================================================

-- Generic trigger function for auditing table changes
CREATE OR REPLACE FUNCTION audit_table_changes() RETURNS TRIGGER AS $$
DECLARE
  v_action_type TEXT;
  v_changes JSONB;
  v_resource_name TEXT;
BEGIN
  -- Determine action type
  CASE TG_OP
    WHEN 'INSERT' THEN
      v_action_type := 'create';
      v_changes := jsonb_build_object('after', to_jsonb(NEW));
      v_resource_name := COALESCE(NEW.name, NEW.title, NEW.email, NULL);
    WHEN 'UPDATE' THEN
      v_action_type := 'update';
      v_changes := jsonb_build_object(
        'before', to_jsonb(OLD),
        'after', to_jsonb(NEW),
        'diff', jsonb_diff(to_jsonb(OLD), to_jsonb(NEW))
      );
      v_resource_name := COALESCE(NEW.name, NEW.title, NEW.email, OLD.name, OLD.title, OLD.email, NULL);
    WHEN 'DELETE' THEN
      v_action_type := 'delete';
      v_changes := jsonb_build_object('before', to_jsonb(OLD));
      v_resource_name := COALESCE(OLD.name, OLD.title, OLD.email, NULL);
  END CASE;

  -- Create audit event
  PERFORM create_audit_event(
    p_action_type := v_action_type,
    p_action_category := 'data',
    p_resource_type := TG_TABLE_NAME,
    p_resource_id := COALESCE(NEW.id::text, OLD.id::text),
    p_resource_name := v_resource_name,
    p_changes := v_changes,
    p_metadata := jsonb_build_object(
      'table_name', TG_TABLE_NAME,
      'operation', TG_OP,
      'schema', TG_TABLE_SCHEMA
    )
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- APPLY AUDIT TRIGGERS TO CRITICAL TABLES
-- =====================================================

-- Organizations
CREATE TRIGGER audit_organizations
  AFTER INSERT OR UPDATE OR DELETE ON organizations
  FOR EACH ROW EXECUTE FUNCTION audit_table_changes();

-- Users (app_users)
CREATE TRIGGER audit_app_users
  AFTER INSERT OR UPDATE OR DELETE ON app_users
  FOR EACH ROW EXECUTE FUNCTION audit_table_changes();

-- Sites
CREATE TRIGGER audit_sites
  AFTER INSERT OR UPDATE OR DELETE ON sites
  FOR EACH ROW EXECUTE FUNCTION audit_table_changes();

-- Devices
CREATE TRIGGER audit_devices
  AFTER INSERT OR UPDATE OR DELETE ON devices
  FOR EACH ROW EXECUTE FUNCTION audit_table_changes();

-- User roles
CREATE TRIGGER audit_user_organization_roles
  AFTER INSERT OR UPDATE OR DELETE ON user_organization_roles
  FOR EACH ROW EXECUTE FUNCTION audit_table_changes();

-- =====================================================
-- HELPER FUNCTIONS FOR QUERYING
-- =====================================================

-- Get audit events for a resource
CREATE OR REPLACE FUNCTION get_resource_audit_trail(
  p_resource_type TEXT,
  p_resource_id TEXT,
  p_limit INT DEFAULT 100
) RETURNS TABLE (
  id UUID,
  created_at TIMESTAMPTZ,
  actor_email TEXT,
  action_type TEXT,
  changes JSONB,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ae.id,
    ae.created_at,
    ae.actor_email,
    ae.action_type,
    ae.event->'changes' as changes,
    ae.event->'metadata' as metadata
  FROM audit_events ae
  WHERE ae.resource_type = p_resource_type
    AND ae.resource_id = p_resource_id
  ORDER BY ae.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- JSONB DIFF FUNCTION (for change tracking)
-- =====================================================

CREATE OR REPLACE FUNCTION jsonb_diff(old_val JSONB, new_val JSONB)
RETURNS JSONB AS $$
DECLARE
  result JSONB := '{}';
  k TEXT;
BEGIN
  -- Find changed and added keys
  FOR k IN SELECT * FROM jsonb_object_keys(new_val)
  LOOP
    IF old_val ? k THEN
      IF old_val->k != new_val->k THEN
        result := result || jsonb_build_object(k, jsonb_build_object(
          'old', old_val->k,
          'new', new_val->k
        ));
      END IF;
    ELSE
      result := result || jsonb_build_object(k, jsonb_build_object(
        'old', null,
        'new', new_val->k
      ));
    END IF;
  END LOOP;

  -- Find removed keys
  FOR k IN SELECT * FROM jsonb_object_keys(old_val)
  LOOP
    IF NOT (new_val ? k) THEN
      result := result || jsonb_build_object(k, jsonb_build_object(
        'old', old_val->k,
        'new', null
      ));
    END IF;
  END LOOP;

  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- AUDIT EVENT TYPES ENUM
-- =====================================================

CREATE TYPE audit_action_category AS ENUM (
  'auth',      -- Authentication events
  'data',      -- CRUD operations
  'permission', -- Permission changes
  'system',    -- System events
  'security',  -- Security events
  'api',       -- API calls
  'agent'      -- AI agent actions
);

-- =====================================================
-- CLEANUP FUNCTION FOR OLD EVENTS
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_old_audit_events(
  p_retention_days INT DEFAULT 90,
  p_keep_security_days INT DEFAULT 365
) RETURNS TABLE (
  deleted_count BIGINT,
  security_preserved BIGINT
) AS $$
DECLARE
  v_deleted_count BIGINT;
  v_security_preserved BIGINT;
BEGIN
  -- Keep security events longer
  WITH deleted AS (
    DELETE FROM audit_events
    WHERE created_at < NOW() - INTERVAL '1 day' * p_retention_days
      AND severity NOT IN ('warning', 'error', 'critical')
    RETURNING id
  )
  SELECT COUNT(*) INTO v_deleted_count FROM deleted;

  -- Count preserved security events
  SELECT COUNT(*) INTO v_security_preserved
  FROM audit_events
  WHERE created_at < NOW() - INTERVAL '1 day' * p_retention_days
    AND created_at >= NOW() - INTERVAL '1 day' * p_keep_security_days
    AND severity IN ('warning', 'error', 'critical');

  RETURN QUERY SELECT v_deleted_count, v_security_preserved;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- INDEXES FOR CLEANUP
-- =====================================================

CREATE INDEX idx_audit_events_cleanup
  ON audit_events(created_at, severity);

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE audit_events IS 'Enterprise-grade audit event log following event-driven architecture';
COMMENT ON COLUMN audit_events.event IS 'Complete event data in JSONB format';
COMMENT ON FUNCTION create_audit_event IS 'Creates a new audit event with full context';
COMMENT ON FUNCTION audit_table_changes IS 'Generic trigger function for automatic audit logging';