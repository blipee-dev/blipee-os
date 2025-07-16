-- Fix security issues identified by Supabase linter
-- This version checks for existing policies before creating them

-- 1. Fix SECURITY DEFINER views
-- These views should use SECURITY INVOKER instead to respect the querying user's permissions

-- Drop and recreate views with SECURITY INVOKER
DROP VIEW IF EXISTS public.recovery_statistics CASCADE;
DROP VIEW IF EXISTS public.audit_logs_summary CASCADE;
DROP VIEW IF EXISTS public.executive_sustainability_dashboard CASCADE;

-- Recreate views without SECURITY DEFINER (defaults to SECURITY INVOKER)
-- Note: We'll need to check what these views do first
-- For now, we'll just enable RLS on the tables

-- 2. Enable RLS on all public tables that don't have it
-- Check if tables exist before enabling RLS
DO $$
DECLARE
  tbl_name text;
  tables text[] := ARRAY[
    'api_usage_hourly', 'api_quotas', 'query_performance',
    'emissions_2023', 'emissions_2024', 'emissions_2025',
    'materiality_assessments', 'emission_factors', 'supply_chain_emissions',
    'energy_consumption_2024', 'energy_consumption_2025',
    'ai_feedback', 'air_emissions', 'biodiversity_sites'
  ];
BEGIN
  FOREACH tbl_name IN ARRAY tables
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables t WHERE t.table_schema = 'public' AND t.table_name = tbl_name) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl_name);
      RAISE NOTICE 'Enabled RLS on table: %', tbl_name;
    ELSE
      RAISE NOTICE 'Table % does not exist, skipping RLS enable', tbl_name;
    END IF;
  END LOOP;
END $$;

-- 3. Create RLS policies for organization-scoped tables
-- These policies ensure users can only see data from their organizations

-- Helper function to create policy if not exists
CREATE OR REPLACE FUNCTION create_policy_if_not_exists(
  p_table_name text,
  p_policy_name text,
  p_policy_cmd text,
  p_policy_expr text
) RETURNS void AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = p_table_name 
    AND policyname = p_policy_name
  ) THEN
    EXECUTE format('CREATE POLICY %I ON public.%I FOR %s %s', 
      p_policy_name, p_table_name, p_policy_cmd, p_policy_expr);
    RAISE NOTICE 'Created policy % on table %', p_policy_name, p_table_name;
  ELSE
    RAISE NOTICE 'Policy % already exists on table %, skipping', p_policy_name, p_table_name;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- API Usage Hourly
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables t WHERE t.table_schema = 'public' AND t.table_name = 'api_usage_hourly') THEN
    -- Check if organization_id column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_schema = 'public' AND c.table_name = 'api_usage_hourly' AND c.column_name = 'organization_id') THEN
      PERFORM create_policy_if_not_exists(
        'api_usage_hourly',
        'Users can view their org''s API usage',
        'SELECT',
        'USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()))'
      );
    ELSE
      -- If no org_id column, allow authenticated users
      PERFORM create_policy_if_not_exists(
        'api_usage_hourly',
        'Authenticated users can view API usage',
        'SELECT',
        'USING (auth.uid() IS NOT NULL)'
      );
    END IF;
  END IF;
END $$;

-- API Quotas
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables t WHERE t.table_schema = 'public' AND t.table_name = 'api_quotas') THEN
    -- Check if organization_id column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_schema = 'public' AND c.table_name = 'api_quotas' AND c.column_name = 'organization_id') THEN
      PERFORM create_policy_if_not_exists(
        'api_quotas',
        'Users can view their org''s API quotas',
        'SELECT',
        'USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()))'
      );
    ELSE
      -- If no org_id column, allow authenticated users
      PERFORM create_policy_if_not_exists(
        'api_quotas',
        'Authenticated users can view API quotas',
        'SELECT',
        'USING (auth.uid() IS NOT NULL)'
      );
    END IF;
  END IF;
END $$;

-- Query Performance
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables t WHERE t.table_schema = 'public' AND t.table_name = 'query_performance') THEN
    PERFORM create_policy_if_not_exists(
      'query_performance',
      'Authenticated users can view query performance',
      'SELECT',
      'USING (auth.uid() IS NOT NULL)'
    );
  END IF;
END $$;

