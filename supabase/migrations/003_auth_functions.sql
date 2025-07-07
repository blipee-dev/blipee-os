-- Function to create organization with owner
-- Drop the old version first (from migration 002)
DROP FUNCTION IF EXISTS create_organization_with_owner(TEXT, TEXT, UUID);

CREATE OR REPLACE FUNCTION create_organization_with_owner(
  org_name TEXT,
  org_slug TEXT,
  owner_id UUID,
  org_data JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Create the organization
  INSERT INTO organizations (
    name,
    slug,
    subscription_tier,
    metadata
  ) VALUES (
    org_name,
    org_slug,
    COALESCE(org_data->>'subscription_tier', 'starter'),
    jsonb_build_object(
      'industry', org_data->>'industry',
      'company_size', org_data->>'company_size',
      'created_by', owner_id,
      'created_at', now()
    )
  )
  RETURNING id INTO new_org_id;

  -- Add the owner as a member
  INSERT INTO organization_members (
    organization_id,
    user_id,
    role,
    invitation_status,
    joined_at
  ) VALUES (
    new_org_id,
    owner_id,
    'subscription_owner',
    'accepted',
    now()
  );

  -- Update user profile with default organization
  UPDATE user_profiles
  SET 
    metadata = COALESCE(metadata, '{}'::jsonb) || 
      jsonb_build_object('default_organization_id', new_org_id)
  WHERE id = owner_id;

  RETURN new_org_id;
END;
$$;

-- Function to get user's current session with full context
CREATE OR REPLACE FUNCTION get_user_session(user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_data JSONB;
  user_data JSONB;
  organizations_data JSONB;
  current_org JSONB;
  permissions_data JSONB;
BEGIN
  -- Get user profile
  SELECT to_jsonb(up.*) INTO user_data
  FROM user_profiles up
  WHERE up.id = user_id;

  IF user_data IS NULL THEN
    RETURN NULL;
  END IF;

  -- Get user's organizations with their role
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', o.id,
      'name', o.name,
      'slug', o.slug,
      'subscription_tier', o.subscription_tier,
      'metadata', o.metadata,
      'role', om.role,
      'permissions', om.permissions
    )
  ) INTO organizations_data
  FROM organizations o
  INNER JOIN organization_members om ON o.id = om.organization_id
  WHERE om.user_id = user_id
    AND om.invitation_status = 'accepted';

  -- Get current organization (first one or from user preference)
  IF organizations_data IS NOT NULL AND jsonb_array_length(organizations_data) > 0 THEN
    -- Check if user has a default organization set
    IF user_data->'metadata'->>'default_organization_id' IS NOT NULL THEN
      SELECT org INTO current_org
      FROM jsonb_array_elements(organizations_data) org
      WHERE org->>'id' = user_data->'metadata'->>'default_organization_id'
      LIMIT 1;
    END IF;
    
    -- If no default or default not found, use first organization
    IF current_org IS NULL THEN
      current_org := organizations_data->0;
    END IF;
  END IF;

  -- Build permissions based on role
  permissions_data := CASE current_org->>'role'
    WHEN 'subscription_owner' THEN 
      '[{"resource": "*", "action": "*"}]'::jsonb
    WHEN 'organization_admin' THEN
      '[
        {"resource": "organization", "action": "view"},
        {"resource": "organization", "action": "edit"},
        {"resource": "buildings", "action": "*"},
        {"resource": "users", "action": "*"},
        {"resource": "reports", "action": "*"}
      ]'::jsonb
    WHEN 'site_manager' THEN
      '[
        {"resource": "buildings", "action": "view"},
        {"resource": "buildings", "action": "edit"},
        {"resource": "systems", "action": "*"},
        {"resource": "users", "action": "invite"},
        {"resource": "reports", "action": "*"}
      ]'::jsonb
    ELSE '[]'::jsonb
  END;

  -- Build session object
  session_data := jsonb_build_object(
    'user', user_data,
    'organizations', COALESCE(organizations_data, '[]'::jsonb),
    'current_organization', current_org,
    'permissions', permissions_data,
    'expires_at', (now() + interval '8 hours')::text
  );

  RETURN session_data;
END;
$$;

-- Function to handle user signup with organization creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create user profile if it doesn't exist
  INSERT INTO user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Trigger to create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_organization_with_owner TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_session TO authenticated;