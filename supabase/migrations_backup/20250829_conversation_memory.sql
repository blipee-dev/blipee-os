-- Enhanced Conversation Memory & Context Persistence
-- Phase 3: AI & Conversational Intelligence

-- Conversation memories table for long-term context storage
CREATE TABLE IF NOT EXISTS conversation_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  summary TEXT NOT NULL,
  key_topics TEXT[] DEFAULT '{}',
  entities JSONB DEFAULT '[]',
  sentiment JSONB DEFAULT '{}',
  preferences JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for conversation memories
CREATE INDEX IF NOT EXISTS idx_conversation_memories_org_id ON conversation_memories(organization_id);
CREATE INDEX IF NOT EXISTS idx_conversation_memories_user_id ON conversation_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_memories_updated_at ON conversation_memories(updated_at);
CREATE INDEX IF NOT EXISTS idx_conversation_memories_key_topics ON conversation_memories USING GIN(key_topics);
CREATE INDEX IF NOT EXISTS idx_conversation_memories_entities ON conversation_memories USING GIN(entities);
CREATE INDEX IF NOT EXISTS idx_conversation_memories_summary_search ON conversation_memories USING GIN(to_tsvector('english', summary));
CREATE INDEX IF NOT EXISTS idx_conversation_memories_title_search ON conversation_memories USING GIN(to_tsvector('english', title));

-- Conversation context cache table for active sessions
CREATE TABLE IF NOT EXISTS conversation_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  context_data JSONB NOT NULL,
  relevance_score REAL NOT NULL DEFAULT 0,
  token_estimate INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 day'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for conversation contexts
CREATE INDEX IF NOT EXISTS idx_conversation_contexts_conversation_id ON conversation_contexts(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_contexts_user_id ON conversation_contexts(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_contexts_expires_at ON conversation_contexts(expires_at);
CREATE INDEX IF NOT EXISTS idx_conversation_contexts_relevance_score ON conversation_contexts(relevance_score);

-- User preferences aggregation table
CREATE TABLE IF NOT EXISTS user_ai_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  communication_style TEXT NOT NULL DEFAULT 'professional' CHECK (communication_style IN ('formal', 'casual', 'technical', 'professional')),
  response_length TEXT NOT NULL DEFAULT 'detailed' CHECK (response_length IN ('brief', 'detailed', 'comprehensive')),
  preferred_metrics TEXT[] DEFAULT '{}',
  domain_interests TEXT[] DEFAULT '{}',
  interaction_patterns JSONB DEFAULT '{}',
  learned_from_conversations INTEGER NOT NULL DEFAULT 0,
  confidence_score REAL NOT NULL DEFAULT 0.5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for user AI preferences
CREATE INDEX IF NOT EXISTS idx_user_ai_preferences_user_id ON user_ai_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ai_preferences_org_id ON user_ai_preferences(organization_id);

-- Conversation analytics table for insights and trends
CREATE TABLE IF NOT EXISTS conversation_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_conversations INTEGER NOT NULL DEFAULT 0,
  total_messages INTEGER NOT NULL DEFAULT 0,
  avg_conversation_length REAL NOT NULL DEFAULT 0,
  top_topics TEXT[] DEFAULT '{}',
  sentiment_distribution JSONB DEFAULT '{}',
  ai_provider_usage JSONB DEFAULT '{}',
  response_times JSONB DEFAULT '{}',
  user_satisfaction_score REAL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, user_id, date)
);

-- Indexes for conversation analytics
CREATE INDEX IF NOT EXISTS idx_conversation_analytics_org_date ON conversation_analytics(organization_id, date);
CREATE INDEX IF NOT EXISTS idx_conversation_analytics_user_date ON conversation_analytics(user_id, date);

-- RLS policies for conversation memories
ALTER TABLE conversation_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversation memories"
  ON conversation_memories
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
      AND role IN ('account_owner', 'sustainability_manager', 'sustainability_lead', 'admin')
    )
  );

CREATE POLICY "Users can insert their own conversation memories"
  ON conversation_memories
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own conversation memories"
  ON conversation_memories
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own conversation memories"
  ON conversation_memories
  FOR DELETE
  USING (user_id = auth.uid());

-- RLS policies for conversation contexts
ALTER TABLE conversation_contexts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own conversation contexts"
  ON conversation_contexts
  FOR ALL
  USING (user_id = auth.uid());

-- RLS policies for user AI preferences
ALTER TABLE user_ai_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own AI preferences"
  ON user_ai_preferences
  FOR ALL
  USING (user_id = auth.uid());

-- RLS policies for conversation analytics
ALTER TABLE conversation_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view conversation analytics"
  ON conversation_analytics
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
      AND role IN ('account_owner', 'sustainability_manager', 'sustainability_lead', 'admin')
    )
  );

-- Function to automatically update conversation memories updated_at
CREATE OR REPLACE FUNCTION update_conversation_memories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER conversation_memories_updated_at
  BEFORE UPDATE ON conversation_memories
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_memories_updated_at();

