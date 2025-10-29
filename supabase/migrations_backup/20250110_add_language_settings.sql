-- Add language_settings column to app_users table
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

-- Add index for faster queries on language settings
CREATE INDEX IF NOT EXISTS idx_app_users_language_settings 
ON app_users USING GIN (language_settings);

-- Add comment for documentation
COMMENT ON COLUMN app_users.language_settings IS 'User language and regional preferences including timezone, date format, currency, etc';