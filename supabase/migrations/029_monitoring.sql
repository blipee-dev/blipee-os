-- Monitoring and alerting tables

-- Alert rules table
CREATE TABLE IF NOT EXISTS alert_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    metric VARCHAR(255) NOT NULL,
    condition VARCHAR(10) NOT NULL CHECK (condition IN ('gt', 'gte', 'lt', 'lte', 'eq', 'neq')),
    threshold NUMERIC NOT NULL,
    duration INTEGER, -- seconds
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    channels TEXT[] DEFAULT '{}',
    enabled BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    message TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    metric VARCHAR(255),
    threshold NUMERIC,
    current_value NUMERIC,
    timestamp TIMESTAMPTZ NOT NULL,
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Security events table
CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(255) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    source VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ip INET,
    user_agent TEXT,
    details JSONB NOT NULL DEFAULT '{}',
    timestamp TIMESTAMPTZ NOT NULL,
    handled BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Notification configs table
CREATE TABLE IF NOT EXISTS notification_configs (
    id VARCHAR(255) PRIMARY KEY DEFAULT 'default',
    config JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Health check table (for testing database health)
CREATE TABLE IF NOT EXISTS health_check (
    id INTEGER PRIMARY KEY DEFAULT 1,
    status VARCHAR(20) DEFAULT 'healthy',
    last_check TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT health_check_singleton CHECK (id = 1)
);

-- Insert default health check record
INSERT INTO health_check (id, status) VALUES (1, 'healthy')
ON CONFLICT (id) DO NOTHING;

-- Create indexes
CREATE INDEX idx_alert_rules_enabled ON alert_rules(enabled) WHERE enabled = true;
CREATE INDEX idx_alerts_timestamp ON alerts(timestamp DESC);
CREATE INDEX idx_alerts_resolved ON alerts(resolved) WHERE resolved = false;
CREATE INDEX idx_security_events_timestamp ON security_events(timestamp DESC);
CREATE INDEX idx_security_events_type ON security_events(type);
CREATE INDEX idx_security_events_user_id ON security_events(user_id);
CREATE INDEX idx_security_events_severity ON security_events(severity);

-- Row-level security
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_check ENABLE ROW LEVEL SECURITY;

-- Only account owners can manage alert rules
CREATE POLICY "Account owners can manage alert rules" ON alert_rules
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE user_id = auth.uid()
            AND role = 'account_owner'
        )
    );

-- Account owners and managers can view alerts
CREATE POLICY "Authorized users can view alerts" ON alerts
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE user_id = auth.uid()
            AND role IN ('account_owner', 'sustainability_lead')
        )
    );

-- Account owners can manage alerts
CREATE POLICY "Account owners can manage alerts" ON alerts
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE user_id = auth.uid()
            AND role = 'account_owner'
        )
    );

-- Security events are viewable by account owners and managers
CREATE POLICY "Authorized users can view security events" ON security_events
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE user_id = auth.uid()
            AND role IN ('account_owner', 'sustainability_lead')
        )
    );

-- Only system can insert security events
CREATE POLICY "System can insert security events" ON security_events
    FOR INSERT
    TO service_role
    USING (true);

-- Only account owners can manage notification configs
CREATE POLICY "Account owners can manage notification configs" ON notification_configs
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE user_id = auth.uid()
            AND role = 'account_owner'
        )
    );

-- Health check is publicly readable
CREATE POLICY "Health check is publicly readable" ON health_check
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Add audit event types for monitoring
INSERT INTO audit_event_types (name, description, category, severity) VALUES
    ('alert_rule_created', 'Alert rule created', 'monitoring', 'INFO'),
    ('alert_rule_updated', 'Alert rule updated', 'monitoring', 'INFO'),
    ('alert_rule_deleted', 'Alert rule deleted', 'monitoring', 'INFO'),
    ('alert_triggered', 'Alert triggered', 'monitoring', 'WARNING'),
    ('alert_resolved', 'Alert resolved', 'monitoring', 'INFO'),
    ('security_event_recorded', 'Security event recorded', 'security', 'WARNING'),
    ('notification_sent', 'Notification sent', 'monitoring', 'INFO'),
    ('notification_failed', 'Notification failed', 'monitoring', 'ERROR')
ON CONFLICT (name) DO NOTHING;