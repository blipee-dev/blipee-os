-- Zero-Typing AI Integration System Database Schema
-- Version: 1.0.0
-- Date: 2025-01-24

-- =====================================================
-- Card Definitions Table
-- Stores all card types and configurations
-- =====================================================
CREATE TABLE IF NOT EXISTS card_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_type VARCHAR(50) NOT NULL CHECK (card_type IN (
    'metric', 'chart', 'alert', 'agent', 'action', 'workflow', 'insight', 'status'
  )),
  agent_id VARCHAR(100), -- Links to AI agent if applicable
  title VARCHAR(255) NOT NULL,
  description TEXT,
  layout_config JSONB NOT NULL DEFAULT '{}', -- Visual layout configuration
  data_bindings JSONB NOT NULL DEFAULT '{}', -- Data source bindings
  quick_actions JSONB DEFAULT '[]', -- Available quick actions
  update_frequency VARCHAR(50) DEFAULT 'realtime', -- realtime, hourly, daily
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_card_definitions_type ON card_definitions(card_type);
CREATE INDEX idx_card_definitions_agent ON card_definitions(agent_id);

-- =====================================================
-- User Card Preferences
-- Stores user-specific card settings and layouts
-- =====================================================
CREATE TABLE IF NOT EXISTS user_card_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id UUID REFERENCES card_definitions(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0, -- Card position in grid
  is_pinned BOOLEAN DEFAULT false, -- Pinned cards always show first
  is_hidden BOOLEAN DEFAULT false, -- Hidden cards don't appear
  custom_config JSONB DEFAULT '{}', -- User customizations
  last_interacted TIMESTAMP WITH TIME ZONE,
  interaction_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, card_id)
);

-- Indexes for performance
CREATE INDEX idx_user_card_preferences_user ON user_card_preferences(user_id);
CREATE INDEX idx_user_card_preferences_position ON user_card_preferences(position);
CREATE INDEX idx_user_card_preferences_pinned ON user_card_preferences(is_pinned);

-- =====================================================
-- Card Interactions History
-- Tracks all user interactions for learning
-- =====================================================
CREATE TABLE IF NOT EXISTS card_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id UUID REFERENCES card_definitions(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL, -- tap, long_press, swipe_left, etc.
  action_target VARCHAR(255), -- Specific button or area clicked
  context_snapshot JSONB, -- Full context at time of interaction
  response_time_ms INTEGER, -- How fast the system responded
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for analytics
CREATE INDEX idx_card_interactions_user ON card_interactions(user_id);
CREATE INDEX idx_card_interactions_card ON card_interactions(card_id);
CREATE INDEX idx_card_interactions_timestamp ON card_interactions(timestamp DESC);
CREATE INDEX idx_card_interactions_action ON card_interactions(action_type);

-- =====================================================
-- Predicted Cards Queue
-- AI predictions for what cards users will need
-- =====================================================
CREATE TABLE IF NOT EXISTS predicted_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id UUID REFERENCES card_definitions(id) ON DELETE CASCADE,
  prediction_score FLOAT CHECK (prediction_score >= 0 AND prediction_score <= 1),
  prediction_reason TEXT, -- Human-readable explanation
  context_factors JSONB, -- What factors led to this prediction
  predicted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '1 hour',
  was_used BOOLEAN DEFAULT false,
  feedback VARCHAR(50) -- correct, incorrect, ignored
);

-- Indexes for prediction queries
CREATE INDEX idx_predicted_cards_user ON predicted_cards(user_id);
CREATE INDEX idx_predicted_cards_score ON predicted_cards(prediction_score DESC);
CREATE INDEX idx_predicted_cards_expires ON predicted_cards(expires_at);

-- =====================================================
-- Card Data Cache
-- Caches frequently accessed card data
-- =====================================================
CREATE TABLE IF NOT EXISTS card_data_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID REFERENCES card_definitions(id) ON DELETE CASCADE,
  data_key VARCHAR(255) NOT NULL, -- Specific data element
  cached_data JSONB NOT NULL, -- The actual cached data
  ttl_seconds INTEGER DEFAULT 300, -- Time to live (5 minutes default)
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '5 minutes',
  hit_count INTEGER DEFAULT 0, -- Track cache effectiveness
  UNIQUE(card_id, data_key)
);

-- Indexes for cache management
CREATE INDEX idx_card_data_cache_expires ON card_data_cache(expires_at);
CREATE INDEX idx_card_data_cache_card ON card_data_cache(card_id);

-- =====================================================
-- Card Learning Patterns
-- Stores learned user behavior patterns
-- =====================================================
CREATE TABLE IF NOT EXISTS card_learning_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern_type VARCHAR(50) NOT NULL, -- daily, weekly, contextual, sequential
  pattern_data JSONB NOT NULL, -- The actual pattern
  confidence_score FLOAT DEFAULT 0.5,
  occurrence_count INTEGER DEFAULT 1,
  last_occurred TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for pattern matching
