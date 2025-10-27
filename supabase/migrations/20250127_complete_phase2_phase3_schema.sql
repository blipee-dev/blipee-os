-- Complete Schema for Phase 2 & 3 Services
-- Run this migration in Supabase SQL Editor

-- ============================================================================
-- 0. CREATE BASE TABLES IF MISSING (Prerequisites)
-- ============================================================================

-- Create sites table if it doesn't exist
CREATE TABLE IF NOT EXISTS sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,
  type TEXT DEFAULT 'office',
  total_area_sqm NUMERIC,
  total_employees INTEGER,
  floors INTEGER,
  floor_details JSONB DEFAULT '[]',
  timezone TEXT DEFAULT 'UTC',
  status TEXT DEFAULT 'active',
  devices_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create agent_task_results table if it doesn't exist
CREATE TABLE IF NOT EXISTS agent_task_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  task_id UUID,
  agent_type TEXT,
  status TEXT,
  result JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create organization_members table if it doesn't exist (for RLS policies)
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- References auth.users
  role TEXT DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- ============================================================================
-- 1. ADD LOCATION COLUMNS TO SITES TABLE (Weather Service)
-- ============================================================================
ALTER TABLE sites
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS country TEXT;

CREATE INDEX IF NOT EXISTS idx_sites_location
ON sites(latitude, longitude)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

COMMENT ON COLUMN sites.latitude IS 'Facility latitude for weather tracking';
COMMENT ON COLUMN sites.longitude IS 'Facility longitude for weather tracking';


-- ============================================================================
-- 2. ADD NOTIFICATION COLUMNS TO AGENT_TASK_RESULTS (Notification Queue)
-- ============================================================================
ALTER TABLE agent_task_results
ADD COLUMN IF NOT EXISTS notification_importance TEXT CHECK (notification_importance IN ('none', 'info', 'alert', 'critical')),
ADD COLUMN IF NOT EXISTS notification_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS notification_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_agent_task_results_notification_queue
ON agent_task_results(notification_importance, notification_sent, created_at)
WHERE notification_importance IN ('alert', 'critical');


-- ============================================================================
-- 3. CREATE AI_CONVERSATION_ANALYTICS TABLE (Prompt Optimization)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_conversation_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID, -- References auth.users but no FK constraint (cross-schema)
  conversation_id UUID,
  user_message TEXT NOT NULL,
  ai_response TEXT,
  user_rating INTEGER CHECK (user_rating BETWEEN 1 AND 5),
  helpful BOOLEAN,
  response_time_ms INTEGER,
  total_tokens INTEGER,
  tool_success_rate DECIMAL(5, 2),
  tools_used JSONB,
  clarifying_questions_asked INTEGER DEFAULT 0,
  error_occurred BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_conversation_analytics_org ON ai_conversation_analytics(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_conversation_analytics_rating ON ai_conversation_analytics(user_rating) WHERE user_rating IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ai_conversation_analytics_errors ON ai_conversation_analytics(error_occurred) WHERE error_occurred = TRUE;


-- ============================================================================
-- 4. CREATE AI_PATTERN_INSIGHTS TABLE (Prompt Optimization)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_pattern_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('failed_query', 'tool_selection_error', 'clarification_needed', 'low_satisfaction', 'token_inefficiency')),
  pattern_description TEXT NOT NULL,
  example_queries TEXT[] NOT NULL,
  frequency INTEGER NOT NULL,
  suggested_prompt_improvements TEXT,
  confidence_score DECIMAL(5, 2) CHECK (confidence_score BETWEEN 0 AND 100),
  analyzed_from TIMESTAMPTZ NOT NULL,
  analyzed_to TIMESTAMPTZ NOT NULL,
  is_actionable BOOLEAN DEFAULT TRUE,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_pattern_insights_type ON ai_pattern_insights(pattern_type, is_actionable, is_resolved);
CREATE INDEX IF NOT EXISTS idx_ai_pattern_insights_frequency ON ai_pattern_insights(frequency DESC, confidence_score DESC);


