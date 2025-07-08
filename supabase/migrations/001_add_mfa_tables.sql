-- =====================================================
-- MFA (Multi-Factor Authentication) Tables
-- =====================================================

-- User MFA configuration
CREATE TABLE IF NOT EXISTS user_mfa_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  method VARCHAR(50) NOT NULL CHECK (method IN ('totp', 'sms', 'email', 'backup_codes')),
  secret TEXT NOT NULL, -- Encrypted
  is_primary BOOLEAN DEFAULT false,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, method)
);

-- Backup codes for MFA
CREATE TABLE IF NOT EXISTS user_backup_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  code_hash VARCHAR(64) NOT NULL, -- SHA-256 hash
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, code_hash)
);

-- Pending MFA setups (temporary storage during setup)
CREATE TABLE IF NOT EXISTS pending_mfa_setups (
  user_id UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  method VARCHAR(50) NOT NULL,
  secret TEXT NOT NULL, -- Encrypted
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- MFA challenges for login
CREATE TABLE IF NOT EXISTS mfa_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  methods TEXT[] NOT NULL,
  attempts INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trusted devices
CREATE TABLE IF NOT EXISTS user_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  device_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) CHECK (type IN ('mobile', 'desktop', 'tablet')),
  user_agent TEXT,
  ip_address INET,
  is_trusted BOOLEAN DEFAULT false,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, device_id)
);

-- Create indexes
CREATE INDEX idx_mfa_config_user ON user_mfa_config(user_id);
CREATE INDEX idx_backup_codes_user ON user_backup_codes(user_id) WHERE used_at IS NULL;
CREATE INDEX idx_mfa_challenges_user ON mfa_challenges(user_id);
CREATE INDEX idx_mfa_challenges_expires ON mfa_challenges(expires_at);
CREATE INDEX idx_user_devices_user ON user_devices(user_id);
CREATE INDEX idx_user_devices_trusted ON user_devices(user_id, is_trusted) WHERE is_trusted = true;

-- Cleanup function for expired challenges
CREATE OR REPLACE FUNCTION cleanup_expired_mfa_challenges() RETURNS void AS $$
BEGIN
  DELETE FROM mfa_challenges WHERE expires_at < NOW();
  DELETE FROM pending_mfa_setups WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE user_mfa_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_backup_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_mfa_setups ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own MFA config" ON user_mfa_config
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own MFA config" ON user_mfa_config
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own backup codes" ON user_backup_codes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own devices" ON user_devices
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own devices" ON user_devices
  FOR ALL USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_mfa_config TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_backup_codes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON pending_mfa_setups TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON mfa_challenges TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_devices TO authenticated;