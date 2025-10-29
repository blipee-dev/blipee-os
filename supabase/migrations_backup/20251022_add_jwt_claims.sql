-- ============================================================================
-- Add organization_id and permissions to JWT claims
-- ============================================================================
--
-- This function is called by Supabase auth hooks to add custom claims to JWTs
-- It includes the user's current organization and permissions in the token
--
-- Created: 2025-10-22
-- ============================================================================

-- Function to get user's organization and permissions for JWT claims
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims jsonb;
  user_id uuid;
  user_org_id uuid;
  user_role text;
  user_permissions jsonb;
BEGIN
  -- Extract user_id from the event
  user_id := (event->>'user_id')::uuid;

  -- Get the user's primary organization and role
  SELECT
    om.organization_id,
    om.role
  INTO
    user_org_id,
    user_role
  FROM organization_members om
  WHERE om.user_id = (
    SELECT id FROM app_users WHERE auth_user_id = user_id LIMIT 1
  )
  ORDER BY om.created_at ASC -- Use first/primary organization
  LIMIT 1;

  -- Build permissions array based on role
  -- This is a simplified version - you can expand based on your needs
  user_permissions := CASE user_role
    WHEN 'account_owner' THEN '["*:*"]'::jsonb
    WHEN 'sustainability_manager' THEN '["emissions:*", "targets:*", "reports:*"]'::jsonb
    WHEN 'facility_manager' THEN '["emissions:read", "emissions:write", "reports:read"]'::jsonb
    WHEN 'analyst' THEN '["emissions:read", "reports:read"]'::jsonb
    ELSE '["emissions:read"]'::jsonb
  END;

  -- Start with existing claims
  claims := event->'claims';

  -- Add custom claims
  IF user_org_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{organization_id}', to_jsonb(user_org_id::text));
    claims := jsonb_set(claims, '{role}', to_jsonb(user_role));
    claims := jsonb_set(claims, '{permissions}', user_permissions);
  END IF;

  -- Update the event with new claims
  event := jsonb_set(event, '{claims}', claims);

  RETURN event;
END;
$$;

-- Grant execute permission ONLY to supabase_auth_admin (security best practice)
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;

-- Revoke from other roles for security (prevent access via Data APIs)
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;

-- Comment explaining the function
COMMENT ON FUNCTION public.custom_access_token_hook IS 'Adds organization_id, role, and permissions to JWT claims for authenticated users';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
--
-- IMPORTANT: After running this migration, configure the hook in Supabase Dashboard:
-- 1. Go to Authentication > Hooks
-- 2. Enable "Custom Access Token" hook
-- 3. Set the hook to: public.custom_access_token_hook
--
-- Or use Supabase CLI:
-- supabase secrets set AUTH_HOOK_CUSTOM_ACCESS_TOKEN_ENABLED=true
-- supabase secrets set AUTH_HOOK_CUSTOM_ACCESS_TOKEN_URI=pg-functions://postgres/public/custom_access_token_hook
-- ============================================================================
