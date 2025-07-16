-- Add missing RLS policies for tables with RLS enabled but no policies
-- This migration addresses the rls_enabled_no_policy INFO warnings
-- SAFE VERSION: Checks if policies exist before creating them

-- Helper function to check if a policy exists
CREATE OR REPLACE FUNCTION create_policy_if_not_exists(
  policy_name text,
  table_name text,
  policy_sql text
) RETURNS void AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = table_name 
    AND policyname = policy_name
  ) THEN
    EXECUTE policy_sql;
    RAISE NOTICE 'Created policy % on table %', policy_name, table_name;
  ELSE
    RAISE NOTICE 'Policy % already exists on table %, skipping', policy_name, table_name;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 1. Agent-related tables
-- These tables are linked to organizations through agent_instances

-- agent_collaborations
SELECT create_policy_if_not_exists(
  'Users can view their org''s agent collaborations',
  'agent_collaborations',
  'CREATE POLICY "Users can view their org''s agent collaborations" ON public.agent_collaborations
    FOR SELECT USING (
      initiator_agent_id IN (
        SELECT id FROM public.agent_instances
        WHERE organization_id IN (
          SELECT organization_id FROM public.organization_members
          WHERE user_id = auth.uid()
        )
      )
      OR collaborator_agent_id IN (
        SELECT id FROM public.agent_instances
        WHERE organization_id IN (
          SELECT organization_id FROM public.organization_members
          WHERE user_id = auth.uid()
        )
      )
    )'
);

SELECT create_policy_if_not_exists(
  'Service role can manage agent collaborations',
  'agent_collaborations',
  'CREATE POLICY "Service role can manage agent collaborations" ON public.agent_collaborations
    FOR ALL USING (auth.jwt()->>''"role"'' = ''service_role'')'
);

-- agent_decisions
SELECT create_policy_if_not_exists(
  'Users can view their org''s agent decisions',
  'agent_decisions',
  'CREATE POLICY "Users can view their org''s agent decisions" ON public.agent_decisions
    FOR SELECT USING (
      agent_instance_id IN (
        SELECT id FROM public.agent_instances
        WHERE organization_id IN (
          SELECT organization_id FROM public.organization_members
          WHERE user_id = auth.uid()
        )
      )
    )'
);

SELECT create_policy_if_not_exists(
  'Service role can manage agent decisions',
  'agent_decisions',
  'CREATE POLICY "Service role can manage agent decisions" ON public.agent_decisions
    FOR ALL USING (auth.jwt()->>''"role"'' = ''service_role'')'
);

-- agent_learning_patterns
SELECT create_policy_if_not_exists(
  'Users can view their org''s agent learning patterns',
  'agent_learning_patterns',
  'CREATE POLICY "Users can view their org''s agent learning patterns" ON public.agent_learning_patterns
    FOR SELECT USING (
      agent_instance_id IN (
        SELECT id FROM public.agent_instances
        WHERE organization_id IN (
          SELECT organization_id FROM public.organization_members
          WHERE user_id = auth.uid()
        )
      )
    )'
);

SELECT create_policy_if_not_exists(
  'Service role can manage agent learning patterns',
  'agent_learning_patterns',
  'CREATE POLICY "Service role can manage agent learning patterns" ON public.agent_learning_patterns
    FOR ALL USING (auth.jwt()->>''"role"'' = ''service_role'')'
);

-- agent_metrics
SELECT create_policy_if_not_exists(
  'Users can view their org''s agent metrics',
  'agent_metrics',
  'CREATE POLICY "Users can view their org''s agent metrics" ON public.agent_metrics
    FOR SELECT USING (
      agent_instance_id IN (
        SELECT id FROM public.agent_instances
        WHERE organization_id IN (
          SELECT organization_id FROM public.organization_members
          WHERE user_id = auth.uid()
        )
      )
    )'
);

SELECT create_policy_if_not_exists(
  'Service role can manage agent metrics',
  'agent_metrics',
  'CREATE POLICY "Service role can manage agent metrics" ON public.agent_metrics
    FOR ALL USING (auth.jwt()->>''"role"'' = ''service_role'')'
);

