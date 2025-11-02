-- Consent Log Table for GDPR/CCPA Compliance
-- Records user consent decisions with full audit trail

CREATE TABLE IF NOT EXISTS consent_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  preferences JSONB NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  privacy_policy_version TEXT NOT NULL,
  user_agent TEXT,
  ip_hash TEXT, -- Optional: hashed IP for additional audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX idx_consent_log_user_id ON consent_log(user_id);
CREATE INDEX idx_consent_log_timestamp ON consent_log(timestamp DESC);
CREATE INDEX idx_consent_log_user_timestamp ON consent_log(user_id, timestamp DESC);

-- Enable Row Level Security
ALTER TABLE consent_log ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own consent history
CREATE POLICY "Users can view own consent history"
  ON consent_log
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own consent
CREATE POLICY "Users can insert own consent"
  ON consent_log
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to get latest consent for user
CREATE OR REPLACE FUNCTION get_latest_consent(p_user_id UUID)
RETURNS TABLE (
  preferences JSONB,
  consent_timestamp TIMESTAMPTZ,
  privacy_policy_version TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cl.preferences,
    cl.timestamp AS consent_timestamp,
    cl.privacy_policy_version
  FROM consent_log cl
  WHERE cl.user_id = p_user_id
  ORDER BY cl.timestamp DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment
COMMENT ON TABLE consent_log IS 'Audit trail of user consent decisions for GDPR/CCPA compliance';
COMMENT ON COLUMN consent_log.preferences IS 'JSON object with consent preferences: {essential, analytics, marketing}';
COMMENT ON COLUMN consent_log.privacy_policy_version IS 'Version of privacy policy user consented to';
COMMENT ON COLUMN consent_log.user_agent IS 'Browser user agent for audit purposes';
COMMENT ON COLUMN consent_log.ip_hash IS 'Optional hashed IP address for additional audit trail';