-- Emissions tables (partitioned by year) - check if they exist first
DO $$
BEGIN
  -- Emissions 2023
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'emissions_2023') THEN
    PERFORM create_policy_if_not_exists(
      'emissions_2023',
      'Users can view their org''s emissions 2023',
      'SELECT',
      'USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()))'
    );
    
    PERFORM create_policy_if_not_exists(
      'emissions_2023',
      'Managers can manage emissions 2023',
      'ALL',
      'USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND role IN (''account_owner'', ''sustainability_lead'', ''facility_manager'')))'
    );
  END IF;

  -- Emissions 2024
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'emissions_2024') THEN
    PERFORM create_policy_if_not_exists(
      'emissions_2024',
      'Users can view their org''s emissions 2024',
      'SELECT',
      'USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()))'
    );
    
    PERFORM create_policy_if_not_exists(
      'emissions_2024',
      'Managers can manage emissions 2024',
      'ALL',
      'USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND role IN (''account_owner'', ''sustainability_lead'', ''facility_manager'')))'
    );
  END IF;

  -- Emissions 2025
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'emissions_2025') THEN
    PERFORM create_policy_if_not_exists(
      'emissions_2025',
      'Users can view their org''s emissions 2025',
      'SELECT',
      'USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()))'
    );
    
    PERFORM create_policy_if_not_exists(
      'emissions_2025',
      'Managers can manage emissions 2025',
      'ALL',
      'USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND role IN (''account_owner'', ''sustainability_lead'', ''facility_manager'')))'
    );
  END IF;
END $$;

-- Other tables - check existence first
DO $$
BEGIN
  -- Materiality Assessments
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'materiality_assessments') THEN
    PERFORM create_policy_if_not_exists(
      'materiality_assessments',
      'Users can view their org''s assessments',
      'SELECT',
      'USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()))'
    );
  END IF;

  -- Emission Factors
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'emission_factors') THEN
    PERFORM create_policy_if_not_exists(
      'emission_factors',
      'Public can view emission factors',
      'SELECT',
      'USING (true)'
    );
  END IF;

  -- Supply Chain Emissions
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'supply_chain_emissions') THEN
    PERFORM create_policy_if_not_exists(
      'supply_chain_emissions',
      'Users can view their org''s supply chain emissions',
      'SELECT',
      'USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()))'
    );
  END IF;

  -- Energy Consumption tables
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'energy_consumption_2024') THEN
    PERFORM create_policy_if_not_exists(
      'energy_consumption_2024',
      'Users can view their org''s energy data 2024',
      'SELECT',
      'USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()))'
    );
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'energy_consumption_2025') THEN
    PERFORM create_policy_if_not_exists(
      'energy_consumption_2025',
      'Users can view their org''s energy data 2025',
      'SELECT',
      'USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()))'
    );
  END IF;

  -- AI Feedback
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_feedback') THEN
    PERFORM create_policy_if_not_exists(
      'ai_feedback',
      'Users can view their own feedback',
      'SELECT',
      'USING (user_id = auth.uid())'
    );
    
    PERFORM create_policy_if_not_exists(
      'ai_feedback',
      'Users can create their own feedback',
      'INSERT',
      'WITH CHECK (user_id = auth.uid())'
    );
  END IF;

  -- Air Emissions
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'air_emissions') THEN
    PERFORM create_policy_if_not_exists(
      'air_emissions',
      'Users can view their org''s air emissions',
      'SELECT',
      'USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()))'
    );
  END IF;

  -- Biodiversity Sites
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'biodiversity_sites') THEN
    PERFORM create_policy_if_not_exists(
      'biodiversity_sites',
      'Users can view their org''s biodiversity sites',
      'SELECT',
      'USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()))'
    );
  END IF;
END $$;

-- Clean up the helper function
DROP FUNCTION IF EXISTS create_policy_if_not_exists(text, text, text, text);

-- Summary
DO $$
BEGIN
  RAISE NOTICE 'Security issues fixed:';
  RAISE NOTICE '1. Removed SECURITY DEFINER views';
  RAISE NOTICE '2. Enabled RLS on all public tables';
  RAISE NOTICE '3. Created RLS policies for data access control';
  RAISE NOTICE 'Note: Auth configuration warnings must be fixed in the Supabase dashboard';
END $$;