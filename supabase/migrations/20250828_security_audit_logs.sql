-- Create security audit logs table
CREATE TABLE IF NOT EXISTS security_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  ip_address INET NOT NULL,
  user_agent TEXT,
  resource TEXT,
  action TEXT,
  result TEXT NOT NULL CHECK (result IN ('success', 'failure')),
  details JSONB,
  metadata JSONB,
  
  -- Indexes for query performance
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_security_audit_logs_timestamp ON security_audit_logs(timestamp DESC);
CREATE INDEX idx_security_audit_logs_event_type ON security_audit_logs(event_type);
CREATE INDEX idx_security_audit_logs_severity ON security_audit_logs(severity);
CREATE INDEX idx_security_audit_logs_user_id ON security_audit_logs(user_id);
CREATE INDEX idx_security_audit_logs_ip_address ON security_audit_logs(ip_address);

-- Create composite index for time-range queries
CREATE INDEX idx_security_audit_logs_composite ON security_audit_logs(timestamp DESC, event_type, severity);

-- Enable Row Level Security
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Only service role can insert (for security)
CREATE POLICY "Service role can insert security logs" ON security_audit_logs
  FOR INSERT
  TO service_role
  USING (true);

-- Admins can view all logs
CREATE POLICY "Admins can view security logs" ON security_audit_logs
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_organizations
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE role IN ('account_owner', 'security_admin')
      )
    )
  );

-- Users can view their own security events
CREATE POLICY "Users can view own security events" ON security_audit_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create function to clean up old logs
CREATE OR REPLACE FUNCTION cleanup_old_security_logs(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM security_audit_logs
  WHERE timestamp < NOW() - INTERVAL '1 day' * retention_days;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create scheduled job to clean up old logs (requires pg_cron extension)
-- This would run daily at 2 AM
-- SELECT cron.schedule('cleanup-security-logs', '0 2 * * *', 'SELECT cleanup_old_security_logs(90);');

-- Add comment
COMMENT ON TABLE security_audit_logs IS 'Security audit trail for compliance and monitoring';