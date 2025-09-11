-- Script to sync auth.users to app_users table
-- Run this in Supabase SQL Editor

-- Step 1: Check current auth users
SELECT id, email, raw_user_meta_data->>'full_name' as full_name, created_at 
FROM auth.users;

-- Step 2: Check current app_users
SELECT auth_user_id, email, name, created_at 
FROM app_users;

-- Step 3: Insert missing users into app_users
INSERT INTO public.app_users (
  auth_user_id,
  email,
  name,
  created_at,
  updated_at,
  status,
  role,
  phone,
  avatar_url,
  -- Set default values for settings columns
  notification_settings,
  appearance_settings,
  language_settings,
  security_settings
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
  'user',
  au.raw_user_meta_data->>'phone',
  au.raw_user_meta_data->>'avatar_url',
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
  }'::jsonb
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.app_users 
  WHERE auth_user_id = au.id
)
ON CONFLICT (auth_user_id) DO NOTHING;

-- Step 4: Verify the sync worked
SELECT 
  au.email as auth_email,
  ap.email as app_email,
  ap.name,
  ap.created_at,
  ap.status
FROM auth.users au
LEFT JOIN app_users ap ON au.id = ap.auth_user_id
ORDER BY au.created_at DESC;