-- ============================================================================
-- 5. CREATE WEATHER_HISTORY TABLE (Weather Service)
-- ============================================================================
CREATE TABLE IF NOT EXISTS weather_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL,
  temperature_c DECIMAL(5, 2),
  humidity_percent DECIMAL(5, 2),
  wind_speed_kmh DECIMAL(5, 2),
  precipitation_mm DECIMAL(5, 2),
  conditions TEXT,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_weather_history_facility ON weather_history(facility_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_weather_history_org ON weather_history(organization_id, timestamp DESC);


-- ============================================================================
-- 6. CREATE WEATHER_ALERTS TABLE (Weather Service)
-- ============================================================================
CREATE TABLE IF NOT EXISTS weather_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('info', 'warning', 'critical')),
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID, -- References auth.users but no FK constraint (cross-schema)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_weather_alerts_facility ON weather_alerts(facility_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_weather_alerts_unacknowledged ON weather_alerts(organization_id, acknowledged) WHERE acknowledged = FALSE;


-- ============================================================================
-- 7. CREATE OPTIMIZATION_OPPORTUNITIES TABLE (Optimization Service)
-- ============================================================================
CREATE TABLE IF NOT EXISTS optimization_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('energy_waste', 'emission_hotspot', 'water_inefficiency', 'cost_reduction')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  potential_savings DECIMAL(12, 2),
  potential_emission_reduction DECIMAL(12, 2),
  confidence_score DECIMAL(5, 2) CHECK (confidence_score BETWEEN 0 AND 1),
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')),
  implementation_effort TEXT CHECK (implementation_effort IN ('low', 'medium', 'high')),
  status TEXT CHECK (status IN ('identified', 'in_progress', 'implemented', 'dismissed')) DEFAULT 'identified',
  data_source JSONB,
  identified_at TIMESTAMPTZ DEFAULT NOW(),
  implemented_at TIMESTAMPTZ,
  actual_savings DECIMAL(12, 2),
  actual_emission_reduction DECIMAL(12, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if table already existed
ALTER TABLE optimization_opportunities ADD COLUMN IF NOT EXISTS priority TEXT CHECK (priority IN ('high', 'medium', 'low'));
ALTER TABLE optimization_opportunities ADD COLUMN IF NOT EXISTS implementation_effort TEXT CHECK (implementation_effort IN ('low', 'medium', 'high'));
ALTER TABLE optimization_opportunities ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('identified', 'in_progress', 'implemented', 'dismissed'));
ALTER TABLE optimization_opportunities ADD COLUMN IF NOT EXISTS actual_savings DECIMAL(12, 2);
ALTER TABLE optimization_opportunities ADD COLUMN IF NOT EXISTS actual_emission_reduction DECIMAL(12, 2);

CREATE INDEX IF NOT EXISTS idx_optimization_opportunities_org ON optimization_opportunities(organization_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_optimization_opportunities_priority ON optimization_opportunities(priority, status);


-- ============================================================================
-- 8. CREATE DATABASE_OPTIMIZATION_REPORTS TABLE (Database Optimization)
-- ============================================================================
CREATE TABLE IF NOT EXISTS database_optimization_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_data JSONB NOT NULL,
  slow_queries_detected INTEGER DEFAULT 0,
  missing_indexes_detected INTEGER DEFAULT 0,
  optimizations_applied INTEGER DEFAULT 0,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if table already existed
ALTER TABLE database_optimization_reports ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_database_optimization_reports_date ON database_optimization_reports(generated_at DESC);


-- ============================================================================
-- 9. CREATE SUSTAINABILITY_REPORTS TABLE (Report Generation)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sustainability_reports (
  id TEXT PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL,
  report_period TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL,
  report_data JSONB NOT NULL,
  report_markdown TEXT,
  report_pdf_url TEXT,
  emailed_to TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if table already existed
ALTER TABLE sustainability_reports ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE sustainability_reports ADD COLUMN IF NOT EXISTS report_markdown TEXT;
ALTER TABLE sustainability_reports ADD COLUMN IF NOT EXISTS report_pdf_url TEXT;
ALTER TABLE sustainability_reports ADD COLUMN IF NOT EXISTS emailed_to TEXT[];

CREATE INDEX IF NOT EXISTS idx_sustainability_reports_org ON sustainability_reports(organization_id, generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_sustainability_reports_type ON sustainability_reports(report_type, generated_at DESC);


-- ============================================================================
-- 10. CREATE ML_MODELS TABLE (ML Training)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ml_models (
  model_id TEXT PRIMARY KEY,
  model_type TEXT CHECK (model_type IN ('emissions_forecast', 'energy_forecast', 'anomaly_detection', 'optimization')),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  hyperparameters JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  training_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ml_models_org ON ml_models(organization_id, is_active);


-- ============================================================================
-- 11. CREATE ML_EVALUATIONS TABLE (ML Training)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ml_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id TEXT REFERENCES ml_models(model_id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  accuracy DECIMAL(5, 4),
  mae DECIMAL(12, 4),
  rmse DECIMAL(12, 4),
  r2_score DECIMAL(5, 4),
  training_samples INTEGER,
  is_production BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ml_evaluations_model ON ml_evaluations(model_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ml_evaluations_production ON ml_evaluations(model_id, is_production) WHERE is_production = TRUE;


-- ============================================================================
-- 12. CREATE ML_TRAINING_LOGS TABLE (ML Training)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ml_training_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id TEXT REFERENCES ml_models(model_id) ON DELETE CASCADE,
  model_type TEXT,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  accuracy DECIMAL(5, 4),
  mae DECIMAL(12, 4),
  rmse DECIMAL(12, 4),
  r2_score DECIMAL(5, 4),
  training_samples INTEGER,
  training_duration_ms INTEGER,
  hyperparameters JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ml_training_logs_model ON ml_training_logs(model_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ml_training_logs_org ON ml_training_logs(organization_id, created_at DESC);


-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
-- Grant appropriate permissions to authenticated users
-- Adjust these based on your RLS policies

GRANT SELECT, INSERT, UPDATE ON ai_conversation_analytics TO authenticated;
GRANT SELECT ON ai_pattern_insights TO authenticated;
GRANT SELECT ON weather_history TO authenticated;
GRANT SELECT, UPDATE ON weather_alerts TO authenticated;
GRANT SELECT, UPDATE ON optimization_opportunities TO authenticated;
GRANT SELECT ON database_optimization_reports TO authenticated;
GRANT SELECT ON sustainability_reports TO authenticated;
GRANT SELECT ON ml_models TO authenticated;
GRANT SELECT ON ml_evaluations TO authenticated;
GRANT SELECT ON ml_training_logs TO authenticated;

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE ai_conversation_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_pattern_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimization_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE database_optimization_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE sustainability_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_training_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES (Basic - adjust based on your needs)
-- ============================================================================

-- AI Conversation Analytics: Users can only see their own org's data
DROP POLICY IF EXISTS "Users can view their org's conversation analytics" ON ai_conversation_analytics;
CREATE POLICY "Users can view their org's conversation analytics"
ON ai_conversation_analytics FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  )
);

-- Weather: Users can only see their org's weather data
DROP POLICY IF EXISTS "Users can view their org's weather data" ON weather_history;
CREATE POLICY "Users can view their org's weather data"
ON weather_history FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can view their org's weather alerts" ON weather_alerts;
CREATE POLICY "Users can view their org's weather alerts"
ON weather_alerts FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  )
);

-- Optimization Opportunities: Users can view and update their org's opportunities
DROP POLICY IF EXISTS "Users can view their org's optimization opportunities" ON optimization_opportunities;
CREATE POLICY "Users can view their org's optimization opportunities"
ON optimization_opportunities FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update their org's optimization opportunities" ON optimization_opportunities;
CREATE POLICY "Users can update their org's optimization opportunities"
ON optimization_opportunities FOR UPDATE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  )
);

-- Reports: Users can only see their org's reports
DROP POLICY IF EXISTS "Users can view their org's reports" ON sustainability_reports;
CREATE POLICY "Users can view their org's reports"
ON sustainability_reports FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  )
);

