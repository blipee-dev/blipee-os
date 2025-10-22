-- ============================================================================
-- Survey System for Data Collection
-- ============================================================================
--
-- This migration creates a flexible survey system that allows organizations
-- to collect data from employees/stakeholders and automatically convert
-- responses into metrics_data entries.
--
-- Use cases:
-- - Employee commute surveys (Scope 3.7)
-- - Logistics/freight data collection (Scope 3.4, 3.9)
-- - Business travel surveys
-- - Fleet usage tracking
--
-- Created: 2025-10-21
-- ============================================================================

-- Survey templates define the structure of surveys
CREATE TABLE IF NOT EXISTS survey_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'commute', 'logistics', 'business_travel', 'fleet', 'custom'
  is_active BOOLEAN DEFAULT true,
  is_recurring BOOLEAN DEFAULT false, -- Should this survey be sent periodically?
  recurrence_frequency TEXT, -- 'monthly', 'quarterly', 'annually'
  questions JSONB NOT NULL, -- Array of question objects
  metric_mappings JSONB NOT NULL, -- Map question IDs to metric_catalog codes
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Individual survey instances (sent to users)
CREATE TABLE IF NOT EXISTS surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES survey_templates(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft', -- 'draft', 'active', 'closed'
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  target_audience TEXT, -- 'all_employees', 'specific_roles', 'specific_users'
  audience_filter JSONB, -- Filter criteria for who should receive
  responses_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Survey responses from individuals
CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
  template_id UUID REFERENCES survey_templates(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  respondent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL if anonymous
  respondent_email TEXT,
  respondent_name TEXT,
  answers JSONB NOT NULL, -- { "question_id": "answer_value" }
  metadata JSONB, -- Additional context (user role, department, etc.)
  processed BOOLEAN DEFAULT false, -- Has this been converted to metrics_data?
  processed_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Track which metrics were created from survey responses
CREATE TABLE IF NOT EXISTS survey_metrics_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID REFERENCES survey_responses(id) ON DELETE CASCADE,
  metric_data_id UUID REFERENCES metrics_data(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  metric_code TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_survey_templates_org
  ON survey_templates(organization_id, is_active);

CREATE INDEX IF NOT EXISTS idx_surveys_org_status
  ON surveys(organization_id, status);

CREATE INDEX IF NOT EXISTS idx_survey_responses_survey
  ON survey_responses(survey_id, submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_survey_responses_processed
  ON survey_responses(organization_id, processed);

CREATE INDEX IF NOT EXISTS idx_survey_metrics_mapping_response
  ON survey_metrics_mapping(response_id);

-- Row Level Security
ALTER TABLE survey_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_metrics_mapping ENABLE ROW LEVEL SECURITY;

-- RLS Policies for survey_templates
CREATE POLICY "Users can view their org's survey templates"
  ON survey_templates FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can create survey templates"
  ON survey_templates FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
      AND role IN ('account_owner', 'sustainability_manager', 'facility_manager')
    )
  );

CREATE POLICY "Managers can update survey templates"
  ON survey_templates FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
      AND role IN ('account_owner', 'sustainability_manager', 'facility_manager')
    )
  );

-- RLS Policies for surveys
CREATE POLICY "Users can view their org's surveys"
  ON surveys FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can create surveys"
  ON surveys FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
      AND role IN ('account_owner', 'sustainability_manager', 'facility_manager')
    )
  );

-- RLS Policies for survey_responses
CREATE POLICY "Users can view responses to their org's surveys"
  ON survey_responses FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can submit survey responses"
  ON survey_responses FOR INSERT
  WITH CHECK (true); -- Open for public/anonymous submissions

-- RLS Policies for survey_metrics_mapping
CREATE POLICY "Users can view their org's survey metrics mappings"
  ON survey_metrics_mapping FOR SELECT
  USING (
    response_id IN (
      SELECT id FROM survey_responses
      WHERE organization_id IN (
        SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
      )
    )
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_survey_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER survey_templates_updated_at
  BEFORE UPDATE ON survey_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_survey_updated_at();

CREATE TRIGGER surveys_updated_at
  BEFORE UPDATE ON surveys
  FOR EACH ROW
  EXECUTE FUNCTION update_survey_updated_at();

-- Function to increment responses_count
CREATE OR REPLACE FUNCTION increment_survey_responses_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE surveys
  SET responses_count = responses_count + 1
  WHERE id = NEW.survey_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER survey_response_submitted
  AFTER INSERT ON survey_responses
  FOR EACH ROW
  EXECUTE FUNCTION increment_survey_responses_count();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
