-- Fix remaining function search path security issues
-- This migration addresses the remaining function_search_path_mutable warnings

-- Create a more comprehensive function to fix search paths
DO $$
DECLARE
  func_record RECORD;
  alter_cmd TEXT;
BEGIN
  -- Get all functions that still need search_path update
  FOR func_record IN 
    SELECT 
      n.nspname AS schema_name,
      p.proname AS function_name,
      pg_get_function_identity_arguments(p.oid) AS function_args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.prokind = 'f' -- regular functions only
    AND p.proname IN (
      -- Deployment and ML functions
      'record_deployment_status_change', 'calculate_model_drift', 'update_deployment_metrics',
      'record_deployment_event', 'map_organization_to_gri_sector', 'get_industry_material_topics',
      
      -- API and usage tracking
      'track_api_usage', 'aggregate_api_usage_hourly',
      
      -- Authentication and security
      'cleanup_old_webauthn_credentials', 'cleanup_expired_webauthn_challenges',
      'cleanup_expired_sso_auth_requests', 'cleanup_expired_mfa_challenges',
      'cleanup_expired_sso_sessions', 'cleanup_old_audit_logs',
      'notify_critical_recovery_event', 'notify_critical_audit_event',
      'expire_old_recovery_tokens', 'get_user_recovery_options',
      'increment_recovery_attempts', 'get_webauthn_stats',
      
      -- Dashboard and metrics
      'refresh_org_dashboard_metrics', 'update_organization_gri_sector',
      
      -- Agent functions
      'schedule_agent_task', 'execute_agent_task', 'record_agent_decision',
      'update_agent_health', 'initialize_agents_for_organization',
      
      -- Marketplace and credits
      'award_marketplace_credits', 'deduct_marketplace_credits',
      
      -- Utility functions
      'calculate_percentile_rank', 'generate_sample_benchmark_data'
    )
  LOOP
    BEGIN
      -- Build ALTER FUNCTION command with proper parameters
      IF func_record.function_args = '' THEN
        alter_cmd := format('ALTER FUNCTION %I.%I() SET search_path = public, pg_catalog',
          func_record.schema_name, func_record.function_name);
      ELSE
        alter_cmd := format('ALTER FUNCTION %I.%I(%s) SET search_path = public, pg_catalog',
          func_record.schema_name, func_record.function_name, func_record.function_args);
      END IF;
      
      -- Execute the ALTER command
      EXECUTE alter_cmd;
      RAISE NOTICE 'Updated search_path for function: %.%(%)', 
        func_record.schema_name, func_record.function_name, func_record.function_args;
        
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Failed to update function %.%(%): %', 
        func_record.schema_name, func_record.function_name, func_record.function_args, SQLERRM;
    END;
  END LOOP;
END $$;

-- Additional manual fixes for functions that might have been missed
-- These are done individually to handle specific parameter types

-- ML and deployment functions
DO $$
BEGIN
  -- record_deployment_status_change
  PERFORM proname FROM pg_proc WHERE proname = 'record_deployment_status_change';
  IF FOUND THEN
    ALTER FUNCTION public.record_deployment_status_change(uuid, text, jsonb) 
      SET search_path = public, pg_catalog;
  END IF;
  
  -- calculate_model_drift
  PERFORM proname FROM pg_proc WHERE proname = 'calculate_model_drift';
  IF FOUND THEN
    ALTER FUNCTION public.calculate_model_drift(uuid) 
      SET search_path = public, pg_catalog;
  END IF;
  
  -- map_organization_to_gri_sector
  PERFORM proname FROM pg_proc WHERE proname = 'map_organization_to_gri_sector';
  IF FOUND THEN
    ALTER FUNCTION public.map_organization_to_gri_sector(uuid) 
      SET search_path = public, pg_catalog;
  END IF;
  
  -- track_api_usage
  PERFORM proname FROM pg_proc WHERE proname = 'track_api_usage';
  IF FOUND THEN
    ALTER FUNCTION public.track_api_usage(uuid, text, text, jsonb) 
      SET search_path = public, pg_catalog;
  END IF;
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error in ML/deployment functions block: %', SQLERRM;
END $$;

-- Cleanup functions (usually no parameters)
DO $$
BEGIN
  ALTER FUNCTION public.cleanup_old_webauthn_credentials() SET search_path = public, pg_catalog;
  ALTER FUNCTION public.cleanup_expired_webauthn_challenges() SET search_path = public, pg_catalog;
  ALTER FUNCTION public.cleanup_expired_sso_auth_requests() SET search_path = public, pg_catalog;
  ALTER FUNCTION public.cleanup_expired_mfa_challenges() SET search_path = public, pg_catalog;
  ALTER FUNCTION public.cleanup_expired_sso_sessions() SET search_path = public, pg_catalog;
  ALTER FUNCTION public.cleanup_old_audit_logs() SET search_path = public, pg_catalog;
  ALTER FUNCTION public.expire_old_recovery_tokens() SET search_path = public, pg_catalog;
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error in cleanup functions block: %', SQLERRM;
END $$;

-- Notification and metrics functions
DO $$
BEGIN
  -- notify_critical_recovery_event
  PERFORM proname FROM pg_proc WHERE proname = 'notify_critical_recovery_event';
  IF FOUND THEN
    ALTER FUNCTION public.notify_critical_recovery_event(text, jsonb) 
      SET search_path = public, pg_catalog;
  END IF;
  
  -- refresh_org_dashboard_metrics
  PERFORM proname FROM pg_proc WHERE proname = 'refresh_org_dashboard_metrics';
  IF FOUND THEN
    ALTER FUNCTION public.refresh_org_dashboard_metrics(uuid) 
      SET search_path = public, pg_catalog;
  END IF;
  
  -- aggregate_api_usage_hourly
  ALTER FUNCTION public.aggregate_api_usage_hourly() SET search_path = public, pg_catalog;
  
  -- notify_critical_audit_event
  PERFORM proname FROM pg_proc WHERE proname = 'notify_critical_audit_event';
  IF FOUND THEN
    ALTER FUNCTION public.notify_critical_audit_event(text, jsonb) 
      SET search_path = public, pg_catalog;
  END IF;
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error in notification/metrics functions block: %', SQLERRM;
END $$;

