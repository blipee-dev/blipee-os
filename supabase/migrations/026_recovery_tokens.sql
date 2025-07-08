-- Create recovery tokens table for secure account recovery
CREATE TABLE IF NOT EXISTS recovery_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('password_reset', 'account_unlock', 'mfa_recovery', 'email_verification')),
    hashed_token TEXT NOT NULL,
    method TEXT NOT NULL CHECK (method IN ('email', 'sms', 'security_questions', 'backup_codes', 'admin_override')),
    expires_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'expired', 'used', 'revoked', 'failed')),
    max_attempts INTEGER NOT NULL DEFAULT 3,
    current_attempts INTEGER NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    used_at TIMESTAMPTZ
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_recovery_tokens_user_id ON recovery_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_recovery_tokens_status ON recovery_tokens(status);
CREATE INDEX IF NOT EXISTS idx_recovery_tokens_expires_at ON recovery_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_recovery_tokens_type ON recovery_tokens(type);
CREATE INDEX IF NOT EXISTS idx_recovery_tokens_method ON recovery_tokens(method);
CREATE INDEX IF NOT EXISTS idx_recovery_tokens_created_at ON recovery_tokens(created_at DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_recovery_tokens_status_expires ON recovery_tokens(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_recovery_tokens_user_status ON recovery_tokens(user_id, status);

-- Enable Row Level Security
ALTER TABLE recovery_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own recovery tokens
CREATE POLICY recovery_tokens_user_access ON recovery_tokens
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Policy: Only service role can insert recovery tokens
CREATE POLICY recovery_tokens_service_insert ON recovery_tokens
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Policy: Only service role can update recovery tokens
CREATE POLICY recovery_tokens_service_update ON recovery_tokens
    FOR UPDATE
    TO service_role
    USING (true);

-- Policy: Users and service role can update their own tokens (for attempt counting)
CREATE POLICY recovery_tokens_user_update ON recovery_tokens
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Function to increment recovery attempts atomically
CREATE OR REPLACE FUNCTION increment_recovery_attempts(token_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE recovery_tokens 
    SET current_attempts = current_attempts + 1,
        status = CASE 
            WHEN current_attempts + 1 >= max_attempts THEN 'failed'::text
            ELSE status
        END
    WHERE id = token_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically expire old tokens
CREATE OR REPLACE FUNCTION expire_old_recovery_tokens()
RETURNS void AS $$
BEGIN
    -- Mark expired tokens
    UPDATE recovery_tokens 
    SET status = 'expired'
    WHERE status = 'pending' 
    AND expires_at < NOW();
    
    -- Delete tokens older than 30 days
    DELETE FROM recovery_tokens 
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate recovery token
CREATE OR REPLACE FUNCTION validate_recovery_token(
    p_user_id UUID,
    p_token_type TEXT,
    p_method TEXT
)
RETURNS TABLE (
    token_id UUID,
    token_status TEXT,
    attempts_remaining INTEGER,
    expires_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rt.id,
        rt.status,
        rt.max_attempts - rt.current_attempts,
        rt.expires_at
    FROM recovery_tokens rt
    WHERE rt.user_id = p_user_id
    AND rt.type = p_token_type
    AND rt.method = p_method
    AND rt.status = 'pending'
    AND rt.expires_at > NOW()
    ORDER BY rt.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view for recovery statistics
CREATE OR REPLACE VIEW recovery_statistics AS
SELECT 
    DATE_TRUNC('day', created_at) as day,
    type,
    method,
    status,
    COUNT(*) as count,
    COUNT(DISTINCT user_id) as unique_users
FROM recovery_tokens 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at), type, method, status
ORDER BY day DESC;

-- Grant necessary permissions
GRANT SELECT ON recovery_tokens TO authenticated;
GRANT INSERT, UPDATE ON recovery_tokens TO service_role;
GRANT EXECUTE ON FUNCTION increment_recovery_attempts(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION expire_old_recovery_tokens() TO service_role;
GRANT EXECUTE ON FUNCTION validate_recovery_token(UUID, TEXT, TEXT) TO authenticated, service_role;
GRANT SELECT ON recovery_statistics TO authenticated;

-- Create notification function for critical recovery events
CREATE OR REPLACE FUNCTION notify_critical_recovery_event()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify on multiple failed attempts
    IF NEW.status = 'failed' AND OLD.status != 'failed' THEN
        PERFORM pg_notify(
            'critical_recovery_event',
            json_build_object(
                'event', 'max_attempts_exceeded',
                'user_id', NEW.user_id,
                'method', NEW.method,
                'ip_address', NEW.metadata->>'ipAddress',
                'timestamp', NEW.created_at
            )::text
        );
    END IF;
    
    -- Notify on admin override
    IF NEW.method = 'admin_override' AND NEW.status = 'used' THEN
        PERFORM pg_notify(
            'critical_recovery_event',
            json_build_object(
                'event', 'admin_override_used',
                'user_id', NEW.user_id,
                'admin_user_id', NEW.metadata->>'adminUserId',
                'timestamp', NEW.used_at
            )::text
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for critical recovery events
CREATE TRIGGER trigger_critical_recovery_events
    AFTER UPDATE ON recovery_tokens
    FOR EACH ROW
    EXECUTE FUNCTION notify_critical_recovery_event();

-- Create scheduled job to clean up expired tokens (if pg_cron is available)
-- SELECT cron.schedule('cleanup-recovery-tokens', '0 */6 * * *', 'SELECT expire_old_recovery_tokens();');

-- Comments for documentation
COMMENT ON TABLE recovery_tokens IS 'Secure tokens for account recovery with multiple verification methods';
COMMENT ON COLUMN recovery_tokens.type IS 'Type of recovery (password_reset, account_unlock, mfa_recovery, email_verification)';
COMMENT ON COLUMN recovery_tokens.method IS 'Recovery method used (email, sms, security_questions, backup_codes, admin_override)';
COMMENT ON COLUMN recovery_tokens.hashed_token IS 'Bcrypt hashed recovery token for secure comparison';
COMMENT ON COLUMN recovery_tokens.status IS 'Current status of the recovery token';
COMMENT ON COLUMN recovery_tokens.max_attempts IS 'Maximum number of verification attempts allowed';
COMMENT ON COLUMN recovery_tokens.current_attempts IS 'Current number of attempts made';
COMMENT ON COLUMN recovery_tokens.metadata IS 'Additional data like IP address, user agent, admin info';

-- Add recovery method tracking to user profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS recovery_methods JSONB DEFAULT '{"email": true, "sms": false, "security_questions": false, "backup_codes": false}';

COMMENT ON COLUMN user_profiles.recovery_methods IS 'Available recovery methods for the user';

-- Create index on recovery methods
CREATE INDEX IF NOT EXISTS idx_user_profiles_recovery_methods ON user_profiles USING GIN(recovery_methods);

-- Create function to get user recovery options
CREATE OR REPLACE FUNCTION get_user_recovery_options(p_user_id UUID)
RETURNS TABLE (
    email_enabled BOOLEAN,
    sms_enabled BOOLEAN,
    security_questions_enabled BOOLEAN,
    backup_codes_enabled BOOLEAN,
    phone_number TEXT,
    security_questions_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE((up.recovery_methods->>'email')::boolean, true) as email_enabled,
        COALESCE((up.recovery_methods->>'sms')::boolean, false) as sms_enabled,
        COALESCE((up.recovery_methods->>'security_questions')::boolean, false) as security_questions_enabled,
        COALESCE((up.recovery_methods->>'backup_codes')::boolean, false) as backup_codes_enabled,
        up.metadata->>'phone_number' as phone_number,
        CASE 
            WHEN up.metadata->>'security_questions' IS NOT NULL THEN 
                jsonb_array_length((up.metadata->>'security_questions')::jsonb)
            ELSE 0
        END as security_questions_count
    FROM user_profiles up
    WHERE up.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_user_recovery_options(UUID) TO authenticated;