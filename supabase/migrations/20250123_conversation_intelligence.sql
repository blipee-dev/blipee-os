-- Migration: Conversation Intelligence System
-- Description: Complete database schema for advanced conversational AI
-- Date: 2025-01-23
-- Components: Memory, NLU, Dialogue Management, Personalization, Analytics

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- =====================================================
-- CONVERSATION MEMORY TABLES
-- =====================================================

-- Main conversation memories table with vector embeddings
CREATE TABLE IF NOT EXISTS conversation_memories (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL,
    content TEXT NOT NULL,
    embedding vector(3072), -- OpenAI text-embedding-3-large dimensions
    metadata JSONB DEFAULT '{}',
    access_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMPTZ DEFAULT NOW(),
    decay_factor REAL DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Memory consolidations table
CREATE TABLE IF NOT EXISTS memory_consolidations (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    original_memories TEXT[] NOT NULL,
    consolidated_memory JSONB NOT NULL,
    consolidation_type TEXT NOT NULL,
    consolidation_reason TEXT NOT NULL,
    quality_score REAL DEFAULT 0.0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Semantic memories for long-term knowledge graphs
CREATE TABLE IF NOT EXISTS semantic_memories (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL,
    knowledge_graph JSONB DEFAULT '[]',
    conceptual_mappings JSONB DEFAULT '[]',
    domain_expertise JSONB DEFAULT '[]',
    user_model JSONB DEFAULT '{}',
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SEMANTIC NLU TABLES
-- =====================================================

-- NLU processing results cache
CREATE TABLE IF NOT EXISTS nlu_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    text_hash TEXT UNIQUE NOT NULL, -- Hash of input text for caching
    text TEXT NOT NULL,
    language TEXT DEFAULT 'en',
    confidence REAL DEFAULT 0.0,
    entities JSONB DEFAULT '[]',
    intents JSONB DEFAULT '[]',
    sentiment JSONB DEFAULT '{}',
    semantic_roles JSONB DEFAULT '[]',
    coreferences JSONB DEFAULT '[]',
    embeddings JSONB DEFAULT '{}',
    domain_context JSONB DEFAULT '{}',
    processing_time INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Entity extraction cache
CREATE TABLE IF NOT EXISTS nlu_entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_text TEXT NOT NULL,
    entity_label TEXT NOT NULL,
    entity_type JSONB NOT NULL,
    confidence REAL DEFAULT 0.0,
    attributes JSONB DEFAULT '{}',
    canonical_form TEXT,
    disambiguation JSONB DEFAULT '{}',
    usage_count INTEGER DEFAULT 1,
    last_used TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Intent classification cache
CREATE TABLE IF NOT EXISTS nlu_intents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    text_pattern TEXT NOT NULL,
    intent TEXT NOT NULL,
    confidence REAL DEFAULT 0.0,
    domain TEXT DEFAULT 'general',
    sub_intent TEXT,
    parameters JSONB DEFAULT '[]',
    usage_count INTEGER DEFAULT 1,
    success_rate REAL DEFAULT 1.0,
    last_used TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- DIALOGUE MANAGEMENT TABLES
-- =====================================================

-- Dialogue states for conversation tracking
CREATE TABLE IF NOT EXISTS dialogue_states (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL,
    current_turn INTEGER DEFAULT 0,
    dialogue_history JSONB DEFAULT '[]',
    active_goals JSONB DEFAULT '[]',
    context_stack JSONB DEFAULT '[]',
    user_model JSONB DEFAULT '{}',
    system_state JSONB DEFAULT '{}',
    conversation_flow JSONB DEFAULT '{}',
    repair_strategies JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dialogue turns for detailed conversation analysis
CREATE TABLE IF NOT EXISTS dialogue_turns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id TEXT NOT NULL,
    dialogue_state_id TEXT NOT NULL REFERENCES dialogue_states(id) ON DELETE CASCADE,
    turn_number INTEGER NOT NULL,
    speaker TEXT NOT NULL CHECK (speaker IN ('user', 'system')),
    utterance TEXT NOT NULL,
    dialogue_acts JSONB DEFAULT '[]',
    goals JSONB DEFAULT '[]',
    system_response JSONB,
    turn_outcome JSONB DEFAULT '{}',
    repair_actions JSONB DEFAULT '[]',
    nlu_result_id UUID REFERENCES nlu_results(id),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation goals tracking
CREATE TABLE IF NOT EXISTS conversation_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    goal_type TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'suspended', 'failed')),
    subgoals JSONB DEFAULT '[]',
    constraints JSONB DEFAULT '[]',
    success_criteria JSONB DEFAULT '[]',
    estimated_turns INTEGER DEFAULT 3,
    actual_turns INTEGER DEFAULT 0,
    completion_confidence REAL DEFAULT 0.0,
    deadline TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- =====================================================
-- PERSONALIZATION TABLES
-- =====================================================

-- User personalization profiles
CREATE TABLE IF NOT EXISTS user_personalization_profiles (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL,
    personality_traits JSONB DEFAULT '{}',
    communication_preferences JSONB DEFAULT '{}',
    expertise_levels JSONB DEFAULT '{}',
    cultural_context JSONB DEFAULT '{}',
    learning_style JSONB DEFAULT '{}',
    response_history JSONB DEFAULT '{}',
    feedback_patterns JSONB DEFAULT '[]',
    adaptation_rules JSONB DEFAULT '[]',
    ab_testing_data JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, organization_id)
);

-- Response personalization cache
CREATE TABLE IF NOT EXISTS personalized_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    original_response TEXT NOT NULL,
    personalized_response TEXT NOT NULL,
    adaptations JSONB DEFAULT '[]',
    personalization_score REAL DEFAULT 0.0,
    confidence REAL DEFAULT 0.0,
    ab_test_variant TEXT,
    metadata JSONB DEFAULT '{}',
    feedback_rating REAL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User feedback for personalization learning
CREATE TABLE IF NOT EXISTS personalization_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    response_id UUID REFERENCES personalized_responses(id) ON DELETE CASCADE,
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('explicit', 'implicit', 'inferred')),
    rating REAL CHECK (rating >= 0 AND rating <= 5),
    aspects JSONB DEFAULT '[]',
    explicit_feedback TEXT,
    implicit_data JSONB DEFAULT '{}',
    context JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- A/B testing framework