CREATE INDEX idx_card_learning_patterns_user ON card_learning_patterns(user_id);
CREATE INDEX idx_card_learning_patterns_type ON card_learning_patterns(pattern_type);
CREATE INDEX idx_card_learning_patterns_confidence ON card_learning_patterns(confidence_score DESC);

-- =====================================================
-- Real-time Card Subscriptions
-- Manages WebSocket subscriptions for live updates
-- =====================================================
CREATE TABLE IF NOT EXISTS card_realtime_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id UUID REFERENCES card_definitions(id) ON DELETE CASCADE,
  websocket_channel VARCHAR(255) NOT NULL,
  subscription_params JSONB DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_ping TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for subscription management
CREATE INDEX idx_card_realtime_subscriptions_user ON card_realtime_subscriptions(user_id);
CREATE INDEX idx_card_realtime_subscriptions_active ON card_realtime_subscriptions(active);

-- =====================================================
-- Card Templates
-- Pre-built card configurations for different roles
-- =====================================================
CREATE TABLE IF NOT EXISTS card_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  role_type VARCHAR(50), -- executive, manager, operator, analyst
  card_ids UUID[] NOT NULL, -- Array of card_definition IDs
  layout_config JSONB NOT NULL DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for template lookups
CREATE INDEX idx_card_templates_role ON card_templates(role_type);
CREATE INDEX idx_card_templates_default ON card_templates(is_default);

-- =====================================================
-- Functions and Triggers
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_card_definitions_updated_at
  BEFORE UPDATE ON card_definitions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_card_preferences_updated_at
  BEFORE UPDATE ON user_card_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_card_learning_patterns_updated_at
  BEFORE UPDATE ON card_learning_patterns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_card_templates_updated_at
  BEFORE UPDATE ON card_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM card_data_cache WHERE expires_at < NOW();
  DELETE FROM predicted_cards WHERE expires_at < NOW() AND was_used = false;
END;
$$ language 'plpgsql';

