-- Create WebAuthn credentials table
CREATE TABLE webauthn_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    credential_id TEXT NOT NULL UNIQUE,
    public_key TEXT NOT NULL,
    counter BIGINT NOT NULL DEFAULT 0,
    aaguid TEXT NOT NULL,
    name TEXT NOT NULL,
    device_type TEXT NOT NULL CHECK (device_type IN ('platform', 'cross-platform')),
    backup_eligible BOOLEAN NOT NULL DEFAULT false,
    backup_state BOOLEAN NOT NULL DEFAULT false,
    transports TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_used TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    CONSTRAINT webauthn_credentials_counter_check CHECK (counter >= 0),
    CONSTRAINT webauthn_credentials_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 100)
);

-- Create WebAuthn challenges table
CREATE TABLE webauthn_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge TEXT NOT NULL,
    user_id TEXT NOT NULL, -- Can be 'anonymous' for usernameless flows
    expires_at TIMESTAMPTZ NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('registration', 'authentication')),
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    CONSTRAINT webauthn_challenges_challenge_length CHECK (char_length(challenge) >= 32),
    CONSTRAINT webauthn_challenges_expires_future CHECK (expires_at > created_at)
);

-- Create indexes for performance
CREATE INDEX idx_webauthn_credentials_user_id ON webauthn_credentials(user_id);
CREATE INDEX idx_webauthn_credentials_credential_id ON webauthn_credentials(credential_id);
CREATE INDEX idx_webauthn_credentials_active ON webauthn_credentials(user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_webauthn_credentials_device_type ON webauthn_credentials(device_type);
CREATE INDEX idx_webauthn_credentials_last_used ON webauthn_credentials(last_used);
CREATE INDEX idx_webauthn_credentials_aaguid ON webauthn_credentials(aaguid);

CREATE INDEX idx_webauthn_challenges_user_type ON webauthn_challenges(user_id, type);
CREATE INDEX idx_webauthn_challenges_expires ON webauthn_challenges(expires_at);
CREATE INDEX idx_webauthn_challenges_challenge ON webauthn_challenges(challenge);

-- Create cleanup function for expired challenges
CREATE OR REPLACE FUNCTION cleanup_expired_webauthn_challenges()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM webauthn_challenges 
    WHERE expires_at < now();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create cleanup function for old inactive credentials
CREATE OR REPLACE FUNCTION cleanup_old_webauthn_credentials()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM webauthn_credentials 
    WHERE is_active = false 
    AND last_used < now() - INTERVAL '1 year';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies
ALTER TABLE webauthn_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE webauthn_challenges ENABLE ROW LEVEL SECURITY;

-- Users can only access their own credentials
CREATE POLICY "Users can view their own WebAuthn credentials"
    ON webauthn_credentials FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own WebAuthn credentials"
    ON webauthn_credentials FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own WebAuthn credentials"
    ON webauthn_credentials FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own WebAuthn credentials"
    ON webauthn_credentials FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Service role can access all credentials (for authentication)
CREATE POLICY "Service role can access all WebAuthn credentials"
    ON webauthn_credentials FOR ALL
    TO service_role
    USING (true);

-- WebAuthn challenges have limited access
CREATE POLICY "Users can view their own WebAuthn challenges"
    ON webauthn_challenges FOR SELECT
    TO authenticated
    USING (user_id = auth.uid()::text OR user_id = 'anonymous');

CREATE POLICY "Anyone can insert WebAuthn challenges"
    ON webauthn_challenges FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Service role can access all WebAuthn challenges"
    ON webauthn_challenges FOR ALL
    TO service_role
    USING (true);

-- Add audit event types for WebAuthn
INSERT INTO audit_event_types (name, description, category, severity) VALUES
('MFA_WEBAUTHN_REGISTRATION_STARTED', 'WebAuthn credential registration started', 'authentication', 'INFO'),
('MFA_WEBAUTHN_REGISTERED', 'WebAuthn credential registered successfully', 'authentication', 'INFO'),
('MFA_WEBAUTHN_REGISTRATION_FAILED', 'WebAuthn credential registration failed', 'authentication', 'WARNING'),
('MFA_WEBAUTHN_AUTHENTICATION_STARTED', 'WebAuthn authentication started', 'authentication', 'INFO'),
('MFA_WEBAUTHN_VERIFIED', 'WebAuthn authentication verified successfully', 'authentication', 'INFO'),
('MFA_WEBAUTHN_VERIFICATION_FAILED', 'WebAuthn authentication verification failed', 'authentication', 'WARNING'),
('MFA_WEBAUTHN_CREDENTIAL_DELETED', 'WebAuthn credential deleted', 'authentication', 'INFO'),
('MFA_WEBAUTHN_CREDENTIAL_DISABLED', 'WebAuthn credential disabled', 'authentication', 'INFO'),
('MFA_WEBAUTHN_COUNTER_ANOMALY', 'WebAuthn counter anomaly detected', 'security', 'WARNING');

-- Add rate limiting rules for WebAuthn
INSERT INTO rate_limit_rules (name, description, limit_value, window_seconds, burst_limit) VALUES
('webauthn_registration', 'WebAuthn credential registration attempts', 5, 3600, 10),
('webauthn_auth', 'WebAuthn authentication attempts', 20, 900, 30);

-- Create function to get WebAuthn statistics
CREATE OR REPLACE FUNCTION get_webauthn_stats()
RETURNS TABLE (
    total_credentials BIGINT,
    active_credentials BIGINT,
    platform_credentials BIGINT,
    cross_platform_credentials BIGINT,
    recent_authentications BIGINT,
    top_device_types JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_credentials,
        COUNT(*) FILTER (WHERE is_active = true) as active_credentials,
        COUNT(*) FILTER (WHERE device_type = 'platform') as platform_credentials,
        COUNT(*) FILTER (WHERE device_type = 'cross-platform') as cross_platform_credentials,
        COUNT(*) FILTER (WHERE last_used > now() - INTERVAL '30 days') as recent_authentications,
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'type', COALESCE(
                        CASE aaguid
                            WHEN 'f8a011f3-8c0a-4d15-8006-17111f9edc7d' THEN 'YubiKey 5'
                            WHEN 'c5ef55ff-ad9a-4b9f-b580-adebafe026d0' THEN 'YubiKey 5C'
                            WHEN 'fa2b99dc-9e39-4257-8f92-4a30d23c4118' THEN 'YubiKey 5 NFC'
                            WHEN '8876631b-d4a0-427f-5773-0ec71c9e0279' THEN 'SoloKeys Solo'
                            WHEN 'ea9b8d66-4d01-1d21-3ce4-b6b48cb575d4' THEN 'Google Titan'
                            WHEN '08987058-cadc-4b81-b6e1-30de50dcbe96' THEN 'Windows Hello'
                            WHEN '39a5647e-1853-446c-a1f6-a79bae9f5bc7' THEN 'Touch ID / Face ID'
                            ELSE 'Unknown Device'
                        END
                    ),
                    'count', device_count
                )
            )
            FROM (
                SELECT aaguid, COUNT(*) as device_count
                FROM webauthn_credentials
                GROUP BY aaguid
                ORDER BY device_count DESC
                LIMIT 5
            ) device_stats
        ) as top_device_types
    FROM webauthn_credentials;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON webauthn_credentials TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON webauthn_challenges TO authenticated;
