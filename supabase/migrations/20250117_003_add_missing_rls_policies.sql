-- Add missing RLS policies for tables with RLS enabled but no policies
-- This migration addresses the rls_enabled_no_policy INFO warnings

-- 1. Agent-related tables
-- These tables are linked to organizations through agent_instances

-- agent_collaborations (linked through initiator_agent_id and collaborator_agent_id)
CREATE POLICY "Users can view their org's agent collaborations" ON public.agent_collaborations
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
  );

CREATE POLICY "Service role can manage agent collaborations" ON public.agent_collaborations
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- agent_decisions (linked through agent_instance_id)
CREATE POLICY "Users can view their org's agent decisions" ON public.agent_decisions
  FOR SELECT USING (
    agent_instance_id IN (
      SELECT id FROM public.agent_instances
      WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Service role can manage agent decisions" ON public.agent_decisions
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- agent_learning_patterns (linked through agent_instance_id)
CREATE POLICY "Users can view their org's agent learning patterns" ON public.agent_learning_patterns
  FOR SELECT USING (
    agent_instance_id IN (
      SELECT id FROM public.agent_instances
      WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Service role can manage agent learning patterns" ON public.agent_learning_patterns
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- agent_metrics (linked through agent_instance_id)
CREATE POLICY "Users can view their org's agent metrics" ON public.agent_metrics
  FOR SELECT USING (
    agent_instance_id IN (
      SELECT id FROM public.agent_instances
      WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Service role can manage agent metrics" ON public.agent_metrics
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- agent_task_executions (linked through agent_instance_id)
CREATE POLICY "Users can view their org's agent task executions" ON public.agent_task_executions
  FOR SELECT USING (
    agent_instance_id IN (
      SELECT id FROM public.agent_instances
      WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Service role can manage agent task executions" ON public.agent_task_executions
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- 2. Benchmark and network tables

-- benchmark_cohorts
CREATE POLICY "Users can view benchmark cohorts they're part of" ON public.benchmark_cohorts
  FOR SELECT USING (
    id IN (
      SELECT cohort_id FROM public.cohort_members
      WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Service role can manage benchmark cohorts" ON public.benchmark_cohorts
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- cohort_members
CREATE POLICY "Users can view their org's cohort memberships" ON public.cohort_members
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage cohort members" ON public.cohort_members
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- 3. Core business tables

-- buildings
CREATE POLICY "Users can view their org's buildings" ON public.buildings
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Facility managers can manage buildings" ON public.buildings
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid() 
      AND role IN ('account_owner', 'sustainability_manager', 'facility_manager')
    )
  );

-- documents
CREATE POLICY "Users can view their org's documents" ON public.documents
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their org's documents" ON public.documents
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
      AND role IN ('account_owner', 'sustainability_manager', 'facility_manager', 'analyst')
    )
  );

-- document_uploads
CREATE POLICY "Users can view their own uploads" ON public.document_uploads
  FOR SELECT USING (uploaded_by = auth.uid());

CREATE POLICY "Users can create uploads" ON public.document_uploads
  FOR INSERT WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Service role can manage all uploads" ON public.document_uploads
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- 4. Emissions and sustainability data

-- emissions_data
CREATE POLICY "Users can view their org's emissions data" ON public.emissions_data
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can manage emissions data" ON public.emissions_data
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
      AND role IN ('account_owner', 'sustainability_manager', 'facility_manager')
    )
  );

-- waste_data
CREATE POLICY "Users can view their org's waste data" ON public.waste_data
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can manage waste data" ON public.waste_data
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
      AND role IN ('account_owner', 'sustainability_manager', 'facility_manager')
    )
  );

-- water_usage
CREATE POLICY "Users can view their org's water usage" ON public.water_usage
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can manage water usage" ON public.water_usage
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
      AND role IN ('account_owner', 'sustainability_manager', 'facility_manager')
    )
  );

-- sustainability_reports
CREATE POLICY "Users can view their org's reports" ON public.sustainability_reports
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can manage reports" ON public.sustainability_reports
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
      AND role IN ('account_owner', 'sustainability_manager')
    )
  );

-- supplier_assessments
CREATE POLICY "Users can view their org's supplier assessments" ON public.supplier_assessments
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can manage supplier assessments" ON public.supplier_assessments
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
      AND role IN ('account_owner', 'sustainability_manager', 'analyst')
    )
  );

-- 5. Marketplace and data exchange

-- marketplace_accounts
CREATE POLICY "Users can view their org's marketplace account" ON public.marketplace_accounts
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Account owners can manage marketplace account" ON public.marketplace_accounts
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
      AND role = 'account_owner'
    )
  );

-- data_contributions
CREATE POLICY "Users can view their org's data contributions" ON public.data_contributions
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage data contributions" ON public.data_contributions
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- data_exchange_agreements
CREATE POLICY "Users can view their org's data agreements" ON public.data_exchange_agreements
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Account owners can manage data agreements" ON public.data_exchange_agreements
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
      AND role = 'account_owner'
    )
  );

-- data_transactions
CREATE POLICY "Users can view their org's data transactions" ON public.data_transactions
  FOR SELECT USING (
    requester_org_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
    OR provider_org_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage data transactions" ON public.data_transactions
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- 6. ML tables

-- ml_experiments
CREATE POLICY "Users can view their org's ML experiments" ON public.ml_experiments
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage ML experiments" ON public.ml_experiments
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- 7. Authentication tables (user-specific)

-- mfa_challenges
CREATE POLICY "Users can view their own MFA challenges" ON public.mfa_challenges
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own MFA challenges" ON public.mfa_challenges
  FOR ALL USING (user_id = auth.uid());

-- pending_mfa_setups
CREATE POLICY "Users can view their own pending MFA setups" ON public.pending_mfa_setups
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own MFA setups" ON public.pending_mfa_setups
  FOR ALL USING (user_id = auth.uid());

-- sso_auth_requests
CREATE POLICY "Service role can manage SSO auth requests" ON public.sso_auth_requests
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Summary
DO $$
BEGIN
  RAISE NOTICE 'Successfully added RLS policies for all tables with RLS enabled but no policies';
  RAISE NOTICE 'Tables now have appropriate access controls based on organization membership and user roles';
END $$;