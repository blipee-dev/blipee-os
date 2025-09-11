-- Add missing settings columns to app_users table if they don't exist
-- Run this FIRST before adding users

-- Add notification_settings column if it doesn't exist
ALTER TABLE app_users 
ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{
  "channels": {"email": true, "inApp": true, "push": false},
  "types": {
    "systemUpdates": true,
    "securityAlerts": true,
    "teamActivity": true,
    "sustainabilityReports": true,
    "complianceAlerts": true,
    "achievements": true
  },
  "frequency": {"reports": "weekly", "alerts": "realtime", "updates": "daily"},
  "quietHours": {"enabled": false, "startTime": "22:00", "endTime": "08:00", "weekendsOff": false},
  "emailPreferences": {"marketing": false, "productUpdates": true, "newsletter": false, "tips": true}
}'::jsonb;

-- Add appearance_settings column if it doesn't exist
ALTER TABLE app_users 
ADD COLUMN IF NOT EXISTS appearance_settings JSONB DEFAULT '{
  "theme": "system",
  "accentGradient": "from-purple-500 to-pink-500",
  "fontSize": "medium",
  "interfaceDensity": "comfortable",
  "reduceMotion": false,
  "highContrast": false,
  "autoCollapseSidebar": true
}'::jsonb;

-- Add language_settings column if it doesn't exist (this might already exist from migration)
ALTER TABLE app_users 
ADD COLUMN IF NOT EXISTS language_settings JSONB DEFAULT '{
  "displayLanguage": "en",
  "timezone": "auto",
  "dateFormat": "mm/dd/yyyy",
  "timeFormat": "12h",
  "numberFormat": "1,234.56",
  "currency": "USD",
  "units": "imperial",
  "contentLanguage": "en",
  "autoTranslate": false,
  "autoDetectBrowser": true,
  "rtlSupport": false,
  "reportingStandard": "GRI",
  "exportLanguage": "en",
  "fallbackLanguage": "en"
}'::jsonb;

-- Add security_settings column if it doesn't exist (this might already exist from migration)
ALTER TABLE app_users 
ADD COLUMN IF NOT EXISTS security_settings JSONB DEFAULT '{
  "twoFactorEnabled": false,
  "emailNotifications": true,
  "loginAlerts": true,
  "backupCodes": [],
  "trustedDevices": []
}'::jsonb;

-- Add security_events column if it doesn't exist
ALTER TABLE app_users 
ADD COLUMN IF NOT EXISTS security_events JSONB DEFAULT '[]'::jsonb;

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'app_users' 
AND column_name IN ('notification_settings', 'appearance_settings', 'language_settings', 'security_settings', 'security_events')
ORDER BY column_name;