-- Function to automatically clean up expired conversation contexts
CREATE OR REPLACE FUNCTION cleanup_expired_conversation_contexts()
RETURNS void AS $$
BEGIN
  DELETE FROM conversation_contexts 
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to update user AI preferences from conversation data
CREATE OR REPLACE FUNCTION update_user_ai_preferences(
  p_user_id UUID,
  p_organization_id UUID,
  p_communication_style TEXT DEFAULT NULL,
  p_response_length TEXT DEFAULT NULL,
  p_preferred_metrics TEXT[] DEFAULT NULL,
  p_domain_interests TEXT[] DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO user_ai_preferences (
    user_id,
    organization_id,
    communication_style,
    response_length,
    preferred_metrics,
    domain_interests,
    learned_from_conversations
  )
  VALUES (
    p_user_id,
    p_organization_id,
    COALESCE(p_communication_style, 'professional'),
    COALESCE(p_response_length, 'detailed'),
    COALESCE(p_preferred_metrics, '{}'),
    COALESCE(p_domain_interests, '{}'),
    1
  )
  ON CONFLICT (user_id) DO UPDATE SET
    communication_style = COALESCE(p_communication_style, user_ai_preferences.communication_style),
    response_length = COALESCE(p_response_length, user_ai_preferences.response_length),
    preferred_metrics = COALESCE(p_preferred_metrics, user_ai_preferences.preferred_metrics),
    domain_interests = COALESCE(p_domain_interests, user_ai_preferences.domain_interests),
    learned_from_conversations = user_ai_preferences.learned_from_conversations + 1,
    confidence_score = LEAST(1.0, user_ai_preferences.confidence_score + 0.1),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get conversation memory search results
CREATE OR REPLACE FUNCTION search_conversation_memories(
  p_user_id UUID,
  p_query TEXT,
  p_organization_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  summary TEXT,
  key_topics TEXT[],
  relevance_score REAL,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cm.id,
    cm.title,
    cm.summary,
    cm.key_topics,
    (
      ts_rank(to_tsvector('english', COALESCE(cm.title, '') || ' ' || cm.summary), plainto_tsquery('english', p_query)) +
      CASE 
        WHEN cm.key_topics && string_to_array(lower(p_query), ' ') THEN 0.5 
        ELSE 0 
      END
    )::REAL AS relevance_score,
    cm.created_at
  FROM conversation_memories cm
  WHERE cm.user_id = p_user_id
    AND (p_organization_id IS NULL OR cm.organization_id = p_organization_id)
    AND (
      to_tsvector('english', COALESCE(cm.title, '') || ' ' || cm.summary) @@ plainto_tsquery('english', p_query)
      OR cm.key_topics && string_to_array(lower(p_query), ' ')
    )
  ORDER BY relevance_score DESC, cm.updated_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to generate conversation analytics
CREATE OR REPLACE FUNCTION update_conversation_analytics(
  p_organization_id UUID,
  p_user_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS void AS $$
DECLARE
  v_total_conversations INTEGER;
  v_total_messages INTEGER;
  v_avg_length REAL;
  v_top_topics TEXT[];
BEGIN
  -- Calculate conversation metrics for the date
  SELECT 
    COUNT(DISTINCT id),
    COALESCE(SUM((metadata->>'totalMessages')::INTEGER), 0),
    COALESCE(AVG((metadata->>'totalMessages')::INTEGER), 0)
  INTO v_total_conversations, v_total_messages, v_avg_length
  FROM conversation_memories
  WHERE organization_id = p_organization_id
    AND user_id = p_user_id
    AND DATE(created_at) = p_date;

  -- Get top topics
  SELECT ARRAY_AGG(topic ORDER BY topic_count DESC)
  INTO v_top_topics
  FROM (
    SELECT UNNEST(key_topics) as topic, COUNT(*) as topic_count
    FROM conversation_memories
    WHERE organization_id = p_organization_id
      AND user_id = p_user_id
      AND DATE(created_at) = p_date
    GROUP BY topic
    ORDER BY topic_count DESC
    LIMIT 10
  ) topic_stats;

  -- Insert or update analytics
  INSERT INTO conversation_analytics (
    organization_id,
    user_id,
    date,
    total_conversations,
    total_messages,
    avg_conversation_length,
    top_topics
  )
  VALUES (
    p_organization_id,
    p_user_id,
    p_date,
    v_total_conversations,
    v_total_messages,
    v_avg_length,
    COALESCE(v_top_topics, '{}')
  )
  ON CONFLICT (organization_id, user_id, date) DO UPDATE SET
    total_conversations = v_total_conversations,
    total_messages = v_total_messages,
    avg_conversation_length = v_avg_length,
    top_topics = COALESCE(v_top_topics, '{}'),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up expired contexts (if pg_cron is available)
-- SELECT cron.schedule('cleanup-conversation-contexts', '0 2 * * *', 'SELECT cleanup_expired_conversation_contexts();');

COMMENT ON TABLE conversation_memories IS 'Long-term storage for conversation summaries, entities, and learned preferences';
COMMENT ON TABLE conversation_contexts IS 'Active conversation contexts with built context data and relevance scoring';
COMMENT ON TABLE user_ai_preferences IS 'Aggregated user preferences learned from conversation patterns';
COMMENT ON TABLE conversation_analytics IS 'Daily analytics and insights about conversation patterns and AI usage';