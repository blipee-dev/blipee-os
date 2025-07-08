-- Migration: Add SMS and Email MFA support
-- Description: Creates tables for SMS and email verification codes, user phone numbers, and user emails

-- SMS verification codes table
CREATE TABLE IF NOT EXISTS sms_verification_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    phone_number TEXT NOT NULL, -- Encrypted phone number
    phone_number_key TEXT NOT NULL, -- Encrypted data key for phone number
    hashed_code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT FALSE,
    purpose TEXT DEFAULT 'mfa' CHECK (purpose IN ('mfa', 'recovery')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for SMS verification codes
CREATE INDEX IF NOT EXISTS idx_sms_verification_codes_user_id ON sms_verification_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_verification_codes_expires_at ON sms_verification_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_sms_verification_codes_verified ON sms_verification_codes(verified);

-- Email verification codes table
CREATE TABLE IF NOT EXISTS email_verification_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    hashed_code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT FALSE,
    purpose TEXT DEFAULT 'mfa' CHECK (purpose IN ('mfa', 'recovery')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for email verification codes
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_user_id ON email_verification_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_email ON email_verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_expires_at ON email_verification_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_verified ON email_verification_codes(verified);

-- User phone numbers table
CREATE TABLE IF NOT EXISTS user_phone_numbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    phone_number TEXT NOT NULL, -- Encrypted phone number
    phone_number_key TEXT NOT NULL, -- Encrypted data key for phone number
    verified BOOLEAN DEFAULT FALSE,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, phone_number)
);

-- Indexes for user phone numbers
CREATE INDEX IF NOT EXISTS idx_user_phone_numbers_user_id ON user_phone_numbers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_phone_numbers_verified ON user_phone_numbers(verified);

-- User emails table (for additional emails beyond auth.users.email)
CREATE TABLE IF NOT EXISTS user_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, email)
);

-- Indexes for user emails
CREATE INDEX IF NOT EXISTS idx_user_emails_user_id ON user_emails(user_id);
CREATE INDEX IF NOT EXISTS idx_user_emails_email ON user_emails(email);
CREATE INDEX IF NOT EXISTS idx_user_emails_verified ON user_emails(verified);

-- Update user_mfa_config to support SMS and Email methods
ALTER TABLE user_mfa_config DROP CONSTRAINT IF EXISTS user_mfa_config_method_check;
ALTER TABLE user_mfa_config ADD CONSTRAINT user_mfa_config_method_check 
    CHECK (method IN ('totp', 'sms', 'email'));

-- Row Level Security (RLS) Policies

-- SMS verification codes policies
ALTER TABLE sms_verification_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own SMS verification codes" ON sms_verification_codes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own SMS verification codes" ON sms_verification_codes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own SMS verification codes" ON sms_verification_codes
    FOR UPDATE USING (auth.uid() = user_id);

-- Email verification codes policies
ALTER TABLE email_verification_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own email verification codes" ON email_verification_codes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email verification codes" ON email_verification_codes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email verification codes" ON email_verification_codes
    FOR UPDATE USING (auth.uid() = user_id);

-- User phone numbers policies
ALTER TABLE user_phone_numbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own phone numbers" ON user_phone_numbers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own phone numbers" ON user_phone_numbers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own phone numbers" ON user_phone_numbers
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own phone numbers" ON user_phone_numbers
    FOR DELETE USING (auth.uid() = user_id);

-- User emails policies
ALTER TABLE user_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own emails" ON user_emails
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own emails" ON user_emails
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own emails" ON user_emails
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own emails" ON user_emails
    FOR DELETE USING (auth.uid() = user_id);

-- Service role policies for all tables (for server-side operations)
CREATE POLICY "Service role can manage SMS verification codes" ON sms_verification_codes
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage email verification codes" ON email_verification_codes
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage user phone numbers" ON user_phone_numbers
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage user emails" ON user_emails
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Add new audit event types for SMS/Email MFA
INSERT INTO audit_event_types (name, description, category, severity) VALUES
    ('sms_code_sent', 'SMS verification code sent', 'authentication', 'INFO'),
    ('sms_code_verified', 'SMS verification code verified', 'authentication', 'INFO'),
    ('sms_code_send_failed', 'SMS verification code send failed', 'authentication', 'WARNING'),
    ('sms_code_verify_failed', 'SMS verification code verification failed', 'authentication', 'WARNING'),
    ('email_code_sent', 'Email verification code sent', 'authentication', 'INFO'),
    ('email_code_verified', 'Email verification code verified', 'authentication', 'INFO'),
    ('email_code_send_failed', 'Email verification code send failed', 'authentication', 'WARNING'),
    ('email_code_verify_failed', 'Email verification code verification failed', 'authentication', 'WARNING'),
    ('phone_number_added', 'Phone number added to user account', 'user_management', 'INFO'),
    ('email_added', 'Email address added to user account', 'user_management', 'INFO')
ON CONFLICT (name) DO NOTHING;

-- Add cleanup function for expired verification codes
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS INTEGER AS $$
DECLARE
    sms_deleted INTEGER;
    email_deleted INTEGER;
    total_deleted INTEGER;
BEGIN
    -- Delete expired SMS verification codes
    DELETE FROM sms_verification_codes 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS sms_deleted = ROW_COUNT;
    
    -- Delete expired email verification codes
    DELETE FROM email_verification_codes 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS email_deleted = ROW_COUNT;
    
    total_deleted := sms_deleted + email_deleted;
    
    RETURN total_deleted;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to cleanup expired codes (if pg_cron is available)
-- This will run every hour to clean up expired verification codes
-- SELECT cron.schedule('cleanup-verification-codes', '0 * * * *', 'SELECT cleanup_expired_verification_codes();');

COMMENT ON TABLE sms_verification_codes IS 'Stores SMS verification codes for MFA and account recovery';
COMMENT ON TABLE email_verification_codes IS 'Stores email verification codes for MFA and account recovery';
COMMENT ON TABLE user_phone_numbers IS 'Stores encrypted phone numbers for users';
COMMENT ON TABLE user_emails IS 'Stores additional email addresses for users';
COMMENT ON FUNCTION cleanup_expired_verification_codes() IS 'Cleans up expired SMS and email verification codes';