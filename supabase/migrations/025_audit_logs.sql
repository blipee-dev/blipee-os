-- Create audit logs table for comprehensive security logging
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    
    -- Actor information
    actor_type TEXT NOT NULL CHECK (actor_type IN ('user', 'system', 'api')),
    actor_id UUID,
    actor_email TEXT,
    actor_ip INET,
    actor_user_agent TEXT,
    
    -- Target information (what was acted upon)
    target_type TEXT,
    target_id TEXT,
    target_name TEXT,
    
    -- Context information
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    building_id UUID,
    session_id TEXT,
    request_id TEXT,
    api_key_id TEXT,
    
    -- Event data
    metadata JSONB DEFAULT '{}',
    changes JSONB, -- Array of change objects
    result TEXT NOT NULL CHECK (result IN ('success', 'failure')),
    
    -- Error information
    error_code TEXT,
    error_message TEXT,
    error_stack_trace TEXT,
    
    -- Indexes for efficient querying
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_type ON audit_logs(type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_email ON audit_logs(actor_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_result ON audit_logs(result);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_ip ON audit_logs(actor_ip);

-- Composite indexes for common filter combinations
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_timestamp ON audit_logs(organization_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_type_timestamp ON audit_logs(type, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity_timestamp ON audit_logs(severity, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_timestamp ON audit_logs(actor_id, timestamp DESC);

-- GIN index for JSONB metadata searches
CREATE INDEX IF NOT EXISTS idx_audit_logs_metadata ON audit_logs USING GIN(metadata);

-- Full text search index for error messages and target names
CREATE INDEX IF NOT EXISTS idx_audit_logs_text_search ON audit_logs USING GIN(
    to_tsvector('english', 
        COALESCE(error_message, '') || ' ' || 
        COALESCE(target_name, '') || ' ' ||
        COALESCE(actor_email, '')
    )
);

-- Enable Row Level Security
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see audit logs for their organizations
CREATE POLICY audit_logs_organization_access ON audit_logs
    FOR SELECT
    TO authenticated
    USING (
        organization_id IN (
            SELECT om.organization_id 
            FROM organization_members om 
            WHERE om.user_id = auth.uid()
        )
        OR 
        -- System administrators can see all logs
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.metadata->>'role' = 'system_admin'
        )
    );

-- Policy: Only the system can insert audit logs
CREATE POLICY audit_logs_system_insert ON audit_logs
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Policy: No updates or deletes allowed (immutable audit trail)
CREATE POLICY audit_logs_no_updates ON audit_logs
    FOR UPDATE
    TO authenticated
    USING (false);

CREATE POLICY audit_logs_no_deletes ON audit_logs
    FOR DELETE
    TO authenticated
    USING (false);

-- Function to automatically clean up old audit logs
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
    -- Delete audit logs older than 2 years (configurable)
    DELETE FROM audit_logs 
    WHERE timestamp < NOW() - INTERVAL '2 years';
    
    -- Archive critical logs to a separate table if needed
    -- This could be extended to move logs to cold storage
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a scheduled job to clean up old logs (if pg_cron is available)
-- SELECT cron.schedule('cleanup-audit-logs', '0 2 * * 0', 'SELECT cleanup_old_audit_logs();');

-- Grant necessary permissions
GRANT SELECT ON audit_logs TO authenticated;
GRANT INSERT ON audit_logs TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_audit_logs() TO service_role;

-- Create a view for security dashboard
CREATE OR REPLACE VIEW audit_logs_summary AS
SELECT 
    DATE_TRUNC('hour', timestamp) as hour,
    type,
    severity,
    result,
    COUNT(*) as event_count,
    COUNT(DISTINCT actor_id) as unique_actors,
    COUNT(DISTINCT actor_ip) as unique_ips
FROM audit_logs 
WHERE timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', timestamp), type, severity, result
ORDER BY hour DESC;

GRANT SELECT ON audit_logs_summary TO authenticated;

-- Comments for documentation
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for all system actions and security events';
COMMENT ON COLUMN audit_logs.type IS 'Event type (e.g., auth.login.success, user.created, security.threat.detected)';
COMMENT ON COLUMN audit_logs.severity IS 'Event severity level for alerting and filtering';
COMMENT ON COLUMN audit_logs.actor_type IS 'Who performed the action (user, system, or api)';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional structured data about the event';
COMMENT ON COLUMN audit_logs.changes IS 'Array of field changes for data modification events';
COMMENT ON COLUMN audit_logs.result IS 'Whether the action succeeded or failed';

-- Create notification function for critical events
CREATE OR REPLACE FUNCTION notify_critical_audit_event()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify on critical security events
    IF NEW.severity = 'critical' AND NEW.type LIKE 'security.%' THEN
        PERFORM pg_notify(
            'critical_security_event',
            json_build_object(
                'id', NEW.id,
                'type', NEW.type,
                'actor_ip', NEW.actor_ip,
                'organization_id', NEW.organization_id,
                'timestamp', NEW.timestamp
            )::text
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for critical event notifications
CREATE TRIGGER trigger_critical_audit_events
    AFTER INSERT ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION notify_critical_audit_event();