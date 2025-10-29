-- Phase 2 & 3 Missing Tables Only
-- This migration ONLY creates tables that don't exist in production
-- It does NOT modify existing tables because they have different schemas

-- ============================================================================
-- PHASE 2: WEATHER SERVICE
-- ============================================================================

-- Weather History Table
CREATE TABLE IF NOT EXISTS weather_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  recorded_at TIMESTAMPTZ NOT NULL,
  temperature_celsius DECIMAL(5, 2),
  humidity_percent DECIMAL(5, 2),
  precipitation_mm DECIMAL(8, 2),
  wind_speed_kmh DECIMAL(6, 2),
  weather_condition TEXT,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weather Alerts Table
CREATE TABLE IF NOT EXISTS weather_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  alert_type TEXT CHECK (alert_type IN ('extreme_heat', 'extreme_cold', 'storm', 'flood', 'other')),
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- ============================================================================
-- PHASE 2: DATABASE OPTIMIZATION SERVICE
-- ============================================================================

-- Database Optimization Reports Table
CREATE TABLE IF NOT EXISTS database_optimization_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  report_type TEXT CHECK (report_type IN ('index_analysis', 'query_performance', 'table_bloat', 'general_health')),
  findings JSONB NOT NULL,
  recommendations JSONB,
  severity TEXT CHECK (severity IN ('info', 'warning', 'critical')),
  impact_score DECIMAL(5, 2) CHECK (impact_score BETWEEN 0 AND 100),
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PHASE 3: PROMPT OPTIMIZATION SERVICE
-- ============================================================================

-- AI Conversation Analytics Table
CREATE TABLE IF NOT EXISTS ai_conversation_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  conversation_id UUID,
  message_count INTEGER,
  avg_response_time_ms INTEGER,
  user_satisfaction_score DECIMAL(3, 2),
  topics_discussed TEXT[],
  common_intents TEXT[],
  conversation_metadata JSONB,
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Pattern Insights Table
CREATE TABLE IF NOT EXISTS ai_pattern_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  pattern_type TEXT CHECK (pattern_type IN ('user_behavior', 'query_pattern', 'response_pattern', 'error_pattern')),
  pattern_description TEXT NOT NULL,
  frequency INTEGER,
  confidence_score DECIMAL(5, 2) CHECK (confidence_score BETWEEN 0 AND 1),
  recommended_action TEXT,
  pattern_data JSONB,
  first_detected TIMESTAMPTZ DEFAULT NOW(),
  last_detected TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Weather History Indexes
CREATE INDEX IF NOT EXISTS idx_weather_history_org_site
  ON weather_history(organization_id, site_id);
CREATE INDEX IF NOT EXISTS idx_weather_history_recorded_at
  ON weather_history(recorded_at DESC);

-- Weather Alerts Indexes
CREATE INDEX IF NOT EXISTS idx_weather_alerts_org_site
  ON weather_alerts(organization_id, site_id);
CREATE INDEX IF NOT EXISTS idx_weather_alerts_active
  ON weather_alerts(is_active) WHERE is_active = TRUE;

-- Database Optimization Reports Indexes
CREATE INDEX IF NOT EXISTS idx_db_optimization_org
  ON database_optimization_reports(organization_id);
CREATE INDEX IF NOT EXISTS idx_db_optimization_generated_at
  ON database_optimization_reports(generated_at DESC);

-- AI Conversation Analytics Indexes
CREATE INDEX IF NOT EXISTS idx_conversation_analytics_org
  ON ai_conversation_analytics(organization_id);
CREATE INDEX IF NOT EXISTS idx_conversation_analytics_conversation
  ON ai_conversation_analytics(conversation_id);

-- AI Pattern Insights Indexes
CREATE INDEX IF NOT EXISTS idx_pattern_insights_org
  ON ai_pattern_insights(organization_id);
CREATE INDEX IF NOT EXISTS idx_pattern_insights_type
  ON ai_pattern_insights(pattern_type);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE weather_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE database_optimization_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversation_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_pattern_insights ENABLE ROW LEVEL SECURITY;

-- Weather History RLS Policies
DROP POLICY IF EXISTS "Users can view their org weather history" ON weather_history;
CREATE POLICY "Users can view their org weather history" ON weather_history
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role full access to weather history" ON weather_history;
CREATE POLICY "Service role full access to weather history" ON weather_history
  FOR ALL USING (true);

-- Weather Alerts RLS Policies
DROP POLICY IF EXISTS "Users can view their org weather alerts" ON weather_alerts;
CREATE POLICY "Users can view their org weather alerts" ON weather_alerts
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role full access to weather alerts" ON weather_alerts;
CREATE POLICY "Service role full access to weather alerts" ON weather_alerts
  FOR ALL USING (true);

-- Database Optimization Reports RLS Policies
DROP POLICY IF EXISTS "Users can view their org db optimization reports" ON database_optimization_reports;
CREATE POLICY "Users can view their org db optimization reports" ON database_optimization_reports
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role full access to db optimization reports" ON database_optimization_reports;
CREATE POLICY "Service role full access to db optimization reports" ON database_optimization_reports
  FOR ALL USING (true);

-- AI Conversation Analytics RLS Policies
DROP POLICY IF EXISTS "Users can view their org conversation analytics" ON ai_conversation_analytics;
CREATE POLICY "Users can view their org conversation analytics" ON ai_conversation_analytics
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role full access to conversation analytics" ON ai_conversation_analytics;
CREATE POLICY "Service role full access to conversation analytics" ON ai_conversation_analytics
  FOR ALL USING (true);

-- AI Pattern Insights RLS Policies
DROP POLICY IF EXISTS "Users can view their org pattern insights" ON ai_pattern_insights;
CREATE POLICY "Users can view their org pattern insights" ON ai_pattern_insights
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role full access to pattern insights" ON ai_pattern_insights;
CREATE POLICY "Service role full access to pattern insights" ON ai_pattern_insights
  FOR ALL USING (true);