-- agent_task_executions
SELECT create_policy_if_not_exists(
  'Users can view their org''s agent task executions',
  'agent_task_executions',
  'CREATE POLICY "Users can view their org''s agent task executions" ON public.agent_task_executions
    FOR SELECT USING (
      agent_instance_id IN (
        SELECT id FROM public.agent_instances
        WHERE organization_id IN (
          SELECT organization_id FROM public.organization_members
          WHERE user_id = auth.uid()
        )
      )
    )'
);

SELECT create_policy_if_not_exists(
  'Service role can manage agent task executions',
  'agent_task_executions',
  'CREATE POLICY "Service role can manage agent task executions" ON public.agent_task_executions
    FOR ALL USING (auth.jwt()->>''"role"'' = ''service_role'')'
);

-- 2. Benchmark and network tables

-- benchmark_cohorts
SELECT create_policy_if_not_exists(
  'Public can view benchmark cohorts',
  'benchmark_cohorts',
  'CREATE POLICY "Public can view benchmark cohorts" ON public.benchmark_cohorts
    FOR SELECT USING (true)'
);

SELECT create_policy_if_not_exists(
  'Service role can manage benchmark cohorts',
  'benchmark_cohorts',
  'CREATE POLICY "Service role can manage benchmark cohorts" ON public.benchmark_cohorts
    FOR ALL USING (auth.jwt()->>''"role"'' = ''service_role'')'
);

-- cohort_members
SELECT create_policy_if_not_exists(
  'Users can view their org''s cohort memberships',
  'cohort_members',
  'CREATE POLICY "Users can view their org''s cohort memberships" ON public.cohort_members
    FOR SELECT USING (
      organization_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid()
      )
    )'
);

SELECT create_policy_if_not_exists(
  'Service role can manage cohort members',
  'cohort_members',
  'CREATE POLICY "Service role can manage cohort members" ON public.cohort_members
    FOR ALL USING (auth.jwt()->>''"role"'' = ''service_role'')'
);

-- 3. Core business tables

-- buildings
SELECT create_policy_if_not_exists(
  'Users can view their org''s buildings',
  'buildings',
  'CREATE POLICY "Users can view their org''s buildings" ON public.buildings
    FOR SELECT USING (
      organization_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid()
      )
    )'
);

SELECT create_policy_if_not_exists(
  'Facility managers can manage buildings',
  'buildings',
  'CREATE POLICY "Facility managers can manage buildings" ON public.buildings
    FOR ALL USING (
      organization_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid() 
        AND role IN (''account_owner'', ''sustainability_lead'', ''facility_manager'')
      )
    )'
);

-- documents
SELECT create_policy_if_not_exists(
  'Users can view their org''s documents',
  'documents',
  'CREATE POLICY "Users can view their org''s documents" ON public.documents
    FOR SELECT USING (
      organization_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid()
      )
    )'
);

SELECT create_policy_if_not_exists(
  'Users can manage their org''s documents',
  'documents',
  'CREATE POLICY "Users can manage their org''s documents" ON public.documents
    FOR ALL USING (
      organization_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid()
        AND role IN (''account_owner'', ''sustainability_lead'', ''facility_manager'', ''analyst'')
      )
    )'
);

-- document_uploads
SELECT create_policy_if_not_exists(
  'Users can view their own uploads',
  'document_uploads',
  'CREATE POLICY "Users can view their own uploads" ON public.document_uploads
    FOR SELECT USING (uploaded_by = auth.uid())'
);

SELECT create_policy_if_not_exists(
  'Users can create uploads',
  'document_uploads',
  'CREATE POLICY "Users can create uploads" ON public.document_uploads
    FOR INSERT WITH CHECK (uploaded_by = auth.uid())'
);

SELECT create_policy_if_not_exists(
  'Service role can manage all uploads',
  'document_uploads',
  'CREATE POLICY "Service role can manage all uploads" ON public.document_uploads
    FOR ALL USING (auth.jwt()->>''"role"'' = ''service_role'')'
);

-- 4. Emissions and sustainability data

