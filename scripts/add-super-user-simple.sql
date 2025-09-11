-- Add super user to app_users table (simplified version)
-- Run this in Supabase SQL Editor

-- First, check what columns exist in app_users
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'app_users' 
ORDER BY ordinal_position;

-- Check if the user exists in auth.users
SELECT id, email, raw_user_meta_data, created_at 
FROM auth.users 
WHERE id = '4da3b401-990a-4011-9576-273986f43360';

-- Insert the super user into app_users with only existing columns
INSERT INTO public.app_users (
  auth_user_id,
  email,
  name,
  role,
  status,
  created_at,
  updated_at
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
  NOW()
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

-- Also sync any other users from auth.users
INSERT INTO public.app_users (
  auth_user_id,
  email,
  name,
  role,
  status,
  created_at,
  updated_at
)
SELECT 
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    split_part(au.email, '@', 1)
  ),
  'user',
  'active',
  COALESCE(au.created_at, NOW()),
  COALESCE(au.updated_at, NOW())
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