-- ML Models: Users can only see their org's models
DROP POLICY IF EXISTS "Users can view their org's ML models" ON ml_models;
CREATE POLICY "Users can view their org's ML models"
ON ml_models FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can view their org's ML evaluations" ON ml_evaluations;
CREATE POLICY "Users can view their org's ML evaluations"
ON ml_evaluations FOR SELECT
TO authenticated
USING (
  model_id IN (
    SELECT model_id FROM ml_models WHERE organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Users can view their org's ML training logs" ON ml_training_logs;
CREATE POLICY "Users can view their org's ML training logs"
ON ml_training_logs FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  )
);

-- Service role has full access (for background worker)
DROP POLICY IF EXISTS "Service role has full access to all tables" ON ai_conversation_analytics;
CREATE POLICY "Service role has full access to all tables"
ON ai_conversation_analytics FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Service role policies for all other tables
DROP POLICY IF EXISTS "Service role has full access to patterns" ON ai_pattern_insights;
CREATE POLICY "Service role has full access to patterns"
ON ai_pattern_insights FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role has full access to weather history" ON weather_history;
CREATE POLICY "Service role has full access to weather history"
ON weather_history FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role has full access to weather alerts" ON weather_alerts;
CREATE POLICY "Service role has full access to weather alerts"
ON weather_alerts FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role has full access to optimization" ON optimization_opportunities;
CREATE POLICY "Service role has full access to optimization"
ON optimization_opportunities FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role has full access to db reports" ON database_optimization_reports;
CREATE POLICY "Service role has full access to db reports"
ON database_optimization_reports FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role has full access to reports" ON sustainability_reports;
CREATE POLICY "Service role has full access to reports"
ON sustainability_reports FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role has full access to ml models" ON ml_models;
CREATE POLICY "Service role has full access to ml models"
ON ml_models FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role has full access to ml evaluations" ON ml_evaluations;
CREATE POLICY "Service role has full access to ml evaluations"
ON ml_evaluations FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role has full access to ml training logs" ON ml_training_logs;
CREATE POLICY "Service role has full access to ml training logs"
ON ml_training_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

COMMENT ON TABLE ai_conversation_analytics IS 'Stores conversation analytics for ML-based prompt optimization';
COMMENT ON TABLE ai_pattern_insights IS 'Identified patterns from conversation analysis for prompt improvements';
COMMENT ON TABLE weather_history IS 'Historical weather data for facility locations';
COMMENT ON TABLE weather_alerts IS 'Weather alerts for extreme conditions';
COMMENT ON TABLE optimization_opportunities IS 'Identified cost-saving and emission-reduction opportunities';
COMMENT ON TABLE database_optimization_reports IS 'Database performance optimization reports';
COMMENT ON TABLE sustainability_reports IS 'Auto-generated monthly sustainability reports';
COMMENT ON TABLE ml_models IS 'ML model configurations for forecasting and optimization';
COMMENT ON TABLE ml_evaluations IS 'ML model performance evaluations';
COMMENT ON TABLE ml_training_logs IS 'ML model training history and metrics';
