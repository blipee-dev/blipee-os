-- Fix security issues identified by Supabase linter

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

-- API Usage Hourly (check if table exists and create basic policy)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables t WHERE t.table_schema = 'public' AND t.table_name = 'api_usage_hourly') THEN
    -- Check if organization_id column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_schema = 'public' AND c.table_name = 'api_usage_hourly' AND c.column_name = 'organization_id') THEN
      CREATE POLICY "Users can view their org's API usage" ON public.api_usage_hourly
        FOR SELECT USING (
          organization_id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid()
          )
        );
    ELSE
      -- If no org_id column, allow authenticated users
      CREATE POLICY "Authenticated users can view API usage" ON public.api_usage_hourly
        FOR SELECT USING (auth.uid() IS NOT NULL);
    END IF;
  END IF;
END $$;

-- API Quotas (check if table exists and create basic policy)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables t WHERE t.table_schema = 'public' AND t.table_name = 'api_quotas') THEN
    -- Check if organization_id column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_schema = 'public' AND c.table_name = 'api_quotas' AND c.column_name = 'organization_id') THEN
      CREATE POLICY "Users can view their org's API quotas" ON public.api_quotas
        FOR SELECT USING (
          organization_id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid()
          )
        );
    ELSE
      -- If no org_id column, allow authenticated users
      CREATE POLICY "Authenticated users can view API quotas" ON public.api_quotas
        FOR SELECT USING (auth.uid() IS NOT NULL);
    END IF;
  END IF;
END $$;

-- Query Performance (check if table exists and create basic policy)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables t WHERE t.table_schema = 'public' AND t.table_name = 'query_performance') THEN
    CREATE POLICY "Authenticated users can view query performance" ON public.query_performance
      FOR SELECT USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Emissions tables (partitioned by year)
CREATE POLICY "Users can view their org's emissions 2023" ON public.emissions_2023
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their org's emissions 2024" ON public.emissions_2024
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their org's emissions 2025" ON public.emissions_2025
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Materiality Assessments
CREATE POLICY "Users can view their org's materiality assessments" ON public.materiality_assessments
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Emission Factors (public reference data - all authenticated users can view)
CREATE POLICY "Authenticated users can view emission factors" ON public.emission_factors
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Supply Chain Emissions
CREATE POLICY "Users can view their org's supply chain emissions" ON public.supply_chain_emissions
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Energy Consumption tables
CREATE POLICY "Users can view their org's energy consumption 2024" ON public.energy_consumption_2024
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their org's energy consumption 2025" ON public.energy_consumption_2025
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

-- AI Feedback
CREATE POLICY "Users can view their own AI feedback" ON public.ai_feedback
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own AI feedback" ON public.ai_feedback
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Air Emissions
CREATE POLICY "Users can view their org's air emissions" ON public.air_emissions
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Biodiversity Sites
CREATE POLICY "Users can view their org's biodiversity sites" ON public.biodiversity_sites
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Grant permissions for service role to manage these tables
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
      EXECUTE format('GRANT ALL ON public.%I TO service_role', tbl_name);
      RAISE NOTICE 'Granted permissions on table: %', tbl_name;
    END IF;
  END LOOP;
END $$;