-- Agent functions
DO $$
BEGIN
  -- schedule_agent_task
  PERFORM proname FROM pg_proc WHERE proname = 'schedule_agent_task';
  IF FOUND THEN
    ALTER FUNCTION public.schedule_agent_task(uuid, text, jsonb, timestamptz) 
      SET search_path = public, pg_catalog;
  END IF;
  
  -- execute_agent_task
  PERFORM proname FROM pg_proc WHERE proname = 'execute_agent_task';
  IF FOUND THEN
    ALTER FUNCTION public.execute_agent_task(uuid) 
      SET search_path = public, pg_catalog;
  END IF;
  
  -- record_agent_decision
  PERFORM proname FROM pg_proc WHERE proname = 'record_agent_decision';
  IF FOUND THEN
    ALTER FUNCTION public.record_agent_decision(uuid, text, jsonb, numeric) 
      SET search_path = public, pg_catalog;
  END IF;
  
  -- update_agent_health
  PERFORM proname FROM pg_proc WHERE proname = 'update_agent_health';
  IF FOUND THEN
    ALTER FUNCTION public.update_agent_health(uuid, text, jsonb) 
      SET search_path = public, pg_catalog;
  END IF;
  
  -- initialize_agents_for_organization
  PERFORM proname FROM pg_proc WHERE proname = 'initialize_agents_for_organization';
  IF FOUND THEN
    ALTER FUNCTION public.initialize_agents_for_organization(uuid) 
      SET search_path = public, pg_catalog;
  END IF;
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error in agent functions block: %', SQLERRM;
END $$;

-- Marketplace and utility functions
DO $$
BEGIN
  -- award_marketplace_credits
  PERFORM proname FROM pg_proc WHERE proname = 'award_marketplace_credits';
  IF FOUND THEN
    ALTER FUNCTION public.award_marketplace_credits(uuid, numeric) 
      SET search_path = public, pg_catalog;
  END IF;
  
  -- deduct_marketplace_credits
  PERFORM proname FROM pg_proc WHERE proname = 'deduct_marketplace_credits';
  IF FOUND THEN
    ALTER FUNCTION public.deduct_marketplace_credits(uuid, numeric) 
      SET search_path = public, pg_catalog;
  END IF;
  
  -- calculate_percentile_rank
  PERFORM proname FROM pg_proc WHERE proname = 'calculate_percentile_rank';
  IF FOUND THEN
    ALTER FUNCTION public.calculate_percentile_rank(numeric, numeric[]) 
      SET search_path = public, pg_catalog;
  END IF;
  
  -- generate_sample_benchmark_data
  ALTER FUNCTION public.generate_sample_benchmark_data() SET search_path = public, pg_catalog;
  
  -- get_industry_material_topics
  PERFORM proname FROM pg_proc WHERE proname = 'get_industry_material_topics';
  IF FOUND THEN
    ALTER FUNCTION public.get_industry_material_topics(text) 
      SET search_path = public, pg_catalog;
  END IF;
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error in marketplace/utility functions block: %', SQLERRM;
END $$;

-- Deployment and recovery functions
DO $$
BEGIN
  -- update_deployment_metrics
  PERFORM proname FROM pg_proc WHERE proname = 'update_deployment_metrics';
  IF FOUND THEN
    ALTER FUNCTION public.update_deployment_metrics(uuid, jsonb) 
      SET search_path = public, pg_catalog;
  END IF;
  
  -- record_deployment_event
  PERFORM proname FROM pg_proc WHERE proname = 'record_deployment_event';
  IF FOUND THEN
    ALTER FUNCTION public.record_deployment_event(uuid, text, jsonb) 
      SET search_path = public, pg_catalog;
  END IF;
  
  -- get_user_recovery_options
  PERFORM proname FROM pg_proc WHERE proname = 'get_user_recovery_options';
  IF FOUND THEN
    ALTER FUNCTION public.get_user_recovery_options(uuid) 
      SET search_path = public, pg_catalog;
  END IF;
  
  -- get_webauthn_stats
  PERFORM proname FROM pg_proc WHERE proname = 'get_webauthn_stats';
  IF FOUND THEN
    ALTER FUNCTION public.get_webauthn_stats(uuid) 
      SET search_path = public, pg_catalog;
  END IF;
  
  -- increment_recovery_attempts
  PERFORM proname FROM pg_proc WHERE proname = 'increment_recovery_attempts';
  IF FOUND THEN
    ALTER FUNCTION public.increment_recovery_attempts(uuid) 
      SET search_path = public, pg_catalog;
  END IF;
  
  -- update_organization_gri_sector
  PERFORM proname FROM pg_proc WHERE proname = 'update_organization_gri_sector';
  IF FOUND THEN
    ALTER FUNCTION public.update_organization_gri_sector(uuid, text) 
      SET search_path = public, pg_catalog;
  END IF;
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error in deployment/recovery functions block: %', SQLERRM;
END $$;

-- Summary
DO $$
BEGIN
  RAISE NOTICE 'Completed function search path security fixes';
  RAISE NOTICE 'Note: Auth configuration warnings (OTP expiry and leaked password protection) must be fixed in the Supabase dashboard';
END $$;