-- emissions_data
SELECT create_policy_if_not_exists(
  'Users can view their org''s emissions data',
  'emissions_data',
  'CREATE POLICY "Users can view their org''s emissions data" ON public.emissions_data
    FOR SELECT USING (
      organization_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid()
      )
    )'
);

SELECT create_policy_if_not_exists(
  'Managers can manage emissions data',
  'emissions_data',
  'CREATE POLICY "Managers can manage emissions data" ON public.emissions_data
    FOR ALL USING (
      organization_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid()
        AND role IN (''account_owner'', ''sustainability_lead'', ''facility_manager'')
      )
    )'
);

-- waste_data
SELECT create_policy_if_not_exists(
  'Users can view their org''s waste data',
  'waste_data',
  'CREATE POLICY "Users can view their org''s waste data" ON public.waste_data
    FOR SELECT USING (
      organization_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid()
      )
    )'
);

SELECT create_policy_if_not_exists(
  'Managers can manage waste data',
  'waste_data',
  'CREATE POLICY "Managers can manage waste data" ON public.waste_data
    FOR ALL USING (
      organization_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid()
        AND role IN (''account_owner'', ''sustainability_lead'', ''facility_manager'')
      )
    )'
);

-- water_usage
SELECT create_policy_if_not_exists(
  'Users can view their org''s water usage',
  'water_usage',
  'CREATE POLICY "Users can view their org''s water usage" ON public.water_usage
    FOR SELECT USING (
      organization_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid()
      )
    )'
);

SELECT create_policy_if_not_exists(
  'Managers can manage water usage',
  'water_usage',
  'CREATE POLICY "Managers can manage water usage" ON public.water_usage
    FOR ALL USING (
      organization_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid()
        AND role IN (''account_owner'', ''sustainability_lead'', ''facility_manager'')
      )
    )'
);

-- sustainability_reports
SELECT create_policy_if_not_exists(
  'Users can view their org''s reports',
  'sustainability_reports',
  'CREATE POLICY "Users can view their org''s reports" ON public.sustainability_reports
    FOR SELECT USING (
      organization_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid()
      )
    )'
);

SELECT create_policy_if_not_exists(
  'Managers can manage reports',
  'sustainability_reports',
  'CREATE POLICY "Managers can manage reports" ON public.sustainability_reports
    FOR ALL USING (
      organization_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid()
        AND role IN (''account_owner'', ''sustainability_lead'')
      )
    )'
);

-- supplier_assessments
SELECT create_policy_if_not_exists(
  'Users can view their org''s supplier assessments',
  'supplier_assessments',
  'CREATE POLICY "Users can view their org''s supplier assessments" ON public.supplier_assessments
    FOR SELECT USING (
      organization_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid()
      )
    )'
);

SELECT create_policy_if_not_exists(
  'Managers can manage supplier assessments',
  'supplier_assessments',
  'CREATE POLICY "Managers can manage supplier assessments" ON public.supplier_assessments
    FOR ALL USING (
      organization_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid()
        AND role IN (''account_owner'', ''sustainability_lead'', ''analyst'')
      )
    )'
);

-- 5. Marketplace and data exchange

-- marketplace_accounts
SELECT create_policy_if_not_exists(
  'Users can view their org''s marketplace account',
  'marketplace_accounts',
  'CREATE POLICY "Users can view their org''s marketplace account" ON public.marketplace_accounts
    FOR SELECT USING (
      organization_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid()
      )
    )'
);

SELECT create_policy_if_not_exists(
  'Account owners can manage marketplace account',
  'marketplace_accounts',
  'CREATE POLICY "Account owners can manage marketplace account" ON public.marketplace_accounts
    FOR ALL USING (
      organization_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid()
        AND role = ''account_owner''
      )
    )'
);

-- data_contributions (uses provider_id instead of organization_id)
SELECT create_policy_if_not_exists(
  'Users can view their org''s data contributions',
  'data_contributions',
  'CREATE POLICY "Users can view their org''s data contributions" ON public.data_contributions
    FOR SELECT USING (
      provider_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid()
      )
    )'
);

SELECT create_policy_if_not_exists(
  'Service role can manage data contributions',
  'data_contributions',
  'CREATE POLICY "Service role can manage data contributions" ON public.data_contributions
    FOR ALL USING (auth.jwt()->>''"role"'' = ''service_role'')'
);

