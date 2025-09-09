-- AI Test Framework Tables
-- Store test results and custom test suites

-- Create table for AI test results
CREATE TABLE IF NOT EXISTS ai_test_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  suite_id VARCHAR(255) NOT NULL,
  scenario_id VARCHAR(255),
  results JSONB NOT NULL,
  report TEXT NOT NULL,
  passed BOOLEAN NOT NULL DEFAULT false,
  score DECIMAL(3,2) NOT NULL CHECK (score >= 0 AND score <= 1),
  run_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for performance
  INDEX idx_ai_test_results_org (organization_id),
  INDEX idx_ai_test_results_suite (suite_id),
  INDEX idx_ai_test_results_created (created_at DESC)
);

-- Create table for custom test suites
CREATE TABLE IF NOT EXISTS ai_test_suites (
  id VARCHAR(255) PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  suite_data JSONB NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique suite names per organization
  UNIQUE(organization_id, id),
  
  -- Indexes for performance
  INDEX idx_ai_test_suites_org (organization_id)
);

-- Enable RLS for test results
ALTER TABLE ai_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_test_suites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for test results
CREATE POLICY "Users can view test results for their organization"
  ON ai_test_results
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = ai_test_results.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can create test results"
  ON ai_test_results
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = ai_test_results.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('account_owner', 'sustainability_manager')
    )
  );

CREATE POLICY "Admins can delete old test results"
  ON ai_test_results
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = ai_test_results.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'account_owner'
    )
    AND created_at < NOW() - INTERVAL '90 days'
  );

-- RLS Policies for test suites
CREATE POLICY "Users can view test suites for their organization"
  ON ai_test_suites
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = ai_test_suites.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Account owners can manage test suites"
  ON ai_test_suites
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = ai_test_suites.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'account_owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = ai_test_suites.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'account_owner'
    )
  );

-- Create function to clean up old test results
CREATE OR REPLACE FUNCTION cleanup_old_test_results()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM ai_test_results
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON TABLE ai_test_results IS 'Stores results from AI conversation test runs';
COMMENT ON TABLE ai_test_suites IS 'Stores custom AI test suites created by organizations';
COMMENT ON FUNCTION cleanup_old_test_results() IS 'Removes test results older than 90 days';