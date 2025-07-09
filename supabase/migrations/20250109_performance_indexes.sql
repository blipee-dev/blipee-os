-- Performance optimization indexes for blipee-os
-- This migration adds strategic indexes to improve query performance

-- =====================================================
-- CONVERSATION & AI INDEXES
-- =====================================================

-- Index for fetching conversations by organization and user
CREATE INDEX IF NOT EXISTS idx_conversations_org_user 
ON conversations(organization_id, user_id);

-- Index for recent conversations
CREATE INDEX IF NOT EXISTS idx_conversations_recent 
ON conversations(organization_id, updated_at DESC);

-- Index for messages by conversation
CREATE INDEX IF NOT EXISTS idx_messages_conversation 
ON messages(conversation_id, created_at DESC);

-- Index for AI message search
CREATE INDEX IF NOT EXISTS idx_messages_content_search 
ON messages USING gin(to_tsvector('english', content));

-- =====================================================
-- FACILITY & METRICS INDEXES
-- =====================================================

-- Index for facility queries by organization (facilities table has deleted_at)
CREATE INDEX IF NOT EXISTS idx_facilities_org_active 
ON facilities(organization_id) 
WHERE deleted_at IS NULL;

-- Index for energy consumption time-series queries
CREATE INDEX IF NOT EXISTS idx_energy_consumption_facility_time 
ON energy_consumption(facility_id, period_start DESC);

-- Note: For recent data filtering, use the above index with WHERE clause in queries
-- Partial indexes with NOW() are not allowed (functions must be immutable)

-- Index for water consumption queries
CREATE INDEX IF NOT EXISTS idx_water_consumption_facility_time 
ON water_consumption(facility_id, period_start DESC);

-- =====================================================
-- EMISSIONS & SUSTAINABILITY INDEXES
-- =====================================================

-- Index for emissions by organization and time
-- Note: scope and category are in emission_sources table, not emissions
CREATE INDEX IF NOT EXISTS idx_emissions_org_time 
ON emissions(organization_id, period_start DESC);

-- Index for emission sources by scope and category  
CREATE INDEX IF NOT EXISTS idx_emission_sources_scope_category 
ON emission_sources(organization_id, scope, category);

-- Index for emissions tracking by source
CREATE INDEX IF NOT EXISTS idx_emissions_source 
ON emissions(organization_id, source_id);

-- Note: sustainability_reports table can be added in future migrations

-- =====================================================
-- USER & AUTH INDEXES
-- =====================================================

-- Index for user profile lookups by email
CREATE INDEX IF NOT EXISTS idx_user_profiles_email_lower 
ON user_profiles(LOWER(email));

-- Index for organization members
CREATE INDEX IF NOT EXISTS idx_org_members_user 
ON organization_members(user_id, organization_id) 
WHERE deleted_at IS NULL;

-- Index for SSO sessions (sso_sessions doesn't have revoked_at)
CREATE INDEX IF NOT EXISTS idx_sso_sessions_active 
ON sso_sessions(user_id, expires_at);

-- =====================================================
-- AUDIT & MONITORING INDEXES
-- =====================================================

-- Index for audit logs by target (audit_logs uses 'timestamp' not 'created_at')
CREATE INDEX IF NOT EXISTS idx_audit_logs_target 
ON audit_logs(target_type, target_id, timestamp DESC);

-- Index for audit logs by actor and type (audit_logs uses 'actor_id' not 'user_id')
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_type 
ON audit_logs(actor_id, type, timestamp DESC);

-- Note: System alerts table can be added in future migrations

-- =====================================================
-- API & WEBHOOKS INDEXES
-- =====================================================

-- Index for API key lookups
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash 
ON api_keys(key_hash) 
WHERE revoked_at IS NULL;

-- Index for webhook deliveries
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status 
ON webhook_deliveries(webhook_endpoint_id, status, created_at DESC);

-- Index for rate limit rules (using actual columns)
CREATE INDEX IF NOT EXISTS idx_rate_limit_rules_name 
ON rate_limit_rules(name, enabled);

-- =====================================================
-- DOCUMENT & FILE INDEXES
-- =====================================================

-- Index for document searches (documents table doesn't have deleted_at)
CREATE INDEX IF NOT EXISTS idx_documents_org_type 
ON documents(organization_id, document_type, created_at DESC);

-- Full-text search index for documents (using extracted_text instead of content)
CREATE INDEX IF NOT EXISTS idx_documents_content_search 
ON documents USING gin(to_tsvector('english', COALESCE(extracted_text, '') || ' ' || COALESCE(metadata::text, '')));

-- =====================================================
-- PERFORMANCE MONITORING INDEXES
-- =====================================================

-- Create a table for query performance monitoring
CREATE TABLE IF NOT EXISTS query_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_fingerprint TEXT NOT NULL,
    query_text TEXT,
    execution_time_ms DECIMAL(10,2),
    rows_returned INTEGER,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_query_performance_slow 
ON query_performance(execution_time_ms DESC, timestamp DESC) 
WHERE execution_time_ms > 1000;

-- =====================================================
-- MATERIALIZED VIEWS FOR PERFORMANCE
-- =====================================================

-- Materialized view for organization dashboard metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_org_dashboard_metrics AS
SELECT 
    o.id as organization_id,
    COUNT(DISTINCT f.id) as total_facilities,
    COUNT(DISTINCT u.id) as total_users,
    COALESCE(SUM(e.co2e_tonnes), 0) as total_emissions_mtco2e,
    COALESCE(AVG(ec.consumption_value), 0) as avg_energy_usage,
    MAX(c.created_at) as last_conversation_at
FROM organizations o
LEFT JOIN facilities f ON f.organization_id = o.id AND f.deleted_at IS NULL
LEFT JOIN organization_members om ON om.organization_id = o.id AND om.deleted_at IS NULL
LEFT JOIN user_profiles u ON u.id = om.user_id
LEFT JOIN emissions e ON e.organization_id = o.id 
    AND e.period_start >= NOW() - INTERVAL '30 days'
LEFT JOIN energy_consumption ec ON ec.facility_id = f.id 
    AND ec.period_start >= NOW() - INTERVAL '30 days'
LEFT JOIN conversations c ON c.organization_id = o.id
WHERE o.deleted_at IS NULL
GROUP BY o.id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_org_dashboard_metrics 
ON mv_org_dashboard_metrics(organization_id);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_org_dashboard_metrics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_org_dashboard_metrics;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- QUERY OPTIMIZATION SETTINGS
-- =====================================================

-- Analyze tables to update statistics
ANALYZE conversations;
ANALYZE messages;
ANALYZE facilities;
ANALYZE energy_consumption;
ANALYZE emissions;
ANALYZE user_profiles;
ANALYZE organizations;

-- Set table-specific configuration for large tables
ALTER TABLE messages SET (autovacuum_vacuum_scale_factor = 0.1);

-- Note: energy_consumption and emissions are partitioned tables
-- Storage parameters must be set on individual partitions, not the parent table
-- Example for setting on partitions:
-- ALTER TABLE energy_consumption_2024 SET (autovacuum_vacuum_scale_factor = 0.1);
-- ALTER TABLE energy_consumption_2025 SET (autovacuum_vacuum_scale_factor = 0.1);
-- ALTER TABLE emissions_2024 SET (autovacuum_vacuum_scale_factor = 0.1);
-- ALTER TABLE emissions_2025 SET (autovacuum_vacuum_scale_factor = 0.1);

-- Add comment
COMMENT ON SCHEMA public IS 'Performance optimized schema for blipee-os with strategic indexes';