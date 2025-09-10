-- Add notification_settings column to app_users table
ALTER TABLE app_users 
ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{
  "channels": {
    "email": true,
    "push": true,
    "sms": false,
    "inApp": true
  },
  "types": {
    "systemAlerts": true,
    "performance": true,
    "security": true,
    "teamUpdates": true,
    "reports": false,
    "mentions": true
  },
  "frequency": {
    "realTime": "instant",
    "digest": "daily",
    "reports": "weekly"
  }
}'::jsonb;

-- Add index for faster queries on notification settings
CREATE INDEX IF NOT EXISTS idx_app_users_notification_settings 
ON app_users USING GIN (notification_settings);

-- Add comment for documentation
COMMENT ON COLUMN app_users.notification_settings IS 'User notification preferences including channels, types, and frequency';