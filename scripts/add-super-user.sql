-- Add super user to app_users table
-- Run this in Supabase SQL Editor

-- First, check if the user exists in auth.users
SELECT id, email, raw_user_meta_data, created_at 
FROM auth.users 
WHERE id = '4da3b401-990a-4011-9576-273986f43360';

-- Insert the super user into app_users with admin/owner role
INSERT INTO public.app_users (
  auth_user_id,
  email,
  name,
  role,
  status,
  created_at,
  updated_at,
  -- Settings with all defaults
  notification_settings,
  appearance_settings,
  language_settings,
  security_settings,
  security_events
)
VALUES (
  '4da3b401-990a-4011-9576-273986f43360',
  (SELECT email FROM auth.users WHERE id = '4da3b401-990a-4011-9576-273986f43360'),
  COALESCE(
    (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = '4da3b401-990a-4011-9576-273986f43360'),
    (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = '4da3b401-990a-4011-9576-273986f43360'),
    (SELECT split_part(email, '@', 1) FROM auth.users WHERE id = '4da3b401-990a-4011-9576-273986f43360'),
    'Super Admin'
  ),
  'account_owner', -- Give highest role
  'active',
  NOW(),
  NOW(),
  -- Default notification settings
  '{
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
  }'::jsonb,
  -- Default appearance settings
  '{
    "theme": "system",
    "accentGradient": "from-purple-500 to-pink-500",
    "fontSize": "medium",
    "interfaceDensity": "comfortable",
    "reduceMotion": false,
    "highContrast": false,
    "autoCollapseSidebar": true
  }'::jsonb,
  -- Default language settings
  '{
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
  }'::jsonb,
  -- Default security settings
  '{
    "twoFactorEnabled": false,
    "emailNotifications": true,
    "loginAlerts": true,
    "backupCodes": [],
    "trustedDevices": []
  }'::jsonb,
  '[]'::jsonb -- Empty security events
)
ON CONFLICT (auth_user_id) 
DO UPDATE SET
  role = 'account_owner',
  status = 'active',
  updated_at = NOW();

-- Verify the user was added
SELECT 
  auth_user_id,
  email,
  name,
  role,
  status,
  created_at
FROM app_users 
WHERE auth_user_id = '4da3b401-990a-4011-9576-273986f43360';

-- Also run the general sync for any other users
INSERT INTO public.app_users (
  auth_user_id,
  email,
  name,
  created_at,
  updated_at,
  status,
  role
)
SELECT 
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    split_part(au.email, '@', 1)
  ),
  COALESCE(au.created_at, NOW()),
  COALESCE(au.updated_at, NOW()),
  'active',
  'user'
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.app_users 
  WHERE auth_user_id = au.id
)
AND au.id != '4da3b401-990a-4011-9576-273986f43360' -- Skip super user as we already added them
ON CONFLICT (auth_user_id) DO NOTHING;

-- Show all users in app_users
SELECT 
  auth_user_id,
  email,
  name,
  role,
  status,
  organization_id,
  created_at
FROM app_users
ORDER BY created_at DESC;