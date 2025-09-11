-- Add security_settings column to app_users table
ALTER TABLE app_users 
ADD COLUMN IF NOT EXISTS security_settings JSONB DEFAULT '{
  "twoFactorEnabled": false,
  "emailNotifications": true,
  "loginAlerts": true,
  "backupCodes": [],
  "trustedDevices": []
}'::jsonb;

-- Add security_events column to app_users table
ALTER TABLE app_users 
ADD COLUMN IF NOT EXISTS security_events JSONB DEFAULT '[]'::jsonb;

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_app_users_security_settings 
ON app_users USING GIN (security_settings);

CREATE INDEX IF NOT EXISTS idx_app_users_security_events 
ON app_users USING GIN (security_events);

-- Add comments for documentation
COMMENT ON COLUMN app_users.security_settings IS 'User security preferences including 2FA, notifications, and trusted devices';
COMMENT ON COLUMN app_users.security_events IS 'Security event log for the user (logins, password changes, etc)';