GRANT EXECUTE ON FUNCTION get_webauthn_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_webauthn_challenges() TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_webauthn_credentials() TO service_role;

-- Create periodic cleanup job (if pg_cron is available)
-- This would typically be set up outside of the migration
-- SELECT cron.schedule('cleanup-webauthn-challenges', '0 * * * *', 'SELECT cleanup_expired_webauthn_challenges();');
-- SELECT cron.schedule('cleanup-webauthn-credentials', '0 2 * * *', 'SELECT cleanup_old_webauthn_credentials();');

COMMENT ON TABLE webauthn_credentials IS 'Stores WebAuthn/FIDO2 credentials for users';
COMMENT ON TABLE webauthn_challenges IS 'Stores temporary WebAuthn challenges for authentication ceremonies';
COMMENT ON COLUMN webauthn_credentials.credential_id IS 'Base64URL-encoded credential ID from WebAuthn';
COMMENT ON COLUMN webauthn_credentials.public_key IS 'Base64-encoded public key for signature verification';
COMMENT ON COLUMN webauthn_credentials.counter IS 'Signature counter for replay protection';
COMMENT ON COLUMN webauthn_credentials.aaguid IS 'Authenticator Attestation GUID';
COMMENT ON COLUMN webauthn_credentials.device_type IS 'Platform (built-in) or cross-platform (external) authenticator';
COMMENT ON COLUMN webauthn_credentials.backup_eligible IS 'Whether the credential can be backed up';
COMMENT ON COLUMN webauthn_credentials.backup_state IS 'Current backup state of the credential';
COMMENT ON COLUMN webauthn_credentials.transports IS 'Available transport methods (usb, nfc, ble, internal)';
COMMENT ON COLUMN webauthn_challenges.challenge IS 'Base64URL-encoded challenge for WebAuthn ceremony';
COMMENT ON COLUMN webauthn_challenges.user_id IS 'User ID or "anonymous" for usernameless authentication';
COMMENT ON COLUMN webauthn_challenges.type IS 'Type of WebAuthn ceremony (registration or authentication)';
COMMENT ON COLUMN webauthn_challenges.metadata IS 'Additional metadata for the challenge';