CREATE TABLE IF NOT EXISTS ab_tests (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    variants JSONB NOT NULL,
    allocation REAL DEFAULT 1.0,
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    hypothesis TEXT,
    metrics JSONB DEFAULT '[]',
    status TEXT DEFAULT 'running' CHECK (status IN ('running', 'paused', 'completed')),
    user_segment TEXT DEFAULT 'all',
    results JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- A/B test interactions
CREATE TABLE IF NOT EXISTS ab_test_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_id TEXT NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
    variant_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    interaction_data JSONB DEFAULT '{}',
    outcome JSONB DEFAULT '{}',
    satisfaction_score REAL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CONVERSATION INTELLIGENCE ORCHESTRATION
-- =====================================================

-- Main conversation intelligence results
CREATE TABLE IF NOT EXISTS conversation_intelligence_results (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL,
    user_message TEXT NOT NULL,
    system_response TEXT NOT NULL,
    nlu_analysis JSONB NOT NULL,
    dialogue_state JSONB NOT NULL,
    personalized_response JSONB NOT NULL,
    memory_updates JSONB DEFAULT '[]',
    conversation_metrics JSONB NOT NULL,
    user_journey JSONB NOT NULL,
    next_question_predictions JSONB DEFAULT '[]',
    quality_scores JSONB NOT NULL,
    adaptation_actions JSONB DEFAULT '[]',
    processing_time INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- User journey tracking
CREATE TABLE IF NOT EXISTS user_journey_steps (
    step_id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_id TEXT NOT NULL,
    step_type TEXT NOT NULL CHECK (step_type IN ('discovery', 'exploration', 'task_execution', 'learning', 'problem_solving')),
    step_name TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    duration INTEGER DEFAULT 0,
    outcomes JSONB DEFAULT '[]',
    user_state JSONB DEFAULT '{}',
    system_state JSONB DEFAULT '{}',
    context_transitions JSONB DEFAULT '[]',
    learning_moments JSONB DEFAULT '[]'
);

-- Conversation analytics aggregations
CREATE TABLE IF NOT EXISTS conversation_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL,
    timeframe TEXT NOT NULL CHECK (timeframe IN ('1h', '24h', '7d', '30d')),
    session_metrics JSONB NOT NULL,
    user_metrics JSONB NOT NULL,
    system_metrics JSONB NOT NULL,
    learning_analytics JSONB NOT NULL,
    predictive_analytics JSONB NOT NULL,
    behavioral_insights JSONB DEFAULT '[]',
    performance_insights JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Conversation quality metrics history
CREATE TABLE IF NOT EXISTS conversation_quality_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    turn_number INTEGER NOT NULL,
    overall_quality REAL NOT NULL,
    quality_components JSONB NOT NULL,
    benchmarks JSONB DEFAULT '[]',
    improvements JSONB DEFAULT '[]',
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Conversation memories indexes
CREATE INDEX IF NOT EXISTS idx_conversation_memories_conversation_id ON conversation_memories(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_memories_user_id ON conversation_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_memories_organization_id ON conversation_memories(organization_id);
CREATE INDEX IF NOT EXISTS idx_conversation_memories_created_at ON conversation_memories(created_at);
CREATE INDEX IF NOT EXISTS idx_conversation_memories_embedding ON conversation_memories USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- NLU results indexes
CREATE INDEX IF NOT EXISTS idx_nlu_results_text_hash ON nlu_results(text_hash);
CREATE INDEX IF NOT EXISTS idx_nlu_results_created_at ON nlu_results(created_at);
CREATE INDEX IF NOT EXISTS idx_nlu_results_expires_at ON nlu_results(expires_at);

-- NLU entities indexes
CREATE INDEX IF NOT EXISTS idx_nlu_entities_entity_text ON nlu_entities(entity_text);
CREATE INDEX IF NOT EXISTS idx_nlu_entities_entity_label ON nlu_entities(entity_label);
CREATE INDEX IF NOT EXISTS idx_nlu_entities_last_used ON nlu_entities(last_used);

-- Dialogue states indexes
CREATE INDEX IF NOT EXISTS idx_dialogue_states_conversation_id ON dialogue_states(conversation_id);
CREATE INDEX IF NOT EXISTS idx_dialogue_states_user_id ON dialogue_states(user_id);
CREATE INDEX IF NOT EXISTS idx_dialogue_states_last_updated ON dialogue_states(last_updated);

-- Dialogue turns indexes
CREATE INDEX IF NOT EXISTS idx_dialogue_turns_conversation_id ON dialogue_turns(conversation_id);
CREATE INDEX IF NOT EXISTS idx_dialogue_turns_turn_number ON dialogue_turns(turn_number);
CREATE INDEX IF NOT EXISTS idx_dialogue_turns_timestamp ON dialogue_turns(timestamp);

-- Personalization profiles indexes
CREATE INDEX IF NOT EXISTS idx_personalization_profiles_user_id ON user_personalization_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_personalization_profiles_organization_id ON user_personalization_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_personalization_profiles_last_updated ON user_personalization_profiles(last_updated);

-- Conversation intelligence results indexes
CREATE INDEX IF NOT EXISTS idx_ci_results_conversation_id ON conversation_intelligence_results(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ci_results_user_id ON conversation_intelligence_results(user_id);
CREATE INDEX IF NOT EXISTS idx_ci_results_organization_id ON conversation_intelligence_results(organization_id);
CREATE INDEX IF NOT EXISTS idx_ci_results_timestamp ON conversation_intelligence_results(timestamp);

-- User journey indexes
CREATE INDEX IF NOT EXISTS idx_user_journey_user_id ON user_journey_steps(user_id);
CREATE INDEX IF NOT EXISTS idx_user_journey_conversation_id ON user_journey_steps(conversation_id);
CREATE INDEX IF NOT EXISTS idx_user_journey_timestamp ON user_journey_steps(timestamp);

-- =====================================================
-- VECTOR SEARCH FUNCTIONS
-- =====================================================

-- Function for semantic memory search using cosine similarity
CREATE OR REPLACE FUNCTION semantic_search_memories(
    query_embedding vector(3072),
    user_id UUID,
    organization_id UUID,
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 10
)
RETURNS TABLE (
    id TEXT,
    conversation_id TEXT,
    content TEXT,
    similarity float,
    metadata JSONB,
    access_count INTEGER,
    last_accessed TIMESTAMPTZ
)
LANGUAGE SQL STABLE
AS $$
    SELECT
        cm.id,
        cm.conversation_id,
        cm.content,
        1 - (cm.embedding <=> query_embedding) as similarity,
        cm.metadata,
        cm.access_count,
        cm.last_accessed
    FROM conversation_memories cm
    WHERE
        cm.user_id = semantic_search_memories.user_id
        AND (cm.organization_id = semantic_search_memories.organization_id OR semantic_search_memories.organization_id IS NULL)
        AND 1 - (cm.embedding <=> query_embedding) > match_threshold
    ORDER BY cm.embedding <=> query_embedding
    LIMIT match_count;
$$;

-- Function to calculate conversation health score
CREATE OR REPLACE FUNCTION calculate_conversation_health(
    conversation_id TEXT,
    lookback_hours INTEGER DEFAULT 24
)
RETURNS JSONB
LANGUAGE SQL STABLE
AS $$
    SELECT jsonb_build_object(
        'overall_health', AVG((quality_scores->>'overall')::float),
        'quality_trend',
            CASE
                WHEN COUNT(*) < 2 THEN 'stable'
                WHEN AVG((quality_scores->>'overall')::float) FILTER (WHERE timestamp > NOW() - INTERVAL '12 hours') >
                     AVG((quality_scores->>'overall')::float) FILTER (WHERE timestamp <= NOW() - INTERVAL '12 hours')
                THEN 'improving'
                ELSE 'declining'
            END,
        'total_interactions', COUNT(*),
        'avg_processing_time', AVG(processing_time),
        'last_updated', MAX(timestamp)
    )
    FROM conversation_intelligence_results
    WHERE
        conversation_intelligence_results.conversation_id = calculate_conversation_health.conversation_id
        AND timestamp > NOW() - (lookback_hours || ' hours')::INTERVAL;
$$;

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE conversation_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_consolidations ENABLE ROW LEVEL SECURITY;
ALTER TABLE semantic_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE nlu_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE nlu_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE nlu_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE dialogue_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE dialogue_turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_personalization_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE personalized_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE personalization_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_intelligence_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_journey_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_quality_history ENABLE ROW LEVEL SECURITY;

-- Conversation memories policies
CREATE POLICY "Users can access their own conversation memories" ON conversation_memories
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Organization members can access organization memories" ON conversation_memories
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

-- Dialogue states policies
CREATE POLICY "Users can access their own dialogue states" ON dialogue_states
    FOR ALL USING (user_id = auth.uid());

-- Personalization profiles policies
CREATE POLICY "Users can access their own personalization profiles" ON user_personalization_profiles
    FOR ALL USING (user_id = auth.uid());

-- Conversation intelligence results policies
CREATE POLICY "Users can access their own conversation results" ON conversation_intelligence_results
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Organization members can access organization results" ON conversation_intelligence_results
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

-- User journey policies
CREATE POLICY "Users can access their own journey data" ON user_journey_steps
    FOR ALL USING (user_id = auth.uid());

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_conversation_memories_updated_at
    BEFORE UPDATE ON conversation_memories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dialogue_states_last_updated
    BEFORE UPDATE ON dialogue_states
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personalization_profiles_last_updated
    BEFORE UPDATE ON user_personalization_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired records
CREATE OR REPLACE FUNCTION cleanup_expired_records()
RETURNS void AS $$
BEGIN
    -- Clean up expired NLU results
    DELETE FROM nlu_results WHERE expires_at < NOW();

    -- Clean up expired conversation analytics
    DELETE FROM conversation_analytics WHERE expires_at < NOW();

    -- Clean up old conversation memories with very low decay factors
    DELETE FROM conversation_memories
    WHERE decay_factor < 0.1
    AND last_accessed < NOW() - INTERVAL '30 days';

END;
$$ language 'plpgsql';

-- =====================================================
-- MATERIALIZED VIEWS FOR ANALYTICS
-- =====================================================

-- User expertise progression view
CREATE MATERIALIZED VIEW IF NOT EXISTS user_expertise_progression AS
SELECT
    user_id,
    organization_id,
    jsonb_extract_path_text(expertise_levels, 'sustainability', 'level') as sustainability_level,
    jsonb_extract_path_text(expertise_levels, 'technology', 'level') as technology_level,
    jsonb_extract_path_text(expertise_levels, 'business', 'level') as business_level,
    jsonb_extract_path_text(expertise_levels, 'compliance', 'level') as compliance_level,
    last_updated,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY last_updated DESC) as rn
FROM user_personalization_profiles
WHERE expertise_levels IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_expertise_progression_unique
ON user_expertise_progression(user_id, last_updated);

-- Conversation quality trends view
CREATE MATERIALIZED VIEW IF NOT EXISTS conversation_quality_trends AS
SELECT
    conversation_id,
    user_id,
    organization_id,
    DATE_TRUNC('hour', timestamp) as hour_bucket,
    AVG((quality_scores->>'overall')::float) as avg_quality,
    COUNT(*) as interaction_count,
    AVG(processing_time) as avg_processing_time
FROM conversation_intelligence_results
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY conversation_id, user_id, organization_id, DATE_TRUNC('hour', timestamp);

CREATE UNIQUE INDEX IF NOT EXISTS idx_conversation_quality_trends_unique
ON conversation_quality_trends(conversation_id, user_id, hour_bucket);

-- =====================================================
-- INITIAL DATA AND CONFIGURATION
-- =====================================================

-- Insert default A/B tests for system optimization
INSERT INTO ab_tests (id, name, variants, hypothesis, metrics, status) VALUES
('response_length_test', 'Response Length Optimization', '[
    {"id": "short", "name": "Short Responses", "description": "Concise responses under 100 words", "allocation": 0.5},
    {"id": "detailed", "name": "Detailed Responses", "description": "Comprehensive responses over 150 words", "allocation": 0.5}
]', 'Detailed responses improve user satisfaction in sustainability contexts', '["satisfaction", "engagement", "completion"]', 'running'),

('personalization_level_test', 'Personalization Intensity', '[
    {"id": "high_personalization", "name": "High Personalization", "description": "Maximum adaptation to user preferences", "allocation": 0.5},
    {"id": "moderate_personalization", "name": "Moderate Personalization", "description": "Balanced personalization approach", "allocation": 0.5}
]', 'Higher personalization leads to better user outcomes', '["satisfaction", "goal_completion", "retention"]', 'running')

ON CONFLICT (id) DO NOTHING;

-- Create schedule for cleanup function (requires pg_cron extension if available)
-- SELECT cron.schedule('cleanup-expired-records', '0 2 * * *', 'SELECT cleanup_expired_records();');

-- =====================================================
-- PERFORMANCE OPTIMIZATION
-- =====================================================

-- Analyze tables for query optimization
ANALYZE conversation_memories;
ANALYZE nlu_results;
ANALYZE dialogue_states;
ANALYZE user_personalization_profiles;
ANALYZE conversation_intelligence_results;

-- Refresh materialized views
REFRESH MATERIALIZED VIEW user_expertise_progression;
REFRESH MATERIALIZED VIEW conversation_quality_trends;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE conversation_memories IS 'Stores conversation memories with vector embeddings for semantic search';
COMMENT ON TABLE semantic_memories IS 'Long-term semantic memory and knowledge graphs per user';
COMMENT ON TABLE nlu_results IS 'Cached NLU processing results to avoid recomputation';
COMMENT ON TABLE dialogue_states IS 'Current dialogue state for active conversations';
COMMENT ON TABLE user_personalization_profiles IS 'User preference profiles for response personalization';
COMMENT ON TABLE conversation_intelligence_results IS 'Complete conversation intelligence processing results';
COMMENT ON TABLE user_journey_steps IS 'User journey tracking for analytics and optimization';

COMMENT ON FUNCTION semantic_search_memories IS 'Performs semantic search on conversation memories using vector similarity';
COMMENT ON FUNCTION calculate_conversation_health IS 'Calculates conversation health metrics for quality monitoring';

-- =====================================================
-- GRANTS AND PERMISSIONS
-- =====================================================

-- Grant necessary permissions for authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant read access to service role for background tasks
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Conversation Intelligence System migration completed successfully!';
    RAISE NOTICE 'Created tables for: Memory, NLU, Dialogue Management, Personalization, Analytics';
    RAISE NOTICE 'Added vector search capabilities, RLS policies, and performance optimizations';
    RAISE NOTICE 'System ready for advanced conversational AI processing';
END $$;