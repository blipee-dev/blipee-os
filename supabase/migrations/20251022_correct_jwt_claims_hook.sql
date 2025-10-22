-- ============================================================================
-- CORRECT JWT Claims Hook - Following Official Supabase Documentation
-- ============================================================================
--
-- Based on https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook
--
-- Key points from docs:
-- 1. Function receives: { user_id, claims, authentication_method }
-- 2. Function MUST return: { "claims": { ... } }  (NOT the entire event!)
-- 3. Cannot remove required claims (iss, aud, exp, iat, sub, role, etc.)
-- 4. Can add/modify: jti, nbf, app_metadata, user_metadata, amr
--
-- Created: 2025-10-22
-- ============================================================================

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
  -- Extract the existing claims from the event
  claims := event->'claims';

  -- Extract auth user_id from the event
  auth_uid := (event->>'user_id')::uuid;

  -- Wrap in exception handling to prevent signin failures
  BEGIN
    -- First, get the app_users.id from auth_user_id
    SELECT id INTO app_user_id
    FROM app_users
    WHERE auth_user_id = auth_uid
    LIMIT 1;

    -- Only proceed if we found the app user
    IF app_user_id IS NOT NULL THEN
      -- Get the user's organization and role
      SELECT
        om.organization_id,
        om.role
      INTO
        user_org_id,
        user_role
      FROM organization_members om
      WHERE om.user_id = app_user_id
      ORDER BY om.created_at ASC
      LIMIT 1;

      -- Build permissions array based on role
      user_permissions := CASE user_role
        WHEN 'account_owner' THEN '["*:*"]'::jsonb
        WHEN 'sustainability_manager' THEN '["emissions:*", "targets:*", "reports:*"]'::jsonb
        WHEN 'facility_manager' THEN '["emissions:read", "emissions:write", "reports:read"]'::jsonb
        WHEN 'analyst' THEN '["emissions:read", "reports:read"]'::jsonb
        ELSE '["emissions:read"]'::jsonb
      END;

      -- Add custom claims if org membership found
      IF user_org_id IS NOT NULL THEN
        claims := jsonb_set(claims, '{organization_id}', to_jsonb(user_org_id::text));
        claims := jsonb_set(claims, '{role}', to_jsonb(user_role));
        claims := jsonb_set(claims, '{permissions}', user_permissions);
      END IF;
    END IF;

  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail - return claims as-is
    RAISE WARNING 'JWT claims hook error for user %: %', auth_uid, SQLERRM;
  END;

  -- IMPORTANT: Return ONLY the claims object wrapped in jsonb_build_object
  -- This is the required format per Supabase documentation
  RETURN jsonb_build_object('claims', claims);
END;
$$;

-- Grant execute permission ONLY to supabase_auth_admin
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;

-- Revoke from other roles for security
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;

-- Comment
COMMENT ON FUNCTION public.custom_access_token_hook IS 'Adds organization_id, role, and permissions to JWT claims - CORRECT implementation per Supabase docs';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
--
-- This version follows the official Supabase documentation:
-- - Returns jsonb_build_object('claims', claims) not the event
-- - Includes error handling to prevent signin failures
-- - Uses correct lookup: auth_user_id -> app_users.id -> organization_members
-- ============================================================================