-- data_exchange_agreements (uses provider_id and consumer_id)
SELECT create_policy_if_not_exists(
  'Users can view their org''s data agreements',
  'data_exchange_agreements',
  'CREATE POLICY "Users can view their org''s data agreements" ON public.data_exchange_agreements
    FOR SELECT USING (
      provider_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid()
      )
      OR consumer_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid()
      )
    )'
);

SELECT create_policy_if_not_exists(
  'Account owners can manage data agreements',
  'data_exchange_agreements',
  'CREATE POLICY "Account owners can manage data agreements" ON public.data_exchange_agreements
    FOR ALL USING (
      (provider_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid()
        AND role = ''account_owner''
      ))
      OR (consumer_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid()
        AND role = ''account_owner''
      ))
    )'
);

-- data_transactions (uses consumer_id and provider_id)
SELECT create_policy_if_not_exists(
  'Users can view their org''s data transactions',
  'data_transactions',
  'CREATE POLICY "Users can view their org''s data transactions" ON public.data_transactions
    FOR SELECT USING (
      consumer_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid()
      )
      OR provider_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid()
      )
    )'
);

SELECT create_policy_if_not_exists(
  'Service role can manage data transactions',
  'data_transactions',
  'CREATE POLICY "Service role can manage data transactions" ON public.data_transactions
    FOR ALL USING (auth.jwt()->>''"role"'' = ''service_role'')'
);

-- 6. ML tables

-- ml_experiments (check if table exists and has organization_id)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ml_experiments' 
    AND column_name = 'organization_id'
  ) THEN
    PERFORM create_policy_if_not_exists(
      'Users can view their org''s ML experiments',
      'ml_experiments',
      'CREATE POLICY "Users can view their org''s ML experiments" ON public.ml_experiments
        FOR SELECT USING (
          organization_id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid()
          )
        )'
    );
    
    PERFORM create_policy_if_not_exists(
      'Service role can manage ML experiments',
      'ml_experiments',
      'CREATE POLICY "Service role can manage ML experiments" ON public.ml_experiments
        FOR ALL USING (auth.jwt()->>''"role"'' = ''service_role'')'
    );
  END IF;
END $$;

-- 7. Authentication tables (user-specific)

-- mfa_challenges
SELECT create_policy_if_not_exists(
  'Users can view their own MFA challenges',
  'mfa_challenges',
  'CREATE POLICY "Users can view their own MFA challenges" ON public.mfa_challenges
    FOR SELECT USING (user_id = auth.uid())'
);

SELECT create_policy_if_not_exists(
  'Users can manage their own MFA challenges',
  'mfa_challenges',
  'CREATE POLICY "Users can manage their own MFA challenges" ON public.mfa_challenges
    FOR ALL USING (user_id = auth.uid())'
);

-- pending_mfa_setups
SELECT create_policy_if_not_exists(
  'Users can view their own pending MFA setups',
  'pending_mfa_setups',
  'CREATE POLICY "Users can view their own pending MFA setups" ON public.pending_mfa_setups
    FOR SELECT USING (user_id = auth.uid())'
);

SELECT create_policy_if_not_exists(
  'Users can manage their own MFA setups',
  'pending_mfa_setups',
  'CREATE POLICY "Users can manage their own MFA setups" ON public.pending_mfa_setups
    FOR ALL USING (user_id = auth.uid())'
);

-- sso_auth_requests (no organization_id, uses email domain)
SELECT create_policy_if_not_exists(
  'Service role can manage SSO auth requests',
  'sso_auth_requests',
  'CREATE POLICY "Service role can manage SSO auth requests" ON public.sso_auth_requests
    FOR ALL USING (auth.jwt()->>''"role"'' = ''service_role'')'
);

-- Clean up helper function
DROP FUNCTION create_policy_if_not_exists(text, text, text);

-- Summary
DO $$
BEGIN
  RAISE NOTICE 'Successfully added RLS policies for all tables with RLS enabled but no policies';
  RAISE NOTICE 'Tables now have appropriate access controls based on organization membership and user roles';
END $$;