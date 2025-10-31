/**
 * FASE 3 - Database Optimization Script
 *
 * This script creates optimized indexes for all critical tables
 * used across FASE 1 (Agents, ML), FASE 2 (Conversations), and FASE 3 (Integrations)
 *
 * Performance Goals:
 * - Query response time < 50ms (p95)
 * - Complex aggregations < 200ms
 * - API endpoints < 200ms total
 */

-- ============================================================================
-- FASE 1: Autonomous Agents - Indexes
-- ============================================================================

-- Agent Task Executions: Most frequently queried table
CREATE INDEX IF NOT EXISTS idx_agent_task_executions_org_created
ON agent_task_executions(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_task_executions_org_status
ON agent_task_executions(organization_id, status);

CREATE INDEX IF NOT EXISTS idx_agent_task_executions_agent_id
ON agent_task_executions(agent_id);

CREATE INDEX IF NOT EXISTS idx_agent_task_executions_site_id
ON agent_task_executions(site_id);

-- Composite index for common query pattern: org + date range + status
CREATE INDEX IF NOT EXISTS idx_agent_task_executions_org_created_status
ON agent_task_executions(organization_id, created_at DESC, status);

-- Agent Cost Initiatives: Used for ROI calculations
CREATE INDEX IF NOT EXISTS idx_agent_cost_initiatives_org_created
ON agent_cost_initiatives(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_cost_initiatives_site_id
ON agent_cost_initiatives(site_id);

-- ============================================================================
-- FASE 1: ML Models & Predictions - Indexes
-- ============================================================================

-- ML Predictions: Used for Prophet forecasts and insights
CREATE INDEX IF NOT EXISTS idx_ml_predictions_org_created
ON ml_predictions(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ml_predictions_model_id
ON ml_predictions(model_id);

CREATE INDEX IF NOT EXISTS idx_ml_predictions_site_id
ON ml_predictions(site_id);

-- Composite index for Prophet forecast queries
CREATE INDEX IF NOT EXISTS idx_ml_predictions_org_model_created
ON ml_predictions(organization_id, model_id, created_at DESC);

-- Index for metadata JSONB queries (GIN index for flexible JSON queries)
CREATE INDEX IF NOT EXISTS idx_ml_predictions_metadata
ON ml_predictions USING GIN (metadata);

-- ML Models
CREATE INDEX IF NOT EXISTS idx_ml_models_org_category
ON ml_models(organization_id, category);

CREATE INDEX IF NOT EXISTS idx_ml_models_active
ON ml_models(is_active) WHERE is_active = true;

-- ============================================================================
-- FASE 2: Conversations - Indexes
-- ============================================================================

-- Conversations: Core conversation table
CREATE INDEX IF NOT EXISTS idx_conversations_org_created
ON conversations(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_org_type
ON conversations(organization_id, type);

CREATE INDEX IF NOT EXISTS idx_conversations_site_id
ON conversations(site_id);

-- Composite index for agent vs user conversation queries
CREATE INDEX IF NOT EXISTS idx_conversations_org_type_created
ON conversations(organization_id, type, created_at DESC);

-- Index for metadata JSONB queries
CREATE INDEX IF NOT EXISTS idx_conversations_metadata
ON conversations USING GIN (metadata);

-- Messages: Queried by conversation
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
ON messages(conversation_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_messages_role
ON messages(role);

-- AI Conversation Analytics: Linked to conversations
CREATE INDEX IF NOT EXISTS idx_ai_conversation_analytics_conv_id
ON ai_conversation_analytics(conversation_id);

CREATE INDEX IF NOT EXISTS idx_ai_conversation_analytics_org
ON ai_conversation_analytics(organization_id);

-- Index for topics_discussed array queries (GIN index for array operations)
CREATE INDEX IF NOT EXISTS idx_ai_conversation_analytics_topics
ON ai_conversation_analytics USING GIN (topics_discussed);

-- Index for conversation_metadata JSONB
CREATE INDEX IF NOT EXISTS idx_ai_conversation_analytics_metadata
ON ai_conversation_analytics USING GIN (conversation_metadata);

-- Conversation Context: For conversation history
CREATE INDEX IF NOT EXISTS idx_conversation_context_conv_id
ON conversation_context(conversation_id);

-- Conversation Participants
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conv_id
ON conversation_participants(conversation_id);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id
ON conversation_participants(user_id);

-- Conversation Feedback
CREATE INDEX IF NOT EXISTS idx_conversation_feedback_conv_id
ON conversation_feedback(conversation_id);

CREATE INDEX IF NOT EXISTS idx_conversation_feedback_rating
ON conversation_feedback(rating);

-- ============================================================================
-- FASE 3: Integration Tables - Indexes
-- ============================================================================

-- User Profiles: Frequently joined for organization lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_org_id
ON user_profiles(organization_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id
ON user_profiles(id);

-- Organizations
CREATE INDEX IF NOT EXISTS idx_organizations_id
ON organizations(id);

-- Sites: For site-level filtering
CREATE INDEX IF NOT EXISTS idx_sites_org_id
ON sites(organization_id);

-- ============================================================================
-- Materialized Views for Common Queries (Optional - High Performance)
-- ============================================================================

-- Materialized view for agent performance summary
DROP MATERIALIZED VIEW IF EXISTS mv_agent_performance_summary CASCADE;
CREATE MATERIALIZED VIEW mv_agent_performance_summary AS
SELECT
  organization_id,
  agent_id,
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as total_executions,
  COUNT(*) FILTER (WHERE status = 'completed') as successful_executions,
  AVG(cost_usd) as avg_cost,
  SUM(cost_usd) as total_cost
FROM agent_task_executions
WHERE created_at >= NOW() - INTERVAL '90 days'
GROUP BY organization_id, agent_id, DATE_TRUNC('day', created_at);

CREATE INDEX idx_mv_agent_performance_org_date
ON mv_agent_performance_summary(organization_id, date DESC);

-- Materialized view for conversation quality summary
DROP MATERIALIZED VIEW IF EXISTS mv_conversation_quality_summary CASCADE;
CREATE MATERIALIZED VIEW mv_conversation_quality_summary AS
SELECT
  c.organization_id,
  c.type as conversation_type,
  DATE_TRUNC('day', c.created_at) as date,
  COUNT(*) as total_conversations,
  AVG((aca.conversation_metadata->>'qualityScore')::numeric) as avg_quality_score,
  AVG(aca.user_satisfaction_score) as avg_satisfaction
FROM conversations c
LEFT JOIN ai_conversation_analytics aca ON c.id = aca.conversation_id
WHERE c.created_at >= NOW() - INTERVAL '90 days'
GROUP BY c.organization_id, c.type, DATE_TRUNC('day', c.created_at);

CREATE INDEX idx_mv_conversation_quality_org_date
ON mv_conversation_quality_summary(organization_id, date DESC);

-- ============================================================================
-- Refresh Functions for Materialized Views
-- ============================================================================

-- Function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_performance_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_agent_performance_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_conversation_quality_summary;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Query Performance Analysis Functions
-- ============================================================================

-- Function to analyze table sizes and index usage
CREATE OR REPLACE FUNCTION analyze_table_performance()
RETURNS TABLE (
  table_name text,
  table_size text,
  index_size text,
  total_size text,
  row_estimate bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    schemaname || '.' || tablename AS table_name,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) AS index_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) + pg_indexes_size(schemaname||'.'||tablename)) AS total_size,
    n_live_tup AS row_estimate
  FROM pg_stat_user_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Maintenance: Vacuum and Analyze
-- ============================================================================

-- Analyze all tables to update query planner statistics
ANALYZE agent_task_executions;
ANALYZE agent_cost_initiatives;
ANALYZE ml_predictions;
ANALYZE ml_models;
ANALYZE conversations;
ANALYZE messages;
ANALYZE ai_conversation_analytics;
ANALYZE conversation_context;
ANALYZE conversation_participants;
ANALYZE conversation_feedback;
ANALYZE user_profiles;
ANALYZE organizations;
ANALYZE sites;

-- ============================================================================
-- Performance Monitoring Queries (for debugging)
-- ============================================================================

-- Query to check index usage
-- SELECT
--   schemaname,
--   tablename,
--   indexname,
--   idx_scan as index_scans,
--   idx_tup_read as tuples_read,
--   idx_tup_fetch as tuples_fetched
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan DESC;

-- Query to find missing indexes (tables with many seq scans)
-- SELECT
--   schemaname,
--   tablename,
--   seq_scan,
--   seq_tup_read,
--   idx_scan,
--   seq_tup_read / NULLIF(seq_scan, 0) as avg_seq_tup_per_scan
-- FROM pg_stat_user_tables
-- WHERE schemaname = 'public'
--   AND seq_scan > 0
-- ORDER BY seq_scan DESC;

-- Query to check cache hit ratio (should be > 95%)
-- SELECT
--   'cache_hit_ratio' as metric,
--   ROUND(100.0 * sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0), 2) as percentage
-- FROM pg_statio_user_tables;

