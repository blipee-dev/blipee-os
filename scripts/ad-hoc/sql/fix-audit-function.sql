-- Fix the create_audit_event function to not reference created_at column
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

  -- Get user's primary organization and role (without ORDER BY created_at)
  SELECT organization_id, role INTO v_org_id, v_user_role
  FROM user_organization_roles
  WHERE user_id = auth.uid()
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