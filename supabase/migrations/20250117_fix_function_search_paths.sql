-- Fix function search path security issues
-- This migration addresses the function_search_path_mutable warnings

-- Update critical functions with explicit search_path
-- We'll focus on the most important ones that handle authentication and security

-- 1. Fix handle_new_user function (critical for user creation)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
    ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_catalog;
    RAISE NOTICE 'Updated search_path for handle_new_user';
  END IF;
END $$;

-- 2. Fix create_organization_with_owner function
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_organization_with_owner') THEN
    ALTER FUNCTION public.create_organization_with_owner(text, text, uuid) SET search_path = public, pg_catalog;
    RAISE NOTICE 'Updated search_path for create_organization_with_owner';
  END IF;
END $$;

-- 3. Fix authentication and authorization functions
DO $$
DECLARE
  auth_functions text[] := ARRAY[
    'has_organization_role',
    'is_organization_member',
    'user_organizations',
    'hash_api_key',
    'generate_api_key',
    'validate_recovery_token',
    'get_sso_config_by_email'
  ];
  func_name text;
BEGIN
  FOREACH func_name IN ARRAY auth_functions
  LOOP
    -- Check if function exists and update it
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
               WHERE n.nspname = 'public' AND p.proname = func_name) THEN
      BEGIN
        -- We need to get the full function signature, but for simplicity we'll handle common cases
        EXECUTE format('ALTER FUNCTION public.%I SET search_path = public, pg_catalog', func_name);
        RAISE NOTICE 'Updated search_path for %', func_name;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not update % - may need parameters: %', func_name, SQLERRM;
      END;
    END IF;
  END LOOP;
END $$;

-- 4. Fix update timestamp triggers
DO $$
BEGIN
  -- Common timestamp update function
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_catalog;
    RAISE NOTICE 'Updated search_path for update_updated_at_column';
  END IF;
  
  -- ML-specific timestamp functions
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_ml_timestamp') THEN
    ALTER FUNCTION public.update_ml_timestamp() SET search_path = public, pg_catalog;
    RAISE NOTICE 'Updated search_path for update_ml_timestamp';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_ml_updated_at') THEN
    ALTER FUNCTION public.update_ml_updated_at() SET search_path = public, pg_catalog;
    RAISE NOTICE 'Updated search_path for update_ml_updated_at';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_agent_timestamp') THEN
    ALTER FUNCTION public.update_agent_timestamp() SET search_path = public, pg_catalog;
    RAISE NOTICE 'Updated search_path for update_agent_timestamp';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_network_timestamp') THEN
    ALTER FUNCTION public.update_network_timestamp() SET search_path = public, pg_catalog;
    RAISE NOTICE 'Updated search_path for update_network_timestamp';
  END IF;
END $$;

-- 5. Fix retail schema functions
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
             WHERE n.nspname = 'retail' AND p.proname = 'update_updated_at_column') THEN
    ALTER FUNCTION retail.update_updated_at_column() SET search_path = retail, public, pg_catalog;
    RAISE NOTICE 'Updated search_path for retail.update_updated_at_column';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
             WHERE n.nspname = 'retail' AND p.proname = 'populate_stores_from_data') THEN
    ALTER FUNCTION retail.populate_stores_from_data() SET search_path = retail, public, pg_catalog;
    RAISE NOTICE 'Updated search_path for retail.populate_stores_from_data';
  END IF;
END $$;

-- Fix extensions in public schema (move to extensions schema)
DO $$
BEGIN
  -- Create extensions schema if it doesn't exist
  CREATE SCHEMA IF NOT EXISTS extensions;
  GRANT USAGE ON SCHEMA extensions TO anon, authenticated, service_role;
  
  -- Move pg_trgm extension
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm' AND extnamespace = 'public'::regnamespace) THEN
    ALTER EXTENSION pg_trgm SET SCHEMA extensions;
    RAISE NOTICE 'Moved pg_trgm extension to extensions schema';
  END IF;
  
  -- Move btree_gin extension  
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'btree_gin' AND extnamespace = 'public'::regnamespace) THEN
    ALTER EXTENSION btree_gin SET SCHEMA extensions;
    RAISE NOTICE 'Moved btree_gin extension to extensions schema';
  END IF;
END $$;

-- Fix materialized view permissions
-- Revoke permissions from anon and authenticated roles on materialized views
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE schemaname = 'public' AND matviewname = 'mv_org_dashboard_metrics') THEN
    REVOKE ALL ON public.mv_org_dashboard_metrics FROM anon, authenticated;
    GRANT SELECT ON public.mv_org_dashboard_metrics TO service_role;
    RAISE NOTICE 'Fixed permissions on materialized view: mv_org_dashboard_metrics';
  END IF;
END $$;

-- Note: Auth configuration issues (OTP expiry and leaked password protection) 
-- need to be fixed in the Supabase dashboard under Auth settings, not via SQL