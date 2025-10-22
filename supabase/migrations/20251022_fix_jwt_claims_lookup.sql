-- ============================================================================
-- Fix JWT Claims Hook - Correct User Lookup
-- ============================================================================
--
-- The previous version was looking up users incorrectly.
-- organization_members.user_id references app_users.id (not auth.users.id)
-- We need to first get app_users.id from auth_user_id, then lookup org membership
--
-- Created: 2025-10-22
-- ============================================================================

-- Drop and recreate the function with correct logic
DROP FUNCTION IF EXISTS public.custom_access_token_hook(jsonb);

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims jsonb;
  auth_uid uuid;
  app_user_id uuid;
  user_org_id uuid;
  user_role text;
  user_permissions jsonb;
BEGIN
  -- Extract auth user_id from the event
  auth_uid := (event->>'user_id')::uuid;

  -- First, get the app_users.id from auth_user_id
  SELECT id INTO app_user_id
  FROM app_users
  WHERE auth_user_id = auth_uid
  LIMIT 1;

  -- If no app_user found, return event unchanged
  IF app_user_id IS NULL THEN
    RETURN event;
  END IF;

  -- Now get the user's organization and role using app_users.id
  SELECT
    om.organization_id,
    om.role
  INTO
    user_org_id,
    user_role
  FROM organization_members om
  WHERE om.user_id = app_user_id
  ORDER BY om.created_at ASC -- Use first/primary organization
  LIMIT 1;

  -- Build permissions array based on role
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
COMMENT ON FUNCTION public.custom_access_token_hook IS 'Adds organization_id, role, and permissions to JWT claims - FIXED to use app_users.id lookup';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
