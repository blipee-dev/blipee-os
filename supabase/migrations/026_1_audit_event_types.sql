-- Create audit event types table for categorizing events
CREATE TABLE IF NOT EXISTS audit_event_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('INFO', 'WARNING', 'ERROR', 'CRITICAL')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for audit event types
CREATE INDEX IF NOT EXISTS idx_audit_event_types_name ON audit_event_types(name);
CREATE INDEX IF NOT EXISTS idx_audit_event_types_category ON audit_event_types(category);
CREATE INDEX IF NOT EXISTS idx_audit_event_types_severity ON audit_event_types(severity);

-- Create rate limit rules table
CREATE TABLE IF NOT EXISTS rate_limit_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    limit_value INTEGER NOT NULL CHECK (limit_value > 0),
    window_seconds INTEGER NOT NULL CHECK (window_seconds > 0),
    burst_limit INTEGER NOT NULL CHECK (burst_limit > 0),
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for rate limit rules
CREATE INDEX IF NOT EXISTS idx_rate_limit_rules_name ON rate_limit_rules(name);
CREATE INDEX IF NOT EXISTS idx_rate_limit_rules_enabled ON rate_limit_rules(enabled);

-- Insert default audit event types
INSERT INTO audit_event_types (name, description, category, severity) VALUES
('AUTH_LOGIN_SUCCESS', 'User logged in successfully', 'authentication', 'INFO'),
('AUTH_LOGIN_FAILED', 'User login failed', 'authentication', 'WARNING'),
('AUTH_LOGOUT', 'User logged out', 'authentication', 'INFO'),
('AUTH_MFA_ENABLED', 'MFA enabled for user', 'authentication', 'INFO'),
('AUTH_MFA_DISABLED', 'MFA disabled for user', 'authentication', 'WARNING'),
('AUTH_MFA_VERIFIED', 'MFA verification successful', 'authentication', 'INFO'),
('AUTH_MFA_FAILED', 'MFA verification failed', 'authentication', 'WARNING'),
('AUTH_PASSWORD_CHANGED', 'Password changed', 'authentication', 'INFO'),
('AUTH_PASSWORD_RESET', 'Password reset requested', 'authentication', 'INFO'),
('AUTH_SESSION_CREATED', 'User session created', 'authentication', 'INFO'),
('AUTH_SESSION_TERMINATED', 'User session terminated', 'authentication', 'INFO'),
('USER_CREATED', 'User account created', 'user_management', 'INFO'),
('USER_UPDATED', 'User account updated', 'user_management', 'INFO'),
('USER_DELETED', 'User account deleted', 'user_management', 'WARNING'),
('USER_INVITED', 'User invited to organization', 'user_management', 'INFO'),
('USER_INVITATION_ACCEPTED', 'User invitation accepted', 'user_management', 'INFO'),
('USER_ROLE_CHANGED', 'User role changed', 'user_management', 'INFO'),
('USER_PERMISSIONS_CHANGED', 'User permissions changed', 'user_management', 'INFO'),
('SECURITY_THREAT_DETECTED', 'Security threat detected', 'security', 'CRITICAL'),
('SECURITY_RATE_LIMIT_EXCEEDED', 'Rate limit exceeded', 'security', 'WARNING'),
('SECURITY_SUSPICIOUS_ACTIVITY', 'Suspicious activity detected', 'security', 'WARNING'),
('SECURITY_ACCESS_DENIED', 'Access denied', 'security', 'WARNING'),
('SECURITY_POLICY_VIOLATION', 'Security policy violation', 'security', 'ERROR'),
('SYSTEM_ERROR', 'System error occurred', 'system', 'ERROR'),
('SYSTEM_MAINTENANCE', 'System maintenance performed', 'system', 'INFO'),
('SYSTEM_CONFIG_CHANGED', 'System configuration changed', 'system', 'INFO'),
('SYSTEM_BACKUP_CREATED', 'System backup created', 'system', 'INFO'),
('SYSTEM_BACKUP_RESTORED', 'System backup restored', 'system', 'INFO')
ON CONFLICT (name) DO NOTHING;

-- Insert default rate limit rules
INSERT INTO rate_limit_rules (name, description, limit_value, window_seconds, burst_limit) VALUES
('auth_login', 'Login attempts per IP', 5, 300, 10),
('auth_signup', 'Account creation attempts', 3, 3600, 5),
('mfa_setup', 'MFA setup attempts', 5, 3600, 10),
('mfa_verify', 'MFA verification attempts', 10, 900, 20),
('password_reset', 'Password reset requests', 3, 3600, 5),
('api_default', 'Default API rate limit', 1000, 3600, 1500)
ON CONFLICT (name) DO NOTHING;

-- Enable RLS for audit_event_types
ALTER TABLE audit_event_types ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS audit_event_types_read ON audit_event_types;
DROP POLICY IF EXISTS audit_event_types_modify ON audit_event_types;

-- Policy: Anyone can read audit event types
CREATE POLICY audit_event_types_read ON audit_event_types
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Only service role can modify audit event types
CREATE POLICY audit_event_types_modify ON audit_event_types
    FOR ALL
    TO service_role
    USING (true);

-- Enable RLS for rate_limit_rules
ALTER TABLE rate_limit_rules ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS rate_limit_rules_read ON rate_limit_rules;
DROP POLICY IF EXISTS rate_limit_rules_modify ON rate_limit_rules;

-- Policy: Anyone can read rate limit rules
CREATE POLICY rate_limit_rules_read ON rate_limit_rules
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Only service role can modify rate limit rules
CREATE POLICY rate_limit_rules_modify ON rate_limit_rules
    FOR ALL
    TO service_role
    USING (true);

-- Grant necessary permissions
GRANT SELECT ON audit_event_types TO authenticated;
GRANT ALL ON audit_event_types TO service_role;
GRANT SELECT ON rate_limit_rules TO authenticated;
GRANT ALL ON rate_limit_rules TO service_role;