-- Function to get prioritized cards for a user
CREATE OR REPLACE FUNCTION get_prioritized_cards(p_user_id UUID)
RETURNS TABLE (
  card_id UUID,
  card_type VARCHAR(50),
  title VARCHAR(255),
  priority_score FLOAT,
  is_pinned BOOLEAN,
  is_predicted BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH user_cards AS (
    -- Get user's preferred cards
    SELECT
      cd.id as card_id,
      cd.card_type,
      cd.title,
      CASE
        WHEN ucp.is_pinned THEN 1000.0
        ELSE COALESCE(ucp.interaction_count::FLOAT / 100, 0.0)
      END as priority_score,
      COALESCE(ucp.is_pinned, false) as is_pinned,
      false as is_predicted
    FROM card_definitions cd
    LEFT JOIN user_card_preferences ucp
      ON cd.id = ucp.card_id AND ucp.user_id = p_user_id
    WHERE cd.is_active = true
      AND (ucp.is_hidden IS NULL OR ucp.is_hidden = false)
  ),
  predicted_cards AS (
    -- Get AI predictions
    SELECT
      cd.id as card_id,
      cd.card_type,
      cd.title,
      pc.prediction_score * 100 as priority_score,
      false as is_pinned,
      true as is_predicted
    FROM predicted_cards pc
    JOIN card_definitions cd ON pc.card_id = cd.id
    WHERE pc.user_id = p_user_id
      AND pc.expires_at > NOW()
      AND pc.was_used = false
      AND cd.is_active = true
  )
  -- Combine and prioritize
  SELECT DISTINCT ON (card_id) *
  FROM (
    SELECT * FROM user_cards
    UNION ALL
    SELECT * FROM predicted_cards
  ) combined
  ORDER BY card_id, priority_score DESC;
END;
$$ language 'plpgsql';

-- =====================================================
-- Row Level Security Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE card_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_card_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE predicted_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_data_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_learning_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_realtime_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_templates ENABLE ROW LEVEL SECURITY;

-- Card definitions are public read, admin write
CREATE POLICY "Card definitions are viewable by all"
  ON card_definitions FOR SELECT
  USING (true);

CREATE POLICY "Only admins can modify card definitions"
  ON card_definitions FOR ALL
  USING (auth.jwt()->>'role' = 'admin');

-- User preferences are user-specific
CREATE POLICY "Users can view own card preferences"
  ON user_card_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own card preferences"
  ON user_card_preferences FOR ALL
  USING (auth.uid() = user_id);

-- Interactions are user-specific
CREATE POLICY "Users can view own interactions"
  ON card_interactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own interactions"
  ON card_interactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Predictions are user-specific
CREATE POLICY "Users can view own predictions"
  ON predicted_cards FOR SELECT
  USING (auth.uid() = user_id);

-- Cache is public read for efficiency
CREATE POLICY "Cache is readable by all"
  ON card_data_cache FOR SELECT
  USING (true);

-- Learning patterns are user-specific
CREATE POLICY "Users can view own learning patterns"
  ON card_learning_patterns FOR SELECT
  USING (auth.uid() = user_id);

-- Subscriptions are user-specific
CREATE POLICY "Users can manage own subscriptions"
  ON card_realtime_subscriptions FOR ALL
  USING (auth.uid() = user_id);

-- Templates are public read
CREATE POLICY "Templates are viewable by all"
  ON card_templates FOR SELECT
  USING (true);

-- =====================================================
-- Initial Data Seed
-- =====================================================

-- Insert default card definitions for 8 AI agents
INSERT INTO card_definitions (card_type, agent_id, title, description, layout_config, update_frequency)
VALUES
  ('agent', 'esg-chief', 'ESG Chief of Staff', 'Strategic sustainability overview',
   '{"layout": "hero", "size": "large", "color": "purple"}', 'hourly'),

  ('agent', 'carbon-hunter', 'Carbon Hunter', 'Emissions tracking and reduction',
   '{"layout": "standard", "size": "medium", "color": "green"}', 'realtime'),

  ('agent', 'compliance-guardian', 'Compliance Guardian', 'Regulatory compliance status',
   '{"layout": "standard", "size": "medium", "color": "blue"}', 'daily'),

  ('agent', 'supply-chain', 'Supply Chain Investigator', 'Scope 3 emissions analysis',
   '{"layout": "standard", "size": "medium", "color": "orange"}', 'daily'),

  ('agent', 'energy-optimizer', 'Energy Optimizer', 'Energy consumption and efficiency',
   '{"layout": "standard", "size": "medium", "color": "yellow"}', 'realtime'),

  ('agent', 'report-master', 'Report Master', 'Automated reporting and documentation',
   '{"layout": "compact", "size": "small", "color": "indigo"}', 'daily'),

  ('agent', 'risk-analyst', 'Risk Analyst', 'Climate risk assessment',
   '{"layout": "compact", "size": "small", "color": "red"}', 'daily'),

  ('agent', 'data-orchestrator', 'Data Orchestrator', 'Data quality and integration',
   '{"layout": "compact", "size": "small", "color": "teal"}', 'hourly');

-- Insert common metric cards
INSERT INTO card_definitions (card_type, title, description, layout_config, update_frequency)
VALUES
  ('metric', 'Total Emissions', 'Current total emissions across all scopes',
   '{"layout": "metric", "size": "small", "showTrend": true}', 'realtime'),

  ('metric', 'Energy Usage', 'Current energy consumption',
   '{"layout": "metric", "size": "small", "showTrend": true}', 'realtime'),

  ('alert', 'Active Alerts', 'Current system alerts and warnings',
   '{"layout": "alert", "size": "wide", "priority": "high"}', 'realtime'),

  ('chart', 'Emissions Trend', '30-day emissions trend chart',
   '{"layout": "chart", "chartType": "line", "size": "large"}', 'hourly');

-- Insert role-based templates
INSERT INTO card_templates (name, role_type, card_ids, layout_config, is_default)
VALUES
  ('Executive Dashboard', 'executive',
   ARRAY(SELECT id FROM card_definitions WHERE agent_id IN ('esg-chief', 'compliance-guardian', 'risk-analyst')),
   '{"columns": 3, "rows": 2}', true),

  ('Operations Dashboard', 'operator',
   ARRAY(SELECT id FROM card_definitions WHERE agent_id IN ('energy-optimizer', 'carbon-hunter', 'data-orchestrator')),
   '{"columns": 3, "rows": 3}', true),

  ('Analyst Dashboard', 'analyst',
   ARRAY(SELECT id FROM card_definitions WHERE card_type IN ('metric', 'chart')),
   '{"columns": 4, "rows": 3}', true);

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE card_definitions IS 'Core card type definitions for the Zero-Typing system';
COMMENT ON TABLE user_card_preferences IS 'User-specific card customizations and preferences';
COMMENT ON TABLE card_interactions IS 'Historical log of all user interactions with cards';
COMMENT ON TABLE predicted_cards IS 'AI-generated predictions of what cards users will need';
COMMENT ON TABLE card_data_cache IS 'Performance cache for frequently accessed card data';
COMMENT ON TABLE card_learning_patterns IS 'Learned patterns of user behavior for better predictions';
COMMENT ON TABLE card_realtime_subscriptions IS 'WebSocket subscription management for live updates';
COMMENT ON TABLE card_templates IS 'Pre-built card layouts for different user roles';